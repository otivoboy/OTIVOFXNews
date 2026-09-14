import React from 'react';

interface PreloaderProps {
  fadeOut?: boolean;
}

export const Preloader: React.FC<PreloaderProps> = ({ fadeOut = false }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-center items-center overflow-hidden transition-opacity duration-700 select-none ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#030712',
        backgroundImage: `
          radial-gradient(at 50% 50%, rgba(16, 185, 129, 0.08) 0, transparent 50%),
          radial-gradient(at 0% 0%, rgba(239, 68, 68, 0.05) 0, transparent 50%),
          linear-gradient(rgba(255, 255, 255, 0.007) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.007) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex items-center justify-center gap-4 my-1">
          {/* Gradients Definitions */}
          <svg height="0" width="0" viewBox="0 0 64 64" className="absolute">
            <defs>
              {/* O - Metallic Emerald Bullish Gradient */}
              <linearGradient y2="0" x2="1" y1="1" x1="0" id="o-forex-grad">
                <stop stopColor="#10B981" offset="0%"></stop>
                <stop stopColor="#059669" offset="50%"></stop>
                <stop stopColor="#34D399" offset="100%"></stop>
              </linearGradient>

              {/* T - Clean Liquid Cyan Gradient */}
              <linearGradient y2="0" x2="0" y1="1" x1="0" id="t-forex-grad">
                <stop stopColor="#06B6D4" offset="0%"></stop>
                <stop stopColor="#22D3EE" offset="100%"></stop>
              </linearGradient>

              {/* I - Solid Electric Silver Index Gradient */}
              <linearGradient y2="1" x2="0" y1="0" x1="0" id="i-forex-grad">
                <stop stopColor="#F9FAFB" offset="0%"></stop>
                <stop stopColor="#9CA3AF" offset="100%"></stop>
              </linearGradient>

              {/* V - Velocity Bearish Coral Gradient */}
              <linearGradient y2="0" x2="1" y1="1" x1="0" id="v-forex-grad">
                <stop stopColor="#EF4444" offset="0%"></stop>
                <stop stopColor="#F87171" offset="100%"></stop>
              </linearGradient>

              {/* O2 - Dynamic Global Market Flow Gradient */}
              <linearGradient y2="1" x2="1" y1="0" x1="0" id="o2-forex-grad">
                <stop stopColor="#F59E0B" offset="0%"></stop>
                <stop stopColor="#10B981" offset="100%"></stop>
              </linearGradient>
            </defs>
          </svg>

          {/* O - The Market Compass (Bullish Green Edge) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 64 64"
            height="64"
            width="64"
            className="inline-block otivo-fx-pulse-slow drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          >
            <circle cx="32" cy="32" r="30" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
            <path
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="7"
              stroke="url(#o-forex-grad)"
              d="M 32 32 m 0 -24 a 24 24 0 1 1 0 48 a 24 24 0 1 1 0 -48"
              className="otivo-fx-spin"
              pathLength="360"
            />
            <path d="M32 20v5M32 39v5M20 32h5M39 32h5" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* T - Tech Bar with Trend Ascend Detail */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 64 64"
            height="64"
            width="64"
            className="inline-block drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
          >
            <path
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="6.5"
              stroke="url(#t-forex-grad)"
              d="M 12,14 h 40 M 32,14 v 36"
              className="otivo-fx-dash"
              pathLength="360"
            />
            <path d="M27 22 l5 -5 l5 5" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* I - Candlestick Index Chart Column */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 64 64"
            height="64"
            width="64"
            className="inline-block drop-shadow-[0_0_8px_rgba(249,250,251,0.3)]"
          >
            <path d="M 32,8 v 48" stroke="rgba(249, 250, 251, 0.3)" strokeWidth="2" strokeLinecap="round" />
            <path
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="9"
              stroke="url(#i-forex-grad)"
              d="M 32,18 v 28"
              className="otivo-fx-dash"
              pathLength="360"
            />
          </svg>

          {/* V - Price Action Velocity Vector (Bearish Corner) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 64 64"
            height="64"
            width="64"
            className="inline-block drop-shadow-[0_0_8px_rgba(239,110,110,0.35)]"
          >
            <path
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="6.5"
              stroke="url(#v-forex-grad)"
              d="M 14,16 l 18,32 l 18,-32"
              className="otivo-fx-dash"
              pathLength="360"
            />
            <circle cx="32" cy="48" r="3" fill="#EF4444" />
          </svg>

          {/* O2 - Globular Exchange Ring */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 64 64"
            height="64"
            width="64"
            className="inline-block otivo-fx-pulse-slow drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]"
          >
            <path
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="6.5"
              stroke="url(#o2-forex-grad)"
              d="M 32 32 m 0 -19 a 19 19 0 1 1 0 38 a 19 19 0 1 1 0 -38"
              className="otivo-fx-spin"
              pathLength="360"
            />
            <path d="M26 28a6 6 0 0 1 12-4M38 36a6 6 0 0 1-12 4" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Forex specific layout details */}
        <div className="w-[120px] h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="flex items-center gap-2 text-[11px] font-extrabold tracking-[5px] uppercase text-gray-400 opacity-90">
          <span className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]">▲</span>
          <span>Forex</span>
          <span className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">▼</span>
          <span>News</span>
        </div>
      </div>
    </div>
  );
};
