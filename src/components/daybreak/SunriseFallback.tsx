import React, { useState } from 'react';

interface SunriseFallbackProps {
  progress?: number; // 0 (dawn) to 1 (full daylight)
  interactiveParallax?: { x: number; y: number };
  isSunInteractive?: boolean;
  isActivating?: boolean;
  onSunClick?: () => void;
}

export const SunriseFallback: React.FC<SunriseFallbackProps> = ({
  progress = 0.5,
  interactiveParallax = { x: 0, y: 0 },
  isSunInteractive = true,
  isActivating = false,
  onSunClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Parallax offsets
  const px = interactiveParallax.x * 20;
  const py = interactiveParallax.y * 12;

  // Sun vertical position based on progress (0 -> behind horizon peaks at ~80%, 1 -> higher in sky at ~32%)
  const sunY = 80 - progress * 48;
  const baseScale = 0.82 + progress * 0.35;
  const sunScale = isActivating ? baseScale * 2.2 : isHovered ? baseScale * 1.08 : baseScale;
  const starOpacity = Math.max(0, 1.0 - progress * 2.4 - (isActivating ? 1 : 0));

  return (
    <div className="absolute inset-0 overflow-hidden select-none bg-[#080D1A]">
      {/* Sky Gradient Layer */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: isActivating
            ? 'radial-gradient(ellipse 140% 100% at 50% 45%, rgba(241, 139, 88, 0.45) 0%, rgba(101, 87, 119, 0.35) 45%, #080D1A 100%)'
            : `radial-gradient(ellipse 140% 95% at 50% ${sunY + 12}%, rgba(241, 139, 88, ${0.12 + progress * 0.45}) 0%, rgba(101, 87, 119, ${0.28 + progress * 0.32}) 45%, rgba(20, 30, 51, 0.95) 75%, #080D1A 100%)`,
        }}
      />

      {/* Twilight Stars (Fade as Dawn Breaks) */}
      <div
        className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
        style={{ opacity: starOpacity }}
      >
        <div className="absolute w-1 h-1 bg-white rounded-full top-[12%] left-[18%] animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute w-1.5 h-1.5 bg-[#FFD58A] rounded-full top-[16%] left-[34%] animate-pulse" style={{ animationDuration: '4.5s' }} />
        <div className="absolute w-1 h-1 bg-white rounded-full top-[8%] left-[55%] animate-pulse" style={{ animationDuration: '3.8s' }} />
        <div className="absolute w-1.5 h-1.5 bg-[#FFF6E9] rounded-full top-[20%] left-[78%] animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute w-1 h-1 bg-[#FFD58A] rounded-full top-[14%] left-[88%] animate-pulse" style={{ animationDuration: '3.2s' }} />
        <div className="absolute w-1 h-1 bg-white rounded-full top-[28%] left-[24%] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute w-1 h-1 bg-[#FFF6E9] rounded-full top-[32%] left-[64%] animate-pulse" style={{ animationDuration: '4.2s' }} />
      </div>

      {/* Atmospheric Dawn Radial Glow */}
      <div
        className="absolute w-[880px] h-[580px] rounded-full blur-[110px] transition-all duration-700 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `calc(50% + ${px * 0.3}px)`,
          top: `calc(${sunY}% + ${py * 0.3}px)`,
          opacity: isActivating ? 1 : 0.35 + progress * 0.65,
          background: 'radial-gradient(circle, rgba(255, 213, 138, 0.88) 0%, rgba(241, 139, 88, 0.52) 45%, rgba(101, 87, 119, 0.22) 75%, transparent 100%)',
        }}
      />

      {/* Volumetric Radial Light Beams */}
      <div
        className="absolute w-[980px] h-[980px] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-spin"
        style={{
          left: `calc(50% + ${px * 0.2}px)`,
          top: `calc(${sunY}% + ${py * 0.2}px)`,
          opacity: isActivating ? 0.85 : Math.max(0.08, progress * 0.42),
          animationDuration: isActivating ? '40s' : '180s',
          background: 'conic-gradient(from 0deg at 50% 50%, rgba(255, 213, 138, 0.28) 0deg, transparent 20deg, rgba(241, 139, 88, 0.22) 45deg, transparent 65deg, rgba(255, 246, 233, 0.32) 90deg, transparent 110deg, rgba(255, 213, 138, 0.28) 140deg, transparent 170deg, rgba(241, 139, 88, 0.22) 200deg, transparent 230deg, rgba(255, 246, 233, 0.32) 270deg, transparent 310deg, rgba(255, 213, 138, 0.28) 360deg)',
          maskImage: 'radial-gradient(circle, black 0%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 65%)',
        }}
      />

      {/* Interactive Sun Disc */}
      <button
        type="button"
        disabled={!isSunInteractive || isActivating}
        onClick={() => {
          if (isSunInteractive && !isActivating && onSunClick) {
            onSunClick();
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Touch the sun to begin"
        className="absolute rounded-full transition-all duration-700 shadow-2xl focus:outline-none group"
        style={{
          width: '154px',
          height: '154px',
          left: `calc(50% - 77px + ${px * 0.4}px)`,
          top: `calc(${sunY}% - 77px + ${py * 0.4}px)`,
          transform: `scale(${sunScale})`,
          cursor: isSunInteractive ? 'pointer' : 'default',
          background: 'radial-gradient(circle at 45% 40%, #FFF6E9 0%, #FFD58A 45%, #F18B58 85%, #d96636 100%)',
          boxShadow: isHovered
            ? `0 0 100px ${36 * progress}px rgba(255, 246, 233, 0.95), 0 0 170px ${85 * progress}px rgba(241, 139, 88, 0.7)`
            : `0 0 75px ${26 * progress}px rgba(255, 213, 138, 0.75), 0 0 135px ${62 * progress}px rgba(241, 139, 88, 0.48)`,
        }}
      >
        {isHovered && !isActivating && (
          <div className="absolute -inset-3 rounded-full border-2 border-[#FFF6E9]/70 animate-ping opacity-40 pointer-events-none" />
        )}
      </button>

      {/* Layer 1: Distant Alpine Peaks (Dusk Violet & Rose) */}
      <svg
        className="absolute bottom-0 left-0 w-[120%] -left-[10%] h-[48%] pointer-events-none transition-transform duration-300"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        style={{
          transform: `translate(${px * 0.5}px, ${py * 0.3}px)`,
        }}
      >
        <path
          d="M0 400 L0 180 Q150 135 280 185 T600 125 T900 165 Q1050 115 1200 155 L1200 400 Z"
          fill="#382845"
          opacity="0.92"
        />
        <path
          d="M0 400 L0 215 Q200 155 380 225 T750 165 T1100 195 L1200 215 L1200 400 Z"
          fill="#252438"
          opacity="0.96"
        />
      </svg>

      {/* Layer 2: Mid-Range Mountain Ridges with Rim Lighting */}
      <svg
        className="absolute bottom-0 left-0 w-[130%] -left-[15%] h-[40%] pointer-events-none transition-transform duration-300"
        viewBox="0 0 1300 350"
        preserveAspectRatio="none"
        style={{
          transform: `translate(${px * 1.2}px, ${py * 0.6}px)`,
        }}
      >
        <path
          d="M0 350 L0 155 Q180 105 350 165 T700 115 T1050 155 Q1180 125 1300 175 L1300 350 Z"
          fill="#1C2236"
          opacity="0.98"
        />
        {/* Rim Light along crest */}
        <path
          d="M0 155 Q180 105 350 165 T700 115 T1050 155 Q1180 125 1300 175"
          fill="none"
          stroke="url(#rimGradientFallback)"
          strokeWidth="3.5"
          opacity={0.35 + progress * 0.65}
        />
        <defs>
          <linearGradient id="rimGradientFallback" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#68567A" stopOpacity="0.2" />
            <stop offset="38%" stopColor="#F18B58" stopOpacity="0.85" />
            <stop offset="52%" stopColor="#FFD58A" stopOpacity="0.98" />
            <stop offset="68%" stopColor="#F18B58" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#68567A" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      {/* Layer 3: Foreground Foothills & Silhouette (Midnight Navy #101726) */}
      <svg
        className="absolute bottom-0 left-0 w-[140%] -left-[20%] h-[30%] pointer-events-none transition-transform duration-300"
        viewBox="0 0 1400 300"
        preserveAspectRatio="none"
        style={{
          transform: `translate(${px * 2.2}px, ${py * 0.9}px)`,
        }}
      >
        <path
          d="M0 300 L0 135 Q250 75 500 145 T1000 95 Q1200 65 1400 135 L1400 300 Z"
          fill="#101726"
        />
        <path
          d="M0 300 L0 175 Q350 115 700 185 T1400 155 L1400 300 Z"
          fill="#080D1A"
        />
      </svg>

      {/* Luminous Reflective Lake Surface */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[15%] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(241, 139, 88, 0.25) 0%, rgba(16, 23, 38, 0.95) 70%, #080D1A 100%)',
        }}
      >
        {/* Shimmering reflection beam */}
        <div
          className="w-56 h-full mx-auto blur-md"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 213, 138, 0.5) 0%, transparent 80%)',
          }}
        />
      </div>
    </div>
  );
};
