/**
 * Unified test runner — runs all test suites and reports combined results.
 */
import { execSync } from 'child_process';
import * as path from 'path';

const suites = [
  { name: 'Unit Tests', script: 'src/tests/unit.ts' },
  { name: 'Chunked Extraction', script: 'src/tests/validate-chunked.ts' },
  { name: 'Auto-Generated Output', script: 'src/tests/validate-auto.ts' },
  { name: 'OTEL Export', script: 'src/tests/validate-otel.ts' },
  { name: 'CompareReadings API', script: 'src/tests/test-compare-readings.ts' },
  { name: 'TensionField', script: 'src/tests/test-tension-field.ts' },
  { name: 'Eveline Corpus', script: 'src/tests/test-eveline.ts' },
];

let totalPassed = 0;
let totalFailed = 0;
let allGreen = true;

console.log('╔══════════════════════════════════════╗');
console.log('║   narrative-telemetry test suite     ║');
console.log('╚══════════════════════════════════════╝\n');

for (const suite of suites) {
  console.log(`\n${'▶'.repeat(1)} Running: ${suite.name}`);
  console.log('─'.repeat(40));
  
  try {
    const output = execSync(`npx ts-node ${suite.script}`, {
      cwd: path.resolve(__dirname, '../..'),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    // Parse results from output
    const match = output.match(/Passed:\s*(\d+)\s*Failed:\s*(\d+)/);
    if (match) {
      const p = parseInt(match[1]);
      const f = parseInt(match[2]);
      totalPassed += p;
      totalFailed += f;
      if (f > 0) allGreen = false;
      console.log(`  ✅ ${suite.name}: ${p} passed, ${f} failed`);
    } else {
      console.log(`  ✅ ${suite.name}: completed (no summary found)`);
    }
  } catch (err: any) {
    allGreen = false;
    const output = (err.stdout ?? '') + (err.stderr ?? '');
    const match = output.match(/Passed:\s*(\d+)\s*Failed:\s*(\d+)/);
    if (match) {
      const p = parseInt(match[1]);
      const f = parseInt(match[2]);
      totalPassed += p;
      totalFailed += f;
      console.log(`  ❌ ${suite.name}: ${p} passed, ${f} failed`);
    } else {
      totalFailed++;
      console.log(`  ❌ ${suite.name}: CRASHED`);
      console.log(output.split('\n').slice(-5).map((l: string) => `     ${l}`).join('\n'));
    }
  }
}

console.log('\n' + '═'.repeat(40));
console.log(`Total: ${totalPassed + totalFailed} tests | ${totalPassed} passed | ${totalFailed} failed`);
console.log('═'.repeat(40));
console.log(allGreen ? '\n✅ ALL TESTS PASS\n' : '\n❌ SOME TESTS FAILED\n');

process.exit(allGreen ? 0 : 1);
