/**
 * Interplanetary Survival Guide: Martian Map
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Core TypeScript Data Types & Interfaces
 */

export type MapMode = '2D' | '3D' | 'ORBITAL';
export type UserRole = 'MISSION_CONTROL' | 'ASTRONAUT_HUD';
export type MapRegionId =
  | 'jezero'
  | 'gale'
  | 'valles_marineris'
  | 'olympus_mons'
  | 'planum_boreum'
  | 'hellas_planitia'
  | 'elysium_planitia'
  | 'meridiani_planum'
  | 'noctis_labyrinthus'
  | 'acidalia_planitia';

export interface MarsCoordinates {
  lat: number; // Decimal degrees (-90 to +90)
  lon: number; // Decimal degrees (-180 to +180 or 0 to 360)
  elevationMeters: number; // MOLA datum
  name?: string;
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  evidenceCitations?: {
    sourceName: string;
    datasetType: string;
    dataProductId: string;
    confidence: number;
  }[];
  explainableReasoning?: {
    confidenceScore: number;
    decisionFactors: string[];
    alternativesConsidered: string;
  };
}

export interface MapLayerConfig {
  id: string;
  name: string;
  category: 'topography' | 'science' | 'hazards' | 'rover' | 'resources' | 'environment';
  description: string;
  nasaSource: string;
  enabled: boolean;
  opacity: number;
  colorMap?: string;
  badge?: string;
}

export interface RoverTraversePoint {
  sol: number;
  lat: number;
  lon: number;
  elevation: number;
  siteName: string;
  dateStr: string;
  samplesCollected?: string[];
  instrumentsUsed?: string[];
  hazardIndex?: number; // 0 to 1
}

export interface RoverMission {
  id: 'perseverance' | 'curiosity';
  name: string;
  landingSite: string;
  landingDate: string;
  currentSol: number;
  totalDistanceKm: number;
  samplesCored: number;
  status: 'ACTIVE_EXPLORING' | 'SAMPLE_CACHE' | 'TRAVERSING';
  trail: RoverTraversePoint[];
}

export interface MarsHabitationSuitabilityZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // radius in degrees for spatial zone representation
  status: 'green' | 'yellow' | 'red';
  suitabilityScore: number; // 0 to 100%
  elevationMeters: number;
  slopeDeg: number;
  radiationLevel: 'LOW' | 'MODERATE' | 'EXTREME';
  terrain: string;
  summary: string;
  isruPotential: 'EXCELLENT' | 'FAIR' | 'POOR';
}

export interface HazardZone {
  id: string;
  title: string;
  type: 'STEEP_SLOPE' | 'DUNE_FIELD' | 'BOULDER_CLUSTER' | 'CRATER_RIM' | 'THERMAL_ANOMALY';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  center: MarsCoordinates;
  radiusMeters: number;
  maxSlopeDeg: number;
  roughnessIndex: number; // 0 to 1
  description: string;
  mitigationAdvice: string;
  detectedBy: string; // e.g., 'HiRISE Digital Terrain Model (DTM)'
}

export interface ScienceTarget {
  id: string;
  name: string;
  type: 'FLUVIAL_DELTA' | 'PHYLLOSILICATE_CLAY' | 'CARBONATE_UNIT' | 'SILICA_DEPOSIT' | 'HYDROTHERMAL_VENT';
  tier: 1 | 2 | 3; // Tier 1: Highest Astrobiological Priority
  coordinates: MarsCoordinates;
  scienceValueScore: number; // 0 - 100
  potentialBiosignature: string;
  crismSpectralSignature: string;
  investigationStatus: 'PENDING' | 'ANALYZED' | 'SAMPLED';
  description: string;
}

export interface PlannedWaypoint {
  id: string;
  label: string;
  coordinates: MarsCoordinates;
  estTimeMinutes: number;
  scienceStopMinutes: number;
  targetId?: string;
}

export interface RouteOption {
  id: string;
  name: string;
  algorithm: 'A*' | 'Dijkstra' | 'Pareto-MultiObjective';
  description: string;
  distanceKm: number;
  elevationChangeMeters: number;
  maxSlopeDeg: number;
  avgSlopeDeg: number;
  terrainRiskScore: number; // 0 to 100 (lower is safer)
  scienceValueScore: number; // 0 to 100 (higher is better)
  estTraverseHours: number;
  powerConsumptionWh: number;
  evaOxygenReserveCostPct: number;
  evaOxygenRemainingPct?: number;
  isOxygenFatal?: boolean;
  color: string;
  pathPoints: MarsCoordinates[];
  pros: string[];
  cons: string[];
}

export interface MarswalkConsumables {
  totalDurationHours: number;
  elapsedMinutes: number;
  oxygenRemainingPct: number;
  batteryRemainingPct: number;
  coolingWaterRemainingPct: number;
  co2ScrubberCapacityPct: number;
  metabolicRateWatts: number;
  heartRateBpm: number;
  suitPressureKPa: number;
  ambientTempC: number;
}

export interface WhatIfScenario {
  id: string;
  title: string;
  category: 'ROUTE_BLOCKED' | 'DUST_STORM' | 'BIOSIGNATURE_DIV' | 'SUIT_LEAK' | 'ROVER_ACTUATOR_FAULT';
  severity: 'WARNING' | 'CRITICAL' | 'OPPORTUNITY';
  triggerPrompt: string;
  impactSummary: string;
  aiSuggestedAction: string;
  active: boolean;
}

export interface AgentPerspective {
  agentName: string;
  agentRole: 'Route Planner AI' | 'Safety Officer AI' | 'Science Lead AI';
  avatar: string;
  score: number; // 0 - 100
  verdict: 'APPROVE' | 'CAUTION' | 'REJECT';
  summary: string;
  keyArguments: string[];
  tradeOffMetric: { label: string; value: string };
}

export interface SecondOpinionConsensus {
  consensusScore: number; // 0 - 100
  recommendedRouteId: string;
  humanCommanderActionRequired: boolean;
  perspectives: AgentPerspective[];
  tradeOffMatrix: {
    criteria: string;
    routeA: number;
    routeB: number;
    routeC: number;
  }[];
}

export interface RagDocumentRef {
  sourceTitle: string;
  pdsProductDoc: string;
  doiOrUrl: string;
  confidencePct: number;
  relevanceSnippet: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'astronaut' | 'mission_control' | 'ai_commander' | 'ai_safety' | 'ai_science';
  senderLabel: string;
  timestamp: string;
  text: string;
  groundingSources?: RagDocumentRef[];
  confidenceScore?: number;
  suggestedAction?: string;
  actionPayload?: any;
}

export interface MarsEnvironmentData {
  solNumber: number;
  solarLongLs: number; // Season
  surfaceTempC: { min: number; max: number; current: number };
  atmosphericPressurePa: number;
  opticalDepthTau: number; // Dust opacity
  windSpeedMps: number;
  windDirection: string;
  radiationDoseRateMSvPerSol: number;
  solarIrradianceWm2: number;
  subsurfaceIceProbPct: number;
  earthMarsDistanceMillionKm: number;
  commsDelayMinutes: number;
  // Detailed MEDA & sensor fields
  pressureTrend?: 'STEADY' | 'RISING' | 'FALLING';
  pressureRangePa?: { min: number; max: number };
  windGustMps?: number;
  groundTempC?: number;
  dustStormStatus?: 'CLEAR' | 'MODERATE_HAZE' | 'REGIONAL_STORM' | 'GLOBAL_EVENT';
  solarPanelLossPct?: number;
  gcrFluxParticles?: string;
  solarParticleRisk?: 'NOMINAL' | 'ELEVATED' | 'HIGH';
}

export interface CrewMemberReadiness {
  id: string;
  name: string;
  role: string;
  readinessScorePct: number;
  biometricStatus: 'NOMINAL' | 'ELEVATED_HEART_RATE' | 'FATIGUE_WARNING' | 'O2_OPTIMAL';
  heartRateBpm: number;
  suitPressureKPa: number;
  coreTempC: number;
  hoursOnDuty: number;
  evaCertified: boolean;
}

export interface OperationalWindow {
  id: string;
  type: 'EVA_TRAVERSE' | 'SOLAR_RECHARGE' | 'ORBITAL_COMMS_PASS' | 'DRILL_SAMPLING' | 'HAB_LIFE_SUPPORT';
  title: string;
  windowStartLmts: string;
  windowEndLmts: string;
  durationMinutes: number;
  status: 'OPEN' | 'UPCOMING' | 'CONSTRAINED' | 'CLOSED';
  optimalScorePct: number;
  primaryConstraint: string;
  recommendedAction: string;
}

export interface MarsMissionConditionData {
  missionId: string;
  missionName: string;
  solNumber: number;
  currentPhase: 'SURFACE_SURVEY' | 'BASE_HABITAT_SETUP' | 'ISRU_DRILLING' | 'CONTINGENCY_HOLD';
  missionStatus: {
    state: 'NOMINAL' | 'CAUTION' | 'RESTRICTED' | 'STANDBY';
    headline: string;
    details: string;
    solProgressPct: number;
    flightDirectorApproval: boolean;
    abortThresholdMarginPct: number;
    autonomousControlActive: boolean;
    activePriorityVector: string;
    activeChecklistCompleted: number;
    activeChecklistTotal: number;
  };
  crewReadiness: {
    overallReadinessPct: number;
    evaStatus: 'GO_FOR_EVA' | 'EVA_RESTRICTED' | 'STANDBY_INGRESS';
    activeCrewCount: number;
    averageFatigueIndex: number; // 0-100 (lower is better)
    suitIntegrityPct: number;
    lifeSupportReserveHours: number;
    crewMembers: CrewMemberReadiness[];
  };
  operationalWindows: OperationalWindow[];
  selectedOptionFilter?: 'ALL' | 'EVA' | 'COMMS' | 'POWER' | 'DRILL';
  lastUpdated: string;
}

export interface AIRouteAnalysis {
  routeId: string;
  safetyRating: number;
  energyEfficiencyScore: number;
  scienceOpportunityScore: number;
  verdict: 'APPROVED_FOR_TRAVERSE' | 'CAUTION_PROCEED_WITH_SENSORS' | 'REVISE_VECTOR';
  summary: string;
  terrainHazardAnalysis: string;
  wheelSlipAssessment: string;
  tacticalDirectives: string[];
  waypointRecommendations: string[];
}

export interface AIContingencyPlan {
  crisisTitle: string;
  immediateProtocol: 'IMMEDIATE_ABORT' | 'STABILIZE_AND_HOLD' | 'AUTONOMOUS_REROUTE' | 'SHELTER_IN_PLACE';
  timeToCriticalMinutes: number;
  stepByStepActions: string[];
  rerouteVectorAdvice: string;
  consumablesBurnRateMultiplier: number;
  pdsScientificBasis: string;
}

export interface AISystemStatusData {
  status: 'ONLINE' | 'AUTONOMOUS_LOCAL';
  engine: string;
  model: string;
  activeSpecialists: string[];
  ragKnowledgeBases: string[];
  latencyMs: number;
  safetyGuardrails: string[];
}
