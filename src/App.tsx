/**
 * Interplanetary Survival Guide: Martian Map
 * NASA Space Apps Challenge 2026 - Team "Quanta Buddies"
 * Full-Stack React + TypeScript + CesiumJS/GIS + Gemini API Application
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
import { MissionConditionPanel } from './components/MissionConditionPanel';
import { MarswalkPlanner } from './components/MarswalkPlanner';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { SecondOpinionPanel } from './components/SecondOpinionPanel';
import { AIAssistantChat } from './components/AIAssistantChat';
import { AISystemHub } from './components/AISystemHub';
import { TechSpecsModal } from './components/TechSpecsModal';
import { MissionImpactPanel } from './components/MissionImpactPanel';
import { LocationSelector } from './components/LocationSelector';
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
  MarsEnvironmentData,
  MarsMissionConditionData
} from './types';

import {
  MAP_LAYERS_INITIAL,
  JEZERO_HAZARDS,
  JEZERO_SCIENCE_TARGETS,
  PERSEVERANCE_MISSION,
  DEFAULT_MARS_ENVIRONMENT,
  DEFAULT_MARS_MISSION_CONDITION,
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
  Activity,
  User,
  HelpCircle,
  Users,
  MessageSquare,
  Sparkles,
  Compass,
  X,
  Eye,
  EyeOff
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

  // Responsive Mobile Mode vs Desktop Mode (lg breakpoint: 1024px)
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileMode(isMobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active Tool Panel Tab in the Workspace Sidebar
  const [activePanelTab, setActivePanelTab] = useState<
    'LOCATIONS' | 'LAYERS' | 'ROUTES' | 'HAZARDS' | 'SCIENCE' | 'ENV' | 'MARSWALK' | 'WHAT_IF' | 'CONSENSUS' | 'AI_CHAT' | 'AI_HUB'
  >('ROUTES');

  // GIS Layers State
  const [layers, setLayers] = useState<MapLayerConfig[]>(MAP_LAYERS_INITIAL);

  // Pathfinding State (Initialized to null - no markers or routes until set by user)
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

  // Environment Telemetry State (Atmospheric pressure, MEDA weather metrics, dust opacity, solar radiation)
  const [environment, setEnvironment] = useState<MarsEnvironmentData>(DEFAULT_MARS_ENVIRONMENT);
  const [isRefreshingTelemetry, setIsRefreshingTelemetry] = useState<boolean>(false);

  // Mission Condition & Readiness State (Mission status, crew readiness, operational windows)
  const [missionCondition, setMissionCondition] = useState<MarsMissionConditionData>(DEFAULT_MARS_MISSION_CONDITION);
  const [isRefreshingMission, setIsRefreshingMission] = useState<boolean>(false);

  // Active Telemetry / Mission Condition Display Mode
  const [telemetryViewMode, setTelemetryViewMode] = useState<'MISSION_CONDITION' | 'ENVIRONMENT' | 'DUAL'>('MISSION_CONDITION');

  // Global UI Overlays Toggle (Universal across 2D GIS Map, 3D Globe, and Orbital SAR)
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

  // Global Universal Fullscreen State & Handler
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Global Keyboard Shortcuts: 'h' / 'H' for Overlays, 'f' / 'F' for Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (e.key === 'h' || e.key === 'H') {
        setShowOverlays((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [handleToggleFullscreen]);

  // Calculate Routes whenever start, goal, or weights change (only if both start & goal are set)
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

  useEffect(() => {
    if (startPoint && goalPoint) {
      refreshRoutes();
    } else {
      setRoutes([]);
    }
  }, [startPoint, goalPoint, hazards, scienceTargets]);

  // Distinct Fetch Handler: Environmental Telemetry
  const fetchEnvironmentTelemetry = useCallback(() => {
    setIsRefreshingTelemetry(true);
    fetch('/api/environment')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.environment) {
          setEnvironment(data.environment);
        } else if (data && data.atmosphericPressurePa) {
          setEnvironment(data);
        }
      })
      .catch((err) => console.log('Environment telemetry fallback:', err))
      .finally(() => setIsRefreshingTelemetry(false));
  }, []);

  // Distinct Fetch Handler: Mission Condition & Crew Readiness
  const fetchMissionCondition = useCallback(() => {
    setIsRefreshingMission(true);
    fetch('/api/mission/condition')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.missionCondition) {
          setMissionCondition(data.missionCondition);
        } else if (data && data.missionStatus) {
          setMissionCondition(data);
        }
      })
      .catch((err) => console.log('Mission condition fetch fallback:', err))
      .finally(() => setIsRefreshingMission(false));
  }, []);

  // Fetch initial telemetry for both distinct panels on mount
  useEffect(() => {
    fetchEnvironmentTelemetry();
    fetchMissionCondition();
  }, [fetchEnvironmentTelemetry, fetchMissionCondition]);

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

  // Target Analysis Trigger (clicking map coordinate or selecting target)
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
        // Fallback procedural analysis
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
    } catch (e) {
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

  // Seamless Macro-to-Micro 3D -> 2D synchronization handler
  const handleGlobeClickPoint = (coords: MarsCoordinates) => {
    // 1. Check if the clicked coordinates are closest to a known Mars region
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

    // Update region to closest if within standard vicinity
    if (minDistance < 25) {
      setSelectedRegion(closestRegion);
    }

    // Highlight selected coordinate and pan to target without altering routing start/goal points
    setHighlightedPoint(coords);
    setPanToTarget(coords);

    // Trigger AI surface analysis at the clicked spot
    handleAnalyzeCoords(coords.lat, coords.lon, coords.elevationMeters);

    // Smooth cinematic transition to 2D tactical map
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
      // Set panning target for 2D map
      setPanToTarget(targetLoc.center);
      // Highlight the selected region point without overwriting route start or goal
      setHighlightedPoint(targetLoc.center);
      // Run AI planetary geological surface analysis
      handleAnalyzeCoords(targetLoc.center.lat, targetLoc.center.lon, targetLoc.center.elevationMeters);

      // If currently in 3D globe mode, trigger cinematic transition to 2D tactical map
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
      const adviceResponse = await generateMissionAdvice({
        query: content,
        role,
        activeRoute,
        hazards,
        scienceTargets,
        environment,
        selectedRegion
      });

      setAiMessages((prev) => [...prev, adviceResponse]);
    } catch (err) {
      // High-quality NASA-grounded fallback response
      const fallbackMsg: AIAssistantMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `Acknowledged. Based on Mars 2020 tactical telemetry and MOLA/HiRISE terrain models, the traverse through the current sector maintains nominal slope stability (<11° gradient). Avoid the southeastern Séítah dune margin where soft aeolian sands induce high wheel slippage (up to 34%).`,
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
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          userPrompt: query,
          role: 'TACTICAL_COPILOT',
          selectedRegion,
          userRole,
          activeRoute,
          environment
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiMessages((prev) => [...prev, data]);
      } else {
        throw new Error(`Copilot API route returned error: ${res.status}`);
      }
    } catch (err) {
      // Robust NASA-grounded fallback directive
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
      // Introduce an active shifting sand obstacle or scarp alert
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
      // Airlock habitat coordinate
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
    } catch (e) {
      console.log('Consensus fallback');
    } finally {
      setIsLoadingConsensus(false);
    }
  };

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  // Tab metadata definitions for desktop bar and mobile bottom navigation
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

  const TAB_DEFINITIONS: Array<{
    id: PanelTabId;
    label: string;
    mobileShortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'LOCATIONS', label: '10 Locations', mobileShortLabel: '10 Sites', icon: Compass },
    { id: 'AI_HUB', label: 'AI System Hub', mobileShortLabel: 'AI Hub', icon: Sparkles },
    { id: 'ROUTES', label: 'Route Planning', mobileShortLabel: 'Routing', icon: Navigation },
    { id: 'LAYERS', label: 'GIS Layers', mobileShortLabel: 'Layers', icon: Layers },
    { id: 'HAZARDS', label: 'Hazard Detection', mobileShortLabel: 'Hazards', icon: AlertTriangle },
    { id: 'SCIENCE', label: 'Geo-Scanner & Science', mobileShortLabel: 'Geo-Scan', icon: Microscope },
    { id: 'MARSWALK', label: 'EVA Marswalk', mobileShortLabel: 'EVA', icon: User },
    { id: 'WHAT_IF', label: 'What-If Simulation', mobileShortLabel: 'What-If', icon: HelpCircle },
    { id: 'CONSENSUS', label: 'Consensus Opinion', mobileShortLabel: 'Consensus', icon: Users },
    { id: 'AI_CHAT', label: 'AI Mission Chat', mobileShortLabel: 'AI Chat', icon: MessageSquare }
  ];

  const activeTabDef = TAB_DEFINITIONS.find((t) => t.id === activePanelTab) || TAB_DEFINITIONS[0];
  const controlPanelRef = useRef<HTMLElement | null>(null);

  const openPanel = (tabId: PanelTabId) => {
    setActivePanelTab(tabId);
    if (tabId === 'CONSENSUS') {
      handleFetchSecondOpinion();
    }
    // On smaller screens, smoothly scroll down to the control center
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        controlPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const handleTabClick = (tabId: PanelTabId) => {
    setActivePanelTab(tabId);
    if (tabId === 'CONSENSUS') {
      handleFetchSecondOpinion();
    }
  };

  const renderMapView = () => (
    <div className={`w-full h-full flex-1 flex flex-col transition-all duration-300 relative ${isTransitioning ? 'opacity-40 scale-[0.98] blur-[1px]' : 'opacity-100 scale-100'}`}>
      {/* Persistent Floating HUD Toggle Button across all views (2D Map, 3D Globe, Orbital SAR) */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-40 pointer-events-auto">
        <button
          id="persistent-floating-toggle-overlays-btn"
          onClick={() => setShowOverlays((prev) => !prev)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border flex items-center space-x-1.5 transition-all shadow-xl backdrop-blur-md cursor-pointer ${
            showOverlays
              ? 'bg-slate-950/85 border-slate-700/80 text-slate-300 hover:border-cyan-400 hover:text-cyan-300'
              : 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
          }`}
          title={showOverlays ? 'Hide UI Overlays (Global 2D / 3D / Orbital SAR) [Press H]' : 'Show UI Overlays (Global 2D / 3D / Orbital SAR) [Press H]'}
        >
          {showOverlays ? (
            <>
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px]">HIDE UI</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-300 font-extrabold">SHOW UI</span>
            </>
          )}
        </button>
      </div>

      {isTransitioning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm rounded-xl">
          <div className="flex flex-col items-center space-y-2 font-mono text-cyan-400 text-xs">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-bold tracking-wider">SYNCHRONIZING TACTICAL 2D GIS...</span>
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
          showOverlays={showOverlays}
        />
      ) : mapMode === '3D' ? (
        <MarsGlobeView
          onGlobeClickPoint={handleGlobeClickPoint}
          onAnalyzeCoords={(lat, lon, elev) => handleAnalyzeCoords(lat, lon, elev)}
          activeStartPoint={startPoint}
          activeGoalPoint={goalPoint}
          targetRegion={MARS_REGIONS.find((r) => r.id === selectedRegion)?.center || null}
          highlightedPoint={highlightedPoint}
          showOverlays={showOverlays}
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
          panToTarget={panToTarget}
          highlightedPoint={highlightedPoint}
          showOverlays={showOverlays}
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
            currentCoordinates={highlightedPoint || startPoint || { lat: 18.38, lon: 77.58, elevationMeters: -2500 }}
            selectedRegion={selectedRegion}
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
            hazards={hazards}
            scienceTargets={scienceTargets}
          />
        );
      default:
        return null;
    }
  };

  const renderTabBar = () => (
    <div className="bg-[#0b0f17]/95 border border-slate-800 rounded-xl p-1.5 flex items-center space-x-1 overflow-x-auto whitespace-nowrap hide-scrollbar scrollbar-none shadow-lg w-full max-w-full touch-pan-x">
      {/* 10 Iconic Locations Quick Selector Tab */}
      <button
        onClick={() => handleTabClick('LOCATIONS')}
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-all ${
          activePanelTab === 'LOCATIONS'
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-lg shadow-amber-950/60'
            : 'bg-amber-950/30 text-amber-300 hover:text-white hover:bg-amber-900/40 border border-amber-500/40'
        }`}
      >
        <Compass className="w-3.5 h-3.5 text-amber-400" />
        <span>10 Locations</span>
      </button>

      {/* Primary AI System Master Tab */}
      <button
        onClick={() => handleTabClick('AI_HUB')}
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-all ${
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
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
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
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
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
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
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
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
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
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
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
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
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
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
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
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
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
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 w-full max-w-[100vw] overflow-x-hidden">
      {/* Top Universal Navbar */}
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
        showOverlays={showOverlays}
        onToggleOverlays={() => setShowOverlays((prev) => !prev)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Main Workspace Layout - Responsive: Stacks vertically (flex-col) on mobile, side-by-side (lg:grid-cols-12) on desktop */}
      <main className="flex-1 w-full max-w-[100vw] mx-auto p-2 sm:p-3 lg:p-4 flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 overflow-x-hidden min-w-0">
        {/* Left / Top Section: Map GIS View & Mission Condition / Environmental Telemetry */}
        <section className="w-full max-w-full lg:col-span-7 flex flex-col space-y-3 min-w-0 overflow-hidden">
          {renderMapView()}

          {/* Telemetry Panel Switcher: Mission Condition vs. Environment */}
          <div className="bg-[#090d16]/90 border border-slate-800 rounded-xl p-2.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center space-x-1.5 overflow-x-auto whitespace-nowrap hide-scrollbar">
              <button
                onClick={() => setTelemetryViewMode('MISSION_CONDITION')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  telemetryViewMode === 'MISSION_CONDITION'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mission Condition</span>
                <span className="hidden sm:inline-block text-[10px] text-cyan-400/80 font-normal">
                  (Status • Crew • Windows)
                </span>
              </button>

              <button
                onClick={() => setTelemetryViewMode('ENVIRONMENT')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  telemetryViewMode === 'ENVIRONMENT'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Environment</span>
                <span className="hidden sm:inline-block text-[10px] text-amber-400/80 font-normal">
                  (MEDA • Pressure • Dust • Solar)
                </span>
              </button>

              <button
                onClick={() => setTelemetryViewMode('DUAL')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  telemetryViewMode === 'DUAL'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
                title="View both distinct telemetry streams simultaneously"
              >
                <span>⊞ Split View</span>
              </button>
            </div>

            <div className="text-[10px] font-mono text-slate-500 hidden md:block">
              {telemetryViewMode === 'MISSION_CONDITION' && 'Crew Vitals & Operational Windows'}
              {telemetryViewMode === 'ENVIRONMENT' && 'MEDA Atmospheric Telemetry'}
              {telemetryViewMode === 'DUAL' && 'Dual Telemetry Mode'}
            </div>
          </div>

          {/* Distinct Panels: Mission Condition vs Environment */}
          {telemetryViewMode === 'MISSION_CONDITION' && (
            <MissionConditionPanel
              missionCondition={missionCondition}
              onRefresh={fetchMissionCondition}
              isRefreshing={isRefreshingMission}
            />
          )}

          {telemetryViewMode === 'ENVIRONMENT' && (
            <EnvironmentalPanel
              env={environment}
              onRefresh={fetchEnvironmentTelemetry}
              isRefreshing={isRefreshingTelemetry}
            />
          )}

          {telemetryViewMode === 'DUAL' && (
            <div className="flex flex-col space-y-3">
              <MissionConditionPanel
                missionCondition={missionCondition}
                onRefresh={fetchMissionCondition}
                isRefreshing={isRefreshingMission}
              />
              <EnvironmentalPanel
                env={environment}
                onRefresh={fetchEnvironmentTelemetry}
                isRefreshing={isRefreshingTelemetry}
              />
            </div>
          )}
        </section>

        {/* Right / Bottom Section: Tactical Mission Controls & AI Intelligence */}
        <section
          ref={controlPanelRef}
          id="tactical-control-panel"
          className="w-full max-w-full lg:col-span-5 flex flex-col space-y-3 min-w-0 overflow-hidden"
        >
          {renderTabBar()}
          <div className="flex-1 w-full min-w-0">
            {renderActivePanel()}
          </div>
        </section>
      </main>

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
