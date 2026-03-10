"use client";

/**
 * Componente de Espectrograma
 * Visualiza a distribuição de frequências ao longo do tempo
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface SpectrogramProps {
  spectrogram: number[][];
  currentTime?: number;
  duration?: number;
  height?: number;
  title?: string;
  showFrequencyScale?: boolean;
}

// Cores para o espectrograma (inferno-like)
const getColor = (value: number): string => {
  // value de 0 a 1
  const colors = [
    { pos: 0.0, r: 0, g: 0, b: 0 }, // Preto
    { pos: 0.2, r: 48, g: 12, b: 70 }, // Roxo escuro
    { pos: 0.4, r: 122, g: 30, b: 90 }, // Magenta
    { pos: 0.6, r: 200, g: 55, b: 50 }, // Laranja/vermelho
    { pos: 0.8, r: 252, g: 140, b: 40 }, // Laranja
    { pos: 1.0, r: 255, g: 255, b: 200 }, // Amarelo claro
  ];

  // Encontrar as duas cores para interpolar
  let lower = colors[0];
  let upper = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (value >= colors[i].pos && value <= colors[i + 1].pos) {
      lower = colors[i];
      upper = colors[i + 1];
      break;
    }
  }

  const range = upper.pos - lower.pos;
  const t = range === 0 ? 0 : (value - lower.pos) / range;

  const r = Math.round(lower.r + (upper.r - lower.r) * t);
  const g = Math.round(lower.g + (upper.g - lower.g) * t);
  const b = Math.round(lower.b + (upper.b - lower.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
};

export function Spectrogram({
  spectrogram,
  currentTime = 0,
  duration = 0,
  height = 200,
  title,
  showFrequencyScale = true,
}: SpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scroll, setScroll] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || spectrogram.length === 0) return;

    // Configurar dimensões
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const h = rect.height;

    // Limpar canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, h);

    // Calcular área visível com zoom
    const visibleFrames = spectrogram.length / zoom;
    const startFrame = Math.floor(
      scroll * (spectrogram.length - visibleFrames),
    );
    const endFrame = Math.min(startFrame + visibleFrames, spectrogram.length);

    const frameWidth = width / (endFrame - startFrame);
    const numBins = spectrogram[0]?.length || 0;
    const binHeight = h / numBins;

    // Desenhar espectrograma
    for (let frameIndex = startFrame; frameIndex < endFrame; frameIndex++) {
      const frame = spectrogram[frameIndex];
      if (!frame) continue;

      const x = (frameIndex - startFrame) * frameWidth;

      for (let binIndex = 0; binIndex < frame.length; binIndex++) {
        // Inverter para mostrar frequências graves embaixo
        const y = h - (binIndex + 1) * binHeight;
        const value = frame[binIndex];

        ctx.fillStyle = getColor(value);
        ctx.fillRect(x, y, frameWidth + 1, binHeight + 1);
      }
    }

    // Desenhar linha de posição
    if (duration > 0) {
      const position = (currentTime / duration) * width;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(position, 0);
      ctx.lineTo(position, h);
      ctx.stroke();
    }
  }, [spectrogram, currentTime, duration, zoom, scroll]);

  useEffect(() => {
    draw();

    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Frequências de referência (para escala)
  const freqLabels = [
    { freq: 100, label: "100Hz" },
    { freq: 500, label: "500Hz" },
    { freq: 1000, label: "1kHz" },
    { freq: 2000, label: "2kHz" },
    { freq: 4000, label: "4kHz" },
    { freq: 8000, label: "8kHz" },
  ];

  return (
    <Card className="overflow-hidden">
      {title && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Zoom:</span>
                <Slider
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                  min={1}
                  max={10}
                  step={0.5}
                  className="w-24"
                />
                <span>{zoom}x</span>
              </div>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : "p-4"}>
        <div className="flex gap-2">
          {/* Escala de frequência */}
          {showFrequencyScale && (
            <div
              className="flex flex-col justify-between text-xs text-muted-foreground py-2"
              style={{ height: `${height}px` }}
            >
              <span>20kHz</span>
              <span>4kHz</span>
              <span>1kHz</span>
              <span>250Hz</span>
              <span>20Hz</span>
            </div>
          )}

          {/* Canvas do espectrograma */}
          <div
            className="flex-1 rounded-lg overflow-hidden relative"
            style={{ height: `${height}px` }}
          >
            <canvas ref={canvasRef} className="w-full h-full" />

            {/* Time markers */}
            <div className="absolute bottom-1 left-2 text-xs text-white/70 bg-black/30 px-1 rounded">
              {formatTime(currentTime)}
            </div>
            <div className="absolute bottom-1 right-2 text-xs text-white/70 bg-black/30 px-1 rounded">
              {formatTime(duration)}
            </div>

            {/* Scroll indicator (when zoomed) */}
            {zoom > 1 && (
              <div className="absolute top-1 right-1 text-xs text-white/70 bg-black/30 px-1 rounded">
                Scroll: {Math.round(scroll * 100)}%
              </div>
            )}
          </div>

          {/* Color scale */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">+0dB</span>
            <div
              className="w-3 rounded-sm"
              style={{
                height: `${height - 30}px`,
                background:
                  "linear-gradient(to bottom, rgb(255, 255, 200), rgb(252, 140, 40), rgb(200, 55, 50), rgb(122, 30, 90), rgb(48, 12, 70), rgb(0, 0, 0))",
              }}
            />
            <span className="text-xs text-muted-foreground">-100dB</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
