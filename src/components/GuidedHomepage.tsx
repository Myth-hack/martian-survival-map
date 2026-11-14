import React, { useRef, useState } from 'react';
import { MarsGlobeView } from './MarsGlobeView';
import marsRegionsImg from '../assets/images/mars_regions_card_1794408007780.jpg';
import marsGeologyImg from '../assets/images/mars_geology_card_1794408007365.jpg';
import marsRoutingImg from '../assets/images/mars_routing_card_1794408008868.jpg';
import marsSimulationImg from '../assets/images/mars_simulation_card_1794408008556.jpg';

import {
  Compass,
  Layers,
  MapPin,
  Sparkles,
  Microscope,
  Activity,
  Navigation,
  AlertTriangle,
  Users,
  MessageSquare,
  User,
  HelpCircle,
  ArrowRight,
  Globe,
  Radio,
  Rocket
} from 'lucide-react';
import { ExplorationSectionId, MarsCoordinates } from '../types';

interface GuidedHomepageProps {
  onSelectSection: (sectionId: ExplorationSectionId) => void;
  onGlobeClickPoint?: (coords: MarsCoordinates) => void;
  onAnalyzeCoords?: (lat: number, lon: number, elevation: number) => void;
}

export const GuidedHomepage: React.FC<GuidedHomepageProps> = ({
  onSelectSection,
  onGlobeClickPoint,
  onAnalyzeCoords
}) => {
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const handleImageError = (cardKey: string) => {
    setImgErrorMap((prev) => ({ ...prev, [cardKey]: true }));
  };

  const handleStartExploring = () => {
    if (cardsRef.current) {
      cardsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onSelectSection('REGIONS');
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-10 sm:space-y-16">
      {/* HERO SECTION: 3D Mars Globe & Guided Platform Introduction */}
      <section className="relative w-full flex flex-col lg:flex-row items-center gap-6 lg:gap-10 p-4 sm:p-8 rounded-2xl bg-gradient-to-b from-[#070d1e]/80 via-[#0a1128]/70 to-[#060a16]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_12px_48px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Subtle background atmospheric ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Hero Left Content Column */}
        <div className="w-full lg:w-5/12 flex flex-col justify-center space-y-5 sm:space-y-6 text-left z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono font-bold w-max shadow-[0_0_15px_rgba(239,68,68,0.25)]">
            <Rocket className="w-3.5 h-3.5 text-red-400 transform -rotate-45" />
            <span>NASA Space Apps Challenge 2026</span>
          </div>

          <h1 className="font-['Orbitron'] text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Interplanetary <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-400 to-cyan-400">Survival Map</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
            Explore the Martian surface, discover scientific targets, analyze terrain, and plan your Marswalk through an integrated planetary exploration platform.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleStartExploring}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-500 hover:from-red-500 hover:to-amber-500 text-white font-mono font-bold text-sm shadow-[0_0_25px_rgba(239,68,68,0.45)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer group"
            >
              <Compass className="w-5 h-5 text-amber-200 group-hover:rotate-45 transition-transform duration-300" />
              <span>START EXPLORING MARS</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onSelectSection('REGIONS')}
              className="px-5 py-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-mono text-sm font-semibold transition-all hover:bg-slate-800/80 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>10 Regions Catalog</span>
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">COVERAGE</span>
              <span className="text-cyan-300 font-bold">10 Regions</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">RESOLUTION</span>
              <span className="text-amber-300 font-bold">40m USGS DEM</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">AI ENGINE</span>
              <span className="text-emerald-300 font-bold">Gemini RAG</span>
            </div>
          </div>
        </div>

        {/* Hero Right Column: Interactive 3D Mars Globe */}
        <div className="w-full lg:w-7/12 relative flex items-center justify-center z-10 min-h-[380px] sm:min-h-[480px]">
          <MarsGlobeView
            onGlobeClickPoint={onGlobeClickPoint}
            onAnalyzeCoords={onAnalyzeCoords}
            showOverlays={true}
          />
        </div>
      </section>

      {/* SECTION HEADING & 4 GUIDED EXPLORATION CARDS GRID */}
      <section ref={cardsRef} className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">Guided 4-Step Exploration</span>
          <h2 className="font-['Orbitron'] text-2xl sm:text-3xl font-extrabold text-white">
            Choose Your Planetary Exploration Workflow
          </h2>
          <p className="text-slate-400 text-sm">
            Select any section below to start exploring regions, analyzing surface geology, planning routes, or simulating EVA missions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {/* CARD 01: Explore Martian Regions & Maps */}
          <div
            onClick={() => onSelectSection('REGIONS')}
            className="group relative rounded-2xl bg-[#080d1e]/80 border border-cyan-500/25 hover:border-cyan-400/70 p-5 backdrop-blur-md shadow-xl hover:shadow-[0_12px_32px_rgba(6,182,212,0.25)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="space-y-4">
              <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                {!imgErrorMap['regions'] ? (
                  <img
                    src={marsRegionsImg}
                    alt="Martian Regions & Maps Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError('regions')}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950/80 to-red-950/80 p-4 text-center font-mono space-y-2">
                    <Globe className="w-10 h-10 text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-amber-300">MARS REGIONS GIS</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/85 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold shadow-md">
                  01. REGIONS
                </div>
              </div>

              <div>
                <h3 className="font-['Orbitron'] text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  Explore Martian Regions & Maps
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Select from 10 Martian regions, explore the interactive Mars map, inspect elevation data, and identify potential basecamp locations.
                </p>
              </div>

              {/* Feature Tags */}
              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">Zone Selector</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">Altimetry Map</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">Basecamp Scanner</span>
              </div>
            </div>

            <div className="pt-5 mt-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSection('REGIONS');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                <span>EXPLORE REGIONS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD 02: Explore Geological Intelligence */}
          <div
            onClick={() => onSelectSection('GEOLOGY')}
            className="group relative rounded-2xl bg-[#080d1e]/80 border border-cyan-500/25 hover:border-cyan-400/70 p-5 backdrop-blur-md shadow-xl hover:shadow-[0_12px_32px_rgba(6,182,212,0.25)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="space-y-4">
              <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                {!imgErrorMap['geology'] ? (
                  <img
                    src={marsGeologyImg}
                    alt="Geological Intelligence Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError('geology')}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cyan-950/80 to-blue-950/80 p-4 text-center font-mono space-y-2">
                    <Microscope className="w-10 h-10 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-cyan-300">ORBITAL SAR RADAR</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/85 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold shadow-md">
                  02. GEOLOGY
                </div>
              </div>

              <div>
                <h3 className="font-['Orbitron'] text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                  Explore Geological Intelligence
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Investigate Martian terrain, geological formations, mineral information, elevation, and potential surface hazards.
                </p>
              </div>

              {/* Feature Tags */}
              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300">Depth Inspect</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300">Geo-Scanner</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300">Anomalies</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300">Astrobiology</span>
              </div>
            </div>

            <div className="pt-5 mt-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSection('GEOLOGY');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
              >
                <span>EXPLORE GEOLOGY</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD 03: Plan Your Marswalk */}
          <div
            onClick={() => onSelectSection('PLANNING')}
            className="group relative rounded-2xl bg-[#080d1e]/80 border border-cyan-500/25 hover:border-cyan-400/70 p-5 backdrop-blur-md shadow-xl hover:shadow-[0_12px_32px_rgba(6,182,212,0.25)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="space-y-4">
              <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                {!imgErrorMap['routing'] ? (
                  <img
                    src={marsRoutingImg}
                    alt="Plan Your Marswalk Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError('routing')}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/80 to-slate-950/80 p-4 text-center font-mono space-y-2">
                    <Navigation className="w-10 h-10 text-purple-400 animate-pulse" />
                    <span className="text-xs font-bold text-purple-300">A* ROUTE MATRIX</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/85 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold shadow-md">
                  03. PLANNING
                </div>
              </div>

              <div>
                <h3 className="font-['Orbitron'] text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  Plan Your Marswalk
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Select waypoints, analyze terrain conditions, generate alternative routes, and compare scientific value with exploration safety.
                </p>
              </div>

              {/* Feature Tags */}
              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">Waypoint Matrix</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">Hazard Heuristics</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">A* Pathfinding</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">AI Advisor</span>
              </div>
            </div>

            <div className="pt-5 mt-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSection('PLANNING');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                <span>PLAN MARSWALK</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD 04: Simulate Your Mission */}
          <div
            onClick={() => onSelectSection('SIMULATION')}
            className="group relative rounded-2xl bg-[#080d1e]/80 border border-cyan-500/25 hover:border-cyan-400/70 p-5 backdrop-blur-md shadow-xl hover:shadow-[0_12px_32px_rgba(6,182,212,0.25)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="space-y-4">
              <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                {!imgErrorMap['simulation'] ? (
                  <img
                    src={marsSimulationImg}
                    alt="Simulate Your Mission Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError('simulation')}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/80 to-teal-950/80 p-4 text-center font-mono space-y-2">
                    <User className="w-10 h-10 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-300 font-mono">EVA SUIT SIMULATOR</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/85 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold shadow-md">
                  04. SIMULATION
                </div>
              </div>

              <div>
                <h3 className="font-['Orbitron'] text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                  Simulate Your Mission
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Organize your exploration timeline, estimate mission requirements, simulate Marswalk activities, and explore emergency scenarios.
                </p>
              </div>

              {/* Feature Tags */}
              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">Mission Sequencer</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">EVA Simulation</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">Crisis Abort</span>
              </div>
            </div>

            <div className="pt-5 mt-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSection('SIMULATION');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                <span>SIMULATE MISSION</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
