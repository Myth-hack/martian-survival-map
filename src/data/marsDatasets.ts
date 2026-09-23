/**
 * Authentic NASA Mission Data & Planetary GIS Catalogs
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Datasets: MOLA (Mars Orbiter Laser Altimeter), HiRISE, CRISM, THEMIS, SHARAD, Mars 2020 & MSL
 */

import {
  MapLayerConfig,
  RoverMission,
  HazardZone,
  ScienceTarget,
  MarsEnvironmentData,
  MarsMissionConditionData,
  WhatIfScenario,
  RagDocumentRef,
  MarsHabitationSuitabilityZone
} from '../types';

export const MARS_REGIONS = [
  {
    id: 'jezero' as const,
    name: 'Jezero Crater (Perseverance Site)',
    center: { lat: 18.38, lon: 77.58, elevationMeters: -2500 },
    bounds: { minLat: 18.15, maxLat: 18.60, minLon: 77.20, maxLon: 77.95 },
    zoom: 12,
    description: 'Ancient paleolake delta system with preserved lacustrine sediments and clay-carbonate mineral signatures.',
    landingRover: 'Perseverance Rover & Ingenuity Helicopter',
    primaryScience: 'Delta fan biosignatures, olivine-carbonate lithologies, mudstones, crater rim ancient crust',
    significance: 'Preserved lacustrine delta with optimal biosignature preservation potential and sample return depot.'
  },
  {
    id: 'gale' as const,
    name: 'Gale Crater (MSL Curiosity Site)',
    center: { lat: -5.4, lon: 137.8, elevationMeters: -4450 },
    bounds: { minLat: -5.85, maxLat: -4.95, minLon: 137.35, maxLon: 138.25 },
    zoom: 11,
    description: '154 km diameter impact crater with 5.5 km central sedimentary mound (Aeolis Mons) detailing aqueous transition history.',
    landingRover: 'Curiosity Rover (MSL)',
    primaryScience: 'Fluvio-lacustrine mudstones, hematite-rich Vera Rubin ridge, sulfate transition units',
    significance: 'Long-term fluvio-lacustrine sedimentary record proving sustained past habitability.'
  },
  {
    id: 'valles_marineris' as const,
    name: 'Valles Marineris (Grand Canyon)',
    center: { lat: -13.9, lon: -59.2, elevationMeters: -3800 },
    bounds: { minLat: -17.5, maxLat: -10.0, minLon: -66.0, maxLon: -52.0 },
    zoom: 6,
    description: 'Grand canyon system extending over 4,000 km, showcasing 7 km deep stratigraphy and massive interior layered deposits.',
    landingRover: 'Orbital Reconnaissance Target (Human Exploration Zone)',
    primaryScience: 'Layered sulfate deposits, recurring slope lineae (RSL), deep crustal tectonic exposures',
    significance: 'Deepest stratigraphic section on Mars revealing billions of years of crustal planetary evolution.'
  },
  {
    id: 'olympus_mons' as const,
    name: 'Olympus Mons (Shield Volcano)',
    center: { lat: 18.65, lon: -133.8, elevationMeters: 21287 },
    bounds: { minLat: 15.0, maxLat: 22.5, minLon: -140.0, maxLon: -127.5 },
    zoom: 5,
    description: 'Largest volcano in the solar system, standing 21.9 km above datum with an 80 km wide caldera complex.',
    landingRover: 'Orbital High-Altitude Monitoring (ISRU Lava Tube Candidate)',
    primaryScience: 'Tharsis shield volcanism, young basalt flows, lava tube shelters for human habitats',
    significance: 'Solar system’s largest shield volcano featuring intact lava tube conduits for radiation-shielded habitats.'
  },
  {
    id: 'planum_boreum' as const,
    name: 'Planum Boreum (North Polar Ice Cap)',
    center: { lat: 88.0, lon: 0.0, elevationMeters: -1950 },
    bounds: { minLat: 82.0, maxLat: 90.0, minLon: -180.0, maxLon: 180.0 },
    zoom: 5,
    description: 'Massive polar ice dome composed of water ice and seasonal frozen carbon dioxide layered deposits (NPLD).',
    landingRover: 'Orbital Radar Sounding (SHARAD / Mars Express MARSIS)',
    primaryScience: 'Layered water-ice cryosphere, atmospheric volatile cycling, paleoclimate orbital pacing',
    significance: 'Critical planetary water-ice reservoir and primary ISRU resource for long-term human survival.'
  },
  {
    id: 'hellas_planitia' as const,
    name: 'Hellas Planitia (Impact Basin)',
    center: { lat: -42.4, lon: 70.5, elevationMeters: -7152 },
    bounds: { minLat: -47.0, maxLat: -37.5, minLon: 64.0, maxLon: 77.0 },
    zoom: 5,
    description: 'Enormous 2,300 km diameter impact basin; lowest elevation and highest atmospheric pressure on Mars (~1240 Pa).',
    landingRover: 'Orbital Radar Deep Sounding & Atmospheric Probe Candidate',
    primaryScience: 'Glacial debris aprons, honeycomb terrain, dense atmospheric column physics, liquid water stability',
    significance: 'Highest atmospheric pressure on Mars, maximizing natural radiation protection and liquid water stability windows.'
  },
  {
    id: 'elysium_planitia' as const,
    name: 'Elysium Planitia (InSight Seismology)',
    center: { lat: 3.0, lon: 154.7, elevationMeters: -2610 },
    bounds: { minLat: 1.0, maxLat: 5.0, minLon: 152.0, maxLon: 157.5 },
    zoom: 9,
    description: 'Smooth volcanic plain hosting the NASA InSight seismological and heat-flow geophysical observatory.',
    landingRover: 'NASA InSight Lander (SEIS Geophysical Suite)',
    primaryScience: 'Marsquake seismology, core-mantle boundary depth, Cerberus Fossae recent volcanic rifting',
    significance: 'Geophysical reference baseline determining Mars crustal thickness, mantle rheology, and active marsquakes.'
  },
  {
    id: 'meridiani_planum' as const,
    name: 'Meridiani Planum (Opportunity Site)',
    center: { lat: -0.2, lon: 357.5, elevationMeters: -1420 },
    bounds: { minLat: -1.5, maxLat: 1.1, minLon: 355.5, maxLon: 359.5 },
    zoom: 10,
    description: 'Equatorial plain famous for the discovery of hematite blueberries and sulfate evaporite dunes.',
    landingRover: 'Opportunity Rover (MER-B)',
    primaryScience: 'Hematite spherules (blueberries), jarosite evaporite rocks, Victoria & Endeavour crater rims',
    significance: 'Ground zero for the historic confirmation of past acidic groundwater activity on the Martian equator.'
  },
  {
    id: 'noctis_labyrinthus' as const,
    name: 'Noctis Labyrinthus (Swarm Rescue Zone)',
    center: { lat: -7.0, lon: -102.2, elevationMeters: 1100 },
    bounds: { minLat: -9.5, maxLat: -4.5, minLon: -106.0, maxLon: -98.0 },
    zoom: 7,
    description: 'Intricate network of deep, intersecting grabens and pit-chain valleys at the western head of Valles Marineris.',
    landingRover: 'Autonomous UAV Swarm Reconnaissance Zone Candidate',
    primaryScience: 'Complex graben faulting, collapsed volcanic vents, hydrated sulfates, trapped fog microclimates',
    significance: 'High-risk maze topography selected for autonomous robotic swarm search-and-rescue navigation drills.'
  },
  {
    id: 'acidalia_planitia' as const,
    name: 'Acidalia Planitia (The Martian Site)',
    center: { lat: 49.8, lon: 339.3, elevationMeters: -4120 },
    bounds: { minLat: 46.5, maxLat: 53.0, minLon: 334.0, maxLon: 345.0 },
    zoom: 7,
    description: 'Vast northern lowland plain characterized by ancient sedimentary outflow channels, mud volcanoes, and smooth terrain.',
    landingRover: 'Pathfinder/Sojourner peripheral boundary (Ares Vallis) & Ares III Mission Hub',
    primaryScience: 'Subsurface permafrost, sedimentary sheet flows, mud volcanism, high relevance for surface survival protocols',
    significance: 'High relevance for surface survival protocols, flat landing corridors, and extensive subsurface water-ice table.'
  }
];

export const INITIAL_MAP_LAYERS: MapLayerConfig[] = [
  {
    id: 'mola_elevation',
    name: 'MOLA Digital Elevation Model',
    category: 'topography',
    description: 'Mars Orbiter Laser Altimeter 128 pixels/degree topographic elevation gradient with color hypsometry.',
    nasaSource: 'MGS MOLA MEGDR - PDS Geosciences Node',
    enabled: true,
    opacity: 0.85,
    badge: 'Baseline DEM'
  },
  {
    id: 'slope_analysis',
    name: 'Slope & Gradient Hazard Map',
    category: 'hazards',
    description: 'Calculated surface incline. Green: safe (<10°), Amber: caution (10-15°), Red: rover overturn/slip hazard (>15°).',
    nasaSource: 'HiRISE DTM Derivative Slopes (1m/px resolution)',
    enabled: true,
    opacity: 0.70,
    badge: 'Critical Safety'
  },
  {
    id: 'terrain_roughness',
    name: 'Terrain Roughness & Boulders',
    category: 'hazards',
    description: 'Sub-meter surface fractal roughness and boulder distribution index derived from HiRISE photometric stereo.',
    nasaSource: 'MRO HiRISE + Perseverance Navcam Ground Truth',
    enabled: false,
    opacity: 0.65,
    badge: 'Wheel Wear'
  },
  {
    id: 'crater_layer',
    name: 'Impact Craters & Ejecta Rims',
    category: 'hazards',
    description: 'Cataloged impact structures, rim crest lineaments, and rocky ejecta blankets with steep internal scarps.',
    nasaSource: 'Robbins Mars Crater Database v1.2',
    enabled: true,
    opacity: 0.80,
    badge: 'Morphology'
  },
  {
    id: 'hirise_imagery',
    name: 'HiRISE Ultra-High-Res Imagery',
    category: 'science',
    description: '0.25 meter/pixel visible imagery showing meter-scale sand dunes, sedimentary layering, and bedrock outcrops.',
    nasaSource: 'MRO HiRISE PDS Data Products (PSP & ESP series)',
    enabled: true,
    opacity: 0.90,
    badge: '25cm/px'
  },
  {
    id: 'ctx_mosaic',
    name: 'CTX Context Camera Mosaic',
    category: 'science',
    description: '6 meters/pixel panchromatic regional basemap bridging orbital context with localized high-resolution targets.',
    nasaSource: 'MRO CTX Global Mosaic (Murray Lab / Caltech)',
    enabled: false,
    opacity: 0.75,
    badge: '6m/px'
  },
  {
    id: 'themis_thermal',
    name: 'THEMIS Thermal Inertia',
    category: 'science',
    description: 'Nighttime infrared thermal inertia; differentiates loose fine dust (low inertia) from exposed bedrock/duricrust (high inertia).',
    nasaSource: '2001 Mars Odyssey THEMIS Infrared System',
    enabled: false,
    opacity: 0.70,
    badge: 'Thermal IR'
  },
  {
    id: 'crism_minerals',
    name: 'CRISM Hyperspectral Mineralogy',
    category: 'science',
    description: 'Visible/Near-Infrared spectral absorption bands mapping Fe/Mg smectite clays, carbonates, sulfates, and olivine.',
    nasaSource: 'MRO CRISM Targeted Reduced Data Record (TRDR)',
    enabled: true,
    opacity: 0.75,
    badge: 'Astrobiology'
  },
  {
    id: 'water_ice_sharad',
    name: 'Subsurface Ice & SHARAD Radar',
    category: 'resources',
    description: 'Shallow Radar (SHARAD) dielectric permittivity anomalies indicating buried glacial ice sheets and permafrost.',
    nasaSource: 'MRO SHARAD / Mars Subsurface Water Ice Mapping (SWIM)',
    enabled: false,
    opacity: 0.75,
    badge: 'ISRU Fuel & H2O'
  },
  {
    id: 'rover_traverses',
    name: 'Rover Locations & Traverse Trails',
    category: 'rover',
    description: 'Actual drive telemetry, waypoint stops, and drill sample locations for Perseverance and Curiosity rovers.',
    nasaSource: 'NASA/JPL-Caltech Mars 2020 & MSL Telemetry Feeds',
    enabled: true,
    opacity: 0.95,
    badge: 'Live Traverses'
  },
  {
    id: 'environmental_dust_wind',
    name: 'Environmental Dust & Wind Field',
    category: 'environment',
    description: 'Simulated atmospheric optical depth (Tau), thermal diurnal fluxes, and wind vector streamlines at rover height.',
    nasaSource: 'MEDA (Mars 2020) & REMS (MSL) Weather Stations',
    enabled: false,
    opacity: 0.65,
    badge: 'Sol Weather'
  },
  {
    id: 'habitation_suitability',
    name: 'Mars Habitation Suitability Map',
    category: 'resources',
    description: 'Tri-color landing & habitation assessment. Green: prime flat terrain, Yellow: moderate caution/slopes, Red: extreme danger no-go (radiation, volcanic peaks).',
    nasaSource: 'NASA Human Exploration & Operations Mission Directorate (HEOMD) Landing Site Consensus',
    enabled: true,
    opacity: 0.85,
    badge: 'Human Base'
  }
];

export const PERSEVERANCE_MISSION: RoverMission = {
  id: 'perseverance',
  name: 'Perseverance (Mars 2020)',
  landingSite: 'Octavia E. Butler Landing, Jezero Crater',
  landingDate: 'February 18, 2021',
  currentSol: 1240,
  totalDistanceKm: 29.84,
  samplesCored: 24,
  status: 'ACTIVE_EXPLORING',
  trail: [
    { sol: 0, lat: 18.4447, lon: 77.4508, elevation: -2570, siteName: 'Octavia E. Butler Landing', dateStr: '2021-02-18', samplesCollected: [], instrumentsUsed: ['Mastcam-Z', 'MEDA'] },
    { sol: 120, lat: 18.4350, lon: 77.4420, elevation: -2575, siteName: 'Séítah Dune Margin', dateStr: '2021-06-20', samplesCollected: ['Roubion'], instrumentsUsed: ['PIXL', 'SHERLOC'] },
    { sol: 280, lat: 18.4280, lon: 77.4320, elevation: -2560, siteName: 'South Séítah Outcrop', dateStr: '2021-12-05', samplesCollected: ['Salette', 'Coulettes'], instrumentsUsed: ['SuperCam', 'RIMFAX'] },
    { sol: 410, lat: 18.4550, lon: 77.4050, elevation: -2535, siteName: 'Three Forks Delta Staging', dateStr: '2022-04-18', samplesCollected: [], instrumentsUsed: ['Mastcam-Z', 'Navcam'] },
    { sol: 654, lat: 18.4680, lon: 77.3880, elevation: -2510, siteName: 'Amalik Delta Front Outcrop', dateStr: '2022-12-23', samplesCollected: ['Mageik', 'Kukaklek'], instrumentsUsed: ['SHERLOC', 'PIXL'] },
    { sol: 830, lat: 18.4890, lon: 77.3710, elevation: -2475, siteName: 'Margin Unit - Carbonates', dateStr: '2023-06-25', samplesCollected: ['Pelican Point'], instrumentsUsed: ['SuperCam', 'PIXL'] },
    { sol: 1040, lat: 18.5120, lon: 77.3520, elevation: -2430, siteName: 'Neretva Vallis Inflow Channel', dateStr: '2024-01-20', samplesCollected: ['Bright Angel'], instrumentsUsed: ['SHERLOC', 'PIXL', 'RIMFAX'] },
    { sol: 1240, lat: 18.5290, lon: 77.3380, elevation: -2380, siteName: 'Jezero Crater Rim Crest', dateStr: '2024-09-15', samplesCollected: ['Aurora Vista'], instrumentsUsed: ['Mastcam-Z', 'SuperCam'] }
  ]
};

export const CURIOSITY_MISSION: RoverMission = {
  id: 'curiosity',
  name: 'Curiosity (MSL)',
  landingSite: 'Bradbury Landing, Gale Crater',
  landingDate: 'August 6, 2012',
  currentSol: 4305,
  totalDistanceKm: 32.75,
  samplesCored: 41,
  status: 'ACTIVE_EXPLORING',
  trail: [
    { sol: 0, lat: -4.5895, lon: 137.4417, elevation: -4450, siteName: 'Bradbury Landing', dateStr: '2012-08-06', samplesCollected: [], instrumentsUsed: ['Mastcam', 'REMS'] },
    { sol: 270, lat: -4.5920, lon: 137.4580, elevation: -4520, siteName: 'Yellowknife Bay (Lacustrine Mudstone)', dateStr: '2013-05-15', samplesCollected: ['John Klein', 'Cumberland'], instrumentsUsed: ['CheMin', 'SAM'] },
    { sol: 750, lat: -4.6400, lon: 137.3800, elevation: -4420, siteName: 'Pahrump Hills (Murray Formation)', dateStr: '2014-09-18', samplesCollected: ['Confidence Hills'], instrumentsUsed: ['APXS', 'ChemCam'] },
    { sol: 1800, lat: -4.6850, lon: 137.3600, elevation: -4250, siteName: 'Vera Rubin Ridge (Hematite)', dateStr: '2017-09-02', samplesCollected: ['Stoer', 'Highfield'], instrumentsUsed: ['Mastcam', 'CheMin'] },
    { sol: 3100, lat: -4.7120, lon: 137.3400, elevation: -4050, siteName: 'Mont Mercou Escarpment', dateStr: '2021-05-04', samplesCollected: ['Nontron'], instrumentsUsed: ['SAM', 'CheMin'] },
    { sol: 4305, lat: -4.7450, lon: 137.3150, elevation: -3880, siteName: 'Gediz Vallis Channel Ridge', dateStr: '2024-09-10', samplesCollected: ['Mammoth Lakes'], instrumentsUsed: ['ChemCam', 'Mastcam'] }
  ]
};

export const JEZERO_HAZARDS: HazardZone[] = [
  {
    id: 'haz_seeltah_dunes',
    title: 'Séítah Rippled Dune Field',
    type: 'DUNE_FIELD',
    riskLevel: 'CRITICAL',
    center: { lat: 18.4310, lon: 77.4380, elevationMeters: -2570 },
    radiusMeters: 450,
    maxSlopeDeg: 19.5,
    roughnessIndex: 0.88,
    description: 'High-slip, loose basaltic sand megaripples with high sinkage risk. Autonomous rover rover-trap probability >85%.',
    mitigationAdvice: 'Traverse along rocky peripheral margin. Never enter dune trough center without multi-sol visual assessment.',
    detectedBy: 'HiRISE DTM PSP_003422_1985 & Navcam Stereo Slip Monitoring'
  },
  {
    id: 'haz_delta_scarp',
    title: 'Kodiak Butte West Scarp',
    type: 'STEEP_SLOPE',
    riskLevel: 'HIGH',
    center: { lat: 18.4480, lon: 77.4120, elevationMeters: -2515 },
    radiusMeters: 280,
    maxSlopeDeg: 28.4,
    roughnessIndex: 0.72,
    description: 'Near-vertical delta remnant escarpment prone to gravitational rockfall and talus scree instability.',
    mitigationAdvice: 'Maintain minimum 40m standoff distance from cliff base. EVA astronauts require tethered ascent anchors.',
    detectedBy: 'HiRISE Stereo Elevation Model & MOLA 128ppd'
  },
  {
    id: 'haz_belva_ejecta',
    title: 'Belva Impact Crater Ejecta Field',
    type: 'BOULDER_CLUSTER',
    riskLevel: 'MEDIUM',
    center: { lat: 18.5080, lon: 77.3750, elevationMeters: -2450 },
    radiusMeters: 620,
    maxSlopeDeg: 14.0,
    roughnessIndex: 0.81,
    description: 'Dense cluster of angular mega-blocks (0.8m - 2.5m diameter) from energetic impact excavation into basement basalt.',
    mitigationAdvice: 'Limit drive speed to <20 meters/hour. Engage AI local hazard avoidance lidar to slalom around blocks.',
    detectedBy: 'MRO CTX & Perseverance RIMFAX Subsurface Sounding'
  },
  {
    id: 'haz_rim_fault',
    title: 'Jezero Western Rim Fault Step',
    type: 'CRATER_RIM',
    riskLevel: 'HIGH',
    center: { lat: 18.5350, lon: 77.3300, elevationMeters: -2340 },
    radiusMeters: 350,
    maxSlopeDeg: 22.0,
    roughnessIndex: 0.69,
    description: 'Steep regional tectonic ring fault scarp connecting crater floor with Noachian cratered highlands.',
    mitigationAdvice: 'Utilize breach ramp at Neretva Vallis gateway rather than direct face ascent.',
    detectedBy: 'MOLA Topography & HiRISE Orthorectified Mosaic'
  }
];

export const JEZERO_SCIENCE_TARGETS: ScienceTarget[] = [
  {
    id: 'sci_fan_mudstone',
    name: 'Delta Fan Bottomset Mudstone (Amalik)',
    type: 'FLUVIAL_DELTA',
    tier: 1,
    coordinates: { lat: 18.4680, lon: 77.3880, elevationMeters: -2510 },
    scienceValueScore: 98,
    potentialBiosignature: 'Fine-grained organic carbon concentration within lacustrine clay laminations; highest preservation potential.',
    crismSpectralSignature: 'Strong 2.21 µm and 1.9 µm absorption: Fe/Mg smectite and nontronite clay minerals.',
    investigationStatus: 'SAMPLED',
    description: 'Preserved standing-water quiet sediment layers ideal for trapping organic molecules and microscopic microbial structures.'
  },
  {
    id: 'sci_margin_carbonate',
    name: 'Jezero Margin Carbonate & Silica Unit',
    type: 'CARBONATE_UNIT',
    tier: 1,
    coordinates: { lat: 18.4910, lon: 77.3690, elevationMeters: -2470 },
    scienceValueScore: 95,
    potentialBiosignature: 'Stromatolite-like layered carbonate precipitations formed along ancient paleolake shoreline bathtub-ring.',
    crismSpectralSignature: 'Diagnostic doublet at 2.30 µm and 2.51 µm: magnesite (MgCO3) and hydrated silica.',
    investigationStatus: 'ANALYZED',
    description: 'Unique alkaline shoreline precipitation unit indicating habitable neutral-to-basic water chemistry in Noachian era.'
  },
  {
    id: 'sci_kodiak_bottomsets',
    name: 'Kodiak Mesa Delta Clinoforms',
    type: 'FLUVIAL_DELTA',
    tier: 2,
    coordinates: { lat: 18.4410, lon: 77.4190, elevationMeters: -2530 },
    scienceValueScore: 89,
    potentialBiosignature: 'Truncated fluvial-lacustrine transition foresets tracking rapid lake level drops and flash floods.',
    crismSpectralSignature: 'Pyroxene and olivine mixed with weak hydroxylated silicates.',
    investigationStatus: 'ANALYZED',
    description: 'Isolated erosional butte providing 3D cross-sectional view of delta depositional cycles and lake hydrodynamics.'
  },
  {
    id: 'sci_bright_angel',
    name: 'Bright Angel Hydrothermal Outcrop',
    type: 'HYDROTHERMAL_VENT',
    tier: 1,
    coordinates: { lat: 18.5140, lon: 77.3500, elevationMeters: -2425 },
    scienceValueScore: 94,
    potentialBiosignature: 'Vivid bleached reduction halos and leopard spots with vivianite/iron-phosphate chemical energy sources.',
    crismSpectralSignature: 'Hydrated sulfates (jarosite/gypsum) and microcrystalline silica.',
    investigationStatus: 'PENDING',
    description: 'Rock surface exhibiting reaction fronts where warm groundwater met oxidized bedrock, potential microbial energy gradient.'
  },
  {
    id: 'sci_neretva_boulders',
    name: 'Neretva Vallis Mega-Flood Boulders',
    type: 'SILICA_DEPOSIT',
    tier: 3,
    coordinates: { lat: 18.5220, lon: 77.3390, elevationMeters: -2400 },
    scienceValueScore: 78,
    potentialBiosignature: 'Exotic crustal samples transported from hundreds of kilometers outside Jezero drainage basin.',
    crismSpectralSignature: 'Anorthosite and low-calcium pyroxene deep basement rock signatures.',
    investigationStatus: 'PENDING',
    description: 'High-energy fluvial deposit holding transported geological samples from ancient Martian crustal interior.'
  }
];

export const CURRENT_MARS_ENVIRONMENT: MarsEnvironmentData = {
  solNumber: 1240,
  solarLongLs: 142.5, // Late Northern Summer / Early Autumn
  surfaceTempC: { min: -84.2, max: -14.8, current: -28.5 },
  atmosphericPressurePa: 618.4, // ~6.18 millibars (0.6% of Earth sea level)
  opticalDepthTau: 0.58, // Clear atmosphere, moderate background dust
  windSpeedMps: 4.8,
  windDirection: 'ENE (065°)',
  radiationDoseRateMSvPerSol: 0.64, // ~230 mSv/year (Galactic Cosmic Ray + Solar)
  solarIrradianceWm2: 540, // Peak noon irradiance
  subsurfaceIceProbPct: 42.0, // Permafrost bound at ~1.2m depth
  earthMarsDistanceMillionKm: 224.5,
  commsDelayMinutes: 12.48, // One-way light travel time
  // Enhanced MEDA metrics
  pressureTrend: 'STEADY',
  pressureRangePa: { min: 592.1, max: 644.8 },
  windGustMps: 9.2,
  groundTempC: -24.1,
  dustStormStatus: 'CLEAR',
  solarPanelLossPct: 8.5,
  gcrFluxParticles: '1.24 particles/(cm²·s·sr)',
  solarParticleRisk: 'NOMINAL'
};

export const CURRENT_MARS_MISSION_CONDITION: MarsMissionConditionData = {
  missionId: 'ARES-III-JEZERO',
  missionName: 'Ares III / NASA Journey to Mars Expedition',
  solNumber: 1240,
  currentPhase: 'SURFACE_SURVEY',
  missionStatus: {
    state: 'NOMINAL',
    headline: 'Surface Expedition Operational - Sector Beta Delta Corridor',
    details: 'Autonomous navigation armed. Telemetry link with MRO relay established at 2.4 Mbps. Power reserves at 94%.',
    solProgressPct: 68,
    flightDirectorApproval: true,
    abortThresholdMarginPct: 91,
    autonomousControlActive: true,
    activePriorityVector: 'Vector Alpha (Delta Front Clays)',
    activeChecklistCompleted: 8,
    activeChecklistTotal: 10
  },
  crewReadiness: {
    overallReadinessPct: 96,
    evaStatus: 'GO_FOR_EVA',
    activeCrewCount: 4,
    averageFatigueIndex: 18,
    suitIntegrityPct: 99.2,
    lifeSupportReserveHours: 16.5,
    crewMembers: [
      {
        id: 'crew_1',
        name: 'CDR Alex Vance',
        role: 'Mission Commander & Pilot',
        readinessScorePct: 98,
        biometricStatus: 'NOMINAL',
        heartRateBpm: 72,
        suitPressureKPa: 29.6,
        coreTempC: 36.8,
        hoursOnDuty: 4.5,
        evaCertified: true
      },
      {
        id: 'crew_2',
        name: 'DR. Sarah Chen',
        role: 'Planetary Geologist & Astrobiologist',
        readinessScorePct: 95,
        biometricStatus: 'O2_OPTIMAL',
        heartRateBpm: 78,
        suitPressureKPa: 29.8,
        coreTempC: 36.9,
        hoursOnDuty: 5.0,
        evaCertified: true
      },
      {
        id: 'crew_3',
        name: 'ENG Marcus Ross',
        role: 'Robotics & Habitat Life Support',
        readinessScorePct: 94,
        biometricStatus: 'NOMINAL',
        heartRateBpm: 68,
        suitPressureKPa: 29.5,
        coreTempC: 36.7,
        hoursOnDuty: 3.5,
        evaCertified: true
      },
      {
        id: 'crew_4',
        name: 'MED Dr. Elena Rostova',
        role: 'Flight Surgeon & Consumables Officer',
        readinessScorePct: 97,
        biometricStatus: 'NOMINAL',
        heartRateBpm: 65,
        suitPressureKPa: 29.7,
        coreTempC: 36.6,
        hoursOnDuty: 4.0,
        evaCertified: true
      }
    ]
  },
  operationalWindows: [
    {
      id: 'win_eva_primary',
      type: 'EVA_TRAVERSE',
      title: 'Primary EVA Traverse Window Alpha',
      windowStartLmts: '11:30',
      windowEndLmts: '15:45',
      durationMinutes: 255,
      status: 'OPEN',
      optimalScorePct: 95,
      primaryConstraint: 'Thermal diurnal peak (-14.8°C) & high sun angle',
      recommendedAction: 'Depart Hab Airlock Alpha along Vector Alpha traverse'
    },
    {
      id: 'win_solar_peak',
      type: 'SOLAR_RECHARGE',
      title: 'Peak Solar Array Photovoltaic Window',
      windowStartLmts: '11:00',
      windowEndLmts: '14:30',
      durationMinutes: 210,
      status: 'OPEN',
      optimalScorePct: 98,
      primaryConstraint: 'Solar incidence angle > 65°, 540 W/m² peak',
      recommendedAction: 'Deploy rover high-efficiency auxiliary array'
    },
    {
      id: 'win_coring_drill',
      type: 'DRILL_SAMPLING',
      title: 'Bottomset Mudstone Core Sampling Window',
      windowStartLmts: '13:00',
      windowEndLmts: '14:15',
      durationMinutes: 75,
      status: 'OPEN',
      optimalScorePct: 92,
      primaryConstraint: 'Rock surface temp > -20°C prevents bit thermal shock',
      recommendedAction: 'Acquire hermetic core sample #05 with rotary percussive drill'
    },
    {
      id: 'win_mro_comms',
      type: 'ORBITAL_COMMS_PASS',
      title: 'MRO High-Gain X-Band Relay Pass',
      windowStartLmts: '16:15',
      windowEndLmts: '17:05',
      durationMinutes: 50,
      status: 'UPCOMING',
      optimalScorePct: 88,
      primaryConstraint: 'AOS at 24° elevation, LOS at 12° azimuth',
      recommendedAction: 'Queue raw CRISM spectral cubes for downlink to Earth'
    },
    {
      id: 'win_scrubber_cycle',
      type: 'HAB_LIFE_SUPPORT',
      title: 'CO2 Scrubber Vacuum Desorption Cycle',
      windowStartLmts: '18:00',
      windowEndLmts: '19:30',
      durationMinutes: 90,
      status: 'UPCOMING',
      optimalScorePct: 90,
      primaryConstraint: 'Post-EVA cabin atmosphere equalization',
      recommendedAction: 'Initiate automated thermal swing adsorption cycle'
    }
  ],
  selectedOptionFilter: 'ALL',
  lastUpdated: 'Sol 1240, 12:45 LMST'
};

export const WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  {
    id: 'scen_dune_blockage',
    title: 'Traverse Blocked: Active Sand Mega-Ripple Field',
    category: 'ROUTE_BLOCKED',
    severity: 'WARNING',
    triggerPrompt: 'Visual odometry and Navcam stereo depth detect unmapped active dune trough with slope >21° and loose cohesion directly across planned primary vector.',
    impactSummary: 'Primary traverse path blocked. Estimated wheel slip >65% with critical risk of rover belly-pan grounding. 3.2 hour delay if unmitigated.',
    aiSuggestedAction: 'Execute dynamic A* detour along exposed polygon bedrock ridge. Adds +420m traverse length but preserves 100% rover mobility margin.',
    active: false
  },
  {
    id: 'scen_dust_storm_tau',
    title: 'Regional Dust Storm Alert (Tau Spike > 3.2)',
    category: 'DUST_STORM',
    severity: 'CRITICAL',
    triggerPrompt: 'Mars Reconnaissance Orbiter MARCI camera and MEDA pressure sensor identify sudden cyclonic dust squall approaching from Isidis Planitia.',
    impactSummary: 'Solar irradiance drops by 78%. Thermal diurnal swing widens (-92°C min). Optical navigation cameras blind past 30 meters.',
    aiSuggestedAction: 'Initiate Emergency Hab-Return sequence or rover park-and-conserve mode. Power down non-critical scientific instruments; prioritize battery heaters.',
    active: false
  },
  {
    id: 'scen_biosignature_discovery',
    title: 'High-Priority Astrobiology Biosignature Divergence',
    category: 'BIOSIGNATURE_DIV',
    severity: 'OPPORTUNITY',
    triggerPrompt: 'SHERLOC Deep UV Raman detects 254nm aromatic organic ring fluorescence with associated vivianite phosphate rimming 180m off planned path.',
    impactSummary: 'Tier 1 Potential Biosignature Opportunity. High scientific value (Score 99/100). Requires immediate trade-off decision versus current mission deadline.',
    aiSuggestedAction: 'Execute 90-minute mission divergence: Deploy Mastcam-Z multispectral zoom, perform abrasion patch, and cache duplicate core before advancing.',
    active: false
  },
  {
    id: 'scen_suit_o2_leak',
    title: 'EVA Suit Micro-Puncture & O2 Pressure Drop',
    category: 'SUIT_LEAK',
    severity: 'CRITICAL',
    triggerPrompt: 'Astronaut EVA-1 primary suit pressure sensor reports 3.8 kPa pressure drop with secondary consumable flow rate accelerating to 2.4 L/min.',
    impactSummary: 'EVA survivability timeline compressed from 240 minutes to 38 minutes remaining. Astronaut is 1.4 km from Base Airlock.',
    aiSuggestedAction: 'ACTIVATE EMERGENCY RETURN VECTOR. Computer activates fastest grade-smoothed path to pressurized rover airlock. Science objectives aborted.',
    active: false
  },
  {
    id: 'scen_actuator_thermal',
    title: 'Rover Left-Front Steering Actuator Thermal Anomaly',
    category: 'ROVER_ACTUATOR_FAULT',
    severity: 'WARNING',
    triggerPrompt: 'Motor gearbox current draws 3.4x nominal threshold. Bearing temperature telemetry reaches +68°C during 12° slope climb.',
    impactSummary: 'Traverse speed limited to 8 meters/hour. Steering capability degraded on slopes exceeding 8 degrees.',
    aiSuggestedAction: 'Reconfigure pathfinding cost matrix: enforce strict 8° maximum slope ceiling and favor smooth sedimentary flats to prevent gear seizure.',
    active: false
  }
];

export const NASA_RAG_KNOWLEDGEBASE: { [key: string]: RagDocumentRef } = {
  mola_topography: {
    sourceTitle: 'MGS MOLA 128 Pixels/Degree Digital Elevation Models (MEGDR)',
    pdsProductDoc: 'NASA PDS Geosciences Node / Smith et al., JGR Planets',
    doiOrUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/',
    confidencePct: 98,
    relevanceSnippet: 'Elevation accuracy ±1 meter relative to areoid datum. Slopes derived via 3x3 moving kernel algorithm with slope thresholds calibrated for Mars exploration rovers (15 deg nominal limit).'
  },
  hirise_dtm: {
    sourceTitle: 'HiRISE Digital Terrain Model (DTM) of Jezero Crater Western Delta',
    pdsProductDoc: 'MRO HiRISE PDS / McEwen et al., Icarus',
    doiOrUrl: 'https://hirise.lpl.arizona.edu/dtm/dtm.php?ID=ESP_037184_1985',
    confidencePct: 96,
    relevanceSnippet: 'Sub-meter (1.0m DTM, 0.25m orthophoto) vertical precision resolving meter-scale boulder distribution, ripple crest lines, and fractured bedrock pavements.'
  },
  crism_minerals: {
    sourceTitle: 'CRISM Targeted Hyperspectral Observations of Jezero Crater & Nili Fossae',
    pdsProductDoc: 'MRO CRISM Science Team / Ehlmann et al., Nature Geoscience',
    doiOrUrl: 'https://pds-geosciences.wustl.edu/mro/mro-m-crism-3-rdr-targeted-v1/',
    confidencePct: 94,
    relevanceSnippet: 'Spectra demonstrate widespread Mg-carbonate and Fe/Mg smectite phyllosilicates deposited in lacustrine quiet waters, providing optimum taphonomic preservation for ancient Martian biosignatures.'
  },
  mars2020_ops: {
    sourceTitle: 'NASA Mars 2020 Perseverance Science Operations Working Group Reports',
    pdsProductDoc: 'JPL Mars 2020 Mission Archive / Farley et al., Science 2022',
    doiOrUrl: 'https://mars.nasa.gov/mars2020/mission/science/publications/',
    confidencePct: 97,
    relevanceSnippet: 'Traverse autonomy rules mandate continuous visual odometry slip monitoring. Maximum allowed slope angle for sustained driving is 16.5 degrees; max step obstacle is 35 cm.'
  },
  eva_human_standards: {
    sourceTitle: 'NASA Human Integration Design Handbook (HIDH) - Mars Surface Exploration',
    pdsProductDoc: 'NASA-SP-2010-3407 / EVA Systems Project Office',
    doiOrUrl: 'https://www.nasa.gov/hhp/standards/',
    confidencePct: 95,
    relevanceSnippet: 'Astronaut surface walking metabolic expenditure ranges 280-450 Watts. Walk-back safety margin mandates returning to airlock with minimum 45 minutes of reserve O2 and 20% battery margin.'
  }
};

// Aliases for consistent naming across views
export const MAP_LAYERS_INITIAL = INITIAL_MAP_LAYERS;
export const DEFAULT_MARS_ENVIRONMENT = CURRENT_MARS_ENVIRONMENT;
export const DEFAULT_MARS_MISSION_CONDITION = CURRENT_MARS_MISSION_CONDITION;
export const DEFAULT_WHAT_IF_SCENARIOS = WHAT_IF_SCENARIOS;

export const INITIAL_AI_MESSAGES = [
  {
    id: 'msg_welcome_1',
    role: 'assistant' as const,
    content: `Welcome to the Interplanetary Survival Guide AI assistant. Grounded in NASA MOLA topography, HiRISE 25cm/pixel imagery, CRISM mineralogy cubes, and Mars 2020 mission archives.\n\nCurrent context: Jezero Crater delta traverse planning (Sol 1240). How can I assist with slope stability, biosignature target prioritisation, or EVA life-support margins?`,
    timestamp: '14:20 LMST',
    evidenceCitations: [
      {
        sourceName: 'NASA Mars 2020 Science Team',
        datasetType: 'Mission Plan',
        dataProductId: 'PDS_M2020_OPERATIONS_SOL1240',
        confidence: 0.98
      }
    ]
  }
];

export const INITIAL_CONSENSUS = {
  consensusScore: 88,
  recommendedRouteId: 'route_balanced_a',
  humanCommanderActionRequired: true,
  perspectives: [
    {
      agentName: 'Ares Pathfinder AI',
      agentRole: 'Route Planner AI' as const,
      avatar: 'compass',
      score: 91,
      verdict: 'APPROVE' as const,
      summary: 'Vector Alpha achieves the highest kinematic efficiency, maintaining steady battery output and minimizing wheel steering cycles.',
      keyArguments: [
        'Total distance is only 4.2 km with smooth elevation slope profile',
        'Direct bedrock corridor minimizes motor gearbox wear'
      ],
      tradeOffMetric: { label: 'Traverse Time', value: '4.9 Hours' }
    },
    {
      agentName: 'Aegis Safety AI',
      agentRole: 'Safety Officer AI' as const,
      avatar: 'shield',
      score: 84,
      verdict: 'APPROVE' as const,
      summary: 'Slopes remain below 11.2° with 0% probability of dune entrapment. Recommends reduced speed when within 80m of Belva scarp.',
      keyArguments: [
        'Max slope well below rover 15° turnover limit',
        'Firm basalt pavement provides optimum wheel traction'
      ],
      tradeOffMetric: { label: 'Risk Factor', value: 'Low (28/100)' }
    },
    {
      agentName: 'Astrobiology AI',
      agentRole: 'Science Lead AI' as const,
      avatar: 'microscope',
      score: 89,
      verdict: 'APPROVE' as const,
      summary: 'Enables access to both the delta bottomset smectites and ancient shoreline carbonates.',
      keyArguments: [
        'Samples two distinct high-preservation mineral facies',
        'Direct line of sight to Kodiak butte for stereo Mastcam-Z panorama'
      ],
      tradeOffMetric: { label: 'Science Value', value: '82/100 Yield' }
    }
  ],
  tradeOffMatrix: [
    { criteria: 'Traverse Distance (km)', routeA: 92, routeB: 76, routeC: 80 },
    { criteria: 'Slope Safety Margin (>15° avoidance)', routeA: 88, routeB: 98, routeC: 72 },
    { criteria: 'Wheel Slip Avoidance', routeA: 90, routeB: 99, routeC: 68 },
    { criteria: 'Biosignature Science Return', routeA: 82, routeB: 60, routeC: 98 },
    { criteria: 'EVA Oxygen & Battery Efficiency', routeA: 90, routeB: 78, routeC: 70 }
  ]
};

/**
 * Mars Habitation Suitability Dataset
 * Tri-color signal categorization for crewed landing and long-term habitation zones:
 * - Green (Full Positive): Prime flat terrain, shallow water-ice access, thick atmospheric column for EDL & radiation shielding
 * - Yellow (Moderate/Caution): Acceptable but risky zones with 8-15° slopes, boulder clusters, or dune hazards
 * - Red (Totally Negative): Absolute no-go zones due to extreme radiation, vacuum elevation, or sheer cliff scarps
 */
export const MARS_HABITATION_SUITABILITY_ZONES: MarsHabitationSuitabilityZone[] = [
  // 🟢 GREEN ZONES: Prime Landing & Habitation (Flat, Safe, High Resource Availability)
  {
    id: 'hab_arcadia_planitia',
    name: 'Arcadia Planitia Cryo-Basin',
    lat: 39.3,
    lng: -171.0,
    radius: 5.2,
    status: 'green',
    suitabilityScore: 96,
    elevationMeters: -4100,
    slopeDeg: 1.2,
    radiationLevel: 'LOW',
    terrain: 'Ultra-flat sheet ice plains with minimal rock density',
    summary: 'NASA primary candidate for human base establishment. Radar data (SHARAD/SWIM) confirms abundant pure water ice 1-2 meters below surface for fuel & life-support ISRU. Thick atmospheric column (-4.1 km elevation) provides superior radiation absorption.',
    isruPotential: 'EXCELLENT'
  },
  {
    id: 'hab_elysium_planitia',
    name: 'Elysium Planitia Solar Corridor',
    lat: 4.5,
    lng: 154.2,
    radius: 4.5,
    status: 'green',
    suitabilityScore: 93,
    elevationMeters: -2610,
    slopeDeg: 1.6,
    radiationLevel: 'LOW',
    terrain: 'Smooth basaltic flood lava pavement, zero sand dunes',
    summary: 'Optimal equatorial solar energy harvesting corridor. InSight seismology proved firm structural bedrock foundation with low thermal inertia variance and safe uninhibited rover transit across hundreds of kilometers.',
    isruPotential: 'FAIR'
  },
  {
    id: 'hab_utopia_planitia',
    name: 'Utopia Planitia Subsurface Glacial Basin',
    lat: 46.7,
    lng: 117.5,
    radius: 4.8,
    status: 'green',
    suitabilityScore: 95,
    elevationMeters: -3900,
    slopeDeg: 1.4,
    radiationLevel: 'LOW',
    terrain: 'Smooth scalloped depression mantle atop ancient glacial sheet',
    summary: 'Houses ~14,300 km³ of water ice equivalent to Lake Superior. Smooth landing ellipses with gentle topography (<2° slope) allow automated multi-payload supply cargo staging.',
    isruPotential: 'EXCELLENT'
  },
  {
    id: 'hab_isidis_planitia',
    name: 'Isidis Planitia Deep Atmospheric Haven',
    lat: 12.9,
    lng: 87.0,
    radius: 4.0,
    status: 'green',
    suitabilityScore: 91,
    elevationMeters: -3800,
    slopeDeg: 2.0,
    radiationLevel: 'LOW',
    terrain: 'Ancient sedimentary sediment sheet with low boulder abundance',
    summary: 'Deep lowland depression with high atmospheric surface pressure (~7.2 mbar), enhancing aerodynamic parachute braking and mitigating cosmic ray flux. Proximity to Jezero and Syrtis astrobiology resources.',
    isruPotential: 'FAIR'
  },
  {
    id: 'hab_meridiani_planum',
    name: 'Meridiani Planum Hematite Plains',
    lat: -1.9,
    lng: -5.5,
    radius: 3.6,
    status: 'green',
    suitabilityScore: 89,
    elevationMeters: -1420,
    slopeDeg: 1.1,
    radiationLevel: 'LOW',
    terrain: 'Planar duricrust bedrock and blueberry hematite pavement',
    summary: 'Proven safe by Opportunity rover for over 14 years. Predictable dust accumulation cycles, near-zero slope hazards, and reliable equatorial solar power generation.',
    isruPotential: 'FAIR'
  },

  // 🟡 YELLOW ZONES: Moderate / Caution (Acceptable but Risky Zones with Complex Slopes)
  {
    id: 'hab_jezero_delta',
    name: 'Jezero Paleolake Delta Fringe',
    lat: 18.38,
    lng: 77.58,
    radius: 3.2,
    status: 'yellow',
    suitabilityScore: 68,
    elevationMeters: -2500,
    slopeDeg: 9.2,
    radiationLevel: 'MODERATE',
    terrain: 'Fluvial delta strata, boulder fields, 10-15° crater rim scarps',
    summary: 'Extraordinary scientific value for ancient fossil biosignatures. Requires active terrain-relative hazard avoidance during EDL due to delta cliffs, sand traps, and crater wall boulders.',
    isruPotential: 'FAIR'
  },
  {
    id: 'hab_gale_crater',
    name: 'Gale Crater Aeolis Mons Foothills',
    lat: -5.4,
    lng: 137.8,
    radius: 2.8,
    status: 'yellow',
    suitabilityScore: 65,
    elevationMeters: -4450,
    slopeDeg: 11.5,
    radiationLevel: 'MODERATE',
    terrain: 'Active barchan dune fields and fractured mudstone benches',
    summary: 'Diverse hydrated mineral layers and groundwater salts, but 5-km high central peak causes localized katabatic winds and deep aeolian wheel-trap ripples.',
    isruPotential: 'FAIR'
  },
  {
    id: 'hab_mawrth_vallis',
    name: 'Mawrth Vallis Infiltration Channel',
    lat: 24.0,
    lng: -19.0,
    radius: 3.4,
    status: 'yellow',
    suitabilityScore: 66,
    elevationMeters: -2200,
    slopeDeg: 10.1,
    radiationLevel: 'MODERATE',
    terrain: 'Dissected stratified clay plateau with inverted channels',
    summary: 'Abundant smectite clays for in-situ regolith brick manufacture. Caution mandated due to irregular gully networks and touch-down slope variations.',
    isruPotential: 'FAIR'
  },
  {
    id: 'hab_noctis_labyrinthus',
    name: 'Noctis Labyrinthus Lava Tube Corridor',
    lat: -7.0,
    lng: -102.2,
    radius: 3.8,
    status: 'yellow',
    suitabilityScore: 62,
    elevationMeters: 1100,
    slopeDeg: 13.8,
    radiationLevel: 'MODERATE',
    terrain: 'Fractured graben canyons, collapse pits, and cave skylights',
    summary: 'Subsurface lava tubes offer natural radiation shielding from solar storms, but rugged surface approaches and 1-2 km shear canyon walls restrict heavy lander access.',
    isruPotential: 'POOR'
  },
  {
    id: 'hab_cerberus_fossae',
    name: 'Cerberus Fossae Tectonic Rift',
    lat: 10.2,
    lng: 157.0,
    radius: 3.0,
    status: 'yellow',
    suitabilityScore: 59,
    elevationMeters: -2100,
    slopeDeg: 12.4,
    radiationLevel: 'MODERATE',
    terrain: 'Young volcanic fissure grabens with active seismic tremors',
    summary: 'Promising geothermal exploration candidate, but detected Marsquakes (InSight seismic event cluster) and vertical fissure drop-offs pose foundation risks.',
    isruPotential: 'POOR'
  },

  // 🔴 RED ZONES: Totally Negative (Absolute No-Go Danger Zones)
  {
    id: 'hab_olympus_mons',
    name: 'Olympus Mons Summit Caldera Peak (NO-GO)',
    lat: 18.65,
    lng: -133.8,
    radius: 5.8,
    status: 'red',
    suitabilityScore: 4,
    elevationMeters: 21287,
    slopeDeg: 34.0,
    radiationLevel: 'EXTREME',
    terrain: 'Vertical collapse caldera pits and 8-km sheer basal scarps',
    summary: 'CRITICAL NO-GO ZONE. Near-vacuum atmospheric pressure (<0.5 mbar) precludes aerodynamic deceleration. Unshielded lethal cosmic radiation flux (>350 mSv/yr) and impassable vertical volcanic scarps.',
    isruPotential: 'POOR'
  },
  {
    id: 'hab_valles_marineris',
    name: 'Valles Marineris Chasm Abyss (NO-GO)',
    lat: -13.9,
    lng: -59.2,
    radius: 6.2,
    status: 'red',
    suitabilityScore: 5,
    elevationMeters: -6800,
    slopeDeg: 44.0,
    radiationLevel: 'EXTREME',
    terrain: '7-10 km vertical precipices, scree slopes, and massive rockslides',
    summary: 'CRITICAL NO-GO ZONE. Extreme slope angles (>40°), active cliff face crumbling, perpetual shadow zones starving solar arrays, and high-velocity katabatic wind funnels.',
    isruPotential: 'POOR'
  },
  {
    id: 'hab_hellas_basin',
    name: 'Hellas Impact Basin Scarps (NO-GO)',
    lat: -42.4,
    lng: 70.5,
    radius: 5.5,
    status: 'red',
    suitabilityScore: 11,
    elevationMeters: -7152,
    slopeDeg: 28.0,
    radiationLevel: 'EXTREME',
    terrain: 'Challenging ring-fault scarps, giant dust storm genesis corridor',
    summary: 'CRITICAL NO-GO ZONE. Ground zero for planetary dust storms that obscure sunlight for months (Tau > 4.5). Extreme thermal shocks and rocky impact debris rings.',
    isruPotential: 'POOR'
  },
  {
    id: 'hab_ascraeus_mons',
    name: 'Ascraeus Mons Volcanic Peak (NO-GO)',
    lat: 11.9,
    lng: -104.5,
    radius: 4.4,
    status: 'red',
    suitabilityScore: 5,
    elevationMeters: 18200,
    slopeDeg: 29.5,
    radiationLevel: 'EXTREME',
    terrain: 'Summit crater rim, frozen pyroclastic sheets, extreme vacuum',
    summary: 'CRITICAL NO-GO ZONE. Insufficient atmospheric density for any parachutes or heat shields. Extreme cold (-130°C) and lethal solar cosmic particle radiation.',
    isruPotential: 'POOR'
  },
  {
    id: 'hab_arsia_mons',
    name: 'Arsia Mons Caldera Collapse Ring (NO-GO)',
    lat: -8.4,
    lng: -121.1,
    radius: 4.2,
    status: 'red',
    suitabilityScore: 6,
    elevationMeters: 17700,
    slopeDeg: 31.0,
    radiationLevel: 'EXTREME',
    terrain: 'Unstable sinkholes, collapse pit craters, and jagged lava rims',
    summary: 'CRITICAL NO-GO ZONE. High structural collapse hazard, frequent micro-meteorite impacts due to lack of atmosphere, and severe orographic cloud vortices.',
    isruPotential: 'POOR'
  }
];

