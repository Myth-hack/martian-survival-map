/**
 * Martian Location Quick Selector Sidebar Menu
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * 10 Iconic Martian Locations with Sci-Fi / Glassmorphism Design
 */

import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  ChevronRight,
  ChevronDown,
  Navigation,
  Globe,
  Sparkles,
  Search,
  ExternalLink,
  Flame,
  ShieldAlert,
  Droplets,
  Mountain,
  Activity
} from 'lucide-react';
import { MapRegionId, MarsCoordinates } from '../types';
import { MARS_REGIONS } from '../data/marsDatasets';

interface LocationSelectorProps {
  selectedRegion: MapRegionId;
  onSelectLocation: (regionId: MapRegionId) => void;
  onFlyToCoordinates?: (coords: MarsCoordinates) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedRegion,
  onSelectLocation,
  onFlyToCoordinates,
  isOpen = true,
  onToggleOpen,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'ROVER' | 'VOLCANO' | 'BASIN' | 'ICE'>('ALL');

  const filteredLocations = MARS_REGIONS.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.primaryScience.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'ROVER') return loc.id === 'jezero' || loc.id === 'gale' || loc.id === 'meridiani_planum' || loc.id === 'elysium_planitia';
    if (filterCategory === 'VOLCANO') return loc.id === 'olympus_mons';
    if (filterCategory === 'BASIN') return loc.id === 'hellas_planitia' || loc.id === 'valles_marineris' || loc.id === 'acidalia_planitia';
    if (filterCategory === 'ICE') return loc.id === 'planum_boreum';
    return true;
  });

  const activeLocation = MARS_REGIONS.find((r) => r.id === selectedRegion) || MARS_REGIONS[0];

  const getLocationIcon = (id: MapRegionId) => {
    switch (id) {
      case 'olympus_mons':
        return <Mountain className="w-4 h-4 text-orange-400" />;
      case 'planum_boreum':
        return <Droplets className="w-4 h-4 text-cyan-300" />;
      case 'hellas_planitia':
      case 'acidalia_planitia':
        return <Activity className="w-4 h-4 text-blue-400" />;
      case 'noctis_labyrinthus':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'jezero':
      case 'gale':
      case 'meridiani_planum':
      case 'elysium_planitia':
        return <Flame className="w-4 h-4 text-emerald-400" />;
      default:
        return <Compass className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div
      className={`bg-[#080c16]/95 border border-cyan-900/60 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-300 ${className}`}
    >
      {/* Header bar */}
      <div className="p-3.5 border-b border-cyan-950/80 bg-gradient-to-r from-cyan-950/40 via-slate-900/50 to-red-950/20 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-sm shadow-cyan-900/50">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-100 flex items-center space-x-1.5">
              <span>Martian Planetary Index</span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700/50 text-cyan-300">
                10 SITES
              </span>
            </h3>
            <p className="text-[10px] font-mono text-slate-400">Macro-to-Micro Planetary GIS</p>
          </div>
        </div>

        {onToggleOpen && (
          <button
            onClick={onToggleOpen}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {isOpen && (
        <>
          {/* Search and Category Filter Strip */}
          <div className="p-2.5 border-b border-slate-800/80 bg-slate-950/60 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crater, volcano, basin..."
                className="w-full bg-[#0b0f19] border border-slate-700/70 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[11px] font-mono text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none pb-0.5 text-[10px] font-mono">
              {(['ALL', 'ROVER', 'VOLCANO', 'BASIN', 'ICE'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${
                    filterCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Location List Viewport */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredLocations.map((loc) => {
              const isSelected = loc.id === selectedRegion;
              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc.id as MapRegionId);
                    if (onFlyToCoordinates) {
                      onFlyToCoordinates({
                        lat: loc.center.lat,
                        lon: loc.center.lon,
                        elevationMeters: loc.center.elevationMeters,
                        name: loc.name
                      });
                    }
                  }}
                  className={`p-2.5 cursor-pointer transition-all duration-200 group relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/60 via-cyan-900/20 to-slate-900/40 border-l-2 border-cyan-400'
                      : 'hover:bg-slate-900/60 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2 min-w-0">
                      <div className="mt-0.5 p-1 rounded bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40 transition-colors">
                        {getLocationIcon(loc.id as MapRegionId)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span
                            className={`font-semibold text-xs truncate ${
                              isSelected ? 'text-cyan-300 font-bold' : 'text-slate-200 group-hover:text-cyan-200'
                            }`}
                          >
                            {loc.name.split('(')[0].trim()}
                          </span>
                          {loc.name.includes('(') && (
                            <span className="text-[10px] font-mono text-slate-500 truncate">
                              ({loc.name.split('(')[1]}
                            </span>
                          )}
                        </div>

                        {/* Coordinates Pill */}
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span className="text-amber-300/90 font-medium">
                            {loc.center.lat >= 0 ? `${loc.center.lat}°N` : `${Math.abs(loc.center.lat)}°S`},{' '}
                            {loc.center.lon >= 0 ? `${loc.center.lon}°E` : `${Math.abs(loc.center.lon)}°W`}
                          </span>
                          <span>•</span>
                          <span className="text-cyan-400/90">
                            {loc.center.elevationMeters > 0 ? `+${loc.center.elevationMeters}m` : `${loc.center.elevationMeters}m`}
                          </span>
                        </div>

                        {/* Scientific Relevance Excerpt */}
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 group-hover:text-slate-300 transition-colors">
                          {loc.significance || loc.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-300'
                        }`}
                      />
                      {isSelected && (
                        <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/90 px-1 rounded border border-cyan-800/40">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredLocations.length === 0 && (
              <div className="p-6 text-center text-xs font-mono text-slate-500">
                No Martian locations found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          {/* Active Location Quick Inspection Footer */}
          <div className="p-3 bg-[#060911] border-t border-cyan-950/80 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="text-slate-400 flex items-center space-x-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                <span>SELECTED TARGET FOCUS:</span>
              </span>
              <span className="text-cyan-300 font-bold">{activeLocation.name.split(' ')[0]}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800/80">
              <strong className="text-amber-300">NASA PDS: </strong>
              {activeLocation.significance || activeLocation.description}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
