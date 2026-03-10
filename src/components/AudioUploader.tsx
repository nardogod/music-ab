"use client";

/**
 * Componente de upload de áudio
 * Suporta drag & drop e seleção de arquivos
 */

import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Music, FileAudio, X, AlertCircle } from "lucide-react";

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
  progress: number;
  status?: string | null;
  logs?: string[];
  error: string | null;
  fileName?: string;
  onClear?: () => void;
}

const ACCEPTED_FORMATS = ".mp3,.wav,.flac,.ogg,.m4a,.aac";
const MAX_SIZE_MB = 100;

export function AudioUploader({
  onFileSelect,
  isAnalyzing,
  progress,
  status,
  logs = [],
  error,
  fileName,
  onClear,
}: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const validExtensions = ["mp3", "wav", "flac", "ogg", "m4a", "aac"];
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      return `Formato inválido. Use: ${validExtensions.join(", ").toUpperCase()}`;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Arquivo muito grande. Limite: ${MAX_SIZE_MB}MB`;
    }

    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
      setLocalError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const displayError = error || localError;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${
        isDragging
          ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-background"
          : ""
      }`}
    >
      <CardContent className="p-0">
        {/* Área de Drop */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative flex flex-col items-center justify-center p-8 min-h-[200px]
            transition-all duration-300 cursor-pointer
            ${
              isDragging ? "bg-purple-500/10 scale-[1.02]" : "hover:bg-muted/50"
            }
            ${displayError ? "border-red-500/50" : ""}
          `}
        >
          {/* Input oculto */}
          <input
            type="file"
            accept={ACCEPTED_FORMATS}
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isAnalyzing}
          />

          {/* Conteúdo baseado no estado */}
          {!fileName && !isAnalyzing && (
            <>
              <div
                className={`
                p-4 rounded-full mb-4 transition-all duration-300
                ${isDragging ? "bg-purple-500/20 scale-110" : "bg-muted"}
              `}
              >
                <Upload
                  className={`w-8 h-8 transition-colors ${
                    isDragging ? "text-purple-400" : "text-muted-foreground"
                  }`}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Arraste seu arquivo de áudio
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique para selecionar
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileAudio className="w-4 h-4" />
                <span>MP3, WAV, FLAC, OGG, M4A • Máx. {MAX_SIZE_MB}MB</span>
              </div>
            </>
          )}

          {/* Estado de análise */}
          {isAnalyzing && (
            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
              <div className="p-4 rounded-full bg-purple-500/20 animate-pulse">
                <Music className="w-8 h-8 text-purple-400" />
              </div>
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {status || "Analisando..."}
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress
                  value={progress}
                  className={`h-2 transition-all duration-500 ${
                    progress <= 10 ? "animate-pulse" : ""
                  }`}
                />
                {progress <= 15 && (
                  <p className="text-xs text-muted-foreground/80 text-center">
                    MP3/FLAC podem demorar. Para teste rápido, use WAV ou arquivos
                    &lt; 2 MB.
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center truncate max-w-full">
                {fileName}
              </p>
              {logs.length > 0 && (
                <div className="w-full mt-2 p-2 rounded-lg bg-muted/50 border border-border/50 max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Log do processo:
                  </p>
                  <div className="font-mono text-xs space-y-0.5 break-words">
                    {logs.map((line, i) => (
                      <div key={i} className="text-muted-foreground">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Arquivo carregado (aguardando análise) */}
          {fileName && !isAnalyzing && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-green-500/20">
                <Music className="w-8 h-8 text-green-400" />
              </div>
              <p className="font-medium text-center">{fileName}</p>
              {onClear && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          )}

          {/* Erro */}
          {displayError && !isAnalyzing && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-400">{displayError}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
