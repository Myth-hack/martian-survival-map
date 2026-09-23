/**
 * "What-If" Mission Scenario Simulation Engine
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Interactive crisis scenarios: Route blocked, dust storm, biosignature divergence, suit leak, actuator faults
 */

import React from 'react';
import { HelpCircle, AlertTriangle, Wind, Sparkles, ShieldAlert, Cpu, Play, Check } from 'lucide-react';
import { WhatIfScenario } from '../types';

interface WhatIfSimulatorProps {
  scenarios: WhatIfScenario[];
  activeScenarioId: string | null;
  onToggleScenario: (scenarioId: string) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  scenarios,
  activeScenarioId,
  onToggleScenario
}) => {
  return (
    <div className="bg-[#0b0f17]/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-200">
            "What-If" Mission Scenario Engine
          </h3>
        </div>
        <span className="text-[10px] font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">
          5 SIMULATION MODELS
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mb-3">
        Test rover and astronaut survivability by introducing real-time Martian contingency events. The AI routing engine dynamically reacts and adapts trajectory vectors.
      </p>

      {/* Scenario List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {scenarios.map((scen) => {
          const isActive = scen.id === activeScenarioId;
          const icon =
            scen.category === 'DUST_STORM' ? <Wind className="w-3.5 h-3.5 text-amber-400" /> :
            scen.category === 'BIOSIGNATURE_DIV' ? <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> :
            scen.category === 'SUIT_LEAK' ? <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> :
            scen.category === 'ROVER_ACTUATOR_FAULT' ? <Cpu className="w-3.5 h-3.5 text-yellow-400" /> :
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;

          return (
            <div
              key={scen.id}
              className={`p-3 rounded-lg border transition-all ${
                isActive
                  ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  {icon}
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {scen.title}
                  </span>
                </div>

                <button
                  onClick={() => onToggleScenario(scen.id)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center space-x-1 transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5" />
                      <span>SIMULATE</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed font-mono">
                {scen.triggerPrompt}
              </p>

              {/* Impact vs AI Response */}
              <div className="space-y-1.5 text-[10px] font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="font-bold text-red-400">IMPACT ON MISSION: </span>
                  <span>{scen.impactSummary}</span>
                </div>

                <div className="p-2 rounded bg-purple-950/30 border border-purple-800/40 text-purple-200">
                  <span className="font-bold text-purple-300">AI ADAPTIVE RESPONSE: </span>
                  <span>{scen.aiSuggestedAction}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
