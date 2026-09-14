import React, { useState, useEffect, useCallback } from 'react';
import { 
  Globe, 
  Database, 
  RefreshCw, 
  ExternalLink, 
  Search, 
  TrendingUp, 
  Layers, 
  Newspaper,
  Clock
} from 'lucide-react';
import { MarketIntelPayload, MarketIntelNewsItem, MarketIntelFundamentals } from '../types';
import { generateClientMarketIntel } from '../services/macroCalendarService';

interface MarketIntelSectionProps {
  selectedAssetSymbol?: string;
  onLogEvent?: (message: string, category: any, level: any, details?: any) => void;
}

const SYMBOL_OPTIONS = [
  { symbol: 'EUR/USD', display: 'EUR/USD' },
  { symbol: 'XAU/USD', display: 'XAU/USD (Gold)' },
  { symbol: 'USD/JPY', display: 'USD/JPY' },
  { symbol: 'SPX', display: 'S&P 500' },
  { symbol: 'DXY', display: 'US Dollar Index (DXY)' },
  { symbol: 'BTC/USD', display: 'BTC/USD' },
  { symbol: 'US10Y', display: 'US 10-Year Yield' },
];

const INDICATOR_OPTIONS = [
  { id: 'CPI', label: 'CPI (Consumer Price Index)', unit: 'Index' },
  { id: 'FEDERAL_FUNDS_RATE', label: 'Federal Funds Rate', unit: '%' },
  { id: 'REAL_GDP', label: 'Real GDP', unit: '$B' },
  { id: 'UNEMPLOYMENT', label: 'Unemployment Rate', unit: '%' },
  { id: 'INFLATION', label: 'Inflation Rate YoY', unit: '%' },
];

export const MarketIntelSection: React.FC<MarketIntelSectionProps> = ({
  selectedAssetSymbol = 'EUR/USD',
  onLogEvent,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<{ symbol: string; display: string }>({
    symbol: selectedAssetSymbol,
    display: selectedAssetSymbol,
  });
  const [indicator, setIndicator] = useState<string>('CPI');
  const [searchQuery, setSearchQuery] = useState<string>(`${selectedAssetSymbol} high impact news market today`);
  const [isCustomQuery, setIsCustomQuery] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [intelData, setIntelData] = useState<MarketIntelPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'news' | 'fundamentals'>('news');

  useEffect(() => {
    if (selectedAssetSymbol) {
      const match = SYMBOL_OPTIONS.find((s) => s.symbol === selectedAssetSymbol);
      const newDisplay = match ? match.display : selectedAssetSymbol;
      setSelectedSymbol({ symbol: selectedAssetSymbol, display: newDisplay });
      if (!isCustomQuery) {
        setSearchQuery(`${selectedAssetSymbol} high impact macro news today`);
      }
    }
  }, [selectedAssetSymbol, isCustomQuery]);

  const fetchMarketIntel = useCallback(async (
    targetSymbol = selectedSymbol,
    targetIndicator = indicator,
    targetQuery = searchQuery
  ) => {
    setLoading(true);
    onLogEvent?.(`Querying market intel for ${targetSymbol.symbol}...`, 'SYSTEM', 'INFO');

    try {
      const res = await fetch(`/api/market-intel?symbol=${encodeURIComponent(targetSymbol.symbol)}&indicator=${encodeURIComponent(targetIndicator)}&query=${encodeURIComponent(targetQuery)}`);
      
      if (res.ok) {
        const data: MarketIntelPayload = await res.json();
        setIntelData(data);
        onLogEvent?.(`Serper news & Alpha Vantage intel successfully retrieved.`, 'SYSTEM', 'SUCCESS', {
          newsCount: data.news.length,
          hasFundamentals: !!data.fundamentals,
        });
      } else {
        const fallback = generateClientMarketIntel(targetSymbol.symbol, targetIndicator, targetQuery);
        setIntelData(fallback);
        onLogEvent?.(`Serper/Alpha Vantage live API unavailable. Serving high-fidelity local macro fallback stream.`, 'SYSTEM', 'WARNING');
      }
    } catch (err: any) {
      console.warn('API error in market-intel, using local synthetic fallback', err);
      const fallback = generateClientMarketIntel(targetSymbol.symbol, targetIndicator, targetQuery);
      setIntelData(fallback);
      onLogEvent?.(`Executed local fallback intel pipeline.`, 'SYSTEM', 'INFO');
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, indicator, searchQuery, onLogEvent]);

  useEffect(() => {
    fetchMarketIntel();
  }, []);

  const handleSymbolChange = (newSym: string) => {
    const match = SYMBOL_OPTIONS.find((s) => s.symbol === newSym);
    const newObj = { symbol: newSym, display: match ? match.display : newSym };
    setSelectedSymbol(newObj);
    const newQ = `${newSym} high impact macro news today`;
    setSearchQuery(newQ);
    setIsCustomQuery(false);
    fetchMarketIntel(newObj, indicator, newQ);
  };

  const handleIndicatorChange = (newInd: string) => {
    setIndicator(newInd);
    fetchMarketIntel(selectedSymbol, newInd, searchQuery);
  };

  return (
    <section className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl overflow-hidden shadow-sm mt-4">
      {/* Top Banner */}
      <div className="bg-[#faf8f4] p-3.5 sm:p-4 border-b border-[#e2dcd2] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-100 border border-sky-200 text-sky-800">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-wide font-sans">
                Raw Market Data & Intelligence News Feed
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#f1ebe0] text-slate-800 border border-[#ded5c6]">
                LIVE MACRO WIRE
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 font-sans">
              Google Serper Search real-time news aggregation & Alpha Vantage macroeconomic fundamentals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {intelData && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#f1ebe0] border border-[#ded5c6] text-[11px] font-mono text-slate-700">
              <Clock className="w-3.5 h-3.5 text-sky-700" />
              <span>Latency: <strong className="text-emerald-700 font-bold">{intelData.meta.latencyMs}ms</strong></span>
            </div>
          )}

          <button
            onClick={() => fetchMarketIntel()}
            disabled={loading}
            className="flex items-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-50 text-white px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold font-mono transition shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Fetching Intel...' : 'Refresh Intel Wire'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Query Bar */}
      <div className="bg-[#faf8f4] border-b border-[#e2dcd2] p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Symbol Select */}
        <div className="md:col-span-3 flex items-center gap-2">
          <label className="text-[11px] font-mono text-slate-500 uppercase flex-shrink-0">Symbol:</label>
          <select
            value={selectedSymbol.symbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            className="w-full bg-[#ffffff] border border-[#ded5c6] focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono outline-none transition cursor-pointer"
          >
            {SYMBOL_OPTIONS.map((opt) => (
              <option key={opt.symbol} value={opt.symbol}>
                {opt.display}
              </option>
            ))}
          </select>
        </div>

        {/* Fundamental Indicator Select */}
        <div className="md:col-span-3 flex items-center gap-2">
          <label className="text-[11px] font-mono text-slate-500 uppercase flex-shrink-0">Indicator:</label>
          <select
            value={indicator}
            onChange={(e) => handleIndicatorChange(e.target.value)}
            className="w-full bg-[#ffffff] border border-[#ded5c6] focus:border-sky-500 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono outline-none transition cursor-pointer"
          >
            {INDICATOR_OPTIONS.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Query Input */}
        <div className="md:col-span-6 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsCustomQuery(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchMarketIntel(selectedSymbol, indicator, searchQuery);
                }
              }}
              placeholder="Search news query..."
              className="w-full bg-[#ffffff] border border-[#ded5c6] focus:border-sky-500 rounded pl-8 pr-2.5 py-1.5 text-xs text-slate-900 font-mono outline-none transition"
            />
          </div>
          <button
            onClick={() => fetchMarketIntel(selectedSymbol, indicator, searchQuery)}
            className="px-3 py-1.5 bg-[#f1ebe0] hover:bg-[#eae2d4] text-slate-800 border border-[#ded5c6] rounded text-xs font-mono font-medium transition cursor-pointer"
          >
            Run
          </button>
        </div>
      </div>

      {/* Tabs Navigator */}
      <div className="flex items-center justify-between px-4 pt-3 border-b border-[#e2dcd2] bg-[#f8f5ee]">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold font-mono transition border-b-2 cursor-pointer ${
              activeTab === 'news'
                ? 'border-emerald-700 text-emerald-900 bg-[#ffffff] rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>1. News Intel ({intelData?.news.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('fundamentals')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold font-mono transition border-b-2 cursor-pointer ${
              activeTab === 'fundamentals'
                ? 'border-emerald-700 text-emerald-900 bg-[#ffffff] rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2. Macro Intel ({indicator})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5">
        {loading && !intelData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-600">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-700" />
            <p className="text-xs font-mono">Executing simultaneous fetchMarketIntel() requests...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: News Intel */}
            {activeTab === 'news' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#e2dcd2]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                      News Intel & Organic Headlines
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    Query: <code className="text-sky-900 font-bold">"{intelData?.meta.query || searchQuery}"</code>
                  </div>
                </div>

                {intelData?.news && intelData.news.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {intelData.news.map((item, index) => (
                      <div
                        key={index}
                        className="bg-[#ffffff] hover:bg-[#faf8f4] border border-[#e2dcd2] hover:border-[#cbc1b0] rounded-lg p-3.5 sm:p-4 transition duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 group shadow-2xs"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200">
                              #{item.position || index + 1} Organic
                            </span>
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-slate-400" />
                              {item.source}
                            </span>
                            {item.date && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                • {item.date}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug font-sans">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-600 leading-relaxed font-sans">
                            {item.snippet}
                          </p>
                        </div>

                        {item.link && item.link !== '#' && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 self-start sm:self-center p-2 rounded bg-[#f1ebe0] hover:bg-[#eae2d4] border border-[#ded5c6] text-slate-600 hover:text-sky-800 transition"
                            title="Read original source"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic py-6 text-center">
                    No organic news items found for this query.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Alpha Vantage Fundamentals */}
            {activeTab === 'fundamentals' && intelData?.fundamentals && (
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#e2dcd2]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                      Macro Fundamentals Engine
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    Endpoint: <code className="text-emerald-800 font-bold">function={intelData.indicator}</code>
                  </div>
                </div>

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-4">
                    <div className="text-[11px] font-mono text-slate-500 uppercase mb-1">
                      Latest Reading
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 flex items-baseline gap-1.5">
                      <span className="text-emerald-700">{intelData.fundamentals.latestReading?.value || '--'}</span>
                      <span className="text-xs text-slate-500 font-sans">{intelData.fundamentals.unit}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Report Date: {intelData.fundamentals.latestReading?.date || 'Latest'}
                    </div>
                  </div>

                  <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-4">
                    <div className="text-[11px] font-mono text-slate-500 uppercase mb-1">
                      Indicator Definition
                    </div>
                    <div className="text-xs font-semibold text-slate-800 line-clamp-2">
                      {intelData.fundamentals.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Frequency: {intelData.fundamentals.interval}
                    </div>
                  </div>

                  <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-4">
                    <div className="text-[11px] font-mono text-slate-500 uppercase mb-1">
                      Macro Impact Bias
                    </div>
                    <div className="text-xs font-semibold text-sky-900">
                      {indicator === 'CPI' || indicator === 'INFLATION'
                        ? 'Hawkish for USD when higher than trend'
                        : indicator === 'UNEMPLOYMENT'
                        ? 'Dovish rate cut pressure when rising'
                        : 'Growth & Business Cycle Support'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Multi-Market direct transmission
                    </div>
                  </div>
                </div>

                {/* Historical Series Table */}
                <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-4">
                  <h4 className="text-xs font-mono font-bold text-slate-900 uppercase mb-3 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-sky-700" />
                    Historical Time Series Readings
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-[#e2dcd2] text-slate-500">
                          <th className="pb-2 font-medium">Date Period</th>
                          <th className="pb-2 font-medium">Value</th>
                          <th className="pb-2 font-medium">MoM Trend</th>
                          <th className="pb-2 font-medium text-right">Relative Momentum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2dcd2]">
                        {intelData.fundamentals.data.map((item, idx) => {
                          const prev = intelData.fundamentals.data[idx + 1];
                          const curVal = parseFloat(item.value);
                          const prevVal = prev ? parseFloat(prev.value) : null;
                          const diff = prevVal !== null ? curVal - prevVal : 0;
                          const isUp = diff > 0;
                          const isDown = diff < 0;

                          return (
                            <tr key={idx} className="hover:bg-[#ffffff] transition">
                              <td className="py-2 text-slate-700">{item.date}</td>
                              <td className="py-2 font-bold text-slate-900">{item.value}</td>
                              <td className="py-2">
                                {prevVal === null ? (
                                  <span className="text-slate-400">--</span>
                                ) : isUp ? (
                                  <span className="text-rose-700 flex items-center gap-1 text-[11px] font-bold">
                                    ▲ +{diff.toFixed(2)}
                                  </span>
                                ) : isDown ? (
                                  <span className="text-emerald-700 flex items-center gap-1 text-[11px] font-bold">
                                    ▼ {diff.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">— 0.00</span>
                                )}
                              </td>
                              <td className="py-2 text-right">
                                <span className="inline-block w-16 bg-[#e2dcd2] rounded-full h-1.5 overflow-hidden align-middle">
                                  <span
                                    className="bg-emerald-600 h-full block"
                                    style={{
                                      width: `${Math.min(100, Math.max(15, (curVal / (parseFloat(intelData.fundamentals.data[0].value) || 1)) * 100))}%`,
                                    }}
                                  />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
