/**
 * VoiceOrb Component — ChatGPT-Inspired Real-Time Voice Orb
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Interactive canvas voice orb supporting LISTENING, THINKING, SPEAKING, INTERRUPTED, ERROR & IDLE states
 */

import React, { useEffect, useRef } from 'react';
import { VoiceOrbState, VoicePersonaConfig } from '../types';
import { Mic, Sparkles, Volume2, AlertOctagon, RefreshCw, AlertTriangle } from 'lucide-react';

interface VoiceOrbProps {
  state: VoiceOrbState;
  audioLevel?: number; // 0.0 to 1.0 (microphone / audio playback output volume)
  activePersona: VoicePersonaConfig;
  onInterrupt?: () => void;
  onClickOrb?: () => void;
  size?: number;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  audioLevel = 0,
  activePersona,
  onInterrupt,
  onClickOrb,
  size = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      angle += 0.03;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.28;

      ctx.clearRect(0, 0, width, height);

      let primaryColor = 'rgba(6, 182, 212, 1)'; // Cyan (LISTENING)
      let secondaryColor = 'rgba(59, 130, 246, 0.6)';
      let coreGlow = 'rgba(6, 182, 212, 0.4)';

      if (state === 'THINKING') {
        primaryColor = 'rgba(168, 85, 247, 1)';
        secondaryColor = 'rgba(236, 72, 153, 0.7)';
        coreGlow = 'rgba(168, 85, 247, 0.5)';
      } else if (state === 'SPEAKING') {
        primaryColor = 'rgba(16, 185, 129, 1)';
        secondaryColor = 'rgba(245, 158, 11, 0.7)';
        coreGlow = 'rgba(16, 185, 129, 0.5)';
      } else if (state === 'INTERRUPTED') {
        primaryColor = 'rgba(239, 68, 68, 1)';
        secondaryColor = 'rgba(245, 158, 11, 0.9)';
        coreGlow = 'rgba(239, 68, 68, 0.6)';
      } else if (state === 'ERROR') {
        primaryColor = 'rgba(245, 158, 11, 1)';
        secondaryColor = 'rgba(239, 68, 68, 0.75)';
        coreGlow = 'rgba(245, 158, 11, 0.45)';
      } else if (state === 'IDLE') {
        primaryColor = 'rgba(148, 163, 184, 0.8)';
        secondaryColor = 'rgba(56, 189, 248, 0.3)';
        coreGlow = 'rgba(148, 163, 184, 0.2)';
      }

      const pulseScale = 1 + Math.sin(angle * 2) * 0.06 + audioLevel * 0.4;
      const currentRadius = baseRadius * pulseScale;

      const bgGlow = ctx.createRadialGradient(cx, cy, currentRadius * 0.2, cx, cy, currentRadius * 1.8);
      bgGlow.addColorStop(0, coreGlow);
      bgGlow.addColorStop(0.6, primaryColor.replace('1)', '0.15)'));
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      const ringCount = state === 'SPEAKING' ? 4 : 3;
      for (let r = ringCount; r >= 1; r--) {
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = r === 1 ? primaryColor : secondaryColor;
        ctx.lineWidth = r === 1 ? 2.5 : 1.2;

        ctx.beginPath();
        const steps = 60;
        const ringRad = currentRadius * (0.6 + r * 0.22);

        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const waveFreq = state === 'SPEAKING' ? 8 : 5;
          const waveAmp = (state === 'SPEAKING' ? 12 : 6) * (0.3 + audioLevel * 1.5);
          const offset = Math.sin(theta * waveFreq + angle * (r % 2 === 0 ? 3 : -3)) * waveAmp;

          const px = cx + Math.cos(theta) * (ringRad + offset);
          const py = cy + Math.sin(theta) * (ringRad + offset);

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      if (state === 'THINKING') {
        const particleCount = 8;
        ctx.save();
        for (let p = 0; p < particleCount; p++) {
          const pAngle = angle * 2.5 + (p * Math.PI * 2) / particleCount;
          const px = cx + Math.cos(pAngle) * (currentRadius * 1.2);
          const py = cy + Math.sin(pAngle) * (currentRadius * 1.2);

          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(px, py, 3 + Math.sin(angle * 4 + p) * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      const coreGrad = ctx.createRadialGradient(cx - currentRadius * 0.2, cy - currentRadius * 0.2, 0, cx, cy, currentRadius);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, primaryColor);
      coreGrad.addColorStop(0.8, secondaryColor);
      coreGrad.addColorStop(1, 'rgba(6, 11, 25, 0.9)');

      ctx.fillStyle = coreGrad;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [state, audioLevel]);

  return (
    <div className="relative flex flex-col items-center justify-center space-y-2.5 font-mono">
      <div
        onClick={state === 'SPEAKING' ? onInterrupt : onClickOrb}
        className="relative cursor-pointer group flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        title={state === 'SPEAKING' ? 'Click or speak to interrupt ARES' : 'ARES Real-Time Voice Assistant'}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-full drop-shadow-[0_0_25px_rgba(6,182,212,0.35)]"
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {state === 'LISTENING' && (
            <div className="p-3 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-lg animate-pulse">
              <Mic className="w-6 h-6" />
            </div>
          )}
          {state === 'THINKING' && (
            <div className="p-3 rounded-full bg-purple-950/80 border border-purple-400 text-purple-300 shadow-lg animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
          )}
          {state === 'SPEAKING' && (
            <div className="p-3 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-300 shadow-lg">
              <Volume2 className="w-6 h-6 animate-bounce" />
            </div>
          )}
          {state === 'INTERRUPTED' && (
            <div className="p-3 rounded-full bg-red-950/90 border border-red-500 text-red-400 shadow-lg animate-ping">
              <AlertOctagon className="w-6 h-6" />
            </div>
          )}
          {state === 'ERROR' && (
            <div className="p-3 rounded-full bg-amber-950/90 border border-amber-400 text-amber-300 shadow-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}
          {state === 'IDLE' && (
            <div className="p-3 rounded-full bg-slate-900/80 border border-slate-700 text-slate-400">
              <Sparkles className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>

      {/* State Status Pill */}
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-800 backdrop-blur-md shadow-md text-[11px] font-mono">
        <span
          className={`w-2 h-2 rounded-full ${
            state === 'LISTENING'
              ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]'
              : state === 'THINKING'
              ? 'bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]'
              : state === 'SPEAKING'
              ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]'
              : state === 'INTERRUPTED'
              ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]'
              : state === 'ERROR'
              ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
              : 'bg-slate-500'
          }`}
        />
        <span className="font-extrabold text-slate-200 uppercase tracking-wider">
          {state === 'LISTENING' && 'LISTENING (HANDS-FREE)'}
          {state === 'THINKING' && 'PROCESSING REQUEST...'}
          {state === 'SPEAKING' && 'SPEAKING (SPEAK OR TAP TO INTERRUPT)'}
          {state === 'INTERRUPTED' && 'INTERRUPTED BY ASTRONAUT'}
          {state === 'ERROR' && 'MICROPHONE UNAVAILABLE — TEXT READY'}
          {state === 'IDLE' && 'VOICE MUTED / STANDBY'}
        </span>
      </div>

      {/* Voice Persona Badge */}
      <div className="text-[11px] font-mono text-cyan-400/80 flex items-center space-x-1.5 text-center">
        <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
        <span>
          <strong className="text-white">{activePersona.name}</strong> ({activePersona.role})
        </span>
      </div>
    </div>
  );
};
