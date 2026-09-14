export interface MacroKnowledgeTopic {
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  category: 'INFLATION_LABOR' | 'CENTRAL_BANKS_RATES' | 'INTERBANK_LIQUIDITY';
  badge: string;
  badgeColor: string;
  tagline: string;
  overview: string;
  centralBankOrAgency: string;
  releaseTiming: string;
  
  // Scenario Table
  scenarios: Array<{
    scenarioName: string;
    condition: string;
    inflationOrMetricDirection: 'UP' | 'DOWN' | 'NEUTRAL';
    rateOutlook: 'UP' | 'DOWN' | 'NEUTRAL';
    usdDirection: 'UP' | 'DOWN' | 'NEUTRAL';
    goldDirection: 'UP' | 'DOWN' | 'NEUTRAL';
    stocksDirection: 'UP' | 'DOWN' | 'NEUTRAL';
    details: string;
  }>;

  // Asset Impact Breakdown Matrix
  assetImpacts: Array<{
    assetName: string;
    symbol: string;
    hawkishMove: 'UP' | 'DOWN';
    hawkishLabel: string;
    dovishMove: 'UP' | 'DOWN';
    dovishLabel: string;
    mechanism: string;
  }>;

  // Why Markets Move This Way / Core Principles
  principles: Array<{
    title: string;
    description: string;
    iconType: 'rates' | 'stocks' | 'gold' | 'usd' | 'fx' | 'yield' | 'liquidity';
  }>;

  // Key Data Variants or Components (if applicable)
  components?: Array<{
    name: string;
    role: string;
    importance: string;
  }>;

  // Regional Terminology / Equivalents Table (if applicable)
  regionalEquivalents?: Array<{
    country: string;
    centralBank: string;
    rateName: string;
    benchmarkTarget: string;
  }>;

  // Unique Policy Features (e.g. SNB FX intervention, BoJ Carry Trade, ECB 3-rate tier)
  uniqueFeatures?: Array<{
    title: string;
    subtitle: string;
    description: string;
  }>;

  // Key Event Watchpoints / Timings
  watchpoints?: Array<{
    timeOrPhase: string;
    eventName: string;
    impactDescription: string;
  }>;
}

export const MACRO_KNOWLEDGE_TOPICS: MacroKnowledgeTopic[] = [
  // -------------------------------------------------------------
  // 1. CPI (Consumer Price Index)
  // -------------------------------------------------------------
  {
    id: 'cpi-inflation',
    code: 'CPI',
    title: 'Consumer Price Index (CPI) & Inflation Playbook',
    shortTitle: 'CPI Inflation',
    category: 'INFLATION_LABOR',
    badge: 'TIER 1 INFLATION',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    tagline: 'Primary inflation gauge driving central bank policy rates, bond yields, and cross-asset valuations.',
    overview: 'The Consumer Price Index (CPI) measures the average change over time in the prices paid by urban consumers for a market basket of consumer goods and services. CPI directly measures inflation, which is the primary determinant for central bank interest rate decisions and global market movements.',
    centralBankOrAgency: 'U.S. Bureau of Labor Statistics (BLS) / Global Statistics Agencies',
    releaseTiming: 'Monthly (typically 2nd week of month) at 8:30 AM EST',
    scenarios: [
      {
        scenarioName: 'High Inflation (Hot CPI Beat)',
        condition: 'Actual CPI exceeds forecast significantly (e.g. > +0.2% delta)',
        inflationOrMetricDirection: 'UP',
        rateOutlook: 'UP',
        usdDirection: 'UP',
        goldDirection: 'DOWN',
        stocksDirection: 'DOWN',
        details: 'Central banks are forced to raise interest rates or keep them higher for longer to cool consumer demand. Higher discount rates crush growth equities and strengthen USD yields.',
      },
      {
        scenarioName: 'Low Inflation (Cool CPI Miss)',
        condition: 'Actual CPI comes in below consensus (disinflation confirmation)',
        inflationOrMetricDirection: 'DOWN',
        rateOutlook: 'DOWN',
        usdDirection: 'DOWN',
        goldDirection: 'UP',
        stocksDirection: 'UP',
        details: 'Cooling price pressures give central banks leeway to cut interest rates and ease borrowing costs, stimulating growth stocks and boosting non-yielding precious metals like Gold.',
      }
    ],
    assetImpacts: [
      {
        assetName: 'US Dollar (USD / DXY)',
        symbol: 'DXY',
        hawkishMove: 'UP',
        hawkishLabel: 'Surges 🟢 (Bullish USD)',
        dovishMove: 'DOWN',
        dovishLabel: 'Weakens 🔴 (Bearish USD)',
        mechanism: 'Higher interest rate expectations attract global foreign capital into dollar deposits and Treasury yields. Lower inflation decreases yield appeal, weakening the dollar.',
      },
      {
        assetName: 'Gold (XAU/USD)',
        symbol: 'XAU/USD',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Drops 🔴 (Bearish Gold)',
        dovishMove: 'UP',
        dovishLabel: 'Surges 🟢 (Bullish Gold)',
        mechanism: 'Gold is a non-yielding asset. When interest rates and real yields rise, opportunity costs increase, pushing capital away from gold into cash and bonds. Lower rates trigger strong bullion inflows.',
      },
      {
        assetName: 'Stocks (Nasdaq 100 / S&P 500)',
        symbol: 'NAS100',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Plummets 🔴 (Multiple Compression)',
        dovishMove: 'UP',
        dovishLabel: 'Rallies 🟢 (Multiple Expansion)',
        mechanism: 'Higher borrowing costs reduce corporate profit margins and raise the discount rate for discounted cash flow (DCF) equity valuations, hurting tech growth stocks. Low rates expand valuation multiples.',
      },
      {
        assetName: 'Interest Rates & Bond Yields',
        symbol: 'US10Y',
        hawkishMove: 'UP',
        hawkishLabel: 'Yields Spike 🟢 / Prices Drop 🔴',
        dovishMove: 'DOWN',
        dovishLabel: 'Yields Fall 🔴 / Prices Rise 🟢',
        mechanism: 'Central banks hike rates to cool excessive inflation. Short-term and benchmark Treasury yields reprice higher immediately to reflect policy tightening.',
      }
    ],
    principles: [
      {
        title: 'Interest Rates as the Policy Lever',
        description: 'Central banks raise interest rates to cool down high inflation by restricting credit, and lower them to stimulate economic activity when inflation is subdued.',
        iconType: 'rates',
      },
      {
        title: 'Stocks (Nasdaq) Discount Rate Compression',
        description: 'Higher borrowing costs reduce corporate profits and future cash flow valuations, penalizing high-multiple growth equities like technology. Cheaper borrowing fuels equity expansions.',
        iconType: 'stocks',
      },
      {
        title: 'Gold Yield Opportunity Cost',
        description: 'Higher interest rates increase the risk-free return on sovereign bonds and money market cash, making zero-yielding gold less attractive to institutional allocators.',
        iconType: 'gold',
      },
      {
        title: 'US Dollar Capital Magnet',
        description: 'Elevated U.S. yields draw international institutional capital into dollar-denominated money markets, driving broad-based dollar appreciation across currency pairs.',
        iconType: 'usd',
      }
    ]
  },

  // -------------------------------------------------------------
  // 2. NFP (Non-Farm Payrolls)
  // -------------------------------------------------------------
  {
    id: 'nfp-employment',
    code: 'NFP',
    title: 'Non-Farm Payrolls (NFP) & Labor Market Guide',
    shortTitle: 'NFP Labor',
    category: 'INFLATION_LABOR',
    badge: 'DUAL MANDATE',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    tagline: 'The primary gauge for U.S. employment health, driving Federal Reserve interest rate decisions.',
    overview: 'Non-Farm Payrolls (NFP) is a key U.S. macroeconomic indicator released by the Bureau of Labor Statistics (BLS) on the first Friday of every month at 8:30 AM EST. It measures the net monthly change in paid workers in the U.S., excluding farm workers, government, non-profits, and private household employees. Because the Federal Reserve operates under a dual mandate—maximum employment and price stability—NFP serves as the primary gauge for labor market strength, directly driving rate expectations.',
    centralBankOrAgency: 'U.S. Bureau of Labor Statistics (BLS)',
    releaseTiming: 'First Friday of every month at 8:30 AM EST',
    components: [
      {
        name: 'Headline NFP (Net Change)',
        role: 'Total net jobs added or lost across the US non-farm economy',
        importance: 'Drives the immediate algorithmic knee-jerk surprise spike in the first 0-60 seconds.',
      },
      {
        name: 'Unemployment Rate (U-3)',
        role: 'Percentage of active civilian job seekers without employment',
        importance: 'Indicates overall labor market slack and determines structural employment trends.',
      },
      {
        name: 'Average Hourly Earnings (MoM & YoY)',
        role: 'Rate of wage increases received by private non-farm workers',
        importance: 'Measures wage-push inflation pressure that directly filters into services inflation.',
      }
    ],
    scenarios: [
      {
        scenarioName: 'Strong / Hot NFP (Jobs Beat Forecast)',
        condition: 'Headline jobs exceed forecast, unemployment falls, or wage growth beats',
        inflationOrMetricDirection: 'UP',
        rateOutlook: 'UP',
        usdDirection: 'UP',
        goldDirection: 'DOWN',
        stocksDirection: 'DOWN',
        details: 'Strong hiring gives the Fed room to keep interest rates higher for longer to prevent inflation resurgence. Higher Treasury yields spark massive USD inflows.',
      },
      {
        scenarioName: 'Weak / Soft NFP (Jobs Miss Forecast)',
        condition: 'Headline jobs undershoot expectations, unemployment ticks higher, or wages cool',
        inflationOrMetricDirection: 'DOWN',
        rateOutlook: 'DOWN',
        usdDirection: 'DOWN',
        goldDirection: 'UP',
        stocksDirection: 'UP',
        details: 'Labor market cooling pushes the Fed toward rate cuts to support growth. Lower yields weaken dollar demand and ignite risk-on rallies in gold and equities.',
      }
    ],
    assetImpacts: [
      {
        assetName: 'US Dollar (USD)',
        symbol: 'USD',
        hawkishMove: 'UP',
        hawkishLabel: 'Up 🟢 (Yield Appeal)',
        dovishMove: 'DOWN',
        dovishLabel: 'Down 🔴 (Rate Cut Repricing)',
        mechanism: 'Higher rate expectations and rising Treasury yields attract international capital into the USD.',
      },
      {
        assetName: 'Gold (XAUUSD)',
        symbol: 'XAU/USD',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴 (Rising Real Yields)',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢 (Bullion Inflows)',
        mechanism: 'Gold pays no yield, so higher real yields and a stronger USD make gold less attractive. Cooling jobs lower holding opportunity costs.',
      },
      {
        assetName: 'Stocks (Nasdaq / S&P 500)',
        symbol: 'NAS100',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴 / Volatile',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢 (Financial Easing)',
        mechanism: 'Higher borrowing costs reduce future corporate profits and pressure growth stock valuations. Dovish prints ease financial conditions.',
      }
    ],
    principles: [
      {
        title: 'Fed Dual Mandate Anchor',
        description: 'The Federal Reserve is legally mandated to pursue Maximum Employment and Price Stability. Resilient hiring empowers the Fed to remain restrictive without triggering severe recession.',
        iconType: 'rates',
      },
      {
        title: 'Wage-Push Inflation Feedback Loop',
        description: 'If Average Hourly Earnings beat expectations, companies are paying higher wages, which gets passed on to retail consumer prices, forcing rate expectations upward.',
        iconType: 'yield',
      }
    ]
  },

  // -------------------------------------------------------------
  // 3. FOMC (Federal Open Market Committee)
  // -------------------------------------------------------------
  {
    id: 'fomc-policy',
    code: 'FOMC',
    title: 'Federal Open Market Committee (FOMC) Rate Framework',
    shortTitle: 'FOMC Policy',
    category: 'CENTRAL_BANKS_RATES',
    badge: 'BENCHMARK POLICY',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    tagline: 'The ultimate macro driver for financial markets, setting the target Federal Funds Rate.',
    overview: 'FOMC rate decisions and policy statements represent the ultimate macroeconomic driver for financial markets. The FOMC sets the target Federal Funds Rate, directly controlling monetary policy tightness. Meetings occur eight times a year, accompanied by the Policy Statement, Press Conference, and quarterly Summary of Economic Projections (SEP / Dot Plot).',
    centralBankOrAgency: 'Federal Reserve Board of Governors',
    releaseTiming: '8 times per year: 2:00 PM EST (Statement/SEP), 2:30 PM EST (Press Conference)',
    components: [
      {
        name: 'The Rate Decision (2:00 PM EST)',
        role: 'Target Federal Funds Rate band adjustment (e.g. +25 bps, 0 bps, -25 bps)',
        importance: 'Triggers immediate algorithmic market volatility based on whether the action matches market pricing.',
      },
      {
        name: 'Policy Statement & Dot Plot (SEP)',
        role: 'Detailed written consensus and individual members interest rate projections over 1-3 years',
        importance: 'Reveals the terminal rate trajectory and whether the committee leans hawkish or dovish.',
      },
      {
        name: 'Fed Chair Press Conference (2:30 PM EST)',
        role: 'Live Q&A session explaining rationale on inflation, labor market, and financial stability',
        importance: 'The Chair tone frequently causes the largest and most sustainable directional trend of the session.',
      }
    ],
    scenarios: [
      {
        scenarioName: 'Hawkish FOMC (Rate Hikes / Higher for Longer Guidance)',
        condition: 'Fed raises rates or signals prolonged restrictive policy above market consensus',
        inflationOrMetricDirection: 'UP',
        rateOutlook: 'UP',
        usdDirection: 'UP',
        goldDirection: 'DOWN',
        stocksDirection: 'DOWN',
        details: 'Higher rates and rising Treasury yields attract international capital into dollar assets while compressing corporate valuation multiples.',
      },
      {
        scenarioName: 'Dovish FOMC (Rate Cuts / Easing Guidance)',
        condition: 'Fed cuts policy rates or signals imminent easing cycle',
        inflationOrMetricDirection: 'DOWN',
        rateOutlook: 'DOWN',
        usdDirection: 'DOWN',
        goldDirection: 'UP',
        stocksDirection: 'UP',
        details: 'Lower interest rates weaken dollar yield differentials, triggering capital rotation into non-yielding gold and growth equities.',
      }
    ],
    assetImpacts: [
      {
        assetName: 'US Dollar (USD)',
        symbol: 'USD',
        hawkishMove: 'UP',
        hawkishLabel: 'Up 🟢 (Treasury Yield Magnet)',
        dovishMove: 'DOWN',
        dovishLabel: 'Down 🔴 (Capital Outflows)',
        mechanism: 'Higher interest rates and U.S. Treasury yields attract international capital into dollar-denominated assets. Lower rates weaken yield differentials.',
      },
      {
        assetName: 'Gold (XAUUSD)',
        symbol: 'XAU/USD',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴 (Opportunity Cost)',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢 (Real Yield Contraction)',
        mechanism: 'Rising yields increase the opportunity cost of holding non-yielding gold, while lower real yields trigger strong bullion allocations.',
      },
      {
        assetName: 'Stocks (Nasdaq / S&P 500)',
        symbol: 'SPX',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴 (Multiple Compression)',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢 (Liquidity Expansion)',
        mechanism: 'High discount rates compress earnings multiples and increase debt servicing costs. Cheaper liquidity boosts profit margins and risk appetite.',
      }
    ],
    principles: [
      {
        title: 'Dot Plot Terminal Rate Expectations',
        description: 'Quarterly Summary of Economic Projections shows where each governor sees interest rates heading in year 1, 2, 3 and the long-run neutral rate.',
        iconType: 'rates',
      },
      {
        title: 'Discount Rate Valuation Effect',
        description: 'Equity cash flows are discounted at higher hurdle rates when policy rates increase, mathematically reducing present equity values.',
        iconType: 'stocks',
      }
    ]
  },

  // -------------------------------------------------------------
  // 4. Interest Rates (Macro Central Lever)
  // -------------------------------------------------------------
  {
    id: 'interest-rates-lever',
    code: 'RATES',
    title: 'Interest Rates: The Master Macroeconomic Control Lever',
    shortTitle: 'Interest Rates',
    category: 'CENTRAL_BANKS_RATES',
    badge: 'CORE TRANSMISSION',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    tagline: 'The baseline cost of money that dictates cross-asset valuations, capital flows, and debt yields.',
    overview: 'Interest rates are the main control lever central banks use to regulate economic growth and keep inflation near target. Changes in interest rates directly influence corporate borrowing costs, consumer spending, and international capital flows, creating a ripple effect across all major asset classes.',
    centralBankOrAgency: 'Global Central Banks (Fed, ECB, BoE, BoJ, SNB, RBA, BoC, RBNZ)',
    releaseTiming: 'Scheduled meeting cycles (every 6 to 8 weeks)',
    scenarios: [
      {
        scenarioName: 'High / Rising Rates (Hawkish Regime)',
        condition: 'Central banks aggressively hiking or holding rates in restrictive territory',
        inflationOrMetricDirection: 'UP',
        rateOutlook: 'UP',
        usdDirection: 'UP',
        goldDirection: 'DOWN',
        stocksDirection: 'DOWN',
        details: 'Bond yields rise while bond prices drop. Opportunity cost of holding non-yielding assets increases; cash earns attractive risk-free yield.',
      },
      {
        scenarioName: 'Low / Falling Rates (Dovish Regime)',
        condition: 'Central banks slashing rates to stimulate economic growth and unlock credit',
        inflationOrMetricDirection: 'DOWN',
        rateOutlook: 'DOWN',
        usdDirection: 'DOWN',
        goldDirection: 'UP',
        stocksDirection: 'UP',
        details: 'Bond yields fall while bond prices rally. Cheaper debt lowers corporate financing costs, fueling risk-on equity rallies and gold demand.',
      }
    ],
    assetImpacts: [
      {
        assetName: 'US Dollar (USD)',
        symbol: 'DXY',
        hawkishMove: 'UP',
        hawkishLabel: 'Up 🟢',
        dovishMove: 'DOWN',
        dovishLabel: 'Down 🔴',
        mechanism: 'Higher interest rates yield better returns on dollar deposits and U.S. Treasuries, drawing in foreign capital. Lower rates lessen currency demand.',
      },
      {
        assetName: 'Gold (XAUUSD)',
        symbol: 'XAU/USD',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'Gold pays no yield or interest. Higher interest rates raise the opportunity cost of holding non-yielding bullion, while lower rates increase safe-haven appeal.',
      },
      {
        assetName: 'Stocks (Nasdaq / S&P 500)',
        symbol: 'NAS100',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'Higher borrowing costs shrink profit margins and raise the discount rate for stock valuations. Lower rates lower debt costs and boost equity multiples.',
      },
      {
        assetName: 'Bonds (Sovereign Debt)',
        symbol: 'US10Y',
        hawkishMove: 'UP',
        hawkishLabel: 'Yields Up 🟢 / Prices Down 🔴',
        dovishMove: 'DOWN',
        dovishLabel: 'Yields Down 🔴 / Prices Up 🟢',
        mechanism: 'Bond yields follow central bank policy rates, while bond prices move in the exact opposite direction of yields.',
      }
    ],
    principles: [
      {
        title: 'Opportunity Cost Principle',
        description: 'When interest rates are high, cash and short-term Treasuries offer risk-free returns, pulling liquidity out of non-yielding commodities (like gold) and high-risk assets (like tech equities).',
        iconType: 'gold',
      },
      {
        title: 'Discount Rates Principle',
        description: 'Equity valuation models rely on interest rates to calculate the present value of future earnings. When interest rates drop, future revenues become more valuable today, boosting stock valuations.',
        iconType: 'stocks',
      },
      {
        title: 'Real Yields (Rates minus Inflation)',
        description: 'For precious metals like gold, real yields carry more weight than nominal yields. If interest rates rise faster than inflation, real yields turn positive, exerting heavy downward pressure on gold.',
        iconType: 'yield',
      }
    ]
  },

  // -------------------------------------------------------------
  // 5. PPI (Producer Price Index)
  // -------------------------------------------------------------
  {
    id: 'ppi-wholesale',
    code: 'PPI',
    title: 'Producer Price Index (PPI) & Wholesale Inflation',
    shortTitle: 'PPI Wholesale',
    category: 'INFLATION_LABOR',
    badge: 'PIPELINE INFLATION',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    tagline: 'Leading wholesale inflation indicator before cost pressures reach retail consumers.',
    overview: 'PPI (Producer Price Index) measures the average change over time in selling prices received by domestic producers for their output. Released monthly by the U.S. Bureau of Labor Statistics (BLS) around mid-month at 8:30 AM EST, it tracks inflation at the wholesale/pipeline level—before costs reach retail consumers. Because businesses eventually pass higher production costs down to consumers, PPI serves as a critical leading indicator for CPI.',
    centralBankOrAgency: 'U.S. Bureau of Labor Statistics (BLS)',
    releaseTiming: 'Monthly around mid-month at 8:30 AM EST',
    components: [
      {
        name: 'Headline PPI (Final Demand)',
        role: 'Wholesale price changes across all final demand goods, services, and construction',
        importance: 'Provides the broadest snapshot of factory and service provider price changes.',
      },
      {
        name: 'Core PPI (Final Demand Less Food & Energy)',
        role: 'Excludes volatile items (food, energy, trade services)',
        importance: 'Reveals underlying structural pricing trends inside producer pipelines.',
      },
      {
        name: 'Pipeline PPI (Inputs to Stage Processing)',
        role: 'Measures raw materials and intermediate goods prices',
        importance: 'Signals future cost pressure before finished goods reach final commercial demand.',
      }
    ],
    scenarios: [
      {
        scenarioName: 'Hot / Higher PPI (Pipeline Inflation Surges)',
        condition: 'Wholesale producer prices beat forecasts, signaling sticky upstream cost pressures',
        inflationOrMetricDirection: 'UP',
        rateOutlook: 'UP',
        usdDirection: 'UP',
        goldDirection: 'DOWN',
        stocksDirection: 'DOWN',
        details: 'Hawkish outlook (rates stay higher for longer). Compressed profit margins reduce equity valuations while higher Treasury yields boost the dollar.',
      },
      {
        scenarioName: 'Cool / Lower PPI (Pipeline Disinflation)',
        condition: 'Wholesale producer prices drop or miss forecasts, relieving margin pressures',
        inflationOrMetricDirection: 'DOWN',
        rateOutlook: 'DOWN',
        usdDirection: 'DOWN',
        goldDirection: 'UP',
        stocksDirection: 'UP',
        details: 'Dovish outlook (rate cuts/easing on track). Relieves pipeline inflation risk, lowering discount rates for stocks and boosting bullion demand.',
      }
    ],
    assetImpacts: [
      {
        assetName: 'US Dollar (USD)',
        symbol: 'USD',
        hawkishMove: 'UP',
        hawkishLabel: 'Up 🟢',
        dovishMove: 'DOWN',
        dovishLabel: 'Down 🔴',
        mechanism: 'Strong wholesale inflation pushes U.S. Treasury yields higher, driving immediate capital inflows into the USD.',
      },
      {
        assetName: 'Gold (XAUUSD)',
        symbol: 'XAU/USD',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'Higher PPI implies persistent inflation, raising expectations of tighter monetary conditions and rising real yields that pressure gold.',
      },
      {
        assetName: 'Stocks (Nasdaq / S&P 500)',
        symbol: 'SPX',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'When raw material and transport costs rise, corporate profit margins get compressed unless passed on to consumers. Higher discount rates lower multiples.',
      }
    ],
    principles: [
      {
        title: 'Pipeline Pass-Through Effect',
        description: 'When raw material, manufacturing, and transport costs rise, corporate profit margins get compressed unless companies raise retail prices. This directly fuels subsequent CPI prints.',
        iconType: 'stocks',
      },
      {
        title: 'PCE Core Calculation Impact',
        description: 'Certain PPI sub-components—specifically healthcare, medical care, and financial portfolio management fees—feed directly into the Personal Consumption Expenditures (PCE) Index, the Fed preferred inflation metric.',
        iconType: 'rates',
      }
    ]
  },

  // -------------------------------------------------------------
  // 6. OCR (Official Cash Rate - RBA / RBNZ)
  // -------------------------------------------------------------
  {
    id: 'ocr-rba-rbnz',
    code: 'OCR',
    title: 'Official Cash Rate (OCR) & Asia-Pacific Central Banks',
    shortTitle: 'OCR (RBA / RBNZ)',
    category: 'CENTRAL_BANKS_RATES',
    badge: 'COMMODITY FX',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    tagline: 'Benchmark overnight rate for the Reserve Bank of Australia (RBA) and Reserve Bank of New Zealand (RBNZ).',
    overview: 'The Official Cash Rate (OCR) is the specific term used primarily by central banks like the Reserve Bank of Australia (RBA) and the Reserve Bank of New Zealand (RBNZ) for their target benchmark interest rate. While the U.S. Federal Reserve calls its target the Federal Funds Rate and the Bank of England calls it the Bank Rate, the OCR operates on the exact same core mechanism: it is the interest rate central banks charge commercial banks for overnight borrowing.',
    centralBankOrAgency: 'Reserve Bank of Australia (RBA) / Reserve Bank of New Zealand (RBNZ)',
    releaseTiming: 'Scheduled RBA / RBNZ monetary policy meetings',
    regionalEquivalents: [
      { country: 'Australia', centralBank: 'Reserve Bank of Australia (RBA)', rateName: 'Cash Rate / OCR', benchmarkTarget: 'Overnight Interbank Rate' },
      { country: 'New Zealand', centralBank: 'Reserve Bank of New Zealand (RBNZ)', rateName: 'Official Cash Rate (OCR)', benchmarkTarget: 'Commercial Settlement Rate' },
      { country: 'United States', centralBank: 'Federal Reserve (Fed)', rateName: 'Federal Funds Rate', benchmarkTarget: 'EFFR Target Range' },
      { country: 'United Kingdom', centralBank: 'Bank of England (BoE)', rateName: 'Bank Rate', benchmarkTarget: 'Sterling Overnight Benchmark' },
      { country: 'Eurozone', centralBank: 'European Central Bank (ECB)', rateName: 'Main Refinancing Rate', benchmarkTarget: 'Weekly Refi Operations' }
    ],
    scenarios: [
      {
        scenarioName: '1. OCR Hike (Hawkish Shift)',
        condition: 'Central bank raises OCR to combat above-target inflation and restrict credit',
        inflationOrMetricDirection: 'UP',
        rateOutlook: 'UP',
        usdDirection: 'DOWN',
        goldDirection: 'DOWN',
        stocksDirection: 'DOWN',
        details: 'Domestic Currency (AUD / NZD) surges; cross pairs (AUDUSD / NZDUSD) rally as rate differentials widen; domestic equities (ASX 200 / NZX 50) drop.',
      },
      {
        scenarioName: '2. OCR Cut (Dovish Shift)',
        condition: 'Central bank cuts OCR to stimulate sluggish domestic growth and lower financing costs',
        inflationOrMetricDirection: 'DOWN',
        rateOutlook: 'DOWN',
        usdDirection: 'UP',
        goldDirection: 'UP',
        stocksDirection: 'UP',
        details: 'Domestic Currency (AUD / NZD) weakens due to reduced yield appeal; cross pairs decline; domestic equities rally on cheaper liquidity.',
      }
    ],
    assetImpacts: [
      {
        assetName: 'Domestic Currency (AUD or NZD)',
        symbol: 'AUD/USD',
        hawkishMove: 'UP',
        hawkishLabel: 'Surges 🟢 (Up)',
        dovishMove: 'DOWN',
        dovishLabel: 'Weakens 🔴 (Down)',
        mechanism: 'Higher rates offer greater yields, attracting global yield-seeking capital into local money markets.',
      },
      {
        assetName: 'Cross Pairs (AUD/USD & NZD/USD)',
        symbol: 'NZD/USD',
        hawkishMove: 'UP',
        hawkishLabel: 'Rallies 🟢 (Up)',
        dovishMove: 'DOWN',
        dovishLabel: 'Drops 🔴 (Down)',
        mechanism: 'If the RBA/RBNZ hikes while the Fed holds or cuts, the interest rate differential widens in favor of AUD or NZD.',
      },
      {
        assetName: 'Gold (XAU/USD)',
        symbol: 'XAU/USD',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Pressured 🔴 (Down)',
        dovishMove: 'UP',
        dovishLabel: 'Supported 🟢 (Up)',
        mechanism: 'Global monetary tightening raises overall sovereign real yields, reducing non-yielding gold momentum.',
      },
      {
        assetName: 'Domestic Equities (ASX 200 / NZX 50)',
        symbol: 'ASX200',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'Corporate borrowing gets expensive, compressing earnings and valuation multiples. Lower rates expand liquidity.',
      }
    ],
    principles: [
      {
        title: 'Carry Trade Dynamics',
        description: 'Capital flows toward the currency offering the higher interest rate. If the RBA maintains a higher OCR than the Fed target rate, AUD/USD receives structural underlying carry support.',
        iconType: 'fx',
      }
    ]
  },

  // -------------------------------------------------------------
  // 7. The Overnight Rate & Global Equivalents
  // -------------------------------------------------------------
  {
    id: 'overnight-rate-interbank',
    code: 'OVERNIGHT',
    title: 'The Overnight Rate & Global Interbank Foundation',
    shortTitle: 'Overnight Rate',
    category: 'INTERBANK_LIQUIDITY',
    badge: 'INTERBANK LIQUIDITY',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    tagline: 'The fundamental base interest rate for short-term interbank money market lending.',
    overview: 'The Overnight Rate is the base interest rate at which commercial banks and financial institutions lend funds to one another in the overnight market. While central banks call this rate by different specific names globally, it forms the core foundation of all interest rates in an economy. When a central bank adjusts its target rate, the overnight market rate shifts first, directly influencing prime lending rates, mortgages, Treasury yields, and currency values.',
    centralBankOrAgency: 'Interbank Settlement Facilities & Central Banks',
    releaseTiming: 'Continuous Daily Clearing / Policy Rate Decision Cycles',
    regionalEquivalents: [
      { country: 'United States', centralBank: 'Federal Reserve (Fed)', rateName: 'Effective Federal Funds Rate (EFFR)', benchmarkTarget: 'Interbank Overnight Reserves' },
      { country: 'Canada', centralBank: 'Bank of Canada (BoC)', rateName: 'Overnight Rate Target', benchmarkTarget: 'Lynx Interbank Clearing System' },
      { country: 'Eurozone', centralBank: 'European Central Bank (ECB)', rateName: 'Euro Short-Term Rate (€STR)', benchmarkTarget: 'Euro Money Market Wholesale' },
      { country: 'United Kingdom', centralBank: 'Bank of England (BoE)', rateName: 'SONIA (Sterling Overnight Index Average)', benchmarkTarget: 'Unsecured Sterling Cash Market' },
      { country: 'Japan', centralBank: 'Bank of Japan (BoJ)', rateName: 'Uncollateralized Overnight Call Rate', benchmarkTarget: 'Tokyo Interbank Money Market' }
    ],
    scenarios: [
      {
        scenarioName: '1. Rate Hikes (Tightening / Hawkish)',
        condition: 'Central banks raise the target overnight rate to absorb excess liquidity and cool rising inflation',
        inflationOrMetricDirection: 'UP',
        rateOutlook: 'UP',
        usdDirection: 'UP',
        goldDirection: 'DOWN',
        stocksDirection: 'DOWN',
        details: 'US Dollar & Major Currencies Up 🟢; Gold Down 🔴 (higher opportunity costs); Stocks Down 🔴 (debt financing costs rise).',
      },
      {
        scenarioName: '2. Rate Cuts (Easing / Dovish)',
        condition: 'Central banks lower the overnight rate to stimulate economic activity during slowdowns',
        inflationOrMetricDirection: 'DOWN',
        rateOutlook: 'DOWN',
        usdDirection: 'DOWN',
        goldDirection: 'UP',
        stocksDirection: 'UP',
        details: 'Currencies Down 🔴 (reduced yield appeal); Gold Up 🟢 (safe haven store of value); Stocks Up 🟢 (cheaper interbank credit expands multiples).',
      }
    ],
    assetImpacts: [
      {
        assetName: 'US Dollar & Major Currencies',
        symbol: 'FX_MAJORS',
        hawkishMove: 'UP',
        hawkishLabel: 'Up 🟢',
        dovishMove: 'DOWN',
        dovishLabel: 'Down 🔴',
        mechanism: 'Higher overnight rates increase short-term money market yields, attracting global foreign exchange capital.',
      },
      {
        assetName: 'Gold (XAUUSD)',
        symbol: 'XAU/USD',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'High overnight rates push cash yields up, raising holding opportunity costs. Declining rates drive bullion demand.',
      },
      {
        assetName: 'Stocks (Nasdaq / S&P 500)',
        symbol: 'NAS100',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'Commercial banks pass higher overnight costs onto corporate borrowers. Increased debt costs reduce profit margins and earnings multiples.',
      }
    ],
    principles: [
      {
        title: 'Interbank Transmission Core',
        description: 'All consumer mortgages, commercial lines of credit, and treasury repo agreements derive their baseline yield spreads directly from the overnight rate.',
        iconType: 'liquidity',
      }
    ]
  },

  // -------------------------------------------------------------
  // 8. ECB Main Refinancing Operations (MRO) Rate
  // -------------------------------------------------------------
  {
    id: 'ecb-mro-rate',
    code: 'ECB_MRO',
    title: 'ECB Main Refinancing Operations (MRO) Rate & 3-Rate System',
    shortTitle: 'ECB Refi Rate',
    category: 'CENTRAL_BANKS_RATES',
    badge: 'EUROZONE POLICY',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    tagline: 'Principal benchmark interest rate across the 20 Eurozone member economies.',
    overview: 'The Main Refinancing Operations (MRO) Rate—commonly called the Main Refinancing Rate or "refi rate"—is the principal key interest rate set by the European Central Bank (ECB). It specifies the interest rate Eurozone commercial banks must pay when borrowing liquidity from the ECB for a one-week period against collateral. It serves as the headline benchmark for liquidity, credit costs, and monetary policy across the entire Eurozone economy.',
    centralBankOrAgency: 'European Central Bank (ECB) Governing Council',
    releaseTiming: 'Every 6 weeks at 8:15 AM EST (Press Conference at 8:45 AM EST)',
    components: [
      {
        name: 'Deposit Facility Rate',
        role: 'Interest commercial banks receive for depositing excess funds overnight with the ECB',
        importance: 'Sets the absolute floor for short-term interbank market interest rates in the Eurozone.',
      },
      {
        name: 'Main Refinancing Rate (MRO)',
        role: 'Cost for commercial banks to borrow weekly liquidity from the ECB against collateral',
        importance: 'Drives general commercial bank lending and borrowing conditions across Europe.',
      },
      {
        name: 'Marginal Lending Facility',
        role: 'Interest rate charged to commercial banks for emergency overnight loans from the ECB',
        importance: 'Sets the absolute ceiling for short-term interbank interest rates.',
      }
    ],
    scenarios: [
      {
        scenarioName: '1. Rate Hike / Hawkish Policy',
        condition: 'ECB raises refi rate to combat high Eurozone inflation and slow credit growth',
        inflationOrMetricDirection: 'UP',
        rateOutlook: 'UP',
        usdDirection: 'DOWN',
        goldDirection: 'DOWN',
        stocksDirection: 'DOWN',
        details: 'Euro (EUR / EURUSD) Up 🟢; Gold Down 🔴; European Equities (DAX / CAC 40) Down 🔴 as corporate credit costs rise.',
      },
      {
        scenarioName: '2. Rate Cut / Dovish Policy',
        condition: 'ECB lowers refi rate to ease borrowing costs and stimulate sluggish Eurozone growth',
        inflationOrMetricDirection: 'DOWN',
        rateOutlook: 'DOWN',
        usdDirection: 'UP',
        goldDirection: 'UP',
        stocksDirection: 'UP',
        details: 'Euro (EUR / EURUSD) Down 🔴; Gold Up 🟢; European Equities (DAX / CAC 40) Up 🟢 on cheaper liquidity.',
      }
    ],
    assetImpacts: [
      {
        assetName: 'Euro (EUR / EURUSD)',
        symbol: 'EUR/USD',
        hawkishMove: 'UP',
        hawkishLabel: 'Up 🟢',
        dovishMove: 'DOWN',
        dovishLabel: 'Down 🔴',
        mechanism: 'Higher interest rates offer greater returns on euro-denominated deposits, drawing in international investment. Lower rates decrease yield appeal.',
      },
      {
        assetName: 'Gold (XAUUSD)',
        symbol: 'XAU/USD',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'Global rate tightening boosts yield returns on cash/bonds, making non-yielding precious metals less attractive.',
      },
      {
        assetName: 'European Equities (DAX / CAC 40)',
        symbol: 'DAX',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'Increased debt costs squeeze corporate profit margins and discount future equity valuations. Cheaper liquidity boosts business expansion.',
      }
    ],
    principles: [
      {
        title: 'Euribor Benchmark Flow',
        description: 'When the ECB adjusts the refi rate, it alters commercial bank funding costs, which feed directly into Euribor benchmark rates, corporate credit, and consumer loans.',
        iconType: 'fx',
      }
    ]
  },

  // -------------------------------------------------------------
  // 9. SNB Policy Rate (Swiss National Bank)
  // -------------------------------------------------------------
  {
    id: 'snb-policy-rate',
    code: 'SNB',
    title: 'SNB Policy Rate & Swiss Safe-Haven FX Interventions',
    shortTitle: 'SNB Policy Rate',
    category: 'CENTRAL_BANKS_RATES',
    badge: 'SAFE HAVEN FX',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    tagline: 'Benchmark Swiss sight deposits rate steering SARON, featuring direct currency market interventions.',
    overview: 'The SNB Policy Rate is the benchmark interest rate set by the Swiss National Bank (SNB). It defines the rate paid or charged on sight deposits held by commercial banks at the SNB, steering short-term Swiss franc money market rates—specifically SARON (Swiss Average Rate Overnight). Unlike most major central banks that meet monthly or eight times a year, the SNB holds its monetary policy assessments quarterly (March, June, September, and December).',
    centralBankOrAgency: 'Swiss National Bank (SNB)',
    releaseTiming: 'Quarterly (March, June, September, December) at 3:30 AM EST',
    uniqueFeatures: [
      {
        title: '1. Direct FX Interventions',
        subtitle: 'Unilateral Foreign Exchange Purchases',
        description: 'The SNB is famous for using direct currency market interventions alongside rate adjustments. If an overvalued Swiss Franc threatens to create domestic deflation or hurt Swiss exporters, the SNB directly buys foreign currencies (USD/EUR) to depress CHF value—even if the policy rate remains untouched.',
      },
      {
        title: '2. Tiered Remuneration System',
        subtitle: 'Sight Deposit Threshold Structure',
        description: 'The SNB applies a tiered interest rate structure on commercial bank deposits. Deposits up to a set threshold earn the standard SNB policy rate, while excess balances receive lower (or historically negative) rates to encourage interbank lending and money market liquidity.',
      }
    ],
    scenarios: [
      {
        scenarioName: 'Hawkish Shift (Rate Hikes)',
        condition: 'SNB raises policy rate to counteract inflation or reduce reliance on balance sheet operations',
        inflationOrMetricDirection: 'UP',
        rateOutlook: 'UP',
        usdDirection: 'DOWN',
        goldDirection: 'DOWN',
        stocksDirection: 'DOWN',
        details: 'CHF Stronger 🟢 (USD/CHF & EUR/CHF Down); Gold Down 🔴; Swiss SMI Equities Down 🔴 (expensive liquidity squeezes export giants).',
      },
      {
        scenarioName: 'Dovish Shift (Rate Cuts)',
        condition: 'SNB cuts policy rate to ease Swiss Franc strength and protect export sector competitiveness',
        inflationOrMetricDirection: 'DOWN',
        rateOutlook: 'DOWN',
        usdDirection: 'UP',
        goldDirection: 'UP',
        stocksDirection: 'UP',
        details: 'CHF Weaker 🔴 (USD/CHF & EUR/CHF Up); Gold Up 🟢; Swiss SMI Equities Up 🟢 on cheaper liquidity.',
      }
    ],
    assetImpacts: [
      {
        assetName: 'Swiss Franc (CHF / USDCHF / EURCHF)',
        symbol: 'USD/CHF',
        hawkishMove: 'DOWN',
        hawkishLabel: 'CHF Stronger 🟢 (USDCHF/EURCHF Down)',
        dovishMove: 'UP',
        dovishLabel: 'CHF Weaker 🔴 (USDCHF/EURCHF Up)',
        mechanism: 'Higher Swiss yields increase yield appeal relative to foreign currencies, pulling capital into CHF. Lower yields encourage capital rotation out of CHF.',
      },
      {
        assetName: 'Gold (XAUUSD)',
        symbol: 'XAU/USD',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'Higher global interest rates reduce non-yielding gold momentum; lower global rates boost gold demand.',
      },
      {
        assetName: 'Swiss Equities (SMI Index)',
        symbol: 'SMI',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'Expensive liquidity squeezes profit margins for export-heavy Swiss multinationals (Nestlé, Roche, Novartis).',
      }
    ],
    principles: [
      {
        title: 'Global Safe-Haven Currency Status',
        description: 'The Swiss Franc (CHF) acts as a premier global safe-haven alongside gold. During geopolitical shocks, CHF experiences rapid appreciation regardless of domestic interest rate spreads.',
        iconType: 'fx',
      }
    ]
  },

  // -------------------------------------------------------------
  // 10. Bank of Japan (BoJ) Monetary Policy & Yen Carry Trade
  // -------------------------------------------------------------
  {
    id: 'boj-yen-carry-trade',
    code: 'BOJ',
    title: 'Bank of Japan (BoJ) Policy & Yen Carry Trade Dynamics',
    shortTitle: 'BoJ & Carry Trade',
    category: 'CENTRAL_BANKS_RATES',
    badge: 'CARRY UNWIND',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    tagline: 'Uncollateralized overnight call rate targeting, normalization cycles, and global carry trade unwinds.',
    overview: 'The Bank of Japan (BoJ) sets monetary policy for Japan, targeting the uncollateralized overnight call rate. Unlike Western central banks that spent 2024–2026 cutting rates, the BoJ has been engaged in a gradual rate-hiking cycle (normalization) after decades of negative and zero interest rates. Because Japanese interest rates historically hovered near zero, institutional traders borrowed cheap Japanese Yen (JPY) to purchase higher-yielding global assets (like US Treasuries or U.S. Tech equities). BoJ rate hikes narrow this yield gap, triggering massive liquidations of those carry trades and causing global market volatility.',
    centralBankOrAgency: 'Bank of Japan (BoJ) Policy Board',
    releaseTiming: '8 times per year (typically between 10:30 PM - 1:30 AM EST)',
    uniqueFeatures: [
      {
        title: 'Yen Carry Trade Liquidation Engine',
        subtitle: 'Global Cross-Market Deleverage Mechanism',
        description: 'When the BoJ hikes rates while Western central banks cut, the yield spread compresses. Borrowers of cheap Yen must buy back JPY to close positions, dumping US equities, tech shares, and crypto simultaneously.',
      },
      {
        title: 'Export Drag on the Nikkei 225',
        subtitle: 'Direct Currency Revenue Channel',
        description: 'A stronger Yen reduces foreign revenues when converted back for Japanese mega-cap exporters (like Toyota and Sony), weighing down Japanese equity benchmarks.',
      }
    ],
    scenarios: [
      {
        scenarioName: 'Hawkish Hike / Guidance (Tightening Policy)',
        condition: 'BoJ hikes policy rate or signals aggressive quantitative bond purchase tapering',
        inflationOrMetricDirection: 'UP',
        rateOutlook: 'UP',
        usdDirection: 'DOWN',
        goldDirection: 'DOWN',
        stocksDirection: 'DOWN',
        details: 'JPY Pairs (USD/JPY) Down 🔴 (Yen Gains); Nikkei 225 Down 🔴; Gold Down 🔴; Global Equities / Nasdaq Down 🔴 (Carry Trade Unwind).',
      },
      {
        scenarioName: 'Dovish Hold / Guidance (Keeping Liquidity Loose)',
        condition: 'BoJ maintains low rates or emphasizes caution regarding financial market volatility',
        inflationOrMetricDirection: 'DOWN',
        rateOutlook: 'DOWN',
        usdDirection: 'UP',
        goldDirection: 'UP',
        stocksDirection: 'UP',
        details: 'JPY Pairs (USD/JPY) Up 🟢 (Yen Weakens); Nikkei 225 Up 🟢; Gold Up 🟢; Global Equities Up 🟢 (Risk-On Sentiment).',
      }
    ],
    assetImpacts: [
      {
        assetName: 'JPY Pairs (USD/JPY & EUR/JPY)',
        symbol: 'USD/JPY',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴 (Yen Gains)',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢 (Yen Weakens)',
        mechanism: 'When the BoJ raises rates, the yield spread between the US Fed Funds Rate and Japan narrows. This sends capital out of USD and into JPY, driving USD/JPY down rapidly.',
      },
      {
        assetName: 'Nikkei 225 (Japan Equities)',
        symbol: 'N225',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴 (Export Drag)',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢 (Export Relief)',
        mechanism: 'A stronger Yen reduces foreign earnings for Japanese exporters like Toyota, Sony, and Keyence, pulling Japanese equity benchmarks down.',
      },
      {
        assetName: 'Global Equities / Nasdaq 100',
        symbol: 'NAS100',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴 (Carry Trade Unwind)',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢 (Risk-On Sentiment)',
        mechanism: 'BoJ rate hikes reduce global liquidity. When borrowing money in JPY becomes more expensive, foreign hedge funds are forced to close leveraged positions in global risk assets (like US equities and crypto), causing cross-market sell-offs.',
      },
      {
        assetName: 'Gold (XAU/USD)',
        symbol: 'XAU/USD',
        hawkishMove: 'DOWN',
        hawkishLabel: 'Down 🔴',
        dovishMove: 'UP',
        dovishLabel: 'Up 🟢',
        mechanism: 'Higher Japanese benchmark yields lift global baseline bond yields, raising holding costs during risk deleveraging.',
      }
    ],
    principles: [
      {
        title: 'USD/JPY Yield Spread Sensitivity',
        description: 'USD/JPY is the most rate-sensitive currency pair in the world, tracking the 10-Year US Treasury vs 10-Year JGB spread with a historical 0.85+ correlation.',
        iconType: 'fx',
      },
      {
        title: 'Global Liquidity Shock Transmission',
        description: 'When cheap Yen financing evaporates, systemic leverage shrinks worldwide, forcing automated margin calls and algorithmic liquidations across asset classes.',
        iconType: 'liquidity',
      }
    ]
  }
];

// Interactive Macro Quiz Questions derived directly from this Knowledge Base
export const MACRO_KNOWLEDGE_QUIZ_QUESTIONS = [
  {
    id: 'quiz-cpi-1',
    topic: 'Consumer Price Index (CPI)',
    difficulty: 'Intermediate' as const,
    question: 'When U.S. CPI comes in significantly higher than consensus (High Inflation), how do Gold (XAUUSD) and the US Dollar (USD) typically react?',
    options: [
      'Gold rises 🟢, USD falls 🔴',
      'Gold falls 🔴, USD rises 🟢',
      'Both Gold and USD rise 🟢',
      'Both Gold and USD fall 🔴'
    ],
    correctAnswerIndex: 1,
    explanation: 'Higher inflation forces the Federal Reserve to keep interest rates higher for longer. Higher rates attract capital to USD (strengthening it) and raise the opportunity cost of holding non-yielding Gold (causing it to fall).',
    relatedEventCode: 'CPI',
    relatedAsset: 'XAU/USD'
  },
  {
    id: 'quiz-nfp-1',
    topic: 'Non-Farm Payrolls (NFP)',
    difficulty: 'Intermediate' as const,
    question: 'Why does a Strong/Hot NFP print (beating jobs forecasts) frequently cause tech stocks (Nasdaq 100) to sell off?',
    options: [
      'Strong hiring reduces consumer spending',
      'Strong hiring gives the Fed room to keep interest rates higher for longer, increasing borrowing costs and raising the discount rate for growth stocks',
      'Companies are forced to shut down due to excess hiring',
      'Foreign investors dump U.S. Dollars'
    ],
    correctAnswerIndex: 1,
    explanation: 'A strong labor market signals economic resilience, allowing the Fed to maintain tight monetary policy. Higher discount rates reduce the present value of future tech earnings.',
    relatedEventCode: 'NFP',
    relatedAsset: 'NAS100'
  },
  {
    id: 'quiz-fomc-1',
    topic: 'Federal Open Market Committee (FOMC)',
    difficulty: 'Pro Macro' as const,
    question: 'What is the "Dot Plot" in the FOMC quarterly Summary of Economic Projections (SEP)?',
    options: [
      'A chart showing inflation by state',
      'A map of Federal Reserve regional banks',
      'A plot where each Fed member anonymously projects their target interest rate over the next 1 to 3 years and the long-run neutral rate',
      'A daily tracker of the stock market'
    ],
    correctAnswerIndex: 2,
    explanation: 'The Dot Plot reveals individual FOMC participants expectations for where the Federal Funds Rate should be at year-end for the next 3 years and in the long run.',
    relatedEventCode: 'FOMC',
    relatedAsset: 'USD'
  },
  {
    id: 'quiz-rates-1',
    topic: 'Interest Rates & Real Yields',
    difficulty: 'Pro Macro' as const,
    question: 'For precious metals like Gold, what is "Real Yield" and how does it affect pricing?',
    options: [
      'Real Yield is Nominal Interest Rate minus Inflation. When Real Yields rise, Gold faces heavy downward pressure because holding cash offers real positive returns.',
      'Real Yield is the physical weight of gold mined per year.',
      'Real Yield is the dividend yield paid by mining companies.',
      'Real Yield is the exchange rate between Gold and Silver.'
    ],
    correctAnswerIndex: 0,
    explanation: 'Real yields measure purchasing-power-adjusted returns on safe assets. When real yields turn positive and rise, institutional investors rotate out of non-yielding physical bullion into yielding Treasuries.',
    relatedEventCode: 'FOMC',
    relatedAsset: 'XAU/USD'
  },
  {
    id: 'quiz-ppi-1',
    topic: 'Producer Price Index (PPI)',
    difficulty: 'Intermediate' as const,
    question: 'Why is PPI considered a leading indicator for CPI?',
    options: [
      'PPI is calculated after CPI is announced',
      'PPI tracks prices at the wholesale and producer level; businesses eventually pass higher production costs down to retail consumers',
      'PPI only measures imported commodities',
      'Central banks do not look at PPI'
    ],
    correctAnswerIndex: 1,
    explanation: 'PPI tracks pipeline costs before goods reach retail store shelves. Rising wholesale and intermediate processing prices eventually force retail price hikes, feeding directly into upcoming CPI prints.',
    relatedEventCode: 'PPI',
    relatedAsset: 'SPX'
  },
  {
    id: 'quiz-ocr-1',
    topic: 'Official Cash Rate (OCR)',
    difficulty: 'Beginner' as const,
    question: 'Which central banks officially use the term "Official Cash Rate" (OCR) for their benchmark policy rate?',
    options: [
      'Federal Reserve (Fed) and Bank of England (BoE)',
      'Reserve Bank of Australia (RBA) and Reserve Bank of New Zealand (RBNZ)',
      'European Central Bank (ECB) and Swiss National Bank (SNB)',
      'Bank of Japan (BoJ) and Bank of Canada (BoC)'
    ],
    correctAnswerIndex: 1,
    explanation: 'The RBA and RBNZ use OCR (or Cash Rate) to denote their target interbank overnight rate.',
    relatedEventCode: 'GENERAL',
    relatedAsset: 'AUD/USD'
  },
  {
    id: 'quiz-ecb-1',
    topic: 'ECB 3-Rate System',
    difficulty: 'Pro Macro' as const,
    question: 'Which ECB interest rate sets the absolute floor for short-term interbank money market interest rates in the Eurozone?',
    options: [
      'Main Refinancing Rate',
      'Deposit Facility Rate',
      'Marginal Lending Facility',
      'Euribor 3-Month Rate'
    ],
    correctAnswerIndex: 1,
    explanation: 'The Deposit Facility Rate is what commercial banks earn by parking excess cash with the ECB overnight, setting the absolute floor below which interbank lending will not trade.',
    relatedEventCode: 'FOMC',
    relatedAsset: 'EUR/USD'
  },
  {
    id: 'quiz-snb-1',
    topic: 'Swiss National Bank (SNB)',
    difficulty: 'Pro Macro' as const,
    question: 'What unique policy tool does the Swiss National Bank (SNB) frequently utilize alongside interest rate adjustments to curb excessive CHF strength?',
    options: [
      'Direct foreign currency market interventions (purchasing foreign currency like USD/EUR)',
      'Banning gold exports',
      'Closing the stock exchange',
      'Imposing mandatory cryptocurrency reserves'
    ],
    correctAnswerIndex: 0,
    explanation: 'The SNB directly intervenes in foreign exchange markets by purchasing foreign currencies to weaken an overvalued Swiss Franc and protect its domestic export sector.',
    relatedEventCode: 'GENERAL',
    relatedAsset: 'USD/CHF'
  },
  {
    id: 'quiz-boj-1',
    topic: 'Bank of Japan & Yen Carry Trade',
    difficulty: 'Pro Macro' as const,
    question: 'What occurs during a "Yen Carry Trade Unwind" when the Bank of Japan hikes interest rates?',
    options: [
      'Traders borrow more JPY to buy stocks',
      'The Yen weakens and global equities surge',
      'Investors who borrowed cheap Yen are forced to buy back JPY to close positions, causing JPY to strengthen (USD/JPY drops) and global risk assets/tech equities to sell off',
      'Interest rates in the US drop to zero'
    ],
    correctAnswerIndex: 2,
    explanation: 'Narrowing yield spreads force institutional funds to liquidate leveraged carry trades, repatriating capital into JPY and selling off global equities and risk assets simultaneously.',
    relatedEventCode: 'BOJ',
    relatedAsset: 'USD/JPY'
  }
];
