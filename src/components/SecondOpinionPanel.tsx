/**
 * AI Second-Opinion & Multi-Perspective Consensus System
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Route Planner AI vs. Safety Analysis AI vs. Science Analysis AI with Human Commander Override
 */

import React from 'react';
import { Users, Shield, Compass, FlaskConical, CheckCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { SecondOpinionConsensus } from '../types';

interface SecondOpinionPanelProps {
  userId?: string;
  consensus: SecondOpinionConsensus | null;
  onCommanderApprove: (routeId: string) => void;
  isLoading: boolean;
}

export const SecondOpinionPanel: React.FC<SecondOpinionPanelProps> = ({
  userId,
  consensus,
  onCommanderApprove,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-[#0b0f17]/90 border border-slate-800 rounded-xl p-6 shadow-xl text-center font-mono text-xs text-cyan-400">
        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2" />
        <div>SYNTHESIZING MULTI-AGENT PERSPECTIVES (ROUTE + SAFETY + SCIENCE)...</div>
      </div>
    );
  }

  if (!consensus) return null;

  return (
    <div className="bg-[#0b0f17]/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-200">
            AI Second-Opinion & Decision Support
          </h3>
        </div>
        <div className="flex items-center space-x-1.5 font-mono text-xs">
          <span className="text-slate-400">CONSENSUS:</span>
          <span className="text-emerald-400 font-bold">{consensus.consensusScore}%</span>
        </div>
      </div>

      {/* 3 Collaborative Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {consensus.perspectives.map((agent, idx) => {
          const isApprove = agent.verdict === 'APPROVE';
          const icon =
            idx === 0 ? <Compass className="w-4 h-4 text-cyan-400" /> :
            idx === 1 ? <Shield className="w-4 h-4 text-emerald-400" /> :
            <FlaskConical className="w-4 h-4 text-amber-400" />;

          return (
            <div
              key={agent.agentRole}
              className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    {icon}
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {agent.agentRole}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isApprove
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-amber-950/80 border-amber-500 text-amber-300'
                    }`}
                  >
                    {agent.verdict}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-slate-500 mb-1.5">
                  {agent.agentName} (Score: {agent.score}/100)
                </div>

                <p className="text-[11px] text-slate-300 mb-2 leading-relaxed font-mono">
                  {agent.summary}
                </p>

                <ul className="space-y-1 text-[10px] font-mono text-slate-400 mb-3">
                  {agent.keyArguments.map((arg, i) => (
                    <li key={i} className="flex items-start space-x-1">
                      <span className="text-slate-600">•</span>
                      <span>{arg}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trade-Off Metric Bottom Pill */}
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono flex items-center justify-between">
                <span className="text-slate-400">{agent.tradeOffMetric.label}:</span>
                <span className="text-cyan-300 font-bold">{agent.tradeOffMetric.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trade-Off Matrix Table */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 mb-4">
        <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 mb-2">
          Decision Consensus Trade-Off Matrix (% Score):
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                <th className="pb-1.5">EVALUATION CRITERIA</th>
                <th className="pb-1.5 text-center text-cyan-400">VECTOR ALPHA (BALANCED)</th>
                <th className="pb-1.5 text-center text-emerald-400">VECTOR BETA (SAFETY)</th>
                <th className="pb-1.5 text-center text-amber-400">VECTOR GAMMA (SCIENCE)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {consensus.tradeOffMatrix.map((row) => (
                <tr key={row.criteria} className="text-slate-300">
                  <td className="py-1.5 text-slate-400">{row.criteria}</td>
                  <td className="py-1.5 text-center font-bold">{row.routeA}%</td>
                  <td className="py-1.5 text-center font-bold">{row.routeB}%</td>
                  <td className="py-1.5 text-center font-bold">{row.routeC}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Human Decision Support / Commander Override */}
      <div className="p-3 bg-gradient-to-r from-slate-900 to-cyan-950/40 border border-cyan-800/40 rounded-lg flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          <div className="font-mono text-xs">
            <div className="text-slate-200 font-bold">Human Commander Decision Control</div>
            <div className="text-[10px] text-slate-400">
              AI recommendations are advisory. Final trajectory sign-off stays with the astronaut or ground flight director.
            </div>
          </div>
        </div>

        <button
          onClick={() => onCommanderApprove(consensus.recommendedRouteId)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-extrabold text-xs rounded-lg shadow-md shadow-cyan-950/40 flex items-center space-x-1.5 transition-all"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{userId ? `SIGN-OFF [${userId}] & EXECUTE` : 'COMMANDER SIGN-OFF & EXECUTE'}</span>
        </button>
      </div>
    </div>
  );
};
