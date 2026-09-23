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
    <header className="bg-[#0b0f17]/95 border-b border-cyan-950/60 sticky top-0 z-40 backdrop-blur-md px-2.5 sm:px-4 lg:px-6 py-2 sm:py-2.5 w-full max-w-full overflow-x-hidden">
      <div className="max-w-[1920px] w-full mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-3 min-w-0">
        {/* Left & Center: Title + Region Selector (Stacked vertically with flex-col on small screens, flex-row on lg) */}
        <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center justify-between lg:justify-start gap-2 sm:gap-3 lg:gap-4 w-full lg:w-auto min-w-0">
          {/* Left: Project Branding & Team Quanta Buddies Badge */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-red-600 via-amber-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-red-950/50 shrink-0">
              <div className="w-full h-full bg-[#080b12] rounded-[7px] flex items-center justify-center text-red-400 font-bold text-base sm:text-lg font-mono">
                ♂
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-['Orbitron'] tracking-wider font-extrabold text-xs sm:text-sm lg:text-base text-slate-100 whitespace-nowrap">
                  INTERPLANETARY SURVIVAL GUIDE
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider rounded bg-red-950/80 border border-red-500/50 text-red-300 whitespace-nowrap">
                  Martian Map
                </span>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-[10px] sm:text-[11px] text-slate-400 font-mono whitespace-nowrap">
                <span className="text-cyan-400 font-semibold">Team Quanta Buddies</span>
                <span>•</span>
                <span className="text-amber-400">NASA 2026</span>
                <span>•</span>
                <span className="text-slate-300">Sol {solNumber}</span>
              </div>
            </div>
          </div>

          {/* Region Switcher & Telemetry Pill */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-900/80 border border-slate-800 rounded-lg p-1 w-full sm:w-auto overflow-x-auto hide-scrollbar shrink-0">
            <label className="text-[11px] font-mono text-slate-400 px-1 sm:px-2 flex items-center space-x-1 shrink-0">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>REGION:</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as MapRegionId)}
              className="bg-slate-950 text-cyan-300 text-xs font-mono font-medium rounded px-2 py-1 border border-slate-700/60 focus:outline-none focus:border-cyan-500 shrink-0 flex-1 sm:flex-initial"
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
        </div>

        {/* Action Buttons: 2D, 3D, HUD, AI System, Export, Audio, Specs
            Horizontally scrollable flex container with justify-start so leftmost buttons never clip */}
        <div className="w-full lg:w-auto flex flex-row overflow-x-auto no-scrollbar hide-scrollbar scrollbar-none items-center justify-start gap-1.5 sm:gap-2 pb-2 lg:pb-0 touch-pan-x min-w-0 px-0.5">
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
            title="Open Autonomous Martian AI System (Gemini 3.8 Flash RAG)"
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

          {/* Universal Toggle UI / Hide Overlays Button (Universal across 2D GIS, 3D Globe, and Orbital SAR) */}
          {onToggleOverlays && (
            <button
              id="global-toggle-overlays-btn"
              onClick={onToggleOverlays}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                showOverlays
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
                  : 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-lg shadow-amber-950/50'
              }`}
              title={showOverlays ? 'Hide Map Overlays & UI Panels (Universal 2D/3D/SAR)' : 'Show Map Overlays & UI Panels (Universal 2D/3D/SAR)'}
            >
              {showOverlays ? (
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                isFullscreen
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-300'
              }`}
              title={isFullscreen ? 'Exit Universal Fullscreen (Esc)' : 'Enter Universal Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="hidden sm:inline">{isFullscreen ? 'EXIT FULL' : 'FULLSCREEN'}</span>
              <span className="sm:hidden">{isFullscreen ? 'EXIT' : 'FULL'}</span>
            </button>
          )}

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
      </div>
    </header>
  );
};
