"use client";

/**
 * Componente de botões de exportação
 * Permite exportar os dados da análise em JSON ou CSV
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { AudioAnalysisResult, FrequencyBands } from "@/lib/audioAnalyzer";

interface ExportButtonsProps {
  analysis: AudioAnalysisResult | null;
  comparisonAnalysis?: AudioAnalysisResult | null;
}

export function ExportButtons({
  analysis,
  comparisonAnalysis,
}: ExportButtonsProps) {
  if (!analysis) return null;

  const exportJSON = () => {
    const data = comparisonAnalysis
      ? { trackA: analysis, trackB: comparisonAnalysis }
      : analysis;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis_${analysis.fileName.replace(/\.[^/.]+$/, "")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows: string[][] = [];

    // Cabeçalho
    rows.push(["Propriedade", "Valor"]);

    // Dados básicos
    rows.push(["Arquivo", analysis.fileName]);
    rows.push(["Duração (s)", analysis.duration.toFixed(2)]);
    rows.push(["BPM", analysis.bpm.toString()]);
    rows.push([
      "Tonalidade",
      `${analysis.key} ${analysis.mode === "major" ? "Maior" : "Menor"}`,
    ]);
    rows.push(["Loudness (dB)", analysis.loudness.toFixed(1) + " dB"]);
    rows.push(["Energia", (analysis.energy * 100).toFixed(1) + "%"]);
    rows.push([
      "Dançabilidade",
      (analysis.danceability * 100).toFixed(1) + "%",
    ]);
    rows.push(["Acousticness", (analysis.acousticness * 100).toFixed(1) + "%"]);

    // Bandas de frequência
    rows.push([]);
    rows.push(["Bandas de Frequência", "Energia"]);
    const bandLabels: Record<keyof FrequencyBands, string> = {
      subBass: "Sub Bass (20-60 Hz)",
      bass: "Bass (60-250 Hz)",
      lowMid: "Low Mid (250-500 Hz)",
      mid: "Mid (500-2000 Hz)",
      highMid: "High Mid (2000-4000 Hz)",
      presence: "Presence (4000-6000 Hz)",
      brilliance: "Brilliance (6000-20000 Hz)",
    };

    for (const [key, label] of Object.entries(bandLabels)) {
      rows.push([
        label,
        (analysis.frequencyBands[key as keyof FrequencyBands] * 100).toFixed(
          2,
        ) + "%",
      ]);
    }

    // Metadados técnicos
    rows.push([]);
    rows.push(["Informações Técnicas", ""]);
    rows.push(["Sample Rate", analysis.metadata.sampleRate + " Hz"]);
    rows.push([
      "Canais",
      analysis.metadata.numberOfChannels === 2 ? "Estéreo" : "Mono",
    ]);
    rows.push(["Formato", analysis.metadata.format]);

    // Se houver comparação
    if (comparisonAnalysis) {
      rows.push([]);
      rows.push(["=== COMPARAÇÃO ===", ""]);
      rows.push(["Arquivo B", comparisonAnalysis.fileName]);
      rows.push(["BPM B", comparisonAnalysis.bpm.toString()]);
      rows.push([
        "Tonalidade B",
        `${comparisonAnalysis.key} ${comparisonAnalysis.mode === "major" ? "Maior" : "Menor"}`,
      ]);
    }

    // Converter para CSV
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis_${analysis.fileName.replace(/\.[^/.]+$/, "")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportJSON}>
          <FileJson className="w-4 h-4 mr-2" />
          Exportar JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
