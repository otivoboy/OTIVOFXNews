import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Check, 
  Copy,
  Zap,
  Globe
} from 'lucide-react';
import { EconomicEvent } from '../types';
import { soundManager } from '../utils/audio';

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  sourceType: 'BLOOMBERG' | 'REUTERS' | 'FT' | 'DOW_JONES' | 'NIKKEI' | 'CENTRAL_BANK' | 'SQUAWK';
  timestamp: number; // ms
  category: 'BREAKING' | 'CENTRAL_BANK' | 'MACRO_DATA' | 'FLOWS_FX' | 'GEOPOLITICAL';
  impactSentiment: 'HAWKISH' | 'DOVISH' | 'NEUTRAL' | 'HIGH_VOLATILITY';
  score?: number;
  tickers: string[];
  summary?: string;
  isFlash?: boolean;
}

interface LiveRunningNewsFeedProps {
  event: EconomicEvent;
}

const generateBaseNews = (event: EconomicEvent): NewsItem[] => {
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
        score: 3.4,
        tickers: ['GBP/USD', 'EUR/GBP', 'UK 10Y GILTS'],
        summary: 'Traders note stubborn private sector regular wage persistence limits room for aggressive BoE easing in Q3.',
        isFlash: true
      },
      {
        id: 'news-gbp-2',
        headline: 'BoE MPC Member: "Services inflation trajectory and wage settlement persistence remain critical before considering further cuts."',
        source: 'BLOOMBERG WIRE',
        sourceType: 'BLOOMBERG',
        timestamp: now - 52 * 1000,
        category: 'CENTRAL_BANK',
        impactSentiment: 'HAWKISH',
        score: 4.1,
        tickers: ['GBP/USD', 'SONIA SWAPS'],
        summary: 'OIS pricing for 25bps rate cut at next MPC meeting trims from 64% to 48% following hawkish commentary.'
      },
      {
        id: 'news-gbp-3',
        headline: 'UK 10-Year Gilt Yield ticks +2.8 bps higher to 4.02% ahead of headline UK earnings & claimant count batch.',
        source: 'DOW JONES FX',
        sourceType: 'DOW_JONES',
        timestamp: now - 130 * 1000,
        category: 'FLOWS_FX',
        impactSentiment: 'HIGH_VOLATILITY',
        tickers: ['UK10Y', 'GBP/JPY'],
        summary: 'Institutional fast-money accounts buying front-end Sterling dips against European cross currencies.'
      },
      {
        id: 'news-gbp-4',
        headline: 'City of London FX Flow Desk: Heavy bilateral exporter corporate bids noted near 1.3015 support on Cable.',
        source: 'SQUAWK AUDIO',
        sourceType: 'SQUAWK',
        timestamp: now - 210 * 1000,
        category: 'FLOWS_FX',
        impactSentiment: 'NEUTRAL',
        tickers: ['GBP/USD'],
        summary: 'Large institutional stop-loss cluster identified at 1.3080/90 breakout zone.'
      },
      {
        id: 'news-gbp-5',
        headline: 'FT Macro Insight: UK corporate wage settlements averaging 4.8% YoY despite slowing headline job postings.',
        source: 'FINANCIAL TIMES',
        sourceType: 'FT',
        timestamp: now - 360 * 1000,
        category: 'MACRO_DATA',
        impactSentiment: 'HAWKISH',
        score: 2.9,
        tickers: ['GBP/USD', 'FTSE 100'],
        summary: 'Services sector margin compression cited as employers absorb minimum wage increases without severe layoffs.'
      }
    ];
  }

  if (ccy === 'JPY' || code.includes('BOJ')) {
    return [
      {
        id: 'news-jpy-1',
        headline: 'MoF Vice Minister for International Affairs: "Standing on highest vigilance against speculative, one-sided FX swings."',
        source: 'NIKKEI WIRE',
        sourceType: 'NIKKEI',
        timestamp: now - 22 * 1000,
        category: 'BREAKING',
        impactSentiment: 'HAWKISH',
        score: 5.0,
        tickers: ['USD/JPY', 'EUR/JPY', 'JGB 10Y'],
        summary: 'Markets on alert for verbal intervention turning into direct physical BoJ check of trading rates.',
        isFlash: true
      },
      {
        id: 'news-jpy-2',
        headline: 'BoJ Governor Ueda: "If baseline outlook on wage growth & services prices is realized, we will continue adjusting accommodation."',
        source: 'REUTERS TOKYO',
        sourceType: 'REUTERS',
        timestamp: now - 65 * 1000,
        category: 'CENTRAL_BANK',
        impactSentiment: 'HAWKISH',
        score: 4.6,
        tickers: ['USD/JPY', 'NIKKEI 225', 'TONA SWAPS'],
        summary: 'TONA futures now price 72% probability of policy rate moving to 0.50% at upcoming monetary meetings.'
      },
      {
        id: 'news-jpy-3',
        headline: 'Japan Rengo Shunto Wage Tracker: Second-round union settlements confirm average wage increases above +5.10%.',
        source: 'BLOOMBERG',
        sourceType: 'BLOOMBERG',
        timestamp: now - 145 * 1000,
        category: 'MACRO_DATA',
        impactSentiment: 'HAWKISH',
        score: 3.8,
        tickers: ['USD/JPY', 'JPY CROSSES'],
        summary: 'Virtuous wage-price spiral mechanism verified by central bank research division.'
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
      score: 3.2,
      tickers: ['EUR/USD', 'USD/JPY', 'US 10Y'],
      summary: '2-Year US Treasury yield holds near 4.05% as FedWatch futures price 88% odds for baseline rate path.',
      isFlash: true
    },
    {
      id: 'news-usd-2',
      headline: 'Fed Officials reiterate data-dependent stance, emphasizing core services ex-shelter and unit labor cost trajectories.',
      source: 'REUTERS FX',
      sourceType: 'REUTERS',
      timestamp: now - 58 * 1000,
      category: 'CENTRAL_BANK',
      impactSentiment: 'NEUTRAL',
      tickers: ['DXY', 'S&P 500', 'GOLD'],
      summary: 'FOMC participants highlight dual mandate balance between cooling labor dynamics and disinflation progress.'
    },
    {
      id: 'news-usd-3',
      headline: 'Global FX Liquidity Depth: Interbank spreads tighten as high-frequency participants quote two-way volume into release window.',
      source: 'SQUAWK DESK',
      sourceType: 'SQUAWK',
      timestamp: now - 140 * 1000,
      category: 'FLOWS_FX',
      impactSentiment: 'NEUTRAL',
      tickers: ['EUR/USD', 'GBP/USD'],
      summary: 'Gamma exposure concentrated around psychological round numbers.'
    }
  ];
};

export const LiveRunningNewsFeed: React.FC<LiveRunningNewsFeedProps> = ({ event }) => {
  const [news, setNews] = useState<NewsItem[]>(() => generateBaseNews(event));
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setNews(generateBaseNews(event));
  }, [event.id, event.currency, event.code]);

  const getTimeAgo = (timestamp: number) => {
    const diffSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const inHeadline = item.headline.toLowerCase().includes(query);
        const inSource = item.source.toLowerCase().includes(query);
        const inTickers = item.tickers.some((t) => t.toLowerCase().includes(query));
        if (!inHeadline && !inSource && !inTickers) return false;
      }
      return true;
    });
  }, [news, activeCategory, searchQuery]);

  const handleCopyHeadline = (item: NewsItem) => {
    navigator.clipboard.writeText(`${item.source}: ${item.headline}`);
    setCopiedId(item.id);
    soundManager.playStepTick();
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="mt-3.5 bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
      {/* 1. Header Toolbar */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#e2dcd2]">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-sans">
              Live Macro Squawk & News Wire
            </h3>
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">
              Ultra-low latency institutional squawk, order-flow catalysts & macro alerts
            </p>
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
              placeholder="Filter headlines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#ded5c6] rounded-md pl-7 pr-2 py-1 text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition font-mono"
            />
          </div>
        </div>

        {/* 3. News Items Stream List */}
        <div className="mt-2.5 space-y-2 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredNews.length > 0 ? (
            filteredNews.map((item) => {
              const isHawkish = item.impactSentiment === 'HAWKISH';
              const isDovish = item.impactSentiment === 'DOVISH';
              const isVolatile = item.impactSentiment === 'HIGH_VOLATILITY';

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border transition duration-200 relative group ${
                    item.isFlash
                      ? 'bg-[#ffffff] border-sky-300 shadow-2xs'
                      : 'bg-[#ffffff] border-[#e8e2d8] hover:border-[#cbc1b0]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#f1ebe0] text-slate-800 border border-[#ded5c6]">
                        {item.source}
                      </span>

                      {item.isFlash && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 border border-rose-300">
                          FLASH
                        </span>
                      )}

                      {isHawkish && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-900 border border-rose-200 flex items-center gap-0.5">
                          <TrendingUp className="w-2.5 h-2.5 text-rose-700" />
                          HAWKISH {item.score ? `+${item.score}` : ''}
                        </span>
                      )}

                      {isDovish && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-0.5">
                          <TrendingDown className="w-2.5 h-2.5 text-emerald-700" />
                          DOVISH {item.score ? item.score : ''}
                        </span>
                      )}

                      {isVolatile && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 text-amber-700" />
                          HIGH VOLATILITY
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
                        title="Copy headline"
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

                  <h4 className="text-xs font-semibold text-slate-900 leading-snug font-sans">
                    {item.headline}
                  </h4>

                  {item.summary && (
                    <p className="text-[10px] text-slate-700 mt-1 leading-relaxed font-sans bg-[#f8f5ee] p-1.5 rounded border border-[#e8e2d8]">
                      {item.summary}
                    </p>
                  )}

                  {item.tickers.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {item.tickers.map((ticker, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#f1ebe0] text-slate-700 border border-[#ded5c6]"
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
      <div className="mt-2.5 pt-2 border-t border-[#e2dcd2] flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-sky-700" />
          <span>Macro Feed Active • {filteredNews.length} wire items indexed</span>
        </div>
        <div className="text-slate-500">
          Source: Interbank FX Squawk & Financial Newswires
        </div>
      </div>
    </div>
  );
};
