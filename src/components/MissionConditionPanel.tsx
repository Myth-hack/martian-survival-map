/**
 * Mission Condition & Operational Readiness Telemetry Panel
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * 
 * Displays dedicated datasets:
 * - Mission Status (Operational phase, flight director approval, abort margin, sol progress)
 * - Crew Readiness (Biometrics, suit pressure, fatigue index, EVA authorization status)
 * - Operational Windows (EVA traverses, solar recharge windows, orbital comms passes, core drilling)
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Heart,
  Activity,
  Radio,
  Sparkles,
  Zap,
  Target,
  FileCheck
} from 'lucide-react';
import { MarsMissionConditionData, OperationalWindow } from '../types';
import { RoverTelemetryD3Chart } from './RoverTelemetryD3Chart';

interface MissionConditionPanelProps {
  missionCondition: MarsMissionConditionData;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const MissionConditionPanel: React.FC<MissionConditionPanelProps> = ({
  missionCondition,
  onRefresh,
  isRefreshing = false
}) => {
  const [windowFilter, setWindowFilter] = useState<'ALL' | 'EVA' | 'POWER' | 'DRILL' | 'COMMS'>('ALL');
  const [showFullCrewDetails, setShowFullCrewDetails] = useState<boolean>(false);
  const [showFlightChecklist, setShowFlightChecklist] = useState<boolean>(false);

  const { missionStatus, crewReadiness, operationalWindows } = missionCondition;

  const filteredWindows = operationalWindows.filter((win) => {
    if (windowFilter === 'ALL') return true;
    if (windowFilter === 'EVA') return win.type === 'EVA_TRAVERSE';
    if (windowFilter === 'POWER') return win.type === 'SOLAR_RECHARGE' || win.type === 'HAB_LIFE_SUPPORT';
    if (windowFilter === 'DRILL') return win.type === 'DRILL_SAMPLING';
    if (windowFilter === 'COMMS') return win.type === 'ORBITAL_COMMS_PASS';
    return true;
  });

  return (
    <div className="bg-[#090d16]/95 border border-cyan-900/60 rounded-xl p-4 shadow-xl backdrop-blur-md font-sans text-slate-200">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/40 pb-3 mb-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-100">
                Mission Condition & Crew Readiness
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-950/80 border border-emerald-500/60 text-emerald-300">
                {missionStatus.state}
              </span>
            </div>
            <p className="text-[10px] font-mono text-cyan-400/80 mt-0.5">
              {missionCondition.missionName} • PHASE: {missionCondition.currentPhase}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800">
            SOL {missionCondition.solNumber} PROGRESS: {missionStatus.solProgressPct}%
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 rounded-md bg-slate-900 hover:bg-cyan-950 border border-slate-700/60 text-slate-400 hover:text-cyan-300 transition-colors"
              title="Refresh Mission Telemetry"
              aria-label="Refresh Mission Telemetry"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 1. Mission Status Overview Banner */}
      <div className="p-3 rounded-lg bg-gradient-to-r from-[#0d1627] to-slate-900 border border-cyan-800/40 mb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-xs font-bold text-slate-100">
              {missionStatus.headline}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/40 text-cyan-300">
              Abort Margin: <strong>{missionStatus.abortThresholdMarginPct}%</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/40 text-emerald-300 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Flight Director: GO</span>
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
          {missionStatus.details} Primary traverse corridor: <strong className="text-cyan-300 font-semibold">{missionStatus.activePriorityVector}</strong>.
        </p>

        {/* Operational Checklist Toggle */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => setShowFlightChecklist(!showFlightChecklist)}
            className="flex items-center space-x-1.5 text-[10px] font-mono text-cyan-400 hover:text-cyan-200 transition-colors"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>
              Flight Rules Checklist: {missionStatus.activeChecklistCompleted}/{missionStatus.activeChecklistTotal} Verified ({showFlightChecklist ? 'Hide' : 'Inspect'})
            </span>
          </button>
          <span className="text-[10px] font-mono text-slate-400">
            Autonomous Guardrails: {missionStatus.autonomousControlActive ? 'ARMED' : 'MANUAL'}
          </span>
        </div>

        {showFlightChecklist && (
          <div className="mt-2 p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300 animate-fadeIn">
            <div className="flex items-center justify-between text-emerald-400">
              <span>✓ NASA Human Integration Design Handbook (HIDH) Compliance</span>
              <span>PASSED</span>
            </div>
            <div className="flex items-center justify-between text-emerald-400">
              <span>✓ Minimum walkback O2 reserve margin (≥ 45 min buffer)</span>
              <span>VERIFIED (16.5h reserve)</span>
            </div>
            <div className="flex items-center justify-between text-emerald-400">
              <span>✓ Rover battery thermal pre-conditioning cycle</span>
              <span>COMPLETE (94% SOC)</span>
            </div>
            <div className="flex items-center justify-between text-emerald-400">
              <span>✓ MRO Odyssey X-Band Uplink pass synchronized</span>
              <span>LOCKED</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Real-Time D3 Rover Telemetry Stream (Battery, Motor Temperature, Signal Strength) */}
      <div className="mb-4">
        <RoverTelemetryD3Chart
          roverName="Perseverance (Mars 2020)"
          initialBattery={88.4}
          initialMotorTemp={22.6}
          initialSignalDbm={-72.8}
        />
      </div>

      {/* 3. Crew Readiness & Biometric Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-['Orbitron'] text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Crew Readiness ({crewReadiness.activeCrewCount} Personnel)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950/80 border border-indigo-500/50 text-indigo-300">
              {crewReadiness.evaStatus.replace(/_/g, ' ')}
            </span>
            <button
              onClick={() => setShowFullCrewDetails(!showFullCrewDetails)}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
            >
              {showFullCrewDetails ? 'Compact Cards' : 'View Vitals'}
            </button>
          </div>
        </div>

        {/* High-level Crew Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[9px] font-mono text-slate-400 uppercase">Readiness Score</div>
            <div className="font-mono text-sm font-bold text-emerald-300 mt-0.5">
              {crewReadiness.overallReadinessPct}%
            </div>
            <div className="text-[9px] font-mono text-slate-500">Nominal range &gt;90%</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[9px] font-mono text-slate-400 uppercase">Suit Pressure</div>
            <div className="font-mono text-sm font-bold text-cyan-300 mt-0.5">
              {crewReadiness.suitIntegrityPct}% Integrity
            </div>
            <div className="text-[9px] font-mono text-slate-500">29.6 kPa pure O2</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[9px] font-mono text-slate-400 uppercase">Life Support O2</div>
            <div className="font-mono text-sm font-bold text-purple-300 mt-0.5">
              {crewReadiness.lifeSupportReserveHours} Hours
            </div>
            <div className="text-[9px] font-mono text-slate-500">Walkback safe margin</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[9px] font-mono text-slate-400 uppercase">Fatigue Index</div>
            <div className="font-mono text-sm font-bold text-amber-300 mt-0.5">
              {crewReadiness.averageFatigueIndex} / 100
            </div>
            <div className="text-[9px] font-mono text-slate-500">Low cognitive load</div>
          </div>
        </div>

        {/* Detailed Astronaut Roster (when expanded or full) */}
        {showFullCrewDetails ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fadeIn">
            {crewReadiness.crewMembers.map((member) => (
              <div
                key={member.id}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[10px] font-mono"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">{member.name}</span>
                  <span className="text-emerald-400 font-bold">{member.readinessScorePct}% Ready</span>
                </div>
                <div className="text-slate-400 text-[9px] mb-1.5">{member.role}</div>
                <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-300 border-t border-slate-900 pt-1">
                  <div>HR: <strong className="text-slate-100">{member.heartRateBpm} bpm</strong></div>
                  <div>Suit: <strong className="text-cyan-300">{member.suitPressureKPa} kPa</strong></div>
                  <div>Temp: <strong className="text-slate-100">{member.coreTempC}°C</strong></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>All 4 crew members certified for immediate surface egress.</span>
            </div>
            <span className="text-slate-400">Shift Elapsed: 4.2h / 8.0h</span>
          </div>
        )}
      </div>

      {/* 3. Operational Windows Section with Interactive Filter Options */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-['Orbitron'] text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Operational Windows ({filteredWindows.length})
            </span>
          </div>

          {/* Interactive Filter Options */}
          <div className="flex items-center space-x-1 text-[10px] font-mono bg-slate-950/80 p-0.5 rounded-md border border-slate-800">
            <button
              onClick={() => setWindowFilter('ALL')}
              className={`px-2 py-0.5 rounded transition-colors ${
                windowFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setWindowFilter('EVA')}
              className={`px-2 py-0.5 rounded transition-colors ${
                windowFilter === 'EVA' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EVA
            </button>
            <button
              onClick={() => setWindowFilter('POWER')}
              className={`px-2 py-0.5 rounded transition-colors ${
                windowFilter === 'POWER' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Power
            </button>
            <button
              onClick={() => setWindowFilter('DRILL')}
              className={`px-2 py-0.5 rounded transition-colors ${
                windowFilter === 'DRILL' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Drill
            </button>
            <button
              onClick={() => setWindowFilter('COMMS')}
              className={`px-2 py-0.5 rounded transition-colors ${
                windowFilter === 'COMMS' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Comms
            </button>
          </div>
        </div>

        {/* Operational Windows List */}
        <div className="space-y-2">
          {filteredWindows.map((win: OperationalWindow) => (
            <div
              key={win.id}
              className="p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-950/90 border border-slate-800 transition-all text-[11px] font-mono"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      win.status === 'OPEN' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <strong className="text-slate-100">{win.title}</strong>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                    {win.windowStartLmts} - {win.windowEndLmts} LMST ({win.durationMinutes}m)
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      win.status === 'OPEN'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                    }`}
                  >
                    {win.status} ({win.optimalScorePct}%)
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Constraint: {win.primaryConstraint}</span>
                <span className="text-cyan-400 font-semibold">Action: {win.recommendedAction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MissionConditionPanel;
