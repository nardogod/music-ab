"use client";

/**
 * Visualização de Melodia estilo Melodyne
 * Mostra notas como "blobs" horizontais com duração e pitch
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Move, Music } from "lucide-react";
import { DetectedNote } from "@/lib/audioAnalyzer";

interface MelodyneVisualizationProps {
  notes: DetectedNote[];
  duration: number;
  currentTime?: number;
  keySignature?: string;
  mode?: "major" | "minor";
  height?: number;
}

// Notas para o piano roll
const NOTE_NAMES = [
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

// Cores para diferentes oitavas
const OCTAVE_COLORS: Record<number, string> = {
  2: "#ef4444", // vermelho
  3: "#f97316", // laranja
  4: "#eab308", // amarelo
  5: "#22c55e", // verde
  6: "#3b82f6", // azul
  7: "#8b5cf6", // roxo
};

export function MelodyneVisualization({
  notes,
  duration,
  currentTime = 0,
  keySignature = "C",
  mode = "major",
  height = 300,
}: MelodyneVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado de zoom e scroll
  const [zoomX, setZoomX] = useState(1);
  const [zoomY, setZoomY] = useState(1);
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [hoveredNote, setHoveredNote] = useState<DetectedNote | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calcular range de notas
  const getNoteRange = useCallback(() => {
    if (notes.length === 0) {
      return { minMidi: 48, maxMidi: 72 }; // C3 a C5 padrão
    }

    const midiNotes = notes.map((n) => n.midiNote);
    const minMidi = Math.floor(Math.min(...midiNotes)) - 2;
    const maxMidi = Math.ceil(Math.max(...midiNotes)) + 2;

    return { minMidi, maxMidi };
  }, [notes]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || notes.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const h = rect.height;
    const { minMidi, maxMidi } = getNoteRange();

    // Fundo
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, width, h);

    // Dimensões visíveis com zoom
    const visibleDuration = duration / zoomX;
    const startTime = scrollX * (duration - visibleDuration);
    const visibleNotes = (maxMidi - minMidi) / zoomY;
    const startNote = scrollY * (maxMidi - minMidi - visibleNotes);

    // Largura do piano roll
    const pianoWidth = 50;
    const contentWidth = width - pianoWidth;

    // Desenha grid de semitons
    const noteHeight = h / visibleNotes;
    const startMidiDisplay = minMidi + startNote;

    for (
      let midi = Math.floor(startMidiDisplay);
      midi <= Math.ceil(startMidiDisplay + visibleNotes);
      midi++
    ) {
      const y = h - (midi - startMidiDisplay) * noteHeight;
      const noteIndex = midi % 12;
      const noteName = NOTE_NAMES[noteIndex];

      // Cor de fundo para teclas pretas
      const isBlackKey = [1, 3, 6, 8, 10].includes(noteIndex);

      // Destaque para notas da tonalidade
      const keyNotes =
        mode === "major"
          ? [0, 2, 4, 5, 7, 9, 11] // Escala maior
          : [0, 2, 3, 5, 7, 8, 10]; // Escala menor

      const keyRoot = NOTE_NAMES.indexOf(keySignature);
      const isInKey = keyNotes.includes((noteIndex - keyRoot + 12) % 12);

      if (isBlackKey) {
        ctx.fillStyle = "rgba(30, 30, 50, 0.8)";
        ctx.fillRect(pianoWidth, y - noteHeight, contentWidth, noteHeight);
      } else if (isInKey) {
        ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
        ctx.fillRect(pianoWidth, y - noteHeight, contentWidth, noteHeight);
      }

      // Linha da nota
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.moveTo(pianoWidth, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Nome da nota no piano roll
      if (y > 0 && y < h) {
        ctx.fillStyle = isBlackKey ? "#888" : "#fff";
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(
          `${noteName}${Math.floor(midi / 12) - 1}`,
          pianoWidth - 5,
          y - noteHeight / 2 + 4,
        );
      }
    }

    // Linha do piano roll
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.moveTo(pianoWidth, 0);
    ctx.lineTo(pianoWidth, h);
    ctx.stroke();

    // Desenha linhas de tempo (compassos)
    const beatDuration = 60 / 120; // Assume 120 BPM para grid
    for (let time = 0; time < duration; time += beatDuration) {
      if (time >= startTime && time <= startTime + visibleDuration) {
        const x =
          pianoWidth + ((time - startTime) / visibleDuration) * contentWidth;
        ctx.strokeStyle =
          time % (beatDuration * 4) < 0.001
            ? "rgba(255, 255, 255, 0.3)"
            : "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    }

    // Desenha notas como blobs
    for (const note of notes) {
      // Verifica se a nota está visível
      if (
        note.endTime < startTime ||
        note.startTime > startTime + visibleDuration
      )
        continue;
      if (
        note.midiNote < startMidiDisplay ||
        note.midiNote > startMidiDisplay + visibleNotes
      )
        continue;

      // Posição e tamanho
      const x =
        pianoWidth +
        ((note.startTime - startTime) / visibleDuration) * contentWidth;
      const noteWidth = Math.max(
        3,
        (note.duration / visibleDuration) * contentWidth,
      );
      const y =
        h - (note.midiNote - startMidiDisplay) * noteHeight - noteHeight * 0.1;
      const blobHeight = noteHeight * 0.8;

      // Cor baseada na oitava
      const baseColor = OCTAVE_COLORS[note.octave] || "#8b5cf6";

      // Gradiente para efeito 3D
      const gradient = ctx.createLinearGradient(
        x,
        y - blobHeight / 2,
        x,
        y + blobHeight / 2,
      );
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, baseColor);
      gradient.addColorStop(1, adjustColor(baseColor, -30));

      // Desenha blob (retângulo arredondado)
      ctx.fillStyle = gradient;
      ctx.beginPath();
      roundRect(ctx, x, y - blobHeight / 2, noteWidth, blobHeight, 4);
      ctx.fill();

      // Borda
      ctx.strokeStyle = adjustColor(baseColor, 30);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Indicador de vibrato
      if (note.vibrato) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        const vibratoAmp = (note.vibratoDepth / 50) * noteHeight * 0.3;
        ctx.beginPath();
        for (let i = 0; i < noteWidth; i += 2) {
          const vibY = y + Math.sin(i * note.vibratoRate * 0.3) * vibratoAmp;
          if (i === 0) ctx.moveTo(x + i, vibY);
          else ctx.lineTo(x + i, vibY);
        }
        ctx.stroke();
      }

      // Destaque se hover
      if (hoveredNote && hoveredNote.id === note.id) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundRect(
          ctx,
          x - 1,
          y - blobHeight / 2 - 1,
          noteWidth + 2,
          blobHeight + 2,
          5,
        );
        ctx.stroke();
      }
    }

    // Linha de playback
    if (currentTime > 0) {
      const playX =
        pianoWidth +
        ((currentTime - startTime) / visibleDuration) * contentWidth;
      if (playX >= pianoWidth && playX <= width) {
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playX, 0);
        ctx.lineTo(playX, h);
        ctx.stroke();
      }
    }

    // Labels de tempo
    ctx.fillStyle = "#888";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    const timeLabels = [0, 0.25, 0.5, 0.75, 1].map(
      (p) => startTime + p * visibleDuration,
    );
    timeLabels.forEach((t, i) => {
      const x = pianoWidth + (i / 4) * contentWidth;
      ctx.fillText(formatTime(t), x, h - 5);
    });
  }, [
    notes,
    duration,
    currentTime,
    zoomX,
    zoomY,
    scrollX,
    scrollY,
    keySignature,
    mode,
    hoveredNote,
    getNoteRange,
  ]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  // Handlers de interação
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || notes.length === 0) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDragging) {
        const dx = (x - dragStart.x) / rect.width;
        const dy = (y - dragStart.y) / rect.height;
        setScrollX(Math.max(0, Math.min(1, scrollX - dx * 0.5)));
        setScrollY(Math.max(0, Math.min(1, scrollY - dy * 0.5)));
        setDragStart({ x, y });
        return;
      }

      // Detectar hover em nota
      const pianoWidth = 50;
      const contentWidth = rect.width - pianoWidth;
      const { minMidi, maxMidi } = getNoteRange();
      const visibleDuration = duration / zoomX;
      const startTime = scrollX * (duration - visibleDuration);
      const visibleNotes = (maxMidi - minMidi) / zoomY;
      const startNote = scrollY * (maxMidi - minMidi - visibleNotes);

      const hoveredTime =
        startTime + ((x - pianoWidth) / contentWidth) * visibleDuration;
      const hoveredMidi =
        maxMidi - startNote - (y / rect.height) * visibleNotes;

      const found = notes.find(
        (n) =>
          hoveredTime >= n.startTime &&
          hoveredTime <= n.endTime &&
          Math.abs(n.midiNote - hoveredMidi) < 1,
      );

      setHoveredNote(found || null);
    },
    [
      isDragging,
      dragStart,
      scrollX,
      scrollY,
      notes,
      zoomX,
      zoomY,
      duration,
      getNoteRange,
    ],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Music className="w-4 h-4" />
              Visualização Melódica
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {notes.length} notas detectadas
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom X */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomX(Math.max(1, zoomX - 0.5))}
              >
                <ZoomOut className="w-3 h-3" />
              </Button>
              <span className="text-xs w-8 text-center">{zoomX}x</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomX(Math.min(10, zoomX + 0.5))}
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
            </div>

            {/* Zoom Y */}
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomY(Math.max(1, zoomY - 0.5))}
              >
                <ZoomOut className="w-3 h-3" />
              </Button>
              <span className="text-xs w-8 text-center">{zoomY}x</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomY(Math.min(5, zoomY + 0.5))}
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Tooltip da nota hover */}
        {hoveredNote && (
          <div className="mb-2 p-2 bg-muted rounded-lg text-xs flex flex-wrap items-center gap-4">
            <span className="font-bold text-lg">
              {hoveredNote.noteName}
              {hoveredNote.octave}
            </span>
            <span>|</span>
            <span>Duração: {hoveredNote.duration.toFixed(2)}s</span>
            <span>|</span>
            <span>Freq: {hoveredNote.pitch.toFixed(1)} Hz</span>
            <span>|</span>
            <span>Intensidade: {Math.round(hoveredNote.velocity * 100)}%</span>
            {hoveredNote.vibrato && (
              <>
                <span>|</span>
                <span className="text-purple-400">
                  ♪ Vibrato: {hoveredNote.vibratoRate.toFixed(1)} Hz
                  {hoveredNote.vibratoDepth > 0 && ` (±${Math.round(hoveredNote.vibratoDepth)}¢)`}
                </span>
              </>
            )}
          </div>
        )}

        <div
          ref={containerRef}
          className="relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ height: `${height}px` }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Timeline */}
          <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-between items-end px-12 pb-1 text-xs text-muted-foreground pointer-events-none">
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <span key={p}>{formatTime(duration * p)}</span>
            ))}
          </div>
          {/* Legenda */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs bg-black/50 px-2 py-1 rounded">
            <span className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded"
                style={{ background: OCTAVE_COLORS[4] }}
              />
              C4
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-purple-500/30" />
              Na tonalidade
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-green-500">|</span>
            <span>Playhead</span>
          </div>
        </div>

        {/* Controles de scroll */}
        {(zoomX > 1 || zoomY > 1) && (
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            {zoomX > 1 && (
              <div className="flex items-center gap-2">
                <Move className="w-3 h-3" />
                <span>Scroll horizontal: {(scrollX * 100).toFixed(0)}%</span>
                <Slider
                  value={[scrollX]}
                  onValueChange={([v]) => setScrollX(v)}
                  max={1}
                  step={0.01}
                  className="w-24"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utilitários
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}
