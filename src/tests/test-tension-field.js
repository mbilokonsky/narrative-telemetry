"use strict";
/**
 * Tests for TensionField — hierarchical, entity-scoped tension decomposition.
 *
 * TDD: validates the tensor tension model against known fixtures and
 * the auto-generated Araby output.
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
const tensionField_1 = require("../derive/tensionField");
const types_1 = require("../types");
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
console.log('\n=== TensionField Tests ===\n');
// ═══════════════════════════════════════════════
console.log('--- Structure Tests (Fixtures) ---\n');
// ═══════════════════════════════════════════════
// Minimal fixture: two characters, one relationship, one absential
const minimalModel = {
    title: 'Minimal', author: 'Test', description: 'Test',
    rootSpan: {
        id: 'root', type: types_1.StorySpanType.STORY, title: 'Root',
        description: '', startTimestamp: { percentage: 0 }, endTimestamp: { percentage: 100 },
        events: [],
        childSpans: [{
                id: 'act-1', type: types_1.StorySpanType.ACT, title: 'Act 1',
                description: '', startTimestamp: { percentage: 0 }, endTimestamp: { percentage: 100 },
                events: [],
                childSpans: [{
                        id: 'scene-1', type: types_1.StorySpanType.SCENE, title: 'Scene 1',
                        description: '', startTimestamp: { percentage: 0 }, endTimestamp: { percentage: 50 },
                        events: ['e1', 'e2'],
                        childSpans: [],
                    }, {
                        id: 'scene-2', type: types_1.StorySpanType.SCENE, title: 'Scene 2',
                        description: '', startTimestamp: { percentage: 50 }, endTimestamp: { percentage: 100 },
                        events: ['e3'],
                        childSpans: [],
                    }],
            }],
    },
    diegetic: {
        characters: {
            'alice': { id: 'alice', name: 'Alice', description: 'Protagonist', tags: [], isDiegetic: true, stateHistory: [], textMentions: [] },
            'bob': { id: 'bob', name: 'Bob', description: 'Antagonist', tags: [], isDiegetic: true, stateHistory: [], textMentions: [] },
        },
        settings: {
            'forest': { id: 'forest', name: 'Dark Forest', description: 'A dark place', tags: [], isDiegetic: true, stateHistory: [], textMentions: [] },
        },
        items: {}, factions: {},
    },
    events: {
        'e1': { id: 'e1', type: types_1.NarrativeEventType.ACTION, description: 'Alice enters forest', timestamp: { percentage: 10 }, participants: ['alice', 'forest'], realm: 'material_reality', consequences: [] },
        'e2': { id: 'e2', type: types_1.NarrativeEventType.DIALOGUE, description: 'Alice meets Bob', timestamp: { percentage: 30 }, participants: ['alice', 'bob'], realm: 'material_reality', consequences: [] },
        'e3': { id: 'e3', type: types_1.NarrativeEventType.REVELATION, description: 'Bob reveals secret', timestamp: { percentage: 70 }, participants: ['alice', 'bob'], realm: 'material_reality', consequences: [] },
    },
    relationships: {
        interpersonal: {
            'rel-1': {
                id: 'rel-1',
                participants: ['alice', 'bob'],
                label: 'rival',
                type: 'interpersonal',
                nature: 'rivalry',
                name: 'Alice-Bob rivalry',
                description: 'Rivals',
                tags: [],
                isDiegetic: true,
                stateHistory: [{ timestamp: { percentage: 0 }, data: { label: 'rival' }, causedBy: {} }],
                textMentions: [],
            },
        },
        group: {},
    },
    absentials: {
        'abs-1': {
            id: 'abs-1', name: 'Quest', description: 'Alice wants the treasure',
            holder: 'alice', type: 'desire', isDiegetic: true, tags: [],
            stateHistory: [{ timestamp: { percentage: 0 }, data: { status: 'unsatisfied' }, causedBy: {} }],
            relatedAbsentials: [], childAbsentials: [], conflictingAbsentials: [],
            firstIntroduced: 'e1', parentAbsential: undefined, textMentions: [],
            entityRelationships: [],
        },
    },
    mentalConstructs: {
        'mc-1': {
            id: 'mc-1', name: 'Suspicion', holder: 'alice', subject: 'bob',
            description: 'Alice suspects Bob', isDiegetic: true, tags: [],
            source: 'e2', relatedConstructs: [], conflictingConstructs: [], supportingConstructs: [],
            stateHistory: [{ timestamp: { percentage: 0 }, data: { certainty: 'uncertain', type: 'belief', awareness: 'conscious', content: 'suspicious', emotionalAssociation: {}, salience: 0.7 }, causedBy: {} }],
            firstIntroduced: 'e2', textMentions: [],
        },
    },
    annotations: [],
};
const minimalReading = {
    name: 'test', description: 'Test reading',
    themes: {}, symbols: {}, symbolicRelationships: {},
    narrator: {}, reader: {}, author: {},
    eventSignificance: {
        'e1': { significance: 0.3 },
        'e2': { significance: 0.6 },
        'e3': { significance: 0.9 },
    },
    entitySignificance: {
        'alice': { significance: 0.8 },
        'bob': { significance: 0.6 },
        'forest': { significance: 0.4 },
    },
    absentialSignificance: {
        'abs-1': { significance: 0.7 },
    },
    mentalConstructs: {}, annotations: [], globalTension: [], spanAnnotations: {},
};
// ── Test: Field structure ──
const field = (0, tensionField_1.computeTensionField)(minimalModel, minimalReading);
check('Root field exists', field !== undefined);
check('Root spanId is correct', field.spanId === 'root');
check('Root spanType is story', field.spanType === 'story');
check('Root has children', field.children.length >= 1);
// ── Test: Span hierarchy mirrors text ──
const act1 = field.children[0];
check('Act 1 exists', act1 !== undefined);
check('Act 1 has 2 scene children', act1.children.length === 2);
const scene1 = act1.children[0];
const scene2 = act1.children[1];
check('Scene 1 spanId', scene1.spanId === 'scene-1');
check('Scene 2 spanId', scene2.spanId === 'scene-2');
// ── Test: Entity tensions ──
check('Scene 1 has entity tensions', scene1.entities.length > 0);
// Alice should be in scene 1 (she's in events e1, e2)
const aliceInScene1 = scene1.entities.find(e => e.entityId === 'alice');
check('Alice present in scene 1', aliceInScene1 !== undefined);
if (aliceInScene1) {
    check('Alice has dimensions', typeof aliceInScene1.dimensions === 'object');
    check('Alice absential > 0 (has unresolved quest)', aliceInScene1.dimensions.absential > 0);
    check('Alice relational > 0 (rival relationship with Bob)', aliceInScene1.dimensions.relational > 0);
    check('Alice epistemic > 0 (uncertain mental construct)', aliceInScene1.dimensions.epistemic > 0);
    check('Alice composite > 0', aliceInScene1.composite > 0);
    check('Alice active absentials include abs-1', aliceInScene1.activeAbsentials.includes('abs-1'));
}
// Bob should be in scene 1 (he's in event e2)
const bobInScene1 = scene1.entities.find(e => e.entityId === 'bob');
check('Bob present in scene 1', bobInScene1 !== undefined);
// Forest (setting) should contribute atmospheric tension
const forestInScene1 = scene1.entities.find(e => e.entityId === 'forest');
check('Forest present in scene 1', forestInScene1 !== undefined);
if (forestInScene1) {
    check('Forest is setting type', forestInScene1.entityType === 'setting');
    check('Forest has atmospheric tension > 0', forestInScene1.dimensions.atmospheric > 0);
}
// ── Test: Interaction tensions ──
check('Scene 1 has interactions', scene1.interactions.length > 0);
const aliceBobInteraction = scene1.interactions.find(i => (i.entity1 === 'alice' && i.entity2 === 'bob') ||
    (i.entity1 === 'bob' && i.entity2 === 'alice'));
check('Alice-Bob interaction exists', aliceBobInteraction !== undefined);
if (aliceBobInteraction) {
    check('Interaction has intensity > 0', aliceBobInteraction.intensity > 0);
    check('Interaction has type', typeof aliceBobInteraction.type === 'string');
    check('Interaction has description', aliceBobInteraction.description.length > 0);
}
// ── Test: Reader tension ──
check('Scene 2 has reader tension', scene2.reader !== undefined);
// Scene 2 has a revelation event, so reader gets knowledge
check('Reader knowledge advantage >= 0', scene2.reader.knowledgeAdvantage >= 0);
// ── Test: Field dimensions ──
check('Scene 1 fieldDimensions exists', scene1.fieldDimensions !== undefined);
check('Scene 1 composite > 0', scene1.composite > 0);
check('All dimensions between 0 and 1', Object.values(scene1.fieldDimensions).every(v => v >= 0 && v <= 1));
// ═══════════════════════════════════════════════
console.log('\n--- Flatten to Curves ---\n');
// ═══════════════════════════════════════════════
const curves = (0, tensionField_1.flattenTensionField)(field, 10);
check('Flatten returns array', Array.isArray(curves));
check('Flatten has 11 points (steps=10)', curves.length === 11);
check('First point at 0%', curves[0].timestamp.percentage === 0);
check('Last point at 100%', curves[curves.length - 1].timestamp.percentage === 100);
// Each point has all dimensions
check('Points have absential', typeof curves[5].absential === 'number');
check('Points have relational', typeof curves[5].relational === 'number');
check('Points have epistemic', typeof curves[5].epistemic === 'number');
check('Points have atmospheric', typeof curves[5].atmospheric === 'number');
check('Points have pacing', typeof curves[5].pacing === 'number');
check('Points have composite', typeof curves[5].composite === 'number');
// Not all flat zeros (some entities are present)
const hasNonZero = curves.some(p => p.absential > 0 || p.relational > 0 || p.epistemic > 0 || p.atmospheric > 0 || p.pacing > 0);
check('Curves have non-zero values', hasNonZero);
// ═══════════════════════════════════════════════
console.log('\n--- Araby Output Test ---\n');
// ═══════════════════════════════════════════════
const arabyPath = path.resolve(__dirname, '../../output/araby-auto.json');
if (fs.existsSync(arabyPath)) {
    const arabyModel = JSON.parse(fs.readFileSync(arabyPath, 'utf-8'));
    const readingNames = Object.keys(arabyModel.readings);
    if (readingNames.length > 0) {
        const arabyField = (0, tensionField_1.computeTensionField)(arabyModel.text, arabyModel.readings[readingNames[0]]);
        check('Araby field computed', arabyField !== undefined);
        check('Araby field has children', arabyField.children.length > 0);
        const arabyCurves = (0, tensionField_1.flattenTensionField)(arabyField);
        check('Araby curves computed', arabyCurves.length > 0);
        check('Araby has multi-dimensional tension', arabyCurves.some(p => p.absential > 0 || p.relational > 0 || p.epistemic > 0));
        // The composite should roughly match the old scalar tension
        const peak = arabyCurves.reduce((m, p) => p.composite > m.composite ? p : m, arabyCurves[0]);
        check('Araby composite peaks somewhere reasonable', peak.timestamp.percentage >= 20 && peak.timestamp.percentage <= 90);
        // If we have two readings, compare their tension fields
        if (readingNames.length >= 2) {
            const field1 = (0, tensionField_1.computeTensionField)(arabyModel.text, arabyModel.readings[readingNames[0]]);
            const field2 = (0, tensionField_1.computeTensionField)(arabyModel.text, arabyModel.readings[readingNames[1]]);
            const curves1 = (0, tensionField_1.flattenTensionField)(field1);
            const curves2 = (0, tensionField_1.flattenTensionField)(field2);
            // Different readings should produce different dimension distributions
            // Compare all dimensions including atmospheric (which uses entity significance from reading)
            const diff = curves1.reduce((sum, p, i) => sum + Math.abs(p.absential - curves2[i].absential) +
                Math.abs(p.relational - curves2[i].relational) +
                Math.abs(p.epistemic - curves2[i].epistemic) +
                Math.abs(p.atmospheric - curves2[i].atmospheric) +
                Math.abs(p.composite - curves2[i].composite), 0);
            check('Different readings produce different tension fields (diff=' + diff.toFixed(4) + ')', diff > 0.001);
        }
    }
    else {
        console.log('  (skipped: no readings in Araby output)');
    }
}
else {
    console.log('  (skipped: output/araby-auto.json not found)');
}
// ═══════════════════════════════════════════════
//  Summary
// ═══════════════════════════════════════════════
console.log(`\n${'═'.repeat(40)}`);
console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
console.log(`${'═'.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
