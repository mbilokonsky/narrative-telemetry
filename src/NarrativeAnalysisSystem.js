"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NarrativeAnalysisSystem = void 0;
const types_1 = require("./types");
let counter = 0;
function generateId(prefix) {
    return `${prefix}_${++counter}`;
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
        const root = from !== null && from !== void 0 ? from : this.model.text.rootSpan;
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
        var _a;
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('char');
        this.model.text.diegetic.characters[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    addSetting(data) {
        var _a;
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('setting');
        this.model.text.diegetic.settings[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    addItem(data) {
        var _a;
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('item');
        this.model.text.diegetic.items[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    addFaction(data) {
        var _a;
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('faction');
        this.model.text.diegetic.factions[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    // ── Diegetic relationships ──
    addInterpersonalRelationship(data) {
        var _a;
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('rel');
        this.model.text.relationships.interpersonal[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    addGroupRelationship(data) {
        var _a;
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('rel');
        this.model.text.relationships.group[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    // ── Absentials ──
    addAbsential(data) {
        var _a;
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('abs');
        this.model.text.absentials[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    updateAbsentialStatus(absentialId, status, eventId, timestamp) {
        const abs = this.model.text.absentials[absentialId];
        if (!abs)
            throw new Error(`Absential ${absentialId} not found`);
        const lastState = abs.stateHistory[abs.stateHistory.length - 1];
        abs.stateHistory.push({
            timestamp,
            data: Object.assign(Object.assign({}, lastState.data), { status }),
            causedBy: { eventId },
        });
    }
    // ── Diegetic mental constructs ──
    addMentalConstruct(data) {
        var _a;
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('mc');
        this.model.text.mentalConstructs[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    // ── Text annotations (diegetic) ──
    annotate(entityId, startLine, startChar, endLine, endChar, mentionText, note) {
        this.model.text.annotations.push({ entityId, startLine, startChar, endLine, endChar, mentionText, note });
    }
    // ── Events ──
    addEvent(spanId, data) {
        var _a;
        const span = this.findSpan(spanId);
        if (!span)
            throw new Error(`Span ${spanId} not found`);
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('evt');
        const event = Object.assign(Object.assign({}, data), { id });
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
        var _a;
        const r = this.getReading(readingName);
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('theme');
        r.themes[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    addSymbol(readingName, data) {
        var _a;
        const r = this.getReading(readingName);
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('sym');
        r.symbols[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    addSymbolicRelationship(readingName, data) {
        var _a;
        const r = this.getReading(readingName);
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('symrel');
        r.symbolicRelationships[id] = Object.assign(Object.assign({}, data), { id });
        return id;
    }
    addReadingMentalConstruct(readingName, data) {
        var _a;
        const r = this.getReading(readingName);
        const id = (_a = data.id) !== null && _a !== void 0 ? _a : generateId('rmc');
        r.mentalConstructs[id] = Object.assign(Object.assign({}, data), { id });
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
}
exports.NarrativeAnalysisSystem = NarrativeAnalysisSystem;
