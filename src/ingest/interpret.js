"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpretReading = interpretReading;
const client_1 = require("./client");
const types_1 = require("../types");
const NarrativeAnalysisSystem_1 = require("../NarrativeAnalysisSystem");
const prompts_1 = require("./prompts");
const DEFAULT_MODEL = 'claude-haiku-4-5';
const DEFAULT_MAX_TOKENS = 32000;
function ts(pct) { return { percentage: pct }; }
function base(eventId) {
    return { version: 'v1', activeAbsentials: [], currentRelationships: [], generatedBy: eventId };
}
function emptyEmotion() {
    return { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0, intensity: 0 };
}
function toNarratorPerspective(s) {
    var _a;
    const map = {
        first_person: types_1.NarratorPerspective.FIRST_PERSON,
        second_person: types_1.NarratorPerspective.SECOND_PERSON,
        third_person_limited: types_1.NarratorPerspective.THIRD_PERSON_LIMITED,
        third_person_omniscient: types_1.NarratorPerspective.THIRD_PERSON_OMNISCIENT,
    };
    return (_a = map[s]) !== null && _a !== void 0 ? _a : types_1.NarratorPerspective.FIRST_PERSON;
}
// ── Build Reading from LLM interpretation ──
function buildReading(result, textModel) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14;
    // We use NarrativeAnalysisSystem to build the reading, feeding it the textModel first
    const sys = new NarrativeAnalysisSystem_1.NarrativeAnalysisSystem(textModel.title, textModel.author, textModel.description);
    // We need to get the model to inject our textModel, but the system creates its own.
    // Instead, build the Reading directly.
    const narrator = {
        id: 'narrator',
        name: (_b = (_a = result.narrator) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'Narrator',
        description: (_d = (_c = result.narrator) === null || _c === void 0 ? void 0 : _c.description) !== null && _d !== void 0 ? _d : '',
        tags: [],
        type: types_1.NonDiegeticEntityType.NARRATOR,
        stateHistory: [{
                timestamp: ts(0),
                data: Object.assign(Object.assign({}, base('init')), { reliability: (_f = (_e = result.narrator) === null || _e === void 0 ? void 0 : _e.reliability) !== null && _f !== void 0 ? _f : 0.8, mentalConstructs: [], perspective: toNarratorPerspective((_h = (_g = result.narrator) === null || _g === void 0 ? void 0 : _g.perspective) !== null && _h !== void 0 ? _h : 'first_person') }),
                causedBy: {},
            }],
        firstIntroduced: 'init',
    };
    const reader = {
        id: 'reader',
        name: (_k = (_j = result.reader) === null || _j === void 0 ? void 0 : _j.name) !== null && _k !== void 0 ? _k : 'Implied Reader',
        description: (_m = (_l = result.reader) === null || _l === void 0 ? void 0 : _l.description) !== null && _m !== void 0 ? _m : '',
        tags: [],
        type: types_1.NonDiegeticEntityType.READER,
        stateHistory: [{
                timestamp: ts(0),
                data: Object.assign(Object.assign({}, base('init')), { mentalConstructs: [], emotions: emptyEmotion() }),
                causedBy: {},
            }],
        firstIntroduced: 'init',
    };
    const author = {
        id: 'author',
        name: (_p = (_o = result.author) === null || _o === void 0 ? void 0 : _o.name) !== null && _p !== void 0 ? _p : textModel.author,
        description: (_r = (_q = result.author) === null || _q === void 0 ? void 0 : _q.description) !== null && _r !== void 0 ? _r : '',
        tags: [],
        type: types_1.NonDiegeticEntityType.AUTHOR,
        stateHistory: [{
                timestamp: ts(0),
                data: Object.assign(Object.assign({}, base('init')), { style: {}, themes: [] }),
                causedBy: {},
            }],
        firstIntroduced: 'init',
    };
    // Build themes
    const themes = {};
    for (const t of (_s = result.themes) !== null && _s !== void 0 ? _s : []) {
        themes[t.id] = {
            id: t.id,
            name: t.name,
            description: t.description,
            tags: (_t = t.tags) !== null && _t !== void 0 ? _t : [],
            type: types_1.NonDiegeticEntityType.THEME,
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_u = t.firstEvent) !== null && _u !== void 0 ? _u : 'init')), { prevalence: 0.5, relatedElements: [], manifestations: [], progression: [] }),
                    causedBy: {},
                }],
            firstIntroduced: (_v = t.firstEvent) !== null && _v !== void 0 ? _v : 'init',
        };
    }
    // Build symbols
    const symbols = {};
    for (const s of (_w = result.symbols) !== null && _w !== void 0 ? _w : []) {
        symbols[s.id] = {
            id: s.id,
            name: s.name,
            description: s.description,
            tags: (_x = s.tags) !== null && _x !== void 0 ? _x : [],
            type: types_1.NonDiegeticEntityType.SYMBOL,
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_y = s.firstEvent) !== null && _y !== void 0 ? _y : 'init')), { currentMeanings: ((_z = s.meanings) !== null && _z !== void 0 ? _z : []).map((m) => {
                            var _a;
                            return ({
                                description: m.description,
                                strength: (_a = m.strength) !== null && _a !== void 0 ? _a : 0.5,
                            });
                        }), currentManifestations: (_0 = s.manifestations) !== null && _0 !== void 0 ? _0 : [] }),
                    causedBy: {},
                }],
            firstIntroduced: (_1 = s.firstEvent) !== null && _1 !== void 0 ? _1 : 'init',
        };
    }
    // Build symbolic relationships
    const symbolicRelationships = {};
    for (const sr of (_2 = result.symbolicRelationships) !== null && _2 !== void 0 ? _2 : []) {
        symbolicRelationships[sr.id] = {
            id: sr.id,
            name: sr.name,
            description: sr.description,
            tags: [],
            type: types_1.RelationshipType.SYMBOLIC,
            participants: [sr.symbol, sr.symbolized],
            nature: (_3 = sr.interpretation) !== null && _3 !== void 0 ? _3 : '',
            symbol: sr.symbol,
            symbolized: sr.symbolized,
            interpretation: (_4 = sr.interpretation) !== null && _4 !== void 0 ? _4 : '',
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_5 = sr.firstEvent) !== null && _5 !== void 0 ? _5 : 'init')), { strength: 0.5, dynamics: { power: 0, influence: 0, conflict: 0 } }),
                    causedBy: {},
                }],
            firstIntroduced: (_6 = sr.firstEvent) !== null && _6 !== void 0 ? _6 : 'init',
        };
    }
    // Build event significance (ensure all events covered)
    const eventSignificance = {};
    for (const [eventId, ann] of Object.entries((_7 = result.eventSignificance) !== null && _7 !== void 0 ? _7 : {})) {
        eventSignificance[eventId] = {
            significance: (_8 = ann.significance) !== null && _8 !== void 0 ? _8 : 0.5,
            note: ann.note,
            causes: ann.causes,
        };
    }
    // Fill in any missing events with default 0.3
    for (const eventId of Object.keys(textModel.events)) {
        if (!eventSignificance[eventId]) {
            eventSignificance[eventId] = { significance: 0.3 };
        }
    }
    // Build entity significance
    const entitySignificance = {};
    for (const [id, sig] of Object.entries((_9 = result.entitySignificance) !== null && _9 !== void 0 ? _9 : {})) {
        entitySignificance[id] = { significance: (_10 = sig.significance) !== null && _10 !== void 0 ? _10 : 0.5, note: sig.note };
    }
    // Build absential significance
    const absentialSignificance = {};
    for (const [id, sig] of Object.entries((_11 = result.absentialSignificance) !== null && _11 !== void 0 ? _11 : {})) {
        absentialSignificance[id] = { significance: (_12 = sig.significance) !== null && _12 !== void 0 ? _12 : 0.5, note: sig.note };
    }
    // Build span annotations
    const spanAnnotations = {};
    for (const [spanId, ann] of Object.entries((_13 = result.spanAnnotations) !== null && _13 !== void 0 ? _13 : {})) {
        spanAnnotations[spanId] = {
            tension: ann.tension,
            note: ann.note,
        };
    }
    const reading = {
        name: result.name,
        description: result.description,
        themes,
        symbols,
        symbolicRelationships,
        narrator,
        reader,
        author,
        eventSignificance,
        entitySignificance,
        absentialSignificance,
        mentalConstructs: {},
        annotations: [],
        globalTension: ((_14 = result.globalTension) !== null && _14 !== void 0 ? _14 : []).map(pt => ({
            timestamp: pt.timestamp,
            value: pt.value,
        })),
        spanAnnotations,
    };
    return { name: result.name, reading };
}
// ── Main interpretation function ──
function interpretReading(textModel_1, lens_1) {
    return __awaiter(this, arguments, void 0, function* (textModel, lens, options = {}) {
        var _a, e_1, _b, _c;
        var _d, _e, _f, _g, _h, _j, _k, _l;
        const client = (0, client_1.createClient)();
        // Prepare a compact version of textModel for the prompt
        // (omit deeply nested state histories to save tokens)
        const compactModel = {
            title: textModel.title,
            author: textModel.author,
            description: textModel.description,
            events: Object.fromEntries(Object.entries(textModel.events).map(([id, e]) => [id, {
                    id: e.id,
                    type: e.type,
                    description: e.description,
                    timestamp: e.timestamp,
                    textLocation: e.textLocation,
                    participants: e.participants,
                }])),
            characters: Object.fromEntries(Object.entries(textModel.diegetic.characters).map(([id, c]) => [id, {
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    tags: c.tags,
                }])),
            settings: Object.fromEntries(Object.entries(textModel.diegetic.settings).map(([id, s]) => [id, {
                    id: s.id,
                    name: s.name,
                    description: s.description,
                }])),
            items: Object.fromEntries(Object.entries(textModel.diegetic.items).map(([id, i]) => [id, {
                    id: i.id,
                    name: i.name,
                    description: i.description,
                }])),
            absentials: Object.fromEntries(Object.entries(textModel.absentials).map(([id, a]) => [id, {
                    id: a.id,
                    name: a.name,
                    description: a.description,
                    holder: a.holder,
                }])),
            spanTree: summarizeSpanTree(textModel.rootSpan),
        };
        const textModelJson = JSON.stringify(compactModel, null, 2);
        console.log(`[interpret] Generating "${lens}" reading (${Object.keys(textModel.events).length} events to annotate)...`);
        // Use streaming to avoid timeout on large responses
        let fullText = '';
        const stream = client.messages.stream({
            model: (_d = options.model) !== null && _d !== void 0 ? _d : DEFAULT_MODEL,
            max_tokens: (_e = options.maxTokens) !== null && _e !== void 0 ? _e : DEFAULT_MAX_TOKENS,
            temperature: (_f = options.temperature) !== null && _f !== void 0 ? _f : 0.3,
            system: prompts_1.INTERPRETATION_SYSTEM_PROMPT,
            messages: [{
                    role: 'user',
                    content: (0, prompts_1.buildInterpretationUserPrompt)(textModelJson, lens),
                }],
        });
        try {
            for (var _m = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _m = true) {
                _c = stream_1_1.value;
                _m = false;
                const event = _c;
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    fullText += event.delta.text;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_m && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        let rawJson = fullText.trim();
        if (rawJson.startsWith('```')) {
            rawJson = rawJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        let result;
        try {
            result = JSON.parse(rawJson);
        }
        catch (err) {
            console.error('[interpret] Failed to parse LLM JSON output');
            console.error('[interpret] Raw output (first 500 chars):', rawJson.slice(0, 500));
            throw new Error(`JSON parse error: ${err.message}`);
        }
        const eventCount = Object.keys((_g = result.eventSignificance) !== null && _g !== void 0 ? _g : {}).length;
        console.log(`[interpret] Parsed reading: "${result.name}" with ${(_j = (_h = result.themes) === null || _h === void 0 ? void 0 : _h.length) !== null && _j !== void 0 ? _j : 0} themes, ${(_l = (_k = result.symbols) === null || _k === void 0 ? void 0 : _k.length) !== null && _l !== void 0 ? _l : 0} symbols, ${eventCount} event annotations`);
        const built = buildReading(result, textModel);
        console.log(`[interpret] Built reading: "${built.name}"`);
        return built;
    });
}
function summarizeSpanTree(span) {
    var _a;
    return {
        id: span.id,
        type: span.type,
        title: span.title,
        events: span.events,
        children: ((_a = span.childSpans) !== null && _a !== void 0 ? _a : []).map(summarizeSpanTree),
    };
}
