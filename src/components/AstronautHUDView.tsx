/**
 * Astronaut Tactical Visor HUD (Heads-Up Display) Mode
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Real-time astronaut helmet visor HUD with pitch/roll artificial horizon, compass heading, waypoint guidance, and vital stats
 */

import React from 'react';
import { Compass, ShieldAlert, Heart, Wind, Battery, Target, AlertTriangle, Eye, ArrowUp } from 'lucide-react';
import { RouteOption, MarsEnvironmentData, MarsCoordinates } from '../types';
import { ProvenanceBadge } from './ProvenanceBadge';

interface AstronautHUDViewProps {
  activeRoute: RouteOption | undefined;
  env: MarsEnvironmentData;
  onExitHUD: () => void;
}

export const AstronautHUDView: React.FC<AstronautHUDViewProps> = ({
  activeRoute,
  env,
  onExitHUD
}) => {
  return (
    <div className="relative w-full min-h-[620px] lg:h-[680px] bg-[#040608]/18 backdrop-blur-xl rounded-xl border-2 border-emerald-500/40 overflow-y-auto shadow-2xl p-3 sm:p-4 md:p-6 font-mono text-emerald-400 select-none flex flex-col justify-between">
      {/* Visor Vignette and scanline styling */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40 z-0" />

      {/* Top HUD Header: Heading Ribbon & Compass */}
      <div className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-emerald-500/30 pb-3 gap-2.5 sm:gap-3 shrink-0">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-['Orbitron'] font-bold text-xs sm:text-sm tracking-widest text-emerald-300">
              ASTRONAUT EVA-02 VISOR HUD <span className="hidden sm:inline">// xEVA SUIT #4</span>
            </span>
            <ProvenanceBadge provenance={env?.provenance || 'SIMULATED'} size="xs" />
          </div>
          <button
            onClick={onExitHUD}
            className="sm:hidden px-2.5 py-1 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500 rounded text-[11px] text-emerald-200 font-bold transition-all shrink-0 cursor-pointer shadow-sm"
          >
            EXIT HUD
          </button>
        </div>

        {/* Heading Compass Bar */}
        <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-[10px] sm:text-xs bg-emerald-950/40 px-3 sm:px-4 py-1 rounded border border-emerald-800/60 w-full sm:w-auto">
          <span className="text-emerald-500">NW 315°</span>
          <span className="text-white font-bold tracking-widest">▲ HDG: 342° N</span>
          <span className="text-emerald-500">NE 045°</span>
        </div>

        <button
          onClick={onExitHUD}
          className="hidden sm:inline-flex px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 rounded text-xs text-emerald-300 font-bold transition-all shrink-0 cursor-pointer"
        >
          EXIT HUD MODE
        </button>
      </div>

      {/* Main HUD Body: On mobile & tablet (< lg), flex-col stacked. On desktop (lg+), absolute visor overlay layout */}
      <div className="relative z-10 flex flex-col lg:contents gap-4 my-3 lg:my-0 flex-1 min-w-0">
        {/* Center Target Reticle & Artificial Horizon */}
        <div className="relative lg:absolute lg:inset-0 flex items-center justify-center pointer-events-none py-3 lg:py-0 shrink-0 order-1 lg:order-none z-10">
          <div className="relative w-48 h-48 sm:w-60 sm:h-60 lg:w-72 lg:h-72 rounded-full border border-emerald-500/25 flex items-center justify-center">
            {/* Outer Crosshairs */}
            <div className="absolute top-0 bottom-0 w-[1px] bg-emerald-500/30" />
            <div className="absolute left-0 right-0 h-[1px] bg-emerald-500/30" />

            {/* Artificial Pitch & Roll Ladder Lines */}
            <div className="w-28 sm:w-36 h-[2px] bg-emerald-400/80 shadow-[0_0_8px_#10b981]" />
            <div className="absolute w-20 sm:w-24 h-[1px] bg-emerald-400/50 -translate-y-6 sm:-translate-y-8" />
            <div className="absolute w-20 sm:w-24 h-[1px] bg-emerald-400/50 translate-y-6 sm:translate-y-8" />

            {/* Center Target Box */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 border border-emerald-400/70 rounded flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            </div>

            {/* Terrain Pitch / Roll Status */}
            <div className="absolute bottom-2 sm:bottom-6 text-[9px] sm:text-[10px] text-emerald-300 font-bold tracking-wider text-center px-2 py-0.5 bg-[#040608]/90 rounded border border-emerald-500/30 backdrop-blur-sm shadow-sm">
              TERRAIN PITCH: -3.2° // ROLL: +1.1° (SAFE)
            </div>
          </div>
        </div>

        {/* Left HUD Panel: Navigation Vector & Waypoint Guidance */}
        <div className="w-full lg:w-80 lg:absolute lg:left-6 lg:top-20 space-y-3 pointer-events-auto order-2 lg:order-none z-20 min-w-0">
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 backdrop-blur-md shadow-md">
            <div className="text-[10px] text-emerald-400 font-bold mb-1 uppercase tracking-wider">
              ACTIVE WAYPOINT GUIDANCE
            </div>
            <div className="text-white font-bold text-sm break-words">
              {activeRoute ? activeRoute.name : 'STANDBY (NO ACTIVE VECTOR)'}
            </div>
            {activeRoute ? (
              <>
                <div className="text-xs text-emerald-300 mt-1">
                  Bearing: <span className="font-bold text-white">342° Mag</span>
                </div>
                <div className="text-xs text-emerald-300">
                  Distance to Target: <span className="font-bold text-white">{(activeRoute.distanceKm * 1000).toFixed(0)} meters</span>
                </div>
                <div className="text-xs text-emerald-300">
                  Est. Walk Time: <span className="font-bold text-white">{Math.round(activeRoute.estTraverseHours * 60)} mins</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 mt-1">
                Select Start and Goal coordinates in Mission Control to plot EVA traverse.
              </div>
            )}
          </div>

          {/* Hazard Alert within Visor */}
          <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-600/70 backdrop-blur-md text-amber-300 text-xs shadow-md">
            <div className="flex items-center space-x-1.5 font-bold mb-1 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>TERRAIN WARNING: 65m AHEAD</span>
            </div>
            <p className="text-[10px] leading-tight text-amber-200">
              Loose aeolian dust accumulation. Keep step cadence steady. Avoid slope exceeding 15°.
            </p>
          </div>
        </div>

        {/* Right HUD Panel: Life Support Vitals */}
        <div className="w-full lg:w-80 lg:absolute lg:right-6 lg:top-20 space-y-3 pointer-events-auto order-3 lg:order-none z-20 min-w-0">
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 backdrop-blur-md space-y-2 text-xs shadow-md">
            <div className="flex items-center justify-between border-b border-emerald-800/50 pb-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                xEVA LIFE SUPPORT // SUIT VITALS
              </span>
              <ProvenanceBadge provenance="SIMULATED" size="xs" />
            </div>
            <div className="text-[9px] text-amber-300/80 italic leading-tight">
              Uncrewed mission phase baseline — vitals generated from metabolic exertion model.
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="flex items-center space-x-1.5 shrink-0">
                <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>O2 TANK:</span>
              </span>
              <span className="font-bold text-white shrink-0">82% (4.2h REMAINING)</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="flex items-center space-x-1.5 shrink-0">
                <Battery className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>SUIT BATT:</span>
              </span>
              <span className="font-bold text-white shrink-0">87%</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="flex items-center space-x-1.5 shrink-0">
                <Heart className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>HEART RATE:</span>
              </span>
              <span className="font-bold text-white shrink-0">92 BPM</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="shrink-0">SUIT PRESSURE:</span>
              <span className="font-bold text-white shrink-0">29.6 kPa (100% O2)</span>
            </div>
          </div>

          {/* Ambient Martian Environment */}
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 backdrop-blur-md text-[11px] space-y-1 shadow-md">
            <div className="flex items-center justify-between border-b border-emerald-800/50 pb-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase">AMBIENT ATMOSPHERE</span>
              <ProvenanceBadge provenance={env.isLive ? 'LIVE_NASA' : 'HISTORICAL_NASA'} size="xs" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-emerald-500">EXT TEMP:</span>
              <span className="text-white font-bold">{env.surfaceTempC.current}°C</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-emerald-500">PRESSURE:</span>
              <span className="text-white font-bold">{env.atmosphericPressurePa} Pa</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-emerald-500">DATA SOURCE:</span>
              <span className="text-amber-400 font-bold truncate max-w-[150px]">{env.sourceStation || 'NASA PDS Archive'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="relative md:absolute md:bottom-4 md:left-6 md:right-6 flex flex-col md:flex-row items-start md:items-center justify-between text-[11px] sm:text-xs border-t border-emerald-500/30 pt-2.5 mt-3 md:mt-0 gap-2 z-20 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-emerald-500">UHF COMMS:</span>
          <span className="text-white font-bold">HABITAT RELAY LOCKED (SNR 28dB)</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span>MARS LOCAL TIME: 14:22 LMST</span>
          <span className="text-emerald-300 font-bold">MODE: ASTRONAUT SURFACE RECON</span>
        </div>
      </div>
    </div>
  );
};
