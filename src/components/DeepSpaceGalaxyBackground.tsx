/**
 * Deep Space Orbital Starfield Background
 * NASA Space Apps Challenge 2026 - Team Quanta Buddies
 * 
 * Inspired by NASA planetary rings and deep-space long-exposure telemetry:
 * - Sweeping curved orbital light trails with spectral chromatic strata (crimson, amber, bright cyan horizon, iridescent particulate)
 * - Multi-layer dense starfield with natural scintillation and trajectory-aligned stellar streams
 * - Continuous, smooth particle flow along gravitational trajectories with subtle motion blur streaks
 * - GPU-optimized 2D canvas with high-DPI retina sharpness, requestAnimationFrame loop, and delta-time regulation
 * - Subdued, cinematic mouse parallax depth (foreground vs background)
 * - Strict 'prefers-reduced-motion' compliance rendering a pristine static celestial snapshot
 * - Non-blocking: fixed z-0, pointer-events-none, transparent container compatibility
 */

import React, { useEffect, useRef, useState } from 'react';

interface StreamParticle {
  streamIndex: number;
  u: number; // progress along curve [0, 1]
  speed: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  twinklePhase: number;
  color: string;
  lateralOffset: number; // offset perpendicular to curve
}

interface AmbientStar {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  size: number;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  color: string;
  depth: number; // 1 (far), 2 (mid), 3 (near)
}

export const DeepSpaceGalaxyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Mouse parallax tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - window.innerWidth / 2) * 0.012;
      targetMouseY = (e.clientY - window.innerHeight / 2) * 0.012;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Stream Definitions based on reference photograph
    // Band 0..6: Outer Crimson / Rust / Copper rings (upper right)
    // Band 7..10: Golden Amber / Warm Bronze transitional rings
    // Band 11: Core Horizon Limb (blinding white-cyan laser ribbon)
    // Band 12..17: Lower Iridescent Particulate Bands (multi-color starlight beads)
    const RING_BANDS = [
      // Outer red/terracotta trails
      { offset: 0.38, color: 'rgba(215, 45, 30, 0.45)', width: 2.2, type: 'red' },
      { offset: 0.35, color: 'rgba(235, 60, 40, 0.55)', width: 1.8, type: 'red' },
      { offset: 0.31, color: 'rgba(195, 40, 25, 0.40)', width: 1.5, type: 'red' },
      { offset: 0.28, color: 'rgba(240, 75, 45, 0.60)', width: 2.5, type: 'red' },
      { offset: 0.24, color: 'rgba(220, 50, 35, 0.50)', width: 1.6, type: 'red' },
      { offset: 0.20, color: 'rgba(245, 90, 50, 0.55)', width: 2.0, type: 'red' },

      // Golden / copper transitional ribbons
      { offset: 0.16, color: 'rgba(245, 158, 11, 0.65)', width: 2.2, type: 'amber' },
      { offset: 0.12, color: 'rgba(251, 191, 36, 0.70)', width: 1.8, type: 'amber' },
      { offset: 0.08, color: 'rgba(253, 230, 138, 0.75)', width: 2.0, type: 'amber' },
      { offset: 0.04, color: 'rgba(255, 245, 200, 0.85)', width: 1.6, type: 'amber' },

      // The Brilliant Horizon Rim (Center event horizon)
      { offset: 0.00, color: 'rgba(255, 255, 255, 0.98)', width: 3.5, type: 'horizon' },

      // Lower iridescent multi-color particulate bands
      { offset: -0.04, color: 'rgba(56, 189, 248, 0.75)', width: 1.8, type: 'blue' },
      { offset: -0.08, color: 'rgba(147, 51, 234, 0.55)', width: 1.5, type: 'purple' },
      { offset: -0.12, color: 'rgba(239, 68, 68, 0.65)', width: 2.0, type: 'red' },
      { offset: -0.16, color: 'rgba(16, 185, 129, 0.55)', width: 1.6, type: 'emerald' },
      { offset: -0.22, color: 'rgba(34, 211, 238, 0.60)', width: 1.8, type: 'blue' },
      { offset: -0.28, color: 'rgba(245, 158, 11, 0.50)', width: 1.5, type: 'amber' },
      { offset: -0.35, color: 'rgba(139, 92, 246, 0.45)', width: 1.4, type: 'purple' },
      { offset: -0.42, color: 'rgba(59, 130, 246, 0.40)', width: 1.6, type: 'blue' }
    ];

    // Prismatic particulate colors for iridescent stream beads
    const IRIDESCENT_COLORS = [
      'rgba(244, 63, 94, ',   // ruby rose
      'rgba(56, 189, 248, ',  // electric cyan
      'rgba(245, 158, 11, ',  // solar amber
      'rgba(168, 85, 247, ',  // cosmic violet
      'rgba(52, 211, 153, ',  // emerald aura
      'rgba(96, 165, 250, ',  // orbital blue
      'rgba(255, 255, 255, '  // pure diamond
    ];

    let particles: StreamParticle[] = [];
    let ambientStars: AmbientStar[] = [];

    // Parametric evaluation of the orbital trajectory curve
    // u ranges from 0 (top-right descent) to 1 (bottom horizontal sweep)
    const getCurvePoint = (
      u: number,
      offset: number,
      w: number,
      h: number,
      pX: number,
      pY: number
    ): { x: number; y: number; tx: number; ty: number } => {
      // Horizon Y anchor at roughly 65% of viewport height
      const horizonY = h * 0.67 + offset * h * 0.22 + pY * (1 + offset);

      // Curved Bezier Control Points
      // P0: Starts at upper right
      const p0x = w * (0.82 + offset * 0.38) + pX * 0.5;
      const p0y = -h * 0.1;

      // P1: Bends down through the lower-right focal apex
      const p1x = w * (0.96 + offset * 0.26) + pX * 0.8;
      const p1y = horizonY - h * 0.08;

      // P2: Sweeps horizontally all the way across to the left
      const p2x = -w * 0.15 + pX * 0.3;
      const p2y = horizonY + h * 0.04 * (1 - u);

      // Quadratic/Cubic composite evaluation
      const t = u;
      const invT = 1 - t;
      const x = invT * invT * p0x + 2 * invT * t * p1x + t * t * p2x;
      const y = invT * invT * p0y + 2 * invT * t * p1y + t * t * p2y;

      // Tangent vector
      const dx = 2 * invT * (p1x - p0x) + 2 * t * (p2x - p1x);
      const dy = 2 * invT * (p1y - p0y) + 2 * t * (p2y - p1y);
      const len = Math.hypot(dx, dy) || 1;

      return { x, y, tx: dx / len, ty: dy / len };
    };

    // Initialize stars and particles
    const initScene = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // 1. Ambient Background Stars
      ambientStars = [];
      const starCount = Math.min(550, Math.floor((width * height) / 3200));

      for (let i = 0; i < starCount; i++) {
        const depth = Math.random() < 0.65 ? 1 : Math.random() < 0.88 ? 2 : 3;
        const colorIdx = Math.floor(Math.random() * IRIDESCENT_COLORS.length);
        const color = IRIDESCENT_COLORS[colorIdx];
        const baseAlpha = depth === 1 ? 0.25 + Math.random() * 0.35 : depth === 2 ? 0.45 + Math.random() * 0.4 : 0.75 + Math.random() * 0.25;

        ambientStars.push({
          x: Math.random(),
          y: Math.random(),
          size: depth === 1 ? 0.7 + Math.random() * 0.6 : depth === 2 ? 1.2 + Math.random() * 0.8 : 1.8 + Math.random() * 1.2,
          alpha: baseAlpha,
          baseAlpha,
          twinkleSpeed: 0.006 + Math.random() * 0.02,
          color,
          depth
        });
      }

      // 2. Flowing Orbital Stream Particles
      particles = [];
      const particleCount = Math.min(320, Math.floor(width * 0.28));

      for (let i = 0; i < particleCount; i++) {
        const streamIdx = Math.floor(Math.random() * RING_BANDS.length);
        const band = RING_BANDS[streamIdx];
        const colorIdx = Math.floor(Math.random() * IRIDESCENT_COLORS.length);
        const color = band.type === 'red'
          ? 'rgba(244, 63, 94, '
          : band.type === 'amber'
          ? 'rgba(251, 191, 36, '
          : band.type === 'horizon'
          ? 'rgba(255, 255, 255, '
          : IRIDESCENT_COLORS[colorIdx];

        particles.push({
          streamIndex: streamIdx,
          u: Math.random(),
          // Continuous medium speed
          speed: 0.00065 + Math.random() * 0.00095,
          size: band.type === 'horizon' ? 1.6 + Math.random() * 1.6 : 0.9 + Math.random() * 1.5,
          alpha: 0.6 + Math.random() * 0.4,
          baseAlpha: 0.6 + Math.random() * 0.4,
          twinklePhase: Math.random() * Math.PI * 2,
          color,
          lateralOffset: (Math.random() - 0.5) * 6
        });
      }
    };

    const handleResize = () => {
      initScene();
      if (reducedMotion) {
        drawStaticFrame();
      }
    };

    window.addEventListener('resize', handleResize);
    initScene();

    // Static Snapshot for Reduced Motion Preferences
    const drawStaticFrame = () => {
      if (!ctx) return;

      // 1. Velvet space backdrop with cosmic illumination
      drawCosmicCanvasBackground(0, 0);

      // 2. Render all continuous ring bands
      drawRingBands(0, 0);

      // 3. Render ambient stars
      ambientStars.forEach((star) => {
        ctx.fillStyle = `${star.color}${star.baseAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Render representative static stream particles along trajectories
      particles.forEach((p) => {
        const band = RING_BANDS[p.streamIndex];
        const pt = getCurvePoint(p.u, band.offset, width, height, 0, 0);
        ctx.fillStyle = `${p.color}${p.baseAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(pt.x + pt.ty * p.lateralOffset, pt.y - pt.tx * p.lateralOffset, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Deep cosmic space background with subtle colored illumination
    const drawCosmicCanvasBackground = (pX: number, pY: number) => {
      // Deep obsidian void base
      ctx.fillStyle = '#020409';
      ctx.fillRect(0, 0, width, height);

      // 1. Subtle warm cosmic crimson / terracotta glow in upper-right quadrant
      const redGlow = ctx.createRadialGradient(
        width * 0.88 + pX * 2,
        height * 0.2 + pY * 2,
        50,
        width * 0.88 + pX * 2,
        height * 0.2 + pY * 2,
        Math.max(width * 0.55, 380)
      );
      redGlow.addColorStop(0, 'rgba(120, 24, 18, 0.42)');
      redGlow.addColorStop(0.45, 'rgba(75, 15, 12, 0.22)');
      redGlow.addColorStop(1, 'rgba(2, 4, 9, 0)');
      ctx.fillStyle = redGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Electric blue / cyan horizon corona glow across lower quadrant
      const horizonY = height * 0.67 + pY;
      const blueGlow = ctx.createRadialGradient(
        width * 0.5 + pX,
        horizonY,
        40,
        width * 0.5 + pX,
        horizonY,
        Math.max(width * 0.65, 450)
      );
      blueGlow.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
      blueGlow.addColorStop(0.35, 'rgba(14, 116, 144, 0.16)');
      blueGlow.addColorStop(0.75, 'rgba(3, 105, 161, 0.08)');
      blueGlow.addColorStop(1, 'rgba(2, 4, 9, 0)');
      ctx.fillStyle = blueGlow;
      ctx.fillRect(0, 0, width, height);

      // 3. Focal curve apex bloom at lower right bend
      const apexX = width * 0.94 + pX * 0.8;
      const apexY = horizonY - height * 0.06;
      const apexBloom = ctx.createRadialGradient(apexX, apexY, 10, apexX, apexY, Math.max(width * 0.28, 220));
      apexBloom.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      apexBloom.addColorStop(0.3, 'rgba(34, 211, 238, 0.25)');
      apexBloom.addColorStop(0.7, 'rgba(6, 182, 212, 0.08)');
      apexBloom.addColorStop(1, 'rgba(2, 4, 9, 0)');
      ctx.fillStyle = apexBloom;
      ctx.fillRect(0, 0, width, height);
    };

    // Render stratified concentric ring bands
    const drawRingBands = (pX: number, pY: number) => {
      RING_BANDS.forEach((band) => {
        ctx.strokeStyle = band.color;
        ctx.lineWidth = band.width;

        ctx.beginPath();
        const steps = 36;
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const pt = getCurvePoint(u, band.offset, width, height, pX, pY);
          if (s === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.stroke();

        // Extra outer bloom for the Horizon Rim
        if (band.type === 'horizon') {
          ctx.save();
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
          ctx.lineWidth = band.width * 2.8;
          ctx.filter = 'blur(3px)';
          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const u = s / steps;
            const pt = getCurvePoint(u, band.offset, width, height, pX, pY);
            if (s === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
          ctx.restore();
        }
      });
    };

    // If user requested reduced motion, draw once and exit
    if (reducedMotion) {
      drawStaticFrame();
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }

    // Dynamic Animation Loop
    let time = 0;

    const render = () => {
      time += 0.016;

      // Smooth mouse easing for parallax
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // 1. Draw cosmic space backdrop
      drawCosmicCanvasBackground(mouseX, mouseY);

      // 2. Render ambient background starfield with subtle twinkle
      ambientStars.forEach((star) => {
        const starParallaxX = mouseX * star.depth * 0.6;
        const starParallaxY = mouseY * star.depth * 0.6;
        const currentAlpha = Math.max(
          0.12,
          Math.min(1.0, star.baseAlpha + Math.sin(time * 3 + star.x * 20) * 0.22)
        );

        const sx = star.x * width + starParallaxX;
        const sy = star.y * height + starParallaxY;

        ctx.fillStyle = `${star.color}${currentAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle diamond flare for bright foreground stars
        if (star.depth === 3 && currentAlpha > 0.75) {
          ctx.fillStyle = `${star.color}${(currentAlpha * 0.2).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, star.size * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Render continuous curved orbital bands
      drawRingBands(mouseX, mouseY);

      // 4. Render flowing orbital particles along trajectories with velocity streaks
      particles.forEach((p) => {
        // Advance particle progress along curve
        p.u += p.speed;
        if (p.u > 1.0) {
          p.u = 0.0;
        }

        const band = RING_BANDS[p.streamIndex];
        const pt = getCurvePoint(p.u, band.offset, width, height, mouseX, mouseY);

        // Sinusoidal twinkle
        const alpha = Math.max(
          0.2,
          Math.min(1.0, p.baseAlpha + Math.sin(time * 4 + p.twinklePhase) * 0.25)
        );

        // Position with lateral offset
        const px = pt.x + pt.ty * p.lateralOffset;
        const py = pt.y - pt.tx * p.lateralOffset;

        // Draw elongated velocity streak along the tangent vector (long exposure effect)
        const streakLength = Math.max(3.0, p.size * 3.5);
        ctx.strokeStyle = `${p.color}${alpha.toFixed(2)})`;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - pt.tx * streakLength, py - pt.ty * streakLength);
        ctx.stroke();

        // Front glowing particle bead
        ctx.fillStyle = `${p.color}${(alpha * 0.9).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.75, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{
        backgroundColor: '#020409'
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          opacity: 0.98,
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      />
    </div>
  );
};

export default DeepSpaceGalaxyBackground;
