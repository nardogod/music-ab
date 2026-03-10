"use client";

/**
 * Painel de análise completa
 * Exibe todos os resultados da análise de um arquivo de áudio
 */

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Music,
  BarChart3,
  Waves,
  TrendingUp,
} from "lucide-react";
import { AudioAnalysisResult } from "@/lib/audioAnalyzer";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { Spectrogram } from "./Spectrogram";
import { FrequencyChart } from "./FrequencyChart";
import { MetadataCard } from "./MetadataCard";
import { ExportButtons } from "./ExportButtons";

interface AnalysisPanelProps {
  analysis: AudioAnalysisResult;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  showExport?: boolean;
}

export function AnalysisPanel({
  analysis,
  isPlaying,
  currentTime,
  duration,
  volume,
  isLoading,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
  showExport = true,
}: AnalysisPanelProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const chromaLabels = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  return (
    <div className="space-y-4">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold truncate max-w-[200px]">
            {analysis.fileName}
          </h2>
          <Badge variant="outline" className="ml-2">
            {analysis.metadata.format}
          </Badge>
        </div>
        {showExport && <ExportButtons analysis={analysis} />}
      </div>

      {/* Waveform com controles */}
      <WaveformVisualizer
        waveform={analysis.waveform}
        peaks={analysis.peaks}
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
        height={100}
      />

      {/* Controles de reprodução */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onStop}
          disabled={isLoading}
        >
          <Square className="w-4 h-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={isPlaying ? onPause : onPlay}
          disabled={isLoading}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[volume]}
            onValueChange={([v]) => onVolumeChange(v)}
            max={1}
            step={0.01}
            className="w-24"
          />
        </div>
      </div>

      {/* Tabs com diferentes visualizações */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="w-4 h-4 mr-1" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="spectrum" className="text-xs">
            <Waves className="w-4 h-4 mr-1" />
            Espectro
          </TabsTrigger>
          <TabsTrigger value="chroma" className="text-xs">
            <Music className="w-4 h-4 mr-1" />
            Chroma
          </TabsTrigger>
          <TabsTrigger value="pitch" className="text-xs">
            <TrendingUp className="w-4 h-4 mr-1" />
            Melodia
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MetadataCard analysis={analysis} />
            <FrequencyChart bands={analysis.frequencyBands} />
          </div>
        </TabsContent>

        {/* Espectrograma */}
        <TabsContent value="spectrum" className="mt-4">
          <Spectrogram
            spectrogram={analysis.spectrogram}
            currentTime={currentTime}
            duration={duration}
            height={250}
          />
        </TabsContent>

        {/* Chromagram */}
        <TabsContent value="chroma" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Chromagram - Distribuição de Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-40 gap-2 px-4">
                {analysis.chroma.map((value, index) => {
                  const pct = Math.min(100, Math.max(0, Math.round(value * 100)));
                  const height = Math.max(pct, 5);
                  const isKeyNote =
                    NOTE_NAMES[analysis.key as keyof typeof NOTE_NAMES] ===
                      chromaLabels[index] ||
                    (analysis.mode === "major"
                      ? chromaLabels[index] === analysis.key
                      : chromaLabels[index] === analysis.key);

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-1 flex-1"
                    >
                      <span className="text-xs text-muted-foreground">
                        {pct}%
                      </span>
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          analysis.key === chromaLabels[index]
                            ? "bg-purple-500 ring-2 ring-purple-300"
                            : "bg-blue-500/70"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <span
                        className={`text-xs font-medium ${
                          analysis.key === chromaLabels[index]
                            ? "text-purple-400"
                            : ""
                        }`}
                      >
                        {chromaLabels[index]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Tonalidade detectada:{" "}
                <strong>
                  {analysis.key} {analysis.mode === "major" ? "Maior" : "Menor"}
                </strong>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pitch Contour (Melodia) */}
        <TabsContent value="pitch" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Contorno Melódico (Pitch Contour)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.pitchContour.length > 0 ? (
                <PitchContourChart
                  pitchContour={analysis.pitchContour}
                  duration={analysis.duration}
                  currentTime={currentTime}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Não foi possível detectar uma melodia clara neste áudio.
                  <br />
                  <span className="text-xs">
                    Tente com uma música que tenha vocais ou instrumentos
                    melódicos.
                  </span>
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para o gráfico de pitch contour
function PitchContourChart({
  pitchContour,
  duration,
  currentTime,
}: {
  pitchContour: {
    time: number;
    frequency: number;
    note: string;
    confidence: number;
  }[];
  duration: number;
  currentTime: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || pitchContour.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Limpar
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // Encontrar range de frequências
    const frequencies = pitchContour.map((p) => p.frequency);
    const minFreq = Math.min(...frequencies) * 0.9;
    const maxFreq = Math.max(...frequencies) * 1.1;

    // Desenhar linhas de referência (notas)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    const noteFrequencies = [
      130.81, 146.83, 164.81, 174.61, 196, 220, 246.94, 261.63, 293.66, 329.63,
      349.23, 392, 440, 493.88, 523.25,
    ];

    for (const freq of noteFrequencies) {
      if (freq >= minFreq && freq <= maxFreq) {
        const y = height - ((freq - minFreq) / (maxFreq - minFreq)) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Desenhar pitch contour
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < pitchContour.length; i++) {
      const point = pitchContour[i];
      const x = (point.time / duration) * width;
      const y =
        height - ((point.frequency - minFreq) / (maxFreq - minFreq)) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Linha de posição atual
    if (currentTime > 0) {
      const position = (currentTime / duration) * width;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(position, 0);
      ctx.lineTo(position, height);
      ctx.stroke();
    }
  }, [pitchContour, duration, currentTime]);

  return <canvas ref={canvasRef} className="w-full h-40 rounded-lg" />;
}

const NOTE_NAMES: Record<string, string> = {
  C: "C",
  "C#": "C#",
  D: "D",
  "D#": "D#",
  E: "E",
  F: "F",
  "F#": "F#",
  G: "G",
  "G#": "G#",
  A: "A",
  "A#": "A#",
  B: "B",
};
