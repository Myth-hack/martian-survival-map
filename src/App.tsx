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
import { AISystemHub } from './components/AISystemHub';
import { TechSpecsModal } from './components/TechSpecsModal';
import { MissionImpactPanel } from './components/MissionImpactPanel';
import { LocationSelector } from './components/LocationSelector';
import { BasecampScanner } from './components/BasecampScanner';
import { GuidedHomepage } from './components/GuidedHomepage';
import { DeepSpaceGalaxyBackground } from './components/DeepSpaceGalaxyBackground';
import { NasaSurfaceOperationsStatus } from './components/NasaSurfaceOperationsStatus';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { useRealTimeVoice } from './hooks/useRealTimeVoice';
import { VoiceActionPayload } from './services/realTimeVoiceService';
import { useUser } from './context/UserContext';
import { generateMissionAdvice } from './services/geminiMissionAdvisor';

import {
  MapMode,
  UserRole,
  ExplorationSectionId,
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
  MARS_REGIONS,
  getRegionalHazards,
  getRegionalScienceTargets
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
  EyeOff,
  Radio,
  MapPin
} from 'lucide-react';

export default function App() {
  const { userId } = useUser();

  // Guided Exploration Platform Active Section State
  const [activeSection, setActiveSection] = useState<ExplorationSectionId>('HOME');

  const handleSelectSection = (sectionId: ExplorationSectionId) => {
    setActiveSection(sectionId);
    if (sectionId === 'REGIONS') {
      setActivePanelTab('LOCATIONS');
    } else if (sectionId === 'GEOLOGY') {
      setActivePanelTab('DEPTH_INSPECT');
    } else if (sectionId === 'PLANNING') {
      setActivePanelTab('WAYPOINTS');
    } else if (sectionId === 'SIMULATION') {
      setActivePanelTab('SEQUENCER');
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigation & Viewport State
  const [mapMode, setMapMode] = useState<MapMode>('2D');
  const [userRole, setUserRole] = useState<UserRole>('MISSION_CONTROL');
  const [selectedRegion, setSelectedRegion] = useState<MapRegionId>('jezero');
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
  const [activePanelTab, setActivePanelTab] = useState<string>('LOCATIONS');

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

  // Update regional hazards & science targets whenever selected region changes
  useEffect(() => {
    setHazards(getRegionalHazards(selectedRegion));
    setScienceTargets(getRegionalScienceTargets(selectedRegion));
  }, [selectedRegion]);

  // Calculate Routes whenever start, goal, weights, or selected region change (only if both start & goal are set)
  const refreshRoutes = useCallback(() => {
    if (!startPoint || !goalPoint) {
      setRoutes([]);
      return;
    }
    const computed = calculateParetoRoutes(startPoint, goalPoint, hazards, scienceTargets, routingWeights, selectedRegion);
    setRoutes(computed);
    if (!computed.find((r: RouteOption) => r.id === selectedRouteId)) {
      setSelectedRouteId(computed[0]?.id || 'route_balanced_a');
    }
  }, [startPoint, goalPoint, hazards, scienceTargets, routingWeights, selectedRouteId, selectedRegion]);

  useEffect(() => {
    if (startPoint && goalPoint) {
      refreshRoutes();
    } else {
      setRoutes([]);
    }
  }, [startPoint, goalPoint, hazards, scienceTargets, selectedRegion]);

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
          provenance: 'SIMULATED',
          rockType: 'Olivine-bearing Stratified Basaltic Siltstone',
          geologicalEra: 'Noachian-Hesperian Transition (~3.6 Ga)',
          mineralComposition: ['Smectite Clay', 'Mg-Rich Olivine', 'Plagioclase Feldspar', 'Fe-Oxides'],
          scientificSummary: `Simulated surface coordinates ${lat}°N, ${lon}°E expose fine-grained sedimentary beds with distinct planar laminations. High potential for organic matter preservation.`,
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
        provenance: 'SIMULATED',
        rockType: 'Lacustrine Delta Siltstone',
        geologicalEra: 'Late Noachian (~3.7 Ga)',
        mineralComposition: ['Smectite Clay', 'Carbonates'],
        scientificSummary: `Simulated sedimentary outcrop situated at elevation ${elevation}m within the delta distributary network.`,
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
      // Grounded NASA PDS procedural fallback response
      const fallbackMsg: AIAssistantMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        provenance: 'FALLBACK',
        status: 'FALLBACK',
        content: `Acknowledged. Based on Mars 2020 tactical telemetry and MOLA/HiRISE terrain models, the traverse through the current sector maintains nominal slope stability (<11° gradient). Avoid the southeastern Séítah dune margin where soft aeolian sands induce high wheel slippage (up to 34%).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidenceCitations: [
          {
            sourceName: 'NASA Mars 2020 Mission Plan',
            datasetType: 'HiRISE DTM',
            dataProductId: 'PDS_M2020_SOL1240_TRAVERSE'
          }
        ],
        explainableReasoning: {
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
        provenance: 'FALLBACK',
        status: 'FALLBACK',
        content: `[COPILOT DIRECTIVE]: BEARING 342° NOMINAL. SLOPE 8.4°. MAINTAIN 0.12 M/S SPEED ENVELOPE.\n\nTactical Copilot Audit: Traverse corridor across ${selectedRegion} maintains nominal slope stability (<11° gradient). Avoid southeastern Séítah dune margin to prevent high wheel slippage (>30%). All telemetry within safety envelopes.`,
        copilotDirective: 'BEARING 342° NOMINAL. SLOPE 8.4°. MAINTAIN 0.12 M/S SPEED ENVELOPE.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidenceCitations: [
          {
            sourceName: 'NASA Mars 2020 Mission Operations',
            datasetType: 'HiRISE DTM',
            dataProductId: 'PDS_M2020_SOL1240_COPILOT'
          }
        ],
        explainableReasoning: {
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
      // Airlock habitat coordinate for current selected region
      const activeLoc = MARS_REGIONS.find((r) => r.id === selectedRegion) || MARS_REGIONS[0];
      const airlockCoord: MarsCoordinates = {
        lat: activeLoc.center.lat,
        lon: activeLoc.center.lon,
        elevationMeters: activeLoc.center.elevationMeters,
        name: `${activeLoc.name} Base Airlock`
      };
      const originCoord = goalPoint || startPoint || airlockCoord;
      const emergencyRoute = calculateEmergencyReturnRoute(originCoord, airlockCoord, hazards, selectedRegion);
      setRoutes([emergencyRoute, ...routes]);
      setSelectedRouteId(emergencyRoute.id);
      setActiveSection('SIMULATION');
      setActivePanelTab('CRISIS');
    }
  };

  const closeVoiceRef = useRef<(() => void) | null>(null);

  // Unified ChatGPT-Style Real-Time Voice Assistant Action Handler
  const handleExecuteVoiceAction = useCallback(
    (payload: VoiceActionPayload) => {
      if (payload.action === 'EXIT_VOICE') {
        closeVoiceRef.current?.();
      } else if (payload.action === 'SET_REGION' && payload.regionId) {
        handleSelectLocation(payload.regionId);
      } else if (payload.action === 'SET_MAP_MODE' && payload.mapMode) {
        setMapMode(payload.mapMode);
      } else if (payload.action === 'SET_USER_ROLE' && payload.userRole) {
        setUserRole(payload.userRole);
      } else if (payload.action === 'SET_SECTION' && payload.sectionId) {
        handleSelectSection(payload.sectionId);
        if (payload.tabId) {
          setActivePanelTab(payload.tabId);
        }
      } else if (payload.action === 'SET_TAB' && payload.tabId) {
        setActivePanelTab(payload.tabId);
      } else if (payload.action === 'RECALCULATE_ROUTES') {
        refreshRoutes();
      } else if (payload.action === 'TRIGGER_EMERGENCY_ABORT') {
        handleTriggerEmergencyReturn();
      }
    },
    [handleSelectLocation, setMapMode, setUserRole, handleSelectSection, refreshRoutes, handleTriggerEmergencyReturn]
  );

  const realTimeVoice = useRealTimeVoice({
    selectedRegion,
    activeSection,
    activePanelTab,
    onExecuteAction: handleExecuteVoiceAction,
  });
  closeVoiceRef.current = realTimeVoice.closeVoiceAssistant;

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
    if (tabId === 'LOCATIONS') {
      setActiveSection('REGIONS');
      setActivePanelTab('LOCATIONS');
    } else if (tabId === 'LAYERS') {
      setActiveSection('REGIONS');
      setActivePanelTab('LAYERS');
    } else if (tabId === 'HAZARDS') {
      setActiveSection('GEOLOGY');
      setActivePanelTab('ANOMALIES');
    } else if (tabId === 'SCIENCE') {
      setActiveSection('GEOLOGY');
      setActivePanelTab('GEO_SCANNER');
    } else if (tabId === 'ROUTES') {
      setActiveSection('PLANNING');
      setActivePanelTab('A_STAR');
    } else if (tabId === 'AI_HUB' || tabId === 'AI_CHAT' || tabId === 'CONSENSUS') {
      setActiveSection('PLANNING');
      setActivePanelTab('AI_ADVISOR');
    } else if (tabId === 'MARSWALK') {
      setActiveSection('SIMULATION');
      setActivePanelTab('EVA_SIM');
    } else if (tabId === 'WHAT_IF') {
      setActiveSection('SIMULATION');
      setActivePanelTab('CRISIS');
    } else {
      setActivePanelTab(tabId);
    }

    if (tabId === 'CONSENSUS') {
      handleFetchSecondOpinion();
    }
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
      {/* HUD Toggle: When overlays are hidden, provide an unmissable floating restore pill */}
      {!showOverlays && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 pointer-events-auto animate-fadeIn">
          <button
            id="persistent-floating-toggle-overlays-btn"
            onClick={() => setShowOverlays(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-extrabold border flex items-center space-x-1.5 transition-all shadow-2xl backdrop-blur-md cursor-pointer bg-amber-950/95 border-amber-500 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:bg-amber-900"
            title="Restore UI Overlays [Press H]"
          >
            <EyeOff className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs text-amber-300 font-extrabold tracking-wider">SHOW UI (H)</span>
          </button>
        </div>
      )}

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
    // CARD 01: REGIONS & MAPS
    if (activeSection === 'REGIONS') {
      switch (activePanelTab) {
        case 'LOCATIONS':
          return (
            <LocationSelector
              selectedRegion={selectedRegion}
              onSelectLocation={(locId) => handleSelectLocation(locId)}
              onFlyToCoordinates={handleFlyToCoordinates}
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
        case 'BASECAMP':
          return (
            <BasecampScanner
              selectedRegion={selectedRegion}
              onSetBasecampLocation={(coords) => {
                setStartPoint(coords);
                setPanToTarget(coords);
              }}
              onFlyToCoordinates={handleFlyToCoordinates}
            />
          );
        default:
          return (
            <LocationSelector
              selectedRegion={selectedRegion}
              onSelectLocation={(locId) => handleSelectLocation(locId)}
              onFlyToCoordinates={handleFlyToCoordinates}
            />
          );
      }
    }

    // CARD 02: GEOLOGICAL INTELLIGENCE
    if (activeSection === 'GEOLOGY') {
      switch (activePanelTab) {
        case 'DEPTH_INSPECT':
          return (
            <div className="space-y-4 font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-cyan-300">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>ORBITAL SAR DEPTH INSPECT POINT</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  High-frequency SAR radar depth scanner querying elevation DTM matrices, crustal density, and subsurface bedrock layering across {MARS_REGIONS.find(r => r.id === selectedRegion)?.name}.
                </p>
              </div>
              <ScienceTargetFinder
                targets={scienceTargets}
                selectedTargetId={selectedTargetId}
                onSelectTarget={(t) => {
                  setSelectedTargetId(t.id);
                  handleAnalyzeCoords(t.coordinates.lat, t.coordinates.lon, t.coordinates.elevationMeters);
                }}
                inspectedAnalysis={inspectedAnalysis}
                isAnalyzing={isAnalyzingTarget}
                onAnalyzeCustomCoord={(c) => handleAnalyzeCoords(c.lat, c.lon, c.elevationMeters)}
                currentCoordinates={highlightedPoint || startPoint || { lat: 18.38, lon: 77.58, elevationMeters: -2500 }}
                selectedRegion={selectedRegion}
              />
            </div>
          );
        case 'GEO_SCANNER':
          return (
            <ScienceTargetFinder
              targets={scienceTargets}
              selectedTargetId={selectedTargetId}
              onSelectTarget={(t) => {
                setSelectedTargetId(t.id);
                handleAnalyzeCoords(t.coordinates.lat, t.coordinates.lon, t.coordinates.elevationMeters);
              }}
              inspectedAnalysis={inspectedAnalysis}
              isAnalyzing={isAnalyzingTarget}
              onAnalyzeCustomCoord={(c) => handleAnalyzeCoords(c.lat, c.lon, c.elevationMeters)}
              currentCoordinates={highlightedPoint || startPoint || { lat: 18.38, lon: 77.58, elevationMeters: -2500 }}
              selectedRegion={selectedRegion}
            />
          );
        case 'ANOMALIES':
          return (
            <HazardDetectionPanel
              hazards={hazards}
              selectedHazardId={selectedHazardId}
              onSelectHazard={(h) => setSelectedHazardId(h.id)}
              onTriggerHazardEvent={handleTriggerHazardEvent}
              isRerouting={isRerouting}
            />
          );
        case 'ASTROBIOLOGY':
          return (
            <ScienceTargetFinder
              targets={scienceTargets}
              selectedTargetId={selectedTargetId}
              onSelectTarget={(t) => {
                setSelectedTargetId(t.id);
                handleAnalyzeCoords(t.coordinates.lat, t.coordinates.lon, t.coordinates.elevationMeters);
              }}
              inspectedAnalysis={inspectedAnalysis}
              isAnalyzing={isAnalyzingTarget}
              onAnalyzeCustomCoord={(c) => handleAnalyzeCoords(c.lat, c.lon, c.elevationMeters)}
              currentCoordinates={highlightedPoint || startPoint || { lat: 18.38, lon: 77.58, elevationMeters: -2500 }}
              selectedRegion={selectedRegion}
            />
          );
        default:
          return (
            <ScienceTargetFinder
              targets={scienceTargets}
              selectedTargetId={selectedTargetId}
              onSelectTarget={(t) => {
                setSelectedTargetId(t.id);
                handleAnalyzeCoords(t.coordinates.lat, t.coordinates.lon, t.coordinates.elevationMeters);
              }}
              inspectedAnalysis={inspectedAnalysis}
              isAnalyzing={isAnalyzingTarget}
              onAnalyzeCustomCoord={(c) => handleAnalyzeCoords(c.lat, c.lon, c.elevationMeters)}
              currentCoordinates={highlightedPoint || startPoint || { lat: 18.38, lon: 77.58, elevationMeters: -2500 }}
              selectedRegion={selectedRegion}
            />
          );
      }
    }

    // CARD 03: PLAN YOUR MARSWALK
    if (activeSection === 'PLANNING') {
      switch (activePanelTab) {
        case 'WAYPOINTS':
        case 'A_STAR':
        case 'HEURISTICS':
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
              onAuditWithAI={() => setActivePanelTab('AI_ADVISOR')}
            />
          );
        case 'AI_ADVISOR':
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
                setActivePanelTab('A_STAR');
              }}
              isLoadingConsensus={isLoadingConsensus}
              onRefreshConsensus={handleFetchSecondOpinion}
            />
          );
        default:
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
              onAuditWithAI={() => setActivePanelTab('AI_ADVISOR')}
            />
          );
      }
    }

    // CARD 04: SIMULATE YOUR MISSION
    if (activeSection === 'SIMULATION') {
      switch (activePanelTab) {
        case 'SEQUENCER':
          return (
            <MissionConditionPanel
              missionCondition={missionCondition}
              onRefresh={fetchMissionCondition}
              isRefreshing={isRefreshingMission}
            />
          );
        case 'EVA_SIM':
          return (
            <MarswalkPlanner
              onTriggerEmergencyReturn={handleTriggerEmergencyReturn}
              isEmergencyReturnActive={isEmergencyReturnActive}
            />
          );
        case 'CRISIS':
          return (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 space-y-2 font-mono text-xs">
                <div className="flex items-center space-x-2 text-red-400 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>CRISIS SUPPORT & EMERGENCY ABORT PROTOCOL</span>
                </div>
                <p className="text-slate-300">
                  Instant calculation of direct safety-prioritized abort vector returning to active basecamp location.
                </p>
                <button
                  onClick={handleTriggerEmergencyReturn}
                  className={`w-full py-2.5 px-4 rounded-lg font-mono font-extrabold text-xs transition-all shadow-lg cursor-pointer ${
                    isEmergencyReturnActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  }`}
                >
                  {isEmergencyReturnActive ? 'ACTIVE ABORT VECTOR IN PROGRESS' : 'EXECUTE IMMEDIATE EMERGENCY ABORT ROUTE'}
                </button>
              </div>

              <WhatIfSimulator
                scenarios={scenarios}
                activeScenarioId={activeScenarioId}
                onToggleScenario={handleToggleScenario}
              />
            </div>
          );
        default:
          return (
            <MissionConditionPanel
              missionCondition={missionCondition}
              onRefresh={fetchMissionCondition}
              isRefreshing={isRefreshingMission}
            />
          );
      }
    }

    return null;
  };

  const renderTabBar = () => {
    if (activeSection === 'REGIONS') {
      return (
        <div className="space-glass rounded-xl p-1.5 flex items-center space-x-1.5 overflow-x-auto hide-scrollbar border border-cyan-500/20 w-full">
          <button
            onClick={() => setActivePanelTab('LOCATIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'LOCATIONS'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Zone Selector</span>
          </button>

          <button
            onClick={() => setActivePanelTab('LAYERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'LAYERS'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Altimetry Map</span>
          </button>

          <button
            onClick={() => setActivePanelTab('BASECAMP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'BASECAMP'
                ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Basecamp Scanner</span>
          </button>
        </div>
      );
    }

    if (activeSection === 'GEOLOGY') {
      return (
        <div className="space-glass rounded-xl p-1.5 flex items-center space-x-1.5 overflow-x-auto hide-scrollbar border border-cyan-500/20 w-full">
          <button
            onClick={() => setActivePanelTab('DEPTH_INSPECT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'DEPTH_INSPECT'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Depth Inspect</span>
          </button>

          <button
            onClick={() => setActivePanelTab('GEO_SCANNER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'GEO_SCANNER'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Geo-Scanner</span>
          </button>

          <button
            onClick={() => setActivePanelTab('ANOMALIES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'ANOMALIES'
                ? 'bg-red-500 text-white font-extrabold shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Anomalies</span>
          </button>

          <button
            onClick={() => setActivePanelTab('ASTROBIOLOGY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'ASTROBIOLOGY'
                ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Microscope className="w-3.5 h-3.5 text-emerald-400" />
            <span>Astrobiology</span>
          </button>
        </div>
      );
    }

    if (activeSection === 'PLANNING') {
      return (
        <div className="space-glass rounded-xl p-1.5 flex items-center space-x-1.5 overflow-x-auto hide-scrollbar border border-cyan-500/20 w-full">
          <button
            onClick={() => setActivePanelTab('WAYPOINTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'WAYPOINTS'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Waypoint Matrix</span>
          </button>

          <button
            onClick={() => setActivePanelTab('A_STAR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'A_STAR'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>A* Pathfinding</span>
          </button>

          <button
            onClick={() => setActivePanelTab('HEURISTICS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'HEURISTICS'
                ? 'bg-purple-500 text-white font-extrabold shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Hazard Heuristics</span>
          </button>

          <button
            onClick={() => setActivePanelTab('AI_ADVISOR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'AI_ADVISOR'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI Advisor</span>
          </button>
        </div>
      );
    }

    if (activeSection === 'SIMULATION') {
      return (
        <div className="space-glass rounded-xl p-1.5 flex items-center space-x-1.5 overflow-x-auto hide-scrollbar border border-cyan-500/20 w-full">
          <button
            onClick={() => setActivePanelTab('SEQUENCER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'SEQUENCER'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Mission Sequencer</span>
          </button>

          <button
            onClick={() => setActivePanelTab('EVA_SIM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'EVA_SIM'
                ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>EVA Simulation</span>
          </button>

          <button
            onClick={() => setActivePanelTab('CRISIS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              activePanelTab === 'CRISIS'
                ? 'bg-red-600 text-white font-extrabold shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Crisis Abort</span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 w-full max-w-[100vw] overflow-x-hidden">
      {/* Ambient Deep Space Galaxy Canvas Background */}
      <DeepSpaceGalaxyBackground />

      {/* Top Universal Navbar */}
      <Navbar
        userId={userId}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        mapMode={mapMode}
        setMapMode={setMapMode}
        userRole={userRole}
        setUserRole={setUserRole}
        selectedRegion={selectedRegion}
        setSelectedRegion={handleSelectLocation}
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
        onToggleVoiceAssistant={realTimeVoice.toggleVoiceAssistant}
        voiceOrbState={realTimeVoice.orbState}
      />

      {/* Guided Platform Section View: Homepage vs Section Workspace */}
      {activeSection === 'HOME' ? (
        <GuidedHomepage
          onSelectSection={handleSelectSection}
          onGlobeClickPoint={handleGlobeClickPoint}
          onAnalyzeCoords={handleAnalyzeCoords}
        />
      ) : (
        <div className="flex-1 flex flex-col space-y-2">
          {/* Section Header Banner with Back to Home */}
          <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-[#070d1e]/80 border border-cyan-500/30 backdrop-blur-md shadow-lg">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleSelectSection('HOME')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow cursor-pointer hover:bg-slate-800"
                >
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>← Back to Home</span>
                </button>

                <div>
                  <h2 className="font-['Orbitron'] text-base sm:text-lg font-extrabold text-white">
                    {activeSection === 'REGIONS' && '01. Explore Martian Regions & Maps'}
                    {activeSection === 'GEOLOGY' && '02. Explore Geological Intelligence'}
                    {activeSection === 'PLANNING' && '03. Plan Your Marswalk'}
                    {activeSection === 'SIMULATION' && '04. Simulate Your Mission'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono hidden md:block">
                    {activeSection === 'REGIONS' && 'Select from 10 Martian regions, explore the interactive Mars map, inspect elevation data, and identify potential basecamp locations.'}
                    {activeSection === 'GEOLOGY' && 'Investigate Martian terrain, geological formations, mineral information, elevation, and potential surface hazards.'}
                    {activeSection === 'PLANNING' && 'Select waypoints, analyze terrain conditions, generate alternative routes, and compare scientific value with exploration safety.'}
                    {activeSection === 'SIMULATION' && 'Organize your exploration timeline, estimate mission requirements, simulate Marswalk activities, and explore emergency scenarios.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-slate-400">Current Region:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold uppercase">
                  {MARS_REGIONS.find((r) => r.id === selectedRegion)?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Main Workspace Layout - Customized Dedicated Layouts per Exploration Card */}
          <main className="relative z-10 flex-1 w-full max-w-[100vw] mx-auto p-2 sm:p-3 lg:p-4 overflow-x-hidden min-w-0">
            {activeSection === 'REGIONS' && (
              /* CARD 01: REGIONS & MAPS - Altimetry & Basecamp Focus */
              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4">
                <section className="w-full lg:col-span-7 flex flex-col space-y-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-amber-400" />
                      FEATURE HIGHLIGHT: 10 MARTIAN REGIONS & ALTIMETRY DTM MAP
                    </span>
                    <span className="text-slate-400 text-[10px]">PDS / MOLA Data</span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-cyan-500/25 shadow-[0_0_30px_rgba(0,0,0,0.7)] backdrop-blur-sm">
                    {renderMapView()}
                  </div>
                  <EnvironmentalPanel
                    env={environment}
                    onRefresh={fetchEnvironmentTelemetry}
                    isRefreshing={isRefreshingTelemetry}
                  />
                </section>
                <section ref={controlPanelRef} id="tactical-control-panel" className="w-full lg:col-span-5 flex flex-col space-y-3 min-w-0">
                  <div className="p-3 rounded-xl bg-[#09152b] border border-cyan-500/30 font-mono text-xs text-cyan-300 font-bold">
                    ZONE SELECTOR, ALTIMETRY & BASECAMP SCANNER
                  </div>
                  {renderTabBar()}
                  <div className="flex-1 w-full min-w-0">
                    {renderActivePanel()}
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'GEOLOGY' && (
              /* CARD 02: GEOLOGICAL INTELLIGENCE - Orbital SAR Radar & Bio-Target Focus */
              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4">
                <section className="w-full lg:col-span-7 flex flex-col space-y-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-400/50 flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-cyan-300 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      FEATURE HIGHLIGHT: ORBITAL SAR RADAR DEPTH INSPECT & GEO-SCANNER
                    </span>
                    <span className="text-slate-400 text-[10px]">HiRISE / CRISM Subsurface Radar</span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                    <OrbitalIntelligenceView
                      onClose={() => setMapMode('2D')}
                      environment={environment}
                      initialTargetRegion={selectedRegion}
                      showOverlays={showOverlays}
                    />
                  </div>
                  <ScienceTargetFinder
                    targets={scienceTargets}
                    selectedTargetId={selectedTargetId}
                    onSelectTarget={(t) => {
                      setSelectedTargetId(t.id);
                      handleAnalyzeCoords(t.coordinates.lat, t.coordinates.lon, t.coordinates.elevationMeters);
                    }}
                    inspectedAnalysis={inspectedAnalysis}
                    isAnalyzing={isAnalyzingTarget}
                    onAnalyzeCustomCoord={(c) => handleAnalyzeCoords(c.lat, c.lon, c.elevationMeters)}
                    currentCoordinates={highlightedPoint || startPoint || { lat: 18.38, lon: 77.58, elevationMeters: -2500 }}
                    selectedRegion={selectedRegion}
                  />
                </section>
                <section ref={controlPanelRef} id="tactical-control-panel" className="w-full lg:col-span-5 flex flex-col space-y-3 min-w-0">
                  <div className="p-3 rounded-xl bg-[#09152b] border border-cyan-500/30 font-mono text-xs text-cyan-300 font-bold">
                    GEOLOGICAL INSPECTION, ANOMALIES & ASTROBIOLOGY
                  </div>
                  {renderTabBar()}
                  <div className="flex-1 w-full min-w-0">
                    {renderActivePanel()}
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'PLANNING' && (
              /* CARD 03: PLAN YOUR MARSWALK - Smart Route Planning (A*), Waypoints & Heuristics */
              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4">
                <section className="w-full lg:col-span-7 flex flex-col space-y-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/50 flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-purple-300 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-purple-400" />
                      FEATURE HIGHLIGHT: SMART ROUTE PLANNING (A*) & WAYPOINT MATRIX
                    </span>
                    <span className="text-slate-400 text-[10px]">Pareto Multi-Objective Engine</span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    {renderMapView()}
                  </div>
                  <RoutePlannerPanel
                    routes={routes}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={setSelectedRouteId}
                    weights={routingWeights}
                    onChangeWeights={(w) => setRoutingWeights((prev) => ({ ...prev, ...w }))}
                    onRecalculateRoutes={refreshRoutes}
                    startPoint={startPoint}
                    goalPoint={goalPoint}
                    onAuditWithAI={() => setActivePanelTab('AI_ADVISOR')}
                  />
                </section>
                <section ref={controlPanelRef} id="tactical-control-panel" className="w-full lg:col-span-5 flex flex-col space-y-3 min-w-0">
                  <div className="p-3 rounded-xl bg-[#09152b] border border-purple-500/30 font-mono text-xs text-purple-300 font-bold">
                    WAYPOINT MATRIX, HEURISTICS & EXPLAINABLE AI ADVISOR
                  </div>
                  {renderTabBar()}
                  <div className="flex-1 w-full min-w-0">
                    {renderActivePanel()}
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'SIMULATION' && (
              /* CARD 04: SIMULATE YOUR MISSION - Mission Sequencer, EVA Suit Sim & Crisis Support */
              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4">
                <section className="w-full lg:col-span-6 flex flex-col space-y-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-emerald-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      FEATURE HIGHLIGHT: MISSION SEQUENCER & EVA SUIT TELEMETRY SIMULATOR
                    </span>
                    <span className="text-slate-400 text-[10px]">Real-Time Sol Telemetry</span>
                  </div>
                  <MarswalkPlanner
                    onTriggerEmergencyReturn={handleTriggerEmergencyReturn}
                    isEmergencyReturnActive={isEmergencyReturnActive}
                  />
                  <MissionConditionPanel
                    missionCondition={missionCondition}
                    onRefresh={fetchMissionCondition}
                    isRefreshing={isRefreshingMission}
                  />
                </section>
                <section ref={controlPanelRef} id="tactical-control-panel" className="w-full lg:col-span-6 flex flex-col space-y-3 min-w-0">
                  <div className="p-3 rounded-xl bg-[#09152b] border border-red-500/40 font-mono text-xs text-red-300 font-bold flex items-center justify-between">
                    <span>CRISIS SUPPORT, EMERGENCY ABORT & WHAT-IF CONTINGENCIES</span>
                    <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                  </div>
                  {renderTabBar()}
                  <div className="flex-1 w-full min-w-0">
                    {renderActivePanel()}
                  </div>
                </section>
              </div>
            )}
          </main>

          {/* Shared NASA Mars Surface Operations & Status Section (Identical across all topic pages) */}
          <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 pb-4">
            <NasaSurfaceOperationsStatus
              env={environment}
              missionCondition={missionCondition}
              selectedRegion={selectedRegion}
              onRefreshTelemetry={fetchEnvironmentTelemetry}
              isRefreshing={isRefreshingTelemetry}
            />
          </div>
        </div>
      )}

      {/* Persistent Floating ARES Voice Assistant Trigger (Ensures 100% visibility on web/desktop & mobile) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={realTimeVoice.toggleVoiceAssistant}
          className="group relative px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-emerald-600 to-cyan-500 hover:from-cyan-500 hover:to-emerald-400 text-slate-950 font-mono font-extrabold text-xs sm:text-sm shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_40px_rgba(6,182,212,0.8)] transition-all duration-300 flex items-center space-x-2.5 cursor-pointer border border-cyan-200 hover:scale-105 active:scale-95"
          title="Open ARES Real-Time Voice Assistant (ChatGPT Voice)"
        >
          <span className="w-3 h-3 rounded-full bg-white animate-ping shrink-0" />
          <span className="tracking-wider">ARES VOICE AI</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 text-cyan-300 font-bold border border-cyan-400/40">
            LIVE
          </span>
        </button>
      </div>

      {/* Unified ChatGPT-Level Real-Time Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={realTimeVoice.isOpen}
        onClose={realTimeVoice.closeVoiceAssistant}
        orbState={realTimeVoice.orbState}
        audioLevel={realTimeVoice.audioLevel}
        activePersona={realTimeVoice.activePersona}
        onSelectPersona={realTimeVoice.handleSelectPersona}
        transcripts={realTimeVoice.transcripts}
        onClearTranscripts={realTimeVoice.clearTranscripts}
        errorMsg={realTimeVoice.errorMsg}
        connectionMode={realTimeVoice.connectionMode}
        isMuted={realTimeVoice.isMuted}
        isPlaybackBlocked={realTimeVoice.isPlaybackBlocked}
        onUnlockPlayback={realTimeVoice.unlockPlayback}
        onToggleMute={realTimeVoice.toggleMute}
        onRetryMic={realTimeVoice.retryMicrophone}
        onInterrupt={realTimeVoice.handleInterrupt}
        onSpeakSample={realTimeVoice.handleSpeakSample}
        previousLocationLabel={
          activeSection === 'HOME'
            ? 'Home'
            : activeSection === 'REGIONS'
            ? '01. Regions & Maps'
            : activeSection === 'GEOLOGY'
            ? '02. Geological Intelligence'
            : activeSection === 'PLANNING'
            ? '03. Plan Marswalk'
            : '04. Simulate Mission'
        }
      />

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
