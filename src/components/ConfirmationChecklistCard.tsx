import React, { useState, useMemo, useEffect } from 'react';
import { 
  ListOrdered, 
  Target, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Gauge,
  Sliders,
  Filter,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Info,
  ShieldCheck,
  Flame,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ChecklistStep, ChecklistStatus, DirectionSkew, EconomicEvent } from '../types';

interface ConfirmationChecklistCardProps {
  checklist: ChecklistStep[];
  isUpcoming: boolean;
  event?: EconomicEvent | null;
  onSimulateScenario?: (skew: 'HAWKISH' | 'DOVISH' | 'IN_LINE') => void;
}

export const ConfirmationChecklistCard: React.FC<ConfirmationChecklistCardProps> = ({
  checklist: initialChecklist,
  isUpcoming,
  event,
  onSimulateScenario,
}) => {
  // Local state for interactive overrides and checklist manipulation
  const [localChecklist, setLocalChecklist] = useState<ChecklistStep[]>(initialChecklist);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'PENDING' | 'TIER1'>('ALL');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [manualConfirmedIds, setManualConfirmedIds] = useState<Set<string>>(new Set());

  // Synchronize when initialChecklist prop updates from engine
  useEffect(() => {
    setLocalChecklist(initialChecklist);
    // Expand the first step by default
    if (initialChecklist.length > 0 && !expandedStepId) {
      setExpandedStepId(initialChecklist[0].id);
    }
  }, [initialChecklist]);

  // Handle manual toggle of checklist item status
  const handleToggleStatus = (id: string, currentStatus: ChecklistStatus) => {
    const statusCycle: ChecklistStatus[] = ['PASS', 'FAIL', 'MIXED', 'PENDING'];
    const nextIdx = (statusCycle.indexOf(currentStatus) + 1) % statusCycle.length;
    const nextStatus = statusCycle[nextIdx];

    setLocalChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
    );

    // Update manual confirmed set
    setManualConfirmedIds((prev) => {
      const next = new Set(prev);
      if (nextStatus === 'PASS') {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  // Quick preset scenario simulations
  const handleSimulatePreset = (preset: 'HAWKISH' | 'DOVISH' | 'IN_LINE' | 'RESET') => {
    if (preset === 'RESET') {
      setLocalChecklist(initialChecklist);
      setManualConfirmedIds(new Set());
      return;
    }

    if (onSimulateScenario) {
      onSimulateScenario(preset);
    }

    setLocalChecklist((prev) =>
      prev.map((item, idx) => {
        if (preset === 'HAWKISH') {
          return {
            ...item,
            status: 'PASS',
            skew: 'HAWKISH',
            actualValue: item.scenarioThresholds?.hawkishThreshold || 'Beat Target (+2.1σ)',
            deltaStr: '+0.25% Upside Surprise (Hawkish Beat)',
            reasoning: item.scenarioThresholds?.hawkishOutcome || 'Print exceeded consensus; triggers hawkish central bank repricing and domestic currency rally.'
          };
        } else if (preset === 'DOVISH') {
          return {
            ...item,
            status: 'PASS',
            skew: 'DOVISH',
            actualValue: item.scenarioThresholds?.dovishThreshold || 'Missed Target (-1.9σ)',
            deltaStr: '-0.20% Downside Surprise (Dovish Miss)',
            reasoning: item.scenarioThresholds?.dovishOutcome || 'Print undershot consensus; triggers dovish rate cut acceleration and domestic currency selloff.'
          };
        } else {
          return {
            ...item,
            status: 'MIXED',
            skew: 'NEUTRAL',
            actualValue: item.scenarioThresholds?.inLineRange || 'In-Line with Consensus',
            deltaStr: '0.00% Variance (Neutral In-Line)',
            reasoning: item.scenarioThresholds?.inLineOutcome || 'Print matched consensus directly; orderly consolidation without breakout momentum.'
          };
        }
      })
    );
  };

  // Calculations: Confluence Score & Metrics
  const stats = useMemo(() => {
    const total = localChecklist.length;
    if (total === 0) return { pass: 0, fail: 0, mixed: 0, pending: 0, score: 0, tier1Count: 0, hawkishCount: 0, dovishCount: 0 };

    let weightedScoreSum = 0;
    let totalWeight = 0;
    let passCount = 0;
    let failCount = 0;
    let mixedCount = 0;
    let pendingCount = 0;
    let tier1Count = 0;
    let hawkishCount = 0;
    let dovishCount = 0;

    localChecklist.forEach((step) => {
      const weight = step.weight || 1;
      totalWeight += weight;

      if (step.weight >= 3) tier1Count++;
      if (step.skew === 'HAWKISH') hawkishCount++;
      if (step.skew === 'DOVISH') dovishCount++;

      if (step.status === 'PASS') {
        passCount++;
        weightedScoreSum += 1.0 * weight;
      } else if (step.status === 'MIXED') {
        mixedCount++;
        weightedScoreSum += 0.5 * weight;
      } else if (step.status === 'FAIL') {
        failCount++;
        weightedScoreSum += 0.0 * weight;
      } else {
        pendingCount++;
        weightedScoreSum += 0.25 * weight;
      }
    });

    const score = totalWeight > 0 ? Math.round((weightedScoreSum / totalWeight) * 100) : 0;
    return {
      pass: passCount,
      fail: failCount,
      mixed: mixedCount,
      pending: pendingCount,
      score,
      tier1Count,
      hawkishCount,
      dovishCount
    };
  }, [localChecklist]);

  // Overall Decision Signal Formulation
  const isPreReleaseArmed = isUpcoming && stats.pass === 0 && stats.fail === 0;

  const decisionSignal = useMemo(() => {
    if (isPreReleaseArmed) {
      return {
        label: 'PRE-EVENT CALIBRATION & DECISION TRIGGERS',
        tone: 'text-indigo-900 bg-indigo-50/90 border-indigo-200',
        icon: Target,
        action: 'Econometric expectation matrix and multi-phase triggers calibrated. Awaiting live data release or scenario simulation.',
        directive: 'ARMED FOR EXECUTION'
      };
    }

    if (stats.score >= 80) {
      const isHawkish = stats.hawkishCount >= stats.dovishCount;
      return {
        label: isHawkish ? 'STRONG HAWKISH CONFLUENCE (HIGH CONVICTION)' : 'STRONG DOVISH CONFLUENCE (HIGH CONVICTION)',
        tone: isHawkish ? 'text-emerald-800 bg-emerald-50 border-emerald-300' : 'text-sky-800 bg-sky-50 border-sky-300',
        icon: CheckCircle2,
        action: isHawkish 
          ? 'All Tier-1 criteria verified: Execute BUY on domestic currency / SELL opposing assets.'
          : 'All Tier-1 criteria verified: Execute SELL on domestic currency / BUY yield-sensitive assets.',
        directive: isHawkish ? 'EXECUTE LONG TRIGGER' : 'EXECUTE SHORT TRIGGER'
      };
    }

    if (stats.score >= 50) {
      return {
        label: 'MODERATE / CONDITIONAL CONFIRMATION',
        tone: 'text-amber-800 bg-amber-50 border-amber-300',
        icon: AlertCircle,
        action: 'Mixed signal signals detected. Scale position down to 50% risk or wait for 5-minute candle close.',
        directive: 'REDUCED RISK ENTRY'
      };
    }

    return {
      label: 'TRIGGER INVALIDATION / NO TRADE (STAND ASIDE)',
      tone: 'text-rose-800 bg-rose-50 border-rose-300',
      icon: XCircle,
      action: 'Checklist requirements failed to confirm primary thesis. High risk of false breakout or whipsaw.',
      directive: 'STAND ASIDE'
    };
  }, [stats, isPreReleaseArmed]);

  // Filtered Checklist
  const filteredList = useMemo(() => {
    return localChecklist.filter((step) => {
      if (activeFilter === 'PASS') return step.status === 'PASS';
      if (activeFilter === 'FAIL') return step.status === 'FAIL';
      if (activeFilter === 'PENDING') return step.status === 'PENDING';
      if (activeFilter === 'TIER1') return (step.weight || 1) >= 3;
      return true;
    });
  }, [localChecklist, activeFilter]);

  // Copy trigger plan to clipboard
  const handleCopyPlan = () => {
    const text = [
      `=== CONFIRMATION CHECKLIST & DECISION TRIGGERS ===`,
      `Event: ${event?.title || 'Macro Economic Release'} (${event?.currency || 'USD'})`,
      `Status: ${isUpcoming ? 'UPCOMING PRE-RELEASE' : 'LIVE / POST-RELEASE'}`,
      `Overall Confluence Score: ${stats.score}% (${decisionSignal.directive})`,
      `--------------------------------------------------`,
      ...localChecklist.map((c, i) => 
        `[Phase ${i + 1}] ${c.label} (${c.status}) - Weight: W${c.weight || 1}\n` +
        `  • Actual: ${c.actualValue} | Expected: ${c.expectedValue} | Delta: ${c.deltaStr}\n` +
        `  • Rule/Guidance: ${c.preReleaseGuidance || c.reasoning}\n` +
        (c.scenarioThresholds ? `  • Hawkish Trigger: ${c.scenarioThresholds.hawkishThreshold} -> ${c.scenarioThresholds.hawkishOutcome}\n  • Dovish Trigger: ${c.scenarioThresholds.dovishThreshold} -> ${c.scenarioThresholds.dovishOutcome}\n` : '')
      ),
      `--------------------------------------------------`,
      `Decision Directive: ${decisionSignal.action}`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl p-4 sm:p-5 shadow-sm h-full flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e2dcd2]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-sans">
                  Confirmation Checklist & Decision Triggers
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-50 text-sky-800 border border-sky-200">
                  {localChecklist.length} Criteria
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Institutional pre-release forecast ranges, surprise delta boundaries & multi-phase execution rules
              </p>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleCopyPlan}
              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[#faf8f4] hover:bg-[#f1ebe0] text-slate-700 border border-[#ded5c6] transition flex items-center gap-1.5 shadow-2xs"
              title="Copy formatted trigger checklist to clipboard"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-emerald-800 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Plan</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleSimulatePreset('RESET')}
              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[#faf8f4] hover:bg-[#f1ebe0] text-slate-700 border border-[#ded5c6] transition flex items-center gap-1.5 shadow-2xs"
              title="Reset checklist to original engine data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Live Decision Confluence Dashboard Bar */}
        <div className={`mt-3.5 p-3 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${decisionSignal.tone}`}>
          <div className="flex items-start gap-2.5">
            <decisionSignal.icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wide">
                  {decisionSignal.label}
                </span>
                <span className="px-2 py-0.2 rounded font-mono font-black text-[10px] bg-white/80 border border-current shadow-2xs">
                  {decisionSignal.directive}
                </span>
              </div>
              <p className="text-[11px] font-sans font-medium mt-0.5 leading-snug">
                {decisionSignal.action}
              </p>
            </div>
          </div>

          {/* Confluence Score Gauge */}
          <div className="flex items-center gap-3 self-end md:self-auto shrink-0 font-mono">
            <div className="text-right">
              <div className="text-[10px] text-slate-600 uppercase font-semibold">
                {isPreReleaseArmed ? 'Calibration' : 'Confluence Meter'}
              </div>
              <div className="text-sm font-black text-slate-900">
                {isPreReleaseArmed ? 'Armed & Ready' : `${stats.score}% Score`}
              </div>
            </div>
            <div className="w-16 sm:w-20 bg-slate-200/80 rounded-full h-2.5 overflow-hidden border border-slate-300">
              <div
                className={`h-full transition-all duration-500 ${
                  isPreReleaseArmed
                    ? 'bg-indigo-600'
                    : stats.score >= 75
                    ? 'bg-emerald-600'
                    : stats.score >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${isPreReleaseArmed ? 100 : stats.score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Scenario Simulator Triggers */}
        <div className="mt-3 p-2.5 rounded-lg bg-[#faf8f4] border border-[#e8e2d8] flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-bold text-slate-800">
            <span>Simulate Decision Triggers:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleSimulatePreset('HAWKISH')}
              className="px-2 py-1 text-[10px] font-bold font-mono rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition flex items-center gap-1 cursor-pointer"
            >
              <TrendingUp className="w-3 h-3 text-emerald-700" />
              <span>Hawkish Beat (+2σ)</span>
            </button>
            <button
              onClick={() => handleSimulatePreset('DOVISH')}
              className="px-2 py-1 text-[10px] font-bold font-mono rounded bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 transition flex items-center gap-1 cursor-pointer"
            >
              <TrendingDown className="w-3 h-3 text-rose-700" />
              <span>Dovish Miss (-2σ)</span>
            </button>
            <button
              onClick={() => handleSimulatePreset('IN_LINE')}
              className="px-2 py-1 text-[10px] font-bold font-mono rounded bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 transition flex items-center gap-1 cursor-pointer"
            >
              <Activity className="w-3 h-3 text-sky-700" />
              <span>In-Line Neutral</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#f5f0e6] p-1 rounded-lg border border-[#e2dcd2] text-[11px] font-mono">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2 py-0.5 rounded font-semibold transition ${
                activeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({localChecklist.length})
            </button>
            <button
              onClick={() => setActiveFilter('PASS')}
              className={`px-2 py-0.5 rounded font-semibold transition ${
                activeFilter === 'PASS'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              Pass ({stats.pass})
            </button>
            <button
              onClick={() => setActiveFilter('FAIL')}
              className={`px-2 py-0.5 rounded font-semibold transition ${
                activeFilter === 'FAIL'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-rose-800 hover:text-rose-950'
              }`}
            >
              Fail ({stats.fail})
            </button>
            <button
              onClick={() => setActiveFilter('PENDING')}
              className={`px-2 py-0.5 rounded font-semibold transition ${
                activeFilter === 'PENDING'
                  ? 'bg-sky-700 text-white shadow-2xs font-bold'
                  : 'text-sky-800 hover:text-sky-950'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setActiveFilter('TIER1')}
              className={`px-2 py-0.5 rounded font-semibold transition ${
                activeFilter === 'TIER1'
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Tier-1 ({stats.tier1Count})
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-mono italic">
            *Click any status badge to manually toggle Pass/Fail
          </div>
        </div>

        {/* Interactive Checklist Items List */}
        <div className="space-y-3 mt-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredList.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-[#faf8f4] rounded-lg border border-dashed border-[#ded5c6]">
              No triggers match the selected filter.
            </div>
          ) : (
            filteredList.map((step, index) => {
              const isPass = step.status === 'PASS';
              const isFail = step.status === 'FAIL';
              const isPending = step.status === 'PENDING';
              const isMixed = step.status === 'MIXED';
              const isExpanded = expandedStepId === step.id;
              const isTier1 = (step.weight || 1) >= 3;

              return (
                <div
                  key={step.id || index}
                  className={`rounded-xl border transition duration-200 overflow-hidden shadow-2xs ${
                    isPending
                      ? 'bg-[#ffffff] border-sky-200'
                      : isPass
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isFail
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-[#faf8f4] border-amber-200'
                  }`}
                >
                  {/* Card Main Row */}
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Indicator & Title */}
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => handleToggleStatus(step.id, step.status)}
                          className="mt-0.5 focus:outline-none"
                          title="Click to toggle status"
                        >
                          {isPending ? (
                            <Target className="w-4 h-4 text-sky-700 hover:scale-110 transition" />
                          ) : isPass ? (
                            <CheckCircle className="w-4 h-4 text-emerald-700 hover:scale-110 transition" />
                          ) : isFail ? (
                            <XCircle className="w-4 h-4 text-rose-700 hover:scale-110 transition" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-700 hover:scale-110 transition" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 font-sans">
                              {step.label || 'Decision Trigger Criterion'}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#f1ebe0] text-slate-700 border border-[#ded5c6]">
                              Phase {index + 1}
                            </span>
                            {isTier1 && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 text-amber-700" /> Tier 1 Priority
                              </span>
                            )}
                            {step.weight && (
                              <span className="text-[9px] font-mono text-slate-500">
                                Weight: {step.weight}x
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-sans">
                            {step.description || 'Monitors market consensus variance vs institutional execution thresholds.'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Interactive Status Pill & Expand Trigger */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleStatus(step.id, step.status)}
                          className={`px-2.5 py-0.5 rounded font-mono font-bold text-[10px] transition cursor-pointer hover:opacity-90 shadow-2xs ${
                            isPass
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isFail
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : isMixed
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-sky-100 text-sky-900 border border-sky-300'
                          }`}
                          title="Click to cycle status"
                        >
                          {step.status}
                        </button>

                        <button
                          onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition rounded"
                          title={isExpanded ? "Collapse details" : "Expand scenario details"}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Metrics Comparison Bar */}
                    <div className="mt-2.5 pt-2 border-t border-[#e8e2d8] grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                      <div className="bg-white/80 p-1.5 rounded border border-[#ded5c6]">
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Actual / Current</span>
                        <strong className="text-slate-900 text-[11px]">{step.actualValue ?? 'Awaiting Print'}</strong>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded border border-[#ded5c6]">
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Expected Consensus</span>
                        <strong className="text-slate-900 text-[11px]">{step.expectedValue ?? 'Consensus Target'}</strong>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded border border-[#ded5c6]">
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">Surprise Delta</span>
                        <strong className={isPass ? 'text-emerald-700' : isFail ? 'text-rose-700' : 'text-slate-700'}>
                          {step.deltaStr || '0.00σ Delta'}
                        </strong>
                      </div>
                    </div>

                    {/* Reasoning Snippet */}
                    {step.reasoning && (
                      <div className="mt-2 text-[11px] text-slate-700 bg-white/60 p-2 rounded border border-[#e8e2d8] leading-relaxed">
                        <strong className="text-slate-900">Institutional Rationale: </strong>
                        {step.reasoning}
                      </div>
                    )}
                  </div>

                  {/* Expandable Deep Dive: Scenario Thresholds & Actionable Guidance */}
                  {isExpanded && (
                    <div className="bg-[#fcfaf7] px-3.5 py-3 border-t border-[#ded5c6] space-y-2.5 text-[11px]">
                      {/* Scenario Thresholds Breakdown */}
                      {step.scenarioThresholds && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                            Pre-Release Decision Thresholds & Reaction Paths:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                            {/* Hawkish Threshold Box */}
                            <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                              <div className="flex items-center justify-between text-emerald-900 font-bold">
                                <span>HAWKISH TRIGGER:</span>
                                <span>{step.scenarioThresholds.hawkishThreshold}</span>
                              </div>
                              <p className="text-[10px] text-emerald-800 font-sans mt-1">
                                {step.scenarioThresholds.hawkishOutcome}
                              </p>
                            </div>

                            {/* Dovish Threshold Box */}
                            <div className="p-2 rounded bg-rose-50 border border-rose-200">
                              <div className="flex items-center justify-between text-rose-900 font-bold">
                                <span>DOVISH TRIGGER:</span>
                                <span>{step.scenarioThresholds.dovishThreshold}</span>
                              </div>
                              <p className="text-[10px] text-rose-800 font-sans mt-1">
                                {step.scenarioThresholds.dovishOutcome}
                              </p>
                            </div>
                          </div>

                          {step.scenarioThresholds.inLineRange && (
                            <div className="mt-1.5 p-1.5 rounded bg-sky-50 border border-sky-200 flex items-center justify-between text-[10px] font-mono text-sky-900">
                              <span>In-Line Range: <strong>{step.scenarioThresholds.inLineRange}</strong></span>
                              <span className="font-sans text-sky-800">{step.scenarioThresholds.inLineOutcome || 'Consolidation without trend.'}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Key Drivers / Institutional Focus */}
                      {step.keyDrivers && step.keyDrivers.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Key Drivers & Sub-Components:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {step.keyDrivers.map((driver, dIdx) => (
                              <span
                                key={dIdx}
                                className="px-2 py-0.5 rounded bg-white text-slate-700 border border-[#ded5c6] text-[10px]"
                              >
                                • {driver}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actionable Advice & Institutional Focus */}
                      <div className="pt-2 border-t border-[#e8e2d8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-slate-600">
                          {step.institutionalFocus && (
                            <span>
                              <strong className="text-slate-800">Policy Focus: </strong>
                              {step.institutionalFocus}
                            </span>
                          )}
                        </div>
                        <div className="text-sky-900 font-bold flex items-center gap-1 shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
                          <span>Rule: {step.preReleaseGuidance || 'Wait for secondary 15m candle close'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Card Footer Summary */}
      <div className="mt-4 pt-3 border-t border-[#e2dcd2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5" /> {stats.pass} Confirmed
          </span>
          <span className="flex items-center gap-1 font-bold text-rose-700">
            <XCircle className="w-3.5 h-3.5" /> {stats.fail} Invalidation
          </span>
          <span className="flex items-center gap-1 font-bold text-sky-700">
            <Target className="w-3.5 h-3.5" /> {stats.pending} Armed
          </span>
        </div>

        <div className="text-slate-500 text-[10px]">
          Framework: 5-Pillar Econometric Confirmation Rulebook
        </div>
      </div>
    </div>
  );
};
