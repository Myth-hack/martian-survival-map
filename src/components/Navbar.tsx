/**
 * NASA Space Apps Challenge 2026 - Header & Mission Command Bar
 * Team: Quanta Buddies
 * Futuristic Space-Tech UI with Glassmorphism, Micro-Glows & Clean Metadata
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
  Satellite,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
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
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden backdrop-blur-md bg-[#060a16]/18 border-b border-cyan-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Subtle top holographic glow line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-400/50 via-purple-500/40 to-transparent" />

      <div className="px-2.5 sm:px-4 lg:px-6 py-2 sm:py-2.5">
        <div className="max-w-[1920px] w-full mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-3 min-w-0">
          {/* Left & Center: Title + Region Selector */}
          <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center justify-between lg:justify-start gap-2 sm:gap-3 lg:gap-4 w-full lg:w-auto min-w-0">
            {/* Project Branding & Team Quanta Buddies Badge */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-amber-500 to-cyan-400 rounded-lg blur-[3px] opacity-75 group-hover:opacity-100 transition duration-300" />
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#070b14]/45 border border-cyan-500/30 flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-red-400 font-bold text-base sm:text-lg font-mono drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]">
                    ♂
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-['Orbitron'] tracking-wider font-extrabold text-[11px] xs:text-xs sm:text-sm lg:text-base text-slate-100 truncate max-w-[200px] xs:max-w-none drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                    INTERPLANETARY SURVIVAL GUIDE
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider rounded bg-red-950/60 border border-red-500/40 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.25)] whitespace-nowrap">
                    Martian Map
                  </span>
                </div>
                {/* Clean unboxed metadata with typographic separators */}
                <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-slate-400 font-mono whitespace-nowrap">
                  <span className="text-cyan-400 font-medium">Team Quanta Buddies</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="text-amber-400 font-medium">NASA 2026</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="text-slate-300 font-mono">Sol {solNumber}</span>
                </div>
              </div>
            </div>

            {/* Region Switcher & Telemetry Pill */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-[#070c18]/30 border border-cyan-500/20 backdrop-blur-md rounded-lg p-1 w-full sm:w-auto overflow-x-auto hide-scrollbar shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.06)]">
              <label className="text-[11px] font-mono text-slate-400 px-1 sm:px-2 flex items-center space-x-1 shrink-0">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-300/80">REGION:</span>
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as MapRegionId)}
                className="bg-[#050812]/45 text-cyan-300 text-xs font-mono font-medium rounded px-2 py-1 border border-cyan-500/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shrink-0 flex-1 sm:flex-initial transition-all"
              >
                {MARS_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Earth-Mars Comms Delay Pill */}
              <div
                className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-mono border shrink-0 transition-all ${
                  emergencyOfflineMode
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                    : 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                }`}
                title="Real-time light travel delay between Earth and Mars"
              >
                <Radio className={`w-3.5 h-3.5 ${emergencyOfflineMode ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
                <span className="text-[10px] sm:text-[11px] font-semibold">
                  {emergencyOfflineMode ? 'OFFLINE' : `+${commsDelayMinutes}m`}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: 2D, 3D, HUD, AI System, Export, Audio, Specs */}
          <div className="w-full lg:w-auto flex flex-row overflow-x-auto no-scrollbar hide-scrollbar scrollbar-none items-center justify-start gap-1.5 sm:gap-2 pb-2 lg:pb-0 touch-pan-x min-w-0 px-0.5">
            {/* NASA Journey to Mars: Mission Impact Button */}
            <button
              onClick={onOpenMissionImpact}
              className="flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-mono border bg-gradient-to-r from-red-950/70 via-red-900/50 to-amber-950/60 hover:from-red-900/80 hover:to-amber-900/70 border-red-500/50 hover:border-red-400 text-red-200 transition-all duration-200 shadow-md shadow-red-950/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:-translate-y-0.5 active:translate-y-0 shrink-0 font-bold cursor-pointer"
              title="NASA's Journey to Mars: Role in Earth-Independent Colonization Phase"
            >
              <Rocket className="w-3.5 h-3.5 text-red-400 transform -rotate-45 shrink-0 animate-pulse" />
              <span className="hidden sm:inline">MISSION IMPACT</span>
              <span className="sm:hidden">IMPACT</span>
              <span className="hidden xl:inline-block px-1 py-0.2 bg-red-500/30 text-[9px] text-red-300 rounded font-semibold">
                NASA
              </span>
            </button>

            {/* AI Mission System Button */}
            <button
              onClick={onOpenAISystem}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border bg-cyan-950/50 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 hover:text-cyan-200 hover:shadow-[0_0_18px_rgba(6,182,212,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0 font-bold cursor-pointer"
              title="Open Autonomous Martian AI System (Gemini 3.8 Flash RAG)"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>AI SYSTEM</span>
            </button>

            {/* 2D / 3D Globe Projection Switcher */}
            <div className="bg-[#050814]/80 border border-cyan-500/20 backdrop-blur-md rounded-lg p-0.5 flex items-center text-xs font-mono shrink-0 shadow-inner">
              <button
                onClick={() => setMapMode('2D')}
                className={`px-2 sm:px-3 py-1 rounded-md flex items-center space-x-1.5 transition-all duration-200 cursor-pointer ${
                  mapMode === '2D'
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.45)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title="2D Tactical GIS Multi-Layer View"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>2D GIS</span>
              </button>
              <button
                onClick={() => setMapMode('3D')}
                className={`px-2 sm:px-3 py-1 rounded-md flex items-center space-x-1.5 transition-all duration-200 cursor-pointer ${
                  mapMode === '3D'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white font-bold shadow-[0_0_12px_rgba(239,68,68,0.45)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title="3D Mars Globe Projection (Cesium / WebGL)"
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>3D Globe</span>
              </button>
              <button
                onClick={() => setMapMode('ORBITAL')}
                className={`px-2 sm:px-3 py-1 rounded-md flex items-center space-x-1.5 transition-all duration-200 cursor-pointer ${
                  mapMode === 'ORBITAL'
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold shadow-[0_0_14px_rgba(168,85,247,0.45)]'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40'
                }`}
                title="ARES Orbital Intelligence: Satellite SAR / NISAR Surveillance HUD"
              >
                <Satellite className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Orbital SAR</span>
              </button>
            </div>

            {/* Universal Toggle UI / Hide Overlays Button */}
            {onToggleOverlays && (
              <button
                id="global-toggle-overlays-btn"
                onClick={onToggleOverlays}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center space-x-1.5 transition-all duration-200 shrink-0 cursor-pointer ${
                  showOverlays
                    ? 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                }`}
                title={showOverlays ? 'Hide Map Overlays & UI Panels' : 'Show Map Overlays & UI Panels'}
              >
                {showOverlays ? (
                  <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                )}
                <span className="hidden sm:inline">{showOverlays ? 'HIDE UI' : 'SHOW UI'}</span>
                <span className="sm:hidden">{showOverlays ? 'HIDE' : 'SHOW'}</span>
              </button>
            )}

            {/* Universal Fullscreen Button */}
            {onToggleFullscreen && (
              <button
                id="global-toggle-fullscreen-btn"
                onClick={onToggleFullscreen}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center space-x-1.5 transition-all duration-200 shrink-0 cursor-pointer ${
                  isFullscreen
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                }`}
                title={isFullscreen ? 'Exit Universal Fullscreen (Esc)' : 'Enter Universal Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                <span className="hidden sm:inline">{isFullscreen ? 'EXIT FULL' : 'FULLSCREEN'}</span>
                <span className="sm:hidden">{isFullscreen ? 'EXIT' : 'FULL'}</span>
              </button>
            )}

            {/* User Role Switcher: Mission Control vs Astronaut HUD */}
            <button
              onClick={() => setUserRole(userRole === 'MISSION_CONTROL' ? 'ASTRONAUT_HUD' : 'MISSION_CONTROL')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center space-x-1.5 transition-all duration-200 shrink-0 cursor-pointer ${
                userRole === 'ASTRONAUT_HUD'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-emerald-400 hover:text-emerald-300 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="hidden sm:inline">{userRole === 'ASTRONAUT_HUD' ? 'EXIT HUD' : 'ASTRONAUT HUD'}</span>
              <span className="sm:hidden">{userRole === 'ASTRONAUT_HUD' ? 'EXIT' : 'HUD'}</span>
            </button>

            {/* Mission Briefing PDF/Report Export */}
            <button
              onClick={onOpenReport}
              className="px-3 py-1.5 bg-gradient-to-r from-red-600 via-amber-600 to-red-500 hover:from-red-500 hover:to-amber-500 text-white font-mono font-bold text-xs rounded-lg shadow-md shadow-red-950/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.35)] hover:-translate-y-0.5 active:translate-y-0 flex items-center space-x-1.5 transition-all duration-200 shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>EXPORT</span>
            </button>

            {/* Offline Autonomous Mode Toggle */}
            <button
              onClick={() => setEmergencyOfflineMode(!emergencyOfflineMode)}
              className={`p-1.5 rounded-lg border text-xs font-mono transition-all duration-200 shrink-0 cursor-pointer ${
                emergencyOfflineMode
                  ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }`}
              title="Toggle Offline Autonomy (Simulate Deep Space Comms Blackout)"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Audio Feedback Toggle */}
            <button
              onClick={() => setAudioFeedback(!audioFeedback)}
              className="p-1.5 bg-slate-900/60 border border-slate-700/60 hover:border-cyan-500 rounded-lg text-slate-400 hover:text-slate-200 transition-all duration-200 shrink-0 cursor-pointer"
              title="Toggle Audio Feedback"
            >
              {audioFeedback ? <Volume2 className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Technical Spec & Code Architecture Modal */}
            <button
              onClick={onOpenTechSpec}
              className="px-2.5 py-1.5 bg-slate-900/60 border border-slate-700/60 hover:border-cyan-400 rounded-lg text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)] flex items-center space-x-1 transition-all duration-200 shrink-0 cursor-pointer"
              title="View FastAPI + PostGIS Architecture for NASA Space Apps Challenge"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">FASTAPI/SQL</span>
            </button>

            {/* User ID Badge */}
            {userId && (
              <div
                className="flex items-center space-x-1 px-2 py-1 rounded bg-[#070b14]/90 border border-cyan-500/30 text-[10px] sm:text-[11px] font-mono text-cyan-300 shrink-0 shadow-inner"
                title={`Active Mission User ID: ${userId}`}
              >
                <User className="w-3 h-3 text-cyan-400" />
                <span className="text-slate-400 hidden xl:inline">ID:</span>
                <span className="font-bold tracking-wider">{userId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
