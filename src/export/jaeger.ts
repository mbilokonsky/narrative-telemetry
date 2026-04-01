import { OtelTrace, OtelSpan, OtelEvent, OtelAttribute, OtelAttributeValue } from './otel';

/**
 * Jaeger-compatible JSON trace format.
 * Compatible with `docker run -p 16686:16686 jaegertracing/all-in-one`
 * and the Jaeger UI's JSON upload feature.
 */

interface JaegerTrace {
  data: JaegerTraceData[];
}

interface JaegerTraceData {
  traceID: string;
  spans: JaegerSpan[];
  processes: Record<string, JaegerProcess>;
}

interface JaegerProcess {
  serviceName: string;
  tags: JaegerTag[];
}

interface JaegerSpan {
  traceID: string;
  spanID: string;
  operationName: string;
  references: JaegerReference[];
  startTime: number; // microseconds
  duration: number;  // microseconds
  tags: JaegerTag[];
  logs: JaegerLog[];
  processID: string;
}

interface JaegerReference {
  refType: 'CHILD_OF' | 'FOLLOWS_FROM';
  traceID: string;
  spanID: string;
}

interface JaegerLog {
  timestamp: number; // microseconds
  fields: JaegerTag[];
}

interface JaegerTag {
  key: string;
  type: 'string' | 'int64' | 'float64' | 'bool';
  value: string | number | boolean;
}

/** Convert nanosecond string to microseconds. */
function nanoToMicro(nanoStr: string): number {
  return Math.floor(Number(BigInt(nanoStr) / 1000n));
}

/** Convert OTEL attribute value to Jaeger tag value. */
function otelValueToJaeger(val: OtelAttributeValue): { type: JaegerTag['type']; value: string | number | boolean } {
  if ('stringValue' in val) return { type: 'string', value: val.stringValue };
  if ('intValue' in val) return { type: 'int64', value: Number(val.intValue) };
  if ('doubleValue' in val) return { type: 'float64', value: val.doubleValue };
  if ('boolValue' in val) return { type: 'bool', value: val.boolValue };
  if ('arrayValue' in val) {
    // Jaeger doesn't support array tags — flatten to comma-separated string
    const items = val.arrayValue.values.map(v => {
      if ('stringValue' in v) return v.stringValue;
      return String(v);
    });
    return { type: 'string', value: items.join(', ') };
  }
  return { type: 'string', value: '' };
}

function otelAttrsToJaegerTags(attrs: OtelAttribute[]): JaegerTag[] {
  return attrs.map(a => {
    const { type, value } = otelValueToJaeger(a.value);
    return { key: a.key, type, value };
  });
}

function otelEventToJaegerLog(ev: OtelEvent): JaegerLog {
  return {
    timestamp: nanoToMicro(ev.timeUnixNano),
    fields: [
      { key: 'event', type: 'string' as const, value: ev.name },
      ...otelAttrsToJaegerTags(ev.attributes),
    ],
  };
}

function otelSpanToJaeger(span: OtelSpan): JaegerSpan {
  const startMicro = nanoToMicro(span.startTimeUnixNano);
  const endMicro = nanoToMicro(span.endTimeUnixNano);

  const references: JaegerReference[] = [];
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
export function jaegerExport(trace: OtelTrace, serviceName?: string): string {
  const jaeger: JaegerTrace = {
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
