/**
 * 2D Tactical Martian GIS Multi-Layer Global Map Viewport
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * 
 * Single Surface Planetary 2D Projection:
 * - Strict single massive flat surface bounded to [[-90, -180], [90, 180]]
 * - Zero repetition (noWrap: true): exactly ONE instance of each Martian location and landmark
 * - Unrestricted 4-way panning: freely move North, South, East, and West
 * - Accurate CRS spatial spread: markers spaced across the planet matching real Mars Lat/Lon data
 * - Multi-layer GIS: MOLA Hypsometry, Slopes, CRISM minerals, Craters, SHARAD ice, Rover traverses, A* routes
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  MapPin,
  AlertTriangle,
  Sparkles,
  Navigation,
  Compass,
  Info,
  X,
  Layers,
  Globe2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Move,
  Check,
  Settings2,
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity
} from 'lucide-react';
import {
  MapLayerConfig,
  MapRegionId,
  RoverMission,
  HazardZone,
  ScienceTarget,
  RouteOption,
  MarsCoordinates,
  MarsHabitationSuitabilityZone
} from '../types';
import { MARS_REGIONS, MARS_HABITATION_SUITABILITY_ZONES } from '../data/marsDatasets';

// Level of Detail (LOD) threshold: Below this scale, detailed sub-targets, hazard circles, and minor overlays are hidden
export const ZOOM_THRESHOLD = 7;

// NASA Mars Tile Layer Sources
export type BasemapTileSource = 'nasa_mola' | 'nasa_viking' | 'custom';

export interface TileSourceConfig {
  id: BasemapTileSource;
  name: string;
  shortName: string;
  desc: string;
  provider: string;
  resolution: string;
  urlTemplate: string;
  maxZ: number;
}

export const TILE_SOURCES: Record<BasemapTileSource, TileSourceConfig> = {
  nasa_mola: {
    id: 'nasa_mola',
    name: 'NASA MGS MOLA Topography',
    shortName: 'NASA MOLA Topo',
    desc: 'Mars Global Surveyor MOLA Shaded Relief Global Mosaic',
    provider: 'NASA / JPL / GSFC',
    resolution: '463 m/px',
    urlTemplate: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    maxZ: 2
  },
  nasa_viking: {
    id: 'nasa_viking',
    name: 'NASA Viking True-Color',
    shortName: 'NASA Viking Color',
    desc: 'Viking Orbiter MDIM 2.1 Controlled Global Color Mosaic',
    provider: 'NASA / USGS Astrogeology',
    resolution: '232 m/px',
    urlTemplate: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    maxZ: 2
  },
  custom: {
    id: 'custom',
    name: 'OpenPlanetary / Custom Tiles',
    shortName: 'OpenPlanetary',
    desc: 'Volcano / Custom Tile Server (XYZ URL Template)',
    provider: 'OpenPlanetary / Custom',
    resolution: 'Custom',
    urlTemplate: 'https://cartocdn-gmaps-a.global.ssl.fastly.net/opmbuilder/api/v1/1513583637/104229484/volcano-tiles/{z}/{x}/{y}.png',
    maxZ: 3
  }
};

interface MarsGIS2DViewProps {
  selectedRegion: MapRegionId;
  layers: MapLayerConfig[];
  roverMission: RoverMission;
  hazards: HazardZone[];
  scienceTargets: ScienceTarget[];
  activeRoutes: RouteOption[];
  selectedRouteId: string;
  startPoint: MarsCoordinates | null;
  goalPoint: MarsCoordinates | null;
  onSetStartPoint: (coord: MarsCoordinates) => void;
  onSetGoalPoint: (coord: MarsCoordinates) => void;
  onSelectTarget: (target: ScienceTarget) => void;
  onSelectHazard: (hazard: HazardZone) => void;
  onAnalyzeCoords: (lat: number, lon: number, elevation: number) => void;
  panToTarget?: MarsCoordinates | null;
  onSelectRegion?: (regionId: MapRegionId) => void;
  highlightedPoint?: MarsCoordinates | null;
  showOverlays?: boolean;
}

// Normalize any longitude to standard planetary range [-180, 180]
export const normalizeLon = (lon: number): number => {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
};

// Global MOLA procedural elevation estimator for arbitrary planetary coordinates
const calculatePlanetaryElevation = (lat: number, lon: number): { elev: number; terrain: string } => {
  // Normalize lon to [-180, 180]
  const nLon = normalizeLon(lon);

  const distOlympus = Math.hypot(lat - 18.65, ((((nLon - -133.8 + 180) % 360) + 360) % 360) - 180);
  const distValles = Math.hypot(lat - -13.9, ((((nLon - -59.2 + 180) % 360) + 360) % 360) - 180);
  const distHellas = Math.hypot(lat - -42.4, ((((nLon - 70.5 + 180) % 360) + 360) % 360) - 180);
  const distJezero = Math.hypot(lat - 18.38, ((((nLon - 77.58 + 180) % 360) + 360) % 360) - 180);
  const distGale = Math.hypot(lat - -5.4, ((((nLon - 137.8 + 180) % 360) + 360) % 360) - 180);
  const distBoreum = Math.hypot(lat - 88.0, nLon);
  const distAustrale = Math.hypot(lat - -88.0, nLon);
  const distElysium = Math.hypot(lat - 25.0, ((((nLon - 147.2 + 180) % 360) + 360) % 360) - 180);
  const distMeridiani = Math.hypot(lat - -0.2, ((((nLon - -2.5 + 180) % 360) + 360) % 360) - 180);
  const distNoctis = Math.hypot(lat - -7.0, ((((nLon - -102.2 + 180) % 360) + 360) % 360) - 180);
  const distAcidalia = Math.hypot(lat - 49.8, ((((nLon - -20.7 + 180) % 360) + 360) % 360) - 180);

  if (distOlympus < 8.0) {
    const peak = Math.max(0, 8.0 - distOlympus) / 8.0;
    return { elev: Math.round(5000 + peak * 16287), terrain: 'Olympus Mons Shield Volcano' };
  }
  if (distValles < 14.0) {
    return { elev: Math.round(-3800 - Math.sin(distValles * 0.4) * 1500), terrain: 'Valles Marineris Rift Canyon' };
  }
  if (distHellas < 18.0) {
    return { elev: Math.round(-7152 + distHellas * 120), terrain: 'Hellas Impact Basin' };
  }
  if (distJezero < 3.5) {
    return { elev: -2500, terrain: 'Jezero Crater Paleolake' };
  }
  if (distGale < 3.5) {
    return { elev: -4450, terrain: 'Gale Crater / Mt Sharp' };
  }
  if (distBoreum < 10.0) {
    return { elev: -1950, terrain: 'Planum Boreum Water-Ice Dome' };
  }
  if (distAustrale < 10.0) {
    return { elev: 1500, terrain: 'Planum Australe Ice Cap' };
  }
  if (distElysium < 6.0) {
    return { elev: -2610, terrain: 'Elysium Planitia Volcanic Plain' };
  }
  if (distMeridiani < 5.0) {
    return { elev: -1420, terrain: 'Meridiani Planum Hematite Unit' };
  }
  if (distNoctis < 6.0) {
    return { elev: 1100, terrain: 'Noctis Labyrinthus Swarm Maze' };
  }
  if (distAcidalia < 9.0) {
    return { elev: -4120, terrain: 'Acidalia Planitia Sediment Sheet' };
  }

  // Polar ice caps
  if (Math.abs(lat) > 75) {
    return {
      elev: Math.round(1200 + Math.cos(lat * 0.1) * 800),
      terrain: lat > 0 ? 'Planum Boreum Ice Cap' : 'Planum Australe Ice Cap'
    };
  }

  // Northern Lowlands vs Southern Highlands Dichotomy
  if (lat > 15) {
    const elev = Math.round(-3800 + Math.sin(lat * 0.1) * 600 + Math.cos(nLon * 0.15) * 500);
    return { elev, terrain: 'Northern Lowland Plains' };
  } else {
    const elev = Math.round(1500 + Math.sin(lat * 0.12) * 1200 + Math.cos(nLon * 0.08) * 1000);
    return { elev, terrain: 'Terra Meridiani Highlands' };
  }
};

/**
 * Generate a high-resolution, photorealistic equirectangular Mars basemap texture
 * Covers -180° to +180° Longitude and -90° to +90° Latitude
 */
const createGlobalMarsBasemapCanvas = (): HTMLCanvasElement => {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Coordinate helper: lon [-180, 180] -> x [0, w], lat [90, -90] -> y [0, h]
  const toTexX = (lon: number) => ((lon + 180) / 360) * w;
  const toTexY = (lat: number) => ((90 - lat) / 180) * h;

  // 1. Martian Base Tone - Rich Ochre & Basaltic Ferric Crust
  const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
  baseGrad.addColorStop(0, '#753b27'); // Northern polar fringe
  baseGrad.addColorStop(0.25, '#854229'); // Northern lowlands
  baseGrad.addColorStop(0.5, '#b4532a'); // Equatorial highlands
  baseGrad.addColorStop(0.75, '#994424'); // Southern cratered terrain
  baseGrad.addColorStop(1, '#682e1d'); // Southern polar fringe
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. High-Frequency Micro-Terrain & Aeolian Dust Variations
  ctx.save();
  const step = 8;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const lat = 90 - (y / h) * 180;
      const lon = (x / w) * 360 - 180;
      const noise =
        Math.sin(lon * 0.08 + lat * 0.05) * 0.3 +
        Math.cos(lon * 0.14 - lat * 0.09) * 0.25 +
        Math.sin(lon * 0.3 + lat * 0.25) * 0.15;

      if (noise > 0.1) {
        ctx.fillStyle = `rgba(196, 90, 48, ${noise * 0.4})`;
        ctx.fillRect(x, y, step, step);
      } else if (noise < -0.1) {
        ctx.fillStyle = `rgba(68, 22, 11, ${-noise * 0.45})`;
        ctx.fillRect(x, y, step, step);
      }
    }
  }
  ctx.restore();

  // Helper to draw realistic Martian albedo features with wrapping across ±180° meridian
  const drawAlbedoFeature = (
    cLat: number,
    cLon: number,
    radiusDegX: number,
    radiusDegY: number,
    colorInner: string,
    colorOuter: string = 'rgba(0,0,0,0)',
    angleRad: number = 0
  ) => {
    [-360, 0, 360].forEach((wrapLon) => {
      const cx = toTexX(cLon + wrapLon);
      const cy = toTexY(cLat);
      const rx = (radiusDegX / 360) * w;
      const ry = (radiusDegY / 180) * h;

      ctx.save();
      ctx.translate(cx, cy);
      if (angleRad !== 0) ctx.rotate(angleRad);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
      grad.addColorStop(0, colorInner);
      grad.addColorStop(0.65, colorInner);
      grad.addColorStop(1, colorOuter);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  // 3. Major Dark Albedo Provinces (Basaltic volcanic sands / Syrtis Major / Sinus Sabaeus / Mare Tyrrhenum)
  // Syrtis Major (dark triangular volcanic shield near Jezero)
  drawAlbedoFeature(10, 68, 24, 20, 'rgba(40, 16, 10, 0.72)');
  drawAlbedoFeature(6, 75, 18, 14, 'rgba(48, 18, 11, 0.65)');

  // Sinus Sabaeus & Sinus Meridiani (dark equatorial strip)
  drawAlbedoFeature(-4, 15, 38, 9, 'rgba(46, 18, 10, 0.68)');
  drawAlbedoFeature(-7, 345, 34, 10, 'rgba(44, 16, 9, 0.66)');

  // Acidalia Planitia (dark northern lowland basin)
  drawAlbedoFeature(48, -25, 36, 26, 'rgba(42, 17, 12, 0.65)');

  // Mare Tyrrhenum & Mare Cimmerium (southern dark belt)
  drawAlbedoFeature(-22, 135, 48, 14, 'rgba(45, 17, 10, 0.62)', 'rgba(0,0,0,0)', -0.15);
  drawAlbedoFeature(-28, 180, 55, 15, 'rgba(43, 16, 9, 0.60)', 'rgba(0,0,0,0)', 0.1);

  // Mare Sirenum & Daedalia
  drawAlbedoFeature(-32, -145, 45, 16, 'rgba(52, 20, 12, 0.58)');

  // 4. Major Bright Dust Mantles (Tharsis, Arabia Terra, Elysium, Amazonis)
  drawAlbedoFeature(12, -110, 52, 38, 'rgba(215, 110, 62, 0.45)'); // Tharsis volcanic plateau
  drawAlbedoFeature(18, 30, 44, 28, 'rgba(205, 102, 56, 0.42)'); // Arabia Terra
  drawAlbedoFeature(20, 150, 36, 24, 'rgba(210, 106, 60, 0.40)'); // Elysium Planitia
  drawAlbedoFeature(22, -170, 40, 26, 'rgba(200, 98, 54, 0.38)'); // Amazonis Planitia

  // 5. Giant Impact Basins
  // Hellas Basin (deepest depression, -7.1 km)
  drawAlbedoFeature(-42.4, 70.5, 26, 22, 'rgba(32, 12, 8, 0.85)', 'rgba(160, 68, 36, 0)');
  drawAlbedoFeature(-42.4, 70.5, 32, 27, 'rgba(180, 85, 48, 0.25)', 'rgba(0,0,0,0)'); // Bright rim ejecta

  // Argyre Basin (-49.7°S, -43.8°E)
  drawAlbedoFeature(-49.7, -43.8, 16, 14, 'rgba(36, 14, 9, 0.80)', 'rgba(150, 64, 32, 0)');

  // Isidis Basin (near Jezero Crater)
  drawAlbedoFeature(12.9, 87.0, 16, 14, 'rgba(175, 80, 45, 0.38)');

  // Utopia Basin
  drawAlbedoFeature(46.7, 117.5, 28, 22, 'rgba(50, 20, 14, 0.50)');

  // 6. Giant Volcanoes (Caldera rings & elevated summits)
  // Olympus Mons (18.65°N, -133.8°E) - 21.3 km shield volcano
  [-360, 0, 360].forEach((wrapLon) => {
    const ox = toTexX(-133.8 + wrapLon);
    const oy = toTexY(18.65);
    const orad = (9 / 360) * w;

    // Basal scarp rim
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(ox, oy, orad, 0, Math.PI * 2);
    ctx.stroke();

    // Shield volcano gradient
    const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, orad);
    og.addColorStop(0, '#f59e0b');
    og.addColorStop(0.35, '#c2410c');
    og.addColorStop(0.85, '#7c2d12');
    og.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(ox, oy, orad, 0, Math.PI * 2);
    ctx.fill();

    // Summit caldera
    ctx.fillStyle = 'rgba(40, 14, 8, 0.9)';
    ctx.beginPath();
    ctx.arc(ox, oy, orad * 0.22, 0, Math.PI * 2);
    ctx.fill();
  });

  // Tharsis Montes alignment (Ascraeus, Pavonis, Arsia)
  const tharsisVolcanoes = [
    { lat: 11.9, lon: -104.5, name: 'Ascraeus' },
    { lat: 0.8, lon: -113.0, name: 'Pavonis' },
    { lat: -8.4, lon: -121.0, name: 'Arsia' },
    { lat: 25.0, lon: 147.2, name: 'Elysium' }
  ];

  tharsisVolcanoes.forEach((v) => {
    [-360, 0, 360].forEach((wrapLon) => {
      const vx = toTexX(v.lon + wrapLon);
      const vy = toTexY(v.lat);
      const vrad = (5.5 / 360) * w;

      const vg = ctx.createRadialGradient(vx, vy, 0, vx, vy, vrad);
      vg.addColorStop(0, '#d97706');
      vg.addColorStop(0.5, '#9a3412');
      vg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = vg;
      ctx.beginPath();
      ctx.arc(vx, vy, vrad, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // 7. Valles Marineris Canyon Rift (4,000 km long fault trough)
  [-360, 0, 360].forEach((wrapLon) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(30, 10, 6, 0.88)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const canyonCoords = [
      { lat: -7.0, lon: -102.0 }, // Noctis Labyrinthus
      { lat: -8.5, lon: -88.0 },
      { lat: -11.5, lon: -75.0 }, // Candor / Melas Chasma
      { lat: -13.9, lon: -59.2 }, // Coprates Chasma
      { lat: -14.5, lon: -45.0 }  // Capri Chasma
    ];

    ctx.beginPath();
    canyonCoords.forEach((pt, i) => {
      const px = toTexX(pt.lon + wrapLon);
      const py = toTexY(pt.lat);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Canyon deep floor accent line
    ctx.strokeStyle = 'rgba(15, 5, 3, 0.95)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  });

  // 8. Polar Ice Caps (Planum Boreum & Planum Australe)
  // North Pole: Planum Boreum Water-Ice Dome (Lat 80°N to 90°N)
  const northY = toTexY(80);
  const npGrad = ctx.createLinearGradient(0, 0, 0, northY);
  npGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
  npGrad.addColorStop(0.65, 'rgba(240, 248, 255, 0.88)');
  npGrad.addColorStop(1, 'rgba(240, 248, 255, 0)');
  ctx.fillStyle = npGrad;
  ctx.fillRect(0, 0, w, northY);

  // South Pole: Planum Australe Frozen CO2/Water Ice Cap (Lat -80°S to -90°S)
  const southY = toTexY(-80);
  const spGrad = ctx.createLinearGradient(0, southY, 0, h);
  spGrad.addColorStop(0, 'rgba(235, 245, 255, 0)');
  spGrad.addColorStop(0.35, 'rgba(245, 250, 255, 0.85)');
  spGrad.addColorStop(1, 'rgba(255, 255, 255, 0.96)');
  ctx.fillStyle = spGrad;
  ctx.fillRect(0, southY, w, h - southY);

  // 9. Prominent Impact Craters with Rings
  const prominentCraters = [
    { lat: 18.38, lon: 77.58, r: 2.2, name: 'Jezero' },
    { lat: -5.4, lon: 137.8, r: 3.5, name: 'Gale' },
    { lat: -14.6, lon: 175.4, r: 3.0, name: 'Gusev' },
    { lat: -1.9, lon: 16.7, r: 7.5, name: 'Schiaparelli' },
    { lat: -9.0, lon: 55.6, r: 7.0, name: 'Huygens' },
    { lat: 23.8, lon: 32.1, r: 6.5, name: 'Cassini' }
  ];

  prominentCraters.forEach((c) => {
    [-360, 0, 360].forEach((wrapLon) => {
      const cx = toTexX(c.lon + wrapLon);
      const cy = toTexY(c.lat);
      const cr = (c.r / 360) * w;

      // Rim
      ctx.strokeStyle = 'rgba(240, 210, 180, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.stroke();

      // Floor
      ctx.fillStyle = 'rgba(42, 16, 9, 0.65)';
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  return canvas;
};

export const MarsGIS2DView: React.FC<MarsGIS2DViewProps> = ({
  selectedRegion,
  layers,
  roverMission,
  hazards,
  scienceTargets,
  activeRoutes,
  selectedRouteId,
  startPoint,
  goalPoint,
  onSetStartPoint,
  onSetGoalPoint,
  onSelectTarget,
  onSelectHazard,
  onAnalyzeCoords,
  panToTarget,
  onSelectRegion,
  highlightedPoint,
  showOverlays = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const basemapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Responsive canvas buffer dimensions
  const [dimensions, setDimensions] = useState({ width: 1080, height: 640 });

  // Selected Landmark for NASA scientific significance popup
  const [activePopupLocation, setActivePopupLocation] = useState<(typeof MARS_REGIONS)[0] | null>(null);

  // Active region data
  const activeRegionData = MARS_REGIONS.find((r) => r.id === selectedRegion) || MARS_REGIONS[0];

  // Global Single-World Viewport State (Google Maps Style)
  // Default to 0°N, 0°E, scale 1.0 on initial load to show the entire global map
  const [viewport, setViewport] = useState({
    centerLon: 0,
    centerLat: 0,
    scale: 1.0
  });

  const isInitialMount = useRef<boolean>(true);

  // Basemap Tile Layer State
  const [basemapSource, setBasemapSource] = useState<BasemapTileSource>('nasa_mola');
  const [customTileUrl, setCustomTileUrl] = useState<string>(TILE_SOURCES.custom.urlTemplate);
  const [isCustomTileModalOpen, setIsCustomTileModalOpen] = useState<boolean>(false);
  const [isTileSelectorOpen, setIsTileSelectorOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fillMode, setFillMode] = useState<'FILL' | 'FIT'>('FILL');
  const [loadedTileCount, setLoadedTileCount] = useState<number>(0);

  // Mars Habitation Suitability Layer State
  const [showSuitabilityZones, setShowSuitabilityZones] = useState<boolean>(true);
  const [selectedSuitabilityZone, setSelectedSuitabilityZone] = useState<MarsHabitationSuitabilityZone | null>(null);
  const [suitabilityPulse, setSuitabilityPulse] = useState<number>(0);

  // In-memory tile cache and pending requests tracker
  const tileCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const pendingTileRequests = useRef<Set<string>>(new Set());

  // Function to get or asynchronously load a NASA/USGS/custom tile
  const getTile = useCallback(
    (source: BasemapTileSource, z: number, y: number, x: number): HTMLImageElement | null => {
      const key = `${source}_${z}_${y}_${x}`;
      if (tileCache.current.has(key)) {
        return tileCache.current.get(key) || null;
      }
      if (pendingTileRequests.current.has(key)) {
        return null;
      }

      let url = '';
      if (source === 'custom') {
        url = (customTileUrl || TILE_SOURCES.custom.urlTemplate)
          .replace('{z}', String(z))
          .replace('{y}', String(y))
          .replace('{x}', String(x));
      } else {
        url = TILE_SOURCES[source].urlTemplate
          .replace('{z}', String(z))
          .replace('{y}', String(y))
          .replace('{x}', String(x));
      }

      pendingTileRequests.current.add(key);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        tileCache.current.set(key, img);
        pendingTileRequests.current.delete(key);
        setLoadedTileCount((prev) => prev + 1);
      };
      img.onerror = () => {
        pendingTileRequests.current.delete(key);
      };
      return null;
    },
    [customTileUrl]
  );

  // Pre-fetch Level 0 tiles whenever basemap source changes
  useEffect(() => {
    getTile(basemapSource, 0, 0, 0);
    getTile(basemapSource, 0, 0, 1);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        getTile(basemapSource, 1, r, c);
      }
    }
  }, [basemapSource, getTile]);

  // Mobile Touch & Gesture Interaction Mode:
  // 'SCROLL': Single-finger vertical swipes scroll the webpage smoothly (touch-action: pan-y). Two fingers pan/zoom map.
  // 'PAN': Single-finger dragging pans the map unrestricted in all 4 directions (touch-action: none).
  const [touchInteractionMode, setTouchInteractionMode] = useState<'SCROLL' | 'PAN'>('SCROLL');

  // Pinch-to-zoom & two-finger pan gesture tracking
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1.0);
  const twoFingerStartMidRef = useRef<{ x: number; y: number; centerLon: number; centerLat: number } | null>(null);
  const touchDirectionDecidedRef = useRef<'SCROLL' | 'PAN' | null>(null);

  // State-Managed Robust Fullscreen Handler
  const handleToggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      const elem = containerRef.current;
      if (elem && !document.fullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {
            // Fallback gracefully to CSS fixed fullscreen if browser/iframe blocks native API
          });
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen();
        }
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      }
    }
  }, [isFullscreen]);

  // Escape key & fullscreenchange listeners to guarantee no fullscreen trap
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyNativeFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      // Sync internal state when native fullscreen exits (e.g., via ESC or browser UI)
      if (!isCurrentlyNativeFullscreen && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, handleToggleFullscreen]);

  // Dynamic Level of Detail (LOD) zoom state tracking
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  useEffect(() => {
    setZoomLevel(viewport.scale);
  }, [viewport.scale]);

  const isZoomedIn = viewport.scale >= ZOOM_THRESHOLD;

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; centerLon: number; centerLat: number }>({
    clientX: 0,
    clientY: 0,
    centerLon: 0,
    centerLat: 0
  });

  const [cursorPos, setCursorPos] = useState<(MarsCoordinates & { terrain?: string }) | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MarsCoordinates | null>(null);
  const [clickMode, setClickMode] = useState<'ANALYZE' | 'SET_START' | 'SET_GOAL'>('ANALYZE');

  // Drag tracking to distinguish intentional click vs continuous pan
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragOperation = useRef<boolean>(false);

  // Pre-render the global equirectangular basemap texture once
  useEffect(() => {
    if (!basemapCanvasRef.current) {
      basemapCanvasRef.current = createGlobalMarsBasemapCanvas();
    }
  }, []);

  // Minimum Scale & Dynamic Pixels-Per-Degree Engine:
  // Strictly enforces that the Mars surface (360° x 180°) ALWAYS covers 100% of the canvas.
  // The user can NEVER zoom out so far that the map is smaller than the container (zero black borders).
  const getPixelsPerDeg = useCallback(
    (width: number, height: number, scale: number) => {
      const basePixelsPerDeg = Math.max(width / 360, height / 180);
      const safeScale = Math.max(1.0, Math.min(50.0, scale));
      return basePixelsPerDeg * safeScale;
    },
    []
  );

  // Center on Bounds & maxBounds Bounding Box Engine:
  // Dynamically clamps viewport center coordinates (lon, lat) so the Mars planetary
  // texture anchors cleanly to the edges and NEVER pulls away into empty black space.
  const clampViewport = useCallback(
    (lon: number, lat: number, scale: number, targetWidth?: number, targetHeight?: number) => {
      const width = targetWidth ?? dimensions.width ?? 1080;
      const height = targetHeight ?? dimensions.height ?? 640;
      const clampedScale = Math.max(1.0, Math.min(50.0, scale));
      const s = Math.max(width / 360, height / 180) * clampedScale;

      // Half-span of visible screen in degrees
      const halfLonSpan = width / (2 * s);
      const halfLatSpan = height / (2 * s);

      // Clamping delta: If visible half-span >= 180° (or 90°), delta is 0, locking center to 0
      const maxLonDelta = Math.max(0, 180 - halfLonSpan);
      const maxLatDelta = Math.max(0, 90 - halfLatSpan);

      const clampedLon = Math.max(-maxLonDelta, Math.min(maxLonDelta, lon));
      const clampedLat = Math.max(-maxLatDelta, Math.min(maxLatDelta, lat));

      return {
        centerLon: Number(clampedLon.toFixed(4)),
        centerLat: Number(clampedLat.toFixed(4)),
        scale: clampedScale
      };
    },
    [dimensions.width, dimensions.height]
  );

  // Map invalidation & container boundary recalculation
  const invalidateSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        setDimensions({
          width: w,
          height: h
        });
        setViewport((prev) => clampViewport(prev.centerLon, prev.centerLat, prev.scale, w, h));
      }
    }
  }, [clampViewport]);

  useEffect(() => {
    invalidateSize();
    const timer = setTimeout(() => {
      invalidateSize();
    }, 300);

    let rafId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          invalidateSize();
        });
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    }

    window.addEventListener('resize', invalidateSize);
    return () => {
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', invalidateSize);
    };
  }, [invalidateSize, isFullscreen]);

  // Synchronize body overflow lock & multi-phase size invalidation across frames
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const timers = [10, 50, 120, 250, 450].map((delay) =>
      setTimeout(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const w = isFullscreen ? window.innerWidth : Math.round(rect.width || containerRef.current.clientWidth);
          const h = isFullscreen ? window.innerHeight : Math.round(rect.height || containerRef.current.clientHeight);
          if (w > 0 && h > 0) {
            setDimensions({ width: w, height: h });
            setViewport((prev) => clampViewport(prev.centerLon, prev.centerLat, prev.scale, w, h));
          }
        }
      }, delay)
    );

    return () => {
      document.body.style.overflow = '';
      timers.forEach(clearTimeout);
    };
  }, [isFullscreen, clampViewport]);

  // Transform Geographic Coordinates (lat, lon) to Canvas Screen (x, y) on Single Non-Repeating World
  // Strict single Cartesian equirectangular projection within [[-90, -180], [90, 180]]
  const coordToCanvas = useCallback(
    (lat: number, lon: number, width: number, height: number) => {
      const s = getPixelsPerDeg(width, height, viewport.scale);
      const cx = width / 2;
      const cy = height / 2;

      // Linear distance relative to viewport center on the single flat surface - NO WRAP / NO MODULO
      const x = cx + (lon - viewport.centerLon) * s;
      const y = cy - (lat - viewport.centerLat) * s;

      return { x, y };
    },
    [viewport, getPixelsPerDeg]
  );

  // Transform Canvas Screen (x, y) back to Geographic Coordinates (lat, lon, elevation)
  // Strict single flat map projection bounded to [[-90, -180], [90, 180]]
  const canvasToCoord = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const s = getPixelsPerDeg(width, height, viewport.scale);
      const cx = width / 2;
      const cy = height / 2;

      const dx = x - cx;
      const dy = y - cy;

      const rawLon = viewport.centerLon + dx / s;
      const rawLat = viewport.centerLat - dy / s;

      // Single world boundaries [[-90, -180], [90, 180]]
      const isWithinBounds = rawLon >= -180 && rawLon <= 180 && rawLat >= -90 && rawLat <= 90;

      const lon = Math.max(-180, Math.min(180, rawLon));
      const lat = Math.max(-90, Math.min(90, rawLat));

      const { elev, terrain } = calculatePlanetaryElevation(lat, lon);

      return {
        lat: Number(lat.toFixed(4)),
        lon: Number(lon.toFixed(4)),
        elevationMeters: elev,
        terrain: isWithinBounds ? terrain : 'Deep Space (Off-Disk)'
      };
    },
    [viewport, getPixelsPerDeg]
  );

  // Cinematic smooth animation when panToTarget or selectedRegion changes (3D -> 2D sync)
  useEffect(() => {
    if (!panToTarget) return;

    const target = clampViewport(panToTarget.lon, panToTarget.lat, Math.max(viewport.scale, 3.8));
    let startLon = viewport.centerLon;
    let diffLon = target.centerLon - startLon;

    let startLat = viewport.centerLat;
    let diffLat = target.centerLat - startLat;

    let startScale = viewport.scale;
    let targetScale = target.scale;

    let startTime = performance.now();
    const duration = 700;

    let animId: number;
    const animatePan = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      const current = clampViewport(
        startLon + diffLon * ease,
        startLat + diffLat * ease,
        startScale + (targetScale - startScale) * ease
      );
      setViewport(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animatePan);
      }
    };

    animId = requestAnimationFrame(animatePan);
    return () => cancelAnimationFrame(animId);
  }, [panToTarget, clampViewport]);

  // Smooth animation when selecting region (skipped on initial mount to keep full global map)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (panToTarget) return; // panToTarget takes precedence
    const region = MARS_REGIONS.find((r) => r.id === selectedRegion);
    if (!region) return;

    const targetScale = region.id === 'jezero' || region.id === 'gale' ? 4.5 : 2.5;
    const target = clampViewport(region.center.lon, region.center.lat, targetScale);

    let startLon = viewport.centerLon;
    let diffLon = target.centerLon - startLon;

    let startLat = viewport.centerLat;
    let diffLat = target.centerLat - startLat;

    let startScale = viewport.scale;

    let startTime = performance.now();
    const duration = 650;

    let animId: number;
    const animatePan = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      const current = clampViewport(
        startLon + diffLon * ease,
        startLat + diffLat * ease,
        startScale + (target.scale - startScale) * ease
      );
      setViewport(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animatePan);
      }
    };

    animId = requestAnimationFrame(animatePan);
    return () => cancelAnimationFrame(animId);
  }, [selectedRegion, panToTarget, clampViewport]);

  // Ping radar animation loop for highlighted location
  const [pingProgress, setPingProgress] = useState(0);

  useEffect(() => {
    if (!highlightedPoint) return;
    setPingProgress(0);
    const start = performance.now();
    let animId: number;
    const animatePing = (now: number) => {
      const elapsed = (now - start) % 1600;
      setPingProgress(elapsed / 1600);
      animId = requestAnimationFrame(animatePing);
    };
    animId = requestAnimationFrame(animatePing);
    return () => cancelAnimationFrame(animId);
  }, [highlightedPoint]);

  // Continuous animation loop for Mars Habitation Suitability Map signals (pulsating red no-go zones, luminous green/yellow glows)
  useEffect(() => {
    if (!showSuitabilityZones) return;
    let animId: number;
    const start = performance.now();
    const animateSuitability = (now: number) => {
      const elapsed = (now - start) % 1500;
      setSuitabilityPulse(elapsed / 1500);
      animId = requestAnimationFrame(animateSuitability);
    };
    animId = requestAnimationFrame(animateSuitability);
    return () => cancelAnimationFrame(animId);
  }, [showSuitabilityZones]);

  // ON-SCREEN DIRECTIONAL PAN CONTROLLER LOGIC (UP / DOWN / LEFT / RIGHT)
  // Unrestricted vertical and horizontal movement: North pole (+90°) to South pole (-90°), West (-180°) to East (+180°)
  const panAnimRef = useRef<number | null>(null);
  const targetCenterRef = useRef<{ lon: number; lat: number } | null>(null);

  const smoothPan = useCallback(
    (deltaXPixels: number, deltaYPixels: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const s = getPixelsPerDeg(canvas.width, canvas.height, viewport.scale);
      // deltaXPixels: positive = East (+Lon), negative = West (-Lon)
      // deltaYPixels: positive = North (+Lat), negative = South (-Lat)
      const deltaLon = deltaXPixels / s;
      const deltaLat = deltaYPixels / s;

      // Base coordinates from ongoing target if rapid clicking occurs
      const baseLon = targetCenterRef.current ? targetCenterRef.current.lon : viewport.centerLon;
      const baseLat = targetCenterRef.current ? targetCenterRef.current.lat : viewport.centerLat;

      const clamped = clampViewport(baseLon + deltaLon, baseLat + deltaLat, viewport.scale);
      targetCenterRef.current = { lon: clamped.centerLon, lat: clamped.centerLat };

      if (panAnimRef.current) {
        cancelAnimationFrame(panAnimRef.current);
      }

      const startLon = viewport.centerLon;
      const startLat = viewport.centerLat;
      const diffLon = clamped.centerLon - startLon;
      const diffLat = clamped.centerLat - startLat;

      const startTime = performance.now();
      const duration = 220; // Smooth 220ms ease-out animation (animate: true)

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        setViewport((prev) =>
          clampViewport(startLon + diffLon * ease, startLat + diffLat * ease, prev.scale)
        );

        if (progress < 1) {
          panAnimRef.current = requestAnimationFrame(animate);
        } else {
          panAnimRef.current = null;
          targetCenterRef.current = null;
        }
      };

      panAnimRef.current = requestAnimationFrame(animate);
    },
    [viewport.centerLon, viewport.centerLat, viewport.scale, getPixelsPerDeg, clampViewport]
  );

  const smoothCenter = useCallback(
    (targetLon: number, targetLat: number) => {
      if (panAnimRef.current) {
        cancelAnimationFrame(panAnimRef.current);
      }
      const clamped = clampViewport(targetLon, targetLat, viewport.scale);
      targetCenterRef.current = { lon: clamped.centerLon, lat: clamped.centerLat };

      const startLon = viewport.centerLon;
      const startLat = viewport.centerLat;
      const diffLon = clamped.centerLon - startLon;
      const diffLat = clamped.centerLat - startLat;

      const startTime = performance.now();
      const duration = 300;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        setViewport((prev) =>
          clampViewport(startLon + diffLon * ease, startLat + diffLat * ease, prev.scale)
        );

        if (progress < 1) {
          panAnimRef.current = requestAnimationFrame(animate);
        } else {
          panAnimRef.current = null;
          targetCenterRef.current = null;
        }
      };

      panAnimRef.current = requestAnimationFrame(animate);
    },
    [viewport.centerLon, viewport.centerLat, viewport.scale, clampViewport]
  );

  // Keyboard navigation support for Arrow keys (Up, Down, Left, Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        smoothPan(0, 100);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        smoothPan(0, -100);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        smoothPan(-100, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        smoothPan(100, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [smoothPan]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (panAnimRef.current) {
        cancelAnimationFrame(panAnimRef.current);
      }
    };
  }, []);

  // MAIN CANVAS RENDER LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const s = getPixelsPerDeg(width, height, viewport.scale);
    const cx = width / 2;
    const cy = height / 2;

    const isLayerOn = (id: string) => layers.find((l) => l.id === id)?.enabled ?? false;
    const getLayerOpacity = (id: string) => layers.find((l) => l.id === id)?.opacity ?? 0.8;

    // 1. Cosmic Deep Space Background (Visible only beyond polar extremes)
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, width, height);

    // Starfield for deep space
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 40; i++) {
      const sx = ((Math.sin(i * 17.3 + 42) + 1) / 2) * width;
      const sy = ((Math.cos(i * 31.7 + 42) + 1) / 2) * height;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // 2. Global Mars Basemap (Real NASA Mars Map Tiles + Procedural Baseline Fallback)
    const proceduralBasemap = basemapCanvasRef.current;
    const worldWidth = 360 * s;
    const worldHeight = 180 * s;

    // Single instance top-left reference point for planetary surface (lon: -180, lat: +90)
    const baseWorldX = cx + (-180 - viewport.centerLon) * s;
    const baseWorldY = cy - (90 - viewport.centerLat) * s;

    // 2a. Global Level 0 Tiles: West Hemisphere [-180, 0] and East Hemisphere [0, 180]
    const tile00 = getTile(basemapSource, 0, 0, 0);
    const tile01 = getTile(basemapSource, 0, 0, 1);

    if (tile00) {
      ctx.drawImage(tile00, baseWorldX, baseWorldY, worldWidth / 2, worldHeight);
    } else if (proceduralBasemap) {
      ctx.drawImage(
        proceduralBasemap,
        0,
        0,
        proceduralBasemap.width / 2,
        proceduralBasemap.height,
        baseWorldX,
        baseWorldY,
        worldWidth / 2,
        worldHeight
      );
    }

    if (tile01) {
      ctx.drawImage(tile01, baseWorldX + worldWidth / 2, baseWorldY, worldWidth / 2, worldHeight);
    } else if (proceduralBasemap) {
      ctx.drawImage(
        proceduralBasemap,
        proceduralBasemap.width / 2,
        0,
        proceduralBasemap.width / 2,
        proceduralBasemap.height,
        baseWorldX + worldWidth / 2,
        baseWorldY,
        worldWidth / 2,
        worldHeight
      );
    }

    // 2b. Zoomed-In High-Resolution NASA Planetary Tiles (Level 1 & Level 2)
    if (viewport.scale > 1.8) {
      const Z = viewport.scale > 4.5 ? 2 : 1;
      const numCols = Math.pow(2, Z + 1); // Z=1 -> 4, Z=2 -> 8
      const numRows = Math.pow(2, Z);     // Z=1 -> 2, Z=2 -> 4
      const deltaLon = 360 / numCols;
      const deltaLat = 180 / numRows;

      // Visible area bounding box in degrees
      const vLonMin = Math.max(-180, viewport.centerLon - (cx / s));
      const vLonMax = Math.min(180, viewport.centerLon + ((width - cx) / s));
      const vLatMax = Math.min(90, viewport.centerLat + (cy / s));
      const vLatMin = Math.max(-90, viewport.centerLat - ((height - cy) / s));

      const colMin = Math.max(0, Math.floor((vLonMin - -180) / deltaLon));
      const colMax = Math.min(numCols - 1, Math.floor((vLonMax - -180) / deltaLon));
      const rowMin = Math.max(0, Math.floor((90 - vLatMax) / deltaLat));
      const rowMax = Math.min(numRows - 1, Math.floor((90 - vLatMin) / deltaLat));

      for (let r = rowMin; r <= rowMax; r++) {
        for (let c = colMin; c <= colMax; c++) {
          const tileLonMin = -180 + c * deltaLon;
          const tileLatMax = 90 - r * deltaLat;

          const tx = cx + (tileLonMin - viewport.centerLon) * s;
          const ty = cy - (tileLatMax - viewport.centerLat) * s;
          const tw = deltaLon * s;
          const th = deltaLat * s;

          const tileImg = getTile(basemapSource, Z, r, c);
          if (tileImg) {
            ctx.drawImage(tileImg, tx, ty, tw, th);
          }
        }
      }
    }

    // Subtle planetary boundary edge border to clearly delineate the single planet surface
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(baseWorldX, baseWorldY, worldWidth, worldHeight);

    // Atmospheric limb glow at northern and southern boundaries if in view
    const northPoleY = cy - (90 - viewport.centerLat) * s;
    if (northPoleY >= 0 && northPoleY <= 60) {
      const atmoN = ctx.createLinearGradient(0, northPoleY, 0, northPoleY + 40);
      atmoN.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      atmoN.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmoN;
      ctx.fillRect(Math.max(0, baseWorldX), 0, Math.min(width, worldWidth), Math.max(0, northPoleY + 40));
    }

    const southPoleY = cy - (-90 - viewport.centerLat) * s;
    if (southPoleY >= height - 60 && southPoleY <= height) {
      const atmoS = ctx.createLinearGradient(0, southPoleY - 40, 0, southPoleY);
      atmoS.addColorStop(0, 'rgba(0, 0, 0, 0)');
      atmoS.addColorStop(1, 'rgba(244, 63, 94, 0.2)');
      ctx.fillStyle = atmoS;
      ctx.fillRect(Math.max(0, baseWorldX), southPoleY - 40, Math.min(width, worldWidth), height - southPoleY + 40);
    }

    // 3. MOLA Elevation Hypsometric Colormap Layer (Single Surface)
    if (isLayerOn('mola_elevation')) {
      const opacity = getLayerOpacity('mola_elevation');
      ctx.save();
      ctx.globalAlpha = opacity * 0.45;

      const elevGrad = ctx.createLinearGradient(baseWorldX, baseWorldY + worldHeight, baseWorldX, baseWorldY);
      elevGrad.addColorStop(0, '#1e1b4b'); // Deep southern basins
      elevGrad.addColorStop(0.3, '#78350f'); // Southern highlands
      elevGrad.addColorStop(0.6, '#065f46'); // Northern lowlands
      elevGrad.addColorStop(0.9, '#f59e0b'); // Volcanic summits
      elevGrad.addColorStop(1, '#f8fafc'); // Polar ice caps

      ctx.fillStyle = elevGrad;
      ctx.fillRect(baseWorldX, baseWorldY, worldWidth, worldHeight);
      ctx.restore();
    }

    // 4. Slope & Gradient Hazard Heatmap Layer
    if (isLayerOn('slope_analysis')) {
      const opacity = getLayerOpacity('slope_analysis');
      ctx.save();
      ctx.globalAlpha = opacity;

      // Major planetary slope scarps (Valles Marineris, Olympus Mons)
      // Localized sub-kilometer scarps (Kodiak Butte, Jezero Delta) shown only when zoomed in (>= ZOOM_THRESHOLD)
      const majorScarps = [
        { lat: 18.65, lon: -133.8, r: 8.0, name: 'Olympus Mons Basal Scarp' },
        { lat: -13.9, lon: -59.2, r: 4.5, name: 'Valles Marineris Chasma Wall' },
        ...(isZoomedIn
          ? [
              { lat: 18.448, lon: 77.412, r: 0.15, name: 'Kodiak Butte West Scarp' },
              { lat: 18.535, lon: 77.33, r: 0.2, name: 'Jezero Delta Scarp' },
              { lat: -5.4, lon: 137.8, r: 0.8, name: 'Gale Crater Rim' }
            ]
          : [])
      ];

      majorScarps.forEach((scarp) => {
        const pt = coordToCanvas(scarp.lat, scarp.lon, width, height);
        const rPx = Math.max(12, scarp.r * s);

        const slopeGrad = ctx.createRadialGradient(pt.x, pt.y, rPx * 0.4, pt.x, pt.y, rPx);
        slopeGrad.addColorStop(0, 'rgba(239, 68, 68, 0.75)'); // Red > 15°
        slopeGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.55)'); // Yellow 10-15°
        slopeGrad.addColorStop(1, 'rgba(16, 185, 129, 0)'); // Safe

        ctx.fillStyle = slopeGrad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, rPx, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 5. CRISM Hyperspectral Mineralogy Overlay
    if (isLayerOn('crism_minerals')) {
      const opacity = getLayerOpacity('crism_minerals');
      ctx.save();
      ctx.globalAlpha = opacity;

      // Fe/Mg Clays (Smectite) - Global Mawrth Vallis vs Local Jezero
      const clays = [
        { lat: 24.0, lon: 33.5, r: 1.5 }, // Mawrth Vallis (Macro scale)
        ...(isZoomedIn
          ? [
              { lat: 18.468, lon: 77.388, r: 0.25 },
              { lat: 18.455, lon: 77.405, r: 0.18 },
              { lat: -5.2, lon: 137.6, r: 0.5 }
            ]
          : [])
      ];
      clays.forEach((c) => {
        const pt = coordToCanvas(c.lat, c.lon, width, height);
        const r = Math.max(8, c.r * s);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.55)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mg-Carbonates (Shoreline Bath-Tub Ring) - Magenta (Only in detailed LOD)
      if (isZoomedIn) {
        const carbonates = [
          { lat: 18.491, lon: 77.369, r: 0.22 },
          { lat: 18.514, lon: 77.35, r: 0.28 }
        ];
        carbonates.forEach((cb) => {
          const pt = coordToCanvas(cb.lat, cb.lon, width, height);
          const r = Math.max(8, cb.r * s);
          ctx.fillStyle = 'rgba(217, 70, 239, 0.55)';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.restore();
    }

    // 6. Craters & Ejecta Rims
    if (isLayerOn('crater_layer')) {
      const opacity = getLayerOpacity('crater_layer');
      ctx.save();
      ctx.globalAlpha = opacity;

      // Local Belva Crater Rim shown only in detailed LOD
      if (isZoomedIn) {
        const belva = coordToCanvas(18.508, 77.375, width, height);
        const belvaR = Math.max(6, 0.08 * s);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(belva.x, belva.y, belvaR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText('Belva Crater (0.9km)', belva.x + belvaR + 6, belva.y + 3);
      }
      ctx.restore();
    }

    // 7. Subsurface Ice & Water Layer (SHARAD Radar)
    if (isLayerOn('water_ice_sharad')) {
      const opacity = getLayerOpacity('water_ice_sharad');
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;

      const iceLocations = [
        { lat: 39.2, lon: -171.0, r: 5.0, name: 'Arcadia Planitia Sheet Ice' },
        { lat: 85.0, lon: 0.0, r: 8.0, name: 'Planum Boreum Basal Unit' },
        ...(isZoomedIn ? [{ lat: 18.52, lon: 77.34, r: 0.25, name: 'Jezero Permafrost Anomaly' }] : [])
      ];

      iceLocations.forEach((loc) => {
        const pt = coordToCanvas(loc.lat, loc.lon, width, height);
        const r = Math.max(10, loc.r * s);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();
    }

    // 8. Adaptive Graticule Lat/Lon Gridlines (Single Planet - Strictly bounded to [[-90, -180], [90, 180]])
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.lineWidth = 1;

    // Dynamic grid step based on zoom
    const gridStep = viewport.scale > 15 ? 0.2 : viewport.scale > 5 ? 1.0 : viewport.scale > 2 ? 5.0 : 30.0;

    // Single world horizontal pixel bounds
    const minPlanetX = Math.max(0, cx + (-180 - viewport.centerLon) * s);
    const maxPlanetX = Math.min(width, cx + (180 - viewport.centerLon) * s);

    // Single world vertical pixel bounds
    const minPlanetY = Math.max(0, cy - (90 - viewport.centerLat) * s);
    const maxPlanetY = Math.min(height, cy - (-90 - viewport.centerLat) * s);

    if (minPlanetX < maxPlanetX && minPlanetY < maxPlanetY) {
      // Latitude parallels strictly from -90 to +90
      for (let lat = -90; lat <= 90; lat += gridStep) {
        const y = cy - (lat - viewport.centerLat) * s;
        if (y >= minPlanetY && y <= maxPlanetY) {
          ctx.beginPath();
          const isEquator = Math.abs(lat) < 0.001;
          const isPole = Math.abs(Math.abs(lat) - 90) < 0.001;
          ctx.strokeStyle = isEquator ? 'rgba(56, 189, 248, 0.55)' : isPole ? 'rgba(56, 189, 248, 0.35)' : 'rgba(148, 163, 184, 0.16)';
          ctx.lineWidth = isEquator || isPole ? 1.5 : 1;
          ctx.moveTo(minPlanetX, y);
          ctx.lineTo(maxPlanetX, y);
          ctx.stroke();

          ctx.fillStyle = isEquator ? '#38bdf8' : 'rgba(148, 163, 184, 0.7)';
          ctx.font = isEquator ? 'bold 9px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace';
          const latText = lat > 0 ? `${lat.toFixed(gridStep < 1 ? 1 : 0)}°N` : lat < 0 ? `${Math.abs(lat).toFixed(gridStep < 1 ? 1 : 0)}°S` : '0° (EQUATOR)';
          ctx.fillText(latText, Math.max(12, minPlanetX + 6), y - 4);
        }
      }

      // Longitude meridians strictly bounded to [-180, 180]
      for (let l = -180; l <= 180; l += gridStep) {
        const x = cx + (l - viewport.centerLon) * s;
        if (x >= minPlanetX && x <= maxPlanetX) {
          const isPrime = Math.abs(l) < 0.001;
          const isAntimeridian = Math.abs(Math.abs(l) - 180) < 0.001;
          ctx.beginPath();
          ctx.strokeStyle = isPrime ? 'rgba(245, 158, 11, 0.65)' : isAntimeridian ? 'rgba(56, 189, 248, 0.4)' : 'rgba(148, 163, 184, 0.16)';
          ctx.lineWidth = isPrime || isAntimeridian ? 1.5 : 1;
          ctx.moveTo(x, minPlanetY);
          ctx.lineTo(x, maxPlanetY);
          ctx.stroke();

          ctx.fillStyle = isPrime ? '#f59e0b' : 'rgba(148, 163, 184, 0.7)';
          ctx.font = isPrime ? 'bold 9px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace';
          const roundedLon = Math.round(l);
          const lonText = roundedLon === 0 ? '0° (PRIME)' : roundedLon > 0 ? `${roundedLon}°E` : `${Math.abs(roundedLon)}°W`;
          ctx.fillText(lonText, x + 4, Math.min(height - 10, maxPlanetY - 6));
        }
      }
    }

    ctx.restore();

    // 9. Rover Traverses (Perseverance / Curiosity) - Detailed trail & waypoints in tactical LOD
    if (isLayerOn('rover_traverses') && isZoomedIn) {
      const trail = roverMission.trail;
      if (trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = Math.max(2, 2.5 * Math.min(2, viewport.scale));
        ctx.beginPath();

        trail.forEach((pt, idx) => {
          const cp = coordToCanvas(pt.lat, pt.lon, width, height);
          if (idx === 0) ctx.moveTo(cp.x, cp.y);
          else ctx.lineTo(cp.x, cp.y);
        });
        ctx.stroke();

        // Waypoints (rendered in tactical LOD)
        trail.forEach((pt, idx) => {
          const cp = coordToCanvas(pt.lat, pt.lon, width, height);
          const isLatest = idx === trail.length - 1;

          ctx.fillStyle = isLatest ? '#38bdf8' : '#f59e0b';
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, isLatest ? 5.5 : 3, 0, Math.PI * 2);
          ctx.fill();

          if (isLatest) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 10, 0, Math.PI * 2);
            ctx.stroke();

            if (viewport.scale > 7.5) {
              ctx.fillStyle = '#38bdf8';
              ctx.font = 'bold 10px JetBrains Mono, monospace';
              ctx.fillText(`${roverMission.name} (Sol ${pt.sol})`, cp.x + 14, cp.y + 4);
            }
          }
        });
        ctx.restore();
      }
    }

    // 10. Active Path Options (Alpha, Beta, Gamma, Emergency)
    // Rendered ONLY when startPoint and goalPoint are explicitly set by the user
    if (startPoint && goalPoint && activeRoutes && activeRoutes.length > 0) {
      activeRoutes.forEach((route) => {
        const isSelected = route.id === selectedRouteId;
        ctx.save();
        ctx.strokeStyle = route.color;
        ctx.lineWidth = isSelected ? 3.5 : 1.8;

        if (isSelected) {
          ctx.shadowColor = route.color;
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        route.pathPoints.forEach((pt, idx) => {
          const cp = coordToCanvas(pt.lat, pt.lon, width, height);
          if (idx === 0) ctx.moveTo(cp.x, cp.y);
          else ctx.lineTo(cp.x, cp.y);
        });
        ctx.stroke();
        ctx.restore();
      });
    }

    // 11. Start & Goal Pins (Rendered ONLY when explicitly placed by the user - Single Instance)
    if (startPoint) {
      const pStart = coordToCanvas(startPoint.lat, startPoint.lon, width, height);
      // Start Pin (Green)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(pStart.x, pStart.y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText('START', pStart.x - 14, pStart.y - 10);
    }

    if (goalPoint) {
      const pGoal = coordToCanvas(goalPoint.lat, goalPoint.lon, width, height);
      // Goal Pin (Red)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pGoal.x, pGoal.y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText('GOAL', pGoal.x - 12, pGoal.y - 10);
    }

    // 12. Hazard Zones (Rendered ONLY when Zoomed In >= ZOOM_THRESHOLD)
    if (isZoomedIn) {
      hazards.forEach((haz) => {
        const cp = coordToCanvas(haz.center.lat, haz.center.lon, width, height);
        const r = Math.max(12, (haz.radiusMeters / 1000) * s);

        ctx.strokeStyle = haz.riskLevel === 'CRITICAL' ? '#ef4444' : haz.riskLevel === 'HIGH' ? '#f97316' : '#eab308';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label hazard title if zoom is sufficiently detailed
        if (viewport.scale >= 9) {
          ctx.fillStyle = ctx.strokeStyle;
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillText(haz.title, cp.x + r + 4, cp.y + 3);
        }
      });
    }

    // 13. Science Targets (Rendered ONLY when Zoomed In >= ZOOM_THRESHOLD)
    if (isZoomedIn) {
      scienceTargets.forEach((sci) => {
        const cp = coordToCanvas(sci.coordinates.lat, sci.coordinates.lon, width, height);
        const isTier1 = sci.tier === 1;

        ctx.fillStyle = isTier1 ? '#06b6d4' : '#818cf8';
        ctx.beginPath();
        const stSize = 5;
        ctx.moveTo(cp.x, cp.y - stSize);
        ctx.lineTo(cp.x + stSize, cp.y);
        ctx.lineTo(cp.x, cp.y + stSize);
        ctx.lineTo(cp.x - stSize, cp.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Target name label in detailed view
        if (viewport.scale >= 8.5) {
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillText(sci.name, cp.x + 8, cp.y + 3);
        }
      });
    }

    // 14. Iconic Martian Landmarks (All 10 Global Sites) - Strict Single Surface Non-Repeating
    // Distributed vastly across the global Martian surface according to actual Mars Lat/Lon data
    MARS_REGIONS.forEach((region) => {
      const cp = coordToCanvas(region.center.lat, region.center.lon, width, height);
      const isSelected = region.id === selectedRegion;

      // Only draw if within visible canvas area + margin
      if (cp.x < -120 || cp.x > width + 120 || cp.y < -50 || cp.y > height + 50) return;

      if (!isZoomedIn) {
        // High-level clean macro region marker & label
        ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(245, 158, 11, 0.85)';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, isSelected ? 8 : 5.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#38bdf8' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, isSelected ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Macro Landmark callout badge
        const label = region.name.split(' (')[0];
        ctx.font = isSelected ? 'bold 11px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
        const tw = ctx.measureText(label).width;
        const badgeX = cp.x + 8;
        const badgeY = cp.y - 7;

        ctx.fillStyle = isSelected ? 'rgba(8, 47, 73, 0.92)' : 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1;
        ctx.fillRect(badgeX, badgeY, tw + 8, 16);
        ctx.strokeRect(badgeX, badgeY, tw + 8, 16);

        ctx.fillStyle = isSelected ? '#e0f2fe' : '#fef3c7';
        ctx.textAlign = 'left';
        ctx.fillText(label, badgeX + 4, badgeY + 12);
      } else {
        // Subdued indicator for other macro regions while inspecting tactical details
        if (!isSelected) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // 14.5 Mars Habitation Suitability Map Layer (Tri-Color Signal System)
    // Green (Full Positive): Prime landing/habitation (flat, safe) with glowing green effect
    // Yellow (Moderate/Caution): Acceptable but risky zones with glowing yellow effect
    // Red (Totally Negative): Absolute no-go danger zones with pulsating red effect
    const isSuitabilityLayerOn = showSuitabilityZones && (isLayerOn('habitation_suitability') !== false);
    if (isSuitabilityLayerOn) {
      MARS_HABITATION_SUITABILITY_ZONES.forEach((zone) => {
        const cp = coordToCanvas(zone.lat, zone.lng, width, height);
        const rPx = Math.max(18, zone.radius * s);

        // Visibility check against screen buffer
        if (cp.x + rPx < -40 || cp.x - rPx > width + 40 || cp.y + rPx < -40 || cp.y - rPx > height + 40) {
          return;
        }

        const isHoveredOrSelected = selectedSuitabilityZone?.id === zone.id;
        ctx.save();

        if (zone.status === 'green') {
          // 🟢 GREEN: Prime Landing & Habitation (Flat terrain, safe) - Glowing Green Effect
          const greenBreath = Math.sin(suitabilityPulse * Math.PI * 2);
          const glowBlur = isHoveredOrSelected ? 24 : 13 + greenBreath * 5;

          // Multi-stop Radial Gradient Base Dome
          const grad = ctx.createRadialGradient(cp.x, cp.y, 0, cp.x, cp.y, rPx);
          grad.addColorStop(0, 'rgba(16, 185, 129, 0.44)');
          grad.addColorStop(0.5, 'rgba(5, 150, 105, 0.24)');
          grad.addColorStop(0.82, 'rgba(16, 185, 129, 0.08)');
          grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rPx, 0, Math.PI * 2);
          ctx.fill();

          // Luminous Outer Glowing Green Perimeter
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = glowBlur;
          ctx.strokeStyle = isHoveredOrSelected ? '#34d399' : '#10b981';
          ctx.lineWidth = isHoveredOrSelected ? 2.8 : 1.8;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rPx, 0, Math.PI * 2);
          ctx.stroke();

          // Inner Concentric Landing Ellipse / Safety Guide
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rPx * 0.52, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Central Prime Landing Core
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Crosshairs
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(cp.x - 7, cp.y);
          ctx.lineTo(cp.x + 7, cp.y);
          ctx.moveTo(cp.x, cp.y - 7);
          ctx.lineTo(cp.x, cp.y + 7);
          ctx.stroke();

          // Floating Callout Badge
          const label = `HAB-PRIME: ${zone.name.split(' ')[0]}`;
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          const tw = ctx.measureText(label).width;
          const badgeW = tw + 22;
          const badgeH = 16;
          const bx = cp.x - badgeW / 2;
          const by = cp.y - rPx - 18;

          ctx.fillStyle = isHoveredOrSelected ? 'rgba(6, 78, 59, 0.95)' : 'rgba(6, 78, 59, 0.88)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1;
          ctx.fillRect(bx, by, badgeW, badgeH);
          ctx.strokeRect(bx, by, badgeW, badgeH);

          // Glowing status indicator dot
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(bx + 8, by + badgeH / 2, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ecfdf5';
          ctx.textAlign = 'left';
          ctx.fillText(label, bx + 16, by + 11);

        } else if (zone.status === 'yellow') {
          // 🟡 YELLOW: Moderate / Caution (Acceptable but risky zones) - Glowing Yellow Effect
          const yellowBreath = Math.sin(suitabilityPulse * Math.PI * 2 + 1.2);
          const glowBlur = isHoveredOrSelected ? 22 : 11 + yellowBreath * 4;

          // Radial Gradient Base Dome
          const grad = ctx.createRadialGradient(cp.x, cp.y, 0, cp.x, cp.y, rPx);
          grad.addColorStop(0, 'rgba(234, 179, 8, 0.4)');
          grad.addColorStop(0.5, 'rgba(161, 98, 7, 0.22)');
          grad.addColorStop(0.82, 'rgba(234, 179, 8, 0.08)');
          grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rPx, 0, Math.PI * 2);
          ctx.fill();

          // Luminous Outer Glowing Amber/Yellow Perimeter
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = glowBlur;
          ctx.strokeStyle = isHoveredOrSelected ? '#fbbf24' : '#f59e0b';
          ctx.lineWidth = isHoveredOrSelected ? 2.6 : 1.7;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rPx, 0, Math.PI * 2);
          ctx.stroke();

          // Inner Caution Concentric Ring
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rPx * 0.55, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Center Caution Diamond
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(cp.x, cp.y - 5);
          ctx.lineTo(cp.x + 5, cp.y);
          ctx.lineTo(cp.x, cp.y + 5);
          ctx.lineTo(cp.x - 5, cp.y);
          ctx.closePath();
          ctx.fill();

          // Floating Callout Badge
          const label = `CAUTION: ${zone.name.split(' ')[0]}`;
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          const tw = ctx.measureText(label).width;
          const badgeW = tw + 22;
          const badgeH = 16;
          const bx = cp.x - badgeW / 2;
          const by = cp.y - rPx - 18;

          ctx.fillStyle = isHoveredOrSelected ? 'rgba(113, 63, 18, 0.95)' : 'rgba(113, 63, 18, 0.88)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.fillRect(bx, by, badgeW, badgeH);
          ctx.strokeRect(bx, by, badgeW, badgeH);

          // Yellow status indicator dot
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(bx + 8, by + badgeH / 2, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fefce8';
          ctx.textAlign = 'left';
          ctx.fillText(label, bx + 16, by + 11);

        } else if (zone.status === 'red') {
          // 🔴 RED: Totally Negative (Absolute No-Go Danger Zones) - Pulsating Red Effect
          // Continuous animated shockwave ripple ring 1
          const phase1 = suitabilityPulse;
          const rShock1 = rPx * (0.45 + 0.7 * phase1);
          const alphaShock1 = (1 - phase1) * 0.85;

          ctx.strokeStyle = `rgba(239, 68, 68, ${alphaShock1})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rShock1, 0, Math.PI * 2);
          ctx.stroke();

          // Continuous animated shockwave ripple ring 2 (offset by 0.5 for seamless double pulse)
          const phase2 = (suitabilityPulse + 0.5) % 1.0;
          const rShock2 = rPx * (0.45 + 0.7 * phase2);
          const alphaShock2 = (1 - phase2) * 0.85;

          ctx.strokeStyle = `rgba(239, 68, 68, ${alphaShock2})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rShock2, 0, Math.PI * 2);
          ctx.stroke();

          // Intense Red Danger Dome Radial Gradient
          const grad = ctx.createRadialGradient(cp.x, cp.y, 0, cp.x, cp.y, rPx);
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
          grad.addColorStop(0.5, 'rgba(185, 28, 28, 0.3)');
          grad.addColorStop(0.82, 'rgba(239, 68, 68, 0.1)');
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rPx, 0, Math.PI * 2);
          ctx.fill();

          // Pulsating Outer Danger Boundary Ring with High-Intensity Red Aura
          const redGlow = 14 + Math.sin(suitabilityPulse * Math.PI * 2) * 8;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = isHoveredOrSelected ? 26 : redGlow;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = isHoveredOrSelected ? 3.2 : 2.2;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rPx, 0, Math.PI * 2);
          ctx.stroke();

          // Concentric Hazard Perimeter Ticks
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, rPx * 0.65, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Central Hazard Strobe Core
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // White Exclamation / X Danger Mark
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cp.x - 3, cp.y - 3);
          ctx.lineTo(cp.x + 3, cp.y + 3);
          ctx.moveTo(cp.x + 3, cp.y - 3);
          ctx.lineTo(cp.x - 3, cp.y + 3);
          ctx.stroke();

          // Floating Callout Badge
          const label = `NO-GO: ${zone.name.split(' ')[0]}`;
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          const tw = ctx.measureText(label).width;
          const badgeW = tw + 22;
          const badgeH = 16;
          const bx = cp.x - badgeW / 2;
          const by = cp.y - rPx - 18;

          ctx.fillStyle = isHoveredOrSelected ? 'rgba(127, 29, 29, 0.96)' : 'rgba(127, 29, 29, 0.88)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1;
          ctx.fillRect(bx, by, badgeW, badgeH);
          ctx.strokeRect(bx, by, badgeW, badgeH);

          // Pulsating Red Flash Dot
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.arc(bx + 8, by + badgeH / 2, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef2f2';
          ctx.textAlign = 'left';
          ctx.fillText(label, bx + 16, by + 11);
        }

        ctx.restore();
      });
    }

    // 15. Selected Target Crosshair Reticle & Floating Coordinates HUD
    if (selectedPoint) {
      const cp = coordToCanvas(selectedPoint.lat, selectedPoint.lon, width, height);
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crosshairs
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cp.x - 22, cp.y);
      ctx.lineTo(cp.x - 6, cp.y);
      ctx.moveTo(cp.x + 6, cp.y);
      ctx.lineTo(cp.x + 22, cp.y);
      ctx.moveTo(cp.x, cp.y - 22);
      ctx.lineTo(cp.x, cp.y - 6);
      ctx.moveTo(cp.x, cp.y + 6);
      ctx.lineTo(cp.x, cp.y + 22);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Reticle Tag
      const badgeText = `${selectedPoint.lat.toFixed(3)}°N, ${selectedPoint.lon.toFixed(3)}°E`;
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      const bWidth = ctx.measureText(badgeText).width;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.95)';
      ctx.fillRect(cp.x + 10, cp.y + 6, bWidth + 10, 18);
      ctx.fillStyle = '#05070d';
      ctx.fillText(badgeText, cp.x + 15, cp.y + 19);
      ctx.restore();
    }

    // 16. Highlighted Location Marker & Animated Ping Radar (from 3D globe click or location selector)
    if (highlightedPoint) {
      const hp = coordToCanvas(highlightedPoint.lat, highlightedPoint.lon, width, height);
      ctx.save();

      // 3 expanding radar ping rings
      for (let ring = 0; ring < 3; ring++) {
        const ringProgress = (pingProgress + ring * 0.33) % 1;
        const pingRadius = 10 + ringProgress * 48;
        const pingAlpha = Math.max(0, 1 - ringProgress) * 0.85;

        ctx.strokeStyle = `rgba(34, 211, 238, ${pingAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, pingRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Concentric target reticle
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crosshairs
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hp.x - 20, hp.y);
      ctx.lineTo(hp.x - 6, hp.y);
      ctx.moveTo(hp.x + 6, hp.y);
      ctx.lineTo(hp.x + 20, hp.y);
      ctx.moveTo(hp.x, hp.y - 20);
      ctx.lineTo(hp.x, hp.y - 6);
      ctx.moveTo(hp.x, hp.y + 6);
      ctx.lineTo(hp.x, hp.y + 20);
      ctx.stroke();

      // Center beacon dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Telemetry badge
      const regionName = highlightedPoint.name || 'INSPECTED COORDINATE';
      const labelText = `📍 ${regionName.toUpperCase()}`;
      const coordText = `${highlightedPoint.lat.toFixed(3)}°N, ${highlightedPoint.lon.toFixed(3)}°E`;
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      const textWidth = Math.max(ctx.measureText(labelText).width, ctx.measureText(coordText).width);
      const badgeW = textWidth + 16;
      const badgeH = 30;
      const badgeX = hp.x + 14;
      const badgeY = hp.y - 36;

      ctx.fillStyle = 'rgba(8, 15, 28, 0.92)';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.2;
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      ctx.fillStyle = '#22d3ee';
      ctx.textAlign = 'left';
      ctx.fillText(labelText, badgeX + 8, badgeY + 13);
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(coordText, badgeX + 8, badgeY + 25);

      ctx.restore();
    }
  }, [
    viewport,
    layers,
    roverMission,
    hazards,
    scienceTargets,
    activeRoutes,
    selectedRouteId,
    startPoint,
    goalPoint,
    selectedPoint,
    selectedRegion,
    highlightedPoint,
    pingProgress,
    showSuitabilityZones,
    selectedSuitabilityZone,
    suitabilityPulse,
    coordToCanvas,
    getPixelsPerDeg,
    basemapSource,
    loadedTileCount,
    getTile
  ]);

  // Non-passive wheel event listener for smooth Google Maps style zooming anchored to cursor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNonPassiveWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
      const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;

      setViewport((prev) => {
        const oldScale = prev.scale;
        const newScale = Math.max(1.0, Math.min(50.0, oldScale * zoomFactor));
        const oldS = getPixelsPerDeg(canvas.width, canvas.height, oldScale);
        const newS = getPixelsPerDeg(canvas.width, canvas.height, newScale);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;

        // Zoom centered around cursor position on the single flat coordinate plane
        const rawCenterLon = prev.centerLon + dx * (1 / oldS - 1 / newS);
        const rawCenterLat = prev.centerLat - dy * (1 / oldS - 1 / newS);

        // Clamped via clampViewport so edges never pull into void (zero black borders)
        return clampViewport(rawCenterLon, rawCenterLat, newScale);
      });
    };

    canvas.addEventListener('wheel', handleNonPassiveWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleNonPassiveWheel);
    };
  }, [getPixelsPerDeg, clampViewport]);

  // Coordinate calculation relative to canvas buffer
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Centralized robust place selection handler
  const processMapClick = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = canvasToCoord(x, y, canvas.width, canvas.height);

    if (clickMode === 'SET_START') {
      const newPt: MarsCoordinates = {
        lat: coords.lat,
        lon: coords.lon,
        elevationMeters: coords.elevationMeters,
        name: `Origin (${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E)`
      };
      onSetStartPoint(newPt);
      setSelectedPoint(newPt);
    } else if (clickMode === 'SET_GOAL') {
      const newPt: MarsCoordinates = {
        lat: coords.lat,
        lon: coords.lon,
        elevationMeters: coords.elevationMeters,
        name: `Goal (${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E)`
      };
      onSetGoalPoint(newPt);
      setSelectedPoint(newPt);
    } else {
      // In tactical LOD (zoomed in): check if clicked close to a science target or hazard
      if (isZoomedIn) {
        const clickedTarget = scienceTargets.find((t) => {
          const p = coordToCanvas(t.coordinates.lat, t.coordinates.lon, canvas.width, canvas.height);
          return Math.hypot(x - p.x, y - p.y) < 22;
        });

        if (clickedTarget) {
          setSelectedPoint(clickedTarget.coordinates);
          onSelectTarget(clickedTarget);
          return;
        }

        const clickedHazard = hazards.find((h) => {
          const p = coordToCanvas(h.center.lat, h.center.lon, canvas.width, canvas.height);
          return Math.hypot(x - p.x, y - p.y) < 20;
        });

        if (clickedHazard) {
          setSelectedPoint(clickedHazard.center);
          onSelectHazard(clickedHazard);
          return;
        }
      }

      // Check if clicked close to a Habitation Suitability Zone when layer is active
      if (showSuitabilityZones) {
        const s = getPixelsPerDeg(canvas.width, canvas.height, viewport.scale);
        const clickedSuitability = MARS_HABITATION_SUITABILITY_ZONES.find((z) => {
          const p = coordToCanvas(z.lat, z.lng, canvas.width, canvas.height);
          const r = Math.max(22, z.radius * s);
          return Math.hypot(x - p.x, y - p.y) <= r;
        });

        if (clickedSuitability) {
          setSelectedSuitabilityZone(clickedSuitability);
          setSelectedPoint({
            lat: clickedSuitability.lat,
            lon: clickedSuitability.lng,
            elevationMeters: clickedSuitability.elevationMeters,
            name: clickedSuitability.name
          });
          onAnalyzeCoords(clickedSuitability.lat, clickedSuitability.lng, clickedSuitability.elevationMeters);
          return;
        }
      }

      // Check if clicked close to one of the 10 iconic Martian landmarks on the single surface
      const clickedLandmark = MARS_REGIONS.find((r) => {
        const p = coordToCanvas(r.center.lat, r.center.lon, canvas.width, canvas.height);
        return Math.hypot(x - p.x, y - p.y) < 26;
      });

      if (clickedLandmark) {
        setSelectedSuitabilityZone(null);
        setSelectedPoint(clickedLandmark.center);
        setActivePopupLocation(clickedLandmark);
        if (onSelectRegion) {
          onSelectRegion(clickedLandmark.id);
        }
        return;
      }

      // Universal point selection & geological terrain analysis
      setSelectedSuitabilityZone(null);
      setSelectedPoint(coords);
      onAnalyzeCoords(coords.lat, coords.lon, coords.elevationMeters);
    }
  };

  // MOUSE DRAG & UNRESTRICTED CONTINUOUS PANNING
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (panAnimRef.current) {
      cancelAnimationFrame(panAnimRef.current);
      panAnimRef.current = null;
    }
    targetCenterRef.current = null;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isDragOperation.current = false;
    setIsPanning(true);
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      centerLon: viewport.centerLon,
      centerLat: viewport.centerLat
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(e);

    const coords = canvasToCoord(x, y, canvas.width, canvas.height);
    setCursorPos(coords);

    if (dragStartPos.current) {
      const dist = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
      if (dist > 5) {
        isDragOperation.current = true;
      }
    }

    if (isPanning) {
      const s = getPixelsPerDeg(canvas.width, canvas.height, viewport.scale);
      const deltaX = e.clientX - panStartRef.current.clientX;
      const deltaY = e.clientY - panStartRef.current.clientY;

      const rawLon = panStartRef.current.centerLon - deltaX / s;
      const rawLat = panStartRef.current.centerLat + deltaY / s;

      const clamped = clampViewport(rawLon, rawLat, viewport.scale);
      setViewport((prev) => ({
        ...prev,
        centerLon: clamped.centerLon,
        centerLat: clamped.centerLat
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragOperation.current) {
      isDragOperation.current = false;
      return;
    }
    const { x, y } = getCanvasCoords(e);
    processMapClick(x, y);
  };

  // TOUCH HANDLERS FOR MOBILE COMPATIBILITY & UNRESTRICTED 4-WAY PANNING
  // Resolves pointer events conflict on mobile:
  // - In 'SCROLL' mode (default on mobile when not fullscreen): Single-finger vertical swipes scroll the webpage smoothly.
  // - Two fingers ALWAYS pinch-to-zoom and pan the map across all platforms.
  // - In 'PAN' mode or when in Fullscreen: Single-finger gesture pans the map freely.
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    touchDirectionDecidedRef.current = null;

    // 1. Two-finger pinch-to-zoom / two-finger pan
    if (e.touches.length === 2) {
      if (panAnimRef.current) {
        cancelAnimationFrame(panAnimRef.current);
        panAnimRef.current = null;
      }
      targetCenterRef.current = null;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = viewport.scale;
      twoFingerStartMidRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
        centerLon: viewport.centerLon,
        centerLat: viewport.centerLat
      };
      setIsPanning(true);
      return;
    }

    // 2. Single-finger touch
    if (e.touches.length === 1) {
      if (panAnimRef.current) {
        cancelAnimationFrame(panAnimRef.current);
        panAnimRef.current = null;
      }
      targetCenterRef.current = null;
      const t = e.touches[0];
      dragStartPos.current = { x: t.clientX, y: t.clientY };
      isDragOperation.current = false;
      panStartRef.current = {
        clientX: t.clientX,
        clientY: t.clientY,
        centerLon: viewport.centerLon,
        centerLat: viewport.centerLat
      };

      // Only engage panning state immediately if in Fullscreen or explicit PAN mode
      if (isFullscreen || touchInteractionMode === 'PAN') {
        setIsPanning(true);
      } else {
        setIsPanning(false);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // 1. Two-finger pinch-to-zoom & two-finger pan
    if (e.touches.length === 2 && touchStartDistRef.current && twoFingerStartMidRef.current) {
      isDragOperation.current = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (touchStartDistRef.current > 0) {
        const factor = newDist / touchStartDistRef.current;
        const newScale = Math.max(1.0, Math.min(15.0, touchStartScaleRef.current * factor));

        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const deltaX = midX - twoFingerStartMidRef.current.x;
        const deltaY = midY - twoFingerStartMidRef.current.y;

        const canvas = canvasRef.current;
        if (canvas) {
          const s = getPixelsPerDeg(canvas.width, canvas.height, newScale);
          const rawLon = twoFingerStartMidRef.current.centerLon - deltaX / s;
          const rawLat = twoFingerStartMidRef.current.centerLat + deltaY / s;
          const clamped = clampViewport(rawLon, rawLat, newScale);
          setViewport({
            scale: newScale,
            centerLon: clamped.centerLon,
            centerLat: clamped.centerLat
          });
        }
      }
      return;
    }

    // 2. Single-finger touch handling
    if (e.touches.length === 1 && dragStartPos.current) {
      const t = e.touches[0];
      const dx = t.clientX - dragStartPos.current.x;
      const dy = t.clientY - dragStartPos.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        isDragOperation.current = true;
      }

      // If in SCROLL mode (and not in fullscreen):
      if (!isFullscreen && touchInteractionMode === 'SCROLL') {
        if (!touchDirectionDecidedRef.current && dist > 10) {
          // If swipe is mostly vertical: yield to browser page scrolling
          if (Math.abs(dy) >= Math.abs(dx)) {
            touchDirectionDecidedRef.current = 'SCROLL';
            setIsPanning(false);
            return;
          } else {
            // Horizontal swipe: pan map horizontally
            touchDirectionDecidedRef.current = 'PAN';
            setIsPanning(true);
          }
        }

        // If decided as page scroll, don't capture or move map
        if (touchDirectionDecidedRef.current === 'SCROLL') {
          return;
        }
      }

      // Execute map pan
      if (isPanning || isFullscreen || touchInteractionMode === 'PAN') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const s = getPixelsPerDeg(canvas.width, canvas.height, viewport.scale);
        const deltaX = t.clientX - panStartRef.current.clientX;
        const deltaY = t.clientY - panStartRef.current.clientY;

        const rawLon = panStartRef.current.centerLon - deltaX / s;
        const rawLat = panStartRef.current.centerLat + deltaY / s;

        const clamped = clampViewport(rawLon, rawLat, viewport.scale);
        setViewport((prev) => ({
          ...prev,
          centerLon: clamped.centerLon,
          centerLat: clamped.centerLat
        }));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsPanning(false);
    touchStartDistRef.current = null;
    twoFingerStartMidRef.current = null;
    touchDirectionDecidedRef.current = null;

    if (!isDragOperation.current && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
        const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
        const x = (t.clientX - rect.left) * scaleX;
        const y = (t.clientY - rect.top) * scaleY;
        processMapClick(x, y);
      }
    }
    isDragOperation.current = false;
  };

  return (
    <div
      ref={containerRef}
      id="mars-gis-map-container"
      style={{
        touchAction: isFullscreen || touchInteractionMode === 'PAN' ? 'none' : 'pan-y'
      }}
      className={`bg-[#05070d] select-none transition-all duration-200 ${
        isFullscreen || touchInteractionMode === 'PAN' ? 'touch-none' : 'touch-pan-y'
      } ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen overflow-hidden rounded-none border-0 m-0 p-0'
          : 'relative w-full h-full flex-1 min-h-[540px] sm:min-h-[620px] lg:min-h-[720px] rounded-xl border border-cyan-950/60 overflow-hidden shadow-2xl flex flex-col'
      }`}
    >
      {/* Floating Always-Visible High-Z-Index Fullscreen Exit Button */}
      {isFullscreen && (
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[100000] flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
          <button
            id="mars-gis-exit-fullscreen-floating-btn"
            onClick={handleToggleFullscreen}
            className="bg-red-950/95 hover:bg-red-900 border-2 border-red-500/90 hover:border-red-400 text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center space-x-2 font-mono text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(239,68,68,0.7)] backdrop-blur-xl cursor-pointer active:scale-95 transition-all"
            title="Exit Fullscreen Mode (or press Esc)"
            aria-label="Exit Fullscreen Mode"
          >
            <Minimize2 className="w-4 h-4 text-red-300 animate-pulse" />
            <span>EXIT FULLSCREEN (ESC)</span>
          </button>
        </div>
      )}

      {/* Global 2D Canvas */}
      <canvas
        ref={canvasRef}
        id="mars-gis-canvas"
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: isFullscreen || touchInteractionMode === 'PAN' ? 'none' : 'pan-y'
        }}
        className={`absolute inset-0 w-full h-full block select-none ${
          isFullscreen || touchInteractionMode === 'PAN' ? 'touch-none' : 'touch-pan-y'
        } ${
          clickMode === 'ANALYZE' ? 'cursor-crosshair' : 'cursor-pointer'
        }`}
      />

      {/* Top Floating GIS Telemetry Bar */}
      {showOverlays && (
        <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 pointer-events-none z-10">
        <div className="bg-slate-950/90 border border-cyan-900/70 backdrop-blur-md rounded-lg p-1.5 sm:p-2 px-2.5 sm:px-3 flex items-center space-x-2 sm:space-x-3 pointer-events-auto shadow-lg max-w-full overflow-x-auto hide-scrollbar">
          {/* Basemap Source Selector */}
          <div className="relative">
            <button
              onClick={() => setIsTileSelectorOpen(!isTileSelectorOpen)}
              className="bg-slate-900/90 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-[10px] sm:text-xs font-mono px-2 py-1 rounded flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Switch Real NASA Mars Basemap Tiles"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-semibold shrink-0">{TILE_SOURCES[basemapSource].shortName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {isTileSelectorOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-950/95 border border-cyan-700/80 backdrop-blur-xl rounded-lg shadow-2xl p-1.5 z-30 font-mono text-xs space-y-1">
                <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 flex justify-between items-center">
                  <span>NASA Planetary Mosaics</span>
                  <span className="text-emerald-400 font-mono text-[9px]">REAL TILES</span>
                </div>
                {(Object.keys(TILE_SOURCES) as BasemapTileSource[]).map((srcKey) => {
                  const cfg = TILE_SOURCES[srcKey];
                  const isSelected = basemapSource === srcKey;
                  return (
                    <button
                      key={srcKey}
                      onClick={() => {
                        setBasemapSource(srcKey);
                        setIsTileSelectorOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-md transition-all flex items-start justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/80 border border-cyan-600/60 text-cyan-200'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-[11px] flex items-center space-x-1.5">
                          <span>{cfg.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{cfg.desc}</div>
                        <div className="text-[8px] text-cyan-500/80 mt-0.5">Res: {cfg.resolution} • {cfg.provider}</div>
                      </div>
                    </button>
                  );
                })}
                <div className="pt-1 border-t border-slate-800 flex justify-between items-center px-1">
                  <button
                    onClick={() => {
                      setIsTileSelectorOpen(false);
                      setIsCustomTileModalOpen(true);
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 py-1 px-1.5 rounded hover:bg-cyan-950/40 cursor-pointer w-full"
                  >
                    <Settings2 className="w-3 h-3 shrink-0" />
                    <span>Configure Custom XYZ Tile URL...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Real NASA Data Stream Active" />
          
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="text-[10px] sm:text-[11px] font-mono text-cyan-300 font-medium shrink-0">
            ZOOM: {zoomLevel.toFixed(1)}x
          </div>

          <span className="text-slate-600">|</span>
          <button
            onClick={() => {
              setViewport((prev) => ({
                ...prev,
                scale: isZoomedIn ? 3.0 : 8.5
              }));
            }}
            className={`text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border flex items-center space-x-1 transition-colors cursor-pointer shrink-0 ${
              isZoomedIn
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 font-bold hover:bg-cyan-900'
                : 'bg-amber-950/60 border-amber-600/40 text-amber-300 hover:bg-amber-900'
            }`}
            title={isZoomedIn ? 'Click to toggle Macro Overview (<7x)' : 'Click to toggle Tactical Detail (≥7x)'}
          >
            <span>{isZoomedIn ? 'LOD: TACTICAL' : 'LOD: MACRO'}</span>
          </button>

          {/* Full Globe Reset Button */}
          <button
            onClick={() => {
              setViewport(clampViewport(0, 0, 1.0));
            }}
            className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border border-slate-700 bg-slate-900/90 text-slate-300 hover:text-cyan-300 hover:border-cyan-600 transition-colors cursor-pointer shrink-0"
            title="Reset view to entire global Mars map (0°N, 0°E, 1.0x minZoom)"
          >
            FULL GLOBE
          </button>

          {/* Full-Bleed Status Badge */}
          <div
            className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 font-semibold flex items-center space-x-1 shrink-0"
            title="Full-bleed edge-to-edge rendering with maxBounds clamping active. Zero black borders."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>FULL-BLEED: ZERO BORDERS</span>
          </div>

          {/* Specific Toggle Button for Mars Habitation Suitability Map */}
          <button
            onClick={() => setShowSuitabilityZones(!showSuitabilityZones)}
            className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded border flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
              showSuitabilityZones
                ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Mars Habitation Suitability Zones (Green: Prime, Yellow: Caution, Red: No-Go Danger)"
          >
            <Shield className={`w-3.5 h-3.5 ${showSuitabilityZones ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span>HABITATION ZONES: {showSuitabilityZones ? 'ON' : 'OFF'}</span>
          </button>

          {/* Mobile Touch Mode Switcher (Scroll Page vs Pan Map) */}
          <button
            id="mars-touch-mode-btn"
            onClick={() => setTouchInteractionMode((prev) => (prev === 'SCROLL' ? 'PAN' : 'SCROLL'))}
            className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded border flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
              touchInteractionMode === 'PAN'
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 font-medium'
            }`}
            title={
              touchInteractionMode === 'PAN'
                ? 'Touch Pan Mode Active: Single-finger moves map. Tap to switch to Page Scroll mode.'
                : 'Touch Scroll Mode Active: Page scrolls freely vertically. Tap to switch to Map Pan mode.'
            }
          >
            {touchInteractionMode === 'PAN' ? (
              <>
                <Move className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>TOUCH: PAN MAP</span>
              </>
            ) : (
              <>
                <Navigation className="w-3 h-3 text-emerald-400" />
                <span>TOUCH: SCROLL PAGE</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Coordinates HUD & Fullscreen Button */}
        <div className="flex items-center space-x-1.5 pointer-events-auto shrink-0">
          {cursorPos && (
            <div className="bg-slate-950/90 border border-slate-700/80 backdrop-blur-md rounded-lg p-1.5 sm:p-2 px-2.5 sm:px-3 font-mono text-[10px] sm:text-xs text-slate-300 flex items-center space-x-2 sm:space-x-3 shadow-lg shrink-0">
              <span>
                LAT: <span className="text-amber-400 font-bold">{cursorPos.lat >= 0 ? `${cursorPos.lat}°N` : `${Math.abs(cursorPos.lat)}°S`}</span>
              </span>
              <span>
                LON: <span className="text-amber-400 font-bold">{cursorPos.lon >= 0 ? `${cursorPos.lon}°E` : `${Math.abs(cursorPos.lon)}°W`}</span>
              </span>
              <span>
                ELEV: <span className="text-cyan-400 font-bold">{cursorPos.elevationMeters > 0 ? `+${cursorPos.elevationMeters}` : cursorPos.elevationMeters}m</span>
              </span>
              {cursorPos.terrain && (
                <span className="hidden md:inline text-slate-400 text-[11px]">
                  ({cursorPos.terrain})
                </span>
              )}
            </div>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            id="mars-gis-fullscreen-toggle-btn"
            onClick={handleToggleFullscreen}
            className="bg-slate-950/90 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 hover:text-white p-1.5 sm:p-2 rounded-lg flex items-center transition-colors shadow-lg cursor-pointer shrink-0"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen Real NASA Mars GIS'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>
      )}

      {/* Map Interactive Click Mode Toggle Strip (Moved above D-Pad on mobile, icon-only p-2; desktop stays top-14 right-3) */}
      {showOverlays && (
        <div className="absolute bottom-44 right-3 lg:bottom-auto lg:top-14 lg:right-3 bg-slate-950/85 border border-slate-800 backdrop-blur-md rounded-lg p-1 flex flex-col space-y-1 shadow-lg pointer-events-auto z-20">
          <button
            onClick={() => setClickMode('ANALYZE')}
            className={`p-2 lg:px-2.5 lg:py-1.5 rounded text-xs font-mono flex items-center justify-center space-x-0 lg:space-x-1.5 transition-colors ${
              clickMode === 'ANALYZE'
                ? 'bg-cyan-600 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Inspect Point: Click surface to run AI geological & terrain analysis"
          >
            <Crosshair className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
            <span className="hidden lg:inline">Inspect Point</span>
          </button>

          <button
            onClick={() => setClickMode('SET_START')}
            className={`p-2 lg:px-2.5 lg:py-1.5 rounded text-xs font-mono flex items-center justify-center space-x-0 lg:space-x-1.5 transition-colors ${
              clickMode === 'SET_START'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Set Start: Click to place Origin (Start Point)"
          >
            <MapPin className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Set Start</span>
          </button>

          <button
            onClick={() => setClickMode('SET_GOAL')}
            className={`p-2 lg:px-2.5 lg:py-1.5 rounded text-xs font-mono flex items-center justify-center space-x-0 lg:space-x-1.5 transition-colors ${
              clickMode === 'SET_GOAL'
                ? 'bg-red-600 text-white font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Set Goal: Click to place Destination (Goal Point)"
          >
            <Navigation className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-red-400" />
            <span className="hidden lg:inline">Set Goal</span>
          </button>

          {/* Toggle Suitability Zones Button */}
          <button
            onClick={() => setShowSuitabilityZones(!showSuitabilityZones)}
            className={`p-2 lg:px-2.5 lg:py-1.5 rounded text-xs font-mono flex items-center justify-center space-x-0 lg:space-x-1.5 transition-colors cursor-pointer ${
              showSuitabilityZones
                ? 'bg-emerald-600/90 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Mars Habitation Suitability Zones on/off (Green: Prime, Yellow: Caution, Red: No-Go)"
          >
            <Shield className={`w-4 h-4 lg:w-3.5 lg:h-3.5 ${showSuitabilityZones ? 'text-white' : 'text-emerald-400'}`} />
            <span className="hidden lg:inline">{showSuitabilityZones ? 'Habitation: ON' : 'Toggle Suitability'}</span>
          </button>
        </div>
      )}

      {/* Map Legend Overlay */}
      {showOverlays && (
        <div className="absolute bottom-3 left-3 bg-slate-950/85 border border-slate-800/80 backdrop-blur-md rounded-lg p-2.5 font-mono text-[11px] text-slate-300 shadow-xl pointer-events-auto max-w-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider flex items-center justify-between">
            <span>Active Map Legend</span>
            <span className="text-cyan-400">Global Mars GIS</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Slope &gt; 15°</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Smectite Clay</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400" />
              <span>Mg-Carbonate</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Rover Track</span>
            </div>
          </div>

          {/* Mars Habitation Suitability Signals Legend */}
          {showSuitabilityZones && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Habitation Signals</span>
                </span>
                <button
                  onClick={() => setShowSuitabilityZones(false)}
                  className="text-[9px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                >
                  Hide
                </button>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] shrink-0" />
                <span className="text-emerald-300 font-semibold">Green:</span>
                <span className="text-slate-300">Prime Landing & Base (Flat, Safe)</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] shrink-0" />
                <span className="text-amber-300 font-semibold">Yellow:</span>
                <span className="text-slate-300">Caution (Slopes, Hazards)</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_#ef4444] shrink-0" />
                <span className="text-red-300 font-semibold">Red:</span>
                <span className="text-slate-300">Absolute No-Go (Pulsating Danger)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mars Habitation Suitability Zone Inspection HUD Modal */}
      {showOverlays && selectedSuitabilityZone && (
        <div
          className={`absolute top-16 left-3 right-3 sm:left-auto sm:right-3 sm:w-[420px] bg-slate-950/95 border backdrop-blur-xl rounded-xl p-4 shadow-2xl z-30 pointer-events-auto animate-in fade-in zoom-in-95 duration-200 ${
            selectedSuitabilityZone.status === 'green'
              ? 'border-emerald-500/70 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
              : selectedSuitabilityZone.status === 'yellow'
              ? 'border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
              : 'border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
            <div className="flex items-center space-x-2.5">
              <div
                className={`p-2 rounded-lg border ${
                  selectedSuitabilityZone.status === 'green'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                    : selectedSuitabilityZone.status === 'yellow'
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                    : 'bg-red-950/80 border-red-500/60 text-red-400'
                }`}
              >
                {selectedSuitabilityZone.status === 'green' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : selectedSuitabilityZone.status === 'yellow' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono tracking-tight leading-tight">
                  {selectedSuitabilityZone.name}
                </h4>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      selectedSuitabilityZone.status === 'green'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : selectedSuitabilityZone.status === 'yellow'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse'
                    }`}
                  >
                    {selectedSuitabilityZone.status === 'green'
                      ? 'PRIME HABITATION SITE'
                      : selectedSuitabilityZone.status === 'yellow'
                      ? 'MODERATE / CAUTION ZONE'
                      : 'CRITICAL NO-GO DANGER ZONE'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedSuitabilityZone(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close inspection popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Suitability Score Bar */}
          <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80 mb-3 font-mono">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400">Habitation Suitability Rating:</span>
              <span
                className={`font-bold ${
                  selectedSuitabilityZone.status === 'green'
                    ? 'text-emerald-400'
                    : selectedSuitabilityZone.status === 'yellow'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {selectedSuitabilityZone.suitabilityScore}/100%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  selectedSuitabilityZone.status === 'green'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    : selectedSuitabilityZone.status === 'yellow'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                    : 'bg-gradient-to-r from-red-700 to-red-500'
                }`}
                style={{ width: `${selectedSuitabilityZone.suitabilityScore}%` }}
              />
            </div>
          </div>

          {/* Critical Parameter Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Coordinates</span>
              <span className="text-slate-200 font-bold">
                {selectedSuitabilityZone.lat >= 0 ? `${selectedSuitabilityZone.lat}°N` : `${Math.abs(selectedSuitabilityZone.lat)}°S`},{' '}
                {selectedSuitabilityZone.lng >= 0 ? `${selectedSuitabilityZone.lng}°E` : `${Math.abs(selectedSuitabilityZone.lng)}°W`}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">MOLA Elevation</span>
              <span className="text-cyan-400 font-bold">
                {selectedSuitabilityZone.elevationMeters > 0 ? `+${selectedSuitabilityZone.elevationMeters}` : selectedSuitabilityZone.elevationMeters} m
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Terrain Slope</span>
              <span
                className={`font-bold ${
                  selectedSuitabilityZone.slopeDeg > 20
                    ? 'text-red-400'
                    : selectedSuitabilityZone.slopeDeg > 7
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {selectedSuitabilityZone.slopeDeg}° incline
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Radiation Flux</span>
              <span
                className={`font-bold ${
                  selectedSuitabilityZone.radiationLevel === 'EXTREME'
                    ? 'text-red-400'
                    : selectedSuitabilityZone.radiationLevel === 'MODERATE'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {selectedSuitabilityZone.radiationLevel}
              </span>
            </div>
          </div>

          {/* Terrain & Summary */}
          <div className="space-y-2 mb-3.5 text-xs">
            <div className="p-2 rounded bg-slate-900/50 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-0.5">Terrain Characteristics</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {selectedSuitabilityZone.terrain}
              </p>
            </div>
            <div className="p-2 rounded bg-slate-900/50 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-0.5">NASA Engineering Assessment</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {selectedSuitabilityZone.summary}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={() => {
                smoothCenter(selectedSuitabilityZone.lng, selectedSuitabilityZone.lat);
                setViewport((prev) => ({
                  ...prev,
                  scale: Math.max(prev.scale, 4.5)
                }));
              }}
              className="flex-1 py-1.5 px-2.5 rounded bg-cyan-950/80 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-mono font-medium flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Center & Zoom</span>
            </button>
            <button
              onClick={() => {
                const pt: MarsCoordinates = {
                  lat: selectedSuitabilityZone.lat,
                  lon: selectedSuitabilityZone.lng,
                  elevationMeters: selectedSuitabilityZone.elevationMeters,
                  name: selectedSuitabilityZone.name
                };
                onSetStartPoint(pt);
                setSelectedPoint(pt);
              }}
              className="py-1.5 px-2.5 rounded bg-emerald-950/80 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-mono font-medium flex items-center space-x-1 transition-all cursor-pointer"
              title="Set this zone as Mission Start Point"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Set Start</span>
            </button>
            <button
              onClick={() => {
                const pt: MarsCoordinates = {
                  lat: selectedSuitabilityZone.lat,
                  lon: selectedSuitabilityZone.lng,
                  elevationMeters: selectedSuitabilityZone.elevationMeters,
                  name: selectedSuitabilityZone.name
                };
                onSetGoalPoint(pt);
                setSelectedPoint(pt);
              }}
              className="py-1.5 px-2.5 rounded bg-red-950/80 border border-red-500/50 hover:border-red-400 text-red-300 hover:text-white text-xs font-mono font-medium flex items-center space-x-1 transition-all cursor-pointer"
              title="Set this zone as Mission Destination Goal"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Set Goal</span>
            </button>
          </div>
        </div>
      )}

      {/* NASA Planetary Geological Significance Popup Modal */}
      {showOverlays && activePopupLocation && (
        <div className="absolute top-16 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 bg-slate-950/95 border border-cyan-500/70 backdrop-blur-xl rounded-xl p-4 shadow-2xl z-30 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-cyan-900/60 pb-2.5 mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono tracking-tight leading-tight">
                  {activePopupLocation.name}
                </h4>
                <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">
                  NASA Planetary Geological Datum
                </span>
              </div>
            </div>
            <button
              onClick={() => setActivePopupLocation(null)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
              title="Close Popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">COORDINATES</span>
                <span className="text-amber-300 font-semibold">
                  {activePopupLocation.center.lat >= 0 ? `${activePopupLocation.center.lat}°N` : `${Math.abs(activePopupLocation.center.lat)}°S`},{' '}
                  {activePopupLocation.center.lon >= 0 ? `${activePopupLocation.center.lon}°E` : `${Math.abs(activePopupLocation.center.lon)}°W`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">MOLA ELEVATION</span>
                <span className="text-cyan-300 font-semibold">
                  {activePopupLocation.center.elevationMeters > 0 ? `+${activePopupLocation.center.elevationMeters}` : activePopupLocation.center.elevationMeters} m
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">
                Scientific Significance
              </div>
              <p className="text-slate-200 text-xs leading-relaxed bg-amber-950/20 p-2 rounded border border-amber-900/40">
                {activePopupLocation.significance}
              </p>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Regional Overview
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {activePopupLocation.description}
              </p>
            </div>

            <div className="pt-2 space-y-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setViewport({
                    centerLon: activePopupLocation.center.lon,
                    centerLat: activePopupLocation.center.lat,
                    scale: 8.5
                  });
                  setActivePopupLocation(null);
                }}
                className="w-full py-1.5 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 hover:from-cyan-800 hover:to-blue-800 border border-cyan-500/60 text-cyan-200 rounded text-[10px] font-bold flex items-center justify-center space-x-1.5 transition-all shadow cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>EXPLORE INNER TARGETS (TACTICAL LOD)</span>
              </button>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    onSetStartPoint(activePopupLocation.center);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 rounded text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Set as Start Point
                </button>
                <button
                  onClick={() => {
                    onSetGoalPoint(activePopupLocation.center);
                  }}
                  className="px-2.5 py-1.5 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Set as Goal Point
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Touch Interaction Mode Indicator/Toggle */}
      {showOverlays && !isFullscreen && (
        <div className="absolute bottom-36 right-3 lg:hidden z-20 pointer-events-auto">
          <button
            id="mobile-touch-mode-floating-btn"
            onClick={() => setTouchInteractionMode((prev) => (prev === 'SCROLL' ? 'PAN' : 'SCROLL'))}
            className={`p-2 rounded-xl border font-mono text-[10px] flex items-center space-x-1.5 shadow-2xl backdrop-blur-md transition-all cursor-pointer ${
              touchInteractionMode === 'PAN'
                ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-950/90 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            title={
              touchInteractionMode === 'PAN'
                ? 'Touch Map Pan active: Drag finger to move map. Tap to switch to Page Scroll mode.'
                : 'Page Scroll active: Vertical swipes scroll the page. Tap to enable single-finger map panning.'
            }
          >
            {touchInteractionMode === 'PAN' ? (
              <>
                <Move className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="font-bold">MAP PAN ACTIVE</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>SCROLL PAGE</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Sci-Fi Directional Pan D-Pad Controller */}
      {showOverlays && (
        <div
          id="mars-gis-dpad-controller"
          className="absolute bottom-13 right-3 bg-slate-950/90 border border-cyan-900/60 backdrop-blur-md rounded-xl p-1.5 shadow-2xl pointer-events-auto z-20 flex flex-col items-center select-none"
        >
          <div className="text-[9px] font-mono font-bold text-cyan-400 tracking-wider mb-1 flex items-center space-x-1">
            <Compass className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>NAV D-PAD</span>
          </div>

          <div className="grid grid-cols-3 gap-1 w-[78px] h-[78px] items-center justify-items-center">
            {/* North / Up */}
            <div />
            <button
              id="mars-pan-north-btn"
              onClick={() => smoothPan(0, 100)}
              className="w-6 h-6 rounded bg-slate-900/90 hover:bg-cyan-950/90 border border-slate-700/80 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 flex items-center justify-center transition-all shadow-sm active:scale-90 group cursor-pointer"
              title="Pan North (Up) - Lat +100px"
              aria-label="Pan North"
            >
              <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <div />

            {/* West / Left */}
            <button
              id="mars-pan-west-btn"
              onClick={() => smoothPan(-100, 0)}
              className="w-6 h-6 rounded bg-slate-900/90 hover:bg-cyan-950/90 border border-slate-700/80 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 flex items-center justify-center transition-all shadow-sm active:scale-90 group cursor-pointer"
              title="Pan West (Left) - Lon -100px"
              aria-label="Pan West"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Center Recenter Button */}
            <button
              id="mars-pan-center-btn"
              onClick={() => smoothCenter(activeRegionData.center.lon, activeRegionData.center.lat)}
              className="w-5 h-5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-300 text-cyan-400 flex items-center justify-center transition-all shadow cursor-pointer active:scale-90"
              title={`Recenter on ${activeRegionData.name}`}
              aria-label="Recenter"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </button>

            {/* East / Right */}
            <button
              id="mars-pan-east-btn"
              onClick={() => smoothPan(100, 0)}
              className="w-6 h-6 rounded bg-slate-900/90 hover:bg-cyan-950/90 border border-slate-700/80 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 flex items-center justify-center transition-all shadow-sm active:scale-90 group cursor-pointer"
              title="Pan East (Right) - Lon +100px"
              aria-label="Pan East"
            >
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* South / Down */}
            <div />
            <button
              id="mars-pan-south-btn"
              onClick={() => smoothPan(0, -100)}
              className="w-6 h-6 rounded bg-slate-900/90 hover:bg-cyan-950/90 border border-slate-700/80 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 flex items-center justify-center transition-all shadow-sm active:scale-90 group cursor-pointer"
              title="Pan South (Down) - Lat -100px"
              aria-label="Pan South"
            >
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <div />
          </div>
        </div>
      )}

      {/* Zoom / Pan Reset Controls */}
      {showOverlays && (
        <div className="absolute bottom-3 right-3 flex items-center space-x-1.5 bg-slate-950/85 border border-slate-800 backdrop-blur-md rounded-lg p-1 pointer-events-auto shadow-lg">
          <button
            onClick={() => setViewport((v) => clampViewport(v.centerLon, v.centerLat, v.scale * 1.3))}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setViewport((v) => clampViewport(v.centerLon, v.centerLat, Math.max(1.0, v.scale * 0.75)));
            }}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Zoom Out (Clamped to Full-Bleed Min Zoom - Zero Black Borders)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setViewport(clampViewport(activeRegionData.center.lon, activeRegionData.center.lat, 2.5))
            }
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Reset to Active Region (Clamped to Bounds)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Custom XYZ Tile Server URL Modal */}
      {isCustomTileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-cyan-500/80 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
              <div className="flex items-center space-x-2">
                <Settings2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-bold text-sm">Configure Planetary Tile Server</h3>
              </div>
              <button
                onClick={() => setIsCustomTileModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enter any standard planetary or GIS XYZ tile template URL with <code className="text-cyan-300">{'{z}'}</code>, <code className="text-cyan-300">{'{x}'}</code>, and <code className="text-cyan-300">{'{y}'}</code> parameters.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-semibold block">
                XYZ TILE URL TEMPLATE:
              </label>
              <input
                type="text"
                value={customTileUrl}
                onChange={(e) => setCustomTileUrl(e.target.value)}
                placeholder="https://example.com/tiles/{z}/{x}/{y}.png"
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-300">Preset Quick Select:</div>
              <button
                type="button"
                onClick={() => setCustomTileUrl('https://cartocdn-gmaps-a.global.ssl.fastly.net/opmbuilder/api/v1/1513583637/104229484/volcano-tiles/{z}/{x}/{y}.png')}
                className="text-left text-cyan-400 hover:underline block truncate w-full cursor-pointer"
              >
                • OpenPlanetary Volcano Mosaic
              </button>
              <button
                type="button"
                onClick={() => setCustomTileUrl('https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg')}
                className="text-left text-cyan-400 hover:underline block truncate w-full cursor-pointer"
              >
                • NASA Mars Trek MOLA Topography (463m)
              </button>
              <button
                type="button"
                onClick={() => setCustomTileUrl('https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg')}
                className="text-left text-cyan-400 hover:underline block truncate w-full cursor-pointer"
              >
                • NASA Mars Trek Viking True-Color (232m)
              </button>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCustomTileModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setBasemapSource('custom');
                  setIsCustomTileModalOpen(false);
                }}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Apply Custom Layer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
