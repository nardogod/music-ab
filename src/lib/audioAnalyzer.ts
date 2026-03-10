/**
 * Biblioteca de Análise de Áudio - Music Analyzer Pro v2.0
 *
 * Todos os algoritmos rodam 100% no browser usando Web Audio API
 * Inclui features similares ao Spotify Audio Features API
 */

// Tipos para os resultados da análise
export interface AudioAnalysisResult {
  fileName: string;
  duration: number;
  // Features básicas
  bpm: number;
  bpmConfidence: number;
  key: string;
  mode: "major" | "minor";
  keyConfidence: number;
  // Features Spotify-like
  loudness: number; // dB (tipicamente -60 a 0)
  energy: number; // 0.0 a 1.0
  danceability: number; // 0.0 a 1.0
  acousticness: number; // 0.0 a 1.0
  instrumentalness: number; // 0.0 a 1.0
  liveness: number; // 0.0 a 1.0
  speechiness: number; // 0.0 a 1.0
  valence: number; // 0.0 a 1.0 (positividade)
  // Estrutura
  timeSignature: number; // 3, 4, 5, 6, 7
  timeSignatureConfidence: number;
  sections: MusicSection[];
  // Dados de visualização
  frequencyBands: FrequencyBands;
  waveform: number[];
  spectrogram: number[][];
  peaks: number[];
  chroma: number[];
  chords: ChordAnalysis[];
  // Notas detectadas estilo Melodyne
  detectedNotes: DetectedNote[];
  pitchContour: PitchPoint[];
  // Metadata
  metadata: AudioMetadata;
  // Perfil de mix (engenharia reversa)
  mixProfile?: MixProfile;
}

export interface MixProfile {
  stereoWidth: number; // 0-1 (0=mono, 1=estéreo amplo)
  stereoCorrelation: number; // -1 a 1 (correlação L/R)
  transientAttack: number; // ms - tempo de ataque
  transientRelease: number; // ms - tempo de release
  transientDensity: number; // 0-1 - densidade de transientes
  reverbTail: number; // segundos - duração da cauda
  reverbDensity: number; // 0-1 - densidade do reverb
  eqCurve: number[]; // 24 bandas normalizadas 0-1
}

export interface FrequencyBands {
  subBass: number; // 20-60 Hz
  bass: number; // 60-250 Hz
  lowMid: number; // 250-500 Hz
  mid: number; // 500-2000 Hz
  highMid: number; // 2000-4000 Hz
  presence: number; // 4000-6000 Hz
  brilliance: number; // 6000-20000 Hz
}

export interface ChordAnalysis {
  time: number;
  chord: string;
  confidence: number;
}

export interface PitchPoint {
  time: number;
  frequency: number;
  note: string;
  midiNote: number;
  cents: number; // Desvio em cents da nota exata
  confidence: number;
}

export interface DetectedNote {
  id: number;
  startTime: number;
  endTime: number;
  duration: number;
  pitch: number; // Frequência média em Hz
  midiNote: number; // Nota MIDI (60 = C4)
  noteName: string; // Nome da nota (C, D#, etc)
  octave: number; // Oitava
  velocity: number; // Intensidade (0-1)
  confidence: number; // Confiança da detecção
  vibrato: boolean; // Se tem vibrato
  vibratoRate: number; // Taxa do vibrato em Hz
  vibratoDepth: number; // Profundidade do vibrato em cents
}

export interface MusicSection {
  startTime: number;
  endTime: number;
  duration: number;
  type:
    | "intro"
    | "verse"
    | "chorus"
    | "bridge"
    | "outro"
    | "instrumental"
    | "unknown";
  confidence: number;
  loudness: number;
  tempo: number;
  key: string;
}

export interface AudioMetadata {
  sampleRate: number;
  numberOfChannels: number;
  bitDepth: string;
  format: string;
}

// Constantes musicais
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

// Perfis Krumhansl-Schmuckler para detecção de tonalidade
const MAJOR_PROFILE = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];
const MINOR_PROFILE = [
  6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

/**
 * Classe principal para análise de áudio
 */
export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;

  /**
   * Inicializa o contexto de áudio
   */
  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Carrega um arquivo de áudio com feedback de progresso
   */
  async loadAudioFile(
    file: File,
    onProgress?: (progress: number, status?: string) => void,
    onLog?: (msg: string) => void,
  ): Promise<AudioBuffer> {
    const log = (msg: string) => {
      const line = `${new Date().toLocaleTimeString()} - ${msg}`;
      console.log(`[Music Analyzer] ${line}`);
      onLog?.(line);
    };

    log(`Iniciando: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    await this.initialize();

    // Fase 1: Ler arquivo com FileReader (permite progresso real)
    log("Carregando arquivo...");
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        log("Arquivo lido. Iniciando decodificação...");
        resolve(reader.result as ArrayBuffer);
      };
      reader.onerror = () => reject(reader.error);
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 5); // 0-5%
          onProgress?.(pct, "Carregando arquivo...");
        }
      };
      reader.readAsArrayBuffer(file);
    });

    onProgress?.(5, "Decodificando áudio...");
    log("Decodificando áudio (pode demorar em arquivos grandes)...");
    // Mensagem de "vida" durante decode (evita parecer travado)
    const pulseInterval = setInterval(() => {
      onProgress?.(5, "Decodificando áudio... (arquivos grandes podem demorar)");
      log("Ainda decodificando... aguarde.");
    }, 3000);

    this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    clearInterval(pulseInterval);
    log(`Decodificação concluída. Duração: ${this.audioBuffer.duration.toFixed(1)}s`);

    return this.audioBuffer;
  }

  /**
   * Analisa completamente um arquivo de áudio
   */
  async analyze(
    file: File,
    onProgress?: (progress: number, status?: string) => void,
    onLog?: (msg: string) => void,
  ): Promise<AudioAnalysisResult> {
    const log = (msg: string) => {
      const line = `${new Date().toLocaleTimeString()} - ${msg}`;
      console.log(`[Music Analyzer] ${line}`);
      onLog?.(line);
    };

    log("=== Início da análise ===");
    onProgress?.(5, "Iniciando...");

    const buffer = await this.loadAudioFile(file, onProgress, onLog);
    return this.analyzeFromBuffer(buffer, file.name, onProgress, onLog);
  }

  /**
   * Analisa a partir de um AudioBuffer (usado por analyze e analyzeStems)
   */
  private async analyzeFromBuffer(
    buffer: AudioBuffer,
    fileName: string,
    onProgress?: (progress: number, status?: string) => void,
    onLog?: (msg: string) => void,
  ): Promise<AudioAnalysisResult> {
    const log = (msg: string) => {
      const line = `${new Date().toLocaleTimeString()} - ${msg}`;
      console.log(`[Music Analyzer] ${line}`);
      onLog?.(line);
    };

    log("Executando análises (BPM, Key, FFT, etc.)...");
    onProgress?.(15, "Analisando áudio...");

    const channelData = buffer.getChannelData(0);
    onProgress?.(20, "Extraindo dados...");

    // Yield para manter a página responsiva (evita "página não responde")
    const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));

    // Análises em sequência com yield entre cada - evita bloquear o main thread
    await yieldToMain();
    log("Detectando BPM...");
    const bpmResult = await this.detectBPM(buffer);
    await yieldToMain();
    log("Detectando tonalidade...");
    const keyResult = await this.detectKey(buffer);
    await yieldToMain();
    const [loudness, energy] = await Promise.all([
      this.calculateLoudness(channelData),
      this.calculateEnergy(channelData),
    ]);
    await yieldToMain();
    log("Analisando espectro...");
    const [frequencyBands, waveform, spectrogram, peaks] = await Promise.all([
      this.analyzeFrequencyBands(buffer),
      this.extractWaveform(channelData),
      this.generateSpectrogram(buffer),
      this.detectPeaks(channelData),
    ]);
    await yieldToMain();
    log("Extraindo chroma e notas...");
    const [chroma, detectedNotes] = await Promise.all([
      this.calculateChroma(buffer),
      this.detectNotes(buffer),
    ]);
    const pitchContour = detectedNotes.map((note) => ({
      time: note.startTime,
      frequency: note.pitch,
      note: note.noteName,
      midiNote: note.midiNote,
      cents: Math.round((note.midiNote - Math.round(note.midiNote)) * 100),
      confidence: note.confidence,
    }));

    log("Análises paralelas concluídas. Calculando métricas...");
    onProgress?.(70, "Processando métricas...");

    // Features derivadas
    const danceability = this.calculateDanceability(
      bpmResult.bpm,
      energy,
      buffer.duration,
    );
    const acousticness = this.estimateAcousticness(frequencyBands, energy);
    const instrumentalness = this.estimateInstrumentalness(
      frequencyBands,
      chroma,
      pitchContour,
    );
    const liveness = this.estimateLiveness(channelData);
    const speechiness = this.estimateSpeechiness(frequencyBands, chroma);
    const valence = this.estimateValence(
      energy,
      danceability,
      keyResult.mode,
      bpmResult.bpm,
    );
    const timeSignature = this.detectTimeSignature(buffer, bpmResult.bpm);
    const sections = this.detectSections(buffer, energy, frequencyBands);
    const chords = this.detectChords(chroma, buffer.duration);

    await yieldToMain();
    log("Analisando perfil de mix...");
    const mixProfile = await this.analyzeMixProfile(buffer, channelData);

    log("=== Análise concluída com sucesso ===");
    onProgress?.(100, "Concluído!");

    return {
      fileName,
      duration: buffer.duration,
      bpm: bpmResult.bpm,
      bpmConfidence: bpmResult.confidence,
      key: keyResult.key,
      mode: keyResult.mode,
      keyConfidence: keyResult.confidence,
      loudness,
      energy,
      danceability,
      acousticness,
      instrumentalness,
      liveness,
      speechiness,
      valence,
      timeSignature: timeSignature.timeSignature,
      timeSignatureConfidence: timeSignature.confidence,
      sections,
      frequencyBands,
      waveform,
      spectrogram,
      peaks,
      chroma,
      chords,
      detectedNotes,
      pitchContour,
      metadata: {
        sampleRate: buffer.sampleRate,
        numberOfChannels: buffer.numberOfChannels,
        bitDepth: "32-bit float",
        format: fileName.split(".").pop()?.toUpperCase() || "Unknown",
      },
      mixProfile,
    };
  }

  /**
   * Detecta BPM usando algoritmo de autocorrelação melhorado
   */
  private async detectBPM(
    buffer: AudioBuffer,
  ): Promise<{ bpm: number; confidence: number }> {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    // Parâmetros
    const windowSize = Math.floor(sampleRate * 0.02);
    const hopSize = Math.floor(windowSize / 2);
    const minBPM = 50;
    const maxBPM = 220;

    // Calcular onset envelope com spectral flux
    const onsetEnvelope: number[] = [];

    let prevSpectrum: number[] = [];

    // Processar a cada 4 hops para evitar travar (reduz trabalho em 4x)
    const hopMultiplier = channelData.length > 44100 * 120 ? 4 : 1; // >2min: reduz
    for (
      let offset = 0;
      offset < channelData.length - windowSize;
      offset += hopSize * hopMultiplier
    ) {
      const frame = channelData.slice(offset, offset + windowSize);

      // Aplicar janela de Hann
      const windowed = frame.map(
        (v, i) =>
          v * (0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)))),
      );

      const spectrum = this.fftSimple(windowed, 512);

      if (prevSpectrum.length > 0) {
        let flux = 0;
        for (let i = 0; i < spectrum.length; i++) {
          const diff = spectrum[i] - prevSpectrum[i];
          flux += diff > 0 ? diff * diff : 0;
        }
        onsetEnvelope.push(Math.sqrt(flux));
      }

      prevSpectrum = [...spectrum];
    }

    // Normalizar onset envelope
    const maxOnset = Math.max(...onsetEnvelope);
    const normalizedOnset = onsetEnvelope.map((v) => v / (maxOnset || 1));

    // Autocorrelação
    const minLag = Math.floor(((60 / maxBPM) * sampleRate) / hopSize);
    const maxLag = Math.floor(((60 / minBPM) * sampleRate) / hopSize);

    let bestLag = minLag;
    let bestCorrelation = -Infinity;
    const correlations: number[] = [];

    for (
      let lag = minLag;
      lag < maxLag && lag < normalizedOnset.length;
      lag++
    ) {
      let correlation = 0;
      let count = 0;

      for (let i = 0; i < normalizedOnset.length - lag; i++) {
        correlation += normalizedOnset[i] * normalizedOnset[i + lag];
        count++;
      }

      correlation /= count;
      correlations.push(correlation);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }

    // Converter para BPM (ajustar se usamos hopMultiplier)
    const bpm = Math.round(
      (60 * sampleRate) / (bestLag * hopSize * hopMultiplier),
    );

    // Calcular confiança baseada na diferença entre pico e média
    const avgCorrelation =
      correlations.reduce((a, b) => a + b, 0) / correlations.length;
    const confidence = Math.min(
      1,
      (bestCorrelation - avgCorrelation) / bestCorrelation,
    );

    // Validar range
    const finalBpm = Math.max(minBPM, Math.min(maxBPM, bpm));

    return { bpm: finalBpm, confidence };
  }

  /**
   * FFT simplificada para análise
   */
  private fftSimple(signal: Float32Array | number[], size: number): number[] {
    const result = new Array(size).fill(0);
    const n = Math.min(signal.length, size);

    for (let k = 0; k < size / 2; k++) {
      let re = 0,
        im = 0;
      for (let i = 0; i < n; i++) {
        const angle = (-2 * Math.PI * k * i) / size;
        re += signal[i] * Math.cos(angle);
        im += signal[i] * Math.sin(angle);
      }
      result[k] = Math.sqrt(re * re + im * im);
    }

    return result;
  }

  /**
   * Detecta a tonalidade usando Krumhansl-Schmuckler
   */
  private async detectKey(
    buffer: AudioBuffer,
  ): Promise<{ key: string; mode: "major" | "minor"; confidence: number }> {
    const chroma = await this.calculateChroma(buffer);

    let bestKey = 0;
    let bestMode: "major" | "minor" = "major";
    let bestCorrelation = -Infinity;
    let secondBestCorrelation = -Infinity;

    for (let shift = 0; shift < 12; shift++) {
      const majorCorrelation = this.correlate(chroma, MAJOR_PROFILE, shift);
      const minorCorrelation = this.correlate(chroma, MINOR_PROFILE, shift);

      if (majorCorrelation > bestCorrelation) {
        secondBestCorrelation = bestCorrelation;
        bestCorrelation = majorCorrelation;
        bestKey = shift;
        bestMode = "major";
      } else if (majorCorrelation > secondBestCorrelation) {
        secondBestCorrelation = majorCorrelation;
      }

      if (minorCorrelation > bestCorrelation) {
        secondBestCorrelation = bestCorrelation;
        bestCorrelation = minorCorrelation;
        bestKey = shift;
        bestMode = "minor";
      } else if (minorCorrelation > secondBestCorrelation) {
        secondBestCorrelation = minorCorrelation;
      }
    }

    // Confiança baseada na diferença entre melhor e segundo melhor
    const confidence = Math.min(
      1,
      Math.max(
        0,
        ((bestCorrelation - secondBestCorrelation) /
          Math.abs(bestCorrelation)) *
          2 +
          0.5,
      ),
    );

    return {
      key: NOTE_NAMES[bestKey],
      mode: bestMode,
      confidence,
    };
  }

  /**
   * Calcula correlação entre chroma e perfil
   */
  private correlate(
    chroma: number[],
    profile: number[],
    shift: number,
  ): number {
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0,
      sumY2 = 0;

    for (let i = 0; i < 12; i++) {
      const x = chroma[i];
      const y = profile[(i + shift) % 12];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    }

    const n = 12;
    const numerator = sumXY - (sumX * sumY) / n;
    const denominator = Math.sqrt(
      (sumX2 - (sumX * sumX) / n) * (sumY2 - (sumY * sumY) / n),
    );

    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Calcula o chromagram (distribuição de energia por nota)
   * CORRIGIDO: Retorna valores normalizados entre 0 e 1
   */
  private async calculateChroma(buffer: AudioBuffer): Promise<number[]> {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const fftSize = 4096;
    // Limitar a 90s para arquivos longos (evita travar)
    const maxSamples = Math.min(
      channelData.length,
      sampleRate * 90,
    );
    const step = channelData.length > sampleRate * 120 ? fftSize * 8 : fftSize * 4;

    const chromaAccumulator = new Array(12).fill(0);
    let chromaCount = 0;

    for (
      let offset = 0;
      offset < maxSamples - fftSize;
      offset += step
    ) {
      const frame = new Float32Array(fftSize);
      for (let i = 0; i < fftSize && offset + i < channelData.length; i++) {
        frame[i] = channelData[offset + i];
      }

      const spectrum = this.fftSimple(frame, fftSize);

      const chroma = new Array(12).fill(0);

      for (let i = 1; i < spectrum.length; i++) {
        const frequency = (i * sampleRate) / fftSize;
        if (frequency < 65 || frequency > 4000) continue; // Range útil para música

        const noteNumber = 12 * Math.log2(frequency / 440) + 69;
        const noteClass = Math.round(noteNumber) % 12;
        const safeNoteClass = ((noteClass % 12) + 12) % 12;

        chroma[safeNoteClass] += spectrum[i] * spectrum[i];
      }

      // Normalizar
      const maxChroma = Math.sqrt(Math.max(...chroma));
      if (maxChroma > 0) {
        for (let i = 0; i < 12; i++) {
          chromaAccumulator[i] += Math.sqrt(chroma[i]) / maxChroma;
        }
      }
      chromaCount++;
    }

    // Média e normalização final
    const rawChroma = chromaAccumulator.map((v) => v / chromaCount);
    const maxVal = Math.max(...rawChroma);

    return rawChroma.map((v) => (maxVal > 0 ? v / maxVal : 0));
  }

  /**
   * Calcula loudness em dB (padrão Spotify)
   */
  private async calculateLoudness(channelData: Float32Array): Promise<number> {
    let sumSquares = 0;
    for (let i = 0; i < channelData.length; i++) {
      sumSquares += channelData[i] ** 2;
    }
    const rms = Math.sqrt(sumSquares / channelData.length);
    // dB FS (Full Scale)
    const db = 20 * Math.log10(rms + 1e-10);
    return Math.round(db * 10) / 10; // Uma casa decimal
  }

  /**
   * Calcula energia da música (0-1)
   */
  private async calculateEnergy(channelData: Float32Array): Promise<number> {
    const windowSize = 2048;
    const rmsValues: number[] = [];

    for (let i = 0; i < channelData.length; i += windowSize) {
      let sumSquares = 0;
      for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
        sumSquares += channelData[i + j] ** 2;
      }
      rmsValues.push(Math.sqrt(sumSquares / windowSize));
    }

    // Energia baseada em média e variação
    const mean = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
    const variance =
      rmsValues.reduce((a, b) => a + (b - mean) ** 2, 0) / rmsValues.length;

    // Normalizar para 0-1
    const energyScore = Math.min(1, mean * 2 + Math.sqrt(variance) * 3);
    return Math.round(energyScore * 1000) / 1000;
  }

  /**
   * Calcula danceability baseado em múltiplos fatores
   */
  private calculateDanceability(
    bpm: number,
    energy: number,
    duration: number,
  ): number {
    // BPM ideal para dança: 100-130 (pop/eletrônica), 80-100 (hip-hop)
    let bpmScore: number;
    if (bpm >= 100 && bpm <= 130) bpmScore = 1.0;
    else if (bpm >= 80 && bpm <= 150) bpmScore = 0.8;
    else if (bpm >= 60 && bpm <= 170) bpmScore = 0.6;
    else bpmScore = 0.4;

    // Duração ideal: 2.5-4.5 minutos
    let durationScore: number;
    if (duration >= 150 && duration <= 270) durationScore = 1.0;
    else if (duration >= 120 && duration <= 360) durationScore = 0.8;
    else durationScore = 0.6;

    // Combinação
    const danceability = bpmScore * 0.5 + energy * 0.35 + durationScore * 0.15;
    return Math.round(danceability * 1000) / 1000;
  }

  /**
   * Estima acousticness
   */
  private estimateAcousticness(
    frequencyBands: FrequencyBands,
    energy: number,
  ): number {
    const midEnergy = frequencyBands.mid + frequencyBands.lowMid;
    const totalEnergy = Object.values(frequencyBands).reduce(
      (a, b) => a + b,
      0,
    );

    if (totalEnergy === 0) return 0.5;

    // Músicas acústicas têm mais energia em mid-range
    const midRatio = midEnergy / totalEnergy;
    // E geralmente menos energia overall
    const energyPenalty = energy * 0.3;

    const acousticness = Math.min(
      1,
      Math.max(0, midRatio * 1.5 - energyPenalty),
    );
    return Math.round(acousticness * 1000) / 1000;
  }

  /**
   * Estima instrumentalness (probabilidade de ser instrumental)
   */
  private estimateInstrumentalness(
    frequencyBands: FrequencyBands,
    chroma: number[],
    pitchContour: PitchPoint[],
  ): number {
    // Músicas instrumentais tendem a ter:
    // 1. Menos variação de pitch (sem vocais)
    // 2. Mais energia em frequências instrumentais

    const vocalRange = frequencyBands.mid + frequencyBands.highMid;
    const totalEnergy = Object.values(frequencyBands).reduce(
      (a, b) => a + b,
      0,
    );

    if (totalEnergy === 0) return 0.5;

    // Menos energia na faixa vocal = mais instrumental
    const nonVocalRatio = 1 - vocalRange / totalEnergy;

    // Análise do pitch contour - vocais têm mais variação
    const pitchVariance = this.calculatePitchVariance(pitchContour);
    const lowVarianceBonus = pitchVariance < 0.3 ? 0.2 : 0;

    const instrumentalness = Math.min(
      1,
      Math.max(0, nonVocalRatio * 0.8 + lowVarianceBonus),
    );
    return Math.round(instrumentalness * 1000) / 1000;
  }

  /**
   * Calcula variância do pitch
   */
  private calculatePitchVariance(pitchContour: PitchPoint[]): number {
    if (pitchContour.length < 10) return 0.5;

    const frequencies = pitchContour.map((p) => p.frequency);
    const mean = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
    const variance =
      frequencies.reduce((a, b) => a + (b - mean) ** 2, 0) / frequencies.length;

    return Math.min(1, Math.sqrt(variance) / mean);
  }

  /**
   * Estima liveness (presença de audiência)
   */
  private estimateLiveness(channelData: Float32Array): number {
    // Analisa se há ruído de fundo característico de performances ao vivo
    const windowSize = 4096;
    const noiseFloor: number[] = [];

    for (let i = 0; i < channelData.length; i += windowSize * 10) {
      let min = 1,
        max = -1;
      for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
        if (channelData[i + j] < min) min = channelData[i + j];
        if (channelData[i + j] > max) max = channelData[i + j];
      }
      // Amplitude do silêncio
      noiseFloor.push(max - min);
    }

    // Média do noise floor
    const avgNoiseFloor =
      noiseFloor.reduce((a, b) => a + b, 0) / noiseFloor.length;

    // Liveness score (alto noise floor = mais chance de ser ao vivo)
    const liveness = Math.min(1, avgNoiseFloor * 5);
    return Math.round(liveness * 1000) / 1000;
  }

  /**
   * Estima speechiness
   */
  private estimateSpeechiness(
    frequencyBands: FrequencyBands,
    chroma: number[],
  ): number {
    // Voz humana tem energia concentrada em 300-3000 Hz
    const speechRange = frequencyBands.mid + frequencyBands.highMid;
    const totalEnergy = Object.values(frequencyBands).reduce(
      (a, b) => a + b,
      0,
    );

    if (totalEnergy === 0) return 0;

    // Alta energia na faixa de fala + baixa variância harmônica = mais speech-like
    const speechRatio = speechRange / totalEnergy;

    // Análise harmônica - voz é menos harmônica que instrumentos
    const harmonicVariance = this.calculateChromaVariance(chroma);
    const speechiness = speechRatio * 0.7 + (1 - harmonicVariance) * 0.3;

    return Math.round(Math.min(1, speechiness) * 1000) / 1000;
  }

  /**
   * Calcula variância do chroma
   */
  private calculateChromaVariance(chroma: number[]): number {
    const mean = chroma.reduce((a, b) => a + b, 0) / chroma.length;
    const variance =
      chroma.reduce((a, b) => a + (b - mean) ** 2, 0) / chroma.length;
    return Math.min(1, variance * 5);
  }

  /**
   * Estima valence (positividade emocional)
   */
  private estimateValence(
    energy: number,
    danceability: number,
    mode: "major" | "minor",
    bpm: number,
  ): number {
    // Valence é mais alto para:
    // - Músicas maiores (vs menor)
    // - Maior energia
    // - BPM mais rápido
    // - Maior danceability

    const modeBonus = mode === "major" ? 0.15 : -0.1;
    const bpmBonus = bpm > 100 ? 0.1 : bpm > 80 ? 0 : -0.1;

    const valence =
      energy * 0.3 + danceability * 0.3 + modeBonus + bpmBonus + 0.35;

    return Math.round(Math.min(1, Math.max(0, valence)) * 1000) / 1000;
  }

  /**
   * Detecta compasso (time signature)
   */
  private detectTimeSignature(
    buffer: AudioBuffer,
    bpm: number,
  ): { timeSignature: number; confidence: number } {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    // Analisa padrões de acentuação
    const beatDuration = 60 / bpm; // segundos por batida
    const samplesPerBeat = Math.floor(beatDuration * sampleRate);

    // Detecta downbeats (batidas fortes)
    const beatEnergies: number[] = [];

    for (
      let beat = 0;
      beat < Math.floor(buffer.duration / beatDuration);
      beat++
    ) {
      const start = beat * samplesPerBeat;
      let energy = 0;

      for (
        let i = 0;
        i < samplesPerBeat && start + i < channelData.length;
        i++
      ) {
        energy += Math.abs(channelData[start + i]);
      }

      beatEnergies.push(energy);
    }

    // Normaliza
    const maxEnergy = Math.max(...beatEnergies);
    const normalizedEnergies = beatEnergies.map((e) => e / (maxEnergy || 1));

    // Testa diferentes compassos
    const candidates = [3, 4, 5, 6];
    let bestSignature = 4;
    let bestScore = -Infinity;

    for (const sig of candidates) {
      let score = 0;

      for (let i = 0; i < normalizedEnergies.length; i++) {
        // Primeira batida do compasso deve ser mais forte
        if (i % sig === 0) {
          score += normalizedEnergies[i] * 1.5;
        } else {
          score += normalizedEnergies[i] * 0.8;
        }
      }

      // Penaliza se não houver padrão claro
      const avgStrongBeat =
        normalizedEnergies
          .filter((_, i) => i % sig === 0)
          .reduce((a, b) => a + b, 0) /
        (normalizedEnergies.length / sig);
      const avgWeakBeat =
        normalizedEnergies
          .filter((_, i) => i % sig !== 0)
          .reduce((a, b) => a + b, 0) /
        ((normalizedEnergies.length * (sig - 1)) / sig);

      const patternStrength = avgStrongBeat / (avgWeakBeat + 0.001);
      score *= patternStrength;

      if (score > bestScore) {
        bestScore = score;
        bestSignature = sig;
      }
    }

    // Calcula confiança
    const confidence = Math.min(1, bestScore / (normalizedEnergies.length * 2));

    return { timeSignature: bestSignature, confidence };
  }

  /**
   * Detecta seções da música
   */
  private detectSections(
    buffer: AudioBuffer,
    energy: number,
    frequencyBands: FrequencyBands,
  ): MusicSection[] {
    const channelData = buffer.getChannelData(0);
    const duration = buffer.duration;

    // Divide em blocos de 10 segundos
    const blockSize = 10;
    const numBlocks = Math.ceil(duration / blockSize);

    const sections: MusicSection[] = [];

    for (let i = 0; i < numBlocks; i++) {
      const startTime = i * blockSize;
      const endTime = Math.min((i + 1) * blockSize, duration);

      // Analisa energia e frequências deste bloco
      const blockStart = Math.floor(startTime * buffer.sampleRate);
      const blockEnd = Math.floor(endTime * buffer.sampleRate);

      let blockEnergy = 0;
      let highFreqEnergy = 0;
      let lowFreqEnergy = 0;

      for (let j = blockStart; j < blockEnd; j++) {
        blockEnergy += Math.abs(channelData[j]) ** 2;
      }
      blockEnergy = Math.sqrt(blockEnergy / (blockEnd - blockStart));

      // Classifica tipo de seção
      let type: MusicSection["type"] = "unknown";

      if (i === 0) {
        type = "intro";
      } else if (i === numBlocks - 1) {
        type = "outro";
      } else if (blockEnergy > energy * 1.2) {
        type = "chorus";
      } else if (blockEnergy < energy * 0.5) {
        type = "bridge";
      } else {
        type = "verse";
      }

      sections.push({
        startTime,
        endTime,
        duration: endTime - startTime,
        type,
        confidence: 0.7,
        loudness: blockEnergy,
        tempo: 0, // Será preenchido se necessário
        key: "",
      });
    }

    return sections;
  }

  /**
   * Analisa energia por banda de frequência
   * CORRIGIDO: Retorna valores normalizados
   */
  private async analyzeFrequencyBands(
    buffer: AudioBuffer,
  ): Promise<FrequencyBands> {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const fftSize = 4096;

    const bands: FrequencyBands = {
      subBass: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      presence: 0,
      brilliance: 0,
    };

    let frameCount = 0;
    const step = channelData.length > buffer.sampleRate * 120 ? fftSize * 4 : fftSize * 2;

    for (
      let offset = 0;
      offset < channelData.length - fftSize;
      offset += step
    ) {
      const frame = new Float32Array(fftSize);
      for (let i = 0; i < fftSize && offset + i < channelData.length; i++) {
        frame[i] = channelData[offset + i];
      }

      const spectrum = this.fftSimple(frame, fftSize);

      for (let i = 1; i < spectrum.length; i++) {
        const freq = (i * sampleRate) / fftSize;
        const magnitude = spectrum[i] * spectrum[i];

        if (freq >= 20 && freq < 60) bands.subBass += magnitude;
        else if (freq >= 60 && freq < 250) bands.bass += magnitude;
        else if (freq >= 250 && freq < 500) bands.lowMid += magnitude;
        else if (freq >= 500 && freq < 2000) bands.mid += magnitude;
        else if (freq >= 2000 && freq < 4000) bands.highMid += magnitude;
        else if (freq >= 4000 && freq < 6000) bands.presence += magnitude;
        else if (freq >= 6000 && freq < 20000) bands.brilliance += magnitude;
      }
      frameCount++;
    }

    // Normalizar para 0-1
    const maxBand = Math.max(...Object.values(bands));

    for (const key of Object.keys(bands) as (keyof FrequencyBands)[]) {
      bands[key] = maxBand > 0 ? bands[key] / maxBand : 0;
    }

    return bands;
  }

  /**
   * Extrai waveform simplificado para visualização
   */
  private async extractWaveform(channelData: Float32Array): Promise<number[]> {
    const samples = 1000;
    const samplesPerPixel = Math.floor(channelData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      let max = 0;
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, channelData.length);

      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) max = abs;
      }
      waveform.push(max);
    }

    return waveform;
  }

  /**
   * Gera espectrograma para visualização
   */
  private async generateSpectrogram(buffer: AudioBuffer): Promise<number[][]> {
    const channelData = buffer.getChannelData(0);
    const fftSize = 2048;
    const hopSize = fftSize / 4;
    const numFrames = Math.floor((channelData.length - fftSize) / hopSize);

    const maxFrames = 200;
    const frameStep = Math.max(1, Math.floor(numFrames / maxFrames));

    const spectrogram: number[][] = [];

    for (let frame = 0; frame < numFrames; frame += frameStep) {
      const offset = frame * hopSize;
      const frameData = new Float32Array(fftSize);

      for (let i = 0; i < fftSize && offset + i < channelData.length; i++) {
        // Janela de Hann
        const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
        frameData[i] = channelData[offset + i] * window;
      }

      const spectrum = this.fftSimple(frameData, fftSize);
      const halfSpectrum = spectrum.slice(0, fftSize / 2);

      const normalized = halfSpectrum.map((v) =>
        Math.max(0, Math.min(1, (20 * Math.log10(v + 1e-10) + 100) / 100)),
      );

      spectrogram.push(normalized);
    }

    return spectrogram;
  }

  /**
   * Detecta picos/transients no áudio
   */
  private async detectPeaks(channelData: Float32Array): Promise<number[]> {
    const peaks: number[] = [];
    const windowSize = 1024;
    const threshold = 0.3;

    for (
      let i = windowSize;
      i < channelData.length - windowSize;
      i += windowSize
    ) {
      let localMax = 0;
      for (let j = i - windowSize / 2; j < i + windowSize / 2; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > localMax) localMax = abs;
      }

      if (localMax > threshold) {
        peaks.push(i / channelData.length);
      }
    }

    return peaks;
  }

  /**
   * Detecta acordes ao longo da música
   */
  private detectChords(chroma: number[], duration: number): ChordAnalysis[] {
    const chords: ChordAnalysis[] = [];
    const chordTemplates = this.getChordTemplates();

    let bestChord = "C";
    let bestScore = -Infinity;

    for (const [chord, template] of Object.entries(chordTemplates)) {
      let score = 0;
      for (let i = 0; i < 12; i++) {
        score += chroma[i] * template[i];
      }
      if (score > bestScore) {
        bestScore = score;
        bestChord = chord;
      }
    }

    chords.push({
      time: 0,
      chord: bestChord,
      confidence: Math.min(1, bestScore / 6),
    });

    return chords;
  }

  /**
   * Templates de acordes
   */
  private getChordTemplates(): Record<string, number[]> {
    const templates: Record<string, number[]> = {};

    for (let root = 0; root < 12; root++) {
      const major = new Array(12).fill(0);
      major[root] = 1;
      major[(root + 4) % 12] = 1;
      major[(root + 7) % 12] = 1;
      templates[`${NOTE_NAMES[root]}`] = major;

      const minor = new Array(12).fill(0);
      minor[root] = 1;
      minor[(root + 3) % 12] = 1;
      minor[(root + 7) % 12] = 1;
      templates[`${NOTE_NAMES[root]}m`] = minor;
    }

    return templates;
  }

  /**
   * Detecta notas individuais estilo Melodyne
   */
  private async detectNotes(buffer: AudioBuffer): Promise<DetectedNote[]> {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    // Hop maior para arquivos longos (evita travar - 10ms ou 30ms)
    const hopMs = channelData.length > sampleRate * 60 ? 0.03 : 0.01;
    const hopSize = Math.floor(sampleRate * hopMs);

    // Parâmetros de detecção
    const minFreq = 65; // C2
    const maxFreq = 1047; // C6
    const minNoteDuration = 0.05; // 50ms mínimo
    const amplitudeThreshold = 0.01;

    // Detecta pitch frame a frame
    const pitchFrames: { time: number; freq: number; amplitude: number }[] = [];

    for (
      let offset = 0;
      offset < channelData.length - sampleRate * 0.05;
      offset += hopSize
    ) {
      // Calcula RMS do frame
      let rms = 0;
      for (let i = 0; i < hopSize * 2 && offset + i < channelData.length; i++) {
        rms += channelData[offset + i] ** 2;
      }
      rms = Math.sqrt(rms / (hopSize * 2));

      if (rms > amplitudeThreshold) {
        // Autocorrelação para pitch detection
        const minLag = Math.floor(sampleRate / maxFreq);
        const maxLag = Math.floor(sampleRate / minFreq);

        let bestLag = minLag;
        let bestCorr = -Infinity;

        for (let lag = minLag; lag < maxLag; lag++) {
          let correlation = 0;
          for (
            let i = 0;
            i < maxLag * 2 && offset + i + lag < channelData.length;
            i++
          ) {
            correlation +=
              channelData[offset + i] * channelData[offset + i + lag];
          }

          if (correlation > bestCorr) {
            bestCorr = correlation;
            bestLag = lag;
          }
        }

        const freq = sampleRate / bestLag;

        if (freq >= minFreq && freq <= maxFreq) {
          pitchFrames.push({
            time: offset / sampleRate,
            freq,
            amplitude: rms,
          });
        }
      }
    }

    // Agrupa frames em notas
    return this.groupFramesIntoNotes(pitchFrames, minNoteDuration);
  }

  /**
   * Agrupa frames de pitch em notas individuais
   */
  private groupFramesIntoNotes(
    frames: { time: number; freq: number; amplitude: number }[],
    minDuration: number,
  ): DetectedNote[] {
    if (frames.length === 0) return [];

    const notes: DetectedNote[] = [];
    let currentNote: {
      startTime: number;
      freqs: number[];
      amplitudes: number[];
      times: number[];
    } | null = null;

    const semitoneThreshold = 0.5; // Metade de um semitom

    for (const frame of frames) {
      const midiNote = 12 * Math.log2(frame.freq / 440) + 69;
      const roundedNote = Math.round(midiNote);

      if (currentNote === null) {
        currentNote = {
          startTime: frame.time,
          freqs: [frame.freq],
          amplitudes: [frame.amplitude],
          times: [frame.time],
        };
      } else {
        const avgMidi =
          12 *
            Math.log2(
              currentNote.freqs.reduce((a, b) => a + b, 0) /
                currentNote.freqs.length /
                440,
            ) +
          69;

        // Verifica se está dentro do mesmo semitom
        if (Math.abs(midiNote - avgMidi) < semitoneThreshold) {
          currentNote.freqs.push(frame.freq);
          currentNote.amplitudes.push(frame.amplitude);
          currentNote.times.push(frame.time);
        } else {
          // Finaliza nota atual
          const note = this.createNoteFromGroup(currentNote);
          if (note && note.duration >= minDuration) {
            notes.push(note);
          }

          // Inicia nova nota
          currentNote = {
            startTime: frame.time,
            freqs: [frame.freq],
            amplitudes: [frame.amplitude],
            times: [frame.time],
          };
        }
      }
    }

    // Finaliza última nota
    if (currentNote) {
      const note = this.createNoteFromGroup(currentNote);
      if (note && note.duration >= minDuration) {
        notes.push(note);
      }
    }

    return notes;
  }

  /**
   * Cria objeto DetectedNote de um grupo de frames
   */
  private createNoteFromGroup(group: {
    startTime: number;
    freqs: number[];
    amplitudes: number[];
    times: number[];
  }): DetectedNote | null {
    if (group.freqs.length === 0) return null;

    const avgFreq = group.freqs.reduce((a, b) => a + b, 0) / group.freqs.length;
    const avgAmplitude =
      group.amplitudes.reduce((a, b) => a + b, 0) / group.amplitudes.length;
    const endTime = group.times[group.times.length - 1] + 0.01;

    const midiNote = 12 * Math.log2(avgFreq / 440) + 69;
    const roundedMidi = Math.round(midiNote);
    const cents = Math.round((midiNote - roundedMidi) * 100);

    const noteName = NOTE_NAMES[roundedMidi % 12];
    const octave = Math.floor(roundedMidi / 12) - 1;

    // Detecta vibrato
    const vibrato = this.detectVibrato(group.freqs);

    return {
      id: 0,
      startTime: group.startTime,
      endTime,
      duration: endTime - group.startTime,
      pitch: avgFreq,
      midiNote: roundedMidi,
      noteName,
      octave,
      velocity: Math.min(1, avgAmplitude * 5),
      confidence: 0.7,
      vibrato: vibrato.hasVibrato,
      vibratoRate: vibrato.rate,
      vibratoDepth: vibrato.depth,
    };
  }

  /**
   * Detecta vibrato em uma sequência de frequências
   */
  private detectVibrato(freqs: number[]): {
    hasVibrato: boolean;
    rate: number;
    depth: number;
  } {
    if (freqs.length < 20) {
      return { hasVibrato: false, rate: 0, depth: 0 };
    }

    // Calcula variações
    const avgFreq = freqs.reduce((a, b) => a + b, 0) / freqs.length;
    const variations = freqs.map((f) => (f - avgFreq) / avgFreq);

    // Conta cruzamentos de zero
    let crossings = 0;
    for (let i = 1; i < variations.length; i++) {
      if (
        (variations[i] >= 0 && variations[i - 1] < 0) ||
        (variations[i] < 0 && variations[i - 1] >= 0)
      ) {
        crossings++;
      }
    }

    // Taxa de vibrato (Hz)
    const duration = freqs.length * 0.01; // duração em segundos
    const rate = crossings / (2 * duration);

    // Profundidade em cents
    const maxDev = Math.max(...variations.map(Math.abs));
    const depth = Math.abs(Math.round(1200 * Math.log2(1 + maxDev)));

    return {
      hasVibrato: rate >= 4 && rate <= 8 && depth >= 20,
      rate,
      depth,
    };
  }

  /**
   * Analisa perfil de mix (estéreo, transientes, reverb, EQ)
   */
  private async analyzeMixProfile(
    buffer: AudioBuffer,
    channelData: Float32Array,
  ): Promise<MixProfile> {
    const sampleRate = buffer.sampleRate;
    const duration = buffer.duration;

    // Estéreo (só se tiver 2 canais)
    let stereoWidth = 0;
    let stereoCorrelation = 1;
    if (buffer.numberOfChannels >= 2) {
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      const n = Math.min(left.length, right.length);
      let sumL = 0,
        sumR = 0,
        sumLR = 0,
        sumL2 = 0,
        sumR2 = 0;
      const step = Math.max(1, Math.floor(n / 10000));
      for (let i = 0; i < n; i += step) {
        sumL += left[i];
        sumR += right[i];
        sumLR += left[i] * right[i];
        sumL2 += left[i] * left[i];
        sumR2 += right[i] * right[i];
      }
      const count = Math.floor(n / step);
      const corr =
        (count * sumLR - sumL * sumR) /
        (Math.sqrt(count * sumL2 - sumL * sumL) *
          Math.sqrt(count * sumR2 - sumR * sumR) + 1e-10);
      stereoCorrelation = Math.max(-1, Math.min(1, corr));
      stereoWidth = Math.max(0, 1 - stereoCorrelation);
    }

    // Transientes (envelope)
    const windowSize = Math.floor(sampleRate * 0.01);
    const rmsEnvelope: number[] = [];
    for (let i = 0; i < channelData.length; i += windowSize) {
      let sum = 0;
      for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
        sum += channelData[i + j] ** 2;
      }
      rmsEnvelope.push(Math.sqrt(sum / windowSize));
    }
    const threshold = Math.max(...rmsEnvelope) * 0.1;
    const attacks: number[] = [];
    const releases: number[] = [];
    let inTransient = false;
    let startIdx = 0;
    for (let i = 1; i < rmsEnvelope.length; i++) {
      if (rmsEnvelope[i] > threshold && !inTransient) {
        inTransient = true;
        startIdx = i;
      } else if (rmsEnvelope[i] < threshold && inTransient) {
        inTransient = false;
        const attackSamples = Math.min(10, i - startIdx);
        const releaseSamples = i - startIdx - attackSamples;
        attacks.push((attackSamples * windowSize * 1000) / sampleRate);
        releases.push((releaseSamples * windowSize * 1000) / sampleRate);
      }
    }
    const transientAttack =
      attacks.length > 0
        ? attacks.reduce((a, b) => a + b, 0) / attacks.length
        : 5;
    const transientRelease =
      releases.length > 0
        ? releases.reduce((a, b) => a + b, 0) / releases.length
        : 50;
    const transientDensity = Math.min(
      1,
      (attacks.length / (duration * 10)) * 2,
    );

    // Reverb (decay no final)
    const tailStart = Math.floor(channelData.length * 0.9);
    const tailSamples = channelData.length - tailStart;
    let decayEnergy = 0;
    for (let i = tailStart; i < channelData.length; i++) {
      decayEnergy += channelData[i] ** 2;
    }
    const avgTailEnergy = decayEnergy / tailSamples;
    const reverbTail = Math.min(5, (tailSamples / sampleRate) * 2);
    const reverbDensity = Math.min(1, avgTailEnergy * 20);

    // EQ curve (24 bandas, 20Hz-20kHz log)
    const eqBands = 24;
    const eqCurve = new Array(eqBands).fill(0);
    const fftSize = 4096;
    const bandCounts = new Array(eqBands).fill(0);
    const minFreq = 20;
    const maxFreq = 20000;

    for (
      let offset = 0;
      offset < channelData.length - fftSize;
      offset += fftSize * 2
    ) {
      const frame = channelData.slice(offset, offset + fftSize);
      const spectrum = this.fftSimple(frame, fftSize);

      for (let i = 1; i < spectrum.length; i++) {
        const freq = (i * sampleRate) / fftSize;
        if (freq < minFreq || freq > maxFreq) continue;
        const bandIdx = Math.floor(
          (Math.log(freq / minFreq) / Math.log(maxFreq / minFreq)) * eqBands,
        );
        const safeBand = Math.min(eqBands - 1, Math.max(0, bandIdx));
        eqCurve[safeBand] += spectrum[i] * spectrum[i];
        bandCounts[safeBand]++;
      }
    }
    const maxEq = Math.max(...eqCurve, 0.001);
    for (let i = 0; i < eqBands; i++) {
      eqCurve[i] = bandCounts[i] > 0 ? eqCurve[i] / maxEq : 0;
    }

    return {
      stereoWidth,
      stereoCorrelation,
      transientAttack: Math.round(transientAttack),
      transientRelease: Math.round(transientRelease),
      transientDensity,
      reverbTail: Math.round(reverbTail * 10) / 10,
      reverbDensity,
      eqCurve,
    };
  }

  /**
   * Extrai contour de pitch (para visualização)
   */
  private async extractPitchContour(
    buffer: AudioBuffer,
  ): Promise<PitchPoint[]> {
    const notes = await this.detectNotes(buffer);

    return notes.map((note) => ({
      time: note.startTime,
      frequency: note.pitch,
      note: note.noteName,
      midiNote: note.midiNote,
      cents: note.midiNote - Math.round(note.midiNote),
      confidence: note.confidence,
    }));
  }

  /**
   * Analisa música completa a partir de stems (voz + instrumental)
   * Combina os dois e retorna análise do mix resultante
   */
  async analyzeStems(
    vocalFile: File,
    instrumentalFile: File,
    onProgress?: (progress: number, status?: string) => void,
    onLog?: (msg: string) => void,
  ): Promise<AudioAnalysisResult> {
    const log = (msg: string) => {
      const line = `${new Date().toLocaleTimeString()} - ${msg}`;
      console.log(`[Music Analyzer] ${line}`);
      onLog?.(line);
    };

    log("Carregando stems (voz + instrumental)...");
    onProgress?.(5, "Carregando vocal...");

    const [vocalBuffer, instrumentalBuffer] = await Promise.all([
      this.loadAudioFile(vocalFile, onProgress, onLog),
      (async () => {
        onProgress?.(10, "Carregando instrumental...");
        return this.loadAudioFile(instrumentalFile, undefined, onLog);
      })(),
    ]);

    log("Combinando stems...");
    onProgress?.(20, "Combinando áudio...");

    const sampleRate = vocalBuffer.sampleRate;
    const duration = Math.min(
      vocalBuffer.duration,
      instrumentalBuffer.duration,
    );
    const length = Math.floor(duration * sampleRate);

    const combinedBuffer = this.audioContext!.createBuffer(
      2,
      length,
      sampleRate,
    );

    const vocalL = vocalBuffer.getChannelData(0);
    const instrumentalL = instrumentalBuffer.getChannelData(0);
    const outL = combinedBuffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const v = i < vocalL.length ? vocalL[i] : 0;
      const inst = i < instrumentalL.length ? instrumentalL[i] : 0;
      outL[i] = Math.max(-1, Math.min(1, (v + inst) * 0.5));
    }

    if (combinedBuffer.numberOfChannels >= 2) {
      const vocalR =
        vocalBuffer.numberOfChannels >= 2
          ? vocalBuffer.getChannelData(1)
          : vocalL;
      const instrumentalR =
        instrumentalBuffer.numberOfChannels >= 2
          ? instrumentalBuffer.getChannelData(1)
          : instrumentalL;
      const outR = combinedBuffer.getChannelData(1);
      for (let i = 0; i < length; i++) {
        const v = i < vocalR.length ? vocalR[i] : 0;
        const inst = i < instrumentalR.length ? instrumentalR[i] : 0;
        outR[i] = Math.max(-1, Math.min(1, (v + inst) * 0.5));
      }
    }

    log("Analisando mix combinado...");
    return this.analyzeFromBuffer(
      combinedBuffer,
      `Voz+Instrumental (${vocalFile.name})`,
      onProgress,
      onLog,
    );
  }
}

// Instância singleton
export const audioAnalyzer = new AudioAnalyzer();
