/**
 * Resource, Environment & Radiation Telemetry Dashboard
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Water/ice detection, atmospheric pressure, dust Tau index, and radiation dose rates
 */

import React, { useState } from 'react';
import {
  Sun,
  Thermometer,
  Wind,
  Droplets,
  Activity,
  Radio,
  Gauge,
  ShieldAlert,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MarsEnvironmentData } from '../types';

interface EnvironmentalPanelProps {
  env: MarsEnvironmentData;
}

export const EnvironmentalPanel: React.FC<EnvironmentalPanelProps> = ({ env }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="bg-[#0b0f17]/95 border border-slate-800/90 rounded-xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <h3 className="font-['Orbitron'] font-bold text-[11px] sm:text-xs uppercase tracking-wider text-slate-200">
            Mission Telemetry & Environment
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[9px] sm:text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
            SOL {env.solNumber} (Ls {env.solarLongLs}°)
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 hover:border-cyan-600/60 flex items-center space-x-1 cursor-pointer transition-colors"
            title={isExpanded ? 'Collapse to compact HUD' : 'Expand full SHARAD & radar telemetry'}
          >
            <span>{isExpanded ? 'COMPACT' : 'DETAILS'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Grid of Key Telemetry Sensors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Surface Temperature */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[9px] font-mono uppercase">Surface Temp</span>
            <Thermometer className="w-3 h-3 text-red-400" />
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-slate-100">
            {env.surfaceTempC.current}°C
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            Min: {env.surfaceTempC.min}° / Max: {env.surfaceTempC.max}°
          </div>
        </div>

        {/* Atmospheric Pressure */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[9px] font-mono uppercase">Pressure (MEDA)</span>
            <Gauge className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-cyan-300">
            {env.atmosphericPressurePa} Pa
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            ~0.61% Earth Sea Level
          </div>
        </div>

        {/* Optical Depth Tau (Dust Index) */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[9px] font-mono uppercase">Dust Index (Tau)</span>
            <Wind className="w-3 h-3 text-amber-400" />
          </div>
          <div className={`font-mono text-sm sm:text-base font-bold ${env.opticalDepthTau > 2.0 ? 'text-red-400' : 'text-amber-300'}`}>
            {env.opticalDepthTau}
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            {env.opticalDepthTau > 2.0 ? 'Storm Hazard' : 'Atmosphere Clear'}
          </div>
        </div>

        {/* Radiation Dose Rate */}
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[9px] font-mono uppercase">Radiation</span>
            <ShieldAlert className="w-3 h-3 text-purple-400" />
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-purple-300">
            {env.radiationDoseRateMSvPerSol} <span className="text-[10px] font-normal">mSv/sol</span>
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            GCR + Solar Cosmic Ray
          </div>
        </div>
      </div>

      {/* Expanded Telemetry: Subsurface Ice & Water Evidence Banner + Secondary Comms Row */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
          <div className="p-2.5 rounded-lg bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-800/40">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[11px] font-bold text-cyan-200">
                  SHARAD Subsurface Ice & Permafrost
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-900/60">
                {env.subsurfaceIceProbPct}% PROBABILITY
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
              Radar sounding dielectric permittivity (ε = 3.1) indicates bound permafrost ice lenses at depth 0.9m - 1.4m. Viable for In-Situ Resource Utilization (ISRU) propellant extraction.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Solar Irradiance:</span>
              </div>
              <span className="font-bold text-amber-300">{env.solarIrradianceWm2} W/m²</span>
            </div>

            <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Radio className="w-3 h-3 text-cyan-400" />
                <span>Earth-Mars Delay:</span>
              </div>
              <span className="font-bold text-cyan-300">+{env.commsDelayMinutes} min (1-way)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
