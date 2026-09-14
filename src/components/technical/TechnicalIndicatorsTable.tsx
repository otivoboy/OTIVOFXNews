import React from 'react';
import { IndicatorResult, MovingAverageResult, PivotPointsResult } from '../../utils/technicalAnalysisEngine';

export type TimeframeId = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '8h' | '5h' | '1d' | '1w' | '1M';

interface TechnicalIndicatorsTableProps {
  basePrice: number;
  precision: number;
  timeframe: TimeframeId;
  assetSymbol: string;
  indicators?: IndicatorResult[];
  movingAverages?: MovingAverageResult[];
  pivots?: PivotPointsResult[];
  tiBuy?: number;
  tiNeu?: number;
  tiSell?: number;
  maBuy?: number;
  maSell?: number;
}

export const TechnicalIndicatorsTable: React.FC<TechnicalIndicatorsTableProps> = ({
  basePrice,
  precision,
  timeframe,
  assetSymbol,
  indicators = [],
  movingAverages = [],
  pivots = [],
  tiBuy = 0,
  tiNeu = 0,
  tiSell = 0,
  maBuy = 0,
  maSell = 0,
}) => {
  // If indicators not passed externally, construct fallback
  const isJpy = assetSymbol.includes('JPY');
  const isGold = assetSymbol.includes('XAU') || assetSymbol.toLowerCase().includes('gold');
  const multiplier = isJpy ? 100 : isGold ? 10 : 1;

  const displayIndicators = indicators.length > 0 ? indicators : [
    { name: 'RSI(14)', value: '54.20', action: 'Buy' as const },
    { name: 'STOCH(9,6)', value: '62.40', action: 'Buy' as const },
    { name: 'STOCHRSI(14)', value: '71.20', action: 'Buy' as const },
    { name: 'MACD(12,26)', value: `+${(0.0018 * multiplier).toFixed(precision)}`, action: 'Buy' as const },
    { name: 'ADX(14)', value: '32.60', action: 'Buy' as const },
    { name: 'Williams %R', value: '-38.40', action: 'Buy' as const },
    { name: 'CCI(14)', value: '88.50', action: 'Buy' as const },
    { name: 'ATR(14)', value: `${(0.0035 * multiplier).toFixed(precision)}`, action: 'High Volatility' as const },
    { name: 'Highs/Lows(14)', value: `+${(0.0012 * multiplier).toFixed(precision)}`, action: 'Buy' as const },
    { name: 'Ultimate Oscillator', value: '58.90', action: 'Buy' as const },
    { name: 'ROC', value: '+0.34%', action: 'Buy' as const },
    { name: 'Bull/Bear Power(13)', value: `+${(0.0022 * multiplier).toFixed(precision)}`, action: 'Buy' as const },
  ];

  const displayMAs = movingAverages.length > 0 ? movingAverages : [
    { period: 'MA5', sma: basePrice * 0.9995, smaAction: 'Buy' as const, ema: basePrice * 0.9994, emaAction: 'Buy' as const },
    { period: 'MA10', sma: basePrice * 0.9988, smaAction: 'Buy' as const, ema: basePrice * 0.9987, emaAction: 'Buy' as const },
    { period: 'MA20', sma: basePrice * 0.9975, smaAction: 'Buy' as const, ema: basePrice * 0.9973, emaAction: 'Buy' as const },
    { period: 'MA50', sma: basePrice * 0.9950, smaAction: 'Buy' as const, ema: basePrice * 0.9945, emaAction: 'Buy' as const },
    { period: 'MA100', sma: basePrice * 0.9910, smaAction: 'Buy' as const, ema: basePrice * 0.9900, emaAction: 'Buy' as const },
    { period: 'MA200', sma: basePrice * 0.9840, smaAction: 'Buy' as const, ema: basePrice * 0.9820, emaAction: 'Buy' as const },
  ];

  const high = basePrice * 1.004;
  const low = basePrice * 0.996;
  const close = basePrice;
  const pp = (high + low + close) / 3;

  const displayPivots = pivots.length > 0 ? pivots : [
    {
      name: 'Classic',
      s3: Number((low - 2 * (high - pp)).toFixed(precision)),
      s2: Number((pp - (high - low)).toFixed(precision)),
      s1: Number((2 * pp - high).toFixed(precision)),
      pp: Number(pp.toFixed(precision)),
      r1: Number((2 * pp - low).toFixed(precision)),
      r2: Number((pp + (high - low)).toFixed(precision)),
      r3: Number((high + 2 * (pp - low)).toFixed(precision)),
    },
    {
      name: 'Fibonacci',
      s3: Number((pp - 1.0 * (high - low)).toFixed(precision)),
      s2: Number((pp - 0.618 * (high - low)).toFixed(precision)),
      s1: Number((pp - 0.382 * (high - low)).toFixed(precision)),
      pp: Number(pp.toFixed(precision)),
      r1: Number((pp + 0.382 * (high - low)).toFixed(precision)),
      r2: Number((pp + 0.618 * (high - low)).toFixed(precision)),
      r3: Number((pp + 1.0 * (high - low)).toFixed(precision)),
    },
    {
      name: 'Camarilla',
      s3: Number((close - (high - low) * 1.1 / 4).toFixed(precision)),
      s2: Number((close - (high - low) * 1.1 / 6).toFixed(precision)),
      s1: Number((close - (high - low) * 1.1 / 12).toFixed(precision)),
      pp: Number(pp.toFixed(precision)),
      r1: Number((close + (high - low) * 1.1 / 12).toFixed(precision)),
      r2: Number((close + (high - low) * 1.1 / 6).toFixed(precision)),
      r3: Number((close + (high - low) * 1.1 / 4).toFixed(precision)),
    },
    {
      name: "Woodie's",
      s3: Number((low - 2 * (high - pp)).toFixed(precision)),
      s2: Number((pp - (high - low)).toFixed(precision)),
      s1: Number((2 * pp - high).toFixed(precision)),
      pp: Number(((high + low + 2 * close) / 4).toFixed(precision)),
      r1: Number((2 * pp - low).toFixed(precision)),
      r2: Number((pp + (high - low)).toFixed(precision)),
      r3: Number((high + 2 * (pp - low)).toFixed(precision)),
    },
    {
      name: "DeMark's",
      s3: Number((low - 0.003 * multiplier).toFixed(precision)),
      s2: Number((low - 0.0015 * multiplier).toFixed(precision)),
      s1: Number((low * 0.999).toFixed(precision)),
      pp: Number(pp.toFixed(precision)),
      r1: Number((high * 1.001).toFixed(precision)),
      r2: Number((high + 0.0015 * multiplier).toFixed(precision)),
      r3: Number((high + 0.003 * multiplier).toFixed(precision)),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 2-Column Grid: Technical Indicators Breakdown vs Moving Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Technical Indicators Table (6 cols) */}
        <div className="lg:col-span-6 bg-[#ffffff] border border-[#e2dcd2] rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-[#faf8f4] border-b border-[#e2dcd2] flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
              Technical Indicators ({timeframe.toUpperCase()})
            </h4>
            <div className="text-[11px] font-mono text-slate-600">
              <span className="text-emerald-700 font-bold">Buy: {tiBuy}</span> •{' '}
              <span className="text-slate-600 font-bold">Neutral: {tiNeu}</span> •{' '}
              <span className="text-rose-700 font-bold">Sell: {tiSell}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-[#f4efe6] text-slate-700 font-semibold border-b border-[#e2dcd2] text-[11px]">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3 text-right">Value</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee8dc] text-slate-800 font-mono">
                {displayIndicators.map((ind, idx) => {
                  const isBuy = ind.action.includes('Buy');
                  const isSell = ind.action.includes('Sell');
                  return (
                    <tr key={idx} className="hover:bg-[#faf7f0] transition-colors">
                      <td className="py-2 px-3 font-sans font-medium text-slate-800">{ind.name}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{ind.value}</td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isBuy
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isSell
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {ind.action}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Moving Averages Table (6 cols) */}
        <div className="lg:col-span-6 bg-[#ffffff] border border-[#e2dcd2] rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-[#faf8f4] border-b border-[#e2dcd2] flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
              Moving Averages ({timeframe.toUpperCase()})
            </h4>
            <div className="text-[11px] font-mono text-slate-600">
              <span className="text-emerald-700 font-bold">Buy: {maBuy}</span> •{' '}
              <span className="text-rose-700 font-bold">Sell: {maSell}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-[#f4efe6] text-slate-700 font-semibold border-b border-[#e2dcd2] text-[11px]">
                  <th className="py-2 px-3">Period</th>
                  <th className="py-2 px-3 text-right">Simple (SMA)</th>
                  <th className="py-2 px-3 text-right">Exponential (EMA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee8dc] text-slate-800 font-mono">
                {displayMAs.map((ma, idx) => (
                  <tr key={idx} className="hover:bg-[#faf7f0] transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800">{ma.period}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-slate-900 font-bold mr-1.5">{ma.sma.toFixed(precision)}</span>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          ma.smaAction === 'Buy'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {ma.smaAction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-slate-900 font-bold mr-1.5">{ma.ema.toFixed(precision)}</span>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          ma.emaAction === 'Buy'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {ma.emaAction}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pivot Points Matrix Table */}
      <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-[#faf8f4] border-b border-[#e2dcd2] flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
            Pivot Points Calculation Matrix ({timeframe.toUpperCase()})
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            Multi-Formula Support & Resistance Levels
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#f4efe6] text-slate-700 font-semibold border-b border-[#e2dcd2] text-[11px]">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3 text-right text-rose-800 font-bold">S3</th>
                <th className="py-2.5 px-3 text-right text-rose-700 font-bold">S2</th>
                <th className="py-2.5 px-3 text-right text-rose-600 font-bold">S1</th>
                <th className="py-2.5 px-3 text-right text-sky-900 font-black">Pivot Point</th>
                <th className="py-2.5 px-3 text-right text-emerald-600 font-bold">R1</th>
                <th className="py-2.5 px-3 text-right text-emerald-700 font-bold">R2</th>
                <th className="py-2.5 px-3 text-right text-emerald-800 font-bold">R3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee8dc] text-slate-800 font-mono">
              {displayPivots.map((p, idx) => (
                <tr key={idx} className="hover:bg-[#faf7f0] transition-colors">
                  <td className="py-2.5 px-3 font-sans font-bold text-slate-800">{p.name}</td>
                  <td className="py-2.5 px-3 text-right text-rose-800 font-bold">{p.s3.toFixed(precision)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-700 font-bold">{p.s2.toFixed(precision)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-600 font-bold">{p.s1.toFixed(precision)}</td>
                  <td className="py-2.5 px-3 text-right font-black text-sky-900 bg-sky-50/50">{p.pp.toFixed(precision)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">{p.r1.toFixed(precision)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{p.r2.toFixed(precision)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-800 font-bold">{p.r3.toFixed(precision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
