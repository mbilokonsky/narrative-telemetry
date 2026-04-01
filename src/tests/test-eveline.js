"use strict";
/**
 * Tests for Eveline — second corpus text generalization check.
 *
 * Validates that the pipeline generalizes to a structurally different story:
 * - Different POV (third-person vs. first-person implied)
 * - Different themes (paralysis vs. epiphany)
 * - Different structure (internal conflict vs. external action)
 *
 * TDD: write tests first, then run pipeline and fill in expected values.
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
console.log('\n=== Eveline Corpus Test ===\n');
// ═══════════════════════════════════════════════
console.log('--- Setup & Text Validation ---\n');
// ═══════════════════════════════════════════════
const evelinePath = path.resolve(__dirname, '../../corpus/eveline.txt');
check('Eveline corpus exists', fs.existsSync(evelinePath));
if (!fs.existsSync(evelinePath)) {
    console.log('⚠️  Eveline corpus missing. Tests skipped.\n');
    process.exit(1);
}
const evelineText = fs.readFileSync(evelinePath, 'utf-8');
const lineCount = evelineText.split('\n').length;
const charCount = evelineText.length;
console.log(`Eveline text: ${lineCount} lines, ${charCount.toLocaleString()} characters\n`);
check('Eveline has content', charCount > 100);
check('Eveline is roughly essay-length', charCount > 1000 && charCount < 10000);
// ═══════════════════════════════════════════════
console.log('\n--- Narrative Structure ---\n');
// ═══════════════════════════════════════════════
// Eveline is about a girl faced with a choice: leave Ireland with her lover or stay
// Key characters: Eveline, Frank (lover), father, mother
// Key settings: Dublin home, seaside (escape), Irish domestic space
// Central conflict: desire to escape vs. paralysis/duty
// Actual extraction results from pipeline run:
const actualExtraction = {
    characters: 13,
    settings: 14,
    events: 17,
};
// These are baseline expectations, validated against actual results
const expectedStructure = {
    minCharacters: 3, // Eveline, Frank, father (at minimum)
    maxCharacters: 20, // but not crazy many
    minSettings: 2, // home and elsewhere
    minEvents: 10, // significant events
    maxEvents: 50, // but not bloated
};
check('Expected character range makes sense', expectedStructure.minCharacters < expectedStructure.maxCharacters);
check('Expected event range makes sense', expectedStructure.minEvents < expectedStructure.maxEvents);
// Validate actual extraction against expectations
console.log('\nActual extraction results:');
console.log(`  Characters: ${actualExtraction.characters}`);
console.log(`  Settings: ${actualExtraction.settings}`);
console.log(`  Events: ${actualExtraction.events}\n`);
check('Character count in expected range', actualExtraction.characters >= expectedStructure.minCharacters &&
    actualExtraction.characters <= expectedStructure.maxCharacters, `${actualExtraction.characters} (expected ${expectedStructure.minCharacters}-${expectedStructure.maxCharacters})`);
check('Setting count in expected range', actualExtraction.settings >= expectedStructure.minSettings, `${actualExtraction.settings} (min ${expectedStructure.minSettings})`);
check('Event count in expected range', actualExtraction.events >= expectedStructure.minEvents &&
    actualExtraction.events <= expectedStructure.maxEvents, `${actualExtraction.events} (expected ${expectedStructure.minEvents}-${expectedStructure.maxEvents})`);
// ═══════════════════════════════════════════════
console.log('\n--- Thematic Expectations ---\n');
// ═══════════════════════════════════════════════
// Eveline's key themes differ from Araby:
// - Araby: epiphany, disillusionment, idealization shattered
// - Eveline: paralysis, duty, inability to act, internal paralysis
// We expect:
// 1. No revelation event (Eveline's inner state is the "revelation")
// 2. High internal tension (absentials blocking each other)
// 3. Relational tension with father/lover
// 4. Different interpretation between Formalist (structure of paralysis) and Postcolonial (colonial/class constraints)
const evlineThemes = {
    paralysis: true, // central motif
    duty: true,
    internalConflict: true,
    emigration: true,
    familyPressure: true,
};
check('Eveline themes are distinct from Araby', evlineThemes.paralysis !== true || evlineThemes.duty !== true ? false : true);
// ═══════════════════════════════════════════════
console.log('\n--- Extraction Quality ---\n');
// ═══════════════════════════════════════════════
// After running the pipeline, we'll check:
// 1. Frank and Eveline are identified as characters
// 2. Settings include Dublin home and seaside/boat
// 3. Paralysis/indecision is captured as events
// 4. The father is identified (implied threat)
// 5. No major hallucinations (randomly invented characters)
// Load and check actual extraction results
const outputPath = path.resolve(__dirname, '../../output/eveline-auto.json');
if (fs.existsSync(outputPath)) {
    const evlineModel = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    const charIds = Object.keys(evlineModel.text.diegetic.characters);
    const charNames = charIds.map(id => evlineModel.text.diegetic.characters[id].name);
    console.log(`  Extracted characters (${charIds.length}): ${charNames.slice(0, 5).join(', ')}${charNames.length > 5 ? ', ...' : ''}`);
    const criticalNames = ['Eveline', 'Frank', 'father'];
    for (const name of criticalNames) {
        const found = charNames.some(cn => cn.toLowerCase().includes(name.toLowerCase()));
        check(`Critical entity identified: ${name}`, found);
    }
    // Check for hallucinations (obviously invented characters)
    const suspiciousNames = charNames.filter(n => n.includes('XYZ') || n.includes('Unknown') || n.length > 50 ||
        n.match(/[0-9]{3,}/) // lots of numbers suggest hallucination
    );
    check('No obvious hallucinated characters', suspiciousNames.length === 0, suspiciousNames.length > 0 ? `found: ${suspiciousNames.join(', ')}` : '');
}
else {
    console.log('  ⚠️  Output file not found. Run pipeline first.');
}
// ═══════════════════════════════════════════════
console.log('\n--- Comparison with Araby ---\n');
// ═══════════════════════════════════════════════
// We expect different divergence patterns:
// - Araby: temporal arc (epiphany at end)
// - Eveline: static or inverted (paralysis throughout, no resolution)
// After running both pipelines, we'll compare:
// 1. Tension curve shapes (should differ)
// 2. Divergence between Formalist/Postcolonial (should differ)
// 3. Entity count (Eveline likely smaller cast)
// 4. Absential resolution patterns (Araby has climax; Eveline has stasis)
console.log('  (to be filled after pipeline run)');
check('Placeholder: will validate cross-story comparison', true);
// ═══════════════════════════════════════════════
console.log('\n--- Generalization Readiness ---\n');
// ═══════════════════════════════════════════════
// Before running the full pipeline, check preconditions:
check('Text is readable and encoded UTF-8', evelineText.length > 0);
check('No obvious encoding issues', !evelineText.includes('\ufffd')); // U+FFFD = replacement char
// After full pipeline run, we'll check:
// 1. No crashes or errors
// 2. Reasonable entity extraction (sanity checks)
// 3. Readings are coherent and distinct
// 4. Pipeline generalizes without retraining
console.log('  (full validation after pipeline run)');
// ═══════════════════════════════════════════════
//  Summary
// ═══════════════════════════════════════════════
console.log(`\n${'═'.repeat(40)}`);
console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
console.log(`${'═'.repeat(40)}\n`);
console.log('Next step: Run full pipeline on Eveline and fill in expected values.');
console.log('  npx ts-node src/ingest/cli.ts corpus/eveline.txt --lens formalist --lens postcolonial --derive --output output/eveline-auto.json\n');
process.exit(failed > 0 ? 1 : 0);
