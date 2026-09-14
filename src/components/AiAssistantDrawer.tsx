import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  Square,
  Trash2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Paperclip,
  Image as ImageIcon,
  Film,
  FileText,
  Upload,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  FileCode,
  File,
} from 'lucide-react';
import {
  EconomicEvent,
  AssetQuote,
  UserProfile,
  AiChatMessage,
  AiChatAttachment,
  AiAppContextSummary,
  EngineEvaluationResult,
  AiTechnicalSetupSummary,
  AiSentimentSummaryItem,
} from '../types';
import { sendAiAssistantMessage, cleanAssistantText } from '../services/aiAssistantService';
import { FOREX_TECHNICAL_DATA } from './ForexTechnicalAnalysisSection';
import { STATIC_MARKET_PROFILES } from './MarketSentimentSection';

interface AiAssistantDrawerProps {
  selectedEvent: EconomicEvent | null;
  events: EconomicEvent[];
  quotes: AssetQuote[];
  evaluationResult: EngineEvaluationResult | null;
  userProfile?: UserProfile | null;
  geminiKey?: string;
  isOpen: boolean;
  onToggle: () => void;
}

// Stable Editorial Typing Component with Stop Support (ChatGPT Document Flow Style)
const TypingAssistantMessage: React.FC<{
  text: string;
  isStopped: boolean;
  onDone?: () => void;
  onScrollRequest?: () => void;
}> = ({ text, isStopped, onDone, onScrollRequest }) => {
  const cleanedText = React.useMemo(() => cleanAssistantText(text), [text]);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isDone, setIsDone] = useState<boolean>(false);

  const indexRef = useRef<number>(0);
  const onDoneRef = useRef(onDone);
  const onScrollRef = useRef(onScrollRequest);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    onScrollRef.current = onScrollRequest;
  }, [onScrollRequest]);

  // If user clicked Stop, immediately render full text and stop
  useEffect(() => {
    if (isStopped) {
      setDisplayedText(cleanedText);
      setIsDone(true);
      onDoneRef.current?.();
    }
  }, [isStopped, cleanedText]);

  useEffect(() => {
    if (isStopped) return;

    if (indexRef.current >= cleanedText.length && cleanedText.length > 0) {
      setDisplayedText(cleanedText);
      setIsDone(true);
      return;
    }

    const totalChars = cleanedText.length;
    const stepSize = totalChars > 800 ? 8 : totalChars > 400 ? 5 : totalChars > 150 ? 3 : 2;
    const intervalTime = totalChars > 500 ? 10 : 14;

    const timer = setInterval(() => {
      indexRef.current += stepSize;
      if (indexRef.current >= totalChars) {
        setDisplayedText(cleanedText);
        setIsDone(true);
        clearInterval(timer);
        onDoneRef.current?.();
      } else {
        setDisplayedText(cleanedText.slice(0, indexRef.current));
      }
      onScrollRef.current?.();
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [cleanedText, isStopped]);

  return (
    <div className="font-macro-editorial text-[14.5px] sm:text-[15px] text-[#f5efe6] leading-[1.75] tracking-[0.015em] whitespace-pre-wrap select-text antialiased">
      {displayedText}
      {!isDone && !isStopped && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-[#d4976a] animate-pulse align-middle" />
      )}
    </div>
  );
};

// Storage key for continuous conversation memory
const CHAT_STORAGE_KEY = 'otivo_ai_assistant_chat_memory_v2';

// Helper to safely load persisted chat memory
const loadSavedMessages = (): AiChatMessage[] => {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((msg: AiChatMessage) => {
          // If a user message has attachments and text was auto-generated "Analyze this shared..."
          if (
            msg.role === 'user' &&
            msg.attachments &&
            msg.attachments.length > 0 &&
            (msg.text?.startsWith('Analyze this shared ') ||
              msg.text?.startsWith('Analyze these ') ||
              msg.text?.startsWith('Analyze this image') ||
              msg.text?.startsWith('Analyze this file'))
          ) {
            return { ...msg, text: '' };
          }
          return msg;
        });
      }
    }
  } catch (e) {
    console.warn('Failed to load chat history from localStorage', e);
  }
  return [];
};

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  selectedEvent,
  events,
  quotes,
  evaluationResult,
  userProfile,
  geminiKey,
  isOpen,
  onToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Chat State initialized from durable continuous memory
  const [messages, setMessages] = useState<AiChatMessage[]>(() => loadSavedMessages());
  const [inputText, setInputText] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [animatingMsgId, setAnimatingMsgId] = useState<string | null>(null);

  // Multimodal Attachments State
  const [stagedAttachments, setStagedAttachments] = useState<AiChatAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<AiChatAttachment | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derive user's first name
  const userName = userProfile?.name?.trim() ? userProfile.name.split(' ')[0] : 'Trader';

  // Smooth scroll helper
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Save conversation history to continuous memory (localStorage) whenever messages change
  useEffect(() => {
    try {
      if (messages.length === 0) {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        return;
      }
      // Keep up to 60 messages in persistent memory, stripping heavy base64 to preserve quota
      const serialized = messages.slice(-60).map((m) => ({
        ...m,
        attachments: m.attachments?.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          mimeType: a.mimeType,
          size: a.size,
          data: a.type === 'document' ? '' : (a.data && a.data.length > 50000 ? '' : a.data),
          previewUrl: a.previewUrl && a.previewUrl.length > 50000 ? undefined : a.previewUrl,
          extractedText: a.extractedText,
        })),
      }));
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(serialized));
    } catch (e) {
      console.warn('Failed to persist chat memory to localStorage', e);
    }
  }, [messages]);

  // Lock background scroll when drawer is open to prevent page jumps when virtual keyboard opens
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = origOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [isOpen]);

  // Auto-scroll chat when messages change or drawer opens
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isChatLoading, stagedAttachments, scrollToBottom]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to read and process selected files
  const processFiles = async (fileList: FileList | File[]) => {
    setUploadError(null);
    const files = Array.from(fileList);

    if (files.length === 0) return;

    // Limit maximum total staged attachments
    if (stagedAttachments.length + files.length > 5) {
      setUploadError('You can attach a maximum of 5 files at a time.');
      return;
    }

    for (const file of files) {
      // 25MB limit per file
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds the 25MB size limit.`);
        continue;
      }

      let type: 'image' | 'video' | 'document' | 'audio' = 'document';
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      }

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // For plain text, csv, json, md - also extract text content
        let extractedText: string | undefined = undefined;
        if (
          file.type.includes('text') ||
          file.type.includes('json') ||
          file.type.includes('csv') ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.json')
        ) {
          extractedText = await new Promise<string>((resolve) => {
            const textReader = new FileReader();
            textReader.onload = () => resolve(textReader.result as string);
            textReader.onerror = () => resolve('');
            textReader.readAsText(file);
          });
        }

        const newAttachment: AiChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type,
          mimeType: file.type || (type === 'image' ? 'image/png' : type === 'video' ? 'video/mp4' : 'application/octet-stream'),
          size: file.size,
          data: base64Data,
          previewUrl: type === 'image' || type === 'video' ? base64Data : undefined,
          extractedText,
        };

        setStagedAttachments((prev) => [...prev, newAttachment]);
      } catch (err) {
        console.error('Failed to read file:', err);
        setUploadError(`Failed to process file "${file.name}".`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleRemoveStagedAttachment = (id: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Construct Real-time App Context Summary
  const buildAppContext = (): AiAppContextSummary => {
    // Map Technical Setups
    const technicalAnalysisSetups: AiTechnicalSetupSummary[] = FOREX_TECHNICAL_DATA.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      category: t.category,
      basePrice: t.basePrice,
      htfTrend: `${t.structure.htfTimeframe}: ${t.structure.htfTrend}`,
      ltfTrend: `${t.structure.ltfTimeframe}: ${t.structure.ltfTrend}`,
      priceActionPattern: t.structure.priceActionPattern,
      structureVerdict: t.structure.structureVerdict,
      confluenceScore: t.execution.confluenceScore,
      recommendedEntry: t.execution.recommendedEntry,
      stopLoss: t.execution.stopLoss,
      stopLossPips: t.execution.stopLossPips,
      takeProfit1: t.execution.takeProfit1,
      takeProfit1RRR: t.execution.takeProfit1RRR,
      takeProfit2: t.execution.takeProfit2,
      takeProfit2RRR: t.execution.takeProfit2RRR,
      primarySessionTiming: t.execution.primarySessionTiming,
      confluenceFactors: t.execution.confluenceFactors,
      orderBlockZone: t.advancedFrameworks.smcIct.orderBlockZone,
      orderBlockType: t.advancedFrameworks.smcIct.orderBlockType,
      fvgZone: t.advancedFrameworks.smcIct.fvgZone,
      fvgStatus: t.advancedFrameworks.smcIct.fvgStatus,
      liquiditySweep: `${t.advancedFrameworks.smcIct.liquiditySweep.target} (${t.advancedFrameworks.smcIct.liquiditySweep.status} at ${t.advancedFrameworks.smcIct.liquiditySweep.sweepPrice})`,
      fibRetracement: t.coreElements.fibonacci.currentRetracementZone,
      candlestickPattern: `${t.coreElements.candlestickPattern.name} (${t.coreElements.candlestickPattern.timeframe}, ${t.coreElements.candlestickPattern.bias})`,
      rsi14: t.indicators.momentum.rsi14,
      rsiDivergence: t.indicators.momentum.rsiDivergence,
      emaStatus: t.coreElements.dynamicMovingAverages.status,
      cloudStatus: t.indicators.trend.ichimokuCloud.cloudStatus,
      volumePoC: t.indicators.volume.pointOfControlPoC,
      wyckoffPhase: `${t.advancedFrameworks.wyckoff.phase} (${t.advancedFrameworks.wyckoff.schematicItem})`,
    }));

    // Map Market Sentiment Profiles
    const institutionalSentiment: AiSentimentSummaryItem[] = STATIC_MARKET_PROFILES.map((s) => {
      const score = s.baseScore;
      const sentimentLabel = score >= 65 ? 'STRONG_BULLISH' : score >= 55 ? 'MODERATELY_BULLISH' : score <= 35 ? 'STRONG_BEARISH' : score <= 45 ? 'MODERATELY_BEARISH' : 'NEUTRAL';
      return {
        symbol: s.symbol,
        quoteSymbol: s.quoteSymbol,
        name: s.name,
        category: s.category,
        score: s.baseScore,
        sentimentLabel,
        commercialNet: s.baseCommercialNet,
        speculatorNet: s.baseSpeculatorNet,
        putCallRatio: s.basePutCallRatio,
        retailLong: s.baseRetailLong,
        volIndex: s.volIndexName,
        volVal: s.baseVolVal,
        bpi: s.baseBpi,
        dominantNarrative: s.dominantNarrative,
      };
    });

    return {
      selectedEvent: selectedEvent
        ? {
            title: selectedEvent.title,
            country: selectedEvent.country,
            code: selectedEvent.code,
            actual: selectedEvent.actual,
            forecast: selectedEvent.forecast,
            previous: selectedEvent.previous,
            surpriseDelta:
              selectedEvent.actual !== null && selectedEvent.forecast !== null
                ? selectedEvent.actual - selectedEvent.forecast
                : null,
            surprisePercentage:
              selectedEvent.actual !== null &&
              selectedEvent.forecast !== null &&
              selectedEvent.forecast !== 0
                ? ((selectedEvent.actual - selectedEvent.forecast) /
                    Math.abs(selectedEvent.forecast)) *
                  100
                : null,
            verdict: evaluationResult?.verdictLabel,
            confidenceScore: evaluationResult?.confidenceScore,
          }
        : null,
      upcomingEventsCount: events.length,
      upcomingEventsSummary: events.slice(0, 4).map((e) => ({
        title: e.title,
        country: e.country,
        impact: e.impact,
        time: e.time,
      })),
      marketQuotes: quotes.map((q) => ({
        symbol: q.symbol,
        price: q.price,
        changePercent: q.changePercent,
        category: q.category,
      })),
      technicalAnalysisSetups,
      institutionalSentiment,
      macroConfirmationPillars: evaluationResult?.confirmationPillars
        ? {
            overallConfirmationScore: evaluationResult.confirmationPillars.overallConfirmationScore,
            institutionalConsensus: evaluationResult.confirmationPillars.institutionalConsensus,
            pillarsSummary: `P1 Data: ${evaluationResult.confirmationPillars.pillar1Data.compositeDataScore}/100, P2 Market: ${evaluationResult.confirmationPillars.pillar2Market.skewDirection}, P3 Textual: ${evaluationResult.confirmationPillars.pillar3Textual.textualHawkDoveScore}/100, P4 Fiscal: ${evaluationResult.confirmationPillars.pillar4Fiscal.fiscalImpulseDirection}, P5 Intermarket: ${evaluationResult.confirmationPillars.pillar5Intermarket.intermarketConfirmationScore}/100`,
          }
        : undefined,
      assetImpacts: evaluationResult?.assetImpacts?.map((a) => ({
        symbol: a.symbol,
        name: a.name,
        bias: a.bias,
        action: a.actionDirective || a.action,
        tradeEntryZone: a.tradeEntryZone,
        targetPrice: a.targetPrice,
        stopLossPrice: a.stopLossPrice,
        expectedMove: a.expectedMove,
        confidence: a.confidence,
        transmissionRationale: a.transmissionRationale,
      })),
      userRiskSummary: userProfile
        ? {
            accountTier: userProfile.accountTier,
            tradingStyle: userProfile.tradingStyle,
            riskPerTrade: userProfile.riskSettings?.riskPerTradePercent,
            accountBalance: userProfile.riskSettings?.accountBalance,
          }
        : undefined,
    };
  };

  // Clear Conversation
  const handleClearChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setStagedAttachments([]);
    setAnimatingMsgId(null);
    setIsChatLoading(false);
    setInputText('');
    setUploadError(null);
  };

  // Stop Generation / Typing
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsChatLoading(false);
    setAnimatingMsgId(null);
  };

  // Send Chat Message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    const currentAttachments = [...stagedAttachments];

    // Must have either text or attachments
    if ((!textToSend && currentAttachments.length === 0) || isChatLoading) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setStagedAttachments([]);
    setUploadError(null);
    setIsChatLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const appContext = buildAppContext();
      const res = await sendAiAssistantMessage(
        textToSend,
        [...messages, userMsg],
        appContext,
        geminiKey,
        currentAttachments
      );

      const cleanedReply = cleanAssistantText(res.reply);
      const newMsgId = `assistant-${Date.now()}`;

      const assistantMsg: AiChatMessage = {
        id: newMsgId,
        role: 'assistant',
        text: cleanedReply,
        timestamp: Date.now(),
      };

      setAnimatingMsgId(newMsgId);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const errorMsg: AiChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ MACRO ASSISTANT NOTE: ${
          err?.message || 'Failed to generate response. Please verify connection and try again.'
        }`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Copy Message to Clipboard
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(cleanAssistantText(text));
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const isGeneratingOrTyping = isChatLoading || animatingMsgId !== null;

  // Render attachment icon based on type
  const renderAttachmentIcon = (att: AiChatAttachment, sizeClass = "w-4 h-4") => {
    if (att.type === 'image') return <ImageIcon className={`${sizeClass} text-amber-400`} />;
    if (att.type === 'video') return <Film className={`${sizeClass} text-emerald-400`} />;
    if (att.name.endsWith('.csv') || att.name.endsWith('.xlsx')) return <FileSpreadsheet className={`${sizeClass} text-emerald-400`} />;
    if (att.name.endsWith('.json') || att.name.endsWith('.md')) return <FileCode className={`${sizeClass} text-blue-400`} />;
    if (att.name.endsWith('.pdf')) return <FileText className={`${sizeClass} text-rose-400`} />;
    return <File className={`${sizeClass} text-stone-300`} />;
  };

  return (
    <>
      {/* ======================================================== */}
      {/* FLOATING ACTION BUTTON (Brown Theme with ai.png) */}
      {/* ======================================================== */}
      <div className="fixed bottom-5 right-5 z-40 select-none">
        <div className="relative group">
          <button
            onClick={onToggle}
            className={`relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border ${
              isOpen
                ? 'bg-[#180f0a] border-[#c88a4b] shadow-[0_0_25px_rgba(200,138,75,0.55)] scale-105'
                : 'bg-[#140d09]/95 hover:bg-[#1f130c] border-[#b37446]/40 hover:border-[#c88a4b] shadow-[0_6px_28px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(200,138,75,0.4)] hover:scale-105'
            }`}
            title="OTIVO AI Assistant"
            aria-label="Open OTIVO AI Assistant"
          >
            {/* Animated Ambient Pulse Background (Brown/Bronze) */}
            <span className="absolute inset-0 bg-gradient-to-tr from-[#b37446]/20 via-transparent to-[#7c3f1a]/20 animate-pulse" />

            {/* ai.png Icon with fallback */}
            <img
              src="/ai.png"
              alt="OTIVO AI"
              className="relative w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_0_8px_rgba(200,138,75,0.5)] transition-transform duration-300 group-hover:scale-110"
              loading="eager"
            />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* AI ASSISTANT CHAT DRAWER / FULLSCREEN MOBILE MODAL */}
      {/* ======================================================== */}
      {isOpen && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`fixed z-50 flex flex-col bg-[#0b0705] sm:bg-[#0d0907]/98 sm:backdrop-blur-2xl border-0 sm:border sm:border-[#b37446]/25 shadow-[0_20px_70px_rgba(0,0,0,0.95)] overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'fixed inset-0 sm:inset-6 sm:rounded-2xl'
              : 'fixed inset-0 sm:inset-auto sm:bottom-22 sm:right-6 sm:w-[480px] md:w-[520px] sm:h-[640px] sm:max-h-[82vh] rounded-none sm:rounded-2xl'
          }`}
          style={{
            boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(179, 116, 70, 0.15)',
          }}
        >
          {/* Hidden File Input for Document, Image, Video uploads */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf,.doc,.docx,.txt,.csv,.json,.md,.xlsx,.xls,audio/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Drag & Drop Visual Overlay */}
          {isDraggingOver && (
            <div className="absolute inset-0 z-50 bg-[#160e0a]/95 backdrop-blur-md border-2 border-dashed border-[#d4976a] rounded-none sm:rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn pointer-events-none">
              <div className="w-16 h-16 rounded-2xl bg-[#b37446]/20 border border-[#d4976a]/50 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(212,151,106,0.3)]">
                <Upload className="w-8 h-8 text-[#d4976a] animate-bounce" />
              </div>
              <h4 className="text-base font-bold text-white font-sans">
                Drop Chart, Document or Video
              </h4>
              <p className="text-xs text-stone-300 mt-1 max-w-xs">
                Instant institutional AI technical analysis, FVG/OB detection, and macro breakdown.
              </p>
            </div>
          )}

          {/* Top Header - Firmly pinned at top */}
          <div className="p-3 sm:p-3.5 px-4 bg-[#140d09] border-b border-[#b37446]/25 flex items-center justify-between shrink-0 select-none z-20">
            <div className="flex items-center gap-2.5">
              <div className="relative p-1 rounded-xl bg-[#b37446]/20 border border-[#b37446]/40 flex items-center justify-center shrink-0 w-8 h-8">
                <img
                  src="/ai.png"
                  alt="AI"
                  className="w-5 h-5 object-contain"
                  loading="eager"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-white text-xs tracking-wider uppercase font-sans">
                    OTIVO<span className="text-[#d4976a]">AI</span> Intelligence
                  </h3>
                </div>
                <div className="text-[10px] text-stone-400">
                  Real-Time Charts, Documents & Video Analysis
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* New Chat / Clear Memory Button */}
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="px-2 py-1 rounded-lg bg-[#b37446]/10 hover:bg-[#b37446]/25 border border-[#b37446]/30 text-stone-300 hover:text-white text-[10px] font-medium flex items-center gap-1 transition cursor-pointer"
                  title="Start a new conversation and reset memory"
                >
                  <Trash2 className="w-3 h-3 text-[#d4976a]" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer hidden sm:flex items-center justify-center"
                title={isExpanded ? 'Collapse' : 'Expand full screen'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-rose-300 transition cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Selected Event Sub-header Banner */}
          {selectedEvent && (
            <div className="px-3.5 py-1.5 bg-[#1b110b] border-b border-[#b37446]/20 flex items-center justify-between text-[11px] text-stone-300 shrink-0 z-20">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-[#d4976a] truncate">{selectedEvent.title}</span>
                <span className="text-stone-400 truncate">({selectedEvent.country})</span>
                {selectedEvent.actual !== null && (
                  <span className="px-1.5 py-0.2 rounded bg-[#b37446]/25 text-[#e6b18a] font-mono text-[10px] shrink-0">
                    Act: {selectedEvent.actual}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages Stream (ChatGPT Full-Page Flow, No Cards) */}
          <div className="flex-1 min-h-0 px-3 sm:px-5 py-4 space-y-5 overflow-y-auto overscroll-contain custom-scrollbar bg-[#080503]">
            {messages.length === 0 && !isChatLoading && (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-4 select-none">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                    Hi {userName}, <span className="text-[#d4976a]">what's the move?</span>
                  </h2>
                  <p className="text-xs text-stone-400 mt-1 max-w-sm">
                    Upload charts, PDF reports, or trade recordings for instant institutional AI breakdown.
                  </p>
                </div>

                {/* Quick Action Suggestion Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md text-left">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-[#b37446]/20 to-[#7c3f1a]/20 hover:from-[#b37446]/30 hover:to-[#7c3f1a]/30 border border-[#b37446]/40 text-stone-100 text-xs transition flex items-center gap-2.5 group cursor-pointer text-left shadow-sm"
                  >
                    <span className="p-1.5 rounded-lg bg-[#b37446]/30 text-amber-300 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="font-semibold block text-amber-200">
                        Upload Chart or Document
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Images, PDFs, Videos, CSVs
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage('Scan all markets and give me entries and execution levels for the best high-confluence setup right now.')}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-[#b37446]/25 hover:border-[#d4976a]/60 text-stone-200 text-xs transition flex items-center gap-2 group cursor-pointer text-left"
                  >
                    <span className="text-base shrink-0">🎯</span>
                    <span className="leading-snug group-hover:text-amber-200">
                      Best Market Entries & Confluence
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Give me a full technical analysis, SMC order blocks, and trade entry zones for EUR/USD.')}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-[#b37446]/25 hover:border-[#d4976a]/60 text-stone-200 text-xs transition flex items-center gap-2 group cursor-pointer text-left"
                  >
                    <span className="text-base shrink-0">📊</span>
                    <span className="leading-snug group-hover:text-amber-200">
                      EUR/USD Full SMC & Entry Analysis
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Analyze Gold (XAU/USD) with institutional COT sentiment and key execution levels.')}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-[#b37446]/25 hover:border-[#d4976a]/60 text-stone-200 text-xs transition flex items-center gap-2 group cursor-pointer text-left"
                  >
                    <span className="text-base shrink-0">⚡</span>
                    <span className="leading-snug group-hover:text-amber-200">
                      Gold (XAU/USD) Sentiment & Levels
                    </span>
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isCurrentAnimating = animatingMsgId === msg.id && !isUser;

              return (
                <div key={msg.id} className="w-full flex flex-col group">
                  {isUser ? (
                    // User Query (Neat right-aligned pill bubble with attachment badges)
                    <div className="flex flex-col items-end mb-1 space-y-2">
                      {/* Render Attached Files if Present */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-end max-w-[85%] sm:max-w-[80%]">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="relative group/att rounded-xl overflow-hidden border border-[#b37446]/40 bg-[#19100a] text-stone-200 shadow-md"
                            >
                              {att.type === 'image' && att.previewUrl ? (
                                <div
                                  onClick={() => setPreviewAttachment(att)}
                                  className="cursor-pointer relative overflow-hidden max-w-[200px] max-h-[140px]"
                                >
                                  <img
                                    src={att.previewUrl}
                                    alt={att.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/att:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 flex items-center justify-center transition">
                                    <Eye className="w-5 h-5 text-white drop-shadow" />
                                  </div>
                                  <div className="absolute bottom-0 inset-x-0 bg-black/75 px-2 py-0.5 text-[9px] text-stone-300 truncate font-mono">
                                    {att.name}
                                  </div>
                                </div>
                              ) : att.type === 'video' && att.previewUrl ? (
                                <div className="p-2 flex flex-col gap-1 max-w-[240px]">
                                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold truncate">
                                    <Film className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{att.name}</span>
                                  </div>
                                  <video
                                    src={att.previewUrl}
                                    controls
                                    className="w-full rounded-lg max-h-36 bg-black"
                                  />
                                  <span className="text-[9px] text-stone-400 font-mono">
                                    {formatFileSize(att.size)}
                                  </span>
                                </div>
                              ) : (
                                <div className="p-2.5 flex items-center gap-2.5 max-w-[220px]">
                                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
                                    {renderAttachmentIcon(att, "w-4 h-4")}
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-semibold text-stone-200 truncate" title={att.name}>
                                      {att.name}
                                    </div>
                                    <div className="text-[10px] text-stone-400 font-mono">
                                      {formatFileSize(att.size)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Text Bubble */}
                      {Boolean(msg.text && msg.text.trim()) && (
                        <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-gradient-to-r from-[#8c4b20] via-[#743b17] to-[#5a2a0d] text-stone-100 border border-[#a86030]/40 shadow-sm font-sans text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </div>
                      )}
                    </div>
                  ) : (
                    // AI Assistant Reply (ChatGPT Page Flow - Pure Editorial Typography, No Card Container)
                    <div className="w-full py-1 text-left relative">
                      <div className="relative pr-8">
                        {isCurrentAnimating ? (
                          <TypingAssistantMessage
                            key={msg.id}
                            text={msg.text}
                            isStopped={animatingMsgId === null}
                            onDone={() => setAnimatingMsgId(null)}
                            onScrollRequest={scrollToBottom}
                          />
                        ) : (
                          <div className="font-macro-editorial text-[14.5px] sm:text-[15px] text-[#f5efe6] leading-[1.75] tracking-[0.015em] whitespace-pre-wrap select-text antialiased">
                            {cleanAssistantText(msg.text)}
                          </div>
                        )}

                        {/* Copy Action Button */}
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="absolute -top-1 right-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-[#d4976a] transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Copy response"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-[#d4976a]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Timestamp Divider */}
                      <div className="mt-2 text-[10px] text-stone-500 font-sans flex items-center gap-2">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator (ONLY Spinning logo1.png, nothing else) */}
            {isChatLoading && (
              <div className="flex items-center justify-center py-6">
                <img
                  src="/logo1.png"
                  alt="Loading..."
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain animate-spin drop-shadow-[0_0_12px_rgba(200,138,75,0.4)]"
                  loading="eager"
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="px-3.5 py-1.5 bg-rose-950/80 border-t border-rose-800/40 flex items-center justify-between text-xs text-rose-200 shrink-0 z-20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button
                onClick={() => setUploadError(null)}
                className="p-1 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Staged Attachments Preview Ribbon (Before Sending) */}
          {stagedAttachments.length > 0 && (
            <div className="px-3 py-2 bg-[#170e09] border-t border-[#b37446]/25 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0 z-20">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold shrink-0">
                Attached ({stagedAttachments.length}):
              </span>
              {stagedAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#24150d] border border-[#b37446]/40 text-stone-200 text-xs shrink-0 shadow-sm"
                >
                  {renderAttachmentIcon(att, "w-3.5 h-3.5")}
                  <span className="max-w-[110px] truncate text-[11px] font-medium" title={att.name}>
                    {att.name}
                  </span>
                  <span className="text-[9px] text-stone-400 font-mono">
                    ({formatFileSize(att.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStagedAttachment(att.id)}
                    className="ml-1 p-0.5 rounded-full hover:bg-rose-900/50 text-stone-400 hover:text-rose-300 transition cursor-pointer"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Bar - Pinned at bottom of drawer */}
          <div className="p-2.5 sm:p-3 bg-[#110b07] border-t border-[#b37446]/20 shrink-0 select-none z-20">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isGeneratingOrTyping) {
                  handleStopGeneration();
                } else {
                  handleSendMessage();
                }
              }}
              className="flex items-center gap-2"
            >
              {/* Multimodal File/Document Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGeneratingOrTyping}
                className="p-2.5 sm:p-2.5 rounded-xl bg-white/[0.05] hover:bg-[#b37446]/20 border border-[#b37446]/30 hover:border-[#d4976a] text-stone-300 hover:text-amber-200 transition-all cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40"
                title="Upload document, chart image, video, or spreadsheet"
                aria-label="Upload document, chart image, video, or spreadsheet"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder={
                  stagedAttachments.length > 0
                    ? `Add instructions for ${stagedAttachments.length} attached file(s)...`
                    : "Ask about setups, or upload charts/documents/videos..."
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isGeneratingOrTyping}
                className="flex-1 px-3.5 py-2.5 bg-white/[0.04] border border-[#b37446]/30 rounded-xl text-white text-[16px] sm:text-xs outline-none focus:border-[#d4976a] focus:bg-white/[0.07] transition placeholder:text-stone-500 placeholder:text-xs"
              />

              {isGeneratingOrTyping ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-red-800 to-amber-900 hover:from-red-700 hover:to-amber-800 text-white font-bold text-xs transition-all shadow-[0_0_14px_rgba(220,38,38,0.3)] cursor-pointer flex items-center justify-center shrink-0"
                  title="Stop generation"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim() && stagedAttachments.length === 0}
                  className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-[#b37446] to-[#7c3f1a] hover:from-[#c88a4b] hover:to-[#8f4a20] text-white font-bold text-xs transition-all shadow-[0_0_14px_rgba(179,116,70,0.35)] disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0"
                  title="Send message or analyze attachment"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Attachment Image/Video Lightbox Modal */}
      {previewAttachment && (
        <div
          onClick={() => setPreviewAttachment(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-[#140d09] border border-[#b37446]/40 rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between px-3 py-2 border-b border-white/10 mb-2">
              <div className="flex items-center gap-2 truncate">
                {renderAttachmentIcon(previewAttachment, "w-4 h-4")}
                <span className="text-xs font-bold text-white truncate">
                  {previewAttachment.name}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  ({formatFileSize(previewAttachment.size)})
                </span>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-rose-500/20 text-stone-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewAttachment.type === 'image' && (
              <img
                src={previewAttachment.data}
                alt={previewAttachment.name}
                className="max-h-[75vh] max-w-full object-contain rounded-lg"
              />
            )}

            {previewAttachment.type === 'video' && (
              <video
                src={previewAttachment.data}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

