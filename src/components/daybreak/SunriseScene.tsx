import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SunriseFallback } from './SunriseFallback.tsx';

interface SunriseSceneProps {
  progress?: number; // 0 (twilight below horizon) to 1 (full daylight)
  interactiveParallax?: { x: number; y: number };
  glowIntensity?: number; // 1 (normal) to 1.6 (on focus / auth success)
  isSunInteractive?: boolean;
  isActivating?: boolean;
  onSunHover?: (isHovered: boolean) => void;
  onSunClick?: () => void;
  onSunScreenPositionChange?: (pos: { x: number; y: number; visible: boolean }) => void;
  onContextReady?: () => void;
  className?: string;
}

// Pre-allocated reusable module-scope variables for zero GC in render loop
const _camTarget = new THREE.Vector3();
const _sunScreenVec = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _mouseVec = new THREE.Vector2();

// Helper to generate procedural circular radial glow texture (zero external files)
function createGlowTexture(colorInner: string, colorOuter: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, colorInner);
    gradient.addColorStop(0.35, colorOuter);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural soft cloud texture
function createCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 64, 512, 64);
    gradient.addColorStop(0, 'rgba(241, 139, 88, 0)');
    gradient.addColorStop(0.2, 'rgba(255, 213, 138, 0.25)');
    gradient.addColorStop(0.5, 'rgba(255, 246, 233, 0.45)');
    gradient.addColorStop(0.8, 'rgba(241, 139, 88, 0.25)');
    gradient.addColorStop(1, 'rgba(241, 139, 88, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 20, 512, 88);

    // Soft gaussian-like blur lines
    ctx.fillStyle = 'rgba(255, 213, 138, 0.3)';
    ctx.beginPath();
    ctx.ellipse(256, 64, 200, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural mountain ridge geometry generator using mathematical sine-harmonics
function createMountainRidgeGeometry(
  width: number,
  depth: number,
  peakHeight: number,
  freq: number,
  segmentsX = 64,
  segmentsZ = 8
): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ);
  geom.rotateX(-Math.PI / 2);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Fade to 0 at edges so mountains slope naturally
    const edgeFade = Math.sin((((x + width / 2) / width) * Math.PI));
    const depthFade = Math.max(0, 1 - Math.abs(z / (depth / 2)));

    // Multi-frequency noise
    const h1 = Math.sin(x * freq + 0.8) * 0.5 + 0.5;
    const h2 = Math.sin(x * freq * 2.3 + 1.7) * 0.25;
    const h3 = Math.cos(x * freq * 4.7) * 0.12;

    const y = (h1 + h2 + h3) * peakHeight * edgeFade * depthFade;
    pos.setY(i, y);
  }

  geom.computeVertexNormals();
  return geom;
}

export const SunriseScene: React.FC<SunriseSceneProps> = ({
  progress = 0.5,
  interactiveParallax = { x: 0, y: 0 },
  glowIntensity = 1.0,
  isSunInteractive = true,
  isActivating = false,
  onSunHover,
  onSunClick,
  onSunScreenPositionChange,
  onContextReady,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [isReady, setIsReady] = useState(false);
  const [isHoveredLocal, setIsHoveredLocal] = useState(false);

  // Mutable animation state between frames without triggering React re-renders
  const stateRef = useRef({
    progress,
    glowIntensity,
    isSunInteractive,
    isActivating,
    activationTime: 0,
    targetProgress: progress,
    targetGlow: glowIntensity,
    parallax: { x: 0, y: 0 },
    targetParallax: { x: 0, y: 0 },
    isHovered: false,
    sunScreenPos: { x: 0, y: 0, visible: false },
  });

  // Sync props to refs
  useEffect(() => {
    stateRef.current.targetProgress = progress;
    stateRef.current.targetGlow = glowIntensity;
    stateRef.current.targetParallax = interactiveParallax;
    stateRef.current.isSunInteractive = isSunInteractive;
    stateRef.current.isActivating = isActivating;
  }, [progress, glowIntensity, interactiveParallax, isSunInteractive, isActivating]);

  // Keep callback refs
  const onSunHoverRef = useRef(onSunHover);
  onSunHoverRef.current = onSunHover;
  const onSunClickRef = useRef(onSunClick);
  onSunClickRef.current = onSunClick;
  const onSunScreenPosRef = useRef(onSunScreenPositionChange);
  onSunScreenPosRef.current = onSunScreenPositionChange;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect WebGL capability safely
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0D1424');
    scene.fog = new THREE.FogExp2('#1C2B46', 0.014);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 48);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch (e) {
      console.warn('WebGL init failed, using CSS fallback:', e);
      setWebGLSupported(false);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // -----------------------------------------------------------------
    // 1. TWINKLING STARS IN THE TWILIGHT SKY (Fades as Dawn Breaks)
    // -----------------------------------------------------------------
    const starCount = 260;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starTwinkleSpeeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 160;
      starPositions[i * 3 + 1] = 8 + Math.random() * 45;
      starPositions[i * 3 + 2] = -30 - Math.random() * 40;
      starTwinkleSpeeds[i] = 1.0 + Math.random() * 3.0;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starTex = createGlowTexture('rgba(255, 255, 255, 1)', 'rgba(255, 213, 138, 0.4)');
    const starMat = new THREE.PointsMaterial({
      map: starTex,
      size: 0.65,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
      color: new THREE.Color('#FFF6E9'),
    });
    const starField = new THREE.Points(starGeom, starMat);
    scene.add(starField);

    // -----------------------------------------------------------------
    // 2. LIGHTING RIG
    // -----------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight('#1E2A42', 1.0);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#655777', '#111A2E', 0.8);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // Warm Sun Directional Light
    const sunLight = new THREE.DirectionalLight('#FFD58A', 0.5);
    sunLight.position.set(0, -5, -30);
    scene.add(sunLight);

    // -----------------------------------------------------------------
    // 3. SUN ASSEMBLY (Glowing 3D Core Sphere + Halo Billboard Rings + Picking Sphere)
    // -----------------------------------------------------------------
    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, -6, -35);
    scene.add(sunGroup);

    // Sun Core Sphere
    const sunGeom = new THREE.SphereGeometry(3.6, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FFF6E9'),
    });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunGroup.add(sunMesh);

    // Interactive Raycasting Picking Sphere (Slightly larger radius for easy clicking/touching)
    const pickingGeom = new THREE.SphereGeometry(6.2, 16, 16);
    const pickingMat = new THREE.MeshBasicMaterial({
      visible: false,
    });
    const sunPickingMesh = new THREE.Mesh(pickingGeom, pickingMat);
    sunGroup.add(sunPickingMesh);

    // Inner Atmospheric Corona Glow
    const coronaTexture = createGlowTexture('rgba(255, 246, 233, 0.98)', 'rgba(255, 213, 138, 0.65)');
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coronaSprite = new THREE.Sprite(coronaMat);
    coronaSprite.scale.set(19, 19, 1);
    sunGroup.add(coronaSprite);

    // Golden Interactive Outline Ring / Hover Highlight
    const ringTexture = createGlowTexture('rgba(255, 246, 233, 0.0)', 'rgba(255, 213, 138, 0.9)');
    const ringMat = new THREE.SpriteMaterial({
      map: ringTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    });
    const ringSprite = new THREE.Sprite(ringMat);
    ringSprite.scale.set(24, 24, 1);
    sunGroup.add(ringSprite);

    // Outer Soft Dawn Bloom Halo
    const bloomTexture = createGlowTexture('rgba(241, 139, 88, 0.75)', 'rgba(101, 87, 119, 0.2)');
    const bloomMat = new THREE.SpriteMaterial({
      map: bloomTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.6,
    });
    const bloomSprite = new THREE.Sprite(bloomMat);
    bloomSprite.scale.set(48, 48, 1);
    sunGroup.add(bloomSprite);

    // Volumetric Morning Rays Fan
    const rayGroup = new THREE.Group();
    const rayCount = 14;
    const rayGeom = new THREE.PlaneGeometry(2.4, 80);
    rayGeom.translate(0, 40, 0); // Pivot at sun center
    const rayTex = createGlowTexture('rgba(255, 213, 138, 0.4)', 'rgba(241, 139, 88, 0.05)');
    const rayMat = new THREE.MeshBasicMaterial({
      map: rayTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      opacity: 0.25,
    });

    for (let i = 0; i < rayCount; i++) {
      const ray = new THREE.Mesh(rayGeom, rayMat);
      const angle = (i / rayCount) * Math.PI - Math.PI / 2;
      ray.rotation.z = angle + (Math.random() * 0.1 - 0.05);
      rayGroup.add(ray);
    }
    sunGroup.add(rayGroup);

    // -----------------------------------------------------------------
    // 4. DRIFTING WISPY HORIZON CLOUDS
    // -----------------------------------------------------------------
    const cloudTexture = createCloudTexture();
    const cloudGeom = new THREE.PlaneGeometry(120, 16);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });
    const cloud1 = new THREE.Mesh(cloudGeom, cloudMat);
    cloud1.position.set(-20, 5, -28);
    scene.add(cloud1);

    const cloud2 = new THREE.Mesh(cloudGeom, cloudMat.clone());
    (cloud2.material as THREE.MeshBasicMaterial).opacity = 0.25;
    cloud2.position.set(30, 8, -32);
    cloud2.scale.set(1.2, 1.2, 1);
    scene.add(cloud2);

    // -----------------------------------------------------------------
    // 5. MULTI-LAYER DEPTH LANDSCAPE
    // -----------------------------------------------------------------
    // Layer 1: Far Horizon Peaks (#3A2F4A)
    const farMtnGeom = createMountainRidgeGeometry(140, 32, 13, 0.045, 80, 10);
    const farMtnMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3A2F4A'),
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    const farMtn = new THREE.Mesh(farMtnGeom, farMtnMat);
    farMtn.position.set(0, 0, -25);
    scene.add(farMtn);

    // Layer 2: Mid-Range Mountain Ridges (#2C2840)
    const midMtnGeom = createMountainRidgeGeometry(120, 24, 9.5, 0.07, 70, 8);
    const midMtnMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2C2840'),
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });
    const midMtn = new THREE.Mesh(midMtnGeom, midMtnMat);
    midMtn.position.set(4, -1, -8);
    scene.add(midMtn);

    // Layer 3: Near Foreground Foothills (#101726)
    const nearMtnGeom = createMountainRidgeGeometry(90, 18, 5.8, 0.1, 50, 6);
    const nearMtnMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#101726'),
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });
    const nearMtn = new THREE.Mesh(nearMtnGeom, nearMtnMat);
    nearMtn.position.set(-6, -2.5, 10);
    scene.add(nearMtn);

    // -----------------------------------------------------------------
    // 6. WATER / MISTY VALLEY REFLECTION PLANE
    // -----------------------------------------------------------------
    const lakeGeom = new THREE.PlaneGeometry(160, 48, 32, 16);
    lakeGeom.rotateX(-Math.PI / 2);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0E1524'),
      roughness: 0.2,
      metalness: 0.9,
    });
    const lake = new THREE.Mesh(lakeGeom, lakeMat);
    lake.position.set(0, -2.8, 5);
    scene.add(lake);

    // -----------------------------------------------------------------
    // 7. FLOATING MORNING PARTICLES (Sun Motes)
    // -----------------------------------------------------------------
    const particleCount = 220;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    const particleVelocities = new Float32Array(particleCount * 3); // For shockwave burst on activation

    for (let i = 0; i < particleCount; i++) {
      const px = (Math.random() - 0.5) * 65;
      const py = Math.random() * 26 - 2;
      const pz = Math.random() * 42 - 10;
      particlePositions[i * 3] = px;
      particlePositions[i * 3 + 1] = py;
      particlePositions[i * 3 + 2] = pz;
      particleSpeeds[i] = 0.2 + Math.random() * 0.4;
      particleVelocities[i * 3] = 0;
      particleVelocities[i * 3 + 1] = 0;
      particleVelocities[i * 3 + 2] = 0;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleTex = createGlowTexture('rgba(255, 246, 233, 1)', 'rgba(255, 213, 138, 0.5)');
    const particleMat = new THREE.PointsMaterial({
      map: particleTex,
      size: 0.55,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: new THREE.Color('#FFD58A'),
      opacity: 0.35,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // Pre-warm shaders
    renderer.compile(scene, camera);
    setIsReady(true);
    if (onContextReady) onContextReady();

    // -----------------------------------------------------------------
    // 8. INTERACTIVE RAYCASTING (HOVER & CLICK ON 3D SUN)
    // -----------------------------------------------------------------
    const checkSunIntersection = (clientX: number, clientY: number): boolean => {
      if (!container || !stateRef.current.isSunInteractive) return false;
      const rect = container.getBoundingClientRect();
      _mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_mouseVec, camera);

      const hits = _raycaster.intersectObject(sunPickingMesh);
      return hits.length > 0;
    };

    const handleCanvasPointerMove = (e: PointerEvent) => {
      const isHit = checkSunIntersection(e.clientX, e.clientY);
      if (isHit !== stateRef.current.isHovered) {
        stateRef.current.isHovered = isHit;
        setIsHoveredLocal(isHit);
        container.style.cursor = isHit && stateRef.current.isSunInteractive ? 'pointer' : 'default';
        if (onSunHoverRef.current) {
          onSunHoverRef.current(isHit);
        }
      }
    };

    const handleCanvasPointerDown = (e: PointerEvent) => {
      if (!stateRef.current.isSunInteractive || stateRef.current.isActivating) return;
      const isHit = checkSunIntersection(e.clientX, e.clientY);
      if (isHit) {
        if (onSunClickRef.current) {
          onSunClickRef.current();
        }
      }
    };

    container.addEventListener('pointermove', handleCanvasPointerMove);
    container.addEventListener('pointerdown', handleCanvasPointerDown);

    // -----------------------------------------------------------------
    // 9. ANIMATION & CAMERA TRAJECTORY RENDER LOOP
    // -----------------------------------------------------------------
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Exponential damping of progress, glow & parallax
      const state = stateRef.current;
      state.progress = THREE.MathUtils.damp(state.progress, state.targetProgress, 2.8, delta);
      state.glowIntensity = THREE.MathUtils.damp(state.glowIntensity, state.targetGlow, 3.5, delta);
      state.parallax.x = THREE.MathUtils.damp(state.parallax.x, state.targetParallax.x, 3.0, delta);
      state.parallax.y = THREE.MathUtils.damp(state.parallax.y, state.targetParallax.y, 3.0, delta);

      if (state.isActivating) {
        state.activationTime += delta;
      }

      const p = state.progress;
      const actT = Math.min(1.0, state.activationTime / 1.8);

      // Realistic Sun Trajectory Arc
      const sunY = -6.5 + p * 21.5;
      const sunX = Math.sin(p * 0.7 - 0.35) * 7.0;
      sunGroup.position.set(sunX, sunY, -35);

      // Project sun position to 2D screen coordinate for UI overlay alignment
      _sunScreenVec.set(sunX, sunY, -35);
      _sunScreenVec.project(camera);
      const screenX = ((_sunScreenVec.x + 1) * container.clientWidth) / 2;
      const screenY = ((-_sunScreenVec.y + 1) * container.clientHeight) / 2;
      if (onSunScreenPosRef.current && (_sunScreenVec.z < 1)) {
        onSunScreenPosRef.current({ x: screenX, y: screenY, visible: p > 0.15 });
      }

      // Sun Light follows sun position, flares intensely on activation
      sunLight.position.set(sunX, sunY + 2, -28);
      const lightFactor = Math.max(0.1, (sunY + 4) / 14);
      const baseSunLight = (0.4 + p * 2.4 * lightFactor) * state.glowIntensity;
      sunLight.intensity = THREE.MathUtils.lerp(baseSunLight, 6.8, actT);

      // Hover / Activation scale bonus
      const hoverScale = state.isHovered ? 1.08 : 1.0;
      const actScale = THREE.MathUtils.lerp(1.0, 1.85, actT);
      sunMesh.scale.set(hoverScale * actScale, hoverScale * actScale, hoverScale * actScale);

      // Ray group opacity & scale increases as the sun clears the mountains & on activation
      const rayOpacity = Math.min(0.9, Math.max(0.05, p * 0.8) + actT * 0.5) * state.glowIntensity;
      rayMat.opacity = rayOpacity;
      rayGroup.rotation.z = Math.sin(elapsedTime * 0.08) * 0.08 + actT * (elapsedTime * 0.6);

      // Corona & Bloom Pulse + Expansion on Hover & Activation
      const breath = Math.sin(elapsedTime * 1.2) * 0.05 + 1.0;
      const coronaBase = 19 * state.glowIntensity * breath * (state.isHovered ? 1.2 : 1.0);
      const coronaSize = THREE.MathUtils.lerp(coronaBase, 55, actT);
      coronaSprite.scale.set(coronaSize, coronaSize, 1);

      const bloomBase = 48 * state.glowIntensity * breath * Math.max(0.4, p) * (state.isHovered ? 1.25 : 1.0);
      const bloomSize = THREE.MathUtils.lerp(bloomBase, 140, actT);
      bloomSprite.scale.set(bloomSize, bloomSize, 1);
      bloomMat.opacity = Math.min(1.0, (0.3 + p * 0.6 + actT * 0.6) * state.glowIntensity);

      // Golden outline ring flares on hover
      ringMat.opacity = THREE.MathUtils.damp(
        ringMat.opacity,
        state.isHovered && !state.isActivating ? 0.75 : 0.0,
        5.0,
        delta
      );
      ringSprite.scale.set(
        24 + Math.sin(elapsedTime * 3) * 2,
        24 + Math.sin(elapsedTime * 3) * 2,
        1
      );

      // Twinkling stars fade as dawn advances
      starMat.opacity = Math.max(0, 1 - p * 2.2 - actT) * (0.7 + Math.sin(elapsedTime * 2.0) * 0.15);

      // Drift horizon clouds
      cloud1.position.x = -20 + ((elapsedTime * 0.4) % 140) - 20;
      cloud2.position.x = 30 + ((elapsedTime * 0.3) % 140) - 40;

      // Color shifts: Sky background & fog
      const skyR = THREE.MathUtils.lerp(0.045, 0.42, Math.max(p, actT * 0.9));
      const skyG = THREE.MathUtils.lerp(0.07, 0.35, Math.max(p, actT * 0.9));
      const skyB = THREE.MathUtils.lerp(0.14, 0.32, Math.max(p, actT * 0.8));
      scene.background = new THREE.Color(skyR, skyG, skyB);

      const fogR = THREE.MathUtils.lerp(0.11, 0.75, Math.max(p, actT * 0.9));
      const fogG = THREE.MathUtils.lerp(0.17, 0.55, Math.max(p, actT * 0.9));
      const fogB = THREE.MathUtils.lerp(0.28, 0.45, Math.max(p, actT * 0.8));
      (scene.fog as THREE.FogExp2).color.setRGB(fogR, fogG, fogB);

      // Mountains rim light
      const warmDawnColor = new THREE.Color('#4A324E').lerp(new THREE.Color('#945448'), Math.max(p, actT));
      farMtnMat.color.copy(warmDawnColor);

      // Lake reflection
      lakeMat.color.setRGB(
        THREE.MathUtils.lerp(0.05, 0.35, Math.max(p, actT)),
        THREE.MathUtils.lerp(0.08, 0.28, Math.max(p, actT)),
        THREE.MathUtils.lerp(0.15, 0.30, Math.max(p, actT))
      );

      // Particle opacity
      particleMat.opacity = Math.min(0.95, 0.2 + p * 0.7 + actT * 0.3);

      // Camera Movement: Parallax + Cinematic Forward Fly-In on Activation
      const targetCamZ = THREE.MathUtils.lerp(48, 14, actT);
      const targetCamY = THREE.MathUtils.lerp(8 - state.parallax.y * 1.8, sunY * 0.6, actT);
      const targetCamX = THREE.MathUtils.lerp(state.parallax.x * 2.5, sunX * 0.7, actT);

      _camTarget.set(targetCamX, targetCamY, targetCamZ);
      camera.position.lerp(_camTarget, state.isActivating ? 0.08 : 0.04);
      camera.lookAt(sunX * actT, 4 + p * 2.5 + actT * 2.0, -35 * actT);

      // Layer Parallax offsets
      farMtn.position.x = -state.parallax.x * 0.6;
      midMtn.position.x = 4 - state.parallax.x * 1.4;
      nearMtn.position.x = -6 - state.parallax.x * 2.5;

      // Drift & Shockwave on Particles
      const positions = particleGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idxY = i * 3 + 1;
        const idxX = i * 3;

        if (state.isActivating) {
          // Explode outward in wave
          const dx = positions[idxX] - sunX;
          const dy = positions[idxY] - sunY;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          positions[idxX] += (dx / dist) * delta * 24;
          positions[idxY] += (dy / dist) * delta * 24;
        } else {
          positions[idxY] += particleSpeeds[i] * delta * 1.8;
          if (positions[idxY] > 24) {
            positions[idxY] = -2;
          }
        }
      }
      particleGeom.attributes.position.needsUpdate = true;

      // Render Scene
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        clock.start();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', handleCanvasPointerMove);
      container.removeEventListener('pointerdown', handleCanvasPointerDown);
      cancelAnimationFrame(animationFrameId);

      sunGeom.dispose();
      pickingGeom.dispose();
      rayGeom.dispose();
      cloudGeom.dispose();
      starGeom.dispose();
      farMtnGeom.dispose();
      midMtnGeom.dispose();
      nearMtnGeom.dispose();
      lakeGeom.dispose();
      particleGeom.dispose();

      sunMat.dispose();
      pickingMat.dispose();
      coronaMat.dispose();
      coronaTexture.dispose();
      ringMat.dispose();
      ringTexture.dispose();
      bloomMat.dispose();
      bloomTexture.dispose();
      rayMat.dispose();
      rayTex.dispose();
      cloudMat.dispose();
      cloudTexture.dispose();
      starMat.dispose();
      starTex.dispose();
      farMtnMat.dispose();
      midMtnMat.dispose();
      nearMtnMat.dispose();
      lakeMat.dispose();
      particleMat.dispose();
      particleTex.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!webGLSupported) {
    return (
      <SunriseFallback
        progress={progress}
        interactiveParallax={interactiveParallax}
        isSunInteractive={isSunInteractive}
        isActivating={isActivating}
        onSunClick={onSunClick}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 overflow-hidden select-none transition-opacity duration-1000 ${
        isReady ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        cursor: isHoveredLocal && isSunInteractive ? 'pointer' : 'default',
      }}
    />
  );
};
