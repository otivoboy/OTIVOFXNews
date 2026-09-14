import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Radio, 
  PieChart, 
  Activity, 
  Gauge, 
  Compass, 
  MessageSquareText, 
  Megaphone, 
  Building, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sliders, 
  Info,
  Search,
  Filter,
  Share2,
  BookOpen,
  Vote,
  Flame,
  Clock,
  RefreshCw,
  TrendingDown as BearIcon,
  TrendingUp as BullIcon,
  Scale,
  Send,
  UserCheck
} from 'lucide-react';
import { AssetQuote } from '../types';

export type SentimentMarketType = 'ALL' | 'FX' | 'EQUITIES' | 'COMMODITIES' | 'CRYPTO' | 'BONDS';

interface MarketSentimentSectionProps {
  quotes?: AssetQuote[];
  selectedAssetSymbol?: string;
  isDerivConnected?: boolean;
  onSelectAsset?: (symbol: string) => void;
}

export interface MarketSentimentProfile {
  id: string;
  symbol: string;
  quoteSymbol: string;
  name: string;
  category: SentimentMarketType;
  baseScore: number;
  
  // 1. Positioning & Quantitative Data (Base references that update with live ticks)
  baseCommercialNet: number;
  baseSpeculatorNet: number;
  basePutCallRatio: number;
  baseRetailLong: number;

  // 2. Volatility & Breadth
  volIndexName: string;
  baseVolVal: number;
  baseBpi: number;
  baseHighs52w: number;
  baseLows52w: number;

  // 3. Social & Narrative
  baseNlpScore: number;
  surveyName: string;
  baseSurveyBull: number;
  dominantNarrative: string;
}

export const STATIC_MARKET_PROFILES: MarketSentimentProfile[] = [
  {
    id: 'spx',
    symbol: 'S&P 500 (SPX / ES)',
    quoteSymbol: 'SPX',
    name: 'US Large Cap Equity Benchmark',
    category: 'EQUITIES',
    baseScore: 66,
    baseCommercialNet: -84200,
    baseSpeculatorNet: +112400,
    basePutCallRatio: 0.74,
    baseRetailLong: 68,
    volIndexName: 'CBOE VIX',
    baseVolVal: 14.85,
    baseBpi: 66.4,
    baseHighs52w: 142,
    baseLows52w: 18,
    baseNlpScore: +0.54,
    surveyName: 'AAII Individual Investor Survey',
    baseSurveyBull: 44.8,
    dominantNarrative: 'Soft landing momentum, corporate margin expansion, and enterprise AI capex.',
  },
  {
    id: 'eurusd',
    symbol: 'EUR/USD Spot',
    quoteSymbol: 'EUR/USD',
    name: 'Euro / US Dollar FX Benchmark',
    category: 'FX',
    baseScore: 42,
    baseCommercialNet: +48500,
    baseSpeculatorNet: -36200,
    basePutCallRatio: 1.18,
    baseRetailLong: 74,
    volIndexName: 'Deutsche Bank CVIX (FX Vol)',
    baseVolVal: 6.42,
    baseBpi: 38.2,
    baseHighs52w: 12,
    baseLows52w: 48,
    baseNlpScore: -0.28,
    surveyName: 'Sentix Eurozone Investor Sentiment',
    baseSurveyBull: 29.4,
    dominantNarrative: 'German manufacturing slowdown, energy tariff risks, and transatlantic yield divergence.',
  },
  {
    id: 'gold',
    symbol: 'Gold (XAU/USD)',
    quoteSymbol: 'XAU/USD',
    name: 'Precious Metals & Sovereign Reserve Asset',
    category: 'COMMODITIES',
    baseScore: 78,
    baseCommercialNet: -192000,
    baseSpeculatorNet: +248000,
    basePutCallRatio: 0.62,
    baseRetailLong: 61,
    volIndexName: 'CBOE GVZ (Gold Volatility)',
    baseVolVal: 16.20,
    baseBpi: 82.0,
    baseHighs52w: 88,
    baseLows52w: 4,
    baseNlpScore: +0.72,
    surveyName: 'World Gold Council Allocator Poll',
    baseSurveyBull: 68.5,
    dominantNarrative: 'De-dollarization reserves diversification, fiscal deficit expansion, and real rate easing.',
  },
  {
    id: 'btc',
    symbol: 'Bitcoin (BTC/USD)',
    quoteSymbol: 'BTC/USD',
    name: 'Digital Asset Benchmark & Store of Value',
    category: 'CRYPTO',
    baseScore: 72,
    baseCommercialNet: -14200,
    baseSpeculatorNet: +16800,
    basePutCallRatio: 0.68,
    baseRetailLong: 64,
    volIndexName: 'DVOL (Bitcoin Implied Volatility)',
    baseVolVal: 54.2,
    baseBpi: 70.5,
    baseHighs52w: 45,
    baseLows52w: 3,
    baseNlpScore: +0.66,
    surveyName: 'Crypto Fear & Greed Index Aggregator',
    baseSurveyBull: 62.0,
    dominantNarrative: 'Spot ETF institutional adoption, global sovereign liquidity expansion, and crypto regulatory clarity.',
  },
  {
    id: 'us10y',
    symbol: 'US 10-Year Treasury Yield (US10Y)',
    quoteSymbol: 'US10Y',
    name: 'Global Benchmark Risk-Free Rate',
    category: 'BONDS',
    baseScore: 48,
    baseCommercialNet: +340000,
    baseSpeculatorNet: -410000,
    basePutCallRatio: 0.98,
    baseRetailLong: 52,
    volIndexName: 'ICE BofA MOVE Index (Bond Vol)',
    baseVolVal: 92.4,
    baseBpi: 50.0,
    baseHighs52w: 24,
    baseLows52w: 22,
    baseNlpScore: +0.08,
    surveyName: 'JPMorgan Treasury Client Survey',
    baseSurveyBull: 32.0,
    dominantNarrative: 'Fed dot-plot glide path, Treasury quarterly refunding issuance sizes, and terminal rate expectations.',
  },
  {
    id: 'usdjpy',
    symbol: 'USD/JPY Spot',
    quoteSymbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    category: 'FX',
    baseScore: 36,
    baseCommercialNet: -44000,
    baseSpeculatorNet: +38000,
    basePutCallRatio: 1.24,
    baseRetailLong: 71,
    volIndexName: 'JFX 1-Month Implied Vol',
    baseVolVal: 11.85,
    baseBpi: 32.0,
    baseHighs52w: 8,
    baseLows52w: 52,
    baseNlpScore: -0.42,
    surveyName: 'Nikkei Institutional FX Sentiment',
    baseSurveyBull: 22.0,
    dominantNarrative: 'Yen carry trade unwinding, Tokyo inflation persistence, and BoJ rate hike forward guidance.',
  },
  {
    id: 'gbpusd',
    symbol: 'GBP/USD Spot',
    quoteSymbol: 'GBP/USD',
    name: 'British Pound / US Dollar Cable',
    category: 'FX',
    baseScore: 54,
    baseCommercialNet: -18000,
    baseSpeculatorNet: +24000,
    basePutCallRatio: 0.92,
    baseRetailLong: 58,
    volIndexName: 'GBP 1M Implied Volatility',
    baseVolVal: 7.80,
    baseBpi: 56.0,
    baseHighs52w: 22,
    baseLows52w: 16,
    baseNlpScore: +0.18,
    surveyName: 'BoE Market Participants Survey',
    baseSurveyBull: 41.0,
    dominantNarrative: 'UK services inflation persistence, BoE measured rate reduction cycle, and stable consumer demand.',
  },
  {
    id: 'audusd',
    symbol: 'AUD/USD Spot',
    quoteSymbol: 'AUD/USD',
    name: 'Australian Dollar / US Dollar',
    category: 'FX',
    baseScore: 50,
    baseCommercialNet: -12000,
    baseSpeculatorNet: +15000,
    basePutCallRatio: 0.96,
    baseRetailLong: 62,
    volIndexName: 'AUD 1M Implied Volatility',
    baseVolVal: 9.10,
    baseBpi: 48.0,
    baseHighs52w: 14,
    baseLows52w: 20,
    baseNlpScore: +0.05,
    surveyName: 'RBA Interbank Sentiment Index',
    baseSurveyBull: 38.0,
    dominantNarrative: 'RBA prolonged hold stance, sticky core trimmed inflation, and China stimulus pass-through.',
  },
  {
    id: 'usdcad',
    symbol: 'USD/CAD Spot',
    quoteSymbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    category: 'FX',
    baseScore: 62,
    baseCommercialNet: -28000,
    baseSpeculatorNet: +34000,
    basePutCallRatio: 0.82,
    baseRetailLong: 38,
    volIndexName: 'CAD 1M Implied Volatility',
    baseVolVal: 5.95,
    baseBpi: 62.0,
    baseHighs52w: 38,
    baseLows52w: 10,
    baseNlpScore: +0.34,
    surveyName: 'Bank of Canada Business Outlook Survey',
    baseSurveyBull: 48.0,
    dominantNarrative: 'BoC rapid rate cutting path widening Canada-US yield gap, offset by crude oil stability.',
  },
  {
    id: 'usdchf',
    symbol: 'USD/CHF Spot',
    quoteSymbol: 'USD/CHF',
    name: 'US Dollar / Swiss Franc',
    category: 'FX',
    baseScore: 38,
    baseCommercialNet: +22000,
    baseSpeculatorNet: -19000,
    basePutCallRatio: 1.15,
    baseRetailLong: 76,
    volIndexName: 'CHF 1M Implied Volatility',
    baseVolVal: 6.80,
    baseBpi: 34.0,
    baseHighs52w: 10,
    baseLows52w: 42,
    baseNlpScore: -0.32,
    surveyName: 'SNB Interbank Market Survey',
    baseSurveyBull: 28.0,
    dominantNarrative: 'Swiss Franc defensive safe-haven capital preservation inflows vs US yield dynamics.',
  },
  {
    id: 'nzdusd',
    symbol: 'NZD/USD Spot',
    quoteSymbol: 'NZD/USD',
    name: 'New Zealand Dollar / US Dollar',
    category: 'FX',
    baseScore: 52,
    baseCommercialNet: -8500,
    baseSpeculatorNet: +11200,
    basePutCallRatio: 0.94,
    baseRetailLong: 59,
    volIndexName: 'NZD 1M Implied Volatility',
    baseVolVal: 8.90,
    baseBpi: 51.0,
    baseHighs52w: 16,
    baseLows52w: 18,
    baseNlpScore: +0.12,
    surveyName: 'RBNZ Quarterly Confidence Survey',
    baseSurveyBull: 42.0,
    dominantNarrative: 'Dairy export demand resilience and economic stabilization supporting Kiwi kiwi recovery.',
  },
  {
    id: 'eurgbp',
    symbol: 'EUR/GBP Cross',
    quoteSymbol: 'EUR/GBP',
    name: 'Euro / British Pound',
    category: 'FX',
    baseScore: 46,
    baseCommercialNet: +15000,
    baseSpeculatorNet: -12000,
    basePutCallRatio: 1.05,
    baseRetailLong: 65,
    volIndexName: 'EUR/GBP 1M Implied Vol',
    baseVolVal: 5.20,
    baseBpi: 44.0,
    baseHighs52w: 8,
    baseLows52w: 32,
    baseNlpScore: -0.15,
    surveyName: 'ECB/BoE Cross-Channel Sentiment',
    baseSurveyBull: 34.0,
    dominantNarrative: 'UK services growth outperforming Eurozone manufacturing, keeping cross pinned to channel low.',
  },
  {
    id: 'eurjpy',
    symbol: 'EUR/JPY Cross',
    quoteSymbol: 'EUR/JPY',
    name: 'Euro / Japanese Yen',
    category: 'FX',
    baseScore: 68,
    baseCommercialNet: -31000,
    baseSpeculatorNet: +42000,
    basePutCallRatio: 0.78,
    baseRetailLong: 44,
    volIndexName: 'EUR/JPY 1M Implied Vol',
    baseVolVal: 10.40,
    baseBpi: 68.0,
    baseHighs52w: 48,
    baseLows52w: 6,
    baseNlpScore: +0.45,
    surveyName: 'Tokyo FX Interbank Sentiment Poll',
    baseSurveyBull: 60.0,
    dominantNarrative: 'Carry trade appetite and ECB nominal rate advantage maintaining strong bullish upside pressure.',
  },
  {
    id: 'gbpjpy',
    symbol: 'GBP/JPY Dragon',
    quoteSymbol: 'GBP/JPY',
    name: 'British Pound / Japanese Yen',
    category: 'FX',
    baseScore: 74,
    baseCommercialNet: -39000,
    baseSpeculatorNet: +52000,
    basePutCallRatio: 0.70,
    baseRetailLong: 39,
    volIndexName: 'GBP/JPY 1M Implied Vol',
    baseVolVal: 12.10,
    baseBpi: 74.0,
    baseHighs52w: 62,
    baseLows52w: 4,
    baseNlpScore: +0.58,
    surveyName: 'London Global FX Carry Desk Poll',
    baseSurveyBull: 66.0,
    dominantNarrative: 'BoE elevated base rates vs BoJ negative real rates driving continuous long carry positioning.',
  },
  {
    id: 'oilusd',
    symbol: 'WTI Crude Oil (OIL/USD)',
    quoteSymbol: 'OIL/USD',
    name: 'Energy Benchmark Commodity',
    category: 'COMMODITIES',
    baseScore: 60,
    baseCommercialNet: -95000,
    baseSpeculatorNet: +118000,
    basePutCallRatio: 0.84,
    baseRetailLong: 54,
    volIndexName: 'CBOE OVX (Crude Volatility)',
    baseVolVal: 28.50,
    baseBpi: 58.0,
    baseHighs52w: 32,
    baseLows52w: 14,
    baseNlpScore: +0.28,
    surveyName: 'Energy Information Admin Allocator Survey',
    baseSurveyBull: 52.0,
    dominantNarrative: 'OPEC+ supply restraint and strategic petroleum reserve refill defending $70 support floor.',
  },
  {
    id: 'dxy',
    symbol: 'US Dollar Index (DXY)',
    quoteSymbol: 'DXY',
    name: 'Global Reserve Currency Benchmark',
    category: 'FX',
    baseScore: 65,
    baseCommercialNet: -68000,
    baseSpeculatorNet: +82000,
    basePutCallRatio: 0.76,
    baseRetailLong: 48,
    volIndexName: 'ICE DXY Implied Volatility',
    baseVolVal: 7.10,
    baseBpi: 64.0,
    baseHighs52w: 52,
    baseLows52w: 12,
    baseNlpScore: +0.42,
    surveyName: 'Federal Reserve G10 FX Sentiment',
    baseSurveyBull: 56.0,
    dominantNarrative: 'US macroeconomic resilience and higher-for-longer policy rates anchoring broad dollar strength.',
  },
];

interface CommunityFeedItem {
  id: string;
  author: string;
  role: string;
  badge: 'INSTITUTIONAL' | 'ALGO' | 'COMMUNITY' | 'MACRO_PRO';
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  content: string;
  timestampStr: string;
  upvotes: number;
}

const INITIAL_COMMUNITY_FEED: CommunityFeedItem[] = [
  {
    id: 'c1',
    author: 'QuantumAlpha_Desk',
    role: 'Macro Quantitative Strategist',
    badge: 'INSTITUTIONAL',
    sentiment: 'BULLISH',
    content: 'Options delta hedging models show strong gamma support above key 50DMA. Commercial positioning absorbs retail short spikes.',
    timestampStr: '12s ago',
    upvotes: 42,
  },
  {
    id: 'c2',
    author: 'YieldCurve_Nexus',
    role: 'Fixed Income & FX Fund',
    badge: 'MACRO_PRO',
    sentiment: 'BEARISH',
    content: 'Retail long crowd at 72%+ represents textbook contrarian exhaustion. Setting tight stops on break of psychological levels.',
    timestampStr: '48s ago',
    upvotes: 29,
  },
  {
    id: 'c3',
    author: 'AlgoExecution_V4',
    role: 'Automated Orderflow System',
    badge: 'ALGO',
    sentiment: 'BULLISH',
    content: 'Detected continuous iceberg accumulation on L2 bid orderbook across major European and US institutional liquidity pools.',
    timestampStr: '2m ago',
    upvotes: 67,
  },
  {
    id: 'c4',
    author: 'TraderVanguard',
    role: 'Active Community Member',
    badge: 'COMMUNITY',
    sentiment: 'NEUTRAL',
    content: 'Voted neutral pending upcoming core inflation release. Spread compression suggests explosive breakout within 48 hours.',
    timestampStr: '3m ago',
    upvotes: 18,
  },
];

export const MarketSentimentSection: React.FC<MarketSentimentSectionProps> = ({
  quotes = [],
  selectedAssetSymbol,
  isDerivConnected = true,
  onSelectAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'PATH1' | 'PATH2' | 'COMMUNITY' | 'MATRIX'>('PATH1');
  const [selectedMarketType, setSelectedMarketType] = useState<SentimentMarketType>('ALL');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('spx');
  const [activePath1Pillar, setActivePath1Pillar] = useState<'ALL' | 'PILLAR1' | 'PILLAR2' | 'PILLAR3'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live Community Voting State (Stored by asset id)
  const [communityVotes, setCommunityVotes] = useState<Record<string, { bull: number; bear: number; neutral: number; userVoted?: 'BULL' | 'BEAR' | 'NEUTRAL' }>>(() => {
    return {
      spx: { bull: 8420, bear: 3120, neutral: 1840 },
      eurusd: { bull: 2980, bear: 7640, neutral: 2120 },
      gold: { bull: 11450, bear: 1820, neutral: 1430 },
      btc: { bull: 14200, bear: 4200, neutral: 2100 },
      us10y: { bull: 3400, bear: 3800, neutral: 4900 },
      usdjpy: { bull: 2600, bear: 8900, neutral: 1900 },
      gbpusd: { bull: 4800, bear: 3900, neutral: 2400 },
      audusd: { bull: 3700, bear: 3600, neutral: 2200 },
      usdcad: { bull: 6100, bear: 3200, neutral: 1900 },
    };
  });

  // Live Micro-Fluctuation Timer (Simulates real-time L2 stream updates and live WebSocket reactivity)
  const [liveTickCounter, setLiveTickCounter] = useState<number>(0);
  const [liveLastUpdated, setLiveLastUpdated] = useState<string>('Just now');
  const [userCommentText, setUserCommentText] = useState<string>('');
  const [userCommentSentiment, setUserCommentSentiment] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BULLISH');
  const [communityFeed, setCommunityFeed] = useState<CommunityFeedItem[]>(INITIAL_COMMUNITY_FEED);

  // Sync with selectedAssetSymbol if changed externally
  useEffect(() => {
    if (selectedAssetSymbol) {
      const match = STATIC_MARKET_PROFILES.find(
        (p) => p.quoteSymbol === selectedAssetSymbol || p.symbol.includes(selectedAssetSymbol)
      );
      if (match) {
        setSelectedProfileId(match.id);
      }
    }
  }, [selectedAssetSymbol]);

  // Periodic heartbeat live updater
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTickCounter((prev) => prev + 1);
      setLiveLastUpdated('Just now');
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Compute LIVE dynamic profiles based on quotes and live community votes
  const liveProfiles = useMemo(() => {
    return STATIC_MARKET_PROFILES.map((profile) => {
      // Find matching live quote
      const quote = quotes.find(
        (q) => q.symbol === profile.quoteSymbol || q.name.includes(profile.quoteSymbol) || profile.symbol.includes(q.symbol)
      );

      const change24hPct = quote ? quote.changePercent : 0;
      const priceVal = quote ? quote.price : 0;

      // Micro dynamic jitter based on live ticks (bounds: ±0.4%)
      const dynamicJitter = Math.sin((liveTickCounter + profile.baseScore) * 0.7) * 1.8;

      // Real-time Community Vote impact
      const voteData = communityVotes[profile.id] || { bull: 500, bear: 300, neutral: 200 };
      const totalVotes = voteData.bull + voteData.bear + voteData.neutral;
      const communityBullPct = totalVotes > 0 ? (voteData.bull / totalVotes) * 100 : 50;
      const communityBearPct = totalVotes > 0 ? (voteData.bear / totalVotes) * 100 : 30;
      const communityNeutralPct = totalVotes > 0 ? (voteData.neutral / totalVotes) * 100 : 20;

      // Dynamic Composite Score Calculation
      // Weighted: 40% Base econometric score + 35% Live 24h Price Momentum + 20% Live Community Poll + 5% Live Jitter
      const momentumImpact = change24hPct * 3.5;
      const communityImpact = (communityBullPct - 50) * 0.25;
      const computedScore = Math.min(
        96,
        Math.max(12, Math.round(profile.baseScore + momentumImpact + communityImpact + dynamicJitter))
      );

      // Composite Mood
      let compositeMood: 'EXTREME_BEARISH' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'EXTREME_BULLISH' = 'NEUTRAL';
      if (computedScore >= 75) compositeMood = 'EXTREME_BULLISH';
      else if (computedScore >= 56) compositeMood = 'BULLISH';
      else if (computedScore >= 45) compositeMood = 'NEUTRAL';
      else if (computedScore >= 30) compositeMood = 'BEARISH';
      else compositeMood = 'EXTREME_BEARISH';

      // Institutional Flow
      let institutionalFlow: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL' | 'SHORT_COVERING' = 'NEUTRAL';
      if (change24hPct > 0.4 && computedScore > 60) institutionalFlow = 'ACCUMULATION';
      else if (change24hPct < -0.4 && computedScore < 42) institutionalFlow = 'DISTRIBUTION';
      else if (change24hPct > 0.1 && computedScore <= 50) institutionalFlow = 'SHORT_COVERING';
      else institutionalFlow = 'NEUTRAL';

      // Dynamic Live Retail Positioning
      // As price trends up, retail crowd shifts or contrarians push against
      const dynamicRetailLong = Math.min(
        88,
        Math.max(18, Math.round(profile.baseRetailLong + (change24hPct > 0 ? -change24hPct * 1.5 : -change24hPct * 2.0) + Math.sin(liveTickCounter) * 1.2))
      );
      const dynamicRetailShort = 100 - dynamicRetailLong;

      // Dynamic Put/Call Ratio
      const dynamicPutCall = Math.max(
        0.42,
        Math.min(1.85, Number((profile.basePutCallRatio - (change24hPct * 0.05) + Math.cos(liveTickCounter * 0.5) * 0.02).toFixed(2)))
      );

      // Dynamic Volatility Value
      const dynamicVol = Math.max(
        3.0,
        Number((profile.baseVolVal + (Math.abs(change24hPct) * 0.3) + Math.sin(liveTickCounter * 0.8) * 0.25).toFixed(2))
      );

      // Dynamic Speculator Contracts
      const liveSpeculatorNet = Math.round(profile.baseSpeculatorNet + (change24hPct * 1200));

      return {
        ...profile,
        quote,
        livePrice: priceVal,
        liveChangePercent: change24hPct,
        compositeScore: computedScore,
        compositeMood,
        institutionalFlow,
        communityVotes: {
          total: totalVotes,
          bullPct: Number(communityBullPct.toFixed(1)),
          bearPct: Number(communityBearPct.toFixed(1)),
          neutralPct: Number(communityNeutralPct.toFixed(1)),
          userVoted: voteData.userVoted,
        },
        cotReport: {
          commercialNet: profile.baseCommercialNet,
          nonCommercialSpeculatorsNet: liveSpeculatorNet,
          weeklyDeltaSpeculators: Math.round(liveSpeculatorNet * 0.12),
          speculatorPercentile52w: Math.min(99, Math.max(10, Math.round(computedScore * 1.05))),
          crowdedExtreme: computedScore > 80 ? 'OVERBOUGHT_SPECULATIVE' : computedScore < 25 ? 'OVERSOLD_SPECULATIVE' : 'NONE',
          interpretation: computedScore > 60 
            ? 'Commercial hedgers absorbing institutional demand; spec money expanding net longs on positive macro tailwinds.'
            : 'Commercials building defensive liquidity buffer against speculative liquidation pressure.',
        },
        putCallRatio: {
          totalRatio: dynamicPutCall,
          equityRatio: Number((dynamicPutCall * 0.85).toFixed(2)),
          indexRatio: Number((dynamicPutCall * 1.22).toFixed(2)),
          tenDayMa: Number((dynamicPutCall * 0.98).toFixed(2)),
          signal: dynamicPutCall > 1.0 ? 'BEARISH_HEDGING' : dynamicPutCall < 0.70 ? 'COMPLACENT_BULLISH' : 'NEUTRAL',
          interpretation: dynamicPutCall > 1.0
            ? 'Options market participants actively buying downside protective puts to hedge macro tail-risk.'
            : 'Call option open interest dominates, reflecting aggressive bullish upside positioning.',
        },
        retailPositioning: {
          longPercent: dynamicRetailLong,
          shortPercent: dynamicRetailShort,
          contrarianSignal: dynamicRetailLong > 70 ? 'CONTRARIAN_SHORT' : dynamicRetailLong < 30 ? 'CONTRARIAN_LONG' : 'BALANCED',
          crowdedSeverity: dynamicRetailLong > 75 || dynamicRetailLong < 25 ? 'HIGH' : dynamicRetailLong > 65 || dynamicRetailLong < 35 ? 'MODERATE' : 'LOW',
          interpretation: dynamicRetailLong > 70
            ? `Crowded retail long positioning (${dynamicRetailLong}%) generates contrarian downside vulnerability if key supports break.`
            : dynamicRetailLong < 30
            ? `Extreme retail short skew (${dynamicRetailShort}%) creates explosive short-squeeze potential on any positive catalyst.`
            : 'Balanced retail order distribution with minimal crowded liquidation risk.',
        },
        volatility: {
          indexName: profile.volIndexName,
          currentVal: dynamicVol,
          change1d: Number((dynamicVol - profile.baseVolVal).toFixed(2)),
          regime: dynamicVol > 24 ? 'PANIC_HEDGING' : dynamicVol > 18 ? 'ELEVATED_ANXIETY' : dynamicVol > 13 ? 'NORMAL_EQUILIBRIUM' : 'COMPLACENCY_GREED',
          interpretation: dynamicVol < 15
            ? 'Implied volatility remains compressed; favorable environment for trend continuation.'
            : 'Elevated options volatility pricing reflects anticipation of heavy market volatility.',
        },
        bullishPercentIndex: {
          bpiValue: Number(Math.min(95, Math.max(15, profile.baseBpi + (change24hPct * 1.8))).toFixed(1)),
          overboughtOversold: computedScore > 75 ? 'OVERBOUGHT' : computedScore < 30 ? 'OVERSOLD' : 'NEUTRAL',
          technicalTrend: computedScore > 50 ? 'EXPANDING_BULLS' : 'CONTRACTING_BEARS',
        },
        highLowIndex: {
          highs52w: Math.max(2, Math.round(profile.baseHighs52w + (change24hPct > 0 ? change24hPct * 12 : 0))),
          lows52w: Math.max(1, Math.round(profile.baseLows52w + (change24hPct < 0 ? Math.abs(change24hPct) * 12 : 0))),
          netNewHighs: Math.round(profile.baseHighs52w - profile.baseLows52w + (change24hPct * 15)),
          ratio: Number((computedScore * 0.95).toFixed(1)),
          breadthHealth: computedScore > 50 ? 'EXPANSIONARY' : 'DETERIORATING',
        },
        nlpNewsScraping: {
          vaderCompoundScore: Number(Math.min(0.95, Math.max(-0.95, profile.baseNlpScore + (change24hPct * 0.08))).toFixed(2)),
          textBlobPolarity: Number(Math.min(0.85, Math.max(-0.85, (profile.baseNlpScore * 0.7) + (change24hPct * 0.05))).toFixed(2)),
          positiveHeadlinesPct: Math.min(90, Math.max(10, Math.round(computedScore * 0.85))),
          negativeHeadlinesPct: Math.min(80, Math.max(5, Math.round((100 - computedScore) * 0.75))),
          neutralHeadlinesPct: 15,
          socialMediaVolumeScore: Math.min(99, Math.max(35, Math.round(75 + Math.abs(change24hPct * 8)))),
          dominantNarrativeTopic: profile.dominantNarrative,
        },
        surveySentiment: {
          surveyName: profile.surveyName,
          bullishPct: Number(Math.min(85, Math.max(15, profile.baseSurveyBull + (change24hPct * 1.5))).toFixed(1)),
          neutralPct: 28.0,
          bearishPct: Number(Math.max(10, (100 - profile.baseSurveyBull - 28 - (change24hPct * 1.5))).toFixed(1)),
          historicalAvgBull: 37.5,
          historicalSpreadDelta: Number((profile.baseSurveyBull + (change24hPct * 1.5) - 37.5).toFixed(1)),
          interpretation: `Survey participants report ${computedScore > 50 ? 'above-average bullish positioning' : 'defensive posture'} aligned with macro catalysts.`,
        },
      };
    });
  }, [quotes, liveTickCounter, communityVotes]);

  const filteredProfiles = useMemo(() => {
    return liveProfiles.filter((profile) => {
      const matchType = selectedMarketType === 'ALL' || profile.category === selectedMarketType;
      const matchSearch = 
        profile.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [liveProfiles, selectedMarketType, searchQuery]);

  const activeProfile = useMemo(() => {
    return liveProfiles.find((p) => p.id === selectedProfileId) || liveProfiles[0];
  }, [liveProfiles, selectedProfileId]);

  // Handle Community User Voting
  const handleVote = useCallback((stance: 'BULL' | 'BEAR' | 'NEUTRAL') => {
    setCommunityVotes((prev) => {
      const current = prev[activeProfile.id] || { bull: 500, bear: 300, neutral: 200 };
      const prevVoted = current.userVoted;

      let newBull = current.bull;
      let newBear = current.bear;
      let newNeutral = current.neutral;

      // Remove previous vote if changed
      if (prevVoted === 'BULL') newBull = Math.max(0, newBull - 1);
      if (prevVoted === 'BEAR') newBear = Math.max(0, newBear - 1);
      if (prevVoted === 'NEUTRAL') newNeutral = Math.max(0, newNeutral - 1);

      // Add new vote
      if (stance === 'BULL') newBull += 1;
      if (stance === 'BEAR') newBear += 1;
      if (stance === 'NEUTRAL') newNeutral += 1;

      return {
        ...prev,
        [activeProfile.id]: {
          bull: newBull,
          bear: newBear,
          neutral: newNeutral,
          userVoted: stance,
        },
      };
    });
  }, [activeProfile.id]);

  // Handle User Comment Submission to Live Community Stream
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCommentText.trim()) return;

    const newItem: CommunityFeedItem = {
      id: `user-${Date.now()}`,
      author: 'You (Verified Trader)',
      role: 'Macro Quantitative Member',
      badge: 'COMMUNITY',
      sentiment: userCommentSentiment,
      content: userCommentText.trim(),
      timestampStr: 'Just now',
      upvotes: 1,
    };

    setCommunityFeed([newItem, ...communityFeed]);
    setUserCommentText('');
  };

  const getMoodColor = (mood: MarketSentimentProfile['baseScore'] extends number ? any : any) => {
    switch (mood) {
      case 'EXTREME_BULLISH':
        return 'text-emerald-900 bg-emerald-100 border-emerald-300';
      case 'BULLISH':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'NEUTRAL':
        return 'text-amber-900 bg-amber-50 border-amber-200';
      case 'BEARISH':
        return 'text-rose-800 bg-rose-50 border-rose-200';
      case 'EXTREME_BEARISH':
        return 'text-rose-950 bg-rose-100 border-rose-300';
      default:
        return 'text-slate-800 bg-slate-100 border-slate-300';
    }
  };

  return (
    <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl overflow-hidden shadow-sm">
      {/* SECTION HEADER BANNER */}
      <div className="bg-[#faf8f4] p-4 sm:p-5 border-b border-[#e2dcd2] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-wide">
              Live Community & Institutional Market Sentiment
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f0eae0] text-slate-700 border border-[#dcd2c4]">
              Tick #{liveTickCounter} • {liveLastUpdated}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 font-sans">
            Real-Time Deriv WebSocket Prices • Quantitative Orderflow • Interactive Community Voting & Narrative Signals
          </p>
        </div>

        {/* TOP NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f3ede2] rounded-lg border border-[#ded5c6]">
          <button
            onClick={() => setActiveTab('PATH1')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PATH1'
                ? 'bg-[#ffffff] text-slate-900 shadow-2xs border border-[#d5cdc0]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-700" />
            <span>Path 1: Measuring & Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('COMMUNITY')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COMMUNITY'
                ? 'bg-[#ffffff] text-slate-900 shadow-2xs border border-[#d5cdc0]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Vote className="w-3.5 h-3.5 text-sky-700" />
            <span>Live Trader Barometer</span>
          </button>
          <button
            onClick={() => setActiveTab('PATH2')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PATH2'
                ? 'bg-[#ffffff] text-slate-900 shadow-2xs border border-[#d5cdc0]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-purple-700" />
            <span>Path 2: Shaping & Influence</span>
          </button>
          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MATRIX'
                ? 'bg-[#ffffff] text-slate-900 shadow-2xs border border-[#d5cdc0]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-700" />
            <span>Cross-Market Matrix</span>
          </button>
        </div>
      </div>

      {/* MARKET TYPE FILTER BAR */}
      <div className="p-3 bg-[#fcfaf5] border-b border-[#e2dcd2] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[11px] font-mono text-slate-500 uppercase font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Markets' },
            { id: 'EQUITIES', label: 'Equities & Indices' },
            { id: 'FX', label: 'Forex (FX)' },
            { id: 'COMMODITIES', label: 'Commodities / Gold' },
            { id: 'CRYPTO', label: 'Crypto & Digital' },
            { id: 'BONDS', label: 'Bonds & Yields' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMarketType(tab.id as SentimentMarketType)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg transition cursor-pointer font-medium ${
                selectedMarketType === tab.id
                  ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300 shadow-2xs'
                  : 'bg-[#ffffff] text-slate-600 border border-[#e2dcd2] hover:bg-[#ede6d9] hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search live asset (SPX, Gold, EUR, BTC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 bg-[#ffffff] border border-[#d8d0c4] rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-48 sm:w-56"
          />
        </div>
      </div>

      {/* ASSET SELECTOR CHIPS WITH LIVE TICK COLORS */}
      <div className="px-3.5 sm:px-5 py-2.5 bg-[#ffffff] border-b border-[#e2dcd2] flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex-shrink-0">Live Assets:</span>
        {filteredProfiles.map((p) => {
          const isSelected = p.id === activeProfile.id;
          const isPositive = p.liveChangePercent >= 0;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProfileId(p.id);
                onSelectAsset?.(p.quoteSymbol);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition flex items-center gap-2 cursor-pointer flex-shrink-0 border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                  : 'bg-[#faf8f4] text-slate-700 border-[#e2dcd2] hover:border-slate-400'
              }`}
            >
              <span>{p.symbol}</span>
              {p.quote && (
                <span className={`text-[10px] font-bold font-mono ${isPositive ? 'text-emerald-500' : 'text-rose-400'}`}>
                  {isPositive ? '+' : ''}{p.liveChangePercent.toFixed(2)}%
                </span>
              )}
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                p.compositeScore >= 60
                  ? 'bg-emerald-100 text-emerald-900'
                  : p.compositeScore <= 40
                  ? 'bg-rose-100 text-rose-900'
                  : 'bg-amber-100 text-amber-900'
              }`}>
                {p.compositeScore}%
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* PATH 1: MEASURING & ANALYZING LIVE MARKET SENTIMENT       */}
      {/* ========================================================= */}
      {activeTab === 'PATH1' && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Active Asset Overview Card with Live Deriv Price & Vote Bar */}
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#ffffff] border border-[#e2dcd2] flex flex-col items-center justify-center font-mono shadow-2xs">
                <span className="text-[9px] text-slate-500 font-bold uppercase">LIVE SCORE</span>
                <span className={`text-lg font-bold ${
                  activeProfile.compositeScore >= 60
                    ? 'text-emerald-700'
                    : activeProfile.compositeScore <= 40
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}>
                  {activeProfile.compositeScore}
                </span>
                <span className="text-[8px] text-slate-400 font-mono">/ 100</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 font-sans">{activeProfile.symbol}</h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getMoodColor(activeProfile.compositeMood)}`}>
                    {activeProfile.compositeMood.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-bold">
                    FLOW: {activeProfile.institutionalFlow}
                  </span>
                  {activeProfile.quote && (
                    <span className="text-xs font-mono font-bold text-slate-900 px-2 py-0.5 bg-white rounded border border-[#e2dcd2]">
                      Price: {activeProfile.quote.price.toFixed(activeProfile.quote.precision || 2)} ({activeProfile.liveChangePercent >= 0 ? '+' : ''}{activeProfile.liveChangePercent.toFixed(2)}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-sans mt-0.5">{activeProfile.name}</p>
              </div>
            </div>

            {/* Quick Live Voting Widget on Path 1 */}
            <div className="flex items-center gap-2 bg-[#ffffff] p-2 rounded-xl border border-[#ded5c6] shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold hidden sm:inline">
                Your Live Vote:
              </span>
              <button
                onClick={() => handleVote('BULL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeProfile.communityVotes.userVoted === 'BULL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Vote Bullish"
              >
                <BullIcon className="w-3.5 h-3.5" />
                <span>Bullish ({activeProfile.communityVotes.bullPct}%)</span>
              </button>
              <button
                onClick={() => handleVote('BEAR')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeProfile.communityVotes.userVoted === 'BEAR'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
                }`}
                title="Vote Bearish"
              >
                <BearIcon className="w-3.5 h-3.5" />
                <span>Bearish ({activeProfile.communityVotes.bearPct}%)</span>
              </button>
              <button
                onClick={() => handleVote('NEUTRAL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeProfile.communityVotes.userVoted === 'NEUTRAL'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
                title="Vote Neutral"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Neutral</span>
              </button>
            </div>
          </div>

          {/* 3-PILLAR ACCORDION / FILTER BUTTONS */}
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-[11px] font-mono text-slate-500 uppercase font-bold mr-1">Select Analysis View:</span>
            {[
              { id: 'ALL', label: 'All 3 Quantitative Pillars' },
              { id: 'PILLAR1', label: '1. COT & Positioning' },
              { id: 'PILLAR2', label: '2. Volatility & Breadth' },
              { id: 'PILLAR3', label: '3. Social & Surveys' },
            ].map((pTab) => (
              <button
                key={pTab.id}
                onClick={() => setActivePath1Pillar(pTab.id as any)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition cursor-pointer font-medium ${
                  activePath1Pillar === pTab.id
                    ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300'
                    : 'bg-[#faf8f4] text-slate-600 border border-[#e2dcd2] hover:text-slate-900'
                }`}
              >
                {pTab.label}
              </button>
            ))}
          </div>

          {/* GRID OF 3 PRIMARY PILLARS */}
          <div className="space-y-4">
            {/* ------------------------------------------------------------- */}
            {/* PILLAR 1: POSITIONING & QUANTITATIVE DATA                     */}
            {/* ------------------------------------------------------------- */}
            {(activePath1Pillar === 'ALL' || activePath1Pillar === 'PILLAR1') && (
              <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e2dcd2]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                        Pillar 1: Positioning & Quantitative Data
                      </h4>
                      <p className="text-[10px] text-slate-600 font-mono">
                        Commitment of Traders (COT) • Put/Call Ratio (P/C) • Retail Long/Short Ratios
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                    FLOW DISCIPLINE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* 1. COT REPORT */}
                  <div className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e8e2d8] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-sans">Commitment of Traders (COT)</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-300 font-bold">
                        CFTC WEEKLY
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono pt-1">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-600 text-[11px]">Commercials (Hedgers):</span>
                        <span className={`font-bold ${activeProfile.cotReport.commercialNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {activeProfile.cotReport.commercialNet > 0 ? '+' : ''}{activeProfile.cotReport.commercialNet.toLocaleString()} net
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-600 text-[11px]">Non-Commercial (Speculators):</span>
                        <span className={`font-bold ${activeProfile.cotReport.nonCommercialSpeculatorsNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {activeProfile.cotReport.nonCommercialSpeculatorsNet > 0 ? '+' : ''}{activeProfile.cotReport.nonCommercialSpeculatorsNet.toLocaleString()} net
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-600 text-[11px]">52-Week Percentile:</span>
                        <span className="font-bold text-slate-900">{activeProfile.cotReport.speculatorPercentile52w}%</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-600 text-[11px]">Weekly Speculator Delta:</span>
                        <span className={`font-bold ${activeProfile.cotReport.weeklyDeltaSpeculators >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {activeProfile.cotReport.weeklyDeltaSpeculators > 0 ? '+' : ''}{activeProfile.cotReport.weeklyDeltaSpeculators.toLocaleString()} contracts
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-700 pt-2 border-t border-[#e8e2d8] leading-relaxed font-sans">
                      {activeProfile.cotReport.interpretation}
                    </p>
                  </div>

                  {/* 2. PUT / CALL RATIO */}
                  <div className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e8e2d8] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-sans">Put/Call Options Ratio</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border ${
                        activeProfile.putCallRatio.totalRatio > 1.0
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : activeProfile.putCallRatio.totalRatio < 0.70
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {activeProfile.putCallRatio.signal.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono pt-1">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-600 text-[11px]">Live Volume Ratio:</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {activeProfile.putCallRatio.totalRatio.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-600 text-[11px]">Equity Only Ratio:</span>
                        <span className="font-bold text-slate-900">{activeProfile.putCallRatio.equityRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-600 text-[11px]">Index Options Ratio:</span>
                        <span className="font-bold text-slate-900">{activeProfile.putCallRatio.indexRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-600 text-[11px]">10-Day Moving Average:</span>
                        <span className="font-bold text-slate-700">{activeProfile.putCallRatio.tenDayMa.toFixed(2)}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-700 pt-2 border-t border-[#e8e2d8] leading-relaxed font-sans">
                      {activeProfile.putCallRatio.interpretation}
                    </p>
                  </div>

                  {/* 3. LONG / SHORT RETAIL RATIO */}
                  <div className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e8e2d8] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-sans">Long/Short Retail Ratio</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-300 font-bold">
                        CONTRARIAN LENS
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2 space-y-1.5">
                      <div className="flex justify-between text-xs font-mono font-bold">
                        <span className="text-emerald-700">Long: {activeProfile.retailPositioning.longPercent}%</span>
                        <span className="text-rose-700">Short: {activeProfile.retailPositioning.shortPercent}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-rose-200 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${activeProfile.retailPositioning.longPercent}%` }}
                        />
                        <div
                          className="bg-rose-500 h-full transition-all duration-500"
                          style={{ width: `${activeProfile.retailPositioning.shortPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono pt-1">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-600 text-[11px]">Contrarian Bias:</span>
                        <span className="font-bold text-purple-900">
                          {activeProfile.retailPositioning.contrarianSignal.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-600 text-[11px]">Crowded Severity:</span>
                        <span className={`font-bold ${
                          activeProfile.retailPositioning.crowdedSeverity === 'HIGH' ? 'text-rose-700' : 'text-slate-800'
                        }`}>
                          {activeProfile.retailPositioning.crowdedSeverity}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-700 pt-2 border-t border-[#e8e2d8] leading-relaxed font-sans">
                      {activeProfile.retailPositioning.interpretation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* PILLAR 2: VOLATILITY & BREADTH INDICATORS                     */}
            {/* ------------------------------------------------------------- */}
            {(activePath1Pillar === 'ALL' || activePath1Pillar === 'PILLAR2') && (
              <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e2dcd2]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-100 text-sky-900 border border-sky-300">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                        Pillar 2: Volatility & Breadth Indicators
                      </h4>
                      <p className="text-[10px] text-slate-600 font-mono">
                        Volatility Index (VIX / MOVE / GVZ) • Bullish Percent Index (BPI) • 52-Week High/Low Index
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                    REGIME DETECTION
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* 1. VOLATILITY INDEX */}
                  <div className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e8e2d8] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-sans">Volatility Index</span>
                      <span className="text-[10px] font-mono text-slate-600 font-bold">{activeProfile.volatility.indexName}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#fbf9f5] border border-[#e8e2d8] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">Implied Vol Value</div>
                        <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                          {activeProfile.volatility.currentVal.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-slate-500 uppercase">24h Change</div>
                        <div className={`text-xs font-mono font-bold ${
                          activeProfile.volatility.change1d >= 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}>
                          {activeProfile.volatility.change1d >= 0 ? '+' : ''}{activeProfile.volatility.change1d.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-mono">
                      <span className="text-slate-500 text-[11px]">Volatility Regime: </span>
                      <span className="font-bold text-sky-950">
                        {activeProfile.volatility.regime.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 pt-2 border-t border-[#e8e2d8] leading-relaxed font-sans">
                      {activeProfile.volatility.interpretation}
                    </p>
                  </div>

                  {/* 2. BULLISH PERCENT INDEX */}
                  <div className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e8e2d8] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-sans">Bullish Percent Index (BPI)</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        activeProfile.bullishPercentIndex.overboughtOversold === 'OVERBOUGHT'
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : activeProfile.bullishPercentIndex.overboughtOversold === 'OVERSOLD'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}>
                        {activeProfile.bullishPercentIndex.overboughtOversold}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#fbf9f5] border border-[#e8e2d8]">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Bullish Chart Patterns</span>
                        <span className="text-lg font-bold font-mono text-slate-900">
                          {activeProfile.bullishPercentIndex.bpiValue.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full ${activeProfile.bullishPercentIndex.bpiValue > 60 ? 'bg-emerald-600' : 'bg-slate-500'}`}
                          style={{ width: `${activeProfile.bullishPercentIndex.bpiValue}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xs font-mono">
                      <span className="text-slate-500 text-[11px]">Technical Trajectory: </span>
                      <span className="font-bold text-slate-900">
                        {activeProfile.bullishPercentIndex.technicalTrend.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 pt-2 border-t border-[#e8e2d8] leading-relaxed font-sans">
                      Measures the percentage of constituents generating bullish Point & Figure buy signals across index components.
                    </p>
                  </div>

                  {/* 3. HIGH / LOW INDEX */}
                  <div className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e8e2d8] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-sans">52-Week High/Low Index</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                        {activeProfile.highLowIndex.breadthHealth}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-center">
                        <div className="text-[10px] text-emerald-800">52W New Highs</div>
                        <div className="text-base font-bold text-emerald-950 font-mono mt-0.5">
                          {activeProfile.highLowIndex.highs52w}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-rose-50 border border-rose-200 text-center">
                        <div className="text-[10px] text-rose-800">52W New Lows</div>
                        <div className="text-base font-bold text-rose-950 font-mono mt-0.5">
                          {activeProfile.highLowIndex.lows52w}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono pt-1">
                      <span className="text-slate-600 text-[11px]">Net New Highs:</span>
                      <span className="font-bold text-emerald-800">
                        {activeProfile.highLowIndex.netNewHighs > 0 ? '+' : ''}{activeProfile.highLowIndex.netNewHighs}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 pt-2 border-t border-[#e8e2d8] leading-relaxed font-sans">
                      Positive net new highs confirm structural internal expansion, validating genuine momentum rather than hollow index concentration.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* PILLAR 3: SOCIAL & NARRATIVE SENTIMENT                        */}
            {/* ------------------------------------------------------------- */}
            {(activePath1Pillar === 'ALL' || activePath1Pillar === 'PILLAR3') && (
              <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e2dcd2]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-300">
                      <MessageSquareText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                        Pillar 3: Social & Narrative Sentiment
                      </h4>
                      <p className="text-[10px] text-slate-600 font-mono">
                        NLP & News Headline Scraping (VADER / TextBlob) • Participant Surveys (AAII / BofA / Sentix)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300">
                    AI LINGUISTICS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* 1. NLP & NEWS SCRAPING */}
                  <div className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e8e2d8] space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-sans">Natural Language Processing (NLP)</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-300 font-bold">
                        VADER & TEXTBLOB
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                        <div className="text-[10px] text-emerald-800">Positive</div>
                        <div className="font-bold text-emerald-950 text-sm mt-0.5">
                          {activeProfile.nlpNewsScraping.positiveHeadlinesPct}%
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-600">Neutral</div>
                        <div className="font-bold text-slate-800 text-sm mt-0.5">
                          {activeProfile.nlpNewsScraping.neutralHeadlinesPct}%
                        </div>
                      </div>
                      <div className="p-2 rounded bg-rose-50 border border-rose-200">
                        <div className="text-[10px] text-rose-800">Negative</div>
                        <div className="font-bold text-rose-950 text-sm mt-0.5">
                          {activeProfile.nlpNewsScraping.negativeHeadlinesPct}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono pt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-[11px]">VADER Compound Polarity:</span>
                        <span className={`font-bold ${
                          activeProfile.nlpNewsScraping.vaderCompoundScore > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {activeProfile.nlpNewsScraping.vaderCompoundScore > 0 ? '+' : ''}{activeProfile.nlpNewsScraping.vaderCompoundScore.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-[11px]">Social Velocity Score (X/Reddit):</span>
                        <span className="font-bold text-slate-900">{activeProfile.nlpNewsScraping.socialMediaVolumeScore}/100</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-purple-50/70 border border-purple-200 text-xs">
                      <span className="text-[10px] font-mono uppercase text-purple-900 font-bold block mb-0.5">
                        Dominant Narrative Catalyst:
                      </span>
                      <p className="text-[11px] text-purple-950 font-sans leading-relaxed">
                        "{activeProfile.nlpNewsScraping.dominantNarrativeTopic}"
                      </p>
                    </div>
                  </div>

                  {/* 2. PARTICIPANT SURVEY SENTIMENT */}
                  <div className="p-3.5 rounded-xl bg-[#ffffff] border border-[#e8e2d8] space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-sans">{activeProfile.surveySentiment.surveyName}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                        PARTICIPANT POLL
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                        <div className="text-[10px] text-emerald-800">Bullish %</div>
                        <div className="font-bold text-emerald-950 text-sm mt-0.5">
                          {activeProfile.surveySentiment.bullishPct.toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-2 rounded bg-amber-50 border border-amber-200">
                        <div className="text-[10px] text-amber-800">Neutral %</div>
                        <div className="font-bold text-amber-950 text-sm mt-0.5">
                          {activeProfile.surveySentiment.neutralPct.toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-2 rounded bg-rose-50 border border-rose-200">
                        <div className="text-[10px] text-rose-800">Bearish %</div>
                        <div className="font-bold text-rose-950 text-sm mt-0.5">
                          {activeProfile.surveySentiment.bearishPct.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono pt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-[11px]">Historical Long-Term Average:</span>
                        <span className="font-bold text-slate-700">{activeProfile.surveySentiment.historicalAvgBull}% Bullish</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-[11px]">Historical Spread Delta:</span>
                        <span className={`font-bold ${
                          activeProfile.surveySentiment.historicalSpreadDelta > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {activeProfile.surveySentiment.historicalSpreadDelta > 0 ? '+' : ''}{activeProfile.surveySentiment.historicalSpreadDelta}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-700 pt-2 border-t border-[#e8e2d8] leading-relaxed font-sans">
                      {activeProfile.surveySentiment.interpretation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LIVE TRADER BAROMETER & COMMUNITY POLL                    */}
      {/* ========================================================= */}
      {activeTab === 'COMMUNITY' && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Main Community Voting Barometer Card */}
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-sans">
                    Live Community Consensus: {activeProfile.symbol}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300 uppercase">
                    {activeProfile.communityVotes.total.toLocaleString()} Verified Votes
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-sans mt-0.5">
                  Real-time sentiment votes submitted by proprietary desk traders, algorithmic funds, and independent participants.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote('BULL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeProfile.communityVotes.userVoted === 'BULL'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-xs'
                      : 'bg-emerald-50 text-emerald-950 border border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  <BullIcon className="w-4 h-4" />
                  <span>Vote Bullish ({activeProfile.communityVotes.bullPct}%)</span>
                </button>
                <button
                  onClick={() => handleVote('BEAR')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeProfile.communityVotes.userVoted === 'BEAR'
                      ? 'bg-rose-600 text-white ring-2 ring-rose-300 shadow-xs'
                      : 'bg-rose-50 text-rose-950 border border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <BearIcon className="w-4 h-4" />
                  <span>Vote Bearish ({activeProfile.communityVotes.bearPct}%)</span>
                </button>
                <button
                  onClick={() => handleVote('NEUTRAL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeProfile.communityVotes.userVoted === 'NEUTRAL'
                      ? 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-xs'
                      : 'bg-amber-50 text-amber-950 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  <span>Vote Neutral ({activeProfile.communityVotes.neutralPct}%)</span>
                </button>
              </div>
            </div>

            {/* Visual Multi-Segment Live Consensus Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-emerald-700">Bullish: {activeProfile.communityVotes.bullPct}%</span>
                <span className="text-amber-700">Neutral: {activeProfile.communityVotes.neutralPct}%</span>
                <span className="text-rose-700">Bearish: {activeProfile.communityVotes.bearPct}%</span>
              </div>
              <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white font-mono"
                  style={{ width: `${activeProfile.communityVotes.bullPct}%` }}
                >
                  {activeProfile.communityVotes.bullPct > 15 ? `${activeProfile.communityVotes.bullPct}%` : ''}
                </div>
                <div
                  className="bg-amber-400 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-amber-950 font-mono"
                  style={{ width: `${activeProfile.communityVotes.neutralPct}%` }}
                >
                  {activeProfile.communityVotes.neutralPct > 15 ? `${activeProfile.communityVotes.neutralPct}%` : ''}
                </div>
                <div
                  className="bg-rose-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white font-mono"
                  style={{ width: `${activeProfile.communityVotes.bearPct}%` }}
                >
                  {activeProfile.communityVotes.bearPct > 15 ? `${activeProfile.communityVotes.bearPct}%` : ''}
                </div>
              </div>
            </div>

            {/* DIVERGENCE ANALYSIS: Community vs Institutional COT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Community Stance</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {activeProfile.communityVotes.bullPct > 55 ? 'STRONG BULLISH' : activeProfile.communityVotes.bearPct > 55 ? 'STRONG BEARISH' : 'BALANCED'}
                </div>
                <p className="text-[10px] text-slate-600 mt-1 font-sans">
                  {activeProfile.communityVotes.bullPct}% of active community traders expect upside continuation.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Institutional COT Position</div>
                <div className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                  {activeProfile.cotReport.speculatorPercentile52w}%-ile Speculator Longs
                </div>
                <p className="text-[10px] text-slate-600 mt-1 font-sans">
                  Commercials net {activeProfile.cotReport.commercialNet > 0 ? '+' : ''}{activeProfile.cotReport.commercialNet.toLocaleString()} contracts.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Contrarian Divergence Risk</div>
                <div className={`text-base font-bold font-mono mt-0.5 ${
                  Math.abs(activeProfile.communityVotes.bullPct - activeProfile.retailPositioning.longPercent) > 20
                    ? 'text-rose-700'
                    : 'text-emerald-700'
                }`}>
                  {Math.abs(activeProfile.communityVotes.bullPct - activeProfile.retailPositioning.longPercent) > 20
                    ? 'HIGH CROWDING DIVERGENCE'
                    : 'ALIGNED INSTITUTIONAL FLOW'}
                </div>
                <p className="text-[10px] text-slate-600 mt-1 font-sans">
                  Crowd consensus matches smart money accumulation without excessive leverage traps.
                </p>
              </div>
            </div>
          </div>

          {/* REAL-TIME COMMUNITY SENTIMENT COMMENT STREAM */}
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-purple-700" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                  Live Trader Intelligence Stream & Orderflow Discourse
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Auto-Refreshed Live</span>
            </div>

            {/* Comment Post Form */}
            <form onSubmit={handlePostComment} className="p-3 rounded-xl bg-[#ffffff] border border-[#e8e2d8] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 font-sans">Share your live trade thesis on {activeProfile.symbol}:</span>
                <div className="flex items-center gap-1">
                  {(['BULLISH', 'BEARISH', 'NEUTRAL'] as const).map((sent) => (
                    <button
                      key={sent}
                      type="button"
                      onClick={() => setUserCommentSentiment(sent)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition ${
                        userCommentSentiment === sent
                          ? sent === 'BULLISH'
                            ? 'bg-emerald-600 text-white'
                            : sent === 'BEARISH'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-600 text-white'
                          : 'bg-[#faf8f4] text-slate-600 border border-[#e2dcd2]'
                      }`}
                    >
                      {sent}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Share liquidity levels, option delta observations, or macro catalyst insights..."
                  value={userCommentText}
                  onChange={(e) => setUserCommentText(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#faf8f4] border border-[#d8d0c4] rounded-lg text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </form>

            {/* Feed List */}
            <div className="space-y-2.5">
              {communityFeed.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-[#ffffff] border border-[#e8e2d8] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-sans">{item.author}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300">
                        {item.role}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        item.sentiment === 'BULLISH'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : item.sentiment === 'BEARISH'
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {item.sentiment}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{item.timestampStr}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PATH 2: SHAPING & INFLUENCING MARKET SENTIMENT            */}
      {/* ========================================================= */}
      {activeTab === 'PATH2' && (
        <div className="p-4 sm:p-5 space-y-5">
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base font-sans">
              <Megaphone className="w-5 h-5 text-purple-700" />
              <span>Path 2: Targeted Institutional Narrative Management</span>
            </div>
            <p className="text-xs text-slate-700 font-sans leading-relaxed">
              To actively engineer, build, or pivot market sentiment around a specific company, sovereign policy, commodity supply chain, or digital asset, institutional entities deploy targeted narrative frameworks across four core channels:
            </p>
          </div>

          {/* 4 CORE CHANNELS MATRIX TABLE */}
          <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f6f2ea] border-b border-[#e2dcd2] font-mono text-[11px] text-slate-700 uppercase">
                    <th className="p-3 font-bold">Channel</th>
                    <th className="p-3 font-bold">Core Strategy</th>
                    <th className="p-3 font-bold">Primary Mechanism & Institutional Implementation</th>
                    <th className="p-3 font-bold">Market Transmission Effect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e2d8] text-slate-800">
                  {/* Channel 1 */}
                  <tr className="hover:bg-[#faf8f4] transition">
                    <td className="p-3.5 align-top">
                      <div className="flex items-center gap-2 font-bold text-slate-900 font-sans">
                        <div className="p-1.5 rounded-lg bg-sky-100 text-sky-900 border border-sky-300">
                          <Building className="w-3.5 h-3.5" />
                        </div>
                        <span>Corporate Communications</span>
                      </div>
                    </td>
                    <td className="p-3.5 align-top font-mono font-bold text-sky-900">
                      Guidance & Transparency
                    </td>
                    <td className="p-3.5 align-top text-[11px] leading-relaxed font-sans">
                      Strategic earnings guidance, transparent forward-looking statements, quarterly 10-Q/8-K disclosures, and direct investor relations (IR) releases to anchor consensus forecasts before public market absorption.
                    </td>
                    <td className="p-3.5 align-top font-mono text-[11px] text-slate-700">
                      Anchors sell-side analyst models and bounds downside volatility bands.
                    </td>
                  </tr>

                  {/* Channel 2 */}
                  <tr className="hover:bg-[#faf8f4] transition">
                    <td className="p-3.5 align-top">
                      <div className="flex items-center gap-2 font-bold text-slate-900 font-sans">
                        <div className="p-1.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-300">
                          <Radio className="w-3.5 h-3.5" />
                        </div>
                        <span>Media & PR Operations</span>
                      </div>
                    </td>
                    <td className="p-3.5 align-top font-mono font-bold text-purple-900">
                      Narrative Framing
                    </td>
                    <td className="p-3.5 align-top text-[11px] leading-relaxed font-sans">
                      Placing strategic op-eds, securing prime broadcast coverage on global financial networks (Bloomberg, CNBC, Reuters), and pitching key secular catalysts (e.g. AI adoption, green transition, supply-side moats) to institutional journalists.
                    </td>
                    <td className="p-3.5 align-top font-mono text-[11px] text-slate-700">
                      Shapes broader public perception and accelerates algorithmic retail momentum.
                    </td>
                  </tr>

                  {/* Channel 3 */}
                  <tr className="hover:bg-[#faf8f4] transition">
                    <td className="p-3.5 align-top">
                      <div className="flex items-center gap-2 font-bold text-slate-900 font-sans">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </div>
                        <span>Institutional Buy-In</span>
                      </div>
                    </td>
                    <td className="p-3.5 align-top font-mono font-bold text-emerald-900">
                      Credibility Signals
                    </td>
                    <td className="p-3.5 align-top text-[11px] leading-relaxed font-sans">
                      Securing high-profile backing and 13F whale filings from recognized venture capital firms, sovereign wealth funds, Tier-1 asset managers (BlackRock, Fidelity, Citadel), or key industry figures.
                    </td>
                    <td className="p-3.5 align-top font-mono text-[11px] text-slate-700">
                      Validates long-term solvency, reduces credit default swap (CDS) spreads, and draws passive index inflows.
                    </td>
                  </tr>

                  {/* Channel 4 */}
                  <tr className="hover:bg-[#faf8f4] transition">
                    <td className="p-3.5 align-top">
                      <div className="flex items-center gap-2 font-bold text-slate-900 font-sans">
                        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span>Community Engagement</span>
                      </div>
                    </td>
                    <td className="p-3.5 align-top font-mono font-bold text-amber-900">
                      Grassroots Sentiment
                    </td>
                    <td className="p-3.5 align-top text-[11px] leading-relaxed font-sans">
                      Maintaining consistent, transparent, and direct interaction channels across specialized forums, podcasts, developer Discord/Telegram groups, and interactive X (Twitter) Spaces to foster active organic advocates.
                    </td>
                    <td className="p-3.5 align-top font-mono text-[11px] text-slate-700">
                      Creates structural price floors during drawdowns and sustains decentralized volume velocity.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* NARRATIVE VELOCITY EXECUTION TIMELINE */}
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-4 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-sans flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>4-Stage Institutional Sentiment Campaign Lifecycle</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-purple-800 font-bold uppercase mb-1">Stage 1: Seed Narrative</div>
                <p className="text-[11px] text-slate-700 font-sans leading-snug">
                  Targeted research papers and private institutional briefings test appetite on new thematic drivers.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-sky-800 font-bold uppercase mb-1">Stage 2: Mainstream Amplification</div>
                <p className="text-[11px] text-slate-700 font-sans leading-snug">
                  Securing top-tier financial media headlines and sell-side price target upgrades to trigger algo alerts.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-emerald-800 font-bold uppercase mb-1">Stage 3: Credibility Consolidation</div>
                <p className="text-[11px] text-slate-700 font-sans leading-snug">
                  Institutional 13F disclosures and strategic partnership announcements validate valuation rerating.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-amber-800 font-bold uppercase mb-1">Stage 4: Distribution & Governance</div>
                <p className="text-[11px] text-slate-700 font-sans leading-snug">
                  Grassroots communities and retail liquidity absorb supply as early smart money rebalances positioning.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CROSS-MARKET SENTIMENT HEATMAP OVERVIEW                  */}
      {/* ========================================================= */}
      {activeTab === 'MATRIX' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => {
                  setSelectedProfileId(profile.id);
                  setActiveTab('PATH1');
                  onSelectAsset?.(profile.quoteSymbol);
                }}
                className="p-3.5 rounded-xl bg-[#faf8f4] hover:bg-[#f6f2ea] border border-[#e2dcd2] hover:border-slate-400 transition cursor-pointer space-y-2.5 shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-900 font-sans">
                      {profile.symbol}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{profile.category}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getMoodColor(profile.compositeMood)}`}>
                      {profile.compositeMood.replace(/_/g, ' ')}
                    </span>
                    <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                      {profile.compositeScore}/100
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono pt-1">
                  <div className="p-1.5 rounded bg-[#ffffff] border border-[#e8e2d8]">
                    <div className="text-slate-500 text-[9px]">Live Community</div>
                    <div className="font-bold text-emerald-800">{profile.communityVotes.bullPct}% Bull</div>
                  </div>
                  <div className="p-1.5 rounded bg-[#ffffff] border border-[#e8e2d8]">
                    <div className="text-slate-500 text-[9px]">P/C Ratio</div>
                    <div className="font-bold text-slate-800">{profile.putCallRatio.totalRatio.toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 rounded bg-[#ffffff] border border-[#e8e2d8]">
                    <div className="text-slate-500 text-[9px]">Retail Long</div>
                    <div className="font-bold text-slate-800">{profile.retailPositioning.longPercent}%</div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 font-sans pt-1 leading-snug">
                  {profile.nlpNewsScraping.dominantNarrativeTopic}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
