import React, { useState, useMemo, useEffect } from 'react';
import { useAuth, getRealFormattedRegistrationDate } from '../context/AuthContext';
import { 
  X, 
  User, 
  ShieldCheck, 
  Bell, 
  Sliders, 
  LogOut, 
  Check, 
  Plus, 
  Calendar, 
  Layers, 
  Save,
  Volume2,
  VolumeX,
  Play,
  Calculator,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { UserProfile, UserRiskSettings, AssetQuote } from '../types';
import { soundManager } from '../utils/audio';
import { TradingViewLogo } from './TradingViewLogo';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes?: AssetQuote[];
  onSelectAsset?: (symbol: string) => void;
}

export interface WatchlistMarketItem {
  symbol: string;
  name: string;
  category: 'MAJORS' | 'CROSSES' | 'COMMODITIES' | 'CRYPTO' | 'INDICES';
  defaultPrice: number;
}

export const ALL_WATCHLIST_MARKETS: WatchlistMarketItem[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'MAJORS', defaultPrice: 1.0862 },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'MAJORS', defaultPrice: 1.2945 },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'MAJORS', defaultPrice: 152.18 },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', category: 'MAJORS', defaultPrice: 0.8842 },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'MAJORS', defaultPrice: 0.6585 },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', category: 'MAJORS', defaultPrice: 1.3920 },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', category: 'MAJORS', defaultPrice: 0.5910 },
  { symbol: 'EUR/GBP', name: 'Euro / British Pound', category: 'CROSSES', defaultPrice: 0.8390 },
  { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', category: 'CROSSES', defaultPrice: 165.25 },
  { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', category: 'CROSSES', defaultPrice: 196.85 },
  { symbol: 'XAU/USD', name: 'Spot Gold / US Dollar', category: 'COMMODITIES', defaultPrice: 2748.50 },
  { symbol: 'OIL/USD', name: 'WTI Crude Oil Spot', category: 'COMMODITIES', defaultPrice: 71.80 },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', category: 'CRYPTO', defaultPrice: 96450.00 },
  { symbol: 'DXY', name: 'US Dollar Index', category: 'INDICES', defaultPrice: 104.35 },
  { symbol: 'US10Y', name: 'US 10-Year Treasury Yield', category: 'INDICES', defaultPrice: 4.288 },
];

interface NotificationAlertItem {
  id: string;
  title: string;
  message: string;
  currency: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  isRead: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose,
  quotes = [],
  onSelectAsset 
}) => {
  const { user, updateProfile, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'strategy' | 'watchlists' | 'alerts'>('overview');

  // Form states initialized with user profile
  const [name, setName] = useState<string>(user?.name || '');
  const [memberSince, setMemberSince] = useState<string>(() => {
    if (user?.memberSince && user.memberSince !== 'March 2024' && !user.memberSince.includes('2024')) {
      return user.memberSince;
    }
    return getRealFormattedRegistrationDate(user?.registeredAtTimestamp);
  });
  const [favoritePair, setFavoritePair] = useState<string>(
    user?.stats?.favoritePair || user?.watchlists?.[0] || 'EUR/USD'
  );
  const [tradingStyle, setTradingStyle] = useState<UserProfile['tradingStyle']>(
    user?.tradingStyle || 'Macro Swing'
  );
  const [primaryCurrency, setPrimaryCurrency] = useState<UserProfile['primaryCurrency']>(
    user?.primaryCurrency || 'USD'
  );
  const [riskPreference, setRiskPreference] = useState<UserProfile['riskPreference']>(
    user?.riskPreference || 'Standard (1% - 2%)'
  );
  const [notes, setNotes] = useState<string>(user?.notes || '');
  const [watchlists, setWatchlists] = useState<string[]>(
    user?.watchlists || ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'USD/CAD']
  );

  // Extended Risk Settings
  const [maxDailyLossPercent, setMaxDailyLossPercent] = useState<number>(
    user?.riskSettings?.maxDailyLossPercent ?? 3.0
  );
  const [targetRiskReward, setTargetRiskReward] = useState<string>(
    user?.riskSettings?.targetRiskReward ?? '1:2.5'
  );
  const [maxConcurrentTrades, setMaxConcurrentTrades] = useState<number>(
    user?.riskSettings?.maxConcurrentTrades ?? 3
  );
  const [preferredSessions, setPreferredSessions] = useState<string[]>(
    user?.riskSettings?.preferredSessions ?? ['London', 'New York']
  );
  const [calcAccountBalance, setCalcAccountBalance] = useState<number>(
    user?.riskSettings?.accountBalance ?? 25000
  );
  const [calcRiskPercent, setCalcRiskPercent] = useState<number>(
    user?.riskSettings?.riskPerTradePercent ?? 1.5
  );
  const [calcStopPips, setCalcStopPips] = useState<number>(25);

  // Notification / Alert Preferences
  const [alerts, setAlerts] = useState(
    user?.alerts || {
      highImpactAudio: true,
      instantPopups: true,
      dailySummary: true,
      emailAlerts: false,
      soundVolume: 80,
      watchlistOnly: false,
      mediumImpactAudio: false,
    }
  );

  // Notification history feed simulation
  const [notificationHistory, setNotificationHistory] = useState<NotificationAlertItem[]>([
    {
      id: 'notif-1',
      title: 'US Core CPI Inflation Deviation',
      message: 'Headline MoM printed +0.4% vs +0.3% expected. USD hawkish breakout triggered.',
      currency: 'USD',
      impact: 'HIGH',
      timestamp: '14 mins ago',
      isRead: false,
    },
    {
      id: 'notif-2',
      title: 'Bank of England Rate Decision Imminent',
      message: 'Policy announcement in 15 mins. GBP/USD volatility band expanding.',
      currency: 'GBP',
      impact: 'HIGH',
      timestamp: '1 hour ago',
      isRead: true,
    },
    {
      id: 'notif-3',
      title: 'Gold (XAU/USD) Key Flip Level Reached',
      message: 'Spot Gold holding 2,745.00 support with institutional bid absorption.',
      currency: 'USD',
      impact: 'MEDIUM',
      timestamp: '3 hours ago',
      isRead: true,
    },
  ]);

  const [watchlistSearch, setWatchlistSearch] = useState<string>('');
  const [watchlistCategory, setWatchlistCategory] = useState<'ALL' | 'MAJORS' | 'CROSSES' | 'COMMODITIES' | 'CRYPTO' | 'INDICES'>('ALL');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync state if user changes externally
  useEffect(() => {
    if (user) {
      setName(user.name);
      const isOutdated = !user.memberSince || user.memberSince === 'March 2024' || user.memberSince.includes('2024');
      setMemberSince(isOutdated ? getRealFormattedRegistrationDate(user.registeredAtTimestamp) : user.memberSince);
      setFavoritePair(user.stats?.favoritePair || user.watchlists?.[0] || 'EUR/USD');
      setTradingStyle(user.tradingStyle);
      setPrimaryCurrency(user.primaryCurrency);
      setRiskPreference(user.riskPreference);
      setNotes(user.notes || '');
      setWatchlists(user.watchlists || ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD']);
      setAlerts(user.alerts);
      if (user.riskSettings) {
        setMaxDailyLossPercent(user.riskSettings.maxDailyLossPercent);
        setTargetRiskReward(user.riskSettings.targetRiskReward);
        setMaxConcurrentTrades(user.riskSettings.maxConcurrentTrades);
        setPreferredSessions(user.riskSettings.preferredSessions);
        setCalcAccountBalance(user.riskSettings.accountBalance);
        setCalcRiskPercent(user.riskSettings.riskPerTradePercent);
      }
    }
  }, [user]);

  if (!isOpen || !user) return null;

  // Calculate live position sizing based on risk settings
  const dollarRiskAmount = (calcAccountBalance * (calcRiskPercent / 100));
  const rMultiple = parseFloat(targetRiskReward.split(':')[1] || '2.5');
  const expectedProfitAmount = dollarRiskAmount * rMultiple;
  const standardLotSize = calcStopPips > 0 ? (dollarRiskAmount / (calcStopPips * 10)) : 1.0;

  const handleSave = () => {
    const updatedRiskSettings: UserRiskSettings = {
      maxDailyLossPercent,
      targetRiskReward,
      maxConcurrentTrades,
      preferredSessions,
      accountBalance: calcAccountBalance,
      riskPerTradePercent: calcRiskPercent,
    };

    updateProfile({
      name,
      memberSince,
      tradingStyle,
      primaryCurrency,
      riskPreference,
      riskSettings: updatedRiskSettings,
      notes,
      watchlists,
      alerts,
      stats: {
        ...user.stats,
        favoritePair,
        activeWatchlistCount: watchlists.length,
      },
    });

    soundManager.setVolume(alerts.soundVolume);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const toggleWatchlistPair = (pair: string) => {
    if (watchlists.includes(pair)) {
      if (watchlists.length > 1) {
        setWatchlists(watchlists.filter((p) => p !== pair));
      }
    } else {
      setWatchlists([...watchlists, pair]);
    }
  };

  const handleSelectAllCategory = (cat: 'MAJORS' | 'CROSSES' | 'ALL') => {
    if (cat === 'ALL') {
      setWatchlists(ALL_WATCHLIST_MARKETS.map((m) => m.symbol));
    } else {
      const symbolsInCat = ALL_WATCHLIST_MARKETS.filter((m) => m.category === cat).map((m) => m.symbol);
      const combined = Array.from(new Set([...watchlists, ...symbolsInCat]));
      setWatchlists(combined);
    }
  };

  const handleClearWatchlist = () => {
    setWatchlists(['EUR/USD']);
  };

  const handleJumpToMarket = (symbol: string) => {
    if (!watchlists.includes(symbol)) {
      setWatchlists([...watchlists, symbol]);
    }
    onSelectAsset?.(symbol);
    onClose();
  };

  const handlePlaySoundTest = (tone: 'BULLISH' | 'BEARISH') => {
    soundManager.setVolume(alerts.soundVolume);
    soundManager.playNotificationTestTone(tone);
  };

  const handleMarkAllAlertsRead = () => {
    setNotificationHistory((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const handleClearAlertHistory = () => {
    setNotificationHistory([]);
  };

  const filteredMarkets = ALL_WATCHLIST_MARKETS.filter((item) => {
    const matchesSearch = item.symbol.toLowerCase().includes(watchlistSearch.toLowerCase()) || 
                          item.name.toLowerCase().includes(watchlistSearch.toLowerCase());
    const matchesCat = watchlistCategory === 'ALL' || item.category === watchlistCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#ffffff] border border-[#e2dcd2] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800 flex flex-col max-h-[92vh]">
        
        {/* Header Profile Banner */}
        <div className="relative bg-[#000000] border-b border-zinc-800 p-5 sm:p-6 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={user.name}
                className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-[#00ffaa]/50 shadow-[0_0_15px_rgba(0,255,170,0.3)] bg-zinc-900"
              />
              <div className="absolute -bottom-1 -right-1 p-1 bg-[#00ffaa] rounded-full text-black shadow">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate font-sans">
                  {name || user.name}
                </h2>
              </div>
              <p className="text-xs text-zinc-400 font-mono truncate mt-0.5">{user.email}</p>
              
              {/* Dynamic Real Registration Date */}
              <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-2 font-mono flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#00ffaa]" /> 
                  <span>Member since <strong className="text-zinc-200 font-bold">{memberSince}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-zinc-800/80 text-center font-mono">
            <div className="bg-zinc-900/90 rounded-xl p-2 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Signals Analyzed</div>
              <div className="text-sm sm:text-base font-bold text-white mt-0.5">{user.stats.totalSignalsEvaluated}</div>
            </div>
            <div className="bg-zinc-900/90 rounded-xl p-2 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Model Win Rate</div>
              <div className="text-sm sm:text-base font-bold text-[#00ffaa] mt-0.5">{user.stats.winRateEst}%</div>
            </div>
            <div className="bg-zinc-900/90 rounded-xl p-2 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Watchlist Pinned</div>
              <div className="text-sm sm:text-base font-bold text-white mt-0.5">{watchlists.length} Markets</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#e2dcd2] px-4 sm:px-6 bg-[#fbf9f5] gap-1 sm:gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 sm:px-3.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-700 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Trader Profile
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`py-3 px-3 sm:px-3.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'strategy'
                ? 'border-emerald-700 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Strategy & Risk
          </button>

          <button
            onClick={() => setActiveTab('watchlists')}
            className={`py-3 px-3 sm:px-3.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'watchlists'
                ? 'border-emerald-700 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Watchlists ({watchlists.length})
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-3 px-3 sm:px-3.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'border-emerald-700 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Notifications & Alerts
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                    Trader Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#f6f2ea] border border-[#e2dcd2] rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition"
                    placeholder="Enter display name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                    Registered Member Since
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={memberSince}
                      onChange={(e) => setMemberSince(e.target.value)}
                      placeholder="e.g. August 2026"
                      className="w-full px-3.5 py-2.5 bg-[#f6f2ea] border border-[#e2dcd2] rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                      (Live Date)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                    Account Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3.5 py-2.5 bg-[#ebe6dc] border border-[#d8d0c4] rounded-xl text-xs text-slate-600 cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                    Primary Market Focus
                  </label>
                  <select
                    value={favoritePair}
                    onChange={(e) => setFavoritePair(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#f6f2ea] border border-[#e2dcd2] rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 transition"
                  >
                    {ALL_WATCHLIST_MARKETS.map((m) => (
                      <option key={m.symbol} value={m.symbol}>
                        {m.symbol} - {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                  Macro Trading Thesis & Log Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record fundamental biases, central bank rate differential projections, key liquidity levels, and upcoming catalyst plans..."
                  className="w-full px-3.5 py-2.5 bg-[#f6f2ea] border border-[#e2dcd2] rounded-xl text-xs text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: STRATEGY & RISK */}
          {activeTab === 'strategy' && (
            <div className="space-y-5">
              {/* Primary Methodology */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">
                  1. Execution Style & Trading Methodology
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { style: 'Macro Swing' as const, desc: 'Multi-day fundamental deviations & rate differentials' },
                    { style: 'News Trader' as const, desc: 'High-speed event releases & pre/post catalyst momentum' },
                    { style: 'High Frequency Scalper' as const, desc: 'Sub-minute tick liquidity sweeps & order block taps' },
                    { style: 'Quantitative Model' as const, desc: 'Statistical Z-score & mathematical factor weighting' },
                  ].map(({ style, desc }) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setTradingStyle(style)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        tradingStyle === style
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                          : 'bg-[#f6f2ea] border-[#e2dcd2] text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{style}</span>
                        {tradingStyle === style && <Check className="w-4 h-4 text-emerald-700" />}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Currency & Risk Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                    2. Base Account Currency
                  </label>
                  <select
                    value={primaryCurrency}
                    onChange={(e) => setPrimaryCurrency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#f6f2ea] border border-[#e2dcd2] rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 transition"
                  >
                    <option value="USD">USD ($ - United States Dollar)</option>
                    <option value="EUR">EUR (€ - Eurozone Euro)</option>
                    <option value="GBP">GBP (£ - British Pound Sterling)</option>
                    <option value="JPY">JPY (¥ - Japanese Yen)</option>
                    <option value="CHF">CHF (₣ - Swiss Franc)</option>
                    <option value="AUD">AUD (A$ - Australian Dollar)</option>
                    <option value="CAD">CAD (C$ - Canadian Dollar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                    3. Risk Per Setup Classification
                  </label>
                  <select
                    value={riskPreference}
                    onChange={(e) => setRiskPreference(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#f6f2ea] border border-[#e2dcd2] rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 transition"
                  >
                    <option value="Conservative (0.5% - 1%)">Conservative (0.5% - 1.0% per trade)</option>
                    <option value="Standard (1% - 2%)">Standard (1.0% - 2.0% per trade)</option>
                    <option value="Aggressive (3%+)">Aggressive (3.0%+ per trade)</option>
                  </select>
                </div>
              </div>

              {/* Advanced Risk Controls */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono truncate">
                    Max Daily Loss
                  </label>
                  <select
                    value={maxDailyLossPercent}
                    onChange={(e) => setMaxDailyLossPercent(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#f6f2ea] border border-[#e2dcd2] rounded-lg text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value={2.0}>2.0% Max Drawdown</option>
                    <option value={3.0}>3.0% Max Drawdown</option>
                    <option value={5.0}>5.0% Max Drawdown</option>
                    <option value={8.0}>8.0% Max Drawdown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono truncate">
                    Target R:R Ratio
                  </label>
                  <select
                    value={targetRiskReward}
                    onChange={(e) => setTargetRiskReward(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#f6f2ea] border border-[#e2dcd2] rounded-lg text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="1:1.5">1:1.5 Minimum R:R</option>
                    <option value="1:2.0">1:2.0 Standard R:R</option>
                    <option value="1:2.5">1:2.5 Recommended R:R</option>
                    <option value="1:3.0">1:3.0 High Confluence R:R</option>
                    <option value="1:4.0">1:4.0 Institutional R:R</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono truncate">
                    Max Open Trades
                  </label>
                  <select
                    value={maxConcurrentTrades}
                    onChange={(e) => setMaxConcurrentTrades(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#f6f2ea] border border-[#e2dcd2] rounded-lg text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value={1}>1 Active Position</option>
                    <option value={2}>2 Active Positions</option>
                    <option value={3}>3 Active Positions</option>
                    <option value={5}>5 Active Positions</option>
                  </select>
                </div>
              </div>

              {/* Active Trading Sessions Focus */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">
                  4. Active Trading Session Preferences
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'London', time: '08:00 - 16:00 GMT' },
                    { name: 'New York', time: '13:00 - 21:00 GMT' },
                    { name: 'Asian / Tokyo', time: '00:00 - 08:00 GMT' },
                  ].map((sess) => {
                    const isSelected = preferredSessions.includes(sess.name);
                    return (
                      <button
                        key={sess.name}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setPreferredSessions(preferredSessions.filter((s) => s !== sess.name));
                          } else {
                            setPreferredSessions([...preferredSessions, sess.name]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs'
                            : 'bg-[#f6f2ea] border-[#e2dcd2] text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{sess.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">{sess.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Position Sizer & Risk Calculator */}
              <div className="p-4 rounded-xl bg-[#f7f3ea] border border-[#ded5c6] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-mono uppercase">
                    <Calculator className="w-3.5 h-3.5 text-emerald-700" /> Live Risk Capital Sizer
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold font-mono bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Auto-Calculated
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                      Account Balance ($)
                    </label>
                    <input
                      type="number"
                      value={calcAccountBalance}
                      onChange={(e) => setCalcAccountBalance(Math.max(100, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-white border border-[#d5cdc0] rounded-lg text-xs font-bold font-mono text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                      Risk Per Trade (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={calcRiskPercent}
                      onChange={(e) => setCalcRiskPercent(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-[#d5cdc0] rounded-lg text-xs font-bold font-mono text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 font-mono">
                      Stop Loss (Pips)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={calcStopPips}
                      onChange={(e) => setCalcStopPips(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-white border border-[#d5cdc0] rounded-lg text-xs font-bold font-mono text-slate-900 outline-none"
                    />
                  </div>
                </div>

                {/* Calculation Outputs */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#ded5c6] text-center font-mono">
                  <div className="bg-white p-2 rounded-lg border border-[#e2dcd2]">
                    <div className="text-[10px] text-slate-500 uppercase">Capital at Risk</div>
                    <div className="text-xs font-bold text-rose-700 mt-0.5">
                      ${dollarRiskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#e2dcd2]">
                    <div className="text-[10px] text-slate-500 uppercase">Target Profit ({targetRiskReward})</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      +${expectedProfitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#e2dcd2]">
                    <div className="text-[10px] text-slate-500 uppercase">Suggested Lot Size</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {standardLotSize.toFixed(2)} Lots
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WATCHLISTS */}
          {activeTab === 'watchlists' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                    Market Watchlist Configuration
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click to pin markets. Selected markets stream real-time ticks and appear down in the active market list.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectAllCategory('MAJORS')}
                    className="px-2.5 py-1 rounded bg-[#f6f2ea] hover:bg-[#ede6d9] text-[10px] font-mono font-bold text-slate-800 border border-[#e2dcd2] transition cursor-pointer"
                  >
                    Select Majors
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllCategory('ALL')}
                    className="px-2.5 py-1 rounded bg-[#f6f2ea] hover:bg-[#ede6d9] text-[10px] font-mono font-bold text-slate-800 border border-[#e2dcd2] transition cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearWatchlist}
                    className="px-2 py-1 rounded hover:bg-rose-50 text-[10px] font-mono font-bold text-rose-700 border border-transparent transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={watchlistSearch}
                    onChange={(e) => setWatchlistSearch(e.target.value)}
                    placeholder="Search Forex pairs, Gold, Oil, Bitcoin, Indices..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#f6f2ea] border border-[#e2dcd2] rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 transition"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {(['ALL', 'MAJORS', 'CROSSES', 'COMMODITIES', 'CRYPTO', 'INDICES'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setWatchlistCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer whitespace-nowrap ${
                        watchlistCategory === cat
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#f6f2ea] text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Market Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {filteredMarkets.map((market) => {
                  const isPinned = watchlists.includes(market.symbol);
                  const quote = quotes.find((q) => q.symbol === market.symbol || q.name === market.symbol);
                  const price = quote?.price ?? market.defaultPrice;
                  const isPos = (quote?.changePercent ?? 0) >= 0;

                  return (
                    <div
                      key={market.symbol}
                      className={`p-2.5 rounded-xl border transition flex flex-col justify-between ${
                        isPinned
                          ? 'bg-emerald-50/70 border-emerald-500/80 shadow-2xs'
                          : 'bg-[#fbf9f5] border-[#e2dcd2] hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <TradingViewLogo symbol={market.symbol} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {market.symbol}
                              </span>
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200 text-slate-700 font-bold">
                                {market.category}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px] mt-0.5">
                              {market.name}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleWatchlistPair(market.symbol)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                            isPinned
                              ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                              : 'bg-[#ede6d8] text-slate-700 hover:bg-slate-300'
                          }`}
                          title={isPinned ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        >
                          {isPinned ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e2dcd2]/80 font-mono">
                        <div className="text-xs font-bold text-slate-900">
                          {market.symbol === 'US10Y' ? `${price.toFixed(3)}%` : price.toLocaleString()}
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleJumpToMarket(market.symbol)}
                          className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                          title="Select market and load on charts & technical framework"
                        >
                          <span>Analyze</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ALERTS & NOTIFICATIONS */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {/* Sound & Audio Volume Controls */}
              <div className="p-3.5 rounded-xl bg-[#f6f2ea] border border-[#e2dcd2] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-900 font-mono uppercase">
                      Audio Synthesizer & Volume
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-800">
                    {alerts.soundVolume}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={alerts.soundVolume}
                    onChange={(e) => {
                      const vol = Number(e.target.value);
                      setAlerts({ ...alerts, soundVolume: vol });
                      soundManager.setVolume(vol);
                    }}
                    className="flex-1 accent-emerald-700 cursor-pointer h-1.5 bg-[#ded5c6] rounded-lg"
                  />
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                </div>

                {/* Interactive Audio Test Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePlaySoundTest('BULLISH')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold font-mono transition flex items-center gap-1.5 cursor-pointer border border-emerald-300"
                  >
                    <Play className="w-3 h-3 fill-emerald-800" />
                    <span>Test Bullish Chime</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlaySoundTest('BEARISH')}
                    className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold font-mono transition flex items-center gap-1.5 cursor-pointer border border-rose-300"
                  >
                    <Play className="w-3 h-3 fill-rose-800" />
                    <span>Test Bearish Chime</span>
                  </button>
                </div>
              </div>

              {/* Notification Toggles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#f6f2ea] border border-[#e2dcd2]">
                  <div>
                    <div className="text-xs font-bold text-slate-900">High-Impact Audio Chimes</div>
                    <div className="text-[10px] text-slate-500">Play instant harmonic tone on release</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alerts.highImpactAudio}
                    onChange={(e) => setAlerts({ ...alerts, highImpactAudio: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#f6f2ea] border border-[#e2dcd2]">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Instant Event Popups</div>
                    <div className="text-[10px] text-slate-500">Show auto-dialog when catalyst releases</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alerts.instantPopups}
                    onChange={(e) => setAlerts({ ...alerts, instantPopups: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#f6f2ea] border border-[#e2dcd2]">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Daily Macro Morning Briefing</div>
                    <div className="text-[10px] text-slate-500">Pre-session overview before London open</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alerts.dailySummary}
                    onChange={(e) => setAlerts({ ...alerts, dailySummary: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#f6f2ea] border border-[#e2dcd2]">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Filter by Pinned Watchlists Only</div>
                    <div className="text-[10px] text-slate-500">Only alert for active pinned currency pairs</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alerts.watchlistOnly ?? false}
                    onChange={(e) => setAlerts({ ...alerts, watchlistOnly: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Notification Activity Feed */}
              <div className="pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#e2dcd2]">
                  <div className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Recent Macro Alerts ({notificationHistory.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMarkAllAlertsRead}
                      className="text-[10px] font-mono text-emerald-800 hover:text-emerald-950 font-bold cursor-pointer"
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAlertHistory}
                      className="text-[10px] font-mono text-rose-700 hover:text-rose-900 font-bold cursor-pointer"
                    >
                      Clear history
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto scrollbar-thin">
                  {notificationHistory.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 font-mono">
                      No notifications recorded yet.
                    </div>
                  ) : (
                    notificationHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-lg border transition text-xs ${
                          item.isRead
                            ? 'bg-[#faf7f0] border-[#e2dcd2] text-slate-600'
                            : 'bg-emerald-50/60 border-emerald-300 text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                              item.impact === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.impact}
                            </span>
                            <span className="font-bold">{item.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-[#e2dcd2] bg-[#fbf9f5] flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-rose-700 hover:text-rose-800 font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-fade-in font-mono">
                <Check className="w-3.5 h-3.5" /> Profile & Settings Saved!
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
