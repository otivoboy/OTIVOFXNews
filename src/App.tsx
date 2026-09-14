import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  PriceTickerBar 
} from './components/PriceTickerBar';
import { 
  EventStrip 
} from './components/EventStrip';
import { 
  EventDetails 
} from './components/EventDetails';
import { 
  ImpactMatrix 
} from './components/ImpactMatrix';
import { 
  MacroPillarsConfirmationLab 
} from './components/MacroPillarsConfirmationLab';
import { 
  EconometricExpectationCard 
} from './components/EconometricExpectationCard';
import { 
  ConfirmationChecklistCard 
} from './components/ConfirmationChecklistCard';
import { 
  AiSynthesisCard 
} from './components/AiSynthesisCard';
import { 
  MarketIntelSection 
} from './components/MarketIntelSection';
import { 
  MarketSentimentSection 
} from './components/MarketSentimentSection';
import {
  ForexTechnicalAnalysisSection
} from './components/ForexTechnicalAnalysisSection';
import {
  MacroKnowledgePlaybookSection
} from './components/MacroKnowledgePlaybookSection';
import { 
  LogConsole 
} from './components/LogConsole';
import { 
  HistoricSimulatorModal 
} from './components/HistoricSimulatorModal';
import { 
  SettingsModal 
} from './components/SettingsModal';
import { 
  UserProfileModal 
} from './components/UserProfileModal';
import { 
  AuthPortal 
} from './components/AuthPortal';
import {
  AiAssistantDrawer
} from './components/AiAssistantDrawer';
import {
  Preloader
} from './components/Preloader';
import { ExternalLink, Tv, ArrowRight, LineChart } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { 
  EconomicEvent, 
  AssetQuote, 
  EngineEvaluationResult, 
  AuditLogEntry, 
  ApiConfig, 
  HistoricScenario,
  NavigationPage
} from './types';
import { MacroEvaluator } from './engines/Evaluator';
import { soundManager } from './utils/audio';
import { derivLiveFeed } from './services/derivWs';
import { 
  generateClientMacroCalendar, 
  CLIENT_FALLBACK_QUOTES 
} from './services/macroCalendarService';
import { executeAiSynthesis } from './services/aiSynthesisService';

const DEFAULT_CONFIG: ApiConfig = {
  finnhubKey: '',
  twelveDataKey: '',
  geminiKey: '',
  autoPollImminent: true,
  soundAlerts: true,
  pollingIntervalSeconds: 15,
};

export default function App() {
  const { 
    user, 
    isAuthenticated, 
    isAuthModalOpen, 
    setAuthModalOpen, 
    isProfileModalOpen, 
    setProfileModalOpen,
  } = useAuth();

  // Load configuration
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    try {
      const saved = localStorage.getItem('macro_engine_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CONFIG;
  });

  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EngineEvaluationResult | null>(null);
  const [quotes, setQuotes] = useState<AssetQuote[]>(() => {
    const derivQuotes = derivLiveFeed.getAllQuotes();
    return derivQuotes.length > 0 ? derivQuotes : CLIENT_FALLBACK_QUOTES;
  });
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string | undefined>(undefined);
  const [activePage, setActivePage] = useState<NavigationPage>('macro');

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isDerivConnected, setIsDerivConnected] = useState<boolean>(false);
  const [activeProvider, setActiveProvider] = useState<string>('engine_live');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isHistoricModalOpen, setIsHistoricModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isCalendarRefreshing, setIsCalendarRefreshing] = useState<boolean>(false);
  const [showPreloader, setShowPreloader] = useState<boolean>(true);
  const [isPreloaderMounted, setIsPreloaderMounted] = useState<boolean>(true);

  // Smooth Preloader Initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      const staticLoader = document.getElementById('preloader-root');
      if (staticLoader) {
        staticLoader.classList.add('fade-out');
        setTimeout(() => {
          staticLoader.remove();
          setShowPreloader(false);
          setIsPreloaderMounted(false);
        }, 650);
      } else {
        setShowPreloader(false);
        setIsPreloaderMounted(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const [recentlyReleasedId, setRecentlyReleasedId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const selectedEventRef = useRef<EconomicEvent | null>(null);

  // Keep selectedEventRef in sync
  useEffect(() => {
    selectedEventRef.current = selectedEvent;
  }, [selectedEvent]);

  // Helper to add audit logs
  const addLog = useCallback(
    (
      level: AuditLogEntry['level'],
      category: AuditLogEntry['category'],
      message: string,
      details?: any
    ) => {
      const entry: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: Date.now(),
        level,
        category,
        message,
        details,
      };
      setLogs((prev) => [...prev.slice(-150), entry]);
    },
    []
  );

  // Run evaluation on an event (playAudio only when user intentionally triggers action)
  const runEvaluation = useCallback(
    (
      event: EconomicEvent,
      customMetrics?: Record<string, any>,
      isHistoricReplay: boolean = false,
      playAudio: boolean = false
    ) => {
      const result = MacroEvaluator.evaluate(event, customMetrics);
      result.isSimulation = isHistoricReplay;
      setEvaluationResult(result);

      const isBull = result.verdict === 'DISINFLATION_CONFIRMED' || result.verdict === 'GOLDILOCKS_CONTINUATION' || result.verdict === 'DOVISH_SURPRISE';
      // Suppress sound on opening and automatic polling; only play on explicit user action
      if (apiConfig.soundAlerts && playAudio) {
        soundManager.playSignalChime(isBull);
      }

      addLog(
        'SIGNAL',
        'EVALUATION',
        `Evaluated ${event.title} -> Verdict: [${result.verdictLabel}] (Confidence ${result.confidenceScore}%)`,
        result
      );
    },
    [addLog, apiConfig.soundAlerts]
  );

  // Fetch initial economic calendar (only called on mount, on explicit sync, or when an event finishes)
  const fetchCalendar = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setIsCalendarRefreshing(true);
      addLog('INFO', 'CALENDAR', forceRefresh ? 'Refreshing real Forex Factory calendar events...' : 'Querying macro calendar schedule...');
      let url = apiConfig.finnhubKey
        ? `/api/calendar?finnhubKey=${apiConfig.finnhubKey}`
        : '/api/calendar';
      if (forceRefresh) {
        url += (url.includes('?') ? '&' : '?') + 'refresh=true';
      }
      
      let calEvents: EconomicEvent[] = [];
      let prov = 'engine_live';

      try {
        const res = await fetch(url);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data.events) && data.events.length > 0) {
            calEvents = data.events;
            prov = data.provider || 'engine_live';
          }
        }
      } catch {
        // Fallback below
      }

      // If backend API is not available (e.g. static CDN, Netlify deploy, offline), use dynamic master Forex Factory calendar
      if (calEvents.length === 0) {
        calEvents = generateClientMacroCalendar();
        prov = 'Forex Factory Live Calendar';
      }

      setEvents(calEvents);
      setActiveProvider(prov);
      addLog(
        'SUCCESS',
        'CALENDAR',
        `Loaded ${calEvents.length} macro economic releases from ${prov === 'gemini_forex_factory_search' ? 'Forex Factory (Gemini Grounded)' : prov}`
      );

      // Select the soonest upcoming high-impact event or preserve current selection
      if (calEvents.length > 0) {
        const nowTs = Date.now();
        const upcomingList = calEvents.filter((e) => e.timestamp > nowTs).sort((a, b) => a.timestamp - b.timestamp);
        const defaultEvt =
          upcomingList.find((e) => e.status === 'IMMINENT') ||
          upcomingList.find((e) => e.importance === 'HIGH') ||
          upcomingList[0] ||
          calEvents[0];

        const currentSelected = selectedEventRef.current;
        if (!currentSelected) {
          setSelectedEvent(defaultEvt);
          selectedEventRef.current = defaultEvt;
          runEvaluation(defaultEvt, undefined, false, false);
        } else {
          const updated = calEvents.find((e) => e.id === currentSelected.id);
          if (updated) {
            setSelectedEvent(updated);
            selectedEventRef.current = updated;
          } else {
            setSelectedEvent(defaultEvt);
            selectedEventRef.current = defaultEvt;
            runEvaluation(defaultEvt, undefined, false, false);
          }
        }
      }
    } catch (err) {
      addLog('WARN', 'CALENDAR', 'Failed to retrieve calendar; utilizing local live scheduler.');
    } finally {
      setIsCalendarRefreshing(false);
    }
  }, [apiConfig.finnhubKey, addLog, runEvaluation]);

  // Fetch supplemental prices without clobbering live Deriv websocket feed
  const fetchPrices = useCallback(async () => {
    try {
      const url = apiConfig.twelveDataKey
        ? `/api/prices?twelveDataKey=${apiConfig.twelveDataKey}`
        : '/api/prices';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.quotes) && data.quotes.length > 0) {
          setQuotes((prevQuotes) => {
            const map = new Map<string, AssetQuote>();
            // Add server quotes first
            data.quotes.forEach((q: AssetQuote) => map.set(q.symbol, q));
            // Let active live streaming quotes take precedence
            prevQuotes.forEach((q: AssetQuote) => map.set(q.symbol, q));
            return Array.from(map.values());
          });
        }
      }
    } catch (err) {
      // Ignore
    }
  }, [apiConfig.twelveDataKey]);

  // Establish Deriv Public WebSocket connection for Market Pulse & Currency Pairs
  useEffect(() => {
    addLog('INFO', 'DERIV', 'Connecting to Deriv public WebSocket (wss://api.derivws.com/trading/v1/options/ws/public)...');
    
    const unsubscribeQuotes = derivLiveFeed.subscribe((updatedQuotes) => {
      setQuotes((prevQuotes) => {
        const map = new Map<string, AssetQuote>();
        // Keep non-Deriv supplemental assets (SPX, NDX, etc.)
        prevQuotes.forEach((q) => map.set(q.symbol, q));
        // Overwrite with live Deriv ticks
        updatedQuotes.forEach((q) => map.set(q.symbol, q));
        return Array.from(map.values());
      });
    });

    const unsubscribeStatus = derivLiveFeed.subscribeStatus((status) => {
      setIsDerivConnected(status === 'connected');
      if (status === 'connected') {
        addLog('SUCCESS', 'DERIV', 'Subscribed to 13 Deriv real-time FX & commodity tick streams (frxEURUSD, frxGBPUSD, frxXAUUSD, etc.)');
      } else if (status === 'error') {
        addLog('WARN', 'DERIV', 'Deriv stream encountered an issue, auto-reconnecting...');
      }
    });

    return () => {
      unsubscribeQuotes();
      unsubscribeStatus();
    };
  }, [addLog]);

  // Establish local backend WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const connectWs = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          addLog('INFO', 'SYSTEM', 'Macro Signal Engine connection active');
        };

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);

            // Initial State Handshake
            if (msg.type === 'INITIAL_STATE' && Array.isArray(msg.calendar) && msg.calendar.length > 0) {
              setEvents(msg.calendar);
            }

            // Real-Time Calendar Pipeline Update
            if (msg.type === 'CALENDAR_UPDATE' && Array.isArray(msg.events)) {
              setEvents(msg.events);
              if (selectedEventRef.current) {
                const cur = selectedEventRef.current;
                const updated = msg.events.find((e: EconomicEvent) => e.id === cur.id);
                if (updated && (updated.actual !== cur.actual || updated.status !== cur.status)) {
                  setSelectedEvent(updated);
                  selectedEventRef.current = updated;
                  runEvaluation(updated, undefined, false, false);
                }
              }
            }

            // Instant Live Release Event Trigger
            if (msg.type === 'EVENT_RELEASE' && msg.event) {
              const releasedEvt: EconomicEvent = msg.event;
              setRecentlyReleasedId(releasedEvt.id);
              // Clear release flash after 8 seconds
              setTimeout(() => {
                setRecentlyReleasedId((prev) => (prev === releasedEvt.id ? null : prev));
              }, 8000);

              addLog(
                'SIGNAL',
                'RELEASE',
                `🚨 LIVE RELEASE TRIGGER: ${releasedEvt.title} (${releasedEvt.currency}) Actual: ${releasedEvt.actual}${releasedEvt.unit || ''} vs Frc: ${releasedEvt.forecast}${releasedEvt.unit || ''} [${msg.surprise || 'RELEASED'}]`
              );

              setEvents((prev) =>
                prev.map((e) => (e.id === releasedEvt.id ? releasedEvt : e))
              );

              if (selectedEventRef.current?.id === releasedEvt.id) {
                setSelectedEvent(releasedEvt);
                selectedEventRef.current = releasedEvt;
                runEvaluation(releasedEvt, undefined, false, true);
              }

              if (apiConfig.soundAlerts) {
                const isBull = msg.surprise === 'BEAT' || (releasedEvt.actual !== null && releasedEvt.forecast !== null && releasedEvt.actual > releasedEvt.forecast);
                soundManager.playSignalChime(isBull);
              }
            }

            // If backend sends specific event status or engine evaluations
            if (msg.type === 'EVENT_TRIGGERED' && msg.event) {
              setEvents((prev) =>
                prev.map((e) => (e.id === msg.event.id ? msg.event : e))
              );
            }
          } catch {}
        };

        ws.onclose = () => {
          setIsConnected(false);
          setTimeout(connectWs, 4000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch {
        setIsConnected(false);
      }
    };

    connectWs();

    return () => {
      wsRef.current?.close();
    };
  }, [addLog, apiConfig.soundAlerts, runEvaluation]);

  // Initial data load
  useEffect(() => {
    fetchCalendar();
    fetchPrices();

    const priceTimer = setInterval(fetchPrices, 15000);
    return () => clearInterval(priceTimer);
  }, [fetchCalendar, fetchPrices]);

  // Handle selecting an event from the strip
  const handleSelectEvent = (event: EconomicEvent) => {
    setSelectedEvent(event);
    runEvaluation(event, undefined, false, true);
    addLog('INFO', 'CALENDAR', `Selected event for analysis: ${event.title}`);
  };

  // Handle custom parameter changes from What-If sandbox
  const handleUpdateParams = (newMetrics: Record<string, any>) => {
    if (!selectedEvent) return;
    const updatedEvt = {
      ...selectedEvent,
      metrics: newMetrics,
      actual: newMetrics.headlineYoYActual ?? newMetrics.headlineActual ?? newMetrics.policyRateActual ?? newMetrics.actual ?? selectedEvent.actual,
    };
    runEvaluation(updatedEvt, newMetrics, isSimulating, true);
    addLog('INFO', 'EVALUATION', 'Recalculated engine evaluation with custom sandbox parameters');
  };

  // Handle Checklist Scenario Simulation (Hawkish Beat / Dovish Miss / In-Line)
  const handleChecklistScenarioSimulation = (skew: 'HAWKISH' | 'DOVISH' | 'IN_LINE') => {
    if (!selectedEvent) return;
    const forecast = selectedEvent.forecast ?? 0.3;
    let simulatedActual = forecast;
    if (skew === 'HAWKISH') {
      simulatedActual = Number((forecast + 0.3).toFixed(2));
    } else if (skew === 'DOVISH') {
      simulatedActual = Number((forecast - 0.3).toFixed(2));
    }
    const updatedEvt: EconomicEvent = {
      ...selectedEvent,
      status: 'SIMULATED',
      actual: simulatedActual,
    };
    runEvaluation(updatedEvt, { actual: simulatedActual }, true, true);
    addLog('INFO', 'EVALUATION', `Triggered decision checklist scenario simulation: [${skew}] (Actual ${simulatedActual} vs Exp ${forecast})`);
  };

  // Auto-Progression Engine: Maintains event status transitions without clobbering user selection
  useEffect(() => {
    if (isSimulating) return;

    // Check periodically if any event status transitioned from UPCOMING -> RELEASED in the master list
    const interval = setInterval(() => {
      const now = Date.now();
      setEvents((prevEvents) => {
        let changed = false;
        const updated = prevEvents.map((evt) => {
          if (evt.status !== 'RELEASED' && evt.timestamp <= now && evt.actual !== null && evt.actual !== undefined) {
            changed = true;
            return { ...evt, status: 'RELEASED' as const };
          }
          return evt;
        });
        return changed ? updated : prevEvents;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Request AI Synthesis using Gemini & Institutional Reasoning Engine
  const handleRequestAiSynthesis = async () => {
    if (!evaluationResult || !selectedEvent) return;

    setIsAiLoading(true);
    addLog('AI', 'EVALUATION', 'Initiating Gemini AI deep macro synthesis & playbook generation...');

    try {
      const { synthesis, source } = await executeAiSynthesis(
        selectedEvent,
        evaluationResult,
        apiConfig.geminiKey
      );

      if (synthesis) {
        setEvaluationResult((prev) => (prev ? { ...prev, aiSynthesis: synthesis } : null));
        addLog(
          'SUCCESS',
          'AI',
          `Gemini AI synthesis generated successfully (${source}) with institutional playbook.`
        );

        // Smoothly slide down to the newly loaded AI synthesis section
        setTimeout(() => {
          const aiElem = document.getElementById('ai-deep-synthesis-section');
          if (aiElem) {
            aiElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      } else {
        addLog('WARN', 'AI', 'AI synthesis response returned empty data.');
      }
    } catch (err: any) {
      addLog('WARN', 'AI', `Gemini synthesis encountered error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Load a historic scenario
  const handleSelectScenario = (scenario: HistoricScenario) => {
    setIsSimulating(true);
    const mockEvent: EconomicEvent = {
      id: scenario.id,
      code: scenario.eventCode,
      title: scenario.eventTitle,
      country: scenario.country,
      currency: 'USD',
      flag: scenario.country === 'Japan' ? '🇯🇵' : '🇺🇸',
      datetime: scenario.date,
      timestamp: new Date(scenario.date).getTime(),
      period: 'Historical',
      importance: 'HIGH',
      status: 'SIMULATED',
      actual: scenario.eventData.actual,
      forecast: scenario.eventData.forecast,
      previous: scenario.eventData.previous,
      unit: scenario.eventData.unit,
      metrics: scenario.eventData.metrics,
      description: scenario.contextSummary,
    };

    setSelectedEvent(mockEvent);
    runEvaluation(mockEvent, scenario.eventData.metrics, true);
    addLog(
      'SIGNAL',
      'SIMULATION',
      `Loaded Historic Scenario: [${scenario.name}] -> Evaluated multi-market transmission.`
    );
  };

  // Reset simulation
  const handleResetSimulation = () => {
    setIsSimulating(false);
    fetchCalendar();
    addLog('INFO', 'SIMULATION', 'Exited historic simulation sandbox; restored live calendar feeds.');
  };

  // Save config
  const handleSaveConfig = (newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    localStorage.setItem('macro_engine_config', JSON.stringify(newConfig));
    addLog('SUCCESS', 'SYSTEM', 'Updated API keys and engine configuration.');
    fetchCalendar();
    fetchPrices();
  };

  return (
    <div className="min-h-screen w-full min-w-full bg-[#f3ede2] text-[#1e293b] flex flex-col selection:bg-emerald-600/20 selection:text-emerald-900">
      {/* 0. 3D Kinetic Isometric Cubes Preloader */}
      {isPreloaderMounted && <Preloader fadeOut={!showPreloader} />}

      {/* 1. Header */}
      <Header
        apiConfig={apiConfig}
        onUpdateConfig={handleSaveConfig}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHistoricModal={() => setIsHistoricModalOpen(true)}
        isConnected={isConnected}
        activeProvider={activeProvider}
        isSimulating={isSimulating}
        onResetSimulation={handleResetSimulation}
        quotes={quotes}
        activePage={activePage}
        onSelectPage={(page) => setActivePage(page)}
      />

      {/* 2. Real-Time Price Ticker Bar (Deriv Public WebSocket Stream) */}
      <PriceTickerBar
        quotes={quotes}
        onSelectAsset={(sym) => setSelectedAssetSymbol(sym)}
        isDerivConnected={isDerivConnected}
      />

      {/* 3. Horizontal Macro Event Strip / Economic Calendar (Hidden on Macro Playbook, Sentiment, and News Feed pages) */}
      {!['playbook', 'sentiment', 'news', 'technical'].includes(activePage) && (
        <EventStrip
          events={events}
          selectedEventId={selectedEvent?.id || null}
          recentlyReleasedId={recentlyReleasedId}
          onSelectEvent={handleSelectEvent}
          activeProvider={activeProvider}
          onRefresh={() => fetchCalendar(true)}
          isRefreshing={isCalendarRefreshing}
        />
      )}

      {/* 4. Main Workspace Layout */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 xl:px-10 py-4 space-y-5">
        {/* PAGE 1: Macro & Calendar Hub */}
        {activePage === 'macro' && (
          <>
            {selectedEvent && evaluationResult ? (
              <>
                {/* ROW 1: Core Event Hub & Multi-Market Impact Matrix (2-Column Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch w-full">
                  {/* Left Column: Event Headline, Forecast & What-If Sandbox */}
                  <div className="lg:col-span-5 w-full">
                    <EventDetails
                      event={selectedEvent}
                      recentlyReleasedId={recentlyReleasedId}
                      evaluationResult={evaluationResult}
                      onUpdateParams={handleUpdateParams}
                      onRequestAiSynthesis={handleRequestAiSynthesis}
                      isAiLoading={isAiLoading}
                    />
                  </div>

                  {/* Right Column: Multi-Market Impact Matrix & Trade Engine */}
                  <div className="lg:col-span-7 w-full">
                    <ImpactMatrix
                      evaluationResult={evaluationResult}
                      selectedAssetSymbol={selectedAssetSymbol}
                      onSelectAsset={(sym) => setSelectedAssetSymbol(sym)}
                      quotes={quotes}
                      event={selectedEvent}
                    />
                  </div>
                </div>

                {/* ROW 2: 5-Pillar Macro Confirmation Architecture & 3-Phase Execution Workflow (Full Width) */}
                {evaluationResult.confirmationPillars && (
                  <div className="w-full">
                    <MacroPillarsConfirmationLab
                      pillars={evaluationResult.confirmationPillars}
                      event={selectedEvent}
                    />
                  </div>
                )}

                {/* ROW 3: Econometric Expectation Model & Event Decision Checklist (Balanced 2-Column Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch w-full">
                  {/* Left Column: Econometric Expectation Engine & Factor Decomposition */}
                  {evaluationResult.mathematicalExpectation && (
                    <div className="lg:col-span-6 w-full">
                      <EconometricExpectationCard
                        mathExp={evaluationResult.mathematicalExpectation}
                        forecastVal={selectedEvent.forecast}
                      />
                    </div>
                  )}

                  {/* Right Column: Event Confirmation Checklist & Rules Matrix */}
                  <div className="lg:col-span-6 w-full">
                    <ConfirmationChecklistCard
                      checklist={evaluationResult.checklist}
                      isUpcoming={
                        selectedEvent.status !== 'RELEASED' &&
                        selectedEvent.actual === null
                      }
                      event={selectedEvent}
                      onSimulateScenario={handleChecklistScenarioSimulation}
                    />
                  </div>
                </div>

                {/* ROW 4: OTIVO AI Deep Synthesis & Tactical Playbook (Full Width) */}
                {evaluationResult.aiSynthesis && (
                  <div className="w-full">
                    <AiSynthesisCard aiSynthesis={evaluationResult.aiSynthesis} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 border border-dashed border-slate-800 rounded-xl bg-[#080d15] text-slate-400">
                <span>Loading macroeconomic calendar streams...</span>
              </div>
            )}
          </>
        )}

        {/* PAGE 2: Central Bank & Macroeconomic Transmission Playbook */}
        {activePage === 'playbook' && (
          <div className="w-full animate-in fade-in duration-200">
            <MacroKnowledgePlaybookSection
              onSelectEventTopic={(code) => {
                const matchedEvent = events.find(e => e.eventType === code || e.title.toUpperCase().includes(code));
                if (matchedEvent) {
                  handleSelectEvent(matchedEvent);
                  setActivePage('macro');
                }
              }}
              onLaunchQuizTopic={(_topicId) => {
                setIsAiAssistantOpen(true);
              }}
            />
          </div>
        )}

        {/* PAGE 3: Technical Analysis Engine (OTIVO TV) */}
        {activePage === 'technical' && (
          <div className="w-full max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-200">
            <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-2xl p-8 sm:p-12 shadow-sm text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-200 shadow-xs">
                <Tv className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
                OTIVO TV Live Technical Analysis
              </h2>
              <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
                The institutional technical analysis engine, live market charts, and real-time streaming are hosted at{' '}
                <span className="font-semibold text-emerald-700">otivotv.netlify.app</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://otivotv.netlify.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition shadow-sm hover:shadow"
                >
                  <span>Open otivotv.netlify.app</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setActivePage('macro')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#f6f2ea] hover:bg-[#ede6d9] text-slate-700 font-semibold text-sm rounded-xl border border-[#e2dcd2] transition"
                >
                  <span>Return to Macro Calendar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: Live Community & Institutional Market Sentiment */}
        {activePage === 'sentiment' && (
          <div className="w-full animate-in fade-in duration-200">
            <MarketSentimentSection
              quotes={quotes}
              selectedAssetSymbol={selectedAssetSymbol}
              isDerivConnected={isDerivConnected}
              onSelectAsset={(sym) => setSelectedAssetSymbol(sym)}
            />
          </div>
        )}

        {/* PAGE 4: Raw Market Data & News Intelligence Feed */}
        {activePage === 'news' && (
          <div className="w-full animate-in fade-in duration-200">
            <MarketIntelSection
              selectedAssetSymbol={selectedAssetSymbol}
              onLogEvent={(message, category, level, details) => addLog(level, category, message, details)}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <HistoricSimulatorModal
        isOpen={isHistoricModalOpen}
        onClose={() => setIsHistoricModalOpen(false)}
        onSelectScenario={handleSelectScenario}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={apiConfig}
        onSaveConfig={handleSaveConfig}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Authentication Portal (Shown if not logged in or explicitly opened) */}
      <AuthPortal
        isOpen={!isAuthenticated || isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        isModalMode={isAuthenticated}
      />

      {/* OTIVO FX Macro AI Assistant Agent & Interactive Quiz Engine (Floating FAB & Drawer) */}
      <AiAssistantDrawer
        selectedEvent={selectedEvent}
        events={events}
        quotes={quotes}
        evaluationResult={evaluationResult}
        userProfile={user}
        geminiKey={apiConfig.geminiKey}
        isOpen={isAiAssistantOpen}
        onToggle={() => setIsAiAssistantOpen((prev) => !prev)}
      />
    </div>
  );
}
