/**
 * author-profile.ts — Aggregate per-story formalist readings into an author profile.
 *
 * Usage:
 *   npx ts-node src/derive/author-profile.ts \
 *     --input output/mansfield \
 *     --author "Katherine Mansfield" \
 *     --output output/mansfield-profile.json
 *
 * Computes per-story:
 *   - Tension curves (scalar + 5 field dimensions from globalTension / spanAnnotations)
 *   - Epiphany position: percentage where epistemic tension peaks
 *   - Absential count, ratio (absentials / events)
 *   - Entity density: total diegetic entities / event count
 *   - Event pacing: events per story length quartile
 *
 * Computes across stories:
 *   - Mean tension profile (20 steps)
 *   - Variance bands (±1 std-dev)
 *   - Mean absential ratio, mean entity density
 *   - Mean epiphany position
 */

import * as fs from 'fs';
import * as path from 'path';
import { StoryModel, Reading, TextModel } from '../types';
import { computeTensionCurve, TensionPoint } from './tension';
import { computePacing, PacingScore } from './pacing';

// ── Types ──

export interface TensionDimensions {
  absential: number;
  relational: number;
  epistemic: number;
  atmospheric: number;
  pacing: number;
  composite: number;
}

export interface TensionCurvePoint {
  percentage: number;
  scalar: number;
  dimensions: TensionDimensions;
}

export interface StoryProfile {
  title: string;
  slug: string;
  wordCount: number;
  eventCount: number;
  absentialCount: number;
  absentialRatio: number;       // absentials / events
  entityDensity: number;        // diegetic entities / events
  epiphanyPosition: number;     // 0–100% where epistemic peak occurs
  tensionCurve: TensionCurvePoint[];
  eventPacing: PacingScore;
}

export interface AuthorProfile {
  author: string;
  generatedAt: string;
  storyCount: number;
  stories: StoryProfile[];
  aggregate: {
    meanTensionCurve: TensionCurvePoint[];
    varianceBands: Array<{
      percentage: number;
      mean: number;
      stdDev: number;
      low: number;
      high: number;
    }>;
    meanAbsentialRatio: number;
    stdDevAbsentialRatio: number;
    meanEntityDensity: number;
    meanEpiphanyPosition: number;
    stdDevEpiphanyPosition: number;
  };
}

// ── Helpers ──

const STEPS = 20;

function lerp(curve: TensionCurvePoint[], pct: number): number {
  if (curve.length === 0) return 0;
  const sorted = [...curve].sort((a, b) => a.percentage - b.percentage);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (pct >= a.percentage && pct <= b.percentage) {
      const t = (pct - a.percentage) / (b.percentage - a.percentage);
      return a.scalar * (1 - t) + b.scalar * t;
    }
  }
  return sorted[sorted.length - 1].scalar;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Extract 5-dimension tension from reading's span annotations or globalTension */
function extractDimensionalTension(
  model: StoryModel,
  readingKey: string,
  pct: number,
): TensionDimensions {
  const reading = model.readings[readingKey];
  if (!reading) {
    return { absential: 0, relational: 0, epistemic: 0, atmospheric: 0, pacing: 0, composite: 0 };
  }

  // Try to get from globalTension if it has dimensional data
  const globalTension = reading.globalTension ?? [];
  
  // Find closest globalTension entry
  let closest = globalTension.reduce((best, pt) => {
    const d = Math.abs((pt.timestamp?.percentage ?? 0) - pct);
    const bd = Math.abs((best?.timestamp?.percentage ?? Infinity) - pct);
    return d < bd ? pt : best;
  }, globalTension[0]);

  // GlobalTension is scalar (value field). Build synthetic dimensions from what we know.
  // Use span annotations to approximate per-dimension values.
  const spanAnnotations = reading.spanAnnotations ?? {};
  
  // Find spans that overlap this percentage
  let absential = 0;
  let relational = 0;
  let epistemic = 0;
  let atmospheric = 0;
  let pacingVal = 0;
  let spanCount = 0;

  // Walk spans to find overlapping ones
  function walkSpan(span: any) {
    const startPct = span.startTimestamp?.percentage ?? 0;
    const endPct = span.endTimestamp?.percentage ?? 100;
    if (pct >= startPct && pct <= endPct) {
      const ann = spanAnnotations[span.id];
      if (ann?.tension !== undefined) {
        // Use annotation tension as composite
        const t = ann.tension;
        // Distribute into dimensions based on pacing metric if available
        const pm = ann.pacing;
        if (pm) {
          const base = t;
          absential += base * pm.absentialResolutionRate;
          epistemic += base * pm.knowledgeAcquisitionRate;
          relational += base * 0.25;
          atmospheric += base * 0.15;
          pacingVal += base * pm.pace;
        } else {
          // Even split
          absential += t * 0.3;
          relational += t * 0.25;
          epistemic += t * 0.25;
          atmospheric += t * 0.1;
          pacingVal += t * 0.1;
        }
        spanCount++;
      }
    }
    if (span.childSpans) {
      for (const child of span.childSpans) walkSpan(child);
    }
  }
  
  walkSpan(model.text.rootSpan);

  const composite = closest?.value ?? 0;
  if (spanCount > 0) {
    return {
      absential: Math.min(1, absential / spanCount),
      relational: Math.min(1, relational / spanCount),
      epistemic: Math.min(1, epistemic / spanCount),
      atmospheric: Math.min(1, atmospheric / spanCount),
      pacing: Math.min(1, pacingVal / spanCount),
      composite,
    };
  }

  // Fallback: use scalar composite, split evenly
  return {
    absential: composite * 0.3,
    relational: composite * 0.25,
    epistemic: composite * 0.25,
    atmospheric: composite * 0.1,
    pacing: composite * 0.1,
    composite,
  };
}

/** Find epiphany position: percentage where epistemic tension peaks */
function findEpiphanyPosition(curve: TensionCurvePoint[]): number {
  if (curve.length === 0) return 50;
  const peak = curve.reduce((best, pt) =>
    pt.dimensions.epistemic > best.dimensions.epistemic ? pt : best,
    curve[0]
  );
  return peak.percentage;
}

/** Build tension curve at STEPS intervals */
function buildTensionCurve(model: StoryModel, readingKey: string): TensionCurvePoint[] {
  const reading = model.readings[readingKey];
  if (!reading) return [];

  // Compute scalar curve using existing tension.ts
  const scalarPoints = computeTensionCurve(model.text, reading, STEPS);

  return scalarPoints.map(pt => {
    const pct = pt.timestamp.percentage;
    const dims = extractDimensionalTension(model, readingKey, pct);
    // Override composite with the normalized scalar
    dims.composite = pt.tension;
    return { percentage: pct, scalar: pt.tension, dimensions: dims };
  });
}

// ── Per-story profile ──

function buildStoryProfile(filePath: string): StoryProfile | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const model: StoryModel = JSON.parse(raw);

    const slug = path.basename(filePath, '-formalist.json');
    const title = model.text.title;
    const events = model.text.events;
    const absentials = model.text.absentials;
    const diegetic = model.text.diegetic;

    const eventCount = Object.keys(events).length;
    const absentialCount = Object.keys(absentials).length;
    const absentialRatio = eventCount > 0 ? absentialCount / eventCount : 0;

    const entityCount =
      Object.keys(diegetic.characters).length +
      Object.keys(diegetic.settings).length +
      Object.keys(diegetic.items).length +
      Object.keys(diegetic.factions).length;
    const entityDensity = eventCount > 0 ? entityCount / eventCount : 0;

    // Word count approximation from event descriptions + text mentions
    const wordCount = Object.values(events)
      .reduce((sum, e) => sum + (e.description?.split(/\s+/).length ?? 0), 0);

    // Find the first reading key (usually 'formalist' or 'Formalist Reading: ...')
    const readingKeys = Object.keys(model.readings);
    const readingKey = readingKeys[0] ?? '';

    const tensionCurve = buildTensionCurve(model, readingKey);
    const epiphanyPosition = findEpiphanyPosition(tensionCurve);
    const eventPacing = computePacing(model.text.rootSpan, model.text);

    return {
      title,
      slug,
      wordCount,
      eventCount,
      absentialCount,
      absentialRatio,
      entityDensity,
      epiphanyPosition,
      tensionCurve,
      eventPacing,
    };
  } catch (err: any) {
    console.error(`[author-profile] Error processing ${filePath}: ${err.message}`);
    return null;
  }
}

// ── Aggregate ──

function aggregate(profiles: StoryProfile[]): AuthorProfile['aggregate'] {
  const stepPcts = Array.from({ length: STEPS + 1 }, (_, i) => (i / STEPS) * 100);

  // For each step, collect scalar values across all stories
  const meanTensionCurve: TensionCurvePoint[] = stepPcts.map(pct => {
    const scalars = profiles.map(p => lerp(p.tensionCurve, pct));
    const mean = scalars.reduce((a, b) => a + b, 0) / scalars.length;

    // Mean dimensions
    const dims = (['absential', 'relational', 'epistemic', 'atmospheric', 'pacing'] as const).reduce(
      (acc, dim) => {
        const vals = profiles.map(p => {
          const pt = p.tensionCurve.find(t => t.percentage === pct) ?? p.tensionCurve[0];
          return pt?.dimensions[dim] ?? 0;
        });
        acc[dim] = vals.reduce((a, b) => a + b, 0) / vals.length;
        return acc;
      },
      {} as Record<keyof TensionDimensions, number>
    );

    return {
      percentage: pct,
      scalar: mean,
      dimensions: { ...dims, composite: mean },
    };
  });

  const varianceBands = stepPcts.map(pct => {
    const scalars = profiles.map(p => lerp(p.tensionCurve, pct));
    const mean = scalars.reduce((a, b) => a + b, 0) / scalars.length;
    const sd = stdDev(scalars);
    return { percentage: pct, mean, stdDev: sd, low: Math.max(0, mean - sd), high: Math.min(1, mean + sd) };
  });

  const absRatios = profiles.map(p => p.absentialRatio);
  const epiphanyPositions = profiles.map(p => p.epiphanyPosition);
  const entityDensities = profiles.map(p => p.entityDensity);

  return {
    meanTensionCurve,
    varianceBands,
    meanAbsentialRatio: absRatios.reduce((a, b) => a + b, 0) / absRatios.length,
    stdDevAbsentialRatio: stdDev(absRatios),
    meanEntityDensity: entityDensities.reduce((a, b) => a + b, 0) / entityDensities.length,
    meanEpiphanyPosition: epiphanyPositions.reduce((a, b) => a + b, 0) / epiphanyPositions.length,
    stdDevEpiphanyPosition: stdDev(epiphanyPositions),
  };
}

// ── CLI entry ──

function usage(): never {
  console.error(`Usage: npx ts-node src/derive/author-profile.ts \\
  --input <dir>        Directory containing *-formalist.json files
  --author <name>      Author name for the profile
  --output <file>      Output JSON path`);
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let input = '';
  let author = 'Unknown';
  let output = '';

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input': input = args[++i]; break;
      case '--author': author = args[++i]; break;
      case '--output': output = args[++i]; break;
      default: console.error(`Unknown arg: ${args[i]}`); usage();
    }
  }

  if (!input || !output) usage();
  return { input, author, output };
}

async function main() {
  const { input, author, output } = parseArgs();

  const inputDir = path.resolve(input);
  if (!fs.existsSync(inputDir)) {
    console.error(`Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(inputDir)
    .filter(f => f.endsWith('-formalist.json'))
    .map(f => path.join(inputDir, f));

  if (files.length === 0) {
    console.error(`No *-formalist.json files found in ${inputDir}`);
    process.exit(1);
  }

  console.log(`[author-profile] Processing ${files.length} stories for "${author}"...`);

  const profiles: StoryProfile[] = [];
  for (const f of files) {
    const slug = path.basename(f, '-formalist.json');
    process.stdout.write(`  [+] ${slug}... `);
    const profile = buildStoryProfile(f);
    if (profile) {
      profiles.push(profile);
      console.log(`OK (${profile.eventCount} events, epiphany@${profile.epiphanyPosition.toFixed(1)}%)`);
    } else {
      console.log('FAILED (skipped)');
    }
  }

  if (profiles.length === 0) {
    console.error('[author-profile] No stories could be processed');
    process.exit(1);
  }

  const profileData: AuthorProfile = {
    author,
    generatedAt: new Date().toISOString(),
    storyCount: profiles.length,
    stories: profiles,
    aggregate: aggregate(profiles),
  };

  const outPath = path.resolve(output);
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outPath, JSON.stringify(profileData, null, 2), 'utf-8');
  console.log(`\n[author-profile] Written to ${outPath}`);
  console.log(`[author-profile] ${profiles.length}/${files.length} stories profiled`);
  console.log(`[author-profile] Mean epiphany: ${profileData.aggregate.meanEpiphanyPosition.toFixed(1)}%`);
  console.log(`[author-profile] Mean absential ratio: ${profileData.aggregate.meanAbsentialRatio.toFixed(3)}`);
}

main().catch(err => {
  console.error('[author-profile] Fatal:', err.message);
  process.exit(1);
});
