/**
 * Astronaut Tactical Visor HUD (Heads-Up Display) Mode
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Real-time astronaut helmet visor HUD with pitch/roll artificial horizon, compass heading, waypoint guidance, and vital stats
 */

import React from 'react';
import { Compass, ShieldAlert, Heart, Wind, Battery, Target, AlertTriangle, Eye, ArrowUp } from 'lucide-react';
import { RouteOption, MarsEnvironmentData, MarsCoordinates } from '../types';

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
    <div className="relative w-full h-full flex-1 min-h-[360px] lg:min-h-0 bg-[#040608] rounded-xl border-2 border-emerald-500/40 overflow-hidden shadow-2xl p-4 sm:p-6 font-mono text-emerald-400 select-none">
      {/* Visor Vignette and scanline styling */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

      {/* Top HUD Header: Heading Ribbon & Compass */}
      <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-['Orbitron'] font-bold text-sm tracking-widest text-emerald-300">
            ASTRONAUT EVA-02 VISOR HUD // xEVA SUIT #4
          </span>
        </div>

        {/* Heading Compass Bar */}
        <div className="flex items-center space-x-6 text-xs bg-emerald-950/40 px-4 py-1 rounded border border-emerald-800/60">
          <span>NW 315°</span>
          <span className="text-white font-bold tracking-widest">▲ HDG: 342° N</span>
          <span>NE 045°</span>
        </div>

        <button
          onClick={onExitHUD}
          className="px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 rounded text-xs text-emerald-300 font-bold transition-all"
        >
          EXIT HUD MODE
        </button>
      </div>

      {/* Center Target Reticle & Artificial Horizon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-72 h-72 rounded-full border border-emerald-500/20 flex items-center justify-center">
          {/* Outer Crosshairs */}
          <div className="absolute top-0 bottom-0 w-[1px] bg-emerald-500/30" />
          <div className="absolute left-0 right-0 h-[1px] bg-emerald-500/30" />

          {/* Artificial Pitch & Roll Ladder Lines */}
          <div className="w-36 h-[2px] bg-emerald-400/80 shadow-[0_0_8px_#10b981]" />
          <div className="absolute w-24 h-[1px] bg-emerald-400/50 -translate-y-8" />
          <div className="absolute w-24 h-[1px] bg-emerald-400/50 translate-y-8" />

          {/* Center Target Box */}
          <div className="w-10 h-10 border border-emerald-400/70 rounded flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          </div>

          <div className="absolute bottom-6 text-[10px] text-emerald-300 font-bold tracking-wider">
            TERRAIN PITCH: -3.2° // ROLL: +1.1° (SAFE)
          </div>
        </div>
      </div>

      {/* Left HUD Panel: Navigation Vector & Waypoint Guidance */}
      <div className="absolute left-6 top-20 w-64 space-y-3 pointer-events-auto">
        <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/60 backdrop-blur-md">
          <div className="text-[10px] text-emerald-500 font-bold mb-1 uppercase tracking-wider">
            ACTIVE WAYPOINT GUIDANCE
          </div>
          <div className="text-white font-bold text-sm">
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
        <div className="p-3 rounded bg-amber-950/40 border border-amber-600/60 backdrop-blur-md text-amber-300 text-xs">
          <div className="flex items-center space-x-1.5 font-bold mb-1 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>TERRAIN WARNING: 65m AHEAD</span>
          </div>
          <p className="text-[10px] leading-tight text-amber-200">
            Loose aeolian dust accumulation. Keep step cadence steady. Avoid slope exceeding 15°.
          </p>
        </div>
      </div>

      {/* Right HUD Panel: Life Support Vitals */}
      <div className="absolute right-6 top-20 w-60 space-y-3 pointer-events-auto">
        <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/60 backdrop-blur-md space-y-2 text-xs">
          <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
            xEVA LIFE SUPPORT SYSTEMS
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>O2 TANK:</span>
            </span>
            <span className="font-bold text-white">82% (4.2h REMAINING)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Battery className="w-3.5 h-3.5 text-amber-400" />
              <span>SUIT BATT:</span>
            </span>
            <span className="font-bold text-white">87%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Heart className="w-3.5 h-3.5 text-red-400" />
              <span>HEART RATE:</span>
            </span>
            <span className="font-bold text-white">92 BPM</span>
          </div>

          <div className="flex items-center justify-between">
            <span>SUIT PRESSURE:</span>
            <span className="font-bold text-white">29.6 kPa (100% O2)</span>
          </div>
        </div>

        {/* Ambient Martian Environment */}
        <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/60 backdrop-blur-md text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-emerald-500">EXT TEMP:</span>
            <span className="text-white font-bold">{env.surfaceTempC.current}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-500">PRESSURE:</span>
            <span className="text-white font-bold">{env.atmosphericPressurePa} Pa</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-500">SOL NUMBER:</span>
            <span className="text-amber-400 font-bold">SOL {env.solNumber}</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs border-t border-emerald-500/30 pt-2">
        <div className="flex items-center space-x-2">
          <span className="text-emerald-500">UHF COMMS:</span>
          <span className="text-white font-bold">HABITAT RELAY LOCKED (SNR 28dB)</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>MARS LOCAL TIME: 14:22 LMST</span>
          <span className="text-emerald-300 font-bold">MODE: ASTRONAUT SURFACE RECON</span>
        </div>
      </div>
    </div>
  );
};
