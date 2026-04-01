"use strict";
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
    const map = {
        first_person: types_1.NarratorPerspective.FIRST_PERSON,
        second_person: types_1.NarratorPerspective.SECOND_PERSON,
        third_person_limited: types_1.NarratorPerspective.THIRD_PERSON_LIMITED,
        third_person_omniscient: types_1.NarratorPerspective.THIRD_PERSON_OMNISCIENT,
    };
    return map[s] ?? types_1.NarratorPerspective.FIRST_PERSON;
}
// ── Build Reading from LLM interpretation ──
function buildReading(result, textModel) {
    // We use NarrativeAnalysisSystem to build the reading, feeding it the textModel first
    const sys = new NarrativeAnalysisSystem_1.NarrativeAnalysisSystem(textModel.title, textModel.author, textModel.description);
    // We need to get the model to inject our textModel, but the system creates its own.
    // Instead, build the Reading directly.
    const narrator = {
        id: 'narrator',
        name: result.narrator?.name ?? 'Narrator',
        description: result.narrator?.description ?? '',
        tags: [],
        type: types_1.NonDiegeticEntityType.NARRATOR,
        stateHistory: [{
                timestamp: ts(0),
                data: {
                    ...base('init'),
                    reliability: result.narrator?.reliability ?? 0.8,
                    mentalConstructs: [],
                    perspective: toNarratorPerspective(result.narrator?.perspective ?? 'first_person'),
                },
                causedBy: {},
            }],
        firstIntroduced: 'init',
    };
    const reader = {
        id: 'reader',
        name: result.reader?.name ?? 'Implied Reader',
        description: result.reader?.description ?? '',
        tags: [],
        type: types_1.NonDiegeticEntityType.READER,
        stateHistory: [{
                timestamp: ts(0),
                data: {
                    ...base('init'),
                    mentalConstructs: [],
                    emotions: emptyEmotion(),
                },
                causedBy: {},
            }],
        firstIntroduced: 'init',
    };
    const author = {
        id: 'author',
        name: result.author?.name ?? textModel.author,
        description: result.author?.description ?? '',
        tags: [],
        type: types_1.NonDiegeticEntityType.AUTHOR,
        stateHistory: [{
                timestamp: ts(0),
                data: {
                    ...base('init'),
                    style: {},
                    themes: [],
                },
                causedBy: {},
            }],
        firstIntroduced: 'init',
    };
    // Build themes
    const themes = {};
    for (const t of result.themes ?? []) {
        themes[t.id] = {
            id: t.id,
            name: t.name,
            description: t.description,
            tags: t.tags ?? [],
            type: types_1.NonDiegeticEntityType.THEME,
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(t.firstEvent ?? 'init'),
                        prevalence: 0.5,
                        relatedElements: [],
                        manifestations: [],
                        progression: [],
                    },
                    causedBy: {},
                }],
            firstIntroduced: t.firstEvent ?? 'init',
        };
    }
    // Build symbols
    const symbols = {};
    for (const s of result.symbols ?? []) {
        symbols[s.id] = {
            id: s.id,
            name: s.name,
            description: s.description,
            tags: s.tags ?? [],
            type: types_1.NonDiegeticEntityType.SYMBOL,
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(s.firstEvent ?? 'init'),
                        currentMeanings: (s.meanings ?? []).map((m) => ({
                            description: m.description,
                            strength: m.strength ?? 0.5,
                        })),
                        currentManifestations: s.manifestations ?? [],
                    },
                    causedBy: {},
                }],
            firstIntroduced: s.firstEvent ?? 'init',
        };
    }
    // Build symbolic relationships
    const symbolicRelationships = {};
    for (const sr of result.symbolicRelationships ?? []) {
        symbolicRelationships[sr.id] = {
            id: sr.id,
            name: sr.name,
            description: sr.description,
            tags: [],
            type: types_1.RelationshipType.SYMBOLIC,
            participants: [sr.symbol, sr.symbolized],
            nature: sr.interpretation ?? '',
            symbol: sr.symbol,
            symbolized: sr.symbolized,
            interpretation: sr.interpretation ?? '',
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(sr.firstEvent ?? 'init'),
                        strength: 0.5,
                        dynamics: { power: 0, influence: 0, conflict: 0 },
                    },
                    causedBy: {},
                }],
            firstIntroduced: sr.firstEvent ?? 'init',
        };
    }
    // Build event significance (ensure all events covered)
    const eventSignificance = {};
    for (const [eventId, ann] of Object.entries(result.eventSignificance ?? {})) {
        eventSignificance[eventId] = {
            significance: ann.significance ?? 0.5,
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
    for (const [id, sig] of Object.entries(result.entitySignificance ?? {})) {
        entitySignificance[id] = { significance: sig.significance ?? 0.5, note: sig.note };
    }
    // Build absential significance
    const absentialSignificance = {};
    for (const [id, sig] of Object.entries(result.absentialSignificance ?? {})) {
        absentialSignificance[id] = { significance: sig.significance ?? 0.5, note: sig.note };
    }
    // Build span annotations
    const spanAnnotations = {};
    for (const [spanId, ann] of Object.entries(result.spanAnnotations ?? {})) {
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
        globalTension: (result.globalTension ?? []).map(pt => ({
            timestamp: pt.timestamp,
            value: pt.value,
        })),
        spanAnnotations,
    };
    return { name: result.name, reading };
}
// ── Main interpretation function ──
async function interpretReading(textModel, lens, options = {}) {
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
        model: options.model ?? DEFAULT_MODEL,
        max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: options.temperature ?? 0.3,
        system: prompts_1.INTERPRETATION_SYSTEM_PROMPT,
        messages: [{
                role: 'user',
                content: (0, prompts_1.buildInterpretationUserPrompt)(textModelJson, lens),
            }],
    });
    for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
        }
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
    const eventCount = Object.keys(result.eventSignificance ?? {}).length;
    console.log(`[interpret] Parsed reading: "${result.name}" with ${result.themes?.length ?? 0} themes, ${result.symbols?.length ?? 0} symbols, ${eventCount} event annotations`);
    const built = buildReading(result, textModel);
    console.log(`[interpret] Built reading: "${built.name}"`);
    return built;
}
function summarizeSpanTree(span) {
    return {
        id: span.id,
        type: span.type,
        title: span.title,
        events: span.events,
        children: (span.childSpans ?? []).map(summarizeSpanTree),
    };
}
