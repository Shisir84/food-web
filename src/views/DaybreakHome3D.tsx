import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { api } from '../services/api.ts';
import { FoodItem, RestaurantProfile } from '../types/index.ts';
import { DaybreakLogo } from '../components/daybreak/DaybreakLogo.tsx';
import {
  Sun,
  Sunrise,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  User,
  Bike,
  Store,
  Shield,
  LogOut,
  MapPin,
  Star,
  Clock,
  Flame,
  CheckCircle2,
  ChevronRight,
  Plus,
  Compass,
  Layers,
  Award,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';

interface DaybreakHome3DProps {
  onNavigate: (path: string) => void;
}

export const DaybreakHome3D: React.FC<DaybreakHome3DProps> = ({ onNavigate }) => {
  const { user, riderProfile, restaurantProfile, logout } = useAuth();
  const { items, addItem } = useCart();
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const [restaurants, setRestaurants] = useState<RestaurantProfile[]>([]);
  const [popularFood, setPopularFood] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Parallax pointer state
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  // 3D Canvas ref for Hero
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch real restaurant and menu data
  useEffect(() => {
    async function loadData() {
      try {
        const [rests, foods, cats] = await Promise.all([
          api.getRestaurants(),
          api.getPopularFood(),
          api.getCategories(),
        ]);
        setRestaurants(rests);
        setPopularFood(foods);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load menu data:', err);
      }
    }
    loadData();
  }, []);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3D Three.js Hero Scene
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
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#1C273C', 0.015);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 45);

    // Lighting
    const ambientLight = new THREE.AmbientLight('#263653', 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#FFD58A', 2.2);
    sunLight.position.set(0, 12, -20);
    scene.add(sunLight);

    // Floating Golden Sun
    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, 7.5, -30);
    scene.add(sunGroup);

    const sunGeom = new THREE.SphereGeometry(4.2, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF6E9') });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunGroup.add(sunMesh);

    // Corona Sprite
    const coronaCanvas = document.createElement('canvas');
    coronaCanvas.width = 256;
    coronaCanvas.height = 256;
    const ctx = coronaCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(255, 246, 233, 0.98)');
      grad.addColorStop(0.35, 'rgba(255, 213, 138, 0.65)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const coronaTexture = new THREE.CanvasTexture(coronaCanvas);
    coronaTexture.colorSpace = THREE.SRGBColorSpace;
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const corona = new THREE.Sprite(coronaMat);
    corona.scale.set(28, 28, 1);
    sunGroup.add(corona);

    // Bloom Sprite
    const bloomMat = new THREE.SpriteMaterial({
      map: coronaTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.55,
      color: new THREE.Color('#F18B58'),
    });
    const bloom = new THREE.Sprite(bloomMat);
    bloom.scale.set(65, 65, 1);
    sunGroup.add(bloom);

    // Mountains
    const createRidge = (w: number, d: number, h: number, color: string, z: number, y: number) => {
      const geom = new THREE.PlaneGeometry(w, d, 48, 6);
      geom.rotateX(-Math.PI / 2);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const edge = Math.sin((((x + w / 2) / w) * Math.PI));
        const elevation = Math.sin(x * 0.08 + 1.2) * 0.5 + 0.5;
        pos.setY(i, elevation * h * edge);
      }
      geom.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(0, y, z);
      scene.add(mesh);
      return mesh;
    };

    const farMtn = createRidge(130, 28, 11, '#3B2F4A', -25, -2);
    const midMtn = createRidge(100, 20, 8, '#262D44', -10, -3.5);
    const nearMtn = createRidge(80, 16, 5, '#121A2C', 5, -5);

    // Floating particles
    const pCount = 120;
    const pGeom = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 55;
      pPos[i * 3 + 1] = Math.random() * 20 - 2;
      pPos[i * 3 + 2] = Math.random() * 30 - 10;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      map: coronaTexture,
      size: 0.5,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: new THREE.Color('#FFD58A'),
      opacity: 0.6,
    });
    const particles = new THREE.Points(pGeom, pMat);
    scene.add(particles);

    let animId: number;
    let clock = new THREE.Clock();

    const render = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Slow bob of the sun
      sunGroup.position.y = 7.5 + Math.sin(time * 0.8) * 0.4;
      sunGroup.position.x = Math.sin(time * 0.3) * 0.5;

      // Pulse corona
      const pulse = 1.0 + Math.sin(time * 1.5) * 0.06;
      corona.scale.set(28 * pulse, 28 * pulse, 1);

      // Parallax
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 2.0, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 5 - pointer.y * 1.5, 0.05);
      camera.lookAt(0, 5, 0);

      farMtn.position.x = -pointer.x * 0.8;
      midMtn.position.x = -pointer.x * 1.4;
      nearMtn.position.x = -pointer.x * 2.0;

      // Particle float
      const positions = pGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < pCount; i++) {
        const idx = i * 3 + 1;
        positions[idx] += delta * 0.7;
        if (positions[idx] > 20) positions[idx] = -2;
      }
      pGeom.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      sunGeom.dispose();
      sunMat.dispose();
      coronaMat.dispose();
      coronaTexture.dispose();
      bloomMat.dispose();
      pGeom.dispose();
      pMat.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [pointer]);

  // Pointer move for parallax
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    setPointer({ x: nx, y: ny });
  };

  // Add food to cart toast helper
  const handleAddToCart = (item: FoodItem) => {
    addItem(item, 1);
    setToastMessage(`Added "${item.name}" to cart!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered food items based on category pill
  const filteredFood = useMemo(() => {
    if (activeCategory === 'all') return popularFood;
    return popularFood.filter((f) => f.category === activeCategory);
  }, [popularFood, activeCategory]);

  return (
    <div
      onPointerMove={handlePointerMove}
      className="min-h-screen w-full bg-[#0D1424] text-white selection:bg-[#F18B58] selection:text-black"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* ------------------------------------------------------------- */}
      {/* FLOATING GLASS NAVIGATION BAR                                 */}
      {/* ------------------------------------------------------------- */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#141E33]/85 border border-[#263653]/80 backdrop-blur-xl shadow-xl">
          {/* Brand */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 focus:outline-none hover:opacity-90 transition-opacity"
          >
            <DaybreakLogo size={32} showText={true} />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-[#B8B8C0]">
            <a
              href="#the-first-light"
              className="px-3 py-1.5 rounded-xl hover:text-white hover:bg-[#1C2A48] transition-colors"
            >
              The First Light
            </a>
            <a
              href="#discover"
              className="px-3 py-1.5 rounded-xl hover:text-white hover:bg-[#1C2A48] transition-colors"
            >
              Discover
            </a>
            <a
              href="#the-horizon"
              className="px-3 py-1.5 rounded-xl hover:text-white hover:bg-[#1C2A48] transition-colors"
            >
              The Horizon
            </a>
            <a
              href="#your-space"
              className="px-3 py-1.5 rounded-xl hover:text-white hover:bg-[#1C2A48] transition-colors"
            >
              Your Space
            </a>
            <button
              onClick={() => onNavigate('/restaurants')}
              className="px-3 py-1.5 rounded-xl text-[#FFD58A] hover:text-white hover:bg-[#1C2A48] transition-colors"
            >
              Restaurants
            </button>
          </nav>

          {/* Actions: Cart + Profile Badge / Sign Out */}
          <div className="flex items-center gap-2.5">
            {/* Cart Button */}
            <button
              onClick={() => onNavigate('/cart')}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2A48] border border-[#2E3F66] text-white hover:border-[#F18B58] transition-all text-xs font-semibold"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#F18B58]" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartItems > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#F18B58] text-black text-[10px] font-bold flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Authenticated User Status or Sign Out */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (user.role === 'admin') onNavigate('/admin/dashboard');
                    else if (user.role === 'rider') onNavigate('/rider/dashboard');
                    else if (user.role === 'restaurant') onNavigate('/restaurant/dashboard');
                    else onNavigate('/customer/dashboard');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2A48] border border-[#2E3F66] text-xs font-semibold text-[#FFD58A] hover:border-[#FFD58A] transition-all"
                >
                  <div className="w-4 h-4 rounded-full bg-[#F18B58]/20 text-[#F18B58] flex items-center justify-center text-[10px] font-bold uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[90px] truncate">{user.name}</span>
                </button>
                <button
                  onClick={() => logout()}
                  title="Sign out"
                  className="p-1.5 rounded-xl bg-[#1C2A48] border border-[#2E3F66] text-stone-400 hover:text-rose-400 hover:border-rose-400/50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('/daybreak')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#F18B58] to-[#FFD58A] hover:scale-105 active:scale-95 transition-all"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-xl bg-[#1C2A48] border border-[#2E3F66] text-stone-300"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 p-4 rounded-2xl bg-[#141E33] border border-[#263653] shadow-2xl flex flex-col gap-2 text-xs font-semibold text-[#B8B8C0]">
            <a
              href="#the-first-light"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-[#1C2A48] hover:text-white"
            >
              The First Light
            </a>
            <a
              href="#discover"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-[#1C2A48] hover:text-white"
            >
              Discover Features
            </a>
            <a
              href="#the-horizon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-[#1C2A48] hover:text-white"
            >
              The Horizon Menus
            </a>
            <a
              href="#your-space"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-[#1C2A48] hover:text-white"
            >
              Your Space
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/restaurants');
              }}
              className="text-left py-2 px-3 rounded-lg text-[#FFD58A] hover:bg-[#1C2A48]"
            >
              Browse Restaurants
            </button>
          </div>
        )}
      </header>

      {/* Floating Add to Cart Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-emerald-500/90 text-black text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1 — THE FIRST LIGHT (CINEMATIC 3D HERO)               */}
      {/* ------------------------------------------------------------- */}
      <section
        id="the-first-light"
        className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 overflow-hidden"
      >
        {/* 3D Canvas Background */}
        <div
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none select-none z-0"
        />

        {/* Radial Depth Gradient */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(13, 20, 36, 0.5) 75%, #0D1424 100%)',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18233C]/80 border border-[#F18B58]/40 text-xs font-bold text-[#FFD58A] shadow-xl backdrop-blur-md animate-pulse">
            <Sunrise className="w-4 h-4 text-[#F18B58]" />
            <span className="tracking-widest uppercase">The First Light · Nova Hunger Food</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05]">
            Welcome to a <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #FFF6E9 0%, #FFD58A 45%, #F18B58 100%)',
              }}
            >
              New Day.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#B8B8C0] max-w-xl mx-auto leading-relaxed">
            Explore new possibilities in a world designed around you. Artisanal dining, verified couriers, and live order radar unite under a radiant dawn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#discover"
              className="px-6 py-3 rounded-full text-xs font-bold text-black shadow-lg shadow-[#F18B58]/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F18B58 0%, #FFD58A 100%)',
              }}
            >
              <span>Explore the experience</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => onNavigate('/restaurants')}
              className="px-6 py-3 rounded-full text-xs font-semibold text-white bg-[#141E33]/80 hover:bg-[#1A2744] border border-[#263653] hover:border-[#FFD58A]/50 transition-colors backdrop-blur-md"
            >
              Discover more
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2 — DISCOVER (3D FLOATING FEATURE CARDS)              */}
      {/* ------------------------------------------------------------- */}
      <section id="discover" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18233C]/60 border border-[#2B3B5E] text-[11px] font-bold text-[#FFD58A]">
            <Compass className="w-3.5 h-3.5 text-[#F18B58]" />
            <span className="uppercase tracking-wider">Four Pillars of Daybreak</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white">
            Architecture for modern dining.
          </h2>
          <p className="text-xs sm:text-sm text-[#B8B8C0]">
            Every layer engineered with 3D precision, cryptographic safety, and verified speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Artisan Menus */}
          <div
            className="group relative p-6 rounded-3xl bg-[#141E33]/70 border border-[#263653] backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#F18B58]/60 hover:shadow-2xl hover:shadow-[#F18B58]/10 flex flex-col justify-between"
            style={{ perspective: '800px' }}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F18B58]/15 border border-[#F18B58]/30 text-[#FFD58A] flex items-center justify-center shadow-inner">
                <Store className="w-6 h-6 text-[#F18B58]" />
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-[#FFD58A] transition-colors">
                Artisan Menus & Kitchens
              </h3>
              <p className="text-xs text-[#B8B8C0] leading-relaxed">
                Hand-curated local kitchens with wood-fired ovens, clay handi biryanis, and verified hygiene certifications.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/restaurants')}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#F18B58] group-hover:text-[#FFD58A] transition-colors"
            >
              <span>Explore Menus</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 2: Live Courier Radar */}
          <div
            className="group relative p-6 rounded-3xl bg-[#141E33]/70 border border-[#263653] backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#F18B58]/60 hover:shadow-2xl hover:shadow-[#F18B58]/10 flex flex-col justify-between"
            style={{ perspective: '800px' }}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD58A]/15 border border-[#FFD58A]/30 text-[#FFD58A] flex items-center justify-center shadow-inner">
                <Bike className="w-6 h-6 text-[#FFD58A]" />
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-[#FFD58A] transition-colors">
                Live Courier Radar
              </h3>
              <p className="text-xs text-[#B8B8C0] leading-relaxed">
                GPS telemetry tracks your thermal-sealed order in real time from pan to doorstep with sub-second ETA updates.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/customer/orders')}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#FFD58A] group-hover:text-white transition-colors"
            >
              <span>Track Orders</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 3: Cryptographic Security */}
          <div
            className="group relative p-6 rounded-3xl bg-[#141E33]/70 border border-[#263653] backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#F18B58]/60 hover:shadow-2xl hover:shadow-[#F18B58]/10 flex flex-col justify-between"
            style={{ perspective: '800px' }}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                OWASP Security Core
              </h3>
              <p className="text-xs text-[#B8B8C0] leading-relaxed">
                Strict RBAC enforcement, session token sanitization, and cryptographic dispatch codes for safe handoffs.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/privacy')}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors"
            >
              <span>Security Specs</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 4: Kitchen Operations */}
          <div
            className="group relative p-6 rounded-3xl bg-[#141E33]/70 border border-[#263653] backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#F18B58]/60 hover:shadow-2xl hover:shadow-[#F18B58]/10 flex flex-col justify-between"
            style={{ perspective: '800px' }}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-inner">
                <Layers className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                Kitchen Fleet Portal
              </h3>
              <p className="text-xs text-[#B8B8C0] leading-relaxed">
                Direct chef console to toggle menu availability, preview preparation timers, and manage high-volume orders.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/restaurant/login')}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 group-hover:text-rose-300 transition-colors"
            >
              <span>Partner Console</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3 — THE HORIZON (PANORAMIC CULINARY SHOWCASE)         */}
      {/* ------------------------------------------------------------- */}
      <section id="the-horizon" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18233C]/80 border border-[#F18B58]/40 text-[11px] font-bold text-[#FFD58A]">
              <Flame className="w-3.5 h-3.5 text-[#F18B58]" />
              <span className="uppercase tracking-wider">The Horizon Selection</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white">
              Curated signature dishes.
            </h2>
            <p className="text-xs sm:text-sm text-[#B8B8C0]">
              From slow-simmered Awadhi gravies to Neapolitan wood-fired crusts, prepared fresh upon order.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-[#F18B58] text-black shadow-md'
                  : 'bg-[#141E33] text-[#B8B8C0] hover:text-white border border-[#263653]'
              }`}
            >
              All Signatures
            </button>
            {categories.map((c) => (
              <button
                key={c.id || c.name}
                type="button"
                onClick={() => setActiveCategory(c.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  activeCategory === c.name
                    ? 'bg-[#F18B58] text-black shadow-md'
                    : 'bg-[#141E33] text-[#B8B8C0] hover:text-white border border-[#263653]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredFood.slice(0, 8).map((food) => (
            <div
              key={food.id}
              className="rounded-3xl bg-[#141E33]/80 border border-[#263653] overflow-hidden flex flex-col justify-between hover:border-[#F18B58]/50 transition-all duration-300 hover:-translate-y-1 shadow-lg"
            >
              <div className="relative h-44 w-full overflow-hidden bg-[#1C2A48]">
                <img
                  src={food.imageUrl}
                  alt={food.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-[#FFD58A] border border-white/10 flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#FFD58A] fill-[#FFD58A]" />
                  <span>{food.rating || 4.9}</span>
                </div>
                {food.isVeg && (
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-emerald-500/90 text-black text-[10px] font-bold">
                    Veg
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="font-display text-sm font-bold text-white line-clamp-1">
                    {food.name}
                  </h4>
                  <p className="text-[11px] text-[#B8B8C0] line-clamp-2 leading-relaxed">
                    {food.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#263653]/60">
                  <span className="font-display font-extrabold text-base text-[#FFD58A]">
                    ${food.price.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(food)}
                    className="p-2 rounded-xl bg-gradient-to-r from-[#F18B58] to-[#FFD58A] text-black hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#F18B58]/20"
                    title="Add to cart"
                  >
                    <Plus className="w-4 h-4 font-black" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4 — YOUR SPACE (PERSONALIZED USER CONSOLE)            */}
      {/* ------------------------------------------------------------- */}
      <section id="your-space" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-3xl p-8 sm:p-12 border border-[#263653] shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(20, 30, 51, 0.9) 0%, rgba(13, 20, 36, 0.98) 100%)',
          }}
        >
          {/* Ambient Corner Glow */}
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(241, 139, 88, 0.25) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* User Identity Column */}
            <div className="flex items-center gap-5 w-full lg:w-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#F18B58] to-[#FFD58A] p-1 shrink-0 shadow-lg shadow-[#F18B58]/20">
                <div className="w-full h-full rounded-[22px] bg-[#0D1424] flex items-center justify-center text-2xl font-black text-[#FFD58A]">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#1C2A48] border border-[#2E3F66] text-[10px] font-bold uppercase tracking-wider text-[#FFD58A]">
                  {user?.role === 'admin' ? (
                    <span className="text-rose-400">Platform Admin</span>
                  ) : user?.role === 'rider' ? (
                    <span className="text-amber-400">Courier Fleet</span>
                  ) : user?.role === 'restaurant' ? (
                    <span className="text-orange-400">Kitchen Partner</span>
                  ) : (
                    <span>Customer Member</span>
                  )}
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                  {user?.name || 'Guest Traveler'}
                </h3>
                <p className="text-xs text-[#B8B8C0]">
                  {user?.email || 'Sign in to access your saved addresses & preferences'}
                </p>
              </div>
            </div>

            {/* Role Actions Column */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      if (user.role === 'admin') onNavigate('/admin/dashboard');
                      else if (user.role === 'rider') onNavigate('/rider/dashboard');
                      else if (user.role === 'restaurant') onNavigate('/restaurant/dashboard');
                      else onNavigate('/customer/dashboard');
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-black shadow-md transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #F18B58 0%, #FFD58A 100%)',
                    }}
                  >
                    Open Dedicated Dashboard
                  </button>

                  <button
                    onClick={() => onNavigate('/customer/orders')}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#1C2A48] hover:bg-[#23355C] border border-[#2E3F66] transition-colors"
                  >
                    Order History
                  </button>

                  <button
                    onClick={() => logout()}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigate('/daybreak')}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-black shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #F18B58 0%, #FFD58A 100%)',
                  }}
                >
                  Sign In to Your Space
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5 — THE NEXT CHAPTER (CTA & POLISHED FOOTER)          */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-[#263653]/80 bg-[#0B101D] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* CTA Banner */}
          <div
            className="p-8 sm:p-10 rounded-3xl border border-[#F18B58]/30 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{
              background: 'linear-gradient(135deg, #141E33 0%, #1A2744 100%)',
            }}
          >
            <div className="space-y-2 text-left">
              <h3 className="font-display text-2xl font-black text-white">
                Begin your next culinary adventure.
              </h3>
              <p className="text-xs text-[#B8B8C0]">
                Freshly cooked meals, live order tracking, and seamless delivery dispatched in minutes.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/restaurants')}
              className="px-6 py-3 rounded-full text-xs font-bold text-black shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0"
              style={{
                background: 'linear-gradient(135deg, #F18B58 0%, #FFD58A 100%)',
              }}
            >
              Order Online Now
            </button>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left text-xs">
            <div className="space-y-3">
              <DaybreakLogo size={28} showText={true} />
              <p className="text-[11px] text-[#B8B8C0] leading-relaxed">
                The premier 3D animated food dining experience with secure authentication.
              </p>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-white text-[11px] uppercase tracking-wider">
                Discovery
              </h5>
              <ul className="space-y-1.5 text-[#B8B8C0]">
                <li><a href="#the-horizon" className="hover:text-white transition-colors">Popular Foods</a></li>
                <li><button onClick={() => onNavigate('/restaurants')} className="hover:text-white transition-colors">Restaurants</button></li>
                <li><button onClick={() => onNavigate('/offers')} className="hover:text-white transition-colors">Special Offers</button></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-white text-[11px] uppercase tracking-wider">
                Partner Consoles
              </h5>
              <ul className="space-y-1.5 text-[#B8B8C0]">
                <li><button onClick={() => onNavigate('/rider/login')} className="hover:text-white transition-colors">Courier Fleet</button></li>
                <li><button onClick={() => onNavigate('/restaurant/login')} className="hover:text-white transition-colors">Kitchen Partner</button></li>
                <li><button onClick={() => onNavigate('/admin/login')} className="hover:text-rose-400 transition-colors">Platform Admin</button></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-white text-[11px] uppercase tracking-wider">
                Company & Trust
              </h5>
              <ul className="space-y-1.5 text-[#B8B8C0]">
                <li><button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors">Contact Support</button></li>
                <li><button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors">Privacy & Terms</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#1C2A48] flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-3">
            <span>© 2026 DAYBREAK & Nova Hunger Food. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors">Privacy</button>
              <span>·</span>
              <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors">Terms</button>
              <span>·</span>
              <button onClick={() => onNavigate('/faq')} className="hover:text-white transition-colors">FAQ</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
