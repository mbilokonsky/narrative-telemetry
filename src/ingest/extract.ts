import Anthropic from '@anthropic-ai/sdk';
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

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 16000;

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

  // Register characters
  for (const c of extraction.characters ?? []) {
    sys.addCharacter({
      id: c.id,
      name: c.name,
      description: c.description,
      tags: c.tags ?? [],
      textMentions: c.textMentions ?? [],
      context: c.context ?? '',
      type: DiegeticEntityType.CHARACTER,
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
      relatedEntities: (a.relatedEntities ?? []).map((re: any) => ({
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

export async function extractTextModel(text: string, options: ExtractOptions = {}): Promise<TextModel> {
  const client = new Anthropic();
  const lineCount = text.split('\n').length;

  console.log(`[extract] Sending ${lineCount}-line text to LLM for extraction...`);

  const response = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: options.temperature ?? 0.2,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildExtractionUserPrompt(text, lineCount),
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Expected text response from LLM');
  }

  let rawJson = content.text.trim();
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
