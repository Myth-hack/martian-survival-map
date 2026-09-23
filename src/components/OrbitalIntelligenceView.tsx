/**
 * Orbital Intelligence View - Satellite Surveillance HUD (SAR / NISAR Interface)
 * NASA Space Apps Challenge 2026 - Team Quanta Buddies
 * 
 * Cinematic HUD component inspired by NASA/ISRO SAR & NISAR radar interfaces:
 * - Central interactive Mars globe with orbiting NASA MRO satellite and animated conical SAR scanning beam
 * - Top Bar with ARES ORBITAL INTELLIGENCE branding and live radar telemetry
 * - Bottom-Left 'Before / After' terrain comparison widget with interactive split slider
 * - Bottom-Center 'Mars Memory Timeline' showing orbital pass cards
 * - Right Sidebar 'Mission Layers' with glowing indicators for Signal, Spatial, Temporal, Physical, and Hazard levels
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio,
  Satellite,
  Layers,
  Calendar,
  Eye,
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
  Shield,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
  Target,
  Crosshair,
  CheckCircle2,
  Loader2,
  Radar
} from 'lucide-react';
import { MarsEnvironmentData } from '../types';

interface OrbitalIntelligenceViewProps {
  onClose?: () => void;
  environment?: MarsEnvironmentData;
  initialTargetRegion?: string;
  showOverlays?: boolean;
}

export interface TargetZone {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation: number;
  sarBackscatterDb: number;
  coherenceGamma: number;
  dielectricPermittivity: number;
  hazardNote: string;
  featureType?: string;
  sol?: number;
  instrument?: string;
  nasaPdsCitation?: string;
  geologicalSummary?: string;
  source?: string;
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

const TARGET_ZONES: TargetZone[] = [
  {
    id: 'jezero',
    name: 'Jezero Crater Western Delta',
    lat: 18.38,
    lon: 77.58,
    elevation: -2500,
    sarBackscatterDb: -12.4,
    coherenceGamma: 0.88,
    dielectricPermittivity: 3.12,
    featureType: 'Lacustrine Delta Fan / Clay-Carbonates',
    sol: 1240,
    instrument: 'Perseverance PIXL / MRO CRISM',
    nasaPdsCitation: 'NASA PDS Geosciences: M2020-M-PIXL-2-EDR-V1.0',
    geologicalSummary: 'Preserved smectite clay and magnesium carbonate strata indicating sustained ancient lake standing water.',
    hazardNote: 'Basaltic ripple dunes with active slip in Séítah sector',
  },
  {
    id: 'victoria',
    name: 'Victoria Crater (Meridiani Planum)',
    lat: -2.05,
    lon: 354.5,
    elevation: -1820,
    sarBackscatterDb: -13.2,
    coherenceGamma: 0.89,
    dielectricPermittivity: 3.25,
    featureType: 'Impact Crater / Sulfate Cliff Exposures',
    sol: 1238,
    instrument: 'MRO HiRISE / Opportunity Rover',
    nasaPdsCitation: 'NASA PDS Cartography: MRO-M-HIRISE-3-RDR-V1.0',
    geologicalSummary: '750-meter diameter impact crater exposing dramatic sulfate and hematite sedimentary cliff alcoves at Duck Bay.',
    hazardNote: 'Loose alcove talus scree and steep slopes >28° along crater walls',
  },
  {
    id: 'utopia',
    name: 'Utopia Planitia Subsurface Glacial Lens',
    lat: 46.7,
    lon: 117.5,
    elevation: -3800,
    sarBackscatterDb: -18.6,
    coherenceGamma: 0.91,
    dielectricPermittivity: 1.82,
    featureType: 'Subsurface Cryosphere / Glacial Ice Sheet',
    sol: 1240,
    instrument: 'MRO SHARAD / Mars Express MARSIS',
    nasaPdsCitation: 'NASA PDS: MRO-M-SHARAD-5-RADARGRAM-V1.0',
    geologicalSummary: 'Extensive dielectric signature of 1.82 confirming clean water ice sheet deposits equivalent in volume to Lake Superior.',
    hazardNote: 'Thermal contraction polygons and potential permafrost sublimation voids',
  },
  {
    id: 'korolev',
    name: 'Korolev Crater Permanent Ice Lake',
    lat: 73.0,
    lon: 165.0,
    elevation: -3900,
    sarBackscatterDb: -19.4,
    coherenceGamma: 0.95,
    dielectricPermittivity: 1.76,
    featureType: 'Perennial Water-Ice Cold Trap',
    sol: 1239,
    instrument: 'Mars Express HRSC / MGS MOLA',
    nasaPdsCitation: 'NASA PDS / ESA PSA: MEX-HRS-3-RDR-V1.0',
    geologicalSummary: '81 km wide impact crater holding a 1.8 km thick dome of perennial pure water ice shielded by an atmospheric cold trap.',
    hazardNote: 'Sub-zero surface temperatures below -110°C; severe frost rim slip hazard',
  },
  {
    id: 'cerberus',
    name: 'Cerberus Fossae Seismic Fissures',
    lat: 10.2,
    lon: 158.4,
    elevation: -1600,
    sarBackscatterDb: -9.8,
    coherenceGamma: 0.72,
    dielectricPermittivity: 4.10,
    featureType: 'Active Tectonic Graben / Marsquake Epicenter',
    sol: 1235,
    instrument: 'NASA InSight SEIS / MRO CTX',
    nasaPdsCitation: 'NASA PDS Geosciences: SEIS-INSIGHT-TELEMETRY-V1.0',
    geologicalSummary: 'Tectonic rifting fissures responsible for the majority of magnitude 3+ marsquakes detected by InSight SEIS.',
    hazardNote: 'Active seismic ground motion and sudden fissure edge collapse risks',
  },
  {
    id: 'olympus',
    name: 'Olympus Mons Caldera',
    lat: 18.65,
    lon: 226.2,
    elevation: 21287,
    sarBackscatterDb: -8.1,
    coherenceGamma: 0.94,
    dielectricPermittivity: 4.85,
    featureType: 'Shield Volcano Caldera / Basalt Shelters',
    sol: 1237,
    instrument: 'MGS MOLA / MRO HiRISE',
    nasaPdsCitation: 'NASA PDS Geosciences: MGS-M-MOLA-5-MEGDR-L3-V1.0',
    geologicalSummary: 'Solar system summit caldera 80 km across with multiple nested collapse pits and collapsed intact lava tubes.',
    hazardNote: 'Scarp cliffs >32° slope incline exceeding rover safety thresholds',
  },
  {
    id: 'valles',
    name: 'Valles Marineris (Candor Chasma)',
    lat: -6.5,
    lon: 284.4,
    elevation: -4500,
    sarBackscatterDb: -14.2,
    coherenceGamma: 0.76,
    dielectricPermittivity: 2.95,
    featureType: 'Canyon Wall Hydrated Sulfate Formations',
    sol: 1240,
    instrument: 'MRO CRISM / HiRISE',
    nasaPdsCitation: 'NASA PDS Cartography: MRO-M-CRISM-3-RDR-V1.0',
    geologicalSummary: 'Layered polyhydrated sulfate deposits extending over 5 km canyon depth, detailing ancient Martian groundwater upwelling.',
    hazardNote: 'Active scree slope mass-wasting detected along north wall',
  },
  {
    id: 'gale',
    name: 'Gale Crater (Mount Sharp)',
    lat: -5.38,
    lon: 137.44,
    elevation: -4400,
    sarBackscatterDb: -11.9,
    coherenceGamma: 0.85,
    dielectricPermittivity: 3.4,
    featureType: 'Central Sedimentary Mound / Clay-to-Sulfate Transition',
    sol: 1240,
    instrument: 'MSL Curiosity / MRO HiRISE',
    nasaPdsCitation: 'NASA PDS Geosciences: MSL-M-SAM-2-EDR-V1.0',
    geologicalSummary: 'Continuous sedimentary sequence recording the global drying transition of Mars from clay-forming freshwater to saline sulfates.',
    hazardNote: 'Sand dunes with 15 cm/yr migration rate towards southern scarp',
  },
  {
    id: 'nili_fossae',
    name: 'Nili Fossae Carbonate Outcrops',
    lat: 22.0,
    lon: 76.8,
    elevation: -600,
    sarBackscatterDb: -10.5,
    coherenceGamma: 0.81,
    dielectricPermittivity: 3.65,
    featureType: 'Exposed Carbonate Crust / Serpentine',
    sol: 1236,
    instrument: 'MRO CRISM / MGS TES',
    nasaPdsCitation: 'NASA PDS Geosciences: MRO-CRISM-TERRA-M3-V1.0',
    geologicalSummary: 'Deep crustal magnesite and serpentine minerals formed by hydrothermal alteration in an alkaline, neutral pH environment.',
    hazardNote: 'Blocky boulder fields with diameters up to 2.5 meters',
  },
  {
    id: 'planum_boreum',
    name: 'Planum Boreum Layered Polar Deposits',
    lat: 84.5,
    lon: 0.0,
    elevation: -1950,
    sarBackscatterDb: -17.8,
    coherenceGamma: 0.93,
    dielectricPermittivity: 1.95,
    featureType: 'North Polar Layered Ice Deposits (NPLD)',
    sol: 1240,
    instrument: 'MRO SHARAD / Mars Express MARSIS',
    nasaPdsCitation: 'NASA PDS Geosciences: MRO-M-SHARAD-5-RADARGRAM-V1.0',
    geologicalSummary: 'Finely layered dust-ice stratigraphy recording astronomical Milankovitch climate cycles spanning millions of Martian years.',
    hazardNote: 'Extreme katabatic winds and unstable spiral trough crevasses',
  }
];

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
    targetRegion: 'Jezero Crater Delta (ACTIVE)',
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

export const OrbitalIntelligenceView: React.FC<OrbitalIntelligenceViewProps> = ({
  onClose,
  environment,
  initialTargetRegion = 'jezero',
  showOverlays = true,
}) => {
  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const showOverlaysRef = useRef<boolean>(showOverlays);

  useEffect(() => {
    showOverlaysRef.current = showOverlays;
  }, [showOverlays]);

  // Orbital Navigation & Target State
  const [selectedTarget, setSelectedTarget] = useState<TargetZone>(
    () => TARGET_ZONES.find((z) => z.id === initialTargetRegion) || TARGET_ZONES[0]
  );
  const [activePass, setActivePass] = useState<OrbitalPass>(ORBITAL_PASSES[4]); // current Sol 1240 pass
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1);
  const [sensorMode, setSensorMode] = useState<'SAR_POLARIMETRIC' | 'SHARAD_SOUNDER' | 'HIRISE_OPTICAL' | 'THERMAL_IR'>('SAR_POLARIMETRIC');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Before / After Comparator State
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 to 100
  const [comparatorMode, setComparatorMode] = useState<'SURFACE_SAR' | 'COHERENCE_DELTA' | 'TOPOGRAPHY_ELEV'>('SURFACE_SAR');
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Mission Layers Toggles
  const [layersState, setLayersState] = useState({
    // Signal
    lBand: true,
    cBand: false,
    pBand: true,
    radiometer: false,
    // Spatial
    hiRise: true,
    ctxSwath: true,
    themisThermal: false,
    molaElev: true,
    // Temporal
    diurnalPasses: true,
    seasonalBaseline: false,
    decadalArchive: true,
    // Physical
    permittivity: true,
    roughnessZ0: true,
    slopeGrad: true,
    thermalInertia: false,
    // Hazards
    duneMigration: true,
    slopeInstability: true,
    boulderDensity: false,
    lavaTubes: true,
  });

  // Camera & Globe Angle State
  const globeRotationRef = useRef<number>(0);
  const satelliteAngleRef = useRef<number>(0);
  const userDragRef = useRef<{ isDragging: boolean; lastX: number; lastY: number }>({
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });
  const zoomRef = useRef<number>(1.0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Telemetry Metrics
  const [telemetryTick, setTelemetryTick] = useState<number>(0);
  const [liveNasaData, setLiveNasaData] = useState<{
    source?: string;
    station?: string;
    sol?: number;
    pressure?: number;
    temperature?: number;
    wind?: number;
  } | null>(null);

  // Dynamic Search & Autonomous Mars Discovery Scanning State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(false);
  const [showAcquiredHUD, setShowAcquiredHUD] = useState<boolean>(true);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Target Camera Pan References
  const targetRotRef = useRef<number | null>(null);
  const isPanningRef = useRef<boolean>(false);

  // Smooth Pan Camera to Target Longitude
  const panToTarget = useCallback((target: TargetZone) => {
    if (!target || typeof target.lon !== 'number' || isNaN(target.lon)) return;
    // Face the viewer directly: Math.PI / 2
    const desired = (Math.PI / 2) - (target.lon * Math.PI) / 180;
    const current = globeRotationRef.current;
    let diff = (desired - current) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    targetRotRef.current = current + diff;
    isPanningRef.current = true;
  }, []);

  // Autonomous AI Scanning Mode: Periodically pings NASA API for new discoveries
  useEffect(() => {
    if (!isAutoScanning) {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
      return;
    }

    const performAutoScan = async () => {
      setSearchStatus('AUTONOMOUS AI PINGING NASA PDS ARCHIVES...');
      try {
        const res = await fetch('/api/orbital/auto-scan');
        if (!res.ok) throw new Error('Auto-scan failed');
        const data = await res.json();
        if (data && data.target) {
          setSelectedTarget(data.target);
          panToTarget(data.target);
          setShowAcquiredHUD(true);
          setSearchStatus(`AI DISCOVERY LOCKED: ${data.target.name}`);
          setTimeout(() => setSearchStatus(null), 4000);
        }
      } catch (err) {
        console.warn('Auto-scan network fallback: cycling NASA targets', err);
        setSelectedTarget((prev) => {
          const nextIndex = (TARGET_ZONES.findIndex((z) => z.id === prev.id) + 1) % TARGET_ZONES.length;
          const nextTarget = TARGET_ZONES[nextIndex];
          panToTarget(nextTarget);
          setShowAcquiredHUD(true);
          setSearchStatus(`AI PDS TARGET: ${nextTarget.name}`);
          setTimeout(() => setSearchStatus(null), 4000);
          return nextTarget;
        });
      }
    };

    performAutoScan();
    autoScanTimerRef.current = setInterval(performAutoScan, 8500);

    return () => {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
    };
  }, [isAutoScanning, panToTarget]);

  // Live Search Query Submission
  const handleSearchSubmit = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchStatus('INTERFACING NASA PDS ORBITAL REGISTRY...');

    try {
      const res = await fetch('/api/orbital/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
      const data = await res.json();
      if (data && data.target) {
        setSelectedTarget(data.target);
        panToTarget(data.target);
        setShowAcquiredHUD(true);
        setSearchStatus(`TARGET ACQUIRED: ${data.target.name}`);
        setTimeout(() => setSearchStatus(null), 4000);
      }
    } catch (err) {
      console.warn('Orbital search fallback to client matching', err);
      const qLower = q.toLowerCase();
      const localMatch =
        TARGET_ZONES.find((z) => z.name.toLowerCase().includes(qLower) || z.id.includes(qLower)) ||
        TARGET_ZONES[0];
      setSelectedTarget(localMatch);
      panToTarget(localMatch);
      setShowAcquiredHUD(true);
      setSearchStatus(`TARGET ACQUIRED (LOCAL): ${localMatch.name}`);
      setTimeout(() => setSearchStatus(null), 4000);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetch('/api/nasa/telemetry')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.telemetry) {
          setLiveNasaData({
            source: data.source,
            station: data.station,
            sol: data.telemetry.sol,
            pressure: data.telemetry.atmosphericPressure?.averagePa,
            temperature: data.telemetry.surfaceTemperature?.averageC,
            wind: data.telemetry.wind?.averageSpeedMps,
          });
        }
      })
      .catch((_err) => {
        // Fallback gracefully to default telemetry
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleLayer = (key: keyof typeof layersState) => {
    setLayersState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Canvas Render Loop for Mars Globe, Orbiting MRO Satellite, and Conical Scanning Beam
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Stars background generation
    const starCount = 180;
    const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.0002 + 0.0001,
      });
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      // Update rotation
      if (isPanningRef.current && targetRotRef.current !== null) {
        const diff = targetRotRef.current - globeRotationRef.current;
        if (Math.abs(diff) < 0.003) {
          globeRotationRef.current = targetRotRef.current;
          isPanningRef.current = false;
          targetRotRef.current = null;
        } else {
          globeRotationRef.current += diff * 0.08;
        }
      } else if (isPlaying) {
        globeRotationRef.current += 0.0018 * orbitSpeed;
      }

      if (isPlaying) {
        satelliteAngleRef.current += 0.012 * orbitSpeed;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Void Background
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, Math.max(width, height) * 0.8);
      bgGrad.addColorStop(0, '#0a0f1d');
      bgGrad.addColorStop(0.5, '#05070e');
      bgGrad.addColorStop(1, '#020306');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Stars rendering with subtle twinkling
      for (const s of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * (0.8 + 0.2 * Math.sin(Date.now() * s.speed * 20))})`;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Coordinate Space Grid & Reticles
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      const gridStep = 80;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center coordinates
      const centerX = width * 0.46;
      const centerY = height * 0.48;
      const baseRadius = Math.min(width, height) * 0.24 * zoomRef.current;

      // 4. Mars Globe Atmosphere Glow (Rayleigh scattering rim)
      const atmoGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.95,
        centerX,
        centerY,
        baseRadius * 1.25
      );
      atmoGlow.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
      atmoGlow.addColorStop(0.3, 'rgba(249, 115, 22, 0.12)');
      atmoGlow.addColorStop(0.7, 'rgba(6, 182, 212, 0.08)');
      atmoGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = atmoGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // 5. Mars Globe Sphere Shading
      const globeGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.35,
        centerY - baseRadius * 0.35,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius
      );
      globeGrad.addColorStop(0, '#d95338'); // bright sunlit ochre
      globeGrad.addColorStop(0.4, '#a8321e'); // oxidized iron red
      globeGrad.addColorStop(0.7, '#671e11'); // deep basalt canyon shade
      globeGrad.addColorStop(0.95, '#280c07'); // terminator shadow
      globeGrad.addColorStop(1, '#110403');
      ctx.fillStyle = globeGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // 6. Mars Continental Surface Features & Terrain Relief
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.clip();

      const rot = globeRotationRef.current;
      // Draw simulated geological formations
      ctx.fillStyle = 'rgba(75, 20, 10, 0.45)';
      // Syrtis Major / Sinus Meridiani dark basaltic plateau
      const sX = centerX + Math.cos(rot) * baseRadius * 0.6;
      const sY = centerY + Math.sin(rot * 0.5) * baseRadius * 0.2;
      ctx.beginPath();
      ctx.ellipse(sX, sY, baseRadius * 0.35, baseRadius * 0.2, rot * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Olympus Mons shield caldera spot
      const oX = centerX + Math.cos(rot + 2.2) * baseRadius * 0.55;
      const oY = centerY + Math.sin(rot * 0.6 + 1.2) * baseRadius * 0.35;
      ctx.fillStyle = 'rgba(255, 180, 150, 0.4)';
      ctx.beginPath();
      ctx.arc(oX, oY, baseRadius * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(40, 10, 5, 0.7)';
      ctx.beginPath();
      ctx.arc(oX, oY, baseRadius * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Valles Marineris canyon rift system
      ctx.strokeStyle = 'rgba(30, 8, 5, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      const vX = centerX + Math.cos(rot + 1.1) * baseRadius * 0.5;
      const vY = centerY + baseRadius * 0.08;
      ctx.moveTo(vX - baseRadius * 0.3, vY - baseRadius * 0.04);
      ctx.bezierCurveTo(vX - baseRadius * 0.1, vY + baseRadius * 0.05, vX + baseRadius * 0.1, vY, vX + baseRadius * 0.35, vY + baseRadius * 0.08);
      ctx.stroke();

      // Planum Boreum Polar Ice Cap
      ctx.fillStyle = 'rgba(240, 248, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - baseRadius * 0.88, baseRadius * 0.38, baseRadius * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Latitude and Longitude Lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const yOff = (lat / 90) * baseRadius * 0.85;
        const xRad = Math.sqrt(Math.max(0, baseRadius * baseRadius - yOff * yOff));
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + yOff, xRad, xRad * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Terminator Shadow Overlay for high dynamic 3D relief
      const termGrad = ctx.createLinearGradient(centerX - baseRadius, centerY, centerX + baseRadius, centerY);
      termGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      termGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.15)');
      termGrad.addColorStop(0.85, 'rgba(5, 5, 12, 0.82)');
      termGrad.addColorStop(1, 'rgba(2, 3, 7, 0.98)');
      ctx.fillStyle = termGrad;
      ctx.fillRect(centerX - baseRadius, centerY - baseRadius, baseRadius * 2, baseRadius * 2);

      // Target Ground Zone Highlight (with glowing cyan boundaries) - Conditional on showOverlays
      const safeLon = typeof selectedTarget?.lon === 'number' ? selectedTarget.lon : 0;
      const safeLat = typeof selectedTarget?.lat === 'number' ? selectedTarget.lat : 0;
      const safeElev = typeof selectedTarget?.elevation === 'number' ? selectedTarget.elevation : 0;
      const safeName = (selectedTarget?.name || 'TARGET').toUpperCase();

      const targetAngle = rot + (safeLon * Math.PI) / 180;
      const targetScreenX = centerX + Math.cos(targetAngle) * baseRadius * 0.65;
      const targetScreenY = centerY - (safeLat / 90) * baseRadius * 0.65;
      const isTargetFacing = Math.sin(targetAngle) > -0.3; // visible when facing camera

      if (isTargetFacing && showOverlaysRef.current) {
        // Glowing cyan ground footprint zone
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
        ctx.fillStyle = `rgba(6, 182, 212, ${0.25 + 0.15 * pulse})`;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        const zoneRadius = 18 * zoomRef.current;
        ctx.arc(targetScreenX, targetScreenY, zoneRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // SAR Swath scan lines on ground
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.rect(targetScreenX - zoneRadius * 1.4, targetScreenY - zoneRadius * 0.8, zoneRadius * 2.8, zoneRadius * 1.6);
        ctx.stroke();
        ctx.setLineDash([]);

        // Reticle ticks
        ctx.strokeStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(targetScreenX - zoneRadius - 6, targetScreenY);
        ctx.lineTo(targetScreenX - zoneRadius, targetScreenY);
        ctx.moveTo(targetScreenX + zoneRadius, targetScreenY);
        ctx.lineTo(targetScreenX + zoneRadius + 6, targetScreenY);
        ctx.moveTo(targetScreenX, targetScreenY - zoneRadius - 6);
        ctx.lineTo(targetScreenX, targetScreenY - zoneRadius);
        ctx.moveTo(targetScreenX, targetScreenY + zoneRadius);
        ctx.lineTo(targetScreenX, targetScreenY + zoneRadius + 6);
        ctx.stroke();

        // Target Tag
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#67e8f9';
        ctx.fillText(`TARGET: ${safeName}`, targetScreenX + zoneRadius + 8, targetScreenY - 4);
        ctx.fillStyle = '#94a3b8';
        const latLabel = safeLat >= 0 ? `${safeLat.toFixed(1)}°N` : `${Math.abs(safeLat).toFixed(1)}°S`;
        ctx.fillText(`${latLabel} ${safeLon.toFixed(1)}°E // ${safeElev}m`, targetScreenX + zoneRadius + 8, targetScreenY + 9);
      }

      ctx.restore();

      // 7. NASA MRO Satellite Orbital Trajectory Ring
      const orbitA = baseRadius * 1.65;
      const orbitB = baseRadius * 0.75;
      const orbitTilt = -0.32; // polar inclination tilt
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(orbitTilt);

      // Trajectory dashed elliptical ring
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.ellipse(0, 0, orbitA, orbitB, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Periapsis & Apoapsis tick markers
      ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.fillRect(orbitA - 4, -2, 8, 4);
      ctx.fillRect(-orbitA - 4, -2, 8, 4);

      // Calculate MRO Satellite position on orbit
      const satAngle = satelliteAngleRef.current;
      const satX = Math.cos(satAngle) * orbitA;
      const satY = Math.sin(satAngle) * orbitB;

      ctx.restore();

      // Transform satellite coordinates back to global canvas space
      const cosT = Math.cos(orbitTilt);
      const sinT = Math.sin(orbitTilt);
      const globalSatX = centerX + (satX * cosT - satY * sinT);
      const globalSatY = centerY + (satX * sinT + satY * cosT);

      // 8. Animated Conical Scanning Beam downwards onto highlighted ground zone
      const targetAngleWorld = rot + (safeLon * Math.PI) / 180;
      const groundTargetX = centerX + Math.cos(targetAngleWorld) * baseRadius * 0.65;
      const groundTargetY = centerY - (safeLat / 90) * baseRadius * 0.65;

      // Draw the conical radar beam
      const beamGrad = ctx.createLinearGradient(globalSatX, globalSatY, groundTargetX, groundTargetY);
      beamGrad.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
      beamGrad.addColorStop(0.3, 'rgba(34, 211, 238, 0.45)');
      beamGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.2)');
      beamGrad.addColorStop(1, 'rgba(6, 182, 212, 0.05)');

      const beamSpread = 32 * zoomRef.current;
      ctx.save();
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(globalSatX, globalSatY);
      ctx.lineTo(groundTargetX - beamSpread, groundTargetY - 4);
      ctx.lineTo(groundTargetX + beamSpread, groundTargetY + 4);
      ctx.closePath();
      ctx.fill();

      // Conical beam edge lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(globalSatX, globalSatY);
      ctx.lineTo(groundTargetX - beamSpread, groundTargetY - 4);
      ctx.moveTo(globalSatX, globalSatY);
      ctx.lineTo(groundTargetX + beamSpread, groundTargetY + 4);
      ctx.stroke();

      // Scanning pulse wave propagating down the cone
      const pulsePhase = (Date.now() * 0.002) % 1; // 0 to 1
      const waveX = globalSatX + (groundTargetX - globalSatX) * pulsePhase;
      const waveY = globalSatY + (groundTargetY - globalSatY) * pulsePhase;
      const waveSpread = beamSpread * pulsePhase;

      ctx.strokeStyle = `rgba(103, 232, 249, ${0.9 * (1 - pulsePhase)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(waveX, waveY, waveSpread, waveSpread * 0.35, orbitTilt, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 9. NASA MRO Satellite Model Graphic
      ctx.save();
      ctx.translate(globalSatX, globalSatY);

      // Satellite glow aura
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 14;

      // Central Satellite Bus
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-6, -6, 12, 12);

      // High-Gain Antenna Dish (Gold/Amber)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -9, 5.5, Math.PI, 0, false);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();

      // Dual Solar Array Wings (Deep Blue Photovoltaic cells)
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1;
      // Left solar wing
      ctx.fillRect(-24, -4, 16, 8);
      ctx.strokeRect(-24, -4, 16, 8);
      // Right solar wing
      ctx.fillRect(8, -4, 16, 8);
      ctx.strokeRect(8, -4, 16, 8);

      // Optical Nadir / SHARAD boom pointing towards Mars
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(0, 12);
      ctx.stroke();

      // Satellite Identification Label (visible when showOverlays is true)
      if (showOverlaysRef.current) {
        ctx.shadowBlur = 0;
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('NASA MRO (ORBIT #51,902)', 14, -10);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('ALT: 255.4 KM // VEL: 3.42 KM/S', 14, 2);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [selectedTarget, isPlaying, orbitSpeed]);

  // Mouse drag to rotate Mars globe manually
  const handleMouseDown = (e: React.MouseEvent) => {
    userDragRef.current = {
      isDragging: true,
      lastX: e.clientX,
      lastY: e.clientY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!userDragRef.current.isDragging) return;
    const deltaX = e.clientX - userDragRef.current.lastX;
    userDragRef.current.lastX = e.clientX;
    userDragRef.current.lastY = e.clientY;
    globeRotationRef.current += deltaX * 0.008;
  };

  const handleMouseUp = () => {
    userDragRef.current.isDragging = false;
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    const newZoom = Math.min(2.0, Math.max(0.6, zoomRef.current + delta));
    zoomRef.current = newZoom;
    setZoomLevel(newZoom);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${
        isFullscreen ? 'fixed inset-0 z-50' : 'h-[750px] lg:h-[820px]'
      } bg-[#04060c] rounded-2xl border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)] overflow-hidden font-mono text-slate-200 select-none flex flex-col`}
    >
      {/* 1. TOP BAR: Sleek minimal header with mission branding & radar telemetry status */}
      {showOverlays && (
        <header className="relative z-20 flex flex-wrap items-center justify-between px-4 py-3 bg-black/70 backdrop-blur-xl border-b border-cyan-500/30 gap-2 shrink-0">
        {/* Branding & Status */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            <Satellite className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-['Orbitron'] font-black tracking-widest text-sm sm:text-base text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                ARES ORBITAL INTELLIGENCE
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-cyan-950/80 border border-cyan-500/60 text-cyan-300">
                SAR / NISAR HUD
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center space-x-2">
              <span className="text-cyan-400 font-semibold">
                NASA PDS: {liveNasaData ? `${liveNasaData.station || 'LIVE'} (SOL ${liveNasaData.sol || 1240})` : 'SYNCHRONIZED'}
              </span>
              <span>•</span>
              <span>ORBIT TRACK #51,902</span>
              <span>•</span>
              <span className="text-emerald-400">SNR: +48.6 dB</span>
            </div>
          </div>
        </div>

        {/* Live Radar Telemetry Status Strip */}
        <div className="hidden md:flex items-center space-x-4 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-cyan-900/60 text-xs">
          <div className="flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">FREQ:</span>
            <span className="text-cyan-300 font-bold">1.25 GHz (L-BAND)</span>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-800" />
          <div>
            <span className="text-slate-400">ALTITUDE: </span>
            <span className="text-white font-bold">255.4 km</span>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-800" />
          <div>
            <span className="text-slate-400">INCLINATION: </span>
            <span className="text-white font-bold">92.8° POLAR</span>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-800" />
          <div>
            <span className="text-slate-400">SWATH: </span>
            <span className="text-amber-300 font-bold">42 km</span>
          </div>
          {liveNasaData?.pressure && (
            <>
              <div className="w-[1px] h-3.5 bg-slate-800" />
              <div>
                <span className="text-slate-400">PDS P: </span>
                <span className="text-cyan-300 font-bold">{liveNasaData.pressure.toFixed(1)} Pa</span>
              </div>
            </>
          )}
        </div>

        {/* Search, Auto-Scan (AI Mode) & Top Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Live Sci-Fi Search & Query Interface */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
            className="relative flex items-center"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or coords (e.g. 'ice deposits', 'Victoria Crater', '18.38 N, 77.58 E')..."
                className="w-56 sm:w-72 lg:w-80 bg-slate-950/90 text-cyan-200 placeholder-slate-500 text-xs font-mono font-medium rounded-l-lg px-3 py-1.5 pl-8 border border-cyan-700/60 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              />
              <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-cyan-300 p-0.5"
                  title="Clear Query"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-r-lg bg-cyan-950/90 hover:bg-cyan-900 border border-l-0 border-cyan-700/60 text-cyan-300 hover:text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
              title="Execute Autonomous Orbital Radar Scan"
            >
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="hidden sm:inline">SCAN</span>
            </button>
          </form>

          {/* 2. Autonomous AI Scanning Mode Toggle Button */}
          <button
            onClick={() => setIsAutoScanning((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              isAutoScanning
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.35)] animate-pulse'
                : 'bg-slate-900/80 hover:bg-cyan-950/80 border-cyan-800/60 text-cyan-300 hover:border-cyan-500'
            }`}
            title={
              isAutoScanning
                ? 'Deactivate Autonomous AI Scanning'
                : 'Activate Autonomous AI Scanning (Autonomously discovers significant NASA PDS targets)'
            }
          >
            {isAutoScanning ? (
              <Radar className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="tracking-wide">
              {isAutoScanning ? 'AI SCAN ACTIVE' : 'AUTO-SCAN (AI)'}
            </span>
          </button>

          {/* Play/Pause, Speed, Fullscreen, Close */}
          <div className="flex items-center space-x-1.5 ml-auto sm:ml-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded bg-slate-900/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-400 transition-colors"
              title={isPlaying ? 'Pause Orbit Rotation' : 'Resume Orbit Rotation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setOrbitSpeed((prev) => (prev === 1 ? 5 : prev === 5 ? 15 : 1))}
              className="px-2 py-1 rounded bg-slate-900/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-xs text-cyan-300 font-bold transition-colors"
              title="Toggle Orbit Speed (1x, 5x, 15x)"
            >
              {orbitSpeed}x
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded bg-slate-900/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-400 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 transition-colors"
                title="Close Orbital View"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Suggestion Pills & Live Status Bar */}
        <div className="w-full flex flex-wrap items-center justify-between pt-1 gap-2 border-t border-cyan-900/30 text-[10px]">
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold">PDS QUICK SCANS:</span>
            {[
              { label: '🧊 ICE DEPOSITS', query: 'Find recent ice deposits' },
              { label: '🎯 VICTORIA CRATER', query: 'Scan Victoria Crater' },
              { label: '⚡ CERBERUS FOSSAE', query: 'Cerberus Fossae seismic fissures' },
              { label: '🌋 OLYMPUS CALDERA', query: 'Olympus Mons caldera lava tubes' },
              { label: '📍 18.38°N, 77.58°E', query: '18.38 N, 77.58 E' }
            ].map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => {
                  setSearchQuery(pill.query);
                  handleSearchSubmit(pill.query);
                }}
                className="px-2 py-0.5 rounded bg-cyan-950/50 hover:bg-cyan-900/70 border border-cyan-800/40 hover:border-cyan-400 text-cyan-300 font-mono transition-colors"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {searchStatus && (
            <div className="flex items-center space-x-1 text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-600/50 animate-pulse font-mono">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>{searchStatus}</span>
            </div>
          )}
        </div>
      </header>
      )}

      {/* 2. CENTRAL CANVAS: Mars Globe, Orbiting MRO Satellite, Conical Scanning Beam */}
      <div
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Orbit Zoom Overlay Controls */}
        {showOverlays && (
          <div className="absolute top-4 left-4 z-20 flex flex-col space-y-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-cyan-900/50">
            <button
              onClick={() => handleZoom(0.15)}
              className="w-7 h-7 flex items-center justify-center rounded bg-slate-900/80 hover:bg-cyan-950 border border-cyan-800/50 text-cyan-300 text-sm font-bold"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => handleZoom(-0.15)}
              className="w-7 h-7 flex items-center justify-center rounded bg-slate-900/80 hover:bg-cyan-950 border border-cyan-800/50 text-cyan-300 text-sm font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <div className="text-[9px] text-center text-slate-400 font-mono">
              {Math.round(zoomLevel * 100)}%
            </div>
          </div>
        )}

        {/* Target Acquired HUD Overlay with Live NASA PDS Metadata */}
        {showOverlays && showAcquiredHUD && selectedTarget && (
          <div className="absolute top-4 right-4 z-30 max-w-xs sm:max-w-sm lg:max-w-md w-full bg-black/85 backdrop-blur-xl border border-cyan-400/60 rounded-xl p-3 sm:p-4 shadow-[0_0_30px_rgba(6,182,212,0.35)] text-xs animate-in fade-in slide-in-from-top-3 duration-300 font-mono">
            {/* HUD Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2 mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-['Orbitron'] font-bold text-xs tracking-wider text-cyan-300">
                  TARGET ACQUIRED // NASA PDS LOCK
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-600/60 text-cyan-300 font-bold">
                  SOL {selectedTarget.sol || 1240}
                </span>
                <button
                  onClick={() => setShowAcquiredHUD(false)}
                  className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
                  title="Dismiss Target HUD"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Target Title & Feature Type */}
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white font-['Orbitron'] tracking-wide drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                  {selectedTarget.name}
                </h4>
                <button
                  onClick={() => panToTarget(selectedTarget)}
                  className="px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-[9px] text-cyan-300 font-bold transition-colors flex items-center space-x-1"
                  title="Re-Center Radar on Target"
                >
                  <Target className="w-2.5 h-2.5" />
                  <span>CENTER</span>
                </button>
              </div>
              <div className="text-[10px] text-cyan-400 flex items-center space-x-2 mt-0.5">
                <span className="font-semibold text-emerald-300">
                  {selectedTarget.featureType || 'Geological Target'}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">
                  Elevation: {typeof selectedTarget.elevation === 'number' ? selectedTarget.elevation.toLocaleString() : 'N/A'} m
                </span>
              </div>
            </div>

            {/* Coordinate & Radar Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-slate-950/85 rounded-lg border border-cyan-900/60 font-mono text-[10px] mb-2">
              <div>
                <div className="text-slate-500 text-[9px]">LATITUDE</div>
                <div className="text-white font-bold">
                  {typeof selectedTarget.lat === 'number'
                    ? selectedTarget.lat >= 0
                      ? `${selectedTarget.lat.toFixed(2)}°N`
                      : `${Math.abs(selectedTarget.lat).toFixed(2)}°S`
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-[9px]">LONGITUDE</div>
                <div className="text-white font-bold">
                  {typeof selectedTarget.lon === 'number' ? `${selectedTarget.lon.toFixed(2)}°E` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-[9px]">SAR BACKSCATTER</div>
                <div className="text-cyan-300 font-bold">
                  {selectedTarget.sarBackscatterDb != null ? `${selectedTarget.sarBackscatterDb} dB` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-[9px]">PERMITTIVITY (ε_r)</div>
                <div className="text-amber-400 font-bold">
                  {selectedTarget.dielectricPermittivity != null ? selectedTarget.dielectricPermittivity : 'N/A'}
                </div>
              </div>
            </div>

            {/* Geological Summary from NASA PDS */}
            {selectedTarget.geologicalSummary && (
              <div className="text-[10.5px] text-slate-300 mb-2 leading-relaxed bg-cyan-950/20 p-2 rounded border border-cyan-900/40">
                <span className="text-cyan-400 font-bold text-[9.5px] block mb-0.5">
                  NASA PDS GEOLOGICAL ANALYSIS:
                </span>
                {selectedTarget.geologicalSummary}
              </div>
            )}

            {/* Hazard Warning Note */}
            {selectedTarget.hazardNote && (
              <div className="flex items-start space-x-1.5 text-[10px] text-amber-300/90 bg-amber-950/30 p-1.5 rounded border border-amber-600/40 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{selectedTarget.hazardNote}</span>
              </div>
            )}

            {/* Instrument & Grounding Citation Footer */}
            <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-cyan-900/40 pt-1.5">
              <span
                className="truncate max-w-[210px] sm:max-w-[260px]"
                title={selectedTarget.nasaPdsCitation || selectedTarget.instrument || 'NASA PDS Archive'}
              >
                PDS: {selectedTarget.instrument || selectedTarget.nasaPdsCitation || 'MRO SHARAD / CRISM / HiRISE'}
              </span>
              <div className="flex items-center space-x-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>RADAR LOCKED</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. BOTTOM-LEFT 'BEFORE / AFTER' WIDGET: Dual-Image Comparator between two Sol dates */}
        {showOverlays && (
          <div className="absolute bottom-24 sm:bottom-28 left-4 z-20 w-80 sm:w-96 bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-500/40 p-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-xs text-cyan-300 tracking-wider">
                TERRAIN DUAL COMPARATOR
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              SOL 894 <span className="text-cyan-400">vs</span> SOL 1240
            </div>
          </div>

          {/* Dual-Image Split Canvas/View */}
          <div
            className="relative w-full h-36 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 cursor-ew-resize select-none"
            onMouseDown={() => setIsDraggingSlider(true)}
            onMouseUp={() => setIsDraggingSlider(false)}
            onMouseMove={(e) => {
              if (!isDraggingSlider) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
              setSliderPosition(pos);
            }}
          >
            {/* "After" Image / SAR Pass (Current Sol 1240) */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/60 via-slate-900 to-amber-950/50 p-2 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-[10px] text-cyan-300 font-bold">
                  SOL 1240 (CURRENT)
                </span>
                <span className="text-[9px] text-emerald-400 font-bold">
                  SAR COHERENCE: 0.88
                </span>
              </div>
              {/* Simulated Terrain Texture / Ripple Lines */}
              <div className="w-full h-16 opacity-35 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:8px_8px]" />
              <div className="text-[9px] text-slate-300">
                Δ Displacement: <span className="text-cyan-300 font-bold">+4.2 cm</span> (Active Dune Slip)
              </div>
            </div>

            {/* "Before" Image / Baseline Pass (Sol 894) clipped by sliderPosition */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-amber-950/70 via-slate-900 to-red-950/60 p-2 flex flex-col justify-between border-r-2 border-cyan-400 shadow-[0_0_10px_#06b6d4]"
              style={{ width: `${sliderPosition}%` }}
            >
              <div className="flex justify-between items-start">
                <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-[10px] text-amber-300 font-bold whitespace-nowrap">
                  SOL 894 (BASELINE)
                </span>
              </div>
              <div className="w-full h-16 opacity-30 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:8px_8px]" />
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

          {/* Mode Selector & Quick Metrics */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
            <div className="flex space-x-1">
              <button
                onClick={() => setComparatorMode('SURFACE_SAR')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  comparatorMode === 'SURFACE_SAR'
                    ? 'bg-cyan-600 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SAR Swath
              </button>
              <button
                onClick={() => setComparatorMode('COHERENCE_DELTA')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  comparatorMode === 'COHERENCE_DELTA'
                    ? 'bg-cyan-600 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Coherence Δ
              </button>
            </div>
            <span className="text-cyan-400 font-bold">
              Slider: {Math.round(sliderPosition)}%
            </span>
          </div>
        </div>
        )}

        {/* 4. RIGHT SIDEBAR 'MISSION LAYERS': Clean vertical navigation items with glowing indicators */}
        {showOverlays && (
          <aside className="absolute top-4 right-4 z-20 w-64 sm:w-72 max-h-[calc(100%-8rem)] bg-black/60 backdrop-blur-lg rounded-xl border border-cyan-500/40 p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.2)] overflow-y-auto hide-scrollbar flex flex-col space-y-3.5 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="font-bold tracking-wider text-cyan-300">
                MISSION LAYERS
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950/80 rounded border border-cyan-500/40 text-cyan-300 font-bold">
              NISAR / SAR
            </span>
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
                className={`px-2 py-1.5 rounded border text-left flex items-center justify-between transition-all ${
                  layersState.lBand
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>L-Band (1.25GHz)</span>
                <span className={`w-1.5 h-1.5 rounded-full ${layersState.lBand ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
              </button>
              <button
                onClick={() => toggleLayer('cBand')}
                className={`px-2 py-1.5 rounded border text-left flex items-center justify-between transition-all ${
                  layersState.cBand
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>C-Band (5.4GHz)</span>
                <span className={`w-1.5 h-1.5 rounded-full ${layersState.cBand ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
              </button>
              <button
                onClick={() => toggleLayer('pBand')}
                className={`px-2 py-1.5 rounded border text-left flex items-center justify-between transition-all ${
                  layersState.pBand
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>P-Band Sounder</span>
                <span className={`w-1.5 h-1.5 rounded-full ${layersState.pBand ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
              </button>
              <button
                onClick={() => toggleLayer('radiometer')}
                className={`px-2 py-1.5 rounded border text-left flex items-center justify-between transition-all ${
                  layersState.radiometer
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>Radiometer</span>
                <span className={`w-1.5 h-1.5 rounded-full ${layersState.radiometer ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
              </button>
            </div>
          </div>

          {/* 2. Spatial Resolution */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>2. SPATIAL RESOLUTION</span>
              <span className="text-cyan-400">SENSOR GRID</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => toggleLayer('hiRise')}
                className={`w-full px-2.5 py-1.5 rounded border flex items-center justify-between transition-all ${
                  layersState.hiRise
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <span>0.25m/px HiRISE Stereo DTM</span>
                <span className="font-bold text-[10px]">ULTRA-RES</span>
              </button>
              <button
                onClick={() => toggleLayer('ctxSwath')}
                className={`w-full px-2.5 py-1.5 rounded border flex items-center justify-between transition-all ${
                  layersState.ctxSwath
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <span>6.0m/px CTX Context Swath</span>
                <span className="font-bold text-[10px]">WIDE-FOV</span>
              </button>
              <button
                onClick={() => toggleLayer('molaElev')}
                className={`w-full px-2.5 py-1.5 rounded border flex items-center justify-between transition-all ${
                  layersState.molaElev
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <span>463m/px MOLA Global Altimetry</span>
                <span className="font-bold text-[10px]">DATUM</span>
              </button>
            </div>
          </div>

          {/* 3. Temporal Baseline */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>3. TEMPORAL BASELINE</span>
              <span className="text-cyan-400">REPEAT PASS</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                onClick={() => toggleLayer('diurnalPasses')}
                className={`p-1.5 rounded border text-left ${
                  layersState.diurnalPasses ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold">Diurnal Track</div>
                <div className="text-[9px] text-slate-400">12.4h repeat</div>
              </button>
              <button
                onClick={() => toggleLayer('decadalArchive')}
                className={`p-1.5 rounded border text-left ${
                  layersState.decadalArchive ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold">PDS Archive</div>
                <div className="text-[9px] text-slate-400">2006-2026</div>
              </button>
            </div>
          </div>

          {/* 4. Physical Layer */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>4. PHYSICAL LAYER</span>
              <span className="text-amber-400">GEOTECHNICAL</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                onClick={() => toggleLayer('permittivity')}
                className={`p-1.5 rounded border text-left ${
                  layersState.permittivity ? 'bg-amber-950/60 border-amber-500 text-amber-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold">Permittivity ε_r</div>
                <div className="text-[9px] text-slate-400">Ice / Basalt</div>
              </button>
              <button
                onClick={() => toggleLayer('roughnessZ0')}
                className={`p-1.5 rounded border text-left ${
                  layersState.roughnessZ0 ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold">Roughness Z0</div>
                <div className="text-[9px] text-slate-400">Boulders/Dunes</div>
              </button>
            </div>
          </div>

          {/* 5. Hazard Levels */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>5. HAZARD DETECTION</span>
              <span className="text-red-400">RISK WARNINGS</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => toggleLayer('slopeInstability')}
                className={`w-full px-2.5 py-1.5 rounded border flex items-center justify-between transition-all ${
                  layersState.slopeInstability
                    ? 'bg-red-950/60 border-red-500 text-red-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Slope Incline &gt; 15°</span>
                </span>
                <span className="font-bold text-[9px] text-red-400">CRITICAL</span>
              </button>
              <button
                onClick={() => toggleLayer('duneMigration')}
                className={`w-full px-2.5 py-1.5 rounded border flex items-center justify-between transition-all ${
                  layersState.duneMigration
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Active Dune Migration</span>
                </span>
                <span className="font-bold text-[9px] text-amber-400">MODERATE</span>
              </button>
              <button
                onClick={() => toggleLayer('lavaTubes')}
                className={`w-full px-2.5 py-1.5 rounded border flex items-center justify-between transition-all ${
                  layersState.lavaTubes
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>Subsurface Cavities / Tubes</span>
                </span>
                <span className="font-bold text-[9px] text-purple-400">ISRU SHELTER</span>
              </button>
            </div>
          </div>
        </aside>
        )}
      </div>

      {/* 5. BOTTOM-CENTER 'MARS MEMORY TIMELINE': Horizontal timeline slider with thumbnail cards of orbital passes */}
      {showOverlays && (
        <footer className="relative z-20 w-full bg-black/80 backdrop-blur-xl border-t border-cyan-500/30 p-2.5 sm:p-3 shrink-0">
        <div className="max-w-[1920px] mx-auto flex flex-col space-y-1.5">
          {/* Timeline Title & Current Pass Stats */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-xs text-cyan-300 tracking-wider">
                MARS MEMORY TIMELINE // ORBITAL SAR PASS ARCHIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center space-x-3">
              <span>CURRENT PASS: <strong className="text-white">#{activePass.passNumber}</strong></span>
              <span>•</span>
              <span>SOL: <strong className="text-cyan-300">{activePass.sol}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{activePass.status}</span>
            </div>
          </div>

          {/* Horizontal Scrollable Pass Cards */}
          <div className="flex items-center space-x-2.5 overflow-x-auto hide-scrollbar scrollbar-none py-1">
            {ORBITAL_PASSES.map((pass) => {
              const isCurrent = pass.id === activePass.id;
              return (
                <button
                  key={pass.id}
                  onClick={() => {
                    setActivePass(pass);
                    // Also refocus target zone if match
                    const matchedTarget = TARGET_ZONES.find((t) =>
                      pass.targetRegion.toLowerCase().includes(t.id) || t.name.toLowerCase().includes(pass.targetRegion.toLowerCase())
                    );
                    if (matchedTarget) {
                      setSelectedTarget(matchedTarget);
                    }
                  }}
                  className={`flex-shrink-0 w-60 sm:w-64 p-2 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-[1.02]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-cyan-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">
                      PASS #{pass.passNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        pass.status === 'STREAMING'
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      SOL {pass.sol}
                    </span>
                  </div>

                  <div className="text-[11px] text-cyan-300 font-semibold truncate mb-1">
                    {pass.targetRegion}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>{pass.frequency}</span>
                    <span className="text-slate-300 font-mono">{pass.resolutionMeters}m res</span>
                  </div>

                  <div className="text-[9px] text-slate-400 line-clamp-1">
                    {pass.summary}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </footer>
      )}
    </div>
  );
};
