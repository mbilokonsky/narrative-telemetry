/**
 * Tests for OTEL query layer setup (M3).
 * Validates Docker compose, import script, and OTLP export.
 */
import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; }
}

console.log('\n--- OTEL Import: Docker Compose ---\n');

const composePath = path.resolve(__dirname, '../../docker-compose.yml');
check('docker-compose.yml exists', fs.existsSync(composePath));

const composeSource = fs.readFileSync(composePath, 'utf-8');
check('Uses Jaeger all-in-one image', composeSource.includes('jaegertracing/all-in-one'));
check('Exposes Jaeger UI port 16686', composeSource.includes('16686'));
check('Exposes OTLP HTTP port 4318', composeSource.includes('4318'));
check('Enables OTLP collector', composeSource.includes('COLLECTOR_OTLP_ENABLED=true'));

console.log('\n--- OTEL Import: Import Script ---\n');

const importPath = path.resolve(__dirname, '../export/import-to-jaeger.ts');
check('import-to-jaeger.ts exists', fs.existsSync(importPath));

const importSource = fs.readFileSync(importPath, 'utf-8');
check('Finds story files', importSource.includes('findStoryFiles'));
check('Sends to Jaeger via OTLP', importSource.includes('/v1/traces'));
check('Handles connection errors', importSource.includes('Connection error'));
check('Reports import results', importSource.includes('Imported'));

console.log('\n--- OTEL Import: OTLP Export Validation ---\n');

// Test that OTLP export produces valid JSON for a real story
const arabyPath = path.resolve(__dirname, '../../ui/public/data/araby.json');
if (fs.existsSync(arabyPath)) {
  const { storyModelToOtel } = require('../export/otel');
  const { otlpExport } = require('../export/otlp');

  const araby = JSON.parse(fs.readFileSync(arabyPath, 'utf-8'));
  const trace = storyModelToOtel(araby);
  const otlpJson = otlpExport(trace);

  const parsed = JSON.parse(otlpJson);
  check('OTLP has resourceSpans', Array.isArray(parsed.resourceSpans));
  check('OTLP has at least 1 resource', parsed.resourceSpans.length > 0);

  const resource = parsed.resourceSpans[0];
  check('Resource has scope spans', Array.isArray(resource.scopeSpans));

  const spans = resource.scopeSpans[0]?.spans ?? [];
  check('Has OTEL spans', spans.length > 0, `${spans.length} spans`);

  // Validate span structure
  const firstSpan = spans[0];
  check('Span has traceId', typeof firstSpan.traceId === 'string');
  check('Span has spanId', typeof firstSpan.spanId === 'string');
  check('Span has name', typeof firstSpan.name === 'string');
  check('Span has startTimeUnixNano', typeof firstSpan.startTimeUnixNano === 'string');
  check('Span has attributes', Array.isArray(firstSpan.attributes));

  // Verify some spans have events
  const spansWithEvents = spans.filter((s: any) => s.events && s.events.length > 0);
  check('Some spans have events', spansWithEvents.length > 0);
}

console.log('\n--- OTEL Import: Package Scripts ---\n');

const pkgPath = path.resolve(__dirname, '../../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
check('Has otel:import script', !!pkg.scripts['otel:import']);
check('otel:import runs import-to-jaeger', pkg.scripts['otel:import'].includes('import-to-jaeger'));

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
