"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coarseGrain = coarseGrain;
/**
 * Aggregate beat-level event significance up through the span tree.
 *
 * Scene significance = mean of its beat-level event significances
 * Act significance = mean of its scene significances
 */
function coarseGrain(rootSpan, reading) {
    return computeSpanSignificance(rootSpan, reading);
}
function computeSpanSignificance(span, reading) {
    // Recursively compute children first
    const children = span.childSpans.map(child => computeSpanSignificance(child, reading));
    // Collect direct event significances
    const directSigs = span.events
        .map(eid => reading.eventSignificance[eid]?.significance)
        .filter((s) => s !== undefined);
    let meanSignificance;
    let eventCount;
    if (children.length > 0) {
        // Non-leaf: average of children's mean significances (weighted by event count)
        const totalEvents = children.reduce((sum, c) => sum + c.eventCount, 0) + directSigs.length;
        const weightedSum = children.reduce((sum, c) => sum + c.meanSignificance * c.eventCount, 0)
            + directSigs.reduce((sum, s) => sum + s, 0);
        meanSignificance = totalEvents > 0 ? weightedSum / totalEvents : 0;
        eventCount = totalEvents;
    }
    else {
        // Leaf span: average of its own events
        meanSignificance = directSigs.length > 0
            ? directSigs.reduce((sum, s) => sum + s, 0) / directSigs.length
            : 0;
        eventCount = directSigs.length;
    }
    return {
        spanId: span.id,
        title: span.title,
        type: span.type,
        meanSignificance,
        eventCount,
        children,
    };
}
