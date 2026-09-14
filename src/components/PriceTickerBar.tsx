import React, { useRef, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { AssetQuote } from '../types';
import { TradingViewLogo } from './TradingViewLogo';

interface PriceTickerBarProps {
  quotes: AssetQuote[];
  onSelectAsset?: (symbol: string) => void;
  isDerivConnected?: boolean;
}

export const PriceTickerBar: React.FC<PriceTickerBarProps> = ({ 
  quotes, 
  onSelectAsset, 
  isDerivConnected = true 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const checkScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [quotes]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollState, 350);
    }
  };

  // Render mini SVG sparkline
  const renderSparkline = (points: number[], isPositive: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 0.0001;
    const width = 46;
    const height = 16;

    const coordinates = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible flex-shrink-0">
        <polyline
          fill="none"
          stroke={isPositive ? '#16a34a' : '#dc2626'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coordinates}
        />
      </svg>
    );
  };

  return (
    <div className="bg-[#faf7f2] border-b border-[#e2dcd2] py-1.5 px-3 sm:px-6 lg:px-8 xl:px-10 w-full relative flex items-center">
      {/* Market Pulse Left Badge */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-800 bg-[#f1ebe0] px-2.5 py-1 rounded-md border border-[#ded5c6] mr-2 flex-shrink-0">
        <span className="tracking-wider">MARKET PULSE</span>
      </div>

      {/* Left Scroll Button */}
      <button
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        aria-label="Scroll market ticker left"
        className={`hidden sm:flex absolute left-[125px] md:left-[135px] z-10 w-6 h-7 items-center justify-center rounded-md bg-[#ffffff] text-slate-700 hover:text-slate-900 border border-[#ded5c6] shadow-sm transition cursor-pointer ${
          !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-105'
        }`}
      >
        <ChevronLeft className="w-3 h-3" />
      </button>

      {/* Scrollable Quotes Carousel */}
      <div 
        ref={scrollRef}
        onScroll={checkScrollState}
        className="flex items-center gap-2 sm:gap-2.5 flex-1 overflow-x-auto scrollbar-none py-0.5 scroll-smooth"
      >
        {quotes.map((quote) => {
          const isPositive = quote.change24h >= 0;
          return (
            <div
              key={quote.symbol}
              onClick={() => onSelectAsset?.(quote.symbol)}
              className="flex items-center gap-2 bg-[#ffffff] hover:bg-[#f6f2ea] border border-[#e2dcd2] hover:border-[#cbc1b0] px-2.5 sm:px-3 py-1 rounded-md transition cursor-pointer group flex-shrink-0 select-none shadow-2xs"
            >
              <TradingViewLogo symbol={quote.symbol} size="sm" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 tracking-tight font-mono">
                    {quote.symbol}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {quote.category === 'YIELDS' ? 'Yield' : quote.category === 'COMMODITIES' ? 'Commd' : quote.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {quote.symbol === 'US10Y' 
                      ? `${quote.price.toFixed(3)}%` 
                      : quote.price.toLocaleString(undefined, { 
                          minimumFractionDigits: quote.precision ?? 4, 
                          maximumFractionDigits: quote.precision ?? 4 
                        })}
                  </span>
                  <div className={`flex items-center text-[10px] font-mono font-semibold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    <span>{isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Sparkline */}
              <div className="hidden md:block pl-1">
                {renderSparkline(quote.sparkline, isPositive)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Scroll Button */}
      <button
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
        aria-label="Scroll market ticker right"
        className={`hidden sm:flex absolute right-2 z-10 w-6 h-7 items-center justify-center rounded-md bg-[#ffffff] text-slate-700 hover:text-slate-900 border border-[#ded5c6] shadow-sm transition cursor-pointer ${
          !canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-105'
        }`}
      >
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};
