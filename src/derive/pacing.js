"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePacing = computePacing;
/**
 * Compute pacing metrics: event density per span.
 *
 * High density = fast pacing (lots happening per unit of story-time).
 * Low density = slow/reflective.
 */
function computePacing(rootSpan, textModel) {
    return computeSpanPacing(rootSpan, textModel);
}
function countAllEvents(span) {
    const direct = span.events.length;
    const nested = span.childSpans.reduce((sum, child) => sum + countAllEvents(child), 0);
    return direct + nested;
}
function computeSpanPacing(span, textModel) {
    const children = span.childSpans.map(child => computeSpanPacing(child, textModel));
    const spanDuration = span.endTimestamp.percentage - span.startTimestamp.percentage;
    const eventCount = countAllEvents(span);
    const eventDensity = spanDuration > 0 ? eventCount / spanDuration : 0;
    return {
        spanId: span.id,
        title: span.title,
        type: span.type,
        eventDensity,
        spanDuration,
        eventCount,
        children,
    };
}
