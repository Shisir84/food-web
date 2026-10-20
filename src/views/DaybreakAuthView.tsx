import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SunriseScene } from '../components/daybreak/SunriseScene.tsx';
import { DaybreakAuthCard } from '../components/daybreak/DaybreakAuthCard.tsx';
import { DaybreakLogo } from '../components/daybreak/DaybreakLogo.tsx';
import {
  Sun,
  Sunrise,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface DaybreakAuthViewProps {
  portal?: 'customer' | 'rider' | 'restaurant' | 'admin';
  mode?: 'login' | 'register';
  onNavigate: (path: string) => void;
}

// Experience State Machine: INTRO -> SUN_SELECTED -> LIGHT_TRANSITION -> AUTHENTICATION
export type ExperienceState = 'INTRO' | 'SUN_SELECTED' | 'LIGHT_TRANSITION' | 'AUTHENTICATION';

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

  // State Machine
  const [experienceState, setExperienceState] = useState<ExperienceState>(
    prefersReducedMotion ? 'AUTHENTICATION' : 'INTRO'
  );

  // Sun Interaction State
  const [isSunHovered, setIsSunHovered] = useState(false);
  const [sunScreenPos, setSunScreenPos] = useState({ x: 0, y: 0, visible: false });
  const [ripplePoint, setRipplePoint] = useState<{ x: number; y: number } | null>(null);

  // Sunrise Trajectory Progression: 0.0 (twilight) -> 0.62 (resting golden dawn)
  const [sunriseProgress, setSunriseProgress] = useState(prefersReducedMotion ? 0.65 : 0.08);
  const [glowIntensity, setGlowIntensity] = useState(1.0);

  // Parallax pointer state
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Scene customization dock
  const [isDockOpen, setIsDockOpen] = useState(false);

  // Transition guard to prevent repeated clicks from corrupting state
  const isTransitioningRef = useRef(false);
  const transitionTimeoutsRef = useRef<number[]>([]);

  // Synchronize incoming portal prop
  useEffect(() => {
    setCurrentPortal(portal);
  }, [portal]);

  // Initial Sun Ascent to resting dawn position (0.08 -> 0.62 over ~1.6s)
  useEffect(() => {
    if (prefersReducedMotion) {
      setSunriseProgress(0.65);
      return;
    }

    let start = performance.now();
    let rafId: number;

    const animateAscent = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (elapsed < 1.6) {
        const t = elapsed / 1.6;
        // Cubic ease-out
        const ease = 1 - Math.pow(1 - t, 3);
        setSunriseProgress(0.08 + (0.62 - 0.08) * ease);
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

  // SIGNATURE SUN ACTIVATION ANIMATION
  // INTRO -> SUN_SELECTED -> LIGHT_TRANSITION -> AUTHENTICATION
  const activateSun = useCallback((point?: { x: number; y: number }) => {
    if (isTransitioningRef.current || experienceState !== 'INTRO') return;
    isTransitioningRef.current = true;

    // Set ripple position
    if (point) {
      setRipplePoint(point);
    } else if (sunScreenPos.visible) {
      setRipplePoint({ x: sunScreenPos.x, y: sunScreenPos.y });
    } else {
      setRipplePoint({ x: window.innerWidth / 2, y: window.innerHeight * 0.42 });
    }

    // Step 1: SUN_SELECTED
    setExperienceState('SUN_SELECTED');
    setGlowIntensity(1.6);

    // Step 2: LIGHT_TRANSITION (at 750ms)
    const t1 = window.setTimeout(() => {
      setExperienceState('LIGHT_TRANSITION');
      setGlowIntensity(2.2);
    }, 750);

    // Step 3: AUTHENTICATION (at 1800ms) - Card smoothly emerges from golden light
    const t2 = window.setTimeout(() => {
      setExperienceState('AUTHENTICATION');
      setGlowIntensity(1.0);
      isTransitioningRef.current = false;
    }, 1800);

    transitionTimeoutsRef.current.push(t1, t2);
  }, [experienceState, sunScreenPos]);

  // Return gracefully from login to the sunrise screen
  const handleReturnToSunrise = useCallback(() => {
    if (isTransitioningRef.current) return;
    setExperienceState('INTRO');
    setGlowIntensity(1.0);
    setRipplePoint(null);
  }, []);

  // Keyboard navigation: Enter or Space to activate sun when on INTRO
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

  const isActivating3D = experienceState === 'SUN_SELECTED' || experienceState === 'LIGHT_TRANSITION';

  return (
    <div
      onPointerMove={handlePointerMove}
      className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between text-white select-none bg-[#0D1424]"
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
        isActivating={isActivating3D}
        onSunHover={(hovered) => {
          if (experienceState === 'INTRO') {
            setIsSunHovered(hovered);
            setGlowIntensity(hovered ? 1.35 : 1.0);
          }
        }}
        onSunClick={() => {
          if (experienceState === 'INTRO') {
            activateSun();
          }
        }}
        onSunScreenPositionChange={(pos) => setSunScreenPos(pos)}
      />

      {/* Atmospheric Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(13, 20, 36, 0.45) 85%, rgba(13, 20, 36, 0.88) 100%)',
          opacity: experienceState === 'AUTHENTICATION' ? 0.95 : 0.65,
        }}
      />

      {/* Golden Flash / Radial Shockwave Overlay during Sun Activation */}
      {isActivating3D && (
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-700 animate-in fade-in"
          style={{
            background: 'radial-gradient(circle at 50% 45%, rgba(255, 246, 233, 0.85) 0%, rgba(255, 213, 138, 0.6) 40%, rgba(241, 139, 88, 0.35) 75%, transparent 100%)',
          }}
        />
      )}

      {/* Ripple Animation Originating from Sun Click */}
      {ripplePoint && isActivating3D && (
        <div
          className="absolute pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#FFF6E9] animate-ping opacity-75"
          style={{
            left: `${ripplePoint.x}px`,
            top: `${ripplePoint.y}px`,
            width: '260px',
            height: '260px',
            animationDuration: '1.4s',
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP MINIMAL NAVIGATION BAR                                 */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 transition-opacity hover:opacity-85 focus:outline-none"
        >
          <DaybreakLogo size={34} showText={true} />
        </button>

        {/* Portal switch pills visible during login or accessible header */}
        {experienceState === 'AUTHENTICATION' ? (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-[#141E33]/70 border border-[#263653]/80 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setCurrentPortal('customer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentPortal === 'customer'
                    ? 'bg-[#F18B58] text-black shadow-sm'
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
                    ? 'bg-[#F18B58] text-black shadow-sm'
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
                    ? 'bg-[#F18B58] text-black shadow-sm'
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
                    ? 'bg-rose-500 text-white shadow-sm'
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
          /* Accessible "Enter website" control on Screen One */
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => activateSun()}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-white bg-[#141E33]/60 hover:bg-[#1A2744] border border-[#263653] transition-colors backdrop-blur-md"
              title="Accessible direct bypass for screen readers and touch devices"
            >
              <span>Enter website</span>
              <span className="hidden sm:inline text-stone-400 text-[10px] ml-1.5">[Skip 3D]</span>
            </button>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. SCREEN ONE: INTERACTIVE 3D SUN & CALL-TO-ACTION            */}
      {/* ------------------------------------------------------------- */}
      {experienceState !== 'AUTHENTICATION' && (
        <main className="relative z-20 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-between text-center py-6 my-auto">
          {/* Top subtle spacer */}
          <div className="h-6" />

          {/* Center: Sun Touch Target / Ripple Overlay */}
          <div className="relative my-auto flex flex-col items-center">
            {/* Pulsing Interactive Target Ring over Sun */}
            <div
              onClick={(e) => activateSun({ x: e.clientX, y: e.clientY })}
              onMouseEnter={() => {
                setIsSunHovered(true);
                setGlowIntensity(1.35);
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
              {/* Outer Golden Ripple Aura */}
              <div
                className="absolute -inset-4 rounded-full border border-[#FFD58A]/40 animate-ping opacity-30 pointer-events-none"
                style={{ animationDuration: '2.8s' }}
              />
              <div
                className="absolute -inset-8 rounded-full border border-[#F18B58]/20 animate-pulse pointer-events-none"
                style={{ animationDuration: '3.6s' }}
              />

              {/* Glowing Radial Target Center (Transparent to reveal 3D Sun beneath) */}
              <div
                className="w-full h-full rounded-full transition-all duration-300 flex items-center justify-center"
                style={{
                  background: isSunHovered
                    ? 'radial-gradient(circle, rgba(255, 246, 233, 0.25) 0%, rgba(255, 213, 138, 0.15) 50%, transparent 75%)'
                    : 'radial-gradient(circle, rgba(255, 246, 233, 0.08) 0%, transparent 70%)',
                }}
              >
                {/* Center Hover "Enter" badge */}
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

            {/* Instruction Tag */}
            <div className="mt-8 space-y-3 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18233C]/80 border border-[#F18B58]/40 text-[11px] font-bold text-[#FFD58A] shadow-lg backdrop-blur-md animate-pulse">
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
                Your journey begins with a single touch.
              </p>

              {/* Click / Tap Prompt Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => activateSun({ x: e.clientX, y: e.clientY })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-black shadow-lg transition-all hover:scale-105 active:scale-95 group"
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

          {/* Bottom subtle indicator */}
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
          <div
            className="w-full lg:max-w-xl text-left space-y-5 lg:pr-6"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18233C]/80 border border-[#F18B58]/35 text-[11px] font-bold text-[#FFD58A] shadow-lg backdrop-blur-md">
              <Sunrise className="w-3.5 h-3.5 text-[#F18B58]" />
              <span className="tracking-wide uppercase">Golden Dawn · Active Session</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Welcome to a <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #FFF6E9 0%, #FFD58A 50%, #F18B58 100%)',
                }}
              >
                brighter beginning.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#B8B8C0] leading-relaxed max-w-lg">
              Sign in to continue your journey with Nova Hunger Food. Experience an animated 3D sunrise, cryptographic session security, and instant access across customer, courier, kitchen, and admin consoles.
            </p>

            {/* Quick Pillars */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-md">
              <div className="p-3 rounded-2xl bg-[#141E33]/60 border border-[#263653]/60 backdrop-blur-sm">
                <span className="text-[10px] uppercase font-bold text-[#F18B58] block">Security</span>
                <span className="text-xs font-bold text-white">OWASP Safe</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#141E33]/60 border border-[#263653]/60 backdrop-blur-sm">
                <span className="text-[10px] uppercase font-bold text-[#FFD58A] block">3D World</span>
                <span className="text-xs font-bold text-white">60 FPS WebGL</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#141E33]/60 border border-[#263653]/60 backdrop-blur-sm">
                <span className="text-[10px] uppercase font-bold text-[#FFF6E9] block">Home Experience</span>
                <span className="text-xs font-bold text-white">5-Scene Journey</span>
              </div>
            </div>
          </div>

          {/* Right Column: Responsive Glass Auth Card */}
          <div className="w-full lg:w-auto flex justify-center lg:justify-end">
            <DaybreakAuthCard
              portal={currentPortal}
              initialMode={mode === 'register' ? 'signup' : 'signin'}
              isRevealed={true}
              onNavigate={onNavigate}
              onPortalChange={setCurrentPortal}
              onGlowChange={setGlowIntensity}
            />
          </div>
        </main>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. FOOTER & 3D SOLAR TRAJECTORY CONTROLS                      */}
      {/* ------------------------------------------------------------- */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#B8B8C0]">
        <div className="flex items-center gap-4 text-[11px]">
          <span>© 2026 Daybreak Authentication & 3D Web Experience</span>
          <span>·</span>
          <a href="/privacy" className="hover:text-[#FFD58A] transition-colors">
            Privacy Policy
          </a>
          <span>·</span>
          <a href="/terms" className="hover:text-[#FFD58A] transition-colors">
            Terms of Service
          </a>
        </div>

        {/* Action Buttons: Reset/Replay + 3D Solar Customization */}
        <div className="flex items-center gap-2">
          {experienceState === 'AUTHENTICATION' && (
            <button
              type="button"
              onClick={handleReturnToSunrise}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141E33]/80 hover:bg-[#1A2744] border border-[#263653] text-[11px] font-semibold text-[#FFD58A] transition-colors shadow-lg backdrop-blur-md"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#F18B58]" />
              <span>Back to Sun</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDockOpen(!isDockOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141E33]/80 hover:bg-[#1A2744] border border-[#263653] text-[11px] font-semibold text-[#FFD58A] transition-colors shadow-lg backdrop-blur-md"
          >
            <Sliders className="w-3.5 h-3.5 text-[#F18B58]" />
            <span>{isDockOpen ? 'Hide Solar Dock' : 'Customize 3D Solar'}</span>
            {isDockOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </footer>

      {/* Collapsible 3D Solar Scrubber Drawer */}
      {isDockOpen && (
        <div className="relative z-30 w-full max-w-2xl mx-auto mb-4 px-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="p-4 rounded-3xl bg-[#141E33]/90 border border-[#263653] backdrop-blur-2xl shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#FFD58A] font-bold">
                <Sun className="w-4 h-4 text-[#F18B58]" />
                <span>3D Solar Altitude & Atmosphere</span>
              </div>
              <span className="text-[11px] text-stone-400">
                Phase: <strong className="text-white capitalize">{experienceState.toLowerCase()}</strong>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-stone-300">
                <span>Solar Elevation:</span>
                <span className="font-mono text-[#FFD58A]">
                  {Math.round(sunriseProgress * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sunriseProgress}
                onChange={(e) => setSunriseProgress(parseFloat(e.target.value))}
                className="w-full accent-[#F18B58] bg-[#1C2A48] rounded-lg h-2 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
