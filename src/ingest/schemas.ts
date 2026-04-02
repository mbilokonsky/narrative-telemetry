/**
 * Zod schemas for validating LLM output.
 * These are intentionally lenient — LLMs produce inconsistent JSON.
 * We validate required structure while being permissive with optional fields.
 */
import { z } from 'zod';

// Helper: accept string or null, coerce null to undefined
const optStr = z.string().nullable().optional().transform(v => v ?? undefined);

// ── Extraction (Pass 1) ──

const SpanNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string(),
  type: z.string(),
  title: z.string().default(''),
  description: z.string().default(''),
  startPct: z.number().default(0),
  endPct: z.number().default(100),
  eventIds: z.array(z.string()).default([]),
  children: z.array(SpanNodeSchema).default([]),
}).passthrough());

const EventSchema = z.object({
  id: z.string(),
  type: z.string().default('action'),
  description: z.string().default(''),
  timestamp: z.object({ percentage: z.number() }).passthrough(),
  textLocation: z.object({
    startLine: z.number(),
    endLine: z.number(),
  }).passthrough(),
  participants: z.array(z.string()).default([]),
  precedingEvent: optStr,
}).passthrough();

export const ExtractionResultSchema = z.object({
  title: z.string(),
  author: z.string(),
  description: z.string().default(''),
  rootSpan: SpanNodeSchema,
  characters: z.array(z.object({ id: z.string(), name: z.string() }).passthrough()).default([]),
  settings: z.array(z.object({ id: z.string(), name: z.string() }).passthrough()).default([]),
  items: z.array(z.object({ id: z.string(), name: z.string() }).passthrough()).default([]),
  factions: z.array(z.object({ id: z.string(), name: z.string() }).passthrough()).default([]),
  events: z.array(EventSchema).default([]),
  relationships: z.object({
    interpersonal: z.array(z.any()).default([]),
    group: z.array(z.any()).default([]),
  }).default({ interpersonal: [], group: [] }),
  absentials: z.array(z.object({ id: z.string(), name: z.string(), holder: z.string() }).passthrough()).default([]),
  mentalConstructs: z.array(z.any()).default([]),
}).passthrough();

// ── Interpretation (Pass 2) ──

const EventAnnotationSchema = z.object({
  significance: z.number().min(0).max(1),
  note: optStr,
  causes: z.array(z.string()).nullable().optional(),
  effects: z.array(z.any()).nullable().optional(),
  dimensions: z.object({
    absential: z.number(),
    relational: z.number(),
    epistemic: z.number(),
    atmospheric: z.number(),
    pacing: z.number(),
  }).nullable().optional(),
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
    note: optStr,
  }).passthrough()).default({}),
  absentialSignificance: z.record(z.string(), z.object({
    significance: z.number(),
    note: optStr,
  }).passthrough()).default({}),
  globalTension: z.array(z.object({
    timestamp: z.object({ percentage: z.number() }).passthrough(),
    value: z.number(),
  }).passthrough()).default([]),
  spanAnnotations: z.record(z.string(), z.any()).default({}),
  interpretiveAbsentials: z.array(z.object({
    id: z.string(),
    name: z.string(),
  }).passthrough()).nullable().optional(),
}).passthrough();

export type ValidatedExtraction = z.infer<typeof ExtractionResultSchema>;
export type ValidatedReading = z.infer<typeof ReadingResultSchema>;
