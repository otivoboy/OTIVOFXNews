import React, { useState, useEffect } from 'react';
import { RefreshCw, Radio } from 'lucide-react';

export interface ExchangeQuoteRow {
  exchange: string;
  isRealtimeFlag?: boolean;
  last: number;
  bid: number;
  ask: number;
  volume: number;
  chgPct: number;
  currency: string;
  time: string;
  flagCode?: string;
}

interface TechnicalQuotesTableProps {
  assetName: string;
  basePrice: number;
  precision: number;
  pipFactor: number;
}

export const TechnicalQuotesTable: React.FC<TechnicalQuotesTableProps> = ({
  assetName,
  basePrice,
  precision,
  pipFactor,
}) => {
  const [rows, setRows] = useState<ExchangeQuoteRow[]>(() => {
    return generateExchangeQuotes(assetName, basePrice, precision, pipFactor);
  });

  const [tickingIdx, setTickingIdx] = useState<number | null>(null);

  // Recalculate when asset changes
  useEffect(() => {
    setRows(generateExchangeQuotes(assetName, basePrice, precision, pipFactor));
  }, [assetName, basePrice, precision, pipFactor]);

  // High-frequency live tick update simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * 5);
      setTickingIdx(randomIdx);

      setRows((prev) => {
        return prev.map((row, idx) => {
          if (idx === randomIdx) {
            const pipDelta = (Math.random() - 0.48) * (1 / pipFactor) * 2;
            const newLast = Number((row.last + pipDelta).toFixed(precision));
            const spread = (row.ask - row.bid);
            const now = new Date();
            const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
            return {
              ...row,
              last: newLast,
              bid: Number((newLast - spread / 2).toFixed(precision + 1)),
              ask: Number((newLast + spread / 2).toFixed(precision + 1)),
              volume: row.volume + Math.floor(Math.random() * 3),
              chgPct: Number((row.chgPct + (pipDelta > 0 ? 0.02 : -0.02)).toFixed(2)),
              time: timeStr,
            };
          }
          return row;
        });
      });

      setTimeout(() => setTickingIdx(null), 600);
    }, 2200);

    return () => clearInterval(interval);
  }, [precision, pipFactor]);

  return (
    <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl overflow-hidden shadow-xs">
      <div className="px-4 py-3 bg-[#faf8f4] border-b border-[#e2dcd2] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 font-sans">
            {assetName} Quotes
          </h3>
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
            <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
            LIVE FEED
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="bg-[#f4efe6] text-slate-700 font-semibold border-b border-[#e2dcd2] text-[11px]">
              <th className="py-2.5 px-3">Exchange</th>
              <th className="py-2.5 px-3 text-right">Last</th>
              <th className="py-2.5 px-3 text-right">Bid</th>
              <th className="py-2.5 px-3 text-right">Ask</th>
              <th className="py-2.5 px-3 text-right">Volume</th>
              <th className="py-2.5 px-3 text-right">Chg. %</th>
              <th className="py-2.5 px-3 text-center">Currency</th>
              <th className="py-2.5 px-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee8dc] text-slate-800 font-mono">
            {rows.map((row, idx) => {
              const isTick = tickingIdx === idx;
              const isPositive = row.chgPct >= 0;
              return (
                <tr
                  key={idx}
                  className={`hover:bg-[#faf7f0] transition-colors ${
                    isTick ? (isPositive ? 'bg-emerald-50/80' : 'bg-rose-50/80') : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-sans font-medium flex items-center gap-2">
                    {row.isRealtimeFlag ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ) : (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                    <span className={row.isRealtimeFlag ? 'font-bold text-slate-900' : 'text-slate-700'}>
                      {row.exchange}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {row.last.toFixed(precision)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">
                    {row.bid.toFixed(precision)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">
                    {row.ask.toFixed(precision)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    {row.volume > 0 ? row.volume.toLocaleString() : '0'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        isPositive
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                      }`}
                    >
                      {isPositive ? '+' : ''}{row.chgPct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600 text-[11px]">
                    {row.currency}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                    {row.time}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function generateExchangeQuotes(
  assetName: string,
  basePrice: number,
  precision: number,
  pipFactor: number
): ExchangeQuoteRow[] {
  const isGold = assetName.toLowerCase().includes('gold') || assetName.includes('XAU');
  const now = new Date();
  const getFmtTime = (offsetSec: number) => {
    const d = new Date(now.getTime() - offsetSec * 1000);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;
  };

  const spread = 2 / pipFactor;

  return [
    {
      exchange: 'Real-time Currencies',
      isRealtimeFlag: true,
      last: basePrice,
      bid: Number((basePrice - spread / 2).toFixed(precision)),
      ask: Number((basePrice + spread / 2).toFixed(precision)),
      volume: isGold ? 1420 : 0,
      chgPct: 0.75,
      currency: 'USD',
      time: getFmtTime(12),
    },
    {
      exchange: 'Milan',
      isRealtimeFlag: false,
      last: Number((basePrice * (isGold ? 0.001 : 0.9998)).toFixed(precision)),
      bid: Number((basePrice * (isGold ? 0.001 : 0.9998) - spread / 2).toFixed(precision)),
      ask: Number((basePrice * (isGold ? 0.001 : 0.9998) + spread / 2).toFixed(precision)),
      volume: 212,
      chgPct: 3.60,
      currency: 'USD',
      time: getFmtTime(154),
    },
    {
      exchange: 'Frankfurt',
      isRealtimeFlag: false,
      last: Number((basePrice * 1.0002).toFixed(precision)),
      bid: Number((basePrice * 1.0002 - spread / 2).toFixed(precision)),
      ask: Number((basePrice * 1.0002 + spread / 2).toFixed(precision)),
      volume: 348,
      chgPct: 0.71,
      currency: 'USD',
      time: getFmtTime(210),
    },
    {
      exchange: 'London LSE',
      isRealtimeFlag: false,
      last: Number((basePrice * 0.9999).toFixed(precision)),
      bid: Number((basePrice * 0.9999 - spread / 2).toFixed(precision)),
      ask: Number((basePrice * 0.9999 + spread / 2).toFixed(precision)),
      volume: 890,
      chgPct: 0.68,
      currency: 'USD',
      time: getFmtTime(320),
    },
    {
      exchange: 'Tokyo TFX',
      isRealtimeFlag: false,
      last: Number((basePrice * 1.0001).toFixed(precision)),
      bid: Number((basePrice * 1.0001 - spread / 2).toFixed(precision)),
      ask: Number((basePrice * 1.0001 + spread / 2).toFixed(precision)),
      volume: 645,
      chgPct: 0.82,
      currency: 'USD',
      time: getFmtTime(450),
    },
  ];
}
