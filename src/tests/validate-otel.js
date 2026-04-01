"use strict";
/**
 * Validation tests for the OTEL export module.
 * Tests span hierarchy, event mapping, timestamp conversion,
 * reading attributes, and Jaeger/OTLP format validity.
 *
 * Runs offline — builds a minimal StoryModel in-memory.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const otel_1 = require("../export/otel");
const jaeger_1 = require("../export/jaeger");
const otlp_1 = require("../export/otlp");
const core_1 = require("../types/core");
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
// ── Build minimal StoryModel for testing ──
function buildTestModel() {
    const events = {
        'evt-1': {
            id: 'evt-1',
            type: core_1.NarrativeEventType.ACTION,
            description: 'Hero sets out on journey',
            timestamp: { percentage: 10 },
            textLocation: { startLine: 1, endLine: 3 },
            participants: ['hero', 'mentor'],
        },
        'evt-2': {
            id: 'evt-2',
            type: core_1.NarrativeEventType.DIALOGUE,
            description: 'Hero speaks with mentor',
            timestamp: { percentage: 25 },
            textLocation: { startLine: 10, endLine: 15 },
            participants: ['hero', 'mentor'],
        },
        'evt-3': {
            id: 'evt-3',
            type: core_1.NarrativeEventType.REVELATION,
            description: 'Hero discovers the truth',
            timestamp: { percentage: 50 },
            textLocation: { startLine: 30, endLine: 35 },
            participants: ['hero'],
        },
        'evt-4': {
            id: 'evt-4',
            type: core_1.NarrativeEventType.DECISION,
            description: 'Hero makes final choice',
            timestamp: { percentage: 80 },
            textLocation: { startLine: 50, endLine: 55 },
            participants: ['hero'],
        },
        'evt-5': {
            id: 'evt-5',
            type: core_1.NarrativeEventType.ACTION,
            description: 'Resolution',
            timestamp: { percentage: 95 },
            textLocation: { startLine: 60, endLine: 65 },
            participants: ['hero', 'mentor'],
        },
    };
    const rootSpan = {
        id: 'story',
        type: core_1.StorySpanType.STORY,
        title: 'Test Story',
        description: 'A test narrative',
        startTimestamp: { percentage: 0 },
        endTimestamp: { percentage: 100 },
        events: [],
        childSpans: [
            {
                id: 'act-1',
                type: core_1.StorySpanType.ACT,
                title: 'Act One: Setup',
                description: 'Introduction',
                startTimestamp: { percentage: 0 },
                endTimestamp: { percentage: 40 },
                events: [],
                childSpans: [
                    {
                        id: 'scene-1',
                        type: core_1.StorySpanType.SCENE,
                        title: 'Opening Scene',
                        description: '',
                        startTimestamp: { percentage: 0 },
                        endTimestamp: { percentage: 20 },
                        events: ['evt-1'],
                        childSpans: [],
                    },
                    {
                        id: 'scene-2',
                        type: core_1.StorySpanType.SCENE,
                        title: 'Mentor Scene',
                        description: '',
                        startTimestamp: { percentage: 20 },
                        endTimestamp: { percentage: 40 },
                        events: ['evt-2'],
                        childSpans: [],
                    },
                ],
            },
            {
                id: 'act-2',
                type: core_1.StorySpanType.ACT,
                title: 'Act Two: Confrontation',
                description: 'Rising action',
                startTimestamp: { percentage: 40 },
                endTimestamp: { percentage: 70 },
                events: [],
                childSpans: [
                    {
                        id: 'scene-3',
                        type: core_1.StorySpanType.SCENE,
                        title: 'Discovery',
                        description: '',
                        startTimestamp: { percentage: 40 },
                        endTimestamp: { percentage: 70 },
                        events: ['evt-3'],
                        childSpans: [],
                    },
                ],
            },
            {
                id: 'act-3',
                type: core_1.StorySpanType.ACT,
                title: 'Act Three: Resolution',
                description: 'Climax and denouement',
                startTimestamp: { percentage: 70 },
                endTimestamp: { percentage: 100 },
                events: [],
                childSpans: [
                    {
                        id: 'scene-4',
                        type: core_1.StorySpanType.SCENE,
                        title: 'Climax',
                        description: '',
                        startTimestamp: { percentage: 70 },
                        endTimestamp: { percentage: 90 },
                        events: ['evt-4'],
                        childSpans: [],
                    },
                    {
                        id: 'scene-5',
                        type: core_1.StorySpanType.SCENE,
                        title: 'Ending',
                        description: '',
                        startTimestamp: { percentage: 90 },
                        endTimestamp: { percentage: 100 },
                        events: ['evt-5'],
                        childSpans: [],
                    },
                ],
            },
        ],
    };
    const reading = {
        name: 'test-reading',
        description: 'A test reading',
        themes: {
            'theme-journey': {
                id: 'theme-journey',
                name: 'The Journey',
                description: 'Journey as transformation',
                tags: [],
                stateHistory: [],
                firstIntroduced: 'evt-1',
            },
            'theme-truth': {
                id: 'theme-truth',
                name: 'Truth and Discovery',
                description: 'Revelation of hidden truths',
                tags: [],
                stateHistory: [],
                firstIntroduced: 'evt-3',
            },
        },
        symbols: {
            'sym-path': {
                id: 'sym-path',
                name: 'The Path',
                description: 'Path as life choices',
                tags: [],
                stateHistory: [],
                firstIntroduced: 'evt-1',
            },
        },
        symbolicRelationships: {},
        narrator: { id: 'narrator', name: 'Narrator', description: '', tags: [], stateHistory: [], firstIntroduced: 'evt-1' },
        reader: { id: 'reader', name: 'Reader', description: '', tags: [], stateHistory: [], firstIntroduced: 'evt-1' },
        author: { id: 'author', name: 'Author', description: '', tags: [], stateHistory: [], firstIntroduced: 'evt-1' },
        eventSignificance: {
            'evt-1': { significance: 0.6, note: 'Inciting incident' },
            'evt-2': { significance: 0.3 },
            'evt-3': { significance: 0.9, note: 'Key revelation' },
            'evt-4': { significance: 1.0, note: 'Climax' },
            'evt-5': { significance: 0.4 },
        },
        entitySignificance: {
            'hero': { significance: 1.0 },
            'mentor': { significance: 0.7 },
        },
        absentialSignificance: {},
        mentalConstructs: {},
        annotations: [],
        globalTension: [
            { timestamp: { percentage: 10 }, value: 0.3 },
            { timestamp: { percentage: 50 }, value: 0.7 },
            { timestamp: { percentage: 80 }, value: 1.0 },
            { timestamp: { percentage: 95 }, value: 0.2 },
        ],
        spanAnnotations: {
            'act-1': { tension: 0.3, note: 'Setup' },
            'act-2': { tension: 0.7 },
            'act-3': { tension: 0.9, note: 'Peak tension' },
        },
    };
    const text = {
        title: 'Test Story',
        author: 'Test Author',
        description: 'A story for testing OTEL export',
        rootSpan,
        diegetic: {
            characters: {},
            settings: {},
            items: {},
            factions: {},
        },
        events,
        relationships: { interpersonal: {}, group: {} },
        absentials: {},
        mentalConstructs: {},
        annotations: [],
    };
    return {
        text,
        readings: { 'test-reading': reading },
    };
}
// ═══════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════
const model = buildTestModel();
const BASE_TIME = 1700000000; // fixed base for reproducibility
const DURATION = 3600;
const trace = (0, otel_1.storyModelToOtel)(model, {
    baseTime: BASE_TIME,
    durationSeconds: DURATION,
    readingName: 'test-reading',
});
// ── 1. Trace ID generation ──
console.log('\n=== 1. Trace ID Generation ===\n');
const traceId = (0, otel_1.generateTraceId)('Test Story', 'Test Author');
check('Trace ID is 32 hex chars (16 bytes)', traceId.length === 32 && /^[0-9a-f]+$/.test(traceId));
check('Trace ID is reproducible', traceId === (0, otel_1.generateTraceId)('Test Story', 'Test Author'));
check('Different input → different trace ID', traceId !== (0, otel_1.generateTraceId)('Other', 'Author'));
check('Trace on model matches', trace.traceId === traceId);
// ── 2. Span hierarchy ──
console.log('\n=== 2. Span Hierarchy ===\n');
// story(1) + 3 acts + 5 scenes = 9 spans
check(`Total spans: ${trace.spans.length} (expected 9)`, trace.spans.length === 9);
// Root span has no parent (enum value is lowercase 'story')
const rootOtelSpan = trace.spans.find(s => s.name.startsWith('story:'));
check('Root span exists', !!rootOtelSpan);
check('Root span has no parentSpanId', rootOtelSpan ? !rootOtelSpan.parentSpanId : false);
// Act spans are children of root
const actSpans = trace.spans.filter(s => s.name.startsWith('act:'));
check(`Act spans: ${actSpans.length} (expected 3)`, actSpans.length === 3);
for (const act of actSpans) {
    check(`Act "${act.name}" is child of root`, act.parentSpanId === rootOtelSpan?.spanId);
}
// Scene spans are children of their acts
const sceneSpans = trace.spans.filter(s => s.name.startsWith('scene:'));
check(`Scene spans: ${sceneSpans.length} (expected 5)`, sceneSpans.length === 5);
for (const scene of sceneSpans) {
    const isChildOfAct = actSpans.some(a => a.spanId === scene.parentSpanId);
    check(`Scene "${scene.name}" is child of an act`, isChildOfAct);
}
// ── 3. Event mapping ──
console.log('\n=== 3. Event Mapping ===\n');
const allOtelEvents = trace.spans.flatMap(s => s.events);
check(`Total events: ${allOtelEvents.length} (expected 5)`, allOtelEvents.length === 5);
// Events should be in the correct spans
const scene1Span = trace.spans.find(s => s.name.includes('Opening Scene'));
check('Scene 1 has evt-1', scene1Span?.events.some(e => e.name === 'Hero sets out on journey') ?? false);
const scene3Span = trace.spans.find(s => s.name.includes('Discovery'));
check('Scene 3 has evt-3 (revelation)', scene3Span?.events.some(e => e.name === 'Hero discovers the truth') ?? false);
// Event attributes
const revelationEvent = allOtelEvents.find(e => e.name === 'Hero discovers the truth');
check('Revelation event has type attribute', revelationEvent?.attributes.some(a => a.key === 'narrative.event.type') ?? false);
check('Revelation event has participants', revelationEvent?.attributes.some(a => a.key === 'narrative.event.participants') ?? false);
// ── 4. Timestamp conversion ──
console.log('\n=== 4. Timestamp Conversion ===\n');
const baseNs = BigInt(BASE_TIME) * 1000000000n;
const durationNs = BigInt(DURATION) * 1000000000n;
// Root span: 0% → baseTime, 100% → baseTime + duration
check('Root span starts at baseTime', rootOtelSpan ? rootOtelSpan.startTimeUnixNano === baseNs.toString() : false);
check('Root span ends at baseTime + duration', rootOtelSpan ? rootOtelSpan.endTimeUnixNano === (baseNs + durationNs).toString() : false);
// 50% event → baseTime + 0.5 * duration
const expectedMidNs = baseNs + durationNs / 2n;
const midEvent = allOtelEvents.find(e => e.name === 'Hero discovers the truth');
check('50% event timestamp correct', midEvent ? midEvent.timeUnixNano === expectedMidNs.toString() : false, midEvent ? `got ${midEvent.timeUnixNano}, expected ${expectedMidNs.toString()}` : 'event not found');
// 80% event
const expected80Ns = baseNs + (durationNs * 800n / 1000n);
const decisionEvent = allOtelEvents.find(e => e.name === 'Hero makes final choice');
check('80% event timestamp correct', decisionEvent ? decisionEvent.timeUnixNano === expected80Ns.toString() : false);
// ── 5. Reading attributes ──
console.log('\n=== 5. Reading Attributes ===\n');
const reading = model.readings['test-reading'];
const readingAttrs = (0, otel_1.readingToAttributes)(reading);
check('Reading name attribute present', readingAttrs.some(a => a.key === 'narrative.reading.name'));
check('Themes array present', readingAttrs.some(a => a.key === 'narrative.reading.themes'));
check('Symbols array present', readingAttrs.some(a => a.key === 'narrative.reading.symbols'));
check('Peak tension present', readingAttrs.some(a => a.key === 'narrative.reading.peak_tension'));
// Reading attributes on root span
const rootAttrs = rootOtelSpan?.attributes ?? [];
check('Root span has reading.name', rootAttrs.some(a => a.key === 'narrative.reading.name'));
check('Root span has reading.themes', rootAttrs.some(a => a.key === 'narrative.reading.themes'));
// Event significance from reading
const climaxEvent = allOtelEvents.find(e => e.name === 'Hero makes final choice');
const sigAttr = climaxEvent?.attributes.find(a => a.key === 'narrative.reading.significance');
check('Climax event has significance = 1.0', sigAttr && 'doubleValue' in sigAttr.value ? sigAttr.value.doubleValue === 1.0 :
    sigAttr && 'intValue' in sigAttr.value ? sigAttr.value.intValue === '1' : false);
// Span annotations from reading
const act3Span = actSpans.find(s => s.name.includes('Resolution'));
check('Act 3 has tension annotation', act3Span?.attributes.some(a => a.key === 'narrative.reading.tension') ?? false);
// ── 6. Span ID generation ──
console.log('\n=== 6. Span ID Generation ===\n');
const spanId1 = (0, otel_1.generateSpanId)(traceId, 'story');
check('Span ID is 16 hex chars (8 bytes)', spanId1.length === 16 && /^[0-9a-f]+$/.test(spanId1));
check('Span ID is reproducible', spanId1 === (0, otel_1.generateSpanId)(traceId, 'story'));
check('Different span → different ID', spanId1 !== (0, otel_1.generateSpanId)(traceId, 'act-1'));
// All span IDs in trace are unique
const spanIds = trace.spans.map(s => s.spanId);
check('All span IDs are unique', new Set(spanIds).size === spanIds.length);
// ── 7. Jaeger format validation ──
console.log('\n=== 7. Jaeger Format ===\n');
const jaegerJson = (0, jaeger_1.jaegerExport)(trace);
let jaegerParsed;
try {
    jaegerParsed = JSON.parse(jaegerJson);
    check('Jaeger output is valid JSON', true);
}
catch (e) {
    check('Jaeger output is valid JSON', false, String(e));
}
if (jaegerParsed) {
    check('Jaeger has data array', Array.isArray(jaegerParsed.data) && jaegerParsed.data.length === 1);
    const data = jaegerParsed.data[0];
    check('Jaeger traceID matches', data.traceID === trace.traceId);
    check(`Jaeger spans: ${data.spans.length}`, data.spans.length === trace.spans.length);
    check('Jaeger has process p1', !!data.processes?.p1);
    check('Jaeger serviceName is narrative-telemetry', data.processes?.p1?.serviceName === 'narrative-telemetry');
    // Check a span has logs (events)
    const spanWithLogs = data.spans.find((s) => s.logs && s.logs.length > 0);
    check('At least one Jaeger span has logs (events)', !!spanWithLogs);
    // Check references
    const childSpan = data.spans.find((s) => s.references && s.references.length > 0);
    check('Child spans have CHILD_OF references', childSpan?.references[0]?.refType === 'CHILD_OF');
    // Timestamps should be in microseconds
    const rootJaeger = data.spans.find((s) => s.operationName.includes('STORY'));
    if (rootJaeger) {
        const expectedStartMicro = BASE_TIME * 1000000;
        check('Jaeger timestamps in microseconds', rootJaeger.startTime === expectedStartMicro);
        check('Jaeger duration is positive', rootJaeger.duration > 0);
    }
}
// ── 8. OTLP format validation ──
console.log('\n=== 8. OTLP Format ===\n');
const otlpJson = (0, otlp_1.otlpExport)(trace);
let otlpParsed;
try {
    otlpParsed = JSON.parse(otlpJson);
    check('OTLP output is valid JSON', true);
}
catch (e) {
    check('OTLP output is valid JSON', false, String(e));
}
if (otlpParsed) {
    check('OTLP has resourceSpans', Array.isArray(otlpParsed.resourceSpans) && otlpParsed.resourceSpans.length === 1);
    const rs = otlpParsed.resourceSpans[0];
    check('OTLP resource has service.name', rs.resource?.attributes?.some((a) => a.key === 'service.name'));
    check('OTLP has scopeSpans', Array.isArray(rs.scopeSpans) && rs.scopeSpans.length === 1);
    const ss = rs.scopeSpans[0];
    check('OTLP scope name is narrative-telemetry', ss.scope?.name === 'narrative-telemetry');
    check(`OTLP spans: ${ss.spans.length}`, ss.spans.length === trace.spans.length);
    // OTLP spans should have kind
    const firstSpan = ss.spans[0];
    check('OTLP spans have kind=1 (INTERNAL)', firstSpan?.kind === 1);
    // OTLP timestamps should be nanosecond strings
    check('OTLP timestamps are string nanoseconds', typeof firstSpan?.startTimeUnixNano === 'string');
}
// ── 9. No-reading export ──
console.log('\n=== 9. No-Reading Export ===\n');
const noReadingModel = {
    text: model.text,
    readings: {},
};
const noReadingTrace = (0, otel_1.storyModelToOtel)(noReadingModel, { baseTime: BASE_TIME });
check('Export works with no readings', noReadingTrace.spans.length === 9);
check('Root span has no reading attributes when none available', !noReadingTrace.spans[0].attributes.some(a => a.key === 'narrative.reading.name'));
// ── 10. Multiple readings ──
console.log('\n=== 10. Multiple Readings ===\n');
const secondReading = {
    ...model.readings['test-reading'],
    name: 'second-reading',
    description: 'A second reading',
    eventSignificance: {
        'evt-1': { significance: 0.2 },
        'evt-3': { significance: 0.5 },
        'evt-4': { significance: 0.8 },
    },
};
const multiModel = {
    text: model.text,
    readings: {
        'test-reading': model.readings['test-reading'],
        'second-reading': secondReading,
    },
};
// Export with first reading
const trace1 = (0, otel_1.storyModelToOtel)(multiModel, { baseTime: BASE_TIME, readingName: 'test-reading' });
const trace2 = (0, otel_1.storyModelToOtel)(multiModel, { baseTime: BASE_TIME, readingName: 'second-reading' });
check('Same traceId for both readings', trace1.traceId === trace2.traceId);
check('Same span count for both readings', trace1.spans.length === trace2.spans.length);
// Different reading → different significance on events
const t1Climax = trace1.spans.flatMap(s => s.events).find(e => e.name === 'Hero makes final choice');
const t2Climax = trace2.spans.flatMap(s => s.events).find(e => e.name === 'Hero makes final choice');
const t1Sig = t1Climax?.attributes.find(a => a.key === 'narrative.reading.significance');
const t2Sig = t2Climax?.attributes.find(a => a.key === 'narrative.reading.significance');
check('Different readings produce different significance values', !!(t1Sig && t2Sig && JSON.stringify(t1Sig.value) !== JSON.stringify(t2Sig.value)));
// ═══════════════════════════════════════════════
//  Summary
// ═══════════════════════════════════════════════
console.log(`\n${'═'.repeat(40)}`);
console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
console.log(`${'═'.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
