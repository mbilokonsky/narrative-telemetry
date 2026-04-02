/**
 * Zod schemas for validating LLM output.
 * Catches malformed responses before they silently corrupt the StoryModel.
 */
import { z } from 'zod';

// ── Extraction (Pass 1) ──

const SpanNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string().default(''),
  startPct: z.number(),
  endPct: z.number(),
  eventIds: z.array(z.string()).default([]),
  children: z.array(SpanNodeSchema).default([]),
}));

const StateTransitionSchema = z.object({
  percentage: z.number(),
  description: z.string().default(''),
  causes: z.array(z.object({
    eventId: z.string(),
    role: z.string().default('contributing'),
    description: z.string().optional(),
  })).default([]),
}).passthrough();

const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  textMentions: z.array(z.string()).default([]),
  firstEvent: z.string().optional(),
  stateTransitions: z.array(StateTransitionSchema).default([]),
}).passthrough();

const EventSchema = z.object({
  id: z.string(),
  type: z.string().default('action'),
  description: z.string().default(''),
  timestamp: z.object({ percentage: z.number() }),
  textLocation: z.object({
    startLine: z.number(),
    endLine: z.number(),
  }),
  participants: z.array(z.string()).default([]),
  precedingEvent: z.string().optional(),
});

const AbsentialSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  holder: z.string(),
  type: z.string().default('desire'),
  stateTransitions: z.array(StateTransitionSchema).default([]),
}).passthrough();

export const ExtractionResultSchema = z.object({
  title: z.string(),
  author: z.string(),
  description: z.string().default(''),
  rootSpan: SpanNodeSchema,
  characters: z.array(CharacterSchema).default([]),
  settings: z.array(z.object({ id: z.string(), name: z.string() }).passthrough()).default([]),
  items: z.array(z.object({ id: z.string(), name: z.string() }).passthrough()).default([]),
  factions: z.array(z.object({ id: z.string(), name: z.string() }).passthrough()).default([]),
  events: z.array(EventSchema).default([]),
  relationships: z.object({
    interpersonal: z.array(z.any()).default([]),
    group: z.array(z.any()).default([]),
  }).default({ interpersonal: [], group: [] }),
  absentials: z.array(AbsentialSchema).default([]),
  mentalConstructs: z.array(z.any()).default([]),
});

// ── Interpretation (Pass 2) ──

const EventAnnotationSchema = z.object({
  significance: z.number().min(0).max(1),
  note: z.string().optional(),
  causes: z.array(z.string()).optional(),
  effects: z.array(z.any()).optional(),
  dimensions: z.object({
    absential: z.number(),
    relational: z.number(),
    epistemic: z.number(),
    atmospheric: z.number(),
    pacing: z.number(),
  }).optional(),
}).passthrough();

export const ReadingResultSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
  themes: z.array(z.any()).default([]),
  symbols: z.array(z.any()).default([]),
  symbolicRelationships: z.array(z.any()).default([]),
  narrator: z.any().default({}),
  reader: z.any().default({}),
  author: z.any().default({}),
  eventSignificance: z.record(z.string(), EventAnnotationSchema).default({}),
  entitySignificance: z.record(z.string(), z.object({
    significance: z.number(),
    note: z.string().optional(),
  })).default({}),
  absentialSignificance: z.record(z.string(), z.object({
    significance: z.number(),
    note: z.string().optional(),
  })).default({}),
  interpretiveAbsentials: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().default(''),
    holder: z.string(),
    type: z.string().default('desire'),
    significance: z.number().default(0.5),
    note: z.string().default(''),
  }).passthrough()).optional(),
  globalTension: z.array(z.object({
    timestamp: z.object({ percentage: z.number() }),
    value: z.number(),
  }).passthrough()).default([]),
  spanAnnotations: z.record(z.string(), z.any()).default({}),
});

export type ValidatedExtraction = z.infer<typeof ExtractionResultSchema>;
export type ValidatedReading = z.infer<typeof ReadingResultSchema>;
