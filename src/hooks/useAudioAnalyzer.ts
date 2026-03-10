/**
 * Hook para análise de áudio
 * Gerencia o estado da análise e fornece funções para analisar arquivos
 */

import { useState, useCallback } from "react";
import { audioAnalyzer, AudioAnalysisResult } from "@/lib/audioAnalyzer";

interface UseAudioAnalyzerReturn {
  analyzeFile: (file: File) => Promise<AudioAnalysisResult | null>;
  analyzeStems: (
    vocalFile: File,
    instrumentalFile: File,
  ) => Promise<AudioAnalysisResult | null>;
  isAnalyzing: boolean;
  progress: number;
  status: string | null;
  logs: string[];
  error: string | null;
  analysisResult: AudioAnalysisResult | null;
  reset: () => void;
}

export function useAudioAnalyzer(): UseAudioAnalyzerReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<AudioAnalysisResult | null>(null);

  const analyzeFile = useCallback(
    async (file: File): Promise<AudioAnalysisResult | null> => {
      // Validar tipo de arquivo
      const validTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/wave",
        "audio/flac",
        "audio/ogg",
        "audio/x-flac",
        "audio/m4a",
        "audio/x-m4a",
        "audio/aac",
        "audio/mp4",
      ];

      const extension = file.name.split(".").pop()?.toLowerCase();
      const validExtensions = ["mp3", "wav", "flac", "ogg", "m4a", "aac"];

      if (
        !validTypes.includes(file.type) &&
        !validExtensions.includes(extension || "")
      ) {
        setError(
          "Formato de arquivo não suportado. Use MP3, WAV, FLAC, OGG ou M4A.",
        );
        return null;
      }

      // Validar tamanho (máximo 100MB)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Arquivo muito grande. O limite é 100MB.");
        return null;
      }

      setIsAnalyzing(true);
      setProgress(0);
      setStatus("Iniciando...");
      setError(null);
      const initialLog = `${new Date().toLocaleTimeString()} - Iniciando: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      setLogs([initialLog]);

      const appendLog = (line: string) => {
        setLogs((prev) => [...prev.slice(-19), line]);
      };

      try {
        const result = await audioAnalyzer.analyze(
          file,
          (p, s) => {
            setProgress(p);
            if (s) setStatus(s);
          },
          appendLog,
        );
        appendLog(`${new Date().toLocaleTimeString()} - Análise concluída com sucesso!`);
        setAnalysisResult(result);
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao analisar áudio";
        appendLog(`${new Date().toLocaleTimeString()} - ERRO: ${message}`);
        console.error("[Music Analyzer] ERRO:", message, err);
        setError(message);
        return null;
      } finally {
        setIsAnalyzing(false);
        setStatus(null);
      }
    },
    [],
  );

  const analyzeStems = useCallback(
    async (
      vocalFile: File,
      instrumentalFile: File,
    ): Promise<AudioAnalysisResult | null> => {
      setIsAnalyzing(true);
      setProgress(0);
      setStatus("Combinando stems...");
      setError(null);
      const initialLog = `${new Date().toLocaleTimeString()} - Voz + Instrumental: ${vocalFile.name} + ${instrumentalFile.name}`;
      setLogs([initialLog]);

      const appendLog = (line: string) => {
        setLogs((prev) => [...prev.slice(-19), line]);
      };

      try {
        const result = await audioAnalyzer.analyzeStems(
          vocalFile,
          instrumentalFile,
          (p, s) => {
            setProgress(p);
            if (s) setStatus(s);
          },
          appendLog,
        );
        appendLog(`${new Date().toLocaleTimeString()} - Análise concluída!`);
        setAnalysisResult(result);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao analisar stems";
        appendLog(`${new Date().toLocaleTimeString()} - ERRO: ${message}`);
        setError(message);
        return null;
      } finally {
        setIsAnalyzing(false);
        setStatus(null);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setProgress(0);
    setStatus(null);
    setLogs([]);
    setError(null);
    setAnalysisResult(null);
  }, []);

  return {
    analyzeFile,
    analyzeStems,
    isAnalyzing,
    progress,
    status,
    logs,
    error,
    analysisResult,
    reset,
  };
}
