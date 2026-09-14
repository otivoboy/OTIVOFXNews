/**
 * Calendar Event Normalizer & Sanitizer
 * Standardizes incoming economic calendar data from JSON endpoints, Web APIs, and feeds.
 * Accurately preserves zeroes, negative numbers, and formatted decimals without overwriting with '--'.
 */

export interface NormalizedCalendarEvent {
  id: string;
  dateUtc: string; // Explicit ISO 8601 UTC string (e.g. 2026-09-14T12:30:00.000Z)
  country: string;
  currency: string;
  title: string;
  impact: string;
  actual: string | number | null;
  forecast: string | number;
  previous: string | number;
}

/**
 * Transformer to sanitize and populate events accurately
 */
export function normalizeCalendarEvent(raw: any): NormalizedCalendarEvent {
  const dateUtcRaw = raw.dateUtc || raw.datetime || raw.date || raw.timestamp;
  let dateUtcIso: string;

  if (typeof dateUtcRaw === 'number') {
    dateUtcIso = new Date(dateUtcRaw).toISOString();
  } else if (typeof dateUtcRaw === 'string') {
    if (dateUtcRaw.endsWith('Z') || dateUtcRaw.includes('+')) {
      dateUtcIso = dateUtcRaw;
    } else {
      dateUtcIso = `${dateUtcRaw.replace(' ', 'T')}Z`;
    }
  } else {
    dateUtcIso = new Date().toISOString();
  }

  const country = raw.country || raw.currency || 'USD';
  const currency = raw.currency || raw.country || 'USD';
  const title = raw.name || raw.title || 'Economic Event';
  const impact = raw.impact || raw.importance || 'Low';

  // Preserve string zeroes/negative signs accurately
  const actual = (raw.actual !== undefined && raw.actual !== null && raw.actual !== '') ? raw.actual : null;
  const forecast = (raw.forecast !== undefined && raw.forecast !== null && raw.forecast !== '') ? raw.forecast : '--';
  const previous = (raw.previous !== undefined && raw.previous !== null && raw.previous !== '') ? raw.previous : '--';

  return {
    id: raw.id || `${country}_${title}_${dateUtcIso}`,
    dateUtc: dateUtcIso,
    country,
    currency,
    title,
    impact,
    actual,
    forecast,
    previous,
  };
}

/**
 * Helper to sort any list of calendar events chronologically by their true UTC timestamp
 */
export function sortEventsChronologically<T extends { dateUtc?: string; datetime?: string; timestamp?: number }>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const timeA = a.dateUtc ? new Date(a.dateUtc).getTime() : a.datetime ? new Date(a.datetime).getTime() : (a.timestamp || 0);
    const timeB = b.dateUtc ? new Date(b.dateUtc).getTime() : b.datetime ? new Date(b.datetime).getTime() : (b.timestamp || 0);
    return timeA - timeB;
  });
}
