"use client";

/**
 * Componente de comparação A/B
 * Permite comparar duas músicas lado a lado
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { AudioAnalysisResult, FrequencyBands } from "@/lib/audioAnalyzer";
import { MetadataCard } from "./MetadataCard";
import { FrequencyChart } from "./FrequencyChart";

interface ComparisonViewProps {
  analysisA: AudioAnalysisResult;
  analysisB: AudioAnalysisResult;
}

export function ComparisonView({ analysisA, analysisB }: ComparisonViewProps) {
  // Calcular similaridades
  const bpmDiff = Math.abs(analysisA.bpm - analysisB.bpm);
  const bpmSimilarity = Math.max(0, 100 - bpmDiff);

  const keyMatch =
    analysisA.key === analysisB.key && analysisA.mode === analysisB.mode;

  const energyDiff = Math.abs(analysisA.energy - analysisB.energy);
  const energySimilarity = Math.max(0, 100 - energyDiff * 100);

  const danceDiff = Math.abs(analysisA.danceability - analysisB.danceability);
  const danceSimilarity = Math.max(0, 100 - danceDiff * 100);

  // Similaridade geral
  const overallSimilarity = Math.round(
    bpmSimilarity * 0.3 +
      (keyMatch ? 100 : 0) * 0.2 +
      energySimilarity * 0.25 +
      danceSimilarity * 0.25,
  );

  // Comparação de bandas de frequência
  const bandComparison = compareFrequencyBands(
    analysisA.frequencyBands,
    analysisB.frequencyBands,
  );

  return (
    <div className="space-y-6">
      {/* Score de similaridade */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-purple-400" />
            Comparação A/B
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8">
            {/* Track A */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Track A</p>
              <p className="font-medium truncate max-w-[150px]">
                {analysisA.fileName}
              </p>
            </div>

            {/* Similarity Score */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${overallSimilarity * 2.51} 251`}
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {overallSimilarity}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Similaridade</p>
            </div>

            {/* Track B */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Track B</p>
              <p className="font-medium truncate max-w-[150px]">
                {analysisB.fileName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparação detalhada */}
      <Tabs defaultValue="metrics">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="frequency">Frequência</TabsTrigger>
          <TabsTrigger value="metadata">Metadados</TabsTrigger>
        </TabsList>

        {/* Comparação de Métricas */}
        <TabsContent value="metrics" className="mt-4">
          <div className="grid gap-4">
            {/* BPM */}
            <ComparisonRow
              label="BPM"
              valueA={analysisA.bpm}
              valueB={analysisB.bpm}
              unit=""
              showDiff
            />

            {/* Tonalidade */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tonalidade</span>
                  <div className="flex items-center gap-4">
                    <Badge variant={keyMatch ? "default" : "outline"}>
                      {analysisA.key}{" "}
                      {analysisA.mode === "major" ? "Maior" : "Menor"}
                    </Badge>
                    {keyMatch ? (
                      <span className="text-green-500 text-sm">✓ Igual</span>
                    ) : (
                      <span className="text-yellow-500 text-sm">
                        ✗ Diferente
                      </span>
                    )}
                    <Badge variant={keyMatch ? "default" : "outline"}>
                      {analysisB.key}{" "}
                      {analysisB.mode === "major" ? "Maior" : "Menor"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Energia */}
            <ComparisonRow
              label="Energia"
              valueA={Math.round(analysisA.energy * 100)}
              valueB={Math.round(analysisB.energy * 100)}
              unit="%"
              showDiff
              isPercentage
            />

            {/* Dançabilidade */}
            <ComparisonRow
              label="Dançabilidade"
              valueA={Math.round(analysisA.danceability * 100)}
              valueB={Math.round(analysisB.danceability * 100)}
              unit="%"
              showDiff
              isPercentage
            />

            {/* Loudness */}
            <ComparisonRow
              label="Volume"
              valueA={Math.round(analysisA.loudness * 100)}
              valueB={Math.round(analysisB.loudness * 100)}
              unit="%"
              showDiff
              isPercentage
            />
          </div>
        </TabsContent>

        {/* Comparação de Frequências */}
        <TabsContent value="frequency" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FrequencyChart
              bands={analysisA.frequencyBands}
              title={`${analysisA.fileName} - Frequências`}
              color="#8b5cf6"
            />
            <FrequencyChart
              bands={analysisB.frequencyBands}
              title={`${analysisB.fileName} - Frequências`}
              color="#3b82f6"
            />
          </div>

          {/* Diff de frequências */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Diferença de Frequências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bandComparison.map(({ band, diff, label }) => (
                  <div key={band} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20">
                      {label}
                    </span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden relative">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                      <div
                        className={`h-full rounded-full transition-all ${
                          diff > 0
                            ? "bg-purple-500 ml-1/2"
                            : "bg-blue-500 mr-1/2"
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(diff) * 50, 50)}%`,
                          marginLeft: diff > 0 ? "50%" : "auto",
                          marginRight: diff < 0 ? "50%" : "auto",
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs w-12 text-right ${
                        diff > 0
                          ? "text-purple-400"
                          : diff < 0
                            ? "text-blue-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {(diff * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  {analysisA.fileName.slice(0, 15)}...
                </span>
                <span className="flex items-center gap-1">
                  {analysisB.fileName.slice(0, 15)}...
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadados */}
        <TabsContent value="metadata" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MetadataCard analysis={analysisA} compact />
            <MetadataCard analysis={analysisB} compact />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de linha de comparação
function ComparisonRow({
  label,
  valueA,
  valueB,
  unit,
  showDiff,
  isPercentage = false,
}: {
  label: string;
  valueA: number;
  valueB: number;
  unit: string;
  showDiff?: boolean;
  isPercentage?: boolean;
}) {
  const diff = valueB - valueA;
  const DiffIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const diffColor =
    diff > 0
      ? "text-green-500"
      : diff < 0
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <div className="flex items-center gap-6">
            <div className="text-center w-16">
              <p className="text-lg font-semibold">
                {valueA}
                {unit}
              </p>
              <p className="text-xs text-muted-foreground">Track A</p>
            </div>

            {showDiff && (
              <div className={`flex items-center gap-1 ${diffColor}`}>
                <DiffIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {diff > 0 ? "+" : ""}
                  {isPercentage ? diff : diff}
                  {unit}
                </span>
              </div>
            )}

            <ArrowRight className="w-4 h-4 text-muted-foreground" />

            <div className="text-center w-16">
              <p className="text-lg font-semibold">
                {valueB}
                {unit}
              </p>
              <p className="text-xs text-muted-foreground">Track B</p>
            </div>
          </div>
        </div>

        {isPercentage && (
          <div className="mt-3 flex gap-1">
            <div className="flex-1">
              <Progress value={valueA} className="h-2 [&>div]:bg-purple-500" />
            </div>
            <div className="flex-1">
              <Progress value={valueB} className="h-2 [&>div]:bg-blue-500" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Comparar bandas de frequência
function compareFrequencyBands(
  bandsA: FrequencyBands,
  bandsB: FrequencyBands,
): { band: string; label: string; diff: number }[] {
  const bandLabels: Record<keyof FrequencyBands, string> = {
    subBass: "Sub Bass",
    bass: "Bass",
    lowMid: "Low Mid",
    mid: "Mid",
    highMid: "High Mid",
    presence: "Presence",
    brilliance: "Brilliance",
  };

  return Object.keys(bandLabels).map((band) => ({
    band,
    label: bandLabels[band as keyof FrequencyBands],
    diff:
      bandsB[band as keyof FrequencyBands] -
      bandsA[band as keyof FrequencyBands],
  }));
}
