import { loadStoryModel, saveStoryModel } from './persistence';
import { StoryModel, StorySpan } from './types';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

function countEvents(span: StorySpan): number {
  let count = span.events.length;
  for (const child of span.childSpans) {
    count += countEvents(child);
  }
  return count;
}

function allEventsInSpans(span: StorySpan): string[] {
  const ids = span.events.map(e => e.id);
  for (const child of span.childSpans) {
    ids.push(...allEventsInSpans(child));
  }
  return ids;
}

console.log('\n=== Narrative-Telemetry Validation ===\n');

const model = loadStoryModel('araby');

// 1. Structural completeness
console.log('Structural completeness:');
const charCount = Object.keys(model.entities.diegetic.characters).length;
check('≥3 characters', charCount >= 3, `got ${charCount}`);

const settingCount = Object.keys(model.entities.diegetic.settings).length;
check('≥3 settings', settingCount >= 3, `got ${settingCount}`);

const themeCount = Object.keys(model.entities.nonDiegetic.themes).length;
check('≥1 theme', themeCount >= 1, `got ${themeCount}`);

const narratorCount = Object.keys(model.entities.nonDiegetic.narrators).length;
check('≥1 narrator', narratorCount >= 1, `got ${narratorCount}`);

check('Root span is STORY type', model.rootSpan.type === 'story');

const actCount = model.rootSpan.childSpans.length;
check('Root span has child spans (acts)', actCount > 0, `got ${actCount}`);

const sceneCount = model.rootSpan.childSpans.reduce((n, act) => n + act.childSpans.length, 0);
check('Acts have child spans (scenes)', sceneCount > 0, `got ${sceneCount}`);

const eventCount = Object.keys(model.events).length;
check('≥5 events', eventCount >= 5, `got ${eventCount}`);

const spanEventCount = countEvents(model.rootSpan);
check('Events in spans match event registry', spanEventCount === eventCount, `spans: ${spanEventCount}, registry: ${eventCount}`);

const absentialCount = Object.keys(model.absentials).length;
check('≥2 absentials', absentialCount >= 2, `got ${absentialCount}`);

const relCount =
  Object.keys(model.relationships.interpersonal).length +
  Object.keys(model.relationships.group).length +
  Object.keys(model.relationships.symbolic).length;
check('≥1 relationship', relCount >= 1, `got ${relCount}`);

const mcCount = Object.keys(model.mentalConstructs).length;
check('≥1 mental construct', mcCount >= 1, `got ${mcCount}`);

// 2. Causality
console.log('\nCausality:');
const eventsWithCauses = Object.values(model.events).filter(e => e.cause.diageticCause);
check('Events have diegetic causes', eventsWithCauses.length > 0, `${eventsWithCauses.length}/${eventCount}`);

let entitiesWithMultipleStates = 0;
for (const char of Object.values(model.entities.diegetic.characters)) {
  if (char.stateHistory.length > 1) entitiesWithMultipleStates++;
}
check('≥1 character with multiple state entries', entitiesWithMultipleStates >= 1, `got ${entitiesWithMultipleStates}`);

let absentialsWithMultipleStates = 0;
for (const abs of Object.values(model.absentials)) {
  if (abs.stateHistory.length > 1) absentialsWithMultipleStates++;
}
check('≥1 absential with state transitions', absentialsWithMultipleStates >= 1, `got ${absentialsWithMultipleStates}`);

// 3. Span nesting
console.log('\nSpan nesting:');
const spanEventIds = new Set(allEventsInSpans(model.rootSpan));
const registryEventIds = new Set(Object.keys(model.events));
const orphanEvents = [...registryEventIds].filter(id => !spanEventIds.has(id));
check('No orphan events (all events in spans)', orphanEvents.length === 0, `${orphanEvents.length} orphans`);

check('Spans nest: story→acts→scenes',
  model.rootSpan.childSpans.length > 0 && model.rootSpan.childSpans.some(a => a.childSpans.length > 0));

// 4. Persistence round-trip
console.log('\nPersistence round-trip:');
const reloaded = loadStoryModel('araby');
const originalJson = JSON.stringify(model);
const reloadedJson = JSON.stringify(reloaded);
check('Save → load round-trip produces identical JSON', originalJson === reloadedJson);

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
