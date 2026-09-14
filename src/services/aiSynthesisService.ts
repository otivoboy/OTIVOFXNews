import { GoogleGenAI } from '@google/genai';
import { EconomicEvent, EngineEvaluationResult, AiSynthesis, DirectionSpikeDecision } from '../types';
import { 
  getMatchingMacroPlaybookTopic, 
  calculateDirectionSpikeDecision, 
  generateInstitutionalSynthesisFromPlaybook 
} from '../engines/macroPlaybookDecisionEngine';

/**
 * Clean & extract all usable Gemini API keys from environment variables (.env / .env.local) or custom input
 */
export function getClientGeminiApiKeys(customKey?: string): string[] {
  const keys: string[] = [];

  if (customKey && typeof customKey === 'string') {
    const cleaned = customKey.trim().replace(/^["']|["']$/g, '').trim();
    if (cleaned.length > 5 && cleaned !== 'undefined' && cleaned !== 'null') {
      keys.push(cleaned);
    }
  }

  // Check Vite environment variables and process.env fallback (supporting .env multi-key configurations)
  const rawCandidateKeys = [
    (import.meta as any).env?.GEMINI_API_KEY,
    (import.meta as any).env?.VITE_GEMINI_API_KEY,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_2,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_3,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_4,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_5,
    (import.meta as any).env?.GEMINI_API_KEY_2,
    (import.meta as any).env?.GEMINI_API_KEY_3,
    (import.meta as any).env?.VITE_GOOGLE_API_KEY,
    (import.meta as any).env?.VITE_GOOGLE_API_KEY_2,
    (import.meta as any).env?.VITE_GOOGLE_API_KEY_3,
    (import.meta as any).env?.GOOGLE_API_KEY,
    (import.meta as any).env?.GEMINI_KEY,
    typeof process !== 'undefined' ? (process.env as any)?.GEMINI_API_KEY : undefined,
    typeof process !== 'undefined' ? (process.env as any)?.VITE_GEMINI_API_KEY : undefined,
    typeof process !== 'undefined' ? (process.env as any)?.VITE_GEMINI_API_KEY_2 : undefined,
    typeof process !== 'undefined' ? (process.env as any)?.VITE_GEMINI_API_KEY_3 : undefined,
    typeof process !== 'undefined' ? (process.env as any)?.GEMINI_API_KEY_2 : undefined,
    typeof process !== 'undefined' ? (process.env as any)?.GEMINI_API_KEY_3 : undefined,
    typeof process !== 'undefined' ? (process.env as any)?.GOOGLE_API_KEY : undefined,
    typeof process !== 'undefined' ? (process.env as any)?.GEMINI_KEY : undefined,
  ];

  // Dynamic scan of import.meta.env
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && typeof metaEnv === 'object') {
      for (const k of Object.keys(metaEnv)) {
        if (k.toUpperCase().includes('GEMINI') || k.toUpperCase().includes('GOOGLE_API')) {
          const val = metaEnv[k];
          if (typeof val === 'string') rawCandidateKeys.push(val);
        }
      }
    }
  } catch {}

  // Dynamic scan of process.env if available
  try {
    if (typeof process !== 'undefined' && process.env) {
      for (const k of Object.keys(process.env)) {
        if (k.toUpperCase().includes('GEMINI') || k.toUpperCase().includes('GOOGLE_API')) {
          const val = process.env[k];
          if (typeof val === 'string') rawCandidateKeys.push(val);
        }
      }
    }
  } catch {}

  for (const k of rawCandidateKeys) {
    if (!k || typeof k !== 'string') continue;
    const parts = k.includes(',') ? k.split(',') : [k];
    for (const p of parts) {
      const cleaned = p.trim().replace(/^["']|["']$/g, '').trim();
      if (cleaned.length > 5 && cleaned !== 'undefined' && cleaned !== 'null' && !keys.includes(cleaned)) {
        keys.push(cleaned);
      }
    }
  }

  // Check localStorage if user saved a key in browser
  try {
    const local = localStorage.getItem('gemini_api_key') || localStorage.getItem('macro_engine_config');
    if (local) {
      if (local.startsWith('{')) {
        const parsed = JSON.parse(local);
        if (parsed.geminiKey && typeof parsed.geminiKey === 'string' && parsed.geminiKey.length > 5) {
          const cleaned = parsed.geminiKey.trim().replace(/^["']|["']$/g, '').trim();
          if (cleaned !== 'undefined' && cleaned !== 'null' && !keys.includes(cleaned)) {
            keys.push(cleaned);
          }
        }
      } else if (local.length > 5) {
        const cleaned = local.trim().replace(/^["']|["']$/g, '').trim();
        if (cleaned !== 'undefined' && cleaned !== 'null' && !keys.includes(cleaned)) {
          keys.push(cleaned);
        }
      }
    }
  } catch {}

  return keys;
}

export function getClientGeminiApiKey(customKey?: string): string {
  const keys = getClientGeminiApiKeys(customKey);
  return keys.length > 0 ? keys[0] : '';
}

/**
 * Generate rich institutional fallback synthesis when remote AI is offline or quota exceeded
 */
export function generateInstitutionalSynthesisFallback(
  event: EconomicEvent,
  evaluationResult: EngineEvaluationResult
): AiSynthesis {
  if (evaluationResult.mathematicalExpectation) {
    return generateInstitutionalSynthesisFromPlaybook(
      event,
      evaluationResult.mathematicalExpectation,
      evaluationResult.confirmationPillars
    );
  }

  const primaryAsset = evaluationResult.assetImpacts[0];
  const dxyAsset = evaluationResult.assetImpacts.find((a) => a.symbol === 'DXY' || a.symbol === 'EUR/USD');
  const actualVal = event.actual !== null ? event.actual : 'Deviation';
  const forecastVal = event.forecast !== null ? event.forecast : 'Prior';

  return {
    macroSummary: `Institutional assessment confirms ${evaluationResult.verdictLabel} on ${event.title} (${event.country}). Actual print (${actualVal}) vs consensus (${forecastVal}) confirms macroeconomic bias with front-end yield transmission.`,
    keyRisks: [
      `Secondary central bank governor speeches or unexpected liquidity repo operations`,
      `Cross-asset margin positioning squeeze across correlated ${primaryAsset?.symbol || 'FX'} pairs`,
      `Upcoming companion tier-1 macro indicators scheduled later in the New York session`,
    ],
    playbookSteps: [
      `Execute ${primaryAsset?.action || 'MONITOR'} order flow on ${primaryAsset?.symbol || 'Primary Pair'} targeting ${primaryAsset?.expectedMove || '1.2%'} impulse move`,
      `Structure cross-asset hedges using ${dxyAsset?.symbol || 'USD Benchmark'} bias (${dxyAsset?.bias || 'NEUTRAL'})`,
      `Enforce strict risk invalidation trigger: ${primaryAsset?.invalidationTrigger || 'Loss of structural pre-news session level'}`,
    ],
    volatilityForecast: 'High implied volatility in the initial 30 minutes post-release; expect secondary trend continuation.',
    intermarketCorrelationSummary: 'High negative correlation between Real Yields and Spot Gold; Positive correlation between USD and front-end rate differentials.',
  };
}

/**
 * Executes AI Deep Synthesis:
 * 1. Tries backend `/api/ai-synthesis` (Works on full-stack containers & Express dev/prod servers)
 * 2. Falls back to direct Client Gemini API call (Works on Netlify, Vercel, static builds)
 * 3. Falls back to calculated Institutional Synthesis if network/quota fails
 */
export async function executeAiSynthesis(
  event: EconomicEvent,
  evaluationResult: EngineEvaluationResult,
  customApiKey?: string
): Promise<{ synthesis: AiSynthesis; source: string }> {
  const playbookTopic = getMatchingMacroPlaybookTopic(event);

  // Step 1: Attempt backend proxy first
  try {
    const res = await fetch('/api/ai-synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evaluationResult,
        event,
        apiKey: customApiKey,
        playbookTopic,
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.synthesis && (data.synthesis.macroSummary || data.synthesis.playbookSteps)) {
        // Ensure directionSpikeDecision is attached
        if (!data.synthesis.directionSpikeDecision && evaluationResult.mathematicalExpectation) {
          data.synthesis.directionSpikeDecision = calculateDirectionSpikeDecision(
            event,
            evaluationResult.mathematicalExpectation,
            evaluationResult.confirmationPillars,
            data.synthesis
          );
        }
        return { synthesis: data.synthesis, source: 'backend-ai' };
      }
    }
  } catch {
    // Network or static hosting route - proceed to client-side Gemini execution
  }

  // Step 2: Direct Client Gemini Generation (ideal for Netlify / Static hosting)
  const apiKeys = getClientGeminiApiKeys(customApiKey);
  if (apiKeys.length > 0) {
    try {
      const checklistSummary = evaluationResult.checklist
        .map((c) => `- ${c.label || c.id}: ${c.status.toUpperCase()} (${c.reasoning || c.description || ''})`)
        .join('\n');

      const assetSummary = evaluationResult.assetImpacts
        .map(
          (a) =>
            `- ${a.symbol} (${a.name}): Bias ${a.bias}, Action ${a.action}, Confidence ${a.confidence}%, Est Move: ${a.expectedMove}. Rationale: ${a.transmissionRationale}`
        )
        .join('\n');

      const topicContext = playbookTopic 
        ? `MACRO PLAYBOOK KNOWLEDGE BASE [${playbookTopic.title} (${playbookTopic.code})]:
- Central Bank/Agency: ${playbookTopic.centralBankOrAgency}
- Overview: ${playbookTopic.overview}
- Key Principles: ${playbookTopic.principles.map(p => `${p.title}: ${p.description}`).join('; ')}`
        : '';

      const prompt = `You are a Senior Institutional Macro Trader and Chief Investment Officer at OTIVO FX.
Analyze the following live economic release data, mathematical expectation models, and macro playbook rules to finalize the real institutional decision on ALL affected market pairs news direction spike:

EVENT: ${event.title} (${event.country})
CURRENCY: ${event.currency || 'USD'}
CODE: ${event.code}
ACTUAL: ${event.actual ?? 'Pending Live Release'} | FORECAST: ${event.forecast ?? 'N/A'} | PREVIOUS: ${event.previous ?? 'N/A'}
ENGINE VERDICT: ${evaluationResult.verdictLabel} (Confidence: ${evaluationResult.confidenceScore}%)
PRIMARY THESIS: ${evaluationResult.summaryThesis}

${topicContext}

CHECKLIST ENGINE VERIFICATION STEPS:
${checklistSummary}

MULTI-MARKET ASSET TRANSMISSION MATRIX:
${assetSummary}

Generate an institutional-grade executive synthesis with real AI market pair direction spikes:
1. Macro summary (2-3 concise, high-conviction sentences on what this means for the global business cycle, central bank trajectory, and liquidity).
2. Key risks (3 bullet points identifying trade invalidations, tail risks, or conflicting cross-currents).
3. Tactical Playbook Steps (3 actionable trade execution rules for portfolio managers).
4. Volatility Forecast (1 sentence on expected spread, duration of impulse, and session profile).
5. Intermarket Correlation Summary (1 concise explanation of cross-asset transmission mechanics).
6. Direction Spike Decision with real market pairs (Direct base pairs, inverse quote pairs, sovereign yields, and equity/commodity proxies):
   - For each pair, provide exact spike direction ("BULLISH_SPIKE" | "BEARISH_SPIKE" | "WHIPSAW"), directive ("STRONG BUY" | "BUY" | "STRONG SELL" | "SELL" | "MONITOR"), action ("LONG" | "SHORT" | "FADE SPIKES" | "SELL SPIKES" | "STAND ASIDE"), realistic expectedMove (e.g. "+85 to +130 pips" or "-$40/oz"), targetZone, invalidationZone, playbookRule, and confidence.

Format your response as a valid JSON object matching this schema:
{
  "macroSummary": "...",
  "keyRisks": ["...", "...", "..."],
  "playbookSteps": ["...", "...", "..."],
  "volatilityForecast": "...",
  "intermarketCorrelationSummary": "...",
  "directionSpikeDecision": {
    "verdict": "...",
    "bias": "BULLISH",
    "confidencePercent": 85,
    "horizon": "Peak Impulse: 00:00 - 15:00 min release spike | Session Drift: 1h - 4h",
    "primaryTransmissionVector": "...",
    "groundedPlaybookTopic": "...",
    "affectedPairs": [
      {
        "symbol": "EUR/USD",
        "name": "Euro / US Dollar",
        "category": "FX",
        "isBasePair": false,
        "isQuotePair": true,
        "spikeDirection": "BEARISH_SPIKE",
        "directive": "STRONG SELL",
        "action": "SHORT",
        "expectedMove": "-75 to -120 pips",
        "targetZone": "1.0780 Support Sweep",
        "invalidationZone": "1.0890 Invalidation",
        "playbookRule": "Inverse Quote Transmission: Denominator strength forces downward impulse.",
        "confidence": 88
      }
    ]
  }
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

            const rawText = response?.text || '';
            let cleanText = rawText.trim();
            if (cleanText.startsWith('```')) {
              cleanText = cleanText.replace(/^```[a-z0-9_-]*\s*/i, '').replace(/```\s*$/, '').trim();
            }

            let parsed: any = null;
            try {
              parsed = JSON.parse(cleanText);
            } catch {
              const match = cleanText.match(/\{[\s\S]*\}/);
              if (match) parsed = JSON.parse(match[0]);
            }

            if (parsed && (parsed.macroSummary || parsed.playbookSteps)) {
              let directionSpikeDecision: DirectionSpikeDecision | undefined = parsed.directionSpikeDecision;
              if (
                !directionSpikeDecision || 
                !Array.isArray(directionSpikeDecision.affectedPairs) || 
                directionSpikeDecision.affectedPairs.length === 0
              ) {
                if (evaluationResult.mathematicalExpectation) {
                  directionSpikeDecision = calculateDirectionSpikeDecision(
                    event,
                    evaluationResult.mathematicalExpectation,
                    evaluationResult.confirmationPillars,
                    parsed
                  );
                }
              }

              return {
                synthesis: {
                  macroSummary: parsed.macroSummary || 'Institutional macro analysis completed.',
                  keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks : ['Macro headline volatility risk'],
                  playbookSteps: Array.isArray(parsed.playbookSteps) ? parsed.playbookSteps : ['Monitor primary trend'],
                  volatilityForecast: parsed.volatilityForecast || 'Standard post-release session volatility.',
                  intermarketCorrelationSummary: parsed.intermarketCorrelationSummary || 'Standard cross-asset transmission.',
                  directionSpikeDecision
                },
                source: `gemini-client (${model})`,
              };
            }
          } catch {
            continue;
          }
        }
      }
    } catch (clientErr) {
      console.warn('Client Gemini generation error:', clientErr);
    }
  }

  // Step 3: Reliable fallback synthesis from Macro Playbook Decision Engine
  const fallback = generateInstitutionalSynthesisFallback(event, evaluationResult);
  return { synthesis: fallback, source: 'macro-engine-synthesis' };
}

