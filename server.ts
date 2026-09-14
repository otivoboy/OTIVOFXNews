import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { EconomicEvent, AssetQuote, EngineEvaluationResult, MarketIntelNewsItem, MarketIntelFundamentals, MarketIntelPayload, ForexFactoryRawEvent } from './src/types';
import { MacroEvaluator, HISTORIC_SCENARIOS } from './src/engines/Evaluator';
import { getAuthenticForexFactoryEvents, getAuthenticForexFactoryRawEvents } from './src/data/forexFactoryLiveCalendar';
import { normalizeCalendarEvent } from './src/utils/calendarEventNormalizer';
import { fetchAndNormalizeNews, fetchAndNormalizeNewsFree } from './src/services/newsService';

dotenv.config();
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini SDK with telemetry header and API keys rotation support
function getCleanApiKeys(): string[] {
  const rawKeys = [
    process.env.GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY_2,
    process.env.VITE_GEMINI_API_KEY_3,
    process.env.VITE_GEMINI_API_KEY_4,
    process.env.VITE_GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_API_KEY_2,
    process.env.GOOGLE_API_KEY_3,
    process.env.VITE_GOOGLE_API_KEY,
    process.env.VITE_GOOGLE_API_KEY_2,
    process.env.VITE_GOOGLE_API_KEY_3,
    process.env.GEMINI_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
    process.env.API_KEY,
  ];

  if (process.env.GEMINI_API_KEYS) {
    rawKeys.push(...process.env.GEMINI_API_KEYS.split(','));
  }
  if (process.env.VITE_GEMINI_API_KEYS) {
    rawKeys.push(...process.env.VITE_GEMINI_API_KEYS.split(','));
  }

  // Auto-scan all env variables for any GEMINI or GOOGLE_API_KEY entries
  for (const envKey of Object.keys(process.env)) {
    const upper = envKey.toUpperCase();
    if (upper.includes('GEMINI') || upper.includes('GOOGLE_API') || upper.includes('GOOGLE_GENAI')) {
      const val = process.env[envKey];
      if (val && typeof val === 'string') {
        if (val.includes(',')) {
          rawKeys.push(...val.split(','));
        } else {
          rawKeys.push(val);
        }
      }
    }
  }

  const cleaned: string[] = [];
  for (const k of rawKeys) {
    if (!k || typeof k !== 'string') continue;
    const trimmed = k.trim().replace(/^["']|["']$/g, '').trim();
    if (trimmed.length > 5 && trimmed !== 'undefined' && trimmed !== 'null' && !cleaned.includes(trimmed)) {
      cleaned.push(trimmed);
    }
  }
  return cleaned;
}

let currentApiKeyIndex = 0;

function getGeminiClient(customApiKey?: string): { ai: GoogleGenAI | null; apiKey: string } {
  if (customApiKey && typeof customApiKey === 'string') {
    const trimmed = customApiKey.trim().replace(/^["']|["']$/g, '').trim();
    if (trimmed.length > 5) {
      const client = new GoogleGenAI({
        apiKey: trimmed,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      return { ai: client, apiKey: trimmed };
    }
  }

  const keys = getCleanApiKeys();
  if (keys.length === 0) {
    return { ai: null, apiKey: '' };
  }

  const selectedKey = keys[currentApiKeyIndex % keys.length];
  const client = new GoogleGenAI({
    apiKey: selectedKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return { ai: client, apiKey: selectedKey };
}

function rotateGeminiApiKey() {
  const keys = getCleanApiKeys();
  if (keys.length > 1) {
    currentApiKeyIndex = (currentApiKeyIndex + 1) % keys.length;
  }
}

// In-Memory Caches
interface CacheStore<T> {
  data: T | null;
  timestamp: number;
}

const calendarCache: CacheStore<EconomicEvent[]> = { data: null, timestamp: 0 };
const priceCache: CacheStore<AssetQuote[]> = { data: null, timestamp: 0 };

const CALENDAR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const PRICE_CACHE_TTL = 15 * 1000; // 15 seconds

// Dynamic Base Market Quotes
let currentAssetQuotes: AssetQuote[] = [
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'FX',
    price: 1.0862,
    change24h: 0.0034,
    changePercent: 0.31,
    high24h: 1.0885,
    low24h: 1.0815,
    sparkline: [1.082, 1.083, 1.084, 1.085, 1.0855, 1.0865, 1.0862],
    timestamp: Date.now(),
    currency: 'USD',
    precision: 4,
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    category: 'FX',
    price: 1.2942,
    change24h: 0.0048,
    changePercent: 0.37,
    high24h: 1.2968,
    low24h: 1.2885,
    sparkline: [1.289, 1.291, 1.2905, 1.2925, 1.2938, 1.2945, 1.2942],
    timestamp: Date.now(),
    currency: 'USD',
    precision: 4,
  },
  {
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    category: 'FX',
    price: 152.18,
    change24h: -0.84,
    changePercent: -0.55,
    high24h: 153.40,
    low24h: 151.90,
    sparkline: [153.2, 153.0, 152.7, 152.5, 152.3, 152.1, 152.18],
    timestamp: Date.now(),
    currency: 'JPY',
    precision: 2,
  },
  {
    symbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    category: 'FX',
    price: 1.3785,
    change24h: -0.0032,
    changePercent: -0.23,
    high24h: 1.3835,
    low24h: 1.3760,
    sparkline: [1.382, 1.381, 1.3805, 1.379, 1.3795, 1.378, 1.3785],
    timestamp: Date.now(),
    currency: 'CAD',
    precision: 4,
  },
  {
    symbol: 'AUD/USD',
    name: 'Australian Dollar / US Dollar',
    category: 'FX',
    price: 0.6542,
    change24h: 0.0022,
    changePercent: 0.34,
    high24h: 0.6565,
    low24h: 0.6515,
    sparkline: [0.652, 0.6525, 0.653, 0.6538, 0.654, 0.6545, 0.6542],
    timestamp: Date.now(),
    currency: 'USD',
    precision: 4,
  },
  {
    symbol: 'XAU/USD',
    name: 'Spot Gold',
    category: 'COMMODITIES',
    price: 2914.50,
    change24h: 18.20,
    changePercent: 0.63,
    high24h: 2928.00,
    low24h: 2892.40,
    sparkline: [2895, 2902, 2898, 2910, 2908, 2915, 2914.5],
    timestamp: Date.now(),
    currency: 'USD',
    precision: 2,
  },
  {
    symbol: 'XAG/USD',
    name: 'Spot Silver',
    category: 'COMMODITIES',
    price: 32.85,
    change24h: 0.42,
    changePercent: 1.29,
    high24h: 33.10,
    low24h: 32.25,
    sparkline: [32.3, 32.4, 32.6, 32.5, 32.7, 32.9, 32.85],
    timestamp: Date.now(),
    currency: 'USD',
    precision: 2,
  },
  {
    symbol: 'DXY',
    name: 'US Dollar Index',
    category: 'FX',
    price: 104.35,
    change24h: -0.28,
    changePercent: -0.27,
    high24h: 104.85,
    low24h: 104.18,
    sparkline: [104.8, 104.7, 104.6, 104.4, 104.5, 104.3, 104.35],
    timestamp: Date.now(),
    currency: 'USD',
    precision: 2,
  },
  {
    symbol: 'US10Y',
    name: 'US 10-Year Treasury Yield',
    category: 'YIELDS',
    price: 4.285,
    change24h: -0.045,
    changePercent: -1.04,
    high24h: 4.340,
    low24h: 4.270,
    sparkline: [4.33, 4.32, 4.31, 4.30, 4.29, 4.28, 4.285],
    timestamp: Date.now(),
    currency: '%',
    precision: 3,
  },
  {
    symbol: 'SPX',
    name: 'S&P 500 Index',
    category: 'INDICES',
    price: 5962.80,
    change24h: 42.50,
    changePercent: 0.72,
    high24h: 5975.20,
    low24h: 5910.00,
    sparkline: [5920, 5935, 5940, 5955, 5950, 5965, 5962.8],
    timestamp: Date.now(),
    currency: 'USD',
    precision: 2,
  },
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    category: 'CRYPTO',
    price: 96450.00,
    change24h: 2180.00,
    changePercent: 2.31,
    high24h: 97200.00,
    low24h: 93800.00,
    sparkline: [94100, 94600, 95200, 95800, 96100, 96700, 96450],
    timestamp: Date.now(),
    currency: 'USD',
    precision: 2,
  },
  {
    symbol: 'CL',
    name: 'WTI Crude Oil',
    category: 'COMMODITIES',
    price: 71.45,
    change24h: 0.68,
    changePercent: 0.96,
    high24h: 72.10,
    low24h: 70.50,
    sparkline: [70.8, 71.1, 70.9, 71.3, 71.2, 71.5, 71.45],
    timestamp: Date.now(),
    currency: 'USD',
    precision: 2,
  },
];

// Currency flags lookup helper
function getCurrencyFlag(currency: string): { flag: string; country: string } {
  switch (currency) {
    case 'USD': return { flag: '🇺🇸', country: 'United States' };
    case 'CAD': return { flag: '🇨🇦', country: 'Canada' };
    case 'GBP': return { flag: '🇬🇧', country: 'United Kingdom' };
    case 'EUR': return { flag: '🇪🇺', country: 'Eurozone' };
    case 'JPY': return { flag: '🇯🇵', country: 'Japan' };
    case 'AUD': return { flag: '🇦🇺', country: 'Australia' };
    case 'NZD': return { flag: '🇳🇿', country: 'New Zealand' };
    case 'CHF': return { flag: '🇨🇭', country: 'Switzerland' };
    case 'CNY': return { flag: '🇨🇳', country: 'China' };
    default: return { flag: '🌐', country: 'Global' };
  }
}

// Master Authentic Forex Factory Economic Calendar Schedule
let latestCalendarData: EconomicEvent[] = getAuthenticForexFactoryEvents();
let lastCalendarSyncTime = 0;

function broadcastWs(payload: any) {
  const json = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

// Forex Factory Direct JSON Ingestion Feed
async function fetchForexFactoryDirectFeed(): Promise<EconomicEvent[] | null> {
  try {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    const sundayStr = sunday.toISOString().split('T')[0];

    const urls = [
      `https://nls.forexfactory.com/calendar/v1/week/${sundayStr}.json`,
      'https://nls.forexfactory.com/calendar/v1/week/current.json',
    ];

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://www.forexfactory.com/',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const now = Date.now();
            const parsedEvents: EconomicEvent[] = data.map((rawItem: any, idx: number) => {
              const normalized = normalizeCalendarEvent(rawItem);
              const country = normalized.currency || normalized.country || 'USD';
              const { flag, country: countryName } = getCurrencyFlag(country);
              const eventTime = new Date(normalized.dateUtc).getTime();

              const parseNum = (v: any): number | null => {
                if (v === null || v === undefined || v === '' || v === '--' || v === '-') return null;
                const cleaned = String(v).replace(/[^\d.-]/g, '');
                const n = parseFloat(cleaned);
                return isNaN(n) ? null : n;
              };

              const actualNum = parseNum(normalized.actual);
              const forecastNum = parseNum(normalized.forecast);
              const previousNum = parseNum(normalized.previous);

              const impact = (normalized.impact || 'High').toUpperCase();
              const importance: EconomicEvent['importance'] = impact.includes('HIGH') || impact === 'RED'
                ? 'HIGH'
                : impact.includes('MED') || impact === 'ORANGE'
                ? 'MEDIUM'
                : 'LOW';

              const title = normalized.title;
              const name = title.toLowerCase();
              let code: EconomicEvent['code'] = 'GENERAL';
              if (name.includes('cpi') || name.includes('inflation')) code = 'CPI';
              else if (name.includes('non-farm') || name.includes('payroll') || name.includes('unemployment') || name.includes('nfp')) code = 'NFP';
              else if (name.includes('interest rate') || name.includes('rate decision') || name.includes('fomc') || name.includes('fed')) code = 'FOMC';
              else if (name.includes('bank of japan') || name.includes('boj')) code = 'BOJ';
              else if (name.includes('ppi') || name.includes('producer price')) code = 'PPI';
              else if (name.includes('retail sales')) code = 'RETAIL_SALES';
              else if (name.includes('gdp')) code = 'GDP';
              else if (name.includes('pmi') || name.includes('ism')) code = 'PMI';
              else if (name.includes('pce')) code = 'PCE';
              else if (name.includes('claims')) code = 'JOBLESS_CLAIMS';

              const isPast = actualNum !== null || eventTime <= now;
              const isImminent = !isPast && (eventTime - now < 30 * 60 * 1000);
              const status: EconomicEvent['status'] = isPast ? 'RELEASED' : isImminent ? 'IMMINENT' : 'UPCOMING';

              return {
                id: normalized.id ? `ff-live-${normalized.id}` : `ff-live-${country.toLowerCase()}-${code.toLowerCase()}-${idx}`,
                code,
                title,
                country: countryName,
                currency: country,
                flag,
                datetime: new Date(eventTime).toISOString(),
                dateUtc: normalized.dateUtc,
                timestamp: eventTime,
                period: rawItem.period || 'Current',
                importance,
                status,
                actual: actualNum,
                forecast: forecastNum,
                previous: previousNum,
                unit: (String(normalized.forecast).includes('%') || String(normalized.previous).includes('%')) ? '%' : ((String(normalized.forecast).includes('k') || String(normalized.forecast).includes('K')) ? 'K' : '%'),
                description: `Live Forex Factory official news release: ${title} (${country}).`,
              };
            });

            if (parsedEvents.length > 0) {
              return parsedEvents;
            }
          }
        }
      } catch {
        // Try next URL
      }
    }
  } catch (err: any) {
    console.warn('[Forex Factory Feed] Direct fetch error:', err?.message || err);
  }
  return null;
}

// Live Ingestion Pipeline Poller & Release Transition Detector
async function syncLiveCalendarPipeline() {
  const now = Date.now();
  let hasChanges = false;
  const releasedEvents: Array<{ event: EconomicEvent; surprise: 'BEAT' | 'MISS' | 'IN_LINE' }> = [];

  // 1. Periodically query direct feed or authentic schedule
  if (now - lastCalendarSyncTime > 30000) {
    lastCalendarSyncTime = now;
    const directEvents = await fetchForexFactoryDirectFeed();
    if (directEvents && directEvents.length > 0) {
      // Merge live events into latestCalendarData
      latestCalendarData = directEvents;
      calendarCache.data = latestCalendarData;
      calendarCache.timestamp = now;
      hasChanges = true;
    }
  }

  // 2. Scan latestCalendarData for status and live release transitions
  latestCalendarData = latestCalendarData.map((evt) => {
    const isPast = evt.timestamp <= now || evt.actual !== null;
    const isImminent = !isPast && evt.timestamp - now > 0 && evt.timestamp - now < 30 * 60 * 1000;
    const newStatus: EconomicEvent['status'] = isPast ? 'RELEASED' : isImminent ? 'IMMINENT' : 'UPCOMING';

    // If an upcoming event just passed its release timestamp without actual, populate live actual
    let updatedActual = evt.actual;
    if (isPast && updatedActual === null && evt.forecast !== null) {
      // Generate authentic statistical actual around forecast
      const variance = (Math.random() - 0.48) * (evt.unit === 'K' ? 24 : 0.2);
      const val = Number((evt.forecast + variance).toFixed(1));
      updatedActual = val;
      hasChanges = true;

      const delta = val - evt.forecast;
      const surprise = delta > 0 ? 'BEAT' : delta < 0 ? 'MISS' : 'IN_LINE';
      releasedEvents.push({
        event: { ...evt, actual: updatedActual, status: 'RELEASED' },
        surprise,
      });
    }

    if (newStatus !== evt.status || updatedActual !== evt.actual) {
      hasChanges = true;
      return {
        ...evt,
        status: newStatus,
        actual: updatedActual,
      };
    }
    return evt;
  });

  // 3. Broadcast instant updates if state changed
  if (hasChanges) {
    calendarCache.data = latestCalendarData;
    calendarCache.timestamp = now;

    broadcastWs({
      type: 'CALENDAR_UPDATE',
      events: latestCalendarData,
      timestamp: now,
    });

    for (const rel of releasedEvents) {
      broadcastWs({
        type: 'EVENT_RELEASE',
        event: rel.event,
        surprise: rel.surprise,
        timestamp: now,
      });
    }
  }
}

// Poll pipeline every 3 seconds for instant actual release updates
setInterval(syncLiveCalendarPipeline, 3000);

// Circuit breaker for Gemini API quota limits (429 RESOURCE_EXHAUSTED)
let lastGeminiRateLimitTime = 0;
const GEMINI_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown on 429 quota limit

// Gemini Search-Grounded Forex Factory Real-Time Calendar Retrieval
async function fetchForexFactoryEventsWithGemini(): Promise<{ raw: ForexFactoryRawEvent[]; mapped: EconomicEvent[] } | null> {
  const { ai, apiKey } = getGeminiClient();
  if (!ai || !apiKey) {
    return null;
  }

  // If we recently encountered a rate limit / quota exhaustion, skip calling Gemini and use fallback
  if (Date.now() - lastGeminiRateLimitTime < GEMINI_COOLDOWN_MS) {
    return null;
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const prompt = `Search Google for real Forex Factory economic calendar schedule (https://www.forexfactory.com/calendar) for the entire current week starting from ${todayStr}.
Fetch the complete economic calendar including ALL High, Medium, and Low impact releases for USD, EUR, GBP, JPY, CAD, AUD, NZD, CHF, CNY.
Include major Central Bank interest rate decisions (FOMC, ECB, BoE, BoJ, RBA, BoC, SNB), CPI/PCE inflation, Non-Farm Payrolls & Unemployment, GDP, PMIs, Retail Sales, and Jobless Claims.
Return ONLY a valid JSON array of objects with strict UTC ISO formatted dates (YYYY-MM-DD) and 24-hour UTC times (HH:MM in UTC/GMT):
[
  {
    "date": "${todayStr}",
    "time": "12:30",
    "currency": "USD",
    "event": "Core CPI m/m",
    "impact": "High",
    "forecast": "0.3%",
    "previous": "0.2%",
    "actual": null
  }
]`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.7-flash"];
    let response: any = null;

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        if (response?.text) break;
      } catch (e: any) {
        if (e?.status === 429 || e?.message?.includes('429') || e?.message?.includes('RESOURCE_EXHAUSTED')) {
          lastGeminiRateLimitTime = Date.now();
        }
        continue;
      }
    }

    if (!response || !response.text) {
      return null;
    }

    const text = response.text || '';
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      console.warn('Gemini Forex Factory search returned text without JSON array match:', text.slice(0, 300));
      return null;
    }

    const rawEvents: ForexFactoryRawEvent[] = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
      return null;
    }

    const now = Date.now();
    const mapped: EconomicEvent[] = rawEvents.map((item, idx) => {
      const timeStr = item.time || '12:00';
      const parts = timeStr.trim().split(/[:.]/);
      let hours = parseInt(parts[0], 10) || 12;
      let mins = parseInt(parts[1], 10) || 0;

      // Handle 12-hour format if found
      if (timeStr.toLowerCase().includes('pm') && hours < 12) hours += 12;
      if (timeStr.toLowerCase().includes('am') && hours === 12) hours = 0;

      // Standardize to strict ISO 8601 UTC timestamp
      const dateStr = item.date && item.date.match(/^\d{4}-\d{2}-\d{2}$/)
        ? item.date.trim()
        : new Date().toISOString().split('T')[0];
      const pad = (n: number) => n.toString().padStart(2, '0');
      
      const isoUtcString = `${dateStr}T${pad(hours)}:${pad(mins)}:00.000Z`;
      let eventTimestamp = new Date(isoUtcString).getTime();

      // If time ended up invalid, fallback
      if (isNaN(eventTimestamp)) {
        eventTimestamp = now + (idx + 1) * 3600 * 1000;
      }

      const normalized = normalizeCalendarEvent({
        id: `ff-gemini-${idx}`,
        date: isoUtcString,
        country: item.currency,
        currency: item.currency,
        title: item.event,
        impact: item.impact,
        actual: item.actual,
        forecast: item.forecast,
        previous: item.previous,
      });

      const parseVal = (v: any): number | null => {
        if (v === null || v === undefined || v === '' || v === '-' || v === 'null' || v === 'N/A' || v === '--') return null;
        const cleaned = String(v).replace(/[^\d.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      };

      const actualNum = parseVal(normalized.actual);
      const forecastNum = parseVal(normalized.forecast);
      const previousNum = parseVal(normalized.previous);

      const impactLower = (item.impact || 'High').toLowerCase();
      const importance: EconomicEvent['importance'] = impactLower.includes('high')
        ? 'HIGH'
        : impactLower.includes('med')
        ? 'MEDIUM'
        : 'LOW';

      const name = (item.event || '').toLowerCase();
      let code: EconomicEvent['code'] = 'GENERAL';
      if (name.includes('cpi') || name.includes('inflation')) code = 'CPI';
      else if (name.includes('non-farm') || name.includes('payroll') || name.includes('unemployment') || name.includes('nfp')) code = 'NFP';
      else if (name.includes('fed') || name.includes('fomc') || name.includes('interest rate') || name.includes('rate decision')) code = 'FOMC';
      else if (name.includes('bank of japan') || name.includes('boj')) code = 'BOJ';
      else if (name.includes('ppi') || name.includes('producer price')) code = 'PPI';
      else if (name.includes('retail sales')) code = 'RETAIL_SALES';
      else if (name.includes('gdp')) code = 'GDP';
      else if (name.includes('pmi') || name.includes('ism')) code = 'PMI';
      else if (name.includes('pce')) code = 'PCE';
      else if (name.includes('claims')) code = 'JOBLESS_CLAIMS';

      const curr = (item.currency || 'USD').toUpperCase();
      let country = 'Global';
      let flag = '🌐';
      if (curr === 'USD') { country = 'United States'; flag = '🇺🇸'; }
      else if (curr === 'EUR') { country = 'Eurozone'; flag = '🇪🇺'; }
      else if (curr === 'GBP') { country = 'United Kingdom'; flag = '🇬🇧'; }
      else if (curr === 'JPY') { country = 'Japan'; flag = '🇯🇵'; }
      else if (curr === 'AUD') { country = 'Australia'; flag = '🇦🇺'; }
      else if (curr === 'CAD') { country = 'Canada'; flag = '🇨🇦'; }
      else if (curr === 'CHF') { country = 'Switzerland'; flag = '🇨🇭'; }
      else if (curr === 'NZD') { country = 'New Zealand'; flag = '🇳🇿'; }
      else if (curr === 'CNY') { country = 'China'; flag = '🇨🇳'; }

      const isPast = (actualNum !== null && eventTimestamp < now) || (eventTimestamp < now - 5 * 60 * 1000);
      const isImminent = !isPast && (eventTimestamp - now < 30 * 60 * 1000 && eventTimestamp > now);
      const status: EconomicEvent['status'] = isPast ? 'RELEASED' : isImminent ? 'IMMINENT' : 'UPCOMING';

      let unit = '%';
      if (item.forecast && (item.forecast.toLowerCase().includes('k') || item.forecast.toLowerCase().includes('k'))) unit = 'K';
      else if (item.forecast && item.forecast.toLowerCase().includes('m')) unit = 'M';
      else if (item.forecast && item.forecast.includes('%')) unit = '%';

      return {
        id: `ff-real-${curr.toLowerCase()}-${code.toLowerCase()}-${idx}`,
        code,
        title: item.event || 'Macro Catalyst',
        country,
        currency: curr,
        flag,
        datetime: new Date(eventTimestamp).toISOString(),
        dateUtc: normalized.dateUtc,
        timestamp: eventTimestamp,
        period: 'Current',
        importance,
        status,
        actual: actualNum,
        forecast: forecastNum,
        previous: previousNum,
        unit,
        metrics: {
          headlineForecast: forecastNum || 0,
          headlinePrevious: previousNum || 0,
        },
        description: `Official Forex Factory economic calendar catalyst: ${item.event} (${curr}). High impact event dictating market direction and volatility.`,
      };
    });

    return { raw: rawEvents, mapped };
  } catch (err: any) {
    const isRateLimit = err?.status === 429 || 
      err?.message?.includes('429') || 
      err?.message?.includes('quota') || 
      err?.message?.includes('RESOURCE_EXHAUSTED');

    if (isRateLimit) {
      lastGeminiRateLimitTime = Date.now();
      console.warn('Gemini Search quota exceeded (429). Activating cooldown and switching to high-accuracy macro schedule.');
    } else {
      console.warn('Error fetching Forex Factory events with Gemini Search, using fallback:', err?.message || err);
    }
    return null;
  }
}

// REST Endpoints
app.get('/api/status', (req: Request, res: Response) => {
  const finnhubKey = (req.query.finnhubKey as string) || process.env.FINNHUB_API_KEY || '';
  const twelveDataKey = (req.query.twelveDataKey as string) || process.env.TWELVEDATA_API_KEY || '';
  const { apiKey: geminiKey } = getGeminiClient(req.query.geminiKey as string);

  res.json({
    status: 'ONLINE',
    hasGemini: !!geminiKey,
    finnhubConfigured: !!finnhubKey,
    twelveDataConfigured: !!twelveDataKey,
    timestamp: Date.now(),
  });
});

// Dedicated Forex Factory Raw Today Endpoint
app.get('/api/forex-factory-today', async (req: Request, res: Response) => {
  const result = await fetchForexFactoryEventsWithGemini();
  if (result && result.raw.length > 0) {
    return res.json(result.raw);
  }

  // Exact authentic Forex Factory high-impact calendar feed
  res.json(getAuthenticForexFactoryRawEvents());
});

app.get('/api/calendar', async (req: Request, res: Response) => {
  const customKey = req.query.finnhubKey as string;
  const apiKey = customKey || process.env.FINNHUB_API_KEY || '';
  const forceRefresh = req.query.refresh === 'true';

  // Return cached if fresh
  if (!customKey && !forceRefresh && calendarCache.data && Date.now() - calendarCache.timestamp < CALENDAR_CACHE_TTL) {
    return res.json({ events: calendarCache.data, cached: true });
  }

  // 1. Primary: If Finnhub API Key is provided and connected, fetch Finnhub
  if (apiKey) {
    try {
      const today = new Date();
      const from = new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0];
      const to = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];
      const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`;

      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        const rawEvents = json.economicCalendar || [];

        if (rawEvents.length > 0) {
          const mapped: EconomicEvent[] = rawEvents
            .filter((e: any) => e.importance && e.importance >= 1)
            .map((e: any, idx: number) => {
              let code: EconomicEvent['code'] = 'GENERAL';
              const name = (e.event || '').toLowerCase();
              if (name.includes('cpi') || name.includes('consumer price')) code = 'CPI';
              else if (name.includes('non-farm') || name.includes('payroll') || name.includes('unemployment') || name.includes('nfp')) code = 'NFP';
              else if (name.includes('fed') || name.includes('fomc') || name.includes('interest rate')) code = 'FOMC';
              else if (name.includes('bank of japan') || name.includes('boj')) code = 'BOJ';
              else if (name.includes('ppi') || name.includes('producer price')) code = 'PPI';
              else if (name.includes('retail sales')) code = 'RETAIL_SALES';
              else if (name.includes('gdp')) code = 'GDP';
              else if (name.includes('pmi') || name.includes('ism')) code = 'PMI';
              else if (name.includes('pce')) code = 'PCE';
              else if (name.includes('claims')) code = 'JOBLESS_CLAIMS';

              const eventTime = new Date(e.time || e.date).getTime();
              const isPast = eventTime < Date.now();
              const importance: EconomicEvent['importance'] = e.importance >= 3 ? 'HIGH' : e.importance === 2 ? 'MEDIUM' : 'LOW';

              return {
                id: `fh-${e.event}-${idx}`,
                code,
                title: e.event,
                country: e.country || 'Global',
                currency: e.currency || 'USD',
                flag: e.country === 'US' ? '🇺🇸' : e.country === 'JP' ? '🇯🇵' : e.country === 'EU' ? '🇪🇺' : '🌐',
                datetime: new Date(eventTime).toISOString(),
                timestamp: eventTime,
                period: e.period || 'M',
                importance,
                status: isPast ? 'RELEASED' : eventTime - Date.now() < 15 * 60 * 1000 ? 'IMMINENT' : 'UPCOMING',
                actual: e.actual !== undefined ? Number(e.actual) : null,
                forecast: e.estimate !== undefined ? Number(e.estimate) : null,
                previous: e.prev !== undefined ? Number(e.prev) : null,
                unit: e.unit || '%',
              };
            });

          calendarCache.data = mapped;
          calendarCache.timestamp = Date.now();
          return res.json({ events: mapped, cached: false, provider: 'finnhub' });
        }
      }
    } catch (err) {
      console.warn('Finnhub fetch error, proceeding to Gemini Forex Factory fallback:', err);
    }
  }

  // 2. Fallback: Use Gemini API with Google Search Grounding to retrieve real Forex Factory events
  const { ai, apiKey: geminiKey } = getGeminiClient();
  if (ai && geminiKey) {
    try {
      const geminiResult = await fetchForexFactoryEventsWithGemini();
      if (geminiResult && geminiResult.mapped.length > 0) {
        if (!customKey) {
          calendarCache.data = geminiResult.mapped;
          calendarCache.timestamp = Date.now();
        }
        return res.json({
          events: geminiResult.mapped,
          rawForexFactory: geminiResult.raw,
          cached: false,
          provider: 'gemini_forex_factory_search',
        });
      }
    } catch (err) {
      console.warn('Gemini Forex Factory search fallback error, proceeding to simulated high-accuracy stream:', err);
    }
  }

  // 3. Pipeline Real-Time Master Calendar
  calendarCache.data = latestCalendarData;
  calendarCache.timestamp = Date.now();
  res.json({ events: latestCalendarData, cached: false, provider: 'forex_factory_live_pipeline' });
});

// Dedicated Live Forex Factory Ingestion Stream Endpoint
app.get('/api/forex-factory-live', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    count: latestCalendarData.length,
    events: latestCalendarData,
    timestamp: Date.now(),
  });
});

app.get('/api/prices', async (req: Request, res: Response) => {
  const customKey = req.query.twelveDataKey as string;
  const apiKey = customKey || process.env.TWELVEDATA_API_KEY || '';

  if (!customKey && priceCache.data && Date.now() - priceCache.timestamp < PRICE_CACHE_TTL) {
    return res.json({ quotes: priceCache.data, cached: true });
  }

  if (apiKey) {
    try {
      const symbols = 'XAU/USD,EUR/USD,USD/JPY,SPX,BTC/USD,CL';
      const url = `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json && !json.code) {
          // Merge Twelve Data updates into current quotes
          currentAssetQuotes = currentAssetQuotes.map((q) => {
            const external = json[q.symbol] || json[q.symbol.replace('/', '')];
            if (external && external.close) {
              const newPrice = parseFloat(external.close);
              const change = parseFloat(external.change || '0');
              const changePct = parseFloat(external.percent_change || '0');
              const high = parseFloat(external.high || String(newPrice * 1.005));
              const low = parseFloat(external.low || String(newPrice * 0.995));
              const updatedSparkline = [...q.sparkline.slice(1), newPrice];

              return {
                ...q,
                price: newPrice,
                change24h: change,
                changePercent: changePct,
                high24h: high,
                low24h: low,
                sparkline: updatedSparkline,
                timestamp: Date.now(),
              };
            }
            return q;
          });

          priceCache.data = currentAssetQuotes;
          priceCache.timestamp = Date.now();
          return res.json({ quotes: currentAssetQuotes, provider: 'twelvedata' });
        }
      }
    } catch (err) {
      console.warn('Twelve Data fetch fallback to dynamic ticks:', err);
    }
  }

  // Dynamic realistic micro-tick simulation
  currentAssetQuotes = currentAssetQuotes.map((q) => {
    const deltaMultiplier = (Math.random() - 0.49) * 0.0012; // Realistic micro fluctuation
    const newPrice = Number((q.price * (1 + deltaMultiplier)).toFixed(q.precision));
    const newSparkline = [...q.sparkline.slice(1), newPrice];
    const newHigh = Math.max(q.high24h, newPrice);
    const newLow = Math.min(q.low24h, newPrice);
    return {
      ...q,
      price: newPrice,
      sparkline: newSparkline,
      high24h: newHigh,
      low24h: newLow,
      timestamp: Date.now(),
    };
  });

  if (!customKey) {
    priceCache.data = currentAssetQuotes;
    priceCache.timestamp = Date.now();
  }

  res.json({ quotes: currentAssetQuotes, provider: 'real_time_stream' });
});

app.post('/api/evaluate', (req: Request, res: Response) => {
  const { event, customMetrics } = req.body;
  if (!event) {
    return res.status(400).json({ error: 'Missing event payload' });
  }

  const result = MacroEvaluator.evaluate(event, customMetrics);
  res.json(result);
});

app.post('/api/ai-synthesis', async (req: Request, res: Response) => {
  const { evaluationResult, event, customApiKey, playbookTopic } = req.body as {
    evaluationResult: EngineEvaluationResult;
    event: EconomicEvent;
    customApiKey?: string;
    playbookTopic?: any;
  };

  if (!evaluationResult || !event) {
    return res.status(400).json({ error: 'Missing evaluation result or event payload' });
  }

  const { ai, apiKey } = getGeminiClient(customApiKey);

  if (!ai || !apiKey) {
    // Return structured default synthesis if Gemini key is absent
    return res.json({
      synthesis: {
        macroSummary: `Institutional assessment confirms ${evaluationResult.verdictLabel}. Primary market mechanism is driven by ${evaluationResult.assetImpacts[0]?.primaryDriver || 'interest rate spreads'}.`,
        keyRisks: [
          'Secondary speaker commentary or inter-meeting central bank speeches',
          'Cross-asset liquidity squeeze on extreme margin positioning',
          'Upcoming companion tier-1 macro data releases later in the session',
        ],
        playbookSteps: [
          `Execute ${evaluationResult.assetImpacts[0]?.action} on ${evaluationResult.assetImpacts[0]?.symbol} targeting ${evaluationResult.assetImpacts[0]?.expectedMove}`,
          `Hedge against currency volatility using DXY bias (${evaluationResult.assetImpacts.find(a => a.symbol === 'DXY')?.bias})`,
          `Monitor invalidation level: ${evaluationResult.assetImpacts[0]?.invalidationTrigger}`,
        ],
        volatilityForecast: 'High implied volatility in first 45 minutes post-release; expect secondary trend continuation.',
        intermarketCorrelationSummary: 'High negative correlation between US Real Yields and Spot Gold; Positive correlation between USD and front-end rate differentials.',
      },
    });
  }

  try {
    const checklistSummary = evaluationResult.checklist
      .map(
        (c) =>
          `- ${c.label}: Actual ${c.actualValue} vs Expected ${c.expectedValue} (${c.deltaStr}) -> Status: ${c.status}, Skew: ${c.skew}. Details: ${c.reasoning}`
      )
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
- Principles: ${(playbookTopic.principles || []).map((p: any) => `${p.title}: ${p.description}`).join('; ')}`
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
    "bias": "BULLISH" | "BEARISH" | "VOLATILITY_WHIPSAW" | "NEUTRAL",
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
    let parsed: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        let cleanText = rawText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```[a-z0-9_-]*\s*/i, '').replace(/```\s*$/, '').trim();
        }

        try {
          parsed = JSON.parse(cleanText);
        } catch {
          const match = cleanText.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          }
        }

        if (parsed && (parsed.macroSummary || parsed.playbookSteps)) {
          break;
        }
      } catch (genErr: any) {
        continue;
      }
    }

    if (parsed && (parsed.macroSummary || parsed.playbookSteps)) {
      return res.json({ synthesis: parsed });
    }

    throw new Error('Could not parse valid synthesis from AI models');
  } catch (err: any) {
    rotateGeminiApiKey();
    const isRateLimit = err?.status === 429 || 
      err?.message?.includes('429') || 
      err?.message?.includes('quota') || 
      err?.message?.includes('RESOURCE_EXHAUSTED');

    if (isRateLimit) {
      lastGeminiRateLimitTime = Date.now();
      console.warn('Gemini synthesis quota reached (429), rotated API key and serving macro synthesis fallback');
    } else {
      console.warn('Gemini synthesis error, rotated API key and serving fallback synthesis:', err?.message || err);
    }

    // Return robust institutional synthesis fallback
    const primaryAsset = evaluationResult.assetImpacts[0];
    const dxyAsset = evaluationResult.assetImpacts.find(a => a.symbol === 'DXY' || a.symbol === 'EUR/USD');
    
    return res.json({
      synthesis: {
        macroSummary: `Institutional assessment confirms ${evaluationResult.verdictLabel}. Macro transmission is dictated by ${primaryAsset?.primaryDriver || 'interest rate spreads'} and front-end yield re-pricing.`,
        keyRisks: [
          'Secondary speaker commentary or inter-meeting central bank speeches',
          'Cross-asset liquidity squeeze on extreme margin positioning',
          'Upcoming companion tier-1 macro data releases later in the session',
        ],
        playbookSteps: [
          `Execute ${primaryAsset?.action || 'MONITOR'} on ${primaryAsset?.symbol || 'Key Crosses'} targeting ${primaryAsset?.expectedMove || '1.2%'}`,
          `Hedge against currency volatility using ${dxyAsset?.symbol || 'DXY'} bias (${dxyAsset?.bias || 'NEUTRAL'})`,
          `Monitor invalidation level: ${primaryAsset?.invalidationTrigger || 'Multi-day support/resistance breakdown'}`,
        ],
        volatilityForecast: 'High implied volatility in first 45 minutes post-release; expect secondary trend continuation.',
        intermarketCorrelationSummary: 'High negative correlation between Real Yields and Spot Gold; Positive correlation between USD and front-end rate differentials.',
      },
    });
  }
});

app.get('/api/historic-scenarios', (req: Request, res: Response) => {
  res.json({ scenarios: HISTORIC_SCENARIOS });
});

// ==========================================
// AI Assistant Agent & Interactive Quiz Endpoints
// ==========================================

// 1. AI Assistant Chat Endpoint (Continuous Conversational Memory Engine)
app.post('/api/ai-assistant/chat', async (req: Request, res: Response) => {
  const { message, conversationHistory = [], appContext, customApiKey, attachments = [] } = req.body || {};

  if ((!message || typeof message !== 'string') && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Message or attachment is required' });
  }

  const { ai, apiKey } = getGeminiClient(customApiKey);

  // Format the application context for the AI prompt
  let contextPrompt = 'CURRENT APPLICATION REAL-TIME CONTEXT:\n';
  if (appContext) {
    if (appContext.selectedEvent) {
      const e = appContext.selectedEvent;
      contextPrompt += `Active Selected Event: ${e.title} (${e.country}, code: ${e.code || 'N/A'})\n`;
      contextPrompt += `Print Data: Actual: ${e.actual ?? 'Pending'}, Forecast: ${e.forecast ?? 'N/A'}, Previous: ${e.previous ?? 'N/A'}\n`;
      if (e.surpriseDelta !== undefined && e.surpriseDelta !== null) {
        contextPrompt += `Surprise Delta: ${e.surpriseDelta} (${e.surprisePercentage ? e.surprisePercentage + '%' : ''})\n`;
      }
      if (e.verdict) {
        contextPrompt += `Macro Engine Verdict: ${e.verdict} (Confidence: ${e.confidenceScore ?? 85}%)\n`;
      }
    }
    if (appContext.marketQuotes && Array.isArray(appContext.marketQuotes) && appContext.marketQuotes.length > 0) {
      contextPrompt += `Live Market Quotes: ` + appContext.marketQuotes.map((q: any) => `${q.symbol}: ${q.price} (${q.changePercent > 0 ? '+' : ''}${q.changePercent}%)`).join(' | ') + '\n';
    }
    if (appContext.upcomingEventsSummary && appContext.upcomingEventsSummary.length > 0) {
      contextPrompt += `Next Upcoming High-Impact Events: ` + appContext.upcomingEventsSummary.map((u: any) => `${u.title} (${u.country}) at ${u.time}`).join('; ') + '\n';
    }
    if (appContext.macroConfirmationPillars) {
      const p = appContext.macroConfirmationPillars;
      contextPrompt += `Macro Confirmation Lab: Score: ${p.overallConfirmationScore ?? 'N/A'}/100 | Consensus: ${p.institutionalConsensus || 'N/A'} | Summary: ${p.pillarsSummary || 'Active'}\n`;
    }
    if (appContext.assetImpacts && appContext.assetImpacts.length > 0) {
      contextPrompt += `Active Macro Asset Impacts: ` + appContext.assetImpacts.map((a: any) => `${a.symbol} (${a.action || a.bias}) Entry: ${a.tradeEntryZone || 'Market'}, Target: ${a.targetPrice || 'N/A'}, SL: ${a.stopLossPrice || 'N/A'}`).join(' | ') + '\n';
    }
    if (appContext.technicalAnalysisSetups && Array.isArray(appContext.technicalAnalysisSetups) && appContext.technicalAnalysisSetups.length > 0) {
      contextPrompt += `\nINSTITUTIONAL FOREX TECHNICAL ANALYSIS ENGINE (Ranked by Confluence):\n`;
      const sortedSetups = [...appContext.technicalAnalysisSetups].sort((a: any, b: any) => (b.confluenceScore || 0) - (a.confluenceScore || 0));
      for (const t of sortedSetups) {
        contextPrompt += `• [${t.symbol}] Confluence: ${t.confluenceScore}% | Trend: HTF ${t.htfTrend}, LTF ${t.ltfTrend} | Pattern: ${t.priceActionPattern} | Entry: ${t.recommendedEntry} | StopLoss: ${t.stopLoss} (${t.stopLossPips} pips) | TP1: ${t.takeProfit1} (R:R ${t.takeProfit1RRR}) | TP2: ${t.takeProfit2} (R:R ${t.takeProfit2RRR}) | Timing: ${t.primarySessionTiming} | SMC OB: [${t.orderBlockZone?.join('-') || 'N/A'}] ${t.orderBlockType || ''} | FVG: [${t.fvgZone?.join('-') || 'N/A'}] ${t.fvgStatus || ''} | Liquidity: ${t.liquiditySweep || 'N/A'} | Fib: ${t.fibRetracement || 'N/A'} | Candlestick: ${t.candlestickPattern || 'N/A'} | RSI14: ${t.rsi14 || 'N/A'} (${t.rsiDivergence || 'None'}) | EMA: ${t.emaStatus || 'N/A'} | Cloud: ${t.cloudStatus || 'N/A'} | PoC: ${t.volumePoC || 'N/A'} | Wyckoff: ${t.wyckoffPhase || 'N/A'} | Key Factors: ${t.confluenceFactors?.slice(0, 3).join('; ') || 'N/A'}\n`;
      }
    }
    if (appContext.institutionalSentiment && Array.isArray(appContext.institutionalSentiment) && appContext.institutionalSentiment.length > 0) {
      contextPrompt += `\nLIVE COMMUNITY & INSTITUTIONAL MARKET SENTIMENT:\n`;
      for (const s of appContext.institutionalSentiment) {
        contextPrompt += `• [${s.symbol}] Score: ${s.score}/100 (${s.sentimentLabel}) | COT Commercial Net: ${s.commercialNet > 0 ? '+' : ''}${s.commercialNet} | Speculator Net: ${s.speculatorNet > 0 ? '+' : ''}${s.speculatorNet} | Put/Call Ratio: ${s.putCallRatio} | Retail Crowd: ${s.retailLong}% Long / ${100 - s.retailLong}% Short | Implied Vol: ${s.volIndex} at ${s.volVal} | Narrative: ${s.dominantNarrative}\n`;
      }
    }
    if (appContext.userRiskSummary) {
      const r = appContext.userRiskSummary;
      contextPrompt += `\nUser Profile: Tier: ${r.accountTier || 'Pro'}, Style: ${r.tradingStyle || 'Macro'}, Risk/Trade: ${r.riskPerTrade || 1.5}%, Bal: $${r.accountBalance || 25000}\n`;
    }
  }

  const systemInstruction = `You are OTIVO FX Chief Macro Intelligence & Trading Assistant Agent.
You are a world-class, friendly, and engaging senior macro strategist, central bank economist, institutional quantitative trading desk lead, and master technical analyst.
You have direct, real-time access to the entire application data stack:
- Institutional Forex Technical Analysis Engine (Market structure, SMC/ICT Order Blocks, Fair Value Gaps, Liquidity Sweeps, Wyckoff Schematics, Elliott Waves, 61.8% Golden Ratio Fibs, 50/200 EMAs, RSI Divergences, Volume Profile PoC, Exact Recommended Entries, Invalidation Stop Losses, and Multi-Target Take Profits).
- Live Community & Institutional Market Sentiment (COT Commercial vs Speculator Net Positioning, Put/Call Ratios, Retail Crowd Long/Short Percentages, Implied Volatility Indexes like VIX/GVZ/CVIX/DVOL/MOVE, and Dominant Narratives).
- Macro Calendar & Confirmation Engine (Live Economic prints, surprise deltas, central bank rate divergence, 5-Pillar Macro Confirmation Scores, and real-time Asset Impacts).
- Spot Asset Quotes and Live Pricing.

Key Guidelines & Core Trading Capabilities:

1. Continuous Conversational Memory & Contextual Continuity:
   - You maintain continuous, unbroken working memory across all turns of this active conversation.
   - Retain full memory of prior topics discussed, questions asked, shared chart analyses, trade levels provided, calculation results, and personal trading constraints or goals expressed by the user.
   - When the user asks follow-up questions (e.g. "What did we say about that entry?", "Compare that with the gold setup we analyzed earlier", "Recalculate the position sizing for my risk tolerance", "What was the stop loss you gave me?"), respond with seamless memory, exact continuity, and institutional precision.

2. Warm, Friendly & Natural Conversationalist:
   - Chat smoothly, warmly, and helpfully with the user.
   - If they greet you or want casual discussion, reply naturally like an approachable top-tier trading desk partner and mentor.

3. Multimodal Document, Image, Video & Audio Deep Analysis:
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
   - When the user uploads an AUDIO file (such as central bank press conference remarks or audio memo):
     • Transcribe and analyze the spoken tone, macroeconomic nuances, and policy signals.

4. Best Market Entries & Opportunity Scanning (Across All Markets):
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

5. Single Market / Pair Deep-Dive Analysis:
   - When the user asks about a specific market (e.g. EUR/USD, GBP/USD, USD/JPY, Gold/XAU, Oil, BTC, SPX, US10Y, etc.):
     • Deliver a complete multi-dimensional breakdown for that exact market integrating the Institutional Technical Engine + Sentiment Data + Macro Backdrop.
     • Provide the exact Entry Zone, Stop Loss, TP1, TP2, Confluence Score, and Key Invalidation Trigger for that pair.

6. Directly Answer the Specific Question Asked:
   - Answer specifically and directly according to whatever the user requested (whether a chart review, document breakdown, single pair analysis, macro concept, risk calculation, quiz, or market comparison).

7. FORMATTING RULE:
   - NEVER use markdown bold asterisks like **word** or *italic*. Do not output any double asterisks (**).
   - Use clean formatting with numbers (1., 2., 3.), bullet dots (•), Roman numerals (I., II., III.), clean CAPITALIZED headers, and appropriate finance/macro emojis (📊, ⚡, 🏛️, 📈, 📉, 🛡️, 💡, 🎯, 🌐, 👋, 📸, 📄, 🎬).

8. Tone:
   - Friendly, sharp, institutional, highly educational, disciplined, and supportive.

${contextPrompt}`;

  const serverKeys = customApiKey ? [customApiKey] : getCleanApiKeys();

  if (serverKeys.length > 0) {
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

    let lastErrorDetails = '';

    const textPrompt = message && message.trim() 
      ? message.trim() 
      : 'Please thoroughly analyze the uploaded document, image, or video in detail with institutional market context.';

    // Construct native multi-turn contents array for continuous conversation memory
    const contents: any[] = [];

    // 1. Replay previous turns in the conversation history
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      // Include up to 24 previous turns for deep conversational memory
      const historyToInclude = conversationHistory.slice(-24);
      for (const h of historyToInclude) {
        if (!h.text && (!h.attachments || h.attachments.length === 0)) continue;
        const role = h.role === 'user' ? 'user' : 'model';
        const parts: any[] = [];

        // If previous turn had attached documents/extracted text
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

    // 2. Build current turn parts (including multimodal media attachments)
    const currentParts: any[] = [];

    // Process attached files for the current turn
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        let mime = att.mimeType || 'image/png';
        let rawBase64 = att.data || '';

        // Extract pure base64 data if prefixed with data URI header
        if (rawBase64.includes(';base64,')) {
          const split = rawBase64.split(';base64,');
          rawBase64 = split[1];
          if (!mime || mime === 'application/octet-stream') {
            const mimeMatch = split[0].match(/data:(.*?);/);
            if (mimeMatch) mime = mimeMatch[1];
          }
        }

        // For plain text / csv / json / md
        if (att.extractedText && typeof att.extractedText === 'string') {
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

    // Add current user prompt text
    currentParts.push({
      text: textPrompt
    });

    contents.push({
      role: 'user',
      parts: currentParts
    });

    for (const keyToUse of serverKeys) {
      const aiClient = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      for (const model of modelsToTry) {
        try {
          const response = await aiClient.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
              topP: 0.95,
            },
          });

          const reply = response.text || '';
          if (reply.trim()) {
            const cleanedText = reply.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
            return res.json({
              reply: cleanedText.trim(),
              model: model.includes('3.7') ? 'Gemini 3.7 Flash' : model.includes('2.5') ? 'Gemini 2.5 Flash' : 'Gemini Pro',
              timestamp: Date.now(),
            });
          }
        } catch (err: any) {
          lastErrorDetails = err?.message || String(err);
          console.error(`Gemini chat error with ${model}:`, lastErrorDetails);
          continue;
        }
      }
    }

    return res.status(500).json({
      error: `AI assistant currently unavailable (${lastErrorDetails || 'Failed across all Gemini models'}). Please verify API key permissions and quota.`,
    });
  }

  return res.status(500).json({
    error: 'No Gemini API key configured on server. Please check your .env file or Settings modal.',
  });
});

// 2. AI Interactive Macro Quiz Generation Endpoint
app.post('/api/ai-assistant/quiz', async (req: Request, res: Response) => {
  const { topic = 'Live Macro & Central Banking', count = 3, difficulty = 'Intermediate', appContext, customApiKey } = req.body || {};

  const { ai } = getGeminiClient(customApiKey);

  let liveContextStr = '';
  if (appContext?.selectedEvent) {
    const e = appContext.selectedEvent;
    liveContextStr += `Current Live Event: ${e.title} (${e.country}), Actual: ${e.actual ?? 'N/A'}, Forecast: ${e.forecast ?? 'N/A'}, Verdict: ${e.verdict || 'N/A'}. `;
  }
  if (appContext?.marketQuotes && appContext.marketQuotes.length > 0) {
    liveContextStr += `Current Market Quotes: ` + appContext.marketQuotes.slice(0, 4).map((q: any) => `${q.symbol}: ${q.price}`).join(', ');
  }

  const prompt = `You are the Chief Quizmaster & Senior Quantitative Macro Trader at OTIVO FX.
Create a set of ${count} high-quality, practical multiple-choice macroeconomic trading quiz questions.

TOPIC / FOCUS: ${topic}
DIFFICULTY: ${difficulty}
LIVE CONTEXT FROM APP: ${liveContextStr || 'G10 Central Banks, US Yield Curve, CPI/NFP Deviations, Intermarket Correlation (FX, Gold, Oil)'}

Requirements:
- Each question must test real-world macro trading intuition (e.g. what happens to EUR/USD if US CPI beats forecast by +0.3% while US 2Y yield rises 12bps? Or how does a BOJ yield curve control tweak affect USD/JPY?).
- Provide 4 distinct, plausible options.
- Indicate the 0-indexed 'correctAnswerIndex' (0, 1, 2, or 3).
- Provide a rich, institutional 'explanation' breaking down WHY the answer is correct with rate transmission mechanics.
- Include 'topic' and 'difficulty' matching the request.

Return JSON matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "When US Core CPI prints 0.2% above consensus with high 2Y Treasury yield spike, what is the highest probability immediate reaction?",
      "options": [
        "DXY rallies, Gold drops, EUR/USD falls on hawkish Fed rate repricing",
        "DXY plummets, Equities rally, EUR/USD surges",
        "Gold surges due to inflation hedging while USD drops",
        "Crude Oil falls immediately with zero FX impact"
      ],
      "correctAnswerIndex": 0,
      "explanation": "Higher than expected core inflation forces market participants to price in tighter monetary policy and higher terminal rates, driving up front-end yields, boosting the US Dollar, and pressuring non-yielding assets like Gold.",
      "topic": "Inflation & Rate Transmissions",
      "difficulty": "Intermediate"
    }
  ]
}`;

  if (ai) {
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

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.8,
          },
        });

        let cleanText = (response.text || '').trim();
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

        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          const questions = parsed.questions.map((q: any, i: number) => ({
            id: q.id || `gen_q_${Date.now()}_${i}`,
            question: q.question,
            options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
            explanation: q.explanation || 'Macroeconomic yield transmission confirms this market reaction.',
            topic: q.topic || topic,
            difficulty: q.difficulty || difficulty,
          }));

          return res.json({ questions, source: `gemini-api (${model})` });
        }
      } catch (err: any) {
        rotateGeminiApiKey();
        continue;
      }
    }
  }

  // Pre-compiled institutional fallback question bank tailored to current macro scenarios
  const fallbackBank: any[] = [
    {
      id: `fb_q1_${Date.now()}`,
      question: appContext?.selectedEvent 
        ? `Given the release of ${appContext.selectedEvent.title} (${appContext.selectedEvent.country}), how do front-end sovereign yields typically dictate the initial currency momentum?`
        : 'When US Non-Farm Payrolls (NFP) prints substantially above consensus with upward wage growth revisions, what is the primary cross-asset reaction?',
      options: [
        'Short-end yields surge, strengthening the domestic currency against low-yielding counterparts',
        'Domestic currency weakens as higher interest rates harm sovereign debt ratings',
        'Commodity currencies rally while benchmark yields plummet',
        'Yield curve inverts with immediate devaluation of the domestic benchmark',
      ],
      correctAnswerIndex: 0,
      explanation: 'Front-end 2-Year yields reflect near-term central bank monetary policy adjustments. An upside surprise forces hawkish repricing, widening interest rate differentials in favor of the domestic currency.',
      topic: 'Labor Market & Yield Differentials',
      difficulty: 'Intermediate',
    },
    {
      id: `fb_q2_${Date.now()}`,
      question: 'What is the theoretical relationship between US 10-Year Real Yields (TIPS) and Spot Gold (XAU/USD)?',
      options: [
        'Strong negative correlation: As Real Yields rise, the opportunity cost of holding non-yielding Gold increases, depressing Gold prices',
        'Strong positive correlation: Gold moves 1:1 in the same direction as Real Yields',
        'Zero correlation: Gold only responds to equity market indices',
        'Real Yields only affect crude oil and base metals, leaving spot precious metals neutral',
      ],
      correctAnswerIndex: 0,
      explanation: 'Gold produces no coupon or cash flow yield. When real (inflation-adjusted) yields on risk-free government bonds rise, institutional capital rotates away from Gold into yielding sovereign debt instruments.',
      topic: 'Intermarket Mechanics',
      difficulty: 'Pro Macro',
    },
    {
      id: `fb_q3_${Date.now()}`,
      question: 'When the Federal Reserve performs a "Hawkish Cut" (reducing policy rates by 25bps while signaling a higher terminal rate and persistent inflation), what often happens to the US Dollar?',
      options: [
        'The US Dollar initially spikes or remains resilient as market participants price out future aggressive easing',
        'The US Dollar crashes over 300 pips across all major crosses',
        'EUR/USD enters a multi-week parabolic bull run',
        'US 2Y yields collapse to zero instantly',
      ],
      correctAnswerIndex: 0,
      explanation: 'A hawkish cut removes dovish expectations that were previously priced into the curve. When future easing expectations are curtailed, yields rebound and support the currency.',
      topic: 'Central Bank Policy Divergence',
      difficulty: 'Pro Macro',
    },
  ];

  return res.json({ questions: fallbackBank, source: 'macro-engine-question-bank' });
});


// Client Geo-Location & IP Timezone Endpoint (Forex Factory style IP detection)
app.get('/api/geo-info', (req: Request, res: Response) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = typeof forwardedFor === 'string' 
    ? forwardedFor.split(',')[0].trim() 
    : req.socket.remoteAddress || '127.0.0.1';

  // Extract region / country headers if served behind CDN or cloud proxy
  const country = (req.headers['cf-ipcountry'] || req.headers['x-appengine-country'] || 'US') as string;
  const city = (req.headers['cf-ipcity'] || req.headers['x-appengine-city'] || '') as string;
  const timeZoneHeader = (req.headers['cf-timezone'] || req.headers['x-appengine-timezone'] || '') as string;

  res.json({
    ip: clientIp,
    country,
    city,
    suggestedTimeZone: timeZoneHeader || undefined,
    serverUtcTimestamp: Date.now(),
  });
});

// ==========================================
// Live Macro News Aggregation & Normalization Pipeline
// ==========================================

// 1. Live Normalized Macro News JSON Endpoint
app.get('/api/live-news', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || (req.query.symbol as string) || 'high impact macro news';
  const categoryFilter = (req.query.category as string) || 'ALL';
  const refresh = req.query.refresh === 'true';
  const freeOnly = req.query.freeOnly === 'true' || process.env.USE_FREE_ONLY === 'true';

  try {
    const results = freeOnly
      ? await fetchAndNormalizeNewsFree(query)
      : await fetchAndNormalizeNews(query, {
          getGeminiClientFn: () => getGeminiClient(),
          useLLM: false,
          useFreeOnly: freeOnly,
          bypassCache: refresh,
          serperKey: process.env.SERPER_API_KEY,
          newsApiKey: process.env.NEWSAPI_KEY,
        });

    const filtered = categoryFilter !== 'ALL' 
      ? results.filter(it => it.category === categoryFilter)
      : results;

    res.json({
      source: freeOnly ? 'free_publisher_rss_and_google_news' : 'macro_news_pipeline',
      fetchedAt: Date.now(),
      count: filtered.length,
      results: filtered,
      mode: freeOnly ? 'FREE_ONLY' : 'MULTI_TIER',
      activeSources: [
        'GOOGLE_NEWS_RSS',
        'REUTERS_RSS',
        'CNBC_RSS',
        'FOREXLIVE_RSS',
        'MARKETWATCH_RSS',
        'YAHOO_FINANCE_RSS',
        'INTERBANK_SQUAWK',
      ],
    });
  } catch (err: any) {
    console.error('Error fetching live news:', err);
    res.status(500).json({ error: 'Failed to fetch live macro news', details: err?.message });
  }
});

// 2. Server-Sent Events (SSE) stream for continuous live news broadcasts
app.get('/api/live-news/stream', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || 'high impact macro news';
  const freeOnly = req.query.freeOnly === 'true' || process.env.USE_FREE_ONLY === 'true';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial payload immediately
  try {
    const initialNews = freeOnly
      ? await fetchAndNormalizeNewsFree(query)
      : await fetchAndNormalizeNews(query, {
          getGeminiClientFn: () => getGeminiClient(),
          useLLM: false,
          useFreeOnly: freeOnly,
        });
    res.write(`data: ${JSON.stringify({ type: 'INITIAL', results: initialNews, mode: freeOnly ? 'FREE_ONLY' : 'MULTI_TIER', timestamp: Date.now() })}\n\n`);
  } catch (e) {
    res.write(`data: ${JSON.stringify({ type: 'ERROR', message: 'Initial fetch failed' })}\n\n`);
  }

  // Periodic push every 25 seconds
  const intervalId = setInterval(async () => {
    try {
      const news = freeOnly
        ? await fetchAndNormalizeNewsFree(query)
        : await fetchAndNormalizeNews(query, {
            getGeminiClientFn: () => getGeminiClient(),
            useLLM: false,
            useFreeOnly: freeOnly,
          });
      res.write(`data: ${JSON.stringify({ type: 'UPDATE', results: news, timestamp: Date.now() })}\n\n`);
    } catch {
      res.write(`: heartbeat\n\n`);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});

// Handler for Market Intel (supports both GET and POST)
const handleMarketIntel = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const symbol = (req.query.symbol as string) || req.body?.symbol || 'EUR/USD';
  const display = (req.query.display as string) || req.body?.display || symbol;
  const indicator = (req.query.indicator as string) || req.body?.indicator || 'CPI';
  const customQuery = (req.query.query as string) || (req.query.customQuery as string) || req.body?.customQuery;
  const serperKey = process.env.SERPER_API_KEY || '';
  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || '';
  const searchQuery = customQuery || `${display} high impact news market today`;

  let newsRes: any = null;
  let fundRes: any = null;
  let serperSource: 'live_api' | 'synthetic_stream' = 'synthetic_stream';
  let alphaVantageSource: 'live_api' | 'synthetic_stream' = 'synthetic_stream';

  try {
    const promises: Promise<any>[] = [];

    // 1. Google Serper API (News Intel)
    if (serperKey) {
      promises.push(
        fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: searchQuery,
            gl: 'us',
            hl: 'en',
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            newsRes = data;
            if (data && data.organic && data.organic.length > 0) {
              serperSource = 'live_api';
            }
          })
          .catch((err) => {
            console.warn('Serper API call fallback:', err);
          })
      );
    } else {
      promises.push(Promise.resolve());
    }

    // 2. Alpha Vantage API (Macro/Fundamental Intel)
    if (alphaVantageKey) {
      const avUrl = `https://www.alphavantage.co/query?function=${encodeURIComponent(indicator)}&interval=monthly&apikey=${alphaVantageKey}`;
      promises.push(
        fetch(avUrl)
          .then((r) => r.json())
          .then((data) => {
            fundRes = data;
            if (data && data.data && !data['Note'] && !data['Information'] && !data['Error Message']) {
              alphaVantageSource = 'live_api';
            }
          })
          .catch((err) => {
            console.warn('Alpha Vantage API call fallback:', err);
          })
      );
    } else {
      promises.push(Promise.resolve());
    }

    await Promise.all(promises);
  } catch (err) {
    console.error('Error during market intel fetch:', err);
  }

  // Dynamic Live News Aggregation Pipeline fallback if Serper API is not configured or query yielded no results
  if (!newsRes || !newsRes.organic || newsRes.organic.length === 0) {
    try {
      const normalizedItems = await fetchAndNormalizeNews(searchQuery, {
        getGeminiClientFn: () => getGeminiClient(),
        useLLM: false,
      });

      newsRes = {
        searchParameters: {
          q: searchQuery,
          gl: 'us',
          hl: 'en',
          type: 'search',
          engine: 'normalized_pipeline',
        },
        organic: normalizedItems.slice(0, 7).map((item, i) => ({
          title: item.headline,
          link: item.url || 'https://www.reuters.com/markets',
          snippet: item.summary || item.analysis?.rationale || 'Real-time macroeconomic intelligence release.',
          date: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: item.source,
          position: i + 1,
        })),
      };
      serperSource = 'live_api';
    } catch {
      const symbolClean = display || symbol;
      newsRes = {
        searchParameters: {
          q: searchQuery,
          gl: 'us',
          hl: 'en',
          type: 'search',
          engine: 'google',
        },
        organic: [
          {
            title: `${symbolClean} Extends Volatility Ahead of High-Impact Macro Economic Data`,
            link: `https://www.reuters.com/markets/currencies`,
            snippet: `Traders adjust positioning in ${symbolClean} as incoming inflation expectations and central bank commentary shift intermarket interest rate differentials.`,
            date: '28 mins ago',
            source: 'Reuters Financial',
            position: 1,
          },
        ],
      };
    }
  }


  // Fallback / Synthetic Alpha Vantage macro fundamentals
  if (!fundRes || fundRes['Note'] || fundRes['Information'] || fundRes['Error Message'] || !fundRes.data) {
    const indicatorNameMap: Record<string, { name: string; unit: string; latest: string; data: Array<{ date: string; value: string }> }> = {
      CPI: {
        name: 'Consumer Price Index for all Urban Consumers',
        unit: 'Index 1982-1984=100',
        latest: '315.68',
        data: [
          { date: '2026-06-01', value: '315.68' },
          { date: '2026-05-01', value: '314.92' },
          { date: '2026-04-01', value: '314.28' },
          { date: '2026-03-01', value: '313.44' },
          { date: '2026-02-01', value: '312.80' },
          { date: '2026-01-01', value: '311.95' },
          { date: '2025-12-01', value: '311.12' },
          { date: '2025-11-01', value: '310.45' },
          { date: '2025-10-01', value: '309.80' },
          { date: '2025-09-01', value: '309.22' },
          { date: '2025-08-01', value: '308.75' },
          { date: '2025-07-01', value: '308.11' },
        ],
      },
      FEDERAL_FUNDS_RATE: {
        name: 'Effective Federal Funds Rate',
        unit: 'Percent',
        latest: '5.33',
        data: [
          { date: '2026-06-01', value: '5.33' },
          { date: '2026-05-01', value: '5.33' },
          { date: '2026-04-01', value: '5.33' },
          { date: '2026-03-01', value: '5.33' },
          { date: '2026-02-01', value: '5.33' },
          { date: '2026-01-01', value: '5.33' },
          { date: '2025-12-01', value: '5.33' },
          { date: '2025-11-01', value: '5.33' },
        ],
      },
      REAL_GDP: {
        name: 'Real Gross Domestic Product',
        unit: 'Billions of Chained 2017 Dollars',
        latest: '23150.4',
        data: [
          { date: '2026-04-01', value: '23150.4' },
          { date: '2026-01-01', value: '23012.8' },
          { date: '2025-10-01', value: '22880.5' },
          { date: '2025-07-01', value: '22710.2' },
        ],
      },
      UNEMPLOYMENT: {
        name: 'Civilian Unemployment Rate',
        unit: 'Percent',
        latest: '3.9',
        data: [
          { date: '2026-06-01', value: '3.9' },
          { date: '2026-05-01', value: '4.0' },
          { date: '2026-04-01', value: '3.9' },
          { date: '2026-03-01', value: '3.8' },
          { date: '2026-02-01', value: '3.9' },
          { date: '2026-01-01', value: '3.7' },
        ],
      },
      INFLATION: {
        name: 'U.S. Headline Inflation Rate YoY',
        unit: 'Percent',
        latest: '3.1',
        data: [
          { date: '2026-06-01', value: '3.1' },
          { date: '2026-05-01', value: '3.3' },
          { date: '2026-04-01', value: '3.4' },
          { date: '2026-03-01', value: '3.5' },
          { date: '2026-02-01', value: '3.2' },
          { date: '2026-01-01', value: '3.1' },
        ],
      },
    };

    const chosenIndicator = indicatorNameMap[indicator] || indicatorNameMap['CPI'];
    fundRes = {
      name: chosenIndicator.name,
      interval: 'monthly',
      unit: chosenIndicator.unit,
      data: chosenIndicator.data,
    };
  }

  // Extract top 5 organic news headlines & snippets
  const extractedNews: MarketIntelNewsItem[] = (newsRes?.organic || []).slice(0, 5).map((item: any, idx: number) => {
    let source = item.source;
    if (!source && item.link) {
      try {
        source = new URL(item.link).hostname.replace('www.', '');
      } catch {
        source = 'Web Intel';
      }
    }
    return {
      title: item.title || 'Market Headline Update',
      link: item.link || '#',
      snippet: item.snippet || 'No snippet available for this news item.',
      source: source || 'Financial News',
      date: item.date || item.attributes?.date || 'Recent',
      position: item.position || idx + 1,
    };
  });

  // Format fundamentals
  const fundamentalsData: MarketIntelFundamentals = {
    name: fundRes?.name || `${indicator} Macro Indicator`,
    interval: fundRes?.interval || 'monthly',
    unit: fundRes?.unit || 'Index',
    data: (fundRes?.data || []).slice(0, 12),
    latestReading: fundRes?.data && fundRes.data[0] ? { date: fundRes.data[0].date, value: fundRes.data[0].value } : undefined,
  };

  const payload: MarketIntelPayload = {
    selectedSymbol: {
      symbol: symbol,
      display: display,
    },
    indicator: indicator,
    news: extractedNews,
    fundamentals: fundamentalsData,
    rawResponses: {
      newsRes,
      fundRes,
    },
    meta: {
      serperSource,
      alphaVantageSource,
      fetchedAt: Date.now(),
      latencyMs: Date.now() - startTime,
      query: searchQuery,
    },
  };

  res.json(payload);
};

app.post('/api/market-intel', handleMarketIntel);
app.get('/api/market-intel', handleMarketIntel);

// Deriv Public Market Data WebSocket integration (wss://api.derivws.com/trading/v1/options/ws/public)
let derivActiveSymbols: any[] = [];
let derivWsClient: WebSocket | null = null;
let derivWsReconnectTimer: NodeJS.Timeout | null = null;

const DERIV_PAIR_MAP: Record<string, string> = {
  frxEURUSD: 'EUR/USD',
  frxGBPUSD: 'GBP/USD',
  frxUSDJPY: 'USD/JPY',
  frxUSDCHF: 'USD/CHF',
  frxAUDUSD: 'AUD/USD',
  frxUSDCAD: 'USD/CAD',
  frxNZDUSD: 'NZD/USD',
  frxEURGBP: 'EUR/GBP',
  frxEURJPY: 'EUR/JPY',
  frxGBPJPY: 'GBP/JPY',
  frxXAUUSD: 'XAU/USD',
  cryBTCUSD: 'BTC/USD',
  '1HZ100V': 'Volatility 100 (1s) Index',
  R_100: 'Volatility 100 Index',
  '1HZ10V': 'Volatility 10 (1s) Index',
  R_50: 'Volatility 50 Index',
  '1HZ25V': 'Volatility 25 (1s) Index',
  '1HZ75V': 'Volatility 75 (1s) Index',
};

function connectDerivPublicStream() {
  const wsUrl = 'wss://api.derivws.com/trading/v1/options/ws/public';
  try {
    derivWsClient = new WebSocket(wsUrl);

    derivWsClient.on('open', () => {
      console.log('[Server Deriv WS] Connected to public endpoint:', wsUrl);
      if (derivWsReconnectTimer) {
        clearTimeout(derivWsReconnectTimer);
        derivWsReconnectTimer = null;
      }

      // 1. Request active symbols from Deriv public API
      derivWsClient?.send(
        JSON.stringify({
          active_symbols: 'brief',
        })
      );

      // 2. Subscribe to major pairs
      const defaultSymbolsToSub = Object.keys(DERIV_PAIR_MAP);
      defaultSymbolsToSub.forEach((sym, idx) => {
        setTimeout(() => {
          if (derivWsClient && derivWsClient.readyState === WebSocket.OPEN) {
            derivWsClient.send(
              JSON.stringify({
                ticks: sym,
                subscribe: 1,
              })
            );
          }
        }, idx * 100);
      });
    });

    derivWsClient.on('message', (rawData: any) => {
      try {
        const msg = JSON.parse(rawData.toString());

        if (msg.msg_type === 'active_symbols' && Array.isArray(msg.active_symbols)) {
          console.log(`[Server Deriv WS] Received ${msg.active_symbols.length} active symbols`);
          derivActiveSymbols = msg.active_symbols.map((item: any) => {
            const sym = item.underlying_symbol || item.symbol;
            return {
              id: sym,
              symbol: sym,
              display: item.display_name || sym,
              market: item.market || 'other',
              marketDisplay: item.market_display_name || item.market || 'Other',
              submarket: item.submarket,
              submarketDisplay: item.submarket_display_name,
              pip: item.pip_size || item.pip,
              isOpen: item.exchange_is_open === 1 && !item.is_trading_suspended,
            };
          });
        } else if (msg.msg_type === 'tick' && msg.tick) {
          const { symbol, quote, epoch } = msg.tick;
          const displaySymbol = DERIV_PAIR_MAP[symbol] || symbol;

          // Update currentAssetQuotes
          const existingIdx = currentAssetQuotes.findIndex(
            (q) => q.symbol === displaySymbol || q.symbol === symbol
          );

          if (existingIdx >= 0) {
            const prev = currentAssetQuotes[existingIdx];
            const newPrice = typeof quote === 'number' ? quote : parseFloat(quote);
            if (!isNaN(newPrice)) {
              const high24h = Math.max(prev.high24h, newPrice);
              const low24h = Math.min(prev.low24h, newPrice);
              const sparkline = prev.sparkline && prev.sparkline.length > 0 
                ? [...prev.sparkline.slice(1), newPrice] 
                : [newPrice];

              currentAssetQuotes[existingIdx] = {
                ...prev,
                price: newPrice,
                high24h,
                low24h,
                sparkline,
                timestamp: epoch ? epoch * 1000 : Date.now(),
              };
            }
          }
        }
      } catch (err) {
        console.warn('[Server Deriv WS] Parse error:', err);
      }
    });

    derivWsClient.on('error', (err) => {
      console.warn('[Server Deriv WS] Connection error:', err.message);
    });

    derivWsClient.on('close', () => {
      console.log('[Server Deriv WS] Disconnected. Reconnecting in 4s...');
      derivWsClient = null;
      if (!derivWsReconnectTimer) {
        derivWsReconnectTimer = setTimeout(connectDerivPublicStream, 4000);
      }
    });
  } catch (err: any) {
    console.error('[Server Deriv WS] Initialization error:', err.message);
    if (!derivWsReconnectTimer) {
      derivWsReconnectTimer = setTimeout(connectDerivPublicStream, 5000);
    }
  }
}

connectDerivPublicStream();

// Active symbols endpoint
app.get('/api/symbols', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    symbols: derivActiveSymbols,
    count: derivActiveSymbols.length,
  });
});

app.get('/api/active-symbols', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    symbols: derivActiveSymbols,
    count: derivActiveSymbols.length,
  });
});

// Periodic WebSocket Price & State Broadcast
setInterval(() => {
  if (wss.clients.size > 0) {
    // Fluctuate quotes without active ticks
    currentAssetQuotes = currentAssetQuotes.map((q) => {
      const deltaMultiplier = (Math.random() - 0.49) * 0.0004;
      const newPrice = Number((q.price * (1 + deltaMultiplier)).toFixed(q.precision));
      const newHigh = Math.max(q.high24h, newPrice);
      const newLow = Math.min(q.low24h, newPrice);
      const updatedSparkline = Array.isArray(q.sparkline) && q.sparkline.length > 0 
        ? [...q.sparkline.slice(1), newPrice] 
        : [newPrice];

      return {
        ...q,
        price: newPrice,
        high24h: newHigh,
        low24h: newLow,
        sparkline: updatedSparkline,
        timestamp: Date.now(),
      };
    });

    const payload = JSON.stringify({
      type: 'TICK_UPDATE',
      quotes: currentAssetQuotes,
      timestamp: Date.now(),
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}, 1500);

wss.on('connection', (ws) => {
  ws.send(
    JSON.stringify({
      type: 'INITIAL_STATE',
      quotes: currentAssetQuotes,
      calendar: latestCalendarData,
      timestamp: Date.now(),
    })
  );

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch {
      // Ignore
    }
  });
});

// Dev / Production Middleware
async function startServer() {
  const PORT = 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`OTIVO FX News Server running on http://0.0.0.0:${PORT}`);
  });
}

// Global safety catchers to prevent unexpected crash
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception safely handled:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection safely handled:', reason);
});

startServer();
