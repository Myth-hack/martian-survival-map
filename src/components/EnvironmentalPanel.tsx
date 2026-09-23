/**
 * Resource, Environment & Radiation Telemetry Dashboard
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * 
 * Displays dedicated datasets:
 * - Atmospheric pressure (MEDA pressure in Pa, min/max diurnal range, barometric tide)
 * - MEDA weather metrics (surface & ground temp, wind speed, gust speed, azimuth direction)
 * - Dust opacity (optical depth Tau, storm classification, solar panel loss)
 * - Solar radiation (solar irradiance W/m², ionizing radiation mSv/sol, GCR flux, SPE risk)
 */

import React, { useState } from 'react';
import {
  Sun,
  Thermometer,
  Wind,
  Droplets,
  Radio,
  Gauge,
  ShieldAlert,
  Zap,
  Activity,
  RotateCw,
  Compass,
  AlertCircle
} from 'lucide-react';
import { MarsEnvironmentData } from '../types';

interface EnvironmentalPanelProps {
  env: MarsEnvironmentData;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const EnvironmentalPanel: React.FC<EnvironmentalPanelProps> = ({
  env,
  onRefresh,
  isRefreshing = false
}) => {
  const [telemetryFilter, setTelemetryFilter] = useState<'ALL' | 'PRESSURE' | 'WEATHER' | 'DUST' | 'RADIATION'>('ALL');

  return (
    <div className="bg-[#0b0f17]/95 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md font-sans text-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-200">
                Martian Environment & MEDA Telemetry
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
                MEDA Active
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              NASA Planetary Data System (PDS) Ground Truth Stream • InSight / Jezero M2020
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
            SOL {env.solNumber} (Ls {env.solarLongLs}°)
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-amber-300 transition-colors"
              title="Refresh Environmental Telemetry"
              aria-label="Refresh Environmental Telemetry"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Metric Focus Filter Bar */}
      <div className="flex items-center space-x-1 mb-3 text-[10px] font-mono bg-slate-950/80 p-0.5 rounded-md border border-slate-800 w-fit">
        <button
          onClick={() => setTelemetryFilter('ALL')}
          className={`px-2 py-0.5 rounded transition-colors ${
            telemetryFilter === 'ALL' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Metrics
        </button>
        <button
          onClick={() => setTelemetryFilter('PRESSURE')}
          className={`px-2 py-0.5 rounded transition-colors ${
            telemetryFilter === 'PRESSURE' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pressure
        </button>
        <button
          onClick={() => setTelemetryFilter('WEATHER')}
          className={`px-2 py-0.5 rounded transition-colors ${
            telemetryFilter === 'WEATHER' ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Temp & Wind
        </button>
        <button
          onClick={() => setTelemetryFilter('DUST')}
          className={`px-2 py-0.5 rounded transition-colors ${
            telemetryFilter === 'DUST' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Dust (Tau)
        </button>
        <button
          onClick={() => setTelemetryFilter('RADIATION')}
          className={`px-2 py-0.5 rounded transition-colors ${
            telemetryFilter === 'RADIATION' ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Radiation
        </button>
      </div>

      {/* Grid of Key Telemetry Sensors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
        {/* 1. Atmospheric Pressure (MEDA) */}
        {(telemetryFilter === 'ALL' || telemetryFilter === 'PRESSURE') && (
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase">Pressure (MEDA)</span>
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="font-mono text-base font-bold text-cyan-300">
              {env.atmosphericPressurePa} Pa
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {env.pressureTrend || 'STEADY'} • ~0.61% Earth sea level
            </div>
            {env.pressureRangePa && (
              <div className="text-[9px] font-mono text-cyan-500/80 mt-1 pt-1 border-t border-slate-800">
                Range: {env.pressureRangePa.min} - {env.pressureRangePa.max} Pa
              </div>
            )}
          </div>
        )}

        {/* 2. Surface & MEDA Temperature */}
        {(telemetryFilter === 'ALL' || telemetryFilter === 'WEATHER') && (
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase">Surface Temp</span>
              <Thermometer className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="font-mono text-base font-bold text-slate-100">
              {env.surfaceTempC.current}°C
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Min: {env.surfaceTempC.min}° / Max: {env.surfaceTempC.max}°
            </div>
            {env.groundTempC && (
              <div className="text-[9px] font-mono text-amber-500/80 mt-1 pt-1 border-t border-slate-800">
                Ground: {env.groundTempC}°C
              </div>
            )}
          </div>
        )}

        {/* 3. Optical Depth Tau (Dust Opacity) */}
        {(telemetryFilter === 'ALL' || telemetryFilter === 'DUST') && (
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase">Dust Opacity (Tau)</span>
              <Wind className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className={`font-mono text-base font-bold ${env.opticalDepthTau > 2.0 ? 'text-red-400' : 'text-amber-300'}`}>
              {env.opticalDepthTau} τ
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {env.dustStormStatus || (env.opticalDepthTau > 2.0 ? 'Storm Hazard' : 'Atmosphere Clear')}
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
              PV Loss: {env.solarPanelLossPct ?? 8.5}%
            </div>
          </div>
        )}

        {/* 4. Solar Radiation & Cosmic Ray Dose */}
        {(telemetryFilter === 'ALL' || telemetryFilter === 'RADIATION') && (
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase">Ionizing Radiation</span>
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="font-mono text-base font-bold text-purple-300">
              {env.radiationDoseRateMSvPerSol} <span className="text-xs font-normal">mSv/sol</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              GCR: {env.gcrFluxParticles ? '1.24 pt/cm²' : 'Cosmic Flux'}
            </div>
            <div className="text-[9px] font-mono text-purple-400/80 mt-1 pt-1 border-t border-slate-800">
              SPE Alert: {env.solarParticleRisk || 'NOMINAL'}
            </div>
          </div>
        )}
      </div>

      {/* Subsurface Ice & Water Evidence Banner */}
      <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-800/40 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-bold text-cyan-200">
              SHARAD Subsurface Ice & Permafrost
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-900/60">
            {env.subsurfaceIceProbPct}% PROBABILITY
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
          Radar sounding dielectric permittivity (ε = 3.1) indicates bound permafrost ice lenses at depth 0.9m - 1.4m. Viable for In-Situ Resource Utilization (ISRU) propellant extraction.
        </p>
      </div>

      {/* Secondary Solar & MEDA Wind Vector Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-300">
        <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Solar Irradiance:</span>
          </div>
          <span className="font-bold text-amber-300">{env.solarIrradianceWm2} W/m²</span>
        </div>

        <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wind (MEDA):</span>
          </div>
          <span className="font-bold text-cyan-300">{env.windSpeedMps} m/s {env.windDirection}</span>
        </div>

        <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Earth-Mars Delay:</span>
          </div>
          <span className="font-bold text-cyan-300">+{env.commsDelayMinutes} min (1-way)</span>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalPanel;
