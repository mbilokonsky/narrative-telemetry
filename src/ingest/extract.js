"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChunkStats = exports.chunkText = exports.EntityRegistry = void 0;
exports.extractTextModel = extractTextModel;
exports.extractTextModelChunked = extractTextModelChunked;
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
    const map = {
        story: types_1.StorySpanType.STORY,
        act: types_1.StorySpanType.ACT,
        scene: types_1.StorySpanType.SCENE,
        beat: types_1.StorySpanType.BEAT,
    };
    return map[s] ?? types_1.StorySpanType.BEAT;
}
function toEventType(s) {
    const map = {
        action: types_1.NarrativeEventType.ACTION,
        dialogue: types_1.NarrativeEventType.DIALOGUE,
        revelation: types_1.NarrativeEventType.REVELATION,
        decision: types_1.NarrativeEventType.DECISION,
        environmental: types_1.NarrativeEventType.ENVIRONMENTAL,
    };
    return map[s] ?? types_1.NarrativeEventType.ACTION;
}
function toRealmType(s) {
    const map = {
        material_reality: types_1.RealmType.MATERIAL_REALITY,
        dream: types_1.RealmType.DREAM,
        memory: types_1.RealmType.MEMORY,
        vision: types_1.RealmType.VISION,
        hypothetical_reality: types_1.RealmType.HYPOTHETICAL_REALITY,
    };
    return map[s] ?? types_1.RealmType.MATERIAL_REALITY;
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
    return map[s] ?? types_1.AbsentialType.DESIRE;
}
function toAbsentialStatus(s) {
    const map = {
        unsatisfied: types_1.AbsentialStatus.UNSATISFIED,
        canceled: types_1.AbsentialStatus.CANCELED,
        resolved_satisfied: types_1.AbsentialStatus.RESOLVED_SATISFIED,
        resolved_blocked: types_1.AbsentialStatus.RESOLVED_BLOCKED,
        resolved_mixed: types_1.AbsentialStatus.RESOLVED_MIXED,
    };
    return map[s] ?? types_1.AbsentialStatus.UNSATISFIED;
}
function toEntityAbsentialRel(s) {
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
    return map[s] ?? types_1.EntityAbsentialRelationship.TARGET;
}
function toMentalConstructType(s) {
    const map = {
        fact: types_1.MentalConstructType.FACT,
        belief: types_1.MentalConstructType.BELIEF,
        opinion: types_1.MentalConstructType.OPINION,
        memory: types_1.MentalConstructType.MEMORY,
        skill: types_1.MentalConstructType.SKILL,
        speculation: types_1.MentalConstructType.SPECULATION,
    };
    return map[s] ?? types_1.MentalConstructType.BELIEF;
}
function toCertaintyLevel(s) {
    const map = {
        certain: types_1.CertaintyLevel.CERTAIN,
        probable: types_1.CertaintyLevel.PROBABLE,
        possible: types_1.CertaintyLevel.POSSIBLE,
        doubtful: types_1.CertaintyLevel.DOUBTFUL,
        unknown: types_1.CertaintyLevel.UNKNOWN,
    };
    return map[s] ?? types_1.CertaintyLevel.PROBABLE;
}
function toAwarenessLevel(s) {
    const map = {
        conscious: types_1.AwarenessLevel.CONSCIOUS,
        subconscious: types_1.AwarenessLevel.SUBCONSCIOUS,
        unconscious: types_1.AwarenessLevel.UNCONSCIOUS,
    };
    return map[s] ?? types_1.AwarenessLevel.CONSCIOUS;
}
// ── Build TextModel from LLM extraction ──
function buildSpans(sys, parentId, children) {
    const idMap = {};
    for (const child of children) {
        const spanId = sys.createSpan(parentId, toSpanType(child.type), child.title, child.description, child.startPct, child.endPct);
        idMap[child.id] = spanId;
        if (child.children?.length) {
            const nested = buildSpans(sys, spanId, child.children);
            Object.assign(idMap, nested);
        }
    }
    return idMap;
}
function findSpanForEvent(rootSpan, eventId) {
    // Find the deepest span that lists this event
    for (const child of rootSpan.children ?? []) {
        const found = findSpanForEvent(child, eventId);
        if (found)
            return found;
    }
    if (rootSpan.eventIds?.includes(eventId))
        return rootSpan.id;
    return null;
}
function buildTextModel(extraction) {
    const sys = new NarrativeAnalysisSystem_1.NarrativeAnalysisSystem(extraction.title, extraction.author, extraction.description);
    const rootId = sys.getRootSpanId();
    // Build span tree and collect ID mapping
    const spanMap = buildSpans(sys, rootId, extraction.rootSpan.children ?? []);
    spanMap[extraction.rootSpan.id] = rootId;
    // Register settings first (characters reference them for location)
    for (const s of extraction.settings ?? []) {
        sys.addSetting({
            id: s.id,
            name: s.name,
            description: s.description,
            tags: s.tags ?? [],
            textMentions: s.textMentions ?? [],
            context: s.context ?? '',
            type: types_1.DiegeticEntityType.SETTING,
            realm: toRealmType(s.realm ?? 'material_reality'),
            geography: s.geography ?? '',
            climate: s.climate ?? '',
            historicalContext: s.historicalContext ?? '',
            culturalBackground: s.culturalBackground ?? '',
            parentSetting: s.parentSetting,
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(s.firstEvent ?? 'init'),
                        currentCharacters: [],
                        currentItems: [],
                        dominantFactions: {},
                        environmentalConditions: {},
                        culturalNorms: {},
                        tension: 0,
                        atmosphere: s.atmosphere ?? '',
                    },
                    causedBy: {},
                }],
            firstIntroduced: s.firstEvent ?? 'init',
        });
    }
    // Register characters
    for (const c of extraction.characters ?? []) {
        sys.addCharacter({
            id: c.id,
            name: c.name,
            description: c.description,
            tags: c.tags ?? [],
            textMentions: c.textMentions ?? [],
            context: c.context ?? '',
            type: types_1.DiegeticEntityType.CHARACTER,
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(c.firstEvent ?? 'init'),
                        emotionalState: emptyEmotion(),
                        mentalConstructs: [],
                        inventory: [],
                        location: c.initialLocation ?? '',
                        factionRelationships: {},
                        age: c.age ?? 0,
                        gender: c.gender ?? 'unknown',
                        occupation: c.occupation ?? '',
                        personalityTraits: c.personalityTraits ?? [],
                        coreValues: c.coreValues ?? [],
                        physicalDescription: c.physicalDescription ?? '',
                        skills: {},
                        socialStatus: {},
                    },
                    causedBy: {},
                }],
            firstIntroduced: c.firstEvent ?? 'init',
        });
    }
    // Register items
    for (const item of extraction.items ?? []) {
        sys.addItem({
            id: item.id,
            name: item.name,
            description: item.description,
            tags: item.tags ?? [],
            textMentions: item.textMentions ?? [],
            context: item.context ?? '',
            type: types_1.DiegeticEntityType.ITEM,
            itemType: item.itemType ?? '',
            origin: item.origin ?? '',
            physicalDescription: item.physicalDescription ?? '',
            defaultFunction: item.defaultFunction ?? '',
            culturalSignificance: item.culturalSignificance,
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(item.firstEvent ?? 'init'),
                        location: item.initialLocation ?? '',
                        condition: 'normal',
                        owner: item.initialOwner ?? null,
                        isHidden: false,
                    },
                    causedBy: {},
                }],
            firstIntroduced: item.firstEvent ?? 'init',
        });
    }
    // Register factions
    for (const f of extraction.factions ?? []) {
        sys.addFaction({
            id: f.id,
            name: f.name,
            description: f.description,
            tags: f.tags ?? [],
            textMentions: f.textMentions ?? [],
            context: f.context ?? '',
            type: types_1.DiegeticEntityType.FACTION,
            foundingPrinciples: f.foundingPrinciples ?? [],
            historicalContext: f.historicalContext ?? '',
            organizationalStructure: f.organizationalStructure ?? '',
            recruitmentMethods: [],
            symbolism: { colors: [], emblem: '', motto: '' },
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(f.firstEvent ?? 'init'),
                        members: f.members ?? [],
                        sharedMentalConstructs: [],
                        influence: 0,
                        resources: {},
                        ideology: {},
                        relationships: {},
                        publicOpinion: 0,
                    },
                    causedBy: {},
                }],
            firstIntroduced: f.firstEvent ?? 'init',
        });
    }
    // Register events (need to resolve span IDs)
    for (const e of extraction.events ?? []) {
        const extractionSpanId = findSpanForEvent(extraction.rootSpan, e.id);
        const systemSpanId = extractionSpanId ? (spanMap[extractionSpanId] ?? rootId) : rootId;
        sys.addEvent(systemSpanId, {
            id: e.id,
            type: toEventType(e.type),
            description: e.description,
            timestamp: e.timestamp ?? ts(0),
            textLocation: e.textLocation ?? { startLine: 1, endLine: 1 },
            participants: e.participants ?? [],
            precedingEvent: e.precedingEvent,
        });
    }
    // Register interpersonal relationships
    for (const r of extraction.relationships?.interpersonal ?? []) {
        sys.addInterpersonalRelationship({
            id: r.id,
            name: r.name,
            description: r.description,
            tags: r.tags ?? [],
            type: types_1.RelationshipType.INTERPERSONAL,
            participants: r.participants,
            nature: r.nature ?? '',
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(r.firstEvent ?? 'init'),
                        strength: r.strength ?? 0.5,
                        dynamics: { power: 0, influence: 0, conflict: 0 },
                        label: toRelationshipLabel(r.label),
                    },
                    causedBy: {},
                }],
            firstIntroduced: r.firstEvent ?? 'init',
        });
    }
    // Register group relationships
    for (const r of extraction.relationships?.group ?? []) {
        sys.addGroupRelationship({
            id: r.id,
            name: r.name,
            description: r.description,
            tags: r.tags ?? [],
            type: types_1.RelationshipType.GROUP,
            participants: r.participants ?? [],
            nature: r.nature ?? '',
            subRelationships: [],
            groupDynamics: {
                cohesion: r.cohesion ?? 0.5,
                sharedPurpose: r.sharedPurpose ?? 0.5,
                internalConflict: 0,
            },
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(r.firstEvent ?? 'init'),
                        strength: 0.5,
                        dynamics: { power: 0, influence: 0, conflict: 0 },
                    },
                    causedBy: {},
                }],
            firstIntroduced: r.firstEvent ?? 'init',
        });
    }
    // Register absentials
    for (const a of extraction.absentials ?? []) {
        sys.addAbsential({
            id: a.id,
            name: a.name,
            description: a.description,
            tags: a.tags ?? [],
            holder: a.holder,
            origin: a.origin ?? '',
            childAbsentials: [],
            conflictingAbsentials: [],
            relatedEntities: (a.relatedEntities ?? []).map((re) => ({
                entityId: re.entityId,
                relationship: toEntityAbsentialRel(re.relationship),
                strength: re.strength ?? 0.5,
            })),
            relatedAbsentials: [],
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(a.firstEvent ?? 'init'),
                        type: toAbsentialType(a.type),
                        status: toAbsentialStatus(a.initialStatus ?? 'unsatisfied'),
                        urgency: a.urgency ?? 0.5,
                        intensity: a.intensity ?? 0.5,
                    },
                    causedBy: {},
                }],
            firstIntroduced: a.firstEvent ?? 'init',
        });
    }
    // Register mental constructs
    for (const mc of extraction.mentalConstructs ?? []) {
        sys.addMentalConstruct({
            id: mc.id,
            name: mc.name,
            description: mc.description,
            tags: mc.tags ?? [],
            holder: mc.holder,
            subject: mc.subject,
            isDiegetic: mc.isDiegetic ?? true,
            source: mc.firstEvent,
            relatedConstructs: [],
            conflictingConstructs: [],
            supportingConstructs: [],
            stateHistory: [{
                    timestamp: ts(0),
                    data: {
                        ...base(mc.firstEvent ?? 'init'),
                        content: mc.content ?? mc.description,
                        type: toMentalConstructType(mc.type ?? 'belief'),
                        certainty: toCertaintyLevel(mc.certainty ?? 'probable'),
                        awareness: toAwarenessLevel(mc.awareness ?? 'conscious'),
                        emotionalAssociation: {},
                        salience: mc.salience ?? 0.5,
                    },
                    causedBy: {},
                }],
            firstIntroduced: mc.firstEvent ?? 'init',
        });
    }
    return sys.getModel().text;
}
// ── Main extraction function ──
async function extractTextModel(text, options = {}) {
    const client = (0, client_1.createClient)();
    const lineCount = text.split('\n').length;
    console.log(`[extract] Sending ${lineCount}-line text to LLM for extraction...`);
    // Use streaming to avoid timeout on large responses
    let fullText = '';
    const stream = client.messages.stream({
        model: options.model ?? DEFAULT_MODEL,
        max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: options.temperature ?? 0.2,
        system: prompts_1.EXTRACTION_SYSTEM_PROMPT,
        messages: [{
                role: 'user',
                content: (0, prompts_1.buildExtractionUserPrompt)(text, lineCount),
            }],
    });
    for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
        }
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
    console.log(`[extract] Parsed extraction: ${extraction.events?.length ?? 0} events, ${extraction.characters?.length ?? 0} characters, ${extraction.settings?.length ?? 0} settings`);
    const textModel = buildTextModel(extraction);
    console.log(`[extract] Built TextModel: "${textModel.title}" by ${textModel.author}`);
    return textModel;
}
// ─────────────────────────────────────────────────
// CHUNKED EXTRACTION FOR LONG TEXTS
// ─────────────────────────────────────────────────
const registry_1 = require("./registry");
Object.defineProperty(exports, "EntityRegistry", { enumerable: true, get: function () { return registry_1.EntityRegistry; } });
const chunker_1 = require("./chunker");
Object.defineProperty(exports, "chunkText", { enumerable: true, get: function () { return chunker_1.chunkText; } });
Object.defineProperty(exports, "getChunkStats", { enumerable: true, get: function () { return chunker_1.getChunkStats; } });
/**
 * Extract TextModel from long text using chunked processing.
 *
 * Maintains an entity registry across chunks so that "Mangan's sister"
 * gets the same ID whether she appears in chunk 1 or chunk 12.
 */
async function extractTextModelChunked(text, options = {}) {
    const chunks = (0, chunker_1.chunkText)(text, options.chunkOptions);
    const stats = (0, chunker_1.getChunkStats)(chunks);
    const contentChunks = chunks.filter(c => !c.isOverlap);
    console.log(`[chunked-extract] Text split into ${contentChunks.length} content chunks (+ ${stats.overlapChunks} overlap contexts)`);
    console.log(`[chunked-extract] Total: ${stats.totalChars.toLocaleString()} chars, ~${stats.estimatedTokens.toLocaleString()} tokens`);
    const registry = new registry_1.EntityRegistry();
    const chunkResults = [];
    let globalEventSeq = 0;
    for (let i = 0; i < contentChunks.length; i++) {
        const chunk = contentChunks[i];
        console.log(`\n[chunked-extract] Processing chunk ${i + 1}/${contentChunks.length} (${chunk.startPct.toFixed(1)}% - ${chunk.endPct.toFixed(1)}%)...`);
        const result = await extractChunk(chunk, registry, options, i === 0);
        result._chunkIndex = i;
        result._startPct = chunk.startPct;
        result._endPct = chunk.endPct;
        // Update registry with entities from this chunk
        updateRegistryFromExtraction(registry, result, i);
        // Renumber events with global sequence
        globalEventSeq = renumberEvents(result, globalEventSeq, chunk.startPct);
        chunkResults.push(result);
        if (options.onChunkComplete) {
            options.onChunkComplete(i, contentChunks.length, registry.count);
        }
        console.log(`[chunked-extract] Chunk ${i + 1} complete. Registry now has ${registry.count} entities.`);
    }
    // Merge all chunk results into a single TextModel
    console.log(`\n[chunked-extract] Merging ${chunkResults.length} chunk results...`);
    const mergedExtraction = mergeChunkExtractions(chunkResults);
    const textModel = buildTextModel(mergedExtraction);
    console.log(`[chunked-extract] Complete: "${textModel.title}" by ${textModel.author}`);
    console.log(`[chunked-extract] Final: ${Object.keys(textModel.events).length} events, ${Object.keys(textModel.diegetic.characters).length} characters, ${Object.keys(textModel.diegetic.settings).length} settings`);
    return textModel;
}
/**
 * Extract a single chunk, with registry context for non-first chunks.
 */
async function extractChunk(chunk, registry, options, isFirstChunk) {
    const client = (0, client_1.createClient)();
    // Build prompt with registry context for subsequent chunks
    let userPrompt = (0, prompts_1.buildExtractionUserPrompt)(chunk.text, chunk.text.split('\n').length);
    if (!isFirstChunk && registry.count > 0) {
        const registryContext = registry.toPromptContext();
        userPrompt = `${registryContext}\n\n---\n\n${userPrompt}\n\nImportant: Reuse the entity IDs listed above. Only create new entities if they genuinely haven't appeared before. Continue the event numbering sequence.`;
    }
    // Use streaming
    let fullText = '';
    const stream = client.messages.stream({
        model: options.model ?? DEFAULT_MODEL,
        max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: options.temperature ?? 0.2,
        system: prompts_1.EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
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
    try {
        return JSON.parse(rawJson);
    }
    catch (err) {
        console.error('[chunked-extract] Failed to parse chunk JSON');
        console.error('[chunked-extract] Raw (first 500 chars):', rawJson.slice(0, 500));
        throw new Error(`Chunk parse error: ${err.message}`);
    }
}
/**
 * Update registry with entities from a chunk extraction.
 */
function updateRegistryFromExtraction(registry, extraction, chunkIndex) {
    // Register characters
    for (const char of extraction.characters ?? []) {
        if (!registry.has(char.id)) {
            registry.register({
                id: char.id,
                type: 'character',
                canonicalName: char.name,
                aliases: char.aliases ?? [],
                description: char.description,
                firstSeenChunk: chunkIndex,
            });
        }
    }
    // Register settings
    for (const setting of extraction.settings ?? []) {
        if (!registry.has(setting.id)) {
            registry.register({
                id: setting.id,
                type: 'setting',
                canonicalName: setting.name,
                aliases: setting.aliases ?? [],
                description: setting.description,
                firstSeenChunk: chunkIndex,
            });
        }
    }
    // Register items
    for (const item of extraction.items ?? []) {
        if (!registry.has(item.id)) {
            registry.register({
                id: item.id,
                type: 'item',
                canonicalName: item.name,
                aliases: item.aliases ?? [],
                description: item.description,
                firstSeenChunk: chunkIndex,
            });
        }
    }
    // Register factions
    for (const faction of extraction.factions ?? []) {
        if (!registry.has(faction.id)) {
            registry.register({
                id: faction.id,
                type: 'faction',
                canonicalName: faction.name,
                aliases: faction.aliases ?? [],
                description: faction.description,
                firstSeenChunk: chunkIndex,
            });
        }
    }
    // Register absentials
    for (const abs of extraction.absentials ?? []) {
        if (!registry.has(abs.id)) {
            registry.register({
                id: abs.id,
                type: 'absential',
                canonicalName: abs.name,
                aliases: [],
                description: abs.description,
                firstSeenChunk: chunkIndex,
            });
        }
    }
}
/**
 * Renumber events with a global sequence and adjust timestamps.
 * Returns the next available sequence number.
 */
function renumberEvents(extraction, startSeq, chunkStartPct) {
    const eventIdMap = new Map();
    let seq = startSeq;
    // Build ID mapping
    for (const event of extraction.events ?? []) {
        const oldId = event.id;
        const newId = `e${String(seq + 1).padStart(3, '0')}`;
        eventIdMap.set(oldId, newId);
        event.id = newId;
        seq++;
        // Adjust timestamp percentage to be global
        if (event.timestamp?.percentage !== undefined) {
            // Local percentage within chunk -> global percentage
            const localPct = event.timestamp.percentage;
            event.timestamp.percentage = chunkStartPct + (localPct / 100) * (extraction.rootSpan?.endPct ?? 100 - chunkStartPct);
        }
    }
    // Update references in spans
    function updateSpanEventIds(span) {
        span.eventIds = span.eventIds?.map((id) => eventIdMap.get(id) ?? id) ?? [];
        for (const child of span.children ?? []) {
            updateSpanEventIds(child);
        }
    }
    if (extraction.rootSpan) {
        updateSpanEventIds(extraction.rootSpan);
    }
    // Update entity firstEvent references
    for (const char of extraction.characters ?? []) {
        if (char.firstEvent)
            char.firstEvent = eventIdMap.get(char.firstEvent) ?? char.firstEvent;
    }
    for (const setting of extraction.settings ?? []) {
        if (setting.firstEvent)
            setting.firstEvent = eventIdMap.get(setting.firstEvent) ?? setting.firstEvent;
    }
    for (const item of extraction.items ?? []) {
        if (item.firstEvent)
            item.firstEvent = eventIdMap.get(item.firstEvent) ?? item.firstEvent;
    }
    for (const abs of extraction.absentials ?? []) {
        if (abs.firstEvent)
            abs.firstEvent = eventIdMap.get(abs.firstEvent) ?? abs.firstEvent;
    }
    return seq;
}
/**
 * Merge multiple chunk extractions into a single extraction result.
 */
function mergeChunkExtractions(chunks) {
    const merged = {
        title: chunks[0]?.title ?? 'Untitled',
        author: chunks[0]?.author ?? 'Unknown',
        description: chunks[0]?.description ?? '',
        rootSpan: {
            id: 'story-main',
            type: 'story',
            title: chunks[0]?.title ?? 'Untitled',
            description: chunks[0]?.description ?? '',
            startPct: 0,
            endPct: 100,
            eventIds: [],
            children: [],
        },
        characters: [],
        settings: [],
        items: [],
        factions: [],
        events: [],
        relationships: { interpersonal: [], group: [] },
        absentials: [],
        mentalConstructs: [],
    };
    const seenIds = {
        characters: new Set(),
        settings: new Set(),
        items: new Set(),
        factions: new Set(),
        absentials: new Set(),
        events: new Set(),
    };
    for (const chunk of chunks) {
        // Merge entities (deduplicate by ID)
        for (const char of chunk.characters ?? []) {
            if (!seenIds.characters.has(char.id)) {
                merged.characters.push(char);
                seenIds.characters.add(char.id);
            }
        }
        for (const setting of chunk.settings ?? []) {
            if (!seenIds.settings.has(setting.id)) {
                merged.settings.push(setting);
                seenIds.settings.add(setting.id);
            }
        }
        for (const item of chunk.items ?? []) {
            if (!seenIds.items.has(item.id)) {
                merged.items.push(item);
                seenIds.items.add(item.id);
            }
        }
        for (const faction of chunk.factions ?? []) {
            if (!seenIds.factions.has(faction.id)) {
                merged.factions.push(faction);
                seenIds.factions.add(faction.id);
            }
        }
        for (const abs of chunk.absentials ?? []) {
            if (!seenIds.absentials.has(abs.id)) {
                merged.absentials.push(abs);
                seenIds.absentials.add(abs.id);
            }
        }
        // Merge events (already globally renumbered)
        for (const event of chunk.events ?? []) {
            if (!seenIds.events.has(event.id)) {
                merged.events.push(event);
                seenIds.events.add(event.id);
            }
        }
        // Merge spans: take acts from each chunk's root
        if (chunk.rootSpan?.children) {
            for (const act of chunk.rootSpan.children) {
                // Adjust act percentages to be global
                const actStartPct = chunk._startPct + (act.startPct / 100) * (chunk._endPct - chunk._startPct);
                const actEndPct = chunk._startPct + (act.endPct / 100) * (chunk._endPct - chunk._startPct);
                act.startPct = actStartPct;
                act.endPct = actEndPct;
                // Recursively adjust scene/beat percentages
                function adjustPercentages(span, parentStart, parentEnd) {
                    span.startPct = parentStart + (span.startPct / 100) * (parentEnd - parentStart);
                    span.endPct = parentStart + (span.endPct / 100) * (parentEnd - parentStart);
                    for (const child of span.children ?? []) {
                        adjustPercentages(child, span.startPct, span.endPct);
                    }
                }
                for (const scene of act.children ?? []) {
                    adjustPercentages(scene, act.startPct, act.endPct);
                }
                merged.rootSpan.children.push(act);
            }
        }
        // Merge relationships
        for (const rel of chunk.relationships?.interpersonal ?? []) {
            merged.relationships.interpersonal.push(rel);
        }
        for (const rel of chunk.relationships?.group ?? []) {
            merged.relationships.group.push(rel);
        }
        // Merge mental constructs
        for (const mc of chunk.mentalConstructs ?? []) {
            merged.mentalConstructs.push(mc);
        }
    }
    // Sort events by ID (which is sequential)
    merged.events.sort((a, b) => a.id.localeCompare(b.id));
    // Sort root span children (acts) by start percentage
    merged.rootSpan.children.sort((a, b) => a.startPct - b.startPct);
    return merged;
}
