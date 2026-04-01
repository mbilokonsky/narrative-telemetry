"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeDivergence = computeDivergence;
/**
 * Compare two readings of the same text.
 *
 * Per-event: |r1.significance[eventId] - r2.significance[eventId]|
 * Per-entity: same
 * Aggregate: mean divergence, max divergence, top-N most divergent events
 */
function computeDivergence(r1, r2, options = {}) {
    const topN = options.topN ?? 10;
    const threshold = options.threshold ?? 0.2;
    // Event divergence — union of all event IDs from both readings
    const allEventIds = new Set([
        ...Object.keys(r1.eventSignificance),
        ...Object.keys(r2.eventSignificance),
    ]);
    const events = [];
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
    const entities = [];
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
