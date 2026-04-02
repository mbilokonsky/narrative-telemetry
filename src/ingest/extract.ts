import { createClient } from './client';
import { NarrativeAnalysisSystem } from '../NarrativeAnalysisSystem';
import {
  StorySpanType,
  NarrativeEventType,
  DiegeticEntityType,
  RealmType,
  RelationshipType,
  RelationshipLabel,
  AbsentialType,
  AbsentialStatus,
  EntityAbsentialRelationship,
  MentalConstructType,
  CertaintyLevel,
  AwarenessLevel,
  TextModel,
} from '../types';
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from './prompts';

// ── Wire types from LLM output ──

interface SpanNode {
  id: string;
  type: string;
  title: string;
  description: string;
  startPct: number;
  endPct: number;
  eventIds: string[];
  children: SpanNode[];
}

interface ExtractionResult {
  title: string;
  author: string;
  description: string;
  rootSpan: SpanNode;
  characters: any[];
  settings: any[];
  items: any[];
  factions: any[];
  events: any[];
  relationships: {
    interpersonal: any[];
    group: any[];
  };
  absentials: any[];
  mentalConstructs: any[];
}

export interface ExtractOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const DEFAULT_MODEL = 'claude-haiku-4-5';
const DEFAULT_MAX_TOKENS = 64000;

function emptyEmotion() {
  return { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0, intensity: 0 };
}

function ts(pct: number) { return { percentage: pct }; }

function base(eventId: string) {
  return { version: 'v1' as const, activeAbsentials: [] as string[], currentRelationships: [] as string[], generatedBy: eventId };
}

function toSpanType(s: string): StorySpanType {
  const map: Record<string, StorySpanType> = {
    story: StorySpanType.STORY,
    act: StorySpanType.ACT,
    scene: StorySpanType.SCENE,
    beat: StorySpanType.BEAT,
  };
  return map[s] ?? StorySpanType.BEAT;
}

function toEventType(s: string): NarrativeEventType {
  const map: Record<string, NarrativeEventType> = {
    action: NarrativeEventType.ACTION,
    dialogue: NarrativeEventType.DIALOGUE,
    revelation: NarrativeEventType.REVELATION,
    decision: NarrativeEventType.DECISION,
    environmental: NarrativeEventType.ENVIRONMENTAL,
  };
  return map[s] ?? NarrativeEventType.ACTION;
}

function toRealmType(s: string): RealmType {
  const map: Record<string, RealmType> = {
    material_reality: RealmType.MATERIAL_REALITY,
    dream: RealmType.DREAM,
    memory: RealmType.MEMORY,
    vision: RealmType.VISION,
    hypothetical_reality: RealmType.HYPOTHETICAL_REALITY,
  };
  return map[s] ?? RealmType.MATERIAL_REALITY;
}

function toRelationshipLabel(s: string | undefined): RelationshipLabel | undefined {
  if (!s) return undefined;
  const map: Record<string, RelationshipLabel> = {
    family: RelationshipLabel.FAMILY,
    friend: RelationshipLabel.FRIEND,
    enemy: RelationshipLabel.ENEMY,
    ally: RelationshipLabel.ALLY,
    rival: RelationshipLabel.RIVAL,
    lover: RelationshipLabel.LOVER,
    mentor: RelationshipLabel.MENTOR,
    subordinate: RelationshipLabel.SUBORDINATE,
    leader: RelationshipLabel.LEADER,
  };
  return map[s];
}

function toAbsentialType(s: string): AbsentialType {
  const map: Record<string, AbsentialType> = {
    desire: AbsentialType.DESIRE,
    fear: AbsentialType.FEAR,
    goal: AbsentialType.GOAL,
    need: AbsentialType.NEED,
    expectation: AbsentialType.EXPECTATION,
    lack: AbsentialType.LACK,
    potential: AbsentialType.POTENTIAL,
    trigger: AbsentialType.TRIGGER,
  };
  return map[s] ?? AbsentialType.DESIRE;
}

function toAbsentialStatus(s: string): AbsentialStatus {
  const map: Record<string, AbsentialStatus> = {
    unsatisfied: AbsentialStatus.UNSATISFIED,
    canceled: AbsentialStatus.CANCELED,
    resolved_satisfied: AbsentialStatus.RESOLVED_SATISFIED,
    resolved_blocked: AbsentialStatus.RESOLVED_BLOCKED,
    resolved_mixed: AbsentialStatus.RESOLVED_MIXED,
  };
  return map[s] ?? AbsentialStatus.UNSATISFIED;
}

function toEntityAbsentialRel(s: string): EntityAbsentialRelationship {
  const map: Record<string, EntityAbsentialRelationship> = {
    target: EntityAbsentialRelationship.TARGET,
    obstacle: EntityAbsentialRelationship.OBSTACLE,
    facilitator: EntityAbsentialRelationship.FACILITATOR,
    influenced_by: EntityAbsentialRelationship.INFLUENCED_BY,
    catalyst: EntityAbsentialRelationship.CATALYST,
    resolver: EntityAbsentialRelationship.RESOLVER,
    creator: EntityAbsentialRelationship.CREATOR,
    beneficiary: EntityAbsentialRelationship.BENEFICIARY,
    victim: EntityAbsentialRelationship.VICTIM,
  };
  return map[s] ?? EntityAbsentialRelationship.TARGET;
}

function toMentalConstructType(s: string): MentalConstructType {
  const map: Record<string, MentalConstructType> = {
    fact: MentalConstructType.FACT,
    belief: MentalConstructType.BELIEF,
    opinion: MentalConstructType.OPINION,
    memory: MentalConstructType.MEMORY,
    skill: MentalConstructType.SKILL,
    speculation: MentalConstructType.SPECULATION,
  };
  return map[s] ?? MentalConstructType.BELIEF;
}

function toCertaintyLevel(s: string): CertaintyLevel {
  const map: Record<string, CertaintyLevel> = {
    certain: CertaintyLevel.CERTAIN,
    probable: CertaintyLevel.PROBABLE,
    possible: CertaintyLevel.POSSIBLE,
    doubtful: CertaintyLevel.DOUBTFUL,
    unknown: CertaintyLevel.UNKNOWN,
  };
  return map[s] ?? CertaintyLevel.PROBABLE;
}

function toAwarenessLevel(s: string): AwarenessLevel {
  const map: Record<string, AwarenessLevel> = {
    conscious: AwarenessLevel.CONSCIOUS,
    subconscious: AwarenessLevel.SUBCONSCIOUS,
    unconscious: AwarenessLevel.UNCONSCIOUS,
  };
  return map[s] ?? AwarenessLevel.CONSCIOUS;
}

// ── Build TextModel from LLM extraction ──

function buildSpans(sys: NarrativeAnalysisSystem, parentId: string, children: SpanNode[]): Record<string, string> {
  const idMap: Record<string, string> = {};
  for (const child of children) {
    const spanId = sys.createSpan(
      parentId,
      toSpanType(child.type),
      child.title,
      child.description,
      child.startPct,
      child.endPct,
    );
    idMap[child.id] = spanId;
    if (child.children?.length) {
      const nested = buildSpans(sys, spanId, child.children);
      Object.assign(idMap, nested);
    }
  }
  return idMap;
}

function findSpanForEvent(rootSpan: SpanNode, eventId: string): string | null {
  // Find the deepest span that lists this event
  for (const child of rootSpan.children ?? []) {
    const found = findSpanForEvent(child, eventId);
    if (found) return found;
  }
  if (rootSpan.eventIds?.includes(eventId)) return rootSpan.id;
  return null;
}

function buildTextModel(extraction: ExtractionResult): TextModel {
  const sys = new NarrativeAnalysisSystem(
    extraction.title,
    extraction.author,
    extraction.description,
  );

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
      type: DiegeticEntityType.SETTING,
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

  // Register characters (with state transitions)
  for (const c of extraction.characters ?? []) {
    const initialState = {
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
    };

    // Build stateHistory from transitions
    const stateHistory = [initialState];
    for (const tr of c.stateTransitions ?? []) {
      const prevData = stateHistory[stateHistory.length - 1].data;
      const causes = tr.causes ?? [];
      const primaryEvent = causes.find((c: any) => c.role === 'primary')?.eventId ?? causes[0]?.eventId;
      stateHistory.push({
        timestamp: ts(tr.percentage),
        data: {
          ...prevData,
          ...base(primaryEvent ?? 'unknown'),
          location: tr.location ?? prevData.location,
          version: `v1:${tr.description ?? ''}` as any,
        },
        causedBy: {
          eventId: primaryEvent,
          factors: causes.map((c: any) => ({
            eventId: c.eventId,
            role: c.role ?? 'contributing',
            description: c.description,
          })),
        },
      });
    }

    sys.addCharacter({
      id: c.id,
      name: c.name,
      description: c.description,
      tags: c.tags ?? [],
      textMentions: c.textMentions ?? [],
      context: c.context ?? '',
      type: DiegeticEntityType.CHARACTER,
      stateHistory,
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
      type: DiegeticEntityType.ITEM,
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
      type: DiegeticEntityType.FACTION,
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
      type: RelationshipType.INTERPERSONAL,
      participants: r.participants as [string, string],
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
      type: RelationshipType.GROUP,
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

  // Register absentials (with state transitions)
  for (const a of extraction.absentials ?? []) {
    // Build stateHistory from transitions array (or fall back to single initial state)
    const transitions = a.stateTransitions ?? [];
    let stateHistory;

    if (transitions.length > 0) {
      stateHistory = transitions.map((tr: any) => {
        const causes = tr.causes ?? [];
        const primaryEvent = causes.find((c: any) => c.role === 'primary')?.eventId
          ?? causes[0]?.eventId ?? tr.eventId;
        return {
          timestamp: ts(tr.percentage),
          data: {
            ...base(primaryEvent),
            type: toAbsentialType(a.type),
            status: toAbsentialStatus(tr.status ?? 'unsatisfied'),
            urgency: tr.urgency ?? 0.5,
            intensity: tr.intensity ?? 0.5,
          },
          causedBy: {
            eventId: primaryEvent,
            factors: causes.map((c: any) => ({
              eventId: c.eventId,
              role: c.role ?? 'contributing',
              description: c.description,
            })),
          },
        };
      });
    } else {
      // Legacy fallback: single initial state
      stateHistory = [{
        timestamp: ts(0),
        data: {
          ...base(a.firstEvent ?? 'init'),
          type: toAbsentialType(a.type),
          status: toAbsentialStatus(a.initialStatus ?? 'unsatisfied'),
          urgency: a.urgency ?? 0.5,
          intensity: a.intensity ?? 0.5,
        },
        causedBy: {},
      }];
    }

    sys.addAbsential({
      id: a.id,
      name: a.name,
      description: a.description,
      tags: a.tags ?? [],
      holder: a.holder,
      origin: a.origin ?? '',
      childAbsentials: [],
      conflictingAbsentials: [],
      relatedEntities: (a.relatedEntities ?? []).map((re: any) => ({
        entityId: re.entityId,
        relationship: toEntityAbsentialRel(re.relationship),
        strength: re.strength ?? 0.5,
      })),
      relatedAbsentials: [],
      stateHistory,
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

export async function extractTextModel(text: string, options: ExtractOptions = {}): Promise<TextModel> {
  const client = createClient();
  const lineCount = text.split('\n').length;

  console.log(`[extract] Sending ${lineCount}-line text to LLM for extraction...`);

  // Use streaming to avoid timeout on large responses
  let fullText = '';
  const stream = client.messages.stream({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: options.temperature ?? 0.2,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildExtractionUserPrompt(text, lineCount),
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

  let extraction: ExtractionResult;
  try {
    extraction = JSON.parse(rawJson);
  } catch (err) {
    console.error('[extract] Failed to parse LLM JSON output');
    console.error('[extract] Raw output (first 500 chars):', rawJson.slice(0, 500));
    throw new Error(`JSON parse error: ${(err as Error).message}`);
  }

  console.log(`[extract] Parsed extraction: ${extraction.events?.length ?? 0} events, ${extraction.characters?.length ?? 0} characters, ${extraction.settings?.length ?? 0} settings`);

  const textModel = buildTextModel(extraction);

  console.log(`[extract] Built TextModel: "${textModel.title}" by ${textModel.author}`);
  return textModel;
}

// ─────────────────────────────────────────────────
// CHUNKED EXTRACTION FOR LONG TEXTS
// ─────────────────────────────────────────────────

import { EntityRegistry, RegistryEntry } from './registry';
import { chunkText, TextChunk, ChunkOptions, getChunkStats } from './chunker';

export interface ChunkedExtractOptions extends ExtractOptions {
  chunkOptions?: ChunkOptions;
  onChunkComplete?: (chunkIndex: number, totalChunks: number, registrySize: number) => void;
}

interface ChunkExtractionResult extends ExtractionResult {
  _chunkIndex: number;
  _startPct: number;
  _endPct: number;
}

/**
 * Extract TextModel from long text using chunked processing.
 * 
 * Maintains an entity registry across chunks so that "Mangan's sister"
 * gets the same ID whether she appears in chunk 1 or chunk 12.
 */
export async function extractTextModelChunked(
  text: string, 
  options: ChunkedExtractOptions = {}
): Promise<TextModel> {
  const chunks = chunkText(text, options.chunkOptions);
  const stats = getChunkStats(chunks);
  const contentChunks = chunks.filter(c => !c.isOverlap);
  
  console.log(`[chunked-extract] Text split into ${contentChunks.length} content chunks (+ ${stats.overlapChunks} overlap contexts)`);
  console.log(`[chunked-extract] Total: ${stats.totalChars.toLocaleString()} chars, ~${stats.estimatedTokens.toLocaleString()} tokens`);
  
  const registry = new EntityRegistry();
  const chunkResults: ChunkExtractionResult[] = [];
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
async function extractChunk(
  chunk: TextChunk,
  registry: EntityRegistry,
  options: ExtractOptions,
  isFirstChunk: boolean
): Promise<ChunkExtractionResult> {
  const client = createClient();
  
  // Build prompt with registry context for subsequent chunks
  let userPrompt = buildExtractionUserPrompt(chunk.text, chunk.text.split('\n').length);
  
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
    system: EXTRACTION_SYSTEM_PROMPT,
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
  } catch (err) {
    console.error('[chunked-extract] Failed to parse chunk JSON');
    console.error('[chunked-extract] Raw (first 500 chars):', rawJson.slice(0, 500));
    throw new Error(`Chunk parse error: ${(err as Error).message}`);
  }
}

/**
 * Update registry with entities from a chunk extraction.
 */
function updateRegistryFromExtraction(
  registry: EntityRegistry,
  extraction: ExtractionResult,
  chunkIndex: number
): void {
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
function renumberEvents(
  extraction: ExtractionResult,
  startSeq: number,
  chunkStartPct: number
): number {
  const eventIdMap = new Map<string, string>();
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
  function updateSpanEventIds(span: SpanNode) {
    span.eventIds = span.eventIds?.map((id: string) => eventIdMap.get(id) ?? id) ?? [];
    for (const child of span.children ?? []) {
      updateSpanEventIds(child);
    }
  }
  
  if (extraction.rootSpan) {
    updateSpanEventIds(extraction.rootSpan);
  }
  
  // Update entity firstEvent references
  for (const char of extraction.characters ?? []) {
    if (char.firstEvent) char.firstEvent = eventIdMap.get(char.firstEvent) ?? char.firstEvent;
  }
  for (const setting of extraction.settings ?? []) {
    if (setting.firstEvent) setting.firstEvent = eventIdMap.get(setting.firstEvent) ?? setting.firstEvent;
  }
  for (const item of extraction.items ?? []) {
    if (item.firstEvent) item.firstEvent = eventIdMap.get(item.firstEvent) ?? item.firstEvent;
  }
  for (const abs of extraction.absentials ?? []) {
    if (abs.firstEvent) abs.firstEvent = eventIdMap.get(abs.firstEvent) ?? abs.firstEvent;
  }
  
  return seq;
}

/**
 * Merge multiple chunk extractions into a single extraction result.
 */
function mergeChunkExtractions(chunks: ChunkExtractionResult[]): ExtractionResult {
  const merged: ExtractionResult = {
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
    characters: new Set<string>(),
    settings: new Set<string>(),
    items: new Set<string>(),
    factions: new Set<string>(),
    absentials: new Set<string>(),
    events: new Set<string>(),
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
        function adjustPercentages(span: SpanNode, parentStart: number, parentEnd: number) {
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

// Export chunked extraction types
export { EntityRegistry, RegistryEntry, chunkText, TextChunk, ChunkOptions, getChunkStats };
