/**
 * EVA & Marswalk Mission Planner & Consumables Simulator
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Astronaut walk timeline, metabolic consumption, science stop planner, and Emergency Return simulation
 */

import React, { useState } from 'react';
import {
  User,
  Heart,
  Wind,
  Battery,
  AlertOctagon,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { MarswalkConsumables } from '../types';

interface MarswalkPlannerProps {
  onTriggerEmergencyReturn: () => void;
  isEmergencyReturnActive: boolean;
}

export const MarswalkPlanner: React.FC<MarswalkPlannerProps> = ({
  onTriggerEmergencyReturn,
  isEmergencyReturnActive
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [consumables, setConsumables] = useState<MarswalkConsumables>({
    totalDurationHours: 4.0,
    elapsedMinutes: 65,
    oxygenRemainingPct: 82,
    batteryRemainingPct: 87,
    coolingWaterRemainingPct: 89,
    co2ScrubberCapacityPct: 79,
    metabolicRateWatts: 340,
    heartRateBpm: 92,
    suitPressureKPa: 29.6, // ~4.3 psi nominal pure O2 suit pressure
    ambientTempC: -28.5
  });

  const waypoints = [
    { id: 'wp_airlock', label: 'Habitat Airlock Alpha', time: '00:00', status: 'COMPLETED', task: 'Suit pressure integrity check & depress' },
    { id: 'wp_delta_front', label: 'Western Delta Front Outcrop', time: '00:45', status: 'ACTIVE', task: 'Drill sample core #04 (lacustrine mudstone)' },
    { id: 'wp_kodiak_scarp', label: 'Kodiak Mesa Clinoform Vantage', time: '01:50', status: 'PENDING', task: 'Lidar 3D stereo survey of sedimentary foresets' },
    { id: 'wp_margin_carbonate', label: 'Margin Carbonate Bath-Tub Ring', time: '02:40', status: 'PENDING', task: 'Microscopic imaging of stromatolite-like laminations' },
    { id: 'wp_return', label: 'Pressurized Rover Airlock Return', time: '03:45', status: 'PENDING', task: 'Sample transfer & repressurization' }
  ];

  return (
    <div className="bg-[#0b0f17]/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-emerald-400" />
          <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-200">
            Marswalk & EVA Mission Planner
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
          EVA-02 IN PROGRESS
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

      {/* Astronaut Suit Consumables Telemetry Grid */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 mb-4 space-y-2.5">
        <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider">
          Astronaut Suit Telemetry (HIDH Standards):
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {/* Oxygen Meter */}
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px]">OXYGEN (O2)</span>
              <Wind className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="font-bold text-cyan-300 text-sm">{consumables.oxygenRemainingPct}%</div>
            <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded"
                style={{ width: `${consumables.oxygenRemainingPct}%` }}
              />
            </div>
          </div>

          {/* Suit Battery */}
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px]">BATTERY</span>
              <Battery className="w-3 h-3 text-amber-400" />
            </div>
            <div className="font-bold text-amber-300 text-sm">{consumables.batteryRemainingPct}%</div>
            <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded"
                style={{ width: `${consumables.batteryRemainingPct}%` }}
              />
            </div>
          </div>

          {/* Metabolic Load */}
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px]">METABOLIC</span>
              <Heart className="w-3 h-3 text-red-400" />
            </div>
            <div className="font-bold text-red-300 text-sm">{consumables.metabolicRateWatts} W</div>
            <div className="text-[9px] text-slate-500">{consumables.heartRateBpm} BPM</div>
          </div>

          {/* Suit Pressure */}
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px]">PRESSURE</span>
              <ShieldAlert className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="font-bold text-emerald-300 text-sm">{consumables.suitPressureKPa} kPa</div>
            <div className="text-[9px] text-slate-500">Nominal 100% O2</div>
          </div>
        </div>
      </div>

      {/* Marswalk Waypoint Timeline */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider">
          EVA Timeline & Science Stop Schedule:
        </div>

        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
          {waypoints.map((wp) => (
            <div
              key={wp.id}
              className={`p-2 rounded border text-xs font-mono flex items-start justify-between gap-2 ${
                wp.status === 'ACTIVE'
                  ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200'
                  : wp.status === 'COMPLETED'
                  ? 'bg-slate-950/40 border-slate-800 text-slate-400 line-through'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="space-y-0.5">
                <div className="font-bold flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-500">[{wp.time}]</span>
                  <span>{wp.label}</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {wp.task}
                </div>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  wp.status === 'ACTIVE'
                    ? 'bg-cyan-900 text-cyan-200 border border-cyan-600'
                    : wp.status === 'COMPLETED'
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-800/60 text-slate-500'
                }`}
              >
                {wp.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
