"use client";

/**
 * Painel de análise completo atualizado
 * Inclui visualização Melodyne-style e features Spotify
 */

import { useRef, useEffect, useState } from "react";
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
  Piano,
  ListMusic,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { AudioAnalysisResult } from "@/lib/audioAnalyzer";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { Spectrogram } from "./Spectrogram";
import { FrequencyChart } from "./FrequencyChart";
import { MetadataCard } from "./MetadataCard";
import { ExportButtons } from "./ExportButtons";
import { MelodyneVisualization } from "./MelodyneVisualization";
import { MixProfileCard } from "./MixProfileCard";

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
          <Badge variant="secondary" className="ml-1">
            {analysis.bpm} BPM
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
      <Tabs defaultValue="melodyne" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="melodyne" className="text-xs">
            <Piano className="w-4 h-4 mr-1" />
            Melodia
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="w-4 h-4 mr-1" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="spectrum" className="text-xs">
            <Waves className="w-4 h-4 mr-1" />
            Espectro
          </TabsTrigger>
          <TabsTrigger value="chroma" className="text-xs">
            <ListMusic className="w-4 h-4 mr-1" />
            Chroma
          </TabsTrigger>
          <TabsTrigger value="structure" className="text-xs">
            <Layers className="w-4 h-4 mr-1" />
            Estrutura
          </TabsTrigger>
          <TabsTrigger value="mix" className="text-xs">
            <SlidersHorizontal className="w-4 h-4 mr-1" />
            Mix
          </TabsTrigger>
        </TabsList>

        {/* Visualização Melodyne */}
        <TabsContent value="melodyne" className="mt-4">
          {analysis.detectedNotes && analysis.detectedNotes.length > 0 ? (
            <MelodyneVisualization
              notes={analysis.detectedNotes}
              duration={analysis.duration}
              currentTime={currentTime}
              keySignature={analysis.key}
              mode={analysis.mode}
              height={350}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Piano className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Não foi possível detectar notas melódicas nesta faixa.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tente com uma música que tenha vocais ou instrumentos
                  melódicos proeminentes.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Visão Geral */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MetadataCard analysis={analysis} showSpotifyFeatures />
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
                  // Clamp 0-100% (evita valores > 100%)
                  const pct = Math.min(100, Math.max(0, Math.round(value * 100)));
                  const height = Math.max(pct, 5);
                  const isKeyNote = analysis.key === chromaLabels[index];

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
                          isKeyNote
                            ? "bg-purple-500 ring-2 ring-purple-300"
                            : "bg-blue-500/70"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <span
                        className={`text-xs font-medium ${
                          isKeyNote ? "text-purple-400" : ""
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
                <span className="ml-2 text-purple-400">
                  (Confiança: {Math.round(analysis.keyConfidence * 100)}%)
                </span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estrutura */}
        <TabsContent value="structure" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Estrutura da Música
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.sections && analysis.sections.length > 0 ? (
                <div className="space-y-2">
                  {analysis.sections.map((section, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          section.type === "chorus"
                            ? "bg-purple-500"
                            : section.type === "verse"
                              ? "bg-blue-500"
                              : section.type === "bridge"
                                ? "bg-green-500"
                                : section.type === "intro"
                                  ? "bg-yellow-500"
                                  : section.type === "outro"
                                    ? "bg-red-500"
                                    : "bg-gray-500"
                        }`}
                      />
                      <span className="font-medium capitalize w-24">
                        {section.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(section.startTime)} -{" "}
                        {formatTime(section.endTime)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({section.duration.toFixed(1)}s)
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, section.loudness * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Análise de estrutura não disponível.
                </p>
              )}

              {/* Timeline visual */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Timeline</p>
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {analysis.sections &&
                    analysis.sections.map((section, index) => (
                      <div
                        key={index}
                        className={`h-full ${
                          section.type === "chorus"
                            ? "bg-purple-500/50"
                            : section.type === "verse"
                              ? "bg-blue-500/50"
                              : section.type === "bridge"
                                ? "bg-green-500/50"
                                : section.type === "intro"
                                  ? "bg-yellow-500/50"
                                  : section.type === "outro"
                                    ? "bg-red-500/50"
                                    : "bg-gray-500/50"
                        }`}
                        style={{
                          width: `${(section.duration / analysis.duration) * 100}%`,
                        }}
                        title={`${section.type}: ${formatTime(section.startTime)} - ${formatTime(section.endTime)}`}
                      />
                    ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0:00</span>
                  <span>{formatTime(analysis.duration)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perfil de Mix */}
        <TabsContent value="mix" className="mt-4">
          {analysis.mixProfile ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MixProfileCard mixProfile={analysis.mixProfile} />
              <FrequencyChart bands={analysis.frequencyBands} />
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <SlidersHorizontal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Perfil de mix não disponível para esta faixa.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
