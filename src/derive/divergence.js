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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const topN = (_a = options.topN) !== null && _a !== void 0 ? _a : 10;
    const threshold = (_b = options.threshold) !== null && _b !== void 0 ? _b : 0.2;
    // Event divergence — union of all event IDs from both readings
    const allEventIds = new Set([
        ...Object.keys(r1.eventSignificance),
        ...Object.keys(r2.eventSignificance),
    ]);
    const events = [];
    for (const eventId of allEventIds) {
        const s1 = (_d = (_c = r1.eventSignificance[eventId]) === null || _c === void 0 ? void 0 : _c.significance) !== null && _d !== void 0 ? _d : 0;
        const s2 = (_f = (_e = r2.eventSignificance[eventId]) === null || _e === void 0 ? void 0 : _e.significance) !== null && _f !== void 0 ? _f : 0;
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
        const s1 = (_h = (_g = r1.entitySignificance[entityId]) === null || _g === void 0 ? void 0 : _g.significance) !== null && _h !== void 0 ? _h : 0;
        const s2 = (_k = (_j = r2.entitySignificance[entityId]) === null || _j === void 0 ? void 0 : _j.significance) !== null && _k !== void 0 ? _k : 0;
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
