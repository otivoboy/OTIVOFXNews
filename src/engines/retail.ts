import { ChecklistStep, AssetImpact, EngineEvaluationResult, EconomicEvent } from '../types';

export interface RetailMetrics {
  headlineMoMActual: number; // e.g. 0.4%
  headlineMoMForecast: number; // e.g. 0.1%
  coreExAutosMoMActual: number; // e.g. 0.3%
  coreExAutosMoMForecast: number; // e.g. 0.2%
  retailControlGroupMoMActual: number; // e.g. 0.4% (Direct GDP personal consumption component)
  retailControlGroupMoMForecast: number; // e.g. 0.2%
  gasStationSalesMoM?: number;
}

export function evaluateRetailSales(
  event: EconomicEvent,
  customMetrics?: Partial<RetailMetrics>
): EngineEvaluationResult {
  const isUpcoming = event.status !== 'RELEASED' && event.actual === null && customMetrics?.headlineMoMActual === undefined && customMetrics?.retailControlGroupMoMActual === undefined;

  const headlineExp = customMetrics?.headlineMoMForecast ?? event.forecast ?? 0.3;
  const coreExp = customMetrics?.coreExAutosMoMForecast ?? event.metrics?.coreExAutosMoMForecast ?? 0.2;
  const controlExp = customMetrics?.retailControlGroupMoMForecast ?? event.metrics?.retailControlGroupMoMForecast ?? 0.3;

  const headline = customMetrics?.headlineMoMActual ?? event.actual;
  const core = customMetrics?.coreExAutosMoMActual ?? event.metrics?.coreExAutosMoMActual;
  const control = customMetrics?.retailControlGroupMoMActual ?? event.metrics?.retailControlGroupMoMActual;

  const isEvaluated = headline !== null && headline !== undefined;
  const headlineSurprise = isEvaluated ? Number((headline - headlineExp).toFixed(2)) : 0;
  const controlSurprise = isEvaluated && control !== null && control !== undefined ? Number((control - controlExp).toFixed(2)) : 0;

  const checklist: ChecklistStep[] = [];

  // Step 1: Headline Advance Retail Sales
  const headlineStrong = isEvaluated && headlineSurprise >= 0.2;
  const headlineWeak = isEvaluated && headlineSurprise <= -0.2;
  checklist.push({
    id: 'retail-headline',
    label: 'Headline Advance Retail Sales MoM',
    description: 'Total dollar volume of consumer purchases across retail and food services',
    status: isUpcoming ? 'PENDING' : headlineStrong ? 'PASS' : headlineWeak ? 'FAIL' : 'MIXED',
    skew: isUpcoming ? 'NEUTRAL' : headlineStrong ? 'HAWKISH' : headlineWeak ? 'DOVISH' : 'NEUTRAL',
    actualValue: isEvaluated ? `+${headline}% MoM` : 'Awaiting Release',
    expectedValue: `+${headlineExp}% MoM`,
    deltaStr: isEvaluated ? `${headlineSurprise > 0 ? '+' : ''}${headlineSurprise}% delta` : `Consensus: +${headlineExp}%`,
    weight: 2,
    reasoning: isUpcoming
      ? `Consensus forecasts headline retail sales growing by +${headlineExp}% MoM. A print ≥ +0.5% demonstrates strong consumer resilience; a print ≤ 0.0% signals consumer contraction.`
      : headlineStrong
      ? `Strong consumer spending (+${headline}% MoM vs +${headlineExp}% exp). Demonstrates household demand resilience.`
      : headlineWeak
      ? `Consumer spending contracted/stagnated at ${headline}% MoM. Indicates consumer discretionary exhaustion.`
      : `Retail spending matched forecast at +${headline}%.`,
    scenarioThresholds: {
      hawkishThreshold: '≥ +0.55% MoM (Robust Consumer)',
      dovishThreshold: '≤ 0.00% MoM (Consumer Fatigue)',
      inLineRange: '+0.20% to +0.40% MoM',
      hawkishOutcome: 'Soft landing confirmed; yields surge, Dollar bids higher against majors.',
      dovishOutcome: 'Recession/slowdown pricing emerges; yields drop, Gold & defensive assets bid.',
      inLineOutcome: 'Steady baseline consumer growth; range trading.'
    }
  });

  // Step 2: Retail Control Group (GDP Direct Input) - 3x Weight
  const controlStrong = isEvaluated && controlSurprise >= 0.15;
  const controlWeak = isEvaluated && controlSurprise <= -0.15;
  checklist.push({
    id: 'retail-control',
    label: 'Retail Control Group MoM (GDP Proxy)',
    description: 'Excludes autos, gas, building materials, and food services; flows directly into quarterly GDP Personal Consumption',
    status: isUpcoming ? 'PENDING' : controlStrong ? 'PASS' : controlWeak ? 'FAIL' : 'MIXED',
    skew: isUpcoming ? 'NEUTRAL' : controlStrong ? 'HAWKISH' : controlWeak ? 'DOVISH' : 'NEUTRAL',
    actualValue: isEvaluated && control !== undefined ? `+${control}% MoM` : 'Awaiting Release',
    expectedValue: `+${controlExp}% MoM`,
    deltaStr: isEvaluated ? `${controlSurprise > 0 ? '+' : ''}${controlSurprise}% GDP component` : `Consensus: +${controlExp}%`,
    weight: 3,
    reasoning: isUpcoming
      ? `Retail Control Group is the most critical econometric input, directly feeding into US GDP Personal Consumption tracking.`
      : controlStrong
      ? `Control group beat consensus at +${control}% MoM. Directly elevates Atlanta Fed GDPNow tracking estimate.`
      : controlWeak
      ? `Control group slowed to ${control}% MoM. Signals genuine underlying slowdown in real consumer volume.`
      : `Control group spending came in near baseline.`,
    scenarioThresholds: {
      hawkishThreshold: '≥ +0.45% MoM (GDP Boost)',
      dovishThreshold: '≤ +0.05% MoM (GDP Drag)',
      inLineRange: '+0.20% to +0.35% MoM',
      hawkishOutcome: 'Atlanta Fed GDPNow forecast jumps; USD/JPY and yields advance.',
      dovishOutcome: 'GDP growth concerns mount; fast rate cuts priced in.',
      inLineOutcome: 'Consistent with target 2% trend GDP growth.'
    }
  });

  // Step 3: Core Ex-Autos & Gas
  checklist.push({
    id: 'retail-core',
    label: 'Core Retail Sales (Ex-Autos & Gas)',
    description: 'Strips out volatile vehicle financing and pump price fluctuations',
    status: isUpcoming ? 'PENDING' : (core !== undefined && core >= coreExp) ? 'PASS' : 'FAIL',
    skew: isUpcoming ? 'NEUTRAL' : (core !== undefined && core >= coreExp) ? 'HAWKISH' : 'DOVISH',
    actualValue: isEvaluated && core !== undefined ? `+${core}% MoM` : 'Awaiting Release',
    expectedValue: `+${coreExp}% MoM`,
    deltaStr: isUpcoming ? `Consensus: +${coreExp}%` : `${core !== undefined ? (core - coreExp).toFixed(2) : 0}% MoM`,
    weight: 2,
    reasoning: isUpcoming
      ? 'Underlying discretionary retail demand excluding gas price distortion.'
      : (core !== undefined && core >= coreExp)
      ? 'Discretionary goods demand ex-energy remains resilient.'
      : 'Consumers pulling back on non-essential goods.',
  });

  let verdict: EngineEvaluationResult['verdict'] = 'MIXED_NO_ACTION';
  let verdictLabel = 'PRE-RELEASE EXPECTATION MATRIX ACTIVE';
  let confidenceScore = 85;
  let summaryThesis = '';

  if (isUpcoming) {
    verdict = 'NEUTRAL_SKEW';
    verdictLabel = 'PRE-RELEASE EXPECTATION MATRIX ACTIVE';
    confidenceScore = 85;
    summaryThesis = `Upcoming US Retail Sales: Consensus expects headline retail sales at +${headlineExp}% MoM and Control Group at +${controlExp}% MoM. Pre-release matrix calibrated.`;
  } else if (headlineStrong && controlStrong) {
    verdict = 'GOLDILOCKS_CONTINUATION';
    verdictLabel = 'ROBUST CONSUMER RESILIENCE';
    confidenceScore = 88;
    summaryThesis = `Consumer spending outperformed expectations across headline (+${headline}%) and Control Group (+${control}%). GDP growth estimates revised higher; supports corporate revenues and soft-landing thesis.`;
  } else if (headlineWeak && controlWeak) {
    verdict = 'GROWTH_SHOCK';
    verdictLabel = 'CONSUMER DEMAND EXHAUSTION';
    confidenceScore = 86;
    summaryThesis = `Broad deceleration in household spending with control group missing consensus. Increases odds of faster central bank rate cuts to stimulate consumption.`;
  } else {
    verdict = 'MIXED_NO_ACTION';
    verdictLabel = 'BALANCED CONSUMER SPENDING';
    confidenceScore = 65;
    summaryThesis = `Consumer spending components balanced. Market reaction muted; awaiting subsequent inflation verification.`;
  }

  const isStrong = verdict === 'GOLDILOCKS_CONTINUATION';
  const isWeak = verdict === 'GROWTH_SHOCK';

  const assetImpacts: AssetImpact[] = [
    {
      symbol: 'DXY',
      name: 'US Dollar Index',
      category: 'FX',
      bias: isStrong ? 'BUY' : isWeak ? 'SELL' : 'WATCH',
      action: isStrong ? 'LONG' : isWeak ? 'SHORT' : 'STAND ASIDE',
      confidence: confidenceScore,
      magnitude: 'MEDIUM',
      expectedMove: isStrong ? '+0.4% (+40 pts)' : isWeak ? '-0.4% (-40 pts)' : '±15 pts',
      transmissionRationale: isStrong
        ? 'US consumer strength highlights American growth premium vs Europe and China; dollar gains on growth resilience.'
        : isWeak
        ? 'Growth slowdown prompts lower yield curve and dollar softening.'
        : 'Range-bound.',
      invalidationTrigger: 'Conflicting employment data later in week',
      correlationRank: 1,
      primaryDriver: 'US Domestic Growth Premium',
    },
    {
      symbol: 'SPX',
      name: 'S&P 500 Index',
      category: 'INDICES',
      bias: isStrong ? 'BUY' : isWeak ? 'SELL' : 'WATCH',
      action: isStrong ? 'LONG' : isWeak ? 'FADE SPIKES' : 'STAND ASIDE',
      confidence: confidenceScore - 3,
      magnitude: 'MEDIUM',
      expectedMove: isStrong ? '+0.8% to +1.2%' : isWeak ? '-0.9% to -1.4%' : '±0.3%',
      transmissionRationale: isStrong
        ? 'Consumer spending drives 68% of US GDP; resilient cash register turnover underpins consumer discretionary and retail stocks.'
        : isWeak
        ? 'Discretionary revenue downgrades hit retail, apparel, and travel sectors.'
        : 'Stock picker dispersion.',
      invalidationTrigger: 'Margin compression from persistent freight or tariff costs',
      correlationRank: 2,
      primaryDriver: 'Corporate Top-Line Revenue Health',
    },
    {
      symbol: 'US10Y',
      name: 'US 10-Year Treasury Yield',
      category: 'YIELDS',
      bias: isStrong ? 'BUY' : isWeak ? 'SELL' : 'WATCH',
      action: isStrong ? 'LONG' : isWeak ? 'SHORT' : 'STAND ASIDE',
      confidence: confidenceScore - 4,
      magnitude: 'MEDIUM',
      expectedMove: isStrong ? '+4 to +7 bps' : isWeak ? '-5 to -9 bps' : '±2 bps',
      transmissionRationale: isStrong
        ? 'Strong growth reduces immediate urgency for aggressive central bank easing; yields tick higher.'
        : isWeak
        ? 'Weak consumption reinforces bond rally as growth deceleration anchors lower terminal rates.'
        : 'Yield stability.',
      invalidationTrigger: 'Supply auction dynamics',
      correlationRank: 3,
      primaryDriver: 'GDP Growth Tracking & Real Rate Adjustments',
    },
    {
      symbol: 'XAU/USD',
      name: 'Spot Gold',
      category: 'COMMODITIES',
      bias: isStrong ? 'WATCH' : isWeak ? 'BUY' : 'WATCH',
      action: isWeak ? 'BUY PULLBACKS' : 'STAND ASIDE',
      confidence: 65,
      magnitude: 'LOW',
      expectedMove: isWeak ? '+$12 to +$20/oz' : '±$6/oz',
      transmissionRationale: isWeak
        ? 'Weak retail sales lower nominal yields and support gold safe-haven allocations.'
        : 'Higher yields temper immediate gold upside.',
      invalidationTrigger: 'US dollar sudden breakout',
      correlationRank: 4,
      primaryDriver: 'Nominal Yield Response',
    },
  ];

  return {
    eventId: event.id,
    eventTitle: event.title || 'US Retail Sales & Consumer Spending',
    eventCode: 'RETAIL_SALES',
    verdict,
    verdictLabel,
    confidenceScore,
    summaryThesis,
    checklist,
    assetImpacts,
    timestamp: Date.now(),
  };
}
