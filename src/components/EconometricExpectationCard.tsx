import React, { useState } from 'react';
import { 
  Calculator, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Percent, 
  Layers
} from 'lucide-react';
import { MathematicalExpectation } from '../types';

interface EconometricExpectationCardProps {
  mathExp: MathematicalExpectation;
  forecastVal: number | null;
}

export const EconometricExpectationCard: React.FC<EconometricExpectationCardProps> = ({
  mathExp,
  forecastVal,
}) => {
  const [showFactorMath, setShowFactorMath] = useState(true);

  if (!mathExp) {
    return null;
  }

  const {
    calculatedModelValue,
    consensusValue,
    unit = '%',
    statisticalZScore = 0,
    netExpectedSurpriseDelta = 0,
    skewMagnitude = 'BALANCED',
    confidenceInterval = [0, 0],
    dispersionStdDev = 0.05,
    probabilities = { upsideBeatPercent: 33.3, inLineBaselinePercent: 33.4, downsideMissPercent: 33.3 },
    factors = [],
    modelMethodology,
    leadingIndicatorScore = 0,
  } = mathExp;

  const isUpside = netExpectedSurpriseDelta > 0;
  const isDownside = netExpectedSurpriseDelta < 0;

  return (
    <div className="bg-[#ffffff] border border-[#e2dcd2] rounded-xl p-4 shadow-sm h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e2dcd2]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-sky-900 tracking-wider font-mono">
                  Econometric Expectation Engine
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#f1ebe0] text-slate-800 border border-[#ded5c6]">
                  Bayesian Nowcast
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 font-sans">
                Mathematical Expectations & Probability Distributions
              </h3>
            </div>
          </div>

          <button
            onClick={() => setShowFactorMath(!showFactorMath)}
            className="text-xs px-2.5 py-1 rounded bg-[#f6f2ea] hover:bg-[#ede6d9] text-slate-800 border border-[#e2dcd2] font-mono transition flex items-center gap-1.5 cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-700" />
            <span>{showFactorMath ? 'Hide Real Math' : 'Show Real Math'}</span>
          </button>
        </div>

        {/* Mathematical Expectation Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
          {/* 1. Mathematical Model Print */}
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Calculated Model Value</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-50 text-sky-900 border border-sky-200">
                Z-Score: {statisticalZScore > 0 ? '+' : ''}{statisticalZScore}σ
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <div className="text-xl font-mono font-bold text-sky-950">
                {calculatedModelValue > 0 && unit === '%' ? '+' : ''}
                {calculatedModelValue}
                {unit}
              </div>
              <div className="text-xs font-mono text-slate-500">
                vs {forecastVal !== null ? `${forecastVal > 0 && unit === '%' ? '+' : ''}${forecastVal}${unit}` : `${consensusValue}${unit}`} cons
              </div>
            </div>
            <div className="text-[10px] text-slate-600 mt-1 font-mono">
              Net Delta: <strong className={isUpside ? 'text-rose-700' : isDownside ? 'text-emerald-700' : 'text-slate-700'}>
                {netExpectedSurpriseDelta > 0 ? `+${netExpectedSurpriseDelta}` : netExpectedSurpriseDelta}{unit}
              </strong>
            </div>
          </div>

          {/* 2. Expectation Skew Magnitude */}
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Skew Trajectory</span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                skewMagnitude?.includes('UPSIDE')
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : skewMagnitude?.includes('DOWNSIDE')
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-slate-100 text-slate-800 border border-slate-300'
              }`}>
                {skewMagnitude?.replace(/_/g, ' ') || 'BALANCED'}
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-slate-900 mt-1">
              Lead Score: {leadingIndicatorScore > 0 ? `+${leadingIndicatorScore}` : leadingIndicatorScore}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-sans">
              Method: <span className="font-mono text-slate-700">{modelMethodology || 'Bayesian Factor Nowcast'}</span>
            </div>
          </div>

          {/* 3. Confidence Interval Range */}
          <div className="bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">95% Confidence (2σ)</span>
              <span className="text-[9px] font-mono text-slate-500">Normal Dist</span>
            </div>
            <div className="text-sm font-mono font-bold text-slate-900 mt-1">
              [{confidenceInterval[0]}{unit}, {confidenceInterval[1]}{unit}]
            </div>
            <div className="text-[10px] text-slate-600 mt-1 font-mono">
              Std Dev: <strong>±{dispersionStdDev}{unit}</strong>
            </div>
          </div>
        </div>

        {/* Real Probabilities Distribution Bar */}
        <div className="mt-3 bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-sans">
              <Percent className="w-3.5 h-3.5 text-sky-700" />
              <span>Bayesian Probability Distribution:</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Σ = 100% Normalized
            </span>
          </div>

          {/* Stacked Percentage Bar */}
          <div className="h-3 rounded-full overflow-hidden flex border border-[#ded5c6] bg-slate-100">
            <div
              style={{ width: `${probabilities.upsideBeatPercent}%` }}
              className="bg-rose-500 hover:bg-rose-600 transition-all cursor-pointer"
              title={`Upside Beat: ${probabilities.upsideBeatPercent}%`}
            />
            <div
              style={{ width: `${probabilities.inLineBaselinePercent}%` }}
              className="bg-slate-400 hover:bg-slate-500 transition-all cursor-pointer"
              title={`In-Line Consensus: ${probabilities.inLineBaselinePercent}%`}
            />
            <div
              style={{ width: `${probabilities.downsideMissPercent}%` }}
              className="bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer"
              title={`Downside Miss: ${probabilities.downsideMissPercent}%`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 pt-1 text-[11px] font-mono text-center">
            <div className="bg-rose-50 text-rose-900 border border-rose-200 rounded p-1">
              <span className="text-[9px] uppercase block text-rose-700">Upside Beat</span>
              <strong>{probabilities.upsideBeatPercent}%</strong>
            </div>
            <div className="bg-slate-100 text-slate-800 border border-slate-200 rounded p-1">
              <span className="text-[9px] uppercase block text-slate-600">In Line</span>
              <strong>{probabilities.inLineBaselinePercent}%</strong>
            </div>
            <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded p-1">
              <span className="text-[9px] uppercase block text-emerald-700">Downside Miss</span>
              <strong>{probabilities.downsideMissPercent}%</strong>
            </div>
          </div>
        </div>

        {/* Granular Mathematical Factor Decomposition */}
        {showFactorMath && factors.length > 0 && (
          <div className="mt-3 bg-[#faf8f4] border border-[#e2dcd2] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-sans">
              <Layers className="w-3.5 h-3.5 text-sky-700" />
              <span>Factor Decomposition & Multi-Variable Weighting:</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              {factors.map((factor, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-[#ffffff] border border-[#e8e2d8] gap-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold">W{idx + 1}</span>
                    <span className="text-slate-800 font-sans font-medium text-xs">{factor.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">({factor.category})</span>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-slate-600 text-[11px] font-mono">{factor.value}</span>
                    <span className="text-slate-500 text-[10px]">Weight: {(factor.weight * 100).toFixed(0)}%</span>
                    <span className={`font-bold text-xs ${factor.contributionBps > 0 ? 'text-rose-700' : factor.contributionBps < 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {factor.contributionBps > 0 ? `+${factor.contributionBps} bps` : `${factor.contributionBps} bps`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
