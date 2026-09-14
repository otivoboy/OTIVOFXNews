import { ChecklistStep, AssetImpact, EngineEvaluationResult, EconomicEvent } from '../types';

export interface NfpMetrics {
  headlineActual?: number;
  headlineForecast?: number;
  unemploymentActual?: number;
  unemploymentForecast?: number;
  avgHourlyEarningsMoMActual?: number;
  avgHourlyEarningsMoMForecast?: number;
  priorRevisionsNet?: number;
  laborForceParticipation?: number;
  actual?: number;
  forecast?: number;
  previous?: number;
}

export function evaluateNFP(
  event: EconomicEvent,
  customMetrics?: Partial<NfpMetrics>
): EngineEvaluationResult {
  const currency = event.currency || 'USD';
  const isUpcoming = event.status !== 'RELEASED' && event.actual === null && customMetrics?.actual === undefined && customMetrics?.headlineActual === undefined;

  const forecast = customMetrics?.headlineForecast ?? customMetrics?.forecast ?? event.forecast ?? 11.2;
  const previous = customMetrics?.previous ?? event.previous ?? 6.7;
  const headline = customMetrics?.headlineActual ?? customMetrics?.actual ?? event.actual;

  const isEvaluated = headline !== null && headline !== undefined;
  const surprise = isEvaluated ? Number((headline - forecast).toFixed(1)) : 0;

  const checklist: ChecklistStep[] = [];

  // ==========================================
  // 1. UK CLAIMANT COUNT CHANGE (GBP)
  // ==========================================
  if (currency === 'GBP') {
    const isHawkish = isEvaluated && surprise < -3.0; // Fewer claimants is hawkish/strong
    const isDovish = isEvaluated && surprise > 3.0;   // More claimants is dovish/weak

    checklist.push({
      id: 'gbp-claimant-primary',
      label: 'UK Claimant Count Change & Benefit Claims Velocity',
      description: 'Office for National Statistics monthly change in individuals claiming jobseeker benefits',
      status: isUpcoming ? 'PENDING' : isHawkish ? 'PASS' : isDovish ? 'FAIL' : 'MIXED',
      skew: isUpcoming ? 'NEUTRAL' : isHawkish ? 'HAWKISH' : isDovish ? 'DOVISH' : 'NEUTRAL',
      actualValue: isEvaluated ? `${headline > 0 ? '+' : ''}${headline}K` : 'Awaiting 9:00am Release',
      expectedValue: `+${forecast}K (Prev: +${previous}K)`,
      deltaStr: isEvaluated ? `${surprise > 0 ? '+' : ''}${surprise}K vs exp` : `Consensus: +${forecast}K`,
      weight: 3,
      reasoning: isUpcoming
        ? `Consensus forecasts UK Claimant Count rising by +${forecast}K (up from +${previous}K). A sharp rise (> +20K) indicates rapid UK labor cooling, pushing BoE toward rate cuts.`
        : isDovish
        ? `Claimant count surged to +${headline}K (+${surprise}K higher). UK labor slack expanding rapidly; puts downward pressure on Sterling.`
        : isHawkish
        ? `Claimant count dropped to +${headline}K (${Math.abs(surprise)}K below exp). Tight UK labor market supports Sterling.`
        : `Claimant count printed near consensus at +${headline}K.`,
      scenarioThresholds: {
        hawkishThreshold: '< +5.0K (Tight labor / lower claims)',
        dovishThreshold: '> +20.0K (Rapidly rising unemployment)',
        inLineRange: '+8.0K to +15.0K',
        hawkishOutcome: 'Wage pressures stay sticky; BoE delays rate cuts; GBP rallies 45-75 pips.',
        dovishOutcome: 'Labor deterioration prompts faster BoE rate cuts; GBP/USD drops 50-80 pips.',
        inLineOutcome: 'Orderly labor rebalancing; neutral GBP rangebound trading.'
      },
      historicalVolatility: '±38 pips on GBP/USD',
      componentWeighting: 'UK Labor Market Anchor',
      keyDrivers: ['Universal Credit jobseeker claims', 'Vacancies-to-unemployed ratio', 'Private sector wage growth momentum'],
      institutionalFocus: 'Bank of England MPC monitors claimant trend alongside services inflation.',
      preReleaseGuidance: 'Sterling liquidity concentrates in GBP/USD and EUR/GBP around the 9:00am release.'
    });

    checklist.push({
      id: 'gbp-wage-dynamics',
      label: 'UK Average Weekly Regular Earnings (Wage-Push Channel)',
      description: '3-month average weekly earnings excluding bonuses (BoE primary inflation gauge)',
      status: 'MIXED',
      skew: 'NEUTRAL',
      actualValue: 'Expected ~5.4% 3m/YoY',
      expectedValue: 'Target < 4.0%',
      deltaStr: 'Elevated Wage Baseline',
      weight: 2,
      reasoning: 'Persistent 5%+ UK wage growth remains the primary reason the BoE is cautious on rate cuts.',
      scenarioThresholds: {
        hawkishThreshold: 'Wage Growth > 5.7%',
        dovishThreshold: 'Wage Growth < 5.0%',
        inLineRange: '5.2% - 5.5%',
        hawkishOutcome: 'Services inflation reignited; Sterling surges.',
        dovishOutcome: 'Wage disinflation confirmed; BoE rate cuts unlocked.'
      }
    });

    const assetImpacts: AssetImpact[] = [
      {
        symbol: 'GBP/USD',
        name: 'British Pound / US Dollar',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'STRONG_SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 86,
        magnitude: 'HIGH',
        expectedMove: isHawkish ? '+55 to +90 pips' : isDovish ? '-50 to -85 pips' : '±18 pips',
        transmissionRationale: 'Direct labor market health transmission to Bank of England policy trajectory.',
        invalidationTrigger: 'UK fiscal headlines or simultaneous dollar movement',
        correlationRank: 1,
        primaryDriver: 'BoE Policy Expectations',
        currentPosture: 'Consolidating near 1.3025; watch for post-release direction.',
        upsideScenario: {
          trigger: 'Claimant Count < +5.0K (Labor Tightness)',
          action: 'LONG',
          targetPrice: '1.3090 (+65 pips)',
          stopLoss: '1.2995 (-30 pips)',
          expectedMove: '+55 to +90 pips',
          rationale: 'Fewer benefit claims signal continued wage resilience and higher-for-longer BoE rates.'
        },
        downsideScenario: {
          trigger: 'Claimant Count > +25.0K (Labor Shock)',
          action: 'SHORT',
          targetPrice: '1.2950 (-75 pips)',
          stopLoss: '1.3055 (+30 pips)',
          expectedMove: '-50 to -85 pips',
          rationale: 'Surging unemployment claims accelerate BoE rate cut bets; GBP sold off.'
        },
        volatilityWindow: '00:00 - 15:00 min',
        transmissionSpeed: 'INSTANT (0-30s)'
      },
      {
        symbol: 'EUR/GBP',
        name: 'Euro / British Pound',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_SELL' : isDovish ? 'STRONG_BUY' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'SHORT' : isDovish ? 'LONG' : 'STAND ASIDE',
        confidence: 84,
        magnitude: 'MEDIUM',
        expectedMove: isHawkish ? '-35 to -55 pips' : isDovish ? '+40 to +65 pips' : '±10 pips',
        transmissionRationale: 'Inverse Quote Cross: When Sterling strengthens, EUR/GBP experiences rapid selling as the denominator gains value.',
        invalidationTrigger: 'ECB unexpected rate announcements',
        correlationRank: 2,
        primaryDriver: 'UK vs Eurozone Employment Health',
        transmissionSpeed: 'INSTANT (0-30s)',
        upsideScenario: {
          trigger: 'Claimant Count < +5.0K (Labor Tightness)',
          action: 'SHORT',
          targetPrice: '0.8490 (-45 pips)',
          stopLoss: '0.8560 (+25 pips)',
          expectedMove: '-35 to -55 pips',
          rationale: 'Strong Sterling demand causes EUR/GBP to drop sharply.'
        },
        downsideScenario: {
          trigger: 'Claimant Count > +25.0K (Labor Shock)',
          action: 'LONG',
          targetPrice: '0.8585 (+50 pips)',
          stopLoss: '0.8510 (-25 pips)',
          expectedMove: '+40 to +65 pips',
          rationale: 'Sterling liquidation drives EUR/GBP higher.'
        }
      },
      {
        symbol: 'GBP/JPY',
        name: 'British Pound / Japanese Yen',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'STRONG_SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 85,
        magnitude: 'HIGH',
        expectedMove: isHawkish ? '+70 to +120 pips' : isDovish ? '-65 to -115 pips' : '±25 pips',
        transmissionRationale: 'High-beta Sterling carry proxy amplifying rate differential shifts.',
        invalidationTrigger: 'BOJ intervention commentary',
        correlationRank: 3,
        primaryDriver: 'BoE vs BoJ Policy Divergence',
        transmissionSpeed: 'INSTANT (0-30s)',
        upsideScenario: {
          trigger: 'Claimant Count < +5.0K',
          action: 'LONG',
          targetPrice: '194.50 (+95 pips)',
          stopLoss: '193.10 (-45 pips)',
          expectedMove: '+70 to +120 pips',
          rationale: 'Yield differential expansion drives heavy GBP/JPY bidding.'
        },
        downsideScenario: {
          trigger: 'Claimant Count > +25.0K',
          action: 'SHORT',
          targetPrice: '192.30 (-110 pips)',
          stopLoss: '193.90 (+45 pips)',
          expectedMove: '-65 to -115 pips',
          rationale: 'BoE easing pricing sparks Yen carry liquidation.'
        }
      },
      {
        symbol: 'UK10Y',
        name: 'UK 10-Year Gilt Yield',
        category: 'YIELDS',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 88,
        magnitude: 'MEDIUM',
        expectedMove: isHawkish ? '+5 to +9 bps' : isDovish ? '-5 to -9 bps' : '±1.5 bps',
        transmissionRationale: 'Gilt yield adjustments following central bank discounting.',
        invalidationTrigger: 'UK sovereign debt auctions',
        correlationRank: 4,
        primaryDriver: 'Terminal Rate Repricing',
        transmissionSpeed: 'INSTANT (0-30s)'
      }
    ];

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventCode: 'NFP',
      verdict: isUpcoming ? 'MIXED_NO_ACTION' : isHawkish ? 'HAWKISH_SURPRISE' : isDovish ? 'GROWTH_SHOCK' : 'GOLDILOCKS_CONTINUATION',
      verdictLabel: isUpcoming ? 'UK LABOR PRE-RELEASE EXPECTATION MATRIX' : isHawkish ? 'UK LABOR TIGHTNESS (GBP STRENGTH)' : isDovish ? 'UK UNEMPLOYMENT JUMP (BOE CUTS)' : 'IN-LINE CONSENSUS',
      confidenceScore: isUpcoming ? 85 : 88,
      summaryThesis: isUpcoming
        ? `UK Claimant Count scheduled for 9:00am. Forecast: +${forecast}K (prior +${previous}K). Key threshold is +20K for dovish BoE cut acceleration.`
        : isHawkish
        ? `UK Claimant Count beat expectations at +${headline}K. Labor remains resilient.`
        : `UK Claimant Count missed at +${headline}K. Confirms rising unemployment; BoE easing cycle accelerated.`,
      checklist,
      assetImpacts,
      timestamp: Date.now(),
    };
  }

  // ==========================================
  // 2. AUSTRALIA EMPLOYMENT REPORT (AUD)
  // ==========================================
  if (currency === 'AUD') {
    const isHawkish = isEvaluated && surprise > 15.0; // Strong job creation is hawkish for RBA
    const isDovish = isEvaluated && surprise < -15.0;  // Weak jobs is dovish for RBA

    checklist.push({
      id: 'aud-employment-primary',
      label: `${event.title} Expected Target & RBA Cash Rate Band`,
      description: 'Australian Bureau of Statistics labor force survey measuring net monthly employment creation',
      status: isUpcoming ? 'PENDING' : isHawkish ? 'PASS' : isDovish ? 'FAIL' : 'MIXED',
      skew: isUpcoming ? 'NEUTRAL' : isHawkish ? 'HAWKISH' : isDovish ? 'DOVISH' : 'NEUTRAL',
      actualValue: isEvaluated ? `${headline > 0 ? '+' : ''}${headline}K` : 'Awaiting 4:30am Release',
      expectedValue: `+${forecast}K (Prev: +${previous}K)`,
      deltaStr: isEvaluated ? `${surprise > 0 ? '+' : ''}${surprise}K` : `Consensus: +${forecast}K`,
      weight: 3,
      reasoning: isUpcoming
        ? `Consensus forecasts ${event.title} at +${forecast}K with Unemployment at 4.4%. A strong beat (> +30K) will force Reserve Bank of Australia (RBA) to consider further tightening or extended pause.`
        : isHawkish
        ? `Australian employment surged by +${headline}K (+${surprise}K beat). Strong Aussie labor supports RBA hawkish stance.`
        : isDovish
        ? `Australian employment disappointed at +${headline}K (${Math.abs(surprise)}K miss). Clears path for RBA cash rate cuts.`
        : `Australian employment printed near consensus at +${headline}K.`,
      scenarioThresholds: {
        hawkishThreshold: '> +30.0K Jobs / Unemployment ≤ 4.2%',
        dovishThreshold: '< 0.0K (Job Losses) / Unemployment ≥ 4.6%',
        inLineRange: '+10.0K to +20.0K / Unemployment 4.3% - 4.4%',
        hawkishOutcome: 'RBA hawkish hold cemented; AUD/USD surges 60-95 pips.',
        dovishOutcome: 'RBA forced into easing cycle; AUD sold off across majors.',
        inLineOutcome: 'RBA maintains restrictive stance; AUD consolidates in range.'
      },
      historicalVolatility: '±52 pips on AUD/USD',
      componentWeighting: 'Reserve Bank of Australia Top Policy Metric',
      keyDrivers: ['Full-time vs Part-time composition', 'Labor force participation rate (66.8% exp)', 'Hours worked sequential growth'],
      institutionalFocus: 'Michele Bullock and RBA board monitor employment resilience vs trimmed CPI.',
      preReleaseGuidance: 'High spread expansion on AUD pairs during the Asian session 04:29:50 - 04:30:30 AEST.'
    });

    const assetImpacts: AssetImpact[] = [
      {
        symbol: 'AUD/USD',
        name: 'Australian Dollar / US Dollar',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'STRONG_SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 88,
        magnitude: 'HIGH',
        expectedMove: isHawkish ? '+55 to +90 pips' : isDovish ? '-50 to -85 pips' : '±18 pips',
        transmissionRationale: 'Direct transmission to RBA cash rate expectations and global risk sentiment.',
        invalidationTrigger: 'China stimulus headlines or broad US dollar moves',
        correlationRank: 1,
        primaryDriver: 'RBA Policy Differential',
        currentPosture: 'Consolidating near 0.6650; coiled for breakout on 4:30am print.',
        upsideScenario: {
          trigger: 'Employment Change ≥ +30.0K',
          action: 'LONG',
          targetPrice: '0.6725 (+75 pips)',
          stopLoss: '0.6620 (-30 pips)',
          expectedMove: '+55 to +90 pips',
          rationale: 'Robust Australian hiring forces RBA to delay rate cuts; strong AUD capital inflows.'
        },
        downsideScenario: {
          trigger: 'Employment Change ≤ 0.0K (Contraction)',
          action: 'SHORT',
          targetPrice: '0.6580 (-70 pips)',
          stopLoss: '0.6675 (+25 pips)',
          expectedMove: '-50 to -85 pips',
          rationale: 'Labor shock triggers early RBA easing speculation; AUD sold off aggressively.'
        },
        volatilityWindow: '00:00 - 20:00 min',
        transmissionSpeed: 'INSTANT (0-30s)'
      },
      {
        symbol: 'AUD/JPY',
        name: 'Australian Dollar / Japanese Yen',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'STRONG_SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 85,
        magnitude: 'HIGH',
        expectedMove: isHawkish ? '+70 to +115 pips' : isDovish ? '-75 to -120 pips' : '±22 pips',
        transmissionRationale: 'Premier Asian session risk-on / risk-off carry gauge.',
        invalidationTrigger: 'BOJ surprise policy statements',
        correlationRank: 2,
        primaryDriver: 'AUD-JPY Rate Differential & Risk Appetite',
        transmissionSpeed: 'INSTANT (0-30s)'
      },
      {
        symbol: 'AU10Y',
        name: 'Australian 10-Year Sovereign Bond Yield',
        category: 'YIELDS',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 88,
        magnitude: 'MEDIUM',
        expectedMove: isHawkish ? '+6 to +11 bps' : isDovish ? '-6 to -11 bps' : '±2 bps',
        transmissionRationale: 'Australian sovereign yield curve repricing.',
        invalidationTrigger: 'RBA bond operations',
        correlationRank: 3,
        primaryDriver: 'RBA Cash Rate Pricing',
        transmissionSpeed: 'INSTANT (0-30s)'
      }
    ];

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventCode: 'NFP',
      verdict: isUpcoming ? 'MIXED_NO_ACTION' : isHawkish ? 'HAWKISH_SURPRISE' : isDovish ? 'GROWTH_SHOCK' : 'GOLDILOCKS_CONTINUATION',
      verdictLabel: isUpcoming ? 'AUD PRE-RELEASE LABOR MATRIX' : isHawkish ? 'AUD LABOR BOOM (RBA HAWKISH)' : isDovish ? 'AUD LABOR CONTRACTION (RBA EASING)' : 'IN-LINE CONSENSUS',
      confidenceScore: isUpcoming ? 86 : 89,
      summaryThesis: isUpcoming
        ? `Australian Employment report scheduled for 4:30am. Consensus expects +${forecast}K jobs with Unemployment at 4.4% (prior +${previous}K). RBA rate trajectory hinges on labor tightness.`
        : isHawkish
        ? `Australian jobs beat at +${headline}K. RBA higher-for-longer cemented; AUD bid.`
        : `Australian jobs disappointed at +${headline}K. RBA rate cut cycle pulled forward.`,
      checklist,
      assetImpacts,
      timestamp: Date.now(),
    };
  }

  // ==========================================
  // 3. US PRELIM BENCHMARK REVISION & NFP (USD)
  // ==========================================
  const isHawkish = isEvaluated && surprise > 35;
  const isDovish = isEvaluated && surprise < -35;

  checklist.push({
    id: 'usd-nfp-primary',
    label: `${event.title} Expected Benchmark & Revisions Band`,
    description: 'Bureau of Labor Statistics survey measuring structural job creation and cumulative annual survey revisions',
    status: isUpcoming ? 'PENDING' : isHawkish ? 'PASS' : isDovish ? 'FAIL' : 'MIXED',
    skew: isUpcoming ? 'NEUTRAL' : isHawkish ? 'HAWKISH' : isDovish ? 'DOVISH' : 'NEUTRAL',
    actualValue: isEvaluated ? `${headline > 0 ? '+' : ''}${headline}K` : 'Awaiting 5:00pm Release',
    expectedValue: `Prior Ref: ${previous}K`,
    deltaStr: isEvaluated ? `${surprise > 0 ? '+' : ''}${surprise}K` : 'Benchmark Baseline',
    weight: 3,
    reasoning: isUpcoming
      ? `Bureau of Labor Statistics preliminary benchmark revision. Prior historical benchmark was -911K downward revision. Revisions quantify structural labor softening.`
      : isDovish
      ? `Downside revisions confirmed labor weakness; supports accelerated Federal Reserve rate cuts.`
      : `Revisions showed resilient underlying hiring.`,
    scenarioThresholds: {
      hawkishThreshold: 'Revision > -400K (Milder slowdown)',
      dovishThreshold: 'Revision < -800K (Severe structural labor freeze)',
      inLineRange: '-500K to -700K',
      hawkishOutcome: 'US 10Y yield surges +10 bps; DXY jumps +60 pts; Gold pulls back -$25/oz.',
      dovishOutcome: 'Sahm Rule confirmed; Fed aggressive easing priced in; Gold rallies +$40/oz; USD drops.',
      inLineOutcome: 'Market had largely priced historical revisions; consolidation.'
    },
    historicalVolatility: '±$32/oz on Gold | ±70 pts on DXY',
    componentWeighting: 'Macro Structural Labor Revision',
    keyDrivers: ['Quarterly Census of Employment and Wages (QCEW)', 'Birth/Death model adjustments', 'Tech/Healthcare hiring realignments'],
    institutionalFocus: 'Federal Reserve staff incorporates QCEW benchmarks into economic forecasts.'
  });

  const assetImpacts: AssetImpact[] = [
    {
      symbol: 'DXY',
      name: 'US Dollar Index',
      category: 'FX',
      bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'STRONG_SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
      confidence: 90,
      magnitude: 'HIGH',
      expectedMove: isHawkish ? '+70 to +110 pts' : isDovish ? '-65 to -100 pts' : '±18 pts',
      transmissionRationale: 'Macro labor vitality feeds Federal Reserve dual-mandate policy weighting.',
      invalidationTrigger: 'Fed commentary pushback',
      correlationRank: 1,
      primaryDriver: 'Fed Dual Mandate Policy Pricing',
      currentPosture: 'Consolidating in 103.80 zone awaiting labor revision guidance.',
      transmissionSpeed: 'INSTANT (0-30s)'
    },
    {
      symbol: 'XAU/USD',
      name: 'Spot Gold',
      category: 'COMMODITIES',
      bias: isUpcoming ? 'WATCH' : isDovish ? 'STRONG_BUY' : isHawkish ? 'STRONG_SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isDovish ? 'LONG' : isHawkish ? 'SHORT' : 'STAND ASIDE',
      confidence: 92,
      magnitude: 'HIGH',
      expectedMove: isDovish ? '+$30 to +$50/oz' : isHawkish ? '-$32 to -$52/oz' : '±$7/oz',
      transmissionRationale: 'Labor softening lowers nominal and real yields, creating ideal tailwind for bullion.',
      invalidationTrigger: 'US 10Y yield sudden spike',
      correlationRank: 2,
      primaryDriver: 'Real Yields & Easing Expectations',
      transmissionSpeed: 'INSTANT (0-30s)'
    },
    {
      symbol: 'SPX',
      name: 'S&P 500 Index',
      category: 'INDICES',
      bias: isUpcoming ? 'WATCH' : isDovish ? 'BUY' : isHawkish ? 'SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isDovish ? 'BUY PULLBACKS' : 'STAND ASIDE',
      confidence: 84,
      magnitude: 'MEDIUM',
      expectedMove: isDovish ? '+1.0% to +1.6%' : isHawkish ? '-1.1% to -1.8%' : '±0.3%',
      transmissionRationale: 'Balance between economic growth resilience and lower discount rates.',
      invalidationTrigger: 'Earnings guidance revisions',
      correlationRank: 3,
      primaryDriver: 'Growth vs Discount Rate Tug-of-War',
      transmissionSpeed: 'INTERMEDIATE (1-15m)'
    }
  ];

  return {
    eventId: event.id,
    eventTitle: event.title,
    eventCode: 'NFP',
    verdict: isUpcoming ? 'MIXED_NO_ACTION' : isHawkish ? 'HAWKISH_SURPRISE' : isDovish ? 'GROWTH_SHOCK' : 'GOLDILOCKS_CONTINUATION',
    verdictLabel: isUpcoming ? 'US LABOR PRE-RELEASE MATRIX' : isHawkish ? 'US LABOR RESILIENCE' : isDovish ? 'US LABOR SOFTENING CONFIRMED' : 'IN-LINE CONSENSUS',
    confidenceScore: isUpcoming ? 88 : 91,
    summaryThesis: isUpcoming
      ? `Upcoming labor release scheduled. Tracking structural job additions and benchmark revisions. Cross-asset matrix is active with dynamic trigger scenarios.`
      : isHawkish
      ? `Labor data printed strong at ${headline}K. Delays Fed easing pace; USD bid.`
      : `Labor data confirmed deceleration at ${headline}K. Fed rate cuts confirmed; Gold and Treasuries surge.`,
    checklist,
    assetImpacts,
    timestamp: Date.now(),
  };
}
