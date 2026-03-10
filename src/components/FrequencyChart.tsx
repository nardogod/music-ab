"use client";

/**
 * Componente de gráfico de bandas de frequência
 * Visualiza a distribuição de energia por banda (Sub-bass, Bass, Mid, etc.)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FrequencyBands } from "@/lib/audioAnalyzer";

interface FrequencyChartProps {
  bands: FrequencyBands;
  title?: string;
  color?: string;
}

const BAND_CONFIG = [
  {
    key: "subBass" as const,
    label: "Sub Bass",
    range: "20-60 Hz",
    color: "#ef4444",
  },
  { key: "bass" as const, label: "Bass", range: "60-250 Hz", color: "#f97316" },
  {
    key: "lowMid" as const,
    label: "Low Mid",
    range: "250-500 Hz",
    color: "#eab308",
  },
  { key: "mid" as const, label: "Mid", range: "500-2k Hz", color: "#22c55e" },
  {
    key: "highMid" as const,
    label: "High Mid",
    range: "2-4k Hz",
    color: "#06b6d4",
  },
  {
    key: "presence" as const,
    label: "Presence",
    range: "4-6k Hz",
    color: "#3b82f6",
  },
  {
    key: "brilliance" as const,
    label: "Brilliance",
    range: "6-20k Hz",
    color: "#8b5cf6",
  },
];

export function FrequencyChart({
  bands,
  title = "Distribuição de Frequências",
  color,
}: FrequencyChartProps) {
  // Encontrar o valor máximo para normalizar
  const maxBand = Math.max(...Object.values(bands), 0.001);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {BAND_CONFIG.map(({ key, label, range, color: bandColor }) => {
            const value = bands[key];
            // Normalizado 0-100% relativo ao máximo (evita valores absurdos)
            const displayPct = Math.min(
              100,
              Math.round((value / maxBand) * 100),
            );

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: bandColor }}
                    />
                    <span className="font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{range}</span>
                    <span className="w-12 text-right font-mono">
                      {displayPct}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${displayPct}%`,
                      backgroundColor: color || bandColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo visual */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Caráter Sonoro:</span>
            <span className="font-medium">{getCharacterLabel(bands)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Determina o caráter sonoro baseado nas bandas
 */
function getCharacterLabel(bands: FrequencyBands): string {
  const total = Object.values(bands).reduce((a, b) => a + b, 0);

  const lowEnergy = (bands.subBass + bands.bass) / total;
  const midEnergy = (bands.lowMid + bands.mid + bands.highMid) / total;
  const highEnergy = (bands.presence + bands.brilliance) / total;

  if (lowEnergy > 0.4) return "🔊 Graves intensos";
  if (highEnergy > 0.3) return "✨ Brilhante/Aéreo";
  if (midEnergy > 0.5) return "🎵 Equilibrado/Melódico";
  if (lowEnergy > 0.25 && highEnergy > 0.25) return "🎸 Completo/Full-range";
  return "📊 Balanceado";
}
