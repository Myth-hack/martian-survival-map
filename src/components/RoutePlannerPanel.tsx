/**
 * AI Route Planning & Multi-Objective Pathfinding Panel
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * A* / Dijkstra algorithm evaluation, terrain-aware cost weights, and route comparison table
 */

import React, { useState, useMemo } from 'react';
import {
  Navigation,
  Sliders,
  ShieldCheck,
  Award,
  BatteryCharging,
  Clock,
  TrendingUp,
  CheckCircle2,
  Play,
  Sparkles,
  AlertTriangle,
  Mountain,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { RouteOption, MarsCoordinates } from '../types';
import { RoutingWeights, calculateMarsDistanceKm, calculateSlopeDeg } from '../utils/routingEngine';

interface RoutePlannerPanelProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  weights: RoutingWeights;
  onChangeWeights: (newWeights: Partial<RoutingWeights>) => void;
  onRecalculateRoutes: () => void;
  startPoint: MarsCoordinates | null;
  goalPoint: MarsCoordinates | null;
  onAuditWithAI?: () => void;
}

interface ProfileDataPoint {
  index: number;
  distanceKm: number;
  distanceLabel: string;
  elevationMeters: number;
  slopeDeg: number;
  lat: number;
  lon: number;
}

const CustomProfileTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as ProfileDataPoint | undefined;
    if (!data) return null;
    return (
      <div className="bg-slate-950/95 border border-slate-700/90 rounded-lg p-2.5 text-[10px] font-mono shadow-2xl backdrop-blur-md z-50 pointer-events-none">
        <div className="text-slate-400 font-semibold border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between space-x-3">
          <span className="text-slate-300 font-bold">WAYPOINT #{data.index + 1}</span>
          <span className="text-cyan-400 font-bold">{data.distanceKm} km</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between space-x-4">
            <span className="text-slate-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              <span>Altitude:</span>
            </span>
            <span className="text-cyan-300 font-bold">{data.elevationMeters} m</span>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <span className="text-slate-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>Local Slope:</span>
            </span>
            <span className={`font-bold ${data.slopeDeg > 15 ? 'text-red-400' : 'text-amber-300'}`}>
              {data.slopeDeg}° {data.slopeDeg > 15 ? '⚠️ (>15°)' : ''}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800/80 flex justify-between">
            <span>Coordinates:</span>
            <span>
              {data.lat.toFixed(4)}°, {data.lon.toFixed(4)}°
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const RoutePlannerPanel: React.FC<RoutePlannerPanelProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  weights,
  onChangeWeights,
  onRecalculateRoutes,
  startPoint,
  goalPoint,
  onAuditWithAI
}) => {
  const [chartMode, setChartMode] = useState<'DUAL' | 'ALTITUDE' | 'SLOPE'>('DUAL');

  // Identify currently active/selected route (fallback to routes[0])
  const activeRoute = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || routes[0];
  }, [routes, selectedRouteId]);

  // Derive topographic altitude & slope cross-section profile points along the selected traverse
  const profileData = useMemo<ProfileDataPoint[]>(() => {
    if (!activeRoute || !activeRoute.pathPoints || activeRoute.pathPoints.length === 0) {
      return [];
    }

    const points = activeRoute.pathPoints;
    let cumulativeDist = 0;

    return points.map((p, idx) => {
      let slope = 0;
      if (idx > 0) {
        const prev = points[idx - 1];
        const segDist = calculateMarsDistanceKm(prev.lat, prev.lon, p.lat, p.lon);
        cumulativeDist += segDist;
        slope = calculateSlopeDeg(prev, p);
      }

      return {
        index: idx,
        distanceKm: Number(cumulativeDist.toFixed(2)),
        distanceLabel: `${cumulativeDist.toFixed(2)} km`,
        elevationMeters: Math.round(p.elevationMeters),
        slopeDeg: Number(slope.toFixed(1)),
        lat: p.lat,
        lon: p.lon
      };
    });
  }, [activeRoute]);

  // Derive profile summary statistics for high-level trade-off context
  const profileStats = useMemo(() => {
    if (!profileData || profileData.length === 0) {
      return { minElev: 0, maxElev: 0, elevChange: 0, maxSlope: 0, avgSlope: 0 };
    }
    const elevations = profileData.map((d) => d.elevationMeters);
    const slopes = profileData.map((d) => d.slopeDeg);
    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const maxSlope = Math.max(...slopes);
    const avgSlope =
      activeRoute?.avgSlopeDeg ??
      (profileData.length > 1
        ? Number((slopes.reduce((acc, s) => acc + s, 0) / (profileData.length - 1)).toFixed(1))
        : 0);

    return {
      minElev,
      maxElev,
      elevChange: maxElev - minElev,
      maxSlope,
      avgSlope
    };
  }, [profileData, activeRoute]);
  return (
    <div className="bg-[#0b0f17]/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <h3 className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-200">
            A* / Dijkstra Pathfinding Engine
          </h3>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
          routes.length > 0
            ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
            : 'text-slate-400 bg-slate-900 border-slate-700'
        }`}>
          {routes.length > 0 ? `${routes.length} PARETO VECTORS` : 'NO ROUTE ACTIVE'}
        </span>
      </div>

      {/* Start / Goal Coordinates Bar */}
      <div className="grid grid-cols-2 gap-2 mb-3 font-mono text-xs">
        <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-emerald-400 font-bold mb-0.5">ORIGIN (START):</div>
          <div className="text-slate-300 text-[11px] truncate">
            {startPoint
              ? `${startPoint.lat}°N, ${startPoint.lon}°E (${startPoint.elevationMeters}m)`
              : 'Not Set (Click map to set)'}
          </div>
        </div>
        <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-red-400 font-bold mb-0.5">DESTINATION (GOAL):</div>
          <div className="text-slate-300 text-[11px] truncate">
            {goalPoint
              ? `${goalPoint.lat}°N, ${goalPoint.lon}°E (${goalPoint.elevationMeters}m)`
              : 'Not Set (Click map to set)'}
          </div>
        </div>
      </div>

      {/* Multi-Objective Weight Sliders */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 mb-4 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center space-x-1">
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>TERRAIN COST WEIGHTS</span>
          </span>
          <button
            onClick={onRecalculateRoutes}
            disabled={!startPoint || !goalPoint}
            className={`text-[10px] font-bold flex items-center space-x-1 ${
              startPoint && goalPoint
                ? 'text-cyan-400 hover:text-cyan-300 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Play className="w-2.5 h-2.5" />
            <span>RECALCULATE</span>
          </button>
        </div>

        {/* Slope Aversion Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-300">
            <span>Slope Incline Penalty (&gt;15°):</span>
            <span className="text-amber-400">{weights.slopeAversion.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={weights.slopeAversion}
            onChange={(e) => onChangeWeights({ slopeAversion: parseFloat(e.target.value) })}
            className="w-full accent-amber-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Hazard Aversion Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-300">
            <span>Hazard & Dune Avoidance:</span>
            <span className="text-red-400">{weights.hazardAversion.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={weights.hazardAversion}
            onChange={(e) => onChangeWeights({ hazardAversion: parseFloat(e.target.value) })}
            className="w-full accent-red-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Science Attraction Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-300">
            <span>Science Sampling Attraction:</span>
            <span className="text-cyan-400">{weights.scienceAttraction.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={weights.scienceAttraction}
            onChange={(e) => onChangeWeights({ scienceAttraction: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Alternative Route Comparison Table */}
      <div className="space-y-3">
        <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 tracking-wider">
          Multi-Objective Route Trade-Off Comparison:
        </div>

        {routes.length === 0 ? (
          <div className="p-4 rounded-lg bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs font-mono text-slate-400 space-y-2">
            <Navigation className="w-6 h-6 text-cyan-500/70 mx-auto" />
            <div className="text-slate-200 font-semibold">No Active Route Calculated</div>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Use the <span className="text-emerald-400 font-bold">Set Start</span> and <span className="text-red-400 font-bold">Set Goal</span> map controls to place route endpoints. The A* engine will dynamically compute 3 Pareto vectors.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {routes.map((route) => {
              const isSelected = route.id === selectedRouteId;

              // Oxygen tank levels must strictly be clamped between 0% and 100%
              const calculatedRemainingO2 =
                route.evaOxygenRemainingPct !== undefined
                  ? route.evaOxygenRemainingPct
                  : 100 - (route.evaOxygenReserveCostPct || 0);
              const clampedRemainingO2 = Math.max(0, Math.min(100, calculatedRemainingO2));

              // If a route consumes >100% of O2, remaining O2 is 0% and it is a non-survivable route
              const isFatalRoute =
                clampedRemainingO2 === 0 ||
                (route.evaOxygenReserveCostPct || 0) > 100 ||
                Boolean(route.isOxygenFatal);

              return (
                <div
                  key={route.id}
                  onClick={() => onSelectRoute(route.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? isFatalRoute
                        ? 'bg-slate-900 border-red-500 shadow-md shadow-red-950/50'
                        : 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40'
                      : isFatalRoute
                      ? 'bg-slate-950/60 border-red-900/60 hover:border-red-700/80'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: isFatalRoute ? '#EF4444' : route.color }}
                      />
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {route.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {route.algorithm}
                      </span>
                      {isFatalRoute && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950/90 text-red-400 border border-red-800/80 animate-pulse">
                          FATAL: 0% O2
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className={`text-[10px] font-mono font-bold flex items-center space-x-1 ${
                        isFatalRoute ? 'text-red-400' : 'text-cyan-400'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2">
                    {route.description}
                  </p>

                  {/* Quantitative Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 text-center font-mono py-1.5 px-2 rounded bg-slate-950/70 border border-slate-800/80 mb-2 text-[10px]">
                    <div>
                      <div className="text-slate-500">DIST</div>
                      <div className="text-slate-200 font-bold">{route.distanceKm} km</div>
                    </div>
                    <div>
                      <div className="text-slate-500">MAX SLOPE</div>
                      <div className={route.maxSlopeDeg > 15 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {route.maxSlopeDeg}°
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">RISK</div>
                      <div className={route.terrainRiskScore > 70 ? 'text-red-400 font-bold' : 'text-slate-200 font-bold'}>
                        {route.terrainRiskScore}/100
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">SCIENCE</div>
                      <div className="text-amber-400 font-bold">{route.scienceValueScore}/100</div>
                    </div>
                  </div>

                  {/* Secondary Consumable Metrics */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Est. {route.estTraverseHours}h</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <BatteryCharging className="w-3 h-3 text-amber-500" />
                      <span>{route.powerConsumptionWh} Wh</span>
                    </span>
                    
                    {/* Clamped EVA O2 Tank Level & Fatal Warning */}
                    {isFatalRoute ? (
                      <span
                        className="flex items-center space-x-1 text-red-400 font-bold bg-red-950/60 border border-red-800/80 px-1.5 py-0.5 rounded animate-pulse"
                        title={`Consumes ${route.evaOxygenReserveCostPct}% of EVA oxygen capacity. Zero life support remaining.`}
                      >
                        <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                        <span>⚠️ FATAL: Exceeds O2 Capacity</span>
                      </span>
                    ) : (
                      <span
                        className="flex items-center space-x-1 text-slate-300"
                        title={`Remaining O2 tank capacity: ${clampedRemainingO2}% (${route.evaOxygenReserveCostPct}% estimated consumption).`}
                      >
                        <ShieldCheck className={`w-3 h-3 ${clampedRemainingO2 <= 30 ? 'text-amber-400' : 'text-cyan-400'}`} />
                        <span className={clampedRemainingO2 <= 30 ? 'text-amber-300 font-semibold' : 'text-slate-300'}>
                          EVA O2: {clampedRemainingO2}%
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Fatal Route Warning Banner */}
                  {isFatalRoute && (
                    <div className="mt-2.5 p-2 rounded bg-red-950/40 border border-red-800/70 text-red-300 text-[10px] font-mono flex items-start space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <span className="font-bold text-red-200">NON-SURVIVABLE MISSION TRAVERSE:</span>{' '}
                        Traverse requires{' '}
                        <span className="font-bold text-red-100 underline decoration-red-500">
                          {route.evaOxygenReserveCostPct}%
                        </span>{' '}
                        of suit O2 reserves (exceeds 100% tank limit). Astronaut oxygen depleted before destination.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Route Topography Profile (Recharts Line Chart) */}
        {routes.length > 0 && activeRoute && profileData.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            {/* Profile Header & Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-cyan-950/60 border border-cyan-700/50 text-cyan-400">
                  <Mountain className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wide">
                      Selected Route Topography
                    </span>
                    <span
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${activeRoute.color}20`,
                        color: activeRoute.color,
                        border: `1px solid ${activeRoute.color}60`
                      }}
                    >
                      {activeRoute.name.split('(')[0].trim()}
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">
                    MOLA Altitude & Slope Gradient Profile
                  </div>
                </div>
              </div>

              {/* View Mode Buttons */}
              <div className="flex items-center space-x-1 bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMode('DUAL')}
                  className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
                    chartMode === 'DUAL'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Show both Altitude (MOLA meters) and Slope (degrees)"
                >
                  DUAL
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('ALTITUDE')}
                  className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
                    chartMode === 'ALTITUDE'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Show Altitude profile only"
                >
                  ALTITUDE
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('SLOPE')}
                  className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
                    chartMode === 'SLOPE'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Show Slope profile with 15° rover threshold"
                >
                  SLOPE
                </button>
              </div>
            </div>

            {/* Topographic Metrics Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[10px]">
              <div className="p-1.5 rounded bg-slate-900/70 border border-slate-800/80">
                <div className="text-slate-500 text-[9px]">MIN ALTITUDE</div>
                <div className="text-cyan-400 font-bold">{profileStats.minElev} m</div>
              </div>
              <div className="p-1.5 rounded bg-slate-900/70 border border-slate-800/80">
                <div className="text-slate-500 text-[9px]">MAX ALTITUDE</div>
                <div className="text-cyan-300 font-bold">{profileStats.maxElev} m</div>
              </div>
              <div className="p-1.5 rounded bg-slate-900/70 border border-slate-800/80">
                <div className="text-slate-500 text-[9px]">ELEV. CHANGE (Δ)</div>
                <div className="text-slate-200 font-bold">{profileStats.elevChange} m</div>
              </div>
              <div className="p-1.5 rounded bg-slate-900/70 border border-slate-800/80">
                <div className="text-slate-500 text-[9px]">MAX SLOPE</div>
                <div className="flex items-center space-x-1">
                  <span className={`font-bold ${profileStats.maxSlope > 15 ? 'text-red-400' : 'text-amber-400'}`}>
                    {profileStats.maxSlope}°
                  </span>
                  <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                    profileStats.maxSlope > 15
                      ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                      : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  }`}>
                    {profileStats.maxSlope > 15 ? 'STEEP' : 'SAFE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recharts Line Chart */}
            <div className="w-full h-44 min-h-[175px] pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profileData} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="distanceKm"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    stroke="#334155"
                    tickFormatter={(val) => `${val}k`}
                  />
                  {(chartMode === 'DUAL' || chartMode === 'ALTITUDE') && (
                    <YAxis
                      yAxisId="altitude"
                      orientation="left"
                      tick={{ fontSize: 9, fill: '#38bdf8' }}
                      stroke="#0284c7"
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `${val}m`}
                    />
                  )}
                  {(chartMode === 'DUAL' || chartMode === 'SLOPE') && (
                    <YAxis
                      yAxisId="slope"
                      orientation="right"
                      tick={{ fontSize: 9, fill: '#f59e0b' }}
                      stroke="#d97706"
                      domain={[0, (dataMax: number) => Math.max(20, Math.ceil(dataMax + 2))]}
                      tickFormatter={(val) => `${val}°`}
                    />
                  )}
                  <Tooltip content={<CustomProfileTooltip />} />

                  {/* 15° Rover Limit Reference Line */}
                  {(chartMode === 'DUAL' || chartMode === 'SLOPE') && (
                    <ReferenceLine
                      yAxisId="slope"
                      y={15}
                      stroke="#ef4444"
                      strokeDasharray="4 2"
                      strokeWidth={1.5}
                      label={{
                        value: '15° LIMIT',
                        fill: '#ef4444',
                        fontSize: 8,
                        position: 'insideTopRight'
                      }}
                    />
                  )}

                  {/* Altitude Line */}
                  {(chartMode === 'DUAL' || chartMode === 'ALTITUDE') && (
                    <Line
                      yAxisId="altitude"
                      type="monotone"
                      dataKey="elevationMeters"
                      name="Altitude (m)"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: '#38bdf8', strokeWidth: 2, fill: '#0369a1' }}
                    />
                  )}

                  {/* Slope Line */}
                  {(chartMode === 'DUAL' || chartMode === 'SLOPE') && (
                    <Line
                      yAxisId="slope"
                      type="monotone"
                      dataKey="slopeDeg"
                      name="Slope (°)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray={chartMode === 'DUAL' ? '4 2' : undefined}
                      dot={false}
                      activeDot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2, fill: '#b45309' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Profile Legend & Trade-Off Context */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[9px] font-mono text-slate-400">
              <div className="flex items-center space-x-3">
                {(chartMode === 'DUAL' || chartMode === 'ALTITUDE') && (
                  <span className="flex items-center space-x-1 text-cyan-400">
                    <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
                    <span>Altitude (MOLA Datum)</span>
                  </span>
                )}
                {(chartMode === 'DUAL' || chartMode === 'SLOPE') && (
                  <span className="flex items-center space-x-1 text-amber-400">
                    <span className="w-2.5 h-0.5 bg-amber-400 border-b border-dashed inline-block" />
                    <span>Slope Incline (°)</span>
                  </span>
                )}
                {(chartMode === 'DUAL' || chartMode === 'SLOPE') && (
                  <span className="flex items-center space-x-1 text-red-400">
                    <span className="w-2.5 h-0.5 bg-red-500 inline-block" />
                    <span>15° Rover Threshold</span>
                  </span>
                )}
              </div>
              <div className="text-slate-500">
                Avg Slope: <span className="text-slate-300 font-bold">{profileStats.avgSlope}°</span> • Traverse:{' '}
                <span className="text-slate-300 font-bold">{activeRoute.distanceKm} km</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Route Audit Trigger */}
        {onAuditWithAI && routes.length > 0 && (
          <button
            onClick={onAuditWithAI}
            className="w-full mt-3 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-950 to-emerald-950 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 hover:text-white font-mono text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AUDIT TRAVERSE SAFETY WITH AI SYSTEM</span>
          </button>
        )}
      </div>
    </div>
  );
};
