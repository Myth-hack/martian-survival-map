/**
 * GIS Layer Management Panel
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Multi-layer toggle controls, opacity blending, and NASA data-source metadata
 */

import React from 'react';
import { Layers, Sliders, Eye, EyeOff, Info, CheckCircle2 } from 'lucide-react';
import { MapLayerConfig } from '../types';

interface LayerControlsProps {
  layers: MapLayerConfig[];
  onToggleLayer: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onApplyPreset: (presetName: 'ROVER' | 'SCIENCE' | 'HAZARD' | 'ISRU') => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  onToggleLayer,
  onChangeOpacity,
  onApplyPreset
}) => {
  const categories = [
    { key: 'topography', label: 'Topography & Elevation' },
    { key: 'hazards', label: 'Hazards & Slope Analysis' },
    { key: 'science', label: 'Scientific Imagery & Minerals' },
    { key: 'resources', label: 'Water, Ice & Resources' },
    { key: 'rover', label: 'Rover Telemetry & Traverses' }
  ];

  return (
    <div className="bg-[#0b0f17]/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-200">
            GIS Layer Control Matrix
          </h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
          {layers.filter((l) => l.enabled).length} / {layers.length} ACTIVE
        </span>
      </div>

      {/* Quick Presets */}
      <div className="mb-4">
        <div className="text-[10px] font-mono text-slate-400 mb-1.5 uppercase">Quick Mission Presets:</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            onClick={() => onApplyPreset('ROVER')}
            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500 rounded text-[11px] font-mono text-cyan-300 transition-colors"
          >
            Rover Drive
          </button>
          <button
            onClick={() => onApplyPreset('SCIENCE')}
            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500 rounded text-[11px] font-mono text-amber-300 transition-colors"
          >
            Astrobiology
          </button>
          <button
            onClick={() => onApplyPreset('HAZARD')}
            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-red-500 rounded text-[11px] font-mono text-red-300 transition-colors"
          >
            Hazard Warning
          </button>
          <button
            onClick={() => onApplyPreset('ISRU')}
            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500 rounded text-[11px] font-mono text-emerald-300 transition-colors"
          >
            ISRU Ice & H2O
          </button>
        </div>
      </div>

      {/* Layer List Grouped by Category */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {categories.map((cat) => {
          const catLayers = layers.filter((l) => l.category === cat.key);
          if (catLayers.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-2">
              <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider">
                {cat.label}
              </div>

              {catLayers.map((layer) => (
                <div
                  key={layer.id}
                  className={`p-2.5 rounded-lg border transition-all ${
                    layer.enabled
                      ? 'bg-slate-900/80 border-slate-700/90'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2">
                      <button
                        onClick={() => onToggleLayer(layer.id)}
                        className={`mt-0.5 p-1 rounded transition-colors ${
                          layer.enabled
                            ? 'bg-cyan-600 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title={layer.enabled ? 'Disable Layer' : 'Enable Layer'}
                      >
                        {layer.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-semibold text-slate-200">
                            {layer.name}
                          </span>
                          {layer.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {layer.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {layer.description}
                        </p>
                        <div className="text-[9px] font-mono text-cyan-400/80 mt-1 flex items-center space-x-1">
                          <Info className="w-2.5 h-2.5" />
                          <span>{layer.nasaSource}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opacity slider when enabled */}
                  {layer.enabled && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-slate-400">Opacity:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={layer.opacity}
                        onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-cyan-300 w-8 text-right">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
