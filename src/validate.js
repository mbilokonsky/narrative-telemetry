"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const persistence_1 = require("./persistence");
let passed = 0;
let failed = 0;
function check(name, condition, detail) {
    if (condition) {
        console.log(`  ✓ ${name}`);
        passed++;
    }
    else {
        console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`);
        failed++;
    }
}
function collectSpanEventIds(span) {
    return [...span.events, ...span.childSpans.flatMap(c => collectSpanEventIds(c))];
}
function countScenes(span) {
    return span.childSpans.reduce((n, act) => n + act.childSpans.length, 0);
}
console.log('\n=== Narrative-Telemetry Validation ===\n');
const model = (0, persistence_1.loadStoryModel)('araby');
const text = model.text;
// ── 1. Structural completeness ──
console.log('TextModel completeness:');
const charCount = Object.keys(text.diegetic.characters).length;
check('≥8 characters', charCount >= 8, `got ${charCount}`);
const settingCount = Object.keys(text.diegetic.settings).length;
check('≥7 settings', settingCount >= 7, `got ${settingCount}`);
const itemCount = Object.keys(text.diegetic.items).length;
check('≥5 items', itemCount >= 5, `got ${itemCount}`);
const eventCount = Object.keys(text.events).length;
check('≥20 events', eventCount >= 20, `got ${eventCount}`);
const absentialCount = Object.keys(text.absentials).length;
check('≥4 absentials', absentialCount >= 4, `got ${absentialCount}`);
const relCount = Object.keys(text.relationships.interpersonal).length + Object.keys(text.relationships.group).length;
check('≥3 relationships', relCount >= 3, `got ${relCount}`);
const mcCount = Object.keys(text.mentalConstructs).length;
check('≥2 mental constructs', mcCount >= 2, `got ${mcCount}`);
check('Root span is STORY type', text.rootSpan.type === 'story');
check('Has child spans (acts)', text.rootSpan.childSpans.length >= 3, `got ${text.rootSpan.childSpans.length}`);
check('Has scenes', countScenes(text.rootSpan) >= 9, `got ${countScenes(text.rootSpan)}`);
// ── 2. Events ──
console.log('\nEvents:');
const spanEventIds = new Set(collectSpanEventIds(text.rootSpan));
const registryEventIds = new Set(Object.keys(text.events));
const orphanEvents = [...registryEventIds].filter(id => !spanEventIds.has(id));
check('No orphan events', orphanEvents.length === 0, `${orphanEvents.length} orphans`);
check('Spans reference only registered events', [...spanEventIds].every(id => registryEventIds.has(id)));
const eventsWithTextLocation = Object.values(text.events).filter(e => e.textLocation && e.textLocation.startLine > 0);
check('Events have text locations', eventsWithTextLocation.length === eventCount, `${eventsWithTextLocation.length}/${eventCount}`);
const eventsWithParticipants = Object.values(text.events).filter(e => e.participants.length > 0);
check('Events have participants', eventsWithParticipants.length === eventCount, `${eventsWithParticipants.length}/${eventCount}`);
const eventsWithPreceding = Object.values(text.events).filter(e => e.precedingEvent);
check('Most events have precedingEvent', eventsWithPreceding.length >= eventCount - 2, `${eventsWithPreceding.length}/${eventCount}`);
// ── 3. Absential state transitions ──
console.log('\nAbsential causality:');
let absWithTransitions = 0;
for (const abs of Object.values(text.absentials)) {
    if (abs.stateHistory.length > 1)
        absWithTransitions++;
}
check('≥2 absentials with state transitions', absWithTransitions >= 2, `got ${absWithTransitions}`);
// ── 4. Readings ──
console.log('\nReadings:');
const readingNames = Object.keys(model.readings);
check('≥2 readings', readingNames.length >= 2, `got ${readingNames.length}`);
for (const name of readingNames) {
    const r = model.readings[name];
    console.log(`\n  Reading: "${name}"`);
    const themeCount = Object.keys(r.themes).length;
    check(`  ${name}: ≥1 theme`, themeCount >= 1, `got ${themeCount}`);
    const symbolCount = Object.keys(r.symbols).length;
    check(`  ${name}: ≥1 symbol`, symbolCount >= 1, `got ${symbolCount}`);
    check(`  ${name}: has narrator`, !!r.narrator);
    check(`  ${name}: has reader`, !!r.reader);
    check(`  ${name}: has author`, !!r.author);
    const annotatedEvents = Object.keys(r.eventSignificance).length;
    check(`  ${name}: annotated ≥20 events`, annotatedEvents >= 20, `got ${annotatedEvents}`);
    // Verify all annotated events reference valid TextModel events
    const invalidEventRefs = Object.keys(r.eventSignificance).filter(id => !registryEventIds.has(id));
    check(`  ${name}: all event refs valid`, invalidEventRefs.length === 0, `${invalidEventRefs.length} invalid`);
    check(`  ${name}: has tension curve`, r.globalTension.length >= 5, `got ${r.globalTension.length} points`);
}
// ── 5. Significance diverges between readings ──
console.log('\nSignificance divergence:');
if (readingNames.length >= 2) {
    const r1 = model.readings[readingNames[0]];
    const r2 = model.readings[readingNames[1]];
    const sharedEvents = Object.keys(r1.eventSignificance).filter(id => id in r2.eventSignificance);
    let divergences = 0;
    for (const id of sharedEvents) {
        if (Math.abs(r1.eventSignificance[id].significance - r2.eventSignificance[id].significance) > 0.2) {
            divergences++;
        }
    }
    check('Readings diverge on ≥5 events (significance diff > 0.2)', divergences >= 5, `got ${divergences}`);
}
// ── 6. Persistence round-trip ──
console.log('\nPersistence:');
const reloaded = (0, persistence_1.loadStoryModel)('araby');
check('Round-trip produces identical JSON', JSON.stringify(model) === JSON.stringify(reloaded));
// ── Summary ──
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
