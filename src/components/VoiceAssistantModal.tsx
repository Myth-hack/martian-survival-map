/**
 * VoiceAssistantModal Component — Unified ChatGPT-Style Real-Time Voice Modal
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Single unified voice interface with sticky Back/Close navigation, Escape/backdrop exit,
 * mic mute & retry, VoiceOrb, live streaming transcripts, and typed fallback input.
 */

import React, { useState, useEffect, useRef } from 'react';
import { VoiceOrb } from './VoiceOrb';
import { VoiceOrbState, VoicePersonaConfig, VoicePersonaId, LiveVoiceTranscriptTurn } from '../types';
import { VOICE_PERSONAS, VoiceConnectionMode } from '../services/realTimeVoiceService';
import {
  X,
  ArrowLeft,
  Mic,
  MicOff,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Send,
  Trash2,
  Volume2,
} from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  orbState: VoiceOrbState;
  audioLevel: number;
  activePersona: VoicePersonaConfig;
  onSelectPersona: (personaId: VoicePersonaId) => void;
  transcripts: LiveVoiceTranscriptTurn[];
  onClearTranscripts?: () => void;
  errorMsg?: string | null;
  connectionMode?: VoiceConnectionMode;
  isMuted?: boolean;
  isPlaybackBlocked?: boolean;
  onUnlockPlayback?: () => void;
  onToggleMute?: () => void;
  onRetryMic?: () => void;
  onInterrupt: () => void;
  onSpeakSample: (text: string) => void;
  previousLocationLabel?: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  orbState,
  audioLevel,
  activePersona,
  onSelectPersona,
  transcripts,
  onClearTranscripts,
  errorMsg,
  connectionMode = 'HYBRID_FALLBACK',
  isMuted = false,
  isPlaybackBlocked = false,
  onUnlockPlayback,
  onToggleMute,
  onRetryMic,
  onInterrupt,
  onSpeakSample,
  previousLocationLabel = 'Mission Workspace',
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [typedInput, setTypedInput] = useState('');
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Close reliably on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-scroll live transcript to latest turn
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  if (!isOpen) return null;

  const quickVoicePrompts = [
    'Hello ARES, what do you think about exploring Jezero Crater?',
    'Explain why carbonates here matter for ancient Martian life',
    'Switch region to Olympus Mons',
    'Open 3D rotating Mars globe',
    'Open Geo-Scanner Hub',
    'Open Waypoint Matrix & A* Pathfinding',
    'Open EVA Simulation',
    'Speak slower and explain terrain',
  ];

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = typedInput.trim();
    if (!trimmed) return;
    onSpeakSample(trimmed);
    setTypedInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-slate-950/88 backdrop-blur-xl animate-fadeIn font-mono text-slate-100"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="ARES Unified Real-Time Voice Assistant"
    >
      {/* Modal Container: Full-viewport flex-col on mobile (100dvh), floating card on desktop */}
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] max-w-2xl bg-[#060b18]/95 border-0 sm:border sm:border-cyan-500/40 sm:rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden">
        {/* Subtle ambient flares */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Sticky Header Bar with Clear Back & Close Buttons */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 border-b border-slate-800 bg-[#060b18]/90 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center space-x-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              title={`Return to ${previousLocationLabel}`}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back</span>
              <span className="hidden md:inline text-slate-400 font-normal">({previousLocationLabel})</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-['Orbitron'] text-xs sm:text-sm font-bold text-white truncate">
                  ARES VOICE AI
                </h3>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                    connectionMode === 'LIVE_WS'
                      ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                      : connectionMode === 'HYBRID_FALLBACK'
                      ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-300'
                      : 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                  }`}
                >
                  {connectionMode === 'LIVE_WS'
                    ? 'GEMINI LIVE'
                    : connectionMode === 'HYBRID_FALLBACK'
                    ? 'HYBRID VOICE'
                    : 'TEXT MODE'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Hands-Free Full-Duplex Mars Copilot
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/70 text-slate-300 hover:text-red-300 transition-colors cursor-pointer border border-slate-700 hover:border-red-500/50 flex items-center space-x-1 text-xs font-bold shrink-0"
            title="Close Voice Assistant (Esc)"
            aria-label="Close Voice Assistant"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Scrollable Middle Content */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 space-y-4 z-10">
          {/* Microphone Permission / Error Banner with Retry */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-200 text-xs space-y-2 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start space-x-2 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-300">MICROPHONE PERMISSION NOTICE</span>
                    <span>{errorMsg}</span>
                  </div>
                </div>
                {onRetryMic && (
                  <button
                    type="button"
                    onClick={onRetryMic}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shrink-0 cursor-pointer self-start sm:self-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Mic</span>
                  </button>
                )}
              </div>
              <div className="pt-2 border-t border-amber-500/30 text-[11px] text-amber-300/90 space-y-1">
                <p className="font-bold">Mobile App & WebView Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li><strong>HTTPS Secure Context:</strong> Deployed apps and WebViews must use HTTPS (`https://`).</li>
                  <li><strong>Browser Bar:</strong> Tap the lock/info icon in your browser address bar and enable Microphone access.</li>
                  <li><strong>Installed Mobile Apps / WebViews:</strong> Ensure `RECORD_AUDIO` permission is declared in Android/iOS app settings and `onPermissionRequest` is enabled in WebView code.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Browser Autoplay / Audio Output Blocked Recovery Banner */}
          {isPlaybackBlocked && onUnlockPlayback && (
            <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-400/70 text-cyan-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg">
              <div className="flex items-start space-x-2 leading-relaxed">
                <Volume2 className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="font-bold block text-cyan-200">SPEAKER AUDIO PAUSED BY BROWSER</span>
                  <span className="text-slate-300">
                    Your browser blocked automatic voice playback. Tap Enable Audio to hear {activePersona.name} speak aloud.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onUnlockPlayback}
                className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shrink-0 cursor-pointer self-start sm:self-center shadow-md"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Tap to Enable Audio</span>
              </button>
            </div>
          )}

          {/* Central Voice Orb & Primary Controls */}
          <div className="flex flex-col items-center justify-center space-y-3 py-1">
            <VoiceOrb
              state={orbState}
              audioLevel={audioLevel}
              activePersona={activePersona}
              onInterrupt={onInterrupt}
              onClickOrb={onToggleMute}
              size={185}
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              {onToggleMute && (
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors ${
                    isMuted
                      ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900/70'
                      : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/70'
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                </button>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPersonaMenu((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{activePersona.name}</span>
                </button>

                {showPersonaMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-950 border border-cyan-500/50 rounded-xl p-2 shadow-2xl z-50 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 px-2 py-1 border-b border-slate-800">
                      SELECT VOICE PERSONA
                    </div>
                    {Object.values(VOICE_PERSONAS).map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          onSelectPersona(p.id as VoicePersonaId);
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full p-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                          activePersona.id === p.id
                            ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-bold'
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.role}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {orbState === 'SPEAKING' && (
                <button
                  type="button"
                  onClick={onInterrupt}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-extrabold flex items-center space-x-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)] cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>INTERRUPT</span>
                </button>
              )}
            </div>
          </div>

          {/* Live Conversation Transcript Stream */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <div className="flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>LIVE TRANSCRIPT</span>
              </div>
              {transcripts.length > 0 && onClearTranscripts && (
                <button
                  type="button"
                  onClick={onClearTranscripts}
                  className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="min-h-[120px] max-h-52 overflow-y-auto space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs shadow-inner">
              {transcripts.length === 0 ? (
                <div className="py-5 text-center text-slate-400 text-xs leading-relaxed">
                  Speak naturally hands-free — ask about Martian terrain, request follow-ups, or command any section (e.g., &ldquo;Switch to 3D Globe&rdquo;, &ldquo;Open Geo-Scanner&rdquo;, &ldquo;Go back&rdquo;).
                </div>
              ) : (
                transcripts.map((t) => (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-lg border ${
                      t.sender === 'user'
                        ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200 ml-4'
                        : t.isInterrupted
                        ? 'bg-red-950/40 border-red-500/40 text-red-300'
                        : 'bg-slate-900/80 border-slate-800 text-slate-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold uppercase tracking-wider text-slate-300">
                        {t.sender === 'user' ? 'ASTRONAUT' : activePersona.name}
                      </span>
                      <span>{t.timestamp}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{t.text}</p>
                    {t.actionExecuted && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] text-emerald-400 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{t.actionExecuted}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Quick Voice Command Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              QUICK VOICE COMMANDS:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickVoicePrompts.map((prompt, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => onSpeakSample(prompt)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-[11px] font-mono transition-all cursor-pointer flex items-center space-x-1"
                >
                  <span>&ldquo;{prompt}&rdquo;</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Text Fallback Input */}
        <form
          onSubmit={handleTypedSubmit}
          className="px-3 sm:px-5 py-3 border-t border-slate-800 bg-[#060b18]/95 flex items-center space-x-2 shrink-0 z-20"
        >
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Speak hands-free or type a command / question..."
            className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none min-w-0"
          />
          <button
            type="submit"
            disabled={!typedInput.trim()}
            className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center space-x-1 cursor-pointer shrink-0"
            title="Send message to ARES Voice AI"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
