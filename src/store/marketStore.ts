import { create } from "zustand";
import { Candle, Tick, Timeframe, MarketSymbol } from "../types";

export interface Drawing {
  id: string;
  symbol: string;
  type: string;
  data: any;
  color?: string;
  lineWidth?: number;
  locked?: boolean;
  hidden?: boolean;
}

export interface MarketState {
  activeSymbol: string;
  activeTimeframe: Timeframe;
  symbols: string[];
  availableSymbols: MarketSymbol[];
  candles: Candle[];
  lastTick: Tick | null;
  marketTime: number; // Latest epoch in seconds
  isLoading: boolean;
  theme: 'light' | 'dark';
  activeTool: string | null;
  selectedDrawingId: string | null;
  drawings: Drawing[];
  savedScripts: Array<{ id: string; name: string; code: string }>;
  activeIndicators: Array<{ id: string; name: string; code: string }>;
  hiddenIndicators: string[];
  
  setSymbol: (symbol: string) => void;
  setAvailableSymbols: (symbols: MarketSymbol[]) => void;
  setTimeframe: (tf: Timeframe) => void;
  addTick: (tick: Tick) => void;
  setCandles: (candles: Candle[]) => void;
  updateCandle: (candle: Candle) => void;
  setLoading: (loading: boolean) => void;
  toggleTheme: () => void;
  setActiveTool: (tool: string | null) => void;
  setSelectedDrawing: (id: string | null) => void;
  addDrawing: (drawing: Drawing) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: (symbol: string) => void;
  addScript: (script: { id: string; name: string; code: string }) => void;
  applyScript: (script: { id: string; name: string; code: string }) => void;
  removeIndicator: (id: string) => void;
  toggleIndicatorVisibility: (id: string) => void;
}

export const INITIAL_CURRENCY_PAIRS: MarketSymbol[] = [
  { id: '1HZ100V', symbol: '1HZ100V', display: 'Volatility 100 (1s) Index', market: 'synthetic_index', marketDisplay: 'Derived' },
  { id: 'R_100', symbol: 'R_100', display: 'Volatility 100 Index', market: 'synthetic_index', marketDisplay: 'Derived' },
  { id: '1HZ10V', symbol: '1HZ10V', display: 'Volatility 10 (1s) Index', market: 'synthetic_index', marketDisplay: 'Derived' },
  { id: 'R_50', symbol: 'R_50', display: 'Volatility 50 Index', market: 'synthetic_index', marketDisplay: 'Derived' },
  { id: '1HZ25V', symbol: '1HZ25V', display: 'Volatility 25 (1s) Index', market: 'synthetic_index', marketDisplay: 'Derived' },
  { id: '1HZ75V', symbol: '1HZ75V', display: 'Volatility 75 (1s) Index', market: 'synthetic_index', marketDisplay: 'Derived' },
  { id: 'frxEURUSD', symbol: 'frxEURUSD', display: 'EUR/USD', market: 'forex', marketDisplay: 'Forex' },
  { id: 'frxGBPUSD', symbol: 'frxGBPUSD', display: 'GBP/USD', market: 'forex', marketDisplay: 'Forex' },
  { id: 'frxUSDJPY', symbol: 'frxUSDJPY', display: 'USD/JPY', market: 'forex', marketDisplay: 'Forex' },
  { id: 'frxUSDCHF', symbol: 'frxUSDCHF', display: 'USD/CHF', market: 'forex', marketDisplay: 'Forex' },
  { id: 'frxAUDUSD', symbol: 'frxAUDUSD', display: 'AUD/USD', market: 'forex', marketDisplay: 'Forex' },
  { id: 'frxUSDCAD', symbol: 'frxUSDCAD', display: 'USD/CAD', market: 'forex', marketDisplay: 'Forex' },
  { id: 'frxNZDUSD', symbol: 'frxNZDUSD', display: 'NZD/USD', market: 'forex', marketDisplay: 'Forex' },
  { id: 'frxEURGBP', symbol: 'frxEURGBP', display: 'EUR/GBP', market: 'forex', marketDisplay: 'Forex' },
  { id: 'frxEURJPY', symbol: 'frxEURJPY', display: 'EUR/JPY', market: 'forex', marketDisplay: 'Forex' },
  { id: 'frxGBPJPY', symbol: 'frxGBPJPY', display: 'GBP/JPY', market: 'forex', marketDisplay: 'Forex' },
  { id: 'frxXAUUSD', symbol: 'frxXAUUSD', display: 'Gold (XAU/USD)', market: 'commodities', marketDisplay: 'Commodities' },
  { id: 'cryBTCUSD', symbol: 'cryBTCUSD', display: 'BTC/USD', market: 'cryptocurrency', marketDisplay: 'Cryptocurrencies' },
  { id: 'cryETHUSD', symbol: 'cryETHUSD', display: 'ETH/USD', market: 'cryptocurrency', marketDisplay: 'Cryptocurrencies' },
];

export const CURRENCY_PAIRS = INITIAL_CURRENCY_PAIRS;

export const useMarketStore = create<MarketState>((set) => ({
  activeSymbol: INITIAL_CURRENCY_PAIRS[0].id,
  activeTimeframe: "1m",
  symbols: INITIAL_CURRENCY_PAIRS.map(p => p.id),
  availableSymbols: INITIAL_CURRENCY_PAIRS,
  candles: [],
  lastTick: null,
  marketTime: Math.floor(Date.now() / 1000),
  isLoading: true,
  theme: 'light',
  activeTool: null,
  selectedDrawingId: null,
  drawings: [],
  savedScripts: [],
  activeIndicators: [],
  hiddenIndicators: [],

  setSymbol: (symbol) => set({ activeSymbol: symbol, candles: [], isLoading: true, selectedDrawingId: null }),
  setAvailableSymbols: (symbols) => set({ 
    availableSymbols: symbols,
    symbols: symbols.map(s => s.id)
  }),
  setTimeframe: (tf) => set({ activeTimeframe: tf, candles: [], isLoading: true }),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
    return { theme: newTheme };
  }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedDrawing: (id) => set({ selectedDrawingId: id }),
  addDrawing: (drawing) => set((state) => ({ drawings: [...state.drawings, drawing], selectedDrawingId: drawing.id })),
  updateDrawing: (id, updates) => set((state) => ({
    drawings: state.drawings.map(d => d.id === id ? { ...d, ...updates } : d)
  })),
  removeDrawing: (id) => set((state) => ({ 
    drawings: state.drawings.filter(d => d.id !== id),
    selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId
  })),
  clearDrawings: (symbol) => set((state) => ({ drawings: state.drawings.filter(d => d.symbol !== symbol), selectedDrawingId: null })),
  addTick: (tick) => set((state) => {
    if (tick.symbol !== state.activeSymbol) return { ...state, marketTime: Math.floor(tick.time / 1000) };
    return { lastTick: tick, marketTime: Math.floor(tick.time / 1000) };
  }),
  setCandles: (candles) => set({ candles, isLoading: false }),
  updateCandle: (candle) => set((state) => {
     const newCandles = [...state.candles];
     if (newCandles.length === 0) return { candles: [candle], isLoading: false };
     
     const lastIdx = newCandles.length - 1;
     if (newCandles[lastIdx].time === candle.time) {
       newCandles[lastIdx] = candle;
     } else {
       newCandles.push(candle);
       if (newCandles.length > 1000) newCandles.shift();
     }
     return { candles: newCandles, isLoading: false };
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  addScript: (script) => set((state) => ({ savedScripts: [...state.savedScripts, script] })),
  applyScript: (script) => set((state) => ({ activeIndicators: [...state.activeIndicators, script] })),
  removeIndicator: (id) => set((state) => ({ 
    activeIndicators: state.activeIndicators.filter(i => i.id !== id),
    hiddenIndicators: state.hiddenIndicators.filter(hid => hid !== id)
  })),
  toggleIndicatorVisibility: (id) => set((state) => ({
    hiddenIndicators: state.hiddenIndicators.includes(id)
      ? state.hiddenIndicators.filter(hid => hid !== id)
      : [...state.hiddenIndicators, id]
  })),
}));
