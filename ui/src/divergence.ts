import type { Reading, StoryEvent } from './types';

export interface EventDivergence {
  eventId: string;
  sig1: number;
  sig2: number;
  diff: number;
}

/**
 * Compute per-event divergence between two readings.
 * Returns events sorted by divergence (highest first).
 */
export function computeEventDivergence(
  r1: Reading,
  r2: Reading,
  events: Record<string, StoryEvent>,
): EventDivergence[] {
  const result: EventDivergence[] = [];

  for (const eventId of Object.keys(events)) {
    const sig1 = r1.eventSignificance[eventId]?.significance ?? 0;
    const sig2 = r2.eventSignificance[eventId]?.significance ?? 0;
    result.push({
      eventId,
      sig1,
      sig2,
      diff: Math.abs(sig1 - sig2),
    });
  }

  return result.sort((a, b) => b.diff - a.diff);
}

/**
 * Build a map from eventId to divergence value for quick lookup.
 */
export function buildDivergenceMap(
  divergences: EventDivergence[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of divergences) {
    map.set(d.eventId, d.diff);
  }
  return map;
}
