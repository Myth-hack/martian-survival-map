/**
 * NASA Space Apps Challenge 2026 - Interplanetary Survival Guide
 * Floating Zoom In/Out & Map Scale Controller for MarsGIS2DView
 */

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Plus, Minus, Maximize, Crosshair } from 'lucide-react';

export interface FloatingZoomControlProps {
  scale: number;
  minScale?: number;
  maxScale?: number;
  stepFactor?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetScale: (scale: number) => void;
  onResetZoom: () => void;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

export const FloatingZoomControl: React.FC<FloatingZoomControlProps> = ({
  scale,
  minScale = 1.0,
  maxScale = 50.0,
  stepFactor = 1.25,
  onZoomIn,
  onZoomOut,
  onSetScale,
  onResetZoom,
  className = '',
  orientation = 'vertical'
}) => {
  const [showSlider, setShowSlider] = useState<boolean>(false);

  const isMinZoom = scale <= minScale + 0.05;
  const isMaxZoom = scale >= maxScale - 0.05;

  // Convert logarithmic scale for smooth slider feel
  // scale ranges from 1 to 50
  const normalizedSliderValue = Math.round(
    ((Math.log(scale) - Math.log(minScale)) / (Math.log(maxScale) - Math.log(minScale))) * 100
  );

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const logMin = Math.log(minScale);
    const logMax = Math.log(maxScale);
    const targetLog = logMin + (val / 100) * (logMax - logMin);
    const newScale = Math.exp(targetLog);
    onSetScale(Math.max(minScale, Math.min(maxScale, Number(newScale.toFixed(2)))));
  };

  // Preset steps for tactical Mars navigation
  const presets = [1.0, 2.5, 7.0, 15.0, 30.0, 50.0];

  return (
    <div
      className={`select-none pointer-events-auto flex flex-col items-center bg-slate-950/45 backdrop-blur-md border border-cyan-500/30 rounded-xl p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.6),0_0_15px_rgba(6,182,212,0.15)] transition-all font-mono text-xs z-30 ${className}`}
      role="region"
      aria-label="Map Zoom and Scale Controls"
    >
      {/* Zoom In Button */}
      <button
        type="button"
        id="gis-floating-zoom-in-btn"
        onClick={onZoomIn}
        disabled={isMaxZoom}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
          isMaxZoom
            ? 'text-slate-600 bg-slate-900/30 cursor-not-allowed'
            : 'text-cyan-300 hover:text-white bg-slate-900/40 hover:bg-cyan-600/30 active:scale-95 border border-cyan-500/20 hover:border-cyan-400'
        }`}
        title={`Zoom In (${(scale * stepFactor).toFixed(1)}x)`}
        aria-label="Zoom in map scale"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Incremental Zoom Level Readout & Slider Toggle */}
      <div className="relative my-1 flex flex-col items-center">
        <button
          type="button"
          onClick={() => setShowSlider((prev) => !prev)}
          className="px-1.5 py-1 rounded hover:bg-cyan-950/40 transition-colors text-[10px] font-bold tracking-tight text-cyan-400 hover:text-cyan-200 cursor-pointer flex flex-col items-center"
          title="Click to toggle smooth incremental zoom slider"
          aria-expanded={showSlider}
        >
          <span className="leading-none">{scale.toFixed(1)}x</span>
          <span className="text-[8px] text-slate-400 font-normal scale-90">
            {scale >= 7.0 ? 'TACTICAL' : 'MACRO'}
          </span>
        </button>

        {/* Popout Interactive Fine-Tuning Slider */}
        {showSlider && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 bg-slate-950/75 border border-cyan-500/50 backdrop-blur-lg p-2.5 rounded-xl shadow-2xl flex flex-col items-center space-y-2 w-44 z-50 animate-in fade-in slide-in-from-right-2 duration-150">
            <div className="flex items-center justify-between w-full text-[10px] text-slate-300">
              <span className="text-cyan-400 font-bold">SCALE ADJUST</span>
              <span className="font-mono text-cyan-300 font-bold">{scale.toFixed(2)}x</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={normalizedSliderValue}
              onChange={handleSliderChange}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              aria-label="Incremental Map Scale Slider"
            />

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-3 gap-1 w-full pt-1 border-t border-slate-800">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onSetScale(preset)}
                  className={`text-[9px] py-0.5 rounded border transition-colors cursor-pointer ${
                    Math.abs(scale - preset) < 0.2
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-slate-900/40 border-cyan-500/20 text-slate-400 hover:text-slate-200 hover:border-cyan-400/50'
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Out Button */}
      <button
        type="button"
        id="gis-floating-zoom-out-btn"
        onClick={onZoomOut}
        disabled={isMinZoom}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
          isMinZoom
            ? 'text-slate-600 bg-slate-900/50 cursor-not-allowed'
            : 'text-cyan-300 hover:text-white bg-slate-900/80 hover:bg-cyan-600/30 active:scale-95 border border-slate-800 hover:border-cyan-400'
        }`}
        title={`Zoom Out (${Math.max(minScale, scale / stepFactor).toFixed(1)}x)`}
        aria-label="Zoom out map scale"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="w-5 h-[1px] bg-slate-800 my-1" />

      {/* 1:1 Global Overview / Reset Button */}
      <button
        type="button"
        id="gis-floating-zoom-reset-btn"
        onClick={onResetZoom}
        className="w-8 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-300 bg-slate-900/60 hover:bg-slate-800 active:scale-95 transition-all border border-slate-800/80 cursor-pointer"
        title="Reset Zoom to 1.0x Full-Bleed Global Mars View"
        aria-label="Reset zoom to 1.0x"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
