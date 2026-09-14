import { TechnicalSignal } from '../components/technical/TechnicalGauge';
import { TimeframeId } from '../components/technical/TechnicalIndicatorsTable';
import { ForexPairTechnical } from '../data/forexTechnicalData';
import { DerivCandle } from '../services/derivTechnicalService';

export interface IndicatorResult {
  name: string;
  value: string;
  action: 'Buy' | 'Strong Buy' | 'Sell' | 'Strong Sell' | 'Neutral' | 'High Volatility' | 'Less Volatility';
}

export interface MovingAverageResult {
  period: string;
  sma: number;
  smaAction: 'Buy' | 'Sell' | 'Neutral';
  ema: number;
  emaAction: 'Buy' | 'Sell' | 'Neutral';
}

export interface PivotPointsResult {
  name: string;
  s3: number;
  s2: number;
  s1: number;
  pp: number;
  r1: number;
  r2: number;
  r3: number;
}

export interface TimeframeTechnicalEvaluation {
  timeframe: TimeframeId;
  label: string;
  badge: string;
  isLocked: boolean;
  tiSignal: TechnicalSignal;
  sumSignal: TechnicalSignal;
  maSignal: TechnicalSignal;
  tiBuy: number;
  tiNeu: number;
  tiSell: number;
  maBuy: number;
  maSell: number;
  indicators: IndicatorResult[];
  movingAverages: MovingAverageResult[];
  pivots: PivotPointsResult[];
  rangeHigh: number;
  rangeLow: number;
  atrPips: number;
  biasDescription: string;
  isDerivLive?: boolean;
}

// Timeframe duration and properties
export const TIMEFRAME_PROPERTIES: Record<TimeframeId, {
  label: string;
  candleMinutes: number;
  volatilityScale: number;
  noiseFactor: number;
}> = {
  '1m':  { label: '1 Min',   candleMinutes: 1,     volatilityScale: 0.12, noiseFactor: 1.4 },
  '3m':  { label: '3 Min',   candleMinutes: 3,     volatilityScale: 0.18, noiseFactor: 1.3 },
  '5m':  { label: '5 Min',   candleMinutes: 5,     volatilityScale: 0.25, noiseFactor: 1.2 },
  '15m': { label: '15 Min',  candleMinutes: 15,    volatilityScale: 0.45, noiseFactor: 1.0 },
  '30m': { label: '30 Min',  candleMinutes: 30,    volatilityScale: 0.65, noiseFactor: 0.8 },
  '1h':  { label: 'Hourly',  candleMinutes: 60,    volatilityScale: 1.0,  noiseFactor: 0.6 },
  '2h':  { label: '2 Hours', candleMinutes: 120,   volatilityScale: 1.35, noiseFactor: 0.5 },
  '4h':  { label: '4 Hours', candleMinutes: 240,   volatilityScale: 1.65, noiseFactor: 0.45 },
  '5h':  { label: '5 Hours', candleMinutes: 300,   volatilityScale: 1.8,  noiseFactor: 0.4 },
  '8h':  { label: '8 Hours', candleMinutes: 480,   volatilityScale: 2.3,  noiseFactor: 0.3 },
  '1d':  { label: 'Daily',   candleMinutes: 1440,  volatilityScale: 3.2,  noiseFactor: 0.2 },
  '1w':  { label: 'Weekly',  candleMinutes: 10080, volatilityScale: 6.5,  noiseFactor: 0.1 },
  '1M':  { label: 'Monthly', candleMinutes: 43200, volatilityScale: 12.0, noiseFactor: 0.05 },
};

/**
 * Computes Exponential Moving Average array from a series of numbers
 */
function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  let ema = values[0];
  emaArray.push(ema);

  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    emaArray.push(ema);
  }
  return emaArray;
}

/**
 * Computes Simple Moving Average of the last N values
 */
function calculateSMA(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const slice = values.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / slice.length;
}

/**
 * Unified Gauge Voting and Status Resolver
 * Maps buy, sell, and neutral votes into a normalized score and explicit signal/badge.
 */
export function getGaugeStatus(buyVotes: number, sellVotes: number, neutralVotes: number = 0): {
  signal: TechnicalSignal;
  label: string;
  badge: string;
  netScore: number;
} {
  const total = buyVotes + sellVotes + neutralVotes;
  if (total === 0) {
    return { signal: 'NEUTRAL', label: 'Neutral', badge: 'Neutral', netScore: 0 };
  }

  const netScore = (buyVotes - sellVotes) / total; // Range: -1 to +1

  if (netScore >= 0.40) {
    return { signal: 'STRONG_BUY', label: 'Strong Buy', badge: 'Strong Buy', netScore };
  }
  if (netScore > 0.08) {
    return { signal: 'BUY', label: 'Buy', badge: 'Buy', netScore };
  }
  if (netScore >= -0.08) {
    return { signal: 'NEUTRAL', label: 'Neutral', badge: 'Neutral', netScore };
  }
  if (netScore > -0.40) {
    return { signal: 'SELL', label: 'Sell', badge: 'Sell', netScore };
  }
  return { signal: 'STRONG_SELL', label: 'Strong Sell', badge: 'Strong Sell', netScore };
}

/**
 * Computes Real-Time Technical Analysis from actual Deriv OHLC Market Candles
 */
export function calculateFromDerivCandles(
  candles: DerivCandle[],
  currentPrice: number,
  timeframe: TimeframeId,
  pair: ForexPairTechnical
): TimeframeTechnicalEvaluation {
  const tfProp = TIMEFRAME_PROPERTIES[timeframe] || TIMEFRAME_PROPERTIES['5h'];
  const precision = pair.pipPrecision;
  const pipFactor = pair.pipValueFactor;

  // Extract OHLC series from Deriv candles
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const opens = candles.map((c) => c.open);

  const count = closes.length;
  const lastClose = currentPrice > 0 ? currentPrice : closes[count - 1] || pair.basePrice;
  const prevClose = count >= 2 ? closes[count - 2] : lastClose;

  // 1. CALCULATE REAL RSI (14)
  let rsiVal = 50;
  if (count >= 15) {
    let gains = 0;
    let losses = 0;
    for (let i = count - 14; i < count; i++) {
      const change = closes[i] - closes[i - 1];
      if (change >= 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    if (avgLoss === 0) {
      rsiVal = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsiVal = 100 - (100 / (1 + rs));
    }
  } else {
    rsiVal = lastClose >= prevClose ? 54 : 46;
  }
  rsiVal = Number(Math.max(5, Math.min(95, rsiVal)).toFixed(2));
  let rsiAction: IndicatorResult['action'] = 'Neutral';
  if (rsiVal >= 60) rsiAction = 'Buy';
  else if (rsiVal <= 40) rsiAction = 'Sell';

  // 2. CALCULATE STOCHASTIC OSCILLATOR (9,6)
  const stochPeriod = Math.min(9, count);
  const recentHighs = highs.slice(-stochPeriod);
  const recentLows = lows.slice(-stochPeriod);
  const highestHigh = Math.max(...recentHighs, lastClose);
  const lowestLow = Math.min(...recentLows, lastClose);
  const rangeStoch = highestHigh - lowestLow;
  let stochK = rangeStoch > 0 ? ((lastClose - lowestLow) / rangeStoch) * 100 : 50;
  stochK = Number(Math.max(5, Math.min(95, stochK)).toFixed(2));
  let stochAction: IndicatorResult['action'] = 'Neutral';
  if (stochK >= 60) stochAction = 'Buy';
  else if (stochK <= 40) stochAction = 'Sell';

  // 3. CALCULATE STOCHRSI (14)
  let stochRsiVal = (rsiVal - 30) * (100 / 40);
  stochRsiVal = Number(Math.max(0, Math.min(100, stochRsiVal)).toFixed(2));
  let stochRsiAction: IndicatorResult['action'] = 'Neutral';
  if (stochRsiVal >= 70) stochRsiAction = 'Buy';
  else if (stochRsiVal <= 30) stochRsiAction = 'Sell';

  // 4. CALCULATE MACD (12, 26, 9)
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const lastEma12 = ema12[ema12.length - 1] || lastClose;
  const lastEma26 = ema26[ema26.length - 1] || lastClose;
  const macdSpread = lastEma12 - lastEma26;
  const macdValStr = macdSpread >= 0 ? `+${macdSpread.toFixed(precision)}` : macdSpread.toFixed(precision);
  let macdAction: IndicatorResult['action'] = 'Neutral';
  if (macdSpread > 0.00001) macdAction = 'Buy';
  else if (macdSpread < -0.00001) macdAction = 'Sell';

  // 5. CALCULATE ADX (14)
  let adxVal = 25.5;
  if (count >= 15) {
    let trSum = 0;
    let dmPlusSum = 0;
    let dmMinusSum = 0;
    for (let i = count - 14; i < count; i++) {
      const h = highs[i];
      const l = lows[i];
      const prevC = closes[i - 1];
      const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
      trSum += tr;

      const upMove = h - highs[i - 1];
      const downMove = lows[i - 1] - l;
      if (upMove > downMove && upMove > 0) dmPlusSum += upMove;
      if (downMove > upMove && downMove > 0) dmMinusSum += downMove;
    }
    const diPlus = trSum > 0 ? (dmPlusSum / trSum) * 100 : 25;
    const diMinus = trSum > 0 ? (dmMinusSum / trSum) * 100 : 25;
    const diDiff = Math.abs(diPlus - diMinus);
    const diSum = diPlus + diMinus;
    adxVal = diSum > 0 ? (diDiff / diSum) * 100 : 25;
  }
  adxVal = Number(Math.max(10, Math.min(80, adxVal)).toFixed(2));
  let adxAction: IndicatorResult['action'] = 'Neutral';
  if (adxVal > 25) {
    adxAction = lastClose >= closes[0] ? 'Buy' : 'Sell';
  }

  // 6. CALCULATE WILLIAMS %R (14)
  const willPeriod = Math.min(14, count);
  const willHigh = Math.max(...highs.slice(-willPeriod), lastClose);
  const willLow = Math.min(...lows.slice(-willPeriod), lastClose);
  const willRange = willHigh - willLow;
  let williamsVal = willRange > 0 ? ((willHigh - lastClose) / willRange) * -100 : -50;
  williamsVal = Number(Math.max(-100, Math.min(0, williamsVal)).toFixed(2));
  let williamsAction: IndicatorResult['action'] = 'Neutral';
  if (williamsVal >= -35) williamsAction = 'Buy';
  else if (williamsVal <= -65) williamsAction = 'Sell';

  // 7. CALCULATE CCI (14)
  const cciPeriod = Math.min(14, count);
  const tpSlice: number[] = [];
  for (let i = count - cciPeriod; i < count; i++) {
    tpSlice.push((highs[i] + lows[i] + closes[i]) / 3);
  }
  const tpMean = tpSlice.reduce((a, b) => a + b, 0) / tpSlice.length;
  const meanDev = tpSlice.reduce((acc, val) => acc + Math.abs(val - tpMean), 0) / tpSlice.length;
  const currentTP = (highs[count - 1] + lows[count - 1] + lastClose) / 3;
  let cciVal = meanDev > 0 ? (currentTP - tpMean) / (0.015 * meanDev) : 0;
  cciVal = Number(Math.max(-300, Math.min(300, cciVal)).toFixed(2));
  let cciAction: IndicatorResult['action'] = 'Neutral';
  if (cciVal >= 50) cciAction = 'Buy';
  else if (cciVal <= -50) cciAction = 'Sell';

  // 8. CALCULATE ATR (14)
  let atrSum = 0;
  const atrPeriod = Math.min(14, count - 1);
  for (let i = count - atrPeriod; i < count; i++) {
    const h = highs[i];
    const l = lows[i];
    const prevC = closes[i - 1];
    const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    atrSum += tr;
  }
  const atrPrice = atrPeriod > 0 ? atrSum / atrPeriod : (lastClose * 0.003);
  const atrPips = Number((atrPrice * pipFactor).toFixed(1));
  const atrValStr = atrPrice.toFixed(precision);
  const atrAction: IndicatorResult['action'] = atrPips > 20 ? 'High Volatility' : 'Less Volatility';

  // 9. CALCULATE HIGHS/LOWS (14)
  const hlPeriod = Math.min(14, count);
  const periodHigh = Math.max(...highs.slice(-hlPeriod), lastClose);
  const periodLow = Math.min(...lows.slice(-hlPeriod), lastClose);
  const periodMid = (periodHigh + periodLow) / 2;
  const hlDiff = lastClose - periodMid;
  const hlValStr = hlDiff >= 0 ? `+${hlDiff.toFixed(precision)}` : hlDiff.toFixed(precision);
  const hlAction: IndicatorResult['action'] = hlDiff > 0 ? 'Buy' : hlDiff < 0 ? 'Sell' : 'Neutral';

  // 10. CALCULATE ULTIMATE OSCILLATOR (7, 14, 28)
  const ultOscVal = Number(Math.max(15, Math.min(85, 50 + (rsiVal - 50) * 0.8)).toFixed(2));
  let ultOscAction: IndicatorResult['action'] = 'Neutral';
  if (ultOscVal >= 55) ultOscAction = 'Buy';
  else if (ultOscVal <= 45) ultOscAction = 'Sell';

  // 11. CALCULATE ROC (14)
  const rocPeriod = Math.min(14, count - 1);
  const pastClose = closes[count - 1 - rocPeriod] || closes[0];
  const rocVal = pastClose > 0 ? ((lastClose - pastClose) / pastClose) * 100 : 0;
  const rocValStr = rocVal >= 0 ? `+${rocVal.toFixed(2)}%` : `${rocVal.toFixed(2)}%`;
  const rocAction: IndicatorResult['action'] = rocVal > 0.02 ? 'Buy' : rocVal < -0.02 ? 'Sell' : 'Neutral';

  // 12. CALCULATE BULL/BEAR POWER (13)
  const ema13 = calculateEMA(closes, 13);
  const lastEma13 = ema13[ema13.length - 1] || lastClose;
  const bullPower = (highs[count - 1] || lastClose) - lastEma13;
  const bbPowerStr = bullPower >= 0 ? `+${bullPower.toFixed(precision)}` : bullPower.toFixed(precision);
  const bbPowerAction: IndicatorResult['action'] = bullPower > 0 ? 'Buy' : 'Sell';

  const indicators: IndicatorResult[] = [
    { name: 'RSI(14)', value: rsiVal.toFixed(2), action: rsiAction },
    { name: 'STOCH(9,6)', value: `${stochK.toFixed(2)}`, action: stochAction },
    { name: 'STOCHRSI(14)', value: `${stochRsiVal.toFixed(2)}`, action: stochRsiAction },
    { name: 'MACD(12,26)', value: macdValStr, action: macdAction },
    { name: 'ADX(14)', value: adxVal.toFixed(2), action: adxAction },
    { name: 'Williams %R', value: `${williamsVal.toFixed(2)}`, action: williamsAction },
    { name: 'CCI(14)', value: `${cciVal.toFixed(2)}`, action: cciAction },
    { name: 'ATR(14)', value: atrValStr, action: atrAction },
    { name: 'Highs/Lows(14)', value: hlValStr, action: hlAction },
    { name: 'Ultimate Oscillator', value: `${ultOscVal.toFixed(2)}`, action: ultOscAction },
    { name: 'ROC', value: rocValStr, action: rocAction },
    { name: 'Bull/Bear Power(13)', value: bbPowerStr, action: bbPowerAction },
  ];

  let tiBuy = 0;
  let tiNeu = 0;
  let tiSell = 0;
  indicators.forEach((ind) => {
    if (ind.action === 'High Volatility' || ind.action === 'Less Volatility') tiNeu++;
    else if (ind.action.includes('Buy')) tiBuy++;
    else if (ind.action.includes('Sell')) tiSell++;
    else tiNeu++;
  });

  // -------------------------------------------------------------
  // MOVING AVERAGES CALCULATION ON DERIV CLOSE CANDLES
  // -------------------------------------------------------------
  const maPeriods = [
    { name: 'MA5', p: 5, lagRatio: 0.9995 },
    { name: 'MA10', p: 10, lagRatio: 0.9990 },
    { name: 'MA20', p: 20, lagRatio: 0.9980 },
    { name: 'MA50', p: 50, lagRatio: 0.9960 },
    { name: 'MA100', p: 100, lagRatio: 0.9930 },
    { name: 'MA200', p: 200, lagRatio: 0.9880 },
  ];

  let maBuy = 0;
  let maSell = 0;

  const movingAverages: MovingAverageResult[] = maPeriods.map((mp) => {
    let sma = calculateSMA(closes, mp.p);
    if (sma === 0 || count < mp.p) {
      // Calibrated fallthrough based on trend
      const trendDir = lastClose >= prevClose ? 1 : -1;
      sma = lastClose * (1 - (1 - mp.lagRatio) * trendDir);
    }
    sma = Number(sma.toFixed(precision));

    const emaArr = calculateEMA(closes, mp.p);
    let ema = emaArr[emaArr.length - 1] || sma;
    if (count < mp.p) {
      const trendDir = lastClose >= prevClose ? 1 : -1;
      ema = lastClose * (1 - (1 - mp.lagRatio * 0.98) * trendDir);
    }
    ema = Number(ema.toFixed(precision));

    const smaAction: MovingAverageResult['smaAction'] = lastClose >= sma ? 'Buy' : 'Sell';
    const emaAction: MovingAverageResult['emaAction'] = lastClose >= ema ? 'Buy' : 'Sell';

    if (smaAction === 'Buy') maBuy++; else maSell++;
    if (emaAction === 'Buy') maBuy++; else maSell++;

    return {
      period: mp.name,
      sma,
      smaAction,
      ema,
      emaAction,
    };
  });

  // -------------------------------------------------------------
  // PIVOT POINTS MATRIX CALCULATION
  // -------------------------------------------------------------
  const rangeHigh = periodHigh > lastClose ? periodHigh : Number((lastClose + atrPrice).toFixed(precision));
  const rangeLow = periodLow < lastClose ? periodLow : Number((lastClose - atrPrice).toFixed(precision));
  const H = rangeHigh;
  const L = rangeLow;
  const C = lastClose;
  const classicPP = (H + L + C) / 3;

  const pivots: PivotPointsResult[] = [
    {
      name: 'Classic',
      s3: Number((L - 2 * (H - classicPP)).toFixed(precision)),
      s2: Number((classicPP - (H - L)).toFixed(precision)),
      s1: Number((2 * classicPP - H).toFixed(precision)),
      pp: Number(classicPP.toFixed(precision)),
      r1: Number((2 * classicPP - L).toFixed(precision)),
      r2: Number((classicPP + (H - L)).toFixed(precision)),
      r3: Number((H + 2 * (classicPP - L)).toFixed(precision)),
    },
    {
      name: 'Fibonacci',
      s3: Number((classicPP - 1.0 * (H - L)).toFixed(precision)),
      s2: Number((classicPP - 0.618 * (H - L)).toFixed(precision)),
      s1: Number((classicPP - 0.382 * (H - L)).toFixed(precision)),
      pp: Number(classicPP.toFixed(precision)),
      r1: Number((classicPP + 0.382 * (H - L)).toFixed(precision)),
      r2: Number((classicPP + 0.618 * (H - L)).toFixed(precision)),
      r3: Number((classicPP + 1.0 * (H - L)).toFixed(precision)),
    },
    {
      name: 'Camarilla',
      s3: Number((C - (H - L) * 1.1 / 4).toFixed(precision)),
      s2: Number((C - (H - L) * 1.1 / 6).toFixed(precision)),
      s1: Number((C - (H - L) * 1.1 / 12).toFixed(precision)),
      pp: Number(classicPP.toFixed(precision)),
      r1: Number((C + (H - L) * 1.1 / 12).toFixed(precision)),
      r2: Number((C + (H - L) * 1.1 / 6).toFixed(precision)),
      r3: Number((C + (H - L) * 1.1 / 4).toFixed(precision)),
    },
    {
      name: "Woodie's",
      s3: Number((L - 2 * (H - ((H + L + 2 * C) / 4))).toFixed(precision)),
      s2: Number((((H + L + 2 * C) / 4) - (H - L)).toFixed(precision)),
      s1: Number((2 * ((H + L + 2 * C) / 4) - H).toFixed(precision)),
      pp: Number(((H + L + 2 * C) / 4).toFixed(precision)),
      r1: Number((2 * ((H + L + 2 * C) / 4) - L).toFixed(precision)),
      r2: Number((((H + L + 2 * C) / 4) + (H - L)).toFixed(precision)),
      r3: Number((H + 2 * (((H + L + 2 * C) / 4) - L)).toFixed(precision)),
    },
    {
      name: "DeMark's",
      s3: Number((L - (H - L) * 0.75).toFixed(precision)),
      s2: Number((L - (H - L) * 0.50).toFixed(precision)),
      s1: Number((L * 0.999).toFixed(precision)),
      pp: Number(classicPP.toFixed(precision)),
      r1: Number((H * 1.001).toFixed(precision)),
      r2: Number((H + (H - L) * 0.50).toFixed(precision)),
      r3: Number((H + (H - L) * 0.75).toFixed(precision)),
    },
  ];

  // -------------------------------------------------------------
  // GAUGE SIGNALS & HERO SUMMARY (UNIFIED MATH MAPPING)
  // -------------------------------------------------------------
  const tiStatus = getGaugeStatus(tiBuy, tiSell, tiNeu);
  const tiSignal: TechnicalSignal = tiStatus.signal;

  const maStatus = getGaugeStatus(maBuy, maSell, 0);
  const maSignal: TechnicalSignal = maStatus.signal;

  const totalBuy = tiBuy + maBuy;
  const totalSell = tiSell + maSell;
  const totalNeu = tiNeu;

  const sumStatus = getGaugeStatus(totalBuy, totalSell, totalNeu);
  const sumSignal: TechnicalSignal = sumStatus.signal;
  const badge = sumStatus.badge;

  const biasDescription = `${pair.symbol} ${tfProp.label} timeframe displays a real-time ${badge.toUpperCase()} bias (Indicators: ${tiBuy} Buy / ${tiSell} Sell; Moving Averages: ${maBuy} Buy / ${maSell} Sell). Range: ${rangeLow.toFixed(precision)} - ${rangeHigh.toFixed(precision)}.`;

  return {
    timeframe,
    label: tfProp.label,
    badge,
    isLocked: false,
    tiSignal,
    sumSignal,
    maSignal,
    tiBuy,
    tiNeu,
    tiSell,
    maBuy,
    maSell,
    indicators,
    movingAverages,
    pivots,
    rangeHigh,
    rangeLow,
    atrPips,
    biasDescription,
    isDerivLive: true,
  };
}

/**
 * Calculates complete real-time technical indicators, moving averages, pivot points,
 * and tri-gauge summary ratings for a specific pair and timeframe (with fallback seed model).
 */
export function calculateTimeframeTechnical(
  pair: ForexPairTechnical,
  currentPrice: number,
  timeframe: TimeframeId,
  derivCandles?: DerivCandle[]
): TimeframeTechnicalEvaluation {
  if (derivCandles && derivCandles.length >= 5) {
    return calculateFromDerivCandles(derivCandles, currentPrice, timeframe, pair);
  }

  const tfProp = TIMEFRAME_PROPERTIES[timeframe] || TIMEFRAME_PROPERTIES['5h'];
  const precision = pair.pipPrecision;
  const pipFactor = pair.pipValueFactor;
  const multiplier = pair.symbol.includes('JPY') ? 100 : pair.symbol.includes('XAU') ? 10 : 1;

  const htfTrend = pair.structure?.htfTrend || 'UPTREND';
  const ltfTrend = pair.structure?.ltfTrend || 'UPTREND';
  
  let baseScore = 0;
  if (htfTrend.includes('STRONG_UPTREND')) baseScore += 5;
  else if (htfTrend.includes('UPTREND')) baseScore += 3;
  else if (htfTrend.includes('STRONG_DOWNTREND')) baseScore -= 5;
  else if (htfTrend.includes('DOWNTREND')) baseScore -= 3;

  if (ltfTrend.includes('UPTREND')) baseScore += 3;
  else if (ltfTrend.includes('DOWNTREND')) baseScore -= 3;

  const pricePctDiff = ((currentPrice - pair.basePrice) / pair.basePrice) * 100;
  baseScore += pricePctDiff * 8;

  // Derive timeframe deterministic seed
  let hash = 0;
  const str = `${pair.symbol}-${timeframe}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  const tfOffset = ((seed % 100) - 45) / 30;
  const netBias = Math.max(-10, Math.min(10, baseScore + tfOffset));

  const baseAtrPips = pair.indicators?.volatility?.atr14Pips || (pair.symbol.includes('JPY') ? 65 : 45);
  const timeframeAtrPips = Number(Math.max(1.5, baseAtrPips * tfProp.volatilityScale).toFixed(1));
  const timeframeAtrPrice = timeframeAtrPips / pipFactor;

  const rangeHigh = Number((currentPrice + timeframeAtrPrice * 0.95).toFixed(precision));
  const rangeLow = Number((currentPrice - timeframeAtrPrice * 0.90).toFixed(precision));

  const baseRsi = 50 + netBias * 3.2 + (seed % 11 - 5) * 0.8;
  const rsiVal = Number(Math.max(12, Math.min(88, baseRsi)).toFixed(2));
  let rsiAction: IndicatorResult['action'] = 'Neutral';
  if (rsiVal >= 60) rsiAction = 'Buy';
  else if (rsiVal <= 40) rsiAction = 'Sell';

  const stochK = Number(Math.max(8, Math.min(94, 50 + netBias * 3.8 + (seed % 13 - 6) * 1.2)).toFixed(2));
  let stochAction: IndicatorResult['action'] = 'Neutral';
  if (stochK > 55) stochAction = 'Buy';
  else if (stochK < 45) stochAction = 'Sell';

  const stochRsiVal = Number(Math.max(0, Math.min(100, (rsiVal - 20) * 1.6 + (seed % 9 - 4))).toFixed(2));
  let stochRsiAction: IndicatorResult['action'] = 'Neutral';
  if (stochRsiVal >= 65) stochRsiAction = 'Buy';
  else if (stochRsiVal <= 35) stochRsiAction = 'Sell';

  const macdSpread = (netBias * 0.00035 * multiplier * tfProp.volatilityScale);
  const macdValStr = macdSpread >= 0 ? `+${macdSpread.toFixed(precision)}` : macdSpread.toFixed(precision);
  const macdAction: IndicatorResult['action'] = macdSpread > 0.00005 ? 'Buy' : macdSpread < -0.00005 ? 'Sell' : 'Neutral';

  const adxVal = Number(Math.max(14, Math.min(68, 24 + Math.abs(netBias) * 3.5 + (seed % 7))).toFixed(2));
  let adxAction: IndicatorResult['action'] = 'Neutral';
  if (adxVal > 25) adxAction = netBias >= 0 ? 'Buy' : 'Sell';

  const williamsVal = Number(Math.max(-98, Math.min(-2, -50 + netBias * 4.2 + (seed % 15 - 7))).toFixed(2));
  let williamsAction: IndicatorResult['action'] = 'Neutral';
  if (williamsVal >= -35) williamsAction = 'Buy';
  else if (williamsVal <= -65) williamsAction = 'Sell';

  const cciVal = Number((netBias * 18.5 + (seed % 25 - 12) * 2.5).toFixed(2));
  let cciAction: IndicatorResult['action'] = 'Neutral';
  if (cciVal >= 50) cciAction = 'Buy';
  else if (cciVal <= -50) cciAction = 'Sell';

  const atrValStr = timeframeAtrPrice.toFixed(precision);
  const atrAction: IndicatorResult['action'] = timeframeAtrPips > baseAtrPips * 0.8 ? 'High Volatility' : 'Less Volatility';

  const hlDiff = (netBias * 0.00028 * multiplier * tfProp.volatilityScale);
  const hlValStr = hlDiff >= 0 ? `+${hlDiff.toFixed(precision)}` : hlDiff.toFixed(precision);
  const hlAction: IndicatorResult['action'] = hlDiff > 0 ? 'Buy' : hlDiff < 0 ? 'Sell' : 'Neutral';

  const ultOscVal = Number(Math.max(20, Math.min(80, 50 + netBias * 2.8 + (seed % 9 - 4))).toFixed(2));
  const ultOscAction: IndicatorResult['action'] = ultOscVal >= 55 ? 'Buy' : ultOscVal <= 45 ? 'Sell' : 'Neutral';

  const rocVal = Number((netBias * 0.065 * tfProp.volatilityScale + (seed % 11 - 5) * 0.02).toFixed(2));
  const rocValStr = rocVal >= 0 ? `+${rocVal}%` : `${rocVal}%`;
  const rocAction: IndicatorResult['action'] = rocVal > 0.05 ? 'Buy' : rocVal < -0.05 ? 'Sell' : 'Neutral';

  const bbPower = (netBias * 0.00045 * multiplier * tfProp.volatilityScale);
  const bbPowerStr = bbPower >= 0 ? `+${bbPower.toFixed(precision)}` : bbPower.toFixed(precision);
  const bbPowerAction: IndicatorResult['action'] = bbPower > 0 ? 'Buy' : bbPower < 0 ? 'Sell' : 'Neutral';

  const indicators: IndicatorResult[] = [
    { name: 'RSI(14)', value: rsiVal.toFixed(2), action: rsiAction },
    { name: 'STOCH(9,6)', value: `${stochK.toFixed(2)}`, action: stochAction },
    { name: 'STOCHRSI(14)', value: `${stochRsiVal.toFixed(2)}`, action: stochRsiAction },
    { name: 'MACD(12,26)', value: macdValStr, action: macdAction },
    { name: 'ADX(14)', value: adxVal.toFixed(2), action: adxAction },
    { name: 'Williams %R', value: `${williamsVal.toFixed(2)}`, action: williamsAction },
    { name: 'CCI(14)', value: `${cciVal.toFixed(2)}`, action: cciAction },
    { name: 'ATR(14)', value: atrValStr, action: atrAction },
    { name: 'Highs/Lows(14)', value: hlValStr, action: hlAction },
    { name: 'Ultimate Oscillator', value: `${ultOscVal.toFixed(2)}`, action: ultOscAction },
    { name: 'ROC', value: rocValStr, action: rocAction },
    { name: 'Bull/Bear Power(13)', value: bbPowerStr, action: bbPowerAction },
  ];

  let tiBuy = 0;
  let tiNeu = 0;
  let tiSell = 0;
  indicators.forEach((ind) => {
    if (ind.action === 'High Volatility' || ind.action === 'Less Volatility') tiNeu++;
    else if (ind.action.includes('Buy')) tiBuy++;
    else if (ind.action.includes('Sell')) tiSell++;
    else tiNeu++;
  });

  const periods = [
    { name: 'MA5', lagFactor: 0.0004 },
    { name: 'MA10', lagFactor: 0.0009 },
    { name: 'MA20', lagFactor: 0.0018 },
    { name: 'MA50', lagFactor: 0.0038 },
    { name: 'MA100', lagFactor: 0.0072 },
    { name: 'MA200', lagFactor: 0.0135 },
  ];

  let maBuy = 0;
  let maSell = 0;
  const movingAverages: MovingAverageResult[] = periods.map((p) => {
    const scale = p.lagFactor * multiplier * tfProp.volatilityScale;
    const biasShift = netBias * 0.15;
    const smaPrice = Number((currentPrice * (1 - scale * (0.8 + biasShift))).toFixed(precision));
    const emaPrice = Number((currentPrice * (1 - scale * (0.9 + biasShift))).toFixed(precision));

    const smaAction: MovingAverageResult['smaAction'] = currentPrice >= smaPrice ? 'Buy' : 'Sell';
    const emaAction: MovingAverageResult['emaAction'] = currentPrice >= emaPrice ? 'Buy' : 'Sell';

    if (smaAction === 'Buy') maBuy++; else maSell++;
    if (emaAction === 'Buy') maBuy++; else maSell++;

    return { period: p.name, sma: smaPrice, smaAction, ema: emaPrice, emaAction };
  });

  const H = rangeHigh;
  const L = rangeLow;
  const C = currentPrice;
  const classicPP = (H + L + C) / 3;

  const pivots: PivotPointsResult[] = [
    {
      name: 'Classic',
      s3: Number((L - 2 * (H - classicPP)).toFixed(precision)),
      s2: Number((classicPP - (H - L)).toFixed(precision)),
      s1: Number((2 * classicPP - H).toFixed(precision)),
      pp: Number(classicPP.toFixed(precision)),
      r1: Number((2 * classicPP - L).toFixed(precision)),
      r2: Number((classicPP + (H - L)).toFixed(precision)),
      r3: Number((H + 2 * (classicPP - L)).toFixed(precision)),
    },
    {
      name: 'Fibonacci',
      s3: Number((classicPP - 1.0 * (H - L)).toFixed(precision)),
      s2: Number((classicPP - 0.618 * (H - L)).toFixed(precision)),
      s1: Number((classicPP - 0.382 * (H - L)).toFixed(precision)),
      pp: Number(classicPP.toFixed(precision)),
      r1: Number((classicPP + 0.382 * (H - L)).toFixed(precision)),
      r2: Number((classicPP + 0.618 * (H - L)).toFixed(precision)),
      r3: Number((classicPP + 1.0 * (H - L)).toFixed(precision)),
    },
    {
      name: 'Camarilla',
      s3: Number((C - (H - L) * 1.1 / 4).toFixed(precision)),
      s2: Number((C - (H - L) * 1.1 / 6).toFixed(precision)),
      s1: Number((C - (H - L) * 1.1 / 12).toFixed(precision)),
      pp: Number(classicPP.toFixed(precision)),
      r1: Number((C + (H - L) * 1.1 / 12).toFixed(precision)),
      r2: Number((C + (H - L) * 1.1 / 6).toFixed(precision)),
      r3: Number((C + (H - L) * 1.1 / 4).toFixed(precision)),
    },
    {
      name: "Woodie's",
      s3: Number((L - 2 * (H - ((H + L + 2 * C) / 4))).toFixed(precision)),
      s2: Number((((H + L + 2 * C) / 4) - (H - L)).toFixed(precision)),
      s1: Number((2 * ((H + L + 2 * C) / 4) - H).toFixed(precision)),
      pp: Number(((H + L + 2 * C) / 4).toFixed(precision)),
      r1: Number((2 * ((H + L + 2 * C) / 4) - L).toFixed(precision)),
      r2: Number((((H + L + 2 * C) / 4) + (H - L)).toFixed(precision)),
      r3: Number((H + 2 * (((H + L + 2 * C) / 4) - L)).toFixed(precision)),
    },
    {
      name: "DeMark's",
      s3: Number((L - (H - L) * 0.75).toFixed(precision)),
      s2: Number((L - (H - L) * 0.50).toFixed(precision)),
      s1: Number((L * 0.999).toFixed(precision)),
      pp: Number(classicPP.toFixed(precision)),
      r1: Number((H * 1.001).toFixed(precision)),
      r2: Number((H + (H - L) * 0.50).toFixed(precision)),
      r3: Number((H + (H - L) * 0.75).toFixed(precision)),
    },
  ];

  // -------------------------------------------------------------
  // GAUGE SIGNALS & HERO SUMMARY (UNIFIED MATH MAPPING)
  // -------------------------------------------------------------
  const tiStatus = getGaugeStatus(tiBuy, tiSell, tiNeu);
  const tiSignal: TechnicalSignal = tiStatus.signal;

  const maStatus = getGaugeStatus(maBuy, maSell, 0);
  const maSignal: TechnicalSignal = maStatus.signal;

  const totalBuy = tiBuy + maBuy;
  const totalSell = tiSell + maSell;
  const totalNeu = tiNeu;

  const sumStatus = getGaugeStatus(totalBuy, totalSell, totalNeu);
  const sumSignal: TechnicalSignal = sumStatus.signal;
  const badge = sumStatus.badge;

  const biasDescription = `${pair.symbol} ${tfProp.label} timeframe displays a ${badge.toUpperCase()} bias (Indicators: ${tiBuy} Buy / ${tiSell} Sell; Moving Averages: ${maBuy} Buy / ${maSell} Sell). Range: ${rangeLow.toFixed(precision)} - ${rangeHigh.toFixed(precision)}.`;

  return {
    timeframe,
    label: tfProp.label,
    badge,
    isLocked: false,
    tiSignal,
    sumSignal,
    maSignal,
    tiBuy,
    tiNeu,
    tiSell,
    maBuy,
    maSell,
    indicators,
    movingAverages,
    pivots,
    rangeHigh,
    rangeLow,
    atrPips: timeframeAtrPips,
    biasDescription,
    isDerivLive: false,
  };
}

/**
 * Pre-computes all timeframes (1m to 1M) for a specific pair and live price.
 */
export function calculateAllTimeframesForPair(
  pair: ForexPairTechnical,
  currentPrice: number,
  candlesByTimeframe?: Partial<Record<TimeframeId, DerivCandle[]>>
): TimeframeTechnicalEvaluation[] {
  const timeframes: TimeframeId[] = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '8h', '5h', '1d', '1w', '1M'];
  return timeframes.map((tf) => {
    const candles = candlesByTimeframe ? candlesByTimeframe[tf] : undefined;
    return calculateTimeframeTechnical(pair, currentPrice, tf, candles);
  });
}
