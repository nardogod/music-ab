"use client";

/**
 * Componente de card de metadados atualizado
 * Exibe todas as informações extraídas, incluindo features Spotify-like
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Music,
  Clock,
  Gauge,
  Music2,
  Volume2,
  Zap,
  Users,
  AudioWaveform,
  FileAudio,
  Radio,
  Mic,
  Heart,
  Activity,
  Drum,
  Piano,
  Headphones,
} from "lucide-react";
import { AudioAnalysisResult } from "@/lib/audioAnalyzer";

interface MetadataCardProps {
  analysis: AudioAnalysisResult;
  compact?: boolean;
  showSpotifyFeatures?: boolean;
}

export function MetadataCard({
  analysis,
  compact = false,
  showSpotifyFeatures = true,
}: MetadataCardProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getKeyLabel = (key: string, mode: "major" | "minor"): string => {
    return `${key} ${mode === "major" ? "Maior" : "Menor"}`;
  };

  const getFeatureLabel = (value: number): { label: string; color: string } => {
    if (value >= 0.8) return { label: "Muito alto", color: "text-green-500" };
    if (value >= 0.6) return { label: "Alto", color: "text-lime-500" };
    if (value >= 0.4) return { label: "Médio", color: "text-yellow-500" };
    if (value >= 0.2) return { label: "Baixo", color: "text-orange-500" };
    return { label: "Muito baixo", color: "text-red-500" };
  };

  const getValenceEmoji = (value: number): string => {
    if (value >= 0.7) return "😊";
    if (value >= 0.5) return "🙂";
    if (value >= 0.3) return "😐";
    return "😔";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Music className="w-4 h-4" />
            Análise Musical
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {analysis.metadata.format}
            </Badge>
            {analysis.bpmConfidence > 0.7 && (
              <Badge variant="secondary" className="text-xs">
                Alta confiança
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Métricas Principais */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricDisplay
            icon={<Gauge className="w-4 h-4 text-purple-400" />}
            label="BPM"
            value={`${analysis.bpm}`}
            subLabel={`Confiança: ${Math.round(analysis.bpmConfidence * 100)}%`}
            tooltip="Batidas por minuto - velocidade da música"
          />

          <MetricDisplay
            icon={<Music2 className="w-4 h-4 text-blue-400" />}
            label="Tonalidade"
            value={getKeyLabel(analysis.key, analysis.mode)}
            subLabel={`Confiança: ${Math.round(analysis.keyConfidence * 100)}%`}
            tooltip="Escala musical dominante"
          />

          <MetricDisplay
            icon={<Clock className="w-4 h-4 text-green-400" />}
            label="Duração"
            value={formatDuration(analysis.duration)}
            tooltip="Tempo total da música"
          />

          <MetricDisplay
            icon={<Volume2 className="w-4 h-4 text-orange-400" />}
            label="Volume"
            value={`${analysis.loudness.toFixed(1)} dB`}
            tooltip="Nível de volume médio em dB"
          />

          <MetricDisplay
            icon={<Drum className="w-4 h-4 text-cyan-400" />}
            label="Compasso"
            value={`${analysis.timeSignature}/4`}
            subLabel={`Confiança: ${Math.round(analysis.timeSignatureConfidence * 100)}%`}
            tooltip="Fórmula de compasso (batidas por compasso)"
          />
        </div>

        {/* Features Spotify-like */}
        {showSpotifyFeatures && (
          <>
            <div className="border-t border-border pt-3 mt-3">
              <p className="text-xs text-muted-foreground mb-3">
                Características Musicais
              </p>

              <div className="space-y-3">
                {/* Energy */}
                <FeatureBar
                  icon={<Zap className="w-3 h-3" />}
                  label="Energia"
                  value={analysis.energy}
                  description="Intensidade e atividade da música"
                />

                {/* Danceability */}
                <FeatureBar
                  icon={<Users className="w-3 h-3" />}
                  label="Dançabilidade"
                  value={analysis.danceability}
                  description="O quão adequada é para dançar"
                />

                {/* Acousticness */}
                <FeatureBar
                  icon={<Piano className="w-3 h-3" />}
                  label="Acústica"
                  value={analysis.acousticness}
                  description="Probabilidade de ser acústica"
                />

                {/* Instrumentalness */}
                <FeatureBar
                  icon={<Headphones className="w-3 h-3" />}
                  label="Instrumental"
                  value={analysis.instrumentalness}
                  description="Probabilidade de ser instrumental (sem vocais)"
                />

                {/* Valence */}
                <FeatureBar
                  icon={<Heart className="w-3 h-3" />}
                  label="Positividade"
                  value={analysis.valence}
                  description="Clima emocional da música"
                  emoji={getValenceEmoji(analysis.valence)}
                />

                {/* Speechiness */}
                <FeatureBar
                  icon={<Mic className="w-3 h-3" />}
                  label="Fala"
                  value={analysis.speechiness}
                  description="Presença de palavra falada"
                />

                {/* Liveness */}
                <FeatureBar
                  icon={<Activity className="w-3 h-3" />}
                  label="Ao Vivo"
                  value={analysis.liveness}
                  description="Probabilidade de ser gravação ao vivo"
                />
              </div>
            </div>
          </>
        )}

        {/* Notas detectadas */}
        {analysis.detectedNotes && analysis.detectedNotes.length > 0 && (
          <div className="border-t border-border pt-3 mt-3">
            <p className="text-xs text-muted-foreground mb-2">
              Notas Detectadas
            </p>
            <div className="flex flex-wrap gap-1">
              {getUniqueNotes(analysis.detectedNotes).map((note) => (
                <Badge key={note} variant="outline" className="text-xs">
                  {note}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Informações técnicas */}
        <div className="border-t border-border pt-3 mt-3">
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Radio className="w-3 h-3" />
              <span>{analysis.metadata.sampleRate.toLocaleString()} Hz</span>
            </div>
            <div className="flex items-center gap-1">
              <AudioWaveform className="w-3 h-3" />
              <span>
                {analysis.metadata.numberOfChannels === 2 ? "Estéreo" : "Mono"}
              </span>
            </div>
          </div>
        </div>

        {/* Nome do arquivo */}
        <div className="border-t border-border pt-2 mt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileAudio className="w-3 h-3" />
            <span className="truncate">{analysis.fileName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de métrica individual
function MetricDisplay({
  icon,
  label,
  value,
  subLabel,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subLabel?: string;
  tooltip?: string;
}) {
  const content = (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="p-1.5 rounded-md bg-muted shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
        {subLabel && (
          <p className="text-xs text-muted-foreground">{subLabel}</p>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

// Componente de barra de feature
function FeatureBar({
  icon,
  label,
  value,
  description,
  emoji,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  emoji?: string;
}) {
  const percentage = Math.round(value * 100);

  const getColor = (val: number): string => {
    if (val >= 0.7) return "bg-green-500";
    if (val >= 0.5) return "bg-lime-500";
    if (val >= 0.3) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">{icon}</div>
            <span className="text-xs w-20">{label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getColor(value)}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs w-10 text-right font-mono">
              {percentage}%
            </span>
            {emoji && <span className="text-sm">{emoji}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Extrai notas únicas das detectadas
function getUniqueNotes(
  notes: { noteName: string; octave: number }[],
): string[] {
  const unique = new Set(notes.map((n) => `${n.noteName}${n.octave}`));
  return Array.from(unique).sort();
}
