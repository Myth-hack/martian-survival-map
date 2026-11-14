/**
 * AI Hazard Detection & Safety Assessment Panel
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Automatic identification of steep slopes, sand ripples, boulder clusters, and dynamic recalculations
 */

import React from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck, Flame, Compass, ArrowRight, RefreshCw } from 'lucide-react';
import { HazardZone } from '../types';
import { ProvenanceBadge } from './ProvenanceBadge';

interface HazardDetectionPanelProps {
  hazards: HazardZone[];
  selectedHazardId: string | null;
  onSelectHazard: (hazard: HazardZone) => void;
  onTriggerHazardEvent: () => void;
  isRerouting: boolean;
}

export const HazardDetectionPanel: React.FC<HazardDetectionPanelProps> = ({
  hazards,
  selectedHazardId,
  onSelectHazard,
  onTriggerHazardEvent,
  isRerouting
}) => {
  return (
    <div className="space-glass rounded-xl p-4 shadow-2xl border border-red-500/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-200">
            AI Hazard Detection & Safety
          </h3>
          <ProvenanceBadge provenance="SIMULATED" size="xs" />
        </div>
        <span className="text-[10px] font-mono text-red-400 px-2 py-0.5 rounded bg-red-950/60 border border-red-800/40">
          {hazards.filter((h) => h.riskLevel === 'CRITICAL' || h.riskLevel === 'HIGH').length} CRITICAL/HIGH
        </span>
      </div>

      {/* Dynamic Hazard Recalculation Simulation Button */}
      <div className="mb-3">
        <button
          onClick={onTriggerHazardEvent}
          disabled={isRerouting}
          className="w-full py-2 px-3 bg-red-950/40 hover:bg-red-900/40 border border-red-700/60 hover:border-red-500 rounded-lg text-xs font-mono font-bold text-red-300 flex items-center justify-center space-x-2 transition-all shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRerouting ? 'animate-spin' : ''}`} />
          <span>{isRerouting ? 'DYNAMICALLY RECALCULATING VECTORS...' : 'SIMULATE REAL-TIME HAZARD SHIFT'}</span>
        </button>
      </div>

      {/* Hazard Zones List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {hazards.map((haz) => {
          const isSelected = haz.id === selectedHazardId;
          const badgeColor =
            haz.riskLevel === 'CRITICAL'
              ? 'bg-red-950/80 border-red-600 text-red-300'
              : haz.riskLevel === 'HIGH'
              ? 'bg-amber-950/80 border-amber-600 text-amber-300'
              : 'bg-yellow-950/80 border-yellow-600 text-yellow-300';

          return (
            <div
              key={haz.id}
              onClick={() => onSelectHazard(haz)}
              className={`p-3 rounded-lg border backdrop-blur-md cursor-pointer transition-all ${
                isSelected
                  ? 'bg-red-950/30 border-red-500 shadow-md shadow-red-950/30'
                  : 'bg-slate-900/20 border-slate-700/50 hover:border-red-500/50 hover:bg-slate-900/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                <span className="font-mono text-xs font-bold text-slate-200 break-words min-w-0">
                  {haz.title}
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                  {haz.riskLevel}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                {haz.description}
              </p>

              {/* Hazard specs */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-900/25 backdrop-blur-md p-2 rounded border border-slate-700/50 mb-2">
                <div>
                  <span className="text-slate-500">MAX SLOPE: </span>
                  <span className={haz.maxSlopeDeg > 15 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                    {haz.maxSlopeDeg}°
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">RADIUS: </span>
                  <span className="text-slate-300 font-bold">{haz.radiusMeters}m</span>
                </div>
              </div>

              {/* Mitigation Guidance */}
              <div className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/30 border border-emerald-800/30 p-1.5 rounded">
                <span className="font-bold text-emerald-300">MITIGATION: </span>
                <span>{haz.mitigationAdvice}</span>
              </div>

              <div className="text-[9px] font-mono text-slate-500 mt-1.5">
                DETECTION: {haz.detectedBy}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
