"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NarrativeAnalysisSystem = void 0;
const types_1 = require("./types");
const derive_1 = require("./derive");
let counter = 0;
function generateId(prefix) {
    return `${prefix}_${++counter}`;
}
// ── Helper functions for comparison ──
function compareTensionCurves(curve1, curve2) {
    const diffs = [];
    const minLen = Math.min(curve1.length, curve2.length);
    for (let i = 0; i < minLen; i++) {
        diffs.push({
            timestamp: curve1[i].timestamp,
            diff: Math.abs(curve1[i].tension - curve2[i].tension),
            reading1_value: curve1[i].tension,
            reading2_value: curve2[i].tension,
        });
    }
    return diffs;
}
function compareCoarseGrains(cg1, cg2) {
    return {
        spanId: 'root',
        spanTitle: 'Story',
        mean_significance_diff: Math.abs(cg1.meanSignificance - cg2.meanSignificance),
        reading1_mean: cg1.meanSignificance,
        reading2_mean: cg2.meanSignificance,
    };
}
function generateComparisonSummary(name1, name2, divergence, tensionDiff, coarseGrainDiff) {
    const lines = [];
    lines.push(`Comparison: "${name1}" vs "${name2}"`);
    lines.push('');
    lines.push(`Divergence:`);
    lines.push(`  Events with significant diff: ${divergence.divergentEventCount}`);
    lines.push(`  Mean divergence: ${divergence.meanEventDivergence.toFixed(3)}`);
    lines.push(`  Max divergence: ${divergence.maxEventDivergence.toFixed(3)}`);
    lines.push('');
    const avgTensionDiff = tensionDiff.length > 0 ? tensionDiff.reduce((sum, td) => sum + td.diff, 0) / tensionDiff.length : 0;
    lines.push(`Tension:`);
    lines.push(`  Average tension difference: ${avgTensionDiff.toFixed(3)}`);
    lines.push('');
    lines.push(`Structure (coarse-graining):`);
    lines.push(`  Mean significance diff: ${coarseGrainDiff.mean_significance_diff.toFixed(3)}`);
    lines.push(`  "${name1}" mean: ${coarseGrainDiff.reading1_mean.toFixed(3)}`);
    lines.push(`  "${name2}" mean: ${coarseGrainDiff.reading2_mean.toFixed(3)}`);
    return lines.join('\n');
}
class NarrativeAnalysisSystem {
    constructor(title, author, description) {
        const rootSpanId = generateId('span');
        this.model = {
            text: {
                title,
                author,
                description,
                rootSpan: {
                    id: rootSpanId,
                    type: types_1.StorySpanType.STORY,
                    title,
                    description,
                    startTimestamp: { percentage: 0 },
                    endTimestamp: { percentage: 100 },
                    events: [],
                    childSpans: [],
                },
                diegetic: { characters: {}, settings: {}, items: {}, factions: {} },
                events: {},
                relationships: { interpersonal: {}, group: {} },
                absentials: {},
                mentalConstructs: {},
                annotations: [],
            },
            readings: {},
        };
    }
    // ═══════════════════════════════════════════════
    //  PASS 1: Text-building (neutral, exhaustive)
    // ═══════════════════════════════════════════════
    getRootSpanId() {
        return this.model.text.rootSpan.id;
    }
    // ── Spans ──
    createSpan(parentSpanId, type, title, description, startPct, endPct) {
        const parent = this.findSpan(parentSpanId);
        if (!parent)
            throw new Error(`Parent span ${parentSpanId} not found`);
        const id = generateId('span');
        parent.childSpans.push({
            id, type, title, description,
            startTimestamp: { percentage: startPct },
            endTimestamp: { percentage: endPct },
            events: [],
            childSpans: [],
        });
        return id;
    }
    findSpan(spanId, from) {
        const root = from ?? this.model.text.rootSpan;
        if (root.id === spanId)
            return root;
        for (const child of root.childSpans) {
            const found = this.findSpan(spanId, child);
            if (found)
                return found;
        }
        return null;
    }
    // ── Diegetic entities ──
    addCharacter(data) {
        const id = data.id ?? generateId('char');
        this.model.text.diegetic.characters[id] = { ...data, id };
        return id;
    }
    addSetting(data) {
        const id = data.id ?? generateId('setting');
        this.model.text.diegetic.settings[id] = { ...data, id };
        return id;
    }
    addItem(data) {
        const id = data.id ?? generateId('item');
        this.model.text.diegetic.items[id] = { ...data, id };
        return id;
    }
    addFaction(data) {
        const id = data.id ?? generateId('faction');
        this.model.text.diegetic.factions[id] = { ...data, id };
        return id;
    }
    // ── Diegetic relationships ──
    addInterpersonalRelationship(data) {
        const id = data.id ?? generateId('rel');
        this.model.text.relationships.interpersonal[id] = { ...data, id };
        return id;
    }
    addGroupRelationship(data) {
        const id = data.id ?? generateId('rel');
        this.model.text.relationships.group[id] = { ...data, id };
        return id;
    }
    // ── Absentials ──
    addAbsential(data) {
        const id = data.id ?? generateId('abs');
        this.model.text.absentials[id] = { ...data, id };
        return id;
    }
    updateAbsentialStatus(absentialId, status, eventId, timestamp) {
        const abs = this.model.text.absentials[absentialId];
        if (!abs)
            throw new Error(`Absential ${absentialId} not found`);
        const lastState = abs.stateHistory[abs.stateHistory.length - 1];
        abs.stateHistory.push({
            timestamp,
            data: { ...lastState.data, status },
            causedBy: { eventId },
        });
    }
    // ── Diegetic mental constructs ──
    addMentalConstruct(data) {
        const id = data.id ?? generateId('mc');
        this.model.text.mentalConstructs[id] = { ...data, id };
        return id;
    }
    // ── Text annotations (diegetic) ──
    annotate(entityId, startLine, startChar, endLine, endChar, mentionText, note) {
        this.model.text.annotations.push({ entityId, startLine, startChar, endLine, endChar, mentionText, note });
    }
    // ── Events ──
    addEvent(spanId, data) {
        const span = this.findSpan(spanId);
        if (!span)
            throw new Error(`Span ${spanId} not found`);
        const id = data.id ?? generateId('evt');
        const event = { ...data, id };
        span.events.push(id);
        this.model.text.events[id] = event;
        return id;
    }
    // ═══════════════════════════════════════════════
    //  PASS 2+: Reading construction (interpretive)
    // ═══════════════════════════════════════════════
    createReading(name, description, narrator, reader, author) {
        this.model.readings[name] = {
            name,
            description,
            themes: {},
            symbols: {},
            symbolicRelationships: {},
            narrator,
            reader,
            author,
            eventSignificance: {},
            entitySignificance: {},
            absentialSignificance: {},
            mentalConstructs: {},
            annotations: [],
            globalTension: [],
            spanAnnotations: {},
        };
    }
    getReading(name) {
        const r = this.model.readings[name];
        if (!r)
            throw new Error(`Reading "${name}" not found`);
        return r;
    }
    // ── Interpretive entities ──
    addTheme(readingName, data) {
        const r = this.getReading(readingName);
        const id = data.id ?? generateId('theme');
        r.themes[id] = { ...data, id };
        return id;
    }
    addSymbol(readingName, data) {
        const r = this.getReading(readingName);
        const id = data.id ?? generateId('sym');
        r.symbols[id] = { ...data, id };
        return id;
    }
    addSymbolicRelationship(readingName, data) {
        const r = this.getReading(readingName);
        const id = data.id ?? generateId('symrel');
        r.symbolicRelationships[id] = { ...data, id };
        return id;
    }
    addReadingMentalConstruct(readingName, data) {
        const r = this.getReading(readingName);
        const id = data.id ?? generateId('rmc');
        r.mentalConstructs[id] = { ...data, id };
        return id;
    }
    // ── Significance annotations ──
    annotateEvent(readingName, eventId, annotation) {
        this.getReading(readingName).eventSignificance[eventId] = annotation;
    }
    annotateEntity(readingName, entityId, significance, note) {
        this.getReading(readingName).entitySignificance[entityId] = { significance, note };
    }
    annotateAbsential(readingName, absentialId, significance, note) {
        this.getReading(readingName).absentialSignificance[absentialId] = { significance, note };
    }
    annotateSpan(readingName, spanId, annotation) {
        this.getReading(readingName).spanAnnotations[spanId] = annotation;
    }
    // ── Reading-level text annotations (interpretive) ──
    annotateText(readingName, entityId, startLine, startChar, endLine, endChar, mentionText, note) {
        this.getReading(readingName).annotations.push({ entityId, startLine, startChar, endLine, endChar, mentionText, note });
    }
    // ── Tension ──
    addTensionPoint(readingName, timestamp, value) {
        this.getReading(readingName).globalTension.push({ timestamp, value });
    }
    // ── Output ──
    getModel() {
        return this.model;
    }
    // ═══════════════════════════════════════════════
    //  READING COMPARISON API
    // ═══════════════════════════════════════════════
    /**
     * Add a reading to the story model.
     */
    addReading(reading) {
        this.model.readings[reading.name] = reading;
    }
    /**
     * Get a reading by name (public API).
     */
    getReadingByName(name) {
        return this.model.readings[name];
    }
    /**
     * List all reading names in the model.
     */
    listReadings() {
        return Object.keys(this.model.readings);
    }
    /**
     * Get tension curve for a specific reading.
     */
    getTensionCurve(readingName) {
        const reading = this.getReadingByName(readingName);
        if (!reading) {
            throw new Error(`Reading "${readingName}" not found`);
        }
        return (0, derive_1.computeTensionCurve)(this.model.text, reading);
    }
    /**
     * Compare two readings: divergence, tension differences, structural differences.
     */
    compareReadings(readingName1, readingName2) {
        const r1 = this.getReadingByName(readingName1);
        const r2 = this.getReadingByName(readingName2);
        if (!r1)
            throw new Error(`Reading "${readingName1}" not found`);
        if (!r2)
            throw new Error(`Reading "${readingName2}" not found`);
        // Divergence
        const divergence = (0, derive_1.computeDivergence)(r1, r2);
        // Tension comparison
        const curve1 = (0, derive_1.computeTensionCurve)(this.model.text, r1);
        const curve2 = (0, derive_1.computeTensionCurve)(this.model.text, r2);
        const tension_diff = compareTensionCurves(curve1, curve2);
        // Coarse-grain comparison
        const cg1 = (0, derive_1.coarseGrain)(this.model.text.rootSpan, r1);
        const cg2 = (0, derive_1.coarseGrain)(this.model.text.rootSpan, r2);
        const coarse_grain_diff = compareCoarseGrains(cg1, cg2);
        // Summary
        const summary = generateComparisonSummary(readingName1, readingName2, divergence, tension_diff, coarse_grain_diff);
        return { divergence, tension_diff, coarse_grain_diff, summary };
    }
}
exports.NarrativeAnalysisSystem = NarrativeAnalysisSystem;
