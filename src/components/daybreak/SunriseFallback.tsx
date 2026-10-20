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
  const px = interactiveParallax.x * 18;
  const py = interactiveParallax.y * 10;

  // Sun vertical position based on progress (0 -> behind horizon peaks at ~82%, 1 -> higher in sky at ~36%)
  const sunY = 82 - progress * 46;
  const baseScale = 0.8 + progress * 0.35;
  const sunScale = isActivating ? baseScale * 2.2 : isHovered ? baseScale * 1.08 : baseScale;
  const starOpacity = Math.max(0, 1 - progress * 2.4 - (isActivating ? 1 : 0));

  return (
    <div className="absolute inset-0 overflow-hidden select-none bg-[#0D1424]">
      {/* Sky Gradient Layer */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: isActivating
            ? 'radial-gradient(ellipse 150% 120% at 50% 50%, rgba(255, 246, 233, 0.9) 0%, rgba(255, 213, 138, 0.75) 35%, rgba(241, 139, 88, 0.6) 70%, #111A2E 100%)'
            : `radial-gradient(ellipse 130% 90% at 50% ${sunY + 12}%, rgba(241, 139, 88, ${0.1 + progress * 0.4}) 0%, rgba(101, 87, 119, ${0.3 + progress * 0.3}) 45%, rgba(38, 54, 83, 0.95) 75%, #0D1424 100%)`,
        }}
      />

      {/* Twilight Stars (Fade as Dawn Breaks) */}
      <div
        className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
        style={{ opacity: starOpacity }}
      >
        <div className="absolute w-1 h-1 bg-white rounded-full top-[12%] left-[18%] animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute w-1.5 h-1.5 bg-[#FFD58A] rounded-full top-[18%] left-[32%] animate-pulse" style={{ animationDuration: '4.5s' }} />
        <div className="absolute w-1 h-1 bg-white rounded-full top-[8%] left-[55%] animate-pulse" style={{ animationDuration: '3.8s' }} />
        <div className="absolute w-1.5 h-1.5 bg-[#FFF6E9] rounded-full top-[22%] left-[78%] animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute w-1 h-1 bg-[#FFD58A] rounded-full top-[15%] left-[88%] animate-pulse" style={{ animationDuration: '3.2s' }} />
        <div className="absolute w-1 h-1 bg-white rounded-full top-[28%] left-[24%] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute w-1 h-1 bg-[#FFF6E9] rounded-full top-[32%] left-[64%] animate-pulse" style={{ animationDuration: '4.2s' }} />
      </div>

      {/* Atmospheric Dawn Glow */}
      <div
        className="absolute w-[850px] h-[550px] rounded-full blur-[100px] transition-all duration-700 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `calc(50% + ${px * 0.3}px)`,
          top: `calc(${sunY}% + ${py * 0.3}px)`,
          opacity: isActivating ? 1 : 0.3 + progress * 0.6,
          background: 'radial-gradient(circle, rgba(255, 213, 138, 0.85) 0%, rgba(241, 139, 88, 0.5) 45%, rgba(101, 87, 119, 0.2) 75%, transparent 100%)',
        }}
      />

      {/* Volumetric Radial Beams */}
      <div
        className="absolute w-[950px] h-[950px] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-spin"
        style={{
          left: `calc(50% + ${px * 0.2}px)`,
          top: `calc(${sunY}% + ${py * 0.2}px)`,
          opacity: isActivating ? 0.8 : Math.max(0.08, progress * 0.4),
          animationDuration: isActivating ? '40s' : '180s',
          background: 'conic-gradient(from 0deg at 50% 50%, rgba(255, 213, 138, 0.25) 0deg, transparent 20deg, rgba(241, 139, 88, 0.2) 45deg, transparent 65deg, rgba(255, 246, 233, 0.3) 90deg, transparent 110deg, rgba(255, 213, 138, 0.25) 140deg, transparent 170deg, rgba(241, 139, 88, 0.2) 200deg, transparent 230deg, rgba(255, 246, 233, 0.3) 270deg, transparent 310deg, rgba(255, 213, 138, 0.25) 360deg)',
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
          width: '150px',
          height: '150px',
          left: `calc(50% - 75px + ${px * 0.4}px)`,
          top: `calc(${sunY}% - 75px + ${py * 0.4}px)`,
          transform: `scale(${sunScale})`,
          cursor: isSunInteractive ? 'pointer' : 'default',
          background: 'radial-gradient(circle at 45% 40%, #FFF6E9 0%, #FFD58A 45%, #F18B58 85%, #d96636 100%)',
          boxShadow: isHovered
            ? `0 0 95px ${35 * progress}px rgba(255, 246, 233, 0.9), 0 0 160px ${80 * progress}px rgba(241, 139, 88, 0.65)`
            : `0 0 70px ${25 * progress}px rgba(255, 213, 138, 0.7), 0 0 130px ${60 * progress}px rgba(241, 139, 88, 0.45)`,
        }}
      >
        {/* Pulsing Golden Outline ring on hover */}
        {isHovered && !isActivating && (
          <div className="absolute -inset-3 rounded-full border-2 border-[#FFF6E9]/70 animate-ping opacity-40 pointer-events-none" />
        )}
      </button>

      {/* Layer 1: Distant Horizon Peaks (Dusk Violet) */}
      <svg
        className="absolute bottom-0 left-0 w-[120%] -left-[10%] h-[48%] pointer-events-none transition-transform duration-300"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        style={{
          transform: `translate(${px * 0.5}px, ${py * 0.3}px)`,
        }}
      >
        <path
          d="M0 400 L0 180 Q150 140 280 190 T600 130 T900 170 Q1050 120 1200 160 L1200 400 Z"
          fill="#3B2E49"
          opacity="0.9"
        />
        <path
          d="M0 400 L0 220 Q200 160 380 230 T750 170 T1100 200 L1200 220 L1200 400 Z"
          fill="#2C324E"
          opacity="0.95"
        />
      </svg>

      {/* Layer 2: Mid-Range Mountain Ridges (Sunrise Coral & Amber Edge) */}
      <svg
        className="absolute bottom-0 left-0 w-[130%] -left-[15%] h-[40%] pointer-events-none transition-transform duration-300"
        viewBox="0 0 1300 350"
        preserveAspectRatio="none"
        style={{
          transform: `translate(${px * 1.2}px, ${py * 0.6}px)`,
        }}
      >
        <path
          d="M0 350 L0 160 Q180 110 350 170 T700 120 T1050 160 Q1180 130 1300 180 L1300 350 Z"
          fill="#1F2438"
          opacity="0.98"
        />
        {/* Rim Light along crest */}
        <path
          d="M0 160 Q180 110 350 170 T700 120 T1050 160 Q1180 130 1300 180"
          fill="none"
          stroke="url(#rimGradient)"
          strokeWidth="3.5"
          opacity={0.3 + progress * 0.7}
        />
        <defs>
          <linearGradient id="rimGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#655777" stopOpacity="0.2" />
            <stop offset="40%" stopColor="#F18B58" stopOpacity="0.8" />
            <stop offset="55%" stopColor="#FFD58A" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#F18B58" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#655777" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      {/* Layer 3: Foreground Foothills & Silhouette (Midnight Navy #111A2E) */}
      <svg
        className="absolute bottom-0 left-0 w-[140%] -left-[20%] h-[30%] pointer-events-none transition-transform duration-300"
        viewBox="0 0 1400 300"
        preserveAspectRatio="none"
        style={{
          transform: `translate(${px * 2.2}px, ${py * 0.9}px)`,
        }}
      >
        <path
          d="M0 300 L0 140 Q250 80 500 150 T1000 100 Q1200 70 1400 140 L1400 300 Z"
          fill="#111A2E"
        />
        <path
          d="M0 300 L0 180 Q350 120 700 190 T1400 160 L1400 300 Z"
          fill="#0B1120"
        />
      </svg>

      {/* Water / Lake Horizon Reflection */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[14%] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(241, 139, 88, 0.22) 0%, rgba(17, 26, 46, 0.95) 70%, #0D1424 100%)',
        }}
      >
        {/* Shimmering reflection beam */}
        <div
          className="w-48 h-full mx-auto blur-md"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 213, 138, 0.45) 0%, transparent 80%)',
          }}
        />
      </div>
    </div>
  );
};
