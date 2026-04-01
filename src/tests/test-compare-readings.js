"use strict";
/**
 * Tests for NarrativeAnalysisSystem.compareReadings() API
 *
 * TDD: write tests first, then implement the methods.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const NarrativeAnalysisSystem_1 = require("../NarrativeAnalysisSystem");
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
console.log('\n=== NarrativeAnalysisSystem.compareReadings() Tests ===\n');
// ── Create a test system ──
const system = new NarrativeAnalysisSystem_1.NarrativeAnalysisSystem('Test Story', 'Test Author', 'A story for testing');
// Add two readings with different significance
const reading1 = {
    name: 'formalist',
    description: 'Formalist lens',
    themes: {},
    symbols: {},
    symbolicRelationships: {},
    narrator: {},
    reader: {},
    author: {},
    eventSignificance: {
        'e01': { significance: 0.3, note: 'Minor event' },
        'e02': { significance: 0.5, note: 'Important event' },
        'e03': { significance: 0.9, note: 'Climactic event' },
    },
    entitySignificance: {},
    absentialSignificance: {},
    mentalConstructs: {},
    annotations: [],
    globalTension: [],
    spanAnnotations: {},
};
const reading2 = {
    name: 'postcolonial',
    description: 'Postcolonial lens',
    themes: {},
    symbols: {},
    symbolicRelationships: {},
    narrator: {},
    reader: {},
    author: {},
    eventSignificance: {
        'e01': { significance: 0.2, note: 'Minor event' },
        'e02': { significance: 0.8, note: 'Very important' },
        'e03': { significance: 0.6, note: 'Significant but contested' },
    },
    entitySignificance: {},
    absentialSignificance: {},
    mentalConstructs: {},
    annotations: [],
    globalTension: [],
    spanAnnotations: {},
};
// ═══════════════════════════════════════════════
console.log('--- API: addReading() ---\n');
// ═══════════════════════════════════════════════
try {
    system.addReading(reading1);
    check('addReading: accepts reading', true);
}
catch (err) {
    check('addReading: accepts reading', false, err.message);
}
try {
    system.addReading(reading2);
    check('addReading: multiple readings', true);
}
catch (err) {
    check('addReading: multiple readings', false, err.message);
}
// ═══════════════════════════════════════════════
console.log('\n--- API: getReading() ───\n');
// ═══════════════════════════════════════════════
const r1 = system.getReadingByName('formalist');
check('getReadingByName: returns first reading', r1?.name === 'formalist');
const r2 = system.getReadingByName('postcolonial');
check('getReadingByName: returns second reading', r2?.name === 'postcolonial');
const r3 = system.getReadingByName('nonexistent');
check('getReadingByName: returns undefined for unknown', r3 === undefined);
// ═══════════════════════════════════════════════
console.log('\n--- API: listReadings() ───\n');
// ═══════════════════════════════════════════════
const readingNames = system.listReadings();
check('listReadings: returns array', Array.isArray(readingNames));
check('listReadings: has both readings', readingNames.includes('formalist') && readingNames.includes('postcolonial'));
check('listReadings: count is 2', readingNames.length === 2);
// ═══════════════════════════════════════════════
console.log('\n--- API: getTensionCurve() ────\n');
// ═══════════════════════════════════════════════
try {
    const curve = system.getTensionCurve('formalist');
    check('getTensionCurve: returns tension array', Array.isArray(curve) && curve.length > 0);
    check('getTensionCurve: has timestamps', curve.every(p => typeof p.timestamp?.percentage === 'number'));
    check('getTensionCurve: has tension values', curve.every(p => typeof p.tension === 'number'));
    const postcolCurve = system.getTensionCurve('postcolonial');
    check('getTensionCurve: multiple readings', postcolCurve.length > 0);
    // Curves should be different for different readings
    const formalistVal = curve[curve.length - 1].tension;
    const postcolVal = postcolCurve[postcolCurve.length - 1].tension;
    check('getTensionCurve: readings produce different curves', Math.abs(formalistVal - postcolVal) > 0);
}
catch (err) {
    check('getTensionCurve: method exists', false, err.message);
}
// ═══════════════════════════════════════════════
console.log('\n--- API: compareReadings() ───\n');
// ═══════════════════════════════════════════════
try {
    const comparison = system.compareReadings('formalist', 'postcolonial');
    check('compareReadings: returns object', comparison !== undefined && typeof comparison === 'object');
    // Check structure
    check('compareReadings: has divergence', 'divergence' in comparison && comparison.divergence !== undefined);
    check('compareReadings: has tension_diff', 'tension_diff' in comparison);
    check('compareReadings: has coarse_grain_diff', 'coarse_grain_diff' in comparison);
    check('compareReadings: has summary', 'summary' in comparison && typeof comparison.summary === 'string');
    // Check divergence data
    if (comparison.divergence) {
        check('compareReadings: divergence has mean', typeof comparison.divergence.meanEventDivergence === 'number');
        check('compareReadings: divergence has max', typeof comparison.divergence.maxEventDivergence === 'number');
        check('compareReadings: divergence has event count', typeof comparison.divergence.divergentEventCount === 'number');
        check('compareReadings: divergent events > 0', comparison.divergence.divergentEventCount > 0);
    }
    // Check tension diff
    if (comparison.tension_diff) {
        check('compareReadings: tension_diff is array', Array.isArray(comparison.tension_diff));
        check('compareReadings: tension_diff has points', comparison.tension_diff.length > 0);
    }
    // Summary should mention the readings
    check('compareReadings: summary includes reading names', comparison.summary.includes('formalist') || comparison.summary.includes('postcolonial'));
}
catch (err) {
    check('compareReadings: method exists and works', false, err.message);
}
// ═══════════════════════════════════════════════
console.log('\n--- Error cases ──────────\n');
// ═══════════════════════════════════════════════
try {
    system.compareReadings('formalist', 'nonexistent');
    check('compareReadings: handles unknown reading', false, 'should throw or return error');
}
catch (err) {
    check('compareReadings: handles unknown reading', true, 'throws as expected');
}
try {
    system.getTensionCurve('nonexistent');
    check('getTensionCurve: handles unknown reading', false, 'should throw or return error');
}
catch (err) {
    check('getTensionCurve: handles unknown reading', true, 'throws as expected');
}
// ═══════════════════════════════════════════════
console.log('\n--- Comparative results ──\n');
// ═══════════════════════════════════════════════
const comp = system.compareReadings('formalist', 'postcolonial');
// The readings differ on e02: formalist 0.5 vs postcolonial 0.8
// Expected divergence: |0.5 - 0.8| = 0.3
if (comp.divergence) {
    const e02Div = comp.divergence.events?.find(e => e.eventId === 'e02');
    check('compareReadings: e02 divergence ≈ 0.3', e02Div !== undefined && Math.abs(e02Div.diff - 0.3) < 0.01);
}
// ═══════════════════════════════════════════════
//  Summary
// ═══════════════════════════════════════════════
console.log(`\n${'═'.repeat(40)}`);
console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
console.log(`${'═'.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
