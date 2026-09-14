export type EventCode = 
  | 'CPI' 
  | 'NFP' 
  | 'PPI' 
  | 'FOMC' 
  | 'BOJ' 
  | 'RETAIL_SALES' 
  | 'GDP' 
  | 'PMI' 
  | 'PCE' 
  | 'JOBLESS_CLAIMS'
  | 'GENERAL';

export type EventImportance = 'HIGH' | 'MEDIUM' | 'LOW';

export type EventStatus = 'UPCOMING' | 'IMMINENT' | 'RELEASED' | 'SIMULATED';

export interface EconomicEvent {
  id: string;
  code: EventCode;
  title: string;
  country: string;
  currency: string;
  flag: string;
  datetime: string; // ISO string
  dateUtc?: string; // Standardized ISO 8601 UTC string
  timestamp: number; // ms
  period: string;
  importance: EventImportance;
  status: EventStatus;
  actual: number | null;
  forecast: number | null;
  previous: number | null;
  unit: string;
  metrics?: Record<string, any>;
  description?: string;
}

export type ChecklistStatus = 'PASS' | 'FAIL' | 'MIXED' | 'PENDING';
export type DirectionSkew = 'HAWKISH' | 'DOVISH' | 'NEUTRAL' | 'BULLISH' | 'BEARISH';

export interface ScenarioThresholds {
  hawkishThreshold: string;
  dovishThreshold: string;
  inLineRange: string;
  hawkishOutcome: string;
  dovishOutcome: string;
  inLineOutcome?: string;
}

export interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  status: ChecklistStatus;
  skew: DirectionSkew;
  actualValue: string | number;
  expectedValue: string | number;
  deltaStr: string;
  weight: number; // e.g. 1 to 3
  reasoning: string;
  // Upcoming News & Expectations Details:
  scenarioThresholds?: ScenarioThresholds;
  historicalVolatility?: string;
  componentWeighting?: string;
  keyDrivers?: string[];
  institutionalFocus?: string;
  preReleaseGuidance?: string;
}

export type MarketBias = 'STRONG_BUY' | 'BUY' | 'WATCH' | 'SELL' | 'STRONG_SELL';

export type TacticalAction = 
  | 'BUY'
  | 'SELL'
  | 'STRONG BUY'
  | 'STRONG SELL'
  | 'LONG' 
  | 'SHORT' 
  | 'BUY PULLBACKS' 
  | 'FADE SPIKES' 
  | 'SELL SPIKES'
  | 'PRE-POSITION BUY'
  | 'PRE-POSITION SELL'
  | 'STAND ASIDE' 
  | 'TIGHTEN STOPS'
  | 'ACCUMULATE'
  | 'BREAKOUT LONG'
  | 'BREAKOUT SHORT';

export type AssetCategory = 'COMMODITIES' | 'FX' | 'YIELDS' | 'INDICES' | 'CRYPTO';

export interface ActionScenario {
  trigger: string;
  action: TacticalAction;
  targetPrice: string;
  stopLoss: string;
  expectedMove: string;
  rationale: string;
}

export interface MathematicalFactor {
  name: string;
  category: string;
  value: string;
  weight: number; // e.g. 0.35 (35%)
  impactDirection: 'UPSIDE_BEAT' | 'DOWNSIDE_MISS' | 'NEUTRAL';
  description: string;
  contributionBps: number; // e.g. +12 bps or -8 bps
}

export interface MathematicalExpectation {
  calculatedModelValue: number; // e.g. 0.43 (Econometric expectation print)
  consensusValue: number; // e.g. 0.40
  previousValue: number; // e.g. -0.40
  unit: string; // e.g. "%" or "K"
  dispersionStdDev: number; // e.g. 0.08
  confidenceInterval: [number, number]; // [0.35, 0.51] (95% CI)
  
  // Explicit Calculated Expectation Percentage Numbers:
  probabilities: {
    upsideBeatPercent: number; // e.g. 64.2%
    inLineBaselinePercent: number; // e.g. 23.5%
    downsideMissPercent: number; // e.g. 12.3%
  };
  
  netExpectedSurpriseDelta: number; // e.g. +0.03
  skewDirection: 'UPSIDE_BEAT' | 'DOWNSIDE_MISS' | 'IN_LINE';
  skewMagnitude: 'STRONG_UPSIDE' | 'MODERATE_UPSIDE' | 'BALANCED' | 'MODERATE_DOWNSIDE' | 'STRONG_DOWNSIDE';
  
  factors: MathematicalFactor[];
  modelMethodology: string; // e.g. "Bayesian Multi-Factor Nowcast & High-Frequency Component Weighting"
  statisticalZScore: number; // e.g. +0.38
  leadingIndicatorScore: number; // e.g. +68 (0 to 100 or -100 to +100)
}

export interface AssetImpact {
  symbol: string;
  name: string;
  category: AssetCategory;
  bias: MarketBias;
  action: TacticalAction;
  actionDirective?: 'BUY' | 'SELL' | 'STRONG BUY' | 'STRONG SELL';
  tradeEntryZone?: string;
  targetPrice?: string;
  stopLossPrice?: string;
  confidence: number; // 0 to 100
  magnitude: 'HIGH' | 'MEDIUM' | 'LOW';
  expectedMove: string; // e.g. "+1.2% (~$30)" or "+45 pips"
  transmissionRationale: string;
  invalidationTrigger: string;
  correlationRank: number; // 1 = highest primary correlation
  primaryDriver: string;
  // Live dynamic actionable capabilities:
  currentPosture?: string; // What the asset should be doing right now (e.g. "Pre-Event Compression & Spread Monitoring")
  liveExecutionSteps?: string[]; // Live tactical steps
  upsideScenario?: ActionScenario; // Live plan if data beats
  downsideScenario?: ActionScenario; // Live plan if data misses
  inLineScenario?: ActionScenario; // Live plan if in-line
  volatilityWindow?: string; // e.g. "Peak Volatility: 0 - 15 min"
  transmissionSpeed?: 'INSTANT (0-30s)' | 'INTERMEDIATE (1-15m)' | 'DRIFT (1-4h)';
}

export type SignalVerdict = 
  | 'HAWKISH_SURPRISE' 
  | 'DOVISH_SURPRISE' 
  | 'STAGFLATION_SKEW' 
  | 'GOLDILOCKS_CONTINUATION' 
  | 'DISINFLATION_CONFIRMED'
  | 'GROWTH_SHOCK'
  | 'NEUTRAL_SKEW'
  | 'MIXED_NO_ACTION';

// --- INSTITUTIONAL 5-PILLAR MACRO CONFIRMATION FRAMEWORK ---
export interface Pillar1DataTriggers {
  mandateTarget: string; // e.g. "2.0% Core CPI Target", "2.0-3.0% RBA Band", "1.0-3.0% BoC Target"
  primaryInflationMetric: {
    name: string;
    value: string;
    forecast: string;
    bias: 'HAWKISH' | 'DOVISH' | 'NEUTRAL';
    note: string;
  };
  secondaryInflationMetric?: {
    name: string;
    value: string;
    bias: 'HAWKISH' | 'DOVISH' | 'NEUTRAL';
    note: string;
  };
  wageGrowth?: {
    name: string; // e.g. "Shunto Spring Wage Negotiations" or "US Average Hourly Earnings"
    value: string;
    threshold: string;
    impact: string;
  };
  gdpAndOutputGap?: {
    gdpGrowth: string;
    outputGap: string;
    velocity: string;
    overheatingRisk: 'HIGH' | 'MODERATE' | 'LOW';
  };
  pmiSubcomponents?: {
    newOrders: { value: number; signal: string };
    employment: { value: number; signal: string };
    pricesPaid: { value: number; signal: string };
    threshold50Velocity: string;
  };
  ppiTransmission?: {
    finalDemand: string;
    intermediateDemand: string;
    tradeServicesMargins: string;
    cpiPassthroughRisk: 'HIGH' | 'MODERATE' | 'LOW';
  };
  statusScore: number; // 0 to 100
}

export interface Pillar2MarketExpectations {
  instrumentTracked: string; // e.g. "TONA Futures & OIS Swaps", "CME FedWatch & OIS", "ASX 30-Day Interbank Cash Rate Futures", "CORRA OIS"
  impliedHikeProbability: number; // % e.g. 64.2%
  impliedCutProbability: number; // % e.g. 5.1%
  impliedHoldProbability: number; // % e.g. 30.7%
  currentPolicyRate: string; // e.g. "0.25% - 0.50%" or "5.25% - 5.50%"
  estimatedNeutralRate: string; // e.g. "0.0% to 0.5% Real (BoJ)" or "2.50% - 2.875% (Fed)"
  marketPricingRisk: string; // Strategic trap summary
  surpriseGapThreshold: string;
}

export interface Pillar3TextualDecoder {
  hawkishKeywordsDetected: { phrase: string; weight: number; implication: string }[];
  dovishKeywordsDetected: { phrase: string; weight: number; implication: string }[];
  votingAlignment: {
    unanimous: boolean;
    dissentCount: number;
    dissenters?: string[];
    frictionLevel: 'UNIFIED' | 'MILD_DISSENT' | 'HIGH_FRICTION';
    summary: string;
  };
  outlookReportOrDotPlot: {
    title: string; // e.g. "BoJ 3-Year Outlook Report" or "FOMC Dot Plot (SEP Projections)"
    medianPathTrajectory: string;
    inflationRevision: 'UPWARD_REVISION' | 'UNCHANGED' | 'DOWNWARD_REVISION';
    gdpRevision: 'UPWARD_REVISION' | 'UNCHANGED' | 'DOWNWARD_REVISION';
    details: string;
  };
  textualSkewScore: number; // -100 (Ultra Dovish) to +100 (Ultra Hawkish)
}

export interface Pillar4FiscalPolitical {
  frameworkCategory: 'BOJ_MOF_INTERVENTION' | 'FOMC_POLITICAL_DEBT' | 'RBA_BOC_VARIABLE_HOUSING' | 'GENERAL_FISCAL';
  verbalInterventionLevel: 'LEVEL_1_ROUTINE' | 'LEVEL_2_ELEVATED_WATCH' | 'LEVEL_3_DECISIVE_ACTION' | 'STAND_ASIDE';
  interventionPhrases: string[];
  politicalPressureSummary: string;
  housingAndConsumerLeverage?: {
    variableRateMortgageRatio: string; // e.g. "72% in Australia, 58% in Canada"
    householdCashFlowStress: 'HIGH' | 'MODERATE' | 'LOW';
    debtVulnerabilityNote: string;
  };
}

export interface Pillar5IntermarketConfirmation {
  benchmarkYield: {
    symbol: string; // e.g. "10Y JGB" or "2Y US Treasury"
    currentYield: string;
    move1d: string;
    hawkishConfirmationThreshold: string;
    implication: string;
  };
  yieldSpreadDifferential?: {
    pair: string; // e.g. "US 10Y - Japan 10Y Spread"
    spreadBps: string;
    trend: string;
    fxImpact: string;
  };
  equityIndexTransmission: {
    symbol: string; // e.g. "Nikkei 225" or "S&P 500"
    correlationType: 'INVERSE_CARRY_UNWIND' | 'GROWTH_DISINFLATION_RALLY' | 'STAGFLATION_SELLOFF';
    expectedDirection: string;
    currentPosture: string;
  };
  goldOrDollarConfirmation: {
    symbol: string; // e.g. "DXY" or "XAU/USD"
    reactionVector: string;
    institutionalImplication: string;
  };
  macroRegimeDetected: 'GOLDILOCKS_CONTINUATION' | 'HAWKISH_STAGFLATION_SHOCK' | 'CARRY_TRADE_UNWIND' | 'DISINFLATION_EASING' | 'GROWTH_CONTRACTION';
}

export interface WorkflowPhases {
  preMeetingTMinus7D: {
    phaseName: string;
    focusItems: string[];
    status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
  };
  releaseHHour: {
    phaseName: string;
    focusItems: string[];
    status: 'ACTIVE_FOCUS' | 'PENDING' | 'COMPLETED';
  };
  postMeetingPressConf: {
    phaseName: string;
    governorName: string;
    focusItems: string[];
    watchpoints: string[];
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  };
}

export interface MacroConfirmationPillars {
  pillar1Data: Pillar1DataTriggers;
  pillar2Market: Pillar2MarketExpectations;
  pillar3Textual: Pillar3TextualDecoder;
  pillar4Fiscal: Pillar4FiscalPolitical;
  pillar5Intermarket: Pillar5IntermarketConfirmation;
  workflowPhases: WorkflowPhases;
  overallConfirmationScore: number; // 0 to 100
  institutionalConsensus: string;
}

export interface DirectionSpikeItem {
  symbol: string;
  name: string;
  category: AssetCategory;
  isBasePair: boolean;
  isQuotePair: boolean;
  spikeDirection: 'BULLISH_SPIKE' | 'BEARISH_SPIKE' | 'VOLATILITY_SQUEEZE' | 'FADE_SPIKE';
  directive: 'BUY' | 'SELL' | 'STRONG BUY' | 'STRONG SELL';
  action: TacticalAction;
  expectedMove: string;
  targetZone: string;
  invalidationZone: string;
  playbookRule: string;
  confidence: number;
}

export interface DirectionSpikeDecision {
  verdict: string;
  bias: 'BULLISH' | 'BEARISH' | 'VOLATILITY_WHIPSAW' | 'NEUTRAL';
  confidencePercent: number;
  horizon: string;
  primaryTransmissionVector: string;
  groundedPlaybookTopic: string;
  affectedPairs: DirectionSpikeItem[];
}

export interface AiSynthesis {
  macroSummary: string;
  keyRisks: string[];
  playbookSteps: string[];
  volatilityForecast: string;
  intermarketCorrelationSummary: string;
  directionSpikeDecision?: DirectionSpikeDecision;
}

export interface EngineEvaluationResult {
  eventId: string;
  eventTitle: string;
  eventCode: EventCode;
  verdict: SignalVerdict;
  verdictLabel: string;
  confidenceScore: number; // 0 to 100
  summaryThesis: string;
  checklist: ChecklistStep[];
  assetImpacts: AssetImpact[];
  timestamp: number;
  isSimulation?: boolean;
  aiSynthesis?: AiSynthesis;
  mathematicalExpectation?: MathematicalExpectation;
  confirmationPillars?: MacroConfirmationPillars;
}

export interface AssetQuote {
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  sparkline: number[];
  timestamp: number;
  currency: string;
  precision: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'SIGNAL' | 'AI' | 'ENGINE';
  category: 'CALENDAR' | 'EVALUATION' | 'MARKET_DATA' | 'SIMULATION' | 'SYSTEM';
  message: string;
  details?: any;
}

export interface ApiConfig {
  finnhubKey: string;
  twelveDataKey: string;
  geminiKey?: string;
  autoPollImminent: boolean;
  soundAlerts: boolean;
  pollingIntervalSeconds: number;
}

export interface HistoricScenario {
  id: string;
  name: string;
  date: string;
  eventCode: EventCode;
  eventTitle: string;
  country: string;
  contextSummary: string;
  marketOutcome: string;
  eventData: {
    actual: number;
    forecast: number;
    previous: number;
    unit: string;
    metrics: Record<string, any>;
  };
}

export interface MarketIntelNewsItem {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  date?: string;
  position?: number;
}

export interface MarketIntelFundamentalPoint {
  date: string;
  value: string;
}

export interface MarketIntelFundamentals {
  name: string;
  interval: string;
  unit: string;
  data: MarketIntelFundamentalPoint[];
  latestReading?: {
    date: string;
    value: string;
  };
}

export interface MarketIntelPayload {
  selectedSymbol: {
    symbol: string;
    display: string;
  };
  indicator: string;
  news: MarketIntelNewsItem[];
  fundamentals: MarketIntelFundamentals | null;
  rawResponses: {
    newsRes: any;
    fundRes: any;
  };
  meta: {
    serperSource: 'live_api' | 'synthetic_stream';
    alphaVantageSource: 'live_api' | 'synthetic_stream';
    fetchedAt: number;
    latencyMs: number;
    query: string;
  };
}

export interface ForexFactoryRawEvent {
  date?: string; // e.g. "2026-09-03"
  time: string; // e.g. "12:30" (GMT)
  currency: string; // e.g. "USD", "EUR", "GBP", "JPY"
  event: string; // e.g. "Core CPI m/m"
  impact: string; // "High" | "Medium" | "Low"
  forecast: string; // e.g. "0.3%"
  previous: string; // e.g. "0.2%"
  actual: string | null; // e.g. "0.4%" or null
}

export interface UserTradingStats {
  totalSignalsEvaluated: number;
  winRateEst: number;
  activeWatchlistCount: number;
  lastLogin: string;
  totalSandboxesRun: number;
  favoritePair: string;
}

export interface UserAlertPreferences {
  highImpactAudio: boolean;
  instantPopups: boolean;
  dailySummary: boolean;
  emailAlerts: boolean;
  soundVolume: number;
  watchlistOnly?: boolean;
  mediumImpactAudio?: boolean;
}

export interface UserRiskSettings {
  maxDailyLossPercent: number; // e.g. 3.0%
  targetRiskReward: string; // e.g. "1:2.5"
  maxConcurrentTrades: number; // e.g. 3
  preferredSessions: string[]; // e.g. ['London', 'New York']
  accountBalance: number; // e.g. 25000
  riskPerTradePercent: number; // e.g. 1.5%
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  accountTier: 'PRO TRADER' | 'INSTITUTIONAL' | 'VIP MACRO' | 'COMMUNITY';
  memberSince: string;
  registeredAtTimestamp?: number;
  tradingStyle: 'Macro Swing' | 'News Trader' | 'High Frequency Scalper' | 'Quantitative Model';
  primaryCurrency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'AUD' | 'CAD';
  riskPreference: 'Conservative (0.5% - 1%)' | 'Standard (1% - 2%)' | 'Aggressive (3%+)';
  riskSettings?: UserRiskSettings;
  watchlists: string[];
  notes?: string;
  alerts: UserAlertPreferences;
  stats: UserTradingStats;
  isVerified: boolean;
}

// ==========================================
// AI Assistant & Macro Quiz Engine Types
// ==========================================

export interface AiChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio';
  mimeType: string;
  size: number;
  data: string; // base64 string or data URL
  previewUrl?: string;
  extractedText?: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  sources?: string[];
  isQuiz?: boolean;
  quizQuestion?: AiQuizQuestion;
  attachments?: AiChatAttachment[];
}

export interface AiQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Pro Macro';
  relatedEventCode?: string;
  relatedAsset?: string;
}

export interface AiTechnicalSetupSummary {
  symbol: string;
  name: string;
  category: string;
  basePrice: number;
  htfTrend: string;
  ltfTrend: string;
  priceActionPattern: string;
  structureVerdict: string;
  confluenceScore: number;
  recommendedEntry: number;
  stopLoss: number;
  stopLossPips: number;
  takeProfit1: number;
  takeProfit1RRR: string;
  takeProfit2: number;
  takeProfit2RRR: string;
  primarySessionTiming: string;
  confluenceFactors: string[];
  orderBlockZone?: [number, number];
  orderBlockType?: string;
  fvgZone?: [number, number];
  fvgStatus?: string;
  liquiditySweep?: string;
  fibRetracement?: string;
  candlestickPattern?: string;
  rsi14?: number;
  rsiDivergence?: string;
  emaStatus?: string;
  cloudStatus?: string;
  volumePoC?: number;
  wyckoffPhase?: string;
}

export interface AiSentimentSummaryItem {
  symbol: string;
  quoteSymbol: string;
  name: string;
  category: string;
  score: number;
  sentimentLabel: string;
  commercialNet: number;
  speculatorNet: number;
  putCallRatio: number;
  retailLong: number;
  volIndex: string;
  volVal: number;
  bpi: number;
  dominantNarrative: string;
}

export interface AiAppContextSummary {
  selectedEvent: {
    title: string;
    country: string;
    code: string;
    actual: number | string | null;
    forecast: number | string | null;
    previous: number | string | null;
    surpriseDelta?: number | null;
    surprisePercentage?: number | null;
    verdict?: string;
    confidenceScore?: number;
  } | null;
  upcomingEventsCount: number;
  upcomingEventsSummary: Array<{
    title: string;
    country: string;
    impact: string;
    time: string;
  }>;
  marketQuotes: Array<{
    symbol: string;
    price: number;
    changePercent: number;
    category: string;
  }>;
  sentimentBias?: string;
  technicalAnalysisSetups?: AiTechnicalSetupSummary[];
  institutionalSentiment?: AiSentimentSummaryItem[];
  macroConfirmationPillars?: {
    overallConfirmationScore?: number;
    institutionalConsensus?: string;
    pillarsSummary?: string;
  };
  assetImpacts?: Array<{
    symbol: string;
    name: string;
    bias: string;
    action: string;
    tradeEntryZone?: string;
    targetPrice?: string;
    stopLossPrice?: string;
    expectedMove?: string;
    confidence?: number;
    transmissionRationale?: string;
  }>;
  userRiskSummary?: {
    accountTier?: string;
    tradingStyle?: string;
    riskPerTrade?: number;
    accountBalance?: number;
  };
  recentLogs?: string[];
}

export type NavigationPage = 'macro' | 'technical' | 'sentiment' | 'news' | 'playbook';

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '8h' | '1d' | '1w' | '1M';

export interface Tick {
  symbol: string;
  price: number;
  time: number; // timestamp in ms
  bid?: number;
  ask?: number;
  pip_size?: number;
}

export interface Candle {
  time: number; // epoch in seconds or ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface MarketSymbol {
  id: string;
  symbol: string;
  display: string;
  market: string;
  marketDisplay?: string;
  submarket?: string;
  submarketDisplay?: string;
  pip?: number;
  isOpen?: boolean;
}

export interface NewsItemAnalysis {
  expectedMove: string;
  horizon: 'intraday' | '1-3 days' | '1-2 weeks';
  confidence: number; // 0.0 - 1.0
  rationale: string;
  expectedDirection?: {
    USD?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    EUR?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    JPY?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    GOLD?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    EQUITIES?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    BONDS?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  tradeIdeas?: string[];
}

export interface NormalizedNewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceType: 'BLOOMBERG' | 'REUTERS' | 'FT' | 'WSJ' | 'CNBC' | 'FOREXLIVE' | 'CENTRAL_BANK' | 'SQUAWK' | 'NEWSAPI' | 'SERPER' | 'RSS' | 'GOOGLE_NEWS_RSS';
  timestamp: number;
  url?: string;
  category: 'BREAKING' | 'CENTRAL_BANK' | 'MACRO_DATA' | 'FLOWS_FX' | 'GEOPOLITICAL';
  impactSentiment: 'HAWKISH' | 'DOVISH' | 'NEUTRAL' | 'HIGH_VOLATILITY';
  impactScore: number; // 0 - 100
  tickers: string[];
  isFlash?: boolean;
  analysis?: NewsItemAnalysis;
}

export interface LiveNewsResponse {
  source: string;
  fetchedAt: number;
  results: NormalizedNewsItem[];
  cached?: boolean;
  activeSources?: string[];
}



