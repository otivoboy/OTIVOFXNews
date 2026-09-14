import { EconomicEvent, EngineEvaluationResult, HistoricScenario, AssetImpact, TacticalAction, MarketBias, SignalVerdict } from '../types';
import { evaluateCPI } from './cpi';
import { evaluateNFP } from './nfp';
import { evaluateFOMC } from './fomc';
import { evaluateBOJ } from './boj';
import { evaluatePPI } from './ppi';
import { evaluateRetailSales } from './retail';
import { evaluateGeneralMacro } from './general';
import { calculateMathematicalExpectation } from './mathematicalExpectation';
import { generateConfirmationPillars } from './confirmationPillars';
import { 
  getMatchingMacroPlaybookTopic, 
  calculateDirectionSpikeDecision, 
  generateInstitutionalSynthesisFromPlaybook 
} from './macroPlaybookDecisionEngine';

/**
 * Universal Currency Transmission & Direct/Inverse Base-Quote Pair Resolver
 * - Direct pair (BASE = Event Currency, e.g. GBP/USD when news is GBP):
 *     Bullish GBP => BUY / LONG GBP/USD
 *     Bearish GBP => SELL / SHORT GBP/USD
 * - Inverse pair (QUOTE = Event Currency, e.g. EUR/GBP when news is GBP):
 *     Bullish GBP => SELL / SHORT EUR/GBP (Opposite market sells because GBP denominator strengthens)
 *     Bearish GBP => BUY / LONG EUR/GBP (Opposite market buys because GBP denominator weakens)
 */
export function resolveAssetTransmissionVector(
  asset: AssetImpact,
  event: EconomicEvent,
  isBullishForEventCurrency: boolean,
  isStrongConviction: boolean = false
): {
  directive: 'BUY' | 'SELL' | 'STRONG BUY' | 'STRONG SELL';
  action: TacticalAction;
  bias: MarketBias;
  rationale?: string;
} {
  const eventCurrency = (event.currency || 'USD').toUpperCase();
  const sym = asset.symbol.toUpperCase();
  const parts = sym.split('/');

  // 1. Currency Pair FX Transmission (BASE / QUOTE)
  if (parts.length === 2) {
    const base = parts[0].trim();
    const quote = parts[1].trim();

    // A. Event currency is the BASE currency (e.g. GBP/USD, GBP/JPY, GBP/CAD, GBP/AUD, GBP/CHF when event is GBP)
    if (base === eventCurrency) {
      if (isBullishForEventCurrency) {
        return {
          directive: isStrongConviction ? 'STRONG BUY' : 'BUY',
          action: isStrongConviction ? 'STRONG BUY' : 'LONG',
          bias: isStrongConviction ? 'STRONG_BUY' : 'BUY',
          rationale: `Direct Base Currency Transmission: Expected ${eventCurrency} strength drives ${sym} higher.`,
        };
      } else {
        return {
          directive: isStrongConviction ? 'STRONG SELL' : 'SELL',
          action: isStrongConviction ? 'STRONG SELL' : 'SHORT',
          bias: isStrongConviction ? 'STRONG_SELL' : 'SELL',
          rationale: `Direct Base Currency Transmission: Expected ${eventCurrency} weakness drives ${sym} lower.`,
        };
      }
    }

    // B. Event currency is the QUOTE currency (e.g. EUR/GBP, USD/GBP, AUD/GBP, NZD/GBP, CAD/GBP when event is GBP)
    // CRITICAL: When GBP is expected to buy/strengthen, XXX/GBP is expected to SELL (inverse denominator effect)
    if (quote === eventCurrency) {
      if (isBullishForEventCurrency) {
        return {
          directive: isStrongConviction ? 'STRONG SELL' : 'SELL',
          action: isStrongConviction ? 'STRONG SELL' : 'SHORT',
          bias: isStrongConviction ? 'STRONG_SELL' : 'SELL',
          rationale: `Inverse Quote Currency Transmission: Expected ${eventCurrency} strength strengthens denominator, forcing ${sym} to SELL.`,
        };
      } else {
        return {
          directive: isStrongConviction ? 'STRONG BUY' : 'BUY',
          action: isStrongConviction ? 'STRONG BUY' : 'LONG',
          bias: isStrongConviction ? 'STRONG_BUY' : 'BUY',
          rationale: `Inverse Quote Currency Transmission: Expected ${eventCurrency} weakness weakens denominator, lifting ${sym} to BUY.`,
        };
      }
    }

    // C. Non-matching pair (e.g. USD is event, but pair is EUR/JPY or general cross)
    if (eventCurrency === 'USD') {
      if (quote === 'USD') { // EUR/USD, GBP/USD, AUD/USD
        return isBullishForEventCurrency
          ? { directive: 'SELL', action: 'SHORT', bias: 'SELL', rationale: 'Strong USD pulls pair down.' }
          : { directive: 'BUY', action: 'LONG', bias: 'BUY', rationale: 'Weak USD lifts pair up.' };
      }
      if (base === 'USD') { // USD/CAD, USD/JPY, USD/CHF
        return isBullishForEventCurrency
          ? { directive: 'BUY', action: 'LONG', bias: 'BUY', rationale: 'Strong USD lifts pair up.' }
          : { directive: 'SELL', action: 'SHORT', bias: 'SELL', rationale: 'Weak USD pulls pair down.' };
      }
    }
  }

  // 2. US Dollar Index (DXY)
  if (sym === 'DXY' || sym.includes('DOLLAR')) {
    if (eventCurrency === 'USD') {
      return isBullishForEventCurrency
        ? { directive: isStrongConviction ? 'STRONG BUY' : 'BUY', action: 'LONG', bias: isStrongConviction ? 'STRONG_BUY' : 'BUY' }
        : { directive: isStrongConviction ? 'STRONG SELL' : 'SELL', action: 'SHORT', bias: isStrongConviction ? 'STRONG_SELL' : 'SELL' };
    }
    // If EUR or GBP is strong, DXY falls due to heavy weighting in basket
    if (eventCurrency === 'EUR' || eventCurrency === 'GBP') {
      return isBullishForEventCurrency
        ? { directive: 'SELL', action: 'SHORT', bias: 'SELL', rationale: `Heavy ${eventCurrency} weighting depresses DXY basket.` }
        : { directive: 'BUY', action: 'LONG', bias: 'BUY', rationale: `Weak ${eventCurrency} elevates DXY basket.` };
    }
  }

  // 3. Sovereign Yields (UK10Y, US10Y, DE10Y, JP10Y, CA10Y)
  if (asset.category === 'YIELDS' || sym.includes('10Y') || sym.includes('YIELD') || sym.includes('GILT') || sym.includes('BUND')) {
    return isBullishForEventCurrency
      ? { directive: 'BUY', action: 'LONG', bias: 'BUY', rationale: 'Hawkish expectations / growth resilience drive bond yields higher.' }
      : { directive: 'SELL', action: 'SHORT', bias: 'SELL', rationale: 'Dovish expectations / rate cuts drive bond yields lower.' };
  }

  // 4. Precious Metals / Commodities (Gold / XAU/USD)
  if (sym.includes('XAU') || sym.includes('GOLD')) {
    if (eventCurrency === 'USD') {
      return isBullishForEventCurrency
        ? { directive: 'SELL', action: 'SELL SPIKES', bias: 'SELL', rationale: 'Higher yields & strong USD pressure gold prices (rising opportunity cost & positive real yields).' }
        : { directive: 'BUY', action: 'BUY PULLBACKS', bias: 'BUY', rationale: 'Lower yields & weak USD ignite gold rally (reduced holding cost & safe-haven bullion demand).' };
    }
    // For global rate tightening (ECB, BoE, SNB, BoJ, RBA):
    return isBullishForEventCurrency
      ? { directive: 'SELL', action: 'SELL SPIKES', bias: 'SELL', rationale: 'Global monetary tightening raises sovereign real yields, dampening non-yielding gold demand.' }
      : { directive: 'BUY', action: 'BUY PULLBACKS', bias: 'BUY', rationale: 'Global rate cuts and easing liquidity expand gold allocations.' };
  }

  // 5. Equities & Indices (SPX, NAS100, N225, SMI, ASX200, DAX, UK100)
  if (asset.category === 'INDICES' || sym === 'SPX' || sym === 'NAS100' || sym === 'UK100' || sym === 'DAX' || sym === 'N225' || sym === 'SMI' || sym === 'ASX200') {
    // Bank of Japan (BoJ / JPY): Hawkish hikes trigger Yen Carry Trade unwinds (global risk-off) & drag down Nikkei exporters
    if (eventCurrency === 'JPY' || event.code === 'BOJ') {
      return isBullishForEventCurrency
        ? { directive: 'SELL', action: 'SELL SPIKES', bias: 'SELL', rationale: 'BoJ rate hike triggers Yen Carry Trade unwind & exporter revenue drag on Nikkei/Nasdaq.' }
        : { directive: 'BUY', action: 'BUY PULLBACKS', bias: 'BUY', rationale: 'BoJ dovish hold preserves cheap liquidity and risk-on equity expansion.' };
    }

    // Swiss SNB (CHF): Hawkish policy strengthens CHF, squeezing export-heavy Swiss multinationals (SMI)
    if (eventCurrency === 'CHF' || event.title.toUpperCase().includes('SNB')) {
      return isBullishForEventCurrency
        ? { directive: 'SELL', action: 'SELL SPIKES', bias: 'SELL', rationale: 'Higher Swiss interest rates and stronger CHF compress export earnings for Swiss SMI firms.' }
        : { directive: 'BUY', action: 'BUY PULLBACKS', bias: 'BUY', rationale: 'SNB easing / lower rates relieve CHF pressure, lifting Swiss equities.' };
    }

    // Australia / New Zealand OCR (AUD / NZD):
    if ((eventCurrency === 'AUD' || eventCurrency === 'NZD') && (sym === 'ASX200' || sym.includes('ASX'))) {
      return isBullishForEventCurrency
        ? { directive: 'SELL', action: 'SELL SPIKES', bias: 'SELL', rationale: 'OCR rate hike raises corporate borrowing costs, compressing ASX 200 valuation multiples.' }
        : { directive: 'BUY', action: 'BUY PULLBACKS', bias: 'BUY', rationale: 'OCR rate cut injects domestic liquidity, fueling equity multiple expansion.' };
    }

    // Eurozone ECB (EUR):
    if (eventCurrency === 'EUR' && (sym === 'DAX' || sym.includes('CAC'))) {
      return isBullishForEventCurrency
        ? { directive: 'SELL', action: 'SELL SPIKES', bias: 'SELL', rationale: 'ECB Refinancing Rate hike raises borrowing costs across European commercial credit.' }
        : { directive: 'BUY', action: 'BUY PULLBACKS', bias: 'BUY', rationale: 'ECB Refinancing Rate cut unlocks cheaper corporate financing for DAX equities.' };
    }

    // Inflation or policy rate shock events (CPI, PPI, FOMC, NFP): Hawkishness is negative for equities
    if (event.code === 'CPI' || event.code === 'PPI' || event.code === 'FOMC' || event.code === 'NFP') {
      return isBullishForEventCurrency
        ? { directive: 'SELL', action: 'SELL SPIKES', bias: 'SELL', rationale: 'Tighter central bank liquidity and higher discount rates compress growth equity multiples.' }
        : { directive: 'BUY', action: 'BUY PULLBACKS', bias: 'BUY', rationale: 'Rate cut easing and lower borrowing hurdles expand equity valuations.' };
    }

    // For economic growth / GDP / retail sales:
    return isBullishForEventCurrency
      ? { directive: 'BUY', action: 'BUY PULLBACKS', bias: 'BUY', rationale: 'Stronger macroeconomic output boosts corporate top-line earnings.' }
      : { directive: 'SELL', action: 'SELL SPIKES', bias: 'SELL', rationale: 'Economic slowdown dampens corporate earnings.' };
  }

  // Default fallback
  return isBullishForEventCurrency
    ? { directive: 'BUY', action: 'LONG', bias: 'BUY' }
    : { directive: 'SELL', action: 'SHORT', bias: 'SELL' };
}

export class MacroEvaluator {
  static evaluate(
    event: EconomicEvent,
    customMetrics?: Record<string, any>
  ): EngineEvaluationResult {
    let result: EngineEvaluationResult;
    switch (event.code) {
      case 'CPI':
      case 'PCE':
        result = evaluateCPI(event, customMetrics);
        break;
      case 'NFP':
      case 'JOBLESS_CLAIMS':
        result = evaluateNFP(event, customMetrics);
        break;
      case 'FOMC':
        result = evaluateFOMC(event, customMetrics);
        break;
      case 'BOJ':
        result = evaluateBOJ(event, customMetrics);
        break;
      case 'PPI':
        result = evaluatePPI(event, customMetrics);
        break;
      case 'RETAIL_SALES':
        result = evaluateRetailSales(event, customMetrics);
        break;
      default:
        result = evaluateGeneralMacro(event, customMetrics);
        break;
    }

    // Attach mathematical expectation calculations if not already present
    if (!result.mathematicalExpectation) {
      result.mathematicalExpectation = calculateMathematicalExpectation(event, customMetrics);
    }

    // Attach 5-Pillar Macro Confirmation Architecture
    if (!result.confirmationPillars) {
      result.confirmationPillars = generateConfirmationPillars(event, customMetrics);
    }

    const mathExpectation = result.mathematicalExpectation;
    const isUpcoming = event.status !== 'RELEASED' && event.actual === null && customMetrics?.actual === undefined && customMetrics?.headlineYoYActual === undefined && customMetrics?.headlineActual === undefined;

    // Determine whether the active model/event state is Bullish for the event currency
    let isBullishForEventCurrency = false;
    let isStrongConviction = false;

    if (isUpcoming) {
      // In Pre-Release / Upcoming state, use the Econometric Expectation Nowcast skew
      const skew = mathExpectation.skewDirection;
      const zScore = mathExpectation.statisticalZScore;
      const eventCode = event.code;
      const currency = (event.currency || 'USD').toUpperCase();

      if (currency === 'GBP' && eventCode === 'NFP') {
        // For UK Claimant Count: A negative delta (fewer benefit claims) is BULLISH for GBP
        isBullishForEventCurrency = mathExpectation.leadingIndicatorScore >= 0;
      } else if (skew === 'UPSIDE_BEAT' || mathExpectation.netExpectedSurpriseDelta > 0 || mathExpectation.leadingIndicatorScore > 0) {
        isBullishForEventCurrency = true;
      } else {
        isBullishForEventCurrency = false;
      }

      isStrongConviction = Math.abs(zScore) >= 1.2 || Math.abs(mathExpectation.leadingIndicatorScore) >= 60;
    } else {
      // Released or simulated state
      isBullishForEventCurrency = result.verdict === 'HAWKISH_SURPRISE' || 
                                  result.verdict === 'GOLDILOCKS_CONTINUATION';
      isStrongConviction = result.confidenceScore >= 88;
    }

    // Refine verdict label for Pre-Release expectation clarity (not claiming to be live stream when unreleased)
    if (isUpcoming) {
      if (event.currency === 'GBP' && (event.title.toLowerCase().includes('claimant') || event.title.toLowerCase().includes('labor') || event.code === 'NFP')) {
        result.verdictLabel = 'UK LABOR PRE-RELEASE EXPECTATION MATRIX';
      } else if (!result.verdictLabel.includes('EXPECTATION')) {
        result.verdictLabel = result.verdictLabel.replace('LIVE STREAMING', 'MARKET EXPECTATION:').replace('MATRIX ACTIVE', 'EXPECTATION MATRIX');
      }
    }

    // Ensure every asset impact has an active, mathematically consistent actionDirective
    result.assetImpacts = result.assetImpacts.map((asset): AssetImpact => {
      // If the asset already has an explicit released bias that is not WATCH/STAND ASIDE, use it, but check base/quote inversion consistency
      const resolved = resolveAssetTransmissionVector(
        asset,
        event,
        isBullishForEventCurrency,
        isStrongConviction
      );

      // Enhance scenarios with exact base/quote consistency
      const upsideResolved = resolveAssetTransmissionVector(asset, event, true, true);
      const downsideResolved = resolveAssetTransmissionVector(asset, event, false, true);

      const enhancedUpside = asset.upsideScenario ? {
        ...asset.upsideScenario,
        action: upsideResolved.action,
        rationale: asset.upsideScenario.rationale || upsideResolved.rationale || '',
      } : {
        trigger: 'Hawkish / Upside Beat Print',
        action: upsideResolved.action,
        targetPrice: '+50-80 pips target',
        stopLoss: '-25 pips risk',
        expectedMove: '+50 to +85 pips',
        rationale: upsideResolved.rationale || 'Upside surprise execution vector.',
      };

      const enhancedDownside = asset.downsideScenario ? {
        ...asset.downsideScenario,
        action: downsideResolved.action,
        rationale: asset.downsideScenario.rationale || downsideResolved.rationale || '',
      } : {
        trigger: 'Dovish / Downside Miss Print',
        action: downsideResolved.action,
        targetPrice: '-50-80 pips target',
        stopLoss: '+25 pips risk',
        expectedMove: '-50 to -85 pips',
        rationale: downsideResolved.rationale || 'Downside surprise execution vector.',
      };

      const isCurrentStandAside = asset.action === 'STAND ASIDE' || asset.action === 'FADE SPIKES' || isUpcoming;

      return {
        ...asset,
        actionDirective: resolved.directive,
        action: isCurrentStandAside ? resolved.action : asset.action,
        bias: isUpcoming ? resolved.bias : (asset.bias === 'WATCH' ? resolved.bias : asset.bias),
        upsideScenario: enhancedUpside,
        downsideScenario: enhancedDownside,
      };
    });

    // 4. OTIVO AI Macro Synthesis & Institutional Playbook Direction Spike Decision Integration
    const directionSpikeDecision = calculateDirectionSpikeDecision(
      event,
      mathExpectation,
      result.confirmationPillars,
      result.aiSynthesis
    );

    // Merge any missing affected market pairs from the Playbook Decision Engine into assetImpacts
    const existingSymbols = new Set(result.assetImpacts.map(a => a.symbol.toUpperCase()));
    for (const pair of directionSpikeDecision.affectedPairs) {
      if (!existingSymbols.has(pair.symbol.toUpperCase())) {
        result.assetImpacts.push({
          symbol: pair.symbol,
          name: pair.name,
          category: pair.category,
          bias: pair.directive.includes('BUY') ? 'STRONG_BUY' : 'STRONG_SELL',
          action: pair.action,
          actionDirective: pair.directive,
          confidence: pair.confidence,
          magnitude: 'HIGH',
          expectedMove: pair.expectedMove,
          transmissionRationale: pair.playbookRule,
          invalidationTrigger: pair.invalidationZone,
          correlationRank: result.assetImpacts.length + 1,
          primaryDriver: directionSpikeDecision.groundedPlaybookTopic,
          transmissionSpeed: 'INSTANT (0-30s)',
          currentPosture: `Pre-Release Spike Alignment: Targeting ${pair.targetZone}`,
          upsideScenario: {
            trigger: 'Hawkish Beat Vector (+70-110 pips)',
            action: pair.isQuotePair ? 'SHORT' : 'LONG',
            targetPrice: pair.targetZone,
            stopLoss: pair.invalidationZone,
            expectedMove: pair.expectedMove,
            rationale: pair.playbookRule
          },
          downsideScenario: {
            trigger: 'Dovish Miss Vector (-70-110 pips)',
            action: pair.isQuotePair ? 'LONG' : 'SHORT',
            targetPrice: pair.targetZone,
            stopLoss: pair.invalidationZone,
            expectedMove: pair.expectedMove,
            rationale: pair.playbookRule
          }
        });
      }
    }

    // Attach institutional AI Macro Synthesis if not present or missing directionSpikeDecision
    if (!result.aiSynthesis || !result.aiSynthesis.directionSpikeDecision) {
      const generatedSynthesis = generateInstitutionalSynthesisFromPlaybook(
        event,
        mathExpectation,
        result.confirmationPillars
      );
      result.aiSynthesis = {
        ...(result.aiSynthesis || {}),
        ...generatedSynthesis,
        directionSpikeDecision
      };
    } else {
      result.aiSynthesis.directionSpikeDecision = directionSpikeDecision;
    }

    return result;
  }
}

export const HISTORIC_SCENARIOS: HistoricScenario[] = [
  {
    id: 'hist-cpi-disinflation',
    name: 'June 2024 US CPI Disinflation Surprise',
    date: '2024-06-12',
    eventCode: 'CPI',
    eventTitle: 'US Consumer Price Index (CPI YoY)',
    country: 'United States',
    contextSummary:
      'Headline CPI printed at 3.0% YoY vs 3.1% consensus, with Core CPI MoM sliding to +0.06% (rounded to 0.1%). Shelter inflation slowed notably.',
    marketOutcome:
      'Gold rallied +$38/oz (+1.6%), DXY dropped 90 points, US 10Y yields collapsed 14 bps, S&P 500 hit new record highs.',
    eventData: {
      actual: 3.0,
      forecast: 3.1,
      previous: 3.3,
      unit: '%',
      metrics: {
        headlineYoYActual: 3.0,
        headlineYoYForecast: 3.1,
        coreYoYActual: 3.3,
        coreYoYForecast: 3.4,
        coreMoMActual: 0.1,
        coreMoMForecast: 0.2,
        shelterInflationMoM: 0.28,
        priorPpiSignal: 'COOL',
      },
    },
  },
  {
    id: 'hist-nfp-sahm-rule',
    name: 'August 2024 US NFP Labor Freeze & Sahm Rule Shock',
    date: '2024-08-02',
    eventCode: 'NFP',
    eventTitle: 'US Non-Farm Payrolls & Unemployment Rate',
    country: 'United States',
    contextSummary:
      'Payrolls added only 114k jobs vs 175k expected, unemployment jumped from 4.1% to 4.3% (triggering the Sahm Rule recession indicator), and prior months were revised down by -29k.',
    marketOutcome:
      'US 10Y yield dropped 20 bps, markets rapidly priced a 50bps emergency Fed rate cut, triggering worldwide carry trade unwinds.',
    eventData: {
      actual: 114,
      forecast: 175,
      previous: 179,
      unit: 'k',
      metrics: {
        headlineActual: 114,
        headlineForecast: 175,
        unemploymentActual: 4.3,
        unemploymentForecast: 4.1,
        avgHourlyEarningsMoMActual: 0.2,
        avgHourlyEarningsMoMForecast: 0.3,
        priorRevisionsNet: -29,
        laborForceParticipation: 62.7,
      },
    },
  },
  {
    id: 'hist-boj-rate-hike',
    name: 'July 2024 Bank of Japan Rate Hike to 0.25%',
    date: '2024-07-31',
    eventCode: 'BOJ',
    eventTitle: 'BOJ Monetary Policy Decision & YCC Termination',
    country: 'Japan',
    contextSummary:
      'Bank of Japan unexpectedly hiked interest rates by 15 bps to 0.25% and announced plan to halve monthly JGB bond purchases to ¥3 Trillion.',
    marketOutcome:
      'USD/JPY plunged over 800 pips in subsequent trading days from 155.00 to 142.00 as massive global Yen carry trades liquidated.',
    eventData: {
      actual: 0.25,
      forecast: 0.10,
      previous: 0.10,
      unit: '%',
      metrics: {
        policyRateActual: 0.25,
        policyRateForecast: 0.10,
        rateChangeBps: 15,
        yccBandStatus: 'ABOLISHED',
        monthlyJgbBondBuyingTrillionYen: 3.0,
        governorUedaTone: 'HAWKISH',
      },
    },
  },
  {
    id: 'hist-fomc-dovish-pivot',
    name: 'September 2024 FOMC 50bps Jumbo Rate Cut',
    date: '2024-09-18',
    eventCode: 'FOMC',
    eventTitle: 'FOMC Interest Rate Decision & Dot Plot',
    country: 'United States',
    contextSummary:
      'Federal Reserve commenced easing cycle with a jumbo 50 bps cut to 4.75%-5.00%, with dot plot projecting another 50 bps of cuts before year end.',
    marketOutcome:
      'Gold skyrocketed past $2,600/oz to fresh all-time highs; S&P 500 broke above 5,700; USD declined across all majors.',
    eventData: {
      actual: 4.88,
      forecast: 5.13,
      previous: 5.38,
      unit: '%',
      metrics: {
        targetRateActual: 4.88,
        targetRateForecast: 5.13,
        rateChangeBps: -50,
        dotPlotMedianShift: -50,
        qtTaperAnnounced: true,
        statementSkew: 'DOVISH',
        pressConferenceTone: 'DOVISH',
      },
    },
  },
  {
    id: 'hist-ppi-pipeline-shock',
    name: 'January 2024 Upstream PPI Inflation Spike',
    date: '2024-02-16',
    eventCode: 'PPI',
    eventTitle: 'US Producer Price Index (PPI MoM)',
    country: 'United States',
    contextSummary:
      'PPI Final Demand jumped +0.3% MoM vs +0.1% expected, driven by service costs and healthcare portfolio management inputs.',
    marketOutcome:
      'US 10Y yields jumped 8 bps, pushing early spring Fed rate cut bets out to summer. DXY rallied 50 points.',
    eventData: {
      actual: 0.3,
      forecast: 0.1,
      previous: -0.1,
      unit: '%',
      metrics: {
        headlineMoMActual: 0.3,
        headlineMoMForecast: 0.1,
        coreMoMActual: 0.5,
        coreMoMForecast: 0.1,
        servicesMoMActual: 0.6,
      },
    },
  },
];
