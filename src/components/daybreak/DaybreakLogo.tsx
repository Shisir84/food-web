import React from 'react';

interface DaybreakLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const DaybreakLogo: React.FC<DaybreakLogoProps> = ({
  size = 36,
  className = '',
  showText = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Rising Sun Geometric Emblem */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-2xl p-1.5 shadow-lg shadow-[#F18B58]/20 transition-transform duration-300 hover:scale-105"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, rgba(241, 139, 88, 0.25) 0%, rgba(255, 213, 138, 0.15) 100%)',
          border: '1px solid rgba(255, 213, 138, 0.35)',
        }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="daybreakSun" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#F18B58" />
              <stop offset="60%" stopColor="#FFD58A" />
              <stop offset="100%" stopColor="#FFF6E9" />
            </linearGradient>
            <linearGradient id="daybreakHorizon" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#655777" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#FFD58A" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#655777" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Radiant Sun Rays */}
          <path d="M24 6V11" stroke="#FFD58A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.85" />
          <path d="M12 11L15.5 14.5" stroke="#FFD58A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.75" />
          <path d="M36 11L32.5 14.5" stroke="#FFD58A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.75" />
          <path d="M7 21H12" stroke="#FFD58A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.65" />
          <path d="M41 21H36" stroke="#FFD58A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.65" />

          {/* Semicircular Rising Sun Disc */}
          <path
            d="M13 29C13 22.9249 17.9249 18 24 18C30.0751 18 35 22.9249 35 29H13Z"
            fill="url(#daybreakSun)"
          />

          {/* Mountain Silhouette Line */}
          <path
            d="M6 36L17 28L25 33L36 26L42 36"
            stroke="#263653"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Glowing Horizon Line */}
          <path d="M4 36H44" stroke="url(#daybreakHorizon)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-display font-extrabold text-lg sm:text-xl tracking-wider text-white">
            DAY<span className="text-[#FFD58A]">BREAK</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#F18B58]/90 -mt-1">
            Authentication
          </span>
        </div>
      )}
    </div>
  );
};
