"use client";

/**
 * Music Analyzer Pro - Página Principal
 *
 * Aplicação para análise de músicas no browser.
 * Permite upload de arquivos de áudio, análise detalhada e comparação A/B.
 */

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  GitCompare,
  Upload,
  Sparkles,
  Disc3,
  BarChart2,
  Headphones,
  Info,
  Mic,
  Piano,
} from "lucide-react";
import { AudioUploader } from "@/components/AudioUploader";
import { AnalysisPanel } from "@/components/AnalysisPanelV2";
import { ComparisonView } from "@/components/ComparisonView";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { AudioAnalysisResult } from "@/lib/audioAnalyzer";

export default function MusicAnalyzerPage() {
  // Estado para as análises
  const [analysisA, setAnalysisA] = useState<AudioAnalysisResult | null>(null);
  const [analysisB, setAnalysisB] = useState<AudioAnalysisResult | null>(null);

  // Track atual sendo analisado
  const [currentTrack, setCurrentTrack] = useState<"A" | "B">("A");

  // Hooks de análise
  const analyzerA = useAudioAnalyzer();
  const analyzerB = useAudioAnalyzer();
  const analyzerSolo = useAudioAnalyzer();

  // Stems para análise solo completa (voz + instrumental)
  const [vocalFile, setVocalFile] = useState<File | null>(null);
  const [instrumentalFile, setInstrumentalFile] = useState<File | null>(null);
  const [soloAnalysis, setSoloAnalysis] = useState<AudioAnalysisResult | null>(
    null,
  );

  // Hooks de player
  const playerA = useAudioPlayer();
  const playerB = useAudioPlayer();

  // Handler para seleção de arquivo
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (currentTrack === "A") {
        const result = await analyzerA.analyzeFile(file);
        if (result) {
          setAnalysisA(result);
          await playerA.loadAudio(file);
        }
      } else {
        const result = await analyzerB.analyzeFile(file);
        if (result) {
          setAnalysisB(result);
          await playerB.loadAudio(file);
        }
      }
    },
    [currentTrack, analyzerA, analyzerB, playerA, playerB],
  );

  // Handler para limpar análise
  const handleClearA = useCallback(() => {
    setAnalysisA(null);
    analyzerA.reset();
    playerA.stop();
  }, [analyzerA, playerA]);

  const handleClearB = useCallback(() => {
    setAnalysisB(null);
    analyzerB.reset();
    playerB.stop();
  }, [analyzerB, playerB]);

  const handleAnalyzeStems = useCallback(async () => {
    if (!vocalFile || !instrumentalFile) return;
    const result = await analyzerSolo.analyzeStems(vocalFile, instrumentalFile);
    if (result) setSoloAnalysis(result);
  }, [vocalFile, instrumentalFile, analyzerSolo]);

  const handleClearSolo = useCallback(() => {
    setVocalFile(null);
    setInstrumentalFile(null);
    setSoloAnalysis(null);
    analyzerSolo.reset();
  }, [analyzerSolo]);

  // Atualizar tempo do player A para sync com análise
  useEffect(() => {
    // Update visualizations when time changes
  }, [playerA.currentTime, playerB.currentTime]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DiscC className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Music Analyzer Pro
                </h1>
                <p className="text-xs text-muted-foreground">
                  Análise de áudio 100% no browser
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Beta
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="analyze"
              className="gap-2"
              disabled={!analysisA && !soloAnalysis}
            >
              <BarChart2 className="w-4 h-4" />
              Análise
            </TabsTrigger>
            <TabsTrigger
              value="compare"
              className="gap-2"
              disabled={!analysisA || !analysisB}
            >
              <GitCompare className="w-4 h-4" />
              Comparar
            </TabsTrigger>
          </TabsList>

          {/* Tab de Upload */}
          <TabsContent value="upload" className="space-y-6">
            {/* Info Card */}
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Como funciona</p>
                    <p className="text-xs text-muted-foreground">
                      Faça upload de uma música para análise detalhada ou duas
                      músicas para comparação A/B. Todos os dados são
                      processados localmente no seu navegador - nada é enviado
                      para servidores.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Track A */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Track A</Badge>
                    {analysisA && (
                      <span className="text-xs text-muted-foreground">
                        {analysisA.fileName}
                      </span>
                    )}
                  </div>
                  {analysisA && (
                    <Button variant="ghost" size="sm" onClick={handleClearA}>
                      Limpar
                    </Button>
                  )}
                </div>

                {!analysisA ? (
                  <AudioUploader
                    onFileSelect={handleFileSelect}
                    isAnalyzing={analyzerA.isAnalyzing}
                    progress={analyzerA.progress}
                    status={analyzerA.status}
                    logs={analyzerA.logs}
                    error={analyzerA.error}
                    fileName={undefined}
                    onClear={undefined}
                  />
                ) : (
                  <Card className="border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Music className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {analysisA.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{analysisA.bpm} BPM</span>
                            <span>•</span>
                            <span>
                              {analysisA.key}{" "}
                              {analysisA.mode === "major" ? "Maior" : "Menor"}
                            </span>
                            <span>•</span>
                            <span>
                              {Math.floor(analysisA.duration / 60)}:
                              {Math.floor(analysisA.duration % 60)
                                .toString()
                                .padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Track B */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Track B</Badge>
                    {analysisB && (
                      <span className="text-xs text-muted-foreground">
                        {analysisB.fileName}
                      </span>
                    )}
                  </div>
                  {analysisB && (
                    <Button variant="ghost" size="sm" onClick={handleClearB}>
                      Limpar
                    </Button>
                  )}
                </div>

                {!analysisB ? (
                  <AudioUploader
                    onFileSelect={handleFileSelect}
                    isAnalyzing={analyzerB.isAnalyzing}
                    progress={analyzerB.progress}
                    status={analyzerB.status}
                    logs={analyzerB.logs}
                    error={analyzerB.error}
                    fileName={undefined}
                    onClear={undefined}
                  />
                ) : (
                  <Card className="border-secondary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-secondary/10">
                          <Music className="w-6 h-6 text-secondary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {analysisB.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{analysisB.bpm} BPM</span>
                            <span>•</span>
                            <span>
                              {analysisB.key}{" "}
                              {analysisB.mode === "major" ? "Maior" : "Menor"}
                            </span>
                            <span>•</span>
                            <span>
                              {Math.floor(analysisB.duration / 60)}:
                              {Math.floor(analysisB.duration % 60)
                                .toString()
                                .padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Análise Solo Completa (Voz + Instrumental) */}
            <Card className="border-dashed border-2 border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Análise Solo Completa
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload da voz e do instrumental separados para análise da
                  música completa com perfil de mix
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      Voz
                    </p>
                    {!vocalFile ? (
                      <AudioUploader
                        onFileSelect={(f) => setVocalFile(f)}
                        isAnalyzing={false}
                        progress={0}
                        error={null}
                        fileName={undefined}
                        onClear={undefined}
                      />
                    ) : (
                      <Card className="border-primary/30">
                        <CardContent className="p-3 flex items-center justify-between">
                          <span className="text-sm truncate">{vocalFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setVocalFile(null)}
                          >
                            Limpar
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Piano className="w-3 h-3" />
                      Instrumental
                    </p>
                    {!instrumentalFile ? (
                      <AudioUploader
                        onFileSelect={(f) => setInstrumentalFile(f)}
                        isAnalyzing={false}
                        progress={0}
                        error={null}
                        fileName={undefined}
                        onClear={undefined}
                      />
                    ) : (
                      <Card className="border-primary/30">
                        <CardContent className="p-3 flex items-center justify-between">
                          <span className="text-sm truncate">
                            {instrumentalFile.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInstrumentalFile(null)}
                          >
                            Limpar
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
                {vocalFile && instrumentalFile && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAnalyzeStems}
                      disabled={analyzerSolo.isAnalyzing}
                      className="flex-1"
                    >
                      {analyzerSolo.isAnalyzing
                        ? `Analisando... ${analyzerSolo.progress}%`
                        : "Analisar Música Completa"}
                    </Button>
                    {soloAnalysis && (
                      <Button
                        variant="outline"
                        onClick={handleClearSolo}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                )}
                {analyzerSolo.isAnalyzing && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {analyzerSolo.status}
                    </p>
                    {analyzerSolo.logs.length > 0 && (
                      <div className="p-2 rounded bg-muted/50 max-h-24 overflow-y-auto text-xs font-mono">
                        {analyzerSolo.logs.map((l, i) => (
                          <div key={i}>{l}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seletor de track ativo */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={currentTrack === "A" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentTrack("A")}
                >
                  Track A
                </Button>
                <Button
                  variant={currentTrack === "B" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentTrack("B")}
                >
                  Track B
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab de Análise */}
          <TabsContent value="analyze" className="space-y-6">
            {(analysisA || soloAnalysis) ? (
              <AnalysisPanel
                analysis={soloAnalysis || analysisA!}
                isPlaying={playerA.isPlaying}
                currentTime={playerA.currentTime}
                duration={playerA.duration}
                volume={playerA.volume}
                isLoading={playerA.isLoading}
                onPlay={playerA.play}
                onPause={playerA.pause}
                onStop={playerA.stop}
                onSeek={playerA.seek}
                onVolumeChange={playerA.setVolume}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Headphones className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Faça upload de uma música para ver a análise
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab de Comparação */}
          <TabsContent value="compare" className="space-y-6">
            {analysisA && analysisB ? (
              <ComparisonView analysisA={analysisA} analysisB={analysisB} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <GitCompare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Faça upload de duas músicas para comparar
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {!analysisA && !analysisB && "Nenhuma música carregada"}
                    {analysisA &&
                      !analysisB &&
                      "Track A carregada - adicione Track B"}
                    {!analysisA &&
                      analysisB &&
                      "Track B carregada - adicione Track A"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>
              Music Analyzer Pro • Análise 100% local • Seus dados não saem do
              navegador
            </p>
            <p>Feito com Web Audio API + Next.js</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Correção do ícone
function DiscC({ className }: { className?: string }) {
  return <Disc3 className={className} />;
}
