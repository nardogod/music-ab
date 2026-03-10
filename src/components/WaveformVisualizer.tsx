"use client";

/**
 * Componente de visualização de Waveform
 * Exibe a forma de onda do áudio com indicador de posição
 */

import { useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WaveformVisualizerProps {
  waveform: number[];
  peaks?: number[];
  currentTime?: number;
  duration?: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  onSeek?: (position: number) => void;
  title?: string;
}

export function WaveformVisualizer({
  waveform,
  peaks = [],
  currentTime = 0,
  duration = 0,
  color = "#8b5cf6",
  backgroundColor = "transparent",
  height = 120,
  onSeek,
  title,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || waveform.length === 0) return;

    // Configurar dimensões
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const h = rect.height;
    const centerY = h / 2;
    const barWidth = width / waveform.length;

    // Limpar canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, h);

    // Desenhar waveform
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, "#a78bfa");
    gradient.addColorStop(1, color);

    ctx.fillStyle = gradient;

    for (let i = 0; i < waveform.length; i++) {
      const x = i * barWidth;
      const amplitude = waveform[i];
      const barHeight = amplitude * centerY * 0.9;

      // Barra superior
      ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight);
      // Barra inferior (espelhada)
      ctx.fillRect(x, centerY, barWidth - 1, barHeight);
    }

    // Desenhar linha de posição
    if (duration > 0) {
      const position = (currentTime / duration) * width;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(position, 0);
      ctx.lineTo(position, h);
      ctx.stroke();
    }

    // Desenhar picos
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (const peak of peaks) {
      const x = peak * width;
      ctx.beginPath();
      ctx.arc(x, 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [waveform, currentTime, duration, color, backgroundColor, peaks]);

  useEffect(() => {
    draw();

    // Redesenhar no resize
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSeek || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = x / rect.width;

      onSeek(position * (duration || 0));
    },
    [onSeek, duration],
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="overflow-hidden">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : "p-4"}>
        <div
          ref={containerRef}
          className="relative w-full rounded-lg overflow-hidden cursor-crosshair"
          style={{
            height: `${height}px`,
            backgroundColor: backgroundColor || "#1a1a2e",
          }}
          onClick={handleClick}
        >
          <canvas ref={canvasRef} className="w-full h-full" />

          {/* Time markers */}
          <div className="absolute bottom-1 left-2 text-xs text-white/70 bg-black/30 px-1 rounded">
            {formatTime(currentTime)}
          </div>
          <div className="absolute bottom-1 right-2 text-xs text-white/70 bg-black/30 px-1 rounded">
            {formatTime(duration)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
