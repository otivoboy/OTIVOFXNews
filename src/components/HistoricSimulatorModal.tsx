import React from 'react';
import { 
  X, 
  History, 
  Play, 
  ArrowRight, 
  Calendar, 
  Flame, 
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { HistoricScenario } from '../types';
import { HISTORIC_SCENARIOS } from '../engines/Evaluator';
import { ForexFactoryIcon } from './ForexFactoryIcon';

interface HistoricSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: HistoricScenario) => void;
}

export const HistoricSimulatorModal: React.FC<HistoricSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b111a] border border-[#223046] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2738] bg-[#0d1522]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Historic Macro Release Sandbox
              </h3>
              <p className="text-xs text-slate-400">
                Replay major historical macroeconomic releases to evaluate confirmation logic and market impact
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios List */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 scrollbar-thin">
          {HISTORIC_SCENARIOS.map((scenario) => {
            return (
              <div
                key={scenario.id}
                className="bg-[#0e1624] border border-[#1d2b3f] hover:border-cyan-500/50 rounded-xl p-4 transition group relative"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-[#1a2638]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ForexFactoryIcon impact="HIGH" className="w-4 h-3.5 drop-shadow-[0_0_4px_rgba(255,0,0,0.5)]" />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-bold">
                        {scenario.eventCode}
                      </span>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {scenario.date}
                      </span>
                      <span className="text-xs text-slate-300 font-medium">{scenario.country}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                      {scenario.name}
                    </h4>
                  </div>

                  <button
                    onClick={() => {
                      onSelectScenario(scenario);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition shadow-md shadow-cyan-950/40"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load & Evaluate</span>
                  </button>
                </div>

                {/* Event numbers */}
                <div className="grid grid-cols-3 gap-2 my-2.5 py-1.5 px-3 rounded-lg bg-[#070c14] border border-[#141e2c] text-xs font-mono-num">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Actual Print</span>
                    <div className="text-emerald-400 font-bold mt-0.5">
                      {scenario.eventData.actual}{scenario.eventData.unit}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Forecast</span>
                    <div className="text-slate-300 font-medium mt-0.5">
                      {scenario.eventData.forecast}{scenario.eventData.unit}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Prior</span>
                    <div className="text-slate-400 mt-0.5">
                      {scenario.eventData.previous}{scenario.eventData.unit}
                    </div>
                  </div>
                </div>

                {/* Context description */}
                <div className="space-y-1 text-xs">
                  <p className="text-slate-300 leading-relaxed">
                    <strong className="text-slate-200">Context: </strong>
                    {scenario.contextSummary}
                  </p>
                  <div className="bg-[#09111c] p-2 rounded border border-slate-800 text-[11px] text-emerald-300 font-mono">
                    <strong>Historical Market Reaction: </strong>
                    {scenario.marketOutcome}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1c2738] bg-[#0d1522] flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
