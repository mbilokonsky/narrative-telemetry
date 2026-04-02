/**
 * Tests for derived text annotations and absential trajectories.
 * Validates that annotations are derived from textMentions and that
 * absential trajectories can be computed from event participation.
 */
import * as fs from 'fs';
import * as path from 'path';
import { deriveAnnotations, collectEntities } from '../derive/annotations';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; }
}

// ── Annotation derivation tests ──

console.log('\n--- Annotations: Derivation Logic ---\n');

const testLines = [
  'North Richmond Street, being blind, was a quiet street.',
  'The former tenant of our house, a priest, had died in the back drawing-room.',
  'Mangan\'s sister came out on the doorstep to call her brother in to his tea.',
];

const testEntities = [
  { id: 'north-richmond-st', name: 'North Richmond Street', textMentions: ['North Richmond Street'] },
  { id: 'priest', name: 'The Priest', textMentions: ['priest'] },
  { id: 'mangans-sister', name: "Mangan's sister", textMentions: ["Mangan's sister"] },
];

const annotations = deriveAnnotations(testLines, testEntities);

check('Derives annotations from text', annotations.length > 0, `${annotations.length} found`);
check('Finds North Richmond Street', annotations.some(a => a.entityId === 'north-richmond-st' && a.startLine === 1));
check('Finds priest', annotations.some(a => a.entityId === 'priest' && a.startLine === 2));
check("Finds Mangan's sister", annotations.some(a => a.entityId === 'mangans-sister' && a.startLine === 3));

// Verify character positions
const nrs = annotations.find(a => a.entityId === 'north-richmond-st');
check('North Richmond Street starts at char 0', nrs?.startChar === 0);
check('North Richmond Street ends correctly', nrs?.endChar === 'North Richmond Street'.length);

// Test short mention filtering
const shortEntities = [
  { id: 'boy', name: 'Boy', textMentions: ['he', 'him', 'boy'] },
];
const shortAnns = deriveAnnotations(testLines, shortEntities);
check('Filters out pronouns (he, him)', shortAnns.length === 0);

// Test deduplication
const dupLines = ['Gabriel Gabriel'];
const dupEntities = [{ id: 'gabriel', name: 'Gabriel', textMentions: ['Gabriel'] }];
const dupAnns = deriveAnnotations(dupLines, dupEntities);
check('Finds multiple occurrences in same line', dupAnns.length === 2);
check('Different char positions', dupAnns[0]?.startChar !== dupAnns[1]?.startChar);

// ── Real data tests ──

console.log('\n--- Annotations: Enriched Story Data ---\n');

const storiesToCheck = [
  'output/dubliners/the-dead-formalist.json',
  'output/dubliners/eveline-formalist.json',
  'output/mansfield/miss-brill-formalist.json',
  'output/mansfield/the-garden-party-formalist.json',
];

for (const sp of storiesToCheck) {
  const fullPath = path.resolve(__dirname, '../..', sp);
  if (!fs.existsSync(fullPath)) continue;

  const story = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  const title = story.text.title;
  const annCount = (story.text.annotations ?? []).length;
  check(`${title}: has derived annotations`, annCount > 0, `${annCount} annotations`);

  // Verify annotations have valid structure
  if (annCount > 0) {
    const sample = story.text.annotations[0];
    check(`${title}: annotations have entityId`, typeof sample.entityId === 'string');
    check(`${title}: annotations have startLine`, typeof sample.startLine === 'number');
    check(`${title}: annotations have mentionText`, typeof sample.mentionText === 'string');
  }

  // Verify annotations reference valid entities
  const allEntityIds = new Set([
    ...Object.keys(story.text.diegetic.characters),
    ...Object.keys(story.text.diegetic.settings),
    ...Object.keys(story.text.diegetic.items),
    ...Object.keys(story.text.diegetic.factions ?? {}),
  ]);
  const invalidRefs = (story.text.annotations ?? []).filter(
    (a: any) => !allEntityIds.has(a.entityId)
  );
  check(`${title}: all annotation entityIds are valid`, invalidRefs.length === 0,
    invalidRefs.length > 0 ? `${invalidRefs.length} invalid refs` : undefined);
}

// ── Absential trajectory tests ──

console.log('\n--- Absential Trajectory: Computation ---\n');

const deadPath = path.resolve(__dirname, '../../output/dubliners/the-dead-formalist.json');
if (fs.existsSync(deadPath)) {
  const dead = JSON.parse(fs.readFileSync(deadPath, 'utf-8'));
  const readingKey = Object.keys(dead.readings)[0];
  const reading = dead.readings[readingKey];

  for (const [absId, abs] of Object.entries(dead.text.absentials).slice(0, 3) as [string, any][]) {
    const holder = abs.holder;
    const relatedIds = (abs.relatedEntities ?? []).map((r: any) => r.entityId);
    const relevantIds = new Set([holder, ...relatedIds].filter(Boolean));

    // Find events involving holder/related entities
    const relevantEvents = Object.entries(dead.text.events).filter(
      ([, evt]: [string, any]) => evt.participants.some((p: string) => relevantIds.has(p))
    );

    check(`${absId}: has holder (${holder})`, !!holder);
    check(`${absId}: has relevant events`, relevantEvents.length > 0, `${relevantEvents.length} events`);
    check(`${absId}: events span story arc`,
      relevantEvents.length >= 2,
      `${relevantEvents.length} events across timeline`
    );
  }
}

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
