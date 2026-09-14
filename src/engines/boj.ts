import { ChecklistStep, AssetImpact, EngineEvaluationResult, EconomicEvent } from '../types';

export interface BojMetrics {
  policyRateActual: number; // e.g. 0.25%
  policyRateForecast: number; // e.g. 0.10%
  rateChangeBps: number; // e.g. +15 bps
  yccBandStatus: 'ABOLISHED' | 'WIDENED' | 'MAINTAINED' | 'TIGHTENED';
  monthlyJgbBondBuyingTrillionYen: number; // e.g. 3.0T (tapered from 6.0T)
  governorUedaTone: 'HAWKISH' | 'DOVISH' | 'NEUTRAL';
}

export function evaluateBOJ(
  event: EconomicEvent,
  customMetrics?: Partial<BojMetrics>
): EngineEvaluationResult {
  const isUpcoming = event.status !== 'RELEASED' && event.actual === null && customMetrics?.policyRateActual === undefined;

  const rateForecast = customMetrics?.policyRateForecast ?? event.forecast ?? 0.25;
  const rateActual = customMetrics?.policyRateActual ?? event.actual;
  const rateChange = customMetrics?.rateChangeBps ?? event.metrics?.rateChangeBps ?? 0;
  const yccStatus = customMetrics?.yccBandStatus ?? event.metrics?.yccBandStatus ?? 'ABOLISHED';
  const bondBuying = customMetrics?.monthlyJgbBondBuyingTrillionYen ?? event.metrics?.monthlyJgbBondBuyingTrillionYen ?? 3.0;
  const uedaTone = customMetrics?.governorUedaTone ?? event.metrics?.governorUedaTone ?? 'HAWKISH';

  const isEvaluated = rateActual !== null && rateActual !== undefined;
  const checklist: ChecklistStep[] = [];

  // Step 1: Policy Rate Decision
  const isHike = isEvaluated && rateChange > 0;
  checklist.push({
    id: 'boj-rate',
    label: 'BOJ Uncollateralized Overnight Call Rate',
    description: 'Benchmark interest rate decision by Bank of Japan Policy Board',
    status: isUpcoming ? 'PENDING' : isHike ? 'PASS' : 'MIXED',
    skew: isUpcoming ? 'NEUTRAL' : isHike ? 'HAWKISH' : 'DOVISH',
    actualValue: isEvaluated ? `${rateActual.toFixed(2)}% (+${rateChange} bps)` : 'Awaiting Release',
    expectedValue: `${rateForecast.toFixed(2)}%`,
    deltaStr: isUpcoming ? `Target: ${rateForecast.toFixed(2)}%` : `+${rateChange} bps hike`,
    weight: 3,
    reasoning: isUpcoming
      ? `Bank of Japan monetary policy statement. Consensus expects rate at ${rateForecast.toFixed(2)}%. Rate hike (+15-25bps) triggers aggressive Yen Carry Trade unwind.`
      : isHike
      ? `Bank of Japan raised policy rate by +${rateChange} bps to ${rateActual}%. Continuous exit from ultra-loose monetary policy.`
      : `BOJ kept short-term rate unchanged at ${rateActual}%.`,
    scenarioThresholds: {
      hawkishThreshold: 'Rate Hike (+15 to +25 bps) to ≥ 0.50%',
      dovishThreshold: 'Rate Hold at 0.25% with dovish forward guidance',
      inLineRange: 'Rate Hold at 0.25% with neutral guidance',
      hawkishOutcome: 'Yen Carry Trade unwinds; USD/JPY plunges 150-280 pips, Nikkei falls.',
      dovishOutcome: 'Yen selling resumes; USD/JPY rallies 120-200 pips.',
      inLineOutcome: 'Orderly rate trajectory absorption.'
    }
  });

  // Step 2: Yield Curve Control (YCC) Framework
  const yccNormalizing = yccStatus === 'ABOLISHED' || yccStatus === 'WIDENED';
  checklist.push({
    id: 'boj-ycc',
    label: 'Yield Curve Control (YCC) Framework',
    description: 'Cap on 10-Year Japanese Government Bond (JGB) yields',
    status: isUpcoming ? 'PENDING' : yccNormalizing ? 'PASS' : 'FAIL',
    skew: isUpcoming ? 'NEUTRAL' : yccNormalizing ? 'HAWKISH' : 'DOVISH',
    actualValue: isUpcoming ? 'Awaiting Policy Statement' : yccStatus,
    expectedValue: 'ABOLISHED / FLEXIBLE',
    deltaStr: isUpcoming ? 'Market-Determined JGB Yields' : yccStatus,
    weight: 3,
    reasoning: isUpcoming
      ? 'Monitoring sovereign bond yield flexibility and removal of artificial 10Y JGB yield caps.'
      : yccNormalizing
      ? 'YCC framework eliminated/softened, allowing Japanese market interest rates to trade freely based on market forces.'
      : 'YCC constraints retained, capping JGB yields artificially.',
  });

  // Step 3: JGB Purchase Tapering Schedule
  const bondTaper = bondBuying <= 4.0;
  checklist.push({
    id: 'boj-taper',
    label: 'Monthly JGB Purchase Tapering',
    description: 'Reduction of monthly quantitative bond purchase volume',
    status: isUpcoming ? 'PENDING' : bondTaper ? 'PASS' : 'MIXED',
    skew: isUpcoming ? 'NEUTRAL' : bondTaper ? 'HAWKISH' : 'NEUTRAL',
    actualValue: isUpcoming ? 'Target: ¥3.0T / month' : `¥${bondBuying.toFixed(1)}T / month`,
    expectedValue: '<= ¥4.0T / month',
    deltaStr: isUpcoming ? 'Quantitative Tapering Plan' : `Reduced to ¥${bondBuying}T`,
    weight: 2,
    reasoning: isUpcoming
      ? 'Quarterly bond purchase reduction path from former ¥6T/month pace.'
      : bondTaper
      ? `BOJ committed to cutting monthly sovereign bond purchases down to ¥${bondBuying}T, reducing central bank footprint in debt markets.`
      : `Bond purchase pace kept elevated.`,
  });

  // Step 4: Governor Ueda Press Conference Stance
  checklist.push({
    id: 'boj-ueda',
    label: 'Governor Ueda Forward Guidance',
    description: 'Post-meeting press conference assessment of wage-price virtuous cycle',
    status: isUpcoming ? 'PENDING' : uedaTone === 'HAWKISH' ? 'PASS' : 'MIXED',
    skew: isUpcoming ? 'NEUTRAL' : uedaTone,
    actualValue: isUpcoming ? 'Awaiting Press Conference' : uedaTone,
    expectedValue: 'HAWKISH / NORMALIZATION',
    deltaStr: isUpcoming ? 'Wage-Price Cycle Focus' : `${uedaTone} posture`,
    weight: 2,
    reasoning: isUpcoming
      ? 'Governor Ueda press conference at 06:30 GMT will clarify future rate hike pace and inflation outlook.'
      : uedaTone === 'HAWKISH'
      ? 'Governor Ueda noted broad wage increases spreading to service prices and hinted at further rate hikes if baseline outlook is met.'
      : 'Ueda expressed cautious tone regarding domestic consumption fragility and global growth risks.',
  });

  // Verdict calculation
  let verdict: EngineEvaluationResult['verdict'] = 'HAWKISH_SURPRISE';
  let verdictLabel = 'PRE-RELEASE EXPECTATION MATRIX ACTIVE';
  let confidenceScore = 85;
  let summaryThesis = '';

  if (isUpcoming) {
    verdict = 'NEUTRAL_SKEW';
    verdictLabel = 'PRE-RELEASE EXPECTATION MATRIX ACTIVE';
    confidenceScore = 85;
    summaryThesis = `Bank of Japan Monetary Policy Decision: Policy Board consensus expects rate at ${rateForecast.toFixed(2)}%. Pre-release expectation matrix calibrated for Yen transmission.`;
  } else if (isHike && uedaTone === 'HAWKISH') {
    verdict = 'HAWKISH_SURPRISE';
    verdictLabel = 'HISTORIC BOJ HIKING & GLOBAL CARRY UNWIND';
    confidenceScore = 96;
    summaryThesis = `Bank of Japan delivered a decisive rate hike to ${rateActual}% and committed to tapering bond purchases. Rapid compression of US-Japan yield spreads triggers massive liquidation of JPY-funded carry trades across global assets.`;
  } else if (!isHike && uedaTone === 'DOVISH') {
    verdict = 'DOVISH_SURPRISE';
    verdictLabel = 'DOVISH BOJ PAUSE';
    confidenceScore = 85;
    summaryThesis = `BOJ paused policy normalization due to fragile domestic demand. JPY carry trade resumes; USD/JPY pushes higher.`;
  } else {
    verdict = 'GOLDILOCKS_CONTINUATION';
    verdictLabel = 'MEASURED JAPANESE RATE NORMALIZATION';
    confidenceScore = 82;
    summaryThesis = `BOJ maintained a predictable, well-telegraphed normalization pace, mitigating abrupt cross-market liquidity shocks.`;
  }

  const isHawkishBoj = verdict === 'HAWKISH_SURPRISE';

  const assetImpacts: AssetImpact[] = [
    {
      symbol: 'USD/JPY',
      name: 'US Dollar / Japanese Yen',
      category: 'FX',
      bias: isHawkishBoj ? 'STRONG_SELL' : 'BUY',
      action: isHawkishBoj ? 'SHORT' : 'LONG',
      confidence: confidenceScore,
      magnitude: 'HIGH',
      expectedMove: isHawkishBoj ? '-350 to -650 pips (-3.2%)' : '+120 pips',
      transmissionRationale: isHawkishBoj
        ? 'Epic unwind of billions in yen-short carry trades. Speculative and institutional accounts scramble to buy Yen to cover liabilities.'
        : 'Yen weakens as rate differentials remain too wide.',
      invalidationTrigger: 'US Fed suddenly out-hiking or Japan MoF expressing concern over rapid yen appreciation',
      correlationRank: 1,
      primaryDriver: 'Direct JPY Carry Trade Repatriation',
    },
    {
      symbol: 'SPX',
      name: 'S&P 500 Index / Global Equities',
      category: 'INDICES',
      bias: isHawkishBoj ? 'SELL' : 'BUY',
      action: isHawkishBoj ? 'FADE SPIKES' : 'LONG',
      confidence: confidenceScore - 6,
      magnitude: 'HIGH',
      expectedMove: isHawkishBoj ? '-1.8% to -3.2% (Carry liquidation volatility)' : '+0.8%',
      transmissionRationale: isHawkishBoj
        ? 'Global hedge funds and macro desks forced to liquidate high-performing risk assets (tech, momentum) to meet margin calls on unwinding yen carry trades.'
        : 'Global liquidity remains ample.',
      invalidationTrigger: 'Emergency liquidity injections from major Western central banks',
      correlationRank: 2,
      primaryDriver: 'Cross-Asset Margin Deleveraging',
    },
    {
      symbol: 'BTC/USD',
      name: 'Bitcoin',
      category: 'CRYPTO',
      bias: isHawkishBoj ? 'SELL' : 'STRONG_BUY',
      action: isHawkishBoj ? 'STAND ASIDE' : 'LONG',
      confidence: 75,
      magnitude: 'HIGH',
      expectedMove: isHawkishBoj ? '-5.0% to -9.0% initial deleveraging' : '+4.0%',
      transmissionRationale: isHawkishBoj
        ? 'High-beta liquidity assets face abrupt collateral drain as yen-funded global leverage is rapidly reduced.'
        : 'Cheap yen liquidity continues flowing into digital assets.',
      invalidationTrigger: 'Massive spot Bitcoin ETF institutional inflows offsetting macro liquidations',
      correlationRank: 3,
      primaryDriver: 'Global Speculative Leverage Liquidation',
    },
    {
      symbol: 'US10Y',
      name: 'US 10-Year Treasury Yield',
      category: 'YIELDS',
      bias: isHawkishBoj ? 'STRONG_BUY' : 'WATCH', // Higher yields initially as Japanese investors repatriate funds
      action: isHawkishBoj ? 'LONG' : 'STAND ASIDE',
      confidence: 82,
      magnitude: 'MEDIUM',
      expectedMove: isHawkishBoj ? '+6 to +12 bps' : '±2 bps',
      transmissionRationale: isHawkishBoj
        ? 'Japanese institutional investors (insurers, pensions) reduce holdings of hedged foreign debt as domestic JGB yields become attractive.'
        : 'Status quo Japanese demand for US Treasuries.',
      invalidationTrigger: 'Flight-to-safety Treasury buying overpowering Japanese repatriation selling',
      correlationRank: 4,
      primaryDriver: 'Japanese Institutional Capital Repatriation',
    },
    {
      symbol: 'XAU/USD',
      name: 'Spot Gold',
      category: 'COMMODITIES',
      bias: isHawkishBoj ? 'BUY' : 'WATCH',
      action: isHawkishBoj ? 'BUY PULLBACKS' : 'STAND ASIDE',
      confidence: 78,
      magnitude: 'MEDIUM',
      expectedMove: isHawkishBoj ? 'Initial dip followed by +$25/oz safe haven recovery' : '±$5/oz',
      transmissionRationale: isHawkishBoj
        ? 'Initial cross-asset margin liquidations create brief gold pullbacks, quickly followed by safe-haven accumulation against global financial stability risks.'
        : 'Neutral backdrop.',
      invalidationTrigger: 'Severe ongoing liquidity freeze',
      correlationRank: 5,
      primaryDriver: 'Safe Haven & Financial Stability Hedge',
    },
    {
      symbol: 'DXY',
      name: 'US Dollar Index',
      category: 'FX',
      bias: isHawkishBoj ? 'SELL' : 'BUY',
      action: isHawkishBoj ? 'SHORT' : 'LONG',
      confidence: 85,
      magnitude: 'MEDIUM',
      expectedMove: isHawkishBoj ? '-0.65% (-70 pts)' : '+30 pts',
      transmissionRationale: isHawkishBoj
        ? 'Yen represents 13.6% of the DXY index basket; explosive yen rally directly pulls the Dollar Index downward.'
        : 'Dollar gains against weak yen.',
      invalidationTrigger: 'Euro weakness offsetting yen strength in the basket',
      correlationRank: 6,
      primaryDriver: 'DXY Index Basket Weight (13.6% JPY)',
    },
  ];

  return {
    eventId: event.id,
    eventTitle: event.title || 'Bank of Japan (BOJ) Monetary Policy Decision',
    eventCode: 'BOJ',
    verdict,
    verdictLabel,
    confidenceScore,
    summaryThesis,
    checklist,
    assetImpacts,
    timestamp: Date.now(),
  };
}
