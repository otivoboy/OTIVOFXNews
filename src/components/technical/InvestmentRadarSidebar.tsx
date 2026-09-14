import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Bell, 
  Layers, 
  Newspaper, 
  Wrench,
  Bot,
  Compass
} from 'lucide-react';

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    price: 1.0865,
    change: 0.0028,
    changePercent: 0.26,
    isPositive: true,
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    price: 1.2940,
    change: 0.0035,
    changePercent: 0.27,
    isPositive: true,
  },
  {
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    price: 154.20,
    change: -0.45,
    changePercent: -0.29,
    isPositive: false,
  },
  {
    symbol: 'USD/CHF',
    name: 'US Dollar / Swiss Franc',
    price: 0.8845,
    change: -0.0018,
    changePercent: -0.20,
    isPositive: false,
  },
  {
    symbol: 'AUD/USD',
    name: 'Australian Dollar / USD',
    price: 0.6580,
    change: 0.0022,
    changePercent: 0.34,
    isPositive: true,
  },
  {
    symbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    price: 1.3820,
    change: -0.0015,
    changePercent: -0.11,
    isPositive: false,
  },
  {
    symbol: 'NZD/USD',
    name: 'New Zealand Dollar / USD',
    price: 0.5980,
    change: 0.0019,
    changePercent: 0.32,
    isPositive: true,
  },
  {
    symbol: 'EUR/GBP',
    name: 'Euro / British Pound',
    price: 0.8395,
    change: -0.0008,
    changePercent: -0.10,
    isPositive: false,
  },
  {
    symbol: 'EUR/JPY',
    name: 'Euro / Japanese Yen',
    price: 167.45,
    change: 0.65,
    changePercent: 0.39,
    isPositive: true,
  },
  {
    symbol: 'GBP/JPY',
    name: 'British Pound / Japanese Yen',
    price: 196.85,
    change: 0.95,
    changePercent: 0.48,
    isPositive: true,
  },
  {
    symbol: 'XAU/USD',
    name: 'Gold (XAU/USD)',
    price: 2748.50,
    change: 14.20,
    changePercent: 0.52,
    isPositive: true,
  },
  {
    symbol: 'OIL/USD',
    name: 'Crude Oil WTI',
    price: 71.40,
    change: 0.85,
    changePercent: 1.20,
    isPositive: true,
  },
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin / US Dollar',
    price: 95400.00,
    change: 1850.00,
    changePercent: 1.98,
    isPositive: true,
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum / US Dollar',
    price: 3450.00,
    change: 78.50,
    changePercent: 2.33,
    isPositive: true,
  },
  {
    symbol: '1HZ100V',
    name: 'Volatility 100 (1s) Index',
    price: 1248.50,
    change: 22.40,
    changePercent: 1.83,
    isPositive: true,
  },
  {
    symbol: 'R_100',
    name: 'Volatility 100 Index',
    price: 1850.20,
    change: 35.80,
    changePercent: 1.97,
    isPositive: true,
  },
  {
    symbol: '1HZ10V',
    name: 'Volatility 10 (1s) Index',
    price: 512.40,
    change: 4.80,
    changePercent: 0.95,
    isPositive: true,
  },
  {
    symbol: 'R_50',
    name: 'Volatility 50 Index',
    price: 284.10,
    change: 3.60,
    changePercent: 1.28,
    isPositive: true,
  },
];

interface InvestmentRadarSidebarProps {
  onSelectAsset?: (symbol: string) => void;
  selectedSymbol?: string;
}

export const InvestmentRadarSidebar: React.FC<InvestmentRadarSidebarProps> = ({
  onSelectAsset,
  selectedSymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST);

  const filteredList = watchlist.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex gap-2">
      {/* Main Radar Card */}
      <div className="flex-1 bg-[#ffffff] border border-[#e2dcd2] rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
        {/* Radar Icon & Hero Header */}
        <div className="text-center space-y-1.5 pb-3 border-b border-[#e2dcd2]">
          <div className="w-12 h-12 mx-auto rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mb-1">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 font-sans">
            What's on Your Investment Radar?
          </h3>
          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            Add the assets you care about to your watchlist, and we'll make sure to keep you always up-to-date
          </p>
        </div>

        {/* Search Symbols Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbols to add"
            className="w-full pl-9 pr-3 py-2 bg-[#faf8f4] border border-[#d8d0c4] rounded-lg text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        {/* Watchlist Section Header */}
        <div>
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#eee8dc]">
            <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">
              Most followed / Watchlist
            </span>
          </div>

          {/* List items */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
            {filteredList.map((item) => {
              const isSelected = selectedSymbol === item.symbol;
              return (
                <div
                  key={item.symbol}
                  onClick={() => onSelectAsset?.(item.symbol)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-300'
                      : 'bg-[#faf8f4] hover:bg-[#f3eee4] border-[#e2dcd2]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 font-mono group-hover:text-sky-700 transition">
                        {item.symbol}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans">
                      {item.name}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-slate-900">
                      {item.price > 100
                        ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : item.price.toFixed(4)}
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        item.isPositive ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {item.isPositive ? '+' : ''}
                      {item.change.toFixed(2)} ({item.isPositive ? '+' : ''}
                      {item.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side Quick Tools Rail (Investing.com style) */}
      <div className="hidden xl:flex flex-col items-center gap-4 py-4 px-2 bg-[#ffffff] border border-[#e2dcd2] rounded-xl text-slate-500 shadow-xs">
        <button
          className="flex flex-col items-center gap-1 text-[10px] hover:text-sky-700 transition cursor-pointer"
          title="Watchlist"
        >
          <Star className="w-4 h-4" />
          <span className="text-[9px]">Watchlist</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-[10px] hover:text-sky-700 transition cursor-pointer"
          title="Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="text-[9px]">Alerts</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-[10px] hover:text-sky-700 transition cursor-pointer"
          title="Top Brokers"
        >
          <Layers className="w-4 h-4" />
          <span className="text-[9px]">Brokers</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-[10px] hover:text-sky-700 transition cursor-pointer"
          title="Breaking News"
        >
          <Newspaper className="w-4 h-4" />
          <span className="text-[9px]">News</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-[10px] hover:text-sky-700 transition cursor-pointer"
          title="Technical Tools"
        >
          <Wrench className="w-4 h-4" />
          <span className="text-[9px]">Tools</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-[10px] text-amber-700 hover:text-amber-900 transition cursor-pointer"
          title="AI Macro Agent"
        >
          <Bot className="w-4 h-4 text-amber-600" />
          <span className="text-[9px] font-bold">AI Intel</span>
        </button>
      </div>
    </div>
  );
};
