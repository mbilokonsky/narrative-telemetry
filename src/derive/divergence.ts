import { Reading, EventID, NarrativeEntityID } from '../types';

export interface EventDivergence {
  eventId: EventID;
  reading1Significance: number;
  reading2Significance: number;
  diff: number;
}

export interface EntityDivergence {
  entityId: NarrativeEntityID;
  reading1Significance: number;
  reading2Significance: number;
  diff: number;
}

export interface DivergenceMap {
  reading1Name: string;
  reading2Name: string;
  events: EventDivergence[];
  entities: EntityDivergence[];
  meanEventDivergence: number;
  maxEventDivergence: number;
  topDivergentEvents: EventDivergence[];  // top N by diff
  divergentEventCount: number;            // events with diff > threshold
}

/**
 * Compare two readings of the same text.
 *
 * Per-event: |r1.significance[eventId] - r2.significance[eventId]|
 * Per-entity: same
 * Aggregate: mean divergence, max divergence, top-N most divergent events
 */
export function computeDivergence(
  r1: Reading,
  r2: Reading,
  options: { topN?: number; threshold?: number } = {},
): DivergenceMap {
  const topN = options.topN ?? 10;
  const threshold = options.threshold ?? 0.2;

  // Event divergence — union of all event IDs from both readings
  const allEventIds = new Set([
    ...Object.keys(r1.eventSignificance),
    ...Object.keys(r2.eventSignificance),
  ]);

  const events: EventDivergence[] = [];
  for (const eventId of allEventIds) {
    const s1 = r1.eventSignificance[eventId]?.significance ?? 0;
    const s2 = r2.eventSignificance[eventId]?.significance ?? 0;
    events.push({
      eventId,
      reading1Significance: s1,
      reading2Significance: s2,
      diff: Math.abs(s1 - s2),
    });
  }

  // Entity divergence — union of all entity IDs
  const allEntityIds = new Set([
    ...Object.keys(r1.entitySignificance),
    ...Object.keys(r2.entitySignificance),
  ]);

  const entities: EntityDivergence[] = [];
  for (const entityId of allEntityIds) {
    const s1 = r1.entitySignificance[entityId]?.significance ?? 0;
    const s2 = r2.entitySignificance[entityId]?.significance ?? 0;
    entities.push({
      entityId,
      reading1Significance: s1,
      reading2Significance: s2,
      diff: Math.abs(s1 - s2),
    });
  }

  // Aggregates
  const diffs = events.map(e => e.diff);
  const meanEventDivergence = diffs.length > 0
    ? diffs.reduce((a, b) => a + b, 0) / diffs.length
    : 0;
  const maxEventDivergence = diffs.length > 0 ? Math.max(...diffs) : 0;

  const sortedEvents = [...events].sort((a, b) => b.diff - a.diff);
  const topDivergentEvents = sortedEvents.slice(0, topN);
  const divergentEventCount = events.filter(e => e.diff > threshold).length;

  return {
    reading1Name: r1.name,
    reading2Name: r2.name,
    events,
    entities,
    meanEventDivergence,
    maxEventDivergence,
    topDivergentEvents,
    divergentEventCount,
  };
}
