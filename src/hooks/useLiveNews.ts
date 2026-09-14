import { useState, useEffect, useCallback, useRef } from 'react';
import { NormalizedNewsItem } from '../types';

interface UseLiveNewsOptions {
  query?: string;
  category?: string;
  pollIntervalMs?: number;
  enabled?: boolean;
}

export function useLiveNews(options: UseLiveNewsOptions = {}) {
  const { query = 'high impact macro news', category = 'ALL', pollIntervalMs = 25000, enabled = true } = options;
  const [news, setNews] = useState<NormalizedNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);
  const [isLiveStreamConnected, setIsLiveStreamConnected] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchNews = useCallback(
    async (bypassCache = false) => {
      if (!enabled) return;
      try {
        const qParam = encodeURIComponent(query);
        const catParam = encodeURIComponent(category);
        const res = await fetch(`/api/live-news?q=${qParam}&category=${catParam}&refresh=${bypassCache}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data && Array.isArray(data.results)) {
          setNews(data.results);
          setLastFetched(data.fetchedAt || Date.now());
          setError(null);
        }
      } catch (err: any) {
        console.warn('[useLiveNews] Fetch error:', err);
        setError(err?.message || 'Failed to fetch live news');
      } finally {
        setIsLoading(false);
      }
    },
    [query, category, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchNews(false);

    let eventSource: EventSource | null = null;
    try {
      const sseUrl = `/api/live-news/stream?q=${encodeURIComponent(query)}`;
      eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsLiveStreamConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && Array.isArray(payload.results) && payload.results.length > 0) {
            setNews(payload.results);
            setLastFetched(payload.timestamp || Date.now());
            setIsLoading(false);
          }
        } catch {
          // ignore heartbeat / format error
        }
      };

      eventSource.onerror = () => {
        setIsLiveStreamConnected(false);
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch {
      setIsLiveStreamConnected(false);
    }

    // Secondary Polling backup
    const timer = setInterval(() => {
      fetchNews(false);
    }, pollIntervalMs);

    return () => {
      clearInterval(timer);
      if (eventSource) {
        eventSource.close();
      }
      eventSourceRef.current = null;
    };
  }, [query, category, enabled, pollIntervalMs, fetchNews]);

  return {
    news,
    setNews,
    isLoading,
    error,
    lastFetched,
    isLiveStreamConnected,
    refresh: () => fetchNews(true),
  };
}
