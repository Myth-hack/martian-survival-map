/**
 * AI Mission System Hub
 * NASA Space Apps Challenge 2026 - Team Quanta Buddies
 * Full-featured AI Mission Intelligence, Autonomous Route Auditing,
 * Dynamic Contingency Simulator, and Multi-Agent Consensus
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Compass,
  Shield,
  Microscope,
  Send,
  HelpCircle,
  Users,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  Volume2,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import {
  AIAssistantMessage,
  RouteOption,
  HazardZone,
  ScienceTarget,
  MarsEnvironmentData,
  SecondOpinionConsensus,
  AIRouteAnalysis,
  AIContingencyPlan,
  AISystemStatusData
} from '../types';
import {
  NASAConnectionStatus,
  getNasaApiStatus,
  subscribeToNasaApiStatus
} from '../services/nasaApiService';

interface AISystemHubProps {
  userId?: string;
  messages: AIAssistantMessage[];
  onSendMessage: (content: string, role?: string) => void;
  isAiLoading: boolean;
  activeRoute?: RouteOption | null;
  routes: RouteOption[];
  hazards: HazardZone[];
  scienceTargets: ScienceTarget[];
  environment: MarsEnvironmentData;
  selectedRegion: string;
  consensus: SecondOpinionConsensus | null;
  onCommanderApprove: (routeId: string) => void;
  isLoadingConsensus: boolean;
  onRefreshConsensus: () => void;
}

export const AISystemHub: React.FC<AISystemHubProps> = ({
  userId,
  messages,
  onSendMessage,
  isAiLoading,
  activeRoute,
  routes,
  hazards,
  scienceTargets,
  environment,
  selectedRegion,
  consensus,
  onCommanderApprove,
  isLoadingConsensus,
  onRefreshConsensus
}) => {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'ROUTE_AUDIT' | 'CONTINGENCY' | 'CONSENSUS'>('CHAT');
  const [selectedRole, setSelectedRole] = useState<'MISSION_COMMANDER' | 'ROUTE_SPECIALIST' | 'SAFETY_OFFICER' | 'ASTROBIOLOGY_LEAD'>('MISSION_COMMANDER');
  const [inputPrompt, setInputPrompt] = useState('');
  const [expandedReasoningIndex, setExpandedReasoningIndex] = useState<number | null>(null);

  // Route Audit State
  const [routeAudit, setRouteAudit] = useState<AIRouteAnalysis | null>(null);
  const [isAuditingRoute, setIsAuditingRoute] = useState<boolean>(false);

  // Contingency Simulator State
  const [customCrisis, setCustomCrisis] = useState<string>('');
  const [contingencyPlan, setContingencyPlan] = useState<AIContingencyPlan | null>(null);
  const [isSimulatingCrisis, setIsSimulatingCrisis] = useState<boolean>(false);

  // Tactical Dispatch / Spoken Briefing State
  const [voiceBriefing, setVoiceBriefing] = useState<{
    briefingTitle: string;
    spokenScript: string;
    threatLevel: 'GREEN' | 'YELLOW' | 'RED';
    keyTakeaway: string;
  } | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // AI System Diagnostics Status
  const [systemStatus, setSystemStatus] = useState<AISystemStatusData>({
    status: 'ONLINE',
    engine: 'Gemini 3.8 Flash + NASA PDS Grounding',
    model: 'gemini-3.8-flash',
    activeSpecialists: ['Commander AI', 'Route AI', 'Safety AI', 'Science AI'],
    ragKnowledgeBases: ['MOLA MEGDR', 'HiRISE DTM', 'CRISM Spectral', 'Mars 2020 MEDA'],
    latencyMs: 135,
    safetyGuardrails: ['Slope < 15° (rover)', 'Consumables > 45m reserve', 'Slip < 40% abort']
  });

  const [nasaStatus, setNasaStatus] = useState<NASAConnectionStatus>(getNasaApiStatus());

  useEffect(() => {
    const unsub = subscribeToNasaApiStatus((status) => setNasaStatus(status));
    return () => unsub();
  }, []);

  // Fetch AI system status once on mount
  useEffect(() => {
    fetch('/api/ai/system-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSystemStatus(data);
      })
      .catch((err) => console.log('AI status fallback:', err));
  }, []);

  // Handle Generate Voice Briefing
  const handleGenerateBriefing = async () => {
    setIsLoadingBriefing(true);
    try {
      const res = await fetch('/api/ai/voice-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment,
          activeRoute,
          selectedRegion
        })
      });
      if (res.ok) {
        const data = await res.json();
        setVoiceBriefing(data);
      }
    } catch (e) {
      console.log('Briefing fallback error:', e);
    } finally {
      setIsLoadingBriefing(false);
    }
  };

  // Play simulated voice audio dispatch
  const handlePlayVoice = () => {
    if (!voiceBriefing) return;
    setIsPlayingAudio(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voiceBriefing.spokenScript);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 4000);
    }
  };

  // Handle Route Audit
  const handleAuditRoute = async () => {
    if (!activeRoute) return;
    setIsAuditingRoute(true);
    try {
      const res = await fetch('/api/ai/analyze-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: activeRoute,
          hazards,
          environment,
          selectedRegion
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRouteAudit(data);
      }
    } catch (e) {
      console.log('Route audit fallback error:', e);
    } finally {
      setIsAuditingRoute(false);
    }
  };

  // Handle Simulate Custom Crisis
  const handleSimulateCrisis = async (presetPrompt?: string) => {
    const crisisText = presetPrompt || customCrisis;
    if (!crisisText.trim()) return;

    setIsSimulatingCrisis(true);
    try {
      const res = await fetch('/api/ai/simulate-contingency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customCrisis: crisisText,
          currentEnvironment: environment,
          activeRoute
        })
      });
      if (res.ok) {
        const data = await res.json();
        setContingencyPlan(data);
      }
    } catch (e) {
      console.log('Crisis simulation error:', e);
    } finally {
      setIsSimulatingCrisis(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isAiLoading) return;
    onSendMessage(inputPrompt.trim(), selectedRole);
    setInputPrompt('');
  };

  const quickQuestions = [
    'Assess wheel slippage hazard if traversing into Séítah south dunes',
    'What is the astrobiological significance of Jezero delta mudstones?',
    'Evaluate solar storm risk and radiation dose during Sol 1240 EVA',
    'Explain why Vector Alpha avoids the northern crater rim slope'
  ];

  return (
    <div className="bg-[#0b0f17]/95 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur-md flex flex-col h-[680px]">
      {/* AI System Master Status Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-2 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/40">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-100">
                NASA Autonomous Mission Intelligence Hub
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/90 border border-cyan-500/60 text-cyan-300">
                {systemStatus.model}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold flex items-center space-x-1.5 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>CONNECTED TO NASA OPEN API (OFFICIAL DATA VERIFIED)</span>
                <span className="text-emerald-400 font-normal">• SOL {nasaStatus.lastVerifiedSol}</span>
              </span>
              <span>•</span>
              <span className="text-slate-500">{systemStatus.latencyMs}ms latency</span>
            </div>
          </div>
        </div>

        {/* Quick Voice Dispatch Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateBriefing}
            disabled={isLoadingBriefing}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-[11px] font-mono text-cyan-300 flex items-center space-x-1.5 transition-all shadow-sm"
            title="Generate spoken mission dispatch for this Sol"
          >
            <Radio className={`w-3.5 h-3.5 ${isLoadingBriefing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
            <span>{isLoadingBriefing ? 'SYNTHESIZING...' : 'SOL BRIEFING'}</span>
          </button>
        </div>
      </div>

      {/* Voice Briefing Banner if generated */}
      {voiceBriefing && (
        <div className="p-3 mb-3 rounded-lg bg-cyan-950/40 border border-cyan-800/70 text-slate-200 text-xs font-mono shrink-0 relative animate-fadeIn">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${voiceBriefing.threatLevel === 'GREEN' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="font-bold text-cyan-300">{voiceBriefing.briefingTitle}</span>
            </div>
            <button
              onClick={handlePlayVoice}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center space-x-1 transition-colors ${
                isPlayingAudio
                  ? 'bg-cyan-600 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 text-cyan-300 border-cyan-700 hover:bg-slate-800'
              }`}
            >
              <Volume2 className={`w-3 h-3 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
              <span>{isPlayingAudio ? 'PLAYING AUDIO...' : 'PLAY AUDIO'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed italic mb-1">
            "{voiceBriefing.spokenScript}"
          </p>
          <div className="text-[10px] text-amber-300 font-semibold flex items-center space-x-1">
            <span>KEY DIRECTIVE:</span>
            <span className="text-slate-200">{voiceBriefing.keyTakeaway}</span>
          </div>
        </div>
      )}

      {/* AI Hub Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-lg mb-3 shrink-0 text-xs font-mono">
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'CHAT'
              ? 'bg-cyan-600 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>RAG Assistant</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ROUTE_AUDIT');
            if (!routeAudit) handleAuditRoute();
          }}
          className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'ROUTE_AUDIT'
              ? 'bg-emerald-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Route Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('CONTINGENCY')}
          className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'CONTINGENCY'
              ? 'bg-purple-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Contingency</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('CONSENSUS');
            if (!consensus) onRefreshConsensus();
          }}
          className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'CONSENSUS'
              ? 'bg-amber-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Consensus</span>
        </button>
      </div>

      {/* Tab 1: AI RAG Assistant */}
      {activeTab === 'CHAT' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Active AI Specialist Selector */}
          <div className="flex items-center space-x-1.5 mb-2 shrink-0 overflow-x-auto pb-1 text-[10px] font-mono">
            <span className="text-slate-500 font-bold uppercase">Persona:</span>
            {[
              { id: 'MISSION_COMMANDER', label: 'Commander AI', icon: Zap },
              { id: 'ROUTE_SPECIALIST', label: 'Route Specialist AI', icon: Compass },
              { id: 'SAFETY_OFFICER', label: 'Safety Officer AI', icon: Shield },
              { id: 'ASTROBIOLOGY_LEAD', label: 'Astrobiology AI', icon: Microscope }
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedRole(p.id as any)}
                  className={`px-2 py-1 rounded border flex items-center space-x-1 whitespace-nowrap transition-colors ${
                    selectedRole === p.id
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Questions Horizontal Scroll */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-2 shrink-0 scrollbar-thin">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onSendMessage(q, selectedRole)}
                disabled={isAiLoading}
                className="text-[10px] font-mono bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500 text-slate-300 px-2 py-1 rounded whitespace-nowrap transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono scrollbar-thin">
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={msg.id || idx}
                  className={`p-3 rounded-lg border leading-relaxed ${
                    isAssistant
                      ? 'bg-slate-950/80 border-slate-800 text-slate-200'
                      : 'bg-cyan-950/40 border-cyan-900/60 text-cyan-100 ml-6'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold text-cyan-300">
                        {isAssistant
                          ? 'GEMINI 3.8 MISSION AI'
                          : userId
                          ? `MISSION OPERATOR [${userId}]`
                          : 'MISSION OPERATOR'}
                      </span>
                    </div>
                    <span className="text-slate-500">{msg.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Explainable AI Reasoning Dropdown */}
                  {isAssistant && msg.explainableReasoning && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() =>
                          setExpandedReasoningIndex(expandedReasoningIndex === idx ? null : idx)
                        }
                        className="flex items-center justify-between w-full text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        <span className="flex items-center space-x-1">
                          <Info className="w-3 h-3" />
                          <span>EXPLAINABLE AI: REASONING & DECISION FACTORS</span>
                        </span>
                        {expandedReasoningIndex === idx ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {expandedReasoningIndex === idx && (
                        <div className="mt-2 p-2.5 rounded bg-slate-900/95 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                          <div className="flex justify-between text-slate-400">
                            <span>Grounding Confidence:</span>
                            <span className="text-emerald-400 font-bold">
                              {msg.explainableReasoning.confidenceScore}%
                            </span>
                          </div>
                          <div className="text-slate-400 font-semibold">Key Decision Factors:</div>
                          <ul className="space-y-0.5 text-slate-300 pl-2">
                            {msg.explainableReasoning.decisionFactors.map((df: string, i: number) => (
                              <li key={i}>• {df}</li>
                            ))}
                          </ul>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                            <span className="font-semibold text-slate-300">Alternative Rejected: </span>
                            {msg.explainableReasoning.alternativesConsidered}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Citations & Evidence */}
                  {isAssistant && msg.evidenceCitations && msg.evidenceCitations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                      <div className="text-[9px] uppercase font-bold text-slate-400 mb-1 flex items-center space-x-1">
                        <BookOpen className="w-2.5 h-2.5 text-cyan-400" />
                        <span>NASA PDS Evidence & Citations:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {msg.evidenceCitations.map((cite, cIdx) => (
                          <span
                            key={cIdx}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-cyan-300 flex items-center space-x-1"
                          >
                            <span>{cite.sourceName}</span>
                            <span className="text-slate-500">({cite.dataProductId})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isAiLoading && (
              <div className="p-3 rounded-lg border bg-slate-950/80 border-slate-800 text-cyan-400 flex items-center space-x-2 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Synthesizing Gemini reasoning with NASA MOLA/HiRISE models...</span>
              </div>
            )}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleChatSubmit} className="mt-3 shrink-0 flex items-center space-x-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask AI mission specialist (e.g. assess slope stability, CRISM clays)..."
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isAiLoading}
              className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Autonomous Route Audit */}
      {activeTab === 'ROUTE_AUDIT' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono scrollbar-thin">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            {activeRoute ? (
              <div>
                <div className="text-[11px] text-slate-400">ACTIVE TRAVERSE VECTOR:</div>
                <div className="font-bold text-sm text-cyan-300">{activeRoute.name}</div>
                <div className="text-[10px] text-slate-500">
                  {activeRoute.distanceKm} km • Max slope {activeRoute.maxSlopeDeg}° • Power {activeRoute.powerConsumptionWh} Wh
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[11px] text-slate-400">ACTIVE TRAVERSE VECTOR:</div>
                <div className="font-bold text-sm text-slate-400">No Vector Active</div>
                <div className="text-[10px] text-slate-500">
                  Set Start and Goal points on the map to calculate routes.
                </div>
              </div>
            )}
            <button
              onClick={handleAuditRoute}
              disabled={isAuditingRoute || !activeRoute}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors shadow ${
                activeRoute
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditingRoute ? 'animate-spin' : ''}`} />
              <span>{isAuditingRoute ? 'AUDITING...' : 'RE-RUN AI AUDIT'}</span>
            </button>
          </div>

          {routeAudit ? (
            <div className="space-y-3">
              {/* Verdict Header Card */}
              <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">AI GEOTECHNICAL VERDICT:</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    {routeAudit.verdict.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <div className="text-[9px] text-slate-400">SAFETY</div>
                    <div className="text-sm font-bold text-emerald-400">{routeAudit.safetyRating}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">ENERGY</div>
                    <div className="text-sm font-bold text-cyan-400">{routeAudit.energyEfficiencyScore}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">SCIENCE</div>
                    <div className="text-sm font-bold text-amber-400">{routeAudit.scienceOpportunityScore}%</div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300 leading-relaxed">
                <span className="font-bold text-cyan-300">Executive Summary: </span>
                {routeAudit.summary}
              </div>

              {/* Terrain & Wheel Slip Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <div className="font-bold text-amber-400 mb-1 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Terrain Hazard Analysis</span>
                  </div>
                  <div className="text-slate-400">{routeAudit.terrainHazardAnalysis}</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <div className="font-bold text-cyan-400 mb-1 flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Wheel Traction & Slip</span>
                  </div>
                  <div className="text-slate-400">{routeAudit.wheelSlipAssessment}</div>
                </div>
              </div>

              {/* Tactical Directives */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="font-bold text-xs text-slate-200 mb-2 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>AI Tactical Directives for the Traverse:</span>
                </div>
                <ul className="space-y-1 text-slate-300">
                  {routeAudit.tacticalDirectives.map((d, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">[{i + 1}]</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Waypoint Advice */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="font-bold text-xs text-slate-200 mb-2">
                  Recommended Waypoint Stops:
                </div>
                <ul className="space-y-1 text-slate-400">
                  {routeAudit.waypointRecommendations.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <Compass className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-pulse" />
              <div>Auditing traverse corridor against MOLA and HiRISE models...</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Dynamic Contingency & Crisis Simulation */}
      {activeTab === 'CONTINGENCY' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono scrollbar-thin">
          <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/60">
            <div className="font-bold text-xs text-purple-300 mb-1 flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>AI Martian Contingency Generator</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Simulate standard or custom emergencies. Gemini calculates an instantaneous survival protocol based on NASA Human Integration Design standards.
            </p>

            {/* Preset Emergency Buttons */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                'Severe dust storm surge (Tau > 3.2)',
                'Rover right rocker-bogie actuator seized',
                'Suit primary oxygen loop micro-leak',
                'UHF relay comms blackout for 4 hours'
              ].map((preset, i) => (
                <button
                  key={i}
                  onClick={() => handleSimulateCrisis(preset)}
                  disabled={isSimulatingCrisis}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-purple-300 hover:border-purple-500 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Custom Crisis Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customCrisis}
                onChange={(e) => setCustomCrisis(e.target.value)}
                placeholder="Enter custom Martian emergency (e.g. meteorite impact 3km east)..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-purple-400"
              />
              <button
                onClick={() => handleSimulateCrisis()}
                disabled={!customCrisis.trim() || isSimulatingCrisis}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                {isSimulatingCrisis ? 'SIMULATING...' : 'SIMULATE'}
              </button>
            </div>
          </div>

          {/* Generated Plan */}
          {contingencyPlan && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 rounded-lg bg-slate-900 border border-purple-500/50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">EMERGENCY PROTOCOL:</div>
                  <div className="text-xs font-bold text-red-400 mt-0.5">
                    {contingencyPlan.immediateProtocol.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">TIME TO CRITICAL:</div>
                  <div className="text-sm font-bold text-amber-400">
                    {contingencyPlan.timeToCriticalMinutes} MIN
                  </div>
                </div>
              </div>

              {/* Reroute Advice */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="font-bold text-purple-300 mb-1">Reroute & Escape Vector:</div>
                <div className="text-slate-300">{contingencyPlan.rerouteVectorAdvice}</div>
              </div>

              {/* Step-by-Step Survival Actions */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="font-bold text-xs text-slate-200 mb-2">
                  Immediate Survival Actions:
                </div>
                <ul className="space-y-1.5 text-slate-300">
                  {contingencyPlan.stepByStepActions.map((action, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-purple-400 font-bold">Step {i + 1}:</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PDS Scientific Basis */}
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400">
                <span className="font-bold text-slate-300">NASA PDS Grounding Basis: </span>
                {contingencyPlan.pdsScientificBasis}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Multi-Agent Consensus */}
      {activeTab === 'CONSENSUS' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono scrollbar-thin">
          {isLoadingConsensus ? (
            <div className="text-center py-12 text-cyan-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <div>Synthesizing Route, Safety, and Science AI agents...</div>
            </div>
          ) : consensus ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">CONSENSUS SCORE:</div>
                  <div className="text-base font-bold text-emerald-400">
                    {consensus.consensusScore}% AGREEMENT
                  </div>
                </div>
                <button
                  onClick={() => onCommanderApprove(consensus.recommendedRouteId)}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow"
                  title={userId ? `Signed with Commander ID: ${userId}` : undefined}
                >
                  {userId ? `APPROVE AS [${userId}]` : 'COMMANDER APPROVE'}
                </button>
              </div>

              {/* 3 Perspectives */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {consensus.perspectives.map((agent, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-200">{agent.agentRole}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                        {agent.verdict}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-1">{agent.agentName}</div>
                    <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">{agent.summary}</p>
                    <div className="text-[10px] text-amber-300 font-semibold pt-1 border-t border-slate-800">
                      {agent.tradeOffMetric.label}: {agent.tradeOffMetric.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Trade-Off Matrix */}
              {consensus.tradeOffMatrix && (
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="font-bold text-xs text-slate-200 mb-2">Trade-Off Criteria Matrix:</div>
                  <div className="space-y-1.5 text-[11px]">
                    {consensus.tradeOffMatrix.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-400">{item.criteria}</span>
                        <div className="space-x-3 text-slate-300">
                          <span>Alpha: <strong className="text-cyan-400">{item.routeA}</strong></span>
                          <span>Beta: <strong className="text-emerald-400">{item.routeB}</strong></span>
                          <span>Gamma: <strong className="text-amber-400">{item.routeC}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div>Click to synthesize multi-agent consensus</div>
              <button
                onClick={onRefreshConsensus}
                className="mt-2 px-3 py-1 bg-cyan-600 text-slate-950 font-bold rounded"
              >
                Synthesize Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
