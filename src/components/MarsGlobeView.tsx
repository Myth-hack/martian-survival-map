/**
 * 3D Interactive Mars Globe Component
 * Team: Quanta Buddies - NASA Space Apps Challenge 2026
 * Full-planet spherical raycasting & seamless Macro-to-Micro 3D -> 2D synchronization
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Layers, Crosshair, MapPin, Navigation, Sparkles } from 'lucide-react';
import { MarsCoordinates } from '../types';
import { MARS_REGIONS } from '../data/marsDatasets';

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

  // Rotation angles: yaw (longitude spin), pitch (tilt)
  const [rotation, setRotation] = useState({ yaw: 110, pitch: -18 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasMovedDrag, setHasMovedDrag] = useState(false);
  const [zoom, setZoom] = useState(1.0);

  // Dynamic raycast coordinate hover state
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number; elev: number; terrain: string } | null>(null);

  // Click beacon ripple animation state
  const [lastClickedPoint, setLastClickedPoint] = useState<MarsCoordinates | null>(null);
  const [clickRippleProgress, setClickRippleProgress] = useState(1.0);

  // Highlighted region ping radar animation state
  const [highlightedPingProgress, setHighlightedPingProgress] = useState(0);

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
    // Known major planetary landmarks
    const distOlympus = Math.hypot(lat - 18.65, ((lon - (-133.8) + 180) % 360) - 180);
    const distValles = Math.hypot(lat - (-13.9), ((lon - (-59.2) + 180) % 360) - 180);
    const distHellas = Math.hypot(lat - (-42.4), ((lon - 70.5 + 180) % 360) - 180);
    const distJezero = Math.hypot(lat - 18.38, ((lon - 77.58 + 180) % 360) - 180);
    const distGale = Math.hypot(lat - (-5.4), ((lon - 137.8 + 180) % 360) - 180);
    const distBoreum = Math.hypot(lat - 88.0, ((lon - 0.0 + 180) % 360) - 180);
    const distElysium = Math.hypot(lat - 3.0, ((lon - 154.7 + 180) % 360) - 180);
    const distMeridiani = Math.hypot(lat - (-0.2), ((lon - 357.5 + 180) % 360) - 180);
    const distNoctis = Math.hypot(lat - (-7.0), ((lon - (-102.2) + 180) % 360) - 180);
    const distAcidalia = Math.hypot(lat - 49.8, ((lon - 339.3 + 180) % 360) - 180);

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
    if (distBoreum < 10.0) {
      return { elev: -1950, terrain: 'Planum Boreum Water-Ice Dome' };
    }
    if (distElysium < 5.0) {
      return { elev: -2610, terrain: 'Elysium Planitia Volcanic Plain' };
    }
    if (distMeridiani < 4.0) {
      return { elev: -1420, terrain: 'Meridiani Planum Hematite Unit' };
    }
    if (distNoctis < 6.0) {
      return { elev: 1100, terrain: 'Noctis Labyrinthus Swarm Maze' };
    }
    if (distAcidalia < 8.0) {
      return { elev: -4120, terrain: 'Acidalia Planitia Sediment Sheet' };
    }

    // Polar ice caps
    if (Math.abs(lat) > 75) {
      return { elev: Math.round(1200 + Math.cos(lat * 0.1) * 800), terrain: lat > 0 ? 'Planum Boreum Ice Cap' : 'Planum Australe Ice Cap' };
    }

    // Northern Lowlands vs Southern Highlands Dichotomy
    if (lat > 15) {
      // Vastitas Borealis lowlands (-3000 to -4500m)
      const elev = Math.round(-3800 + Math.sin(lat * 0.1) * 600 + Math.cos(lon * 0.15) * 500);
      return { elev, terrain: 'Northern Lowland Plains' };
    } else {
      // Southern cratered highlands (+1000 to +3000m)
      const elev = Math.round(1500 + Math.sin(lat * 0.12) * 1200 + Math.cos(lon * 0.08) * 1000);
      return { elev, terrain: 'Terra Meridiani Highlands' };
    }
  }, []);

  // Smooth cinematic rotation to target region or highlighted point when requested
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
      // Smooth cubic ease out
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

  // Raycasting: converts screen (x, y) into spherical Mars (lat, lon, elev)
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

    // Normalized screen disk coordinates [-1, 1]
    const nx = dx / radius;
    const ny = dy / radius;
    // Ray-sphere intersection z coordinate (unit sphere)
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

    // Convert pitch tilt back to world 3D coordinates
    const pitchRad = (rotation.pitch * Math.PI) / 180;
    const cosP = Math.cos(-pitchRad);
    const sinP = Math.sin(-pitchRad);

    const x3 = nx;
    const y3 = ny * cosP - nz * sinP;
    const z3 = ny * sinP + nz * cosP;

    // Convert 3D Cartesian coordinates to spherical coordinates (phi = lat, theta = lon)
    // lat is derived from y3: y3 = -sin(lat) => lat = -asin(y3)
    const clampedY = Math.max(-1, Math.min(1, -y3));
    const latRad = Math.asin(clampedY);
    const lat = Number(((latRad * 180) / Math.PI).toFixed(4));

    // lon is derived from theta = atan2(x3, z3) - yawRad
    const thetaRad = Math.atan2(x3, z3);
    const yawRad = (rotation.yaw * Math.PI) / 180;
    let lonDeg = ((thetaRad - yawRad) * 180) / Math.PI;

    // Normalize longitude to [0, 360) or standard [-180, 180]
    lonDeg = ((lonDeg % 360) + 360) % 360;
    const lon = Number(lonDeg.toFixed(4));

    const { elev, terrain } = calculatePlanetaryElevation(lat, lon);
    return { lat, lon, elev, terrain };
  }, [rotation, zoom, calculatePlanetaryElevation]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.38;
      const radius = baseRadius * zoom;

      // 1. Deep Space Cosmic Background with procedural starfield
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      const seed = 42;
      for (let i = 0; i < 70; i++) {
        const sx = ((Math.sin(i * 19.3 + seed) + 1) / 2) * width;
        const sy = ((Math.cos(i * 37.7 + seed) + 1) / 2) * height;
        const size = i % 3 === 0 ? 1.5 : 1.0;
        ctx.fillRect(sx, sy, size, size);
      }

      // 2. Atmospheric Limb Haze / Martian Exosphere
      const atmoGlow = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.15);
      atmoGlow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      atmoGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.18)');
      atmoGlow.addColorStop(0.8, 'rgba(56, 189, 248, 0.12)');
      atmoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmoGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // 3. Planet Disk Clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Martian Ochre / Basaltic Surface Base
      const marsBase = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
      marsBase.addColorStop(0, '#c45a39');
      marsBase.addColorStop(0.35, '#a44021');
      marsBase.addColorStop(0.7, '#6c2612');
      marsBase.addColorStop(1, '#3a1308');
      ctx.fillStyle = marsBase;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      const yawRad = (rotation.yaw * Math.PI) / 180;
      const pitchRad = (rotation.pitch * Math.PI) / 180;

      // Project spherical coordinates to screen (x, y)
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

      // Draw planetary terrain albedo markings
      const drawSphereFeature = (
        fLat: number,
        fLon: number,
        fRadius: number,
        color: string,
        label?: string
      ) => {
        const p = projectCoordToScreen(fLat, fLon);
        if (p.visible) {
          const apparentRadius = fRadius * zoom * (0.4 + p.depth * 0.6);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p.px, p.py, apparentRadius, 0, Math.PI * 2);
          ctx.fill();

          if (label && showOverlays) {
            ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, p.px, p.py - apparentRadius - 4);
          }
        }
      };

      // Continental/Basin albedo shading
      drawSphereFeature(0, -70, 45, 'rgba(80, 25, 12, 0.45)', 'Valles Marineris');
      drawSphereFeature(-42, 70, 60, 'rgba(50, 15, 8, 0.55)', 'Hellas Planitia');
      drawSphereFeature(18, 226, 32, 'rgba(175, 65, 30, 0.55)', 'Olympus Mons');
      drawSphereFeature(85, 0, 36, 'rgba(240, 248, 255, 0.88)', 'Planum Boreum');
      drawSphereFeature(-85, 0, 26, 'rgba(235, 245, 255, 0.88)', 'Planum Australe');

      // 4. Planetary Graticule Latitude / Longitude lines
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

      for (let lon = 0; lon < 360; lon += 45) {
        ctx.beginPath();
        let isStarted = false;
        for (let lat = -85; lat <= 85; lat += 5) {
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

      // 5. Day/Night Solar Terminator Shadow
      const shadowGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.32)');
      shadowGrad.addColorStop(1, 'rgba(2, 4, 10, 0.92)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // 6. Active Landing Site Reference Reticles (Conditional on showOverlays)
      if (showOverlays) {
        MARS_REGIONS.forEach((region) => {
          const p = projectCoordToScreen(region.center.lat, region.center.lon);
          if (p.visible) {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.px, p.py, 5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(p.px, p.py, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
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

      // 7. Active Start Point Pin (Green) (Conditional on showOverlays)
      if (showOverlays && activeStartPoint) {
        const p = projectCoordToScreen(activeStartPoint.lat, activeStartPoint.lon);
        if (p.visible) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.px, p.py, 7, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(p.px, p.py, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Label
          ctx.fillStyle = 'rgba(6, 78, 59, 0.9)';
          ctx.strokeStyle = '#10b981';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.fillRect(p.px + 10, p.py - 8, 48, 16);
          ctx.strokeRect(p.px + 10, p.py - 8, 48, 16);
          ctx.fillStyle = '#a7f3d0';
          ctx.textAlign = 'left';
          ctx.fillText('START', p.px + 14, p.py + 4);
        }
      }

      // 8. Active Goal Point Pin (Red) (Conditional on showOverlays)
      if (showOverlays && activeGoalPoint) {
        const p = projectCoordToScreen(activeGoalPoint.lat, activeGoalPoint.lon);
        if (p.visible) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.px, p.py, 7, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(p.px, p.py, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Label
          ctx.fillStyle = 'rgba(127, 29, 29, 0.9)';
          ctx.strokeStyle = '#ef4444';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.fillRect(p.px + 10, p.py - 8, 42, 16);
          ctx.strokeRect(p.px + 10, p.py - 8, 42, 16);
          ctx.fillStyle = '#fecaca';
          ctx.textAlign = 'left';
          ctx.fillText('GOAL', p.px + 14, p.py + 4);
        }
      }

      // 9. Click Ripple & Target Reticle Animation (Conditional on showOverlays)
      if (showOverlays && lastClickedPoint && clickRippleProgress < 1.0) {
        const p = projectCoordToScreen(lastClickedPoint.lat, lastClickedPoint.lon);
        if (p.visible) {
          const rippleRadius = 8 + clickRippleProgress * 36;
          const alpha = 1.0 - clickRippleProgress;
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.px, p.py, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Reticle crosshair
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
          ctx.beginPath();
          ctx.moveTo(p.px - 14, p.py);
          ctx.lineTo(p.px + 14, p.py);
          ctx.moveTo(p.px, p.py - 14);
          ctx.lineTo(p.px, p.py + 14);
          ctx.stroke();
        }
      }

      // 10. Highlighted Location Visual Marker & Animated Radar Ping (Conditional on showOverlays)
      if (showOverlays && highlightedPoint) {
        const p = projectCoordToScreen(highlightedPoint.lat, highlightedPoint.lon);
        if (p.visible) {
          // 3 expanding radar ping rings
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

          // Reticle crosshair
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.px - 14, p.py);
          ctx.lineTo(p.px + 14, p.py);
          ctx.moveTo(p.px, p.py - 14);
          ctx.lineTo(p.px, p.py + 14);
          ctx.stroke();

          // Center glowing beacon dot
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(p.px, p.py, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.px, p.py, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // High-tech HUD tag label
          const label = highlightedPoint.name?.split(' ')[0] || 'INSPECT';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(8, 15, 28, 0.9)';
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1;
          ctx.fillRect(p.px + 10, p.py - 8, tw + 10, 16);
          ctx.strokeRect(p.px + 10, p.py - 8, tw + 10, 16);
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'left';
          ctx.fillText(label, p.px + 15, p.py + 4);
        }
      }

      ctx.restore(); // Restore disk clip

      // Globe Rim Outer Ring
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    };

    render();
  }, [
    rotation,
    zoom,
    activeStartPoint,
    activeGoalPoint,
    lastClickedPoint,
    clickRippleProgress,
    highlightedPoint,
    highlightedPingProgress,
    showOverlays
  ]);

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

  // Mouse drag & raycasting handlers
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

    // Instant Raycasting on hover
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

  // Universal Click Detection: Raycasting anywhere on the 3D globe triggers macro-to-micro transition
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If the user was dragging the globe, do not treat as a point click
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
      className="relative w-full h-[620px] bg-[#070a11] rounded-xl border border-cyan-950/60 overflow-hidden shadow-2xl flex flex-col items-center justify-center"
    >
      {/* 3D Canvas with raycasting */}
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

      {/* Top Floating Telemetry HUD (Conditional on showOverlays) */}
      {showOverlays && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="bg-slate-950/85 border border-cyan-800/60 backdrop-blur-md rounded-lg p-2 px-3 flex items-center space-x-3 pointer-events-auto shadow-lg">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <div className="font-mono text-xs">
              <span className="text-slate-400">PLANETARY RAYCASTER: </span>
              <span className="text-cyan-300 font-bold">SPHERICAL 3D TO 2D SYNC</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400">
              <Sparkles className="w-3 h-3" />
              <span>UNIVERSAL INTERACTION ACTIVE</span>
            </div>
          </div>

          {/* Dynamic Coordinates HUD from Raycasting */}
          {cursorCoords && (
            <div className="bg-slate-950/90 border border-slate-700/80 backdrop-blur-md rounded-lg p-2 px-3 font-mono text-xs text-slate-300 flex items-center space-x-3 shadow-lg pointer-events-auto">
              <span>LAT: <span className="text-amber-300 font-bold">{cursorCoords.lat}°N</span></span>
              <span>LON: <span className="text-amber-300 font-bold">{cursorCoords.lon}°E</span></span>
              <span>ELEV: <span className="text-cyan-300 font-bold">{cursorCoords.elev}m</span></span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 text-[11px] max-w-[150px] truncate">{cursorCoords.terrain}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Interactive Instruction & Camera Bar (Conditional on showOverlays) */}
      {showOverlays && (
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Dynamic Instruction Badge */}
          <div className="bg-slate-950/90 border border-cyan-700/50 backdrop-blur-md rounded-lg px-3 py-1.5 pointer-events-auto flex items-center space-x-2 text-xs font-mono">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-slate-300">
              Click <strong className="text-cyan-300">ANY point on Mars</strong> to raycast & cinematic zoom into 2D GIS
            </span>
          </div>

          {/* Globe Camera Tools */}
          <div className="flex items-center space-x-1.5 bg-slate-950/85 border border-slate-800 backdrop-blur-md rounded-lg p-1.5 pointer-events-auto shadow-lg">
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
              onClick={() => { setRotation({ yaw: 110, pitch: -18 }); setZoom(1.0); }}
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
