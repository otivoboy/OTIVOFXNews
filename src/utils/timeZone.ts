// Forex Factory style automatic IP & Browser location timezone engine

export interface UserGeoTimeInfo {
  timeZone: string; // e.g. "America/New_York", "Europe/London", "Asia/Tokyo"
  gmtOffset: string; // e.g. "GMT-4", "GMT+1", "GMT+5:30"
  cityName: string; // e.g. "New York", "London"
  countryName?: string;
  ipAddress?: string;
  isAuto: boolean;
  is12Hour: boolean;
  dstActive?: boolean;
}

export const COMMON_TIMEZONES = [
  { id: 'AUTO', label: 'Auto (Browser & IP Location)', timeZone: 'AUTO' },
  { id: 'America/New_York', label: 'New York (EDT/EST, GMT-4/-5)', timeZone: 'America/New_York' },
  { id: 'UTC', label: 'UTC (Coordinated Universal Time)', timeZone: 'UTC' },
  { id: 'Europe/London', label: 'London (BST/GMT, GMT+1/+0)', timeZone: 'Europe/London' },
  { id: 'Europe/Frankfurt', label: 'Frankfurt / Paris (CEST/CET, GMT+2/+1)', timeZone: 'Europe/Berlin' },
  { id: 'Africa/Nairobi', label: 'Nairobi (EAT, GMT+3)', timeZone: 'Africa/Nairobi' },
  { id: 'Asia/Dubai', label: 'Dubai (GST, GMT+4)', timeZone: 'Asia/Dubai' },
  { id: 'Asia/Kolkata', label: 'Mumbai / New Delhi (IST, GMT+5:30)', timeZone: 'Asia/Kolkata' },
  { id: 'Asia/Singapore', label: 'Singapore / Hong Kong (SGT/HKT, GMT+8)', timeZone: 'Asia/Singapore' },
  { id: 'Asia/Tokyo', label: 'Tokyo (JST, GMT+9)', timeZone: 'Asia/Tokyo' },
  { id: 'Australia/Sydney', label: 'Sydney (AEST/AEDT, GMT+10/+11)', timeZone: 'Australia/Sydney' },
  { id: 'America/Chicago', label: 'Chicago (CDT/CST, GMT-5/-6)', timeZone: 'America/Chicago' },
  { id: 'America/Los_Angeles', label: 'Los Angeles (PDT/PST, GMT-7/-8)', timeZone: 'America/Los_Angeles' },
  { id: 'Africa/Johannesburg', label: 'Johannesburg (SAST, GMT+2)', timeZone: 'Africa/Johannesburg' },
  { id: 'Africa/Lagos', label: 'Lagos (WAT, GMT+1)', timeZone: 'Africa/Lagos' },
  { id: 'America/Sao_Paulo', label: 'São Paulo (BRT, GMT-3)', timeZone: 'America/Sao_Paulo' },
];

/**
 * Detects user's browser location / IP timezone automatically, matching Forex Factory's mechanism
 */
export function getDetectedUserTimeZone(): UserGeoTimeInfo {
  let tz = 'UTC';
  let is12Hour = true;

  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions();
    if (resolved.timeZone) {
      tz = resolved.timeZone;
    }
    // Check if locale default prefers 12-hour or 24-hour
    const sample = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(2026, 0, 1, 13, 0));
    is12Hour = sample.includes('PM') || sample.includes('pm') || sample.includes('1:');
  } catch (e) {
    console.warn('Could not resolve browser timezone, defaulting to UTC', e);
  }

  const offset = getGmtOffsetString(tz);
  const city = extractCityFromTimeZone(tz);
  const dst = isDaylightSavingTime(tz);

  return {
    timeZone: tz,
    gmtOffset: offset,
    cityName: city,
    isAuto: true,
    is12Hour,
    dstActive: dst,
  };
}

/**
 * Checks if Daylight Saving Time (DST) is active for a given timezone
 */
export function isDaylightSavingTime(timeZone: string): boolean {
  try {
    const now = new Date();
    const jan = new Date(now.getFullYear(), 0, 1);
    const jul = new Date(now.getFullYear(), 6, 1);

    const getOffsetMinutes = (d: Date) => {
      const dStr = d.toLocaleString('en-US', { timeZone });
      const uStr = d.toLocaleString('en-US', { timeZone: 'UTC' });
      return (new Date(dStr).getTime() - new Date(uStr).getTime()) / 60000;
    };

    const stdOffset = Math.min(getOffsetMinutes(jan), getOffsetMinutes(jul));
    const currentOffset = getOffsetMinutes(now);

    return currentOffset > stdOffset;
  } catch {
    return false;
  }
}

/**
 * Computes exact GMT offset string (e.g. "GMT-4" or "GMT+5:30") for any IANA timezone
 */
export function getGmtOffsetString(timeZone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      return tzPart.value.replace('UTC', 'GMT');
    }
  } catch {}

  try {
    const dStr = date.toLocaleString('en-US', { timeZone });
    const localDate = new Date(dStr);
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const diffMinutes = Math.round((localDate.getTime() - utcDate.getTime()) / 60000);
    const hours = Math.floor(Math.abs(diffMinutes) / 60);
    const mins = Math.abs(diffMinutes) % 60;
    const sign = diffMinutes >= 0 ? '+' : '-';
    return mins === 0 ? `GMT${sign}${hours}` : `GMT${sign}${hours}:${String(mins).padStart(2, '0')}`;
  } catch {
    return 'GMT+0';
  }
}

/**
 * Extracts friendly city/region from IANA timezone string (e.g. "America/New_York" -> "New York")
 */
export function extractCityFromTimeZone(timeZone: string): string {
  if (timeZone === 'UTC') return 'UTC';
  const parts = timeZone.split('/');
  const cityRaw = parts[parts.length - 1] || timeZone;
  return cityRaw.replace(/_/g, ' ');
}

/**
 * Formats a live timestamp or date into Forex Factory style clock (e.g. "2:30:15 pm" or "14:30:15")
 */
export function formatLiveClock(date: Date, timeZone: string, is12Hour: boolean = true, showSeconds: boolean = true): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: is12Hour ? 'numeric' : '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: is12Hour,
    }).format(date);
  } catch {
    return date.toUTCString().slice(17, 25);
  }
}

/**
 * Converts UTC timestamp or ISO string into user's localized date and time strings.
 * Formats YYYY-MM-DD in the user's selected timezone so calendar groupings
 * dynamically adapt across all time zones (e.g. GMT+3 Nairobi vs EDT New York).
 */
export function getEventLocalDate(
  utcStringOrTimestamp: number | string,
  timeZone: string = 'UTC',
  is12Hour: boolean = true
): {
  localDateStr: string;
  localTimeStr: string;
  formattedDay: string;
  fullDateStr: string;
} {
  let date: Date;
  if (typeof utcStringOrTimestamp === 'number') {
    date = new Date(utcStringOrTimestamp);
  } else if (typeof utcStringOrTimestamp === 'string') {
    const s = utcStringOrTimestamp.trim();
    // Ensure ISO string format has UTC specifier 'Z' if no explicit timezone offset is present
    const utcString = s.endsWith('Z') || s.includes('+') || s.match(/-\d{2}:\d{2}$/)
      ? s
      : `${s.replace(' ', 'T')}Z`;
    date = new Date(utcString);
  } else {
    date = new Date();
  }

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  // 1. Get exact YYYY-MM-DD in user's timezone (using en-CA locale which standardizes to YYYY-MM-DD)
  let localDateStr = '';
  try {
    localDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    localDateStr = date.toISOString().split('T')[0];
  }

  // 2. Get formatted time string matching Forex Factory style (e.g. "3:30pm" or "15:30")
  let localTimeStr = '';
  try {
    const rawTime = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: is12Hour ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: is12Hour,
    }).format(date);
    localTimeStr = rawTime.replace(' AM', 'am').replace(' PM', 'pm');
  } catch {
    localTimeStr = date.toISOString().slice(11, 16);
  }

  // 3. Get weekday, month day labels
  let formattedDay = '';
  let fullDateStr = '';
  try {
    formattedDay = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);

    fullDateStr = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    formattedDay = localDateStr;
    fullDateStr = localDateStr;
  }

  return {
    localDateStr,
    localTimeStr,
    formattedDay,
    fullDateStr,
  };
}

/**
 * Parses raw timestamp or ISO string into target timezone formatted time string (e.g. "3:30pm")
 */
export function parseEventTime(
  rawTimestamp: number | string,
  targetTimeZone: string = 'Africa/Nairobi',
  is12Hour: boolean = true
): string {
  const { localTimeStr } = getEventLocalDate(rawTimestamp, targetTimeZone, is12Hour);
  return localTimeStr;
}

/**
 * Accurate countdown timer computing purely against standard Epoch time
 * Returns e.g. "T -03:00:15", "T -2d 04h", or "PAST"
 */
export function getCountdown(
  eventUtcTimestamp: number | string,
  currentEpochMs: number = Date.now()
): string {
  const eventTime = typeof eventUtcTimestamp === 'number'
    ? eventUtcTimestamp
    : new Date(
        typeof eventUtcTimestamp === 'string' && !eventUtcTimestamp.endsWith('Z') && !eventUtcTimestamp.includes('+') && !eventUtcTimestamp.match(/-\d{2}:\d{2}$/)
          ? `${eventUtcTimestamp.replace(' ', 'T')}Z`
          : eventUtcTimestamp
      ).getTime();

  const diffMs = eventTime - currentEpochMs;

  if (diffMs <= 0) return 'PAST';

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `T -${days}d ${pad(remHours)}h`;
  }

  return `T -${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Returns YYYY-MM-DD date string in target timezone for grouping
 */
export function getLocalDateString(timestamp: number, timeZone: string = 'UTC'): string {
  return getEventLocalDate(timestamp, timeZone).localDateStr;
}

/**
 * Formats economic event release timestamp to user's localized time matching Forex Factory (e.g. "Mon, Sep 14, 3:30pm" or "3:30pm")
 */
export function formatEventReleaseTime(
  timestamp: number | string,
  timeZone: string,
  is12Hour: boolean = true,
  includeDate: boolean = false
): string {
  const { localTimeStr, formattedDay } = getEventLocalDate(timestamp, timeZone, is12Hour);
  if (includeDate) {
    return `${formattedDay}, ${localTimeStr}`;
  }
  return localTimeStr;
}


