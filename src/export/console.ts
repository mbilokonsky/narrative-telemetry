import { OtelTrace, OtelSpan, OtelAttribute, OtelAttributeValue } from './otel';

/** Pretty-print an OTEL trace to console for debugging. */
export function consoleExport(trace: OtelTrace): void {
  console.log(`\n═══ Trace: ${trace.traceId} ═══`);
  console.log(`Spans: ${trace.spans.length}`);
  const totalEvents = trace.spans.reduce((sum, s) => sum + s.events.length, 0);
  console.log(`Events: ${totalEvents}\n`);

  // Build parent→children index for tree printing
  const childMap = new Map<string | undefined, OtelSpan[]>();
  for (const span of trace.spans) {
    const parentKey = span.parentSpanId ?? undefined;
    if (!childMap.has(parentKey)) childMap.set(parentKey, []);
    childMap.get(parentKey)!.push(span);
  }

  // Find root spans (no parent)
  const roots = childMap.get(undefined) ?? [];

  function printSpan(span: OtelSpan, depth: number): void {
    const indent = '  '.repeat(depth);
    const durationNs = BigInt(span.endTimeUnixNano) - BigInt(span.startTimeUnixNano);
    const durationMs = Number(durationNs / 1_000_000n);

    console.log(`${indent}├─ ${span.name} [${span.spanId.slice(0, 8)}] ${durationMs}ms`);

    // Show key attributes
    const typeAttr = findAttr(span.attributes, 'narrative.span.type');
    const tensionAttr = findAttr(span.attributes, 'narrative.reading.tension');
    if (typeAttr || tensionAttr) {
      const parts: string[] = [];
      if (typeAttr) parts.push(`type=${formatValue(typeAttr.value)}`);
      if (tensionAttr) parts.push(`tension=${formatValue(tensionAttr.value)}`);
      console.log(`${indent}│  ${parts.join(' ')}`);
    }

    // Show events
    for (const ev of span.events) {
      const sigAttr = findAttr(ev.attributes, 'narrative.reading.significance');
      const sigStr = sigAttr ? ` [sig=${formatValue(sigAttr.value)}]` : '';
      console.log(`${indent}│  ◆ ${ev.name}${sigStr}`);
    }

    // Recurse into children
    const children = childMap.get(span.spanId) ?? [];
    for (const child of children) {
      printSpan(child, depth + 1);
    }
  }

  for (const root of roots) {
    printSpan(root, 0);
  }

  console.log('');
}

function findAttr(attrs: OtelAttribute[], key: string): OtelAttribute | undefined {
  return attrs.find(a => a.key === key);
}

function formatValue(val: OtelAttributeValue): string {
  if ('stringValue' in val) return val.stringValue;
  if ('intValue' in val) return val.intValue;
  if ('doubleValue' in val) return String(val.doubleValue);
  if ('boolValue' in val) return String(val.boolValue);
  if ('arrayValue' in val) {
    return val.arrayValue.values.map(v => formatValue(v)).join(', ');
  }
  return '?';
}
