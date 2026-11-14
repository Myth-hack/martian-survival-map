/**
 * 3D Interactive Mars Globe Component
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Full-planet spherical raycasting, texture projection & seamless 3D -> 2D synchronization
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Layers, Crosshair, MapPin, Navigation, Sparkles, Play, Pause, Satellite } from 'lucide-react';
import { MarsCoordinates } from '../types';
import { MARS_REGIONS } from '../data/marsDatasets';
import nasaMarsTextureRaw from '../assets/images/nasa_mars_texture_raw_1794389610251.jpg';

interface MarsGlobeViewProps {
  onGlobeClickPoint?: (coords: MarsCoordinates) => void;
  onAnalyzeCoords?: (lat: number, lon: number, elevation: number) => void;
  activeStartPoint?: MarsCoordinates | null;
  activeGoalPoint?: MarsCoordinates | null;
  targetRegion?: MarsCoordinates | null;
  highlightedPoint?: MarsCoordinates | null;
  showOverlays?: boolean;
}

export const MarsGlobeView: React.FC<MarsGlobeViewProps> = ({
  onGlobeClickPoint,
  onAnalyzeCoords,
  activeStartPoint,
  activeGoalPoint,
  targetRegion,
  highlightedPoint,
  showOverlays = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeTextureRef = useRef<HTMLCanvasElement | null>(null);

  // Rotation angles: yaw (longitude spin), pitch (tilt)
  const [rotation, setRotation] = useState({ yaw: 110, pitch: -18 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasMovedDrag, setHasMovedDrag] = useState(false);
  const [zoom, setZoom] = useState(1.0);

  // Auto-spin state with prefers-reduced-motion check
  const [isAutoSpinning, setIsAutoSpinning] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return true;
  });

  // Dynamic raycast coordinate hover state
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number; elev: number; terrain: string } | null>(null);

  // Click beacon ripple animation state
  const [lastClickedPoint, setLastClickedPoint] = useState<MarsCoordinates | null>(null);
  const [clickRippleProgress, setClickRippleProgress] = useState(1.0);

  // Highlighted region ping radar animation state
  const [highlightedPingProgress, setHighlightedPingProgress] = useState(0);

  // Pre-render high-resolution equirectangular texture map using real NASA imagery
useEffect(() => {
  const tex = document.createElement('canvas');
  tex.width = 2048;
  tex.height = 1024;
  const tCtx = tex.getContext('2d');
  if (tCtx) {
    const w = 2048;
    const h = 1024;

    // Phase 1: Immediate realistic procedural base to prevent any black flash
    const bg = tCtx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#7c341e');
    bg.addColorStop(0.2, '#994424');
    bg.addColorStop(0.5, '#bd582b');
    bg.addColorStop(0.8, '#a34825');
    bg.addColorStop(1, '#682e1d');
    tCtx.fillStyle = bg;
    tCtx.fillRect(0, 0, w, h);

    // Dark Syrtis Major basalt deposit
    const smx = ((68 + 180) / 360) * w;
    const smy = ((90 - 10) / 180) * h;
    const smg = tCtx.createRadialGradient(smx, smy, 0, smx, smy, 140);
    smg.addColorStop(0, 'rgba(38, 14, 8, 0.85)');
    smg.addColorStop(0.7, 'rgba(48, 18, 10, 0.6)');
    smg.addColorStop(1, 'rgba(0,0,0,0)');
    tCtx.fillStyle = smg;
    tCtx.beginPath();
    tCtx.ellipse(smx, smy, 140, 110, -0.3, 0, Math.PI * 2);
    tCtx.fill();

    // Valles Marineris Rift System
    tCtx.strokeStyle = 'rgba(25, 8, 4, 0.92)';
    tCtx.lineWidth = 12;
    tCtx.lineCap = 'round';
    tCtx.beginPath();
    tCtx.moveTo(((-102 + 180) / 360) * w, ((90 - -7) / 180) * h);
    tCtx.lineTo(((-75 + 180) / 360) * w, ((90 - -11.5) / 180) * h);
    tCtx.lineTo(((-45 + 180) / 360) * w, ((90 - -14.5) / 180) * h);
    tCtx.stroke();

    // Polar Caps
    tCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    tCtx.fillRect(0, 0, w, 75);
    tCtx.fillRect(0, h - 65, w, 65);

    globeTextureRef.current = tex;

    // Phase 2: Load Real High-Definition NASA Viking / MOLA equirectangular global image
    const img = new Image();
    img.src = nasaMarsTextureRaw;
    img.onload = () => {
      tCtx.drawImage(img, 0, 0, w, h);
      // Re-apply subtle polar cap contrast blend if needed
      const npGrad = tCtx.createLinearGradient(0, 0, 0, 70);
      npGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      npGrad.addColorStop(0.7, 'rgba(240, 248, 255, 0.6)');
      npGrad.addColorStop(1, 'rgba(240, 248, 255, 0)');
      tCtx.fillStyle = npGrad;
      tCtx.fillRect(0, 0, w, 70);

      const spGrad = tCtx.createLinearGradient(0, h - 65, 0, h);
      spGrad.addColorStop(0, 'rgba(240, 248, 255, 0)');
      spGrad.addColorStop(0.3, 'rgba(245, 250, 255, 0.6)');
      spGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      tCtx.fillStyle = spGrad;
      tCtx.fillRect(0, h - 65, w, 65);

      globeTextureRef.current = tex;
    };
  }
}, []);

  useEffect(() => {
    if (!highlightedPoint) return;
    setHighlightedPingProgress(0);
    const start = performance.now();
    let animId: number;
    const animatePing = (now: number) => {
      const elapsed = (now - start) % 1600;
      setHighlightedPingProgress(elapsed / 1600);
      animId = requestAnimationFrame(animatePing);
    };
    animId = requestAnimationFrame(animatePing);
    return () => cancelAnimationFrame(animId);
  }, [highlightedPoint]);

  // Dynamic MOLA procedural elevation estimator for arbitrary planetary coordinates
  const calculatePlanetaryElevation = useCallback((lat: number, lon: number): { elev: number; terrain: string } => {
    const distOlympus = Math.hypot(lat - 18.65, ((lon - (-133.8) + 180) % 360) - 180);
    const distValles = Math.hypot(lat - (-13.9), ((lon - (-59.2) + 180) % 360) - 180);
    const distHellas = Math.hypot(lat - (-42.4), ((lon - 70.5 + 180) % 360) - 180);
    const distJezero = Math.hypot(lat - 18.38, ((lon - 77.58 + 180) % 360) - 180);
    const distGale = Math.hypot(lat - (-5.4), ((lon - 137.8 + 180) % 360) - 180);

    if (distOlympus < 8.0) {
      const peak = Math.max(0, 8.0 - distOlympus) / 8.0;
      return { elev: Math.round(5000 + peak * 16287), terrain: 'Olympus Mons Shield Volcano' };
    }
    if (distValles < 12.0) {
      return { elev: Math.round(-3800 - Math.sin(distValles * 0.5) * 1500), terrain: 'Valles Marineris Rift Canyon' };
    }
    if (distHellas < 18.0) {
      return { elev: Math.round(-7152 + distHellas * 120), terrain: 'Hellas Impact Basin' };
    }
    if (distJezero < 3.0) {
      return { elev: -2500, terrain: 'Jezero Crater Paleolake' };
    }
    if (distGale < 3.0) {
      return { elev: -4450, terrain: 'Gale Crater / Mt Sharp' };
    }

    if (Math.abs(lat) > 75) {
      return { elev: Math.round(1200 + Math.cos(lat * 0.1) * 800), terrain: lat > 0 ? 'Planum Boreum Ice Cap' : 'Planum Australe Ice Cap' };
    }

    if (lat > 15) {
      const elev = Math.round(-3800 + Math.sin(lat * 0.1) * 600 + Math.cos(lon * 0.15) * 500);
      return { elev, terrain: 'Northern Lowland Plains' };
    } else {
      const elev = Math.round(1500 + Math.sin(lat * 0.12) * 1200 + Math.cos(lon * 0.08) * 1000);
      return { elev, terrain: 'Terra Meridiani Highlands' };
    }
  }, []);

  // Smooth rotation animation
  useEffect(() => {
    const point = highlightedPoint || targetRegion;
    if (!point) return;
    const targetYaw = -point.lon;
    const targetPitch = point.lat;

    let startYaw = rotation.yaw;
    let diffYaw = ((targetYaw - startYaw + 540) % 360) - 180;
    let startPitch = rotation.pitch;
    let diffPitch = targetPitch - startPitch;

    let startTime = performance.now();
    const duration = 800;

    let animId: number;
    const animateRotation = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setRotation({
        yaw: startYaw + diffYaw * ease,
        pitch: startPitch + diffPitch * ease
      });

      if (progress < 1) {
        animId = requestAnimationFrame(animateRotation);
      }
    };

    animId = requestAnimationFrame(animateRotation);
    return () => cancelAnimationFrame(animId);
  }, [targetRegion, highlightedPoint]);

  const autoSpinOffsetRef = useRef(0);
  const satelliteAngleRef = useRef(0);
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  const isAutoSpinningRef = useRef(isAutoSpinning);
  isAutoSpinningRef.current = isAutoSpinning;

  const raycastSphere = useCallback((screenX: number, screenY: number, width: number, height: number): { lat: number; lon: number; elev: number; terrain: string } | null => {
    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.38;
    const radius = baseRadius * zoom;

    const dx = screenX - cx;
    const dy = screenY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > radius) {
      return null;
    }

    const nx = dx / radius;
    const ny = dy / radius;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

    const pitchRad = (rotation.pitch * Math.PI) / 180;
    const cosP = Math.cos(-pitchRad);
    const sinP = Math.sin(-pitchRad);

    const x3 = nx;
    const y3 = ny * cosP - nz * sinP;
    const z3 = ny * sinP + nz * cosP;

    const clampedY = Math.max(-1, Math.min(1, -y3));
    const latRad = Math.asin(clampedY);
    const lat = Number(((latRad * 180) / Math.PI).toFixed(4));

    const thetaRad = Math.atan2(x3, z3);
    const effectiveYaw = rotation.yaw + autoSpinOffsetRef.current;
    const yawRad = (effectiveYaw * Math.PI) / 180;
    let lonDeg = ((thetaRad - yawRad) * 180) / Math.PI;

    lonDeg = ((lonDeg % 360) + 360) % 360;
    const lon = Number(lonDeg.toFixed(4));

    const { elev, terrain } = calculatePlanetaryElevation(lat, lon);
    return { lat, lon, elev, terrain };
  }, [rotation, zoom, calculatePlanetaryElevation]);

  // Main 60 FPS Render Loop with Spherical Texture Projection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(64, now - lastTime);
      lastTime = now;

      if (isAutoSpinningRef.current && !isDraggingRef.current) {
        autoSpinOffsetRef.current = (autoSpinOffsetRef.current + 0.05 * (dt / 16)) % 360;
      }
      satelliteAngleRef.current = (satelliteAngleRef.current + 0.012 * (dt / 16)) % (Math.PI * 2);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.38;
      const radius = baseRadius * zoom;

      // Deep space translucent tint
      ctx.fillStyle = 'rgba(4, 7, 16, 0.12)';
      ctx.fillRect(0, 0, width, height);

      const effectiveYaw = rotation.yaw + autoSpinOffsetRef.current;
      const yawRad = (effectiveYaw * Math.PI) / 180;
      const pitchRad = (rotation.pitch * Math.PI) / 180;

      const projectCoordToScreen = (fLat: number, fLon: number) => {
        const phi = (fLat * Math.PI) / 180;
        const theta = (fLon * Math.PI) / 180 + yawRad;

        const x3 = Math.cos(phi) * Math.sin(theta);
        const y3 = -Math.sin(phi);
        const z3 = Math.cos(phi) * Math.cos(theta);

        const y3Pitched = y3 * Math.cos(pitchRad) - z3 * Math.sin(pitchRad);
        const z3Pitched = y3 * Math.sin(pitchRad) + z3 * Math.cos(pitchRad);

        return {
          px: cx + x3 * radius,
          py: cy + y3Pitched * radius,
          visible: z3Pitched > 0.02,
          depth: z3Pitched
        };
      };

      // MRO Orbit Track (Background Arc)
      const orbitRadius = radius * 1.32;
      const orbitInclination = (93 * Math.PI) / 180;
      const orbitSteps = 72;

      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= orbitSteps; i++) {
        const ang = (i / orbitSteps) * Math.PI * 2;
        const ox = Math.cos(ang) * orbitRadius;
        const oy = Math.sin(ang) * orbitRadius * Math.cos(orbitInclination);
        const oz = Math.sin(ang) * orbitRadius * Math.sin(orbitInclination);

        const oyPitched = oy * Math.cos(pitchRad) - oz * Math.sin(pitchRad);
        const ozPitched = oy * Math.sin(pitchRad) + oz * Math.cos(pitchRad);

        const px = cx + ox;
        const py = cy + oyPitched;

        if (ozPitched < 0) {
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();

      // Atmospheric Rayleigh Exosphere Glow
      const atmoGlow = ctx.createRadialGradient(cx, cy, radius * 0.94, cx, cy, radius * 1.18);
      atmoGlow.addColorStop(0, 'rgba(239, 68, 68, 0.42)');
      atmoGlow.addColorStop(0.35, 'rgba(245, 158, 11, 0.22)');
      atmoGlow.addColorStop(0.7, 'rgba(56, 189, 248, 0.25)');
      atmoGlow.addColorStop(0.9, 'rgba(99, 102, 241, 0.1)');
      atmoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmoGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // Planet Disk Clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Render Textured Spherical Globe using Sliced Equirectangular Sampling
      if (globeTextureRef.current) {
        const tex = globeTextureRef.current;
        const texW = tex.width;
        const texH = tex.height;
        const slices = 90;
        const sliceW = (2 * radius) / slices;

        for (let i = 0; i < slices; i++) {
          const sx = cx - radius + i * sliceW;
          const nx = (sx + sliceW * 0.5 - cx) / radius;
          const nzSq = 1 - nx * nx;

          if (nzSq > 0) {
            const nz = Math.sqrt(nzSq);
            const theta = Math.atan2(nx, nz);
            let lonDeg = (theta * 180) / Math.PI - effectiveYaw;
            let normLon = ((lonDeg % 360) + 360) % 360;

            const srcX = (normLon / 360) * texW;
            const srcW = Math.max(1, (texW / 360) * 2.5);

            ctx.drawImage(
              tex,
              Math.min(texW - srcW, Math.max(0, srcX)),
              0,
              srcW,
              texH,
              sx,
              cy - radius,
              sliceW + 0.5,
              radius * 2
            );
          }
        }
      } else {
        // Fallback base
        ctx.fillStyle = '#b4532a';
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      }

      // Directional Sunlit Shading & Nightside Terminator Shadow
      const sunCenterX = cx - radius * 0.35;
      const sunCenterY = cy - radius * 0.32;
      const shadowGrad = ctx.createLinearGradient(sunCenterX, sunCenterY, cx + radius * 0.85, cy + radius * 0.8);
      shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      shadowGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.65, 'rgba(2, 4, 12, 0.55)');
      shadowGrad.addColorStop(1, 'rgba(1, 2, 6, 0.92)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Latitude / Longitude Graticules
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let isStarted = false;
        for (let lon = 0; lon <= 360; lon += 5) {
          const p = projectCoordToScreen(lat, lon);
          if (p.visible) {
            if (!isStarted) {
              ctx.moveTo(p.px, p.py);
              isStarted = true;
            } else {
              ctx.lineTo(p.px, p.py);
            }
          } else {
            isStarted = false;
          }
        }
        ctx.stroke();
      }

      // Active Landing Site Reference Reticles
      if (showOverlays) {
        MARS_REGIONS.forEach((region) => {
          const p = projectCoordToScreen(region.center.lat, region.center.lon);
          if (p.visible) {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.px, p.py, 5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(p.px, p.py, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
            const label = region.name.split(' ')[0];
            ctx.font = 'bold 9px JetBrains Mono, monospace';
            const tw = ctx.measureText(label).width;
            ctx.fillRect(p.px + 8, p.py - 7, tw + 6, 14);
            ctx.strokeRect(p.px + 8, p.py - 7, tw + 6, 14);
            ctx.fillStyle = '#fef3c7';
            ctx.textAlign = 'left';
            ctx.fillText(label, p.px + 11, p.py + 4);
          }
        });
      }

      // Highlighted Point Ping Marker
      if (showOverlays && highlightedPoint) {
        const p = projectCoordToScreen(highlightedPoint.lat, highlightedPoint.lon);
        if (p.visible) {
          for (let ring = 0; ring < 3; ring++) {
            const ringProgress = (highlightedPingProgress + ring * 0.33) % 1;
            const pingRadius = (6 + ringProgress * 32) * zoom;
            const pingAlpha = Math.max(0, 1 - ringProgress) * 0.9;
            ctx.strokeStyle = `rgba(34, 211, 238, ${pingAlpha})`;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(p.px, p.py, pingRadius, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(p.px, p.py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore(); // Restore clip

      // MRO Satellite Foreground Arc & Satellite Body
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      let startedFg = false;
      for (let i = 0; i <= orbitSteps; i++) {
        const ang = (i / orbitSteps) * Math.PI * 2;
        const ox = Math.cos(ang) * orbitRadius;
        const oy = Math.sin(ang) * orbitRadius * Math.cos(orbitInclination);
        const oz = Math.sin(ang) * orbitRadius * Math.sin(orbitInclination);

        const oyPitched = oy * Math.cos(pitchRad) - oz * Math.sin(pitchRad);
        const ozPitched = oy * Math.sin(pitchRad) + oz * Math.cos(pitchRad);

        const px = cx + ox;
        const py = cy + oyPitched;

        if (ozPitched >= 0) {
          if (!startedFg) {
            ctx.moveTo(px, py);
            startedFg = true;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          startedFg = false;
        }
      }
      ctx.stroke();

      const satAng = satelliteAngleRef.current;
      const sox = Math.cos(satAng) * orbitRadius;
      const soy = Math.sin(satAng) * orbitRadius * Math.cos(orbitInclination);
      const soz = Math.sin(satAng) * orbitRadius * Math.sin(orbitInclination);

      const soyPitched = soy * Math.cos(pitchRad) - soz * Math.sin(pitchRad);
      const sozPitched = soy * Math.sin(pitchRad) + soz * Math.cos(pitchRad);

      const satPx = cx + sox;
      const satPy = cy + soyPitched;
      const isSatVisible = sozPitched > -0.15 || Math.hypot(sox, soyPitched) > radius;

      if (isSatVisible) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fillRect(satPx - 8, satPy - 2, 5, 4);
        ctx.fillRect(satPx + 3, satPy - 2, 5, 4);

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(satPx - 3, satPy - 3, 6, 6);

        if (showOverlays) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(6, 12, 28, 0.85)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = 1;
          ctx.fillRect(satPx + 9, satPy - 9, 102, 16);
          ctx.strokeRect(satPx + 9, satPy - 9, 102, 16);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 8px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText('MRO • 285km POLAR', satPx + 13, satPy + 2);
        }
      }
      ctx.restore();

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameId);
  }, [rotation, zoom, lastClickedPoint, clickRippleProgress, highlightedPoint, highlightedPingProgress, showOverlays]);

  // Click ripple progress ticker
  useEffect(() => {
    if (clickRippleProgress >= 1.0) return;
    const interval = setInterval(() => {
      setClickRippleProgress((p) => {
        if (p >= 1.0) {
          clearInterval(interval);
          return 1.0;
        }
        return p + 0.06;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [clickRippleProgress]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setHasMovedDrag(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;

    const hit = raycastSphere(screenX, screenY, canvas.width, canvas.height);
    setCursorCoords(hit);

    if (isDragging) {
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      if (Math.hypot(deltaX, deltaY) > 4) {
        setHasMovedDrag(true);
      }
      setRotation((prev) => ({
        yaw: (prev.yaw + (e.clientX - dragStartPos.x) * 0.45) % 360,
        pitch: Math.max(-75, Math.min(75, prev.pitch + (e.clientY - dragStartPos.y) * 0.45)),
      }));
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hasMovedDrag) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;

    const hit = raycastSphere(screenX, screenY, canvas.width, canvas.height);
    if (hit) {
      const targetCoord: MarsCoordinates = {
        lat: hit.lat,
        lon: hit.lon,
        elevationMeters: hit.elev,
        name: `Raycast: ${hit.terrain} (${hit.lat}°N, ${hit.lon}°E)`
      };

      setLastClickedPoint(targetCoord);
      setClickRippleProgress(0);

      if (onAnalyzeCoords) {
        onAnalyzeCoords(hit.lat, hit.lon, hit.elev);
      }

      if (onGlobeClickPoint) {
        onGlobeClickPoint(targetCoord);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.7, Math.min(2.5, prev - e.deltaY * 0.0015)));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[450px] sm:h-[560px] lg:h-[620px] min-h-[380px] max-h-[720px] bg-[#060b18]/25 backdrop-blur-xl rounded-xl border border-cyan-500/30 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        width={960}
        height={620}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair active:cursor-grabbing"
      />

      {showOverlays && (
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
          <div className="bg-slate-950/80 border border-cyan-500/40 backdrop-blur-md rounded-lg p-1.5 sm:p-2 px-2.5 sm:px-3 flex flex-wrap items-center gap-1.5 sm:gap-3 pointer-events-auto shadow-lg text-[10px] sm:text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="text-slate-400 hidden xs:inline">NASA REAL IMAGERY: </span>
              <span className="text-cyan-300 font-bold">VIKING / MOLA 2K (60 FPS)</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center space-x-1 text-[11px] font-mono text-cyan-400">
              <Satellite className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-300">MRO POLAR ORBIT</span>
            </div>
          </div>

          {cursorCoords && (
            <div className="bg-slate-950/85 border border-slate-700/80 backdrop-blur-md rounded-lg p-1.5 sm:p-2 px-2.5 sm:px-3 font-mono text-[10px] sm:text-xs text-slate-300 flex flex-wrap items-center gap-1.5 sm:gap-2.5 shadow-lg pointer-events-auto">
              <span>LAT: <span className="text-amber-300 font-bold">{cursorCoords.lat}°N</span></span>
              <span>LON: <span className="text-amber-300 font-bold">{cursorCoords.lon}°E</span></span>
              <span>ELEV: <span className="text-cyan-300 font-bold">{cursorCoords.elev}m</span></span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-emerald-400 text-[10px] sm:text-[11px] max-w-[120px] sm:max-w-[160px] truncate">{cursorCoords.terrain}</span>
            </div>
          )}
        </div>
      )}

      {showOverlays && (
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
          <div className="bg-slate-950/85 border border-cyan-500/40 backdrop-blur-md rounded-lg px-2.5 sm:px-3 py-1.5 pointer-events-auto flex items-center space-x-2 text-[11px] sm:text-xs font-mono">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
            <span className="text-slate-300">
              Click <strong className="text-cyan-300">ANY point on Mars</strong> to raycast & zoom into 2D GIS
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950/85 border border-slate-800 backdrop-blur-md rounded-lg p-1.5 pointer-events-auto shadow-lg">
            <button
              onClick={() => setIsAutoSpinning((prev) => !prev)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isAutoSpinning ? 'text-cyan-400 bg-cyan-950/80 hover:bg-cyan-900/90' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
              }`}
              title={isAutoSpinning ? "Pause Auto-Rotation" : "Resume Auto-Rotation"}
            >
              {isAutoSpinning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setRotation({ yaw: 110, pitch: -18 });
                autoSpinOffsetRef.current = 0;
                setZoom(1.0);
              }}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Reset Perspective (North Up)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
