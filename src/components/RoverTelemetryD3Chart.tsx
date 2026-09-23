/**
 * Rover Real-Time Telemetry D3 Chart
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * 
 * Renders real-time rover telemetry using D3.js:
 * - Battery State of Charge (%)
 * - Drive Actuator / Motor Temperature (°C)
 * - Ultra-High Frequency (UHF) Signal Strength (dBm & Quality %)
 */

import React, { useEffect, useRef, useState, useId } from 'react';
import * as d3 from 'd3';
import {
  BatteryCharging,
  Thermometer,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  AlertCircle,
  Wifi
} from 'lucide-react';

export interface TelemetryDataPoint {
  timestamp: Date;
  secondsAgo: number;
  batteryPct: number;       // 0 - 100%
  motorTempC: number;       // -20 to +50 °C
  signalDbm: number;        // -110 to -50 dBm
  signalQualityPct: number; // 0 - 100%
}

interface RoverTelemetryD3ChartProps {
  roverName?: string;
  initialBattery?: number;
  initialMotorTemp?: number;
  initialSignalDbm?: number;
}

export const RoverTelemetryD3Chart: React.FC<RoverTelemetryD3ChartProps> = ({
  roverName = 'Perseverance (M2020)',
  initialBattery = 88.6,
  initialMotorTemp = 21.4,
  initialSignalDbm = -74.2
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const uid = useId().replace(/:/g, '_');

  // Streaming State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeSeries, setActiveSeries] = useState<{
    battery: boolean;
    temperature: boolean;
    signal: boolean;
  }>({
    battery: true,
    temperature: true,
    signal: true
  });

  // Hover Tooltip Telemetry State
  const [hoveredData, setHoveredData] = useState<TelemetryDataPoint | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  // ResizeObserver for responsive SVG dimensions with requestAnimationFrame debouncing
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    let rafId: number | null = null;
    const observer = new ResizeObserver((entries) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!entries || !entries.length) return;
        const entry = entries[0];
        if (entry && entry.contentRect && entry.contentRect.width > 0) {
          const w = Math.round(entry.contentRect.width);
          setContainerWidth((prev) => (Math.abs(prev - w) > 3 ? w : prev));
        }
      });
    });
    observer.observe(containerRef.current);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  // Buffer of historical telemetry points (keep last 30 points)
  const [data, setData] = useState<TelemetryDataPoint[]>(() => {
    const points: TelemetryDataPoint[] = [];
    const now = Date.now();
    const count = 25;
    let b = initialBattery;
    let t = initialMotorTemp;
    let s = initialSignalDbm;

    for (let i = count - 1; i >= 0; i--) {
      const timeOffsetMs = i * 2000;
      b = Math.min(100, Math.max(20, b + (Math.random() - 0.52) * 0.4));
      t = Math.min(45, Math.max(-10, t + (Math.random() - 0.48) * 0.6));
      s = Math.min(-55, Math.max(-105, s + (Math.random() - 0.5) * 1.5));
      const qual = Math.round(((s + 110) / 60) * 100);

      points.push({
        timestamp: new Date(now - timeOffsetMs),
        secondsAgo: i * 2,
        batteryPct: Number(b.toFixed(1)),
        motorTempC: Number(t.toFixed(1)),
        signalDbm: Number(s.toFixed(1)),
        signalQualityPct: Math.min(100, Math.max(10, qual))
      });
    }
    return points;
  });

  // Real-time interval generator
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const nextTime = new Date();

        // Simulate natural mars rover driving telemetry variations
        const nextBattery = Math.min(
          99,
          Math.max(15, last.batteryPct + (Math.random() - 0.54) * 0.35)
        );
        const nextTemp = Math.min(
          42,
          Math.max(5, last.motorTempC + (Math.random() - 0.47) * 0.45)
        );
        const nextSignal = Math.min(
          -55,
          Math.max(-102, last.signalDbm + (Math.random() - 0.5) * 1.8)
        );
        const nextQuality = Math.min(
          100,
          Math.max(15, Math.round(((nextSignal + 110) / 60) * 100))
        );

        const newPoint: TelemetryDataPoint = {
          timestamp: nextTime,
          secondsAgo: 0,
          batteryPct: Number(nextBattery.toFixed(1)),
          motorTempC: Number(nextTemp.toFixed(1)),
          signalDbm: Number(nextSignal.toFixed(1)),
          signalQualityPct: nextQuality
        };

        // Recalculate relative secondsAgo for all points
        const updated = [...prev.slice(1), newPoint].map((pt, idx, arr) => ({
          ...pt,
          secondsAgo: (arr.length - 1 - idx) * 2
        }));

        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Current Latest Telemetry
  const latest = data[data.length - 1] || {
    batteryPct: initialBattery,
    motorTempC: initialMotorTemp,
    signalDbm: initialSignalDbm,
    signalQualityPct: 82
  };

  // Render D3 Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerWidth > 0 ? containerWidth : (containerRef.current.clientWidth || 600);
    const height = 230;
    const margin = { top: 20, right: 48, bottom: 28, left: 44 };
    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(80, height - margin.top - margin.bottom);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Definitions: Gradients
    const defs = svg.append('defs');

    // Battery Gradient (Emerald)
    const batteryGrad = defs
      .append('linearGradient')
      .attr('id', `battery-grad-${uid}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    batteryGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.35);
    batteryGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.0);

    // Temp Gradient (Amber/Orange)
    const tempGrad = defs
      .append('linearGradient')
      .attr('id', `temp-grad-${uid}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    tempGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#f59e0b')
      .attr('stop-opacity', 0.25);
    tempGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#f59e0b')
      .attr('stop-opacity', 0.0);

    // Signal Gradient (Cyan)
    const signalGrad = defs
      .append('linearGradient')
      .attr('id', `signal-grad-${uid}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    signalGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.25);
    signalGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.0);

    // Glowing filter
    const filter = defs.append('filter').attr('id', `glow-${uid}`);
    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const maxSecondsAgo = d3.max(data, (d) => d.secondsAgo) || 50;
    const xScale = d3
      .scaleLinear()
      .domain([maxSecondsAgo, 0])
      .range([0, innerWidth]);

    // Primary Left Y Scale: Percentage (0 - 100%) for Battery & Signal Quality
    const yScalePct = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    // Secondary Right Y Scale: Motor Temp (-10°C to +50°C)
    const yScaleTemp = d3
      .scaleLinear()
      .domain([-10, 50])
      .range([innerHeight, 0]);

    // Grid Lines
    const yGrid = d3
      .axisLeft(yScalePct)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '2,3')
      .attr('stroke-opacity', 0.6);

    g.select('.grid .domain').remove();

    // Line & Area Generators
    const batteryLine = d3
      .line<TelemetryDataPoint>()
      .x((d) => xScale(d.secondsAgo))
      .y((d) => yScalePct(d.batteryPct))
      .curve(d3.curveMonotoneX);

    const batteryArea = d3
      .area<TelemetryDataPoint>()
      .x((d) => xScale(d.secondsAgo))
      .y0(innerHeight)
      .y1((d) => yScalePct(d.batteryPct))
      .curve(d3.curveMonotoneX);

    const tempLine = d3
      .line<TelemetryDataPoint>()
      .x((d) => xScale(d.secondsAgo))
      .y((d) => yScaleTemp(d.motorTempC))
      .curve(d3.curveMonotoneX);

    const tempArea = d3
      .area<TelemetryDataPoint>()
      .x((d) => xScale(d.secondsAgo))
      .y0(innerHeight)
      .y1((d) => yScaleTemp(d.motorTempC))
      .curve(d3.curveMonotoneX);

    const signalLine = d3
      .line<TelemetryDataPoint>()
      .x((d) => xScale(d.secondsAgo))
      .y((d) => yScalePct(d.signalQualityPct))
      .curve(d3.curveMonotoneX);

    const signalArea = d3
      .area<TelemetryDataPoint>()
      .x((d) => xScale(d.secondsAgo))
      .y0(innerHeight)
      .y1((d) => yScalePct(d.signalQualityPct))
      .curve(d3.curveMonotoneX);

    // 1. Draw Areas (Under curves)
    if (activeSeries.battery) {
      g.append('path')
        .datum(data)
        .attr('fill', `url(#battery-grad-${uid})`)
        .attr('d', batteryArea);
    }

    if (activeSeries.temperature) {
      g.append('path')
        .datum(data)
        .attr('fill', `url(#temp-grad-${uid})`)
        .attr('d', tempArea);
    }

    if (activeSeries.signal) {
      g.append('path')
        .datum(data)
        .attr('fill', `url(#signal-grad-${uid})`)
        .attr('d', signalArea);
    }

    // 2. Draw Series Lines
    if (activeSeries.battery) {
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2)
        .attr('filter', `url(#glow-${uid})`)
        .attr('d', batteryLine);

      // Latest pulse point
      const lastPt = data[data.length - 1];
      if (lastPt) {
        g.append('circle')
          .attr('cx', xScale(lastPt.secondsAgo))
          .attr('cy', yScalePct(lastPt.batteryPct))
          .attr('r', 4.5)
          .attr('fill', '#10b981')
          .attr('stroke', '#040608')
          .attr('stroke-width', 1.5)
          .attr('filter', `url(#glow-${uid})`);
      }
    }

    if (activeSeries.temperature) {
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2)
        .attr('filter', `url(#glow-${uid})`)
        .attr('d', tempLine);

      // Latest pulse point
      const lastPt = data[data.length - 1];
      if (lastPt) {
        g.append('circle')
          .attr('cx', xScale(lastPt.secondsAgo))
          .attr('cy', yScaleTemp(lastPt.motorTempC))
          .attr('r', 4.5)
          .attr('fill', '#f59e0b')
          .attr('stroke', '#040608')
          .attr('stroke-width', 1.5)
          .attr('filter', `url(#glow-${uid})`);
      }
    }

    if (activeSeries.signal) {
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2)
        .attr('filter', `url(#glow-${uid})`)
        .attr('d', signalLine);

      // Latest pulse point
      const lastPt = data[data.length - 1];
      if (lastPt) {
        g.append('circle')
          .attr('cx', xScale(lastPt.secondsAgo))
          .attr('cy', yScalePct(lastPt.signalQualityPct))
          .attr('r', 4.5)
          .attr('fill', '#06b6d4')
          .attr('stroke', '#040608')
          .attr('stroke-width', 1.5)
          .attr('filter', `url(#glow-${uid})`);
      }
    }

    // 3. Axes
    // X Axis (Time: -Xs to NOW)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat((d) => (Number(d) === 0 ? 'NOW' : `-${d}s`));

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.selectAll('text').attr('fill', '#64748b').attr('font-size', '9px').attr('font-family', 'monospace');
    xAxisGroup.selectAll('line').attr('stroke', '#334155');
    xAxisGroup.select('.domain').attr('stroke', '#334155');

    // Left Y Axis (Percentage / Level)
    const yAxisLeft = d3
      .axisLeft(yScalePct)
      .ticks(5)
      .tickFormat((d) => `${d}%`);

    const yAxisLeftGroup = g.append('g').call(yAxisLeft);
    yAxisLeftGroup.selectAll('text').attr('fill', '#10b981').attr('font-size', '9px').attr('font-family', 'monospace');
    yAxisLeftGroup.selectAll('line').attr('stroke', '#334155');
    yAxisLeftGroup.select('.domain').attr('stroke', '#334155');

    // Left Y Axis Label
    g.append('text')
      .attr('x', -innerHeight / 2)
      .attr('y', -32)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .attr('fill', '#10b981')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('SOC / SIGNAL %');

    // Right Y Axis (Temperature °C)
    const yAxisRight = d3
      .axisRight(yScaleTemp)
      .ticks(5)
      .tickFormat((d) => `${d}°C`);

    const yAxisRightGroup = g
      .append('g')
      .attr('transform', `translate(${innerWidth},0)`)
      .call(yAxisRight);

    yAxisRightGroup.selectAll('text').attr('fill', '#f59e0b').attr('font-size', '9px').attr('font-family', 'monospace');
    yAxisRightGroup.selectAll('line').attr('stroke', '#334155');
    yAxisRightGroup.select('.domain').attr('stroke', '#334155');

    // Right Y Axis Label
    g.append('text')
      .attr('x', -innerHeight / 2)
      .attr('y', innerWidth + 36)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .attr('fill', '#f59e0b')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('MOTOR TEMP (°C)');

    // 4. Interactive Scrubber Crosshair Overlay
    const focusGroup = g.append('g').style('display', 'none');

    // Vertical cursor line
    const focusLine = focusGroup
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    // Tracking markers
    const batteryCircle = focusGroup
      .append('circle')
      .attr('r', 4)
      .attr('fill', '#10b981')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    const tempCircle = focusGroup
      .append('circle')
      .attr('r', 4)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    const signalCircle = focusGroup
      .append('circle')
      .attr('r', 4)
      .attr('fill', '#06b6d4')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    // Bisector for finding closest data point
    const bisectSecondsAgo = d3.bisector<TelemetryDataPoint, number>(
      (d) => d.secondsAgo
    ).left;

    // Overlay rect for capturing mouse events
    svg
      .append('rect')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mouseenter', () => focusGroup.style('display', null))
      .on('mouseleave', () => {
        focusGroup.style('display', 'none');
        setHoveredData(null);
      })
      .on('mousemove', function (event) {
        const [pointerX] = d3.pointer(event, this);
        const secondsVal = xScale.invert(pointerX);
        const index = bisectSecondsAgo(data, secondsVal);
        const d0 = data[index - 1];
        const d1 = data[index];
        let d = d1;
        if (d0 && d1) {
          d =
            Math.abs(secondsVal - d0.secondsAgo) <
            Math.abs(secondsVal - d1.secondsAgo)
              ? d0
              : d1;
        } else if (d0) {
          d = d0;
        }

        if (!d) return;

        setHoveredData(d);

        const xPos = xScale(d.secondsAgo);
        focusLine.attr('x1', xPos).attr('x2', xPos);

        if (activeSeries.battery) {
          batteryCircle
            .style('display', null)
            .attr('cx', xPos)
            .attr('cy', yScalePct(d.batteryPct));
        } else {
          batteryCircle.style('display', 'none');
        }

        if (activeSeries.temperature) {
          tempCircle
            .style('display', null)
            .attr('cx', xPos)
            .attr('cy', yScaleTemp(d.motorTempC));
        } else {
          tempCircle.style('display', 'none');
        }

        if (activeSeries.signal) {
          signalCircle
            .style('display', null)
            .attr('cx', xPos)
            .attr('cy', yScalePct(d.signalQualityPct));
        } else {
          signalCircle.style('display', 'none');
        }
      });
  }, [data, activeSeries, uid, containerWidth]);

  // Reset / Clear Data
  const handleReset = () => {
    const now = Date.now();
    const count = 25;
    const points: TelemetryDataPoint[] = [];
    for (let i = count - 1; i >= 0; i--) {
      points.push({
        timestamp: new Date(now - i * 2000),
        secondsAgo: i * 2,
        batteryPct: Number(initialBattery.toFixed(1)),
        motorTempC: Number(initialMotorTemp.toFixed(1)),
        signalDbm: Number(initialSignalDbm.toFixed(1)),
        signalQualityPct: Math.round(((initialSignalDbm + 110) / 60) * 100)
      });
    }
    setData(points);
  };

  const displayData = hoveredData || latest;

  return (
    <div className="bg-slate-950/90 border border-cyan-800/50 rounded-xl p-3 sm:p-4 shadow-lg backdrop-blur-md font-sans text-slate-200">
      {/* 1. Header: Component Title, Rover ID & Live Stream Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/40 pb-2.5 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider text-slate-100">
                Rover Real-Time D3 Telemetry
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/60 text-cyan-300">
                {isPlaying ? 'STREAMING 1.8s' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              {roverName} • Multi-Axis Actuator & Power Stream
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-semibold flex items-center space-x-1 border transition-all cursor-pointer ${
              isPlaying
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/80'
                : 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900/80'
            }`}
            title={isPlaying ? 'Pause live stream' : 'Resume live stream'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span>RESUME</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Reset telemetry baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Real-Time Telemetry Readout Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        {/* Battery SOC Card */}
        <div
          onClick={() =>
            setActiveSeries((prev) => ({ ...prev, battery: !prev.battery }))
          }
          className={`p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
            activeSeries.battery
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 mb-1">
            <div className="flex items-center space-x-1.5">
              <BatteryCharging className="w-3.5 h-3.5" />
              <span className="font-bold">BATTERY (SOC)</span>
            </div>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              {displayData.batteryPct >= 30 ? 'NOMINAL' : 'CRITICAL'}
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5 font-mono">
            <span className="text-lg font-bold text-slate-100">
              {displayData.batteryPct}%
            </span>
            <span className="text-[10px] text-slate-400">
              {displayData.batteryPct > 80 ? '⚡ 32.4V' : '⚡ 30.8V'}
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
            <span>Drain: -1.2%/hr</span>
            <span className="text-emerald-400 font-semibold">Click to {activeSeries.battery ? 'Hide' : 'Show'}</span>
          </div>
        </div>

        {/* Motor Temp Card */}
        <div
          onClick={() =>
            setActiveSeries((prev) => ({
              ...prev,
              temperature: !prev.temperature
            }))
          }
          className={`p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
            activeSeries.temperature
              ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 mb-1">
            <div className="flex items-center space-x-1.5">
              <Thermometer className="w-3.5 h-3.5" />
              <span className="font-bold">MOTOR TEMP</span>
            </div>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 border border-amber-800 text-amber-300">
              {displayData.motorTempC < 35 ? 'SAFE' : 'ELEVATED'}
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5 font-mono">
            <span className="text-lg font-bold text-slate-100">
              {displayData.motorTempC}°C
            </span>
            <span className="text-[10px] text-slate-400">
              Max: +45°C
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
            <span>Actuator #3</span>
            <span className="text-amber-400 font-semibold">Click to {activeSeries.temperature ? 'Hide' : 'Show'}</span>
          </div>
        </div>

        {/* Signal Strength Card */}
        <div
          onClick={() =>
            setActiveSeries((prev) => ({ ...prev, signal: !prev.signal }))
          }
          className={`p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
            activeSeries.signal
              ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1">
            <div className="flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span className="font-bold">SIGNAL (UHF)</span>
            </div>
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              LOCKED
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5 font-mono">
            <span className="text-lg font-bold text-slate-100">
              {displayData.signalDbm} dBm
            </span>
            <span className="text-[10px] text-cyan-300">
              ({displayData.signalQualityPct}%)
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
            <span>SNR: +26.8 dB</span>
            <span className="text-cyan-400 font-semibold">Click to {activeSeries.signal ? 'Hide' : 'Show'}</span>
          </div>
        </div>
      </div>

      {/* 3. D3 SVG Telemetry Chart */}
      <div
        ref={containerRef}
        className="relative w-full bg-[#05070d] rounded-lg border border-slate-800 overflow-hidden shadow-inner"
      >
        <svg ref={svgRef} className="w-full block" />

        {/* Floating Scrubber HUD Tooltip */}
        {hoveredData && (
          <div className="absolute top-2 left-3 pointer-events-none bg-black/80 backdrop-blur-md border border-cyan-500/40 rounded px-2 py-1 text-[10px] font-mono text-slate-200 flex items-center space-x-3 shadow-lg">
            <span className="text-slate-400 font-bold">
              T-{hoveredData.secondsAgo}s:
            </span>
            {activeSeries.battery && (
              <span className="text-emerald-400">
                Batt: {hoveredData.batteryPct}%
              </span>
            )}
            {activeSeries.temperature && (
              <span className="text-amber-400">
                Temp: {hoveredData.motorTempC}°C
              </span>
            )}
            {activeSeries.signal && (
              <span className="text-cyan-400">
                UHF: {hoveredData.signalDbm} dBm ({hoveredData.signalQualityPct}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart Footer with NASA Protocol Notes */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[9px] font-mono text-slate-400 mt-2 px-1">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-2 h-0.5 bg-emerald-400 inline-block" />
            <span>Battery SOC (%)</span>
          </span>
          <span className="flex items-center space-x-1 text-amber-400">
            <span className="w-2 h-0.5 bg-amber-400 inline-block" />
            <span>Motor Temp (°C)</span>
          </span>
          <span className="flex items-center space-x-1 text-cyan-400">
            <span className="w-2 h-0.5 bg-cyan-400 inline-block" />
            <span>Signal Quality (%)</span>
          </span>
        </div>
        <span className="text-slate-500">
          Hover cursor across chart to inspect time-series samples
        </span>
      </div>
    </div>
  );
};

export default RoverTelemetryD3Chart;
