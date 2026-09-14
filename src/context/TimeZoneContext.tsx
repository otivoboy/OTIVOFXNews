import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserGeoTimeInfo, 
  getDetectedUserTimeZone, 
  getGmtOffsetString, 
  extractCityFromTimeZone,
  isDaylightSavingTime,
  formatLiveClock,
  formatEventReleaseTime
} from '../utils/timeZone';

interface TimeZoneContextType {
  geoTimeInfo: UserGeoTimeInfo;
  activeTimeZone: string;
  is12Hour: boolean;
  isAuto: boolean;
  liveClock: string;
  setTimeZone: (tz: string) => void;
  toggleTimeFormat: () => void;
  resetToAuto: () => void;
  formatEventTime: (timestamp: number, includeDate?: boolean) => string;
}

const TimeZoneContext = createContext<TimeZoneContextType | undefined>(undefined);

export const TimeZoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with automatically detected browser / IP timezone
  const [geoTimeInfo, setGeoTimeInfo] = useState<UserGeoTimeInfo>(() => getDetectedUserTimeZone());
  const [activeTimeZone, setActiveTimeZoneState] = useState<string>(() => {
    const saved = localStorage.getItem('otivo_fx_timezone');
    if (saved && saved !== 'AUTO') return saved;
    return getDetectedUserTimeZone().timeZone;
  });
  const [isAuto, setIsAuto] = useState<boolean>(() => {
    const saved = localStorage.getItem('otivo_fx_timezone');
    return !saved || saved === 'AUTO';
  });
  const [is12Hour, setIs12Hour] = useState<boolean>(() => {
    const saved = localStorage.getItem('otivo_fx_timeformat');
    if (saved) return saved === '12h';
    return getDetectedUserTimeZone().is12Hour;
  });
  const [liveClock, setLiveClock] = useState<string>('');

  // Background fetch to enrich with server IP location
  useEffect(() => {
    fetch('/api/geo-info')
      .then((res) => res.json())
      .then((data) => {
        setGeoTimeInfo((prev) => ({
          ...prev,
          ipAddress: data.ip,
          countryName: data.country || prev.countryName,
          cityName: data.city || prev.cityName,
        }));
      })
      .catch(() => {
        // Silently keep browser native detection
      });
  }, []);

  // Update live clock every second
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveClock(formatLiveClock(now, activeTimeZone, is12Hour, true));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeTimeZone, is12Hour]);

  const setTimeZone = useCallback((tz: string) => {
    if (tz === 'AUTO') {
      const detected = getDetectedUserTimeZone();
      setActiveTimeZoneState(detected.timeZone);
      setIsAuto(true);
      localStorage.setItem('otivo_fx_timezone', 'AUTO');
      setGeoTimeInfo(detected);
    } else {
      setActiveTimeZoneState(tz);
      setIsAuto(false);
      localStorage.setItem('otivo_fx_timezone', tz);
      setGeoTimeInfo((prev) => ({
        ...prev,
        timeZone: tz,
        gmtOffset: getGmtOffsetString(tz),
        cityName: extractCityFromTimeZone(tz),
        isAuto: false,
        dstActive: isDaylightSavingTime(tz),
      }));
    }
  }, []);

  const resetToAuto = useCallback(() => {
    const detected = getDetectedUserTimeZone();
    setActiveTimeZoneState(detected.timeZone);
    setIsAuto(true);
    localStorage.setItem('otivo_fx_timezone', 'AUTO');
    setGeoTimeInfo(detected);
  }, []);

  const toggleTimeFormat = useCallback(() => {
    setIs12Hour((prev) => {
      const next = !prev;
      localStorage.setItem('otivo_fx_timeformat', next ? '12h' : '24h');
      return next;
    });
  }, []);

  const formatEventTime = useCallback(
    (timestamp: number, includeDate: boolean = false) => {
      return formatEventReleaseTime(timestamp, activeTimeZone, is12Hour, includeDate);
    },
    [activeTimeZone, is12Hour]
  );

  return (
    <TimeZoneContext.Provider
      value={{
        geoTimeInfo,
        activeTimeZone,
        is12Hour,
        isAuto,
        liveClock,
        setTimeZone,
        toggleTimeFormat,
        resetToAuto,
        formatEventTime,
      }}
    >
      {children}
    </TimeZoneContext.Provider>
  );
};

export function useUserTimeZone() {
  const context = useContext(TimeZoneContext);
  if (!context) {
    throw new Error('useUserTimeZone must be used within a TimeZoneProvider');
  }
  return context;
}
