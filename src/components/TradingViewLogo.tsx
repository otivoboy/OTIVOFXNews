import React, { useState } from 'react';

interface TradingViewLogoProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Exact Gold Bars Ingot icon matching TradingView's official Gold asset
export const GoldBarsIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="100" height="100" rx="20" fill="#CA8A04" />
    {/* Top Ingot */}
    <path 
      d="M39 23C40.5 21.5 42.5 21 44.5 21H55.5C57.5 21 59.5 21.5 61 23L70 41C71.2 43.5 69.5 46.5 67 46.5H33C30.5 46.5 28.8 43.5 30 41L39 23Z" 
      fill="white" 
    />
    <path 
      d="M38 41.5L64 27V41.5H38Z" 
      fill="#CA8A04" 
    />
    {/* Bottom Left Ingot */}
    <path 
      d="M19 55C20.5 53.5 22.5 53 24.5 53H37.5C39.5 53 41.5 53.5 43 55L52 73C53.2 75.5 51.5 78.5 49 78.5H15C12.5 78.5 10.8 75.5 12 73L19 55Z" 
      fill="white" 
    />
    <path 
      d="M18 73.5L46 59V73.5H18Z" 
      fill="#CA8A04" 
    />
    {/* Bottom Right Ingot */}
    <path 
      d="M57 55C58.5 53.5 60.5 53 62.5 53H75.5C77.5 53 79.5 53.5 81 55L90 73C91.2 75.5 89.5 78.5 87 78.5H53C50.5 78.5 48.8 75.5 50 73L57 55Z" 
      fill="white" 
    />
    <path 
      d="M56 73.5L84 59V73.5H56Z" 
      fill="#CA8A04" 
    />
  </svg>
);

// Crude Oil Barrel icon matching TradingView's commodity asset
export const OilIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="100" height="100" rx="20" fill="#1E293B" />
    <path 
      d="M50 20C45 28 32 45 32 58C32 68 40 76 50 76C60 76 68 68 68 58C68 45 55 28 50 20Z" 
      fill="#F59E0B" 
    />
    <ellipse cx="50" cy="58" rx="8" ry="12" fill="#0F172A" />
  </svg>
);

// TradingView official CDN assets for countries / currencies / commodities / crypto
const TV_CURRENCY_LOGOS: Record<string, string> = {
  EUR: 'https://s3-symbol-logo.tradingview.com/country/EU.svg',
  USD: 'https://s3-symbol-logo.tradingview.com/country/US.svg',
  GBP: 'https://s3-symbol-logo.tradingview.com/country/GB.svg',
  JPY: 'https://s3-symbol-logo.tradingview.com/country/JP.svg',
  CHF: 'https://s3-symbol-logo.tradingview.com/country/CH.svg',
  AUD: 'https://s3-symbol-logo.tradingview.com/country/AU.svg',
  CAD: 'https://s3-symbol-logo.tradingview.com/country/CA.svg',
  NZD: 'https://s3-symbol-logo.tradingview.com/country/NZ.svg',
  XAU: 'https://s3-symbol-logo.tradingview.com/metal/gold.svg',
  GOLD: 'https://s3-symbol-logo.tradingview.com/metal/gold.svg',
  OIL: 'https://s3-symbol-logo.tradingview.com/crude-oil.svg',
  BTC: 'https://s3-symbol-logo.tradingview.com/crypto/XTVCBTC.svg',
  DXY: 'https://s3-symbol-logo.tradingview.com/country/US.svg',
  US10Y: 'https://s3-symbol-logo.tradingview.com/country/US.svg',
};

// Fallback background colors and text for symbols if network is offline
const CURRENCY_COLORS: Record<string, { bg: string; text: string }> = {
  EUR: { bg: 'bg-blue-600', text: 'text-white' },
  USD: { bg: 'bg-emerald-600', text: 'text-white' },
  GBP: { bg: 'bg-indigo-700', text: 'text-white' },
  JPY: { bg: 'bg-red-600', text: 'text-white' },
  CHF: { bg: 'bg-red-700', text: 'text-white' },
  AUD: { bg: 'bg-sky-600', text: 'text-white' },
  CAD: { bg: 'bg-rose-600', text: 'text-white' },
  NZD: { bg: 'bg-teal-700', text: 'text-white' },
  XAU: { bg: 'bg-amber-500', text: 'text-slate-950' },
  GOLD: { bg: 'bg-amber-500', text: 'text-slate-950' },
  OIL: { bg: 'bg-slate-800', text: 'text-amber-400' },
  BTC: { bg: 'bg-orange-500', text: 'text-white' },
  DXY: { bg: 'bg-emerald-700', text: 'text-white' },
  US10Y: { bg: 'bg-blue-800', text: 'text-white' },
};

const renderSymbolAvatar = (
  sym: string,
  imgError: boolean,
  onError: () => void,
  sizeClass: string
) => {
  if (sym === 'XAU' || sym === 'GOLD') {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden shadow-xs border border-amber-400/60 bg-[#CA8A04]`}>
        <GoldBarsIcon className="w-full h-full" />
      </div>
    );
  }

  if (sym === 'OIL') {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden shadow-xs border border-slate-700 bg-slate-900`}>
        <OilIcon className="w-full h-full" />
      </div>
    );
  }

  const logoUrl = TV_CURRENCY_LOGOS[sym] || `https://s3-symbol-logo.tradingview.com/country/${sym.slice(0, 2)}.svg`;
  const color = CURRENCY_COLORS[sym] || { bg: 'bg-slate-700', text: 'text-white' };

  if (!imgError) {
    return (
      <img
        src={logoUrl}
        alt={sym}
        onError={onError}
        className={`${sizeClass} rounded-full object-cover shadow-xs border border-white/60 bg-slate-100`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-mono font-black shadow-xs border border-white/60 ${color.bg} ${color.text}`}>
      {sym.slice(0, 1)}
    </div>
  );
};

export const TradingViewLogo: React.FC<TradingViewLogoProps> = ({ 
  symbol, 
  size = 'md',
  className = '' 
}) => {
  const [baseImgError, setBaseImgError] = useState(false);
  const [quoteImgError, setQuoteImgError] = useState(false);

  // Parse pair (e.g. "EUR/USD", "EURUSD", "DXY", "US10Y", "XAU/USD")
  const cleanSymbol = symbol.toUpperCase().replace(/\s+/g, '');
  const parts = cleanSymbol.includes('/') ? cleanSymbol.split('/') : null;

  const isPair = !!parts && parts.length === 2;
  const base = isPair ? parts[0] : cleanSymbol;
  const quote = isPair ? parts[1] : null;

  const sizeClasses = {
    sm: {
      container: 'w-6 h-6',
      single: 'w-5 h-5 text-[9px]',
      base: 'w-4 h-4 text-[8px]',
      quote: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5 text-[7px]',
    },
    md: {
      container: 'w-7 h-7',
      single: 'w-6 h-6 text-[10px]',
      base: 'w-5 h-5 text-[9px]',
      quote: 'w-4 h-4 -bottom-0.5 -right-0.5 text-[8px]',
    },
    lg: {
      container: 'w-9 h-9',
      single: 'w-8 h-8 text-xs',
      base: 'w-6.5 h-6.5 text-[10px]',
      quote: 'w-5 h-5 -bottom-1 -right-1 text-[9px]',
    },
  }[size];

  // If it's a single instrument (e.g., DXY, US10Y, or standalone XAU)
  if (!isPair || !quote) {
    return (
      <div className={`relative flex items-center justify-center flex-shrink-0 ${sizeClasses.container} ${className}`}>
        {renderSymbolAvatar(base, baseImgError, () => setBaseImgError(true), sizeClasses.single)}
      </div>
    );
  }

  // Dual overlapping circular TradingView badge
  return (
    <div className={`relative flex-shrink-0 ${sizeClasses.container} ${className}`}>
      {/* Base Currency / Commodity (Top Left) */}
      <div className="absolute top-0 left-0 z-10">
        {renderSymbolAvatar(base, baseImgError, () => setBaseImgError(true), sizeClasses.base)}
      </div>

      {/* Quote Currency (Bottom Right overlapping) */}
      <div className={`absolute z-20 ${sizeClasses.quote}`}>
        {renderSymbolAvatar(quote, quoteImgError, () => setQuoteImgError(true), 'w-full h-full')}
      </div>
    </div>
  );
};
