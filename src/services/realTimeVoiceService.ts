/**
 * Unified Real-Time Voice Assistant Engine (Single ChatGPT-Style Voice System)
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 *
 * Primary Mode: Full-duplex Gemini Live API WebSocket (/api/live-voice -> gemini-3.8-live)
 *   - 16kHz PCM microphone streaming with echoCancellation & noiseSuppression
 *   - 24kHz gapless PCM audio playback with instant barge-in interruption
 *   - Server + local VAD turn-taking & live streaming transcription
 *   - Native tool execution across all 4 Explore sections, 16 core features, & 10 regions
 *
 * Unified Fallback Mode: Context-aware /api/ai/voice-assistant + Gemini TTS (/api/ai/voice-tts)
 *   - Engages automatically if Live WebSocket or API key is unavailable
 *   - Single Web SpeechRecognition loop (never runs simultaneously with Live WS mic stream)
 */

import {
  VoiceOrbState,
  VoicePersonaConfig,
  VoicePersonaId,
  LiveVoiceTranscriptTurn,
  MapRegionId,
  MapMode,
  UserRole,
  ExplorationSectionId,
} from '../types';

export type VoiceConnectionMode = 'LIVE_WS' | 'HYBRID_FALLBACK' | 'TEXT_ONLY';

export const VOICE_PERSONAS: Record<VoicePersonaId, VoicePersonaConfig> = {
  ares_commander: {
    id: 'ares_commander',
    name: 'ARES Commander',
    role: 'Flight Operations & Mission Control',
    pitch: 0.95,
    rate: 1.02,
    voiceGender: 'male',
    geminiVoiceName: 'Fenrir',
    description: 'Crisp, confident military-scientific command voice.',
  },
  dr_elena: {
    id: 'dr_elena',
    name: 'Dr. Elena Rostova',
    role: 'Planetary Geologist & Astrobiologist',
    pitch: 1.1,
    rate: 1.0,
    voiceGender: 'female',
    geminiVoiceName: 'Kore',
    description: 'Articulate, inquisitive scientific specialist voice.',
  },
  mark_vance: {
    id: 'mark_vance',
    name: 'Cmdr. Mark Vance',
    role: 'EVA Safety & Consumables Officer',
    pitch: 0.88,
    rate: 0.96,
    voiceGender: 'male',
    geminiVoiceName: 'Charon',
    description: 'Calm, measured safety and environmental advisory voice.',
  },
  ares_synth: {
    id: 'ares_synth',
    name: 'ARES Synth-X',
    role: 'Autonomous AI Copilot Engine',
    pitch: 1.0,
    rate: 1.12,
    voiceGender: 'synth',
    geminiVoiceName: 'Zephyr',
    description: 'High-speed synthetic telemetry AI dispatch.',
  },
};

export interface VoiceActionPayload {
  action:
    | 'SET_REGION'
    | 'SET_MAP_MODE'
    | 'SET_USER_ROLE'
    | 'SET_SECTION'
    | 'SET_TAB'
    | 'TRIGGER_EMERGENCY_ABORT'
    | 'RECALCULATE_ROUTES'
    | 'SET_SPEECH_PACE'
    | 'EXIT_VOICE'
    | 'UNKNOWN';
  regionId?: MapRegionId;
  mapMode?: MapMode;
  userRole?: UserRole;
  sectionId?: ExplorationSectionId;
  tabId?: string;
  speechRate?: number;
  description?: string;
}

export interface VoiceAppContext {
  currentRegion: MapRegionId;
  currentSection: ExplorationSectionId;
  currentTab: string;
}

function downsampleTo16kInt16(float32: Float32Array, inputSampleRate: number): Int16Array {
  if (inputSampleRate === 16000) {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  const ratio = inputSampleRate / 16000;
  const outputLength = Math.floor(float32.length / ratio);
  const out = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(float32.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += float32[j];
      count++;
    }
    const avg = count > 0 ? sum / count : float32[start] || 0;
    const clamped = Math.max(-1, Math.min(1, avg));
    out[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return out;
}

function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function createAudioContextSafe(preferredSampleRate: number): AudioContext {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API (AudioContext) is not supported in this browser.');
  }
  try {
    return new AudioContextClass({ sampleRate: preferredSampleRate });
  } catch (_err) {
    // Mobile/Bluetooth/locked hardware drivers often reject custom sample rates; use native device rate and resample cleanly
    return new AudioContextClass();
  }
}

function encodePcm16ToWavBase64(chunks: Int16Array[], sampleRate: number = 16000): string {
  let totalSamples = 0;
  for (const chunk of chunks) {
    totalSamples += chunk.length;
  }
  const dataBytes = totalSamples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      view.setInt16(offset, chunk[i], true);
      offset += 2;
    }
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

export class RealTimeVoiceEngine {
  private mediaStream: MediaStream | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private recognition: any = null;
  private ws: WebSocket | null = null;

  private activeSources = new Set<AudioBufferSourceNode>();
  private activeHtmlAudio: HTMLAudioElement | null = null;
  private activeObjectUrl: string | null = null;
  private nextStartTime = 0;

  private currentPersona: VoicePersonaConfig = VOICE_PERSONAS.ares_commander;
  private appContext: VoiceAppContext = {
    currentRegion: 'jezero',
    currentSection: 'HOME',
    currentTab: 'LOCATIONS',
  };

  private isActive = false;
  private isListening = false;
  private isSpeaking = false;
  private isMuted = false;
  private speechPaceRate = 1.0;
  private connectionMode: VoiceConnectionMode = 'HYBRID_FALLBACK';

  private vadBargeInFrames = 0;
  private vadAnimId: number | null = null;

  // Live WS & Fallback PCM VAD utterance tracking
  private liveSpeechFrames = 0;
  private liveSilenceMs = 0;
  private liveAwaitingResponseTimer: number | null = null;

  private usePcmVadFallback = false;
  private fallbackSpeechChunks: Int16Array[] = [];
  private fallbackPreRollChunks: Int16Array[] = [];
  private fallbackIsRecordingSpeech = false;
  private fallbackSilenceMs = 0;
  private isTranscribingFallback = false;

  // Autoplay / blocked audio recovery
  private playbackBlocked = false;
  private pendingBlockedWav: string | null = null;
  private pendingBlockedPcmChunks: string[] = [];

  private activeInputTurnId: string | null = null;
  private activeInputText = '';
  private activeOutputTurnId: string | null = null;
  private activeOutputText = '';
  private transcriptHistory: LiveVoiceTranscriptTurn[] = [];

  private onStateChange?: (state: VoiceOrbState) => void;
  private onAudioLevel?: (level: number) => void;
  private onTranscriptTurn?: (turn: LiveVoiceTranscriptTurn, mode?: 'append' | 'upsert') => void;
  private onExecuteAction?: (payload: VoiceActionPayload) => void;
  private onErrorMsg?: (err: string | null) => void;
  private onConnectionModeChange?: (mode: VoiceConnectionMode) => void;
  private onPlaybackBlockedChange?: (blocked: boolean) => void;

  constructor(handlers: {
    onStateChange?: (state: VoiceOrbState) => void;
    onAudioLevel?: (level: number) => void;
    onTranscriptTurn?: (turn: LiveVoiceTranscriptTurn, mode?: 'append' | 'upsert') => void;
    onExecuteAction?: (payload: VoiceActionPayload) => void;
    onErrorMsg?: (err: string | null) => void;
    onConnectionModeChange?: (mode: VoiceConnectionMode) => void;
    onPlaybackBlockedChange?: (blocked: boolean) => void;
  }) {
    this.onStateChange = handlers.onStateChange;
    this.onAudioLevel = handlers.onAudioLevel;
    this.onTranscriptTurn = handlers.onTranscriptTurn;
    this.onExecuteAction = handlers.onExecuteAction;
    this.onErrorMsg = handlers.onErrorMsg;
    this.onConnectionModeChange = handlers.onConnectionModeChange;
    this.onPlaybackBlockedChange = handlers.onPlaybackBlockedChange;
  }

  public setAppContext(ctx: Partial<VoiceAppContext>) {
    this.appContext = { ...this.appContext, ...ctx };
  }

  public setPersona(personaId: VoicePersonaId) {
    if (VOICE_PERSONAS[personaId]) {
      const changed = this.currentPersona.id !== personaId;
      this.currentPersona = VOICE_PERSONAS[personaId];
      if (changed && this.isActive && this.connectionMode === 'LIVE_WS') {
        this.reconnectLiveWs();
      }
    }
  }

  public getPersona(): VoicePersonaConfig {
    return this.currentPersona;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAllPlayback();
      this.resetVadCaptureBuffers();
      this.onAudioLevel?.(0);
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (_e) {}
      }
      this.onStateChange?.('IDLE');
    } else if (this.isActive) {
      this.unlockAudio();
      if (this.connectionMode === 'HYBRID_FALLBACK' && this.mediaStream && !this.usePcmVadFallback) {
        this.startFallbackRecognition();
      }
      this.onStateChange?.(this.mediaStream ? 'LISTENING' : 'IDLE');
    }
  }

  private setConnectionMode(mode: VoiceConnectionMode) {
    this.connectionMode = mode;
    this.onConnectionModeChange?.(mode);
  }

  private setPlaybackBlocked(blocked: boolean) {
    if (this.playbackBlocked !== blocked) {
      this.playbackBlocked = blocked;
      this.onPlaybackBlockedChange?.(blocked);
    }
  }

  private emitTurn(turn: LiveVoiceTranscriptTurn, mode: 'append' | 'upsert' = 'append') {
    if (mode === 'upsert') {
      const idx = this.transcriptHistory.findIndex((t) => t.id === turn.id);
      if (idx >= 0) {
        this.transcriptHistory[idx] = turn;
      } else {
        this.transcriptHistory.push(turn);
      }
    } else {
      this.transcriptHistory.push(turn);
    }
    if (this.transcriptHistory.length > 40) {
      this.transcriptHistory = this.transcriptHistory.slice(-40);
    }
    this.onTranscriptTurn?.(turn, mode);
  }

  private speechKeepAliveTimer: number | null = null;
  private isRecognitionPausedForSpeech = false;

  public unlockAudio(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
        this.outputAudioCtx = createAudioContextSafe(24000);
        this.nextStartTime = this.outputAudioCtx.currentTime;
      }
      if (this.outputAudioCtx.state === 'suspended') {
        void this.outputAudioCtx.resume().then(() => {
          if (this.outputAudioCtx?.state === 'running') {
            this.flushPendingBlockedAudio();
          }
        }).catch(() => {});
      }
      // Play a 1-sample silent buffer synchronously inside user interaction to permanently unlock WebAudio on iOS/Android/Chrome
      const silent = this.outputAudioCtx.createBuffer(1, 1, this.outputAudioCtx.sampleRate || 24000);
      const src = this.outputAudioCtx.createBufferSource();
      src.buffer = silent;
      src.connect(this.outputAudioCtx.destination);
      src.start(0);

      if (this.outputAudioCtx.state === 'running') {
        this.flushPendingBlockedAudio();
        return true;
      }
      return false;
    } catch (_e) {
      return false;
    }
  }

  private flushPendingBlockedAudio() {
    this.setPlaybackBlocked(false);
    if (this.pendingBlockedWav) {
      const wav = this.pendingBlockedWav;
      this.pendingBlockedWav = null;
      void this.playWavBase64(wav);
      return;
    }
    if (this.pendingBlockedPcmChunks.length > 0) {
      const chunks = this.pendingBlockedPcmChunks.splice(0);
      for (const chunk of chunks) {
        void this.playPcm24kChunk(chunk);
      }
    }
  }

  public async startEngine(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    this.stopEngine();

    this.isActive = true;
    this.isMuted = false;
    this.onErrorMsg?.(null);
    this.unlockAudio();

    const micOk = await this.initMicrophone();
    await this.initOutputAudioContext();

    if (micOk) {
      this.isListening = true;
      this.onStateChange?.('LISTENING');
    } else {
      this.isListening = false;
      this.onStateChange?.('ERROR');
    }

    // Always connect Gemini Live WS (or fallback) so typed/quick responses still speak aloud
    this.connectLiveWs();
    return micOk;
  }

  public async retryMicrophone(): Promise<boolean> {
    if (!this.isActive) {
      return this.startEngine();
    }
    this.onErrorMsg?.(null);
    const micOk = await this.initMicrophone();
    if (micOk) {
      this.isListening = true;
      this.isMuted = false;
      this.onStateChange?.('LISTENING');
      this.connectLiveWs();
      return true;
    }
    this.onStateChange?.('ERROR');
    return false;
  }

  private resetVadCaptureBuffers() {
    this.liveSpeechFrames = 0;
    this.liveSilenceMs = 0;
    this.fallbackSpeechChunks = [];
    this.fallbackPreRollChunks = [];
    this.fallbackIsRecordingSpeech = false;
    this.fallbackSilenceMs = 0;
    if (this.liveAwaitingResponseTimer !== null) {
      window.clearTimeout(this.liveAwaitingResponseTimer);
      this.liveAwaitingResponseTimer = null;
    }
  }

  private async initMicrophone(): Promise<boolean> {
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      window.location.hostname !== '::1'
    ) {
      this.onErrorMsg?.(
        'Insecure context detected: Microphone access requires HTTPS. Deployed apps and WebViews must be served over HTTPS for getUserMedia to function.'
      );
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onErrorMsg?.(
        'Microphone API unavailable in this browser or app container. Check app permissions in Android/iOS settings or type commands below.'
      );
      return false;
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions
          .query({ name: 'microphone' as PermissionName })
          .catch(() => null);
        if (status && status.state === 'denied') {
          this.onErrorMsg?.(
            'Microphone permission is blocked in browser settings. Enable Microphone access in your browser/site settings, then tap Retry Mic.'
          );
          return false;
        }
      }
    } catch (_e) {}

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
      } catch (constraintErr: any) {
        if (constraintErr?.name === 'OverconstrainedError' || constraintErr?.name === 'NotReadableError') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          throw constraintErr;
        }
      }

      if (!this.isActive) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }

      this.mediaStream = stream;
      const primaryTrack = stream.getAudioTracks()[0];
      if (primaryTrack) {
        primaryTrack.onended = () => {
          if (this.isActive && !this.isMuted) {
            this.isListening = false;
            this.onErrorMsg?.(
              'Microphone audio stream ended unexpectedly (device disconnected or interrupted). Tap Retry Mic to reconnect.'
            );
            this.onStateChange?.('ERROR');
          }
        };
      }

      const inputCtx = createAudioContextSafe(16000);
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume().catch(() => {});
      }
      this.inputAudioCtx = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      this.analyser = inputCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // Detect mobile/non-Chromium environments where holding getUserMedia conflicts with SpeechRecognition
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isMobileOrWebKit = /Android|iPhone|iPad|iPod|Mobile|Firefox/i.test(ua);
      const hasSpeechRecognition =
        typeof window !== 'undefined' &&
        Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      this.usePcmVadFallback = isMobileOrWebKit || !hasSpeechRecognition;

      // 16kHz Int16 PCM capture for Gemini Live WebSocket AND universal WAV fallback transcription
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      const chunkDurationMs = (4096 / (inputCtx.sampleRate || 48000)) * 1000;

      processor.onaudioprocess = (event) => {
        if (!this.isActive || this.isMuted) return;

        const channelData = event.inputBuffer.getChannelData(0);
        let sqSum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sqSum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sqSum / (channelData.length || 1));
        const pcm16 = downsampleTo16kInt16(channelData, inputCtx.sampleRate);

        if (this.connectionMode === 'LIVE_WS' && this.ws && this.ws.readyState === WebSocket.OPEN) {
          const base64 = int16ToBase64(pcm16);
          try {
            this.ws.send(JSON.stringify({ type: 'audio', data: base64 }));
          } catch (_e) {}

          if (!this.isSpeaking) {
            if (rms > 0.016) {
              this.liveSpeechFrames++;
              this.liveSilenceMs = 0;
            } else if (this.liveSpeechFrames > 0) {
              this.liveSilenceMs += chunkDurationMs;
              if (this.liveSilenceMs >= 950) {
                if (this.liveSpeechFrames >= 3) {
                  try {
                    this.ws.send(JSON.stringify({ type: 'audio_stream_end' }));
                    this.startLiveResponseWatchdog();
                  } catch (_e) {}
                }
                this.liveSpeechFrames = 0;
                this.liveSilenceMs = 0;
              }
            }
          } else {
            this.liveSpeechFrames = 0;
            this.liveSilenceMs = 0;
          }
          return;
        }

        // Universal server-assisted PCM WAV transcription when in HYBRID_FALLBACK without browser SpeechRecognition
        if (
          this.connectionMode === 'HYBRID_FALLBACK' &&
          this.usePcmVadFallback &&
          !this.isSpeaking &&
          !this.isTranscribingFallback
        ) {
          if (rms > 0.018) {
            if (!this.fallbackIsRecordingSpeech) {
              this.fallbackIsRecordingSpeech = true;
              this.fallbackSpeechChunks = [...this.fallbackPreRollChunks];
              this.fallbackPreRollChunks = [];
            }
            this.fallbackSpeechChunks.push(pcm16);
            this.fallbackSilenceMs = 0;
          } else if (this.fallbackIsRecordingSpeech) {
            this.fallbackSpeechChunks.push(pcm16);
            this.fallbackSilenceMs += chunkDurationMs;
            const totalSamples = this.fallbackSpeechChunks.reduce((acc, c) => acc + c.length, 0);
            if (this.fallbackSilenceMs >= 1050 || totalSamples >= 16000 * 14) {
              const captured = this.fallbackSpeechChunks.splice(0);
              this.fallbackIsRecordingSpeech = false;
              this.fallbackSilenceMs = 0;
              if (totalSamples >= 4000) {
                void this.transcribeCapturedPcmUtterance(captured);
              }
            }
          } else {
            this.fallbackPreRollChunks.push(pcm16);
            if (this.fallbackPreRollChunks.length > 3) {
              this.fallbackPreRollChunks.shift();
            }
          }
        }
      };

      const silentGain = inputCtx.createGain();
      silentGain.gain.value = 0;
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(inputCtx.destination);
      this.processorNode = processor;

      this.runVADLoop();
      return true;
    } catch (micErr: any) {
      const name = micErr?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        this.onErrorMsg?.(
          'Microphone permission was denied. On mobile/desktop browsers, tap the address bar lock icon to allow microphone access, then click Retry Mic. For installed mobile apps / WebViews, ensure RECORD_AUDIO is granted in app settings.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        this.onErrorMsg?.(
          'No microphone hardware detected. Connect a microphone or continue using typed commands and quick prompts.'
        );
      } else {
        this.onErrorMsg?.(
          `Microphone unavailable (${micErr?.message || 'hardware busy or restricted in WebView'}). Click Retry Mic or use typed prompts below.`
        );
      }
      return false;
    }
  }

  private startLiveResponseWatchdog() {
    if (this.liveAwaitingResponseTimer !== null) {
      window.clearTimeout(this.liveAwaitingResponseTimer);
    }
    this.liveAwaitingResponseTimer = window.setTimeout(() => {
      this.liveAwaitingResponseTimer = null;
      if (this.isActive && this.connectionMode === 'LIVE_WS' && !this.isSpeaking) {
        // Live session went silent/unresponsive after user spoke; switch cleanly to HYBRID_FALLBACK
        this.engageHybridFallback();
      }
    }, 9000);
  }

  private clearLiveResponseWatchdog() {
    if (this.liveAwaitingResponseTimer !== null) {
      window.clearTimeout(this.liveAwaitingResponseTimer);
      this.liveAwaitingResponseTimer = null;
    }
  }

  private async transcribeCapturedPcmUtterance(chunks: Int16Array[]) {
    if (!this.isActive || this.isMuted || this.isTranscribingFallback) return;
    this.isTranscribingFallback = true;
    this.onStateChange?.('THINKING');

    try {
      const wavBase64 = encodePcm16ToWavBase64(chunks, 16000);
      const res = await fetch('/api/ai/voice-transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: wavBase64, mimeType: 'audio/wav' }),
      });

      if (res.ok) {
        const data = await res.json();
        const transcript = (data.transcript || '').trim();
        if (transcript && this.isActive && !this.isMuted) {
          this.isTranscribingFallback = false;
          await this.handleUserSpokenInput(transcript);
          return;
        }
      }
    } catch (_err) {
      // Ignore transient transcription error and return to listening
    }

    this.isTranscribingFallback = false;
    if (this.isActive && !this.isMuted && !this.isSpeaking) {
      this.onStateChange?.(this.mediaStream ? 'LISTENING' : 'IDLE');
    }
  }

  private async initOutputAudioContext() {
    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') return;
    try {
      const outCtx = createAudioContextSafe(24000);
      if (outCtx.state === 'suspended') {
        await outCtx.resume().catch(() => {});
      }
      this.outputAudioCtx = outCtx;
      this.nextStartTime = outCtx.currentTime;
    } catch (_e) {}
  }

  private connectLiveWs() {
    if (typeof window === 'undefined' || !this.isActive) return;

    if (this.ws) {
      try {
        this.ws.close();
      } catch (_e) {}
      this.ws = null;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams({
      voice: this.currentPersona.geminiVoiceName,
      persona: this.currentPersona.name,
      region: this.appContext.currentRegion,
      section: this.appContext.currentSection,
    });
    const wsUrl = `${proto}//${window.location.host}/api/live-voice?${params.toString()}`;

    let settled = false;
    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      const connectTimeout = window.setTimeout(() => {
        if (!settled && this.isActive) {
          settled = true;
          try {
            ws.close();
          } catch (_e) {}
          this.engageHybridFallback();
        }
      }, 7000);

      ws.onopen = () => {
        // Wait for live_ready (after upstream setupComplete) or live_fallback from server
      };

      ws.onmessage = (evt) => {
        if (!this.isActive) return;
        let msg: any;
        try {
          msg = JSON.parse(evt.data);
        } catch (_e) {
          return;
        }

        if (msg.type === 'live_ready') {
          settled = true;
          window.clearTimeout(connectTimeout);
          this.stopFallbackRecognition();
          this.resetVadCaptureBuffers();
          this.setConnectionMode('LIVE_WS');
          if (!this.isMuted && !this.isSpeaking) {
            this.onStateChange?.(this.mediaStream ? 'LISTENING' : 'IDLE');
          }
          return;
        }

        if (msg.type === 'live_fallback') {
          settled = true;
          window.clearTimeout(connectTimeout);
          try {
            ws.close();
          } catch (_e) {}
          this.engageHybridFallback();
          return;
        }

        if (msg.type === 'input_transcript' && msg.text) {
          this.clearLiveResponseWatchdog();
          if (!this.activeInputTurnId) {
            this.activeInputTurnId = `usr_${Date.now()}`;
            this.activeInputText = '';
          }
          this.activeInputText = `${this.activeInputText}${msg.text}`.trimStart();
          this.emitTurn(
            {
              id: this.activeInputTurnId,
              sender: 'user',
              text: this.activeInputText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            'upsert'
          );
          if (!this.isSpeaking) {
            this.onStateChange?.('THINKING');
          }
          return;
        }

        if (msg.type === 'output_transcript' && msg.text) {
          this.clearLiveResponseWatchdog();
          // Finalize user turn once assistant begins speaking
          this.activeInputTurnId = null;
          this.activeInputText = '';

          if (!this.activeOutputTurnId) {
            this.activeOutputTurnId = `ai_${Date.now()}`;
            this.activeOutputText = '';
          }
          this.activeOutputText = `${this.activeOutputText}${msg.text}`;
          this.emitTurn(
            {
              id: this.activeOutputTurnId,
              sender: 'assistant',
              text: this.activeOutputText.trim(),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            'upsert'
          );
          return;
        }

        if (msg.type === 'audio' && msg.data) {
          this.clearLiveResponseWatchdog();
          if (!this.isMuted) {
            void this.playPcm24kChunk(msg.data);
          }
          return;
        }

        if (msg.type === 'interrupted') {
          this.clearLiveResponseWatchdog();
          this.handleServerOrLocalInterrupt();
          return;
        }

        if (msg.type === 'turn_complete') {
          this.clearLiveResponseWatchdog();
          this.activeInputTurnId = null;
          this.activeInputText = '';
          this.activeOutputTurnId = null;
          this.activeOutputText = '';
          if (this.activeSources.size === 0 && !this.isMuted) {
            this.isSpeaking = false;
            this.onStateChange?.(this.mediaStream ? 'LISTENING' : 'IDLE');
          }
          return;
        }

        if (msg.type === 'tool_action' && msg.payload) {
          this.clearLiveResponseWatchdog();
          const payload = msg.payload as VoiceActionPayload;
          this.onExecuteAction?.(payload);
          if (this.activeOutputTurnId && payload.description) {
            this.emitTurn(
              {
                id: this.activeOutputTurnId,
                sender: 'assistant',
                text: this.activeOutputText.trim() || payload.description,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                actionExecuted: payload.description,
              },
              'upsert'
            );
          }
          return;
        }
      };

      ws.onerror = () => {
        if (!settled && this.isActive) {
          settled = true;
          window.clearTimeout(connectTimeout);
          this.engageHybridFallback();
        }
      };

      ws.onclose = () => {
        window.clearTimeout(connectTimeout);
        this.clearLiveResponseWatchdog();
        if (this.isActive && this.connectionMode === 'LIVE_WS') {
          this.engageHybridFallback();
        }
      };
    } catch (_err) {
      this.engageHybridFallback();
    }
  }

  private reconnectLiveWs() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_e) {}
      this.ws = null;
    }
    this.connectLiveWs();
  }

  private engageHybridFallback() {
    if (!this.isActive) return;
    this.clearLiveResponseWatchdog();
    if (this.mediaStream) {
      this.setConnectionMode('HYBRID_FALLBACK');
      if (!this.usePcmVadFallback) {
        this.startFallbackRecognition();
      }
      if (!this.isSpeaking && !this.isMuted) {
        this.onStateChange?.('LISTENING');
      }
    } else {
      // Even without mic, keep TTS audio enabled for typed/quick responses
      this.setConnectionMode('TEXT_ONLY');
    }
  }

  private pauseFallbackRecognition() {
    if (this.recognition) {
      this.isRecognitionPausedForSpeech = true;
      try {
        this.recognition.stop();
      } catch (_e) {}
    }
  }

  private resumeFallbackRecognition() {
    if (!this.isActive || this.isMuted || this.connectionMode !== 'HYBRID_FALLBACK') return;
    this.isRecognitionPausedForSpeech = false;
    if (this.usePcmVadFallback) return;
    if (this.recognition) {
      setTimeout(() => {
        if (!this.isActive || this.isMuted || this.isSpeaking || this.connectionMode !== 'HYBRID_FALLBACK') return;
        try {
          this.recognition?.start();
        } catch (_e) {}
      }, 220);
    } else if (this.mediaStream) {
      this.startFallbackRecognition();
    }
  }

  private startFallbackRecognition() {
    if (!this.isActive || this.isMuted || this.connectionMode !== 'HYBRID_FALLBACK') return;
    if (this.usePcmVadFallback || this.recognition) return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      this.usePcmVadFallback = true;
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      if (this.isActive && !this.isMuted && !this.isSpeaking) {
        this.onStateChange?.('LISTENING');
      }
    };

    recognition.onresult = (event: any) => {
      // Ignore echo captured while assistant audio is actively playing
      if (this.isSpeaking) return;

      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        void this.handleUserSpokenInput(finalTranscript.trim());
      }
    };

    recognition.onerror = (err: any) => {
      const code = err?.error || '';
      if (code === 'not-allowed') {
        this.onErrorMsg?.('Microphone speech recognition permission denied. Tap Retry Mic or enable microphone in browser settings.');
        return;
      }
      // If browser SpeechRecognition conflicts with getUserMedia or lacks speech service, seamlessly switch to PCM VAD transcription
      if (code === 'audio-capture' || code === 'service-not-allowed' || code === 'network' || code === 'aborted') {
        this.stopFallbackRecognition();
        this.usePcmVadFallback = true;
        return;
      }
      if (
        this.isActive &&
        !this.isMuted &&
        !this.isSpeaking &&
        !this.isRecognitionPausedForSpeech &&
        this.connectionMode === 'HYBRID_FALLBACK'
      ) {
        setTimeout(() => {
          try {
            if (!this.isSpeaking && !this.isMuted && this.isActive && !this.usePcmVadFallback) {
              this.recognition?.start();
            }
          } catch (_e) {}
        }, 500);
      }
    };

    recognition.onend = () => {
      if (
        this.isActive &&
        !this.isMuted &&
        !this.isSpeaking &&
        !this.isRecognitionPausedForSpeech &&
        !this.usePcmVadFallback &&
        this.connectionMode === 'HYBRID_FALLBACK'
      ) {
        setTimeout(() => {
          try {
            if (!this.isSpeaking && !this.isMuted && this.isActive && !this.usePcmVadFallback) {
              this.recognition?.start();
            }
          } catch (_e) {}
        }, 250);
      }
    };

    this.recognition = recognition;
    try {
      recognition.start();
    } catch (_e) {
      this.stopFallbackRecognition();
      this.usePcmVadFallback = true;
    }
  }

  private stopFallbackRecognition() {
    this.isRecognitionPausedForSpeech = false;
    if (this.recognition) {
      const rec = this.recognition;
      this.recognition = null;
      rec.onend = null;
      rec.onerror = null;
      try {
        rec.stop();
      } catch (_e) {}
    }
  }

  private async playPcm24kChunk(base64Pcm: string) {
    await this.initOutputAudioContext();
    const ctx = this.outputAudioCtx;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    if (ctx.state !== 'running') {
      // Autoplay blocked: queue chunk and prompt user gesture to unlock audio immediately
      if (this.pendingBlockedPcmChunks.length < 150) {
        this.pendingBlockedPcmChunks.push(base64Pcm);
      }
      this.setPlaybackBlocked(true);
      return;
    }

    this.setPlaybackBlocked(false);

    const rawBytes = base64ToUint8(base64Pcm);
    const sampleCount = Math.floor(rawBytes.byteLength / 2);
    if (sampleCount <= 0) return;

    const view = new DataView(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);
    const float32 = new Float32Array(sampleCount);
    let rmsSum = 0;
    for (let i = 0; i < sampleCount; i++) {
      const s = view.getInt16(i * 2, true) / 32768;
      float32[i] = s;
      rmsSum += s * s;
    }

    const buffer = ctx.createBuffer(1, sampleCount, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.02, this.nextStartTime);
    this.nextStartTime = startAt + buffer.duration;

    this.activeSources.add(source);
    this.isSpeaking = true;
    this.onStateChange?.('SPEAKING');

    const rms = Math.min(1, Math.sqrt(rmsSum / sampleCount) * 3.2);
    this.onAudioLevel?.(rms);

    source.onended = () => {
      this.activeSources.delete(source);
      if (this.activeSources.size === 0 && this.isActive) {
        this.isSpeaking = false;
        this.onAudioLevel?.(0);
        if (!this.isMuted) {
          this.onStateChange?.(this.mediaStream ? 'LISTENING' : 'IDLE');
        }
      }
    };

    source.start(startAt);
  }

  private stopAllPlayback() {
    this.pendingBlockedWav = null;
    this.pendingBlockedPcmChunks = [];
    this.setPlaybackBlocked(false);

    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch (_e) {}
    }
    this.activeSources.clear();

    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }

    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.src = '';
      } catch (_e) {}
      this.activeHtmlAudio = null;
    }

    if (this.activeObjectUrl) {
      try {
        URL.revokeObjectURL(this.activeObjectUrl);
      } catch (_e) {}
      this.activeObjectUrl = null;
    }

    if (this.speechKeepAliveTimer !== null) {
      window.clearInterval(this.speechKeepAliveTimer);
      this.speechKeepAliveTimer = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    }

    this.isSpeaking = false;
  }

  public stopEngine(closeOutputContext: boolean = false) {
    this.isActive = false;
    this.isListening = false;
    this.clearLiveResponseWatchdog();
    this.resetVadCaptureBuffers();
    this.stopAllPlayback();
    this.stopFallbackRecognition();

    if (this.vadAnimId !== null) {
      cancelAnimationFrame(this.vadAnimId);
      this.vadAnimId = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (_e) {}
      this.ws = null;
    }

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch (_e) {}
      this.processorNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      this.mediaStream = null;
    }

    if (this.inputAudioCtx) {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }
    this.analyser = null;

    if (closeOutputContext && this.outputAudioCtx) {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }

    this.activeInputTurnId = null;
    this.activeOutputTurnId = null;
    this.onAudioLevel?.(0);
    this.onStateChange?.('IDLE');
  }

  public destroy() {
    this.stopEngine(true);
  }

  private runVADLoop() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkLevel = () => {
      if (!this.analyser || !this.isActive) return;

      if (this.isMuted) {
        this.onAudioLevel?.(0);
        this.vadAnimId = requestAnimationFrame(checkLevel);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedLevel = Math.min(1.0, avg / 110.0);

      if (!this.isSpeaking) {
        this.onAudioLevel?.(normalizedLevel);
      }

      // In LIVE_WS mode, Gemini Live's server-side echo-aware VAD emits `interrupted`.
      // In HYBRID_FALLBACK mode, require sustained high vocal energy to prevent speaker feedback cutoffs.
      if (this.connectionMode === 'HYBRID_FALLBACK' && this.isSpeaking && normalizedLevel > 0.62) {
        this.vadBargeInFrames += 1;
        if (this.vadBargeInFrames >= 10) {
          this.vadBargeInFrames = 0;
          this.interruptSpeech();
        }
      } else {
        this.vadBargeInFrames = 0;
      }

      if (this.isListening && this.isActive) {
        this.vadAnimId = requestAnimationFrame(checkLevel);
      }
    };

    this.vadAnimId = requestAnimationFrame(checkLevel);
  }

  private handleServerOrLocalInterrupt() {
    this.stopAllPlayback();
    this.onStateChange?.('INTERRUPTED');

    if (this.activeOutputTurnId) {
      this.emitTurn(
        {
          id: this.activeOutputTurnId,
          sender: 'assistant',
          text: `${this.activeOutputText.trim()} [Interrupted]`.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isInterrupted: true,
        },
        'upsert'
      );
      this.activeOutputTurnId = null;
      this.activeOutputText = '';
    } else {
      this.emitTurn({
        id: `int_${Date.now()}`,
        sender: 'assistant',
        text: '[Speech interrupted by astronaut]',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isInterrupted: true,
      });
    }

    setTimeout(() => {
      if (this.isActive && !this.isMuted && !this.isSpeaking) {
        this.onStateChange?.(this.mediaStream ? 'LISTENING' : 'IDLE');
        this.resumeFallbackRecognition();
      }
    }, 300);
  }

  public interruptSpeech() {
    this.handleServerOrLocalInterrupt();
  }

  public async handleUserSpokenInput(userSpeech: string) {
    const trimmed = userSpeech.trim();
    if (!trimmed) return;

    this.unlockAudio();

    if (this.isSpeaking) {
      this.stopAllPlayback();
    }
    this.activeOutputTurnId = null;
    this.activeOutputText = '';

    // Check explicit action / exit / pace commands locally
    const localAction = this.classifyVoiceCommand(trimmed);

    // Apply explicit command action immediately if matched locally
    if (localAction.action !== 'UNKNOWN') {
      this.onExecuteAction?.(localAction);
      if (localAction.action === 'EXIT_VOICE') return;
    }

    // Conversational AI + Gemini WAV TTS pipeline (used for typed prompts, quick chips, and HYBRID_FALLBACK voice)
    this.emitTurn({
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    this.onStateChange?.('THINKING');

    let spokenText = '';
    let executedPayload = localAction;

    try {
      const res = await fetch('/api/ai/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          history: this.transcriptHistory.slice(-14),
          currentRegion: this.appContext.currentRegion,
          currentSection: this.appContext.currentSection,
          currentTab: this.appContext.currentTab,
          activePersona: this.currentPersona.name,
          speechPace: this.speechPaceRate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        spokenText = data.spokenResponse || data.content || '';
        if (
          data.actionPayload &&
          data.actionPayload.action !== 'UNKNOWN' &&
          localAction.action === 'UNKNOWN'
        ) {
          executedPayload = data.actionPayload;
          this.onExecuteAction?.(data.actionPayload);
        }
      }
    } catch (_err) {
      spokenText = this.generateFallbackSpokenText(trimmed, executedPayload);
    }

    if (!spokenText) {
      spokenText = this.generateFallbackSpokenText(trimmed, executedPayload);
    }

    await this.speakTextUnified(spokenText, executedPayload.description);
  }

  public async speakTextUnified(text: string, actionExecutedDesc?: string) {
    const cleanSpeech = text
      .replace(/[\*\_~`#]/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    if (!cleanSpeech) return;

    this.emitTurn({
      id: `ai_${Date.now()}`,
      sender: 'assistant',
      text: cleanSpeech,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionExecuted: actionExecutedDesc,
    });

    if (this.isMuted || !this.isActive) {
      return;
    }

    // Pause fallback SpeechRecognition while assistant speaks so speaker audio never triggers self-interruption
    this.pauseFallbackRecognition();

    // 1. Try high-fidelity Gemini TTS (/api/ai/voice-tts)
    try {
      const ttsRes = await fetch('/api/ai/voice-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanSpeech,
          voiceName: this.currentPersona.geminiVoiceName,
        }),
      });
      if (ttsRes.ok) {
        const ttsData = await ttsRes.json();
        if (ttsData.audioBase64 && this.isActive && !this.isMuted) {
          await this.playWavBase64(ttsData.audioBase64);
          return;
        }
      }
    } catch (_err) {
      // Fallback cleanly to browser SpeechSynthesis
    }

    // 2. Fallback to browser Web SpeechSynthesis
    this.speakBrowserSynthesis(cleanSpeech);
  }

  private async playWavBase64(base64Wav: string) {
    this.stopAllPlayback();
    this.pauseFallbackRecognition();

    const bytes = base64ToUint8(base64Wav);

    // 1. Primary playback via unlocked WebAudio outputAudioCtx (bypasses async HTML5 Audio autoplay restrictions)
    try {
      await this.initOutputAudioContext();
      const ctx = this.outputAudioCtx;
      if (ctx) {
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(() => {});
        }
        if (ctx.state === 'running') {
          const copy = new Uint8Array(bytes.byteLength);
          copy.set(bytes);
          const audioBuffer = await ctx.decodeAudioData(copy.buffer);
          if (!this.isActive || this.isMuted) return;

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.playbackRate.value = Math.max(0.75, Math.min(1.4, this.speechPaceRate));
          source.connect(ctx.destination);

          this.activeSources.add(source);
          this.isSpeaking = true;
          this.setPlaybackBlocked(false);
          this.onStateChange?.('SPEAKING');
          this.onAudioLevel?.(0.55);

          source.onended = () => {
            this.activeSources.delete(source);
            if (this.activeSources.size === 0) {
              this.isSpeaking = false;
              this.onAudioLevel?.(0);
              if (this.isActive && !this.isMuted) {
                this.onStateChange?.(this.mediaStream ? 'LISTENING' : 'IDLE');
                this.resumeFallbackRecognition();
              }
            }
          };

          source.start(0);
          return;
        }
      }
    } catch (_decodeErr) {
      // Fall through to HTML5 Blob Audio fallback
    }

    // 2. HTML5 <audio> via Blob URL (more reliable than long data: URLs on mobile Safari/Android)
    const blobUrl = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/wav' }));
    const audio = new Audio(blobUrl);
    audio.playbackRate = Math.max(0.75, Math.min(1.4, this.speechPaceRate));
    this.activeHtmlAudio = audio;
    this.activeObjectUrl = blobUrl;
    this.isSpeaking = true;
    this.onStateChange?.('SPEAKING');
    this.onAudioLevel?.(0.55);

    const cleanupUrl = () => {
      if (this.activeObjectUrl === blobUrl) {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (_e) {}
        this.activeObjectUrl = null;
      }
    };

    audio.onended = () => {
      if (this.activeHtmlAudio === audio) {
        this.activeHtmlAudio = null;
      }
      cleanupUrl();
      this.isSpeaking = false;
      this.onAudioLevel?.(0);
      if (this.isActive && !this.isMuted) {
        this.onStateChange?.(this.mediaStream ? 'LISTENING' : 'IDLE');
        this.resumeFallbackRecognition();
      }
    };

    audio.onerror = () => {
      if (this.activeHtmlAudio === audio) {
        this.activeHtmlAudio = null;
      }
      cleanupUrl();
      this.isSpeaking = false;
      this.onAudioLevel?.(0);
      this.speakBrowserSynthesisFromAudioFailure();
    };

    try {
      await audio.play();
      this.setPlaybackBlocked(false);
    } catch (_e: any) {
      if (this.activeHtmlAudio === audio) {
        this.activeHtmlAudio = null;
      }
      cleanupUrl();
      this.isSpeaking = false;
      this.onAudioLevel?.(0);
      // Save WAV so a single user tap ("Tap to Play Audio") replays the exact Gemini voice cleanly
      this.pendingBlockedWav = base64Wav;
      this.setPlaybackBlocked(true);
      this.speakBrowserSynthesisFromAudioFailure();
    }
  }

  private speakBrowserSynthesisFromAudioFailure() {
    const lastAssistant = [...this.transcriptHistory].reverse().find((t) => t.sender === 'assistant');
    if (lastAssistant) {
      this.speakBrowserSynthesis(lastAssistant.text);
    }
  }

  private speakBrowserSynthesis(cleanSpeech: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.isSpeaking = false;
      this.onStateChange?.(this.mediaStream ? 'LISTENING' : 'IDLE');
      this.resumeFallbackRecognition();
      return;
    }

    const wasBusy = window.speechSynthesis.speaking || window.speechSynthesis.pending;
    if (wasBusy) {
      window.speechSynthesis.cancel();
    }

    const doSpeak = () => {
      if (!this.isActive || this.isMuted) return;

      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.lang = 'en-US';
      utterance.pitch = this.currentPersona.pitch;
      utterance.rate = this.currentPersona.rate * this.speechPaceRate;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const enVoices = voices.filter((v) => v.lang.startsWith('en'));
        const pool = enVoices.length > 0 ? enVoices : voices;
        const targetVoice = pool.find((v) =>
          this.currentPersona.voiceGender === 'female'
            ? /female|zira|samantha|karen|google us english/i.test(v.name)
            : /male|david|daniel|alex|natural|google uk english male/i.test(v.name)
        );
        utterance.voice = targetVoice || pool[0];
      }

      const finish = () => {
        if (this.speechKeepAliveTimer !== null) {
          window.clearInterval(this.speechKeepAliveTimer);
          this.speechKeepAliveTimer = null;
        }
        this.isSpeaking = false;
        this.onAudioLevel?.(0);
        if (this.isActive && !this.isMuted) {
          this.onStateChange?.(this.mediaStream ? 'LISTENING' : 'IDLE');
          this.resumeFallbackRecognition();
        }
      };

      utterance.onstart = () => {
        this.pendingBlockedWav = null;
        this.setPlaybackBlocked(false);
        this.isSpeaking = true;
        this.onStateChange?.('SPEAKING');
        this.onAudioLevel?.(0.45);
      };

      utterance.onend = finish;
      utterance.onerror = (evt: any) => {
        if (evt?.error === 'not-allowed' || evt?.error === 'audio-busy') {
          this.setPlaybackBlocked(true);
        }
        finish();
      };

      this.isSpeaking = true;
      this.onStateChange?.('SPEAKING');
      this.onAudioLevel?.(0.45);

      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();

      if (this.speechKeepAliveTimer !== null) {
        window.clearInterval(this.speechKeepAliveTimer);
      }
      this.speechKeepAliveTimer = window.setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        } else if (this.speechKeepAliveTimer !== null) {
          window.clearInterval(this.speechKeepAliveTimer);
          this.speechKeepAliveTimer = null;
        }
      }, 4000);
    };

    if (wasBusy) {
      setTimeout(doSpeak, 70);
    } else {
      doSpeak();
    }
  }

  // Voice Command Matcher: Executes app commands ONLY when explicit action intent is expressed
  public classifyVoiceCommand(query: string): VoiceActionPayload {
    const q = query.toLowerCase().trim();

    // Direct exit commands
    if (
      q.includes('exit voice') ||
      q.includes('close voice') ||
      q.includes('close assistant') ||
      q === 'go back' ||
      q === 'close' ||
      q === 'exit'
    ) {
      return { action: 'EXIT_VOICE', description: 'Closed voice assistant and returned to workspace' };
    }

    // Adaptive Speech Pace
    if (q.includes('speak slower') || q.includes('talk slower')) {
      this.speechPaceRate = 0.82;
      return { action: 'SET_SPEECH_PACE', speechRate: 0.82, description: 'Set speech pace to slow (0.82x)' };
    }
    if (q.includes('speak faster') || q.includes('talk faster')) {
      this.speechPaceRate = 1.25;
      return { action: 'SET_SPEECH_PACE', speechRate: 1.25, description: 'Set speech pace to fast (1.25x)' };
    }
    if (q.includes('normal speed') || q.includes('normal pace')) {
      this.speechPaceRate = 1.0;
      return { action: 'SET_SPEECH_PACE', speechRate: 1.0, description: 'Reset speech pace to normal (1.0x)' };
    }

    // Require an explicit command verb so conversational questions ("What do you think about Jezero Crater?") are never hijacked
    const hasCommandVerb =
      /\b(open|switch|go to|navigate|show|display|select|change|take me|bring up|launch|activate|enter|turn on|start|run|execute|trigger|calculate|recalculate|compute|set|plan route)\b/.test(
        q
      );

    if (!hasCommandVerb) {
      return { action: 'UNKNOWN' };
    }

    // Emergency Abort & Crisis Support (Feature 16)
    if (q.includes('abort') || q.includes('emergency return')) {
      return { action: 'TRIGGER_EMERGENCY_ABORT', description: 'Executed immediate emergency abort return vector' };
    }

    // Recalculate A* Routes
    if (q.includes('recalculate') || q.includes('recompute route') || q.includes('refresh route')) {
      return { action: 'RECALCULATE_ROUTES', description: 'Recalculated Pareto A* traverse routes' };
    }

    // Map Viewport Controls
    if (q.includes('3d') || q.includes('globe')) {
      return { action: 'SET_MAP_MODE', mapMode: '3D', description: 'Switched view to 3D Rotating Mars Globe' };
    }
    if (q.includes('2d') || q.includes('gis') || q.includes('flat map')) {
      return { action: 'SET_MAP_MODE', mapMode: '2D', description: 'Switched view to 2D Altimetry GIS Map' };
    }
    if (q.includes('orbital') || q.includes('sar radar')) {
      return { action: 'SET_MAP_MODE', mapMode: 'ORBITAL', description: 'Opened Orbital SAR Intelligence' };
    }
    if (q.includes('hud') || q.includes('astronaut view') || q.includes('visor')) {
      return { action: 'SET_USER_ROLE', userRole: 'ASTRONAUT_HUD', description: 'Switched to Astronaut Visor HUD Mode' };
    }
    if (q.includes('mission control') || q.includes('exit hud')) {
      return { action: 'SET_USER_ROLE', userRole: 'MISSION_CONTROL', description: 'Returned to Mission Control view' };
    }

    // All 16 Core Features across the 4 Explore Sections
    if (q.includes('zone selector') || q.includes('select zone') || q.includes('location selector') || q.includes('10 locations')) {
      return { action: 'SET_SECTION', sectionId: 'REGIONS', tabId: 'LOCATIONS', description: 'Opened Zone Selector' };
    }
    if (q.includes('altimetry') || q.includes('elevation map') || q.includes('gis layers')) {
      return { action: 'SET_SECTION', sectionId: 'REGIONS', tabId: 'LAYERS', description: 'Opened Altimetry Map & GIS Layers' };
    }
    if (q.includes('basecamp') || q.includes('site scanner')) {
      return { action: 'SET_SECTION', sectionId: 'REGIONS', tabId: 'BASECAMP', description: 'Opened Basecamp Scanner' };
    }
    if (q.includes('depth inspect') || q.includes('subsurface')) {
      return { action: 'SET_SECTION', sectionId: 'GEOLOGY', tabId: 'DEPTH_INSPECT', description: 'Opened Depth Inspect Point' };
    }
    if (q.includes('geo-scanner') || q.includes('geo scanner') || q.includes('target finder')) {
      return { action: 'SET_SECTION', sectionId: 'GEOLOGY', tabId: 'GEO_SCANNER', description: 'Opened Geo-Scanner Hub' };
    }
    if (q.includes('anomaly') || q.includes('anomalies') || q.includes('hazard profile')) {
      return { action: 'SET_SECTION', sectionId: 'GEOLOGY', tabId: 'ANOMALIES', description: 'Opened Anomalies & Hazard Profiles' };
    }
    if (q.includes('astrobiology')) {
      return { action: 'SET_SECTION', sectionId: 'GEOLOGY', tabId: 'ASTROBIOLOGY', description: 'Opened Astrobiology Directory' };
    }
    if (q.includes('waypoint')) {
      return { action: 'SET_SECTION', sectionId: 'PLANNING', tabId: 'WAYPOINTS', description: 'Opened Waypoint Matrix' };
    }
    if (q.includes('heuristics')) {
      return { action: 'SET_SECTION', sectionId: 'PLANNING', tabId: 'HEURISTICS', description: 'Opened Hazard Heuristics' };
    }
    if (q.includes('pathfinding') || q.includes('a*') || q.includes('a star')) {
      return { action: 'SET_SECTION', sectionId: 'PLANNING', tabId: 'A_STAR', description: 'Opened Smart Route Planning (A*)' };
    }
    if (q.includes('ai advisor') || q.includes('explainable ai') || q.includes('consensus') || q.includes('second opinion')) {
      return { action: 'SET_SECTION', sectionId: 'PLANNING', tabId: 'AI_ADVISOR', description: 'Opened AI Advisor & Science-vs-Safety Consensus' };
    }
    if (q.includes('sequencer') || q.includes('atmospheric')) {
      return { action: 'SET_SECTION', sectionId: 'SIMULATION', tabId: 'SEQUENCER', description: 'Opened Mission Sequencer & Atmospheric Telemetry' };
    }
    if (q.includes('eva sim') || q.includes('marswalk simulation')) {
      return { action: 'SET_SECTION', sectionId: 'SIMULATION', tabId: 'EVA_SIM', description: 'Opened Marswalk EVA Simulation' };
    }
    if (q.includes('what if') || q.includes('what-if') || q.includes('contingency')) {
      return { action: 'SET_SECTION', sectionId: 'SIMULATION', tabId: 'CRISIS', description: 'Opened Crisis Support & What-If Simulator' };
    }

    // All 10 Martian Regions
    if (q.includes('olympus')) {
      return { action: 'SET_REGION', regionId: 'olympus_mons', description: 'Switched region to Olympus Mons' };
    }
    if (q.includes('gale')) {
      return { action: 'SET_REGION', regionId: 'gale', description: 'Switched region to Gale Crater' };
    }
    if (q.includes('jezero')) {
      return { action: 'SET_REGION', regionId: 'jezero', description: 'Switched region to Jezero Crater' };
    }
    if (q.includes('valles')) {
      return { action: 'SET_REGION', regionId: 'valles_marineris', description: 'Switched region to Valles Marineris' };
    }
    if (q.includes('hellas')) {
      return { action: 'SET_REGION', regionId: 'hellas_planitia', description: 'Switched region to Hellas Planitia' };
    }
    if (q.includes('elysium')) {
      return { action: 'SET_REGION', regionId: 'elysium_planitia', description: 'Switched region to Elysium Planitia' };
    }
    if (q.includes('meridiani')) {
      return { action: 'SET_REGION', regionId: 'meridiani_planum', description: 'Switched region to Meridiani Planum' };
    }
    if (q.includes('noctis')) {
      return { action: 'SET_REGION', regionId: 'noctis_labyrinthus', description: 'Switched region to Noctis Labyrinthus' };
    }
    if (q.includes('acidalia')) {
      return { action: 'SET_REGION', regionId: 'acidalia_planitia', description: 'Switched region to Acidalia Planitia' };
    }
    if (q.includes('north pole') || q.includes('boreum')) {
      return { action: 'SET_REGION', regionId: 'planum_boreum', description: 'Switched region to Planum Boreum' };
    }

    // General Section Switches
    if (q.includes('home') || q.includes('homepage')) {
      return { action: 'SET_SECTION', sectionId: 'HOME', description: 'Returned to Guided Homepage' };
    }
    if (q.includes('regions')) {
      return { action: 'SET_SECTION', sectionId: 'REGIONS', tabId: 'LOCATIONS', description: 'Opened 01. Regions & Maps' };
    }
    if (q.includes('geology')) {
      return { action: 'SET_SECTION', sectionId: 'GEOLOGY', tabId: 'GEO_SCANNER', description: 'Opened 02. Geological Intelligence' };
    }
    if (q.includes('plan marswalk') || q.includes('planning')) {
      return { action: 'SET_SECTION', sectionId: 'PLANNING', tabId: 'WAYPOINTS', description: 'Opened 03. Plan Your Marswalk' };
    }
    if (q.includes('simulation') || q.includes('simulate mission')) {
      return { action: 'SET_SECTION', sectionId: 'SIMULATION', tabId: 'SEQUENCER', description: 'Opened 04. Simulate Your Mission' };
    }

    return { action: 'UNKNOWN' };
  }

  private generateFallbackSpokenText(query: string, actionPayload: VoiceActionPayload): string {
    if (actionPayload.action === 'EXIT_VOICE') {
      return `Got it, taking you back to ${this.appContext.currentSection.toLowerCase()}.`;
    }
    if (actionPayload.action === 'SET_REGION' && actionPayload.regionId) {
      return `Alright, I'm bringing up ${actionPayload.regionId.replace(/_/g, ' ')} for you now. Would you like to inspect its elevation profile or look at nearby mineral targets?`;
    }
    if (actionPayload.action === 'SET_MAP_MODE' && actionPayload.mapMode) {
      return `Done—switching the map viewport to ${actionPayload.mapMode} view. What would you like to examine first?`;
    }
    if (actionPayload.action === 'SET_SECTION' && actionPayload.sectionId) {
      return `Opening the ${actionPayload.sectionId.toLowerCase()} workspace for you now. Want me to walk you through what's in there?`;
    }
    if (actionPayload.action === 'TRIGGER_EMERGENCY_ABORT') {
      return `Emergency abort triggered. I've plotted a safety-prioritized return path straight back to basecamp. Are consumables holding steady?`;
    }
    if (actionPayload.action === 'SET_SPEECH_PACE') {
      return `Sure thing, I've adjusted my speaking pace to ${this.speechPaceRate < 1 ? 'a slower, more deliberate' : this.speechPaceRate > 1 ? 'a faster' : 'a normal'} cadence. How does that sound?`;
    }

    return `I'm listening and thinking about "${query}" while we're looking at ${this.appContext.currentRegion.replace(/_/g, ' ')}. Want to explore the geological formations here or discuss safe traverse planning?`;
  }
}
