"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTraceId = generateTraceId;
exports.generateSpanId = generateSpanId;
exports.storyModelToOtel = storyModelToOtel;
exports.readingToAttributes = readingToAttributes;
const crypto = __importStar(require("crypto"));
const types_1 = require("../types");
// ── Constants ──
const DEFAULT_DURATION_NS = 3600000000000; // 1 hour in nanoseconds
// ── Helpers ──
function hashToHex(input, bytes) {
    return crypto.createHash('sha256').update(input).digest('hex').slice(0, bytes * 2);
}
/** Generate a reproducible 16-byte trace ID from title+author. */
function generateTraceId(title, author) {
    return hashToHex(`${title}::${author}`, 16);
}
/** Generate a reproducible 8-byte span ID from traceId+spanId. */
function generateSpanId(traceId, spanId) {
    return hashToHex(`${traceId}::${spanId}`, 8);
}
/** Convert a percentage (0–100) to nanosecond timestamp. */
function pctToNano(pct, baseTimeNs, durationNs) {
    const offset = (durationNs * BigInt(Math.round(pct * 1000))) / 100000n;
    return (baseTimeNs + offset).toString();
}
/** Build an OTEL attribute from key+value. */
function attr(key, value) {
    if (typeof value === 'string')
        return { key, value: { stringValue: value } };
    if (typeof value === 'boolean')
        return { key, value: { boolValue: value } };
    if (typeof value === 'number') {
        if (Number.isInteger(value))
            return { key, value: { intValue: String(value) } };
        return { key, value: { doubleValue: value } };
    }
    if (Array.isArray(value)) {
        return {
            key,
            value: {
                arrayValue: {
                    values: value.map(v => ({ stringValue: v })),
                },
            },
        };
    }
    return { key, value: { stringValue: String(value) } };
}
/**
 * Map a StoryModel to an OtelTrace.
 *
 * Each StorySpan becomes an OTEL Span. Each Event becomes an OTEL Event
 * attached to its containing span. Reading annotations (significance, themes)
 * become span/event attributes.
 */
function storyModelToOtel(model, options = {}) {
    const { text, readings } = model;
    const traceId = generateTraceId(text.title, text.author);
    const baseTimeSec = options.baseTime ?? Math.floor(Date.now() / 1000);
    const durationSec = options.durationSeconds ?? 3600;
    const baseTimeNs = BigInt(baseTimeSec) * 1000000000n;
    const durationNs = BigInt(durationSec) * 1000000000n;
    // Pick reading for attribute enrichment
    const readingNames = Object.keys(readings);
    const activeReadingName = options.readingName ?? readingNames[0];
    const activeReading = activeReadingName ? readings[activeReadingName] : undefined;
    // Build event lookup: eventId → Event
    const eventMap = text.events;
    // Build span→events index from the span tree
    const otelSpans = [];
    function walkSpan(span, parentOtelSpanId) {
        const otelSpanId = generateSpanId(traceId, span.id);
        // Collect events for this span
        const spanEvents = span.events
            .map(eid => eventMap[eid])
            .filter((e) => !!e)
            .map(ev => mapEvent(ev, baseTimeNs, durationNs, activeReading));
        // Span attributes
        const spanAttrs = [
            attr('narrative.span.type', span.type),
            attr('narrative.span.title', span.title),
            attr('narrative.span.id', span.id),
            attr('narrative.span.event_count', span.events.length),
            attr('narrative.span.child_count', span.childSpans.length),
        ];
        if (span.description)
            spanAttrs.push(attr('narrative.span.description', span.description));
        // Reading-level span annotations
        if (activeReading && activeReading.spanAnnotations[span.id]) {
            const sa = activeReading.spanAnnotations[span.id];
            if (sa.tension !== undefined)
                spanAttrs.push(attr('narrative.reading.tension', sa.tension));
            if (sa.note)
                spanAttrs.push(attr('narrative.reading.note', sa.note));
            if (sa.dominantElements?.length) {
                spanAttrs.push(attr('narrative.reading.dominant_elements', sa.dominantElements));
            }
            if (sa.pacing) {
                spanAttrs.push(attr('narrative.reading.pacing.pace', sa.pacing.pace));
                spanAttrs.push(attr('narrative.reading.pacing.tension', sa.pacing.tensionLevel));
            }
        }
        // Reading-level themes/symbols on root span
        if (activeReading && span.type === types_1.StorySpanType.STORY) {
            const readingAttrs = readingToAttributes(activeReading);
            spanAttrs.push(...readingAttrs);
        }
        // Determine status: 'Ok' if no unresolved absentials reference this span's events
        const statusCode = 1; // STATUS_CODE_OK — we default to Ok
        const otelSpan = {
            traceId,
            spanId: otelSpanId,
            ...(parentOtelSpanId ? { parentSpanId: parentOtelSpanId } : {}),
            name: `${span.type}: ${span.title}`,
            startTimeUnixNano: pctToNano(span.startTimestamp.percentage, baseTimeNs, durationNs),
            endTimeUnixNano: pctToNano(span.endTimestamp.percentage, baseTimeNs, durationNs),
            attributes: spanAttrs,
            events: spanEvents,
            status: { code: statusCode },
        };
        otelSpans.push(otelSpan);
        // Recurse into children
        for (const child of span.childSpans) {
            walkSpan(child, otelSpanId);
        }
    }
    walkSpan(text.rootSpan);
    return { traceId, spans: otelSpans };
}
/** Map a narrative Event to an OTEL Event. */
function mapEvent(ev, baseTimeNs, durationNs, reading) {
    const eventAttrs = [
        attr('narrative.event.id', ev.id),
        attr('narrative.event.type', ev.type),
        attr('narrative.event.description', ev.description),
        attr('narrative.event.timestamp_pct', ev.timestamp.percentage),
    ];
    if (ev.participants.length > 0) {
        eventAttrs.push(attr('narrative.event.participants', ev.participants));
    }
    if (ev.textLocation) {
        eventAttrs.push(attr('narrative.event.start_line', ev.textLocation.startLine));
        eventAttrs.push(attr('narrative.event.end_line', ev.textLocation.endLine));
    }
    // Reading significance
    if (reading && reading.eventSignificance[ev.id]) {
        const sig = reading.eventSignificance[ev.id];
        eventAttrs.push(attr('narrative.reading.significance', sig.significance));
        if (sig.note)
            eventAttrs.push(attr('narrative.reading.note', sig.note));
    }
    return {
        name: ev.description,
        timeUnixNano: pctToNano(ev.timestamp.percentage, baseTimeNs, durationNs),
        attributes: eventAttrs,
    };
}
/** Extract flat attributes from a Reading for attachment to spans. */
function readingToAttributes(reading) {
    const attrs = [];
    attrs.push(attr('narrative.reading.name', reading.name));
    if (reading.description)
        attrs.push(attr('narrative.reading.description', reading.description));
    // Themes
    const themeNames = Object.values(reading.themes).map(t => t.name);
    if (themeNames.length > 0)
        attrs.push(attr('narrative.reading.themes', themeNames));
    // Symbols
    const symbolNames = Object.values(reading.symbols).map(s => s.name);
    if (symbolNames.length > 0)
        attrs.push(attr('narrative.reading.symbols', symbolNames));
    // Global tension summary
    if (reading.globalTension.length > 0) {
        const peakTension = Math.max(...reading.globalTension.map(t => t.value));
        attrs.push(attr('narrative.reading.peak_tension', peakTension));
        attrs.push(attr('narrative.reading.tension_points', reading.globalTension.length));
    }
    return attrs;
}
