/**
 * Technical Specifications, Architecture & NASA Grounding Modal
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 */

import React from 'react';
import { X, Database, Cpu, Globe, Award, ShieldCheck, Code, Layers } from 'lucide-react';

interface TechSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechSpecsModal: React.FC<TechSpecsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0a0e17] border border-cyan-800/80 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-['Orbitron'] font-bold text-sm text-slate-100">
                NASA Space Apps Challenge 2026 // System Specifications
              </h2>
              <p className="text-[11px] text-cyan-400">
                Team "Quanta Buddies" - Interplanetary Survival Guide: Martian Map
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Executive Overview */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h3 className="font-['Orbitron'] font-bold text-cyan-300 text-sm flex items-center space-x-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Project Core Architecture</span>
            </h3>
            <p className="text-slate-300">
              The <strong className="text-white">Interplanetary Survival Guide: Martian Map</strong> prototype delivers an end-to-end, mission-critical decision support platform for astronauts and ground flight controllers. It bridges high-resolution NASA planetary GIS datasets with real-time multi-objective pathfinding, physics-informed consumable modeling, and server-side Gemini RAG grounding.
            </p>
          </div>

          {/* 4 Pillars of Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GIS & Datasets */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <Layers className="w-4 h-4" />
                <span>NASA Planetary Datasets</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li>• <strong className="text-slate-100">MOLA MEGDR:</strong> Mars Orbiter Laser Altimeter 128 pixels/degree global elevation datum.</li>
                <li>• <strong className="text-slate-100">HiRISE DTMs:</strong> High Resolution Imaging Science Experiment 25 cm/pixel digital terrain models.</li>
                <li>• <strong className="text-slate-100">CRISM Hyperspectral:</strong> Compact Reconnaissance Imaging Spectrometer mineral detections (clays, carbonates).</li>
                <li>• <strong className="text-slate-100">SHARAD Radar:</strong> Shallow Radar subsurface sounding for water-ice and permafrost lenses.</li>
              </ul>
            </div>

            {/* Pathfinding & Mathematics */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <Cpu className="w-4 h-4" />
                <span>Multi-Objective Pathfinding Formula</span>
              </div>
              <div className="bg-slate-900 p-2 rounded text-[10px] text-amber-300 font-mono">
                Cost = w_dist · D + w_slope · (Slope/15°)² + w_haz · H_risk - w_sci · S_yield
              </div>
              <p className="text-[11px] text-slate-300">
                Employs modified A* and Dijkstra algorithms on a 2D/3D topological graph. Generates Pareto-optimal route vectors (Balanced, Safety-Bypass, and Science-Maximizer).
              </p>
            </div>

            {/* PostGIS & Database */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center space-x-2 text-purple-400 font-bold">
                <Database className="w-4 h-4" />
                <span>PostGIS & FastAPI Spatial Engine</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Uses Martian spatial reference system (IAU 2000 Mars Spherical datum, R = 3396190m). PostGIS spatial functions (<code className="text-purple-300">ST_DWithin</code>, <code className="text-purple-300">ST_Buffer</code>, <code className="text-purple-300">ST_Slope</code>) execute spatial corridor queries in &lt;15ms.
              </p>
            </div>

            {/* Gemini RAG Evidence */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Gemini API & RAG Grounding</span>
              </div>
              <p className="text-[11px] text-slate-300">
                All Gemini reasoning runs on server-side proxies using <code className="text-amber-300">@google/genai</code>. Responses strictly cite NASA PDS data product identifiers to eliminate hallucinations in mission-critical survival contexts.
              </p>
            </div>
          </div>

          {/* Quanta Buddies Submission Tag */}
          <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-center text-cyan-300 text-[11px]">
            Built by <strong>Quanta Buddies</strong> for the NASA Space Apps Challenge 2026. Designed for deployment on astronaut rovers, Mars habitats, and Houston Mission Control.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition-colors"
          >
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
};
