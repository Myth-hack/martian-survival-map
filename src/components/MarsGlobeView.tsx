/**
 * 3D Interactive Mars Globe Component (Main Globe View)
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * 
 * Powered by RealisticMarsGlobe (Three.js WebGL PBR):
 * - NASA High-Resolution PBR Textures (Albedo, Normal & Bump Maps)
 * - Authentic Thin Martian Atmosphere Glow (Dusty hazel/orange limb scattering)
 * - Directional Harsh Sun Lighting casting dynamic crater shadows
 * - OrbitControls for completely free 3D rotation, damping, and zooming
 * - Real-time <Html> tracking labels for 10 strategic Martian locations (+ dynamic custom additions)
 * - 100% Isolated from Orbital SAR: No satellites, radar beams, or locked camera sweeps
 */

import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Sparkles,
  Sun,
  MapPin,
  Plus,
  Tag,
  X,
  Compass,
  Check,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { MarsCoordinates } from '../types';
import { MARS_REGIONS } from '../data/marsDatasets';
import {
  RealisticMarsGlobe,
  Html,
  GlobeLocation,
  latLonToVector3
} from './RealisticMarsGlobe';

// 10 Strategic Martian Locations baseline
const INITIAL_STRATEGIC_LOCATIONS: GlobeLocation[] = MARS_REGIONS.map((region) => {
  let type: GlobeLocation['type'] = 'landing_site';
  if (region.id === 'olympus_mons') type = 'mountain';
  else if (region.id === 'valles_marineris' || region.id === 'noctis_labyrinthus') type = 'canyon';
  else if (region.id === 'jezero' || region.id === 'gale') type = 'crater';
  else if (region.id === 'hellas_planitia' || region.id === 'planum_boreum') type = 'basin';

  return {
    id: region.id,
    name: region.name.replace(/\s*\(.*\)/, ''), // Clean short label
    lat: region.center.lat,
    lon: region.center.lon,
    elevationMeters: region.center.elevationMeters,
    description: region.description,
    type,
    isCustom: false
  };
});

interface MarsGlobeViewProps {
  onGlobeClickPoint?: (coords: MarsCoordinates) => void;
  onAnalyzeCoords?: (lat: number, lon: number, elevation: number) => void;
  activeStartPoint?: MarsCoordinates | null;
  activeGoalPoint?: MarsCoordinates | null;
  targetRegion?: MarsCoordinates | null;
  highlightedPoint?: MarsCoordinates | null;
  showUI?: boolean;
  showOverlays?: boolean;
  onToggleUI?: () => void;
  onToggleOverlays?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const MarsGlobeView: React.FC<MarsGlobeViewProps> = ({
  onGlobeClickPoint,
  onAnalyzeCoords,
  activeStartPoint,
  activeGoalPoint,
  targetRegion,
  highlightedPoint,
  showUI,
  showOverlays = true,
  onToggleUI,
  onToggleOverlays,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const isUIVisible = showUI !== undefined ? showUI : (showOverlays !== undefined ? showOverlays : true);
  const handleToggle = onToggleUI || onToggleOverlays;
  // Free camera rotation angles & zoom
  const [rotation, setRotation] = useState({ yaw: 110, pitch: -18 });
  const [zoom, setZoom] = useState(1.0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGraticule, setShowGraticule] = useState(true);
  const [showLandingSites, setShowLandingSites] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [sunAngle, setSunAngle] = useState(55);

  // Dynamic Martian Locations state (supports adding new locations dynamically)
  const [locations, setLocations] = useState<GlobeLocation[]>(INITIAL_STRATEGIC_LOCATIONS);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Raycasting hover telemetry
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number; elev: number; terrain: string } | null>(null);

  // Modal state for dynamically adding custom Martian locations
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocLat, setNewLocLat] = useState('0.0');
  const [newLocLon, setNewLocLon] = useState('0.0');
  const [newLocElev, setNewLocElev] = useState('0');
  const [newLocType, setNewLocType] = useState<GlobeLocation['type']>('custom');

  // Smooth cinematic rotation to target region or highlighted point when requested
  useEffect(() => {
    const point = highlightedPoint || targetRegion;
    if (!point) return;
    const targetYaw = -point.lon;
    const targetPitch = point.lat;

    let startYaw = rotation.yaw;
    let diffYaw = ((targetYaw - startYaw + 540) % 360) - 180;
    let startPitch = rotation.pitch;
    let diffPitch = targetPitch - startPitch;

    let startTime = performance.now();
    const duration = 800;

    let animId: number;
    const animateRotation = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setRotation({
        yaw: startYaw + diffYaw * ease,
        pitch: startPitch + diffPitch * ease
      });

      if (progress < 1) {
        animId = requestAnimationFrame(animateRotation);
      }
    };

    animId = requestAnimationFrame(animateRotation);
    return () => cancelAnimationFrame(animId);
  }, [targetRegion, highlightedPoint]);

  const handleGlobeClick = (coords: MarsCoordinates) => {
    if (onAnalyzeCoords) {
      onAnalyzeCoords(coords.lat, coords.lon, coords.elevationMeters);
    }
    if (onGlobeClickPoint) {
      onGlobeClickPoint(coords);
    }
  };

  const handleSelectLocation = (loc: GlobeLocation) => {
    setSelectedLocationId(loc.id);
    setRotation({
      yaw: -loc.lon,
      pitch: loc.lat
    });
    setZoom(1.25);
    handleGlobeClick({
      lat: loc.lat,
      lon: loc.lon,
      elevationMeters: loc.elevationMeters,
      name: loc.name
    });
  };

  const handleAddLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    const lat = Math.max(-90, Math.min(90, parseFloat(newLocLat) || 0));
    const lon = ((parseFloat(newLocLon) || 0) + 180) % 360 - 180;
    const elevationMeters = parseInt(newLocElev, 10) || 0;

    const newLoc: GlobeLocation = {
      id: `custom_${Date.now()}`,
      name: newLocName.trim(),
      lat,
      lon,
      elevationMeters,
      type: newLocType,
      isCustom: true
    };

    setLocations((prev) => [...prev, newLoc]);
    setSelectedLocationId(newLoc.id);
    setRotation({ yaw: -lon, pitch: lat });
    setZoom(1.3);

    // Reset form
    setNewLocName('');
    setIsAddModalOpen(false);

    handleGlobeClick({
      lat,
      lon,
      elevationMeters,
      name: newLoc.name
    });
  };

  const populateFromCursor = () => {
    if (cursorCoords) {
      setNewLocLat(cursorCoords.lat.toFixed(2));
      setNewLocLon(cursorCoords.lon.toFixed(2));
      setNewLocElev(cursorCoords.elev.toString());
      if (!newLocName) {
        setNewLocName(cursorCoords.terrain.split(' ')[0] + ' Station');
      }
    }
  };

  return (
    <div className="relative w-full h-full flex-1 min-h-[360px] lg:min-h-0 bg-[#03060c] rounded-xl border border-cyan-950/60 overflow-hidden shadow-2xl flex flex-col items-center justify-center">
      {/* Photorealistic Three.js 3D Mars Globe (No Satellites, Free OrbitControls) */}
      <RealisticMarsGlobe
        mode="explorer"
        className="w-full h-full"
        zoom={zoom}
        onZoomChange={setZoom}
        rotation={rotation}
        onRotationChange={setRotation}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
        sunAngleDegrees={sunAngle}
        showGraticule={showGraticule}
        showLandingSites={showLandingSites}
        locations={locations}
        selectedLocationId={selectedLocationId || undefined}
        onSelectLocation={handleSelectLocation}
        activeStartPoint={activeStartPoint}
        activeGoalPoint={activeGoalPoint}
        targetRegion={targetRegion}
        highlightedPoint={highlightedPoint}
        onGlobeClickPoint={handleGlobeClick}
        onHoverCoords={setCursorCoords}
        showSatellite={false}
      >
        {/* Dynamic Screen-Tracked <Html> Text Labels: Surface Markers ALWAYS visible regardless of showUI */}
        {showLabels &&
          locations.map((loc) => {
            const pos = latLonToVector3(loc.lat, loc.lon, 1.668);
            const isSelected = selectedLocationId === loc.id;

            return (
              <Html
                key={loc.id}
                position={[pos.x, pos.y, pos.z]}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectLocation(loc);
                }}
              >
                <div
                  className={`group relative flex items-center space-x-1.5 px-2 py-0.5 rounded backdrop-blur-md border transition-all duration-200 cursor-pointer shadow-lg select-none ${
                    isSelected
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-cyan-950/90 scale-110 z-30 ring-1 ring-cyan-400'
                      : loc.isCustom
                      ? 'bg-emerald-950/85 hover:bg-emerald-900 border-emerald-600/80 text-emerald-200 hover:scale-105'
                      : 'bg-slate-950/85 hover:bg-slate-900 border-slate-700/80 hover:border-amber-400 text-slate-200 hover:scale-105'
                  }`}
                  title={`${loc.name} (${loc.lat.toFixed(1)}°N, ${loc.lon.toFixed(1)}°E) - ${loc.elevationMeters}m`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? 'bg-cyan-400 animate-ping'
                        : loc.type === 'mountain'
                        ? 'bg-rose-400'
                        : loc.type === 'canyon'
                        ? 'bg-sky-400'
                        : loc.type === 'crater'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span className="font-mono text-[10px] md:text-[11px] font-bold tracking-tight whitespace-nowrap">
                    {loc.name}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300 px-1 py-0.2 bg-cyan-950/70 border border-cyan-800/40 rounded">
                    {loc.elevationMeters >= 0 ? `+${loc.elevationMeters}m` : `${loc.elevationMeters}m`}
                  </span>
                </div>
              </Html>
            );
          })}
      </RealisticMarsGlobe>

      {/* Top Floating Telemetry HUD */}
      {isUIVisible && (
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10 animate-in fade-in duration-200">
          <div className="bg-slate-950/85 border border-cyan-800/60 backdrop-blur-md rounded-lg p-2 px-3 flex items-center space-x-3 pointer-events-auto shadow-lg">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <div className="font-mono text-xs">
              <span className="text-slate-400">PBR 3D GLOBE: </span>
              <span className="text-cyan-300 font-bold">NASA HIGH-RES TEXTURES</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400">
              <Sparkles className="w-3 h-3" />
              <span>MOLA NORMAL & BUMP DISPLACEMENT</span>
            </div>
          </div>

          {/* Dynamic Coordinates HUD from Raycasting */}
          {cursorCoords ? (
            <div className="bg-slate-950/90 border border-slate-700/80 backdrop-blur-md rounded-lg p-2 px-3 font-mono text-xs text-slate-300 flex items-center space-x-3 shadow-lg pointer-events-auto">
              <span>LAT: <span className="text-amber-300 font-bold">{cursorCoords.lat}°N</span></span>
              <span>LON: <span className="text-amber-300 font-bold">{cursorCoords.lon}°E</span></span>
              <span>ELEV: <span className="text-cyan-300 font-bold">{cursorCoords.elev}m</span></span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 text-[11px] max-w-[170px] truncate">{cursorCoords.terrain}</span>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800/80 backdrop-blur-md rounded-lg p-1.5 px-3 font-mono text-[11px] text-slate-400 hidden sm:flex items-center space-x-2 pointer-events-auto">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              <span>DRAG TO ORBIT • SCROLL TO ZOOM • HOVER FOR MOLA ELEVATION</span>
            </div>
          )}
        </div>
      )}

      {/* Top-Right Quick Graphic & Control Panel */}
      {isUIVisible && (
        <div className="absolute top-16 right-4 z-10 flex flex-col space-y-2 bg-slate-950/90 border border-cyan-900/50 backdrop-blur-md rounded-lg p-2.5 font-mono text-xs shadow-xl max-w-[210px] animate-in fade-in duration-200">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Solar Angle</span>
            </span>
            <span className="text-amber-300 font-bold">{sunAngle}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={sunAngle}
            onChange={(e) => setSunAngle(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            title={`Sun Angle: ${sunAngle}°`}
          />

          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                autoRotate
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {autoRotate ? 'Spin: ON' : 'Spin: OFF'}
            </button>

            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors flex items-center space-x-1 ${
                showLabels
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title="Toggle Location Text Labels"
            >
              <Tag className="w-2.5 h-2.5" />
              <span>Labels</span>
            </button>

            <button
              onClick={() => setShowGraticule(!showGraticule)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                showGraticule
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title="Toggle Latitude / Longitude Graticule"
            >
              Grid
            </button>

            <button
              onClick={() => setShowLandingSites(!showLandingSites)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                showLandingSites
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title="Toggle Planetary Landing Sites"
            >
              Pins
            </button>
          </div>

          {/* Dynamic Location Adder Button */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 text-[11px] font-bold transition-colors shadow-md"
            >
              <Plus className="w-3 h-3 text-cyan-400" />
              <span>Add Landmark</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Strategic Location Selector Chips */}
      {isUIVisible && (
        <div className="absolute top-16 left-4 z-10 hidden xl:flex flex-col space-y-1 bg-slate-950/85 border border-slate-800/80 backdrop-blur-md rounded-lg p-2 font-mono text-[11px] max-h-[380px] overflow-y-auto animate-in fade-in duration-200">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1 px-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Strategic Sites ({locations.length})</span>
          </div>
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleSelectLocation(loc)}
              className={`text-left px-2 py-1 rounded transition-colors flex items-center justify-between space-x-2 ${
                selectedLocationId === loc.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'hover:bg-slate-900 text-slate-300 hover:text-cyan-200'
              }`}
            >
              <span className="truncate max-w-[130px]">{loc.name}</span>
              <span className="text-[9px] text-slate-500">{loc.lat > 0 ? `${loc.lat.toFixed(0)}°N` : `${Math.abs(loc.lat).toFixed(0)}°S`}</span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom Floating Interactive Instruction & Orbit Controls Bar */}
      {isUIVisible && (
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10 animate-in fade-in duration-200">
          {/* Dynamic Instruction Badge */}
          <div className="bg-slate-950/90 border border-cyan-700/50 backdrop-blur-md rounded-lg px-3 py-1.5 pointer-events-auto flex items-center space-x-2 text-xs font-mono">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-slate-300">
              Click <strong className="text-cyan-300">ANY location marker</strong> or point on Mars to focus & inspect
            </span>
          </div>

          {/* Orbit Camera Tools */}
          <div className="flex items-center space-x-1.5 bg-slate-950/85 border border-slate-800 backdrop-blur-md rounded-lg p-1.5 pointer-events-auto shadow-lg">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setRotation({ yaw: 110, pitch: -18 });
                setZoom(1.0);
                setSelectedLocationId(null);
              }}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
              title="Reset Camera (North Up)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors border-l border-slate-800 pl-2"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Persistent Floating Toggle Button when UI is hidden */}
      {!isUIVisible && handleToggle && (
        <button
          onClick={handleToggle}
          className="absolute top-3.5 right-3.5 z-30 px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-cyan-500/60 text-cyan-300 hover:text-white font-mono text-xs flex items-center space-x-1.5 shadow-lg backdrop-blur-md cursor-pointer pointer-events-auto"
          title="Restore 3D Globe UI Overlays"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Show UI</span>
        </button>
      )}

      {/* Dynamic Add Landmark Modal */}
      {isUIVisible && isAddModalOpen && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-cyan-700/60 rounded-xl max-w-md w-full p-5 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-cyan-900/50 pb-2.5">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wide">
                  Add Custom Martian Landmark
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLocationSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 mb-1">Landmark Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Shackleton Base Alpha"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Latitude (-90° to 90°)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="-90"
                    max="90"
                    required
                    value={newLocLat}
                    onChange={(e) => setNewLocLat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Longitude (-180° to 180°)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="-180"
                    max="180"
                    required
                    value={newLocLon}
                    onChange={(e) => setNewLocLon(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Elevation (Meters)</label>
                  <input
                    type="number"
                    value={newLocElev}
                    onChange={(e) => setNewLocElev(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Category Type</label>
                  <select
                    value={newLocType}
                    onChange={(e) => setNewLocType(e.target.value as GlobeLocation['type'])}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="custom">Custom Outpost</option>
                    <option value="landing_site">Landing Site</option>
                    <option value="crater">Crater</option>
                    <option value="mountain">Volcano / Mons</option>
                    <option value="canyon">Canyon / Valles</option>
                    <option value="basin">Planitia / Basin</option>
                  </select>
                </div>
              </div>

              {cursorCoords && (
                <button
                  type="button"
                  onClick={populateFromCursor}
                  className="w-full text-left p-2 rounded bg-cyan-950/40 border border-cyan-800/40 hover:border-cyan-500 text-cyan-300 text-[11px] flex items-center justify-between"
                >
                  <span>Use Current Hover Coordinates ({cursorCoords.lat}°N, {cursorCoords.lon}°E, {cursorCoords.elev}m)</span>
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold"
                >
                  Add to Globe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
