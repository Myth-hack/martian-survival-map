/**
 * Basecamp Scanner Component
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Regional basecamp site suitability, terrain slope analysis, radiation shielding & water ice proximity scanner
 */

import React from 'react';
import { Radio, ShieldCheck, Sun, Droplets, Mountain, Compass, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { MapRegionId, MarsCoordinates } from '../types';
import { MARS_REGIONS } from '../data/marsDatasets';

interface BasecampScannerProps {
  selectedRegion: MapRegionId;
  onSetBasecampLocation?: (coords: MarsCoordinates) => void;
  onFlyToCoordinates?: (coords: MarsCoordinates) => void;
}

export const BasecampScanner: React.FC<BasecampScannerProps> = ({
  selectedRegion,
  onSetBasecampLocation,
  onFlyToCoordinates,
}) => {
  const region = MARS_REGIONS.find((r) => r.id === selectedRegion) || MARS_REGIONS[0];

  // Basecamp suitability heuristics based on regional GIS data
  const getSuitabilityMetrics = (id: MapRegionId) => {
    switch (id) {
      case 'jezero':
        return {
          score: 94,
          tier: 'OPTIMAL (CLASS ALPHA)',
          slopeScore: 92,
          waterIceScore: 88,
          radiationShieldScore: 85,
          solarPowerScore: 96,
          commsLoS: 98,
          candidateName: 'Jezero Delta Outpost (Neratva River Delta)',
          coords: { lat: 18.38, lon: 77.58, elevationMeters: -2500, name: 'Jezero Delta Outpost' },
          advantages: ['Ancient lakebed sediments for biosignatures', 'Flat river delta terrace (<3.2° slope)', 'Excellent solar flux year-round'],
          hazards: ['Mild dust accumulation on solar arrays', 'Scattered boulders near rim wall']
        };
      case 'gale':
        return {
          score: 91,
          tier: 'OPTIMAL (CLASS ALPHA)',
          slopeScore: 88,
          waterIceScore: 82,
          radiationShieldScore: 90,
          solarPowerScore: 94,
          commsLoS: 95,
          candidateName: 'Gale Crater Mt. Sharp Base Camp',
          coords: { lat: -5.4, lon: 137.8, elevationMeters: -4450, name: 'Gale Mt Sharp Base Camp' },
          advantages: ['Protected crater floor atmosphere', 'Layered clay-bearing strata', 'Low wind shear valley floor'],
          hazards: ['Sharp wind-carved yardangs', 'Active sand dune migrations']
        };
      case 'olympus_mons':
        return {
          score: 64,
          tier: 'HIGH RISK (CLASS CHARLIE)',
          slopeScore: 45,
          waterIceScore: 60,
          radiationShieldScore: 40,
          solarPowerScore: 90,
          commsLoS: 99,
          candidateName: 'Olympus Mons Basal Scarp Shelter',
          coords: { lat: 18.65, lon: -133.8, elevationMeters: 21229, name: 'Olympus Mons Basal Scarp' },
          advantages: ['Exceptional direct orbital LOS', 'Unprecedented volcanic geology'],
          hazards: ['Extreme cliff scarps (>35° slope)', 'Ultra-thin atmospheric pressure (<100 Pa)', 'Severe radiation exposure']
        };
      case 'valles_marineris':
        return {
          score: 86,
          tier: 'VIABLE (CLASS BRAVO)',
          slopeScore: 72,
          waterIceScore: 85,
          radiationShieldScore: 95,
          solarPowerScore: 78,
          commsLoS: 82,
          candidateName: 'Melas Chasma Canyon Base',
          coords: { lat: -10.2, lon: -65.5, elevationMeters: -3500, name: 'Melas Chasma Canyon Base' },
          advantages: ['Deep canyon wall natural radiation shield', 'Subsurface hydrated sulfates', 'Higher atmospheric pressure floor'],
          hazards: ['Steep canyon talus slopes', 'Orbital comms blackouts during low passes']
        };
      case 'hellas_planitia':
        return {
          score: 89,
          tier: 'VIABLE (CLASS BRAVO)',
          slopeScore: 85,
          waterIceScore: 92,
          radiationShieldScore: 92,
          solarPowerScore: 80,
          commsLoS: 88,
          candidateName: 'Hellas Planitia Deep Basin Habitat',
          coords: { lat: -42.4, lon: 70.5, elevationMeters: -7152, name: 'Hellas Deep Basin Habitat' },
          advantages: ['Highest atmospheric pressure on Mars (~1240 Pa)', 'Superior cosmic ray atmospheric shielding', 'Subsurface ice sheets (SWIM radar)'],
          hazards: ['Frequent regional dust storms', 'Seasonal frost condensation']
        };
      case 'planum_boreum':
        return {
          score: 95,
          tier: 'OPTIMAL (CLASS ALPHA)',
          slopeScore: 95,
          waterIceScore: 99,
          radiationShieldScore: 88,
          solarPowerScore: 82,
          commsLoS: 90,
          candidateName: 'Planum Boreum Ice Dome ISRU Station',
          coords: { lat: 88.0, lon: 0.0, elevationMeters: -1950, name: 'Planum Boreum Ice Station' },
          advantages: ['Massive water-ice sheet for propellant & life support', 'Extremely flat deposition plains', 'Abundant ISRU reserves'],
          hazards: ['Sub-zero polar temperatures', 'Seasonal CO2 frost accumulation']
        };
      case 'elysium_planitia':
        return {
          score: 93,
          tier: 'OPTIMAL (CLASS ALPHA)',
          slopeScore: 96,
          waterIceScore: 80,
          radiationShieldScore: 86,
          solarPowerScore: 95,
          commsLoS: 96,
          candidateName: 'Elysium Solar & Seismology Outpost',
          coords: { lat: 4.5, lon: 154.2, elevationMeters: -2610, name: 'Elysium Solar Outpost' },
          advantages: ['Smooth basaltic pavement with zero sand dunes', 'Optimal equatorial solar power', 'Firm foundation verified by InSight'],
          hazards: ['Cerberus Fossae seismic rift proximity']
        };
      case 'meridiani_planum':
        return {
          score: 92,
          tier: 'OPTIMAL (CLASS ALPHA)',
          slopeScore: 97,
          waterIceScore: 78,
          radiationShieldScore: 85,
          solarPowerScore: 96,
          commsLoS: 97,
          candidateName: 'Meridiani Hematite Plains Base',
          coords: { lat: -1.95, lon: 354.5, elevationMeters: -1420, name: 'Meridiani Hematite Base' },
          advantages: ['Proven safe duricrust landing plain', 'Predictable dust cycles', 'Equatorial solar exposure'],
          hazards: ['Sulfate ripple dunes and subsurface basaltic outcrops']
        };
      case 'noctis_labyrinthus':
        return {
          score: 74,
          tier: 'VIABLE (CLASS BRAVO)',
          slopeScore: 68,
          waterIceScore: 84,
          radiationShieldScore: 92,
          solarPowerScore: 72,
          commsLoS: 80,
          candidateName: 'Noctis Labyrinthus Subsurface Cave Hub',
          coords: { lat: -7.0, lon: -102.2, elevationMeters: 1100, name: 'Noctis Cave Hub' },
          advantages: ['Natural radiation shielding inside graben caves', 'Hydrated sulfate mineral deposits', 'Protected microclimates'],
          hazards: ['Rugged terrain approach and steep cliff walls']
        };
      case 'acidalia_planitia':
        return {
          score: 94,
          tier: 'OPTIMAL (CLASS ALPHA)',
          slopeScore: 94,
          waterIceScore: 95,
          radiationShieldScore: 89,
          solarPowerScore: 88,
          commsLoS: 92,
          candidateName: 'Acidalia Planitia Lowland Basecamp',
          coords: { lat: 49.8, lon: 339.3, elevationMeters: -4120, name: 'Acidalia Basecamp' },
          advantages: ['Vast flat northern lowland landing corridor', 'Accessible subsurface permafrost table', 'Thick atmospheric column'],
          hazards: ['Subsurface permafrost heave and high latitude winter cold']
        };
      default:
        return {
          score: 83,
          tier: 'VIABLE (CLASS BRAVO)',
          slopeScore: 80,
          waterIceScore: 78,
          radiationShieldScore: 82,
          solarPowerScore: 86,
          commsLoS: 90,
          candidateName: `${region.name} Recon Outpost`,
          coords: { lat: region.center.lat, lon: region.center.lon, elevationMeters: region.center.elevationMeters, name: `${region.name} Outpost` },
          advantages: ['Stable terrain topography', 'Favorable exploration access'],
          hazards: ['Variable regolith compaction']
        };
    }
  };

  const metrics = getSuitabilityMetrics(selectedRegion);

  return (
    <div className="space-y-4 font-mono text-slate-200">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#06122b] via-[#091b3d] to-[#06122b] border border-emerald-500/40 backdrop-blur-md shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">BASECAMP SCANNER</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold">
                {metrics.tier}
              </span>
            </div>
            <h3 className="font-['Orbitron'] text-base font-bold text-white mt-0.5">
              {metrics.candidateName}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:self-center">
          <span className="text-xs text-slate-400">Suitability Rating:</span>
          <span className="text-2xl font-bold font-['Orbitron'] text-emerald-400">
            {metrics.score}%
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Terrain Flatness</span>
            <Mountain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-cyan-300">{metrics.slopeScore}%</span>
            <span className="text-[10px] text-slate-500">&lt;3 font-mono° slope</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${metrics.slopeScore}%` }} />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Water Ice Proximity</span>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-blue-300">{metrics.waterIceScore}%</span>
            <span className="text-[10px] text-slate-500">SWIM Radar</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-400 h-full rounded-full" style={{ width: `${metrics.waterIceScore}%` }} />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Radiation Shielding</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-purple-300">{metrics.radiationShieldScore}%</span>
            <span className="text-[10px] text-slate-500">Regolith Shield</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-purple-400 h-full rounded-full" style={{ width: `${metrics.radiationShieldScore}%` }} />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Solar Power Flux</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-amber-300">{metrics.solarPowerScore}%</span>
            <span className="text-[10px] text-slate-500">590 W/m²</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${metrics.solarPowerScore}%` }} />
          </div>
        </div>
      </div>

      {/* Advantages vs Hazards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>PRIMARY BASECAMP ADVANTAGES</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {metrics.advantages.map((adv, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{adv}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>REGIONAL HAZARD MITIGATIONS</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {metrics.hazards.map((haz, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{haz}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800">
        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Coordinates: <strong className="text-amber-300">{metrics.coords.lat}°N, {metrics.coords.lon}°E</strong> ({metrics.coords.elevationMeters}m)</span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {onFlyToCoordinates && (
            <button
              onClick={() => onFlyToCoordinates(metrics.coords)}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-all cursor-pointer"
            >
              Pan Map to Location
            </button>
          )}

          {onSetBasecampLocation && (
            <button
              onClick={() => onSetBasecampLocation(metrics.coords)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
            >
              Set as Active Basecamp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
