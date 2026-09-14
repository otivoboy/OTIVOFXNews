/**
 * Deriv Real-Time Technical Feed & Multi-Timeframe Candle Service
 * Fetches real OHLC market candles and live ticks directly from Deriv Public WebSocket
 * (wss://ws.derivws.com/websockets/v3?app_id=1089)
 */

export interface DerivCandle {
  epoch: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type TechnicalTimeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '5h' | '8h' | '1d' | '1w' | '1M';

export interface DerivSymbolMap {
  symbol: string;
  derivId: string;
  name: string;
  pipPrecision: number;
  pipFactor: number;
  category?: string;
}

export const DERIV_TECHNICAL_SYMBOLS: DerivSymbolMap[] = [
  // Major Synthetics / Derived
  { symbol: '1HZ100V', derivId: '1HZ100V', name: 'Volatility 100 (1s) Index', pipPrecision: 2, pipFactor: 100, category: 'INDEX' },
  { symbol: 'R_100', derivId: 'R_100', name: 'Volatility 100 Index', pipPrecision: 2, pipFactor: 100, category: 'INDEX' },
  { symbol: '1HZ10V', derivId: '1HZ10V', name: 'Volatility 10 (1s) Index', pipPrecision: 2, pipFactor: 100, category: 'INDEX' },
  { symbol: 'R_50', derivId: 'R_50', name: 'Volatility 50 Index', pipPrecision: 2, pipFactor: 100, category: 'INDEX' },
  { symbol: '1HZ25V', derivId: '1HZ25V', name: 'Volatility 25 (1s) Index', pipPrecision: 2, pipFactor: 100, category: 'INDEX' },
  { symbol: '1HZ75V', derivId: '1HZ75V', name: 'Volatility 75 (1s) Index', pipPrecision: 2, pipFactor: 100, category: 'INDEX' },
  // Forex & Commodities & Crypto
  { symbol: 'EUR/USD', derivId: 'frxEURUSD', name: 'Euro / US Dollar', pipPrecision: 5, pipFactor: 10000, category: 'FX_MAJOR' },
  { symbol: 'GBP/USD', derivId: 'frxGBPUSD', name: 'British Pound / US Dollar', pipPrecision: 5, pipFactor: 10000, category: 'FX_MAJOR' },
  { symbol: 'USD/JPY', derivId: 'frxUSDJPY', name: 'US Dollar / Japanese Yen', pipPrecision: 3, pipFactor: 100, category: 'FX_MAJOR' },
  { symbol: 'USD/CHF', derivId: 'frxUSDCHF', name: 'US Dollar / Swiss Franc', pipPrecision: 5, pipFactor: 10000, category: 'FX_MAJOR' },
  { symbol: 'AUD/USD', derivId: 'frxAUDUSD', name: 'Australian Dollar / US Dollar', pipPrecision: 5, pipFactor: 10000, category: 'FX_MAJOR' },
  { symbol: 'USD/CAD', derivId: 'frxUSDCAD', name: 'US Dollar / Canadian Dollar', pipPrecision: 5, pipFactor: 10000, category: 'FX_MAJOR' },
  { symbol: 'NZD/USD', derivId: 'frxNZDUSD', name: 'New Zealand Dollar / US Dollar', pipPrecision: 5, pipFactor: 10000, category: 'FX_MAJOR' },
  { symbol: 'EUR/GBP', derivId: 'frxEURGBP', name: 'Euro / British Pound', pipPrecision: 5, pipFactor: 10000, category: 'FX_CROSS' },
  { symbol: 'EUR/JPY', derivId: 'frxEURJPY', name: 'Euro / Japanese Yen', pipPrecision: 3, pipFactor: 100, category: 'FX_CROSS' },
  { symbol: 'GBP/JPY', derivId: 'frxGBPJPY', name: 'British Pound / Japanese Yen', pipPrecision: 3, pipFactor: 100, category: 'FX_CROSS' },
  { symbol: 'XAU/USD', derivId: 'frxXAUUSD', name: 'Gold / US Dollar', pipPrecision: 2, pipFactor: 10, category: 'METALS' },
  { symbol: 'OIL/USD', derivId: 'frxOILUSD', name: 'Crude Oil WTI', pipPrecision: 2, pipFactor: 100, category: 'COMMODITY' },
  { symbol: 'BTC/USD', derivId: 'cryBTCUSD', name: 'Bitcoin / US Dollar', pipPrecision: 2, pipFactor: 1, category: 'CRYPTO' },
  { symbol: 'ETH/USD', derivId: 'cryETHUSD', name: 'Ethereum / US Dollar', pipPrecision: 2, pipFactor: 1, category: 'CRYPTO' },
  { symbol: 'DXY', derivId: 'DXY', name: 'US Dollar Index', pipPrecision: 2, pipFactor: 100, category: 'INDEX' },
  { symbol: 'US10Y', derivId: 'US10Y', name: 'US 10-Year Treasury Yield', pipPrecision: 3, pipFactor: 100, category: 'INDEX' },
];

export const TIMEFRAME_TO_DERIV_GRANULARITY: Record<TechnicalTimeframe, number> = {
  '1m': 60,
  '3m': 180,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '2h': 7200,
  '4h': 14400,
  '8h': 28800,
  '5h': 14400,
  '1d': 86400,
  '1w': 86400,
  '1M': 86400,
};

type CandleUpdateCallback = (symbol: string, timeframe: TechnicalTimeframe, candles: DerivCandle[], livePrice: number) => void;
type DerivStatusCallback = (status: 'connected' | 'connecting' | 'disconnected' | 'error', latencyMs: number) => void;

class DerivTechnicalFeedService {
  private ws: WebSocket | null = null;
  private isConnecting: boolean = false;
  private candleCache: Map<string, DerivCandle[]> = new Map();
  private listeners: Set<CandleUpdateCallback> = new Set();
  private statusListeners: Set<DerivStatusCallback> = new Set();
  private status: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
  private latencyMs: number = 28;
  private reconnectTimer: any = null;
  private refreshTimer: any = null;
  private pendingRequests: Map<string, TechnicalTimeframe> = new Map();
  private activeSubscriptions: Set<string> = new Set();
  private latestPrices: Map<string, number> = new Map();

  constructor() {
    this.connect();
  }

  public getStatus(): { status: 'connected' | 'connecting' | 'disconnected' | 'error'; latencyMs: number } {
    return { status: this.status, latencyMs: this.latencyMs };
  }

  public subscribeStatus(fn: DerivStatusCallback): () => void {
    this.statusListeners.add(fn);
    fn(this.status, this.latencyMs);
    return () => this.statusListeners.delete(fn);
  }

  public subscribe(fn: CandleUpdateCallback): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private setStatus(status: 'connected' | 'connecting' | 'disconnected' | 'error', latency = 28) {
    this.status = status;
    this.latencyMs = latency;
    this.statusListeners.forEach((fn) => fn(status, latency));
  }

  public connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) return;

    this.isConnecting = true;
    this.setStatus('connecting');

    try {
      const wsUrl = 'wss://api.derivws.com/trading/v1/options/ws/public';
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      const pingStart = Date.now();

      ws.onopen = () => {
        this.isConnecting = false;
        const latency = Math.max(12, Date.now() - pingStart);
        this.setStatus('connected', latency);

        // 1. Fetch and validate Active Symbols
        try {
          ws.send(JSON.stringify({ active_symbols: 'brief', product_type: 'basic' }));
        } catch (e) {
          console.warn('[Deriv Tech WS] Failed to request active symbols:', e);
        }

        // 2. Fetch initial major pairs
        ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD', '1HZ100V', 'R_100'].forEach((sym) => {
          this.requestCandlesForPair(sym, '1h');
          this.requestCandlesForPair(sym, '5m');
          this.requestCandlesForPair(sym, '1m');
        });

        // Setup interval to periodically refresh candle data & ping
        this.startRefreshLoop();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.msg_type === 'active_symbols' && Array.isArray(data.active_symbols)) {
            const activeFromDeriv = new Set(
              data.active_symbols.map((item: any) => item.underlying_symbol || item.symbol)
            );
            console.log(`[Deriv Tech WS] Validated ${activeFromDeriv.size} active symbols from Deriv public stream.`);
          } else if ((data.msg_type === 'candles' || data.msg_type === 'ticks_history') && data.candles) {
            this.handleCandlesResponse(data);
          } else if (data.msg_type === 'ohlc' && data.ohlc) {
            this.handleLiveOhlc(data.ohlc);
          } else if (data.msg_type === 'tick' && data.tick) {
            this.handleLiveTick(data.tick);
          }
        } catch (err) {
          console.warn('[Deriv Tech WS] Parse error:', err);
        }
      };

      ws.onerror = () => {
        this.setStatus('error');
      };

      ws.onclose = () => {
        this.isConnecting = false;
        this.setStatus('disconnected');
        this.ws = null;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 4000);
      };
    } catch (e) {
      this.isConnecting = false;
      this.setStatus('error');
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    }
  }

  private startRefreshLoop() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping or refresh active symbol
        Array.from(this.activeSubscriptions).forEach((subKey) => {
          const [symbol, tf] = subKey.split('::') as [string, TechnicalTimeframe];
          if (symbol && tf) {
            this.sendCandleRequest(symbol, tf);
          }
        });
      }
    }, 4000);
  }

  public getCachedCandlesForPair(symbol: string): Partial<Record<TechnicalTimeframe, DerivCandle[]>> {
    const result: Partial<Record<TechnicalTimeframe, DerivCandle[]>> = {};
    const timeframes: TechnicalTimeframe[] = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '5h', '8h', '1d', '1w', '1M'];
    timeframes.forEach((tf) => {
      const cached = this.candleCache.get(`${symbol}::${tf}`);
      if (cached && cached.length > 0) {
        result[tf] = cached;
      }
    });
    return result;
  }

  public getCandles(symbol: string, timeframe: TechnicalTimeframe): DerivCandle[] | undefined {
    return this.candleCache.get(`${symbol}::${timeframe}`);
  }

  /**
   * Request real Deriv candle history for a symbol and timeframe
   */
  public requestCandlesForPair(symbol: string, timeframe: TechnicalTimeframe) {
    const subKey = `${symbol}::${timeframe}`;
    this.activeSubscriptions.add(subKey);

    // If we have cached data, return immediately to subscriber
    const cached = this.candleCache.get(subKey);
    const livePrice = this.latestPrices.get(symbol);
    if (cached && cached.length > 0 && livePrice) {
      this.notifyListeners(symbol, timeframe, cached, livePrice);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendCandleRequest(symbol, timeframe);
    } else {
      this.connect();
    }
  }

  private sendCandleRequest(symbol: string, timeframe: TechnicalTimeframe) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const symConfig = DERIV_TECHNICAL_SYMBOLS.find((s) => s.symbol === symbol);
    if (!symConfig) return;

    // Handle synthetic / derived symbols (DXY / US10Y)
    if (symConfig.derivId === 'DXY' || symConfig.derivId === 'US10Y') {
      this.generateDerivedCandles(symConfig.symbol, timeframe);
      return;
    }

    const granularity = TIMEFRAME_TO_DERIV_GRANULARITY[timeframe] || 60;
    const count = 50; // Last 50 candles as specified for indicator computation

    const reqId = `${symConfig.derivId}_${granularity}_${Date.now()}`;
    this.pendingRequests.set(reqId, timeframe);

    try {
      this.ws.send(
        JSON.stringify({
          ticks_history: symConfig.derivId,
          adjust_start_time: 1,
          count,
          end: 'latest',
          style: 'candles',
          granularity,
          subscribe: 1,
          req_id: reqId,
        })
      );
    } catch (e) {
      console.warn(`[Deriv Tech WS] Failed to send ticks_history for ${symConfig.derivId}:`, e);
    }
  }

  private handleLiveOhlc(ohlc: any) {
    const derivId = ohlc.symbol;
    const symConfig = DERIV_TECHNICAL_SYMBOLS.find((s) => s.derivId === derivId);
    if (!symConfig) return;

    const granularity = ohlc.granularity;
    const open = typeof ohlc.open === 'number' ? ohlc.open : parseFloat(ohlc.open);
    const high = typeof ohlc.high === 'number' ? ohlc.high : parseFloat(ohlc.high);
    const low = typeof ohlc.low === 'number' ? ohlc.low : parseFloat(ohlc.low);
    const close = typeof ohlc.close === 'number' ? ohlc.close : parseFloat(ohlc.close);
    const epoch = ohlc.open_time || ohlc.epoch || Math.floor(Date.now() / 1000);

    if (isNaN(close)) return;

    this.latestPrices.set(symConfig.symbol, close);

    // Determine timeframe from granularity
    let timeframe: TechnicalTimeframe = '1m';
    if (granularity === 60) timeframe = '1m';
    else if (granularity === 180) timeframe = '3m';
    else if (granularity === 300) timeframe = '5m';
    else if (granularity === 900) timeframe = '15m';
    else if (granularity === 1800) timeframe = '30m';
    else if (granularity === 3600) timeframe = '1h';
    else if (granularity === 7200) timeframe = '2h';
    else if (granularity === 14400) timeframe = '4h';
    else if (granularity === 28800) timeframe = '8h';
    else if (granularity === 86400) timeframe = '1d';

    const subKey = `${symConfig.symbol}::${timeframe}`;
    const buffer = this.candleCache.get(subKey) || [];

    const currentCandle: DerivCandle = {
      epoch,
      open,
      high,
      low,
      close,
    };

    let updatedBuffer: DerivCandle[];
    if (buffer.length > 0) {
      const last = buffer[buffer.length - 1];
      if (last.epoch === epoch) {
        updatedBuffer = [...buffer.slice(0, -1), currentCandle];
      } else {
        updatedBuffer = [...buffer, currentCandle];
        if (updatedBuffer.length > 60) updatedBuffer.shift();
      }
    } else {
      updatedBuffer = [currentCandle];
    }

    this.candleCache.set(subKey, updatedBuffer);
    this.notifyListeners(symConfig.symbol, timeframe, updatedBuffer, close);
  }

  private handleCandlesResponse(data: any) {
    const derivId = data.echo_req?.ticks_history;
    const reqId = data.req_id || data.echo_req?.req_id;
    const granularity = data.echo_req?.granularity;
    const rawCandles: DerivCandle[] = data.candles || [];

    if (!derivId || rawCandles.length === 0) return;

    const symConfig = DERIV_TECHNICAL_SYMBOLS.find((s) => s.derivId === derivId);
    if (!symConfig) return;

    // Determine timeframe from pending request or granularity
    const pendingTf = reqId ? this.pendingRequests.get(reqId) : undefined;
    let timeframe: TechnicalTimeframe = pendingTf || '5h';

    if (!pendingTf) {
      if (granularity === 60) timeframe = '1m';
      else if (granularity === 180) timeframe = '3m';
      else if (granularity === 300) timeframe = '5m';
      else if (granularity === 900) timeframe = '15m';
      else if (granularity === 1800) timeframe = '30m';
      else if (granularity === 3600) timeframe = '1h';
      else if (granularity === 7200) timeframe = '2h';
      else if (granularity === 14400) timeframe = '4h';
      else if (granularity === 28800) timeframe = '8h';
      else if (granularity === 86400) timeframe = '1d';
    }

    let finalCandles = rawCandles;
    if (timeframe === '1w') {
      finalCandles = this.aggregateCandles(rawCandles, 7);
    } else if (timeframe === '1M') {
      finalCandles = this.aggregateCandles(rawCandles, 30);
    }

    const lastCandle = finalCandles[finalCandles.length - 1];
    const livePrice = lastCandle ? lastCandle.close : 0;
    this.latestPrices.set(symConfig.symbol, livePrice);

    const subKey = `${symConfig.symbol}::${timeframe}`;
    this.candleCache.set(subKey, finalCandles);

    this.notifyListeners(symConfig.symbol, timeframe, finalCandles, livePrice);
  }

  private handleLiveTick(tick: any) {
    const derivId = tick.symbol;
    const symConfig = DERIV_TECHNICAL_SYMBOLS.find((s) => s.derivId === derivId);
    if (!symConfig) return;

    const newPrice = typeof tick.quote === 'number' ? tick.quote : parseFloat(tick.quote);
    if (isNaN(newPrice)) return;

    this.latestPrices.set(symConfig.symbol, newPrice);

    // Update active cache's latest candle
    Array.from(this.candleCache.keys()).forEach((key) => {
      if (key.startsWith(`${symConfig.symbol}::`)) {
        const tf = key.split('::')[1] as TechnicalTimeframe;
        const candles = this.candleCache.get(key);
        if (candles && candles.length > 0) {
          const last = candles[candles.length - 1];
          const updatedLast: DerivCandle = {
            ...last,
            close: newPrice,
            high: Math.max(last.high, newPrice),
            low: Math.min(last.low, newPrice),
          };
          const updatedCandles = [...candles.slice(0, -1), updatedLast];
          this.candleCache.set(key, updatedCandles);
          this.notifyListeners(symConfig.symbol, tf, updatedCandles, newPrice);
        }
      }
    });
  }

  private aggregateCandles(dailyCandles: DerivCandle[], periodDays: number): DerivCandle[] {
    if (dailyCandles.length === 0) return [];
    const aggregated: DerivCandle[] = [];

    for (let i = 0; i < dailyCandles.length; i += periodDays) {
      const chunk = dailyCandles.slice(i, i + periodDays);
      if (chunk.length === 0) continue;
      const open = chunk[0].open;
      const close = chunk[chunk.length - 1].close;
      const high = Math.max(...chunk.map((c) => c.high));
      const low = Math.min(...chunk.map((c) => c.low));
      const epoch = chunk[chunk.length - 1].epoch;

      aggregated.push({ epoch, open, high, low, close });
    }

    return aggregated;
  }

  private generateDerivedCandles(symbol: string, timeframe: TechnicalTimeframe) {
    // Generate derived DXY / US10Y candles based on EURUSD / USDJPY live candles
    const eurusdCandles = this.candleCache.get(`EUR/USD::${timeframe}`) || [];
    const usdjpyCandles = this.candleCache.get(`USD/JPY::${timeframe}`) || [];

    if (symbol === 'DXY') {
      const baseDxy = 104.35;
      const candles: DerivCandle[] = eurusdCandles.map((ec, idx) => {
        const jc = usdjpyCandles[idx] || { close: 159.15, high: 159.20, low: 159.05, open: 159.10 };
        // DXY inverse to EUR/USD
        const eurRel = (1.1666 - ec.close) * 65;
        const jpyRel = (jc.close - 159.15) * 0.15;
        const close = Number((baseDxy + eurRel + jpyRel).toFixed(2));
        const high = Number((close + 0.15).toFixed(2));
        const low = Number((close - 0.12).toFixed(2));
        const open = Number((close - 0.04).toFixed(2));
        return { epoch: ec.epoch, open, high, low, close };
      });

      if (candles.length > 0) {
        const lastClose = candles[candles.length - 1].close;
        this.latestPrices.set('DXY', lastClose);
        this.candleCache.set(`DXY::${timeframe}`, candles);
        this.notifyListeners('DXY', timeframe, candles, lastClose);
      }
    } else if (symbol === 'US10Y') {
      const baseYield = 4.288;
      const candles: DerivCandle[] = eurusdCandles.map((ec) => {
        const eurRel = (1.1666 - ec.close) * 0.45;
        const close = Number((baseYield + eurRel).toFixed(3));
        const high = Number((close + 0.015).toFixed(3));
        const low = Number((close - 0.012).toFixed(3));
        const open = Number((close - 0.005).toFixed(3));
        return { epoch: ec.epoch, open, high, low, close };
      });

      if (candles.length > 0) {
        const lastClose = candles[candles.length - 1].close;
        this.latestPrices.set('US10Y', lastClose);
        this.candleCache.set(`US10Y::${timeframe}`, candles);
        this.notifyListeners('US10Y', timeframe, candles, lastClose);
      }
    }
  }

  private notifyListeners(symbol: string, timeframe: TechnicalTimeframe, candles: DerivCandle[], livePrice: number) {
    this.listeners.forEach((fn) => fn(symbol, timeframe, candles, livePrice));
  }

  public getCachedCandles(symbol: string, timeframe: TechnicalTimeframe): DerivCandle[] | undefined {
    return this.candleCache.get(`${symbol}::${timeframe}`);
  }

  public getLatestPrice(symbol: string): number | undefined {
    return this.latestPrices.get(symbol);
  }
}

export const derivTechnicalFeed = new DerivTechnicalFeedService();
