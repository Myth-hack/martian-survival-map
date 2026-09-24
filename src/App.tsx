/**
 * Interplanetary Survival Guide: Martian Map
 * NASA Space Apps Challenge 2026 - Team "Quanta Buddies"
 * Full-Stack React + TypeScript + CesiumJS/GIS + Gemini API Application
 * 
 * Refined Layout Architecture:
 * - Top Header: Consistently visible, spanning the entire top across split-screen and full-screen
 * - Map vs. Side Panels: Flexible layout where Map takes up primary area (flex-1 / flex-grow)
 *   and right-side panels maintain fixed readable width (w-[420px] - w-[480px]) without shrinking
 * - Specific Map Overlays Toggle: Dedicated 'Toggle Map Tools' (Eye / EyeOff) button that ONLY
 *   hides/shows small floating overlays sitting directly on the map (Legend, Nav D-Pad, Inspect Point)
 * - Adaptive Split-Screen: Gracefully switches to flex-col with scrollable panels stacked below the map
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { MarsGlobeView } from './components/MarsGlobeView';
import { MarsGIS2DView } from './components/MarsGIS2DView';
import { AstronautHUDView } from './components/AstronautHUDView';
import { OrbitalIntelligenceView } from './components/OrbitalIntelligenceView';
import { LayerControls } from './components/LayerControls';
import { RoutePlannerPanel } from './components/RoutePlannerPanel';
import { HazardDetectionPanel } from './components/HazardDetectionPanel';
import { ScienceTargetFinder } from './components/ScienceTargetFinder';
import { EnvironmentalPanel } from './components/EnvironmentalPanel';
import { MarswalkPlanner } from './components/MarswalkPlanner';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { SecondOpinionPanel } from './components/SecondOpinionPanel';
import { AIAssistantChat } from './components/AIAssistantChat';
import { AISystemHub } from './components/AISystemHub';
import { TechSpecsModal } from './components/TechSpecsModal';
import { MissionImpactPanel } from './components/MissionImpactPanel';
import { LocationSelector } from './components/LocationSelector';
import { BottomNavigationBar } from './components/BottomNavigationBar';
import { useUser } from './context/UserContext';
import { generateMissionAdvice } from './services/geminiMissionAdvisor';

import {
  MapMode,
  UserRole,
  MapRegionId,
  MapLayerConfig,
  RouteOption,
  HazardZone,
  ScienceTarget,
  MarsCoordinates,
  AIAssistantMessage,
  SecondOpinionConsensus,
  WhatIfScenario,
  MarsEnvironmentData
} from './types';

import {
  MAP_LAYERS_INITIAL,
  JEZERO_HAZARDS,
  JEZERO_SCIENCE_TARGETS,
  PERSEVERANCE_MISSION,
  DEFAULT_MARS_ENVIRONMENT,
  DEFAULT_WHAT_IF_SCENARIOS,
  INITIAL_AI_MESSAGES,
  INITIAL_CONSENSUS,
  MARS_REGIONS
} from './data/marsDatasets';

import {
  calculateParetoRoutes,
  calculateEmergencyReturnRoute,
  RoutingWeights
} from './utils/routingEngine';

import {
  Layers,
  Navigation,
  AlertTriangle,
  Microscope,
  User,
  HelpCircle,
  Users,
  MessageSquare,
  Sparkles,
  Compass,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';

export default function App() {
  const { userId } = useUser();

  // Navigation & Viewport State
  const [mapMode, setMapMode] = useState<MapMode>('2D');
  const [userRole, setUserRole] = useState<UserRole>('MISSION_CONTROL');
  const [selectedRegion, setSelectedRegion] = useState<MapRegionId>('jezero');
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);
  const [emergencyOfflineMode, setEmergencyOfflineMode] = useState<boolean>(false);
  const [isTechSpecsOpen, setIsTechSpecsOpen] = useState<boolean>(false);
  const [isMissionImpactOpen, setIsMissionImpactOpen] = useState<boolean>(false);
  const [panToTarget, setPanToTarget] = useState<MarsCoordinates | null>(null);
  const [highlightedPoint, setHighlightedPoint] = useState<MarsCoordinates | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Global Universal UI Overlays Toggle & Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showUI, setShowUI] = useState<boolean>(true);

  const handleToggleUI = useCallback(() => {
    setShowUI((prev) => !prev);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Sync aliases for backward compatibility with child components
  const showOverlays = showUI;
  const setShowOverlays = setShowUI;
  const handleToggleOverlays = handleToggleUI;
  const showMapTools = showUI;
  const setShowMapTools = setShowUI;

  // Escape key listener to exit fullscreen cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // When isFullscreen changes, dispatch resize after DOM reflow so WebGL & Leaflet adapt to 100vw/100vh
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Map Container & ResizeObserver Management
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Active Tool Panel Tab in the Workspace Sidebar
  const [activePanelTab, setActivePanelTab] = useState<
    'LOCATIONS' | 'LAYERS' | 'ROUTES' | 'HAZARDS' | 'SCIENCE' | 'ENV' | 'MARSWALK' | 'WHAT_IF' | 'CONSENSUS' | 'AI_CHAT' | 'AI_HUB'
  >('ROUTES');

  // GIS Layers State
  const [layers, setLayers] = useState<MapLayerConfig[]>(MAP_LAYERS_INITIAL);

  // Pathfinding State
  const [startPoint, setStartPoint] = useState<MarsCoordinates | null>(null);
  const [goalPoint, setGoalPoint] = useState<MarsCoordinates | null>(null);

  const [routingWeights, setRoutingWeights] = useState<RoutingWeights>({
    slopeAversion: 1.0,
    hazardAversion: 1.2,
    scienceAttraction: 1.0,
    distancePriority: 1.0
  });

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route_balanced_a');
  const [isEmergencyReturnActive, setIsEmergencyReturnActive] = useState<boolean>(false);
  const [isRerouting, setIsRerouting] = useState<boolean>(false);

  // Hazards & Science Targets State
  const [hazards, setHazards] = useState<HazardZone[]>(JEZERO_HAZARDS);
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);
  const [scienceTargets, setScienceTargets] = useState<ScienceTarget[]>(JEZERO_SCIENCE_TARGETS);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [inspectedAnalysis, setInspectedAnalysis] = useState<any | null>(null);
  const [isAnalyzingTarget, setIsAnalyzingTarget] = useState<boolean>(false);

  // What-If Contingency Scenarios State
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>(DEFAULT_WHAT_IF_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Multi-Agent Second Opinion State
  const [consensus, setConsensus] = useState<SecondOpinionConsensus | null>(INITIAL_CONSENSUS);
  const [isLoadingConsensus, setIsLoadingConsensus] = useState<boolean>(false);

  // AI Assistant Chat Messages
  const [aiMessages, setAiMessages] = useState<AIAssistantMessage[]>(INITIAL_AI_MESSAGES);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Environment Telemetry State
  const [environment, setEnvironment] = useState<MarsEnvironmentData>(DEFAULT_MARS_ENVIRONMENT);

  // ResizeObserver: Critical for auto-updating Three.js & 2D GIS aspect ratios on split-screen / fullscreen toggle
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      ro = new ResizeObserver(() => {
        window.dispatchEvent(new Event('resize'));
      });
      ro.observe(mapContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      ro?.disconnect();
    };
  }, []);

  // Calculate Routes whenever start, goal, or weights change
  const refreshRoutes = useCallback(() => {
    if (!startPoint || !goalPoint) {
      setRoutes([]);
      return;
    }
    const computed = calculateParetoRoutes(startPoint, goalPoint, hazards, scienceTargets, routingWeights);
    setRoutes(computed);
    if (!computed.find((r: RouteOption) => r.id === selectedRouteId)) {
      setSelectedRouteId(computed[0]?.id || 'route_balanced_a');
    }
  }, [startPoint, goalPoint, hazards, scienceTargets, routingWeights, selectedRouteId]);

  // Waypoint Management: Undo Last Point
  const handleUndoWaypoint = useCallback(() => {
    if (goalPoint) {
      setGoalPoint(null);
      setRoutes([]);
    } else if (startPoint) {
      setStartPoint(null);
      setRoutes([]);
    }
  }, [goalPoint, startPoint]);

  // Waypoint Management: Clear Route
  const handleClearRoute = useCallback(() => {
    setStartPoint(null);
    setGoalPoint(null);
    setRoutes([]);
  }, []);

  useEffect(() => {
    if (startPoint && goalPoint) {
      refreshRoutes();
    } else {
      setRoutes([]);
    }
  }, [startPoint, goalPoint, hazards, scienceTargets]);

  // Fetch initial server telemetry
  useEffect(() => {
    fetch('/api/telemetry')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.environment) {
          setEnvironment(data.environment);
        }
      })
      .catch((err) => console.log('Telemetry fetch fallback:', err));
  }, []);

  // Layer toggling & opacity handlers
  const handleToggleLayer = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const handleChangeOpacity = (id: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  const handleApplyPreset = (presetName: 'ROVER' | 'SCIENCE' | 'HAZARD' | 'ISRU') => {
    setLayers((prev) =>
      prev.map((l) => {
        if (presetName === 'ROVER') {
          return {
            ...l,
            enabled: ['mola_elevation', 'slope_analysis', 'rover_traverses', 'crater_layer'].includes(l.id)
          };
        } else if (presetName === 'SCIENCE') {
          return {
            ...l,
            enabled: ['crism_minerals', 'hirise_highres', 'rover_traverses'].includes(l.id)
          };
        } else if (presetName === 'HAZARD') {
          return {
            ...l,
            enabled: ['slope_analysis', 'roughness_boulders', 'crater_layer'].includes(l.id)
          };
        } else {
          return {
            ...l,
            enabled: ['water_ice_sharad', 'themis_thermal', 'mola_elevation'].includes(l.id)
          };
        }
      })
    );
  };

  // Target Analysis Trigger
  const handleAnalyzeCoords = async (lat: number, lon: number, elevation: number) => {
    setActivePanelTab('SCIENCE');
    setIsAnalyzingTarget(true);

    try {
      const res = await fetch('/api/ai/analyze-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: { lat, lon, elevationMeters: elevation },
          regionId: selectedRegion
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInspectedAnalysis(data);
      } else {
        setInspectedAnalysis({
          targetId: `coord_${lat.toFixed(3)}_${lon.toFixed(3)}`,
          rockType: 'Olivine-bearing Stratified Basaltic Siltstone',
          geologicalEra: 'Noachian-Hesperian Transition (~3.6 Ga)',
          mineralComposition: ['Smectite Clay', 'Mg-Rich Olivine', 'Plagioclase Feldspar', 'Fe-Oxides'],
          scientificSummary: `Surface coordinates ${lat}°N, ${lon}°E expose fine-grained sedimentary beds with distinct planar laminations. High potential for organic matter preservation.`,
          recommendedInstrumentPlan: [
            'Mastcam-Z multispectral 110mm stereo imaging',
            'SuperCam standoff laser-induced breakdown spectroscopy (LIBS)',
            'PIXL microscopic X-ray fluorescence mapping of elemental ratios',
            'SHERLOC deep-UV Raman spectroscopy for bio-organic aromatics'
          ]
        });
      }
    } catch (_e) {
      setInspectedAnalysis({
        targetId: `coord_${lat.toFixed(3)}_${lon.toFixed(3)}`,
        rockType: 'Lacustrine Delta Siltstone',
        geologicalEra: 'Late Noachian (~3.7 Ga)',
        mineralComposition: ['Smectite Clay', 'Carbonates'],
        scientificSummary: `Sedimentary outcrop situated at elevation ${elevation}m within the delta distributary network.`,
        recommendedInstrumentPlan: ['Mastcam-Z Stereo', 'SuperCam LIBS', 'SHERLOC Raman']
      });
    } finally {
      setIsAnalyzingTarget(false);
    }
  };

  // 3D -> 2D synchronization handler
  const handleGlobeClickPoint = (coords: MarsCoordinates) => {
    let closestRegion = selectedRegion;
    let minDistance = Infinity;

    MARS_REGIONS.forEach((region) => {
      const dLat = coords.lat - region.center.lat;
      const dLon = coords.lon - region.center.lon;
      const dist = Math.hypot(dLat, dLon);
      if (dist < minDistance) {
        minDistance = dist;
        closestRegion = region.id;
      }
    });

    if (minDistance < 25) {
      setSelectedRegion(closestRegion);
    }

    setHighlightedPoint(coords);
    setPanToTarget(coords);
    handleAnalyzeCoords(coords.lat, coords.lon, coords.elevationMeters);

    setIsTransitioning(true);
    setTimeout(() => {
      setMapMode('2D');
      setIsTransitioning(false);
    }, 450);
  };

  // Direct selection of one of the 10 iconic Martian locations
  const handleSelectLocation = (regionId: MapRegionId) => {
    setSelectedRegion(regionId);
    const targetLoc = MARS_REGIONS.find((r) => r.id === regionId);
    if (targetLoc) {
      setPanToTarget(targetLoc.center);
      setHighlightedPoint(targetLoc.center);
      handleAnalyzeCoords(targetLoc.center.lat, targetLoc.center.lon, targetLoc.center.elevationMeters);

      if (mapMode === '3D') {
        setIsTransitioning(true);
        setTimeout(() => {
          setMapMode('2D');
          setIsTransitioning(false);
        }, 500);
      }
    }
  };

  const handleFlyToCoordinates = (coords: MarsCoordinates) => {
    setPanToTarget(coords);
    setHighlightedPoint(coords);
    handleAnalyzeCoords(coords.lat, coords.lon, coords.elevationMeters);
  };

  // AI Assistant Query Handler
  const handleSendMessage = async (content: string, role: string = 'MISSION_COMMANDER') => {
    const userMsg: AIAssistantMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      const activeRoute = routes.find((r) => r.id === selectedRouteId);
      const advice = await generateMissionAdvice({
        userQuery: content,
        role,
        selectedRegion,
        activeRoute,
        coordinates: { lat: 18.38, lon: 77.58 },
      });

      const aiMsg: AIAssistantMessage = {
        id: advice.id,
        role: 'assistant',
        content: advice.content,
        timestamp: advice.timestamp,
        evidenceCitations: advice.evidenceCitations,
        explainableReasoning: advice.explainableReasoning,
      };
      setAiMessages((prev) => [...prev, aiMsg]);
    } catch (_err) {
      const fallbackMsg: AIAssistantMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `[NASA PDS CONTROLLER]: Sol 1240 nominal. Based on Mars 2020 tactical telemetry and MOLA/HiRISE terrain models, the traverse through ${selectedRegion} maintains nominal slope stability (<11° gradient). Avoid the southeastern Séítah dune margin where soft aeolian sands induce high wheel slippage (up to 34%).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidenceCitations: [
          {
            sourceName: 'NASA Mars 2020 Mission Plan',
            datasetType: 'HiRISE DTM',
            dataProductId: 'PDS_M2020_SOL1240_TRAVERSE',
            confidence: 0.94
          }
        ],
        explainableReasoning: {
          confidenceScore: 93,
          decisionFactors: [
            'Terrain slope below critical 15° rover threshold',
            'Absence of boulder clusters exceeding 30cm clearance',
            'Direct line-of-sight to UHF habitat relay'
          ],
          alternativesConsidered: 'Direct southern path through Séítah rejected due to entrapment risk.'
        }
      };
      setAiMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Copilot Tactical Directives Query Handler
  const handleAskCopilot = async (customPrompt?: string) => {
    const query = customPrompt?.trim() || 'Requesting immediate tactical copilot evaluation and terrain hazard directives for current Martian sol.';
    const userMsg: AIAssistantMessage = {
      id: `usr_copilot_${Date.now()}`,
      role: 'user',
      content: `[COPILOT QUERY] ${query}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      const activeRoute = routes.find((r) => r.id === selectedRouteId);
      const advice = await generateMissionAdvice({
        userQuery: `[COPILOT TACTICAL DIRECTIVE REQUEST]: ${query}`,
        role: 'TACTICAL_COPILOT',
        selectedRegion,
        activeRoute,
        coordinates: { lat: 18.38, lon: 77.58 },
      });

      const copilotMsg: AIAssistantMessage = {
        id: advice.id,
        role: 'assistant',
        content: `[PDS DIRECTIVE]: ${advice.directive}\n\n${advice.content}`,
        timestamp: advice.timestamp,
        evidenceCitations: advice.evidenceCitations,
        explainableReasoning: advice.explainableReasoning,
      };
      setAiMessages((prev) => [...prev, copilotMsg]);
    } catch (_err) {
      const fallbackCopilotMsg: AIAssistantMessage = {
        id: `ai_copilot_${Date.now()}`,
        role: 'assistant',
        content: `[COPILOT DIRECTIVE]: BEARING 342° NOMINAL. SLOPE 8.4°. MAINTAIN 0.12 M/S SPEED ENVELOPE.\n\nTactical Copilot Audit: Traverse corridor across ${selectedRegion} maintains nominal slope stability (<11° gradient). Avoid southeastern Séítah dune margin to prevent high wheel slippage (>30%). All telemetry within safety envelopes.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidenceCitations: [
          {
            sourceName: 'NASA Mars 2020 Mission Operations',
            datasetType: 'HiRISE DTM',
            dataProductId: 'PDS_M2020_SOL1240_COPILOT',
            confidence: 0.96
          }
        ],
        explainableReasoning: {
          confidenceScore: 95,
          decisionFactors: [
            'Slope gradient below 15° critical rover threshold',
            'RTG thermal dissipation and battery charge at 91%',
            'Direct line-of-sight to UHF orbiter relay'
          ],
          alternativesConsidered: 'Direct southern path through Séítah rejected due to excessive wheel slippage risk.'
        }
      };
      setAiMessages((prev) => [...prev, fallbackCopilotMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Real-Time Dynamic Hazard Event
  const handleTriggerHazardEvent = () => {
    setIsRerouting(true);
    setTimeout(() => {
      const newHazard: HazardZone = {
        id: `haz_dynamic_${Date.now()}`,
        title: 'Active Dune Ripple Field Shift',
        type: 'DUNE_FIELD',
        center: { lat: 18.4250, lon: 77.4600, elevationMeters: -2530 },
        radiusMeters: 280,
        riskLevel: 'CRITICAL',
        maxSlopeDeg: 19.5,
        roughnessIndex: 0.85,
        detectedBy: 'Navcam Autonomous Hazard Avoidance',
        description: 'Aeolian drift accumulation identified across primary path corridor. Wheel sinkage probability > 45%.',
        mitigationAdvice: 'Execute Vector Beta perimeter bypass around southern bedrock apron.'
      };

      setHazards((prev) => [newHazard, ...prev]);
      setSelectedHazardId(newHazard.id);
      setIsRerouting(false);
      refreshRoutes();
    }, 1200);
  };

  // Emergency Return Route Trigger
  const handleTriggerEmergencyReturn = () => {
    if (isEmergencyReturnActive) {
      setIsEmergencyReturnActive(false);
      refreshRoutes();
    } else {
      setIsEmergencyReturnActive(true);
      const airlockCoord: MarsCoordinates = {
        lat: 18.3800,
        lon: 77.5800,
        elevationMeters: -2560,
        name: 'Habitat Airlock Alpha'
      };
      const originCoord = goalPoint || startPoint || airlockCoord;
      const emergencyRoute = calculateEmergencyReturnRoute(originCoord, airlockCoord);
      setRoutes([emergencyRoute, ...routes]);
      setSelectedRouteId(emergencyRoute.id);
      setActivePanelTab('MARSWALK');
    }
  };

  // What-If Scenario Toggle
  const handleToggleScenario = (scenarioId: string) => {
    if (activeScenarioId === scenarioId) {
      setActiveScenarioId(null);
    } else {
      setActiveScenarioId(scenarioId);
      const scen = scenarios.find((s) => s.id === scenarioId);
      if (scen && scen.category === 'DUST_STORM') {
        setEnvironment((prev: MarsEnvironmentData) => ({
          ...prev,
          opticalDepthTau: 3.4,
          solarIrradianceWm2: 180
        }));
      } else if (scen && scen.category === 'ROUTE_BLOCKED') {
        handleTriggerHazardEvent();
      }
    }
  };

  // Second-Opinion Multi-Agent consensus synthesis
  const handleFetchSecondOpinion = async () => {
    setIsLoadingConsensus(true);
    try {
      const res = await fetch('/api/ai/second-opinion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routes,
          hazards,
          scienceTargets
        })
      });
      if (res.ok) {
        const data = await res.json();
        setConsensus(data);
      }
    } catch (_e) {
      console.log('Consensus fallback');
    } finally {
      setIsLoadingConsensus(false);
    }
  };

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  type PanelTabId =
    | 'LOCATIONS'
    | 'AI_HUB'
    | 'ROUTES'
    | 'LAYERS'
    | 'HAZARDS'
    | 'SCIENCE'
    | 'MARSWALK'
    | 'WHAT_IF'
    | 'CONSENSUS'
    | 'AI_CHAT';

  const openPanel = (tabId: PanelTabId) => {
    setActivePanelTab(tabId);
    if (tabId === 'CONSENSUS') {
      handleFetchSecondOpinion();
    }
  };

  const handleTabClick = (tabId: PanelTabId) => {
    setActivePanelTab(tabId);
    if (tabId === 'CONSENSUS') {
      handleFetchSecondOpinion();
    }
  };

  const handleBottomNavChange = (tabId: string) => {
    const upper = tabId.toUpperCase();
    if (upper === 'ROUTING' || upper === 'ROUTES') {
      openPanel('ROUTES');
    } else if (upper === 'EVA' || upper === 'MARSWALK') {
      openPanel('MARSWALK');
    } else if (upper === 'SITES' || upper === '10 SITES' || upper === 'LOCATIONS') {
      openPanel('LOCATIONS');
    } else if (upper === 'AI_HUB' || upper === 'AI HUB') {
      openPanel('AI_HUB');
    } else if (upper === 'AI_CHAT' || upper === 'AI CHAT') {
      openPanel('AI_CHAT');
    } else if (upper === 'WHAT_IF' || upper === 'WHAT-IF') {
      openPanel('WHAT_IF');
    } else if (upper === 'CONSENSUS') {
      openPanel('CONSENSUS');
    } else if (upper === 'LAYERS') {
      openPanel('LAYERS');
    } else if (upper === 'HAZARDS') {
      openPanel('HAZARDS');
    } else if (upper === 'SCIENCE') {
      openPanel('SCIENCE');
    } else {
      openPanel(tabId as PanelTabId);
    }
  };

  // Map Background Renderer
  const renderMapView = () => (
    <div className={`w-full h-full relative overflow-hidden transition-all duration-300 ${isTransitioning ? 'opacity-40 scale-[0.98] blur-[1px]' : 'opacity-100 scale-100'}`}>
      {isTransitioning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-2 font-mono text-cyan-400 text-xs">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-bold tracking-wider">SYNCHRONIZING TACTICAL GIS...</span>
          </div>
        </div>
      )}

      {userRole === 'ASTRONAUT_HUD' ? (
        <AstronautHUDView
          activeRoute={activeRoute}
          env={environment}
          onExitHUD={() => setUserRole('MISSION_CONTROL')}
        />
      ) : mapMode === 'ORBITAL' ? (
        <OrbitalIntelligenceView
          onClose={() => setMapMode('2D')}
          environment={environment}
          initialTargetRegion={selectedRegion}
          showUI={showUI}
          showOverlays={showUI}
          onToggleUI={handleToggleUI}
          onToggleOverlays={handleToggleUI}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      ) : mapMode === '3D' ? (
        <MarsGlobeView
          onGlobeClickPoint={handleGlobeClickPoint}
          onAnalyzeCoords={(lat, lon, elev) => handleAnalyzeCoords(lat, lon, elev)}
          activeStartPoint={startPoint}
          activeGoalPoint={goalPoint}
          targetRegion={MARS_REGIONS.find((r) => r.id === selectedRegion)?.center || null}
          highlightedPoint={highlightedPoint}
          showUI={showUI}
          showOverlays={showUI}
          onToggleUI={handleToggleUI}
          onToggleOverlays={handleToggleUI}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      ) : (
        <MarsGIS2DView
          selectedRegion={selectedRegion}
          onSelectRegion={handleSelectLocation}
          layers={layers}
          roverMission={PERSEVERANCE_MISSION}
          hazards={hazards}
          scienceTargets={scienceTargets}
          activeRoutes={routes}
          selectedRouteId={selectedRouteId}
          startPoint={startPoint}
          goalPoint={goalPoint}
          onSetStartPoint={setStartPoint}
          onSetGoalPoint={setGoalPoint}
          onUndoWaypoint={handleUndoWaypoint}
          onClearRoute={handleClearRoute}
          panToTarget={panToTarget}
          highlightedPoint={highlightedPoint}
          showUI={showUI}
          showMapTools={showUI}
          onToggleMapTools={handleToggleUI}
          showOverlays={showUI}
          onToggleOverlays={handleToggleUI}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onSelectTarget={(target) => {
            setSelectedTargetId(target.id);
            openPanel('SCIENCE');
            handleAnalyzeCoords(target.coordinates.lat, target.coordinates.lon, target.coordinates.elevationMeters);
          }}
          onSelectHazard={(haz) => {
            setSelectedHazardId(haz.id);
            openPanel('HAZARDS');
          }}
          onAnalyzeCoords={(lat, lon, elev) => handleAnalyzeCoords(lat, lon, elev)}
        />
      )}
    </div>
  );

  const renderActivePanel = () => {
    switch (activePanelTab) {
      case 'LOCATIONS':
        return (
          <LocationSelector
            selectedRegion={selectedRegion}
            onSelectLocation={(locId) => {
              handleSelectLocation(locId);
            }}
            onFlyToCoordinates={handleFlyToCoordinates}
          />
        );
      case 'AI_HUB':
        return (
          <AISystemHub
            userId={userId}
            messages={aiMessages}
            onSendMessage={handleSendMessage}
            isAiLoading={isAiLoading}
            activeRoute={activeRoute}
            routes={routes}
            hazards={hazards}
            scienceTargets={scienceTargets}
            environment={environment}
            selectedRegion={selectedRegion}
            consensus={consensus}
            onCommanderApprove={(routeId) => {
              setSelectedRouteId(routeId);
              openPanel('ROUTES');
            }}
            isLoadingConsensus={isLoadingConsensus}
            onRefreshConsensus={handleFetchSecondOpinion}
          />
        );
      case 'ROUTES':
        return (
          <RoutePlannerPanel
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            weights={routingWeights}
            onChangeWeights={(w) => setRoutingWeights((prev) => ({ ...prev, ...w }))}
            onRecalculateRoutes={refreshRoutes}
            startPoint={startPoint}
            goalPoint={goalPoint}
            onUndoWaypoint={handleUndoWaypoint}
            onClearRoute={handleClearRoute}
            onAuditWithAI={() => openPanel('AI_HUB')}
          />
        );
      case 'LAYERS':
        return (
          <LayerControls
            layers={layers}
            onToggleLayer={handleToggleLayer}
            onChangeOpacity={handleChangeOpacity}
            onApplyPreset={handleApplyPreset}
          />
        );
      case 'HAZARDS':
        return (
          <HazardDetectionPanel
            hazards={hazards}
            selectedHazardId={selectedHazardId}
            onSelectHazard={(h) => setSelectedHazardId(h.id)}
            onTriggerHazardEvent={handleTriggerHazardEvent}
            isRerouting={isRerouting}
          />
        );
      case 'SCIENCE':
        return (
          <ScienceTargetFinder
            targets={scienceTargets}
            selectedTargetId={selectedTargetId}
            onSelectTarget={(t) => {
              setSelectedTargetId(t.id);
              openPanel('SCIENCE');
              handleAnalyzeCoords(t.coordinates.lat, t.coordinates.lon, t.coordinates.elevationMeters);
            }}
            inspectedAnalysis={inspectedAnalysis}
            isAnalyzing={isAnalyzingTarget}
            onAnalyzeCustomCoord={(c) => handleAnalyzeCoords(c.lat, c.lon, c.elevationMeters)}
          />
        );
      case 'MARSWALK':
        return (
          <MarswalkPlanner
            onTriggerEmergencyReturn={handleTriggerEmergencyReturn}
            isEmergencyReturnActive={isEmergencyReturnActive}
          />
        );
      case 'WHAT_IF':
        return (
          <WhatIfSimulator
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onToggleScenario={handleToggleScenario}
          />
        );
      case 'CONSENSUS':
        return (
          <SecondOpinionPanel
            userId={userId}
            consensus={consensus}
            onCommanderApprove={(routeId) => {
              setSelectedRouteId(routeId);
              openPanel('ROUTES');
            }}
            isLoading={isLoadingConsensus}
          />
        );
      case 'AI_CHAT':
        return (
          <AIAssistantChat
            userId={userId}
            messages={aiMessages}
            onSendMessage={handleSendMessage}
            onAskCopilot={handleAskCopilot}
            isLoading={isAiLoading}
            selectedRegion={selectedRegion}
            activeRoute={routes.find((r) => r.id === selectedRouteId)}
            environment={environment}
          />
        );
      default:
        return null;
    }
  };

  const renderTabBar = () => (
    <div className="bg-[#0b0f17]/95 border border-slate-800 rounded-xl p-1.5 flex items-center space-x-1 overflow-x-auto whitespace-nowrap hide-scrollbar scrollbar-none shadow-lg w-full max-w-full touch-pan-x min-w-0">
      <button
        onClick={() => handleTabClick('LOCATIONS')}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-all shrink-0 ${
          activePanelTab === 'LOCATIONS'
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-lg shadow-amber-950/60'
            : 'bg-amber-950/30 text-amber-300 hover:text-white hover:bg-amber-900/40 border border-amber-500/40'
        }`}
      >
        <Compass className="w-3.5 h-3.5 text-amber-400" />
        <span>10 Locations</span>
      </button>

      <button
        onClick={() => handleTabClick('AI_HUB')}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-all shrink-0 ${
          activePanelTab === 'AI_HUB'
            ? 'bg-gradient-to-r from-cyan-600 via-emerald-600 to-cyan-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-950/60'
            : 'bg-cyan-950/40 text-cyan-300 hover:text-white hover:bg-cyan-900/50 border border-cyan-500/40'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>AI System</span>
      </button>

      <button
        onClick={() => handleTabClick('ROUTES')}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors shrink-0 ${
          activePanelTab === 'ROUTES'
            ? 'bg-cyan-600 text-slate-950 font-bold shadow'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
        }`}
      >
        <Navigation className="w-3.5 h-3.5" />
        <span>Routing</span>
      </button>

      <button
        onClick={() => handleTabClick('LAYERS')}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors shrink-0 ${
          activePanelTab === 'LAYERS'
            ? 'bg-cyan-600 text-slate-950 font-bold shadow'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>GIS Layers</span>
      </button>

      <button
        onClick={() => handleTabClick('HAZARDS')}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors shrink-0 ${
          activePanelTab === 'HAZARDS'
            ? 'bg-red-600 text-white font-bold shadow'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
        }`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Hazards</span>
      </button>

      <button
        onClick={() => handleTabClick('SCIENCE')}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors shrink-0 ${
          activePanelTab === 'SCIENCE'
            ? 'bg-cyan-600 text-slate-950 font-bold shadow'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
        }`}
      >
        <Microscope className="w-3.5 h-3.5" />
        <span>Science</span>
      </button>

      <button
        onClick={() => handleTabClick('MARSWALK')}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors shrink-0 ${
          activePanelTab === 'MARSWALK'
            ? 'bg-emerald-600 text-white font-bold shadow'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        <span>EVA</span>
      </button>

      <button
        onClick={() => handleTabClick('WHAT_IF')}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors shrink-0 ${
          activePanelTab === 'WHAT_IF'
            ? 'bg-purple-600 text-white font-bold shadow'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
        }`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>What-If</span>
      </button>

      <button
        onClick={() => handleTabClick('CONSENSUS')}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors shrink-0 ${
          activePanelTab === 'CONSENSUS'
            ? 'bg-cyan-600 text-slate-950 font-bold shadow'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        <span>Consensus</span>
      </button>

      <button
        onClick={() => handleTabClick('AI_CHAT')}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors shrink-0 ${
          activePanelTab === 'AI_CHAT'
            ? 'bg-cyan-600 text-slate-950 font-bold shadow'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>AI Chat</span>
      </button>
    </div>
  );

  return (
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden bg-[#03060c] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 select-none flex flex-col">
      {/* 1. TOP HEADER: Fluid, left-aligned, sticky header spanning top across zoom levels */}
      <Navbar
        userId={userId}
        mapMode={mapMode}
        setMapMode={setMapMode}
        userRole={userRole}
        setUserRole={setUserRole}
        selectedRegion={selectedRegion}
        setSelectedRegion={handleSelectLocation}
        audioFeedback={audioFeedback}
        setAudioFeedback={setAudioFeedback}
        emergencyOfflineMode={emergencyOfflineMode}
        setEmergencyOfflineMode={setEmergencyOfflineMode}
        onOpenReport={() => openPanel('CONSENSUS')}
        onOpenTechSpec={() => setIsTechSpecsOpen(true)}
        solNumber={environment.solNumber}
        commsDelayMinutes={environment.commsDelayMinutes}
        onOpenAISystem={() => openPanel('AI_HUB')}
        onOpenMissionImpact={() => setIsMissionImpactOpen(true)}
        showOverlays={showUI}
        onToggleOverlays={handleToggleUI}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* 2. MAIN WORKSPACE: Fluid layout balancing Map and Side Panels */}
      <main className={`flex-1 w-full ${isFullscreen ? 'p-0 m-0 overflow-hidden' : 'p-2 sm:p-3 xl:p-4 min-h-0 overflow-y-auto xl:overflow-hidden'} flex flex-col xl:flex-row gap-3`}>
        {/* PRIMARY VIEWING AREA: Aggressive fixed breakout when in Fullscreen */}
        <section
          className={`w-full ${
            isFullscreen
              ? 'fixed inset-0 w-screen h-[100dvh] z-[9990] bg-slate-950 p-0 m-0 overflow-hidden flex flex-col'
              : 'xl:flex-1 min-w-0 flex flex-col gap-2 shrink-0 xl:shrink min-h-[50vh] xl:min-h-0 xl:h-full relative'
          }`}
        >
          {/* PERSISTENT VIEW CONTROL BAR: Always visible above 2D GIS, 3D Globe, & Orbital SAR in BOTH normal and fullscreen mode */}
          <div
            className={`shrink-0 w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/95 border border-cyan-500/50 backdrop-blur-xl shadow-lg relative z-[9999] pointer-events-auto select-none ${
              isFullscreen
                ? 'fixed top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 w-auto rounded-xl border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
                : 'rounded-xl'
            }`}
          >
            {/* Left: Tactical Location & Active Mode Metadata */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <div className="flex items-center space-x-2 truncate">
                <span className="font-mono text-xs sm:text-sm font-bold text-cyan-300 tracking-wider uppercase truncate">
                  {MARS_REGIONS.find((r) => r.id === selectedRegion)?.name || selectedRegion}
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-300 hidden sm:inline">
                  ACTIVE VIEW:{' '}
                  <span className="text-cyan-400 font-bold uppercase">
                    {mapMode === 'ORBITAL' ? 'Orbital SAR Radar' : mapMode === '3D' ? '3D Photorealistic Globe' : '2D GIS Basemap'}
                  </span>
                </span>
              </div>
            </div>

            {/* Right: Unified Control Container with Ultra-High Z-Index (Z-[9999]) */}
            <div className="relative z-[9999] pointer-events-auto flex items-center space-x-2 shrink-0">
              {/* Hide / Show Overlays Button (Completely Independent from Fullscreen) */}
              <button
                id="view-toggle-overlays-btn"
                onClick={handleToggleUI}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer pointer-events-auto ${
                  showUI
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 font-bold hover:bg-cyan-900 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                    : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                }`}
                title="Toggle Map Overlays (Hide or show floating telemetry, markers, tools, and HUD across 2D Map, 3D Globe, & Orbital SAR)"
              >
                {showUI ? (
                  <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>{showUI ? 'Hide Overlays' : 'Show Overlays'}</span>
              </button>

              {/* Fullscreen Mode Button (Completely Independent from ShowUI) */}
              <button
                id="view-toggle-fullscreen-btn"
                onClick={handleToggleFullscreen}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer pointer-events-auto ${
                  isFullscreen
                    ? 'bg-cyan-600 hover:bg-cyan-500 border-cyan-300 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    : 'bg-slate-900/90 hover:bg-cyan-950/90 border-cyan-700/60 hover:border-cyan-400 text-cyan-300 hover:text-white'
                }`}
                title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen View (100% Screen)'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline font-bold">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="hidden sm:inline font-bold">Fullscreen</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Map View Container: Expands to 100vw x 100vh in fullscreen mode */}
          <div
            ref={mapContainerRef}
            className={`w-full ${
              isFullscreen
                ? 'w-screen h-[100dvh] border-none rounded-none'
                : 'h-[50vh] min-h-[360px] sm:min-h-[420px] xl:h-auto xl:min-h-0 xl:flex-1 rounded-2xl border border-cyan-500/30'
            } overflow-hidden relative shadow-2xl bg-[#04060c]`}
          >
            {renderMapView()}
          </div>

          {/* Environmental Telemetry Panel docked below map: Hidden in Fullscreen */}
          {!isFullscreen && (
            <div className="shrink-0 w-full min-w-0">
              <EnvironmentalPanel env={environment} />
            </div>
          )}
        </section>

        {/* RIGHT-SIDE CONTROL PANELS: Automatically hidden when in fullscreen */}
        {!isFullscreen && (
          <aside className="w-full xl:w-[36%] 2xl:w-[32%] xl:min-w-[380px] xl:max-w-[520px] shrink-0 xl:shrink-0 flex flex-col gap-2 min-h-0 min-w-0 bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-2.5 sm:p-3 shadow-[0_0_30px_rgba(6,182,212,0.12)] max-h-[85vh] xl:max-h-full xl:h-full overflow-hidden mb-16 xl:mb-0">
            {/* Tab Strip */}
            <div className="shrink-0 min-w-0">
              {renderTabBar()}
            </div>

            {/* Active Panel Content: scrollable inside sidebar */}
            <div className="flex-1 w-full min-w-0 min-h-0 overflow-y-auto pr-1 pb-1">
              {renderActivePanel()}
            </div>
          </aside>
        )}
      </main>

      {/* 3. BOTTOM CINEMATIC NAVIGATION BAR: Hidden when in Fullscreen */}
      {!isFullscreen && (
        <footer className="w-full shrink-0 z-30">
          <BottomNavigationBar
            activeTab={activePanelTab}
            onTabChange={handleBottomNavChange}
          />
        </footer>
      )}

      {/* Technical Specifications Modal */}
      <TechSpecsModal
        isOpen={isTechSpecsOpen}
        onClose={() => setIsTechSpecsOpen(false)}
      />

      {/* NASA Journey to Mars: Mission Impact Panel */}
      <MissionImpactPanel
        isOpen={isMissionImpactOpen}
        onClose={() => setIsMissionImpactOpen(false)}
        onSelectAction={(action) => {
          if (action === 'LOCATIONS') {
            openPanel('LOCATIONS');
          } else if (action === 'HAZARDS') {
            openPanel('HAZARDS');
          } else if (action === 'ROUTES') {
            openPanel('ROUTES');
          } else if (action === 'AI_HUB') {
            openPanel('AI_HUB');
          } else if (action === '2D_MAP') {
            setMapMode('2D');
          }
        }}
      />
    </div>
  );
}
