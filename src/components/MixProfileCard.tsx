"use client";

/**
 * Card de perfil de mix - engenharia reversa
 * Mostra estéreo, transientes, reverb e curva EQ
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Radio,
  Zap,
  Waves,
  SlidersHorizontal,
  HelpCircle,
} from "lucide-react";
import { MixProfile } from "@/lib/audioAnalyzer";

interface MixProfileCardProps {
  mixProfile: MixProfile;
  title?: string;
}

export function MixProfileCard({ mixProfile, title = "Perfil de Mix" }: MixProfileCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          {title}
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Aproximação do perfil de mix baseada em análise espectral e
                dinâmica. Útil para referência de engenharia reversa.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estéreo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Estéreo
            </span>
            <span className="text-muted-foreground">
              Largura: {Math.round(mixProfile.stereoWidth * 100)}% • Corr:{" "}
              {mixProfile.stereoCorrelation.toFixed(2)}
            </span>
          </div>
          <Progress value={mixProfile.stereoWidth * 100} className="h-2" />
        </div>

        {/* Transientes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Transientes
            </span>
            <span className="text-muted-foreground">
              Attack: {mixProfile.transientAttack}ms • Release:{" "}
              {mixProfile.transientRelease}ms
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Densidade</p>
              <Progress
                value={mixProfile.transientDensity * 100}
                className="h-1.5"
              />
            </div>
          </div>
        </div>

        {/* Reverb */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5" />
              Reverb
            </span>
            <span className="text-muted-foreground">
              Cauda: {mixProfile.reverbTail}s • Densidade:{" "}
              {Math.round(mixProfile.reverbDensity * 100)}%
            </span>
          </div>
          <Progress value={mixProfile.reverbDensity * 100} className="h-2" />
        </div>

        {/* Curva EQ */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Curva EQ (24 bandas)</p>
          <div className="h-16 flex items-end gap-0.5">
            {mixProfile.eqCurve.map((value, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/60 rounded-t min-w-[2px] transition-all"
                style={{
                  height: `${Math.max(5, value * 100)}%`,
                }}
                title={`Banda ${i + 1}: ${(value * 100).toFixed(0)}%`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>20Hz</span>
            <span>20kHz</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
