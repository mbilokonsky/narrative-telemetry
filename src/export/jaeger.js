"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jaegerExport = jaegerExport;
/** Convert nanosecond string to microseconds. */
function nanoToMicro(nanoStr) {
    return Math.floor(Number(BigInt(nanoStr) / 1000n));
}
/** Convert OTEL attribute value to Jaeger tag value. */
function otelValueToJaeger(val) {
    if ('stringValue' in val)
        return { type: 'string', value: val.stringValue };
    if ('intValue' in val)
        return { type: 'int64', value: Number(val.intValue) };
    if ('doubleValue' in val)
        return { type: 'float64', value: val.doubleValue };
    if ('boolValue' in val)
        return { type: 'bool', value: val.boolValue };
    if ('arrayValue' in val) {
        // Jaeger doesn't support array tags — flatten to comma-separated string
        const items = val.arrayValue.values.map(v => {
            if ('stringValue' in v)
                return v.stringValue;
            return String(v);
        });
        return { type: 'string', value: items.join(', ') };
    }
    return { type: 'string', value: '' };
}
function otelAttrsToJaegerTags(attrs) {
    return attrs.map(a => {
        const { type, value } = otelValueToJaeger(a.value);
        return { key: a.key, type, value };
    });
}
function otelEventToJaegerLog(ev) {
    return {
        timestamp: nanoToMicro(ev.timeUnixNano),
        fields: [
            { key: 'event', type: 'string', value: ev.name },
            ...otelAttrsToJaegerTags(ev.attributes),
        ],
    };
}
function otelSpanToJaeger(span) {
    const startMicro = nanoToMicro(span.startTimeUnixNano);
    const endMicro = nanoToMicro(span.endTimeUnixNano);
    const references = [];
    if (span.parentSpanId) {
        references.push({
            refType: 'CHILD_OF',
            traceID: span.traceId,
            spanID: span.parentSpanId,
        });
    }
    return {
        traceID: span.traceId,
        spanID: span.spanId,
        operationName: span.name,
        references,
        startTime: startMicro,
        duration: endMicro - startMicro,
        tags: otelAttrsToJaegerTags(span.attributes),
        logs: span.events.map(otelEventToJaegerLog),
        processID: 'p1',
    };
}
/** Convert an OtelTrace to Jaeger JSON format (uploadable to Jaeger UI). */
function jaegerExport(trace, serviceName) {
    const jaeger = {
        data: [{
                traceID: trace.traceId,
                spans: trace.spans.map(otelSpanToJaeger),
                processes: {
                    p1: {
                        serviceName: serviceName ?? 'narrative-telemetry',
                        tags: [],
                    },
                },
            }],
    };
    return JSON.stringify(jaeger, null, 2);
}
