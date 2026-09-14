import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Layers, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Radio, 
  Compass, 
  Zap, 
  Target, 
  Clock, 
  ArrowRight, 
  Scale,
  ArrowLeftRight,
  Info,
  BookOpen,
  Brain,
  Sparkles,
  Gauge
} from 'lucide-react';
import { EngineEvaluationResult, AssetImpact, AssetQuote, EconomicEvent } from '../types';
import { resolveAssetTransmissionVector } from '../engines/Evaluator';
import { getMatchingMacroPlaybookTopic } from '../engines/macroPlaybookDecisionEngine';

interface ImpactMatrixProps {
  evaluationResult: EngineEvaluationResult;
  selectedAssetSymbol?: string;
  onSelectAsset?: (symbol: string) => void;
  quotes?: Record<string, AssetQuote>;
  event?: EconomicEvent | null;
}

export const ImpactMatrix: React.FC<ImpactMatrixProps> = ({
  evaluationResult,
  selectedAssetSymbol,
  onSelectAsset,
  quotes = {},
  event,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [activeScenarioView, setActiveScenarioView] = useState<'BASELINE' | 'UPSIDE' | 'DOWNSIDE'>('BASELINE');

  const isReleased = (event?.status === 'RELEASED' && event?.actual !== null) || 
    (evaluationResult.verdict !== 'MIXED_NO_ACTION' && !evaluationResult.verdictLabel.includes('PRE-RELEASE') && !evaluationResult.verdictLabel.includes('EXPECTATION'));

  const eventCurrency = (event?.currency || 'USD').toUpperCase();
  const playbookTopic = event ? getMatchingMacroPlaybookTopic(event) : undefined;
  const directionDecision = evaluationResult.aiSynthesis?.directionSpikeDecision;

  // Filter assets by category if tab selected
  const baseAssets = evaluationResult.assetImpacts.filter((asset) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'FX_BASE') {
      const parts = asset.symbol.toUpperCase().split('/');
      return parts.length === 2 && parts[0].trim() === eventCurrency;
    }
    if (categoryFilter === 'FX_QUOTE') {
      const parts = asset.symbol.toUpperCase().split('/');
      return parts.length === 2 && parts[1].trim() === eventCurrency;
    }
    return asset.category === categoryFilter;
  });

  // Calculate dynamic scenario expectations for each asset
  const displayedAssets = baseAssets.map((asset) => {
    const sym = asset.symbol.toUpperCase();
    const parts = sym.split('/');
    const isBasePair = parts.length === 2 && parts[0].trim() === eventCurrency;
    const isQuotePair = parts.length === 2 && parts[1].trim() === eventCurrency;

    if (activeScenarioView === 'UPSIDE') {
      // Upside Beat scenario (Hawkish / currency strength)
      const upsideResolved = event ? resolveAssetTransmissionVector(asset, event, true, true) : null;
      const isBuy = upsideResolved?.directive.includes('BUY') ?? (isBasePair ? true : isQuotePair ? false : true);
      
      return {
        ...asset,
        displayDirective: isBuy ? 'BUY' : 'SELL',
        displaySpikeLabel: isBuy ? 'BULLISH UPWARD SPIKE' : 'BEARISH DOWNWARD SPIKE',
        displayAction: asset.upsideScenario?.action || (isBuy ? 'LONG' : 'SHORT'),
        displayExpectedMove: asset.upsideScenario?.expectedMove || asset.expectedMove || '+50 to +85 pips',
        displayTarget: asset.upsideScenario?.targetPrice || (isBuy ? 'Upside Breakout' : 'Downside Breakdown'),
        displayRationale: asset.upsideScenario?.rationale || upsideResolved?.rationale || asset.transmissionRationale,
        isBasePair,
        isQuotePair,
      };
    }

    if (activeScenarioView === 'DOWNSIDE') {
      // Downside Miss scenario (Dovish / currency weakness)
      const downsideResolved = event ? resolveAssetTransmissionVector(asset, event, false, true) : null;
      const isBuy = downsideResolved?.directive.includes('BUY') ?? (isBasePair ? false : isQuotePair ? true : false);

      return {
        ...asset,
        displayDirective: isBuy ? 'BUY' : 'SELL',
        displaySpikeLabel: isBuy ? 'BULLISH UPWARD SPIKE' : 'BEARISH DOWNWARD SPIKE',
        displayAction: asset.downsideScenario?.action || (isBuy ? 'LONG' : 'SHORT'),
        displayExpectedMove: asset.downsideScenario?.expectedMove || asset.expectedMove || '-50 to -85 pips',
        displayTarget: asset.downsideScenario?.targetPrice || (isBuy ? 'Upside Squeeze' : 'Downside Flush'),
        displayRationale: asset.downsideScenario?.rationale || downsideResolved?.rationale || asset.transmissionRationale,
        isBasePair,
        isQuotePair,
      };
    }

    // Baseline Model Expectation (Nowcast / Synthesis)
    const matchingDecisionItem = directionDecision?.affectedPairs.find(p => p.symbol.toUpperCase() === sym);
    const isBuy = matchingDecisionItem 
      ? matchingDecisionItem.directive.includes('BUY')
      : (asset.actionDirective?.includes('BUY') || asset.action.includes('BUY') || asset.action.includes('LONG') || asset.bias.includes('BUY'));

    return {
      ...asset,
      displayDirective: matchingDecisionItem ? matchingDecisionItem.directive : (isBuy ? (asset.actionDirective || 'BUY') : (asset.actionDirective || 'SELL')),
      displaySpikeLabel: isBuy ? 'BULLISH UPWARD SPIKE' : 'BEARISH DOWNWARD SPIKE',
      displayAction: matchingDecisionItem ? matchingDecisionItem.action : asset.action,
      displayExpectedMove: matchingDecisionItem?.expectedMove || asset.expectedMove,
      displayTarget: matchingDecisionItem?.targetZone || asset.triggerCondition || (isBuy ? 'Breakout Target' : 'Support Breakdown'),
      displayRationale: matchingDecisionItem?.playbookRule || asset.tacticalNote || asset.transmissionRationale,
      isBasePair,
      isQuotePair,
    };
  });

  const buyCount = displayedAssets.filter(
    (a) => a.displayDirective.includes('BUY') || a.displayAction.includes('BUY') || a.displayAction.includes('LONG')
  ).length;

  const sellCount = displayedAssets.length - buyCount;

  return (
    <div className="space-y-4">
      {/* Master Pre-Release Expectation Matrix & Synthesis Banner */}
      <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl p-4 shadow-sm relative overflow-hidden">
        {/* Pre-Release Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e2dcd2]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-sky-900 tracking-wider font-mono">
                  Cross-Asset Transmission & Order Routing Engine
                </span>
                {!isReleased ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 font-bold animate-pulse">
                    <Zap className="w-3 h-3 text-emerald-700" />
                    PRE-RELEASE EXPECTATION MATRIX ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1 font-bold">
                    <Radio className="w-3 h-3 text-blue-700" />
                    LIVE STREAMING RELEASE
                  </span>
                )}
                {playbookTopic && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1 font-bold">
                    <BookOpen className="w-3 h-3 text-purple-700" />
                    Macro Playbook: {playbookTopic.shortTitle || playbookTopic.title}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-1 font-sans flex items-center gap-2">
                <span>{evaluationResult.verdictLabel}</span>
              </h2>
            </div>
          </div>

          {/* Real-Time Buy / Sell Directional Counter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-mono font-bold text-xs">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
              <span>{buyCount} {isReleased ? 'BUY' : 'EXP BUY'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 font-mono font-bold text-xs">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-700" />
              <span>{sellCount} {isReleased ? 'SELL' : 'EXP SELL'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-[#f6f2ea] border border-[#e2dcd2] px-2.5 py-1 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">
                {isReleased ? 'Confidence' : 'Expectation Conf'}
              </span>
              <span className="font-mono text-xs font-bold text-sky-900">
                {evaluationResult.confidenceScore}%
              </span>
            </div>
          </div>
        </div>

        {/* OTIVO AI Macro Synthesis & Institutional Playbook Final Decision Block */}
        {directionDecision && (
          <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 border border-sky-200">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-100">
              <div className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-sky-700" />
                <span className="text-xs font-bold text-slate-900 font-sans">
                  OTIVO AI Macro Synthesis & Institutional Playbook Final Decision:
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                directionDecision.bias === 'BULLISH' 
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                  : directionDecision.bias === 'BEARISH'
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {directionDecision.verdict} ({directionDecision.confidencePercent}% Confidence)
              </span>
            </div>

            <div className="mt-2 text-xs text-slate-800 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Primary Transmission Vector:</span>
                <span className="font-medium text-sky-950">{directionDecision.primaryTransmissionVector}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">News Volatility Window & Horizon:</span>
                <span className="font-mono text-[11px] text-slate-700">{directionDecision.horizon}</span>
              </div>
            </div>
          </div>
        )}

        {/* Base vs Quote Inversion Rule Guide */}
        <div className="mt-2.5 p-2 rounded-lg bg-[#f9f7f2] border border-[#ded5c6] text-[11px] text-slate-700 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-sans">
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-700 flex-shrink-0" />
            <span>
              <strong>Base vs Quote Inversion Rule:</strong> When news drives <span className="font-mono font-bold text-slate-900">{eventCurrency}</span>, Direct Base pairs (e.g. {eventCurrency}/USD) and Inverse Quote pairs (e.g. EUR/{eventCurrency}) trade in strictly opposite directions.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            {eventCurrency}/USD (BUY) ⇄ EUR/{eventCurrency} (SELL)
          </span>
        </div>

        {/* Interactive Filter and Scenario Selectors */}
        <div className="mt-3 pt-3 border-t border-[#e2dcd2] flex flex-wrap items-center justify-between gap-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 text-[11px] font-mono flex-wrap">
            <span className="text-slate-500 font-bold text-[10px] uppercase mr-1">Filter:</span>
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-[#f6f2ea] text-slate-700 hover:text-slate-900 border border-[#e2dcd2]'
              }`}
            >
              All Assets ({evaluationResult.assetImpacts.length})
            </button>
            <button
              onClick={() => setCategoryFilter('FX_BASE')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                categoryFilter === 'FX_BASE'
                  ? 'bg-sky-800 text-white font-bold'
                  : 'bg-[#f6f2ea] text-slate-700 hover:text-slate-900 border border-[#e2dcd2]'
              }`}
            >
              Direct ({eventCurrency}/XXX)
            </button>
            <button
              onClick={() => setCategoryFilter('FX_QUOTE')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                categoryFilter === 'FX_QUOTE'
                  ? 'bg-purple-800 text-white font-bold'
                  : 'bg-[#f6f2ea] text-slate-700 hover:text-slate-900 border border-[#e2dcd2]'
              }`}
            >
              Inverse (XXX/{eventCurrency})
            </button>
            <button
              onClick={() => setCategoryFilter('YIELDS')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                categoryFilter === 'YIELDS'
                  ? 'bg-amber-800 text-white font-bold'
                  : 'bg-[#f6f2ea] text-slate-700 hover:text-slate-900 border border-[#e2dcd2]'
              }`}
            >
              Yields
            </button>
            <button
              onClick={() => setCategoryFilter('COMMODITIES')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                categoryFilter === 'COMMODITIES'
                  ? 'bg-emerald-800 text-white font-bold'
                  : 'bg-[#f6f2ea] text-slate-700 hover:text-slate-900 border border-[#e2dcd2]'
              }`}
            >
              Commodities
            </button>
            <button
              onClick={() => setCategoryFilter('EQUITIES')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                categoryFilter === 'EQUITIES'
                  ? 'bg-indigo-800 text-white font-bold'
                  : 'bg-[#f6f2ea] text-slate-700 hover:text-slate-900 border border-[#e2dcd2]'
              }`}
            >
              Equities
            </button>
          </div>

          {/* Scenario View Selector */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
            <button
              onClick={() => setActiveScenarioView('BASELINE')}
              className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1 cursor-pointer ${
                activeScenarioView === 'BASELINE'
                  ? 'bg-sky-100 text-sky-900 border border-sky-300 font-bold shadow-2xs'
                  : 'bg-[#f6f2ea] text-slate-700 hover:text-slate-900 border border-[#e2dcd2]'
              }`}
            >
              <span>AI Baseline Expectation Spike</span>
            </button>
            <button
              onClick={() => setActiveScenarioView('UPSIDE')}
              className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1 cursor-pointer ${
                activeScenarioView === 'UPSIDE'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300 font-bold shadow-2xs'
                  : 'bg-[#f6f2ea] text-slate-700 hover:text-slate-900 border border-[#e2dcd2]'
              }`}
            >
              <span>Hawkish Beat Vector (+70-115 pips)</span>
            </button>
            <button
              onClick={() => setActiveScenarioView('DOWNSIDE')}
              className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1 cursor-pointer ${
                activeScenarioView === 'DOWNSIDE'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold shadow-2xs'
                  : 'bg-[#f6f2ea] text-slate-700 hover:text-slate-900 border border-[#e2dcd2]'
              }`}
            >
              <span>Dovish Miss Vector (-70-115 pips)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {displayedAssets.map((asset) => {
          const isSelected = selectedAssetSymbol === asset.symbol;
          const isBuy = asset.displayDirective.includes('BUY') || asset.displayAction.includes('BUY') || asset.displayAction.includes('LONG');
          const isSell = !isBuy;

          return (
            <div
              key={asset.symbol}
              onClick={() => onSelectAsset?.(asset.symbol)}
              className={`bg-[#ffffff] border rounded-xl p-3.5 transition duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-sky-600 ring-2 ring-sky-500/20 shadow-md'
                  : 'border-[#e2dcd2] hover:border-[#cbc1b0] shadow-xs hover:shadow-sm'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#e8e2d8]">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-mono font-bold text-sm text-slate-900">
                        {asset.symbol}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {asset.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#f1ebe0] text-slate-700 border border-[#ded5c6]">
                        {asset.executionRank || 'Rank #1'}
                      </span>
                      {asset.isBasePair && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-50 text-sky-900 border border-sky-200">
                          DIRECT BASE ({eventCurrency})
                        </span>
                      )}
                      {asset.isQuotePair && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-50 text-purple-900 border border-purple-200 font-bold">
                          INVERSE QUOTE (XXX/{eventCurrency})
                        </span>
                      )}
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {asset.transmissionSpeed || 'INSTANT (0-30s)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span
                      className={`px-2.5 py-0.8 rounded-md font-mono font-bold text-xs flex items-center gap-1 ${
                        isBuy
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isSell
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                    >
                      {isBuy ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-700" />}
                      {asset.displayDirective}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                      CONFIDENCE: <strong className="text-slate-800">{asset.confidence}%</strong>
                    </span>
                  </div>
                </div>

                {/* News Direction Spike Badge */}
                <div className="mb-2 px-2.5 py-1 rounded bg-[#faf8f4] border border-[#e8e2d8] flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] text-slate-600 font-sans font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600" />
                    News Direction Spike:
                  </span>
                  <span className={`font-bold ${isBuy ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {asset.displaySpikeLabel}
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 bg-[#faf8f4] p-2 rounded-lg border border-[#e8e2d8] text-xs font-mono">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Tactical Action</span>
                    <span className={`font-bold ${isBuy ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {asset.displayAction}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Expected Move</span>
                    <span className="font-bold text-slate-900">{asset.displayExpectedMove}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Target / Trigger</span>
                    <span className="font-bold text-sky-900 truncate block">{asset.displayTarget}</span>
                  </div>
                </div>

                {/* Playbook Directive / Rationale */}
                {asset.displayRationale && (
                  <div className="mt-2.5 p-2 rounded-lg bg-[#fcfaf5] border border-[#eee5d8] text-[11px] text-slate-800 leading-relaxed font-sans">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-900 mb-0.5 font-mono">
                      <BookOpen className="w-2.5 h-2.5 text-amber-700" />
                      <span>{isReleased ? 'LIVE REAL-TIME DIRECTIVE' : 'MACRO PLAYBOOK TRANSMISSION RULE'}</span>
                    </div>
                    {asset.displayRationale}
                  </div>
                )}
              </div>

              {/* Invalidation Trigger */}
              {asset.invalidationTrigger && (
                <div className="mt-2 pt-2 border-t border-[#e8e2d8] flex items-start gap-1.5 text-[10px] text-slate-600 font-sans">
                  <ShieldAlert className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Invalidation Trigger:</strong> {asset.invalidationTrigger}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
