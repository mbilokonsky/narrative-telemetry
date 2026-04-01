/**
 * compare-authors.ts — Comparative analysis of Joyce and Mansfield authorial profiles.
 *
 * Usage:
 *   npx ts-node src/analytics/compare-authors.ts \
 *     --joyce output/joyce-profile.json \
 *     --mansfield output/mansfield-profile.json \
 *     --output output/comparative-analysis.json
 *
 * Computes:
 *   - Divergence vectors per dimension (absential/relational/epistemic/atmospheric/pacing)
 *   - Euclidean distance between mean curves
 *   - Peak offset (where each author peaks per dimension)
 *   - Consistency variance (how much stories cluster around the mean)
 *   - Structural signatures: epiphany timing, absential ratios, pacing profiles
 *   - Outlier detection: stories that deviate most from their author's signature
 *   - Dimension coupling: cross-correlation between dimensions per author
 */

import * as fs from 'fs';
import * as path from 'path';
import { AuthorProfile, StoryProfile, TensionCurvePoint } from '../derive/author-profile';

// ── Types ──

export interface DivergenceVector {
  dimension: string;
  euclideanDistance: number;
  pearsonCorrelation: number;
  joycepeakPct: number;
  mansfieldPeakPct: number;
  peakOffsetPct: number;
  joyceMeanCurve: number[];
  mansfieldMeanCurve: number[];
  interpretation: string;
}

export interface StructuralSignature {
  metric: string;
  joyce: number;
  mansfield: number;
  delta: number;
  interpretation: string;
}

export interface OutlierStory {
  title: string;
  author: string;
  deviationScore: number;
  deviatingDimensions: string[];
  note: string;
}

export interface DimensionCoupling {
  dim1: string;
  dim2: string;
  joyceCorrelation: number;
  mansfieldCorrelation: number;
  divergence: number;
}

export interface ComparativeAnalysis {
  authors: {
    joyce: AuthorProfile;
    mansfield: AuthorProfile;
  };
  divergences: Record<string, DivergenceVector>;
  structuralSignatures: StructuralSignature[];
  dimensionCoupling: DimensionCoupling[];
  outliers: OutlierStory[];
  interpretation: string;
}

// ── Math helpers ──

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
}

function euclidean(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  return Math.sqrt(a.slice(0, len).reduce((sum, _, i) => sum + (a[i] - b[i]) ** 2, 0) / len);
}

function pearson(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len < 2) return 0;
  const ma = mean(a.slice(0, len));
  const mb = mean(b.slice(0, len));
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < len; i++) {
    const dav = a[i] - ma;
    const dbv = b[i] - mb;
    num += dav * dbv;
    da += dav * dav;
    db += dbv * dbv;
  }
  const denom = Math.sqrt(da * db);
  return denom === 0 ? 0 : num / denom;
}

function peakPosition(arr: number[], percentages: number[]): number {
  if (arr.length === 0) return 50;
  let maxVal = -Infinity, maxPct = 50;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > maxVal) {
      maxVal = arr[i];
      maxPct = percentages[i] ?? (i / (arr.length - 1)) * 100;
    }
  }
  return maxPct;
}

// ── Extract dimension curve from a profile ──

const DIMS = ['absential', 'relational', 'epistemic', 'atmospheric', 'pacing', 'composite'] as const;
type Dim = typeof DIMS[number];

function extractCurve(profile: AuthorProfile, dim: Dim): { values: number[]; percentages: number[] } {
  const pts = profile.aggregate.meanTensionCurve;
  const percentages = pts.map(p => p.percentage);
  const values = pts.map(p => {
    if (dim === 'composite') return p.scalar;
    return p.dimensions[dim] ?? 0;
  });
  return { values, percentages };
}

/** Per-story scalar at each sample point (for consistency/outlier analysis) */
function storyDimValues(stories: StoryProfile[], dim: Dim, percentages: number[]): number[][] {
  return stories.map(story => {
    return percentages.map(pct => {
      const curve = story.tensionCurve;
      if (!curve || curve.length === 0) return 0;
      // Find closest point
      const closest = curve.reduce((best, pt) =>
        Math.abs(pt.percentage - pct) < Math.abs(best.percentage - pct) ? pt : best,
        curve[0]
      );
      if (dim === 'composite') return closest.scalar ?? 0;
      return closest.dimensions?.[dim] ?? 0;
    });
  });
}

// ── Divergence vectors ──

function computeDivergences(
  joyce: AuthorProfile,
  mansfield: AuthorProfile,
): Record<string, DivergenceVector> {
  const divergences: Record<string, DivergenceVector> = {};

  const dims: Dim[] = ['absential', 'relational', 'epistemic', 'atmospheric', 'pacing', 'composite'];

  for (const dim of dims) {
    const jc = extractCurve(joyce, dim);
    const mc = extractCurve(mansfield, dim);

    const dist = euclidean(jc.values, mc.values);
    const corr = pearson(jc.values, mc.values);
    const jPeak = peakPosition(jc.values, jc.percentages);
    const mPeak = peakPosition(mc.values, mc.percentages);
    const peakOffset = jPeak - mPeak;

    // Compute consistency variance for each author
    const jStoryVals = storyDimValues(joyce.stories, dim, jc.percentages);
    const mStoryVals = storyDimValues(mansfield.stories, dim, mc.percentages);

    // Per-step consistency: how much do stories deviate from mean at each point
    const jConsistency = jc.percentages.map((_, i) => {
      const vals = jStoryVals.map(sv => sv[i]);
      return stddev(vals);
    });
    const mConsistency = mc.percentages.map((_, i) => {
      const vals = mStoryVals.map(sv => sv[i]);
      return stddev(vals);
    });

    const jMeanConsistency = mean(jConsistency);
    const mMeanConsistency = mean(mConsistency);

    const interpretation = buildDivergenceInterpretation(dim, dist, peakOffset, jPeak, mPeak, jMeanConsistency, mMeanConsistency, corr);

    divergences[dim] = {
      dimension: dim,
      euclideanDistance: parseFloat(dist.toFixed(4)),
      pearsonCorrelation: parseFloat(corr.toFixed(4)),
      joycepeakPct: parseFloat(jPeak.toFixed(1)),
      mansfieldPeakPct: parseFloat(mPeak.toFixed(1)),
      peakOffsetPct: parseFloat(peakOffset.toFixed(1)),
      joyceMeanCurve: jc.values.map(v => parseFloat(v.toFixed(4))),
      mansfieldMeanCurve: mc.values.map(v => parseFloat(v.toFixed(4))),
      interpretation,
    };
  }

  return divergences;
}

function buildDivergenceInterpretation(
  dim: string,
  dist: number,
  peakOffset: number,
  jPeak: number,
  mPeak: number,
  jConsistency: number,
  mConsistency: number,
  corr: number,
): string {
  const distLevel = dist > 0.2 ? 'substantially' : dist > 0.1 ? 'moderately' : 'slightly';
  const peakDir = peakOffset > 5 ? 'later in Joyce' : peakOffset < -5 ? 'earlier in Joyce' : 'at similar positions';
  const consistencyNotes: string[] = [];
  if (jConsistency > mConsistency + 0.05) consistencyNotes.push('Joyce is more variable');
  else if (mConsistency > jConsistency + 0.05) consistencyNotes.push('Mansfield is more variable');
  else consistencyNotes.push('similar story-to-story consistency');
  const corrNote = corr > 0.7 ? 'strong shape similarity' : corr < 0.3 ? 'divergent curves' : 'moderate shape similarity';

  const dimNarrative: Record<string, string> = {
    absential: 'Unresolved desires and goals drive tension',
    relational: 'Interpersonal stress and conflict',
    epistemic: 'Information asymmetry and revelations (epiphany mechanics)',
    atmospheric: 'Mood and environmental pressure',
    pacing: 'Event density and temporal compression',
    composite: 'Overall narrative tension',
  };

  return `${dimNarrative[dim] ?? dim}: curves diverge ${distLevel} (dist=${dist.toFixed(3)}, ` +
    `peak ${peakDir} — Joyce@${jPeak.toFixed(0)}% vs Mansfield@${mPeak.toFixed(0)}%), ` +
    `${consistencyNotes.join('; ')}, ${corrNote} (r=${corr.toFixed(2)}).`;
}

// ── Structural signatures ──

function computeStructuralSignatures(
  joyce: AuthorProfile,
  mansfield: AuthorProfile,
): StructuralSignature[] {
  const sigs: StructuralSignature[] = [];

  // Epiphany position
  {
    const j = joyce.aggregate.meanEpiphanyPosition;
    const m = mansfield.aggregate.meanEpiphanyPosition;
    sigs.push({
      metric: 'mean_epiphany_position_pct',
      joyce: parseFloat(j.toFixed(1)),
      mansfield: parseFloat(m.toFixed(1)),
      delta: parseFloat((j - m).toFixed(1)),
      interpretation: j > m
        ? `Joyce's epiphanies land ${(j - m).toFixed(1)}% later on average — paralysis held until the final moments.`
        : `Mansfield's epiphanies land ${(m - j).toFixed(1)}% later — atmospheric revelation deferred longer.`,
    });
  }

  // Epiphany consistency
  {
    const j = joyce.aggregate.stdDevEpiphanyPosition;
    const m = mansfield.aggregate.stdDevEpiphanyPosition;
    sigs.push({
      metric: 'epiphany_position_stddev',
      joyce: parseFloat(j.toFixed(1)),
      mansfield: parseFloat(m.toFixed(1)),
      delta: parseFloat((j - m).toFixed(1)),
      interpretation: j < m
        ? `Joyce places epiphanies more consistently (σ=${j.toFixed(1)} vs ${m.toFixed(1)}), suggesting a tighter structural formula.`
        : `Mansfield places epiphanies more consistently (σ=${m.toFixed(1)} vs ${j.toFixed(1)}), suggesting disciplined atmospheric timing.`,
    });
  }

  // Absential ratio
  {
    const j = joyce.aggregate.meanAbsentialRatio;
    const m = mansfield.aggregate.meanAbsentialRatio;
    sigs.push({
      metric: 'mean_absential_ratio',
      joyce: parseFloat(j.toFixed(3)),
      mansfield: parseFloat(m.toFixed(3)),
      delta: parseFloat((j - m).toFixed(3)),
      interpretation: j > m
        ? `Joyce uses more absentials per event (${j.toFixed(3)} vs ${m.toFixed(3)}) — desire, absence, and longing are the dominant structural engine.`
        : `Mansfield uses more absentials per event (${m.toFixed(3)} vs ${j.toFixed(3)}) — absence drives her stories more densely.`,
    });
  }

  // Entity density
  {
    const j = joyce.aggregate.meanEntityDensity;
    const m = mansfield.aggregate.meanEntityDensity;
    sigs.push({
      metric: 'mean_entity_density',
      joyce: parseFloat(j.toFixed(3)),
      mansfield: parseFloat(m.toFixed(3)),
      delta: parseFloat((j - m).toFixed(3)),
      interpretation: j > m
        ? `Joyce's stories carry more named entities per event (${j.toFixed(3)} vs ${m.toFixed(3)}) — richer social texture.`
        : `Mansfield's stories carry more named entities per event (${m.toFixed(3)} vs ${j.toFixed(3)}) — more populated narrative worlds.`,
    });
  }

  // Mean event count (pacing proxy)
  {
    const j = mean(joyce.stories.map(s => s.eventCount));
    const m = mean(mansfield.stories.map(s => s.eventCount));
    sigs.push({
      metric: 'mean_event_count',
      joyce: parseFloat(j.toFixed(1)),
      mansfield: parseFloat(m.toFixed(1)),
      delta: parseFloat((j - m).toFixed(1)),
      interpretation: j > m
        ? `Joyce's stories average ${j.toFixed(0)} events vs Mansfield's ${m.toFixed(0)} — denser plot construction.`
        : `Mansfield's stories average ${m.toFixed(0)} events vs Joyce's ${j.toFixed(0)} — more incident-rich narrative worlds.`,
    });
  }

  // Tension front-loading (is mean tension higher in first half than second?)
  {
    function frontLoadScore(profile: AuthorProfile): number {
      const curve = profile.aggregate.meanTensionCurve;
      const firstHalf = curve.filter(p => p.percentage <= 50).map(p => p.scalar);
      const secondHalf = curve.filter(p => p.percentage > 50).map(p => p.scalar);
      return mean(firstHalf) - mean(secondHalf);
    }
    const j = frontLoadScore(joyce);
    const m = frontLoadScore(mansfield);
    sigs.push({
      metric: 'tension_front_load_score',
      joyce: parseFloat(j.toFixed(3)),
      mansfield: parseFloat(m.toFixed(3)),
      delta: parseFloat((j - m).toFixed(3)),
      interpretation: j > 0
        ? `Joyce front-loads tension (score=${j.toFixed(3)}) — establishing paralysis early, then sustaining it.`
        : j < 0
          ? `Joyce back-loads tension (score=${j.toFixed(3)}) — building toward late revelation.`
          : `Joyce distributes tension evenly.`,
    });
  }

  return sigs;
}

// ── Dimension coupling ──

function computeDimensionCoupling(
  joyce: AuthorProfile,
  mansfield: AuthorProfile,
): DimensionCoupling[] {
  const dims: Dim[] = ['absential', 'relational', 'epistemic', 'atmospheric', 'pacing'];
  const percentages = joyce.aggregate.meanTensionCurve.map(p => p.percentage);

  const pairs: DimensionCoupling[] = [];

  for (let i = 0; i < dims.length; i++) {
    for (let j = i + 1; j < dims.length; j++) {
      const d1 = dims[i];
      const d2 = dims[j];

      const jc1 = extractCurve(joyce, d1).values;
      const jc2 = extractCurve(joyce, d2).values;
      const mc1 = extractCurve(mansfield, d1).values;
      const mc2 = extractCurve(mansfield, d2).values;

      const jCorr = pearson(jc1, jc2);
      const mCorr = pearson(mc1, mc2);

      pairs.push({
        dim1: d1,
        dim2: d2,
        joyceCorrelation: parseFloat(jCorr.toFixed(3)),
        mansfieldCorrelation: parseFloat(mCorr.toFixed(3)),
        divergence: parseFloat(Math.abs(jCorr - mCorr).toFixed(3)),
      });
    }
  }

  // Sort by divergence descending
  return pairs.sort((a, b) => b.divergence - a.divergence);
}

// ── Outlier detection ──

function computeOutliers(
  joyce: AuthorProfile,
  mansfield: AuthorProfile,
): OutlierStory[] {
  const outliers: OutlierStory[] = [];

  function findOutliersForAuthor(profile: AuthorProfile, authorName: string) {
    const percentages = profile.aggregate.meanTensionCurve.map(p => p.percentage);
    const dims: Dim[] = ['absential', 'relational', 'epistemic', 'atmospheric', 'pacing', 'composite'];

    const meanCurves: Record<string, number[]> = {};
    const stdCurves: Record<string, number[]> = {};

    for (const dim of dims) {
      const storyVals = storyDimValues(profile.stories, dim, percentages);
      meanCurves[dim] = percentages.map((_, i) => mean(storyVals.map(sv => sv[i])));
      stdCurves[dim] = percentages.map((_, i) => stddev(storyVals.map(sv => sv[i])));
    }

    for (const story of profile.stories) {
      let totalDeviation = 0;
      const deviatingDims: string[] = [];

      for (const dim of dims) {
        const storyVals = percentages.map(pct => {
          const curve = story.tensionCurve;
          if (!curve || curve.length === 0) return 0;
          const closest = curve.reduce((best, pt) =>
            Math.abs(pt.percentage - pct) < Math.abs(best.percentage - pct) ? pt : best,
            curve[0]
          );
          if (dim === 'composite') return closest.scalar ?? 0;
          return closest.dimensions?.[dim] ?? 0;
        });

        // Compute per-step z-score deviation
        const deviation = euclidean(storyVals, meanCurves[dim]);
        totalDeviation += deviation;

        const avgStd = mean(stdCurves[dim]);
        if (avgStd > 0 && deviation > avgStd * 1.5) {
          deviatingDims.push(dim);
        }
      }

      const score = totalDeviation / dims.length;
      if (score > 0.05 || deviatingDims.length >= 2) {
        outliers.push({
          title: story.title,
          author: authorName,
          deviationScore: parseFloat(score.toFixed(4)),
          deviatingDimensions: deviatingDims,
          note: deviatingDims.length > 0
            ? `Deviates on: ${deviatingDims.join(', ')}`
            : `Mild but consistent deviation across all dimensions`,
        });
      }
    }
  }

  findOutliersForAuthor(joyce, 'James Joyce');
  findOutliersForAuthor(mansfield, 'Katherine Mansfield');

  return outliers.sort((a, b) => b.deviationScore - a.deviationScore);
}

// ── Overall interpretation ──

function buildInterpretation(
  divergences: Record<string, DivergenceVector>,
  signatures: StructuralSignature[],
): string {
  const epSig = signatures.find(s => s.metric === 'mean_epiphany_position_pct');
  const absSig = signatures.find(s => s.metric === 'mean_absential_ratio');
  const pacingSig = signatures.find(s => s.metric === 'mean_event_count');

  const epNote = epSig
    ? `Joyce's epiphanies arrive at ${epSig.joyce}% vs Mansfield's ${epSig.mansfield}%.`
    : '';

  const topDivDim = Object.values(divergences)
    .filter(d => d.dimension !== 'composite')
    .sort((a, b) => b.euclideanDistance - a.euclideanDistance)[0];

  const bottomDivDim = Object.values(divergences)
    .filter(d => d.dimension !== 'composite')
    .sort((a, b) => a.euclideanDistance - b.euclideanDistance)[0];

  const absNote = absSig
    ? (absSig.joyce > absSig.mansfield
      ? `Joyce's stories are more absential-dense (ratio ${absSig.joyce} vs ${absSig.mansfield}), encoding paralysis as unfulfilled desire.`
      : `Mansfield's stories carry more absentials per event (ratio ${absSig.mansfield} vs ${absSig.joyce}).`)
    : '';

  const pacingNote = pacingSig
    ? (pacingSig.mansfield > pacingSig.joyce
      ? `Mansfield's stories are incident-richer (${pacingSig.mansfield} events avg vs ${pacingSig.joyce}) despite often being shorter.`
      : `Joyce's stories average more events (${pacingSig.joyce} vs ${pacingSig.mansfield}), building denser social worlds.`)
    : '';

  return [
    `Joyce and Mansfield share a late-revelation structural shape but diverge most on ${topDivDim?.dimension ?? 'epistemic'} tension (distance=${topDivDim?.euclideanDistance?.toFixed(3)}).`,
    epNote,
    absNote,
    pacingNote,
    `They converge most strongly on ${bottomDivDim?.dimension ?? 'atmospheric'} tension, suggesting both authors use similar atmospheric/environmental pressure regardless of story content.`,
    `Structural signatures suggest that "Joyce-shaped" stories build absential tension early and hold it as paralysis; "Mansfield-shaped" stories distribute tension across social encounters with a final atmospheric revelation.`,
  ].filter(Boolean).join(' ');
}

// ── Main ──

function usage(): never {
  console.error(`Usage: npx ts-node src/analytics/compare-authors.ts \\
  --joyce output/joyce-profile.json \\
  --mansfield output/mansfield-profile.json \\
  --output output/comparative-analysis.json`);
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let joycePath = '';
  let mansfieldPath = '';
  let output = '';

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--joyce': joycePath = args[++i]; break;
      case '--mansfield': mansfieldPath = args[++i]; break;
      case '--output': output = args[++i]; break;
      default: console.error(`Unknown arg: ${args[i]}`); usage();
    }
  }
  if (!joycePath || !mansfieldPath || !output) usage();
  return { joycePath, mansfieldPath, output };
}

async function main() {
  const { joycePath, mansfieldPath, output } = parseArgs();

  console.log('[compare-authors] Loading profiles...');
  const joyce: AuthorProfile = JSON.parse(fs.readFileSync(path.resolve(joycePath), 'utf-8'));
  const mansfield: AuthorProfile = JSON.parse(fs.readFileSync(path.resolve(mansfieldPath), 'utf-8'));

  console.log(`[compare-authors] Joyce: ${joyce.storyCount} stories`);
  console.log(`[compare-authors] Mansfield: ${mansfield.storyCount} stories`);

  console.log('[compare-authors] Computing divergence vectors...');
  const divergences = computeDivergences(joyce, mansfield);

  console.log('[compare-authors] Computing structural signatures...');
  const structuralSignatures = computeStructuralSignatures(joyce, mansfield);

  console.log('[compare-authors] Computing dimension coupling...');
  const dimensionCoupling = computeDimensionCoupling(joyce, mansfield);

  console.log('[compare-authors] Detecting outliers...');
  const outliers = computeOutliers(joyce, mansfield);

  const interpretation = buildInterpretation(divergences, structuralSignatures);

  const analysis: ComparativeAnalysis = {
    authors: { joyce, mansfield },
    divergences,
    structuralSignatures,
    dimensionCoupling,
    outliers,
    interpretation,
  };

  const outPath = path.resolve(output);
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`\n[compare-authors] Written to ${outPath}`);

  // Print summary
  console.log('\n=== KEY FINDINGS ===');
  for (const dim of ['absential', 'relational', 'epistemic', 'atmospheric', 'pacing']) {
    const d = divergences[dim];
    console.log(`  ${dim.padEnd(12)}: dist=${d.euclideanDistance.toFixed(3)}, peak Joyce@${d.joycepeakPct}% vs Mansfield@${d.mansfieldPeakPct}%`);
  }
  console.log('\n=== STRUCTURAL SIGNATURES ===');
  for (const sig of structuralSignatures) {
    console.log(`  ${sig.metric.padEnd(35)}: Joyce=${sig.joyce} vs Mansfield=${sig.mansfield} (Δ=${sig.delta})`);
  }
  console.log('\n=== TOP OUTLIERS ===');
  for (const ol of outliers.slice(0, 6)) {
    console.log(`  [${ol.author.split(' ').pop()}] ${ol.title} (score=${ol.deviationScore}) — ${ol.note}`);
  }
  console.log('\n=== INTERPRETATION ===');
  console.log(interpretation);
}

main().catch(err => {
  console.error('[compare-authors] Fatal:', err.message);
  process.exit(1);
});
