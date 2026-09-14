export interface PredictionConfirmation {
  status: 'CORRECT' | 'WRONG_BEAT' | 'WRONG_MISS' | 'PENDING' | 'NO_FORECAST';
  badgeLabel: string;
  badgeTone: string; // Tailwind color styles
  pillTone: string;
  borderTone: string;
  details: string;
  delta: number | null;
  deltaStr: string;
  verdictText: string;
  isCorrect: boolean | null;
}

/**
 * Computes whether the consensus forecast prediction was correct or wrong based on actual released value.
 */
export function evaluatePredictionAccuracy(
  actual: number | null | undefined,
  forecast: number | null | undefined,
  unit: string = '',
  tolerance: number = 0.01
): PredictionConfirmation {
  // If actual is not yet released
  if (actual === null || actual === undefined) {
    return {
      status: 'PENDING',
      badgeLabel: 'Awaiting Release',
      badgeTone: 'bg-amber-100 text-amber-900 border-amber-300',
      pillTone: 'bg-amber-500/15 text-amber-800 border-amber-300',
      borderTone: 'border-amber-300',
      details: forecast !== null && forecast !== undefined ? `Consensus Forecast: ${forecast}${unit}` : 'Awaiting scheduled release data',
      delta: null,
      deltaStr: 'Pending',
      verdictText: 'PENDING DATA RELEASE',
      isCorrect: null,
    };
  }

  // If no forecast consensus existed
  if (forecast === null || forecast === undefined) {
    return {
      status: 'NO_FORECAST',
      badgeLabel: 'No Consensus',
      badgeTone: 'bg-slate-100 text-slate-700 border-slate-300',
      pillTone: 'bg-slate-500/15 text-slate-700 border-slate-300',
      borderTone: 'border-slate-300',
      details: `Actual: ${actual > 0 && unit === '%' ? '+' : ''}${actual}${unit} (Qualitative catalyst without standard numeric consensus)`,
      delta: null,
      deltaStr: 'N/A',
      verdictText: 'PUBLISHED (NO FORECAST)',
      isCorrect: null,
    };
  }

  const delta = Number((actual - forecast).toFixed(3));
  const absDelta = Math.abs(delta);

  // Epsilon check: tolerance is absolute (e.g. 0.01) or 2.5% of forecast magnitude for large numbers (like 220k claims)
  const dynamicTolerance = forecast !== 0 && Math.abs(forecast) > 5 ? Math.abs(forecast) * 0.015 : tolerance;
  const isAccurate = absDelta <= dynamicTolerance;

  const fmtVal = (v: number) => `${v > 0 && unit === '%' ? '+' : ''}${v}${unit}`;
  const fmtDelta = (d: number) => `${d > 0 ? '+' : ''}${d}${unit}`;

  if (isAccurate) {
    return {
      status: 'CORRECT',
      badgeLabel: 'Prediction Correct (In-Line)',
      badgeTone: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      pillTone: 'bg-emerald-500/20 text-emerald-900 border-emerald-300',
      borderTone: 'border-emerald-500',
      details: `Consensus prediction was ACCURATE. Actual (${fmtVal(actual)}) matched forecast (${fmtVal(forecast)}).`,
      delta: 0,
      deltaStr: '0.00 in-line',
      verdictText: 'PREDICTION ACCURATE (MATCHED CONSENSUS)',
      isCorrect: true,
    };
  }

  if (delta > 0) {
    return {
      status: 'WRONG_BEAT',
      badgeLabel: `Prediction Wrong (Beat ${fmtDelta(delta)})`,
      badgeTone: 'bg-cyan-100 text-cyan-950 border-cyan-300',
      pillTone: 'bg-cyan-500/20 text-cyan-900 border-cyan-300',
      borderTone: 'border-cyan-500',
      details: `Consensus prediction was WRONG. Actual (${fmtVal(actual)}) beat consensus forecast (${fmtVal(forecast)}) by ${fmtDelta(delta)}.`,
      delta,
      deltaStr: fmtDelta(delta),
      verdictText: `PREDICTION WRONG • BEAT CONSENSUS (${fmtDelta(delta)})`,
      isCorrect: false,
    };
  } else {
    return {
      status: 'WRONG_MISS',
      badgeLabel: `Prediction Wrong (Miss ${fmtDelta(delta)})`,
      badgeTone: 'bg-rose-100 text-rose-950 border-rose-300',
      pillTone: 'bg-rose-500/20 text-rose-900 border-rose-300',
      borderTone: 'border-rose-500',
      details: `Consensus prediction was WRONG. Actual (${fmtVal(actual)}) missed consensus forecast (${fmtVal(forecast)}) by ${fmtDelta(delta)}.`,
      delta,
      deltaStr: fmtDelta(delta),
      verdictText: `PREDICTION WRONG • MISSED CONSENSUS (${fmtDelta(delta)})`,
      isCorrect: false,
    };
  }
}
