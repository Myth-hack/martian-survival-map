/**
 * Orbital Intelligence View - Autonomous Mars Discovery & Scanning System (SAR / NISAR Interface)
 * NASA Space Apps Challenge 2026 - Team Quanta Buddies
 * 
 * Cinematic Sci-Fi HUD component inspired by NASA/ISRO SAR & NISAR radar interfaces:
 * - Central interactive 3D Mars globe with orbiting NASA MRO satellite and animated conical SAR beam
 * - Live Search & Query Interface (NASA PDS natural language + Lat/Lon coordinate resolver)
 * - Autonomous AI Scanning Mode (pings NASA API/PDS for latest discoveries and rover waypoints)
 * - Dynamic UI & Radar Sync with smooth 3D globe panning to target coordinates
 * - 'Target Acquired' HUD overlay showing authentic NASA metadata (Sol, Elevation, Instrument, Dielectric, Citation)
 * - Bottom-Left 'Before / After' terrain comparator with split slider
 * - Bottom-Center 'Mars Memory Timeline' showing orbital pass cards
 * - Right Sidebar 'Mission Layers' with glowing status indicators
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio,
  Satellite,
  Layers,
  Calendar,
  Sliders,
  Maximize2,
  Minimize2,
  X,
  Play,
  Pause,
  RotateCw,
  Compass,
  AlertTriangle,
  Activity,
  Zap,
  Clock,
  Sparkles,
  Search,
  Crosshair,
  Cpu,
  Target,
  ChevronDown,
  Info,
  CheckCircle2,
  Loader2,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import { MarsEnvironmentData } from '../types';
import { RealisticMarsGlobe, Html, latLonToVector3 } from './RealisticMarsGlobe';
import {
  OrbitalSarTarget,
  GROUND_TRUTH_PDS_TARGETS,
  searchOrbitalSarTargets,
  fetchNextAutonomousScanTarget
} from '../services/orbitalSarDiscoveryService';

interface OrbitalIntelligenceViewProps {
  onClose?: () => void;
  environment?: MarsEnvironmentData;
  initialTargetRegion?: string;
  showUI?: boolean;
  showOverlays?: boolean;
  onToggleUI?: () => void;
  onToggleOverlays?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface OrbitalPass {
  id: string;
  passNumber: number;
  sol: number;
  dateStr: string;
  targetRegion: string;
  frequency: string;
  swathWidthKm: number;
  resolutionMeters: number;
  dataSizeMb: number;
  status: 'PROCESSED' | 'ARCHIVED' | 'STREAMING';
  summary: string;
}

const ORBITAL_PASSES: OrbitalPass[] = [
  {
    id: 'pass_4120',
    passNumber: 4120,
    sol: 1180,
    dateStr: '2026-07-22',
    targetRegion: 'Jezero Western Delta',
    frequency: 'L-Band (1.25 GHz)',
    swathWidthKm: 42,
    resolutionMeters: 0.5,
    dataSizeMb: 1420,
    status: 'ARCHIVED',
    summary: 'High-coherence interferogram reveals delta bottomset clay beds.',
  },
  {
    id: 'pass_4121',
    passNumber: 4121,
    sol: 1195,
    dateStr: '2026-08-06',
    targetRegion: 'Valles Marineris Scarps',
    frequency: 'C-Band (5.4 GHz)',
    swathWidthKm: 65,
    resolutionMeters: 1.2,
    dataSizeMb: 1850,
    status: 'ARCHIVED',
    summary: 'Mass displacement scan of Candor Chasma wall collapse.',
  },
  {
    id: 'pass_4122',
    passNumber: 4122,
    sol: 1210,
    dateStr: '2026-08-21',
    targetRegion: 'Olympus Mons Caldera',
    frequency: 'P-Band Sounder (450 MHz)',
    swathWidthKm: 80,
    resolutionMeters: 5.0,
    dataSizeMb: 2100,
    status: 'ARCHIVED',
    summary: 'Deep sounder penetrates 1.2 km of basaltic caprock.',
  },
  {
    id: 'pass_4123',
    passNumber: 4123,
    sol: 1225,
    dateStr: '2026-09-05',
    targetRegion: 'Gale Crater Dune Margin',
    frequency: 'L-Band Polarimetric',
    swathWidthKm: 50,
    resolutionMeters: 0.8,
    dataSizeMb: 1680,
    status: 'ARCHIVED',
    summary: 'Surface roughness (Z0) mapping of Bagnold dune field.',
  },
  {
    id: 'pass_4124',
    passNumber: 4124,
    sol: 1240,
    dateStr: '2026-09-20',
    targetRegion: 'Victoria Crater Scallops (ACTIVE)',
    frequency: 'L-Band SAR + HiRISE Nadir',
    swathWidthKm: 35,
    resolutionMeters: 0.25,
    dataSizeMb: 2450,
    status: 'STREAMING',
    summary: 'Real-time multi-angle SAR scan with conical beam lock.',
  },
  {
    id: 'pass_4125',
    passNumber: 4125,
    sol: 1255,
    dateStr: '2026-10-05',
    targetRegion: 'Utopia Planitia Ice Basin',
    frequency: 'SHARAD Radar Sounder',
    swathWidthKm: 70,
    resolutionMeters: 3.0,
    dataSizeMb: 1980,
    status: 'PROCESSED',
    summary: 'Upcoming orbital track scheduled for subsurface ice volume quantification.',
  },
];

const SUGGESTED_QUERIES = [
  { label: '🧊 Ice Deposits', query: 'Find recent ice deposits' },
  { label: '🔴 Victoria Crater', query: 'Scan Victoria Crater' },
  { label: '🌊 Jezero Delta', query: 'Jezero Crater Western Delta' },
  { label: '🌋 Olympus Mons', query: 'Olympus Mons Caldera' },
  { label: '⚡ Cerberus Fissures', query: 'Cerberus Fossae tectonic fissures' },
  { label: '🧭 Custom Coordinates', query: '18.38, 77.58' },
];

export const OrbitalIntelligenceView: React.FC<OrbitalIntelligenceViewProps> = ({
  onClose,
  environment,
  initialTargetRegion = 'victoria_crater',
  showUI,
  showOverlays = true,
  onToggleUI,
  onToggleOverlays,
  isFullscreen: isFullscreenProp,
  onToggleFullscreen,
}) => {
  // Container Ref
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Global UI Visibility handling
  const isUIVisible = showUI !== undefined ? showUI : (showOverlays !== undefined ? showOverlays : true);
  const handleToggle = onToggleUI || onToggleOverlays;

  // Floating Active Panel State (default: null = all heavy panels collapsed for unobstructed 3D view)
  type SarPanelId = 'SCANNER' | 'TARGET' | 'COMPARATOR' | 'LAYERS' | 'TIMELINE';
  const [activePanel, setActivePanel] = useState<SarPanelId | null>(null);

  const togglePanel = (panel: SarPanelId) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  // 1. Orbital Target State
  const [selectedTarget, setSelectedTarget] = useState<OrbitalSarTarget>(() => {
    const found = GROUND_TRUTH_PDS_TARGETS.find((z) => z.id === initialTargetRegion);
    return found || GROUND_TRUTH_PDS_TARGETS[0];
  });

  // Smooth Globe Rotation / Panning State
  const [globeRotation, setGlobeRotation] = useState<{ yaw: number; pitch: number }>(() => ({
    yaw: (180 - (selectedTarget?.lon || 0) + 360) % 360,
    pitch: -(selectedTarget?.lat || 0),
  }));

  // Target Acquired HUD State
  const [showTargetHud, setShowTargetHud] = useState<boolean>(true);
  const [hudLockAnimation, setHudLockAnimation] = useState<boolean>(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Autonomous AI Scanning Mode State
  const [isAutoScanActive, setIsAutoScanActive] = useState<boolean>(false);
  const [autoScanCountdown, setAutoScanCountdown] = useState<number>(12);
  const [autoScanStatusMessage, setAutoScanStatusMessage] = useState<string>('AI IDLE');

  // Interactive View Controls
  const [activePass, setActivePass] = useState<OrbitalPass>(ORBITAL_PASSES[4]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1);
  const [internalIsFullscreen, setInternalIsFullscreen] = useState<boolean>(false);
  const isFullscreen = isFullscreenProp !== undefined ? isFullscreenProp : internalIsFullscreen;
  const handleToggleFullscreen = onToggleFullscreen || (() => setInternalIsFullscreen((v) => !v));
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Before / After Comparator State
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [comparatorMode, setComparatorMode] = useState<'SURFACE_SAR' | 'COHERENCE_DELTA' | 'TOPOGRAPHY_ELEV'>('SURFACE_SAR');
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Mission Layers Toggles
  const [layersState, setLayersState] = useState({
    lBand: true,
    cBand: false,
    pBand: true,
    radiometer: false,
    hiRise: true,
    ctxSwath: true,
    themisThermal: false,
    molaElev: true,
    diurnalPasses: true,
    seasonalBaseline: false,
    decadalArchive: true,
    permittivity: true,
    roughnessZ0: true,
    slopeGrad: true,
    thermalInertia: false,
    duneMigration: true,
    slopeInstability: true,
    boulderDensity: false,
    lavaTubes: true,
  });

  const toggleLayer = (key: keyof typeof layersState) => {
    setLayersState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper: Pan globe smoothly to target coordinates
  const panGlobeToTarget = useCallback((target: OrbitalSarTarget) => {
    setSelectedTarget(target);
    setShowTargetHud(true);
    setHudLockAnimation(true);

    const targetYaw = (180 - target.lon + 360) % 360;
    const targetPitch = -Math.max(-80, Math.min(80, target.lat));

    // Smooth step rotation
    setGlobeRotation({ yaw: targetYaw, pitch: targetPitch });

    // Reset lock animation flag after pulse
    setTimeout(() => {
      setHudLockAnimation(false);
    }, 1200);
  }, []);

  // 2. Search Handler: Resolves query via NASA PDS & Gemini AI
  const handleExecuteSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchFeedback('UPLINKING TO NASA PDS & AI ORBITAL RADAR...');

    try {
      const resolvedTarget = await searchOrbitalSarTargets(q);
      panGlobeToTarget(resolvedTarget);
      setSearchFeedback(`LOCKED: ${resolvedTarget.name}`);
      setTimeout(() => setSearchFeedback(null), 3000);
    } catch (_err) {
      setSearchFeedback('PDS SEARCH FALLBACK ACTIVE');
      setTimeout(() => setSearchFeedback(null), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Autonomous AI Scanning Loop
  useEffect(() => {
    if (!isAutoScanActive) {
      setAutoScanCountdown(12);
      setAutoScanStatusMessage('AI IDLE');
      return;
    }

    setAutoScanStatusMessage('AI RECON ACTIVE');

    const interval = setInterval(async () => {
      setAutoScanCountdown((prev) => {
        if (prev <= 1) {
          // Trigger autonomous NASA API ping
          setAutoScanStatusMessage('FETCHING NASA PDS TELEMETRY...');
          fetchNextAutonomousScanTarget()
            .then((target) => {
              panGlobeToTarget(target);
              setAutoScanStatusMessage(`AUTONOMOUS TARGET ACQUIRED: ${target.name}`);
              setTimeout(() => {
                if (isAutoScanActive) setAutoScanStatusMessage('AI RECON ACTIVE');
              }, 3000);
            })
            .catch(() => {
              setAutoScanStatusMessage('AI RESCAN RETRY');
            });
          return 12; // Reset 12s interval
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoScanActive, panGlobeToTarget]);

  // Zoom controls
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(2.5, Math.max(0.6, prev + delta)));
  };

  return (
    <div
      ref={containerRef}
      className={`${
        isFullscreen
          ? 'fixed inset-0 w-screen h-screen bg-black overflow-hidden z-[9900]'
          : 'relative w-full h-full flex-1 min-h-[400px] lg:min-h-0 bg-[#030712] rounded-2xl border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.18)] overflow-hidden'
      } font-mono text-slate-200 select-none flex flex-col`}
    >
      {/* 1. TOP BAR: Sleek Sci-Fi Status Header */}
      {isUIVisible && (
        <header className="relative z-30 flex items-center justify-between px-3 sm:px-4 py-2 bg-black/85 backdrop-blur-xl border-b border-cyan-500/30 gap-2 shrink-0 animate-in fade-in duration-200">
          {/* Branding & Satellite Telemetry */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/90 border border-cyan-400/70 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.5)]">
              <Satellite className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-['Orbitron'] font-black tracking-widest text-xs text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                  ARES ORBITAL SAR
                </span>
                <span className="px-1.5 py-0.2 text-[8px] font-bold uppercase rounded bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 hidden sm:inline">
                  MRO RADAR
                </span>
              </div>
              <div className="text-[9px] text-slate-400 flex items-center space-x-2">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  300km POLAR ORBIT
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="text-slate-300 font-mono hidden sm:inline">SOL {selectedTarget.solDate}</span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="text-cyan-400 font-semibold hidden md:inline">L-BAND (1.25 GHz)</span>
              </div>
            </div>
          </div>

          {/* Target Chip (Click to toggle target intel panel) */}
          <button
            onClick={() => togglePanel('TARGET')}
            className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              activePanel === 'TARGET'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 hover:bg-cyan-950/80 border-cyan-800/60 text-slate-300 hover:text-cyan-300'
            }`}
            title="Inspect Target Intel"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-xs truncate max-w-[130px] sm:max-w-[200px]">{selectedTarget.name}</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              ({selectedTarget.lat >= 0 ? `${selectedTarget.lat}°N` : `${Math.abs(selectedTarget.lat)}°S`})
            </span>
          </button>

          {/* Quick Header Controls: Play/Pause, Speed, Fullscreen, Close */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded bg-slate-900/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-400 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause Globe Rotation' : 'Resume Globe Rotation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setOrbitSpeed((prev) => (prev === 1 ? 4 : prev === 4 ? 10 : 1))}
              className="px-2 py-1 rounded bg-slate-900/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-xs text-cyan-300 font-bold transition-colors cursor-pointer"
              title="Orbit Speed (1x, 4x, 10x)"
            >
              {orbitSpeed}x
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded bg-slate-900/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-400 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 transition-colors cursor-pointer"
                title="Close Orbital View"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>
      )}

      {/* 2. CENTRAL VIEW: 3D Mars Globe, Orbiting MRO Satellite, Radar Beam & Dynamic Sync */}
      <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden">
        <RealisticMarsGlobe
          mode="sar"
          className="w-full h-full"
          zoom={zoomLevel}
          onZoomChange={setZoomLevel}
          autoRotate={isPlaying}
          autoRotateSpeed={0.8 * orbitSpeed}
          sarTargetZone={selectedTarget}
          orbitSpeedMultiplier={orbitSpeed}
          isOrbitPlaying={isPlaying}
          showSatellite={true}
          sunAngleDegrees={60}
          rotation={globeRotation}
        >
          {/* Surface Location Text Labels: Screen-tracked 3D coordinates using <Html> */}
          {GROUND_TRUTH_PDS_TARGETS.map((loc) => {
            const pos = latLonToVector3(loc.lat, loc.lon, 1.668);
            const isSelected = selectedTarget?.id === loc.id;

            return (
              <Html
                key={loc.id}
                position={[pos.x, pos.y, pos.z]}
                onClick={(e) => {
                  e.stopPropagation();
                  panGlobeToTarget(loc);
                }}
              >
                <div
                  className={`group flex items-center space-x-1.5 px-2 py-0.5 rounded-md backdrop-blur-md border transition-all duration-200 cursor-pointer shadow-lg select-none ${
                    isSelected
                      ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-110 z-30 ring-1 ring-cyan-400'
                      : 'bg-slate-950/90 hover:bg-slate-900 border-cyan-500/50 hover:border-cyan-400 text-slate-200 hover:scale-105'
                  }`}
                  title={`${loc.name} (${loc.lat.toFixed(1)}°N, ${loc.lon.toFixed(1)}°E) - ${loc.elevation}m`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isSelected
                        ? 'bg-cyan-400 animate-ping'
                        : 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                    }`}
                  />
                  <span className="font-mono text-[10px] md:text-[11px] font-bold tracking-tight whitespace-nowrap">
                    {loc.name.replace(/\s*\(.*\)/, '')}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300 px-1 py-0.2 bg-cyan-950/80 border border-cyan-800/40 rounded hidden sm:inline">
                    {loc.elevation >= 0 ? `+${loc.elevation}m` : `${loc.elevation}m`}
                  </span>
                </div>
              </Html>
            );
          })}
        </RealisticMarsGlobe>

        {/* Orbit Zoom Overlay Controls: strictly hidden when isUIVisible is false */}
        {isUIVisible && (
          <div className="absolute top-4 left-4 z-20 flex flex-col space-y-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-lg border border-cyan-900/60 animate-in fade-in duration-200">
            <button
              onClick={() => handleZoom(0.15)}
              className="w-7 h-7 flex items-center justify-center rounded bg-slate-900/80 hover:bg-cyan-950 border border-cyan-800/60 text-cyan-300 text-sm font-bold"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => handleZoom(-0.15)}
              className="w-7 h-7 flex items-center justify-center rounded bg-slate-900/80 hover:bg-cyan-950 border border-cyan-800/60 text-cyan-300 text-sm font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <div className="text-[9px] text-center text-slate-400 font-mono">
              {Math.round(zoomLevel * 100)}%
            </div>
          </div>
        )}


        {/* WIDGET 1: SAR Scanner & Search Console */}
        {isUIVisible && activePanel === 'SCANNER' && (
          <div className="absolute top-4 left-4 sm:left-16 z-30 w-80 sm:w-96 bg-black/90 backdrop-blur-2xl rounded-2xl border border-cyan-500/50 p-4 shadow-[0_0_30px_rgba(6,182,212,0.3)] space-y-3 animate-in fade-in duration-200 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2.5">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-['Orbitron'] font-bold text-xs text-cyan-300 tracking-wider">
                  NASA PDS RADAR SCANNER
                </span>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                title="Close Scanner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Search Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteSearch();
              }}
              className="relative flex items-center"
            >
              <div className="relative w-full flex items-center">
                <div className="absolute left-2.5 flex items-center pointer-events-none text-cyan-400">
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query NASA PDS: e.g. 'Victoria Crater', 'Ice deposits'..."
                  className="w-full pl-8 pr-16 py-2 bg-slate-950/90 text-cyan-200 text-xs font-mono rounded-lg border border-cyan-500/40 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-[inset_0_0_8px_rgba(6,182,212,0.15)] placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-1 px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-500/50 border border-cyan-400/50 text-[10px] text-cyan-300 font-bold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  {isSearching ? 'SCANNING' : 'SCAN'}
                </button>
              </div>
            </form>

            {searchFeedback && (
              <div className="text-cyan-400 text-[10px] font-bold animate-pulse px-1">
                {searchFeedback}
              </div>
            )}

            {/* PDS Preset Query Chips */}
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                PDS PRESETS:
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {SUGGESTED_QUERIES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(preset.query);
                      handleExecuteSearch(preset.query);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 text-[11px] transition-all cursor-pointer text-left"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Scan Status Info */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isAutoScanActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                <span>{autoScanStatusMessage}</span>
              </span>
              <button
                onClick={() => setIsAutoScanActive(!isAutoScanActive)}
                className="text-cyan-400 hover:underline font-bold text-[10px] cursor-pointer"
              >
                {isAutoScanActive ? 'Stop Auto' : 'Start Auto'}
              </button>
            </div>
          </div>
        )}

        {/* WIDGET 2: Target Acquired Holographic Intel Card */}
        {isUIVisible && activePanel === 'TARGET' && (
          <div
            className={`absolute top-4 right-4 sm:right-16 z-30 w-80 sm:w-96 bg-black/90 backdrop-blur-2xl rounded-2xl border border-cyan-400/50 p-4 shadow-[0_0_35px_rgba(6,182,212,0.35)] transition-all duration-300 pointer-events-auto ${
              hudLockAnimation ? 'ring-2 ring-cyan-300 scale-[1.02]' : ''
            }`}
          >
            {/* Holographic Header Bar */}
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2 mb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-['Orbitron'] font-bold text-xs text-cyan-300 tracking-wider flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  TARGET ACQUIRED
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="px-1.5 py-0.2 rounded bg-cyan-950/90 border border-cyan-500/60 text-[9px] text-cyan-300 font-bold uppercase">
                  {selectedTarget.source.replace(/_/g, ' ')}
                </span>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                  title="Close Target HUD"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Target Metadata Card */}
            <div className="space-y-2.5 text-xs max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="font-bold text-sm text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
                  {selectedTarget.name}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                  <span className="text-cyan-400 font-semibold">{selectedTarget.featureType}</span>
                  <span className="font-mono">
                    SOL {selectedTarget.solDate} ({selectedTarget.earthDate})
                  </span>
                </div>
              </div>

              {/* Coordinates & Elevation Strip */}
              <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 bg-slate-950/80 rounded-lg border border-cyan-900/60 text-[10px] font-mono text-center">
                <div>
                  <div className="text-slate-500">LATITUDE</div>
                  <div className="text-cyan-300 font-bold">
                    {selectedTarget.lat >= 0 ? `${selectedTarget.lat}°N` : `${Math.abs(selectedTarget.lat)}°S`}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">LONGITUDE</div>
                  <div className="text-cyan-300 font-bold">
                    {selectedTarget.lon >= 0 ? `${selectedTarget.lon}°E` : `${Math.abs(selectedTarget.lon)}°W`}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">ELEVATION</div>
                  <div className="text-emerald-400 font-bold">{selectedTarget.elevation} m</div>
                </div>
              </div>

              {/* SAR Radar Profile Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-1.5 bg-slate-950/60 rounded border border-slate-800">
                  <div className="text-slate-400 flex justify-between">
                    <span>Backscatter:</span>
                    <strong className="text-cyan-300">{selectedTarget.sarBackscatterDb} dB</strong>
                  </div>
                  <div className="text-slate-400 flex justify-between mt-1">
                    <span>Coherence γ:</span>
                    <strong className="text-emerald-400">{selectedTarget.coherenceGamma}</strong>
                  </div>
                </div>
                <div className="p-1.5 bg-slate-950/60 rounded border border-slate-800">
                  <div className="text-slate-400 flex justify-between">
                    <span>Dielectric ε_r:</span>
                    <strong className="text-amber-400">{selectedTarget.dielectricPermittivity}</strong>
                  </div>
                  <div className="text-slate-400 flex justify-between mt-1">
                    <span>Ice Prob:</span>
                    <strong className="text-cyan-300">
                      {selectedTarget.radarProfile?.iceProbabilityPct ?? 25}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Scientific Significance Briefing */}
              <div className="p-2 bg-cyan-950/30 rounded border border-cyan-900/40 text-[10px] leading-relaxed text-slate-300">
                <span className="text-cyan-400 font-bold">GEOLOGICAL INTELLIGENCE: </span>
                {selectedTarget.scientificSignificance}
              </div>

              {/* Mission Instrument & Official PDS Citation */}
              <div className="space-y-1 text-[9px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                <div className="flex items-center justify-between">
                  <span>INSTRUMENT:</span>
                  <span className="text-cyan-300 font-semibold">{selectedTarget.missionInstrument}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>DATASET CITATION:</span>
                  <span className="text-slate-300 font-mono truncate max-w-[180px]" title={selectedTarget.nasaPdsCitation}>
                    {selectedTarget.nasaPdsCitation}
                  </span>
                </div>
                {selectedTarget.hazardNote && (
                  <div className="flex items-center space-x-1 text-red-400 pt-0.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span className="truncate">{selectedTarget.hazardNote}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* WIDGET 3: Terrain Dual-Image Split Comparator */}
        {isUIVisible && activePanel === 'COMPARATOR' && (
          <div className="absolute bottom-28 left-4 z-30 w-80 sm:w-96 bg-black/90 backdrop-blur-2xl rounded-2xl border border-cyan-500/50 p-3.5 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-in fade-in duration-200 pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-xs text-cyan-300 tracking-wider">
                  TERRAIN DUAL COMPARATOR
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  SOL 894 <span className="text-cyan-400">vs</span> SOL {selectedTarget.solDate}
                </span>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                  title="Close Comparator"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dual-Image Split Canvas */}
            <div
              className="relative w-full h-32 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 cursor-ew-resize select-none"
              onMouseDown={() => setIsDraggingSlider(true)}
              onMouseUp={() => setIsDraggingSlider(false)}
              onMouseMove={(e) => {
                if (!isDraggingSlider) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                setSliderPosition(pos);
              }}
            >
              {/* "After" Image / Current SAR Pass */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/60 via-slate-900 to-amber-950/50 p-2 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-[10px] text-cyan-300 font-bold">
                    SOL {selectedTarget.solDate} (TARGET)
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold">
                    SAR COHERENCE: {selectedTarget.coherenceGamma}
                  </span>
                </div>
                <div className="w-full h-12 opacity-35 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:8px_8px]" />
                <div className="text-[9px] text-slate-300">
                  Dielectric: <span className="text-cyan-300 font-bold">{selectedTarget.dielectricPermittivity}</span> • Backscatter:{' '}
                  <span className="text-amber-300 font-bold">{selectedTarget.sarBackscatterDb} dB</span>
                </div>
              </div>

              {/* "Before" Image / Baseline Pass */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-amber-950/70 via-slate-900 to-red-950/60 p-2 flex flex-col justify-between border-r-2 border-cyan-400 shadow-[0_0_10px_#06b6d4]"
                style={{ width: `${sliderPosition}%` }}
              >
                <div className="flex justify-between items-start">
                  <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-[10px] text-amber-300 font-bold whitespace-nowrap">
                    SOL 894 (BASELINE)
                  </span>
                </div>
                <div className="w-full h-12 opacity-30 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:8px_8px]" />
                <div className="text-[9px] text-slate-300 whitespace-nowrap">
                  Baseline SAR: <span className="text-amber-300 font-bold">-16.8 dB</span>
                </div>
              </div>

              {/* Vertical Draggable Divider Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_8px_#06b6d4] pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-cyan-500 border-2 border-slate-950 flex items-center justify-center shadow-lg">
                  <Sliders className="w-2.5 h-2.5 text-slate-950" />
                </div>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
              <div className="flex space-x-1">
                <button
                  onClick={() => setComparatorMode('SURFACE_SAR')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    comparatorMode === 'SURFACE_SAR'
                      ? 'bg-cyan-600 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SAR Swath
                </button>
                <button
                  onClick={() => setComparatorMode('COHERENCE_DELTA')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    comparatorMode === 'COHERENCE_DELTA'
                      ? 'bg-cyan-600 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Coherence Δ
                </button>
              </div>
              <span className="text-cyan-400 font-bold font-mono">
                Split: {Math.round(sliderPosition)}%
              </span>
            </div>
          </div>
        )}

        {/* WIDGET 4: Mission Layers & Sensors */}
        {isUIVisible && activePanel === 'LAYERS' && (
          <aside className="absolute top-4 right-4 z-30 w-72 max-h-[calc(100%-8rem)] bg-black/90 backdrop-blur-2xl rounded-2xl border border-cyan-500/50 p-4 shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-y-auto flex flex-col space-y-3 text-xs animate-in fade-in duration-200 pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="font-bold tracking-wider text-cyan-300">
                  MISSION LAYERS
                </span>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                title="Close Layers"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Signal Level */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>1. SIGNAL LEVEL</span>
                <span className="text-cyan-400">POLARIZATION</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => toggleLayer('lBand')}
                  className={`px-2 py-1.5 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                    layersState.lBand
                      ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>L-Band (1.25GHz)</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${layersState.lBand ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                </button>
                <button
                  onClick={() => toggleLayer('pBand')}
                  className={`px-2 py-1.5 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                    layersState.pBand
                      ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>P-Band Sounder</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${layersState.pBand ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                </button>
              </div>
            </div>

            {/* 2. Spatial Resolution */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>2. SPATIAL SENSORS</span>
                <span className="text-cyan-400">RESOLUTION</span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => toggleLayer('hiRise')}
                  className={`w-full px-2 py-1.5 rounded border flex items-center justify-between transition-all cursor-pointer ${
                    layersState.hiRise
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>0.25m/px HiRISE Stereo DTM</span>
                  <span className="font-bold text-[9px]">ULTRA-RES</span>
                </button>
                <button
                  onClick={() => toggleLayer('molaElev')}
                  className={`w-full px-2 py-1.5 rounded border flex items-center justify-between transition-all cursor-pointer ${
                    layersState.molaElev
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>463m/px MOLA Global Altimetry</span>
                  <span className="font-bold text-[9px]">DATUM</span>
                </button>
              </div>
            </div>

            {/* 3. Physical & Hazard Layer */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>3. PHYSICAL METRICS</span>
                <span className="text-amber-400">GEOTECHNICAL</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  onClick={() => toggleLayer('permittivity')}
                  className={`p-1.5 rounded border text-left cursor-pointer ${
                    layersState.permittivity ? 'bg-amber-950/60 border-amber-500 text-amber-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold">Permittivity ε_r</div>
                  <div className="text-[9px] text-slate-400">Ice / Basalt</div>
                </button>
                <button
                  onClick={() => toggleLayer('lavaTubes')}
                  className={`p-1.5 rounded border text-left cursor-pointer ${
                    layersState.lavaTubes ? 'bg-purple-950/60 border-purple-500 text-purple-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold">Subsurface Cavity</div>
                  <div className="text-[9px] text-slate-400">ISRU Shelter</div>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* WIDGET 5: Mars Memory Timeline // PDS Orbital Pass Archive */}
        {isUIVisible && activePanel === 'TIMELINE' && (
          <div className="absolute bottom-28 left-4 right-4 z-30 max-w-4xl mx-auto bg-black/90 backdrop-blur-2xl rounded-2xl border border-cyan-500/50 p-3.5 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-in fade-in duration-200 pointer-events-auto">
            {/* Timeline Title & Current Pass Stats */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-cyan-300 tracking-wider">
                  MARS MEMORY TIMELINE // PDS ORBITAL PASS ARCHIVE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono hidden sm:flex items-center space-x-3">
                <span>CURRENT PASS: <strong className="text-white">#{activePass.passNumber}</strong></span>
                <span>•</span>
                <span>SOL: <strong className="text-cyan-300">{activePass.sol}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{activePass.status}</span>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                title="Close Timeline"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Horizontal Scrollable Pass Cards */}
            <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar scrollbar-none py-1">
              {ORBITAL_PASSES.map((pass) => {
                const isCurrent = pass.id === activePass.id;
                return (
                  <button
                    key={pass.id}
                    onClick={() => {
                      setActivePass(pass);
                      const matched = GROUND_TRUTH_PDS_TARGETS.find((t) =>
                        pass.targetRegion.toLowerCase().includes(t.id) ||
                        t.name.toLowerCase().includes(pass.targetRegion.toLowerCase().split(' ')[0])
                      );
                      if (matched) {
                        panGlobeToTarget(matched);
                      }
                    }}
                    className={`flex-shrink-0 w-52 sm:w-56 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-[1.01]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-cyan-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-[11px] text-white">
                        PASS #{pass.passNumber}
                      </span>
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                          pass.status === 'STREAMING'
                            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        SOL {pass.sol}
                      </span>
                    </div>

                    <div className="text-[10px] text-cyan-300 font-semibold truncate mb-0.5">
                      {pass.targetRegion}
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400">
                      <span>{pass.frequency}</span>
                      <span className="text-slate-300 font-mono">{pass.resolutionMeters}m</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. BULLETPROOF FIXED QUICK ACCESS DOCK (Direct sibling to Canvas container) */}
      {isUIVisible && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto flex items-center space-x-1 sm:space-x-2 bg-slate-950/95 border border-cyan-500/60 backdrop-blur-2xl rounded-2xl p-1.5 sm:p-2 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(6,182,212,0.3)] max-w-[calc(100vw-2rem)] overflow-x-auto hide-scrollbar">
          {/* Dock 1: SAR Scanner */}
          <button
            onClick={() => togglePanel('SCANNER')}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl flex items-center space-x-1.5 text-xs font-mono font-bold transition-all cursor-pointer ${
              activePanel === 'SCANNER'
                ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400'
                : 'hover:bg-slate-900 text-slate-400 hover:text-cyan-300 border border-transparent'
            }`}
            title="Autonomous Search & PDS Query Console"
          >
            <Search className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="hidden md:inline">Scanner</span>
          </button>

          {/* Dock 2: Target Intel */}
          <button
            onClick={() => togglePanel('TARGET')}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl flex items-center space-x-1.5 text-xs font-mono font-bold transition-all cursor-pointer ${
              activePanel === 'TARGET'
                ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400'
                : 'hover:bg-slate-900 text-slate-400 hover:text-emerald-300 border border-transparent'
            }`}
            title="Target Intel & Geotechnical Data"
          >
            <Target className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Target Intel</span>
          </button>

          {/* Dock 3: Terrain Comparator */}
          <button
            onClick={() => togglePanel('COMPARATOR')}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl flex items-center space-x-1.5 text-xs font-mono font-bold transition-all cursor-pointer ${
              activePanel === 'COMPARATOR'
                ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400'
                : 'hover:bg-slate-900 text-slate-400 hover:text-amber-300 border border-transparent'
            }`}
            title="Dual-Pass Terrain Split Comparator"
          >
            <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden md:inline">Comparator</span>
          </button>

          {/* Dock 4: Mission Layers */}
          <button
            onClick={() => togglePanel('LAYERS')}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl flex items-center space-x-1.5 text-xs font-mono font-bold transition-all cursor-pointer ${
              activePanel === 'LAYERS'
                ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400'
                : 'hover:bg-slate-900 text-slate-400 hover:text-purple-300 border border-transparent'
            }`}
            title="Mission Layers & Sensors"
          >
            <Layers className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="hidden md:inline">Sensors</span>
          </button>

          {/* Dock 5: Mars Memory Timeline */}
          <button
            onClick={() => togglePanel('TIMELINE')}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl flex items-center space-x-1.5 text-xs font-mono font-bold transition-all cursor-pointer ${
              activePanel === 'TIMELINE'
                ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400'
                : 'hover:bg-slate-900 text-slate-400 hover:text-sky-300 border border-transparent'
            }`}
            title="Mars Memory Timeline // PDS Orbital Passes"
          >
            <Clock className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="hidden md:inline">Timeline</span>
          </button>

          <span className="w-px h-5 bg-slate-800" />

          {/* Autonomous AI Quick Scan Toggle */}
          <button
            onClick={() => setIsAutoScanActive(!isAutoScanActive)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              isAutoScanActive
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse'
                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-emerald-300'
            }`}
            title="Autonomous AI Recon: Continuously discovers new planetary locations"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">{isAutoScanActive ? `AI (${autoScanCountdown}s)` : 'AI Auto'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
