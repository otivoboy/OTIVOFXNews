import React from 'react';
import { 
  Loader2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { EconomicEvent, EngineEvaluationResult } from '../types';
import { useUserTimeZone } from '../context/TimeZoneContext';
import { ForexFactoryIcon } from './ForexFactoryIcon';
import { LiveRunningNewsFeed } from './LiveRunningNewsFeed';
import { evaluatePredictionAccuracy } from '../utils/predictionEvaluator';

interface EventDetailsProps {
  event: EconomicEvent;
  evaluationResult: EngineEvaluationResult;
  onUpdateParams?: (newMetrics: Record<string, any>) => void;
  onRequestAiSynthesis: () => void;
  isAiLoading: boolean;
  recentlyReleasedId?: string | null;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  onRequestAiSynthesis,
  isAiLoading,
  recentlyReleasedId,
}) => {
  const { formatEventTime, geoTimeInfo } = useUserTimeZone();

  const isPast = event.status === 'RELEASED' || (event.actual !== null && event.actual !== undefined);
  const isUpcoming = !isPast;
  const actualVal = event.actual ?? null;
  const forecastVal = event.forecast ?? null;
  const prediction = evaluatePredictionAccuracy(actualVal, forecastVal, event.unit);
  const isJustReleased = recentlyReleasedId === event.id;

  // Dynamic Expected Range Calculation
  const dynamicExpectedRange = React.useMemo(() => {
    if (forecastVal === null) return 'Baseline Range';
    const variance = event.unit === '%' ? 0.1 : 15;
    const lower = Number((forecastVal - variance).toFixed(1));
    const upper = Number((forecastVal + variance).toFixed(1));
    const u = event.unit || '';
    return `${lower > 0 && u === '%' ? '+' : ''}${lower}${u} to ${upper > 0 && u === '%' ? '+' : ''}${upper}${u}`;
  }, [forecastVal, event.unit]);

  return (
    <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl p-4 shadow-sm h-full flex flex-col justify-between">
      <div>
        {/* Header Title & Badges */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#e2dcd2]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xl">{event.flag}</span>
              <ForexFactoryIcon
                impact={event.importance === 'MEDIUM' ? 'MEDIUM' : event.importance === 'LOW' ? 'LOW' : 'HIGH'}
                className="w-4 h-3.5 drop-shadow-xs"
              />
              <span className="text-xs font-mono font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                {event.country} • {event.currency} • {event.code}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#f1ebe0] text-slate-800 border border-[#ded5c6]">
                Period: {event.period}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                {formatEventTime(event.timestamp, true)} ({geoTimeInfo.gmtOffset})
              </span>
              {isPast ? (
                <>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-white font-extrabold tracking-wider shadow-2xs">
                    PAST
                  </span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold inline-flex items-center gap-1 ${prediction.pillTone}`}>
                    {prediction.isCorrect === true ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    ) : prediction.isCorrect === false && prediction.delta && prediction.delta > 0 ? (
                      <TrendingUp className="w-3 h-3 text-cyan-700" />
                    ) : prediction.isCorrect === false ? (
                      <TrendingDown className="w-3 h-3 text-rose-700" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-slate-600" />
                    )}
                    <span>{prediction.badgeLabel}</span>
                  </span>
                </>
              ) : (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold animate-pulse">
                  UPCOMING RELEASE
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans">{event.title}</h2>
            {event.description && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.description}</p>
            )}
          </div>

          {/* Action button: AI Deep Synthesis */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onRequestAiSynthesis}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {isAiLoading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              )}
              <span>{isAiLoading ? 'Analyzing...' : 'AI Deep Synthesis'}</span>
            </button>
          </div>
        </div>

        {/* Surprise & Headline Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
          <div className={`border rounded-lg p-2.5 transition-all ${
            isJustReleased
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/50 shadow-md animate-pulse'
              : isPast && actualVal !== null 
              ? 'bg-[#ffffff] border-slate-300 shadow-2xs' 
              : 'bg-[#faf8f4] border-[#e2dcd2]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Actual Published</span>
              {isJustReleased && (
                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-emerald-700 text-white animate-bounce">
                  NEW
                </span>
              )}
            </div>
            <div className={`text-lg font-mono font-bold mt-0.5 ${
              actualVal !== null && forecastVal !== null
                ? actualVal > forecastVal
                  ? 'text-emerald-800 font-extrabold'
                  : actualVal < forecastVal
                  ? 'text-rose-800 font-extrabold'
                  : 'text-slate-900 font-bold'
                : actualVal !== null
                ? 'text-slate-900 font-bold'
                : 'text-slate-400'
            }`}>
              {actualVal !== null ? `${actualVal > 0 && event.unit === '%' ? '+' : ''}${actualVal}${event.unit || ''}` : isUpcoming ? (
                <span className="text-amber-700 text-xs font-mono font-medium">
                  Scheduled
                </span>
              ) : '--'}
            </div>
          </div>

          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">Consensus Forecast</span>
            <div className="text-lg font-mono font-bold text-sky-800 mt-0.5">
              {forecastVal !== null ? `${forecastVal > 0 && event.unit === '%' ? '+' : ''}${forecastVal}${event.unit || ''}` : '--'}
            </div>
          </div>

          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">
              {isPast ? 'Surprise Delta' : 'Expected Range'}
            </span>
            <div className={`text-sm font-mono font-bold mt-1 ${
              isPast && prediction.delta !== null
                ? prediction.isCorrect === true
                  ? 'text-emerald-800'
                  : prediction.delta > 0
                  ? 'text-cyan-800'
                  : 'text-rose-800'
                : 'text-slate-800'
            }`}>
              {isPast && prediction.deltaStr ? prediction.deltaStr : dynamicExpectedRange}
            </div>
          </div>

          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">Prior Period</span>
            <div className="text-lg font-mono font-bold text-slate-700 mt-0.5">
              {event.previous !== null ? `${event.previous > 0 && event.unit === '%' ? '+' : ''}${event.previous}${event.unit || ''}` : '--'}
            </div>
          </div>
        </div>

        {/* Prediction Confirmation & Consensus Evaluation Panel */}
        {isPast && prediction.status !== 'PENDING' && (
          <div className={`mt-3 p-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${prediction.badgeTone}`}>
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-md bg-white/80 border border-current/20 flex-shrink-0 mt-0.5">
                {prediction.isCorrect === true ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                ) : prediction.isCorrect === false && prediction.delta && prediction.delta > 0 ? (
                  <TrendingUp className="w-4 h-4 text-cyan-800" />
                ) : prediction.isCorrect === false ? (
                  <TrendingDown className="w-4 h-4 text-rose-800" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-slate-700" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {prediction.verdictText}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-white/70 border border-current/20">
                    PASSED EVENT CONFIRMATION
                  </span>
                </div>
                <p className="text-xs mt-0.5 leading-relaxed text-slate-800 font-sans">
                  {prediction.details}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] self-end sm:self-center flex-shrink-0 bg-white/80 px-2.5 py-1 rounded border border-current/20">
              <span className="text-slate-600">Actual: <strong className="text-slate-900">{actualVal !== null ? `${actualVal}${event.unit || ''}` : '--'}</strong></span>
              <span className="text-slate-400">vs</span>
              <span className="text-slate-600">Forecast: <strong className="text-slate-900">{forecastVal !== null ? `${forecastVal}${event.unit || ''}` : '--'}</strong></span>
            </div>
          </div>
        )}

        {/* Live Running Macro Squawk & Real-Time News Wire */}
        <LiveRunningNewsFeed event={event} />
      </div>
    </div>
  );
};

