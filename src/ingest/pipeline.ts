import * as fs from 'fs';
import { StoryModel, TextModel, Reading } from '../types';
import { extractTextModel, ExtractOptions, extractTextModelChunked, ChunkedExtractOptions } from './extract';
import { interpretReading, InterpretOptions } from './interpret';
import {
  computeTensionCurve, TensionPoint,
  coarseGrain, SpanSignificance,
  computePacing, PacingScore,
  computeDivergence, DivergenceMap,
} from '../derive';

// ── Options ──

export interface IngestOptions {
  extract?: ExtractOptions;
  interpret?: InterpretOptions;
  lenses?: string[];
  title?: string;
  model?: string;
  verbose?: boolean;
}

export interface DerivedInsights {
  tensionCurves: Record<string, TensionPoint[]>;
  coarseGrained: Record<string, SpanSignificance>;
  pacing: PacingScore;
  divergence?: DivergenceMap;
}

// ── Pipeline functions ──

/**
 * Full pipeline: raw text → TextModel → Readings → StoryModel
 */
export async function ingestText(text: string, options: IngestOptions = {}): Promise<StoryModel> {
  const extractOpts: ExtractOptions = {
    ...options.extract,
    model: options.model ?? options.extract?.model,
  };
  const textModel = await extractTextModel(text, extractOpts);

  const readings: Record<string, Reading> = {};
  const lenses = options.lenses ?? [];

  for (const lens of lenses) {
    const interpretOpts: InterpretOptions = {
      ...options.interpret,
      model: options.model ?? options.interpret?.model,
    };
    const { name, reading } = await interpretReading(textModel, lens, interpretOpts);
    readings[name] = reading;
  }

  return { text: textModel, readings };
}

/**
 * Chunked pipeline for long texts: splits text, maintains entity registry across chunks.
 */
export async function ingestTextChunked(text: string, options: IngestOptions = {}): Promise<StoryModel> {
  const chunkOpts: ChunkedExtractOptions = {
    model: options.model ?? options.extract?.model,
    maxTokens: options.extract?.maxTokens,
    temperature: options.extract?.temperature,
    onChunkComplete: options.verbose
      ? (idx, total, registrySize) => console.log(`  Chunk ${idx + 1}/${total}: ${registrySize} entities in registry`)
      : undefined,
  };

  const textModel = await extractTextModelChunked(text, chunkOpts);

  const readings: Record<string, Reading> = {};
  const lenses = options.lenses ?? [];

  for (const lens of lenses) {
    const interpretOpts: InterpretOptions = {
      ...options.interpret,
      model: options.model ?? options.interpret?.model,
    };
    const { name, reading } = await interpretReading(textModel, lens, interpretOpts);
    readings[name] = reading;
  }

  return { text: textModel, readings };
}

/**
 * Generate a single reading for an existing StoryModel.
 */
export async function generateReading(
  model: StoryModel,
  lens: string,
  options: InterpretOptions = {},
): Promise<Reading> {
  const { name, reading } = await interpretReading(model.text, lens, options);
  model.readings[name] = reading;
  return reading;
}

/**
 * Derive mechanical insights from a StoryModel (no LLM needed).
 */
export function deriveInsights(model: StoryModel): DerivedInsights {
  const readingNames = Object.keys(model.readings);

  // Tension curves per reading
  const tensionCurves: Record<string, TensionPoint[]> = {};
  for (const name of readingNames) {
    tensionCurves[name] = computeTensionCurve(model.text, model.readings[name]);
  }

  // Coarse-grain significance per reading
  const coarseGrained: Record<string, SpanSignificance> = {};
  for (const name of readingNames) {
    coarseGrained[name] = coarseGrain(model.text.rootSpan, model.readings[name]);
  }

  // Pacing (text-level, reading-independent)
  const pacing = computePacing(model.text.rootSpan, model.text);

  // Divergence between first two readings (if we have at least two)
  let divergence: DivergenceMap | undefined;
  if (readingNames.length >= 2) {
    divergence = computeDivergence(
      model.readings[readingNames[0]],
      model.readings[readingNames[1]],
    );
  }

  return { tensionCurves, coarseGrained, pacing, divergence };
}
