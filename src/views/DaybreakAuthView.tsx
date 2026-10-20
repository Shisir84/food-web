import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SunriseScene, ExperienceState } from '../components/daybreak/SunriseScene.tsx';
import { DaybreakAuthCard } from '../components/daybreak/DaybreakAuthCard.tsx';
import { DaybreakLogo } from '../components/daybreak/DaybreakLogo.tsx';
import { api } from '../services/api.ts';
import {
  Sun,
  Sunrise,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Compass,
} from 'lucide-react';

interface DaybreakAuthViewProps {
  portal?: 'customer' | 'rider' | 'restaurant' | 'admin';
  mode?: 'login' | 'register';
  onNavigate: (path: string) => void;
}

export const DaybreakAuthView: React.FC<DaybreakAuthViewProps> = ({
  portal = 'customer',
  mode = 'login',
  onNavigate,
}) => {
  const [currentPortal, setCurrentPortal] = useState<'customer' | 'rider' | 'restaurant' | 'admin'>(portal);

  // Check if reduced-motion is requested
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Authoritative State Machine: INTRO -> SUN_SELECTED -> SUNRISE_TRANSITION -> AUTHENTICATION
  const [experienceState, setExperienceState] = useState<ExperienceState>(
    prefersReducedMotion ? 'AUTHENTICATION' : 'INTRO'
  );

  // Sun Interaction State
  const [isSunHovered, setIsSunHovered] = useState(false);
  const [sunScreenPos, setSunScreenPos] = useState({ x: 0, y: 0, visible: false });
  const [ripplePoint, setRipplePoint] = useState<{ x: number; y: number } | null>(null);

  // Sunrise Trajectory Progression: 0.12 (twilight) -> 0.65 (resting golden dawn)
  const [sunriseProgress, setSunriseProgress] = useState(prefersReducedMotion ? 0.65 : 0.12);
  const [glowIntensity, setGlowIntensity] = useState(1.0);

  // Parallax pointer state
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Background Studio settings fetched from server
  const [bgSettings, setBgSettings] = useState<any>(null);

  // Transition guard to prevent duplicate or conflicting triggers
  const isTransitioningRef = useRef(false);
  const transitionTimeoutsRef = useRef<number[]>([]);

  // Synchronize incoming portal prop
  useEffect(() => {
    setCurrentPortal(portal);
  }, [portal]);

  // Load Background Studio configuration for the sunrise screen
  useEffect(() => {
    let mounted = true;
    api.getBackgroundScene('sunrise')
      .then((config) => {
        if (mounted && config) {
          setBgSettings(config);
        }
      })
      .catch((err) => console.log('Using default sunrise background settings:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // Initial Sun Ascent to resting dawn position (0.12 -> 0.62 over ~1.6s)
  useEffect(() => {
    if (prefersReducedMotion) {
      setSunriseProgress(0.65);
      return;
    }

    const start = performance.now();
    let rafId: number;

    const animateAscent = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (elapsed < 1.6) {
        const t = elapsed / 1.6;
        const ease = 1 - Math.pow(1 - t, 3);
        setSunriseProgress(0.12 + (0.62 - 0.12) * ease);
        rafId = requestAnimationFrame(animateAscent);
      } else {
        setSunriseProgress(0.62);
      }
    };

    rafId = requestAnimationFrame(animateAscent);
    return () => cancelAnimationFrame(rafId);
  }, [prefersReducedMotion]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      transitionTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // AUTHORITATIVE SUN ACTIVATION SEQUENCE
  // INTRO -> SUN_SELECTED -> SUNRISE_TRANSITION -> AUTHENTICATION
  const activateSun = useCallback((point?: { x: number; y: number }) => {
    if (isTransitioningRef.current || experienceState !== 'INTRO') return;
    isTransitioningRef.current = true;

    // Set origin for the soft golden ripple
    if (point) {
      setRipplePoint(point);
    } else if (sunScreenPos.visible) {
      setRipplePoint({ x: sunScreenPos.x, y: sunScreenPos.y });
    } else {
      setRipplePoint({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 });
    }

    // Step 1: SUN_SELECTED (Immediate response: CTA begins fade out, sun pulses gently)
    setExperienceState('SUN_SELECTED');
    setGlowIntensity(1.25);
    setSunriseProgress(0.72);

    // Step 2: SUNRISE_TRANSITION (at 600ms: CTA is fully gone, camera arrives at balanced framing)
    const t1 = window.setTimeout(() => {
      setExperienceState('SUNRISE_TRANSITION');
      setGlowIntensity(1.15);
      setSunriseProgress(0.78);
    }, 600);

    // Step 3: AUTHENTICATION (at 1350ms: Card emerges with crystal clear contrast, sun stays in background)
    const t2 = window.setTimeout(() => {
      setExperienceState('AUTHENTICATION');
      setGlowIntensity(1.0);
      setRipplePoint(null);
      isTransitioningRef.current = false;
    }, 1350);

    transitionTimeoutsRef.current.push(t1, t2);
  }, [experienceState, sunScreenPos]);

  // Return gracefully from login to the sunrise screen
  const handleReturnToSunrise = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setExperienceState('INTRO');
    setGlowIntensity(1.0);
    setSunriseProgress(0.62);
    setRipplePoint(null);
    window.setTimeout(() => {
      isTransitioningRef.current = false;
    }, 500);
  }, []);

  // Keyboard navigation: Enter or Space to activate sun when on INTRO, Escape to return
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (experienceState === 'INTRO') {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
          e.preventDefault();
          activateSun();
        }
      } else if (experienceState === 'AUTHENTICATION') {
        if (e.key === 'Escape') {
          handleReturnToSunrise();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [experienceState, activateSun, handleReturnToSunrise]);

  // Pointer parallax handler
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const { clientX, clientY } = e;
    const nx = (clientX / window.innerWidth) * 2 - 1;
    const ny = (clientY / window.innerHeight) * 2 - 1;
    setParallax({ x: nx, y: ny });
  }, [prefersReducedMotion]);

  // Overlay opacity and color from background studio
  const overlayBg = bgSettings?.overlayColor || '#080D1A';
  const overlayAlpha = bgSettings?.overlayOpacity ?? 0.45;

  return (
    <div
      onPointerMove={handlePointerMove}
      className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between text-white select-none bg-[#080D1A]"
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. CINEMATIC 3D SUNRISE BACKGROUND SCENE                      */}
      {/* ------------------------------------------------------------- */}
      <SunriseScene
        progress={sunriseProgress}
        interactiveParallax={parallax}
        glowIntensity={glowIntensity}
        isSunInteractive={experienceState === 'INTRO'}
        experienceState={experienceState}
        backgroundSettings={bgSettings}
        onSunHover={(hovered) => {
          if (experienceState === 'INTRO') {
            setIsSunHovered(hovered);
            setGlowIntensity(hovered ? 1.25 : 1.0);
          }
        }}
        onSunClick={() => {
          if (experienceState === 'INTRO') {
            activateSun();
          }
        }}
        onSunScreenPositionChange={(pos) => setSunScreenPos(pos)}
      />

      {/* Atmospheric Vignette Overlay - Enhances contrast without washing out the sun */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 z-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(8, 13, 26, 0.4) 80%, ${overlayBg} 100%)`,
          opacity: experienceState === 'AUTHENTICATION' ? Math.max(0.7, overlayAlpha) : Math.min(0.5, overlayAlpha),
        }}
      />

      {/* Soft Golden Ripple Originating from Sun Click (No whiteout flash!) */}
      {ripplePoint && (experienceState === 'SUN_SELECTED' || experienceState === 'SUNRISE_TRANSITION') && (
        <div
          className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FFD58A]/50 animate-ping opacity-60"
          style={{
            left: `${ripplePoint.x}px`,
            top: `${ripplePoint.y}px`,
            width: '240px',
            height: '240px',
            animationDuration: '1.2s',
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP EDITORIAL NAVIGATION BAR                               */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 transition-opacity hover:opacity-85 focus:outline-none"
        >
          <DaybreakLogo size={34} showText={true} />
        </button>

        {/* Portal switch pills & controls */}
        {experienceState === 'AUTHENTICATION' ? (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-[#141E33]/80 border border-[#263653]/90 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setCurrentPortal('customer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentPortal === 'customer'
                    ? 'bg-[#F18B58] text-black shadow-sm font-bold'
                    : 'text-[#B8B8C0] hover:text-white'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setCurrentPortal('rider')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentPortal === 'rider'
                    ? 'bg-[#F18B58] text-black shadow-sm font-bold'
                    : 'text-[#B8B8C0] hover:text-white'
                }`}
              >
                Courier
              </button>
              <button
                type="button"
                onClick={() => setCurrentPortal('restaurant')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentPortal === 'restaurant'
                    ? 'bg-[#F18B58] text-black shadow-sm font-bold'
                    : 'text-[#B8B8C0] hover:text-white'
                }`}
              >
                Kitchen
              </button>
              <button
                type="button"
                onClick={() => setCurrentPortal('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentPortal === 'admin'
                    ? 'bg-rose-500 text-white shadow-sm font-bold'
                    : 'text-[#B8B8C0] hover:text-rose-400'
                }`}
              >
                Admin
              </button>
            </div>

            <button
              type="button"
              onClick={handleReturnToSunrise}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#FFD58A] bg-[#141E33]/80 hover:bg-[#1A2744] border border-[#263653] transition-colors shadow-sm backdrop-blur-md"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#F18B58]" />
              <span className="hidden sm:inline">Return to Sunrise</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#FFD58A] hover:text-white bg-[#141E33]/60 hover:bg-[#1A2744] border border-[#263653] transition-colors backdrop-blur-md flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-[#F18B58]" />
              <span>Explore 3D Home</span>
            </button>
            <button
              type="button"
              onClick={() => activateSun()}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-white bg-[#141E33]/60 hover:bg-[#1A2744] border border-[#263653] transition-colors backdrop-blur-md"
              title="Direct sign in"
            >
              <span>Sign In</span>
            </button>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. SCREEN ONE: INTRO & CALL-TO-ACTION (NO OVERLAPS)          */}
      {/* ------------------------------------------------------------- */}
      {experienceState !== 'AUTHENTICATION' && (
        <main
          className={`relative z-20 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-between text-center py-6 my-auto transition-all duration-500 ${
            experienceState === 'SUN_SELECTED' || experienceState === 'SUNRISE_TRANSITION'
              ? 'opacity-0 scale-95 pointer-events-none translate-y-4'
              : 'opacity-100 scale-100 pointer-events-auto'
          }`}
        >
          <div className="h-6" />

          {/* Center: Interactive Sun Touch Target */}
          <div className="relative my-auto flex flex-col items-center">
            <div
              onClick={(e) => activateSun({ x: e.clientX, y: e.clientY })}
              onMouseEnter={() => {
                setIsSunHovered(true);
                setGlowIntensity(1.25);
              }}
              onMouseLeave={() => {
                setIsSunHovered(false);
                setGlowIntensity(1.0);
              }}
              role="button"
              tabIndex={0}
              aria-label="Touch the sun to begin"
              className={`relative cursor-pointer group rounded-full transition-transform duration-500 focus:outline-none ${
                isSunHovered ? 'scale-110' : 'scale-100'
              }`}
              style={{
                width: '180px',
                height: '180px',
              }}
            >
              {/* Soft Golden Breathing Rings */}
              <div
                className="absolute -inset-3 rounded-full border border-[#FFD58A]/30 animate-ping opacity-25 pointer-events-none"
                style={{ animationDuration: '3.2s' }}
              />
              <div
                className="absolute -inset-6 rounded-full border border-[#F18B58]/20 animate-pulse pointer-events-none"
                style={{ animationDuration: '4.0s' }}
              />

              {/* Glowing Radial Target Center */}
              <div
                className="w-full h-full rounded-full transition-all duration-300 flex items-center justify-center"
                style={{
                  background: isSunHovered
                    ? 'radial-gradient(circle, rgba(255, 246, 233, 0.2) 0%, rgba(255, 213, 138, 0.1) 50%, transparent 75%)'
                    : 'radial-gradient(circle, rgba(255, 246, 233, 0.05) 0%, transparent 70%)',
                }}
              >
                <div
                  className={`px-3 py-1 rounded-full bg-[#111A2E]/90 border border-[#F18B58] text-[11px] font-bold text-[#FFD58A] shadow-xl backdrop-blur-md transition-all duration-300 ${
                    isSunHovered ? 'opacity-100 scale-105 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#F18B58]" />
                    <span>Enter</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction Tag & Editorial Header */}
            <div className="mt-8 space-y-3.5 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18233C]/80 border border-[#F18B58]/40 text-[11px] font-bold text-[#FFD58A] shadow-lg backdrop-blur-md">
                <Sunrise className="w-3.5 h-3.5 text-[#F18B58]" />
                <span className="tracking-widest uppercase">Touch the sun to begin</span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                EVERY NEW DAY <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #FFF6E9 0%, #FFD58A 50%, #F18B58 100%)',
                  }}
                >
                  STARTS HERE.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-[#B8B8C0] leading-relaxed">
                A living 3D dawn, curated artisan kitchens, and seamless express dispatch.
              </p>

              {/* Click / Tap Prompt Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => activateSun({ x: e.clientX, y: e.clientY })}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-black shadow-lg transition-all hover:scale-105 active:scale-95 group"
                  style={{
                    background: 'linear-gradient(135deg, #F18B58 0%, #FFD58A 100%)',
                  }}
                >
                  <Sun className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
                  <span>Activate Sunrise</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-stone-400">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[#1C2A48] border border-[#2E3F66] text-[#FFD58A] font-mono text-[10px]">Enter</kbd> or click the sun</span>
          </div>
        </main>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SCREEN TWO: EMERGENCE OF DAYBREAK AUTHENTICATION CARD      */}
      {/* ------------------------------------------------------------- */}
      {experienceState === 'AUTHENTICATION' && (
        <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-10 py-6 my-auto animate-in fade-in duration-700">
          {/* Left Column: Hero Text & Cinematic Daybreak Branding */}
          <div className="w-full lg:max-w-xl text-left space-y-5 lg:pr-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18233C]/80 border border-[#F18B58]/35 text-[11px] font-bold text-[#FFD58A] shadow-lg backdrop-blur-md">
              <Sunrise className="w-3.5 h-3.5 text-[#F18B58]" />
              <span className="tracking-wide uppercase">Golden Dawn · Active Session</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.08]">
              AWAKEN <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #FFF6E9 0%, #FFD58A 50%, #F18B58 100%)',
                }}
              >
                YOUR CRAVING.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#B8B8C0] leading-relaxed max-w-lg">
              Welcome to Nova Hunger Daybreak. Freshly crafted artisan meals, real-time telemetry, and certified kitchens.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#141E33]/90 hover:bg-[#1E2E4E] border border-[#F18B58]/40 text-xs font-bold text-[#FFD58A] shadow-md transition-all hover:scale-105"
              >
                <Compass className="w-4 h-4 text-[#F18B58]" />
                <span>Explore 3D Homepage</span>
              </button>
              <button
                type="button"
                onClick={handleReturnToSunrise}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-stone-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                <span>Return to Sunrise View</span>
              </button>
            </div>
          </div>

          {/* Right Column: Daybreak Auth Card with High-Contrast Glassmorphism */}
          <div className="w-full lg:max-w-md animate-in slide-in-from-bottom-6 duration-700">
            <DaybreakAuthCard
              portal={currentPortal}
              initialMode={mode === 'register' ? 'signup' : 'signin'}
              onNavigate={onNavigate}
              onPortalChange={(newPortal) => setCurrentPortal(newPortal)}
            />
          </div>
        </main>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. BOTTOM EDITORIAL FOOTER                                    */}
      {/* ------------------------------------------------------------- */}
      <footer className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#8E8E98] border-t border-white/[0.06]">
        <div>
          <span>© {new Date().getFullYear()} Nova Hunger Food · Daybreak Edition</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors">
            Homepage
          </button>
          <button onClick={() => onNavigate('/restaurants')} className="hover:text-white transition-colors">
            Kitchens
          </button>
          <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors">
            Support Desk
          </button>
        </div>
      </footer>
    </div>
  );
};
