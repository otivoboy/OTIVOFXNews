import React, { useState, useMemo } from 'react';
import { Star, Clock, Filter, AlertCircle, Calendar, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserTimeZone } from '../../context/TimeZoneContext';
import { EconomicEvent } from '../../types';
import { generateClientMacroCalendar } from '../../services/macroCalendarService';

interface TechnicalEconomicCalendarProps {
  assetSymbol?: string;
  events?: EconomicEvent[];
}

export const TechnicalEconomicCalendar: React.FC<TechnicalEconomicCalendarProps> = ({
  assetSymbol,
  events: propEvents,
}) => {
  const { liveClock, geoTimeInfo, formatEventTime, formatEventDate } = useUserTimeZone();
  const [impactFilter, setImpactFilter] = useState<'HIGH' | 'MEDIUM_PLUS' | 'ALL'>('HIGH');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>('2026-09-14');

  // Fallback to client macro calendar if events prop not supplied
  const rawEvents = useMemo(() => {
    if (propEvents && propEvents.length > 0) return propEvents;
    return generateClientMacroCalendar();
  }, [propEvents]);

  // Helper to compute trading week bounds (Monday - Friday)
  const getEventWeekMonday = (ts: number): string => {
    const date = new Date(ts);
    const dow = date.getUTCDay(); // 0 = Sun, 1 = Mon ...
    const diffToMon = dow === 0 ? 1 : 1 - dow;
    const mon = new Date(date);
    mon.setUTCDate(date.getUTCDate() + diffToMon);
    return mon.toISOString().split('T')[0];
  };

  // Available trading weeks
  const availableWeeks = useMemo(() => {
    const map = new Map<string, { weekKey: string; label: string; shortLabel: string; isCurrent: boolean }>();
    
    // Ensure Sep 14 week is available
    const weeksList = ['2026-09-07', '2026-09-14', '2026-09-21'];
    for (const mondayKey of weeksList) {
      const [y, m, d] = mondayKey.split('-').map(Number);
      const mon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const fri = new Date(mon);
      fri.setUTCDate(mon.getUTCDate() + 4);
      const monMonth = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(mon);
      const monDay = mon.getUTCDate();
      const friMonth = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(fri);
      const friDay = fri.getUTCDate();
      const year = mon.getUTCFullYear();

      map.set(mondayKey, {
        weekKey: mondayKey,
        label: `${monMonth} ${monDay} – ${monMonth === friMonth ? '' : friMonth + ' '}${friDay}, ${year}`,
        shortLabel: `${monMonth} ${monDay}–${friDay}`,
        isCurrent: mondayKey === '2026-09-14',
      });
    }

    return Array.from(map.values()).sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  }, []);

  const currentWeekIdx = availableWeeks.findIndex((w) => w.weekKey === selectedWeekKey);
  const canGoPrev = currentWeekIdx > 0;
  const canGoNext = currentWeekIdx >= 0 && currentWeekIdx < availableWeeks.length - 1;

  // Extract base/quote currencies from asset symbol if available (e.g. "EUR/USD" -> ["EUR", "USD"])
  const relevantCurrencies = useMemo(() => {
    if (!assetSymbol) return [];
    const clean = assetSymbol.replace('/', '').toUpperCase();
    if (clean.length === 6) {
      return [clean.slice(0, 3), clean.slice(3, 6)];
    }
    return [];
  }, [assetSymbol]);

  // Filter events based on Week, Impact, and Currency
  const filteredEvents = useMemo(() => {
    return rawEvents.filter((event) => {
      // Week filtering (Monday to Friday)
      const evtWeek = getEventWeekMonday(event.timestamp);
      if (selectedWeekKey && evtWeek !== selectedWeekKey) {
        return false;
      }

      // Impact filtering
      if (impactFilter === 'HIGH' && event.importance !== 'HIGH') {
        return false;
      }
      if (impactFilter === 'MEDIUM_PLUS' && event.importance === 'LOW') {
        return false;
      }

      // Currency filtering
      if (currencyFilter === 'PAIR_ONLY' && relevantCurrencies.length > 0) {
        if (!relevantCurrencies.includes(event.currency)) return false;
      } else if (currencyFilter !== 'ALL' && currencyFilter !== 'PAIR_ONLY') {
        if (event.currency !== currencyFilter) return false;
      }

      return true;
    });
  }, [rawEvents, selectedWeekKey, impactFilter, currencyFilter, relevantCurrencies]);

  // Group events by localized date; STRICTLY omit any day that has 0 matching events
  const groupedByDate = useMemo(() => {
    // Sort chronologically
    const sorted = [...filteredEvents].sort((a, b) => a.timestamp - b.timestamp);

    const groupsMap = new Map<string, EconomicEvent[]>();

    sorted.forEach((event) => {
      // Format human-friendly date header using client timezone (e.g. "Wednesday, Sep 9, 2026")
      const dateHeader = formatEventDate(event.timestamp);
      if (!groupsMap.has(dateHeader)) {
        groupsMap.set(dateHeader, []);
      }
      groupsMap.get(dateHeader)!.push(event);
    });

    // Only return groups that contain at least one matching event
    return Array.from(groupsMap.entries())
      .map(([dateHeader, eventsList]) => ({
        dateHeader,
        events: eventsList,
      }))
      .filter((group) => group.events.length > 0);
  }, [filteredEvents, formatEventDate]);

  return (
    <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl overflow-hidden shadow-xs">
      {/* Calendar Header with Live Clock & Filter Controls */}
      <div className="px-4 py-3 bg-[#faf8f4] border-b border-[#e2dcd2] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-sans flex items-center gap-1.5">
              <span>Forex Factory Economic Schedule</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Verified High & Medium Impact Macroeconomic Releases ({groupedByDate.length} Active Days)
            </p>
          </div>
        </div>

        {/* Live Clock Badge */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-[#e2dcd2]">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Current: <strong className="text-slate-900">{liveClock}</strong> ({geoTimeInfo.gmtOffset})
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 py-2 bg-[#f6f2ea] border-b border-[#e2dcd2] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Impact:
          </span>
          <button
            onClick={() => setImpactFilter('HIGH')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
              impactFilter === 'HIGH'
                ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-[#ded5c6]'
            }`}
          >
            Tier-1 High Impact Only
          </button>
          <button
            onClick={() => setImpactFilter('MEDIUM_PLUS')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer ${
              impactFilter === 'MEDIUM_PLUS'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-[#ded5c6]'
            }`}
          >
            Medium & High
          </button>
          <button
            onClick={() => setImpactFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer ${
              impactFilter === 'ALL'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-[#ded5c6]'
            }`}
          >
            All Releases
          </button>
        </div>

        {/* Currency Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Currency:</span>
          {relevantCurrencies.length > 0 && (
            <button
              onClick={() => setCurrencyFilter(currencyFilter === 'PAIR_ONLY' ? 'ALL' : 'PAIR_ONLY')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                currencyFilter === 'PAIR_ONLY'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-[#ded5c6]'
              }`}
            >
              {relevantCurrencies.join('/')} Only
            </button>
          )}
          <select
            value={currencyFilter === 'PAIR_ONLY' ? 'ALL' : currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="px-2 py-1 rounded bg-white border border-[#ded5c6] text-[11px] font-mono text-slate-800 cursor-pointer focus:outline-hidden"
          >
            <option value="ALL">All Currencies</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
            <option value="NZD">NZD</option>
            <option value="CHF">CHF</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
      </div>

      {/* Trading Week Selector (Mon - Fri) */}
      <div className="px-4 py-2 bg-[#f1ebe0] border-b border-[#e2dcd2] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#ffffff] rounded-md border border-[#ded5c6] p-0.5 shadow-2xs">
            <button
              onClick={() => canGoPrev && setSelectedWeekKey(availableWeeks[currentWeekIdx - 1].weekKey)}
              disabled={!canGoPrev}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#ede5d8] transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev Week</span>
            </button>
            <div className="h-3 w-[1px] bg-[#ded5c6] mx-0.5" />
            <button
              onClick={() => canGoNext && setSelectedWeekKey(availableWeeks[currentWeekIdx + 1].weekKey)}
              disabled={!canGoNext}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#ede5d8] transition cursor-pointer"
            >
              <span>Next Week</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-900 font-bold flex-wrap">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
            <span>Week: <strong>{availableWeeks[currentWeekIdx]?.label || selectedWeekKey}</strong></span>
            {selectedWeekKey === '2026-09-14' ? (
              <span className="text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-700 text-white shadow-2xs">
                CURRENT WEEK
              </span>
            ) : (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#ded5c6] text-slate-700">
                {selectedWeekKey < '2026-09-14' ? 'Past Week' : 'Next Week'}
              </span>
            )}
            <span className="text-slate-500 font-normal text-[11px]">
              (Monday – Friday)
            </span>
          </div>
        </div>

        {/* Quick Week Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {availableWeeks.map((wk) => {
            const isSelected = selectedWeekKey === wk.weekKey;
            return (
              <button
                key={wk.weekKey}
                onClick={() => setSelectedWeekKey(wk.weekKey)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : wk.isCurrent
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-[#faf8f4] text-slate-700 hover:bg-[#eae2d4] border-[#ded5c6]'
                }`}
              >
                {wk.shortLabel} {wk.isCurrent ? '(Current)' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped Tables by Active Day */}
      {groupedByDate.length === 0 ? (
        <div className="p-8 text-center bg-[#faf8f4]">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 font-sans">No matching releases found</p>
          <p className="text-xs text-slate-500 font-sans mt-1">
            There are no {impactFilter === 'HIGH' ? 'high-impact' : ''} economic releases matching the active filter criteria for this period. Days without qualifying releases are hidden.
          </p>
          <button
            onClick={() => {
              setImpactFilter('ALL');
              setCurrencyFilter('ALL');
            }}
            className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-mono font-bold hover:bg-emerald-200 transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#e2dcd2]">
          {groupedByDate.map((group, gIdx) => (
            <div key={gIdx} className="overflow-x-auto">
              {/* Day Header */}
              <div className="px-4 py-2.5 bg-[#f4efe6] text-xs font-bold text-slate-800 font-sans border-b border-[#e2dcd2] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>{group.dateHeader}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-normal">
                  {group.events.length} {group.events.length === 1 ? 'Release' : 'Releases'}
                </span>
              </div>

              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-[#faf8f4] text-slate-500 font-medium border-b border-[#e2dcd2] text-[11px]">
                    <th className="py-2 px-3 w-20">Time</th>
                    <th className="py-2 px-3 w-16">Cur.</th>
                    <th className="py-2 px-3">Event</th>
                    <th className="py-2 px-3 w-20 text-center">Impact</th>
                    <th className="py-2 px-3 w-20 text-right">Actual</th>
                    <th className="py-2 px-3 w-20 text-right">Forecast</th>
                    <th className="py-2 px-3 w-20 text-right">Previous</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee8dc] text-slate-800 font-mono">
                  {[...group.events]
                    .sort((a, b) => {
                      const timeA = a.dateUtc ? new Date(a.dateUtc).getTime() : a.datetime ? new Date(a.datetime).getTime() : a.timestamp;
                      const timeB = b.dateUtc ? new Date(b.dateUtc).getTime() : b.datetime ? new Date(b.datetime).getTime() : b.timestamp;
                      return timeA - timeB;
                    })
                    .map((event, eIdx) => {
                    const localTime = formatEventTime(event.timestamp);
                    const isHigh = event.importance === 'HIGH';
                    const isMedium = event.importance === 'MEDIUM';

                    const hasActual = event.actual !== null && event.actual !== undefined && event.actual !== '' && (event.actual as any) !== '--';
                    const hasForecast = event.forecast !== null && event.forecast !== undefined && event.forecast !== '' && (event.forecast as any) !== '--';
                    const hasPrevious = event.previous !== null && event.previous !== undefined && event.previous !== '' && (event.previous as any) !== '--';

                    const formatActual = typeof event.actual === 'number'
                      ? `${event.actual > 0 && event.unit === '%' ? '+' : ''}${event.actual}${event.unit || ''}`
                      : String(event.actual);
                    const formatForecast = typeof event.forecast === 'number'
                      ? `${event.forecast > 0 && event.unit === '%' ? '+' : ''}${event.forecast}${event.unit || ''}`
                      : String(event.forecast);
                    const formatPrevious = typeof event.previous === 'number'
                      ? `${event.previous > 0 && event.unit === '%' ? '+' : ''}${event.previous}${event.unit || ''}`
                      : String(event.previous);

                    return (
                      <tr
                        key={event.id || eIdx}
                        className={`transition-colors hover:bg-[#faf7f0] ${
                          isHigh ? 'bg-[#fffdfa]' : ''
                        }`}
                      >
                        {/* Time */}
                        <td className="py-2.5 px-3 font-mono text-slate-700 font-bold text-[11px] whitespace-nowrap">
                          {localTime}
                        </td>

                        {/* Currency & Flag */}
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-sm">{event.flag}</span>
                          <span className="text-[11px]">{event.currency}</span>
                        </td>

                        {/* Event Title & Speech Badge */}
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={isHigh ? 'font-bold text-slate-900' : 'text-slate-800'}>
                              {event.title}
                            </span>
                            {event.period && (
                              <span className="text-[10px] text-slate-500 bg-[#eee8dc] px-1.5 py-0.5 rounded font-mono">
                                {event.period}
                              </span>
                            )}
                            {event.title.toLowerCase().includes('speaks') && (
                              <span className="text-[10px] text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded font-bold">
                                Speech
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Importance Badge */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              isHigh
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : isMedium
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isHigh ? 'bg-rose-600' : isMedium ? 'bg-amber-600' : 'bg-slate-400'
                              }`}
                            />
                            {event.importance}
                          </span>
                        </td>

                        {/* Actual */}
                        <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap column-actual actual-val ${hasActual ? 'active highlight' : ''}`}>
                          {hasActual ? (
                            <span className={`inline-block px-1.5 py-0.5 rounded border ${
                              hasForecast && Number(event.actual) > Number(event.forecast)
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold'
                                : hasForecast && Number(event.actual) < Number(event.forecast)
                                ? 'bg-rose-50 text-rose-800 border-rose-400 font-extrabold'
                                : 'bg-slate-100 text-slate-900 border-slate-300 font-bold'
                            }`}>
                              {formatActual}
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        {/* Forecast */}
                        <td className="py-2.5 px-3 text-right text-slate-700 whitespace-nowrap column-forecast forecast-val font-medium">
                          {hasForecast ? formatForecast : '--'}
                        </td>

                        {/* Previous */}
                        <td className="py-2.5 px-3 text-right text-slate-500 whitespace-nowrap column-previous previous-val">
                          {hasPrevious ? formatPrevious : '--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
