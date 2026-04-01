import { OtelTrace, OtelSpan } from './otel';

/**
 * OTLP (OpenTelemetry Protocol) v1 JSON export.
 * Compatible with Grafana Tempo, OpenTelemetry Collector, etc.
 * Ref: https://opentelemetry.io/docs/specs/otlp/#otlphttp-request
 */

interface OtlpExportRequest {
  resourceSpans: OtlpResourceSpan[];
}

interface OtlpResourceSpan {
  resource: {
    attributes: Array<{ key: string; value: Record<string, unknown> }>;
  };
  scopeSpans: OtlpScopeSpan[];
}

interface OtlpScopeSpan {
  scope: {
    name: string;
    version: string;
  };
  spans: OtlpSpan[];
}

interface OtlpSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number; // SPAN_KIND_INTERNAL = 1
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: Array<{ key: string; value: Record<string, unknown> }>;
  events: OtlpEvent[];
  status: { code: number; message?: string };
}

interface OtlpEvent {
  name: string;
  timeUnixNano: string;
  attributes: Array<{ key: string; value: Record<string, unknown> }>;
}

/** Map OtelSpan attributes to OTLP format (already compatible). */
function mapAttributes(attrs: Array<{ key: string; value: Record<string, unknown> }>): Array<{ key: string; value: Record<string, unknown> }> {
  return attrs;
}

function otelSpanToOtlp(span: OtelSpan): OtlpSpan {
  return {
    traceId: span.traceId,
    spanId: span.spanId,
    ...(span.parentSpanId ? { parentSpanId: span.parentSpanId } : {}),
    name: span.name,
    kind: 1, // SPAN_KIND_INTERNAL
    startTimeUnixNano: span.startTimeUnixNano,
    endTimeUnixNano: span.endTimeUnixNano,
    attributes: mapAttributes(span.attributes as any),
    events: span.events.map(ev => ({
      name: ev.name,
      timeUnixNano: ev.timeUnixNano,
      attributes: mapAttributes(ev.attributes as any),
    })),
    status: span.status,
  };
}

/** Convert an OtelTrace to OTLP JSON format. */
export function otlpExport(trace: OtelTrace, serviceName?: string): string {
  const request: OtlpExportRequest = {
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
