import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { api } from '../services/api.ts';
import { FoodItem } from '../types/index.ts';
import { DaybreakLogo } from '../components/daybreak/DaybreakLogo.tsx';
import {
  ShoppingBag,
  ArrowRight,
  Clock,
  Plus,
  CheckCircle2,
  Menu,
  X,
  Search,
  ChevronRight,
} from 'lucide-react';

interface DaybreakHome3DProps {
  onNavigate: (path: string) => void;
}

// Procedural multi-octave mountain geometry generator for clean alpine silhouettes
function createSculptedMountainGeometry(
  width: number,
  depth: number,
  maxHeight: number,
  baseFrequency: number,
  octaves = 3,
  roughness = 0.45,
  segmentsX = 80,
  segmentsZ = 16
): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ);
  geom.rotateX(-Math.PI / 2);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    const normX = (x + width * 0.5) / width;
    const edgeFade = Math.sin(Math.min(1, Math.max(0, normX)) * Math.PI);
    const depthFade = Math.pow(Math.max(0, 1 - Math.abs(z / (depth * 0.5))), 1.2);

    let elevation = 0;
    let freq = baseFrequency;
    let amp = 1.0;
    let ampSum = 0;

    for (let o = 0; o < octaves; o++) {
      const n1 = Math.sin(x * freq + z * (freq * 0.3) + 1.2);
      const n2 = Math.cos(x * (freq * 1.5) - z * (freq * 0.7) + 2.1);
      const ridge = 1.0 - Math.abs(n1 * 0.7 + n2 * 0.3);

      elevation += Math.pow(ridge, 1.7) * amp;
      ampSum += amp;
      freq *= 2.1;
      amp *= roughness;
    }

    elevation = (elevation / ampSum) * maxHeight * edgeFade * depthFade;
    pos.setY(i, elevation);
  }

  geom.computeVertexNormals();
  return geom;
}

// Procedural radial glow texture generator
function createGlowTexture(colorInner: string, colorMid: string, colorOuter = 'rgba(0,0,0,0)'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, colorInner);
    gradient.addColorStop(0.35, colorMid);
    gradient.addColorStop(1, colorOuter);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const DaybreakHome3D: React.FC<DaybreakHome3DProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { items, addItem } = useCart();
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const [popularFood, setPopularFood] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pointer state for single subtle parallax
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  // 3D Canvas ref for Hero
  const canvasRef = useRef<HTMLDivElement>(null);
  const [bgSettings, setBgSettings] = useState<any>(null);

  // Fetch real catalog data and background settings
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [foods, cats, bg] = await Promise.all([
          api.getPopularFood(),
          api.getCategories(),
          api.getBackgroundScene('homepage').catch(() => null),
        ]);
        if (!active) return;
        if (Array.isArray(foods)) setPopularFood(foods);
        if (Array.isArray(cats)) setCategories(cats);
        if (bg) setBgSettings(bg);
      } catch (err) {
        console.error('Failed to load menu data:', err);
      }
    }
    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Essential 3D Three.js Sunrise & Landscape (Clean & Calm)
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#0D1525', 0.012);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );
    camera.position.set(0, 5, 42);

    // Soft Controlled Lighting
    const ambientLight = new THREE.AmbientLight('#202D45', 1.0);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#564868', '#0A101C', 0.7);
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const sunDirectionalLight = new THREE.DirectionalLight('#FFD58A', 1.6);
    sunDirectionalLight.position.set(0, 12, -25);
    scene.add(sunDirectionalLight);

    // 1. Dimensional Sun Group
    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, 7.5, -30);
    scene.add(sunGroup);

    // Sun Core
    const sunCoreGeom = new THREE.SphereGeometry(3.8, 36, 24);
    const sunShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float nDotV = max(0.0, dot(vNormal, viewDir));

          vec3 coreWhite = vec3(1.0, 0.98, 0.94);
          vec3 midGold   = vec3(1.0, 0.82, 0.48);
          vec3 edgeCoral = vec3(0.95, 0.45, 0.22);

          vec3 col = mix(midGold, coreWhite, pow(nDotV, 1.8));
          col = mix(edgeCoral, col, smoothstep(0.0, 0.35, nDotV));

          float pulse = sin(uTime * 1.2) * 0.03 + 1.0;
          col *= pulse * 1.05;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const sunMesh = new THREE.Mesh(sunCoreGeom, sunShaderMat);
    sunGroup.add(sunMesh);

    // Controlled Corona Sprite
    const coronaTex = createGlowTexture('rgba(255, 246, 233, 0.85)', 'rgba(255, 213, 138, 0.5)');
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const corona = new THREE.Sprite(coronaMat);
    corona.scale.set(24, 24, 1);
    sunGroup.add(corona);

    // 2. Sculpted Mountains (Two Clean Depth Layers)
    // Layer 1: Distant Alpine Peaks
    const farPeaksGeom = createSculptedMountainGeometry(140, 28, 12, 0.045, 3, 0.45, 70, 14);
    const farPeaksMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2C1E36'),
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    const farPeaks = new THREE.Mesh(farPeaksGeom, farPeaksMat);
    farPeaks.position.set(0, -0.5, -22);
    scene.add(farPeaks);

    // Layer 2: Mid-Range Ridge
    const midRidgeGeom = createSculptedMountainGeometry(110, 20, 7.5, 0.065, 3, 0.5, 60, 12);
    const midRidgeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1B1A28'),
      roughness: 0.82,
      metalness: 0.15,
      flatShading: true,
    });
    const midRidge = new THREE.Mesh(midRidgeGeom, midRidgeMat);
    midRidge.position.set(4, -1.8, -10);
    scene.add(midRidge);

    // Subtle Drifting Clouds
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 512;
    cloudCanvas.height = 128;
    const cCtx = cloudCanvas.getContext('2d');
    if (cCtx) {
      const grad = cCtx.createRadialGradient(256, 64, 10, 256, 64, 200);
      grad.addColorStop(0, 'rgba(255, 220, 180, 0.22)');
      grad.addColorStop(0.5, 'rgba(241, 139, 88, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      cCtx.fillStyle = grad;
      cCtx.fillRect(0, 0, 512, 128);
    }
    const cloudTex = new THREE.CanvasTexture(cloudCanvas);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });
    const cloudMesh = new THREE.Mesh(new THREE.PlaneGeometry(90, 20), cloudMat);
    cloudMesh.position.set(-15, 6.5, -18);
    scene.add(cloudMesh);

    // Single Calm Animation Loop with Subtle Parallax
    let animId: number;
    const clock = new THREE.Clock();

    const render = () => {
      const elapsed = clock.getElapsedTime();

      // Sun time update
      sunShaderMat.uniforms.uTime.value = elapsed;

      // Gentle cloud drift
      cloudMesh.position.x = -15 + Math.sin(elapsed * 0.08) * 8.0;

      // Subtle camera parallax (restrained, no shaking)
      const targetCamX = pointer.x * 1.5;
      const targetCamY = 5 - pointer.y * 1.0;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.04);
      camera.lookAt(0, 4, -15);

      // Subtle mountain depth shift
      farPeaks.position.x = -pointer.x * 0.4;
      midRidge.position.x = 4 - pointer.x * 0.9;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sunCoreGeom.dispose();
      sunShaderMat.dispose();
      farPeaksGeom.dispose();
      farPeaksMat.dispose();
      midRidgeGeom.dispose();
      midRidgeMat.dispose();
      coronaTex.dispose();
      cloudTex.dispose();
    };
  }, [pointer.x, pointer.y]);

  // Pointer movement handler for subtle parallax
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    setPointer({ x: nx, y: ny });
  };

  const handleAddToCart = (food: FoodItem) => {
    addItem(food);
    setToastMessage(`Added "${food.name}" to cart`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredFood = useMemo(() => {
    if (activeCategory === 'all') return popularFood;
    return popularFood.filter((f) => f.category?.toLowerCase() === activeCategory.toLowerCase());
  }, [popularFood, activeCategory]);

  return (
    <div
      onPointerMove={handlePointerMove}
      className="min-h-screen bg-[#080D1A] text-white overflow-x-hidden selection:bg-[#F18B58]/30 selection:text-white"
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. CLEAN NAVIGATION BAR                                       */}
      {/* ------------------------------------------------------------- */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#080D1A]/75 border-b border-[#263653]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity focus:outline-none"
          >
            <DaybreakLogo size={34} showText={true} />
          </button>

          {/* Minimal Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-300">
            <a href="#menu" className="hover:text-white transition-colors">
              Menu
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <button onClick={() => onNavigate('/restaurants')} className="hover:text-white transition-colors">
              Kitchens
            </button>
          </nav>

          {/* Right Actions: Cart & Profile / Sign In */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/cart')}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141E33] border border-[#263653] text-xs font-bold text-white hover:border-[#F18B58] transition-colors"
              title="Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#F18B58]" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartItems > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#F18B58] text-black text-[10px] font-black">
                  {totalCartItems}
                </span>
              )}
            </button>

            {user ? (
              <button
                onClick={() => {
                  if (user.role === 'admin') onNavigate('/admin/dashboard');
                  else if (user.role === 'rider') onNavigate('/rider/dashboard');
                  else if (user.role === 'restaurant') onNavigate('/restaurant/dashboard');
                  else onNavigate('/customer/dashboard');
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141E33] border border-[#2E3F66] text-xs font-bold text-[#FFD58A] hover:border-[#FFD58A] transition-colors"
              >
                <div className="w-4 h-4 rounded-full bg-[#F18B58]/20 text-[#F18B58] flex items-center justify-center text-[10px] font-black uppercase">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/daybreak')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F18B58] to-[#FFD58A] text-black text-xs font-bold hover:opacity-95 transition-opacity"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-[#141E33] border border-[#263653] text-stone-300"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-4 py-3 bg-[#0C1322] border-b border-[#263653] flex flex-col gap-2 text-xs font-semibold text-stone-300">
            <a href="#menu" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 hover:text-white">
              Menu
            </a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 hover:text-white">
              How It Works
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/restaurants');
              }}
              className="py-2 px-3 text-left hover:text-white"
            >
              Kitchens
            </button>
          </div>
        )}
      </header>

      {/* Floating Cart Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-500 text-black text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. REFINED MINIMAL HERO SECTION                               */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Essential 3D Canvas Background */}
        <div
          ref={canvasRef}
          style={{
            filter: bgSettings
              ? `blur(${bgSettings.blur || 0}px) brightness(${bgSettings.brightness || 1}) saturate(${bgSettings.saturation || 1})`
              : undefined,
          }}
          className="absolute inset-0 pointer-events-none select-none z-0"
        />

        {/* Soft Depth Gradient */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 45%, rgba(8, 13, 26, 0.5) 85%, #080D1A 100%)',
          }}
        />

        {/* Hero Editorial Content (Focused, Uncluttered) */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6 my-auto">
          <h1 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Your next craving <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #FFF6E9 0%, #FFD58A 50%, #F18B58 100%)',
              }}
            >
              starts here.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-stone-300 max-w-md mx-auto leading-relaxed">
            Discover great food. Enjoy every moment.
          </p>

          {/* Primary & Secondary Hero Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#menu"
              className="px-6 py-3 rounded-full text-xs font-bold text-black shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F18B58 0%, #FFD58A 100%)',
              }}
            >
              <span>Explore Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => onNavigate('/customer/orders')}
              className="px-5 py-3 rounded-full text-xs font-semibold text-white bg-[#141E33]/80 hover:bg-[#1A2744] border border-[#263653] transition-colors"
            >
              Track Order
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. EXPLORE MENU SECTION (CLEAN & FUNCTIONAL)                  */}
      {/* ------------------------------------------------------------- */}
      <section id="menu" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1 text-left">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Explore the Menu
            </h2>
            <p className="text-xs text-stone-400">
              Freshly prepared dishes from verified local kitchens.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-[#F18B58] text-black font-bold'
                  : 'bg-[#141E33] text-stone-400 hover:text-white border border-[#263653]'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id || c.name}
                type="button"
                onClick={() => setActiveCategory(c.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeCategory === c.name
                    ? 'bg-[#F18B58] text-black font-bold'
                    : 'bg-[#141E33] text-stone-400 hover:text-white border border-[#263653]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredFood.slice(0, 8).map((food) => (
            <div
              key={food.id}
              className="rounded-2xl bg-[#121A2B] border border-[#24334C] overflow-hidden flex flex-col justify-between hover:border-[#F18B58]/60 transition-colors shadow-md"
            >
              <div className="relative h-44 w-full bg-[#182338]">
                <img
                  src={food.imageUrl}
                  alt={food.name}
                  className="w-full h-full object-cover"
                />
                {food.isVeg && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-bold">
                    Veg
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-left">
                <div className="space-y-1">
                  <h3 className="font-display text-sm font-bold text-white line-clamp-1">
                    {food.name}
                  </h3>
                  <p className="text-[11px] text-stone-400 line-clamp-2">
                    {food.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#24334C]">
                  <span className="font-display font-bold text-sm text-[#FFD58A] font-mono">
                    ${food.price.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(food)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F18B58] to-[#FFD58A] text-black font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. HOW IT WORKS (CLEAN 3-STEP PIPELINE)                       */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-1">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            How It Works
          </h2>
          <p className="text-xs text-stone-400">
            A seamless ordering journey from kitchen to doorstep.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#24334C] space-y-2">
            <span className="font-display text-xs font-bold text-[#F18B58] block">Step 01</span>
            <h3 className="font-display text-base font-bold text-white">Choose Your Meal</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Browse artisan dishes and customize options to your liking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#24334C] space-y-2">
            <span className="font-display text-xs font-bold text-[#FFD58A] block">Step 02</span>
            <h3 className="font-display text-base font-bold text-white">Freshly Prepared</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Chefs craft your order fresh with quality ingredients.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#24334C] space-y-2">
            <span className="font-display text-xs font-bold text-emerald-400 block">Step 03</span>
            <h3 className="font-display text-base font-bold text-white">Fast Delivery</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Thermal-sealed dispatch brings your order directly to your door.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. MINIMAL REFINED FOOTER                                     */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-[#263653]/60 bg-[#060A14] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-400">
          <div className="flex items-center gap-3">
            <DaybreakLogo size={28} showText={true} />
            <span className="text-[11px] text-stone-500">· Premium dining experience</span>
          </div>

          <div className="flex items-center gap-5 text-[11px]">
            <button onClick={() => onNavigate('/restaurants')} className="hover:text-white transition-colors">
              Restaurants
            </button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors">
              Support
            </button>
            <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors">
              Privacy
            </button>
            <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors">
              Terms
            </button>
          </div>

          <span className="text-[11px] text-stone-500">
            © {new Date().getFullYear()} Nova Hunger Food
          </span>
        </div>
      </footer>
    </div>
  );
};
