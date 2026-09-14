import React from 'react';

export type TechnicalSignal = 'STRONG_SELL' | 'SELL' | 'NEUTRAL' | 'BUY' | 'STRONG_BUY';

interface TechnicalGaugeProps {
  title: string;
  signal: TechnicalSignal;
  buyCount?: number;
  neutralCount?: number;
  sellCount?: number;
  size?: 'sm' | 'md' | 'lg';
  isHero?: boolean;
}

export const TechnicalGauge: React.FC<TechnicalGaugeProps> = ({
  title,
  signal,
  buyCount,
  neutralCount,
  sellCount,
  size = 'md',
  isHero = false,
}) => {
  // Angle mapped from -90 (Strong Sell) to +90 (Strong Buy)
  const getAngle = (sig: TechnicalSignal): number => {
    switch (sig) {
      case 'STRONG_SELL':
        return -72;
      case 'SELL':
        return -36;
      case 'NEUTRAL':
        return 0;
      case 'BUY':
        return 36;
      case 'STRONG_BUY':
        return 72;
      default:
        return 0;
    }
  };

  const getSignalLabel = (sig: TechnicalSignal): string => {
    switch (sig) {
      case 'STRONG_SELL':
        return 'Strong Sell';
      case 'SELL':
        return 'Sell';
      case 'NEUTRAL':
        return 'Neutral';
      case 'BUY':
        return 'Buy';
      case 'STRONG_BUY':
        return 'Strong Buy';
    }
  };

  const getSignalBadgeStyle = (sig: TechnicalSignal): string => {
    switch (sig) {
      case 'STRONG_SELL':
        return 'bg-[#dc2626] text-white shadow-sm';
      case 'SELL':
        return 'bg-[#f97316] text-white shadow-sm';
      case 'NEUTRAL':
        return 'bg-[#64748b] text-white shadow-sm';
      case 'BUY':
        return 'bg-[#16a34a] text-white shadow-sm';
      case 'STRONG_BUY':
        return 'bg-[#009944] text-white shadow-sm';
    }
  };

  const angle = getAngle(signal);
  const label = getSignalLabel(signal);
  const badgeStyle = getSignalBadgeStyle(signal);

  const width = isHero ? 280 : 190;
  const height = isHero ? 160 : 120;
  const radius = isHero ? 100 : 70;
  const strokeWidth = isHero ? 16 : 12;
  const cx = width / 2;
  const cy = isHero ? 125 : 95;

  return (
    <div className="flex flex-col items-center justify-between text-center select-none w-full">
      {/* Title */}
      <div className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight mb-2">
        {title}
      </div>

      {/* SVG Arc Speedometer */}
      <div className="relative flex items-center justify-center" style={{ width, height }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          {/* Curved Segments: Strong Sell (Red), Sell (Orange), Neutral (Slate), Buy (Light Green), Strong Buy (Green) */}
          <defs>
            <linearGradient id="gaugeGradSS" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="gaugeGradS" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id="gaugeGradN" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="gaugeGradB" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient id="gaugeGradSB" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#009944" />
            </linearGradient>
          </defs>

          {/* Semicircle Gauge Track Segments */}
          {/* 1. Strong Sell (Far Left): 0° to 36° */}
          <path
            d={describeArc(cx, cy, radius, 0, 36)}
            fill="none"
            stroke="url(#gaugeGradSS)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* 2. Sell (Mid Left): 36° to 72° */}
          <path
            d={describeArc(cx, cy, radius, 36, 72)}
            fill="none"
            stroke="url(#gaugeGradS)"
            strokeWidth={strokeWidth}
          />
          {/* 3. Neutral (Top Center): 72° to 108° */}
          <path
            d={describeArc(cx, cy, radius, 72, 108)}
            fill="none"
            stroke="url(#gaugeGradN)"
            strokeWidth={strokeWidth}
          />
          {/* 4. Buy (Mid Right): 108° to 144° */}
          <path
            d={describeArc(cx, cy, radius, 108, 144)}
            fill="none"
            stroke="url(#gaugeGradB)"
            strokeWidth={strokeWidth}
          />
          {/* 5. Strong Buy (Far Right): 144° to 180° */}
          <path
            d={describeArc(cx, cy, radius, 144, 180)}
            fill="none"
            stroke="url(#gaugeGradSB)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Scale Text Labels for Hero Gauge */}
          {isHero && (
            <>
              <text x={cx - radius - 20} y={cy + 8} className="text-[10px] font-sans fill-slate-400 font-semibold" textAnchor="middle">Strong Sell</text>
              <text x={cx - 52} y={cy - radius + 12} className="text-[10px] font-sans fill-slate-500 font-medium" textAnchor="middle">Sell</text>
              <text x={cx} y={cy - radius - 8} className="text-[11px] font-sans fill-slate-600 font-semibold" textAnchor="middle">Neutral</text>
              <text x={cx + 52} y={cy - radius + 12} className="text-[10px] font-sans fill-slate-500 font-medium" textAnchor="middle">Buy</text>
              <text x={cx + radius + 20} y={cy + 8} className="text-[10px] font-sans fill-slate-400 font-semibold" textAnchor="middle">Strong Buy</text>
            </>
          )}

          {/* Needle Pointer */}
          <g
            transform={`translate(${cx}, ${cy}) rotate(${angle})`}
            style={{ transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {/* Needle Line/Polygon */}
            <polygon
              points={`-3,0 0,-${radius - 4} 3,0 0,6`}
              fill="#1e293b"
              className="drop-shadow-xs"
            />
            {/* Pivot Center Circles */}
            <circle cx="0" cy="0" r={isHero ? 7 : 5} fill="#0f172a" />
            <circle cx="0" cy="0" r={isHero ? 3 : 2} fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Action Badge Pill */}
      <div className="mt-1 flex flex-col items-center">
        <span
          className={`px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm tracking-wide uppercase transition-all duration-300 ${badgeStyle}`}
        >
          {label}
        </span>

        {/* Breakdown Counts if provided */}
        {(buyCount !== undefined || sellCount !== undefined || neutralCount !== undefined) && (
          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-500">
            {buyCount !== undefined && (
              <span className="text-emerald-700 font-semibold">
                Buy: <strong className="text-slate-900">{buyCount}</strong>
              </span>
            )}
            {neutralCount !== undefined && (
              <span className="text-slate-600 font-semibold">
                Neutral: <strong className="text-slate-900">{neutralCount}</strong>
              </span>
            )}
            {sellCount !== undefined && (
              <span className="text-rose-700 font-semibold">
                Sell: <strong className="text-slate-900">{sellCount}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// SVG arc math helper
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
}
