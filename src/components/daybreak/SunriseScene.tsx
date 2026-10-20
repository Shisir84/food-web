import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SunriseFallback } from './SunriseFallback.tsx';

export type ExperienceState = 'INTRO' | 'SUN_SELECTED' | 'SUNRISE_TRANSITION' | 'AUTHENTICATION' | 'HOME';

interface SunriseSceneProps {
  progress?: number; // 0 (twilight below horizon) to 1 (full daylight)
  interactiveParallax?: { x: number; y: number };
  glowIntensity?: number; // 1 (normal) to 1.35 (hover/focused)
  isSunInteractive?: boolean;
  experienceState?: ExperienceState;
  onSunHover?: (isHovered: boolean) => void;
  onSunClick?: () => void;
  onSunScreenPositionChange?: (pos: { x: number; y: number; visible: boolean }) => void;
  onContextReady?: () => void;
  className?: string;
  backgroundSettings?: {
    blur?: number;
    brightness?: number;
    saturation?: number;
    overlayColor?: string;
    overlayOpacity?: number;
    parallaxIntensity?: number;
    particlesEnabled?: boolean;
    transitionDuration?: number;
  };
}

// Module-scope pre-allocated math helpers for zero GC during 60 FPS animation loop
const _camTarget = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _sunScreenVec = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _mouseVec = new THREE.Vector2();

// Procedural radial glow texture generator (Zero external images)
function createGlowTexture(colorInner: string, colorMid: string, colorOuter = 'rgba(0,0,0,0)'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, colorInner);
    gradient.addColorStop(0.32, colorMid);
    gradient.addColorStop(1, colorOuter);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural horizontal mist gradient texture
function createMistTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, 'rgba(255, 213, 138, 0)');
    gradient.addColorStop(0.4, 'rgba(255, 213, 138, 0.22)');
    gradient.addColorStop(0.65, 'rgba(241, 139, 88, 0.16)');
    gradient.addColorStop(1, 'rgba(101, 87, 119, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural layered cloud texture with soft Gaussian fluff
function createCinematicCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 1024, 256);

    const puffs = [
      { x: 200, y: 130, rx: 160, ry: 45, a: 0.18 },
      { x: 380, y: 120, rx: 220, ry: 55, a: 0.25 },
      { x: 550, y: 135, rx: 190, ry: 50, a: 0.22 },
      { x: 740, y: 125, rx: 230, ry: 48, a: 0.20 },
      { x: 880, y: 140, rx: 140, ry: 40, a: 0.14 },
    ];

    for (const p of puffs) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(p.rx, p.ry));
      grad.addColorStop(0, `rgba(255, 246, 233, ${p.a})`);
      grad.addColorStop(0.4, `rgba(255, 213, 138, ${p.a * 0.7})`);
      grad.addColorStop(0.75, `rgba(241, 139, 88, ${p.a * 0.3})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Multi-octave natural terrain generator for sculpted mountain ridges with realistic contours
function createSculptedMountainGeometry(
  width: number,
  depth: number,
  maxHeight: number,
  baseFrequency: number,
  octaves = 4,
  roughness = 0.5,
  segmentsX = 120,
  segmentsZ = 24
): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ);
  geom.rotateX(-Math.PI / 2);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Natural curve falloff towards flanks
    const normX = (x + width * 0.5) / width;
    const edgeFade = Math.sin(Math.min(1, Math.max(0, normX)) * Math.PI);
    const depthFade = Math.pow(Math.max(0, 1 - Math.abs(z / (depth * 0.5))), 1.2);

    let elevation = 0;
    let freq = baseFrequency;
    let amp = 1.0;
    let ampSum = 0;

    for (let o = 0; o < octaves; o++) {
      // Harmonic noise synthesis with ridged multi-fractal crests
      const n1 = Math.sin(x * freq + z * (freq * 0.3) + 1.25);
      const n2 = Math.cos(x * (freq * 1.6) - z * (freq * 0.7) + 2.4);
      const raw = Math.abs(n1 * 0.7 + n2 * 0.3);
      const ridge = 1.0 - raw;

      elevation += Math.pow(ridge, 1.8) * amp;
      ampSum += amp;
      freq *= 2.15;
      amp *= roughness;
    }

    elevation = (elevation / ampSum) * maxHeight * edgeFade * depthFade;
    pos.setY(i, elevation);
  }

  geom.computeVertexNormals();
  return geom;
}

export const SunriseScene: React.FC<SunriseSceneProps> = ({
  progress = 0.5,
  interactiveParallax = { x: 0, y: 0 },
  glowIntensity = 1.0,
  isSunInteractive = true,
  experienceState = 'INTRO',
  onSunHover,
  onSunClick,
  onSunScreenPositionChange,
  onContextReady,
  className = '',
  backgroundSettings,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [, setIsReady] = useState(false);

  // Mutable animation state container across frame loops without React re-renders
  const stateRef = useRef({
    progress,
    glowIntensity,
    isSunInteractive,
    experienceState,
    stateTimer: 0,
    targetProgress: progress,
    targetGlow: glowIntensity,
    parallax: { x: 0, y: 0 },
    targetParallax: { x: 0, y: 0 },
    isHovered: false,
    sunScreenPos: { x: 0, y: 0, visible: false },
    bgSettings: backgroundSettings,
  });

  // Sync props to refs
  useEffect(() => {
    stateRef.current.targetProgress = progress;
    stateRef.current.targetGlow = glowIntensity;
    stateRef.current.targetParallax = interactiveParallax;
    stateRef.current.isSunInteractive = isSunInteractive;
    stateRef.current.experienceState = experienceState;
    stateRef.current.bgSettings = backgroundSettings;
  }, [progress, glowIntensity, interactiveParallax, isSunInteractive, experienceState, backgroundSettings]);

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

    // -----------------------------------------------------------------
    // THREE.JS SCENE, CAMERA & RENDERER SETUP (Controlled Exposure)
    // -----------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080D1A');
    scene.fog = new THREE.FogExp2('#141D30', 0.012);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1200
    );
    camera.position.set(0, 7.5, 48);

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
    // Calibrated exposure: strictly within 0.95 - 1.05 range to prevent blowout
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // -----------------------------------------------------------------
    // 1. SKY DOME & BACKGROUND GRADIENT MESH
    // -----------------------------------------------------------------
    const skyGeom = new THREE.SphereGeometry(380, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSunProgress: { value: progress },
        uActivation: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uSunProgress;
        uniform float uActivation;
        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition).y;

          // Rich dawn palette: midnight blue -> twilight indigo -> dusty rose -> golden horizon
          vec3 zenithNight = vec3(0.03, 0.05, 0.11);
          vec3 zenithDawn  = vec3(0.09, 0.11, 0.24);
          vec3 midSkyDusk  = vec3(0.18, 0.14, 0.28);
          vec3 midSkyDawn  = vec3(0.48, 0.26, 0.34);
          vec3 horizonDark = vec3(0.12, 0.09, 0.17);
          vec3 horizonGold = vec3(0.92, 0.54, 0.24);
          vec3 horizonPeak = vec3(0.98, 0.82, 0.58);

          float p = clamp(uSunProgress + uActivation * 0.25, 0.0, 1.0);

          vec3 zenith = mix(zenithNight, zenithDawn, p);
          vec3 midSky = mix(midSkyDusk, midSkyDawn, p);
          vec3 horizonWarm = mix(horizonDark, horizonGold, p);

          vec3 col = mix(horizonWarm, midSky, smoothstep(0.0, 0.38, max(0.0, h)));
          col = mix(col, zenith, smoothstep(0.38, 0.88, max(0.0, h)));

          // Radial horizon bloom directly behind rising sun (Controlled, never washed out)
          float sunAlignment = max(0.0, dot(normalize(vWorldPosition), vec3(0.0, 0.15, -1.0)));
          col += horizonPeak * pow(sunAlignment, 8.0) * (0.18 + p * 0.38);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const skyDome = new THREE.Mesh(skyGeom, skyMat);
    scene.add(skyDome);

    // -----------------------------------------------------------------
    // 2. TWINKLING TWILIGHT STARS
    // -----------------------------------------------------------------
    const starCount = 380;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 220;
      starPositions[i * 3 + 1] = 12 + Math.random() * 60;
      starPositions[i * 3 + 2] = -40 - Math.random() * 60;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starTexture = createGlowTexture('rgba(255, 255, 255, 1)', 'rgba(255, 213, 138, 0.35)');
    const starMat = new THREE.PointsMaterial({
      map: starTexture,
      size: 0.75,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: new THREE.Color('#FFF6E9'),
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeom, starMat);
    scene.add(starField);

    // -----------------------------------------------------------------
    // 3. LIGHTING RIG (Balanced & Calibrated for Physically Sensible Highlights)
    // -----------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight('#1E2A42', 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#68567A', '#0D1525', 0.7);
    hemiLight.position.set(0, 60, 0);
    scene.add(hemiLight);

    const sunDirectionalLight = new THREE.DirectionalLight('#FFD58A', 1.0);
    sunDirectionalLight.position.set(0, -5, -35);
    scene.add(sunDirectionalLight);

    // -----------------------------------------------------------------
    // 4. PHYSICALLY DIMENSIONAL SPHERICAL SUN (Preserved Core Definition)
    // -----------------------------------------------------------------
    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, -6.5, -35);
    scene.add(sunGroup);

    // Custom Shader for Sun Sphere (Crisp core, turbulence, limb darkening)
    const sunCoreGeom = new THREE.SphereGeometry(3.8, 64, 48);
    const sunShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGlow: { value: 1.0 },
        uActivation: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uGlow;
        uniform float uActivation;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                     mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.1;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float nDotV = max(0.0, dot(vNormal, viewDir));

          vec2 uvFlow = vUv * 7.0 + vec2(uTime * 0.04, uTime * 0.02);
          float plasma = fbm(uvFlow);

          // Limb darkening: center is luminous ivory, rim transitions to rich molten amber
          vec3 coreWhite = vec3(1.0, 0.97, 0.91);
          vec3 midGold   = vec3(1.0, 0.78, 0.42);
          vec3 edgeCoral = vec3(0.95, 0.44, 0.20);

          vec3 baseColor = mix(midGold, coreWhite, pow(nDotV, 2.0));
          baseColor = mix(edgeCoral, baseColor, smoothstep(0.0, 0.38, nDotV));
          baseColor += coreWhite * (plasma * 0.22) * pow(nDotV, 2.5);

          // Solar edge prominence flare
          float rim = 1.0 - nDotV;
          baseColor += edgeCoral * pow(rim, 3.2) * 1.2;

          // Controlled emissive boost (strictly clamped to avoid blowing out)
          float intensityBoost = clamp(uGlow * 1.05 + uActivation * 0.25, 0.85, 1.4);
          baseColor *= intensityBoost;

          gl_FragColor = vec4(baseColor, 1.0);
        }
      `,
    });
    const sunCoreMesh = new THREE.Mesh(sunCoreGeom, sunShaderMat);
    sunGroup.add(sunCoreMesh);

    // Large invisible picking sphere for effortless cursor/touch interaction
    const pickingGeom = new THREE.SphereGeometry(6.6, 16, 16);
    const pickingMat = new THREE.MeshBasicMaterial({ visible: false });
    const sunPickingMesh = new THREE.Mesh(pickingGeom, pickingMat);
    sunGroup.add(sunPickingMesh);

    // Layer 1: Inner Warm Solar Corona Sprite (Restrained scale & intensity)
    const innerCoronaTex = createGlowTexture('rgba(255, 246, 233, 0.85)', 'rgba(255, 213, 138, 0.5)');
    const innerCoronaMat = new THREE.SpriteMaterial({
      map: innerCoronaTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerCoronaSprite = new THREE.Sprite(innerCoronaMat);
    innerCoronaSprite.scale.set(20, 20, 1);
    sunGroup.add(innerCoronaSprite);

    // Layer 2: Interactive Golden Hover Ring
    const hoverRingTex = createGlowTexture('rgba(255, 255, 255, 0.0)', 'rgba(255, 213, 138, 0.85)');
    const hoverRingMat = new THREE.SpriteMaterial({
      map: hoverRingTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    });
    const hoverRingSprite = new THREE.Sprite(hoverRingMat);
    hoverRingSprite.scale.set(24, 24, 1);
    sunGroup.add(hoverRingSprite);

    // Layer 3: Controlled Atmospheric Dawn Bloom (Clamped max radius)
    const bloomTex = createGlowTexture('rgba(241, 139, 88, 0.45)', 'rgba(101, 87, 119, 0.15)');
    const bloomMat = new THREE.SpriteMaterial({
      map: bloomTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });
    const bloomSprite = new THREE.Sprite(bloomMat);
    bloomSprite.scale.set(48, 48, 1);
    sunGroup.add(bloomSprite);

    // Layer 4: Volumetric Radial Light Shafts Fan
    const rayGroup = new THREE.Group();
    const rayCount = 18;
    const rayGeom = new THREE.PlaneGeometry(2.4, 90);
    rayGeom.translate(0, 45, 0);
    const rayTex = createGlowTexture('rgba(255, 220, 150, 0.28)', 'rgba(241, 139, 88, 0.03)');
    const rayMat = new THREE.MeshBasicMaterial({
      map: rayTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      opacity: 0.18,
    });

    for (let i = 0; i < rayCount; i++) {
      const ray = new THREE.Mesh(rayGeom, rayMat);
      const angle = (i / rayCount) * Math.PI * 1.6 - Math.PI * 0.8;
      ray.rotation.z = angle + (Math.random() * 0.08 - 0.04);
      rayGroup.add(ray);
    }
    sunGroup.add(rayGroup);

    // -----------------------------------------------------------------
    // 5. CINEMATIC LAYERED CLOUDS
    // -----------------------------------------------------------------
    const cloudTexture = createCinematicCloudTexture();
    const cloudGeom = new THREE.PlaneGeometry(160, 24);
    const cloudMat1 = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.38,
    });
    const cloud1 = new THREE.Mesh(cloudGeom, cloudMat1);
    cloud1.position.set(-25, 7.5, -28);
    scene.add(cloud1);

    const cloudMat2 = cloudMat1.clone();
    cloudMat2.opacity = 0.28;
    const cloud2 = new THREE.Mesh(cloudGeom, cloudMat2);
    cloud2.position.set(35, 11, -32);
    cloud2.scale.set(1.3, 1.2, 1);
    scene.add(cloud2);

    // -----------------------------------------------------------------
    // 6. MULTI-LAYER MOUNTAIN RANGES & FOREGROUND
    // -----------------------------------------------------------------
    // Layer 1: Distant Jagged Alpine Range (Dusk Violet & Rose)
    const farPeaksGeom = createSculptedMountainGeometry(160, 36, 15.5, 0.045, 4, 0.48, 120, 16);
    const farPeaksMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#32223E'),
      roughness: 0.85,
      metalness: 0.12,
      flatShading: true,
    });
    const farPeaks = new THREE.Mesh(farPeaksGeom, farPeaksMat);
    farPeaks.position.set(0, -0.5, -26);
    scene.add(farPeaks);

    // Mist plane between far peaks & mid mountains
    const mistTex = createMistTexture();
    const mistGeom1 = new THREE.PlaneGeometry(160, 16);
    const mistMat1 = new THREE.MeshBasicMaterial({
      map: mistTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });
    const mist1 = new THREE.Mesh(mistGeom1, mistMat1);
    mist1.position.set(0, 2.5, -20);
    scene.add(mist1);

    // Layer 2: Mid-Range Contoured Ridges
    const midRidgeGeom = createSculptedMountainGeometry(130, 28, 10.5, 0.065, 4, 0.52, 90, 14);
    const midRidgeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#222030'),
      roughness: 0.82,
      metalness: 0.18,
      flatShading: true,
    });
    const midRidge = new THREE.Mesh(midRidgeGeom, midRidgeMat);
    midRidge.position.set(5, -1.8, -9);
    scene.add(midRidge);

    // Mist plane between mid-ridge & foothills
    const mistGeom2 = new THREE.PlaneGeometry(130, 14);
    const mistMat2 = new THREE.MeshBasicMaterial({
      map: mistTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.28,
    });
    const mist2 = new THREE.Mesh(mistGeom2, mistMat2);
    mist2.position.set(-10, 1.2, -4);
    scene.add(mist2);

    // Layer 3: Near Foothills Framing the Lake
    const nearFoothillsGeom = createSculptedMountainGeometry(100, 22, 6.8, 0.09, 3, 0.45, 70, 10);
    const nearFoothillsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#101726'),
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });
    const nearFoothills = new THREE.Mesh(nearFoothillsGeom, nearFoothillsMat);
    nearFoothills.position.set(-8, -2.8, 8);
    scene.add(nearFoothills);

    // Layer 4: Foreground Shoreline & Natural Rocky Outcrops
    const rockGroup = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0A0E18'),
      roughness: 0.92,
      metalness: 0.08,
      flatShading: true,
    });

    const rock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), rockMat);
    rock1.position.set(-18, -3.2, 22);
    rock1.rotation.set(0.4, 0.6, 0.2);
    rockGroup.add(rock1);

    const rock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.9, 1), rockMat);
    rock2.position.set(-14, -3.8, 24);
    rock2.rotation.set(-0.2, 0.8, 0.5);
    rockGroup.add(rock2);

    const rock3 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), rockMat);
    rock3.position.set(21, -3.4, 21);
    rock3.rotation.set(0.3, -0.4, 0.1);
    rockGroup.add(rock3);

    scene.add(rockGroup);

    // -----------------------------------------------------------------
    // 7. DYNAMIC LAKE WATER PLANE WITH SPECULAR SUN REFLECTIONS
    // -----------------------------------------------------------------
    const lakeGeom = new THREE.PlaneGeometry(160, 60, 48, 24);
    lakeGeom.rotateX(-Math.PI / 2);

    const lakeShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSunX: { value: 0 },
        uSunY: { value: 0 },
        uSunProgress: { value: progress },
        uActivation: { value: 0.0 },
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          // Gentle animated morning lake ripples
          float wave1 = sin(pos.x * 0.18 + uTime * 0.9) * cos(pos.z * 0.14 + uTime * 0.7) * 0.14;
          float wave2 = sin(pos.x * 0.35 - uTime * 1.2) * 0.07;
          pos.y += wave1 + wave2;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uSunX;
        uniform float uSunY;
        uniform float uSunProgress;
        uniform float uActivation;
        varying vec3 vWorldPosition;
        varying vec2 vUv;

        void main() {
          vec3 deepWater = vec3(0.04, 0.06, 0.12);
          vec3 shallowWater = vec3(0.09, 0.12, 0.22);
          vec3 goldGlitter = vec3(1.0, 0.82, 0.52);

          vec3 col = mix(deepWater, shallowWater, vUv.y);

          // Specular sun reflection track on the water surface
          float dx = (vWorldPosition.x - uSunX) * 0.08;
          float glitterTrack = exp(-dx * dx * 1.8);

          float waveFacet = sin(vWorldPosition.x * 0.8 + uTime * 1.6) * cos(vWorldPosition.z * 0.6 - uTime * 1.2);
          float specular = pow(max(0.0, waveFacet * 0.5 + 0.5), 10.0);

          float sunHeightFactor = clamp((uSunY + 4.0) * 0.06, 0.0, 1.0);
          col += goldGlitter * glitterTrack * (0.35 + specular * 0.65) * sunHeightFactor * (0.65 + uActivation * 0.35);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const lakeMesh = new THREE.Mesh(lakeGeom, lakeShaderMat);
    lakeMesh.position.set(0, -4.5, 6);
    scene.add(lakeMesh);

    // -----------------------------------------------------------------
    // 8. FLOATING SUN MOTES & DUST PARTICLES
    // -----------------------------------------------------------------
    const particleCount = 140;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 75;
      particlePositions[i * 3 + 1] = Math.random() * 28 - 2.5;
      particlePositions[i * 3 + 2] = Math.random() * 45 - 12;
      particleSpeeds[i] = 0.25 + Math.random() * 0.55;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleTexture = createGlowTexture('rgba(255, 246, 233, 1)', 'rgba(255, 213, 138, 0.5)');
    const particleMat = new THREE.PointsMaterial({
      map: particleTexture,
      size: 0.65,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: new THREE.Color('#FFD58A'),
      opacity: 0.45,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    renderer.compile(scene, camera);
    setIsReady(true);
    if (onContextReady) onContextReady();

    // -----------------------------------------------------------------
    // 9. INTERACTIVE RAYCASTING (HOVER & CLICK DETECTION ON 3D SUN)
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
        container.style.cursor = isHit && stateRef.current.isSunInteractive ? 'pointer' : 'default';
        if (onSunHoverRef.current) {
          onSunHoverRef.current(isHit);
        }
      }
    };

    const handleCanvasPointerDown = (e: PointerEvent) => {
      if (!stateRef.current.isSunInteractive || stateRef.current.experienceState !== 'INTRO') return;
      const isHit = checkSunIntersection(e.clientX, e.clientY);
      if (isHit && onSunClickRef.current) {
        onSunClickRef.current();
      }
    };

    container.addEventListener('pointermove', handleCanvasPointerMove);
    container.addEventListener('pointerdown', handleCanvasPointerDown);

    // -----------------------------------------------------------------
    // 10. AUTHORITATIVE ANIMATION CONTROLLER LOOP
    // -----------------------------------------------------------------
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      const state = stateRef.current;
      const expState = state.experienceState;

      // Parallax intensity modulation from background settings if provided
      const parallaxFactor = state.bgSettings?.parallaxIntensity ?? 1.0;

      // Exponential damping
      state.progress = THREE.MathUtils.damp(state.progress, state.targetProgress, 2.8, delta);
      state.glowIntensity = THREE.MathUtils.damp(state.glowIntensity, state.targetGlow, 3.5, delta);
      state.parallax.x = THREE.MathUtils.damp(state.parallax.x, state.targetParallax.x * parallaxFactor, 2.8, delta);
      state.parallax.y = THREE.MathUtils.damp(state.parallax.y, state.targetParallax.y * parallaxFactor, 2.8, delta);

      // Track transition timer
      if (expState === 'SUN_SELECTED' || expState === 'SUNRISE_TRANSITION') {
        state.stateTimer += delta;
      } else if (expState === 'INTRO') {
        state.stateTimer = 0;
      }

      // Safe normalized activation value (0 to 1) for shaders
      const isActivating = expState === 'SUN_SELECTED' || expState === 'SUNRISE_TRANSITION' || expState === 'AUTHENTICATION';
      const actT = expState === 'AUTHENTICATION' ? 1.0 : Math.min(1.0, state.stateTimer / 1.6);

      const p = state.progress;

      // Sun Elevation Curve: (-6.5 -> 14.5)
      const sunY = -6.5 + p * 21.0;
      const sunX = Math.sin(p * 0.65 - 0.3) * 6.5;
      sunGroup.position.set(sunX, sunY, -35);

      // Update Sun Shader Uniforms
      sunShaderMat.uniforms.uTime.value = elapsedTime;
      sunShaderMat.uniforms.uGlow.value = state.glowIntensity;
      sunShaderMat.uniforms.uActivation.value = actT;

      // Update Sky Dome Uniforms
      skyMat.uniforms.uSunProgress.value = p;
      skyMat.uniforms.uActivation.value = actT;

      // Update Lake Shader Uniforms
      lakeShaderMat.uniforms.uTime.value = elapsedTime;
      lakeShaderMat.uniforms.uSunX.value = sunX;
      lakeShaderMat.uniforms.uSunY.value = sunY;
      lakeShaderMat.uniforms.uSunProgress.value = p;
      lakeShaderMat.uniforms.uActivation.value = actT;

      // Project sun coordinate to 2D screen space for accurate UI positioning
      _sunScreenVec.set(sunX, sunY, -35);
      _sunScreenVec.project(camera);
      const screenX = ((_sunScreenVec.x + 1) * container.clientWidth) * 0.5;
      const screenY = ((-_sunScreenVec.y + 1) * container.clientHeight) * 0.5;
      if (onSunScreenPosRef.current && _sunScreenVec.z < 1) {
        onSunScreenPosRef.current({ x: screenX, y: screenY, visible: p > 0.12 });
      }

      // Directional Sunlight Intensity & Color Modulation (Safe, restrained max 2.2)
      sunDirectionalLight.position.set(sunX, sunY + 3, -28);
      const baseSunLight = 0.6 + p * 1.4;
      sunDirectionalLight.intensity = THREE.MathUtils.lerp(baseSunLight, 2.2, actT);

      // Mountain Warmth Transitions
      const dawnWarmth = new THREE.Color('#32223E').lerp(new THREE.Color('#683842'), Math.max(p, actT * 0.8));
      farPeaksMat.color.copy(dawnWarmth);

      const midWarmth = new THREE.Color('#222030').lerp(new THREE.Color('#3C2836'), Math.max(p, actT * 0.8));
      midRidgeMat.color.copy(midWarmth);

      // Fog Color Shifts
      const fogR = THREE.MathUtils.lerp(0.08, 0.28, Math.max(p, actT * 0.7));
      const fogG = THREE.MathUtils.lerp(0.11, 0.22, Math.max(p, actT * 0.7));
      const fogB = THREE.MathUtils.lerp(0.19, 0.24, Math.max(p, actT * 0.7));
      (scene.fog as THREE.FogExp2).color.setRGB(fogR, fogG, fogB);

      // Sun Scale Response (Controlled)
      const hoverScale = state.isHovered && expState === 'INTRO' ? 1.08 : 1.0;
      const actScale = THREE.MathUtils.lerp(1.0, 1.25, actT);
      sunCoreMesh.scale.set(hoverScale * actScale, hoverScale * actScale, hoverScale * actScale);

      // Corona Sprites
      const breath = Math.sin(elapsedTime * 1.4) * 0.04 + 1.0;
      const coronaSize = THREE.MathUtils.lerp(20 * state.glowIntensity * breath, 30, actT);
      innerCoronaSprite.scale.set(coronaSize, coronaSize, 1);

      // Bloom Sprite (Restrained scale to avoid obscuring landscape)
      const bloomSize = THREE.MathUtils.lerp(48 * state.glowIntensity * breath, 72, actT);
      bloomSprite.scale.set(bloomSize, bloomSize, 1);
      bloomMat.opacity = Math.min(0.48, (0.28 + p * 0.18 + actT * 0.12) * state.glowIntensity);

      // Hover Ring Animation
      hoverRingMat.opacity = THREE.MathUtils.damp(
        hoverRingMat.opacity,
        state.isHovered && expState === 'INTRO' ? 0.75 : 0.0,
        5.0,
        delta
      );
      hoverRingSprite.scale.set(
        24 + Math.sin(elapsedTime * 3.5) * 1.8,
        24 + Math.sin(elapsedTime * 3.5) * 1.8,
        1
      );

      // Volumetric Light Ray Sway
      rayMat.opacity = Math.min(0.42, 0.14 + p * 0.18 + actT * 0.1) * state.glowIntensity;
      rayGroup.rotation.z = Math.sin(elapsedTime * 0.05) * 0.05 + actT * 0.2;

      // Twinkling stars naturally fade into the golden morning
      starMat.opacity = Math.max(0, 1.0 - p * 2.0 - actT * 1.2) * (0.75 + Math.sin(elapsedTime * 2.2) * 0.15);

      // Drift Horizon Clouds
      cloud1.position.x = -25 + ((elapsedTime * 0.45) % 160) - 25;
      cloud2.position.x = 35 + ((elapsedTime * 0.35) % 160) - 45;

      // Drift Mist Layers
      mist1.position.x = Math.sin(elapsedTime * 0.08) * 8.0;
      mist2.position.x = -Math.cos(elapsedTime * 0.06) * 6.0;

      // Camera Orchestration across States:
      // INTRO: wide establishing shot (Z: 48, Y: 7.5)
      // SUN_SELECTED: subtle camera push (Z: 42, Y: 7.2)
      // SUNRISE_TRANSITION / AUTHENTICATION: balanced perspective framing card & sun (Z: 44, Y: 8.2)
      let targetCamZ = 48;
      let targetCamY = 7.5 - state.parallax.y * 1.4;
      let targetCamX = state.parallax.x * 2.2;
      let targetLookY = 4.0 + p * 2.6;

      if (expState === 'SUN_SELECTED') {
        targetCamZ = 42;
        targetCamY = 7.2;
        targetCamX = state.parallax.x * 1.5;
        targetLookY = 5.5;
      } else if (expState === 'SUNRISE_TRANSITION' || expState === 'AUTHENTICATION') {
        targetCamZ = 44;
        targetCamY = 8.2;
        targetCamX = state.parallax.x * 1.2;
        targetLookY = 6.2;
      }

      _camTarget.set(targetCamX, targetCamY, targetCamZ);
      camera.position.lerp(_camTarget, isActivating ? 0.05 : 0.035);

      _camLookAt.set(sunX * 0.3, targetLookY, -20);
      camera.lookAt(_camLookAt);

      // Parallax layer shifts
      farPeaks.position.x = -state.parallax.x * 0.5;
      midRidge.position.x = 5 - state.parallax.x * 1.2;
      nearFoothills.position.x = -8 - state.parallax.x * 2.0;
      rockGroup.position.x = -state.parallax.x * 2.8;

      // Particle Drift
      const positions = particleGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idxY = i * 3 + 1;
        positions[idxY] += particleSpeeds[i] * delta * 1.4;
        if (positions[idxY] > 26) {
          positions[idxY] = -2.5;
        }
      }
      particleGeom.attributes.position.needsUpdate = true;

      // Particle visibility toggle from background settings
      particleSystem.visible = state.bgSettings?.particlesEnabled !== false;

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
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  if (!webGLSupported) {
    return (
      <SunriseFallback
        progress={progress}
        interactiveParallax={interactiveParallax}
        isSunInteractive={isSunInteractive}
        isActivating={experienceState !== 'INTRO'}
        onSunClick={onSunClick}
      />
    );
  }

  // Background Studio styling filter properties
  const filterStyle: React.CSSProperties = {
    filter: backgroundSettings
      ? `blur(${backgroundSettings.blur || 0}px) brightness(${backgroundSettings.brightness || 1}) saturate(${backgroundSettings.saturation || 1})`
      : undefined,
    transition: `filter ${backgroundSettings?.transitionDuration || 0.8}s ease`,
  };

  return (
    <div
      ref={mountRef}
      style={filterStyle}
      className={`absolute inset-0 w-full h-full pointer-events-auto overflow-hidden z-0 ${className}`}
    />
  );
};
