import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ChevronRight,
  ChevronLeft,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarDays,
  LayoutGrid,
  StretchHorizontal,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import { EconomicEvent } from '../types';
import { useUserTimeZone } from '../context/TimeZoneContext';
import { getEventLocalDate, getCountdown } from '../utils/timeZone';
import { ForexFactoryIcon } from './ForexFactoryIcon';
import { evaluatePredictionAccuracy } from '../utils/predictionEvaluator';

interface EventStripProps {
  events: EconomicEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: EconomicEvent) => void;
  activeProvider?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  recentlyReleasedId?: string | null;
}

type ViewMode = 'CALENDAR' | 'STRIP';
type CategoryFilter = 'ALL' | 'UPCOMING' | 'PAST' | 'HIGH_IMPACT' | 'INFLATION' | 'LABOR' | 'CENTRAL_BANKS';

export const EventStrip: React.FC<EventStripProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  activeProvider = 'engine_live',
  onRefresh,
  isRefreshing = false,
  recentlyReleasedId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('CALENDAR');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>('2026-09-14'); // Monday of active trading week
  const [selectedDayKey, setSelectedDayKey] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM-DD'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());
  
  const { formatEventTime, geoTimeInfo, activeTimeZone, is12Hour } = useUserTimeZone();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  // Live 1-second interval for countdown precision
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const checkScrollState = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [events, categoryFilter, selectedWeekKey, selectedDayKey, viewMode]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollState, 350);
    }
  };

  const formatCountdown = (timestamp: number) => {
    return getCountdown(timestamp, now);
  };

  // Helper to extract ISO date key YYYY-MM-DD from timestamp in user's active timezone
  const getRawDayKey = useCallback((ts: number): string => {
    return getEventLocalDate(ts, activeTimeZone, is12Hour).localDateStr;
  }, [activeTimeZone, is12Hour]);

  // Standard Forex Factory Trading Day: Weekend (Sunday/Saturday) events map to Monday or Friday
  const getTradingDayKey = useCallback((ts: number): string => {
    const raw = getRawDayKey(ts);
    const [y, m, d] = raw.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dow = date.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    if (dow === 0) {
      // Sunday release (e.g. Asian market open) maps to Monday trading day
      const mon = new Date(date);
      mon.setUTCDate(date.getUTCDate() + 1);
      return mon.toISOString().split('T')[0];
    }
    if (dow === 6) {
      // Saturday release maps to Friday trading day
      const fri = new Date(date);
      fri.setUTCDate(date.getUTCDate() - 1);
      return fri.toISOString().split('T')[0];
    }
    return raw;
  }, [getRawDayKey]);

  // Helper to find the Monday date (YYYY-MM-DD) for any trading day key
  const getWeekMondayKey = useCallback((tradingDayKey: string): string => {
    const [y, m, d] = tradingDayKey.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dow = date.getUTCDay(); // 1 = Mon, ..., 5 = Fri
    const diffToMon = dow === 0 ? 1 : 1 - dow;
    const mon = new Date(date);
    mon.setUTCDate(date.getUTCDate() + diffToMon);
    return mon.toISOString().split('T')[0];
  }, []);

  // Helper to get formatted day label in user's active timezone
  const getDayLabel = useCallback((dayKey: string): { label: string; fullDate: string; isToday: boolean } => {
    const todayTradingKey = getTradingDayKey(now);
    const isToday = dayKey === todayTradingKey;

    const [y, m, d] = dayKey.split('-').map(Number);
    // Use noon UTC on parsed date numbers to produce exact date label without cross-day shifts
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(dateObj);
    const month = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(dateObj);
    const fullWeekday = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(dateObj);
    const fullMonth = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long' }).format(dateObj);

    return {
      label: `${weekday}, ${month} ${d}`,
      fullDate: `${fullWeekday}, ${fullMonth} ${d}, ${y}`,
      isToday,
    };
  }, [now, getTradingDayKey]);

  // Sort events chronologically
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.timestamp - b.timestamp);
  }, [events]);

  // Current week's Monday in trading calendar
  const currentWeekMondayKey = useMemo(() => {
    const todayTradingKey = getTradingDayKey(now);
    return getWeekMondayKey(todayTradingKey);
  }, [getTradingDayKey, getWeekMondayKey, now]);

  // Group all events by Trading Day Key
  const eventsByTradingDay = useMemo(() => {
    const map = new Map<string, EconomicEvent[]>();
    for (const evt of sortedEvents) {
      const dayKey = getTradingDayKey(evt.timestamp);
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey)!.push(evt);
    }
    return map;
  }, [sortedEvents, getTradingDayKey]);

  // Available Trading Weeks (strictly Monday to Friday for each week)
  const availableWeeks = useMemo(() => {
    const weekMondaysSet = new Set<string>();
    if (currentWeekMondayKey) {
      weekMondaysSet.add(currentWeekMondayKey);
    }
    for (const evt of sortedEvents) {
      const dayKey = getTradingDayKey(evt.timestamp);
      const weekMonday = getWeekMondayKey(dayKey);
      weekMondaysSet.add(weekMonday);
    }

    const sortedWeekMondays = Array.from(weekMondaysSet).sort();

    return sortedWeekMondays.map((mondayKey) => {
      const [y, m, d] = mondayKey.split('-').map(Number);
      const mondayDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const fridayDate = new Date(mondayDate);
      fridayDate.setUTCDate(mondayDate.getUTCDate() + 4);
      const fridayKey = fridayDate.toISOString().split('T')[0];

      const monMonth = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(mondayDate);
      const monDay = mondayDate.getUTCDate();
      const friMonth = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(fridayDate);
      const friDay = fridayDate.getUTCDate();
      const year = mondayDate.getUTCFullYear();

      const label = `${monMonth} ${monDay} – ${monMonth === friMonth ? '' : friMonth + ' '}${friDay}, ${year}`;
      const shortLabel = `${monMonth} ${monDay}–${friDay}`;

      const isCurrent = mondayKey === currentWeekMondayKey;
      let relativeTag = '';
      if (isCurrent) {
        relativeTag = 'This Week';
      } else if (mondayKey < currentWeekMondayKey) {
        relativeTag = 'Past Week';
      } else {
        relativeTag = 'Next Week';
      }

      // Generate the 5 trading days: Monday to Friday
      const days = [0, 1, 2, 3, 4].map((offset) => {
        const dayDate = new Date(mondayDate);
        dayDate.setUTCDate(mondayDate.getUTCDate() + offset);
        const dayKey = dayDate.toISOString().split('T')[0];
        const info = getDayLabel(dayKey);
        const dayEvents = eventsByTradingDay.get(dayKey) || [];
        const highImpactCount = dayEvents.filter((e) => e.importance === 'HIGH').length;
        const passedCount = dayEvents.filter((e) => e.timestamp <= now || e.status === 'RELEASED').length;
        const upcomingCount = dayEvents.length - passedCount;

        return {
          key: dayKey,
          offset,
          ...info,
          total: dayEvents.length,
          highImpactCount,
          passedCount,
          upcomingCount,
          events: dayEvents,
        };
      });

      const totalEvents = days.reduce((acc, day) => acc + day.total, 0);
      const totalHighImpact = days.reduce((acc, day) => acc + day.highImpactCount, 0);

      return {
        weekKey: mondayKey,
        mondayDateStr: mondayKey,
        fridayDateStr: fridayKey,
        label,
        shortLabel,
        relativeTag,
        isCurrent,
        total: totalEvents,
        highImpactCount: totalHighImpact,
        days,
      };
    });
  }, [currentWeekMondayKey, sortedEvents, getTradingDayKey, getWeekMondayKey, eventsByTradingDay, getDayLabel, now]);

  // Active trading week object
  const activeWeek = useMemo(() => {
    return availableWeeks.find((w) => w.weekKey === selectedWeekKey) ||
      availableWeeks.find((w) => w.isCurrent) ||
      availableWeeks[0];
  }, [availableWeeks, selectedWeekKey]);

  // Navigation handlers
  const currentWeekIdx = availableWeeks.findIndex((w) => w.weekKey === (activeWeek?.weekKey || ''));
  const canGoPrev = currentWeekIdx > 0;
  const canGoNext = currentWeekIdx >= 0 && currentWeekIdx < availableWeeks.length - 1;

  const handlePrevWeek = () => {
    if (canGoPrev) {
      setSelectedWeekKey(availableWeeks[currentWeekIdx - 1].weekKey);
      setSelectedDayKey('ALL');
    }
  };

  const handleNextWeek = () => {
    if (canGoNext) {
      setSelectedWeekKey(availableWeeks[currentWeekIdx + 1].weekKey);
      setSelectedDayKey('ALL');
    }
  };

  // Filtered events based on Week, Day selection, Category, and Search query
  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((e) => {
      const isPast = e.timestamp <= now || e.status === 'RELEASED';
      const tradingDay = getTradingDayKey(e.timestamp);
      const weekMonday = getWeekMondayKey(tradingDay);

      // 1. Week Filter: Must belong to selected active week
      if (activeWeek && weekMonday !== activeWeek.weekKey) {
        return false;
      }

      // 2. Day Filter: If a specific Monday-Friday day is selected
      if (selectedDayKey !== 'ALL' && tradingDay !== selectedDayKey) {
        return false;
      }

      // 3. Category Filter
      if (categoryFilter === 'UPCOMING' && isPast) return false;
      if (categoryFilter === 'PAST' && !isPast) return false;
      if (categoryFilter === 'HIGH_IMPACT' && e.importance !== 'HIGH') return false;
      if (categoryFilter === 'INFLATION') {
        const isInf = ['CPI', 'PPI', 'PCE'].includes(e.code) ||
          e.title.toLowerCase().includes('cpi') ||
          e.title.toLowerCase().includes('ppi') ||
          e.title.toLowerCase().includes('pce') ||
          e.title.toLowerCase().includes('inflation');
        if (!isInf) return false;
      }
      if (categoryFilter === 'LABOR') {
        const isLab = ['NFP', 'JOBLESS_CLAIMS'].includes(e.code) ||
          e.title.toLowerCase().includes('employment') ||
          e.title.toLowerCase().includes('jobless') ||
          e.title.toLowerCase().includes('claims') ||
          e.title.toLowerCase().includes('payroll') ||
          e.title.toLowerCase().includes('unemployment') ||
          e.title.toLowerCase().includes('earnings');
        if (!isLab) return false;
      }
      if (categoryFilter === 'CENTRAL_BANKS') {
        const isCb = ['FOMC', 'BOJ'].includes(e.code) ||
          e.title.toLowerCase().includes('rate') ||
          e.title.toLowerCase().includes('ecb') ||
          e.title.toLowerCase().includes('boe') ||
          e.title.toLowerCase().includes('boc') ||
          e.title.toLowerCase().includes('snb') ||
          e.title.toLowerCase().includes('fed') ||
          e.title.toLowerCase().includes('fomc') ||
          e.title.toLowerCase().includes('rba') ||
          e.title.toLowerCase().includes('speaks') ||
          e.title.toLowerCase().includes('statement');
        if (!isCb) return false;
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchCurr = e.currency.toLowerCase().includes(q);
        const matchCountry = e.country.toLowerCase().includes(q);
        if (!matchTitle && !matchCurr && !matchCountry) return false;
      }

      return true;
    });
  }, [sortedEvents, activeWeek, selectedDayKey, getTradingDayKey, getWeekMondayKey, categoryFilter, searchQuery, now]);

  // Group filtered events by Trading Day for schedule presentation
  const filteredEventsByDay = useMemo(() => {
    const map = new Map<string, EconomicEvent[]>();
    for (const evt of filteredEvents) {
      const dayKey = getTradingDayKey(evt.timestamp);
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey)!.push(evt);
    }
    return map;
  }, [filteredEvents, getTradingDayKey]);

  const getProviderLabel = () => {
    if (activeProvider === 'gemini_forex_factory_search') return 'Forex Factory (Gemini)';
    if (activeProvider === 'finnhub') return 'Finnhub Live API';
    return 'Forex Factory Live Calendar';
  };

  const categoryFilterTabs: { id: CategoryFilter; label: string }[] = [
    { id: 'ALL', label: 'All Releases' },
    { id: 'HIGH_IMPACT', label: 'Tier-1 High' },
    { id: 'PAST', label: 'Past' },
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'INFLATION', label: 'CPI / PPI' },
    { id: 'LABOR', label: 'Labor' },
    { id: 'CENTRAL_BANKS', label: 'Central Banks' },
  ];

  return (
    <section className="bg-[#ffffff] border-b border-[#e2dcd2] px-3 sm:px-6 lg:px-8 xl:px-10 py-3 w-full shadow-xs transition-all">
      {/* 1. Header Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b border-[#e8e2d8]">
        {/* Left: Branding, Timezone, Clock, and Sync */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 font-mono text-slate-800 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-900 font-sans flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-emerald-700" />
              ECONOMIC CALENDAR
            </span>
          </div>

          <span className="text-[11px] bg-[#f1ebe0] px-2 py-0.5 rounded text-emerald-900 border border-[#ded5c6] font-mono font-bold">
            {geoTimeInfo.gmtOffset} • {geoTimeInfo.cityName || 'Local Time'}
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-[#f1ebe0] text-slate-700 px-2 py-0.5 rounded border border-[#ded5c6] font-mono">
            <span>{getProviderLabel()}</span>
          </span>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Sync & refresh Forex Factory live calendar schedule"
              className="flex items-center gap-1 text-[10px] text-slate-700 hover:text-slate-900 bg-[#f1ebe0] hover:bg-[#eae2d4] px-2.5 py-0.5 rounded border border-[#ded5c6] transition cursor-pointer font-mono font-medium"
            >
              <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Calendar'}</span>
            </button>
          )}
        </div>

        {/* Right: Search, View Mode Switcher, and Expand/Collapse */}
        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search event, currency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-2 py-1 text-[11px] font-mono rounded bg-[#faf8f4] border border-[#ded5c6] focus:border-emerald-600 focus:outline-none w-36 sm:w-44 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* View Mode Switcher (Calendar Grid vs Horizontal Strip) */}
          <div className="flex items-center bg-[#f1ebe0] p-0.5 rounded-lg border border-[#ded5c6]">
            <button
              onClick={() => setViewMode('CALENDAR')}
              title="Calendar Schedule Grid View"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                viewMode === 'CALENDAR'
                  ? 'bg-[#ffffff] text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('STRIP')}
              title="Horizontal Carousel Ribbon View"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                viewMode === 'STRIP'
                  ? 'bg-[#ffffff] text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <StretchHorizontal className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">Strip</span>
            </button>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className="p-1 rounded bg-[#f1ebe0] hover:bg-[#eae2d4] text-slate-700 border border-[#ded5c6] transition cursor-pointer"
            title={isCalendarExpanded ? 'Minimize calendar view' : 'Expand full calendar'}
          >
            {isCalendarExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Trading Week Selector Toolbar (Monday to Friday, Each Week) */}
      <div className="mt-2.5 py-1.5 px-3 bg-[#f6f2ea] rounded-lg border border-[#ded5c6] flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Previous / Next Week Controls & Active Week Details */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-[#ffffff] rounded-md border border-[#ded5c6] p-0.5 shadow-2xs">
            <button
              onClick={handlePrevWeek}
              disabled={!canGoPrev}
              title="Previous Trading Week (Mon - Fri)"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#ede5d8] transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev Week</span>
            </button>
            <div className="h-3 w-[1px] bg-[#ded5c6] mx-0.5" />
            <button
              onClick={handleNextWeek}
              disabled={!canGoNext}
              title="Next Trading Week (Mon - Fri)"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#ede5d8] transition cursor-pointer"
            >
              <span className="hidden sm:inline">Next Week</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Week Label & Status Badges */}
          {activeWeek && (
            <div className="flex items-center gap-2 font-mono text-xs text-slate-900 font-bold flex-wrap">
              <span className="flex items-center gap-1.5 bg-[#ffffff] px-2 py-0.5 rounded border border-[#ded5c6] text-slate-800">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
                <span>Week: <strong>{activeWeek.label}</strong></span>
              </span>

              {activeWeek.isCurrent ? (
                <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-700 text-white shadow-2xs">
                  CURRENT WEEK
                </span>
              ) : (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#ebe4d6] text-slate-700 border border-[#ded5c6]">
                  {activeWeek.relativeTag}
                </span>
              )}

              <span className="text-slate-600 font-normal text-[11px]">
                {activeWeek.total} Releases ({activeWeek.highImpactCount} Tier-1 High)
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Week Selection Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {availableWeeks.map((wk) => {
            const isSelected = activeWeek?.weekKey === wk.weekKey;
            return (
              <button
                key={wk.weekKey}
                onClick={() => {
                  setSelectedWeekKey(wk.weekKey);
                  setSelectedDayKey('ALL');
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer border ${
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

      {/* 3. Monday to Friday Day Selector Ribbon & Category Filters */}
      <div className="mt-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
        {/* Day Selector Ribbon: Mon, Tue, Wed, Thu, Fri (Strictly Monday to Friday) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDayKey('ALL')}
            className={`px-3 py-1 rounded-md text-[11px] font-mono font-bold transition whitespace-nowrap cursor-pointer border ${
              selectedDayKey === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-[#faf8f4] text-slate-700 hover:bg-[#f1ebe0] border-[#ded5c6]'
            }`}
          >
            All Week (Mon - Fri) {activeWeek ? `(${activeWeek.total})` : ''}
          </button>

          {activeWeek?.days.map((day) => {
            const isSelected = selectedDayKey === day.key;
            return (
              <button
                key={day.key}
                onClick={() => setSelectedDayKey(day.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition whitespace-nowrap cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-900 font-bold shadow-2xs'
                    : day.isToday
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                    : 'bg-[#faf8f4] text-slate-700 hover:bg-[#f1ebe0] border-[#ded5c6]'
                }`}
              >
                <span>{day.label}</span>
                {day.isToday && (
                  <span className={`text-[9px] uppercase font-bold px-1 py-0.2 rounded ${
                    isSelected ? 'bg-emerald-950 text-emerald-200' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    Today
                  </span>
                )}
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-[#eae3d5] text-slate-800'
                }`}>
                  {day.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Filters (High Impact, Passed, CPI, Labor, etc.) */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {categoryFilterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition whitespace-nowrap cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                  : 'text-slate-600 hover:text-slate-900 bg-[#faf8f4] hover:bg-[#f1ebe0] border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CALENDAR CONTENT (Grid vs Strip) */}
      {isCalendarExpanded && (
        <div className="mt-3">
          {/* VIEW MODE A: AUTHENTIC CALENDAR SCHEDULE VIEW */}
          {viewMode === 'CALENDAR' ? (
            <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="flex items-center justify-center gap-3 py-6 px-4 w-full text-center text-xs font-mono text-slate-600 bg-[#faf8f4] rounded-lg border border-[#ded5c6]">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  <span>No economic releases found for selected calendar filters.</span>
                  <button
                    onClick={() => {
                      setSelectedDayKey('ALL');
                      setCategoryFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-[11px] font-bold transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                Array.from(filteredEventsByDay.entries()).map(([dayKey, dayEvents]) => {
                  const dayInfo = getDayLabel(dayKey);
                  return (
                    <div key={dayKey} className="bg-[#faf8f4] rounded-xl border border-[#ded5c6] overflow-hidden shadow-2xs">
                      {/* Day Header Banner */}
                      <div className={`px-3 py-2 flex items-center justify-between border-b ${
                        dayInfo.isToday 
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                          : 'bg-[#f3ede3] border-[#e2dcd2] text-slate-800'
                      }`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Calendar className={`w-3.5 h-3.5 ${dayInfo.isToday ? 'text-emerald-700' : 'text-slate-600'}`} />
                          <span className="text-xs font-bold font-sans tracking-wide">
                            {dayInfo.fullDate}
                          </span>
                          {dayInfo.isToday && (
                            <span className="text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-700 text-white shadow-2xs">
                              TODAY
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
                          <span>{dayEvents.length} Releases</span>
                          <span>•</span>
                          <span className="text-rose-800 font-bold">
                            {dayEvents.filter((e) => e.importance === 'HIGH').length} Tier-1
                          </span>
                        </div>
                      </div>

                      {/* Desktop Table Column Header (Forex Factory Standard Alignment) */}
                      <div className="hidden md:flex items-center justify-between px-3.5 py-1.5 bg-[#f1ebe0] border-b border-[#ded5c6] text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider select-none">
                        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                          <div className="min-w-[70px] sm:min-w-[80px]">Time / Status</div>
                          <div className="min-w-[50px]">Cur</div>
                          <div className="min-w-[24px]">Imp</div>
                          <div className="flex-1">Economic Event</div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 justify-end">
                          <div className="flex items-center gap-2 sm:gap-3 text-right font-mono">
                            <div className="min-w-[65px] text-right font-extrabold text-emerald-950">Actual</div>
                            <div className="min-w-[55px] text-right text-slate-700">Forecast</div>
                            <div className="min-w-[55px] text-right text-slate-500">Previous</div>
                          </div>
                          <div className="min-w-[120px] text-right">Confirmation</div>
                        </div>
                      </div>

                      {/* Day Events Calendar Table / List */}
                      <div className="divide-y divide-[#e8e2d8]">
                        {[...dayEvents]
                          .sort((a, b) => {
                            const timeA = a.dateUtc ? new Date(a.dateUtc).getTime() : a.datetime ? new Date(a.datetime).getTime() : a.timestamp;
                            const timeB = b.dateUtc ? new Date(b.dateUtc).getTime() : b.datetime ? new Date(b.datetime).getTime() : b.timestamp;
                            return timeA - timeB;
                          })
                          .map((event) => {
                          const isSelected = selectedEventId === event.id;
                          const isPast = event.timestamp <= now || event.status === 'RELEASED';
                          const isImminent = !isPast && event.timestamp - now > 0 && event.timestamp - now < 30 * 60 * 1000;
                          const countdownStr = formatCountdown(event.timestamp);
                          const isJustReleased = recentlyReleasedId === event.id;

                          // Preserve string zeroes/negative signs accurately without overwriting with '--'
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

                          // Forex Factory Standard Beat / Miss Evaluation
                          const isBeat = hasActual && hasForecast && Number(event.actual) > Number(event.forecast);
                          const isMiss = hasActual && hasForecast && Number(event.actual) < Number(event.forecast);
                          const isInline = hasActual && hasForecast && Number(event.actual) === Number(event.forecast);

                          return (
                            <div
                              key={event.id}
                              onClick={() => onSelectEvent(event)}
                              className={`event-row p-2.5 sm:px-3.5 sm:py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 transition-all cursor-pointer relative ${
                                isJustReleased
                                  ? 'bg-emerald-50 border-l-4 border-l-emerald-600 ring-2 ring-emerald-500/50 shadow-md animate-pulse'
                                  : isSelected
                                  ? 'bg-[#ffffff] ring-1 ring-emerald-600/40 border-l-4 border-l-emerald-700 shadow-2xs'
                                  : isImminent
                                  ? 'bg-[#ffffff] hover:bg-[#ffffff] border-l-4 border-l-amber-500'
                                  : isPast
                                  ? 'bg-[#ffffff] hover:bg-[#f6f2ea] border-l-4 border-l-slate-400'
                                  : 'bg-[#ffffff] hover:bg-[#f6f2ea] border-l-4 border-l-emerald-600'
                              }`}
                            >
                              {/* Left Columns: Time, Flag, Currency, Impact, Title */}
                              <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                                {/* Time & Countdown Block */}
                                <div className="time-block min-w-[70px] sm:min-w-[80px] flex-shrink-0 font-mono">
                                  <span className="time text-xs font-bold text-slate-900 block">
                                    {formatEventTime(event.timestamp, false)}
                                  </span>
                                  <span className="countdown text-[10px] text-slate-500 font-medium block">
                                    {isPast ? (
                                      <span className="text-slate-900 font-extrabold uppercase">Past</span>
                                    ) : isImminent ? (
                                      <span className="text-amber-700 font-bold animate-pulse">{countdownStr}</span>
                                    ) : (
                                      <span>{countdownStr}</span>
                                    )}
                                  </span>
                                </div>

                                {/* Currency & Country Badge */}
                                <div className="currency-badge flex items-center gap-1.5 flex-shrink-0">
                                  <span className="text-base">{event.flag}</span>
                                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#f1ebe0] text-slate-800 border border-[#ded5c6]">
                                    {event.currency}
                                  </span>
                                </div>

                                {/* Impact Folder Icon */}
                                <div className="flex-shrink-0" title={`${event.importance} Impact Catalyst`}>
                                  <ForexFactoryIcon
                                    impact={event.importance === 'MEDIUM' ? 'MEDIUM' : event.importance === 'LOW' ? 'LOW' : 'HIGH'}
                                    className="w-4 h-3.5 drop-shadow-2xs"
                                  />
                                </div>

                                {/* Event Title & Badges */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`event-title text-xs font-bold truncate font-sans ${
                                      isSelected ? 'text-emerald-950 font-extrabold' : 'text-slate-900'
                                    }`}>
                                      {event.title}
                                    </span>
                                    {event.period && (
                                      <span className="text-[10px] font-mono text-slate-500 bg-[#f1ebe0] px-1.5 py-0.2 rounded border border-[#ded5c6]">
                                        {event.period}
                                      </span>
                                    )}
                                    {isPast ? (
                                      <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-slate-900 text-white shadow-2xs">
                                        PAST
                                      </span>
                                    ) : isImminent ? (
                                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-400 animate-pulse">
                                        IMMINENT
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              {/* Right Columns: Forex Factory Standard Column Alignment */}
                              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-[#e8e2d8]">
                                {/* Numbers Grid: Map Col 1 -> Actual, Map Col 2 -> Forecast, Map Col 3 -> Previous */}
                                <div className="flex items-center gap-2 sm:gap-3 text-right font-mono text-xs">
                                  {/* Column 1: Actual (Only displays when populated live, -- until released) */}
                                  <div className={`column-actual actual-val min-w-[65px] text-left sm:text-right ${hasActual ? 'active highlight' : ''}`}>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 block sm:hidden">Actual</span>
                                    <span className={`font-bold px-1.5 py-0.5 rounded border inline-block transition-colors ${
                                      hasActual
                                        ? isBeat
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold shadow-2xs'
                                          : isMiss
                                          ? 'bg-rose-50 text-rose-800 border-rose-400 font-extrabold shadow-2xs'
                                          : 'bg-slate-100 text-slate-900 border-slate-300 font-bold'
                                        : 'bg-[#faf8f4] text-slate-400 border-transparent'
                                    }`}>
                                      {hasActual ? formatActual : '--'}
                                    </span>
                                  </div>

                                  {/* Column 2: Forecast (Real live forecast value) */}
                                  <div className="column-forecast forecast-val min-w-[55px] text-left sm:text-right">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 block sm:hidden">Forecast</span>
                                    <span className="text-slate-800 font-semibold">
                                      {hasForecast ? formatForecast : '--'}
                                    </span>
                                  </div>

                                  {/* Column 3: Previous (Real live previous value) */}
                                  <div className="column-previous previous-val min-w-[55px] text-left sm:text-right text-slate-500">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 block sm:hidden">Prev</span>
                                    <span>
                                      {hasPrevious ? formatPrevious : '--'}
                                    </span>
                                  </div>
                                </div>

                                {/* Prediction Confirmation Badge / Select Action */}
                                <div className="min-w-[120px] text-right flex items-center justify-end gap-1.5">
                                  {isPast && hasActual ? (
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                      isBeat 
                                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300' 
                                        : isMiss 
                                        ? 'bg-rose-100 text-rose-950 border-rose-300' 
                                        : 'bg-slate-100 text-slate-800 border-slate-300'
                                    }`}>
                                      {isBeat ? (
                                        <>
                                          <TrendingUp className="w-3 h-3 text-emerald-700" />
                                          <span>Beat ({event.actual! > event.forecast! ? `+${(event.actual! - event.forecast!).toFixed(1)}` : ''})</span>
                                        </>
                                      ) : isMiss ? (
                                        <>
                                          <TrendingDown className="w-3 h-3 text-rose-700" />
                                          <span>Miss ({(event.actual! - event.forecast!).toFixed(1)})</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-slate-700" />
                                          <span>In-Line</span>
                                        </>
                                      )}
                                    </span>
                                  ) : (
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                                      isImminent 
                                        ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                        : 'bg-[#faf8f4] text-slate-600 border-[#ded5c6]'
                                    }`}>
                                      {isImminent ? 'Trade Armed' : 'Scheduled'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* VIEW MODE B: HORIZONTAL CAROUSEL STRIP */
            <div className="relative flex items-center min-w-0">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll releases left"
                className={`hidden md:flex absolute left-0 z-20 w-8 h-9 items-center justify-center rounded-r-md bg-gradient-to-r from-[#ffffff] via-[#ffffff]/95 to-transparent text-slate-700 hover:text-slate-900 transition-all cursor-pointer ${
                  !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-110'
                }`}
              >
                <div className="p-1.5 rounded-full bg-[#ffffff] border border-[#ded5c6] shadow-sm">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </div>
              </button>

              <div 
                ref={scrollContainerRef}
                onScroll={checkScrollState}
                className="flex gap-2.5 sm:gap-3 flex-1 overflow-x-auto scrollbar-none py-1 -mx-3 px-3 sm:mx-0 sm:px-0 scroll-smooth items-center"
              >
                {filteredEvents.length === 0 ? (
                  <div className="flex items-center justify-center gap-3 py-3 px-4 w-full text-center text-xs font-mono text-slate-600 bg-[#faf8f4] rounded-md border border-[#ded5c6]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    <span>No releases match selected filter.</span>
                  </div>
                ) : (
                  filteredEvents.map((event) => {
                    const isSelected = selectedEventId === event.id;
                    const isPast = event.timestamp <= now || event.status === 'RELEASED';
                    const isImminent = !isPast && event.timestamp - now > 0 && event.timestamp - now < 30 * 60 * 1000;
                    const countdownStr = formatCountdown(event.timestamp);
                    const prediction = evaluatePredictionAccuracy(event.actual, event.forecast, event.unit);
                    const isJustReleased = recentlyReleasedId === event.id;

                    return (
                      <div
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        className={`min-w-[280px] sm:min-w-[300px] max-w-[340px] flex-shrink-0 p-2.5 sm:p-3 rounded-lg flex justify-between items-center relative overflow-hidden cursor-pointer transition-all border select-none ${
                          isJustReleased
                            ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/50 shadow-md animate-pulse'
                            : isSelected
                            ? 'border-emerald-700 bg-[#ffffff] ring-1 ring-emerald-600/30 shadow-sm'
                            : isImminent
                            ? 'border-amber-600/60 hover:border-amber-700 bg-[#ffffff]'
                            : isPast
                            ? 'border-[#ded5c6] hover:border-[#cbc1b0] bg-[#faf8f4] hover:bg-[#ffffff]'
                            : 'border-[#e2dcd2] hover:border-[#cbc1b0] bg-[#faf8f4] hover:bg-[#ffffff]'
                        }`}
                      >
                        {/* Accent Bar */}
                        {(isSelected || isImminent || isPast) && (
                          <div
                            className={`absolute top-0 left-0 w-1.5 h-full ${
                              isSelected
                                ? 'bg-emerald-700'
                                : isImminent
                                ? 'bg-amber-600'
                                : 'bg-slate-400'
                            }`}
                          />
                        )}

                        <div className="pl-1.5 pr-2 overflow-hidden flex-1">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-xs">{event.flag}</span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#f1ebe0] text-slate-800 border border-[#ded5c6]">
                              {event.currency}
                            </span>
                            <ForexFactoryIcon
                              impact={event.importance === 'MEDIUM' ? 'MEDIUM' : event.importance === 'LOW' ? 'LOW' : 'HIGH'}
                              className="w-4 h-3.5 flex-shrink-0"
                            />
                            {isPast ? (
                              <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-900 text-white shadow-2xs">
                                PAST
                              </span>
                            ) : isImminent ? (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400 animate-pulse">
                                IMMINENT
                              </span>
                            ) : null}
                            <span
                              className={`text-[11px] font-bold uppercase truncate font-sans ${
                                isSelected ? 'text-emerald-900' : isPast ? 'text-slate-800' : 'text-slate-900'
                              }`}
                            >
                              {event.title}
                            </span>
                          </div>

                          {/* Numbers in Strip Mode: Act, Frc, Prev */}
                          <div className="text-[11px] font-mono text-slate-700 flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold px-1.5 py-0.2 rounded border shadow-2xs ${
                              event.actual !== null && event.actual !== undefined
                                ? event.forecast !== null && event.actual > event.forecast
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-extrabold'
                                  : event.forecast !== null && event.actual < event.forecast
                                  ? 'bg-rose-50 text-rose-900 border-rose-300 font-extrabold'
                                  : 'bg-white text-slate-950 border-[#ded5c6]'
                                : 'bg-[#faf8f4] text-slate-400 border-[#ded5c6]'
                            }`}>
                              Act: {event.actual !== null && event.actual !== undefined
                                ? `${event.actual > 0 && event.unit === '%' ? '+' : ''}${event.actual}${event.unit || ''}`
                                : '--'}
                            </span>
                            <span className="text-slate-600 text-[10px]">
                              Frc: <span className="text-slate-900 font-semibold">{event.forecast !== null && event.forecast !== undefined ? `${event.forecast > 0 && event.unit === '%' ? '+' : ''}${event.forecast}${event.unit || ''}` : '--'}</span>
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              Prev: <span>{event.previous !== null && event.previous !== undefined ? `${event.previous > 0 && event.unit === '%' ? '+' : ''}${event.previous}${event.unit || ''}` : '--'}</span>
                            </span>
                          </div>

                          {isPast && event.actual !== null && event.forecast !== null && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                event.actual > event.forecast
                                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                  : event.actual < event.forecast
                                  ? 'bg-rose-100 text-rose-950 border-rose-300'
                                  : 'bg-slate-100 text-slate-800 border-slate-300'
                              }`}>
                                {event.actual > event.forecast ? (
                                  <>
                                    <TrendingUp className="w-2.5 h-2.5 text-emerald-700" />
                                    <span>Beat (+{(event.actual - event.forecast).toFixed(1)})</span>
                                  </>
                                ) : event.actual < event.forecast ? (
                                  <>
                                    <TrendingDown className="w-2.5 h-2.5 text-rose-700" />
                                    <span>Miss ({(event.actual - event.forecast).toFixed(1)})</span>
                                  </>
                                ) : (
                                  <span>In-Line</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right flex-none pl-2 border-l border-[#e2dcd2] ml-1 flex flex-col items-end justify-center min-w-[75px]">
                          <div className="text-[10px] font-mono text-cyan-800 font-semibold mb-0.5 whitespace-nowrap">
                            {formatEventTime(event.timestamp, true)}
                          </div>
                          <div
                            className={`text-xs font-mono font-bold ${
                              isPast
                                ? 'text-slate-800'
                                : isImminent
                                ? 'text-amber-800 animate-pulse'
                                : 'text-slate-900'
                            }`}
                          >
                            {isPast ? 'PAST' : countdownStr}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll releases right"
                className={`hidden md:flex absolute right-0 z-20 w-8 h-9 items-center justify-center rounded-l-md bg-gradient-to-l from-[#ffffff] via-[#ffffff]/95 to-transparent text-slate-700 hover:text-slate-900 transition-all cursor-pointer ${
                  !canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-110'
                }`}
              >
                <div className="p-1.5 rounded-full bg-[#ffffff] border border-[#ded5c6] shadow-sm">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
