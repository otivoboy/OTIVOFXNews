import { ChecklistStep, AssetImpact, EngineEvaluationResult, EconomicEvent } from '../types';

export interface FomcMetrics {
  targetRateActual?: number;
  targetRateForecast?: number;
  rateChangeBps?: number;
  dotPlotMedianShift?: number;
  qtTaperAnnounced?: boolean;
  statementSkew?: 'HAWKISH' | 'DOVISH' | 'NEUTRAL';
  pressConferenceTone?: 'HAWKISH' | 'DOVISH' | 'BALANCED';
}

export function evaluateFOMC(
  event: EconomicEvent,
  customMetrics?: Partial<FomcMetrics>
): EngineEvaluationResult {
  const isMinutes = event.title.toLowerCase().includes('minutes');
  const isUpcoming = event.status !== 'RELEASED' && event.actual === null && customMetrics?.statementSkew === undefined;

  const statementSkew = customMetrics?.statementSkew ?? event.metrics?.statementSkew ?? 'DOVISH';
  const pressTone = customMetrics?.pressConferenceTone ?? event.metrics?.pressConferenceTone ?? 'DOVISH';
  const dotShift = customMetrics?.dotPlotMedianShift ?? event.metrics?.dotPlotMedianShift ?? -25;
  const rateChangeBps = customMetrics?.rateChangeBps ?? event.metrics?.rateChangeBps ?? 0;

  const isHawkish = statementSkew === 'HAWKISH' || dotShift > 0;
  const isDovish = statementSkew === 'DOVISH' || dotShift < 0;

  const checklist: ChecklistStep[] = [];

  // Step 1: Minutes Policy Tone & Rate Cut Consensus
  checklist.push({
    id: 'fomc-minutes-consensus',
    label: isMinutes ? 'FOMC Meeting Minutes Debate & Policy Easing Consensus' : 'Fed Funds Target Rate Decision',
    description: 'Detailed committee deliberations on balance of dual-mandate risks and speed of rate cuts',
    status: isUpcoming ? 'PENDING' : statementSkew === 'DOVISH' ? 'PASS' : 'MIXED',
    skew: statementSkew,
    actualValue: isUpcoming ? 'Awaiting 9:00pm Release' : `${statementSkew} Deliberation`,
    expectedValue: 'Dovish / Balanced Easing Bias',
    deltaStr: isUpcoming ? 'High Market Sensitivity' : `${statementSkew} phrasing`,
    weight: 3,
    reasoning: isUpcoming
      ? 'Markets will scrutinize the Minutes to assess the voting majority for upcoming 25bps vs 50bps rate cuts, and whether any members favored maintaining higher rates.'
      : statementSkew === 'DOVISH'
      ? 'Minutes emphasized growing confidence in the inflation path towards 2% and elevated concerns about labor market downside risks. Supports aggressive easing.'
      : 'Minutes revealed ongoing hesitation among multiple participants regarding sticky core services inflation.',
    scenarioThresholds: {
      hawkishThreshold: 'Multiple participants advocate pausing rate cuts / raising neutral rate (r*)',
      dovishThreshold: 'Majority view labor market downside risks as having surpassed inflation risks',
      inLineRange: 'Balanced data-dependent stance confirming steady 25bps rate reductions per meeting',
      hawkishOutcome: 'Yields jump 8-12 bps; DXY rallies +75 pts; Gold drops -$30/oz.',
      dovishOutcome: 'Yields drop 8-14 bps; Gold rallies +$35/oz; EUR/USD and risk assets rally.',
      inLineOutcome: 'Gradual easing path confirmed; range-bound consolidation.'
    },
    historicalVolatility: '±$28/oz on Gold | ±55 pts on DXY',
    componentWeighting: 'Tier 1 Central Bank Policy Anchor',
    keyDrivers: ['Estimate of neutral interest rate (r*)', 'Labor market slack vs inflation balance', 'Conditions required for 50bps jumbo cuts'],
    institutionalFocus: 'Wall Street macro desks search for the word "several" vs "most" participants.',
    preReleaseGuidance: 'High algorithmic scanning volatility across US Treasury futures in the first 10 seconds of release at 14:00 EDT (21:00 GMT+3).'
  });

  // Step 2: Quantitative Tightening (QT) & Balance Sheet Terminal Size
  checklist.push({
    id: 'fomc-qt-schedule',
    label: 'Quantitative Tightening (QT) & Liquidity Facilities',
    description: 'Committee debate regarding the terminal size of the Fed balance sheet and bank reserve levels',
    status: 'MIXED',
    skew: 'NEUTRAL',
    actualValue: 'Standard Runoff Active',
    expectedValue: 'Taper Discussion Active',
    deltaStr: 'Liquidity Neutral',
    weight: 2,
    reasoning: 'Discussions on ending balance sheet runoff provide critical forward guidance for Treasury repo liquidity and short-term funding markets.',
    scenarioThresholds: {
      hawkishThreshold: 'Runoff continued without discussion of end date',
      dovishThreshold: 'Explicit criteria provided for halting balance sheet reduction by year-end',
      inLineRange: 'Ongoing monitoring of SOFR and ON RRP drainage',
      hawkishOutcome: 'Treasury curve steepens on ongoing supply digestion pressure.',
      dovishOutcome: 'Bank reserves protected; bullish liquidity tailwind for crypto and equities.'
    }
  });

  const assetImpacts: AssetImpact[] = [
    {
      symbol: 'XAU/USD',
      name: 'Spot Gold',
      category: 'COMMODITIES',
      bias: isUpcoming ? 'WATCH' : isDovish ? 'STRONG_BUY' : isHawkish ? 'STRONG_SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isDovish ? 'LONG' : isHawkish ? 'SHORT' : 'STAND ASIDE',
      confidence: 90,
      magnitude: 'HIGH',
      expectedMove: isDovish ? '+$28 to +$45/oz (+1.3%)' : isHawkish ? '-$30 to -$48/oz (-1.4%)' : '±$7/oz',
      transmissionRationale: 'Sensitivity to real rate projections and sovereign currency debasement expectations.',
      invalidationTrigger: 'Immediate post-release hawkish Fed speaker comments',
      correlationRank: 1,
      primaryDriver: 'US Real Yield Projections & Liquidity Cycle',
      currentPosture: 'Consolidating near highs; watch for 14:00 EDT text release reaction.',
      upsideScenario: {
        trigger: 'Minutes show broad consensus for rapid rate cuts (Dovish)',
        action: 'LONG',
        targetPrice: '+$35/oz breakout',
        stopLoss: '-$12/oz',
        expectedMove: '+$28 to +$45/oz',
        rationale: 'Confirmation of aggressive easing cycle pulls real yields lower.'
      },
      downsideScenario: {
        trigger: 'Minutes show significant dissent / pause advocates (Hawkish)',
        action: 'SHORT',
        targetPrice: '-$32/oz pullback',
        stopLoss: '+$12/oz',
        expectedMove: '-$30 to -$48/oz',
        rationale: 'Higher-for-longer pricing forces short-term liquidation in bullion.'
      },
      volatilityWindow: '00:00 - 30:00 min',
      transmissionSpeed: 'INSTANT (0-30s)'
    },
    {
      symbol: 'DXY',
      name: 'US Dollar Index',
      category: 'FX',
      bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'STRONG_SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
      confidence: 88,
      magnitude: 'HIGH',
      expectedMove: isHawkish ? '+65 to +100 pts' : isDovish ? '-60 to -95 pts' : '±16 pts',
      transmissionRationale: 'Global rate carry differential repricing.',
      invalidationTrigger: 'Simultaneous ECB or BoJ policy shifts',
      correlationRank: 2,
      primaryDriver: 'Federal Reserve Policy Trajectory',
      currentPosture: 'Hovering in 103.80 corridor awaiting FOMC Minutes language.',
      transmissionSpeed: 'INSTANT (0-30s)'
    },
    {
      symbol: 'US10Y',
      name: 'US 10-Year Treasury Yield',
      category: 'YIELDS',
      bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
      confidence: 92,
      magnitude: 'HIGH',
      expectedMove: isHawkish ? '+8 to +13 bps' : isDovish ? '-7 to -12 bps' : '±2 bps',
      transmissionRationale: 'Direct sovereign term premium and policy path discounting.',
      invalidationTrigger: 'Treasury refunding schedule updates',
      correlationRank: 3,
      primaryDriver: 'Terminal Rate & Neutral Rate (r*) Repricing',
      transmissionSpeed: 'INSTANT (0-30s)'
    },
    {
      symbol: 'SPX',
      name: 'S&P 500 Index',
      category: 'INDICES',
      bias: isUpcoming ? 'WATCH' : isDovish ? 'BUY' : isHawkish ? 'SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isDovish ? 'BUY PULLBACKS' : isHawkish ? 'FADE SPIKES' : 'STAND ASIDE',
      confidence: 84,
      magnitude: 'MEDIUM',
      expectedMove: isDovish ? '+0.9% to +1.5%' : isHawkish ? '-1.0% to -1.6%' : '±0.25%',
      transmissionRationale: 'Corporate discount rate and equity risk premium adjustment.',
      invalidationTrigger: 'Earnings releases',
      correlationRank: 4,
      primaryDriver: 'Equity Discount Rate Transmission',
      transmissionSpeed: 'INTERMEDIATE (1-15m)'
    },
    {
      symbol: 'BTC/USD',
      name: 'Bitcoin',
      category: 'CRYPTO',
      bias: isUpcoming ? 'WATCH' : isDovish ? 'STRONG_BUY' : isHawkish ? 'SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isDovish ? 'LONG' : 'STAND ASIDE',
      confidence: 80,
      magnitude: 'HIGH',
      expectedMove: isDovish ? '+3.0% to +5.0%' : isHawkish ? '-2.5% to -4.5%' : '±0.8%',
      transmissionRationale: 'High-beta sensitivity to USD liquidity conditions and balance sheet QT plans.',
      invalidationTrigger: 'Crypto market-specific liquidations',
      correlationRank: 5,
      primaryDriver: 'USD Fiat Liquidity Expansion',
      transmissionSpeed: 'INSTANT (0-30s)'
    }
  ];

  return {
    eventId: event.id,
    eventTitle: event.title,
    eventCode: 'FOMC',
    verdict: isUpcoming ? 'MIXED_NO_ACTION' : isHawkish ? 'HAWKISH_SURPRISE' : isDovish ? 'DOVISH_SURPRISE' : 'GOLDILOCKS_CONTINUATION',
    verdictLabel: isUpcoming ? 'FOMC PRE-RELEASE MATRIX ACTIVE' : isHawkish ? 'HAWKISH PAUSE SKEW' : isDovish ? 'DOVISH EASING CYCLE CONFIRMED' : 'BALANCED OUTCOME',
    confidenceScore: isUpcoming ? 88 : 91,
    summaryThesis: isUpcoming
      ? `FOMC Meeting Minutes scheduled for 9:00pm (14:00 EDT). Scrutinizing consensus for 25bps vs 50bps rate cuts and neutral rate (r*) discussions. Cross-asset matrix is active with dynamic trigger scenarios.`
      : isHawkish
      ? `Minutes revealed hawkish hesitation on rate cuts. Yields and USD surge.`
      : `Minutes confirmed strong consensus for continued rate cuts. Gold and equities surge.`,
    checklist,
    assetImpacts,
    timestamp: Date.now(),
  };
}
