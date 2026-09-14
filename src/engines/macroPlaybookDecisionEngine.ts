import { 
  EconomicEvent, 
  MathematicalExpectation, 
  MacroConfirmationPillars, 
  AiSynthesis, 
  DirectionSpikeDecision, 
  DirectionSpikeItem, 
  AssetImpact,
  AssetCategory,
  TacticalAction,
  MarketBias
} from '../types';
import { MACRO_KNOWLEDGE_TOPICS, MacroKnowledgeTopic } from '../data/macroKnowledgeBase';

/**
 * Maps an incoming EconomicEvent to the closest MacroKnowledgeTopic from the Playbook
 */
export function getMatchingMacroPlaybookTopic(event: EconomicEvent): MacroKnowledgeTopic | undefined {
  const title = (event.title || '').toLowerCase();
  const code = (event.code || '').toLowerCase();
  const currency = (event.currency || '').toUpperCase();
  const country = (event.country || '').toUpperCase();

  // 1. Central Bank Rate Decisions
  if (title.includes('ecb') || title.includes('refinancing') || (currency === 'EUR' && (title.includes('rate') || title.includes('monetary')))) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'ecb-refinancing-rate');
  }
  if (title.includes('fomc') || title.includes('fed funds') || title.includes('federal funds') || title.includes('interest rate decision') && currency === 'USD') {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'fomc-fed-funds');
  }
  if (title.includes('boj') || title.includes('bank of japan') || currency === 'JPY' && title.includes('rate')) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'boj-yield-curve-carry');
  }
  if (title.includes('snb') || title.includes('swiss national bank') || currency === 'CHF' && title.includes('rate')) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'snb-swiss-rate');
  }
  if (title.includes('boc') || title.includes('bank of canada') || currency === 'CAD' && title.includes('overnight rate')) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'boc-cash-rate');
  }
  if (title.includes('rba') || title.includes('rbnz') || title.includes('ocr') || title.includes('cash rate') || (['AUD', 'NZD'].includes(currency) && title.includes('rate'))) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'ocr-cash-rate');
  }
  if (title.includes('overnight') || title.includes('interbank') || title.includes('liquidity') || title.includes('repo')) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'overnight-rate-interbank');
  }

  // 2. Inflation Metrics
  if (code.includes('cpi') || title.includes('cpi') || title.includes('consumer price') || title.includes('harmonised consumer')) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'cpi-inflation');
  }
  if (code.includes('ppi') || title.includes('ppi') || title.includes('producer price')) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'ppi-wholesale');
  }

  // 3. Labor & Employment
  if (code.includes('nfp') || title.includes('non-farm') || title.includes('payrolls') || title.includes('jobless') || title.includes('unemployment') || title.includes('employment') || title.includes('claimant')) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'nfp-labor-market');
  }

  // 4. Growth & Consumer
  if (title.includes('gdp') || title.includes('gross domestic')) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'gdp-economic-growth');
  }
  if (title.includes('retail') || title.includes('consumer confidence') || title.includes('michigan')) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'retail-sales-consumer');
  }

  // Default fallback to CPI or Central Banks by currency
  if (['USD', 'EUR', 'GBP'].includes(currency)) {
    return MACRO_KNOWLEDGE_TOPICS.find(t => t.id === 'cpi-inflation');
  }

  return MACRO_KNOWLEDGE_TOPICS[0];
}

/**
 * Calculates the complete OTIVO AI Macro Synthesis & Institutional Playbook Direction Spike Decision
 * for all affected market pairs.
 */
export function calculateDirectionSpikeDecision(
  event: EconomicEvent,
  mathExp: MathematicalExpectation,
  confirmationPillars?: MacroConfirmationPillars,
  existingSynthesis?: AiSynthesis
): DirectionSpikeDecision {
  const currency = (event.currency || 'USD').toUpperCase();
  const topic = getMatchingMacroPlaybookTopic(event);
  const topicTitle = topic ? topic.title : `${currency} Macro Release`;

  // Determine overall directional bias for the event currency
  const isHawkishSkew = mathExp.skewDirection === 'UPSIDE_BEAT' || 
                        mathExp.probabilities.upsideBeatPercent > 45 || 
                        mathExp.netExpectedSurpriseDelta > 0 ||
                        (confirmationPillars && confirmationPillars.overallConfirmationScore >= 60);

  const isDovishSkew = mathExp.skewDirection === 'DOWNSIDE_MISS' || 
                       mathExp.probabilities.downsideMissPercent > 45 || 
                       mathExp.netExpectedSurpriseDelta < 0;

  const bias: 'BULLISH' | 'BEARISH' | 'VOLATILITY_WHIPSAW' | 'NEUTRAL' = 
    isHawkishSkew ? 'BULLISH' : isDovishSkew ? 'BEARISH' : 'VOLATILITY_WHIPSAW';

  const confidencePercent = Math.max(
    65,
    Math.min(95, Math.round((mathExp.probabilities.upsideBeatPercent || 50) + (confirmationPillars?.overallConfirmationScore ? confirmationPillars.overallConfirmationScore * 0.3 : 15)))
  );

  const isStrongConviction = confidencePercent >= 82;

  // Build the list of all affected market pairs & cross assets
  const affectedPairs: DirectionSpikeItem[] = [];

  // Helper to add affected pair with accurate transmission logic
  const addPair = (
    symbol: string,
    name: string,
    category: AssetCategory,
    isBasePair: boolean,
    isQuotePair: boolean,
    isBullishSpike: boolean,
    pipsMove: string,
    target: string,
    invalidation: string,
    rule: string
  ) => {
    const spikeDirection = isBullishSpike ? 'BULLISH_SPIKE' : 'BEARISH_SPIKE';
    const directive = isBullishSpike 
      ? (isStrongConviction ? 'STRONG BUY' : 'BUY') 
      : (isStrongConviction ? 'STRONG SELL' : 'SELL');
    const action: TacticalAction = isBullishSpike ? 'LONG' : 'SHORT';

    affectedPairs.push({
      symbol,
      name,
      category,
      isBasePair,
      isQuotePair,
      spikeDirection,
      directive,
      action,
      expectedMove: pipsMove,
      targetZone: target,
      invalidationZone: invalidation,
      playbookRule: rule,
      confidence: Math.round(confidencePercent * (category === 'FX' ? 1 : 0.94))
    });
  };

  // =========================================================================
  // 1. EUR CURRENCY CATALYSTS (e.g. ECB Rates, Eurozone CPI, German PMI)
  // =========================================================================
  if (currency === 'EUR') {
    const eurBullish = bias === 'BULLISH';
    
    // Direct Base Pairs (EUR is BASE)
    addPair('EUR/USD', 'Euro / US Dollar', 'FX', true, false, eurBullish, eurBullish ? '+75 to +115 pips' : '-70 to -110 pips', eurBullish ? '1.0940 Breakout Resistance' : '1.0790 Support Floor', eurBullish ? '1.0820 Invalidation' : '1.0910 Invalidation', 'Direct Base Transmission: EUR yield premium repricing drives upward breakout against USD.');
    addPair('EUR/GBP', 'Euro / British Pound', 'FX', true, false, eurBullish, eurBullish ? '+45 to +75 pips' : '-40 to -70 pips', eurBullish ? '0.8640 Regional High' : '0.8490 Key Support', eurBullish ? '0.8520 Stop Level' : '0.8610 Stop Level', 'Direct Base Transmission: Captures clean European central bank divergence against Bank of England policy.');
    addPair('EUR/JPY', 'Euro / Japanese Yen', 'FX', true, false, eurBullish, eurBullish ? '+110 to +185 pips' : '-100 to -165 pips', eurBullish ? '164.50 Carry Expansion' : '160.80 Carry Unwind', eurBullish ? '161.90 Invalidation' : '163.80 Invalidation', 'High-Beta Carry Cross: Front-end EUR rate widening accelerates capital allocation into EUR/JPY.');
    addPair('EUR/CAD', 'Euro / Canadian Dollar', 'FX', true, false, eurBullish, eurBullish ? '+60 to +95 pips' : '-55 to -90 pips', eurBullish ? '1.4980 Multi-Week High' : '1.4750 Support Shelf', eurBullish ? '1.4810 Pivot SL' : '1.4920 Pivot SL', 'Direct Base Transmission: Divergence against Bank of Canada easing path.');
    addPair('EUR/AUD', 'Euro / Australian Dollar', 'FX', true, false, eurBullish, eurBullish ? '+70 to +110 pips' : '-65 to -105 pips', eurBullish ? '1.6620 Resistance Zone' : '1.6340 Liquidity Pool', eurBullish ? '1.6410 Stop' : '1.6560 Stop', 'Cross-Rate Transmission: Risk-adjusted spread between European growth and Antipodean terms of trade.');
    addPair('EUR/CHF', 'Euro / Swiss Franc', 'FX', true, false, eurBullish, eurBullish ? '+40 to +65 pips' : '-35 to -60 pips', eurBullish ? '0.9480 Channel Ceiling' : '0.9280 SNB Safe Haven Floor', eurBullish ? '0.9320 Invalidation' : '0.9440 Invalidation', 'SNB Floor Correlation: Safe-haven flows vs European terminal rate expectations.');
    
    // Cross-Asset & Inverse Basket
    addPair('DXY', 'US Dollar Index', 'FX', false, false, !eurBullish, eurBullish ? '-50 to -85 pts' : '+55 to +90 pts', eurBullish ? '103.60 Dollar Floor' : '105.40 Dollar Resistance', eurBullish ? '104.80 Invalidation' : '103.90 Invalidation', 'Inverse FX Basket (EUR = 57.6% DXY Weight): EUR strength forces broad Dollar Index devaluation.');
    addPair('DE10Y', 'German 10-Year Bund Yield', 'YIELDS', false, false, eurBullish, eurBullish ? '+7 to +14 bps' : '-6 to -13 bps', eurBullish ? '2.48% Yield Peak' : '2.24% Yield Support', eurBullish ? '2.31% SL' : '2.42% SL', 'Sovereign Debt Benchmark: Front-end and benchmark Eurozone yields immediately reprice policy trajectory.');
    addPair('DAX 40', 'German Stock Index (DAX)', 'INDICES', false, false, !eurBullish, eurBullish ? '-140 to -240 pts' : '+150 to +260 pts', eurBullish ? '18,850 Valuation Drag' : '19,450 Liquidity Rally', eurBullish ? '19,200 Stop' : '19,050 Stop', 'Equity Discounting: Higher rates increase corporate borrowing costs and discount rates on European equities.');
    addPair('XAU/USD', 'Spot Gold', 'COMMODITIES', false, false, !eurBullish, eurBullish ? '-$15 to -$30/oz' : '+$20 to +$40/oz', eurBullish ? '$2,885 Pullback' : '$2,945 Bullion Spike', eurBullish ? '$2,925 SL' : '$2,895 SL', 'Opportunity Cost Model: Higher European risk-free yields mildly elevate opportunity costs for physical gold.');
  }

  // =========================================================================
  // 2. USD CURRENCY CATALYSTS (e.g. US CPI, PPI, NFP, FOMC, Fed Funds)
  // =========================================================================
  else if (currency === 'USD') {
    const usdBullish = bias === 'BULLISH';

    // Inverse Quote Pairs (USD is QUOTE: when USD is Bullish, these pairs SELL)
    addPair('EUR/USD', 'Euro / US Dollar', 'FX', false, true, !usdBullish, usdBullish ? '-75 to -120 pips' : '+80 to +130 pips', usdBullish ? '1.0780 Support Sweep' : '1.0960 Breakout Ceiling', usdBullish ? '1.0890 Invalidation' : '1.0810 Invalidation', 'Inverse Quote Transmission: USD denominator strength forces EUR/USD into sharp downward impulse.');
    addPair('GBP/USD', 'British Pound / US Dollar', 'FX', false, true, !usdBullish, usdBullish ? '-85 to -135 pips' : '+90 to +145 pips', usdBullish ? '1.2820 Demand Block' : '1.3050 Supply Run', usdBullish ? '1.2970 Invalidation' : '1.2870 Invalidation', 'High-Beta Inverse Quote: Highly reactive to US real yield and Federal Reserve rate expectations.');
    addPair('AUD/USD', 'Australian Dollar / US Dollar', 'FX', false, true, !usdBullish, usdBullish ? '-60 to -95 pips' : '+65 to +105 pips', usdBullish ? '0.6480 Commodity Floor' : '0.6650 Expansion Target', usdBullish ? '0.6580 Invalidation' : '0.6510 Invalidation', 'Pro-cyclical Commodity Pair: Vulnerable to USD dollar liquidity tightening and higher Treasury yields.');
    addPair('NZD/USD', 'New Zealand Dollar / US Dollar', 'FX', false, true, !usdBullish, usdBullish ? '-55 to -85 pips' : '+60 to +95 pips', usdBullish ? '0.5890 Support Shelf' : '0.6080 Resistance Test', usdBullish ? '0.6010 Stop' : '0.5920 Stop', 'Antipodean Inverse Cross: Tracks global risk appetite and US interest rate trajectory.');

    // Direct Base Pairs (USD is BASE: when USD is Bullish, these pairs BUY)
    addPair('USD/JPY', 'US Dollar / Japanese Yen', 'FX', true, false, usdBullish, usdBullish ? '+110 to +190 pips' : '-120 to -210 pips', usdBullish ? '154.50 Carry Breakout' : '149.80 Liquidity Flush', usdBullish ? '151.20 Invalidation' : '153.60 Invalidation', 'Direct Base Transmission (US-JP Yield Spread): 93% correlated with US 10Y and 2Y Treasury rate differentials.');
    addPair('USD/CAD', 'US Dollar / Canadian Dollar', 'FX', true, false, usdBullish, usdBullish ? '+55 to +90 pips' : '-50 to -85 pips', usdBullish ? '1.3890 Resistance High' : '1.3680 Trendline Floor', usdBullish ? '1.3730 Invalidation' : '1.3840 Invalidation', 'Direct Base Transmission: Widening Fed-BOC policy rate spread drives USD/CAD upward.');
    addPair('USD/CHF', 'US Dollar / Swiss Franc', 'FX', true, false, usdBullish, usdBullish ? '+50 to +80 pips' : '-45 to -75 pips', usdBullish ? '0.8980 Pivot Target' : '0.8780 Safe-Haven Low', usdBullish ? '0.8830 Stop' : '0.8940 Stop', 'Direct Base Transmission: Interest rate carry spread over Swiss National Bank policy rate.');

    // Cross-Asset Instruments
    addPair('DXY', 'US Dollar Index', 'FX', true, false, usdBullish, usdBullish ? '+70 to +115 pts' : '-75 to -120 pts', usdBullish ? '105.80 Resistance Wall' : '103.40 Liquidity Void', usdBullish ? '104.10 Stop' : '105.10 Stop', 'Benchmark Dollar Metric: Aggregated trade-weighted US Dollar strength indicator.');
    addPair('US10Y', 'US 10-Year Treasury Yield', 'YIELDS', false, false, usdBullish, usdBullish ? '+9 to +18 bps' : '-8 to -17 bps', usdBullish ? '4.55% Curve Steepening' : '4.18% Curve Bull-Flattening', usdBullish ? '4.30% Stop' : '4.46% Stop', 'Core Risk-Free Sovereign Asset: Fundamental pricing foundation for global credit and exchange rates.');
    addPair('XAU/USD', 'Spot Gold', 'COMMODITIES', false, false, !usdBullish, usdBullish ? '-$35 to -$60/oz' : '+$40 to +$70/oz', usdBullish ? '$2,865 Demand Block' : '$2,965 High Target', usdBullish ? '$2,935 Invalidation' : '$2,880 Invalidation', 'Real Yield Arbitrage (TIPS Correlation): Non-yielding physical gold heavily depreciates when real yields surge.');
    addPair('NAS100 / SPX', 'US Equities (Nasdaq & S&P 500)', 'INDICES', false, false, !usdBullish, usdBullish ? '-1.5% to -2.8%' : '+1.6% to +3.0%', usdBullish ? 'Support Test & Multiple Compression' : 'Short-Covering Breakout Rally', usdBullish ? 'Previous Day High SL' : 'Previous Day Low SL', 'Equity Multiple Discounting: Higher cost of capital compress price-to-earnings valuations on technology equities.');
  }

  // =========================================================================
  // 3. GBP CURRENCY CATALYSTS (e.g. BoE Rates, UK CPI, GDP, Claimant Count)
  // =========================================================================
  else if (currency === 'GBP') {
    const gbpBullish = bias === 'BULLISH';

    addPair('GBP/USD', 'British Pound / US Dollar', 'FX', true, false, gbpBullish, gbpBullish ? '+75 to +125 pips' : '-70 to -120 pips', gbpBullish ? '1.3080 Key Resistance' : '1.2820 Demand Pool', gbpBullish ? '1.2880 Invalidation' : '1.3010 Invalidation', 'Direct Base Transmission: UK monetary policy rate expectations dictate front-end cable pricing.');
    addPair('EUR/GBP', 'Euro / British Pound', 'FX', false, true, !gbpBullish, gbpBullish ? '-45 to -75 pips' : '+45 to +80 pips', gbpBullish ? '0.8460 Channel Support' : '0.8650 Breakout High', gbpBullish ? '0.8580 Stop' : '0.8490 Stop', 'Inverse Quote Transmission: GBP denominator strengthening forces EUR/GBP into immediate sell-off.');
    addPair('GBP/JPY', 'British Pound / Japanese Yen', 'FX', true, false, gbpBullish, gbpBullish ? '+120 to +210 pips' : '-115 to -195 pips', gbpBullish ? '198.50 High-Beta Expansion' : '193.40 Liquidity Sweep', gbpBullish ? '194.80 Invalidation' : '197.20 Invalidation', 'High-Beta Sterling Cross: Aggressive carry momentum driven by UK gilt yield differentials.');
    addPair('GBP/AUD', 'British Pound / Australian Dollar', 'FX', true, false, gbpBullish, gbpBullish ? '+65 to +105 pips' : '-60 to -100 pips', gbpBullish ? '1.9820 High' : '1.9450 Low', gbpBullish ? '1.9540 Stop' : '1.9730 Stop', 'Direct Cross Transmission: UK economic health vs commodity exporter balance.');
    addPair('UK10Y', 'UK 10-Year Gilt Yield', 'YIELDS', false, false, gbpBullish, gbpBullish ? '+8 to +15 bps' : '-7 to -14 bps', gbpBullish ? '4.25% Gilt Peak' : '3.88% Gilt Trough', gbpBullish ? '3.98% Stop' : '4.15% Stop', 'UK Sovereign Yield Benchmark: Reprices Bank of England Monetary Policy Committee (MPC) path.');
    addPair('FTSE 100 / UK100', 'UK Equity Index', 'INDICES', false, false, !gbpBullish, gbpBullish ? '-65 to -115 pts' : '+70 to +125 pts', gbpBullish ? '8,250 Margin Squeeze' : '8,480 Exporter Rally', gbpBullish ? '8,390 Stop' : '8,310 Stop', 'Currency Drag & Yield Cost: Strong GBP reduces foreign revenue translations for FTSE multinationals.');
  }

  // =========================================================================
  // 4. JPY CURRENCY CATALYSTS (e.g. BOJ Rate Decision, Tokyo CPI, GDP)
  // =========================================================================
  else if (currency === 'JPY') {
    const jpyBullish = bias === 'BULLISH'; // JPY strengthening means USD/JPY, EUR/JPY, GBP/JPY SELL!

    addPair('USD/JPY', 'US Dollar / Japanese Yen', 'FX', false, true, !jpyBullish, jpyBullish ? '-130 to -240 pips' : '+125 to +230 pips', jpyBullish ? '149.50 Carry Unwind Floor' : '155.80 Carry Re-acceleration', jpyBullish ? '153.80 Invalidation' : '150.90 Invalidation', 'Inverse Quote Transmission: JPY denominator strengthening sparks massive carry trade liquidation.');
    addPair('EUR/JPY', 'Euro / Japanese Yen', 'FX', false, true, !jpyBullish, jpyBullish ? '-140 to -260 pips' : '+135 to +250 pips', jpyBullish ? '160.20 Major Floor' : '166.50 Resistance Top', jpyBullish ? '164.20 Stop' : '161.80 Stop', 'Inverse Quote Transmission: Cross-currency carry unwind across European institutional accounts.');
    addPair('GBP/JPY', 'British Pound / Japanese Yen', 'FX', false, true, !jpyBullish, jpyBullish ? '-160 to -300 pips' : '+155 to +290 pips', jpyBullish ? '192.50 Demand Base' : '200.50 Channel Top', jpyBullish ? '197.80 Invalidation' : '194.20 Invalidation', 'Inverse Quote Transmission: Highest-volatility G10 cross unwind on BOJ tightening.');
    addPair('AUD/JPY', 'Australian Dollar / Japanese Yen', 'FX', false, true, !jpyBullish, jpyBullish ? '-120 to -220 pips' : '+115 to +210 pips', jpyBullish ? '97.20 Risk-Off Target' : '102.80 Risk-On Target', jpyBullish ? '100.80 Stop' : '98.50 Stop', 'Risk Appetite Barometer: Classic global carry trade unwind pairing.');
    addPair('JP10Y', 'Japan 10-Year JGB Yield', 'YIELDS', false, false, jpyBullish, jpyBullish ? '+6 to +12 bps' : '-5 to -10 bps', jpyBullish ? '1.15% Yield Cap Test' : '0.85% Easing Floor', jpyBullish ? '0.94% Stop' : '1.08% Stop', 'JGB Curve Repricing: Direct benchmark representation of Bank of Japan policy normalisation.');
    addPair('Nikkei 225', 'Japan Stock Index (N225)', 'INDICES', false, false, !jpyBullish, jpyBullish ? '-550 to -950 pts' : '+600 to +1050 pts', jpyBullish ? '37,500 Exporter Drag' : '39,800 Devaluation Rally', jpyBullish ? '38,900 Stop' : '38,100 Stop', 'Exporter Margin Compression: Strong JPY devalues Japanese mega-cap exporter overseas earnings.');
  }

  // =========================================================================
  // 5. CAD CURRENCY CATALYSTS (e.g. BOC Rate, Building Permits, CPI)
  // =========================================================================
  else if (currency === 'CAD') {
    const cadBullish = bias === 'BULLISH';

    addPair('USD/CAD', 'US Dollar / Canadian Dollar', 'FX', false, true, !cadBullish, cadBullish ? '-65 to -105 pips' : '+60 to +100 pips', cadBullish ? '1.3680 Support Basin' : '1.3920 Resistance Breakout', cadBullish ? '1.3830 Invalidation' : '1.3720 Invalidation', 'Inverse Quote Transmission: CAD denominator strengthening pulls USD/CAD into sharp breakdown.');
    addPair('EUR/CAD', 'Euro / Canadian Dollar', 'FX', false, true, !cadBullish, cadBullish ? '-60 to -95 pips' : '+55 to +90 pips', cadBullish ? '1.4780 Channel Support' : '1.5020 High', cadBullish ? '1.4930 Stop' : '1.4820 Stop', 'Inverse Quote Transmission: Euro vs Loonie policy divergence.');
    addPair('CAD/JPY', 'Canadian Dollar / Japanese Yen', 'FX', true, false, cadBullish, cadBullish ? '+85 to +145 pips' : '-80 to -135 pips', cadBullish ? '112.50 Expansion Peak' : '108.40 Unwind Floor', cadBullish ? '109.80 Stop' : '111.40 Stop', 'Direct Base Transmission: Oil and interest rate carry cross.');
    addPair('CA10Y', 'Canada 10-Year Sovereign Yield', 'YIELDS', false, false, cadBullish, cadBullish ? '+7 to +13 bps' : '-6 to -12 bps', cadBullish ? '3.55% Yield Target' : '3.18% Yield Target', cadBullish ? '3.29% Stop' : '3.44% Stop', 'Sovereign Debt Benchmark: Tracks Bank of Canada policy rate adjustments.');
    addPair('WTI Crude Oil', 'Crude Oil Spot / Futures', 'COMMODITIES', false, false, cadBullish, cadBullish ? '+$1.80 to +$3.20/bbl' : '-$1.50 to -$2.80/bbl', cadBullish ? '$74.50 Commodity Demand' : '$68.20 Demand Slump', cadBullish ? '$70.50 SL' : '$72.80 SL', 'Terms of Trade Conduit: Canadian economy and Loonie share high co-integration with global energy demand.');
  }

  // =========================================================================
  // 6. AUD & NZD CURRENCY CATALYSTS (e.g. RBA, RBNZ, Employment, CPI)
  // =========================================================================
  else if (['AUD', 'NZD'].includes(currency)) {
    const isAud = currency === 'AUD';
    const currBullish = bias === 'BULLISH';

    if (isAud) {
      addPair('AUD/USD', 'Australian Dollar / US Dollar', 'FX', true, false, currBullish, currBullish ? '+65 to +105 pips' : '-60 to -100 pips', currBullish ? '0.6640 Resistance' : '0.6450 Demand Shelf', currBullish ? '0.6510 Stop' : '0.6590 Stop', 'Direct Base Transmission: Reserve Bank of Australia cash rate repricing against US Dollar.');
      addPair('EUR/AUD', 'Euro / Australian Dollar', 'FX', false, true, !currBullish, currBullish ? '-75 to -120 pips' : '+70 to +115 pips', currBullish ? '1.6320 Support Floor' : '1.6650 Channel Top', currBullish ? '1.6540 Stop' : '1.6390 Stop', 'Inverse Quote Transmission: AUD strength drives EUR/AUD lower.');
      addPair('AUD/JPY', 'Australian Dollar / Japanese Yen', 'FX', true, false, currBullish, currBullish ? '+95 to +160 pips' : '-90 to -150 pips', currBullish ? '102.50 Carry Peak' : '97.80 Liquidity Pullback', currBullish ? '99.20 Stop' : '101.40 Stop', 'Direct Base Transmission: High-yielding carry cross.');
      addPair('AUD/NZD', 'Australian Dollar / New Zealand Dollar', 'FX', true, false, currBullish, currBullish ? '+40 to +65 pips' : '-35 to -60 pips', currBullish ? '1.1080 Trans-Tasman High' : '1.0850 Low', currBullish ? '1.0910 Stop' : '1.1020 Stop', 'Direct Regional Cross: RBA vs RBNZ policy divergence.');
      addPair('ASX 200', 'Australia Stock Index (ASX200)', 'INDICES', false, false, !currBullish, currBullish ? '-55 to -95 pts' : '+60 to +100 pts', currBullish ? '8,150 Financials Drag' : '8,380 Easing Rally', currBullish ? '8,290 Stop' : '8,210 Stop', 'Equity Discounting: Higher cash rate compresses corporate multiples.');
    } else {
      addPair('NZD/USD', 'New Zealand Dollar / US Dollar', 'FX', true, false, currBullish, currBullish ? '+55 to +90 pips' : '-50 to -85 pips', currBullish ? '0.6080 Resistance' : '0.5880 Floor', currBullish ? '0.5940 Stop' : '0.6020 Stop', 'Direct Base Transmission: Reserve Bank of New Zealand Official Cash Rate (OCR) transmission.');
      addPair('NZD/JPY', 'New Zealand Dollar / Japanese Yen', 'FX', true, false, currBullish, currBullish ? '+85 to +140 pips' : '-80 to -130 pips', currBullish ? '93.50 High' : '89.20 Low', currBullish ? '90.50 Stop' : '92.40 Stop', 'Direct Base Transmission: RBNZ yield carry momentum.');
    }
  }

  // =========================================================================
  // 7. CHF / SWISS FRANC CATALYSTS (e.g. SNB Rate, Swiss CPI)
  // =========================================================================
  else if (currency === 'CHF') {
    const chfBullish = bias === 'BULLISH';

    addPair('USD/CHF', 'US Dollar / Swiss Franc', 'FX', false, true, !chfBullish, chfBullish ? '-55 to -90 pips' : '+50 to +85 pips', chfBullish ? '0.8750 Safe Haven Floor' : '0.8980 Resistance', chfBullish ? '0.8910 Stop' : '0.8810 Stop', 'Inverse Quote Transmission: SNB hawkish stance drives USD/CHF lower.');
    addPair('EUR/CHF', 'Euro / Swiss Franc', 'FX', false, true, !chfBullish, chfBullish ? '-45 to -75 pips' : '+40 to +70 pips', chfBullish ? '0.9280 Support' : '0.9480 Peak', chfBullish ? '0.9410 Stop' : '0.9320 Stop', 'Inverse Quote Transmission: Swiss Franc safe-haven floor test.');
    addPair('CHF/JPY', 'Swiss Franc / Japanese Yen', 'FX', true, false, chfBullish, chfBullish ? '+90 to +155 pips' : '-85 to -145 pips', chfBullish ? '175.50 Cross High' : '170.20 Pullback', chfBullish ? '171.80 Stop' : '174.10 Stop', 'Direct Base Transmission: Safe haven cross-asset differential.');
  }

  // Final Verdict Construction
  const primaryPair = affectedPairs[0]?.symbol || `${currency}/USD`;
  const primaryAction = affectedPairs[0]?.directive || (isHawkishSkew ? 'BUY' : 'SELL');
  const primaryPips = affectedPairs[0]?.expectedMove || '±75 pips';

  const verdict = isHawkishSkew 
    ? `BULLISH ${currency} IMPULSE / HAWKISH BREAKOUT` 
    : isDovishSkew 
    ? `BEARISH ${currency} IMPULSE / DOVISH SELL-OFF` 
    : `VOLATILITY SQUEEZE / TWO-WAY WHIPSAW`;

  const horizon = 'Peak Impulse: 00:00 - 15:00 min release spike | Session Drift: 1h - 4h';
  const primaryTransmissionVector = `${primaryAction} ${primaryPair} (${primaryPips}) driven by ${topicTitle} Playbook Rules and Econometric Skew (${mathExp.skewMagnitude}).`;

  return {
    verdict,
    bias,
    confidencePercent,
    horizon,
    primaryTransmissionVector,
    groundedPlaybookTopic: topic ? `${topic.title} (${topic.code})` : `${currency} Macro Playbook`,
    affectedPairs
  };
}

/**
 * Generates an institutional-grade AiSynthesis incorporating the Macro Playbook knowledge,
 * econometric nowcast, confirmation pillars, and all affected pairs direction spikes.
 */
export function generateInstitutionalSynthesisFromPlaybook(
  event: EconomicEvent,
  mathExp: MathematicalExpectation,
  confirmationPillars?: MacroConfirmationPillars
): AiSynthesis {
  const currency = (event.currency || 'USD').toUpperCase();
  const topic = getMatchingMacroPlaybookTopic(event);
  const directionSpikeDecision = calculateDirectionSpikeDecision(event, mathExp, confirmationPillars);

  const topPair = directionSpikeDecision.affectedPairs[0];
  const secondPair = directionSpikeDecision.affectedPairs[1];
  const crossPair = directionSpikeDecision.affectedPairs.find(p => p.category === 'YIELDS' || p.category === 'COMMODITIES') || directionSpikeDecision.affectedPairs[2];

  const macroSummary = topic 
    ? `Institutional Macro Synthesis confirms ${directionSpikeDecision.verdict} for ${event.title} (${currency}). Guided by the ${topic.title} Playbook, market pricing reflects ${directionSpikeDecision.confidencePercent}% model conviction. ${topic.overview.slice(0, 180)}...`
    : `Quantitative econometric models and Macro Playbook rules project ${directionSpikeDecision.verdict} on ${event.title}. Yield differentials and liquidity transmission dictate initial breakout momentum.`;

  const keyRisks = [
    `Inter-meeting central bank commentary or surprise press conference rhetoric deviating from baseline statement guidance.`,
    `Cross-asset liquidity contraction or severe options gamma imbalance across ${topPair?.symbol || currency} derivatives.`,
    `Companion economic revisions to previous months (${event.previous ?? 'N/A'}) altering the net econometric trajectory.`
  ];

  const playbookSteps = [
    `Execute ${topPair?.directive || 'LONG'} on ${topPair?.symbol || 'Primary Cross'} targeting ${topPair?.targetZone || 'Resistance'} (${topPair?.expectedMove || '+75 pips'}). Invalidation stop: ${topPair?.invalidationZone || 'Key Support'}.`,
    `Secondary Pair Play: Monitor ${secondPair?.symbol || 'Secondary Cross'} for ${secondPair?.directive || 'DIRECTIVE'} with expected move ${secondPair?.expectedMove || '±50 pips'}.`,
    `Cross-Asset Confirmation: Track ${crossPair?.symbol || 'Yields/Commodities'} (${crossPair?.directive || 'MONITOR'}) to confirm institutional real-money volume validation before scaling into position.`
  ];

  const volatilityForecast = `High implied volatility and spread widening across the first 00:00 - 15:00 min post-release window; structural trend continuation anticipated over the 1-4 hour session profile.`;

  const intermarketCorrelationSummary = topic?.principles?.[0]?.description || 
    `Strong direct transmission through front-end sovereign yield curve differentials and inverse denominator mechanics across G10 FX pairs.`;

  return {
    macroSummary,
    keyRisks,
    playbookSteps,
    volatilityForecast,
    intermarketCorrelationSummary,
    directionSpikeDecision
  };
}
