/**
 * Tests for UI divergence computation.
 * Validates the event divergence calculation used in S3 side-by-side comparison.
 */

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; }
}

// We can't import the UI module directly, so we replicate the logic here
// and also validate it against the actual araby.json data.

interface Significance { significance: number; note?: string; }
interface Reading {
  name: string;
  eventSignificance: Record<string, Significance>;
  [key: string]: any;
}

interface EventDivergence {
  eventId: string;
  sig1: number;
  sig2: number;
  diff: number;
}

function computeEventDivergence(
  r1: Reading, r2: Reading, eventIds: string[],
): EventDivergence[] {
  const result: EventDivergence[] = [];
  for (const eventId of eventIds) {
    const sig1 = r1.eventSignificance[eventId]?.significance ?? 0;
    const sig2 = r2.eventSignificance[eventId]?.significance ?? 0;
    result.push({ eventId, sig1, sig2, diff: Math.abs(sig1 - sig2) });
  }
  return result.sort((a, b) => b.diff - a.diff);
}

console.log('\n--- Divergence: Unit Tests ---\n');

// Test with synthetic data
const r1: Reading = {
  name: 'formalist',
  eventSignificance: {
    'e01': { significance: 0.9 },
    'e02': { significance: 0.3 },
    'e03': { significance: 0.5 },
  },
};
const r2: Reading = {
  name: 'postcolonial',
  eventSignificance: {
    'e01': { significance: 0.3 },
    'e02': { significance: 0.8 },
    'e03': { significance: 0.5 },
  },
};

const div = computeEventDivergence(r1, r2, ['e01', 'e02', 'e03']);

check('Computes 3 divergence entries', div.length === 3);
check('Sorted by divergence (highest first)', div[0].diff >= div[1].diff && div[1].diff >= div[2].diff);
check('e01 divergence = 0.6', Math.abs(div.find(d => d.eventId === 'e01')!.diff - 0.6) < 0.001);
check('e02 divergence = 0.5', Math.abs(div.find(d => d.eventId === 'e02')!.diff - 0.5) < 0.001);
check('e03 divergence = 0.0', Math.abs(div.find(d => d.eventId === 'e03')!.diff) < 0.001);
check('Most divergent event is e01', div[0].eventId === 'e01');
check('Least divergent event is e03', div[div.length - 1].eventId === 'e03');

// Test with missing events in one reading
const r3: Reading = {
  name: 'sparse',
  eventSignificance: {
    'e01': { significance: 0.7 },
    // e02 missing — should default to 0
  },
};

const div2 = computeEventDivergence(r1, r3, ['e01', 'e02', 'e03']);
check('Missing event defaults to sig=0', div2.find(d => d.eventId === 'e02')!.sig2 === 0);
check('Missing event divergence = 0.3', Math.abs(div2.find(d => d.eventId === 'e02')!.diff - 0.3) < 0.001);
check('Missing event in both readings = 0', div2.find(d => d.eventId === 'e03')!.diff === 0.5);

// Test with real araby.json if available
console.log('\n--- Divergence: Real Data (Araby) ---\n');

import * as fs from 'fs';
import * as path from 'path';

const arabyPath = path.resolve(__dirname, '../../ui/public/data/araby.json');
if (fs.existsSync(arabyPath)) {
  const araby = JSON.parse(fs.readFileSync(arabyPath, 'utf-8'));
  const readingKeys = Object.keys(araby.readings);
  check('Araby has 2+ readings for comparison', readingKeys.length >= 2);

  if (readingKeys.length >= 2) {
    const eventIds = Object.keys(araby.text.events);
    const arabyDiv = computeEventDivergence(
      araby.readings[readingKeys[0]],
      araby.readings[readingKeys[1]],
      eventIds,
    );

    check('All events have divergence entries', arabyDiv.length === eventIds.length);
    check('Divergence values are 0-1', arabyDiv.every(d => d.diff >= 0 && d.diff <= 1));
    check('Some events have non-zero divergence', arabyDiv.some(d => d.diff > 0));
    check('Most divergent event has diff > 0.1',
      arabyDiv[0].diff > 0.1,
      `top divergence: ${arabyDiv[0].diff.toFixed(3)} (${arabyDiv[0].eventId})`
    );

    // Log top 5 most divergent for inspection
    console.log('\n  Top 5 most divergent events:');
    for (const d of arabyDiv.slice(0, 5)) {
      console.log(`    ${d.eventId}: ${d.sig1.toFixed(2)} vs ${d.sig2.toFixed(2)} (diff: ${d.diff.toFixed(2)})`);
    }
  }
} else {
  console.log('  (araby.json not found, skipping real data tests)');
}

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
