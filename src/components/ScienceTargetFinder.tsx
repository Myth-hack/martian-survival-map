/**
 * AI Science Target Finder & Astrobiology Catalog
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Geological/mineral target identification, CRISM signatures, and click-to-analyze AI inference
 */

import React, { useState } from 'react';
import { Sparkles, Microscope, Search, CheckCircle, Clock, Database, ChevronRight } from 'lucide-react';
import { ScienceTarget, MarsCoordinates } from '../types';

interface ScienceTargetFinderProps {
  targets: ScienceTarget[];
  selectedTargetId: string | null;
  onSelectTarget: (target: ScienceTarget) => void;
  inspectedAnalysis: any | null;
  isAnalyzing: boolean;
  onAnalyzeCustomCoord: (coords: MarsCoordinates) => void;
}

export const ScienceTargetFinder: React.FC<ScienceTargetFinderProps> = ({
  targets,
  selectedTargetId,
  onSelectTarget,
  inspectedAnalysis,
  isAnalyzing,
  onAnalyzeCustomCoord
}) => {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'ANALYSIS'>('CATALOG');

  return (
    <div className="bg-[#0b0f17]/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Microscope className="w-4 h-4 text-cyan-400" />
          <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-200">
            AI Science Target Finder
          </h3>
        </div>
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded p-0.5 text-[10px] font-mono">
          <button
            onClick={() => setActiveTab('CATALOG')}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeTab === 'CATALOG' ? 'bg-cyan-600 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Catalog ({targets.length})
          </button>
          <button
            onClick={() => setActiveTab('ANALYSIS')}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeTab === 'ANALYSIS' ? 'bg-cyan-600 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            AI Inspector
          </button>
        </div>
      </div>

      {activeTab === 'CATALOG' ? (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {targets.map((target) => {
            const isSelected = target.id === selectedTargetId;
            const isTier1 = target.tier === 1;

            return (
              <div
                key={target.id}
                onClick={() => {
                  onSelectTarget(target);
                  setActiveTab('ANALYSIS');
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {target.name}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isTier1
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                          : 'bg-purple-950/80 border-purple-500 text-purple-300'
                      }`}
                    >
                      TIER {target.tier}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      {target.scienceValueScore}/100
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                  {target.description}
                </p>

                {/* Astrobiology & CRISM Signature */}
                <div className="space-y-1.5 text-[10px] font-mono">
                  <div className="text-emerald-400/90 bg-emerald-950/30 p-1.5 rounded border border-emerald-800/30">
                    <span className="font-bold text-emerald-300">BIOSIGNATURE POTENTIAL: </span>
                    <span>{target.potentialBiosignature}</span>
                  </div>

                  <div className="text-cyan-300/80 bg-cyan-950/20 p-1.5 rounded border border-cyan-800/20">
                    <span className="font-bold text-cyan-300">CRISM SIGNATURE: </span>
                    <span>{target.crismSpectralSignature}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-2">
                  <span>STATUS: {target.investigationStatus}</span>
                  <span className="text-cyan-400 flex items-center space-x-0.5">
                    <span>Investigate</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* AI Target Inspector View */
        <div className="space-y-3">
          {isAnalyzing ? (
            <div className="py-12 text-center font-mono text-xs text-cyan-400 animate-pulse space-y-2">
              <Sparkles className="w-6 h-6 mx-auto animate-spin" />
              <div>PROCESSING COMPUTER VISION & SPECTRAL CLASSIFICATION...</div>
              <div className="text-[10px] text-slate-500">Querying NASA Planetary Data System (PDS) Knowledge Base</div>
            </div>
          ) : inspectedAnalysis ? (
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 bg-slate-950/80 border border-cyan-800/50 rounded-lg">
                <div className="text-[10px] text-cyan-400 font-bold mb-1 uppercase tracking-wider">
                  Geological Classification
                </div>
                <div className="text-slate-100 font-bold text-sm mb-0.5">
                  {inspectedAnalysis.rockType}
                </div>
                <div className="text-amber-400 text-[11px] mb-2">
                  Era: {inspectedAnalysis.geologicalEra}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {inspectedAnalysis.scientificSummary}
                </p>
              </div>

              {/* Mineral Composition Pills */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-400 font-bold mb-1.5 uppercase">
                  Identified Minerals & Clays
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {inspectedAnalysis.mineralComposition?.map((min: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[10px]"
                    >
                      {min}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Instrument Sequence */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-400 font-bold mb-1.5 uppercase">
                  Recommended Rover Instrument Sequence
                </div>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {inspectedAnalysis.recommendedInstrumentPlan?.map((plan: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                      <span>{plan}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center font-mono text-xs text-slate-500 space-y-2">
              <Search className="w-6 h-6 mx-auto text-slate-600" />
              <div>Select a target from the catalog or click anywhere on the 2D GIS map to trigger the AI geological interpreter.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
