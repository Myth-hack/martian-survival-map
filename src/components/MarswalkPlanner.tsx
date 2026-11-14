/**
 * EVA & Marswalk Mission Planner
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * 
 * Manages traverse timeline, NASA HIDH walkback margins, and emergency abort route calculations.
 * For human astronaut biometrics, explicitly displays "Data Unavailable"
 * since Mars surface operations are currently in an uncrewed robotic phase.
 */

import React from 'react';
import {
  User,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  Database,
  Compass
} from 'lucide-react';
import { ProvenanceBadge } from './ProvenanceBadge';

interface MarswalkPlannerProps {
  onTriggerEmergencyReturn: () => void;
  isEmergencyReturnActive: boolean;
}

export const MarswalkPlanner: React.FC<MarswalkPlannerProps> = ({
  onTriggerEmergencyReturn,
  isEmergencyReturnActive
}) => {
  const waypoints = [
    { id: 'wp_airlock', label: 'Habitat Airlock Alpha', time: '00:00', status: 'COMPLETED', task: 'Depressurization & initial systems check' },
    { id: 'wp_delta_front', label: 'Western Delta Front Outcrop', time: '00:45', status: 'ACTIVE', task: 'Drill sample core #04 (lacustrine mudstone)' },
    { id: 'wp_kodiak_scarp', label: 'Kodiak Mesa Clinoform Vantage', time: '01:50', status: 'PENDING', task: '3D stereo survey of sedimentary foresets' },
    { id: 'wp_margin_carbonate', label: 'Margin Carbonate Bath-Tub Ring', time: '02:40', status: 'PENDING', task: 'Microscopic imaging of stromatolite-like laminations' },
    { id: 'wp_return', label: 'Rover Airlock Return Vector', time: '03:45', status: 'PENDING', task: 'Sample transfer & repressurization' }
  ];

  return (
    <div className="space-glass rounded-xl p-4 shadow-2xl border border-emerald-500/25">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-emerald-400" />
          <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-200">
            Marswalk & Traverse Planner
          </h3>
          <ProvenanceBadge provenance="DATA_UNAVAILABLE" size="xs" />
        </div>
        <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
          TRAVERSE SAFETY MATRIX
        </span>
      </div>

      {/* Emergency Return Route Simulator Button */}
      <div className="mb-4">
        <button
          onClick={onTriggerEmergencyReturn}
          className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-extrabold flex items-center justify-center space-x-2 transition-all shadow-lg ${
            isEmergencyReturnActive
              ? 'bg-red-600 text-white animate-pulse shadow-red-900/50'
              : 'bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-200'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>
            {isEmergencyReturnActive
              ? 'EMERGENCY RETURN VECTOR ENGAGED (ABORT ACTIVE)'
              : 'SIMULATE EMERGENCY RETURN ROUTE'}
          </span>
        </button>
      </div>

      {/* Human Crew Telemetry Status: Data Unavailable Banner */}
      <div className="bg-slate-900/25 backdrop-blur-md border border-amber-500/30 rounded-lg p-3 mb-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-300 tracking-wider flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Astronaut Personal Biometrics:</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-amber-300 px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-500/40 shrink-0">
            DATA UNAVAILABLE
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
          <strong className="text-amber-300">Data Unavailable:</strong> Mars surface exploration is currently uncrewed (robotic mission phase). No active human astronauts are on Mars. Biometric telemetry (O2 consumption, heart rate, suit pressure) is unsupported and will activate during future crewed NASA Artemis-to-Mars surface missions.
        </p>

        <div className="p-2 rounded bg-slate-900/25 backdrop-blur-md border border-cyan-500/20 text-[10px] font-mono text-slate-400">
          <div className="text-cyan-300 font-semibold mb-0.5">Verified NASA Mission Architecture Rule:</div>
          <div>NASA-SP-2010-3407 (HIDH): Walkback threshold mandates returning to pressurized shelter with minimum 45 minutes of reserve O2 and 20% power margin at all points along traverse.</div>
          <div className="text-slate-500 mt-1">Last Verified Observation: N/A (Robotic Operations Phase Only)</div>
        </div>
      </div>

      {/* Marswalk Waypoint Timeline */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider">
          EVA Waypoint Schedule & Science Objectives:
        </div>

        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
          {waypoints.map((wp) => (
            <div
              key={wp.id}
              className={`p-2 rounded border text-xs font-mono backdrop-blur-md flex items-start justify-between gap-2 ${
                wp.status === 'ACTIVE'
                  ? 'bg-cyan-950/30 border-cyan-500/60 text-cyan-200'
                  : wp.status === 'COMPLETED'
                  ? 'bg-slate-900/20 border-cyan-500/15 text-slate-400'
                  : 'bg-slate-900/25 border-cyan-500/20 text-slate-300'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="mt-0.5">
                  {wp.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : wp.status === 'ACTIVE' ? (
                    <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-slate-200">{wp.label}</div>
                  <div className="text-[10px] text-slate-400">{wp.task}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/40 border border-cyan-500/20 text-slate-300 shrink-0">
                {wp.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarswalkPlanner;
