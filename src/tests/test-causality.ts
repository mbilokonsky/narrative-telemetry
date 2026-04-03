/**
 * Tests for interpretive causality (M5).
 * Validates causal chain support in types, prompts, and UI.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ReadingEventAnnotation } from '../types';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; }
}

console.log('\n--- Causality: Type System ---\n');

// Test that ReadingEventAnnotation supports causes and effects
const annWithCauses: ReadingEventAnnotation = {
  significance: 0.8,
  causes: ['e01', 'e02'],
  effects: [{
    entityId: 'e05',
    stateChanges: {},
    description: 'Triggers the climax',
  }],
};
check('ReadingEventAnnotation accepts causes', annWithCauses.causes?.length === 2);
check('ReadingEventAnnotation accepts effects', annWithCauses.effects?.length === 1);

const annWithout: ReadingEventAnnotation = { significance: 0.5 };
check('ReadingEventAnnotation works without causes', annWithout.causes === undefined);

console.log('\n--- Causality: Prompt Updates ---\n');

const promptPath = path.resolve(__dirname, '../ingest/prompts.ts');
const promptSource = fs.readFileSync(promptPath, 'utf-8');

check('Prompt defines causes field', promptSource.includes("causes?: string[]"));
check('Prompt defines effects field', promptSource.includes("effects?:"));
check('Prompt has causality rules section', promptSource.includes('Interpretive Causality'));
check('Prompt explains lens-specific causality', promptSource.includes('interpretive claims'));
check('Prompt sets minimum causal annotations', promptSource.includes('5-15 events'));

console.log('\n--- Causality: Interpret Pipeline ---\n');

const interpretPath = path.resolve(__dirname, '../ingest/interpret.ts');
const interpretSource = fs.readFileSync(interpretPath, 'utf-8');

check('interpret.ts handles causes array', interpretSource.includes('Array.isArray(ann.causes)'));
check('interpret.ts handles effects array', interpretSource.includes('Array.isArray(ann.effects)'));
check('interpret.ts maps structured effects', interpretSource.includes('eff.entityId') || interpretSource.includes('eff.change'));

console.log('\n--- Causality: UI Support ---\n');

const inspectorPath = path.resolve(__dirname, '../../ui/src/components/DetailInspector.tsx');
const inspectorSource = fs.readFileSync(inspectorPath, 'utf-8');

check('DetailInspector shows causes', inspectorSource.includes('Caused by'));
check('DetailInspector shows effects', inspectorSource.includes("Causes:"));
check('DetailInspector has causal links', inspectorSource.includes('causal-link'));
check('Causal links are clickable', inspectorSource.includes('onSelectEvent'));

// UI types — now re-exported from engine, check engine source
const engineTypesPath = path.resolve(__dirname, '../types/structural.ts');
const engineTypesSource = fs.readFileSync(engineTypesPath, 'utf-8');
check('Engine ReadingEventAnnotation has causes', engineTypesSource.includes("causes?: EventID[]"));
check('Engine ReadingEventAnnotation has effects', engineTypesSource.includes("effects?: ReadingEventEffect[]"));

console.log('\n--- Causality: Synthetic Data ---\n');

// Test with synthetic causal chain
interface Event { id: string; description: string; }
interface Annotation { significance: number; causes?: string[]; effects?: string[] }

const events: Record<string, Event> = {
  'e01': { id: 'e01', description: 'Uncle promises to help' },
  'e02': { id: 'e02', description: 'Uncle arrives late and drunk' },
  'e03': { id: 'e03', description: 'Boy arrives at closing bazaar' },
  'e04': { id: 'e04', description: 'Epiphany of self-recognition' },
};

const causalAnnotations: Record<string, Annotation> = {
  'e01': { significance: 0.5, effects: ['e02'] },
  'e02': { significance: 0.7, causes: ['e01'], effects: ['e03'] },
  'e03': { significance: 0.8, causes: ['e02'], effects: ['e04'] },
  'e04': { significance: 1.0, causes: ['e03'] },
};

// Build causal chain from e01 to e04
function traceCausalChain(startId: string, annotations: Record<string, Annotation>): string[] {
  const chain: string[] = [startId];
  let current = startId;
  const visited = new Set<string>();
  while (true) {
    if (visited.has(current)) break;
    visited.add(current);
    const effects = annotations[current]?.effects;
    if (!effects || effects.length === 0) break;
    current = effects[0];
    chain.push(current);
  }
  return chain;
}

const chain = traceCausalChain('e01', causalAnnotations);
check('Causal chain traces from e01 to e04', chain.length === 4);
check('Chain order is correct', chain.join('→') === 'e01→e02→e03→e04');

// Verify bidirectionality
check('e02 caused by e01', causalAnnotations['e02'].causes?.[0] === 'e01');
check('e01 effects e02', causalAnnotations['e01'].effects?.[0] === 'e02');

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
