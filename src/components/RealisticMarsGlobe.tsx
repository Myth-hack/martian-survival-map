/**
 * RealisticMarsGlobe.tsx
 * NASA Space Apps Challenge 2026 - Quanta Buddies
 * 
 * Shared, photorealistic 3D Mars Globe component utilizing Three.js PBR rendering:
 * - High-Resolution NASA PBR Textures (Albedo, Normal Map, Bump Elevation)
 * - Authentic Martian Dust Atmosphere (subtle hazel/amber rim glow shader, no Earth blue)
 * - Directional Harsh Solar Lighting for dramatic crater & canyon shadows
 * - OrbitControls for free 3D rotation, damping, and smooth zoom
 * - Full raycasting for latitude/longitude coordinate inspection
 * - Dual-Mode Support:
 *   - Main Explorer: Clean globe with 3D markers and screen-projected <Html> text labels
 *   - Orbital SAR: MRO satellite + conical radar beam + elliptical orbit (strictly isolated to SAR)
 */

import React, { useRef, useEffect, useCallback, useState, createContext, useContext } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MarsCoordinates } from '../types';
import { MARS_REGIONS } from '../data/marsDatasets';
import {
  getCachedPhotorealisticMarsTextures,
  getMarsMolaElevation,
  MARS_TEXTURE_SOURCES
} from '../utils/marsProceduralTextures';

export interface GlobeLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevationMeters: number;
  description?: string;
  type?: 'crater' | 'mountain' | 'canyon' | 'landing_site' | 'basin' | 'custom';
  isCustom?: boolean;
}

export interface HtmlProps {
  position: [number, number, number] | THREE.Vector3;
  children: React.ReactNode;
  visible?: boolean;
  className?: string;
  style?: React.CSSProperties;
  occlude?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export interface HtmlContextType {
  projectPosition: (pos: THREE.Vector3 | [number, number, number], occlude?: boolean) => { x: number; y: number; visible: boolean };
}

export const HtmlContext = createContext<HtmlContextType | null>(null);

/**
 * <Html> Component (matching @react-three/drei API pattern)
 * Projects 3D planetary coordinates to 2D screen positions,
 * keeping text labels tightly bound to surface landmarks and handling occlusion.
 */
export const Html: React.FC<HtmlProps> = ({
  position,
  children,
  visible = true,
  className = '',
  style,
  occlude = true,
  onClick
}) => {
  const ctx = useContext(HtmlContext);
  if (!ctx) return null;

  const vec = Array.isArray(position)
    ? new THREE.Vector3(position[0], position[1], position[2])
    : position;

  const { x, y, visible: isFrontFacing } = ctx.projectPosition(vec, occlude);
  if (!visible || !isFrontFacing) return null;

  return (
    <div
      onClick={onClick}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-opacity duration-150 ${className}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        ...style
      }}
    >
      {children}
    </div>
  );
};

export interface RealisticMarsGlobeProps {
  /** Mode: 'explorer' for main 3D interactive map, 'sar' for Orbital Intelligence HUD */
  mode?: 'explorer' | 'sar';
  className?: string;
  children?: React.ReactNode;

  // Camera & Perspective
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  rotation?: { yaw: number; pitch: number };
  onRotationChange?: (rotation: { yaw: number; pitch: number }) => void;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  interactive?: boolean;

  // Interactivity & Raycasting
  onGlobeClickPoint?: (coords: MarsCoordinates) => void;
  onHoverCoords?: (coords: { lat: number; lon: number; elev: number; terrain: string } | null) => void;

  // Mission Waypoints & Regions
  activeStartPoint?: MarsCoordinates | null;
  activeGoalPoint?: MarsCoordinates | null;
  targetRegion?: MarsCoordinates | null;
  highlightedPoint?: MarsCoordinates | null;
  showGraticule?: boolean;
  showLandingSites?: boolean;

  // Dynamic Location Markers & Selection
  locations?: GlobeLocation[];
  selectedLocationId?: string;
  onSelectLocation?: (loc: GlobeLocation) => void;

  // Orbital SAR specific props (ONLY rendered when mode === 'sar')
  sarTargetZone?: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    elevation: number;
    sarBackscatterDb?: number;
  } | null;
  orbitSpeedMultiplier?: number;
  isOrbitPlaying?: boolean;
  showSatellite?: boolean;

  // Lighting & Customization
  sunAngleDegrees?: number;
}

// Convert spherical (lat, lon) in degrees to 3D Cartesian on sphere of radius R
export function latLonToVector3(lat: number, lon: number, radius = 1.6): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180); // aligned with standard equirectangular texture

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

// Custom Martian Atmosphere Shader
const AtmosphereShader = {
  uniforms: {
    uSunDirection: { value: new THREE.Vector3(1, 0.4, 0.8).normalize() },
    uAtmoColorDay: { value: new THREE.Color(0xdc7244) },     // Natural dusty hazel / amber-orange
    uAtmoColorSunset: { value: new THREE.Color(0xb24a26) },  // Rich terracotta terminator glow
    uAtmoThickness: { value: 3.5 },                          // Edge sharpness
    uIntensity: { value: 1.0 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldNormal;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uSunDirection;
    uniform vec3 uAtmoColorDay;
    uniform vec3 uAtmoColorSunset;
    uniform float uAtmoThickness;
    uniform float uIntensity;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldNormal;

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      // Fresnel rim factor: peaks at grazing edge
      float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
      float factor = pow(rim, uAtmoThickness) * uIntensity;

      // Uniform 360-degree limb glow with authentic dusty Martian tones
      vec3 color = mix(uAtmoColorSunset, uAtmoColorDay, 0.6);
      
      // Zero blue light scattering: Mars atmosphere is CO2 and suspended ferric dust
      float alpha = factor * 0.9;
      
      if (alpha < 0.01) discard;
      gl_FragColor = vec4(color, alpha);
    }
  `
};

export const RealisticMarsGlobe: React.FC<RealisticMarsGlobeProps> = ({
  mode = 'explorer',
  className = '',
  children,
  zoom = 1.0,
  onZoomChange,
  rotation,
  onRotationChange,
  autoRotate = false,
  autoRotateSpeed = 0.5,
  interactive = true,
  onGlobeClickPoint,
  onHoverCoords,
  activeStartPoint,
  activeGoalPoint,
  targetRegion,
  highlightedPoint,
  showGraticule = true,
  showLandingSites = true,
  locations,
  selectedLocationId,
  onSelectLocation,
  sarTargetZone,
  orbitSpeedMultiplier = 1,
  isOrbitPlaying = true,
  showSatellite = true,
  sunAngleDegrees = 45
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // References to keep Three.js scene and components
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const marsMeshRef = useRef<THREE.Mesh | null>(null);
  const marsGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const lastCamMatrixRef = useRef(new THREE.Matrix4());
  const lastGroupMatrixRef = useRef(new THREE.Matrix4());

  // Satellite animation ticker
  const satelliteAngleRef = useRef(0);

  // Keep live ref of sarTargetZone for the WebGL render loop
  const sarTargetZoneRef = useRef(sarTargetZone);
  useEffect(() => {
    sarTargetZoneRef.current = sarTargetZone;
  }, [sarTargetZone]);

  // Camera tracking ticker for <Html> projected coordinates
  const [, setCameraVersion] = useState(0);

  // Dynamic 3D to 2D projection function for <Html> overlay labels
  const projectPosition = useCallback((pos: THREE.Vector3 | [number, number, number], occlude = true) => {
    if (!cameraRef.current || !mountRef.current) {
      return { x: 0, y: 0, visible: false };
    }
    const camera = cameraRef.current;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const vec = (pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(...pos)).clone();

    // If marsGroup is rotated or oriented, apply its full matrixWorld to world coordinates
    if (marsGroupRef.current) {
      vec.applyMatrix4(marsGroupRef.current.matrixWorld);
    }

    if (occlude) {
      // Planet center in world space is marsGroup origin
      const planetCenter = new THREE.Vector3();
      if (marsGroupRef.current) {
        marsGroupRef.current.getWorldPosition(planetCenter);
      }
      const normal = vec.clone().sub(planetCenter).normalize();
      const toCam = camera.position.clone().sub(vec).normalize();
      const dot = normal.dot(toCam);
      // Occluded by planet body if facing away from camera
      if (dot <= 0.04) {
        return { x: 0, y: 0, visible: false };
      }
    }

    vec.project(camera);

    // Behind camera frustum?
    if (vec.z > 1.0) {
      return { x: 0, y: 0, visible: false };
    }

    const x = (vec.x * 0.5 + 0.5) * width;
    const y = (-vec.y * 0.5 + 0.5) * height;

    return { x, y, visible: true };
  }, []);

  // Update camera zoom from prop
  useEffect(() => {
    if (cameraRef.current && controlsRef.current) {
      const dist = 5.2 / zoom;
      const dir = cameraRef.current.position.clone().sub(controlsRef.current.target).normalize();
      cameraRef.current.position.copy(controlsRef.current.target).addScaledVector(dir, dist);
      controlsRef.current.update();
      setCameraVersion(v => (v + 1) % 1000000);
    }
  }, [zoom]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Renderer Setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2 / zoom);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = false;
    renderer.localClippingEnabled = false;
    renderer.clippingPlanes = [];
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Cosmic Starfield Background
    const starCount = 1200;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 45 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const colorTint = Math.random();
      if (colorTint > 0.85) {
        starColors[i * 3] = 0.85; starColors[i * 3 + 1] = 0.92; starColors[i * 3 + 2] = 1.0;
      } else if (colorTint > 0.7) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 0.65;
      } else {
        const lum = 0.5 + Math.random() * 0.5;
        starColors[i * 3] = lum; starColors[i * 3 + 1] = lum; starColors[i * 3 + 2] = lum;
      }
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 3. Mars Planetary Group
    const marsGroup = new THREE.Group();
    scene.add(marsGroup);
    marsGroupRef.current = marsGroup;

    if (rotation) {
      marsGroup.rotation.y = THREE.MathUtils.degToRad(rotation.yaw);
      marsGroup.rotation.x = THREE.MathUtils.degToRad(rotation.pitch);
    }

    // 4. Standard High-Segment Sphere Geometry (128x128): smooth UV wrapping, zero jagged edges, no pinching
    const marsGeometry = new THREE.SphereGeometry(1.6, 128, 128);

    // Strict Pure NASA MeshStandardMaterial: No emissive hacks, no fake color overrides
    const marsMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.05
    });

    const marsMesh = new THREE.Mesh(marsGeometry, marsMaterial);
    marsMesh.castShadow = false;
    marsMesh.receiveShadow = false;
    marsGroup.add(marsMesh);
    marsMeshRef.current = marsMesh;

    // Load High-Res NASA Photographic Textures asynchronously with TextureLoader
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    // High-Resolution Equirectangular Mars Albedo (Color) Map
    if (MARS_TEXTURE_SOURCES.albedo.length > 0) {
      textureLoader.load(
        MARS_TEXTURE_SOURCES.albedo[0],
        (colorMap) => {
          colorMap.colorSpace = THREE.SRGBColorSpace;
          colorMap.wrapS = THREE.RepeatWrapping;
          colorMap.wrapT = THREE.ClampToEdgeWrapping;
          colorMap.generateMipmaps = true;
          colorMap.minFilter = THREE.LinearMipmapLinearFilter;
          colorMap.needsUpdate = true;
          marsMaterial.map = colorMap;
          marsMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          if (MARS_TEXTURE_SOURCES.albedo.length > 1) {
            textureLoader.load(MARS_TEXTURE_SOURCES.albedo[1], (backupTex) => {
              backupTex.colorSpace = THREE.SRGBColorSpace;
              backupTex.wrapS = THREE.RepeatWrapping;
              backupTex.wrapT = THREE.ClampToEdgeWrapping;
              backupTex.generateMipmaps = true;
              backupTex.minFilter = THREE.LinearMipmapLinearFilter;
              backupTex.needsUpdate = true;
              marsMaterial.map = backupTex;
              marsMaterial.needsUpdate = true;
            });
          }
        }
      );
    }

    // High-Resolution Mars Topography / Normal Map
    if (MARS_TEXTURE_SOURCES.normal.length > 0) {
      textureLoader.load(
        MARS_TEXTURE_SOURCES.normal[0],
        (normalTex) => {
          normalTex.wrapS = THREE.RepeatWrapping;
          normalTex.wrapT = THREE.ClampToEdgeWrapping;
          normalTex.generateMipmaps = true;
          normalTex.minFilter = THREE.LinearMipmapLinearFilter;
          normalTex.needsUpdate = true;
          marsMaterial.normalMap = normalTex;
          marsMaterial.normalScale.set(0.8, 0.8);
          marsMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          if (MARS_TEXTURE_SOURCES.normal.length > 1) {
            textureLoader.load(MARS_TEXTURE_SOURCES.normal[1], (backupNormal) => {
              backupNormal.wrapS = THREE.RepeatWrapping;
              backupNormal.wrapT = THREE.ClampToEdgeWrapping;
              backupNormal.generateMipmaps = true;
              backupNormal.minFilter = THREE.LinearMipmapLinearFilter;
              backupNormal.needsUpdate = true;
              marsMaterial.normalMap = backupNormal;
              marsMaterial.normalScale.set(0.8, 0.8);
              marsMaterial.needsUpdate = true;
            });
          }
        }
      );
    }

    // 5. Authentic Thin Martian Atmospheric Shell
    const atmoGeometry = new THREE.SphereGeometry(1.642, 64, 64);
    const atmoMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(AtmosphereShader.uniforms),
      vertexShader: AtmosphereShader.vertexShader,
      fragmentShader: AtmosphereShader.fragmentShader,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const atmosphereMesh = new THREE.Mesh(atmoGeometry, atmoMaterial);
    scene.add(atmosphereMesh);

    // 6. Balanced Lighting (No Voids, Realistic Depth):
    // Strong ambient light completely eliminates pitch-black void across 360 degrees
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    // Soft directional light provides light angle for normalMap to create 3D crater and mountain depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 5, 5);
    scene.add(directionalLight);

    const sunRad = THREE.MathUtils.degToRad(sunAngleDegrees);
    const sunDir = new THREE.Vector3(Math.cos(sunRad) * 4.5, 0.8, Math.sin(sunRad) * 4.5);
    atmoMaterial.uniforms.uSunDirection.value.copy(sunDir).normalize();

    // 7. Markers Group for Waypoints and Landing Sites
    const markersGroup = new THREE.Group();
    marsGroup.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // 8. Orbital SAR: Satellite & Scanning Beam Setup (STRICTLY when mode === 'sar')
    let satBus: THREE.Mesh | null = null;
    let radarCone: THREE.Mesh | null = null;
    let beamMat: THREE.MeshBasicMaterial | null = null;
    let satGroup: THREE.Group | null = null;
    let beamGroup: THREE.Group | null = null;
    let orbitLine: THREE.Line | null = null;
    const orbitRadiusA = 2.75;
    const orbitRadiusB = 2.45;

    const isSarMode = mode === 'sar' && showSatellite;

    if (isSarMode) {
      satGroup = new THREE.Group();
      scene.add(satGroup);

      beamGroup = new THREE.Group();
      scene.add(beamGroup);

      // Build MRO Satellite Mesh
      const satBusGeo = new THREE.BoxGeometry(0.12, 0.12, 0.18);
      const satBusMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.8 });
      satBus = new THREE.Mesh(satBusGeo, satBusMat);

      // Gold High-Gain Antenna Dish
      const dishGeo = new THREE.ConeGeometry(0.1, 0.05, 16);
      const dishMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.9 });
      const dish = new THREE.Mesh(dishGeo, dishMaterial);
      dish.position.set(0, 0.1, 0);
      dish.rotation.x = Math.PI;
      satBus.add(dish);

      // Deep Blue Solar Arrays
      const wingGeo = new THREE.BoxGeometry(0.42, 0.015, 0.12);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4, metalness: 0.6 });
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(-0.28, 0, 0);
      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(0.28, 0, 0);
      satBus.add(leftWing);
      satBus.add(rightWing);

      // Nadir SHARAD antenna boom
      const boomGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.16);
      const boomMaterial = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.5 });
      const boom = new THREE.Mesh(boomGeo, boomMaterial);
      boom.position.set(0, -0.12, 0);
      satBus.add(boom);

      satGroup.add(satBus);

      // Elliptical Orbit Ring
      const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadiusA, orbitRadiusB, 0, Math.PI * 2, false, 0);
      const orbitPoints = orbitCurve.getPoints(120);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y)));
      const orbitMat = new THREE.LineDashedMaterial({
        color: 0x06b6d4,
        dashSize: 0.12,
        gapSize: 0.08,
        transparent: true,
        opacity: 0.4
      });
      orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.computeLineDistances();
      orbitLine.rotation.x = THREE.MathUtils.degToRad(85);
      orbitLine.rotation.z = THREE.MathUtils.degToRad(-15);
      scene.add(orbitLine);

      // Conical Radar Beam Mesh
      const beamGeo = new THREE.ConeGeometry(0.55, 1.8, 32, 1, true);
      beamMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      radarCone = new THREE.Mesh(beamGeo, beamMat);
      radarCone.rotation.x = Math.PI; // point down
      beamGroup.add(radarCone);
    }

    // 9. Standard OrbitControls (Free camera rotation, damping, and smooth zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 12.0;
    controls.enablePan = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = autoRotateSpeed ?? 0.8;
    controlsRef.current = controls;

    const handleControlsChange = () => {
      setCameraVersion(v => (v + 1) % 1000000);
      if (onZoomChange && cameraRef.current) {
        const currentDist = cameraRef.current.position.distanceTo(controls.target);
        onZoomChange(Number((5.2 / currentDist).toFixed(2)));
      }
    };
    controls.addEventListener('change', handleControlsChange);

    // 10. Animation Loop with High-Precision Delta Timing (replaces deprecated THREE.Clock)
    let animId: number;
    let lastTime = performance.now();
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      // Update OrbitControls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Smooth dynamic tracking for <Html> markers:
      // If camera or globe moved or rotated on this frame, re-project label positions immediately
      if (cameraRef.current && marsGroupRef.current) {
        if (
          !cameraRef.current.matrixWorld.equals(lastCamMatrixRef.current) ||
          !marsGroupRef.current.matrixWorld.equals(lastGroupMatrixRef.current)
        ) {
          lastCamMatrixRef.current.copy(cameraRef.current.matrixWorld);
          lastGroupMatrixRef.current.copy(marsGroupRef.current.matrixWorld);
          setCameraVersion((v) => (v + 1) % 1000000);
        }
      }

      // Orbital SAR Satellite & Beam Animation (STRICTLY for mode === 'sar')
      if (isSarMode && satBus && radarCone && beamMat && isOrbitPlaying) {
        satelliteAngleRef.current += delta * 0.85 * orbitSpeedMultiplier;
        const angle = satelliteAngleRef.current;

        const satX = Math.cos(angle) * orbitRadiusA;
        const satZ = Math.sin(angle) * orbitRadiusB;
        const pos = new THREE.Vector3(satX, 0, satZ);
        pos.applyEuler(new THREE.Euler(THREE.MathUtils.degToRad(85), 0, THREE.MathUtils.degToRad(-15)));
        satBus.position.copy(pos);
        satBus.lookAt(0, 0, 0);

        let targetVec = new THREE.Vector3(0, 0, 1.6);
        const currentSarTarget = sarTargetZoneRef.current;
        if (currentSarTarget) {
          targetVec = latLonToVector3(currentSarTarget.lat, currentSarTarget.lon, 1.6);
          if (marsGroupRef.current) {
            targetVec.applyEuler(marsGroupRef.current.rotation);
          }
        }

        const dir = new THREE.Vector3().subVectors(targetVec, pos);
        const dist = dir.length();
        radarCone.position.copy(pos).addScaledVector(dir, 0.5);
        radarCone.scale.set(1, dist / 1.8, 1);
        radarCone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize());

        const pulse = 0.2 + 0.12 * Math.sin(elapsed * 4.0);
        beamMat.opacity = pulse;
      }

      // Pulse effects on highlighted target markers
      if (markersGroupRef.current) {
        markersGroupRef.current.children.forEach(child => {
          if (child.name.startsWith('pulse_')) {
            const scale = 1.0 + 0.25 * Math.sin(elapsed * 5.0);
            child.scale.set(scale, scale, scale);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Responsive Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      setCameraVersion(v => (v + 1) % 1000000);
    };

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(handleResize);
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 12. Pointer Raycasting for Surface Hover Coordinates & Precision Clicks
    let pointerDownPos = { x: 0, y: 0 };
    let isPointerDown = false;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isPointerDown = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!interactive || !isPointerDown) return;
      isPointerDown = false;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);

      // Only fire coordinate selection if user clicked without dragging
      if (dist < 5 && cameraRef.current && marsMeshRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);
        const intersects = raycaster.intersectObject(marsMeshRef.current, false);

        if (intersects.length > 0 && intersects[0].uv) {
          const uv = intersects[0].uv;
          const lat = Number(((uv.y - 0.5) * 180).toFixed(4));
          const lon = Number((((uv.x - 0.5) * 360 + 360) % 360).toFixed(4));
          const { elevation, terrain } = getMarsMolaElevation(lat, lon);

          if (onGlobeClickPoint) {
            onGlobeClickPoint({
              lat,
              lon,
              elevationMeters: elevation,
              name: `${terrain} (${lat}°N, ${lon}°E)`
            });
          }
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive || !cameraRef.current || !marsMeshRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);
      const intersects = raycaster.intersectObject(marsMeshRef.current, false);

      if (intersects.length > 0 && intersects[0].uv) {
        const uv = intersects[0].uv;
        const lat = Number(((uv.y - 0.5) * 180).toFixed(4));
        const lon = Number((((uv.x - 0.5) * 360 + 360) % 360).toFixed(4));
        const { elevation, terrain } = getMarsMolaElevation(lat, lon);

        if (onHoverCoords) {
          onHoverCoords({ lat, lon, elev: elevation, terrain });
        }
      } else {
        if (onHoverCoords) {
          onHoverCoords(null);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);

      controls.removeEventListener('change', handleControlsChange);
      controls.dispose();

      if (satGroup) scene.remove(satGroup);
      if (beamGroup) scene.remove(beamGroup);
      if (orbitLine) scene.remove(orbitLine);

      renderer.dispose();
      marsGeometry.dispose();
      marsMaterial.dispose();
      atmoGeometry.dispose();
      atmoMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, [mode, showSatellite]);

  // Update autoRotate setting on controls dynamically
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = autoRotateSpeed ?? 0.8;
    }
  }, [autoRotate, autoRotateSpeed]);

  // Update globe orientation dynamically when rotation prop changes
  useEffect(() => {
    if (marsGroupRef.current && rotation) {
      marsGroupRef.current.rotation.y = THREE.MathUtils.degToRad(rotation.yaw);
      marsGroupRef.current.rotation.x = THREE.MathUtils.degToRad(rotation.pitch);
      setCameraVersion(v => (v + 1) % 1000000);
    }
  }, [rotation]);

  // Render 3D Surface Markers and Pins on Mars
  useEffect(() => {
    const group = markersGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
    }

    const sphereR = 1.602;

    // 1. Planetary Landmarks & Strategic Locations
    if (showLandingSites) {
      const activeLocs: GlobeLocation[] = locations && locations.length > 0
        ? locations
        : MARS_REGIONS.map(r => ({
            id: r.id,
            name: r.name,
            lat: r.center.lat,
            lon: r.center.lon,
            elevationMeters: r.center.elevationMeters,
            type: 'landing_site' as const
          }));

      activeLocs.forEach((loc) => {
        const isSelected = selectedLocationId === loc.id;
        const pos = latLonToVector3(loc.lat, loc.lon, sphereR);

        const pinColor = isSelected
          ? 0x22d3ee
          : loc.type === 'mountain'
          ? 0xef4444
          : loc.type === 'canyon'
          ? 0x38bdf8
          : loc.type === 'crater'
          ? 0xf59e0b
          : 0x10b981;

        // 3D Sphere Marker Pin on Surface
        const markerGeo = new THREE.SphereGeometry(isSelected ? 0.035 : 0.024, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: pinColor });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(pos);
        group.add(marker);

        // Thin glowing ring around landmark on surface
        const ringGeo = new THREE.RingGeometry(0.035, 0.048, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: pinColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.65
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos.clone().multiplyScalar(1.002));
        ring.lookAt(0, 0, 0);
        group.add(ring);

        // Vertical glowing pin tether needle pointing up to label
        const needleEnd = latLonToVector3(loc.lat, loc.lon, sphereR + 0.065);
        const needleGeo = new THREE.BufferGeometry().setFromPoints([pos, needleEnd]);
        const needleMat = new THREE.LineBasicMaterial({
          color: pinColor,
          transparent: true,
          opacity: isSelected ? 0.9 : 0.5
        });
        const needle = new THREE.Line(needleGeo, needleMat);
        group.add(needle);
      });
    }

    // 2. Start Point (Green Pin)
    if (activeStartPoint) {
      const pos = latLonToVector3(activeStartPoint.lat, activeStartPoint.lon, sphereR);
      const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      group.add(pin);

      const auraGeo = new THREE.RingGeometry(0.06, 0.075, 32);
      const auraMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.copy(pos.clone().multiplyScalar(1.002));
      aura.lookAt(0, 0, 0);
      group.add(aura);
    }

    // 3. Goal Point (Red Pin)
    if (activeGoalPoint) {
      const pos = latLonToVector3(activeGoalPoint.lat, activeGoalPoint.lon, sphereR);
      const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      group.add(pin);

      const auraGeo = new THREE.RingGeometry(0.06, 0.075, 32);
      const auraMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.copy(pos.clone().multiplyScalar(1.002));
      aura.lookAt(0, 0, 0);
      group.add(aura);
    }

    // 4. Highlighted Point / Inspection Target
    if (highlightedPoint) {
      const pos = latLonToVector3(highlightedPoint.lat, highlightedPoint.lon, sphereR);
      const beaconGeo = new THREE.SphereGeometry(0.05, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.name = 'pulse_beacon';
      beacon.position.copy(pos);
      group.add(beacon);

      const ringGeo = new THREE.RingGeometry(0.08, 0.1, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'pulse_ring';
      ring.position.copy(pos.clone().multiplyScalar(1.003));
      ring.lookAt(0, 0, 0);
      group.add(ring);
    }

    // 5. Target Region Center Indicator
    if (targetRegion) {
      const pos = latLonToVector3(targetRegion.lat, targetRegion.lon, sphereR);
      const tGeo = new THREE.RingGeometry(0.05, 0.065, 32);
      const tMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
      const tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.copy(pos.clone().multiplyScalar(1.002));
      tMesh.lookAt(0, 0, 0);
      group.add(tMesh);
    }

    // 6. SAR Target Reticle Marker (Orbital Surveillance Lock-On)
    if (sarTargetZone) {
      const pos = latLonToVector3(sarTargetZone.lat, sarTargetZone.lon, sphereR);

      // Glowing Cyan Target Center Pin
      const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      pin.name = 'pulse_sar_pin';
      group.add(pin);

      // Inner Pulsing Ring
      const innerRingGeo = new THREE.RingGeometry(0.07, 0.085, 32);
      const innerRingMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
      const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
      innerRing.name = 'pulse_sar_ring';
      innerRing.position.copy(pos.clone().multiplyScalar(1.002));
      innerRing.lookAt(0, 0, 0);
      group.add(innerRing);

      // Outer Radar Target Bracket Ring
      const outerRingGeo = new THREE.RingGeometry(0.11, 0.122, 32);
      const outerRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRing.position.copy(pos.clone().multiplyScalar(1.003));
      outerRing.lookAt(0, 0, 0);
      group.add(outerRing);
    }

    // 6. Graticule Lines (Coordinate Grid)
    if (showGraticule) {
      const graticuleMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.12
      });

      // Parallels (Latitude lines every 30°)
      for (let lat = -60; lat <= 60; lat += 30) {
        const pts: THREE.Vector3[] = [];
        for (let lon = 0; lon <= 360; lon += 5) {
          pts.push(latLonToVector3(lat, lon, sphereR * 1.0005));
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(lineGeo, graticuleMat);
        group.add(line);
      }

      // Meridians (Longitude lines every 45°)
      for (let lon = 0; lon < 360; lon += 45) {
        const pts: THREE.Vector3[] = [];
        for (let lat = -85; lat <= 85; lat += 5) {
          pts.push(latLonToVector3(lat, lon, sphereR * 1.0005));
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(lineGeo, graticuleMat);
        group.add(line);
      }
    }

    setCameraVersion(v => (v + 1) % 1000000);
  }, [
    activeStartPoint,
    activeGoalPoint,
    highlightedPoint,
    targetRegion,
    showGraticule,
    showLandingSites,
    locations,
    selectedLocationId,
    sarTargetZone
  ]);

  return (
    <HtmlContext.Provider value={{ projectPosition }}>
      <div
        ref={mountRef}
        className={`relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden ${className}`}
      />
      {/* Dynamic <Html> text labels layer tracking surface markers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {children}
      </div>
    </HtmlContext.Provider>
  );
};
