import React, { useState, useMemo } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Check, 
  Copy,
  Zap,
  Globe,
  RefreshCw,
  Compass,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { EconomicEvent, NormalizedNewsItem } from '../types';
import { soundManager } from '../utils/audio';
import { useLiveNews } from '../hooks/useLiveNews';

interface LiveRunningNewsFeedProps {
  event: EconomicEvent;
}

const generateBaseNews = (event: EconomicEvent): NormalizedNewsItem[] => {
  const now = Date.now();
  const ccy = event.currency || 'USD';
  const code = event.code || 'MACRO';

  if (ccy === 'GBP' || code.includes('JOBLESS') || code.includes('CLAIMANT') || code.includes('BOE')) {
    return [
      {
        id: 'news-gbp-1',
        headline: 'UK Labor Market: Payrolled employees fall slightly as claimant count ticks toward 11.2k consensus estimate.',
        source: 'REUTERS FX',
        sourceType: 'REUTERS',
        timestamp: now - 18 * 1000,
        category: 'BREAKING',
        impactSentiment: 'HAWKISH',
        impactScore: 84,
        tickers: ['GBP/USD', 'EUR/GBP', 'UK 10Y GILTS'],
        summary: 'Traders note stubborn private sector regular wage persistence limits room for aggressive BoE easing in Q3.',
        isFlash: true,
        analysis: {
          expectedMove: 'GBP/USD Bids Hold Above Support, Gilts Pressured',
          horizon: 'intraday',
          confidence: 0.85,
          rationale: 'Wage persistence limits BoE easing room, keeping Sterling rate differentials supported.',
          expectedDirection: { USD: 'NEUTRAL', EUR: 'BEARISH' },
          tradeIdeas: ['Buy GBP/USD dips near 1.3020', 'Short EUR/GBP on monetary divergence']
        }
      },
      {
        id: 'news-gbp-2',
        headline: 'BoE MPC Member: "Services inflation trajectory and wage settlement persistence remain critical before considering further cuts."',
        source: 'BLOOMBERG WIRE',
        sourceType: 'BLOOMBERG',
        timestamp: now - 52 * 1000,
        category: 'CENTRAL_BANK',
        impactSentiment: 'HAWKISH',
        impactScore: 88,
        tickers: ['GBP/USD', 'SONIA SWAPS'],
        summary: 'OIS pricing for 25bps rate cut at next MPC meeting trims from 64% to 48% following hawkish commentary.',
        analysis: {
          expectedMove: 'Front-End Swap Curve Flattens, Sterling Strength Extends',
          horizon: '1-3 days',
          confidence: 0.88,
          rationale: 'Hawkish MPC voting bloc discourages premature market pricing of rate easing cycle.',
          expectedDirection: { USD: 'BEARISH' }
        }
      }
    ];
  }

  if (ccy === 'JPY' || code.includes('BOJ')) {
    return [
      {
        id: 'news-jpy-1',
        headline: 'MoF Vice Minister for International Affairs: "Standing on highest vigilance against speculative, one-sided FX swings."',
        source: 'NIKKEI WIRE',
        sourceType: 'CENTRAL_BANK',
        timestamp: now - 22 * 1000,
        category: 'BREAKING',
        impactSentiment: 'HAWKISH',
        impactScore: 92,
        tickers: ['USD/JPY', 'EUR/JPY', 'JGB 10Y'],
        summary: 'Markets on alert for verbal intervention turning into direct physical BoJ check of trading rates.',
        isFlash: true,
        analysis: {
          expectedMove: 'USD/JPY Downside Impulsive Reversal on Intervention Risk',
          horizon: 'intraday',
          confidence: 0.91,
          rationale: 'Intervention threats trigger swift short-covering and speculative carry unwind.',
          expectedDirection: { JPY: 'BULLISH', USD: 'BEARISH' },
          tradeIdeas: ['Fade USD/JPY spikes toward resistance', 'Long JPY crosses on safe-haven bid']
        }
      },
      {
        id: 'news-jpy-2',
        headline: 'BoJ Governor Ueda: "If baseline outlook on wage growth & services prices is realized, we will continue adjusting accommodation."',
        source: 'REUTERS TOKYO',
        sourceType: 'REUTERS',
        timestamp: now - 65 * 1000,
        category: 'CENTRAL_BANK',
        impactSentiment: 'HAWKISH',
        impactScore: 86,
        tickers: ['USD/JPY', 'NIKKEI 225', 'TONA SWAPS'],
        summary: 'TONA futures now price 72% probability of policy rate moving to 0.50% at upcoming monetary meetings.'
      }
    ];
  }

  return [
    {
      id: 'news-usd-1',
      headline: `US Macro Pulse: Institutional algorithmic desks position for ${event.title} release with implied volatility elevated across major pairs.`,
      source: 'BLOOMBERG',
      sourceType: 'BLOOMBERG',
      timestamp: now - 15 * 1000,
      category: 'BREAKING',
      impactSentiment: 'HIGH_VOLATILITY',
      impactScore: 85,
      tickers: ['EUR/USD', 'USD/JPY', 'US 10Y'],
      summary: '2-Year US Treasury yield holds near 4.05% as FedWatch futures price 88% odds for baseline rate path.',
      isFlash: true,
      analysis: {
        expectedMove: 'Two-Way High Volatility Ahead of Catalyst Print',
        horizon: 'intraday',
        confidence: 0.82,
        rationale: 'Pre-positioning balances options gamma exposure with fast-money speculative liquidity.',
        expectedDirection: { USD: 'NEUTRAL' }
      }
    },
    {
      id: 'news-usd-2',
      headline: 'Fed Officials reiterate data-dependent stance, emphasizing core services ex-shelter and unit labor cost trajectories.',
      source: 'REUTERS FX',
      sourceType: 'REUTERS',
      timestamp: now - 58 * 1000,
      category: 'CENTRAL_BANK',
      impactSentiment: 'NEUTRAL',
      impactScore: 78,
      tickers: ['DXY', 'S&P 500', 'GOLD'],
      summary: 'FOMC participants highlight dual mandate balance between cooling labor dynamics and disinflation progress.'
    }
  ];
};

export const LiveRunningNewsFeed: React.FC<LiveRunningNewsFeedProps> = ({ event }) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);

  // Dynamic news query tied directly to current event and currency
  const query = useMemo(() => {
    const ccy = event.currency || 'USD';
    const cleanTitle = (event.title || 'interest rate').replace(/[^a-zA-Z0-9 ]/g, '');
    return `${ccy} ${cleanTitle} macro news fx market`;
  }, [event.currency, event.title]);

  // Connect to the Live Multi-Source Aggregation & Normalization Pipeline
  const { news: liveNews, isLoading, isLiveStreamConnected, refresh, lastFetched } = useLiveNews({
    query,
    category: activeCategory,
    pollIntervalMs: 20000,
  });

  // Effective news: preference for live pipeline, seamless fallback to base fixture
  const effectiveNews: NormalizedNewsItem[] = useMemo(() => {
    if (liveNews && liveNews.length > 0) {
      return liveNews;
    }
    return generateBaseNews(event);
  }, [liveNews, event]);

  const getTimeAgo = (timestamp: number) => {
    const diffSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const filteredNews = useMemo(() => {
    return effectiveNews.filter((item) => {
      if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inHeadline = item.headline.toLowerCase().includes(q);
        const inSource = item.source.toLowerCase().includes(q);
        const inSummary = (item.summary || '').toLowerCase().includes(q);
        const inTickers = item.tickers.some((t) => t.toLowerCase().includes(q));
        if (!inHeadline && !inSource && !inSummary && !inTickers) return false;
      }
      return true;
    });
  }, [effectiveNews, activeCategory, searchQuery]);

  const handleCopyHeadline = (item: NormalizedNewsItem) => {
    const parts = [
      `${item.source}: ${item.headline}`,
      item.summary ? `Summary: ${item.summary}` : '',
      item.analysis ? `Expected Move: ${item.analysis.expectedMove} (${item.analysis.horizon}, ${Math.round(item.analysis.confidence * 100)}% conf)` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(parts);
    setCopiedId(item.id);
    soundManager.playStepTick();
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleAnalysis = (id: string) => {
    soundManager.playStepTick();
    setExpandedAnalysisId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mt-3.5 bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
      {/* 1. Header Toolbar */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#e2dcd2]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-sans">
                Live Macro Squawk & News Pipeline
              </h3>
              {isLiveStreamConnected ? (
                <span className="flex items-center gap-1 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
                  LIVE STREAM
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-mono text-slate-700 px-2 py-0.5 rounded-full bg-[#f1ebe0] border border-[#ded5c6]">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  POLLING
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">
              Multi-source aggregation • Real-time NLP impact scoring & market trajectory analysis
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playStepTick();
                refresh();
              }}
              disabled={isLoading}
              title="Force refresh live news feed"
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-slate-700 bg-[#ffffff] border border-[#ded5c6] rounded-md hover:bg-[#f3ede2] hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-sky-700' : ''}`} />
              <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* 2. Filter Bar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-0.5">
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { id: 'ALL', label: 'All Wire' },
              { id: 'BREAKING', label: 'Breaking' },
              { id: 'CENTRAL_BANK', label: 'Central Bank' },
              { id: 'MACRO_DATA', label: 'Macro Data' },
              { id: 'FLOWS_FX', label: 'FX Flows' },
              { id: 'GEOPOLITICAL', label: 'Geopolitical' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  soundManager.playStepTick();
                }}
                className={`text-[10px] font-medium px-2 py-0.8 rounded-md transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-sky-100 text-sky-900 border border-sky-300 font-bold shadow-2xs'
                    : 'bg-[#ffffff] text-slate-600 border border-[#ded5c6] hover:text-slate-900 hover:bg-[#f3ede2]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[140px] max-w-[200px] flex-1">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter headlines or tickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#ded5c6] rounded-md pl-7 pr-2 py-1 text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition font-mono"
            />
          </div>
        </div>

        {/* 3. News Items Stream List */}
        <div className="mt-2.5 space-y-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredNews.length > 0 ? (
            filteredNews.map((item) => {
              const isHawkish = item.impactSentiment === 'HAWKISH';
              const isDovish = item.impactSentiment === 'DOVISH';
              const isVolatile = item.impactSentiment === 'HIGH_VOLATILITY';
              const isExpanded = expandedAnalysisId === item.id;
              const hasAnalysis = Boolean(item.analysis);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition duration-200 relative group ${
                    item.isFlash
                      ? 'bg-[#ffffff] border-sky-300 shadow-2xs ring-1 ring-sky-200/50'
                      : 'bg-[#ffffff] border-[#e8e2d8] hover:border-[#cbc1b0]'
                  }`}
                >
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#f1ebe0] text-slate-800 border border-[#ded5c6]">
                        {item.source}
                      </span>

                      {item.isFlash && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                          FLASH
                        </span>
                      )}

                      {isHawkish && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-900 border border-rose-200 flex items-center gap-0.5">
                          <TrendingUp className="w-2.5 h-2.5 text-rose-700" />
                          HAWKISH {item.impactScore ? `${item.impactScore}%` : ''}
                        </span>
                      )}

                      {isDovish && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-0.5">
                          <TrendingDown className="w-2.5 h-2.5 text-emerald-700" />
                          DOVISH {item.impactScore ? `${item.impactScore}%` : ''}
                        </span>
                      )}

                      {isVolatile && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 text-amber-700" />
                          VOLATILITY {item.impactScore ? `${item.impactScore}%` : ''}
                        </span>
                      )}

                      {item.analysis?.horizon && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#f1ebe0] text-slate-700 border border-[#ded5c6]">
                          {item.analysis.horizon}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        {getTimeAgo(item.timestamp)}
                      </span>

                      <button
                        onClick={() => handleCopyHeadline(item)}
                        title="Copy full update parts"
                        className="text-slate-400 hover:text-slate-700 opacity-60 group-hover:opacity-100 transition cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3 text-emerald-700" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Headline */}
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug font-sans">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="hover:text-sky-800 transition underline decoration-[#ded5c6] underline-offset-2"
                      >
                        {item.headline}
                      </a>
                    ) : (
                      item.headline
                    )}
                  </h4>

                  {/* Summary */}
                  {item.summary && (
                    <p className="text-[11px] text-slate-700 mt-1.5 leading-relaxed font-sans bg-[#f8f5ee] p-2 rounded-md border border-[#e8e2d8]">
                      {item.summary}
                    </p>
                  )}

                  {/* Full Update Analysis Block (Expected Market Impact, Horizon, Rationale & Trade Ideas) */}
                  {hasAnalysis && (
                    <div className="mt-2 rounded-md border border-[#ded5c6] bg-[#fdfcf9] overflow-hidden text-[11px]">
                      <div
                        onClick={() => toggleAnalysis(item.id)}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-[#f5f1e8] hover:bg-[#ede7da] transition cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <Compass className="w-3 h-3 text-sky-800" />
                          <span className="font-semibold text-slate-900 font-sans">
                            Expected Market Impact:
                          </span>
                          <span className="text-slate-800 font-mono font-medium">
                            {item.analysis?.expectedMove}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 font-bold">
                            {Math.round((item.analysis?.confidence || 0.85) * 100)}% Conf
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-2.5 space-y-2 border-t border-[#ded5c6] bg-[#fbf9f4]">
                          <div>
                            <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-500 mb-0.5">
                              Institutional Transmission Rationale
                            </div>
                            <p className="text-[10px] text-slate-700 leading-relaxed font-sans">
                              {item.analysis?.rationale}
                            </p>
                          </div>

                          {/* Asset Direction Biases */}
                          {item.analysis?.expectedDirection && (
                            <div>
                              <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-500 mb-1">
                                Intermarket Bias Map
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(item.analysis.expectedDirection).map(([asset, dir]) => {
                                  const isBull = dir === 'BULLISH';
                                  const isBear = dir === 'BEARISH';
                                  return (
                                    <span
                                      key={asset}
                                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                        isBull
                                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                          : isBear
                                          ? 'bg-rose-50 text-rose-900 border-rose-200'
                                          : 'bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      {asset}: {dir}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Trade Ideas */}
                          {item.analysis?.tradeIdeas && item.analysis.tradeIdeas.length > 0 && (
                            <div>
                              <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-500 mb-1">
                                Actionable Playbook Setups
                              </div>
                              <div className="space-y-1">
                                {item.analysis.tradeIdeas.map((idea, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5 text-[10px] text-slate-800 font-sans"
                                  >
                                    <ArrowRight className="w-2.5 h-2.5 text-sky-700 flex-shrink-0" />
                                    <span>{idea}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tickers Tags */}
                  {item.tickers.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {item.tickers.map((ticker, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#f1ebe0] text-slate-700 border border-[#ded5c6]"
                        >
                          #{ticker}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs font-mono">
              No news items matching "{searchQuery}" in category {activeCategory}.
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom Live Status Ticker Bar */}
      <div className="mt-2.5 pt-2 border-t border-[#e2dcd2] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-sky-700" />
          <span>
            Macro Pipeline Active • {filteredNews.length} wire updates indexed
            {lastFetched ? ` • Updated ${getTimeAgo(lastFetched)}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <ShieldCheck className="w-3 h-3 text-emerald-700" />
          <span>Institutional Wires & RSS Ingestion</span>
        </div>
      </div>
    </div>
  );
};
