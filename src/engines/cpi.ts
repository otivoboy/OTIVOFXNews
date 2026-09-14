import { ChecklistStep, AssetImpact, EngineEvaluationResult, EconomicEvent } from '../types';

export interface CpiMetrics {
  headlineYoYActual?: number;
  headlineYoYForecast?: number;
  headlineMoMActual?: number;
  headlineMoMForecast?: number;
  coreYoYActual?: number;
  coreYoYForecast?: number;
  coreMoMActual?: number;
  coreMoMForecast?: number;
  shelterInflationMoM?: number;
  superCoreMoM?: number;
  priorPpiSignal?: 'HOT' | 'COOL' | 'IN_LINE';
  actual?: number;
  forecast?: number;
  previous?: number;
}

export function evaluateCPI(
  event: EconomicEvent,
  customMetrics?: Partial<CpiMetrics>
): EngineEvaluationResult {
  const currency = event.currency || 'USD';
  const isUpcoming = event.status !== 'RELEASED' && event.actual === null && customMetrics?.actual === undefined && customMetrics?.headlineYoYActual === undefined && customMetrics?.headlineMoMActual === undefined;

  // Values resolution
  const forecastVal = customMetrics?.headlineMoMForecast ?? customMetrics?.headlineYoYForecast ?? customMetrics?.forecast ?? event.forecast ?? 0.4;
  const previousVal = customMetrics?.previous ?? event.previous ?? -0.4;
  const actualVal = customMetrics?.headlineMoMActual ?? customMetrics?.headlineYoYActual ?? customMetrics?.actual ?? event.actual;

  // Surprise calculation (if released or simulated)
  const isEvaluated = actualVal !== null && actualVal !== undefined;
  const surprise = isEvaluated ? Number((actualVal - forecastVal).toFixed(2)) : 0;
  const isHawkish = isEvaluated && surprise > 0.05;
  const isDovish = isEvaluated && surprise < -0.05;

  const checklist: ChecklistStep[] = [];

  // ==========================================
  // 1. CANADIAN INFLATION (CAD CPI & CORE)
  // ==========================================
  if (currency === 'CAD') {
    const isMoM = event.title.toLowerCase().includes('m/m');
    const isMedian = event.title.toLowerCase().includes('median');
    const isTrimmed = event.title.toLowerCase().includes('trimmed');

    // Step 1: Primary Headline / Component Target
    checklist.push({
      id: 'cad-cpi-primary',
      label: `${event.title} Expected Target & Decision Band`,
      description: 'Official Statistics Canada consumer price index print vs Bloomberg/Refinitiv consensus',
      status: isUpcoming ? 'PENDING' : Math.abs(surprise) <= 0.05 ? 'MIXED' : isHawkish ? 'FAIL' : 'PASS',
      skew: isUpcoming ? 'NEUTRAL' : isHawkish ? 'HAWKISH' : isDovish ? 'DOVISH' : 'NEUTRAL',
      actualValue: isEvaluated ? `${actualVal > 0 ? '+' : ''}${actualVal}%` : 'Awaiting 3:30pm Release',
      expectedValue: `${forecastVal > 0 ? '+' : ''}${forecastVal}% (Prev: ${previousVal > 0 ? '+' : ''}${previousVal}%)`,
      deltaStr: isEvaluated ? `${surprise > 0 ? '+' : ''}${surprise}% surprise` : `Consensus: ${forecastVal}%`,
      weight: 3,
      reasoning: isUpcoming
        ? `Consensus forecasts ${event.title} at ${forecastVal}%. Print > +0.5% will force Bank of Canada (BoC) to slow rate cuts; print < +0.3% seals a 50 bps cut.`
        : isHawkish
        ? `Print exceeded expectations at ${actualVal}% (+${surprise}% beat). Bank of Canada rate cut probabilities repricing lower; CAD rallies across majors.`
        : isDovish
        ? `Print undershot expectations at ${actualVal}% (${surprise}% miss). Accelerates BoC easing path; USD/CAD pushes higher.`
        : `Print aligned directly with consensus at ${actualVal}%. Orderly market absorption.`,
      scenarioThresholds: {
        hawkishThreshold: `> +0.50% (Beat by ≥ +0.15%)`,
        dovishThreshold: `< +0.25% (Miss by ≥ -0.15%)`,
        inLineRange: `+0.30% to +0.50%`,
        hawkishOutcome: `Bank of Canada halts aggressive 50bps rate cut pricing. CAD surges; USD/CAD drops 60-90 pips.`,
        dovishOutcome: `BoC aggressive easing unlocked. CAD dumps; USD/CAD rallies 75-115 pips toward 1.3880.`,
        inLineOutcome: `Standard 25bps rate cut trajectory remains priced in. USD/CAD chops within 25-pip range.`
      },
      historicalVolatility: '±48 pips on USD/CAD in 15min',
      componentWeighting: 'Tier 1 Central Bank Anchor (100% BoC Policy Driver)',
      keyDrivers: ['Gasoline & Energy pump price pass-through', 'Mortgage interest cost base effect', 'Grocery & food retail discounting'],
      institutionalFocus: 'Tiff Macklem and BoC Governing Council focus on Trimmed/Median core averages.',
      preReleaseGuidance: 'Watch the 1-minute initial knee jerk in USD/CAD. If Trimmed & Median also decelerate, look for USD/CAD long continuation.'
    });

    // Step 2: BoC Preferred Trimmed-Mean & Median Filter
    checklist.push({
      id: 'cad-cpi-core-filters',
      label: 'Bank of Canada Core Filter (Trimmed & Median CPI)',
      description: 'Strips out the 50% central and 25% extreme tails to isolate persistent underlying trend',
      status: isUpcoming ? 'PENDING' : 'MIXED',
      skew: 'NEUTRAL',
      actualValue: isEvaluated ? `${actualVal}%` : 'Expected ~1.8% - 2.0%',
      expectedValue: 'Median: 2.0% | Trimmed: 1.8%',
      deltaStr: 'Target 2.0% Inflation Midpoint',
      weight: 3,
      reasoning: isUpcoming
        ? 'The Bank of Canada explicitly targets the 2.0% core midpoint. Both Median (2.0% exp) and Trimmed (1.8% exp) are hovering at target.'
        : 'Core filters confirm whether price pressures are broad-based or isolated to volatile energy spikes.',
      scenarioThresholds: {
        hawkishThreshold: 'Core Average > 2.2% YoY',
        dovishThreshold: 'Core Average < 1.9% YoY',
        inLineRange: '1.9% - 2.1% YoY',
        hawkishOutcome: 'Sticky services and shelter prevent BoC from cutting below neutral rate (2.75%).',
        dovishOutcome: 'Disinflation victory declared; allows rapid return to stimulative monetary policy.'
      },
      historicalVolatility: '±35 pips',
      componentWeighting: 'BoC Primary Policy Trigger',
      keyDrivers: ['Shelter services ex-rent', 'Personal healthcare & recreation fees', 'Vehicle replacement costs'],
      institutionalFocus: 'If Headline is hot but Trimmed Core drops, the market will fade the initial CAD rally.'
    });

    // Step 3: US-Canada Monetary Policy Spread & Oil Linkage
    checklist.push({
      id: 'cad-cpi-macro-spread',
      label: 'Cross-Border Fed-BoC Rate Spread & Terms of Trade',
      description: 'Yield differential between US Treasuries and Government of Canada Bonds (GoC 10Y)',
      status: 'MIXED',
      skew: 'NEUTRAL',
      actualValue: 'GoC 10Y: ~3.15%',
      expectedValue: 'Spread: -85 bps vs US 10Y',
      deltaStr: 'Wide Policy Divergence',
      weight: 2,
      reasoning: 'The BoC is cutting faster than the US Fed, creating structural downward pressure on the Canadian Dollar unless CPI surprises to the upside.',
      scenarioThresholds: {
        hawkishThreshold: 'Spread narrows towards -60 bps',
        dovishThreshold: 'Spread widens past -100 bps',
        inLineRange: '-80 to -90 bps',
        hawkishOutcome: 'Canadian bond yields surge relative to US Treasuries; strong CAD carry demand.',
        dovishOutcome: 'Capital rotates out of Canadian debt into US dollar money market funds.'
      },
      historicalVolatility: '5-8 bps yield spread shift',
      componentWeighting: 'Macro Capital Flows',
      keyDrivers: ['WTI Crude Oil price ($78/bbl baseline)', 'US-Canada bilateral trade flows', 'Household debt servicing ratios']
    });

    // Asset Impacts for CAD CPI
    const assetImpacts: AssetImpact[] = [
      {
        symbol: 'USD/CAD',
        name: 'US Dollar / Canadian Dollar',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_SELL' : isDovish ? 'STRONG_BUY' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'SHORT' : isDovish ? 'LONG' : 'STAND ASIDE',
        confidence: isUpcoming ? 88 : isHawkish || isDovish ? 92 : 65,
        magnitude: 'HIGH',
        expectedMove: isHawkish ? '-65 to -95 pips' : isDovish ? '+70 to +110 pips' : '±20 pips',
        transmissionRationale: 'Primary liquid direct conduit for Canadian macro. Direct interest rate differential transmission from BoC rate repricing.',
        invalidationTrigger: isHawkish ? 'Crude Oil plunges > $2.00 simultaneously' : 'US yields suddenly spike',
        correlationRank: 1,
        primaryDriver: 'BoC Policy Rate Path & US-CA 2Y Spread',
        currentPosture: isUpcoming ? 'Pre-Event Compression: Spreads widening slightly; monitor 1.3810 resistance' : isHawkish ? 'Aggressive CAD buying underway' : 'USD/CAD upside breakout active',
        liveExecutionSteps: [
          'Pre-Release: Do not front-run the 3:30pm spike. Spreads typically widen from 1.2 to 4.5 pips for 15 seconds.',
          'Execution Trigger A (Beat > +0.5%): Short USD/CAD on first 3-minute pullback below VWAP.',
          'Execution Trigger B (Miss < +0.3%): Long USD/CAD targeting key liquidity above 1.3860.'
        ],
        upsideScenario: {
          trigger: 'CAD CPI MoM ≥ +0.5% (Hawkish Beat)',
          action: 'SHORT',
          targetPrice: '1.3735 (-75 pips)',
          stopLoss: '1.3835 (+25 pips)',
          expectedMove: '-65 to -95 pips',
          rationale: 'BoC rate pause pricing triggers violent CAD short-squeeze across G10 pairs.'
        },
        downsideScenario: {
          trigger: 'CAD CPI MoM ≤ +0.2% (Dovish Miss)',
          action: 'LONG',
          targetPrice: '1.3890 (+80 pips)',
          stopLoss: '1.3785 (-25 pips)',
          expectedMove: '+70 to +110 pips',
          rationale: 'BoC given full clearance for 50bps jumbo easing; CAD sold aggressively vs USD and JPY.'
        },
        inLineScenario: {
          trigger: 'CAD CPI MoM 0.3% - 0.4% (In-Line)',
          action: 'FADE SPIKES',
          targetPrice: '1.3810 (Mean reversion)',
          stopLoss: '1.3840',
          expectedMove: '±18 pips',
          rationale: 'Fade initial liquidity sweep into key support/resistance boundaries.'
        },
        volatilityWindow: 'Peak Volatility: 00:00 - 15:00 min post-release',
        transmissionSpeed: 'INSTANT (0-30s)'
      },
      {
        symbol: 'CAD/JPY',
        name: 'Canadian Dollar / Japanese Yen',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'STRONG_SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 85,
        magnitude: 'HIGH',
        expectedMove: isHawkish ? '+80 to +130 pips' : isDovish ? '-90 to -140 pips' : '±25 pips',
        transmissionRationale: 'High-beta carry pair sensitive to Canadian bond yields and global risk appetite.',
        invalidationTrigger: 'BOJ surprise hawkish commentary or Yen intervention',
        correlationRank: 2,
        primaryDriver: 'CAD-JPY Yield Gap & Carry Trade Dynamics',
        currentPosture: 'Consolidating near 108.40; high sensitivity to Canadian yield shifts.',
        volatilityWindow: '0 - 30 min',
        transmissionSpeed: 'INSTANT (0-30s)'
      },
      {
        symbol: 'CL',
        name: 'WTI Crude Oil',
        category: 'COMMODITIES',
        bias: 'WATCH',
        action: 'STAND ASIDE',
        confidence: 65,
        magnitude: 'MEDIUM',
        expectedMove: '±$0.60/bbl',
        transmissionRationale: 'Canada is a premier crude exporter. CPI feeds terms of trade, though OPEC+ news exerts primary structural influence.',
        invalidationTrigger: 'Geopolitical Middle East supply headlines',
        correlationRank: 3,
        primaryDriver: 'Commodity Terms of Trade Linkage',
        currentPosture: 'Trading $78.20/bbl; provides background baseline for Canadian trade balance.',
        transmissionSpeed: 'DRIFT (1-4h)'
      },
      {
        symbol: 'EUR/CAD',
        name: 'Euro / Canadian Dollar',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_SELL' : isDovish ? 'STRONG_BUY' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'SHORT' : isDovish ? 'LONG' : 'STAND ASIDE',
        confidence: 80,
        magnitude: 'MEDIUM',
        expectedMove: isHawkish ? '-55 to -85 pips' : isDovish ? '+60 to +90 pips' : '±15 pips',
        transmissionRationale: 'Cross-policy play pitting ECB rate trajectory against BoC rate expectations.',
        invalidationTrigger: 'ECB unexpected emergency statements',
        correlationRank: 4,
        primaryDriver: 'ECB-BoC Divergence',
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
        expectedMove: isDovish ? '+$8 to +$14/oz' : '±$4/oz',
        transmissionRationale: 'Global easing wave confirmation supports broad bullion sentiment.',
        invalidationTrigger: 'US 10Y yield sharp reversal',
        correlationRank: 5,
        primaryDriver: 'Global Easing Cycle Tailwinds',
        transmissionSpeed: 'DRIFT (1-4h)'
      }
    ];

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventCode: 'CPI',
      verdict: isUpcoming ? 'MIXED_NO_ACTION' : isHawkish ? 'HAWKISH_SURPRISE' : isDovish ? 'DISINFLATION_CONFIRMED' : 'GOLDILOCKS_CONTINUATION',
      verdictLabel: isUpcoming ? 'PRE-RELEASE EXPECTATION MATRIX ACTIVE' : isHawkish ? 'HAWKISH INFLATION SHOCK (CAD STRENGTH)' : isDovish ? 'DISINFLATION CEMENTED (BOC CUTS)' : 'IN-LINE CONSENSUS',
      confidenceScore: isUpcoming ? 85 : isHawkish || isDovish ? 92 : 65,
      summaryThesis: isUpcoming
        ? `Statistics Canada scheduled release at 3:30pm. Consensus expects ${event.title} at ${forecastVal}% (prior ${previousVal}%). Key threshold is +0.50% for BoC pause vs < +0.25% for 50bps cut acceleration. Cross-asset matrix is armed with live execution parameters.`
        : isHawkish
        ? `CAD CPI printed hot at ${actualVal}%, beating consensus of ${forecastVal}%. Bank of Canada rapid easing bets being pruned; strong CAD appreciation across G10.`
        : isDovish
        ? `CAD CPI decelerated to ${actualVal}%, missing forecast (${forecastVal}%). Cements aggressive BoC rate reductions; USD/CAD breaking out higher.`
        : `CAD CPI printed in-line at ${actualVal}%. Moderate market absorption.`,
      checklist,
      assetImpacts,
      timestamp: Date.now(),
    };
  }

  // ==========================================
  // 2. UK INFLATION (GBP CPI)
  // ==========================================
  if (currency === 'GBP') {
    checklist.push({
      id: 'gbp-cpi-primary',
      label: 'UK CPI YoY & Services Inflation (BoE Benchmark)',
      description: 'Office for National Statistics release tracking UK basket inflation and persistent services pressure',
      status: isUpcoming ? 'PENDING' : isHawkish ? 'FAIL' : 'PASS',
      skew: isUpcoming ? 'NEUTRAL' : isHawkish ? 'HAWKISH' : 'DOVISH',
      actualValue: isEvaluated ? `${actualVal}%` : 'Awaiting 9:00am Release',
      expectedValue: `${forecastVal}% (Prev: ${previousVal}%)`,
      deltaStr: isEvaluated ? `${surprise > 0 ? '+' : ''}${surprise}%` : `Consensus: ${forecastVal}%`,
      weight: 3,
      reasoning: isUpcoming
        ? `Consensus forecasts UK CPI YoY at ${forecastVal}% (accelerating from ${previousVal}%). A print > 3.0% will delay Bank of England (BoE) rate cuts.`
        : isHawkish
        ? `UK CPI printed hot at ${actualVal}%. BoE MPC split shifts hawkish; GBP rallies aggressively.`
        : `UK CPI cooled to ${actualVal}%. Clears path for consecutive BoE rate cuts.`,
      scenarioThresholds: {
        hawkishThreshold: '> 3.1% YoY (Beat by ≥ +0.2%)',
        dovishThreshold: '< 2.7% YoY (Miss by ≥ -0.2%)',
        inLineRange: '2.8% - 3.0% YoY',
        hawkishOutcome: 'Bank of England halts autumn rate cut schedule; Sterling surges 80-130 pips.',
        dovishOutcome: 'BoE dovish majority expands; GBP/USD drops toward key swing support.',
        inLineOutcome: 'BoE maintains quarterly rate reduction pace; moderate Sterling consolidation.'
      },
      historicalVolatility: '±62 pips on GBP/USD',
      componentWeighting: 'Bank of England Top Priority',
      keyDrivers: ['Services sector wage pass-through', 'Ofgem regulated energy price cap adjustment', 'Hospitality & airline fares'],
      institutionalFocus: 'Andrew Bailey and MPC focus on core services inflation ex-airfares.',
      preReleaseGuidance: 'High spread environment on GBP pairs between 08:59:45 and 09:00:30 BST.'
    });

    const assetImpacts: AssetImpact[] = [
      {
        symbol: 'GBP/USD',
        name: 'British Pound / US Dollar',
        category: 'FX',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'STRONG_SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 88,
        magnitude: 'HIGH',
        expectedMove: isHawkish ? '+75 to +125 pips' : isDovish ? '-70 to -115 pips' : '±22 pips',
        transmissionRationale: 'Direct BoE-Fed rate spread repricing. Sterling is among the most responsive G10 currencies to CPI surprises.',
        invalidationTrigger: 'UK fiscal budget policy headlines or US dollar surge',
        correlationRank: 1,
        primaryDriver: 'BoE Interest Rate Trajectory',
        currentPosture: 'Consolidating near 1.3020; watch for volatility expansion on release.',
        upsideScenario: {
          trigger: 'UK CPI YoY ≥ 3.1%',
          action: 'LONG',
          targetPrice: '1.3120 (+95 pips)',
          stopLoss: '1.2990 (-30 pips)',
          expectedMove: '+75 to +125 pips',
          rationale: 'BoE hawkish repricing forces massive institutional short-covering on Sterling.'
        },
        downsideScenario: {
          trigger: 'UK CPI YoY ≤ 2.7%',
          action: 'SHORT',
          targetPrice: '1.2930 (-90 pips)',
          stopLoss: '1.3050 (+30 pips)',
          expectedMove: '-70 to -115 pips',
          rationale: 'Faster BoE rate cuts priced in; GBP liquidates against USD and CHF.'
        },
        volatilityWindow: '00:00 - 20:00 min',
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
        expectedMove: isHawkish ? '-45 to -70 pips' : isDovish ? '+50 to +75 pips' : '±12 pips',
        transmissionRationale: 'Clean European regional relative value trade without USD noise.',
        invalidationTrigger: 'ECB sudden policy shifts',
        correlationRank: 2,
        primaryDriver: 'ECB vs BoE Policy Divergence',
        transmissionSpeed: 'INSTANT (0-30s)'
      },
      {
        symbol: 'UK10Y',
        name: 'UK 10-Year Gilt Yield',
        category: 'YIELDS',
        bias: isUpcoming ? 'WATCH' : isHawkish ? 'STRONG_BUY' : isDovish ? 'SELL' : 'WATCH',
        action: isUpcoming ? 'STAND ASIDE' : isHawkish ? 'LONG' : isDovish ? 'SHORT' : 'STAND ASIDE',
        confidence: 90,
        magnitude: 'HIGH',
        expectedMove: isHawkish ? '+8 to +14 bps' : isDovish ? '-7 to -12 bps' : '±2 bps',
        transmissionRationale: 'Direct sovereign bond repricing based on Bank of England terminal rate discounting.',
        invalidationTrigger: 'Debt Management Office (DMO) issuance announcements',
        correlationRank: 3,
        primaryDriver: 'Gilt Curve Repricing',
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
        expectedMove: '±$6/oz',
        transmissionRationale: 'European yields influence global real rates and dollar basket components.',
        invalidationTrigger: 'US Treasury yield sharp movement',
        correlationRank: 4,
        primaryDriver: 'Global Sovereign Real Rates',
        transmissionSpeed: 'DRIFT (1-4h)'
      }
    ];

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventCode: 'CPI',
      verdict: isUpcoming ? 'MIXED_NO_ACTION' : isHawkish ? 'HAWKISH_SURPRISE' : isDovish ? 'DISINFLATION_CONFIRMED' : 'GOLDILOCKS_CONTINUATION',
      verdictLabel: isUpcoming ? 'UK PRE-RELEASE EXPECTATIONS ACTIVE' : isHawkish ? 'UK HAWKISH SURPRISE' : isDovish ? 'UK DISINFLATION CONFIRMED' : 'IN-LINE CONSENSUS',
      confidenceScore: isUpcoming ? 86 : 90,
      summaryThesis: isUpcoming
        ? `UK CPI scheduled for 9:00am. Forecast is ${forecastVal}% (prior ${previousVal}%). Services inflation is the critical swing factor for the Bank of England.`
        : isHawkish
        ? `UK CPI printed hot at ${actualVal}%. BoE rate cut cycle paused; GBP bid across majors.`
        : `UK CPI cooled to ${actualVal}%. Clears path for Bank of England easing.`,
      checklist,
      assetImpacts,
      timestamp: Date.now(),
    };
  }

  // ==========================================
  // 3. US INFLATION & CORE PCE (USD)
  // ==========================================
  checklist.push({
    id: 'usd-cpi-pce-primary',
    label: `${event.title} Expected Target & Fed Easing Band`,
    description: 'Federal Reserve primary inflation benchmark determining FOMC interest rate cuts',
    status: isUpcoming ? 'PENDING' : isHawkish ? 'FAIL' : 'PASS',
    skew: isUpcoming ? 'NEUTRAL' : isHawkish ? 'HAWKISH' : isDovish ? 'DOVISH' : 'NEUTRAL',
    actualValue: isEvaluated ? `${actualVal}%` : 'Awaiting Release',
    expectedValue: `${forecastVal}% (Prev: ${previousVal}%)`,
    deltaStr: isEvaluated ? `${surprise > 0 ? '+' : ''}${surprise}%` : `Consensus: ${forecastVal}%`,
    weight: 3,
    reasoning: isUpcoming
      ? `Consensus forecasts ${event.title} at ${forecastVal}%. Core reading below +0.2% MoM guarantees continued Fed rate cuts; reading > +0.3% triggers higher-for-longer dollar surge.`
      : isHawkish
      ? `Print exceeded expectations at ${actualVal}%. Fed forced into hawkish pause; yields and USD jump.`
      : `Print cooled to ${actualVal}%. Confirms disinflation trend; real yields collapse, boosting gold and tech equities.`,
    scenarioThresholds: {
      hawkishThreshold: 'MoM ≥ +0.3% / YoY ≥ +2.9%',
      dovishThreshold: 'MoM ≤ +0.1% / YoY ≤ +2.6%',
      inLineRange: '+0.2% MoM / 2.7% - 2.8% YoY',
      hawkishOutcome: 'Fed rate cuts priced out. US 10Y yield surges +12 bps; DXY rallies +90 pts; Gold drops -$40/oz.',
      dovishOutcome: 'Fed easing cycle accelerated. US 10Y yield slides -10 bps; Gold skyrockets +$45/oz; S&P 500 rallies +1.5%.',
      inLineOutcome: 'Orderly rate cut path maintained. Range-bound price action.'
    },
    historicalVolatility: '±$38/oz on Gold | ±85 pts on DXY',
    componentWeighting: 'Top Global Macro Driver',
    keyDrivers: ['SuperCore Services Ex-Housing', 'Shelter rent lag correction', 'Healthcare & portfolio management fees'],
    institutionalFocus: 'Jerome Powell and FOMC watch 3-month annualized Core PCE velocity.',
    preReleaseGuidance: 'Front-end 2Y yield move will dictate Gold and DXY direction within the first 30 seconds.'
  });

  const assetImpacts: AssetImpact[] = [
    {
      symbol: 'XAU/USD',
      name: 'Spot Gold',
      category: 'COMMODITIES',
      bias: isUpcoming ? 'WATCH' : isDovish ? 'STRONG_BUY' : isHawkish ? 'STRONG_SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isDovish ? 'LONG' : isHawkish ? 'SHORT' : 'STAND ASIDE',
      confidence: 94,
      magnitude: 'HIGH',
      expectedMove: isDovish ? '+$35 to +$55/oz (+1.5%)' : isHawkish ? '-$38 to -$60/oz (-1.6%)' : '±$8/oz',
      transmissionRationale: 'Direct inverse transmission to US 10-Year Real Treasury Yields and Dollar liquidity.',
      invalidationTrigger: 'US 10Y yield unexpected spike on debt auction supply',
      correlationRank: 1,
      primaryDriver: 'US Real Yields & Dollar Inverse Beta',
      currentPosture: 'Consolidating near all-time high zone; coiled for high-volatility breakout.',
      upsideScenario: {
        trigger: 'US Inflation Dovish Miss (≤ 0.1% MoM)',
        action: 'LONG',
        targetPrice: '+$45/oz breakout',
        stopLoss: '-$14/oz from entry',
        expectedMove: '+$35 to +$55/oz',
        rationale: 'Plunging real yields reduce holding cost of non-yielding bullion.'
      },
      downsideScenario: {
        trigger: 'US Inflation Hawkish Beat (≥ 0.3% MoM)',
        action: 'SHORT',
        targetPrice: '-$48/oz liquidation',
        stopLoss: '+$15/oz from entry',
        expectedMove: '-$38 to -$60/oz',
        rationale: 'Rate cut delay pushes real yields to multi-month highs, triggering bullion margin sales.'
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
      confidence: 92,
      magnitude: 'HIGH',
      expectedMove: isHawkish ? '+80 to +120 pts' : isDovish ? '-75 to -110 pts' : '±20 pts',
      transmissionRationale: 'Global reserve currency interest rate carry advantage relative to G10 peers.',
      invalidationTrigger: 'Fed speakers push back against market move',
      correlationRank: 2,
      primaryDriver: 'Interest Rate Differentials',
      currentPosture: 'Range-bound in 103.50-104.20 corridor awaiting release catalyst.',
      transmissionSpeed: 'INSTANT (0-30s)'
    },
    {
      symbol: 'EUR/USD',
      name: 'Euro / US Dollar',
      category: 'FX',
      bias: isUpcoming ? 'WATCH' : isDovish ? 'STRONG_BUY' : isHawkish ? 'STRONG_SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isDovish ? 'LONG' : isHawkish ? 'SHORT' : 'STAND ASIDE',
      confidence: 90,
      magnitude: 'HIGH',
      expectedMove: isDovish ? '+65 to +110 pips' : isHawkish ? '-70 to -115 pips' : '±20 pips',
      transmissionRationale: '57.6% weight in DXY. Direct mirror of US interest rate repricing.',
      invalidationTrigger: 'European geopolitical headlines',
      correlationRank: 3,
      primaryDriver: 'Fed-ECB Spread',
      transmissionSpeed: 'INSTANT (0-30s)'
    },
    {
      symbol: 'SPX',
      name: 'S&P 500 Index',
      category: 'INDICES',
      bias: isUpcoming ? 'WATCH' : isDovish ? 'BUY' : isHawkish ? 'SELL' : 'WATCH',
      action: isUpcoming ? 'STAND ASIDE' : isDovish ? 'BUY PULLBACKS' : isHawkish ? 'FADE SPIKES' : 'STAND ASIDE',
      confidence: 85,
      magnitude: 'MEDIUM',
      expectedMove: isDovish ? '+1.2% to +1.8%' : isHawkish ? '-1.3% to -2.0%' : '±0.3%',
      transmissionRationale: 'Discount rate reduction expands equity valuation multiples.',
      invalidationTrigger: 'Major corporate earnings surprises',
      correlationRank: 4,
      primaryDriver: 'Equity Discount Rate',
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
      expectedMove: isDovish ? '+3.5% to +6.0%' : isHawkish ? '-3.0% to -5.5%' : '±1.0%',
      transmissionRationale: 'High-beta global fiat liquidity proxy.',
      invalidationTrigger: 'Crypto regulatory actions',
      correlationRank: 5,
      primaryDriver: 'Global Liquidity Expansion',
      transmissionSpeed: 'INSTANT (0-30s)'
    }
  ];

  return {
    eventId: event.id,
    eventTitle: event.title,
    eventCode: 'CPI',
    verdict: isUpcoming ? 'MIXED_NO_ACTION' : isHawkish ? 'HAWKISH_SURPRISE' : isDovish ? 'DISINFLATION_CONFIRMED' : 'GOLDILOCKS_CONTINUATION',
    verdictLabel: isUpcoming ? 'PRE-RELEASE EXPECTATION MATRIX ACTIVE' : isHawkish ? 'HAWKISH INFLATION SURPRISE' : isDovish ? 'DISINFLATION CONFIRMED' : 'IN-LINE CONSENSUS',
    confidenceScore: isUpcoming ? 88 : 93,
    summaryThesis: isUpcoming
      ? `Upcoming release scheduled. Consensus forecast is ${forecastVal}% (prior ${previousVal}%). Cross-asset matrix is actively calculating live scenario vectors.`
      : isHawkish
      ? `Inflation printed hot at ${actualVal}%. Pushes back Fed rate cuts; USD rallies, Gold pulls back.`
      : `Disinflation confirmed at ${actualVal}%. Green light for Fed easing; Gold, EUR/USD, and risk assets surge.`,
    checklist,
    assetImpacts,
    timestamp: Date.now(),
  };
}
