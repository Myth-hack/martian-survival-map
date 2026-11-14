/**
 * React Hook for the Unified ChatGPT-Style Real-Time Voice Assistant
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Connects RealTimeVoiceEngine to App State with barge-in interruption, continuous hands-free listening & clean exit
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VoiceOrbState,
  VoicePersonaId,
  LiveVoiceTranscriptTurn,
  MapRegionId,
  ExplorationSectionId,
} from '../types';
import {
  RealTimeVoiceEngine,
  VOICE_PERSONAS,
  VoiceActionPayload,
  VoiceConnectionMode,
} from '../services/realTimeVoiceService';

interface UseRealTimeVoiceOptions {
  selectedRegion?: MapRegionId;
  activeSection?: ExplorationSectionId;
  activePanelTab?: string;
  onExecuteAction?: (payload: VoiceActionPayload) => void;
}

export function useRealTimeVoice(options?: UseRealTimeVoiceOptions) {
  const {
    selectedRegion = 'jezero',
    activeSection = 'HOME',
    activePanelTab = 'LOCATIONS',
    onExecuteAction,
  } = options || {};

  const [isOpen, setIsOpen] = useState(false);
  const [orbState, setOrbState] = useState<VoiceOrbState>('IDLE');
  const [audioLevel, setAudioLevel] = useState(0);
  const [activePersonaId, setActivePersonaId] = useState<VoicePersonaId>('ares_commander');
  const [transcripts, setTranscripts] = useState<LiveVoiceTranscriptTurn[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<VoiceConnectionMode>('HYBRID_FALLBACK');
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaybackBlocked, setIsPlaybackBlocked] = useState(false);

  const engineRef = useRef<RealTimeVoiceEngine | null>(null);
  const actionCallbackRef = useRef(onExecuteAction);
  actionCallbackRef.current = onExecuteAction;

  useEffect(() => {
    const engine = new RealTimeVoiceEngine({
      onStateChange: (state) => setOrbState(state),
      onAudioLevel: (level) => setAudioLevel(level),
      onTranscriptTurn: (turn, mode = 'append') => {
        setTranscripts((prev) => {
          if (mode === 'upsert') {
            const idx = prev.findIndex((t) => t.id === turn.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = turn;
              return next;
            }
          }
          return [...prev, turn].slice(-50);
        });
      },
      onExecuteAction: (payload) => {
        actionCallbackRef.current?.(payload);
      },
      onErrorMsg: (msg) => setErrorMsg(msg),
      onConnectionModeChange: (mode) => setConnectionMode(mode),
      onPlaybackBlockedChange: (blocked) => setIsPlaybackBlocked(blocked),
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setAppContext({
      currentRegion: selectedRegion,
      currentSection: activeSection,
      currentTab: activePanelTab,
    });
  }, [selectedRegion, activeSection, activePanelTab]);

  const openVoiceAssistant = useCallback(async () => {
    setIsOpen(true);
    setIsMuted(false);
    if (engineRef.current) {
      engineRef.current.unlockAudio();
      engineRef.current.setAppContext({
        currentRegion: selectedRegion,
        currentSection: activeSection,
        currentTab: activePanelTab,
      });
      engineRef.current.setPersona(activePersonaId);
      await engineRef.current.startEngine();
    }
  }, [activePersonaId, selectedRegion, activeSection, activePanelTab]);

  const closeVoiceAssistant = useCallback(() => {
    engineRef.current?.stopEngine();
    setIsMuted(false);
    setIsPlaybackBlocked(false);
    setOrbState('IDLE');
    setAudioLevel(0);
    setIsOpen(false);
  }, []);

  const toggleVoiceAssistant = useCallback(async () => {
    if (isOpen) {
      closeVoiceAssistant();
    } else {
      await openVoiceAssistant();
    }
  }, [isOpen, closeVoiceAssistant, openVoiceAssistant]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      engineRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const retryMicrophone = useCallback(async () => {
    if (engineRef.current) {
      engineRef.current.unlockAudio();
      await engineRef.current.retryMicrophone();
    }
  }, []);

  const unlockPlayback = useCallback(() => {
    engineRef.current?.unlockAudio();
  }, []);

  const handleSelectPersona = useCallback((personaId: VoicePersonaId) => {
    setActivePersonaId(personaId);
    engineRef.current?.unlockAudio();
    engineRef.current?.setPersona(personaId);
  }, []);

  const handleInterrupt = useCallback(() => {
    engineRef.current?.interruptSpeech();
  }, []);

  const handleSpeakSample = useCallback((sampleText: string) => {
    engineRef.current?.unlockAudio();
    void engineRef.current?.handleUserSpokenInput(sampleText);
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
  }, []);

  return {
    isOpen,
    setIsOpen,
    openVoiceAssistant,
    closeVoiceAssistant,
    toggleVoiceAssistant,
    orbState,
    audioLevel,
    activePersona: VOICE_PERSONAS[activePersonaId] || VOICE_PERSONAS.ares_commander,
    handleSelectPersona,
    transcripts,
    clearTranscripts,
    errorMsg,
    connectionMode,
    isMuted,
    isPlaybackBlocked,
    unlockPlayback,
    toggleMute,
    retryMicrophone,
    handleInterrupt,
    handleSpeakSample,
  };
}
