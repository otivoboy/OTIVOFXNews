import { ChecklistStep, AssetImpact, EngineEvaluationResult, EconomicEvent } from '../types';

export interface PpiMetrics {
  headlineMoMActual: number; // e.g. 0.3%
  headlineMoMForecast: number; // e.g. 0.1%
  headlineYoYActual?: number;
  headlineYoYForecast?: number;
  coreMoMActual: number; // e.g. 0.2%
  coreMoMForecast: number; // e.g. 0.1%
  servicesMoMActual?: number; // Core services pipeline
  intermediateGoodsMoM?: number; // Raw material input costs
}

export function evaluatePPI(
  event: EconomicEvent,
  customMetrics?: Partial<PpiMetrics>
): EngineEvaluationResult {
  const isUpcoming = event.status !== 'RELEASED' && event.actual === null && customMetrics?.headlineMoMActual === undefined && customMetrics?.coreMoMActual === undefined;

  const headlineMoMExp = customMetrics?.headlineMoMForecast ?? event.forecast ?? 0.4;
  const coreMoMExp = customMetrics?.coreMoMForecast ?? event.metrics?.coreMoMForecast ?? 0.3;
  const servicesMoMExp = 0.2;

  const headlineMoM = customMetrics?.headlineMoMActual ?? event.actual;
  const coreMoM = customMetrics?.coreMoMActual ?? event.metrics?.coreMoMActual;
  const servicesMoM = customMetrics?.servicesMoMActual ?? event.metrics?.servicesMoMActual;

  const isEvaluated = headlineMoM !== null && headlineMoM !== undefined;
  const headlineSurprise = isEvaluated ? Number((headlineMoM - headlineMoMExp).toFixed(2)) : 0;
  const coreSurprise = isEvaluated && coreMoM !== null && coreMoM !== undefined ? Number((coreMoM - coreMoMExp).toFixed(2)) : 0;

  const checklist: ChecklistStep[] = [];

  // Step 1: Headline Final Demand MoM
  const headlineHot = isEvaluated && headlineSurprise >= 0.15;
  const headlineCool = isEvaluated && headlineSurprise <= -0.15;
  checklist.push({
    id: 'ppi-headline',
    label: 'PPI Final Demand MoM Surprise',
    description: 'Wholesale producer output price changes passed along the supply chain',
    status: isUpcoming ? 'PENDING' : headlineHot ? 'FAIL' : headlineCool ? 'PASS' : 'MIXED',
    skew: isUpcoming ? 'NEUTRAL' : headlineHot ? 'HAWKISH' : headlineCool ? 'DOVISH' : 'NEUTRAL',
    actualValue: isEvaluated ? `+${headlineMoM}% MoM` : 'Awaiting Release',
    expectedValue: `+${headlineMoMExp}% MoM`,
    deltaStr: isEvaluated ? `${headlineSurprise > 0 ? '+' : ''}${headlineSurprise}% MoM` : `Consensus: +${headlineMoMExp}%`,
    weight: 2,
    reasoning: isUpcoming
      ? `Consensus expects headline PPI to rise +${headlineMoMExp}% MoM. A print ≥ +0.55% indicates upstream supply chain cost acceleration; a print ≤ +0.25% confirms disinflation.`
      : headlineHot
      ? `Wholesale pipeline inflation surged to +${headlineMoM}% MoM (+${headlineSurprise}% delta). Signals upstream cost pressure.`
      : headlineCool
      ? `Producer price growth softened to +${headlineMoM}% MoM, confirming diminishing supplier pricing power.`
      : `Producer prices aligned with estimates at +${headlineMoM}%.`,
    scenarioThresholds: {
      hawkishThreshold: `≥ +0.55% MoM (Beat by ≥ +0.15%)`,
      dovishThreshold: `≤ +0.25% MoM (Miss by ≥ -0.15%)`,
      inLineRange: `+0.30% to +0.45% MoM`,
      hawkishOutcome: `Producer inflation pressures pass through to consumer prices; yields jump 6-9 bps, DXY rallies.`,
      dovishOutcome: `Upstream disinflation confirmed; Treasury yields decline 5-8 bps, Gold rallies +$18-25/oz.`,
      inLineOutcome: `Producer prices absorbed in-line; modest range-bound consolidation.`
    },
    preReleaseGuidance: 'High algorithmic sensitivity in US Treasury yields (2Y & 10Y) and Gold upon 08:30 EDT release.'
  });

  // Step 2: Core PPI (Ex-Food, Energy, Trade Services)
  const coreHot = isEvaluated && coreSurprise >= 0.1;
  const coreCool = isEvaluated && coreSurprise <= -0.1;
  checklist.push({
    id: 'ppi-core',
    label: 'Core PPI (PCE Feedthrough Categories)',
    description: 'Key input categories (portfolio management, healthcare, airfares) feeding directly into Core PCE',
    status: isUpcoming ? 'PENDING' : coreHot ? 'FAIL' : coreCool ? 'PASS' : 'MIXED',
    skew: isUpcoming ? 'NEUTRAL' : coreHot ? 'HAWKISH' : coreCool ? 'DOVISH' : 'NEUTRAL',
    actualValue: isEvaluated && coreMoM !== undefined ? `+${coreMoM}% MoM` : 'Awaiting Release',
    expectedValue: `+${coreMoMExp}% MoM`,
    deltaStr: isEvaluated ? `${coreSurprise > 0 ? '+' : ''}${coreSurprise}% MoM` : `Consensus: +${coreMoMExp}%`,
    weight: 3,
    reasoning: isUpcoming
      ? `Core PPI (expected +${coreMoMExp}% MoM) provides direct feeder components into upcoming Core PCE calculations.`
      : coreHot
      ? `Core PPI accelerated to +${coreMoM}%. Directly elevates consensus estimates for upcoming Core PCE release.`
      : coreCool
      ? `Core wholesale components decelerated to +${coreMoM}%, providing favorable inputs for next Core PCE calculation.`
      : `Core wholesale inflation matched expectations.`,
    scenarioThresholds: {
      hawkishThreshold: `≥ +0.45% MoM (Hot Core PCE Feedthrough)`,
      dovishThreshold: `≤ +0.15% MoM (Benign Core PCE Input)`,
      inLineRange: `+0.25% to +0.35% MoM`,
      hawkishOutcome: `Forces Wall Street desks to revise Core PCE forecasts higher; aggressive dollar bidding.`,
      dovishOutcome: `Relieves Core PCE inflation overhang; unlocks risk-on equity & bullion rally.`,
      inLineOutcome: `Feeder components align with baseline Fed glidepath.`
    },
    preReleaseGuidance: 'Tier-1 priority metric for institutional econometric modeling.'
  });

  // Step 3: Trade Services & Margins
  const servicesSticky = isEvaluated && servicesMoM !== undefined && servicesMoM >= 0.3;
  checklist.push({
    id: 'ppi-services',
    label: 'Trade & Distribution Services Margin',
    description: 'Measures retailer and wholesaler markup margins',
    status: isUpcoming ? 'PENDING' : servicesSticky ? 'FAIL' : 'PASS',
    skew: isUpcoming ? 'NEUTRAL' : servicesSticky ? 'HAWKISH' : 'DOVISH',
    actualValue: isEvaluated && servicesMoM !== undefined ? `+${servicesMoM}% MoM` : 'Awaiting Release',
    expectedValue: '<= +0.2% MoM',
    deltaStr: isUpcoming ? 'Benchmark: <= +0.2%' : servicesSticky ? 'Expanding Margins' : 'Compressing Margins',
    weight: 2,
    reasoning: isUpcoming
      ? 'Monitors wholesale distribution and retail trade markup elasticity before consumer transmission.'
      : servicesSticky
      ? 'Distributor markups remain wide, preventing rapid retail deflation.'
      : 'Wholesale trade margins compressed, demonstrating competitive price competition.',
    scenarioThresholds: {
      hawkishThreshold: '≥ +0.35% (Sticky Wholesaler Markups)',
      dovishThreshold: '≤ +0.10% (Margin Compression)',
      inLineRange: '+0.15% to +0.25%',
      hawkishOutcome: 'Sticky services inflation limits Fed easing magnitude.',
      dovishOutcome: 'Margin compression accelerates consumer disinflation timeline.',
      inLineOutcome: 'Orderly distributor margin behavior.'
    }
  });

  // Verdict calculation
  let verdict: EngineEvaluationResult['verdict'] = 'MIXED_NO_ACTION';
  let verdictLabel = 'PRE-RELEASE EXPECTATION MATRIX ACTIVE';
  let confidenceScore = 85;
  let summaryThesis = '';

  if (isUpcoming) {
    verdict = 'NEUTRAL_SKEW';
    verdictLabel = 'PRE-RELEASE EXPECTATION MATRIX ACTIVE';
    confidenceScore = 85;
    summaryThesis = `Upcoming PPI Release: Consensus expects headline PPI at +${headlineMoMExp}% MoM and Core PPI at +${coreMoMExp}% MoM. Pre-release matrix calibrated for immediate post-release execution.`;
  } else if (headlineHot && coreHot) {
    verdict = 'HAWKISH_SURPRISE';
    verdictLabel = 'HOT PPI INFLATION SHOCK';
    confidenceScore = 88;
    summaryThesis = `Wholesale producer prices (+${headlineMoM}% MoM) and Core inputs (+${coreMoM}%) both printed substantially above forecast. Raises upcoming Core PCE projections and prompts short-term yield spikes.`;
  } else if (headlineCool && coreCool) {
    verdict = 'DISINFLATION_CONFIRMED';
    verdictLabel = 'PRODUCER DISINFLATION CONFIRMED';
    confidenceScore = 86;
    summaryThesis = `Clean downside surprise across PPI pipeline (+${headlineMoM}% MoM). Confirms that supplier cost pressures have normalized, anchoring benign PCE forecasts.`;
  } else {
    verdict = 'MIXED_NO_ACTION';
    verdictLabel = 'MIXED WHOLESALE SKEW';
    confidenceScore = 62;
    summaryThesis = `Divergence between volatile goods vs sticky trade services. Modest market impact expected; traders await CPI/PCE validation.`;
  }

  const isHawkish = verdict === 'HAWKISH_SURPRISE';
  const isDovish = verdict === 'DISINFLATION_CONFIRMED';

  const assetImpacts: AssetImpact[] = [
    {
      symbol: 'US10Y',
      name: 'US 10-Year Treasury Yield',
      category: 'YIELDS',
      bias: isHawkish ? 'STRONG_BUY' : isDovish ? 'SELL' : 'WATCH',
      action: isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
      confidence: confidenceScore,
      magnitude: 'MEDIUM',
      expectedMove: isHawkish ? '+5 to +9 bps' : isDovish ? '-4 to -8 bps' : '±2 bps',
      transmissionRationale: isHawkish
        ? 'Short-end and intermediate yields jump as bond desks re-calculate higher baseline Core PCE numbers.'
        : isDovish
        ? 'Yield relief as producer disinflation removes upstream rate hike or delay risks.'
        : 'Neutral response.',
      invalidationTrigger: 'Upcoming CPI print overturning PPI signal',
      correlationRank: 1,
      primaryDriver: 'Upstream Core PCE Feedthrough Estimation',
    },
    {
      symbol: 'XAU/USD',
      name: 'Spot Gold',
      category: 'COMMODITIES',
      bias: isHawkish ? 'SELL' : isDovish ? 'BUY' : 'WATCH',
      action: isHawkish ? 'SHORT' : isDovish ? 'LONG' : 'STAND ASIDE',
      confidence: confidenceScore - 5,
      magnitude: 'MEDIUM',
      expectedMove: isHawkish ? '-$18 to -$28/oz' : isDovish ? '+$16 to +$25/oz' : '±$5/oz',
      transmissionRationale: isHawkish
        ? 'Upstream inflation surprise revives rate cut delay fears, causing gold speculators to trim long leverage.'
        : isDovish
        ? 'Easing pipeline cost pressures reinforce gold bull thesis.'
        : 'Range trading.',
      invalidationTrigger: 'Geopolitical flight to safety buying',
      correlationRank: 2,
      primaryDriver: 'Real Yields Repricing',
    },
    {
      symbol: 'DXY',
      name: 'US Dollar Index',
      category: 'FX',
      bias: isHawkish ? 'BUY' : isDovish ? 'SELL' : 'WATCH',
      action: isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
      confidence: confidenceScore - 4,
      magnitude: 'MEDIUM',
      expectedMove: isHawkish ? '+0.45% (+45 pts)' : isDovish ? '-0.40% (-40 pts)' : '±12 pts',
      transmissionRationale: isHawkish
        ? 'Modest dollar bid on temporary repricing of Fed easing trajectory.'
        : isDovish
        ? 'Yield drift lower pushes DXY towards range lows.'
        : 'Range consolidation.',
      invalidationTrigger: 'Conflicting European inflation figures',
      correlationRank: 3,
      primaryDriver: 'PCE Estimation & Front-End Yield Adjustments',
    },
    {
      symbol: 'SPX',
      name: 'S&P 500 Index',
      category: 'INDICES',
      bias: isHawkish ? 'SELL' : isDovish ? 'BUY' : 'WATCH',
      action: isHawkish ? 'FADE SPIKES' : isDovish ? 'BUY PULLBACKS' : 'STAND ASIDE',
      confidence: confidenceScore - 8,
      magnitude: 'LOW',
      expectedMove: isHawkish ? '-0.5% to -0.9%' : isDovish ? '+0.6% to +1.0%' : '±0.2%',
      transmissionRationale: isHawkish
        ? 'Rising producer input costs combined with higher borrowing costs threaten corporate operating margins.'
        : isDovish
        ? 'Benign input costs support corporate profit margin sustainability.'
        : 'Muted index reaction.',
      invalidationTrigger: 'Macro tech sector earnings momentum',
      correlationRank: 4,
      primaryDriver: 'Corporate Gross Margin Squeeze vs Relief',
    },
  ];

  return {
    eventId: event.id,
    eventTitle: event.title || 'US Producer Price Index (PPI)',
    eventCode: 'PPI',
    verdict,
    verdictLabel,
    confidenceScore,
    summaryThesis,
    checklist,
    assetImpacts,
    timestamp: Date.now(),
  };
}
