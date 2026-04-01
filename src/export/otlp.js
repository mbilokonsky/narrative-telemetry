"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otlpExport = otlpExport;
/** Map OtelSpan attributes to OTLP format (already compatible). */
function mapAttributes(attrs) {
    return attrs;
}
function otelSpanToOtlp(span) {
    return {
        traceId: span.traceId,
        spanId: span.spanId,
        ...(span.parentSpanId ? { parentSpanId: span.parentSpanId } : {}),
        name: span.name,
        kind: 1, // SPAN_KIND_INTERNAL
        startTimeUnixNano: span.startTimeUnixNano,
        endTimeUnixNano: span.endTimeUnixNano,
        attributes: mapAttributes(span.attributes),
        events: span.events.map(ev => ({
            name: ev.name,
            timeUnixNano: ev.timeUnixNano,
            attributes: mapAttributes(ev.attributes),
        })),
        status: span.status,
    };
}
/** Convert an OtelTrace to OTLP JSON format. */
function otlpExport(trace, serviceName) {
    const request = {
        resourceSpans: [{
                resource: {
                    attributes: [
                        { key: 'service.name', value: { stringValue: serviceName ?? 'narrative-telemetry' } },
                        { key: 'service.version', value: { stringValue: '1.0.0' } },
                    ],
                },
                scopeSpans: [{
                        scope: {
                            name: 'narrative-telemetry',
                            version: '1.0.0',
                        },
                        spans: trace.spans.map(otelSpanToOtlp),
                    }],
            }],
    };
    return JSON.stringify(request, null, 2);
}
