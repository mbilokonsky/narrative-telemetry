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
exports.extractTextModel = extractTextModel;
const client_1 = require("./client");
const NarrativeAnalysisSystem_1 = require("../NarrativeAnalysisSystem");
const types_1 = require("../types");
const prompts_1 = require("./prompts");
const DEFAULT_MODEL = 'claude-haiku-4-5';
const DEFAULT_MAX_TOKENS = 64000;
function emptyEmotion() {
    return { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0, intensity: 0 };
}
function ts(pct) { return { percentage: pct }; }
function base(eventId) {
    return { version: 'v1', activeAbsentials: [], currentRelationships: [], generatedBy: eventId };
}
function toSpanType(s) {
    var _a;
    const map = {
        story: types_1.StorySpanType.STORY,
        act: types_1.StorySpanType.ACT,
        scene: types_1.StorySpanType.SCENE,
        beat: types_1.StorySpanType.BEAT,
    };
    return (_a = map[s]) !== null && _a !== void 0 ? _a : types_1.StorySpanType.BEAT;
}
function toEventType(s) {
    var _a;
    const map = {
        action: types_1.NarrativeEventType.ACTION,
        dialogue: types_1.NarrativeEventType.DIALOGUE,
        revelation: types_1.NarrativeEventType.REVELATION,
        decision: types_1.NarrativeEventType.DECISION,
        environmental: types_1.NarrativeEventType.ENVIRONMENTAL,
    };
    return (_a = map[s]) !== null && _a !== void 0 ? _a : types_1.NarrativeEventType.ACTION;
}
function toRealmType(s) {
    var _a;
    const map = {
        material_reality: types_1.RealmType.MATERIAL_REALITY,
        dream: types_1.RealmType.DREAM,
        memory: types_1.RealmType.MEMORY,
        vision: types_1.RealmType.VISION,
        hypothetical_reality: types_1.RealmType.HYPOTHETICAL_REALITY,
    };
    return (_a = map[s]) !== null && _a !== void 0 ? _a : types_1.RealmType.MATERIAL_REALITY;
}
function toRelationshipLabel(s) {
    if (!s)
        return undefined;
    const map = {
        family: types_1.RelationshipLabel.FAMILY,
        friend: types_1.RelationshipLabel.FRIEND,
        enemy: types_1.RelationshipLabel.ENEMY,
        ally: types_1.RelationshipLabel.ALLY,
        rival: types_1.RelationshipLabel.RIVAL,
        lover: types_1.RelationshipLabel.LOVER,
        mentor: types_1.RelationshipLabel.MENTOR,
        subordinate: types_1.RelationshipLabel.SUBORDINATE,
        leader: types_1.RelationshipLabel.LEADER,
    };
    return map[s];
}
function toAbsentialType(s) {
    var _a;
    const map = {
        desire: types_1.AbsentialType.DESIRE,
        fear: types_1.AbsentialType.FEAR,
        goal: types_1.AbsentialType.GOAL,
        need: types_1.AbsentialType.NEED,
        expectation: types_1.AbsentialType.EXPECTATION,
        lack: types_1.AbsentialType.LACK,
        potential: types_1.AbsentialType.POTENTIAL,
        trigger: types_1.AbsentialType.TRIGGER,
    };
    return (_a = map[s]) !== null && _a !== void 0 ? _a : types_1.AbsentialType.DESIRE;
}
function toAbsentialStatus(s) {
    var _a;
    const map = {
        unsatisfied: types_1.AbsentialStatus.UNSATISFIED,
        canceled: types_1.AbsentialStatus.CANCELED,
        resolved_satisfied: types_1.AbsentialStatus.RESOLVED_SATISFIED,
        resolved_blocked: types_1.AbsentialStatus.RESOLVED_BLOCKED,
        resolved_mixed: types_1.AbsentialStatus.RESOLVED_MIXED,
    };
    return (_a = map[s]) !== null && _a !== void 0 ? _a : types_1.AbsentialStatus.UNSATISFIED;
}
function toEntityAbsentialRel(s) {
    var _a;
    const map = {
        target: types_1.EntityAbsentialRelationship.TARGET,
        obstacle: types_1.EntityAbsentialRelationship.OBSTACLE,
        facilitator: types_1.EntityAbsentialRelationship.FACILITATOR,
        influenced_by: types_1.EntityAbsentialRelationship.INFLUENCED_BY,
        catalyst: types_1.EntityAbsentialRelationship.CATALYST,
        resolver: types_1.EntityAbsentialRelationship.RESOLVER,
        creator: types_1.EntityAbsentialRelationship.CREATOR,
        beneficiary: types_1.EntityAbsentialRelationship.BENEFICIARY,
        victim: types_1.EntityAbsentialRelationship.VICTIM,
    };
    return (_a = map[s]) !== null && _a !== void 0 ? _a : types_1.EntityAbsentialRelationship.TARGET;
}
function toMentalConstructType(s) {
    var _a;
    const map = {
        fact: types_1.MentalConstructType.FACT,
        belief: types_1.MentalConstructType.BELIEF,
        opinion: types_1.MentalConstructType.OPINION,
        memory: types_1.MentalConstructType.MEMORY,
        skill: types_1.MentalConstructType.SKILL,
        speculation: types_1.MentalConstructType.SPECULATION,
    };
    return (_a = map[s]) !== null && _a !== void 0 ? _a : types_1.MentalConstructType.BELIEF;
}
function toCertaintyLevel(s) {
    var _a;
    const map = {
        certain: types_1.CertaintyLevel.CERTAIN,
        probable: types_1.CertaintyLevel.PROBABLE,
        possible: types_1.CertaintyLevel.POSSIBLE,
        doubtful: types_1.CertaintyLevel.DOUBTFUL,
        unknown: types_1.CertaintyLevel.UNKNOWN,
    };
    return (_a = map[s]) !== null && _a !== void 0 ? _a : types_1.CertaintyLevel.PROBABLE;
}
function toAwarenessLevel(s) {
    var _a;
    const map = {
        conscious: types_1.AwarenessLevel.CONSCIOUS,
        subconscious: types_1.AwarenessLevel.SUBCONSCIOUS,
        unconscious: types_1.AwarenessLevel.UNCONSCIOUS,
    };
    return (_a = map[s]) !== null && _a !== void 0 ? _a : types_1.AwarenessLevel.CONSCIOUS;
}
// ── Build TextModel from LLM extraction ──
function buildSpans(sys, parentId, children) {
    var _a;
    const idMap = {};
    for (const child of children) {
        const spanId = sys.createSpan(parentId, toSpanType(child.type), child.title, child.description, child.startPct, child.endPct);
        idMap[child.id] = spanId;
        if ((_a = child.children) === null || _a === void 0 ? void 0 : _a.length) {
            const nested = buildSpans(sys, spanId, child.children);
            Object.assign(idMap, nested);
        }
    }
    return idMap;
}
function findSpanForEvent(rootSpan, eventId) {
    var _a, _b;
    // Find the deepest span that lists this event
    for (const child of (_a = rootSpan.children) !== null && _a !== void 0 ? _a : []) {
        const found = findSpanForEvent(child, eventId);
        if (found)
            return found;
    }
    if ((_b = rootSpan.eventIds) === null || _b === void 0 ? void 0 : _b.includes(eventId))
        return rootSpan.id;
    return null;
}
function buildTextModel(extraction) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63;
    const sys = new NarrativeAnalysisSystem_1.NarrativeAnalysisSystem(extraction.title, extraction.author, extraction.description);
    const rootId = sys.getRootSpanId();
    // Build span tree and collect ID mapping
    const spanMap = buildSpans(sys, rootId, (_a = extraction.rootSpan.children) !== null && _a !== void 0 ? _a : []);
    spanMap[extraction.rootSpan.id] = rootId;
    // Register settings first (characters reference them for location)
    for (const s of (_b = extraction.settings) !== null && _b !== void 0 ? _b : []) {
        sys.addSetting({
            id: s.id,
            name: s.name,
            description: s.description,
            tags: (_c = s.tags) !== null && _c !== void 0 ? _c : [],
            textMentions: (_d = s.textMentions) !== null && _d !== void 0 ? _d : [],
            context: (_e = s.context) !== null && _e !== void 0 ? _e : '',
            type: types_1.DiegeticEntityType.SETTING,
            realm: toRealmType((_f = s.realm) !== null && _f !== void 0 ? _f : 'material_reality'),
            geography: (_g = s.geography) !== null && _g !== void 0 ? _g : '',
            climate: (_h = s.climate) !== null && _h !== void 0 ? _h : '',
            historicalContext: (_j = s.historicalContext) !== null && _j !== void 0 ? _j : '',
            culturalBackground: (_k = s.culturalBackground) !== null && _k !== void 0 ? _k : '',
            parentSetting: s.parentSetting,
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_l = s.firstEvent) !== null && _l !== void 0 ? _l : 'init')), { currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: {}, culturalNorms: {}, tension: 0, atmosphere: (_m = s.atmosphere) !== null && _m !== void 0 ? _m : '' }),
                    causedBy: {},
                }],
            firstIntroduced: (_o = s.firstEvent) !== null && _o !== void 0 ? _o : 'init',
        });
    }
    // Register characters
    for (const c of (_p = extraction.characters) !== null && _p !== void 0 ? _p : []) {
        sys.addCharacter({
            id: c.id,
            name: c.name,
            description: c.description,
            tags: (_q = c.tags) !== null && _q !== void 0 ? _q : [],
            textMentions: (_r = c.textMentions) !== null && _r !== void 0 ? _r : [],
            context: (_s = c.context) !== null && _s !== void 0 ? _s : '',
            type: types_1.DiegeticEntityType.CHARACTER,
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_t = c.firstEvent) !== null && _t !== void 0 ? _t : 'init')), { emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: (_u = c.initialLocation) !== null && _u !== void 0 ? _u : '', factionRelationships: {}, age: (_v = c.age) !== null && _v !== void 0 ? _v : 0, gender: (_w = c.gender) !== null && _w !== void 0 ? _w : 'unknown', occupation: (_x = c.occupation) !== null && _x !== void 0 ? _x : '', personalityTraits: (_y = c.personalityTraits) !== null && _y !== void 0 ? _y : [], coreValues: (_z = c.coreValues) !== null && _z !== void 0 ? _z : [], physicalDescription: (_0 = c.physicalDescription) !== null && _0 !== void 0 ? _0 : '', skills: {}, socialStatus: {} }),
                    causedBy: {},
                }],
            firstIntroduced: (_1 = c.firstEvent) !== null && _1 !== void 0 ? _1 : 'init',
        });
    }
    // Register items
    for (const item of (_2 = extraction.items) !== null && _2 !== void 0 ? _2 : []) {
        sys.addItem({
            id: item.id,
            name: item.name,
            description: item.description,
            tags: (_3 = item.tags) !== null && _3 !== void 0 ? _3 : [],
            textMentions: (_4 = item.textMentions) !== null && _4 !== void 0 ? _4 : [],
            context: (_5 = item.context) !== null && _5 !== void 0 ? _5 : '',
            type: types_1.DiegeticEntityType.ITEM,
            itemType: (_6 = item.itemType) !== null && _6 !== void 0 ? _6 : '',
            origin: (_7 = item.origin) !== null && _7 !== void 0 ? _7 : '',
            physicalDescription: (_8 = item.physicalDescription) !== null && _8 !== void 0 ? _8 : '',
            defaultFunction: (_9 = item.defaultFunction) !== null && _9 !== void 0 ? _9 : '',
            culturalSignificance: item.culturalSignificance,
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_10 = item.firstEvent) !== null && _10 !== void 0 ? _10 : 'init')), { location: (_11 = item.initialLocation) !== null && _11 !== void 0 ? _11 : '', condition: 'normal', owner: (_12 = item.initialOwner) !== null && _12 !== void 0 ? _12 : null, isHidden: false }),
                    causedBy: {},
                }],
            firstIntroduced: (_13 = item.firstEvent) !== null && _13 !== void 0 ? _13 : 'init',
        });
    }
    // Register factions
    for (const f of (_14 = extraction.factions) !== null && _14 !== void 0 ? _14 : []) {
        sys.addFaction({
            id: f.id,
            name: f.name,
            description: f.description,
            tags: (_15 = f.tags) !== null && _15 !== void 0 ? _15 : [],
            textMentions: (_16 = f.textMentions) !== null && _16 !== void 0 ? _16 : [],
            context: (_17 = f.context) !== null && _17 !== void 0 ? _17 : '',
            type: types_1.DiegeticEntityType.FACTION,
            foundingPrinciples: (_18 = f.foundingPrinciples) !== null && _18 !== void 0 ? _18 : [],
            historicalContext: (_19 = f.historicalContext) !== null && _19 !== void 0 ? _19 : '',
            organizationalStructure: (_20 = f.organizationalStructure) !== null && _20 !== void 0 ? _20 : '',
            recruitmentMethods: [],
            symbolism: { colors: [], emblem: '', motto: '' },
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_21 = f.firstEvent) !== null && _21 !== void 0 ? _21 : 'init')), { members: (_22 = f.members) !== null && _22 !== void 0 ? _22 : [], sharedMentalConstructs: [], influence: 0, resources: {}, ideology: {}, relationships: {}, publicOpinion: 0 }),
                    causedBy: {},
                }],
            firstIntroduced: (_23 = f.firstEvent) !== null && _23 !== void 0 ? _23 : 'init',
        });
    }
    // Register events (need to resolve span IDs)
    for (const e of (_24 = extraction.events) !== null && _24 !== void 0 ? _24 : []) {
        const extractionSpanId = findSpanForEvent(extraction.rootSpan, e.id);
        const systemSpanId = extractionSpanId ? ((_25 = spanMap[extractionSpanId]) !== null && _25 !== void 0 ? _25 : rootId) : rootId;
        sys.addEvent(systemSpanId, {
            id: e.id,
            type: toEventType(e.type),
            description: e.description,
            timestamp: (_26 = e.timestamp) !== null && _26 !== void 0 ? _26 : ts(0),
            textLocation: (_27 = e.textLocation) !== null && _27 !== void 0 ? _27 : { startLine: 1, endLine: 1 },
            participants: (_28 = e.participants) !== null && _28 !== void 0 ? _28 : [],
            precedingEvent: e.precedingEvent,
        });
    }
    // Register interpersonal relationships
    for (const r of (_30 = (_29 = extraction.relationships) === null || _29 === void 0 ? void 0 : _29.interpersonal) !== null && _30 !== void 0 ? _30 : []) {
        sys.addInterpersonalRelationship({
            id: r.id,
            name: r.name,
            description: r.description,
            tags: (_31 = r.tags) !== null && _31 !== void 0 ? _31 : [],
            type: types_1.RelationshipType.INTERPERSONAL,
            participants: r.participants,
            nature: (_32 = r.nature) !== null && _32 !== void 0 ? _32 : '',
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_33 = r.firstEvent) !== null && _33 !== void 0 ? _33 : 'init')), { strength: (_34 = r.strength) !== null && _34 !== void 0 ? _34 : 0.5, dynamics: { power: 0, influence: 0, conflict: 0 }, label: toRelationshipLabel(r.label) }),
                    causedBy: {},
                }],
            firstIntroduced: (_35 = r.firstEvent) !== null && _35 !== void 0 ? _35 : 'init',
        });
    }
    // Register group relationships
    for (const r of (_37 = (_36 = extraction.relationships) === null || _36 === void 0 ? void 0 : _36.group) !== null && _37 !== void 0 ? _37 : []) {
        sys.addGroupRelationship({
            id: r.id,
            name: r.name,
            description: r.description,
            tags: (_38 = r.tags) !== null && _38 !== void 0 ? _38 : [],
            type: types_1.RelationshipType.GROUP,
            participants: (_39 = r.participants) !== null && _39 !== void 0 ? _39 : [],
            nature: (_40 = r.nature) !== null && _40 !== void 0 ? _40 : '',
            subRelationships: [],
            groupDynamics: {
                cohesion: (_41 = r.cohesion) !== null && _41 !== void 0 ? _41 : 0.5,
                sharedPurpose: (_42 = r.sharedPurpose) !== null && _42 !== void 0 ? _42 : 0.5,
                internalConflict: 0,
            },
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_43 = r.firstEvent) !== null && _43 !== void 0 ? _43 : 'init')), { strength: 0.5, dynamics: { power: 0, influence: 0, conflict: 0 } }),
                    causedBy: {},
                }],
            firstIntroduced: (_44 = r.firstEvent) !== null && _44 !== void 0 ? _44 : 'init',
        });
    }
    // Register absentials
    for (const a of (_45 = extraction.absentials) !== null && _45 !== void 0 ? _45 : []) {
        sys.addAbsential({
            id: a.id,
            name: a.name,
            description: a.description,
            tags: (_46 = a.tags) !== null && _46 !== void 0 ? _46 : [],
            holder: a.holder,
            origin: (_47 = a.origin) !== null && _47 !== void 0 ? _47 : '',
            childAbsentials: [],
            conflictingAbsentials: [],
            relatedEntities: ((_48 = a.relatedEntities) !== null && _48 !== void 0 ? _48 : []).map((re) => {
                var _a;
                return ({
                    entityId: re.entityId,
                    relationship: toEntityAbsentialRel(re.relationship),
                    strength: (_a = re.strength) !== null && _a !== void 0 ? _a : 0.5,
                });
            }),
            relatedAbsentials: [],
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_49 = a.firstEvent) !== null && _49 !== void 0 ? _49 : 'init')), { type: toAbsentialType(a.type), status: toAbsentialStatus((_50 = a.initialStatus) !== null && _50 !== void 0 ? _50 : 'unsatisfied'), urgency: (_51 = a.urgency) !== null && _51 !== void 0 ? _51 : 0.5, intensity: (_52 = a.intensity) !== null && _52 !== void 0 ? _52 : 0.5 }),
                    causedBy: {},
                }],
            firstIntroduced: (_53 = a.firstEvent) !== null && _53 !== void 0 ? _53 : 'init',
        });
    }
    // Register mental constructs
    for (const mc of (_54 = extraction.mentalConstructs) !== null && _54 !== void 0 ? _54 : []) {
        sys.addMentalConstruct({
            id: mc.id,
            name: mc.name,
            description: mc.description,
            tags: (_55 = mc.tags) !== null && _55 !== void 0 ? _55 : [],
            holder: mc.holder,
            subject: mc.subject,
            isDiegetic: (_56 = mc.isDiegetic) !== null && _56 !== void 0 ? _56 : true,
            source: mc.firstEvent,
            relatedConstructs: [],
            conflictingConstructs: [],
            supportingConstructs: [],
            stateHistory: [{
                    timestamp: ts(0),
                    data: Object.assign(Object.assign({}, base((_57 = mc.firstEvent) !== null && _57 !== void 0 ? _57 : 'init')), { content: (_58 = mc.content) !== null && _58 !== void 0 ? _58 : mc.description, type: toMentalConstructType((_59 = mc.type) !== null && _59 !== void 0 ? _59 : 'belief'), certainty: toCertaintyLevel((_60 = mc.certainty) !== null && _60 !== void 0 ? _60 : 'probable'), awareness: toAwarenessLevel((_61 = mc.awareness) !== null && _61 !== void 0 ? _61 : 'conscious'), emotionalAssociation: {}, salience: (_62 = mc.salience) !== null && _62 !== void 0 ? _62 : 0.5 }),
                    causedBy: {},
                }],
            firstIntroduced: (_63 = mc.firstEvent) !== null && _63 !== void 0 ? _63 : 'init',
        });
    }
    return sys.getModel().text;
}
// ── Main extraction function ──
function extractTextModel(text_1) {
    return __awaiter(this, arguments, void 0, function* (text, options = {}) {
        var _a, e_1, _b, _c;
        var _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const client = (0, client_1.createClient)();
        const lineCount = text.split('\n').length;
        console.log(`[extract] Sending ${lineCount}-line text to LLM for extraction...`);
        // Use streaming to avoid timeout on large responses
        let fullText = '';
        const stream = client.messages.stream({
            model: (_d = options.model) !== null && _d !== void 0 ? _d : DEFAULT_MODEL,
            max_tokens: (_e = options.maxTokens) !== null && _e !== void 0 ? _e : DEFAULT_MAX_TOKENS,
            temperature: (_f = options.temperature) !== null && _f !== void 0 ? _f : 0.2,
            system: prompts_1.EXTRACTION_SYSTEM_PROMPT,
            messages: [{
                    role: 'user',
                    content: (0, prompts_1.buildExtractionUserPrompt)(text, lineCount),
                }],
        });
        try {
            for (var _o = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _o = true) {
                _c = stream_1_1.value;
                _o = false;
                const event = _c;
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    fullText += event.delta.text;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_o && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        let rawJson = fullText.trim();
        // Strip markdown fences if present
        if (rawJson.startsWith('```')) {
            rawJson = rawJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        let extraction;
        try {
            extraction = JSON.parse(rawJson);
        }
        catch (err) {
            console.error('[extract] Failed to parse LLM JSON output');
            console.error('[extract] Raw output (first 500 chars):', rawJson.slice(0, 500));
            throw new Error(`JSON parse error: ${err.message}`);
        }
        console.log(`[extract] Parsed extraction: ${(_h = (_g = extraction.events) === null || _g === void 0 ? void 0 : _g.length) !== null && _h !== void 0 ? _h : 0} events, ${(_k = (_j = extraction.characters) === null || _j === void 0 ? void 0 : _j.length) !== null && _k !== void 0 ? _k : 0} characters, ${(_m = (_l = extraction.settings) === null || _l === void 0 ? void 0 : _l.length) !== null && _m !== void 0 ? _m : 0} settings`);
        const textModel = buildTextModel(extraction);
        console.log(`[extract] Built TextModel: "${textModel.title}" by ${textModel.author}`);
        return textModel;
    });
}
