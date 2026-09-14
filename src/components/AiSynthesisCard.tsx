import React, { useState } from 'react';
import { 
  BrainCircuit, 
  ShieldAlert, 
  CheckCircle2, 
  Zap, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target,
  Scale
} from 'lucide-react';
import { AiSynthesis } from '../types';

interface AiSynthesisCardProps {
  aiSynthesis: AiSynthesis;
}

export const AiSynthesisCard: React.FC<AiSynthesisCardProps> = ({ aiSynthesis }) => {
  const [imgError, setImgError] = useState(false);
  const decision = aiSynthesis.directionSpikeDecision;

  return (
    <div 
      id="ai-deep-synthesis-section"
      className="bg-[#ffffff] border-2 border-emerald-600/60 ring-4 ring-emerald-500/10 rounded-xl p-4 sm:p-5 shadow-md space-y-3.5 relative overflow-hidden transition-all duration-500 scroll-mt-20 animate-in fade-in-50 slide-in-from-top-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#e2dcd2] relative z-10">
        <div className="flex items-center gap-2.5">
          {!imgError ? (
            <div className="w-7 h-7 rounded-lg bg-[#faf8f4] border border-[#ded5c6] flex items-center justify-center p-0.5 shadow-2xs overflow-hidden">
              <img
                src="/ai.png"
                alt="OTIVO AI"
                className="w-full h-full object-contain rounded"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <BrainCircuit className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-sans">
                OTIVO AI Macro Synthesis & Institutional Playbook
              </h3>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-300">
                PRO ENGINE
              </span>
              {decision?.groundedPlaybookTopic && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
                  <BookOpen className="w-2.5 h-2.5 text-purple-700" />
                  {decision.groundedPlaybookTopic}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-600 font-mono">
              Autonomous Deep Macro Reasoning, Expectation Skew & Order Flow Directives
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {decision && (
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
              decision.bias === 'BULLISH'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : decision.bias === 'BEARISH'
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              <Zap className="w-3 h-3" />
              {decision.verdict} ({decision.confidencePercent}% Confidence)
            </span>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            Live Deep Reasoning
          </span>
        </div>
      </div>

      {/* Direction Spike Decision Banner if available */}
      {decision && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-[#f7fbff] to-[#f4f7fa] border border-sky-200 text-xs text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-sky-100">
            <span className="font-mono font-bold uppercase text-[10px] text-sky-900 tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-600" />
              Direction Spike Master Decision & Playbook Grounding
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              Horizon: <strong>{decision.horizon}</strong>
            </span>
          </div>

          <p className="text-slate-800 font-sans leading-relaxed mb-2 font-medium">
            {decision.primaryTransmissionVector}
          </p>

          {/* Affected Market Pairs Decision Matrix */}
          {decision.affectedPairs && decision.affectedPairs.length > 0 && (
            <div className="mt-2 pt-2 border-t border-sky-100">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-1.5">
                All Affected Market Pairs News Direction Spike:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {decision.affectedPairs.map((pair) => {
                  const isBuy = pair.directive.includes('BUY') || pair.action.includes('LONG') || pair.action.includes('BUY');
                  return (
                    <div 
                      key={pair.symbol} 
                      className={`p-2 rounded border text-[11px] font-mono flex flex-col justify-between ${
                        isBuy 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                          : 'bg-rose-50/70 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900">{pair.symbol}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          isBuy ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                        }`}>
                          {pair.action}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-700">{pair.expectedMove}</span>
                        <span className="text-slate-500">{pair.confidence}% Conf</span>
                      </div>
                      <div className="mt-1 text-[9px] text-slate-600 truncate" title={pair.playbookRule}>
                        {pair.targetZone}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Macro Summary */}
      <div className="p-3 rounded-lg bg-[#faf8f4] border border-[#e8e2d8] relative z-10">
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-serif">
          {aiSynthesis.macroSummary}
        </p>
      </div>

      {/* Grid: Key Tactical Risks & Execution Playbook */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 relative z-10">
        {/* Tactical Risks */}
        <div className="bg-[#fdfaf5] p-3 rounded-lg border border-amber-200 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-[11px] uppercase font-bold text-amber-900 tracking-wider font-mono">
              Key Tactical Risks & Invalidation
            </span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
            {aiSynthesis.keyRisks.map((risk, idx) => (
              <li key={idx} className="leading-tight marker:text-amber-600">
                <span className="font-sans text-slate-800">{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Execution Playbook */}
        <div className="bg-[#f6f9fc] p-3 rounded-lg border border-sky-200 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-sky-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
            <span className="text-[11px] uppercase font-bold text-sky-900 tracking-wider font-mono">
              Execution Playbook & Order Flow
            </span>
          </div>
          <ol className="space-y-1.5 text-xs text-slate-700 list-decimal list-inside font-mono">
            {aiSynthesis.playbookSteps.map((step, idx) => (
              <li key={idx} className="leading-tight">
                <span className="font-sans text-slate-800">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
