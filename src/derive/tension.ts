import { TextModel, Reading, Timestamp } from '../types';

export interface TensionPoint {
  timestamp: Timestamp;
  tension: number;
}

/**
 * Compute a tension curve from absential significance and resolution timing.
 *
 * tension(t) = Σ( significance(absential) × active(absential, t) )
 *
 * An absential contributes tension from when it's introduced until its status
 * changes to a resolved state. We read introduction time from stateHistory[0]
 * and resolution time from the first resolved state entry.
 */
export function computeTensionCurve(
  textModel: TextModel,
  reading: Reading,
  steps: number = 20,
): TensionPoint[] {
  const absentials = Object.values(textModel.absentials);
  if (absentials.length === 0) return [];

  // Build absential intervals: [introductionPct, resolutionPct]
  const intervals: Array<{
    id: string;
    significance: number;
    startPct: number;
    endPct: number;
  }> = [];

  for (const abs of absentials) {
    const sig = reading.absentialSignificance[abs.id]?.significance ?? 0.3;
    const startPct = abs.stateHistory[0]?.timestamp.percentage ?? 0;

    // Find resolution: first state with a resolved status
    let endPct = 100; // default: never resolved within the story
    for (const state of abs.stateHistory) {
      const status = state.data.status;
      if (
        status === 'resolved_satisfied' ||
        status === 'resolved_blocked' ||
        status === 'resolved_mixed' ||
        status === 'canceled'
      ) {
        endPct = state.timestamp.percentage;
        break;
      }
    }

    intervals.push({ id: abs.id, significance: sig, startPct, endPct });
  }

  // Sample tension at regular intervals
  const points: TensionPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const pct = (i / steps) * 100;
    let tension = 0;
    for (const interval of intervals) {
      if (pct >= interval.startPct && pct <= interval.endPct) {
        tension += interval.significance;
      }
    }
    points.push({ timestamp: { percentage: pct }, tension });
  }

  // Normalize so max = 1
  const maxTension = Math.max(...points.map(p => p.tension), 1);
  for (const p of points) {
    p.tension = p.tension / maxTension;
  }

  return points;
}
