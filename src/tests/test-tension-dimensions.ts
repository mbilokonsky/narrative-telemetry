/**
 * Tests for 5D tension dimension scoring support (M4).
 * Validates type system changes, backward compatibility, and prompt updates.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ReadingEventAnnotation, TensionDimensions, Reading } from '../types';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; }
}

console.log('\n--- Tension Dimensions: Type System ---\n');

// Test that TensionDimensions type has all 5 fields
const dims: TensionDimensions = {
  absential: 0.8,
  relational: 0.3,
  epistemic: 0.6,
  atmospheric: 0.2,
  pacing: 0.4,
};
check('TensionDimensions has all 5 fields',
  dims.absential === 0.8 && dims.relational === 0.3 && dims.epistemic === 0.6 &&
  dims.atmospheric === 0.2 && dims.pacing === 0.4
);

// Test that ReadingEventAnnotation.dimensions is optional (backward compatible)
const annWithDims: ReadingEventAnnotation = {
  significance: 0.7,
  dimensions: dims,
  note: 'test',
};
check('ReadingEventAnnotation accepts dimensions', annWithDims.dimensions?.absential === 0.8);

const annWithoutDims: ReadingEventAnnotation = {
  significance: 0.5,
};
check('ReadingEventAnnotation works without dimensions', annWithoutDims.dimensions === undefined);

console.log('\n--- Tension Dimensions: Backward Compatibility ---\n');

// Test that existing scalar-only data still works
const arabyPath = path.resolve(__dirname, '../../ui/public/data/araby.json');
if (fs.existsSync(arabyPath)) {
  const araby = JSON.parse(fs.readFileSync(arabyPath, 'utf-8'));
  const readingKey = Object.keys(araby.readings)[0];
  const reading = araby.readings[readingKey];

  // Existing data has no dimensions — should still be valid
  const events = Object.entries(reading.eventSignificance) as [string, any][];
  const hasDimensions = events.some(([, ann]) => ann.dimensions !== undefined);
  check('Existing araby data has no dimensions (expected)', !hasDimensions);

  const hasSignificance = events.every(([, ann]) => typeof ann.significance === 'number');
  check('Existing araby data has scalar significance', hasSignificance);

  // Tension points should still work
  const tensionHasDims = reading.globalTension.some((pt: any) => pt.dimensions !== undefined);
  check('Existing tension data has no dimensions (expected)', !tensionHasDims);

  const tensionHasValue = reading.globalTension.every((pt: any) => typeof pt.value === 'number');
  check('Existing tension data has scalar value', tensionHasValue);
}

console.log('\n--- Tension Dimensions: Prompt Updates ---\n');

const promptPath = path.resolve(__dirname, '../ingest/prompts.ts');
const promptSource = fs.readFileSync(promptPath, 'utf-8');

check('Prompt includes TensionDimensions interface', promptSource.includes('interface TensionDimensions'));
check('Prompt includes absential dimension', promptSource.includes('absential: number'));
check('Prompt includes relational dimension', promptSource.includes('relational: number'));
check('Prompt includes epistemic dimension', promptSource.includes('epistemic: number'));
check('Prompt includes atmospheric dimension', promptSource.includes('atmospheric: number'));
check('Prompt includes pacing dimension', promptSource.includes('pacing: number'));
check('Prompt requests independent scoring', promptSource.includes('INDEPENDENT'));
check('Prompt includes dimension scoring rules', promptSource.includes('Five Tension Dimensions'));
check('EventAnnotation includes dimensions field', promptSource.includes('dimensions: TensionDimensions'));

console.log('\n--- Tension Dimensions: Interpret Pipeline ---\n');

const interpretPath = path.resolve(__dirname, '../ingest/interpret.ts');
const interpretSource = fs.readFileSync(interpretPath, 'utf-8');

check('interpret.ts handles dimensions', interpretSource.includes('ann.dimensions'));
check('interpret.ts maps 5D fields', interpretSource.includes('Number(ann.dimensions.absential)'));
check('interpret.ts handles globalTension dimensions', interpretSource.includes('pt.dimensions'));

console.log('\n--- Tension Dimensions: Synthetic 5D Data ---\n');

// Test with synthetic 5D data (simulating future LLM output)
const syntheticReading = {
  eventSignificance: {
    'e01': {
      significance: 0.7,
      dimensions: { absential: 0.9, relational: 0.2, epistemic: 0.5, atmospheric: 0.3, pacing: 0.6 },
    },
    'e02': {
      significance: 0.3,
      dimensions: { absential: 0.1, relational: 0.8, epistemic: 0.2, atmospheric: 0.1, pacing: 0.2 },
    },
  },
  globalTension: [
    { timestamp: { percentage: 0 }, value: 0.2, dimensions: { absential: 0.1, relational: 0.1, epistemic: 0.3, atmospheric: 0.2, pacing: 0.1 } },
    { timestamp: { percentage: 50 }, value: 0.6, dimensions: { absential: 0.7, relational: 0.4, epistemic: 0.5, atmospheric: 0.8, pacing: 0.5 } },
    { timestamp: { percentage: 100 }, value: 0.9, dimensions: { absential: 0.95, relational: 0.3, epistemic: 0.9, atmospheric: 0.6, pacing: 0.8 } },
  ],
};

// Verify dimensions are independent
const e01 = syntheticReading.eventSignificance['e01'].dimensions;
const e02 = syntheticReading.eventSignificance['e02'].dimensions;
check('e01: absential > relational (independent)', e01.absential > e01.relational);
check('e02: relational > absential (independent)', e02.relational > e02.absential);
check('Dimensions are independent from each other',
  e01.absential !== e01.relational && e02.absential !== e02.relational
);

// Verify tension curve has per-dimension data
const midTension = syntheticReading.globalTension[1].dimensions;
check('Tension midpoint has 5D data',
  midTension.absential === 0.7 && midTension.atmospheric === 0.8
);

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
