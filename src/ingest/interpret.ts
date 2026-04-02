import { createClient } from './client';
import {
  TextModel, Reading,
  NonDiegeticEntityType,
  NarratorPerspective,
  RelationshipType,
} from '../types';
import { NarrativeAnalysisSystem } from '../NarrativeAnalysisSystem';
import { INTERPRETATION_SYSTEM_PROMPT, buildInterpretationUserPrompt } from './prompts';

export interface InterpretOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const DEFAULT_MODEL = 'claude-haiku-4-5';
const DEFAULT_MAX_TOKENS = 32000;

function ts(pct: number) { return { percentage: pct }; }

function base(eventId: string) {
  return { version: 'v1' as const, activeAbsentials: [] as string[], currentRelationships: [] as string[], generatedBy: eventId };
}

function emptyEmotion() {
  return { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0, intensity: 0 };
}

function toNarratorPerspective(s: string): NarratorPerspective {
  const map: Record<string, NarratorPerspective> = {
    first_person: NarratorPerspective.FIRST_PERSON,
    second_person: NarratorPerspective.SECOND_PERSON,
    third_person_limited: NarratorPerspective.THIRD_PERSON_LIMITED,
    third_person_omniscient: NarratorPerspective.THIRD_PERSON_OMNISCIENT,
  };
  return map[s] ?? NarratorPerspective.FIRST_PERSON;
}

// ── Wire types from LLM output ──

interface ReadingResult {
  name: string;
  description: string;
  themes: any[];
  symbols: any[];
  symbolicRelationships: any[];
  narrator: any;
  reader: any;
  author: any;
  eventSignificance: Record<string, any>;
  entitySignificance: Record<string, any>;
  absentialSignificance: Record<string, any>;
  globalTension: Array<{ timestamp: { percentage: number }; value: number; dimensions?: any }>;
  spanAnnotations: Record<string, any>;
}

// ── Build Reading from LLM interpretation ──

function buildReading(result: ReadingResult, textModel: TextModel): { name: string; reading: Reading } {
  // We use NarrativeAnalysisSystem to build the reading, feeding it the textModel first
  const sys = new NarrativeAnalysisSystem(
    textModel.title,
    textModel.author,
    textModel.description,
  );

  // We need to get the model to inject our textModel, but the system creates its own.
  // Instead, build the Reading directly.

  const narrator = {
    id: 'narrator',
    name: result.narrator?.name ?? 'Narrator',
    description: result.narrator?.description ?? '',
    tags: [],
    type: NonDiegeticEntityType.NARRATOR as const,
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
    type: NonDiegeticEntityType.READER as const,
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
    type: NonDiegeticEntityType.AUTHOR as const,
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
  const themes: Reading['themes'] = {};
  for (const t of result.themes ?? []) {
    themes[t.id] = {
      id: t.id,
      name: t.name,
      description: t.description,
      tags: t.tags ?? [],
      type: NonDiegeticEntityType.THEME,
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
  const symbols: Reading['symbols'] = {};
  for (const s of result.symbols ?? []) {
    symbols[s.id] = {
      id: s.id,
      name: s.name,
      description: s.description,
      tags: s.tags ?? [],
      type: NonDiegeticEntityType.SYMBOL,
      stateHistory: [{
        timestamp: ts(0),
        data: {
          ...base(s.firstEvent ?? 'init'),
          currentMeanings: (s.meanings ?? []).map((m: any) => ({
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
  const symbolicRelationships: Reading['symbolicRelationships'] = {};
  for (const sr of result.symbolicRelationships ?? []) {
    symbolicRelationships[sr.id] = {
      id: sr.id,
      name: sr.name,
      description: sr.description,
      tags: [],
      type: RelationshipType.SYMBOLIC,
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

  // Build event significance (ensure all events covered, with optional 5D dimensions)
  const eventSignificance: Reading['eventSignificance'] = {};
  for (const [eventId, ann] of Object.entries(result.eventSignificance ?? {})) {
    const entry: Reading['eventSignificance'][string] = {
      significance: ann.significance ?? 0.5,
      note: ann.note,
      causes: Array.isArray(ann.causes) ? ann.causes : undefined,
    };
    // Map effects — either structured { entityId, change, type } or legacy string[] of event IDs
    if (Array.isArray(ann.effects)) {
      entry.effects = ann.effects.map((eff: any) => {
        if (typeof eff === 'string') {
          // Legacy: just an event ID
          return { entityId: eff, stateChanges: {}, description: `Causes ${eff}` };
        }
        // Structured: { entityId, change, type }
        return {
          entityId: eff.entityId ?? '',
          stateChanges: { type: eff.type ?? 'status' },
          description: eff.change ?? eff.description ?? '',
        };
      });
    }
    // Include 5D dimensions if provided by the LLM
    if (ann.dimensions && typeof ann.dimensions === 'object') {
      entry.dimensions = {
        absential: Number(ann.dimensions.absential) || 0,
        relational: Number(ann.dimensions.relational) || 0,
        epistemic: Number(ann.dimensions.epistemic) || 0,
        atmospheric: Number(ann.dimensions.atmospheric) || 0,
        pacing: Number(ann.dimensions.pacing) || 0,
      };
    }
    eventSignificance[eventId] = entry;
  }
  // Fill in any missing events with default 0.3
  for (const eventId of Object.keys(textModel.events)) {
    if (!eventSignificance[eventId]) {
      eventSignificance[eventId] = { significance: 0.3 };
    }
  }

  // Build entity significance
  const entitySignificance: Reading['entitySignificance'] = {};
  for (const [id, sig] of Object.entries(result.entitySignificance ?? {})) {
    entitySignificance[id] = { significance: sig.significance ?? 0.5, note: sig.note };
  }

  // Build absential significance
  const absentialSignificance: Reading['absentialSignificance'] = {};
  for (const [id, sig] of Object.entries(result.absentialSignificance ?? {})) {
    absentialSignificance[id] = { significance: sig.significance ?? 0.5, note: sig.note };
  }

  // Build span annotations
  const spanAnnotations: Reading['spanAnnotations'] = {};
  for (const [spanId, ann] of Object.entries(result.spanAnnotations ?? {})) {
    spanAnnotations[spanId] = {
      tension: ann.tension,
      note: ann.note,
    };
  }

  const reading: Reading = {
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
    globalTension: (result.globalTension ?? []).map(pt => {
      const entry: Reading['globalTension'][number] = {
        timestamp: pt.timestamp,
        value: pt.value,
      };
      if (pt.dimensions && typeof pt.dimensions === 'object') {
        entry.dimensions = {
          absential: Number(pt.dimensions.absential) || 0,
          relational: Number(pt.dimensions.relational) || 0,
          epistemic: Number(pt.dimensions.epistemic) || 0,
          atmospheric: Number(pt.dimensions.atmospheric) || 0,
          pacing: Number(pt.dimensions.pacing) || 0,
        };
      }
      return entry;
    }),
    spanAnnotations,
  };

  return { name: result.name, reading };
}

// ── Main interpretation function ──

export async function interpretReading(
  textModel: TextModel,
  lens: string,
  options: InterpretOptions = {},
): Promise<{ name: string; reading: Reading }> {
  const client = createClient();

  // Prepare a compact version of textModel for the prompt
  // (omit deeply nested state histories to save tokens)
  const compactModel = {
    title: textModel.title,
    author: textModel.author,
    description: textModel.description,
    events: Object.fromEntries(
      Object.entries(textModel.events).map(([id, e]) => [id, {
        id: e.id,
        type: e.type,
        description: e.description,
        timestamp: e.timestamp,
        textLocation: e.textLocation,
        participants: e.participants,
      }]),
    ),
    characters: Object.fromEntries(
      Object.entries(textModel.diegetic.characters).map(([id, c]) => [id, {
        id: c.id,
        name: c.name,
        description: c.description,
        tags: c.tags,
      }]),
    ),
    settings: Object.fromEntries(
      Object.entries(textModel.diegetic.settings).map(([id, s]) => [id, {
        id: s.id,
        name: s.name,
        description: s.description,
      }]),
    ),
    items: Object.fromEntries(
      Object.entries(textModel.diegetic.items).map(([id, i]) => [id, {
        id: i.id,
        name: i.name,
        description: i.description,
      }]),
    ),
    absentials: Object.fromEntries(
      Object.entries(textModel.absentials).map(([id, a]) => [id, {
        id: a.id,
        name: a.name,
        description: a.description,
        holder: a.holder,
      }]),
    ),
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
    system: INTERPRETATION_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildInterpretationUserPrompt(textModelJson, lens),
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

  let result: ReadingResult;
  try {
    result = JSON.parse(rawJson);
  } catch (err) {
    console.error('[interpret] Failed to parse LLM JSON output');
    console.error('[interpret] Raw output (first 500 chars):', rawJson.slice(0, 500));
    throw new Error(`JSON parse error: ${(err as Error).message}`);
  }

  const eventCount = Object.keys(result.eventSignificance ?? {}).length;
  console.log(`[interpret] Parsed reading: "${result.name}" with ${result.themes?.length ?? 0} themes, ${result.symbols?.length ?? 0} symbols, ${eventCount} event annotations`);

  const built = buildReading(result, textModel);
  console.log(`[interpret] Built reading: "${built.name}"`);
  return built;
}

function summarizeSpanTree(span: any): any {
  return {
    id: span.id,
    type: span.type,
    title: span.title,
    events: span.events,
    children: (span.childSpans ?? []).map(summarizeSpanTree),
  };
}
