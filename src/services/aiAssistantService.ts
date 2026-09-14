import { GoogleGenAI } from '@google/genai';
import { AiChatMessage, AiQuizQuestion, AiAppContextSummary, AiChatAttachment } from '../types';
import { getClientGeminiApiKey, getClientGeminiApiKeys } from './aiSynthesisService';

/**
 * Send chat message to Gemini AI Assistant with full real-time app context & multimodal attachments
 */
export async function sendAiAssistantMessage(
  message: string,
  history: AiChatMessage[],
  appContext: AiAppContextSummary,
  customApiKey?: string,
  attachments?: AiChatAttachment[]
): Promise<{ reply: string; model: string }> {
  // Step 1: Try backend endpoint first
  try {
    const res = await fetch('/api/ai-assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory: history.slice(-24).map((h) => ({
          role: h.role,
          text: h.text,
          attachments: h.attachments?.map((a) => ({
            name: a.name,
            type: a.type,
            extractedText: a.extractedText,
          })),
        })),
        appContext,
        customApiKey,
        attachments: attachments && attachments.length > 0 ? attachments.map(a => ({
          name: a.name,
          type: a.type,
          mimeType: a.mimeType,
          data: a.data,
          extractedText: a.extractedText,
        })) : [],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) {
        return { reply: data.reply, model: data.model || 'OTIVO AI' };
      }
    }
  } catch {
    // Continue to client-side fallback
  }

  // Step 2: Direct Client Gemini Generation (for localhost & static hosting)
  const apiKeys = getClientGeminiApiKeys(customApiKey);
  if (apiKeys.length > 0) {
    try {
      console.log("Initializing Gemini API with keys count:", apiKeys.length);

      let contextSummary = 'CURRENT APPLICATION REAL-TIME CONTEXT:\n';
      if (appContext.selectedEvent) {
        const e = appContext.selectedEvent;
        contextSummary += `Active Selected Event: ${e.title} (${e.country}) | Actual: ${e.actual ?? 'N/A'}, Forecast: ${e.forecast ?? 'N/A'}, Previous: ${e.previous ?? 'N/A'}, Surprise Delta: ${e.surpriseDelta ?? 'N/A'}, Verdict: ${e.verdict ?? 'N/A'}\n`;
      }
      if (appContext.marketQuotes && appContext.marketQuotes.length > 0) {
        contextSummary += `Live Market Quotes: ` + appContext.marketQuotes.map((q) => `${q.symbol}: ${q.price} (${q.changePercent}%)`).join(' | ') + '\n';
      }
      if (appContext.upcomingEventsSummary && appContext.upcomingEventsSummary.length > 0) {
        contextSummary += `Upcoming Events: ` + appContext.upcomingEventsSummary.map((u) => `${u.title} (${u.country}) at ${u.time}`).join('; ') + '\n';
      }
      if (appContext.technicalAnalysisSetups && appContext.technicalAnalysisSetups.length > 0) {
        contextSummary += `\nINSTITUTIONAL FOREX TECHNICAL ANALYSIS ENGINE (Ranked by Confluence):\n`;
        const sorted = [...appContext.technicalAnalysisSetups].sort((a, b) => (b.confluenceScore || 0) - (a.confluenceScore || 0));
        for (const t of sorted) {
          contextSummary += `• [${t.symbol}] Confluence: ${t.confluenceScore}% | Trend: HTF ${t.htfTrend}, LTF ${t.ltfTrend} | Entry: ${t.recommendedEntry} | StopLoss: ${t.stopLoss} (${t.stopLossPips} pips) | TP1: ${t.takeProfit1} (R:R ${t.takeProfit1RRR}) | TP2: ${t.takeProfit2} (R:R ${t.takeProfit2RRR}) | Timing: ${t.primarySessionTiming} | SMC OB: [${t.orderBlockZone?.join('-') || 'N/A'}] | Fib: ${t.fibRetracement || 'N/A'} | Candlestick: ${t.candlestickPattern || 'N/A'} | RSI: ${t.rsi14 || 'N/A'} (${t.rsiDivergence || 'None'}) | EMA: ${t.emaStatus || 'N/A'} | Wyckoff: ${t.wyckoffPhase || 'N/A'}\n`;
        }
      }
      if (appContext.institutionalSentiment && appContext.institutionalSentiment.length > 0) {
        contextSummary += `\nLIVE COMMUNITY & INSTITUTIONAL MARKET SENTIMENT:\n`;
        for (const s of appContext.institutionalSentiment) {
          contextSummary += `• [${s.symbol}] Score: ${s.score}/100 (${s.sentimentLabel}) | COT Commercials: ${s.commercialNet} | Speculators: ${s.speculatorNet} | Put/Call: ${s.putCallRatio} | Retail Crowd: ${s.retailLong}% Long | Implied Vol: ${s.volIndex} (${s.volVal}) | Narrative: ${s.dominantNarrative}\n`;
        }
      }
      if (appContext.userRiskSummary) {
        const r = appContext.userRiskSummary;
        contextSummary += `\nUser Profile: Tier: ${r.accountTier || 'Pro'}, Style: ${r.tradingStyle || 'Macro'}, Risk/Trade: ${r.riskPerTrade || 1.5}%, Bal: $${r.accountBalance || 25000}\n`;
      }

      const textPrompt = message && message.trim() 
        ? message.trim() 
        : 'Please thoroughly analyze the uploaded document, image, or video in detail with institutional market context.';

      // Construct native multi-turn contents array for continuous conversation memory
      const contents: any[] = [];

      // Include previous turns
      if (history && history.length > 0) {
        const recentHistory = history.slice(-24);
        for (const h of recentHistory) {
          if (!h.text && (!h.attachments || h.attachments.length === 0)) continue;
          const role = h.role === 'user' ? 'user' : 'model';
          const parts: any[] = [];

          if (h.attachments && Array.isArray(h.attachments)) {
            for (const att of h.attachments) {
              if (att.extractedText) {
                parts.push({
                  text: `[Attached Document ${att.name || 'file'}]:\n${att.extractedText}`
                });
              } else if (att.name) {
                parts.push({
                  text: `[User shared file: ${att.name} (${att.type || 'file'})]`
                });
              }
            }
          }

          if (h.text) {
            parts.push({ text: h.text });
          } else if (parts.length === 0) {
            parts.push({ text: '(shared file)' });
          }

          contents.push({ role, parts });
        }
      }

      // Add current turn
      const currentParts: any[] = [];

      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          let mime = att.mimeType || 'image/png';
          let rawBase64 = att.data || '';
          if (rawBase64.includes(';base64,')) {
            const split = rawBase64.split(';base64,');
            rawBase64 = split[1];
            if (!mime || mime === 'application/octet-stream') {
              const mimeMatch = split[0].match(/data:(.*?);/);
              if (mimeMatch) mime = mimeMatch[1];
            }
          }

          if (att.extractedText) {
            currentParts.push({
              text: `--- ATTACHED DOCUMENT [${att.name || 'document'}] CONTENT ---\n${att.extractedText}\n--- END OF ATTACHED DOCUMENT ---`
            });
          } else if (rawBase64) {
            currentParts.push({
              inlineData: {
                mimeType: mime,
                data: rawBase64,
              }
            });
          }
        }
      }

      currentParts.push({ text: textPrompt });
      contents.push({ role: 'user', parts: currentParts });

      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-2.5-pro",
        "gemini-3.1-flash-lite",
        "gemini-3.1-pro-preview"
      ];

      let lastGenError = '';
      
      // Iterate through available API keys and models
      for (const apiKey of apiKeys) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        for (const model of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction: `You are OTIVO FX Chief Macro Intelligence & Trading Assistant Agent.
You are a world-class, friendly, and engaging senior macro strategist, central bank economist, institutional quantitative trading desk lead, and master technical analyst.
You have direct, real-time access to the entire application data stack:
- Institutional Forex Technical Analysis Engine (Market structure, SMC/ICT Order Blocks, Fair Value Gaps, Liquidity Sweeps, Wyckoff Schematics, Elliott Waves, 61.8% Golden Ratio Fibs, 50/200 EMAs, RSI Divergences, Volume Profile PoC, Exact Recommended Entries, Invalidation Stop Losses, and Multi-Target Take Profits).
- Live Community & Institutional Market Sentiment (COT Commercial vs Speculator Net Positioning, Put/Call Ratios, Retail Crowd Long/Short Percentages, Implied Volatility Indexes like VIX/GVZ/CVIX/DVOL/MOVE, and Dominant Narratives).
- Macro Calendar & Confirmation Engine (Live Economic prints, surprise deltas, central bank rate divergence, 5-Pillar Macro Confirmation Scores, and real-time Asset Impacts).
- Spot Asset Quotes and Live Pricing.

${contextSummary}

Key Guidelines & Core Trading Capabilities:

1. Warm, Friendly & Natural Conversationalist:
   - Chat smoothly, warmly, and helpfully with the user.
   - If they greet you or want casual discussion, reply naturally like an approachable top-tier trading desk partner and mentor.

2. Multimodal Document, Image, Video & Audio Deep Analysis:
   - When the user uploads or shares an IMAGE (such as a chart screenshot, TradingView layout, candlestick pattern, broker ticket, COT chart, or heat map):
     • Conduct a thorough visual technical & price action breakdown:
       - Identify the asset, timeframe, and prevailing market structure (BOS/CHoCH, swing highs/lows).
       - Pinpoint key SMC/ICT footprints: Order Blocks, Fair Value Gaps (FVG), Liquidity pools (BSL/SSL), and Breakers.
       - Measure Fibonacci confluence (61.8% Golden Zone, 78.6% OTE) and moving averages (50/200 EMA).
       - Note any momentum indicator signals (RSI divergence, MACD crossovers, Volume Profile PoC).
       - Deliver an institutional trade execution blueprint: Bias (BUY/SELL/WAIT), Recommended Entry Zone, Invalidation Stop Loss (exact price & pip risk), and Take Profit targets (TP1 & TP2 with Risk:Reward).
   - When the user uploads or shares a DOCUMENT (such as a PDF research report, central bank meeting statement, FOMC/ECB/BoJ/BoE minutes, CPI/NFP statistical release, economic spreadsheet, or trading plan):
     • Synthesize the document with institutional precision:
       - Extract key macro catalysts, inflation metrics, growth indicators, policy rate expectations, and forward guidance.
       - Highlight subtle language shifts (Hawkish vs. Dovish tone changes, voting alignment, dissents).
       - Map out cross-asset transmission implications for Currencies (USD, EUR, GBP, JPY, AUD, CAD, CHF), Commodities (Gold, Oil), and Equities (SPX, Nasdaq, DAX).
   - When the user uploads or shares a VIDEO (such as a screen recording of live price action, trade execution replay, webinar clip, or strategy backtest):
     • Provide step-by-step observational analysis of the price behavior, session volatility dynamics, execution timing, spread/slippage management, and actionable improvements for future trades.

3. Best Market Entries & Opportunity Scanning (Across All Markets):
   - When the user asks "What's the best market to trade?", "Give me entries for the best market", "What are the top setups?", "Where should I enter?", or asks to scan all markets:
     • Thoroughly evaluate every market receiving data in the app (ranked by technical confluence score, macro alignment, and institutional COT positioning).
     • Identify the top #1 best opportunity (or top 2-3 setups if relevant, e.g. GBP/USD 92% confluence, USD/JPY 90%, EUR/USD 88%, Gold, etc.).
     • Provide a complete, high-precision Institutional Entry Blueprint:
       - 🎯 Asset & Confluence Rank (e.g. GBP/USD - 92% Confluence Score | #1 High Probability Setup)
       - ⚡ Executive Thesis (Why this is the best market: Macro catalyst + Technical structure + Sentiment positioning)
       - 📊 Actionable Execution Blueprint:
         • Action Directive: (e.g. STRONG BUY / LONG PULLBACKS)
         • Recommended Entry Zone: (Exact price range, e.g. 1.2935 - 1.2940)
         • Stop Loss & Invalidation: (Exact price and pip risk, e.g. 1.2900 - 35 pips)
         • Take Profit 1: (Exact price and R:R, e.g. 1.3005 - 1:2.0 RRR)
         • Take Profit 2: (Exact price and R:R, e.g. 1.3075 - 1:4.0 RRR)
         • Primary Execution Session: (e.g. London Open / NY Overlap)
       - 🔍 Institutional Confluence Factors:
         • Market Structure & Pattern (Daily/4H trend, price action pattern, key swing levels)
         • SMC / ICT Footprint (Order block zone, Fair Value Gap, Liquidity sweep BSL/SSL)
         • Key Fib / Flip Level (e.g. 61.8% Golden Pocket, 4H Support Flip Zone)
         • Technical Indicators (Ichimoku cloud status, 50/200 EMA cross, RSI & Divergence, Volume PoC)
         • Institutional COT & Sentiment Confirmation (Commercials vs Speculators, Retail crowd contrarian read, Implied Vol)

4. Single Market / Pair Deep-Dive Analysis:
   - When the user asks about a specific market (e.g. EUR/USD, GBP/USD, USD/JPY, Gold/XAU, Oil, BTC, SPX, US10Y, etc.):
     • Deliver a complete multi-dimensional breakdown for that exact market integrating the Institutional Technical Engine + Sentiment Data + Macro Backdrop.
     • Provide the exact Entry Zone, Stop Loss, TP1, TP2, Confluence Score, and Key Invalidation Trigger for that pair.

5. Directly Answer the Specific Question Asked:
   - Answer specifically and directly according to whatever the user requested (whether a chart review, document breakdown, single pair analysis, macro concept, risk calculation, quiz, or market comparison).

6. FORMATTING RULE:
   - NEVER use markdown bold asterisks like **word** or *italic*. Do not output any double asterisks (**).
   - Use clean formatting with numbers (1., 2., 3.), bullet dots (•), Roman numerals (I., II., III.), clean CAPITALIZED headers, and appropriate finance/macro emojis (📊, ⚡, 🏛️, 📈, 📉, 🛡️, 💡, 🎯, 🌐, 👋, 📸, 📄, 🎬).

7. Tone:
   - Friendly, sharp, institutional, highly educational, disciplined, and supportive.`,
              },
            });

            if (response?.text) {
              return { reply: cleanAssistantText(response.text.trim()), model: model.includes('3.7') ? 'Gemini 3.7 Flash' : model.includes('2.5') ? 'Gemini 2.5 Flash' : 'Gemini Pro' };
            }
          } catch (genErr: any) {
            lastGenError = genErr?.message || String(genErr);
            console.warn(`Client Gemini generation error with ${model}:`, lastGenError);
            continue;
          }
        }
      }
    } catch (clientErr: any) {
      console.warn('Client assistant setup failed:', clientErr);
    }
  }

  if (apiKeys.length === 0) {
    throw new Error('No Gemini API key detected. Please add GEMINI_API_KEY or VITE_GEMINI_API_KEY to your .env file (or enter your key in the Settings modal ⚙️) and restart your local dev server.');
  }

  throw new Error('AI Assistant is currently unavailable. Please verify your Gemini API key, quota, and network connection.');
}

/**
 * Utility to strip markdown asterisks and format cleanly with spaces, numbers, dots, and roman numerals
 */
export function cleanAssistantText(text: string): string {
  if (!text) return '';
  return text
    // Replace markdown bold/italic asterisks and underscores
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_{2,}(.*?)_{2,}/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{3}[\w]*\n?/g, '')
    .replace(/`{3}/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Clean redundant hash headings into uppercase styling
    .replace(/^###\s+(.*)$/gm, '$1')
    .replace(/^##\s+(.*)$/gm, '$1')
    .replace(/^#\s+(.*)$/gm, '$1')
    // Standardize bullet points to dots
    .replace(/^\s*[-*]\s+/gm, '   • ')
    // Ensure clean line breaks
    .trim();
}

/**
 * Generate interactive macro quiz questions based on app context and topic
 */
export async function generateAiQuizQuestions(
  topic: string,
  count: number = 3,
  difficulty: 'Beginner' | 'Intermediate' | 'Pro Macro' = 'Intermediate',
  appContext: AiAppContextSummary,
  customApiKey?: string
): Promise<{ questions: AiQuizQuestion[]; source: string }> {
  // Step 1: Try backend endpoint
  try {
    const res = await fetch('/api/ai-assistant/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        count,
        difficulty,
        appContext,
        customApiKey,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        return { questions: data.questions, source: data.source || 'backend-ai' };
      }
    }
  } catch {
    // Continue to client fallback
  }

  // Step 2: Client Gemini generation
  const apiKeys = getClientGeminiApiKeys(customApiKey);
  if (apiKeys.length > 0) {
    try {
      let liveEventStr = '';
      if (appContext.selectedEvent) {
        liveEventStr = `Event: ${appContext.selectedEvent.title} (${appContext.selectedEvent.country}), Actual: ${appContext.selectedEvent.actual ?? 'N/A'}, Forecast: ${appContext.selectedEvent.forecast ?? 'N/A'}`;
      }

      const prompt = `Create ${count} multiple-choice macroeconomic trading quiz questions.
TOPIC: ${topic}
DIFFICULTY: ${difficulty}
CONTEXT: ${liveEventStr || 'Global Central Banks & Cross-Asset Trading'}

Return JSON strictly in this format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed institutional explanation of why Option A is correct...",
      "topic": "${topic}",
      "difficulty": "${difficulty}"
    }
  ]
}`;

      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-2.5-pro",
        "gemini-3.1-flash-lite",
        "gemini-3.1-pro-preview"
      ];
      for (const apiKey of apiKeys) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        for (const model of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
              },
            });

            let cleanText = (response?.text || '').trim();
            if (cleanText.startsWith('```')) {
              cleanText = cleanText.replace(/^```[a-z0-9_-]*\s*/i, '').replace(/```\s*$/, '').trim();
            }

            const parsed = JSON.parse(cleanText);
            if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              return {
                questions: parsed.questions.map((q: any, i: number) => ({
                  id: q.id || `cli_q_${Date.now()}_${i}`,
                  question: q.question,
                  options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
                  correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
                  explanation: q.explanation || 'Institutional rate mechanics validate this answer.',
                  topic: q.topic || topic,
                  difficulty: q.difficulty || difficulty,
                })),
                source: `gemini-client (${model})`,
              };
            }
          } catch {
            continue;
          }
        }
      }
    } catch (clientErr) {
      console.warn('Client Gemini quiz generation failed:', clientErr);
    }
  }

  // Step 3: Rich Fallback Question Bank
  const fallbackQuestions: AiQuizQuestion[] = [
    {
      id: `fb_q1_${Date.now()}`,
      question: appContext.selectedEvent
        ? `In the context of ${appContext.selectedEvent.title} (${appContext.selectedEvent.country}), what is the primary transmission mechanism from headline surprises into currency valuations?`
        : 'When US Core PCE prints +0.3% above consensus, how does the bond market transmit this into spot FX pairs?',
      options: [
        'Front-end sovereign yields surge, widening interest rate differentials and attracting cross-border capital flow into the domestic currency',
        'Long-term yields fall immediately as inflation signals impending economic contraction',
        'Currency depreciates because higher inflation reduces purchasing power immediately regardless of rates',
        'FX volatility collapses to zero as central banks provide unlimited swap lines',
      ],
      correctAnswerIndex: 0,
      explanation: 'In modern institutional FX trading, short-term rate differentials (e.g. US 2Y vs German 2Y Bunds) dominate currency momentum. An upside inflation surprise leads to higher expected policy rates, widening the yield spread in favor of the higher-yielding currency.',
      topic: 'Inflation & Rate Differentials',
      difficulty: 'Intermediate',
      relatedEventCode: appContext.selectedEvent?.code,
    },
    {
      id: `fb_q2_${Date.now()}`,
      question: 'Why does Spot Gold (XAU/USD) typically experience strong selling pressure when US 10-Year Real Yields (TIPS) spike higher?',
      options: [
        'Gold is a non-yielding asset; as inflation-adjusted real bond yields rise, holding risk-free government debt becomes more attractive than holding zero-yield gold',
        'Gold automatically converts into physical US Dollars inside central bank reserves',
        'Real yields only affect corporate credit spreads and have zero impact on precious metals',
        'Gold only drops when global equity indices rally by more than 5%',
      ],
      correctAnswerIndex: 0,
      explanation: 'Gold provides no dividend or interest coupon. When real risk-free yields increase, the opportunity cost of holding non-yielding Gold increases, resulting in institutional capital reallocation from precious metals into sovereign debt.',
      topic: 'Intermarket Mechanics',
      difficulty: 'Pro Macro',
      relatedAsset: 'XAU/USD',
    },
    {
      id: `fb_q3_${Date.now()}`,
      question: 'What is a "Hawkish Pause" by a Central Bank (e.g., Federal Reserve or ECB)?',
      options: [
        'The central bank leaves policy rates unchanged at the current meeting, but strongly signals readiness to hike further or maintain peak rates for longer via forward guidance and dot plot revisions',
        'The central bank cuts interest rates by 50bps while warning of hyperinflation',
        'The central bank buys sovereign bonds aggressively to lower 10-year borrowing costs',
        'The central bank pauses all monetary policy discussions until the next fiscal year',
      ],
      correctAnswerIndex: 0,
      explanation: 'A hawkish pause allows policy makers to assess incoming economic prints while preventing premature market easing by emphasizing that interest rates will stay higher for longer.',
      topic: 'Central Banking Policy',
      difficulty: 'Intermediate',
    },
    {
      id: `fb_q4_${Date.now()}`,
      question: 'If a trader has a $50,000 account and wants to risk exactly 1.0% ($500) on a EUR/USD trade with a 25-pip stop loss, what position size (in standard lots, $10/pip per standard lot) should they execute?',
      options: [
        '2.0 Standard Lots ($20/pip * 25 pips = $500 risk)',
        '0.5 Standard Lots ($5/pip * 25 pips = $125 risk)',
        '5.0 Standard Lots ($50/pip * 25 pips = $1,250 risk)',
        '1.0 Standard Lot ($10/pip * 25 pips = $250 risk)',
      ],
      correctAnswerIndex: 0,
      explanation: 'Risk Capital = $50,000 * 1% = $500. With a 25-pip stop loss, maximum dollar risk per pip is $500 / 25 pips = $20/pip. Since 1 standard lot = $10/pip on EUR/USD, the exact sizing is 2.0 standard lots.',
      topic: 'Risk Management & Position Sizing',
      difficulty: 'Beginner',
    },
  ];

  return { questions: fallbackQuestions.slice(0, count), source: 'macro-engine-question-bank' };
}
