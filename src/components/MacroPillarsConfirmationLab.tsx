import React, { useState } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  FileText, 
  Building2, 
  Globe2, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  Compass, 
  Clock, 
  Activity, 
  Zap, 
  Layers, 
  BarChart2, 
  Percent, 
  Flame, 
  Info,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { MacroConfirmationPillars, EconomicEvent } from '../types';

interface MacroPillarsConfirmationLabProps {
  pillars?: MacroConfirmationPillars | null;
  event: EconomicEvent;
}

export const MacroPillarsConfirmationLab: React.FC<MacroPillarsConfirmationLabProps> = ({
  pillars,
  event,
}) => {
  const [activePillarTab, setActivePillarTab] = useState<'ALL' | 'PILLAR1' | 'PILLAR2' | 'PILLAR3' | 'PILLAR4' | 'PILLAR5' | 'WORKFLOW'>('ALL');
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'PRE' | 'RELEASE' | 'POST'>('RELEASE');

  if (!pillars) {
    return null;
  }

  const {
    pillar1Data,
    pillar2Market,
    pillar3Textual,
    pillar4Fiscal,
    pillar5Intermarket,
    workflowPhases,
    overallConfirmationScore = 85,
    institutionalConsensus = 'Multi-pillar alignment in progress.',
  } = pillars;

  return (
    <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl overflow-hidden shadow-sm mt-4">
      {/* Header Banner */}
      <div className="bg-[#faf8f4] p-3.5 sm:p-4 border-b border-[#e2dcd2] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-100 border border-sky-200 text-sky-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-wide flex items-center gap-1.5 font-sans">
                5-Pillar Macro Confirmation Architecture
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                INSTITUTIONAL GRADE
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 font-sans">
              Fundamental Triggers • OIS Expectations • Statement Textual Decoder • Fiscal Wildcard • Cross-Asset Validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Confirmation Score</div>
            <div className="text-lg font-bold font-mono text-sky-950 flex items-center justify-end gap-1">
              <span>{overallConfirmationScore}</span>
              <span className="text-xs text-slate-500">/100</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-sky-400 flex items-center justify-center bg-sky-50 font-mono font-bold text-xs text-sky-900 shadow-2xs">
            {overallConfirmationScore}%
          </div>
        </div>
      </div>

      {/* Institutional Consensus Callout */}
      {institutionalConsensus && (
        <div className="bg-[#fcfaf5] px-4 py-2.5 border-b border-[#e2dcd2] flex items-center gap-2 text-xs">
          <span className="text-slate-700 font-semibold flex-shrink-0">Executive Synthesis:</span>
          <span className="text-slate-800 font-mono text-[11px] leading-snug">{institutionalConsensus}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-2 bg-[#f8f5ee] border-b border-[#e2dcd2] overflow-x-auto scrollbar-none text-xs font-mono">
        {[
          { id: 'ALL', label: 'All 5 Pillars Overview' },
          { id: 'PILLAR1', label: 'Pillar 1: Data Triggers' },
          { id: 'PILLAR2', label: 'Pillar 2: Market OIS' },
          { id: 'PILLAR3', label: 'Pillar 3: Text Decoder' },
          { id: 'PILLAR4', label: 'Pillar 4: Fiscal / Housing' },
          { id: 'PILLAR5', label: 'Pillar 5: Intermarket' },
          { id: 'WORKFLOW', label: '3-Phase Workflow (Pre/H-Hour/Post)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePillarTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer font-medium ${
              activePillarTab === tab.id
                ? 'bg-sky-100 text-sky-900 border border-sky-300 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#eae3d5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="p-3.5 sm:p-4 space-y-4">
        {/* TAB: WORKFLOW PHASES */}
        {workflowPhases && (activePillarTab === 'WORKFLOW' || activePillarTab === 'ALL') && (
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-sans">
                  3-Phase Operational Execution Workflow
                </h4>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { id: 'PRE', label: 'Pre-Meeting (T-7D)' },
                  { id: 'RELEASE', label: 'Release (H-Hour)' },
                  { id: 'POST', label: 'Post-Meeting (Press Conf)' },
                ].map((wTab) => (
                  <button
                    key={wTab.id}
                    onClick={() => setActiveWorkflowTab(wTab.id as any)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded transition cursor-pointer ${
                      activeWorkflowTab === wTab.id
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                        : 'text-slate-600 bg-[#ffffff] border border-[#ded5c6] hover:text-slate-900'
                    }`}
                  >
                    {wTab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Phase 1 */}
              {workflowPhases.preMeetingTMinus7D && (
                <div
                  className={`p-3 rounded-lg border transition ${
                    activeWorkflowTab === 'PRE'
                      ? 'bg-[#ffffff] border-emerald-400 shadow-2xs'
                      : 'bg-[#ffffff] border-[#e8e2d8] opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-800">
                      {workflowPhases.preMeetingTMinus7D.phaseName || '1. Pre-Meeting (T-7D)'}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {workflowPhases.preMeetingTMinus7D.status}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {workflowPhases.preMeetingTMinus7D.focusItems?.map((item, idx) => (
                      <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-relaxed font-sans">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Phase 2 */}
              {workflowPhases.releaseHHour && (
                <div
                  className={`p-3 rounded-lg border transition ${
                    activeWorkflowTab === 'RELEASE'
                      ? 'bg-[#ffffff] border-sky-400 shadow-2xs'
                      : 'bg-[#ffffff] border-[#e8e2d8] opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-sky-900">
                      {workflowPhases.releaseHHour.phaseName || '2. Release Phase (H-Hour)'}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-300 animate-pulse">
                      {workflowPhases.releaseHHour.status}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {workflowPhases.releaseHHour.focusItems?.map((item, idx) => (
                      <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-relaxed font-sans">
                        <Zap className="w-3 h-3 text-sky-700 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Phase 3 */}
              {workflowPhases.postMeetingPressConf && (
                <div
                  className={`p-3 rounded-lg border transition ${
                    activeWorkflowTab === 'POST'
                      ? 'bg-[#ffffff] border-amber-400 shadow-2xs'
                      : 'bg-[#ffffff] border-[#e8e2d8] opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-amber-900">
                      {workflowPhases.postMeetingPressConf.phaseName || '3. Post-Meeting (Press Conf)'}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      {workflowPhases.postMeetingPressConf.status}
                    </span>
                  </div>
                  {workflowPhases.postMeetingPressConf.governorName && (
                    <div className="text-[10px] text-slate-500 font-mono mb-1">
                      Key Speaker: <span className="text-slate-900 font-bold">{workflowPhases.postMeetingPressConf.governorName}</span>
                    </div>
                  )}
                  <ul className="space-y-1.5">
                    {workflowPhases.postMeetingPressConf.focusItems?.map((item, idx) => (
                      <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-relaxed font-sans">
                        <Activity className="w-3 h-3 text-amber-700 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PILLAR 1: DATA TRIGGERS */}
        {pillar1Data && (activePillarTab === 'PILLAR1' || activePillarTab === 'ALL') && (
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2dcd2]">
              <div className="flex items-center gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                    Pillar 1: Macroeconomic Data Triggers (The Fundamentals)
                  </h4>
                  <p className="text-[10px] font-mono text-emerald-800">{pillar1Data.mandateTarget}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                Score: {pillar1Data.statusScore ?? 90}/100
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Primary Inflation / Metric */}
              {pillar1Data.primaryInflationMetric && (
                <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1 font-sans">
                      <Flame className="w-3.5 h-3.5 text-rose-600" />
                      {pillar1Data.primaryInflationMetric.name || 'Primary Metric'}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      pillar1Data.primaryInflationMetric.bias === 'HAWKISH'
                        ? 'bg-rose-50 text-rose-900 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    }`}>
                      {pillar1Data.primaryInflationMetric.bias}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-700">
                      <span>Value:</span>
                      <strong className="text-slate-900">{pillar1Data.primaryInflationMetric.value}</strong>
                    </div>
                    {pillar1Data.primaryInflationMetric.forecast && (
                      <div className="flex justify-between text-slate-700">
                        <span>Forecast:</span>
                        <strong className="text-slate-900">{pillar1Data.primaryInflationMetric.forecast}</strong>
                      </div>
                    )}
                  </div>
                  {pillar1Data.primaryInflationMetric.note && (
                    <p className="text-[10px] text-slate-600 leading-relaxed pt-1 border-t border-[#e8e2d8] font-sans">
                      {pillar1Data.primaryInflationMetric.note}
                    </p>
                  )}
                </div>
              )}

              {/* Wage Growth or Secondary Metric */}
              {pillar1Data.wageGrowth ? (
                <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1 font-sans">
                      <Percent className="w-3.5 h-3.5 text-sky-600" />
                      {pillar1Data.wageGrowth.name || 'Wage Growth'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-50 text-sky-900 border border-sky-200">
                      Threshold: {pillar1Data.wageGrowth.threshold}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-700">
                      <span>Observed Value:</span>
                      <strong className="text-slate-900">{pillar1Data.wageGrowth.value}</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed pt-1 border-t border-[#e8e2d8] font-sans">
                    {pillar1Data.wageGrowth.impact}
                  </p>
                </div>
              ) : pillar1Data.secondaryInflationMetric ? (
                <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1 font-sans">
                      <Percent className="w-3.5 h-3.5 text-sky-600" />
                      {pillar1Data.secondaryInflationMetric.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-50 text-sky-900 border border-sky-200">
                      {pillar1Data.secondaryInflationMetric.bias}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-700">
                      <span>Value:</span>
                      <strong className="text-slate-900">{pillar1Data.secondaryInflationMetric.value}</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed pt-1 border-t border-[#e8e2d8] font-sans">
                    {pillar1Data.secondaryInflationMetric.note}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1 font-sans">
                      <Percent className="w-3.5 h-3.5 text-sky-600" />
                      Labor & Wages
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-sans">
                    Continuous monitoring of high-frequency labor dynamics and compensation pressure.
                  </p>
                </div>
              )}

              {/* GDP & Output Gap or PMI */}
              {pillar1Data.gdpAndOutputGap ? (
                <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1 font-sans">
                      <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                      Growth & Output Gap
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                      Risk: {pillar1Data.gdpAndOutputGap.overheatingRisk}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-700">
                      <span>GDP Growth:</span>
                      <strong className="text-slate-900">{pillar1Data.gdpAndOutputGap.gdpGrowth}</strong>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Output Gap:</span>
                      <strong className="text-slate-900">{pillar1Data.gdpAndOutputGap.outputGap}</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed pt-1 border-t border-[#e8e2d8] font-sans">
                    Velocity: {pillar1Data.gdpAndOutputGap.velocity}
                  </p>
                </div>
              ) : pillar1Data.pmiSubcomponents ? (
                <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1 font-sans">
                      <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                      PMI Activity
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                      {pillar1Data.pmiSubcomponents.threshold50Velocity}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-700">
                      <span>New Orders:</span>
                      <strong className="text-slate-900">{pillar1Data.pmiSubcomponents.newOrders?.value}</strong>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Prices Paid:</span>
                      <strong className="text-slate-900">{pillar1Data.pmiSubcomponents.pricesPaid?.value}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1 font-sans">
                      <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                      Macroeconomic Baseline
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-sans">
                    Synchronized tracking of business cycle, production, and order flows.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PILLAR 2: MARKET-BASED EXPECTATIONS (OIS) */}
        {pillar2Market && (activePillarTab === 'PILLAR2' || activePillarTab === 'ALL') && (
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2dcd2]">
              <div className="flex items-center gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                    Pillar 2: Market-Based Expectations & Overnight Index Swaps (OIS)
                  </h4>
                  <p className="text-[10px] font-mono text-sky-800">
                    {pillar2Market.instrumentTracked || 'Implied Rate Probabilities & OIS Curve'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                Rate: {pillar2Market.currentPolicyRate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Hold / Neutral Prob</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{pillar2Market.impliedHoldProbability}%</div>
                <p className="text-[10px] text-slate-600 mt-1 font-sans">Consensus baseline expectation</p>
              </div>
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Hike / Tightening Prob</div>
                <div className="text-lg font-bold font-mono text-sky-900 mt-0.5">{pillar2Market.impliedHikeProbability}%</div>
                <p className="text-[10px] text-slate-600 mt-1 font-sans">Live interbank OIS pricing</p>
              </div>
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Cut / Easing Prob</div>
                <div className="text-lg font-bold font-mono text-emerald-800 mt-0.5">{pillar2Market.impliedCutProbability}%</div>
                <p className="text-[10px] text-slate-600 mt-1 font-sans">Forward curve discount</p>
              </div>
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Neutral Rate Estimate</div>
                <div className="text-xs font-bold text-amber-800 mt-1">{pillar2Market.estimatedNeutralRate}</div>
                <p className="text-[10px] text-slate-600 mt-1 font-sans">{pillar2Market.surpriseGapThreshold}</p>
              </div>
            </div>

            {pillar2Market.marketPricingRisk && (
              <div className="p-2.5 rounded-lg bg-[#ffffff] border border-[#e8e2d8] text-xs text-slate-700 font-sans">
                <strong className="text-slate-900 font-mono text-[11px] uppercase mr-1">Pricing Trap Risk:</strong>
                {pillar2Market.marketPricingRisk}
              </div>
            )}
          </div>
        )}

        {/* PILLAR 3: TEXTUAL ANALYSIS & Central Bank Decoder */}
        {pillar3Textual && (activePillarTab === 'PILLAR3' || activePillarTab === 'ALL') && (
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2dcd2]">
              <div className="flex items-center gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                    Pillar 3: Statement Textual Analysis & Central Bank Linguistic Decoder
                  </h4>
                  <p className="text-[10px] font-mono text-purple-800">
                    Forward Guidance Shifts • Hawkish / Dovish Language Differential • Dot Plot Trajectory
                  </p>
                </div>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                pillar3Textual.textualSkewScore > 0
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                Skew Score: {pillar3Textual.textualSkewScore > 0 ? `+${pillar3Textual.textualSkewScore}` : pillar3Textual.textualSkewScore}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Guidance Phrase Tracker */}
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                  <FileText className="w-3.5 h-3.5 text-purple-700" />
                  <span>Key Policy Phrasing & Linguistic Triggers</span>
                </div>
                <div className="space-y-1.5">
                  {pillar3Textual.hawkishKeywordsDetected?.map((item, i) => (
                    <div key={`h-${i}`} className="p-2 rounded bg-rose-50/70 border border-rose-200 text-[11px] text-rose-950 font-sans">
                      <div className="font-mono font-bold text-rose-900">"{item.phrase}"</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{item.implication}</div>
                    </div>
                  ))}
                  {pillar3Textual.dovishKeywordsDetected?.map((item, i) => (
                    <div key={`d-${i}`} className="p-2 rounded bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 font-sans">
                      <div className="font-mono font-bold text-emerald-900">"{item.phrase}"</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{item.implication}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voting Record & Outlook Report */}
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2.5">
                {pillar3Textual.votingAlignment && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1 font-sans">
                      <span>Voting Record & Committee Consensus</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {pillar3Textual.votingAlignment.frictionLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed bg-[#fbf9f5] p-2 rounded border border-[#e8e2d8] font-sans">
                      {pillar3Textual.votingAlignment.summary}
                    </p>
                  </div>
                )}

                {pillar3Textual.outlookReportOrDotPlot && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1 font-sans">
                      <span>{pillar3Textual.outlookReportOrDotPlot.title}</span>
                      <span className="text-[10px] font-mono text-purple-800 font-bold">
                        {pillar3Textual.outlookReportOrDotPlot.inflationRevision}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-purple-950 bg-purple-50 p-2 rounded border border-purple-200 font-semibold mb-1">
                      {pillar3Textual.outlookReportOrDotPlot.medianPathTrajectory}
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed font-sans">
                      {pillar3Textual.outlookReportOrDotPlot.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PILLAR 4: FISCAL / POLITICAL / HOUSING */}
        {pillar4Fiscal && (activePillarTab === 'PILLAR4' || activePillarTab === 'ALL') && (
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2dcd2]">
              <div className="flex items-center gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                    Pillar 4: Government & Political Interference (“The Fiscal Wildcard”) & Leverage
                  </h4>
                  <p className="text-[10px] font-mono text-amber-800">
                    Ministry of Finance (MoF) Verbal Interventions • Political Stance • Domestic Housing Linkage
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Intervention: {pillar4Fiscal.verbalInterventionLevel?.replace(/_/g, ' ') || 'STANDARD'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Official Intervention Phrases & Political Landscape</span>
                </div>
                <div className="space-y-1.5">
                  {pillar4Fiscal.interventionPhrases?.map((phrase, i) => (
                    <div key={i} className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-mono">
                      "{phrase}"
                    </div>
                  ))}
                </div>
                {pillar4Fiscal.politicalPressureSummary && (
                  <p className="text-[11px] text-slate-700 leading-relaxed mt-2 pt-2 border-t border-[#e8e2d8] font-sans">
                    {pillar4Fiscal.politicalPressureSummary}
                  </p>
                )}
              </div>

              {pillar4Fiscal.housingAndConsumerLeverage && (
                <div className="p-3 rounded-lg bg-[#ffffff] border border-[#e8e2d8] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 font-sans">
                    <span>Domestic Housing & Consumer Leverage Linkage</span>
                    <span className="text-[10px] font-mono text-rose-800 font-bold">
                      Stress: {pillar4Fiscal.housingAndConsumerLeverage.householdCashFlowStress}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#fbf9f5] border border-[#e8e2d8] space-y-1 text-[11px]">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-600">Variable-Rate Mortgage Ratio:</span>
                      <span className="text-amber-900 font-bold">
                        {pillar4Fiscal.housingAndConsumerLeverage.variableRateMortgageRatio}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 pt-1 leading-relaxed font-sans">
                      {pillar4Fiscal.housingAndConsumerLeverage.debtVulnerabilityNote}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PILLAR 5: INTERMARKET CORRELATION & CROSS-ASSET CONFIRMATION */}
        {pillar5Intermarket && (activePillarTab === 'PILLAR5' || activePillarTab === 'ALL') && (
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2dcd2]">
              <div className="flex items-center gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                    Pillar 5: Intermarket Correlation & Cross-Asset Confirmation
                  </h4>
                  <p className="text-[10px] font-mono text-rose-800">
                    Sovereign Yields • Yield Spreads • Equity & Gold Correlation Vector
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300">
                Regime: {pillar5Intermarket.macroRegimeDetected?.replace(/_/g, ' ') || 'ACTIVE'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pillar5Intermarket.benchmarkYield && (
                <div className="p-2.5 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Benchmark Sovereign Yield</div>
                  <div className="text-xs font-bold text-slate-900 truncate font-sans">{pillar5Intermarket.benchmarkYield.symbol}</div>
                  <div className="text-base font-mono font-bold text-rose-700 my-1">
                    {pillar5Intermarket.benchmarkYield.currentYield}{' '}
                    <span className="text-[10px] text-emerald-700 font-normal">({pillar5Intermarket.benchmarkYield.move1d})</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-sans">{pillar5Intermarket.benchmarkYield.implication}</p>
                </div>
              )}

              {pillar5Intermarket.yieldSpreadDifferential && (
                <div className="p-2.5 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Yield Spread Differential</div>
                  <div className="text-xs font-bold text-slate-900 truncate font-sans">{pillar5Intermarket.yieldSpreadDifferential.pair}</div>
                  <div className="text-base font-mono font-bold text-sky-900 my-1">
                    {pillar5Intermarket.yieldSpreadDifferential.spreadBps}
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-sans">{pillar5Intermarket.yieldSpreadDifferential.fxImpact}</p>
                </div>
              )}

              {pillar5Intermarket.equityIndexTransmission && (
                <div className="p-2.5 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Equity Index Transmission</div>
                  <div className="text-xs font-bold text-slate-900 truncate font-sans">{pillar5Intermarket.equityIndexTransmission.symbol}</div>
                  <div className="text-xs font-mono font-bold text-amber-900 my-1">
                    {pillar5Intermarket.equityIndexTransmission.expectedDirection}
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-sans">{pillar5Intermarket.equityIndexTransmission.currentPosture}</p>
                </div>
              )}

              {pillar5Intermarket.goldOrDollarConfirmation && (
                <div className="p-2.5 rounded-lg bg-[#ffffff] border border-[#e8e2d8]">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">FX & Commodity Vector</div>
                  <div className="text-xs font-bold text-slate-900 truncate font-sans">{pillar5Intermarket.goldOrDollarConfirmation.symbol}</div>
                  <div className="text-xs font-mono font-bold text-emerald-800 my-1">
                    {pillar5Intermarket.goldOrDollarConfirmation.reactionVector}
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-sans">
                    {pillar5Intermarket.goldOrDollarConfirmation.institutionalImplication}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
