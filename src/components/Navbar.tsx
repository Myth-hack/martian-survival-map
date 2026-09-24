/**
 * NASA Space Apps Challenge 2026 - Header & Mission Command Bar
 * Team: Quanta Buddies
 */

import React from 'react';
import {
  Globe,
  Compass,
  Radio,
  FileText,
  Code,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  User,
  Rocket,
  Satellite
} from 'lucide-react';
import { MapMode, UserRole, MapRegionId } from '../types';
import { MARS_REGIONS } from '../data/marsDatasets';

interface NavbarProps {
  userId?: string;
  mapMode: MapMode;
  setMapMode: (mode: MapMode) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  selectedRegion: MapRegionId;
  setSelectedRegion: (regionId: MapRegionId) => void;
  audioFeedback: boolean;
  setAudioFeedback: (val: boolean) => void;
  emergencyOfflineMode: boolean;
  setEmergencyOfflineMode: (val: boolean) => void;
  onOpenReport: () => void;
  onOpenTechSpec: () => void;
  solNumber: number;
  commsDelayMinutes: number;
  onOpenAISystem?: () => void;
  onOpenMissionImpact?: () => void;
  showOverlays?: boolean;
  onToggleOverlays?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userId,
  mapMode,
  setMapMode,
  userRole,
  setUserRole,
  selectedRegion,
  setSelectedRegion,
  audioFeedback,
  setAudioFeedback,
  emergencyOfflineMode,
  setEmergencyOfflineMode,
  onOpenReport,
  onOpenTechSpec,
  solNumber,
  commsDelayMinutes,
  onOpenAISystem,
  onOpenMissionImpact,
  showOverlays = true,
  onToggleOverlays,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  return (
    <header className="bg-[#0b0f17]/95 border-b border-cyan-950/60 sticky top-0 z-40 backdrop-blur-md w-full shrink-0">
      <div className="w-full px-2 sm:px-4 py-1.5 sm:py-2 flex flex-row flex-wrap items-center justify-start gap-2 sm:gap-2.5">
        {/* Left: Project Branding & Team Quanta Buddies Badge */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-red-600 via-amber-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-red-950/50 shrink-0">
            <div className="w-full h-full bg-[#080b12] rounded-[6px] flex items-center justify-center text-red-400 font-bold text-sm sm:text-base font-mono">
              ♂
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-['Orbitron'] tracking-wider font-extrabold text-xs sm:text-sm text-slate-100 whitespace-nowrap">
                INTERPLANETARY SURVIVAL GUIDE
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded bg-red-950/80 border border-red-500/50 text-red-300 whitespace-nowrap">
                Martian Map
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-slate-400 font-mono whitespace-nowrap">
              <span className="text-cyan-400 font-semibold">Team Quanta Buddies</span>
              <span>•</span>
              <span className="text-amber-400">NASA 2026</span>
              <span>•</span>
              <span className="text-slate-300">Sol {solNumber}</span>
            </div>
          </div>
        </div>

        {/* Region Switcher & Telemetry Pill */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 rounded-lg p-1 shrink-0">
          <label className="text-[11px] font-mono text-slate-400 px-1 flex items-center space-x-1 shrink-0">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">REGION:</span>
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as MapRegionId)}
            className="bg-slate-950 text-cyan-300 text-xs font-mono font-medium rounded px-2 py-1 border border-slate-700/60 focus:outline-none focus:border-cyan-500 shrink-0"
          >
            {MARS_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Earth-Mars Comms Delay Pill */}
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono border shrink-0 ${
              emergencyOfflineMode
                ? 'bg-amber-950/40 border-amber-600/50 text-amber-300'
                : 'bg-cyan-950/40 border-cyan-700/40 text-cyan-300'
            }`}
            title="Real-time light travel delay between Earth and Mars"
          >
            <Radio className={`w-3.5 h-3.5 ${emergencyOfflineMode ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
            <span className="text-[10px] sm:text-[11px]">
              {emergencyOfflineMode ? 'OFFLINE' : `+${commsDelayMinutes}m`}
            </span>
          </div>
        </div>

        {/* NASA Journey to Mars: Mission Impact Button */}
        <button
          onClick={onOpenMissionImpact}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono border bg-gradient-to-r from-red-950/80 via-red-900/60 to-amber-950/60 hover:from-red-900/90 hover:to-amber-900/80 border-red-500/60 hover:border-red-400 text-red-200 transition-all shadow-md shadow-red-950/50 shrink-0 font-bold cursor-pointer"
          title="NASA's Journey to Mars: Role in Earth-Independent Colonization Phase"
        >
          <Rocket className="w-3.5 h-3.5 text-red-400 transform -rotate-45 shrink-0 animate-pulse" />
          <span>MISSION IMPACT</span>
          <span className="hidden xl:inline-block px-1 py-0.2 bg-red-500/30 text-[9px] text-red-300 rounded font-semibold">
            NASA
          </span>
        </button>

        {/* AI Mission System Button */}
        <button
          onClick={onOpenAISystem}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border bg-cyan-950/60 border-cyan-500/60 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 transition-colors shadow-sm shrink-0 font-bold"
          title="Open NASA Planetary Data System (PDS) AI Advisor"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>AI SYSTEM</span>
        </button>

        {/* 2D / 3D Globe Projection Switcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex items-center text-xs font-mono shrink-0">
          <button
            onClick={() => setMapMode('2D')}
            className={`px-2.5 sm:px-3 py-1 rounded flex items-center space-x-1.5 transition-colors ${
              mapMode === '2D'
                ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="2D Tactical GIS Multi-Layer View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D GIS</span>
          </button>
          <button
            onClick={() => setMapMode('3D')}
            className={`px-2.5 sm:px-3 py-1 rounded flex items-center space-x-1.5 transition-colors ${
              mapMode === '3D'
                ? 'bg-red-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="3D Mars Globe Projection (Cesium / WebGL)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3D Globe</span>
          </button>
          <button
            onClick={() => setMapMode('ORBITAL')}
            className={`px-2.5 sm:px-3 py-1 rounded flex items-center space-x-1.5 transition-all ${
              mapMode === 'ORBITAL'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-slate-950 font-extrabold shadow-md shadow-cyan-950/60'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="ARES Orbital Intelligence: Satellite SAR / NISAR Surveillance HUD"
          >
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <span>Orbital SAR</span>
          </button>
        </div>

        {/* User Role Switcher: Mission Control vs Astronaut HUD */}
        <button
          onClick={() => setUserRole(userRole === 'MISSION_CONTROL' ? 'ASTRONAUT_HUD' : 'MISSION_CONTROL')}
          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center space-x-1.5 transition-all shrink-0 ${
            userRole === 'ASTRONAUT_HUD'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/50'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{userRole === 'ASTRONAUT_HUD' ? 'EXIT HUD' : 'ASTRONAUT HUD'}</span>
        </button>

        {/* Mission Briefing PDF/Report Export */}
        <button
          onClick={onOpenReport}
          className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono font-bold text-xs rounded-lg shadow-md shadow-red-950/40 flex items-center space-x-1.5 transition-all shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>EXPORT</span>
        </button>

        {/* Offline Autonomous Mode Toggle */}
        <button
          onClick={() => setEmergencyOfflineMode(!emergencyOfflineMode)}
          className={`p-1.5 rounded-lg border text-xs font-mono transition-colors shrink-0 ${
            emergencyOfflineMode
              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Offline Autonomy (Simulate Deep Space Comms Blackout)"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Audio Feedback Toggle */}
        <button
          onClick={() => setAudioFeedback(!audioFeedback)}
          className="p-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors shrink-0"
          title="Toggle Audio Feedback"
        >
          {audioFeedback ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Technical Spec & Code Architecture Modal */}
        <button
          onClick={onOpenTechSpec}
          className="px-2.5 py-1.5 bg-slate-900/90 border border-slate-800 hover:border-cyan-500 rounded-lg text-xs font-mono text-cyan-400 flex items-center space-x-1 transition-colors shrink-0"
          title="View FastAPI + PostGIS Architecture for NASA Space Apps Challenge"
        >
          <Code className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">FASTAPI/SQL</span>
        </button>

        {/* User ID Badge */}
        {userId && (
          <div
            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900/90 border border-cyan-800/50 text-[10px] sm:text-[11px] font-mono text-cyan-300 shrink-0"
            title={`Active Mission User ID: ${userId}`}
          >
            <User className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400 hidden xl:inline">ID:</span>
            <span className="font-bold tracking-wider">{userId}</span>
          </div>
        )}
      </div>
    </header>
  );
};
