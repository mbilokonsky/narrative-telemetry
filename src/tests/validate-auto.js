"use strict";
/**
 * Validation tests for the auto-generated Araby output.
 * Runs offline against output/araby-auto.json — no API calls needed.
 *
 * Compares against known manual targets:
 *   Characters: ~11, Settings: ~9, Items: ~7, Events: ~28, Absentials: ~5
 *   Readings: 2 (Formalist, Postcolonial)
 *   Divergent events (|diff| > 0.2): >= 5
 *   Tension curve: peaks in 60-90% range (climax zone)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const tension_1 = require("../derive/tension");
const divergence_1 = require("../derive/divergence");
const coarseGrain_1 = require("../derive/coarseGrain");
const pacing_1 = require("../derive/pacing");
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
function inRange(val, min, max) {
    return val >= min && val <= max;
}
// ── Load output ──
const outputPath = path.resolve(__dirname, '../../output/araby-auto.json');
if (!fs.existsSync(outputPath)) {
    console.error('Missing output/araby-auto.json — run the pipeline first:');
    console.error('  npx ts-node src/ingest/cli.ts corpus/araby.txt --lens formalist --lens postcolonial --derive --output output/araby-auto.json');
    process.exit(1);
}
const model = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
// ── Helpers ──
function collectSpanEventIds(span) {
    return [...span.events, ...span.childSpans.flatMap(c => collectSpanEventIds(c))];
}
function countSpansByType(span, type) {
    let count = span.type === type ? 1 : 0;
    for (const child of span.childSpans) {
        count += countSpansByType(child, type);
    }
    return count;
}
// ═══════════════════════════════════════════════
//  PASS 1: TextModel validation
// ═══════════════════════════════════════════════
console.log('\n=== Pass 1: TextModel ===\n');
const charCount = Object.keys(model.text.diegetic.characters).length;
const settingCount = Object.keys(model.text.diegetic.settings).length;
const itemCount = Object.keys(model.text.diegetic.items).length;
const eventCount = Object.keys(model.text.events).length;
const absCount = Object.keys(model.text.absentials).length;
const relCount = Object.keys(model.text.relationships.interpersonal).length
    + Object.keys(model.text.relationships.group || {}).length;
check(`Characters: ${charCount} (target ~11)`, inRange(charCount, 7, 18));
check(`Settings: ${settingCount} (target ~9)`, inRange(settingCount, 5, 25));
check(`Items: ${itemCount} (target ~7)`, inRange(itemCount, 3, 30));
check(`Events: ${eventCount} (target ~28)`, inRange(eventCount, 18, 45));
check(`Absentials: ${absCount} (target ~5)`, inRange(absCount, 3, 10));
check(`Relationships: ${relCount} (target >= 3)`, relCount >= 3);
// Span structure
const acts = countSpansByType(model.text.rootSpan, 'act');
const scenes = countSpansByType(model.text.rootSpan, 'scene');
const beats = countSpansByType(model.text.rootSpan, 'beat');
check(`Acts: ${acts} (target ~3)`, inRange(acts, 2, 5));
check(`Scenes: ${scenes} (target ~13)`, inRange(scenes, 5, 25));
check(`Beats: ${beats} (target >= scenes)`, beats >= scenes);
// All events should be referenced in spans
const spanEventIds = new Set(collectSpanEventIds(model.text.rootSpan));
const allEventIds = new Set(Object.keys(model.text.events));
const orphanEvents = [...allEventIds].filter(id => !spanEventIds.has(id));
check(`No orphan events (${orphanEvents.length} orphaned)`, orphanEvents.length <= 3, orphanEvents.length > 3 ? `orphans: ${orphanEvents.slice(0, 5).join(', ')}` : undefined);
// Events should reference valid entities
const allEntityIds = new Set([
    ...Object.keys(model.text.diegetic.characters),
    ...Object.keys(model.text.diegetic.settings),
    ...Object.keys(model.text.diegetic.items),
    ...Object.keys(model.text.diegetic.factions),
]);
let badRefs = 0;
for (const [eid, evt] of Object.entries(model.text.events)) {
    for (const pid of (evt.participants || [])) {
        if (!allEntityIds.has(pid))
            badRefs++;
    }
}
check(`Event→entity cross-refs valid (${badRefs} bad)`, badRefs <= 5);
// ═══════════════════════════════════════════════
//  PASS 2: Readings validation
// ═══════════════════════════════════════════════
console.log('\n=== Pass 2: Readings ===\n');
const readingNames = Object.keys(model.readings);
check(`Readings count: ${readingNames.length} (target 2)`, readingNames.length === 2);
for (const name of readingNames) {
    const reading = model.readings[name];
    const themeCount = Object.keys(reading.themes || {}).length;
    const symbolCount = Object.keys(reading.symbols || {}).length;
    const annotatedEvents = Object.keys(reading.eventSignificance || {}).length;
    console.log(`\n  [${name}]`);
    check(`  Themes: ${themeCount} (target >= 2)`, themeCount >= 2);
    check(`  Symbols: ${symbolCount} (target >= 2)`, symbolCount >= 2);
    check(`  Events annotated: ${annotatedEvents}/${eventCount}`, annotatedEvents >= eventCount * 0.8, `only ${((annotatedEvents / eventCount) * 100).toFixed(0)}% coverage`);
    // Check significance scores are in valid range
    let badScores = 0;
    for (const [evtId, ann] of Object.entries(reading.eventSignificance || {})) {
        if (ann.significance < 0 || ann.significance > 1)
            badScores++;
    }
    check(`  Significance scores in [0,1] (${badScores} out of range)`, badScores === 0);
}
// ═══════════════════════════════════════════════
//  PASS 3: Derived insights
// ═══════════════════════════════════════════════
console.log('\n=== Pass 3: Derived Insights ===\n');
// Tension curves
for (const name of readingNames) {
    const reading = model.readings[name];
    const curve = (0, tension_1.computeTensionCurve)(model.text, reading, 20);
    const peak = curve.reduce((m, p) => p.tension > m.tension ? p : m, curve[0]);
    check(`Tension [${name}]: peak at ${peak.timestamp.percentage.toFixed(0)}% (target 50-90%)`, inRange(peak.timestamp.percentage, 50, 90));
    check(`Tension [${name}]: curve has ${curve.length} points`, curve.length >= 10);
    check(`Tension [${name}]: max tension is 1.0 (normalized)`, Math.abs(peak.tension - 1.0) < 0.01);
}
// Divergence
if (readingNames.length >= 2) {
    const r1 = model.readings[readingNames[0]];
    const r2 = model.readings[readingNames[1]];
    const div = (0, divergence_1.computeDivergence)(r1, r2);
    check(`Divergence: ${div.divergentEventCount} events with |diff| > 0.2 (target >= 5)`, div.divergentEventCount >= 5);
    check(`Divergence: mean = ${div.meanEventDivergence.toFixed(3)} (should be > 0)`, div.meanEventDivergence > 0);
    check(`Divergence: max = ${div.maxEventDivergence.toFixed(3)} (should be > 0.2)`, div.maxEventDivergence > 0.2);
}
// Coarse-graining
for (const name of readingNames) {
    const reading = model.readings[name];
    const cg = (0, coarseGrain_1.coarseGrain)(model.text.rootSpan, reading);
    const cgKeys = cg.children ? cg.children.length : 0;
    check(`Coarse-graining [${name}]: root has ${cgKeys} act summaries`, cgKeys >= 2);
}
// Pacing
const pacing = (0, pacing_1.computePacing)(model.text.rootSpan, model.text);
const pacingChildren = pacing.children ? pacing.children.length : 0;
check(`Pacing: root has ${pacingChildren} act metrics`, pacingChildren >= 2);
// ═══════════════════════════════════════════════
//  Summary
// ═══════════════════════════════════════════════
console.log(`\n${'═'.repeat(40)}`);
console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
console.log(`${'═'.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
