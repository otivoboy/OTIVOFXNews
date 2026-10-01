import { AssetCategory, TacticalAction, MarketBias } from '../types';

export type MacroBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILITY';
export type TradeDirective = 'BUY' | 'SELL' | 'STRONG BUY' | 'STRONG SELL' | 'NEUTRAL';
export type SpikeDirection = 'BULLISH_SPIKE' | 'BEARISH_SPIKE' | 'VOLATILITY_SQUEEZE' | 'FADE_SPIKE';
export type ExpectedMoveUnit = 'pips' | 'bps' | 'points' | 'USD/oz' | 'USD/bbl' | '%' | 'ticks';

export interface StructuredExpectedMove {
  min: number;
  max: number;
  unit: ExpectedMoveUnit;
  formatted: string;
  direction: 'UPSIDE' | 'DOWNSIDE' | 'TWO_WAY';
}

export interface PairDirectionResolution {
  symbol: string;
  eventCurrency: string;
  isBasePair: boolean;
  isQuotePair: boolean;
  isInverse: boolean;
  directive: TradeDirective;
  action: TacticalAction;
  spikeDirection: SpikeDirection;
  bias: MarketBias;
  confidencePercent: number;
  explanation: string;
}

/**
 * Universal confidence formatter:
 * Handles inputs whether they are normalized 0.0-1.0 (e.g. 0.85) or percent 0-100 (e.g. 85).
 * Guarantees that values like 0.85 are rendered as 85%, not 8500% or 0.85%.
 */
export function formatConfidence(val: number | undefined | null): {
  percent: number;
  decimal: number;
  formatted: string;
} {
  if (val === undefined || val === null || isNaN(val)) {
    return { percent: 80, decimal: 0.80, formatted: '80% Conf' };
  }

  let percent: number;
  let decimal: number;

  if (val <= 1.0 && val > 0) {
    decimal = val;
    percent = Math.min(100, Math.max(0, Math.round(val * 100)));
  } else {
    percent = Math.min(100, Math.max(0, Math.round(val)));
    decimal = percent / 100;
  }

  return {
    percent,
    decimal,
    formatted: `${percent}% Conf`,
  };
}

/**
 * Parses free-form expected move text into a structured, unit-accurate object.
 * Examples:
 *   "+75 to +115 pips" -> { min: 75, max: 115, unit: 'pips', direction: 'UPSIDE', formatted: '+75 to +115 pips' }
 *   "-$15 to -$30/oz"  -> { min: 15, max: 30, unit: 'USD/oz', direction: 'DOWNSIDE', formatted: '-$15 to -$30/oz' }
 *   "+9 to +18 bps"    -> { min: 9, max: 18, unit: 'bps', direction: 'UPSIDE', formatted: '+9 to +18 bps' }
 *   "-1.5% to -2.8%"   -> { min: 1.5, max: 2.8, unit: '%', direction: 'DOWNSIDE', formatted: '-1.5% to -2.8%' }
 */
export function parseExpectedMove(
  moveStr: string,
  category?: AssetCategory,
  symbol?: string
): StructuredExpectedMove {
  const clean = (moveStr || '').trim();
  let unit: ExpectedMoveUnit = 'pips';

  const symUpper = (symbol || '').toUpperCase();
  if (category === 'YIELDS' || symUpper.includes('10Y') || symUpper.includes('2Y') || clean.includes('bps')) {
    unit = 'bps';
  } else if (category === 'COMMODITIES' || symUpper.includes('XAU') || symUpper.includes('GOLD') || clean.includes('/oz')) {
    unit = 'USD/oz';
  } else if (symUpper.includes('OIL') || symUpper.includes('WTI') || symUpper.includes('BRENT') || clean.includes('/bbl')) {
    unit = 'USD/bbl';
  } else if (clean.includes('%')) {
    unit = '%';
  } else if (category === 'INDICES' || symUpper.includes('SPX') || symUpper.includes('DAX') || symUpper.includes('NIKKEI') || clean.includes('pts') || clean.includes('points')) {
    unit = 'points';
  }

  // Extract signed or unsigned numbers
  const numberRegex = /[-+]?\d*\.?\d+/g;
  const matches = clean.match(numberRegex);

  let min = 50;
  let max = 85;
  let direction: 'UPSIDE' | 'DOWNSIDE' | 'TWO_WAY' = 'TWO_WAY';

  if (matches && matches.length >= 2) {
    const n1 = Math.abs(parseFloat(matches[0]));
    const n2 = Math.abs(parseFloat(matches[1]));
    min = Math.min(n1, n2);
    max = Math.max(n1, n2);
  } else if (matches && matches.length === 1) {
    min = Math.abs(parseFloat(matches[0]));
    max = min * 1.5;
  }

  if (clean.startsWith('+') || clean.includes('+$') || clean.toLowerCase().includes('bullish') || clean.toLowerCase().includes('upside')) {
    direction = 'UPSIDE';
  } else if (clean.startsWith('-') || clean.includes('-$') || clean.toLowerCase().includes('bearish') || clean.toLowerCase().includes('downside')) {
    direction = 'DOWNSIDE';
  }

  let formatted = clean;
  if (!formatted) {
    const sign = direction === 'UPSIDE' ? '+' : direction === 'DOWNSIDE' ? '-' : '±';
    formatted = `${sign}${min} to ${sign}${max} ${unit}`;
  }

  return {
    min,
    max,
    unit,
    formatted,
    direction,
  };
}

/**
 * Centralized Base vs Quote Inversion & Intermarket Transmission Authority.
 * Determines the exact directional outcome for ANY asset pair given an event currency and its macro direction.
 * 
 * Rules:
 * 1. Currency X Bullish + Pair X/Y (X is Base) -> BUY / BULLISH_SPIKE / LONG
 * 2. Currency X Bullish + Pair Y/X (X is Quote) -> SELL / BEARISH_SPIKE / SHORT (Inverted Denominator)
 * 3. Currency USD Bullish + Gold (XAU/USD) -> SELL / BEARISH_SPIKE (Real Yield / Opportunity Cost Arbitrage)
 * 4. Currency USD Bullish + US10Y Yields -> BUY / BULLISH_SPIKE (Curve Steepening / Rate Repricing)
 * 5. Currency USD Bullish + Equities (SPX/NDX) -> SELL / BEARISH_SPIKE (Valuation Compression)
 * 6. Currency JPY Bullish + USD/JPY or EUR/JPY -> SELL / BEARISH_SPIKE (Carry Trade Liquidation)
 */
export function convertDirectionForPair(
  eventCurrency: string,
  pairSymbol: string,
  currencyDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
  confidence = 85
): PairDirectionResolution {
  const ccy = (eventCurrency || 'USD').toUpperCase();
  const sym = pairSymbol.toUpperCase().replace(/\s+/g, '');
  const isCcyBullish = currencyDirection === 'BULLISH';
  const isNeutral = currencyDirection === 'NEUTRAL';

  let isBasePair = false;
  let isQuotePair = false;
  let isInverse = false;
  let explanation = '';

  // 1. Standard G10 FX Cross Pair Resolution
  if (sym.includes('/')) {
    const [base, quote] = sym.split('/');

    if (base === ccy) {
      isBasePair = true;
      isQuotePair = false;
      isInverse = false;
      explanation = `Direct Base Transmission: ${ccy} is the base currency. ${ccy} strength directly appreciates ${pairSymbol}.`;
    } else if (quote === ccy) {
      isBasePair = false;
      isQuotePair = true;
      isInverse = true;
      explanation = `Inverse Quote Transmission: ${ccy} is the quote denominator. ${ccy} strength forces ${pairSymbol} into a downward impulse.`;
    } else {
      // Cross rate not directly containing the currency (e.g. EUR/JPY on a USD event)
      isBasePair = false;
      isQuotePair = false;
      // High beta to USD dollar liquidity
      isInverse = ccy === 'USD';
      explanation = `Cross-Currency Transmission: Secondary liquidity impulse.`;
    }
  } 
  // 2. Special Cross-Asset Instruments
  else if (sym === 'DXY') {
    isBasePair = ccy === 'USD';
    isQuotePair = ccy === 'EUR'; // EUR is 57.6% of DXY
    isInverse = ccy === 'EUR';
    explanation = ccy === 'USD' 
      ? 'Benchmark Dollar Index directly measures USD aggregate currency strength.'
      : 'Euro constitutes 57.6% of DXY; EUR strength forces DXY lower.';
  } else if (sym.includes('10Y') || sym.includes('YIELD') || sym.includes('BOND')) {
    // Sovereign yields reprice in the direction of central bank tightening (Hawkish = Higher Yields)
    isBasePair = true;
    isQuotePair = false;
    isInverse = false;
    explanation = 'Sovereign Bond Yield: Reprices front-end and terminal policy rate trajectory.';
  } else if (sym.includes('GOLD') || sym.includes('XAU')) {
    isBasePair = false;
    isQuotePair = true;
    isInverse = true;
    explanation = 'Real Yield & Denominator Transmission: Physical gold devalues as real yields and USD surge.';
  } else if (sym.includes('SPX') || sym.includes('NAS') || sym.includes('NIKKEI') || sym.includes('DAX') || sym.includes('FTSE') || sym.includes('ASX')) {
    // Equity multiple discounting: Hawkish/tightening rate moves typically compress equity multiples
    isBasePair = false;
    isQuotePair = false;
    isInverse = true;
    explanation = 'Equity Multiple Discounting: Higher discount rates and tighter liquidity compress corporate valuations.';
  } else if (sym.includes('OIL') || sym.includes('WTI') || sym.includes('BRENT')) {
    isBasePair = ccy === 'CAD'; // Loonie co-integrates with oil
    isQuotePair = ccy === 'USD';
    isInverse = ccy === 'USD';
    explanation = ccy === 'CAD' 
      ? 'Terms of Trade: Energy export revenue drives Canadian currency fundamentals.'
      : 'Dollar-denominated commodity: Stronger USD exerts downward pricing friction.';
  }

  // Calculate final trade action & spike direction
  const isPairBullish = isNeutral ? false : (isInverse ? !isCcyBullish : isCcyBullish);
  const isStrongConviction = confidence >= 82;

  let directive: TradeDirective;
  let action: TacticalAction;
  let spikeDirection: SpikeDirection;
  let bias: MarketBias;

  if (isNeutral) {
    directive = 'NEUTRAL';
    action = 'STAND ASIDE';
    spikeDirection = 'VOLATILITY_SQUEEZE';
    bias = 'WATCH';
  } else if (isPairBullish) {
    directive = isStrongConviction ? 'STRONG BUY' : 'BUY';
    action = isStrongConviction ? 'LONG' : 'BUY PULLBACKS';
    spikeDirection = 'BULLISH_SPIKE';
    bias = isStrongConviction ? 'STRONG_BUY' : 'BUY';
  } else {
    directive = isStrongConviction ? 'STRONG SELL' : 'SELL';
    action = isStrongConviction ? 'SHORT' : 'SELL SPIKES';
    spikeDirection = 'BEARISH_SPIKE';
    bias = isStrongConviction ? 'STRONG_SELL' : 'SELL';
  }

  return {
    symbol: pairSymbol,
    eventCurrency: ccy,
    isBasePair,
    isQuotePair,
    isInverse,
    directive,
    action,
    spikeDirection,
    bias,
    confidencePercent: confidence,
    explanation,
  };
}
