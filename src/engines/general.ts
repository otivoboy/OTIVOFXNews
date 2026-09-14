import { ChecklistStep, AssetImpact, EngineEvaluationResult, EconomicEvent } from '../types';

export function evaluateGeneralMacro(
  event: EconomicEvent,
  customMetrics?: Record<string, any>
): EngineEvaluationResult {
  const currency = event.currency || 'USD';
  const isUpcoming = event.status !== 'RELEASED' && event.actual === null && customMetrics?.actual === undefined;

  const actual = Number(customMetrics?.actual ?? event.actual ?? (event.forecast ?? 44.2));
  const forecast = Number(customMetrics?.forecast ?? event.forecast ?? 44.2);
  const previous = Number(customMetrics?.previous ?? event.previous ?? 43.2);
  const surprise = Number((actual - forecast).toFixed(2));

  const isEvaluated = !isUpcoming;
  const isHawkish = isEvaluated && surprise > 0.3;
  const isDovish = isEvaluated && surprise < -0.3;

  const checklist: ChecklistStep[] = [];

  // ==========================================
  // 1. EUROZONE / GERMAN FLASH PMI (EUR)
  // ==========================================
  if (currency === 'EUR' || event.title.toLowerCase().includes('pmi')) {
    checklist.push({
      id: 'eur-pmi-primary',
      label: `${event.title} Expectation & Growth/Contraction Threshold`,
      description: 'S&P Global / HCOB survey of purchasing managers across German industrial manufacturing',
      status: isUpcoming ? 'PENDING' : actual >= 50.0 ? 'PASS' : actual > forecast ? 'MIXED' : 'FAIL',
      skew: isUpcoming ? 'NEUTRAL' : actual >= 50.0 ? 'HAWKISH' : isHawkish ? 'HAWKISH' : isDovish ? 'DOVISH' : 'NEUTRAL',
      actualValue: isEvaluated ? `${actual}` : 'Awaiting 10:30am Release',
      expectedValue: `${forecast} (Prev: ${previous}) | 50.0 Threshold`,
      deltaStr: isEvaluated ? `${surprise > 0 ? '+' : ''}${surprise} vs exp` : `Consensus: ${forecast}`,
      weight: 3,
      reasoning: isUpcoming
        ? `Consensus forecasts German Flash Manufacturing PMI at ${forecast} (improving from ${previous}). The 50.0 mark separates economic expansion from contraction. Print > 46.0 fuels Euro recovery; print < 43.0 deepens ECB rate cut expectations.`
        : isHawkish
        ? `German PMI beat at ${actual} (+${surprise} surprise). Manufacturing stabilization cushions Eurozone growth outlook; EUR rallies.`
        : isDovish
        ? `German PMI missed at ${actual} (${surprise} miss). Contraction deepens in Europe's industrial engine; EUR sold off.`
        : `German PMI printed in-line at ${actual}.`,
      scenarioThresholds: {
        hawkishThreshold: '> 45.5 (Sharp industrial rebound)',
        dovishThreshold: '< 42.5 (Severe manufacturing slump)',
        inLineRange: '43.5 - 44.8',
        hawkishOutcome: 'ECB aggressive easing bets trimmed; EUR/USD surges 50-85 pips toward resistance.',
        dovishOutcome: 'ECB rate cuts accelerated; EUR/USD drops 55-90 pips toward 1.0820 support.',
        inLineOutcome: 'Continued gradual European recovery; EUR/USD rangebound.'
      },
      historicalVolatility: '±45 pips on EUR/USD',
      componentWeighting: 'Eurozone Growth Barometer',
      keyDrivers: ['New export orders from China and US', 'Energy input cost stabilization', 'Manufacturing employment contraction pace'],
      institutionalFocus: 'European Central Bank (ECB) Governing Council monitors flash PMI as early quarterly GDP proxy.',
      preReleaseGuidance: 'Watch French PMI release at 09:15 CET as leading precursor to German PMI at 09:30 CET.'
    });

    const assetImpacts: AssetImpact[] = [
      {
        symbol: 'EUR/USD',
        name: 'Euro / US Dollar',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'STRONG_SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 88,
        magnitude: 'HIGH',
        expectedMove: isHawkish ? '+55 to +85 pips' : isDovish ? '-50 to -80 pips' : '±16 pips',
        transmissionRationale: 'Primary currency conduit for Eurozone economic health relative to US macro vitality.',
        invalidationTrigger: 'Simultaneous US Dollar sudden move',
        correlationRank: 1,
        primaryDriver: 'Eurozone Growth Momentum vs ECB Policy',
        currentPosture: 'Consolidating near 1.0920; awaiting 10:30am Flash PMI catalyst.',
        upsideScenario: {
          trigger: 'German PMI ≥ 45.5 (Rebound)',
          action: 'LONG',
          targetPrice: '1.0990 (+70 pips)',
          stopLoss: '1.0895 (-25 pips)',
          expectedMove: '+55 to +85 pips',
          rationale: 'German manufacturing inflection reduces European recession risk; strong EUR demand.'
        },
        downsideScenario: {
          trigger: 'German PMI ≤ 42.5 (Contraction Deepens)',
          action: 'SHORT',
          targetPrice: '1.0845 (-75 pips)',
          stopLoss: '1.0945 (+25 pips)',
          expectedMove: '-50 to -80 pips',
          rationale: 'Stagflationary deindustrialization fears spur capital exit into USD and CHF.'
        },
        volatilityWindow: '00:00 - 15:00 min',
        transmissionSpeed: 'INSTANT (0-30s)'
      },
      {
        symbol: 'EUR/GBP',
        name: 'Euro / British Pound',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'STRONG_SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 84,
        magnitude: 'MEDIUM',
        expectedMove: isHawkish ? '+35 to +55 pips' : isDovish ? '-35 to -60 pips' : '±10 pips',
        transmissionRationale: 'Clean European regional growth differential without dollar distortion.',
        invalidationTrigger: 'UK PMI concurrent data',
        correlationRank: 2,
        primaryDriver: 'Eurozone vs UK Economic Divergence',
        transmissionSpeed: 'INSTANT (0-30s)'
      },
      {
        symbol: 'DE10Y',
        name: 'German 10-Year Bund Yield',
        category: 'YIELDS',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 86,
        magnitude: 'MEDIUM',
        expectedMove: isHawkish ? '+5 to +9 bps' : isDovish ? '-5 to -9 bps' : '±1.5 bps',
        transmissionRationale: 'Benchmark Eurozone sovereign debt repricing.',
        invalidationTrigger: 'ECB emergency policy commentary',
        correlationRank: 3,
        primaryDriver: 'Bund Curve Repricing',
        transmissionSpeed: 'INSTANT (0-30s)'
      },
      {
        symbol: 'XAU/USD',
        name: 'Spot Gold',
        category: 'COMMODITIES',
        bias: 'WATCH',
        action: 'STAND ASIDE',
        confidence: 65,
        magnitude: 'LOW',
        expectedMove: '±$5/oz',
        transmissionRationale: 'Dollar index moves resulting from EUR/USD transmission subtly influence bullion.',
        invalidationTrigger: 'US yield moves',
        correlationRank: 4,
        primaryDriver: 'EUR/USD Dollar Mirror',
        transmissionSpeed: 'DRIFT (1-4h)'
      }
    ];

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventCode: 'PMI',
      verdict: isUpcoming ? 'MIXED_NO_ACTION' : isHawkish ? 'GOLDILOCKS_CONTINUATION' : isDovish ? 'GROWTH_SHOCK' : 'MIXED_NO_ACTION',
      verdictLabel: isUpcoming ? 'EUR PMI PRE-RELEASE MATRIX' : isHawkish ? 'EUROZONE INDUSTRIAL REBOUND' : isDovish ? 'EUROZONE MANUFACTURING SLUMP' : 'IN-LINE CONSENSUS',
      confidenceScore: isUpcoming ? 86 : 88,
      summaryThesis: isUpcoming
        ? `German Flash Manufacturing PMI scheduled for 10:30am. Consensus forecasts ${forecast} (prior ${previous}). 50.0 is the expansion watershed. Cross-asset matrix is live with real-time actionable execution scenarios.`
        : isHawkish
        ? `German PMI beat at ${actual}. Supports Euro recovery across major crosses.`
        : `German PMI missed at ${actual}. Accelerates ECB rate cut pricing.`,
      checklist,
      assetImpacts,
      timestamp: Date.now(),
    };
  }

  // ==========================================
  // 2. CANADIAN GDP (CAD)
  // ==========================================
  if (currency === 'CAD') {
    checklist.push({
      id: 'cad-gdp-primary',
      label: `${event.title} Expectation & Growth Momentum`,
      description: 'Statistics Canada monthly gross domestic product tracking national economic output',
      status: isUpcoming ? 'PENDING' : isHawkish ? 'PASS' : isDovish ? 'FAIL' : 'MIXED',
      skew: isUpcoming ? 'NEUTRAL' : isHawkish ? 'HAWKISH' : isDovish ? 'DOVISH' : 'NEUTRAL',
      actualValue: isEvaluated ? `${actual > 0 ? '+' : ''}${actual}%` : 'Awaiting 3:30pm Release',
      expectedValue: `${forecast > 0 ? '+' : ''}${forecast}% (Prev: ${previous > 0 ? '+' : ''}${previous}%)`,
      deltaStr: isEvaluated ? `${surprise > 0 ? '+' : ''}${surprise}%` : `Consensus: ${forecast}%`,
      weight: 3,
      reasoning: isUpcoming
        ? `Consensus forecasts Canadian GDP at ${forecast}% (prior ${previous}%). Growth below 0.0% will confirm Canadian recessionary stagnation and push BoC to aggressive easing.`
        : isHawkish
        ? `Canadian GDP beat expectations at ${actual}%. Supports Canadian economic resilience; CAD rallies.`
        : `Canadian GDP missed at ${actual}%. Accelerates Bank of Canada rate reductions; USD/CAD surges higher.`,
      scenarioThresholds: {
        hawkishThreshold: '> +0.3% MoM (Strong economic acceleration)',
        dovishThreshold: '< 0.0% MoM (Economic contraction)',
        inLineRange: '+0.1% to +0.2% MoM',
        hawkishOutcome: 'Bank of Canada rate cut pause speculation; USD/CAD drops 50-80 pips.',
        dovishOutcome: 'BoC jumbo 50bps rate cut unlocked; USD/CAD breaks out 60-95 pips higher.',
        inLineOutcome: 'BoC maintains steady easing path; USD/CAD rangebound.'
      },
      historicalVolatility: '±42 pips on USD/CAD',
      componentWeighting: 'Bank of Canada Output Gap Assessment',
      keyDrivers: ['Oil and gas extraction output', 'Real estate and rental leasing transactions', 'Manufacturing and wholesale trade activity'],
      institutionalFocus: 'Tiff Macklem and BoC assess whether the output gap is widening.'
    });

    const assetImpacts: AssetImpact[] = [
      {
        symbol: 'USD/CAD',
        name: 'US Dollar / Canadian Dollar',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_SELL' : isDovish ? 'STRONG_BUY' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'SHORT' : isDovish ? 'LONG' : 'STAND ASIDE',
        confidence: 88,
        magnitude: 'HIGH',
        expectedMove: isHawkish ? '-55 to -85 pips' : isDovish ? '+60 to +95 pips' : '±18 pips',
        transmissionRationale: 'Direct sovereign output gap reflection in CAD valuation and BoC rate discounting.',
        invalidationTrigger: 'Oil price sudden $2 move',
        correlationRank: 1,
        primaryDriver: 'BoC Economic Growth Assessment',
        currentPosture: 'Consolidating near 1.3810; ready for release volatility.',
        upsideScenario: {
          trigger: 'CAD GDP ≥ +0.3% MoM',
          action: 'SHORT',
          targetPrice: '1.3745 (-65 pips)',
          stopLoss: '1.3835 (+25 pips)',
          expectedMove: '-55 to -85 pips',
          rationale: 'Growth resilience reduces need for aggressive BoC cuts.'
        },
        downsideScenario: {
          trigger: 'CAD GDP ≤ 0.0% MoM (Contraction)',
          action: 'LONG',
          targetPrice: '1.3885 (+75 pips)',
          stopLoss: '1.3785 (-25 pips)',
          expectedMove: '+60 to +95 pips',
          rationale: 'Recession risk forces BoC to cut rates rapidly.'
        },
        volatilityWindow: '00:00 - 15:00 min',
        transmissionSpeed: 'INSTANT (0-30s)'
      },
      {
        symbol: 'CL',
        name: 'WTI Crude Oil',
        category: 'COMMODITIES',
        bias: 'WATCH',
        action: 'STAND ASIDE',
        confidence: 65,
        magnitude: 'LOW',
        expectedMove: '±$0.50/bbl',
        transmissionRationale: 'Canadian energy production volume indicator.',
        invalidationTrigger: 'OPEC headlines',
        correlationRank: 2,
        primaryDriver: 'Energy Output Linkage',
        transmissionSpeed: 'DRIFT (1-4h)'
      }
    ];

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventCode: 'GDP',
      verdict: isUpcoming ? 'MIXED_NO_ACTION' : isHawkish ? 'GOLDILOCKS_CONTINUATION' : isDovish ? 'GROWTH_SHOCK' : 'MIXED_NO_ACTION',
      verdictLabel: isUpcoming ? 'CAD GDP PRE-RELEASE MATRIX' : isHawkish ? 'CANADIAN GROWTH ACCELERATION' : isDovish ? 'CANADIAN GROWTH CONTRACTION' : 'IN-LINE CONSENSUS',
      confidenceScore: isUpcoming ? 85 : 88,
      summaryThesis: isUpcoming
        ? `Canadian GDP scheduled for 3:30pm. Consensus is ${forecast}% (prior ${previous}%). Key threshold is 0.0% contraction line. Cross-asset matrix is armed with live execution scenarios.`
        : isHawkish
        ? `CAD GDP beat at ${actual}%. Supports CAD strength.`
        : `CAD GDP missed at ${actual}%. Accelerates Bank of Canada rate cuts.`,
      checklist,
      assetImpacts,
      timestamp: Date.now(),
    };
  }

  // ==========================================
  // 3. US PRELIM GDP & GENERAL MACRO (USD / DEFAULT)
  // ==========================================
  checklist.push({
    id: 'gen-macro-primary',
    label: `${event.title} Expectation & Trend`,
    description: 'National economic output and macroeconomic trajectory vs consensus',
    status: isUpcoming ? 'PENDING' : isHawkish ? 'PASS' : isDovish ? 'FAIL' : 'MIXED',
    skew: isUpcoming ? 'NEUTRAL' : isHawkish ? 'HAWKISH' : isDovish ? 'DOVISH' : 'NEUTRAL',
    actualValue: isEvaluated ? `${actual > 0 ? '+' : ''}${actual}%` : 'Awaiting Release',
    expectedValue: `${forecast > 0 ? '+' : ''}${forecast}% (Prev: ${previous > 0 ? '+' : ''}${previous}%)`,
    deltaStr: isEvaluated ? `${surprise > 0 ? '+' : ''}${surprise}%` : `Consensus: ${forecast}%`,
    weight: 3,
    reasoning: isUpcoming
      ? `Consensus forecasts ${event.title} at ${forecast}%. Strong output (> 3.2%) supports soft-landing thesis; print < 2.2% revives slowdown concerns.`
      : isHawkish
      ? `Economic print beat at ${actual}%. Strong growth supports equity earnings and yields.`
      : `Economic print missed at ${actual}%. Pushes central bank toward easing.`,
    scenarioThresholds: {
      hawkishThreshold: `> ${(forecast + 0.3).toFixed(1)}% (Robust expansion)`,
      dovishThreshold: `< ${(forecast - 0.3).toFixed(1)}% (Economic deceleration)`,
      inLineRange: `${(forecast - 0.2).toFixed(1)}% to ${(forecast + 0.2).toFixed(1)}%`,
      hawkishOutcome: 'Yields rise; USD supported; growth equities rally on strong demand.',
      dovishOutcome: 'Yields drop; rate cuts priced in; Gold and defensive assets benefit.',
      inLineOutcome: 'Orderly market absorption without trend disruption.'
    },
    historicalVolatility: '±50 pts on DXY | ±$18/oz on Gold',
    componentWeighting: 'Broad Economic Health Anchor',
    keyDrivers: ['Consumer personal consumption expenditures (PCE)', 'Nonresidential fixed business investment', 'Government spending and export contribution']
  });

  const assetImpacts: AssetImpact[] = [
    {
      symbol: 'DXY',
      name: 'US Dollar Index',
      category: 'FX',
      bias: isUpcoming ? 'WATCH' : isHawkish ? 'BUY' : isDovish ? 'SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
      confidence: 84,
      magnitude: 'MEDIUM',
      expectedMove: isHawkish ? '+50 to +80 pts' : isDovish ? '-50 to -80 pts' : '±15 pts',
      transmissionRationale: 'Macro growth differential transmission.',
      invalidationTrigger: 'Fed commentary',
      correlationRank: 1,
      primaryDriver: 'Economic Growth Trajectory',
      currentPosture: 'Consolidating in 103.80 corridor awaiting catalyst.',
      transmissionSpeed: 'INSTANT (0-30s)'
    },
    {
      symbol: 'SPX',
      name: 'S&P 500 Index',
      category: 'INDICES',
      bias: isUpcoming ? 'WATCH' : isHawkish ? 'BUY' : isDovish ? 'WATCH' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'BUY PULLBACKS' : 'STAND ASIDE',
      confidence: 82,
      magnitude: 'MEDIUM',
      expectedMove: isHawkish ? '+0.8% to +1.4%' : isDovish ? '-0.6% to -1.2%' : '±0.2%',
      transmissionRationale: 'Healthy GDP supports top-line corporate revenue growth.',
      invalidationTrigger: 'Earnings guidance',
      correlationRank: 2,
      primaryDriver: 'Corporate Earnings Health',
      transmissionSpeed: 'INTERMEDIATE (1-15m)'
    },
    {
      symbol: 'XAU/USD',
      name: 'Spot Gold',
      category: 'COMMODITIES',
      bias: isUpcoming ? 'WATCH' : isDovish ? 'BUY' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isDovish ? 'BUY PULLBACKS' : 'STAND ASIDE',
      confidence: 70,
      magnitude: 'LOW',
      expectedMove: isDovish ? '+$12 to +$20/oz' : '±$5/oz',
      transmissionRationale: 'Lower yields and rate cut anticipation provide supportive floor for bullion.',
      invalidationTrigger: 'Dollar surge',
      correlationRank: 3,
      primaryDriver: 'Rate Cut Path Anticipation',
      transmissionSpeed: 'DRIFT (1-4h)'
    }
  ];

  return {
    eventId: event.id,
    eventTitle: event.title,
    eventCode: event.code,
    verdict: isUpcoming ? 'MIXED_NO_ACTION' : isHawkish ? 'GOLDILOCKS_CONTINUATION' : isDovish ? 'GROWTH_SHOCK' : 'MIXED_NO_ACTION',
    verdictLabel: isUpcoming ? 'PRE-RELEASE MACRO MATRIX ACTIVE' : isHawkish ? 'POSITIVE MACRO BEAT' : isDovish ? 'MACRO GROWTH MISS' : 'IN-LINE CONSENSUS',
    confidenceScore: isUpcoming ? 85 : 88,
    summaryThesis: isUpcoming
      ? `Upcoming release scheduled. Consensus forecast is ${forecast} (prior ${previous}). Cross-asset transmission matrix is active with live scenarios.`
      : isHawkish
      ? `${event.title} beat expectations at ${actual}. Supports growth-sensitive assets.`
      : `${event.title} missed at ${actual}. Prompts central bank easing pricing.`,
    checklist,
    assetImpacts,
    timestamp: Date.now(),
  };
}
