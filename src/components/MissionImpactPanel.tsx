/**
 * MissionImpactPanel.tsx
 * "Journey to Mars" Strategic Impact & Earth-Independent Phase Support
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 */

import React, { useState } from 'react';
import {
  X,
  Rocket,
  ShieldCheck,
  Compass,
  Sparkles,
  Radio,
  MapPin,
  Flame,
  Layers,
  ChevronRight,
  ExternalLink,
  Target,
  Clock,
  AlertTriangle,
  Zap,
  Globe
} from 'lucide-react';

interface MissionImpactPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (action: 'LOCATIONS' | 'HAZARDS' | 'ROUTES' | 'AI_HUB' | '2D_MAP') => void;
}

export const MissionImpactPanel: React.FC<MissionImpactPanelProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HABITAT' | 'HAZARDS' | 'ROUTES' | 'TIMELINE'>('OVERVIEW');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#080d1a] border border-cyan-500/40 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden font-mono text-slate-200">
        {/* Header with NASA Insignia Branding */}
        <div className="p-4 sm:p-5 border-b border-slate-800/90 flex items-center justify-between bg-gradient-to-r from-[#0d1627] via-[#09101f] to-[#120f24] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-600 via-amber-600 to-cyan-500 p-0.5 shadow-lg shadow-red-950/60 shrink-0">
              <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 transform -rotate-45" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-['Orbitron'] font-extrabold text-sm sm:text-base text-slate-100 tracking-wider">
                  NASA'S JOURNEY TO MARS
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-red-950/80 border border-red-500/60 text-red-300">
                  Mission Impact
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-cyan-300 flex items-center space-x-1.5 mt-0.5">
                <span>Phase 3 Operational Enabler:</span>
                <strong className="text-amber-400 font-semibold">Earth-Independent Colonization</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition-colors cursor-pointer"
            aria-label="Close Mission Impact Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center space-x-1 sm:space-x-2 overflow-x-auto whitespace-nowrap hide-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'OVERVIEW'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            Mission Strategic Overview
          </button>
          <button
            onClick={() => setActiveTab('HABITAT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'HABITAT'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            Habitat Zone Mapping
          </button>
          <button
            onClick={() => setActiveTab('HAZARDS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'HAZARDS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            AI Hazard Avoidance
          </button>
          <button
            onClick={() => setActiveTab('ROUTES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ROUTES'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            Astronaut Route Integration
          </button>
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'TIMELINE'
                ? 'bg-red-500/20 text-red-300 border border-red-500/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            NASA 3-Phase Architecture
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed custom-scrollbar">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Executive Hero Block */}
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-red-950/20 border border-cyan-800/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-['Orbitron'] font-bold text-sm sm:text-base text-cyan-300 flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Why This App Is Critical for Martian Settlement</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span>22-Min Roundtrip Comms Delay Solved</span>
                  </span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  NASA's overarching <strong className="text-white">Journey to Mars</strong> plan culminates in the <strong className="text-amber-300">Earth-Independent Phase</strong>. When humans establish permanent outposts on Mars, the 3 to 22-minute communication lag each way makes direct tactical guidance from Mission Control in Houston or JPL impossible during emergencies.
                </p>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  The <strong className="text-cyan-400">Interplanetary Survival Guide: Martian Tactical GIS</strong> acts as an autonomous, edge-deployed digital flight officer. By unifying multi-agency NASA datasets (MGS MOLA, MRO CRISM/HiRISE/CTX, Mars Odyssey THEMIS) with localized generative AI reasoning and multi-objective A* pathfinding, this application gives pioneer astronauts the self-reliance required to survive and thrive on an alien world.
                </p>
              </div>

              {/* Three Core Mission Pillars Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pillar 1: Habitat Zone Mapping */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/40 hover:border-emerald-400 transition-all flex flex-col justify-between space-y-3 shadow-lg">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h4 className="font-['Orbitron'] font-bold text-xs sm:text-sm text-emerald-300">
                      Habitat Zone Mapping
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-300">
                      Cross-correlates subsurface SHARAD ice deposits, natural lava tube radiation shelters (at Noctis Labyrinthus & Olympus flanks), and atmospheric pressure basins (Hellas, Jezero) for safe outpost placement.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onSelectAction) onSelectAction('LOCATIONS');
                      onClose();
                    }}
                    className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Inspect 10 Settlement Zones</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Pillar 2: AI Hazard Avoidance */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-amber-500/40 hover:border-amber-400 transition-all flex flex-col justify-between space-y-3 shadow-lg">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <h4 className="font-['Orbitron'] font-bold text-xs sm:text-sm text-amber-300">
                      AI Hazard Avoidance
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-300">
                      Real-time terrain monitoring flagging slopes &gt;15° (rollover danger), aeolian dust sink-traps (Curiosity wheel hazard), and solar flare radiation spikes with Gemini 3.8 Flash RAG edge reasoning.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onSelectAction) onSelectAction('HAZARDS');
                      onClose();
                    }}
                    className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>View Real-Time Hazards</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Pillar 3: Astronaut Route Integration */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-purple-500/40 hover:border-purple-400 transition-all flex flex-col justify-between space-y-3 shadow-lg">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-600/50 flex items-center justify-center text-purple-400">
                      <Compass className="w-4 h-4" />
                    </div>
                    <h4 className="font-['Orbitron'] font-bold text-xs sm:text-sm text-purple-300">
                      Astronaut Route Integration
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-300">
                      Kinematic multi-weight A* pathfinding calculates consumable burn (O2, battery kWh, suit heating) and provides heads-up telemetry with instant abort-to-habitat return vectors.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onSelectAction) onSelectAction('ROUTES');
                      onClose();
                    }}
                    className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/50 text-purple-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Launch Route Planner</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grounding & Data Lineage Metrics */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-['Orbitron']">100%</div>
                  <div className="text-[10px] text-slate-400 uppercase mt-0.5">Offline Autonomous GIS</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-['Orbitron']">0.0 ms</div>
                  <div className="text-[10px] text-slate-400 uppercase mt-0.5">Emergency Abort Delay</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-['Orbitron']">463 m</div>
                  <div className="text-[10px] text-slate-400 uppercase mt-0.5">MOLA Global Elevation Grid</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60">
                  <div className="text-xl sm:text-2xl font-extrabold text-purple-400 font-['Orbitron']">10 Key</div>
                  <div className="text-[10px] text-slate-400 uppercase mt-0.5">Planetary Settlement Sites</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HABITAT' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <h4 className="font-['Orbitron'] font-bold text-sm text-emerald-300 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Habitat Zone Mapping for Long-Duration Outposts</span>
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Choosing an outpost location on Mars is a multivariate optimization problem involving radiation shielding, water-ice accessibility, thermal moderation, and atmospheric entry braking.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-cyan-400 font-bold text-xs uppercase flex items-center space-x-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Subsurface Ice Extraction (ISRU)</span>
                  </span>
                  <p className="text-slate-300 text-xs">
                    Uses SHARAD (Shallow Radar) data to pinpoint glacier-like water ice deposits in <strong className="text-white">Planum Boreum</strong> and <strong className="text-white">Utopia Planitia</strong> under protective regolith mantles. This water is required for drinking, rocket fuel electrolysis (LOX/Methane via Sabatier), and agriculture.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-amber-400 font-bold text-xs uppercase flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Lava Tube Radiation Shelters</span>
                  </span>
                  <p className="text-slate-300 text-xs">
                    Identifies intact volcanic lava tubes in <strong className="text-white">Noctis Labyrinthus</strong> and the Tharsis flanks. Subsurface volcanic tubes attenuate cosmic galactic radiation (GCR) and solar particle events (SPE) from 700 mSv/yr down to safe terrestrial baseline levels.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-emerald-400 font-bold text-xs uppercase flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Atmospheric Aerobraking & Pressure</span>
                  </span>
                  <p className="text-slate-300 text-xs">
                    Deep impact basins like <strong className="text-white">Hellas Planitia (-7.1 km)</strong> have atmospheric pressures up to 1,240 Pa (compared to Mars average of 610 Pa), providing twice the atmospheric density for easier aerodynamic capture and enhanced thermal buffering.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-purple-400 font-bold text-xs uppercase flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mineral Resource Proximity</span>
                  </span>
                  <p className="text-slate-300 text-xs">
                    CRISM spectral layers identify magnesium carbonates, smectite clays, and gypsum in <strong className="text-white">Jezero Crater</strong> and <strong className="text-white">Gale Crater</strong>, enabling local concrete creation and habitat construction without transporting mass from Earth.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HAZARDS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <h4 className="font-['Orbitron'] font-bold text-sm text-amber-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Autonomous AI Hazard Detection & Planetary Avoidance</span>
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Mars is an unforgiving environment with steep escarpments, loose fine-grained regolith traps, and seasonal dust storms that obscure solar panels and create kilovolt-level triboelectric charges.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-100 text-xs">Steep Slope & Scarp Rollover Protection (&gt;15°)</h5>
                    <p className="text-slate-300 text-xs mt-1">
                      Pressurized rovers and astronauts in Extravehicular Activity (EVA) suits face critical tipping hazards on grades exceeding 15°. The system continuously scans MOLA elevation slopes and automatically calculates dynamic detours around dangerous scarps.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-100 text-xs">Aeolian Soft Sand Entrapment Zones</h5>
                    <p className="text-slate-300 text-xs mt-1">
                      Learned from Spirit's permanent wheel entrapment in 2009 and Curiosity's wheel wear at Gale Crater, the app isolates soft sand ripples and dunes, preventing heavy exploration vehicles from sinking.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-100 text-xs">Edge AI Reasoning via Gemini 3.8 Flash RAG</h5>
                    <p className="text-slate-300 text-xs mt-1">
                      When unpredicted environmental events occur (e.g. dust devil impact, radio blackout, sudden suit pressure drop), the embedded multimodal AI parses local telemetric readings and delivers step-by-step contingency protocols in under 2 seconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ROUTES' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-2">
                <h4 className="font-['Orbitron'] font-bold text-sm text-purple-300 flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  <span>Astronaut Route Integration & Consumable Modeling</span>
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Surface traverses cannot rely solely on euclidean straight lines. Every meter traversed on Mars consumes vital oxygen, battery watt-hours, and thermal insulation capacity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-purple-400 font-bold text-xs uppercase flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Multi-Cost Kinematic A* Pathfinding</span>
                  </span>
                  <p className="text-slate-300 text-xs">
                    The routing engine weighs multiple penalty matrices simultaneously: distance, elevation change, surface roughness, radiation flux, and scientific target yield. Astronauts can switch weights on the fly between <strong className="text-white">Safest</strong>, <strong className="text-white">Fastest</strong>, and <strong className="text-white">Maximum Science</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-emerald-400 font-bold text-xs uppercase flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Point of No Return (PNR) Calculation</span>
                  </span>
                  <p className="text-slate-300 text-xs">
                    Constantly projects remaining suit oxygen (standard 8-hour EVA limit) against the return trajectory. If battery or O2 falls below the 35% safety margin, the system sounds an audible alert and draws an immediate abort vector back to the airlock.
                  </p>
                </div>
              </div>

              {/* Astronaut Heads-Up Display (HUD) Feature Highlight */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-cyan-300 text-xs flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Helmet Visor HUD Integration</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Astronauts can switch to the high-contrast HUD mode optimized for low-visibility Martian dust environments and direct visor projection.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (onSelectAction) onSelectAction('2D_MAP');
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                >
                  View 2D GIS Surface
                </button>
              </div>
            </div>
          )}

          {activeTab === 'TIMELINE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="font-['Orbitron'] font-bold text-sm text-slate-100 flex items-center space-x-2">
                  <Rocket className="w-4 h-4 text-cyan-400" />
                  <span>NASA's 3-Phase Journey to Mars Roadmap</span>
                </h4>
                <p className="text-slate-400 text-xs">
                  NASA's strategic framework moves humanity progressively further from Earth, culminating in true planetary self-reliance.
                </p>
              </div>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {/* Phase 1 */}
                <div className="relative pl-8 space-y-1">
                  <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-700 border-2 border-slate-950" />
                  <div className="flex items-center space-x-2">
                    <span className="font-['Orbitron'] text-xs font-bold text-slate-400">PHASE 1: EARTH RELIANT</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Past & Present</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Research aboard the International Space Station (ISS). Validating human physiology, life-support recyclers, and advanced communication systems with immediate abort options back to Earth.
                  </p>
                </div>

                {/* Phase 2 */}
                <div className="relative pl-8 space-y-1">
                  <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-slate-950" />
                  <div className="flex items-center space-x-2">
                    <span className="font-['Orbitron'] text-xs font-bold text-amber-400">PHASE 2: PROVING GROUND</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/40 text-amber-300">Artemis & Gateway</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Operating in cislunar space and on the Moon. Astronauts test deep-space habitation modules, landing systems, and operations days away from Earth rather than hours.
                  </p>
                </div>

                {/* Phase 3 */}
                <div className="relative pl-8 space-y-1 bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/40 shadow-lg">
                  <div className="absolute left-2 top-4 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-950 animate-ping" />
                  <div className="absolute left-2 top-4 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-950" />
                  <div className="flex items-center space-x-2">
                    <span className="font-['Orbitron'] text-xs font-bold text-cyan-300">PHASE 3: EARTH INDEPENDENT</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/70 text-cyan-300 font-bold animate-pulse">
                      ★ THIS APP'S DOMAIN
                    </span>
                  </div>
                  <p className="text-slate-200 text-xs">
                    Permanent human arrival on the Martian surface. Reaching months-long transit isolation with up to 44-minute two-way radio latencies. Crews must build habitats, harvest local resources, navigate uncharted geological terrains, and make real-time survival decisions without human controllers on Earth.
                  </p>
                  <p className="text-cyan-300 text-xs font-semibold pt-1">
                    → Our application is engineered directly to serve as the core digital operational layer for Phase 3 colonists.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Quick Action Buttons */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#070c17] flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0">
          <div className="flex items-center space-x-2 text-slate-400">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">NASA Space Apps Challenge 2026 // Team Quanta Buddies</span>
            <span className="sm:hidden">Quanta Buddies 2026</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (onSelectAction) onSelectAction('AI_HUB');
                onClose();
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-lg shadow transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>TEST AUTONOMOUS AI</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
