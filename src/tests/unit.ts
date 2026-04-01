/**
 * Unit tests for narrative-telemetry core modules.
 * 
 * Tests functions in isolation — no LLM calls, no file I/O.
 * Pure logic: derive functions, type helpers, persistence, prompts.
 */

import { computeTensionCurve, TensionPoint } from '../derive/tension';
import { coarseGrain, SpanSignificance } from '../derive/coarseGrain';
import { computePacing, PacingScore } from '../derive/pacing';
import { computeDivergence, DivergenceMap } from '../derive/divergence';
import { EntityRegistry } from '../ingest/registry';
import { chunkText, estimateTokens, getChunkStats } from '../ingest/chunker';
import {
  StorySpanType, NarrativeEventType, TextModel, Reading, StorySpan,
  AbsentialType, AbsentialStatus, Timestamp,
} from '../types';

let passed = 0;
let failed = 0;
let sectionPassed = 0;
let sectionFailed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; sectionPassed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; sectionFailed++; }
}

function section(name: string): void {
  if (sectionPassed + sectionFailed > 0) {
    console.log(`  (${sectionPassed}/${sectionPassed + sectionFailed} passed)\n`);
  }
  console.log(`--- ${name} ---\n`);
  sectionPassed = 0;
  sectionFailed = 0;
}

// ── Test fixtures ──

function makeSpan(overrides: Partial<StorySpan> = {}): StorySpan {
  return {
    id: 'span-1',
    type: StorySpanType.STORY,
    title: 'Test',
    description: 'Test span',
    startTimestamp: { percentage: 0 },
    endTimestamp: { percentage: 100 },
    events: [],
    childSpans: [],
    ...overrides,
  };
}

function makeReading(eventSigs: Record<string, number> = {}): Reading {
  const eventSignificance: Record<string, any> = {};
  for (const [id, sig] of Object.entries(eventSigs)) {
    eventSignificance[id] = { significance: sig, annotation: '' };
  }
  return {
    name: 'test-reading',
    description: 'Test reading',
    themes: {},
    symbols: {},
    symbolicRelationships: {},
    eventSignificance,
    entitySignificance: {},
    absentialSignificance: {},
    mentalConstructs: {},
    annotations: [],
    globalTension: [],
    spanAnnotations: {},
    narrator: {} as any,
    reader: {} as any,
    author: {} as any,
  };
}

function makeTextModel(overrides: Partial<TextModel> = {}): TextModel {
  return {
    title: 'Test Story',
    author: 'Test Author',
    description: 'A test story',
    rootSpan: makeSpan({
      childSpans: [
        makeSpan({
          id: 'act-1', type: StorySpanType.ACT, title: 'Act 1',
          startTimestamp: { percentage: 0 }, endTimestamp: { percentage: 50 },
          childSpans: [
            makeSpan({
              id: 'scene-1', type: StorySpanType.SCENE, title: 'Scene 1',
              startTimestamp: { percentage: 0 }, endTimestamp: { percentage: 25 },
              events: ['e01', 'e02'],
              childSpans: [
                makeSpan({
                  id: 'beat-1', type: StorySpanType.BEAT, title: 'Beat 1',
                  startTimestamp: { percentage: 0 }, endTimestamp: { percentage: 12 },
                  events: ['e01'],
                }),
                makeSpan({
                  id: 'beat-2', type: StorySpanType.BEAT, title: 'Beat 2',
                  startTimestamp: { percentage: 12 }, endTimestamp: { percentage: 25 },
                  events: ['e02'],
                }),
              ],
            }),
            makeSpan({
              id: 'scene-2', type: StorySpanType.SCENE, title: 'Scene 2',
              startTimestamp: { percentage: 25 }, endTimestamp: { percentage: 50 },
              events: ['e03'],
              childSpans: [
                makeSpan({
                  id: 'beat-3', type: StorySpanType.BEAT, title: 'Beat 3',
                  startTimestamp: { percentage: 25 }, endTimestamp: { percentage: 50 },
                  events: ['e03'],
                }),
              ],
            }),
          ],
        }),
        makeSpan({
          id: 'act-2', type: StorySpanType.ACT, title: 'Act 2',
          startTimestamp: { percentage: 50 }, endTimestamp: { percentage: 100 },
          childSpans: [
            makeSpan({
              id: 'scene-3', type: StorySpanType.SCENE, title: 'Scene 3',
              startTimestamp: { percentage: 50 }, endTimestamp: { percentage: 100 },
              events: ['e04', 'e05'],
              childSpans: [
                makeSpan({
                  id: 'beat-4', type: StorySpanType.BEAT, title: 'Beat 4',
                  startTimestamp: { percentage: 50 }, endTimestamp: { percentage: 75 },
                  events: ['e04'],
                }),
                makeSpan({
                  id: 'beat-5', type: StorySpanType.BEAT, title: 'Beat 5',
                  startTimestamp: { percentage: 75 }, endTimestamp: { percentage: 100 },
                  events: ['e05'],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    diegetic: {
      characters: {
        'char-1': { id: 'char-1', name: 'Alice', description: 'Protagonist', tags: [], isDiegetic: true, stateHistory: [], textMentions: [] } as any,
        'char-2': { id: 'char-2', name: 'Bob', description: 'Antagonist', tags: [], isDiegetic: true, stateHistory: [], textMentions: [] } as any,
      },
      settings: {
        'setting-1': { id: 'setting-1', name: 'Forest', description: 'Dark forest', tags: [], isDiegetic: true, stateHistory: [], textMentions: [] } as any,
      },
      items: {},
      factions: {},
    },
    events: {
      'e01': { id: 'e01', type: NarrativeEventType.ACTION, description: 'Alice enters', timestamp: { percentage: 5 }, participants: ['char-1'], realm: 'material_reality' as any, consequences: [] } as any,
      'e02': { id: 'e02', type: NarrativeEventType.DIALOGUE, description: 'Alice speaks', timestamp: { percentage: 15 }, participants: ['char-1'], realm: 'material_reality' as any, consequences: [] } as any,
      'e03': { id: 'e03', type: NarrativeEventType.REVELATION, description: 'Secret revealed', timestamp: { percentage: 35 }, participants: ['char-1', 'char-2'], realm: 'material_reality' as any, consequences: [] } as any,
      'e04': { id: 'e04', type: NarrativeEventType.DECISION, description: 'Alice decides', timestamp: { percentage: 60 }, participants: ['char-1'], realm: 'material_reality' as any, consequences: [] } as any,
      'e05': { id: 'e05', type: NarrativeEventType.ACTION, description: 'Final confrontation', timestamp: { percentage: 85 }, participants: ['char-1', 'char-2'], realm: 'material_reality' as any, consequences: [] } as any,
    },
    relationships: { interpersonal: {}, group: {} },
    absentials: {},
    mentalConstructs: {},
    annotations: [],
    ...overrides,
  };
}

console.log('\n=== Unit Tests ===\n');

// ═══════════════════════════════════════════════
section('Tension Curve');
// ═══════════════════════════════════════════════

const tm = makeTextModel();
const reading1 = makeReading({
  'e01': 0.2, 'e02': 0.3, 'e03': 0.7, 'e04': 0.9, 'e05': 0.8,
});

const curve = computeTensionCurve(tm, reading1, 10);

check('Returns array of points', Array.isArray(curve) && curve.length > 0);
check('Has correct number of points (11 for steps=10)', curve.length === 11);
check('First point at 0%', curve[0].timestamp.percentage === 0);
check('Last point at 100%', curve[curve.length - 1].timestamp.percentage === 100);
check('All tensions between 0 and 1', curve.every(p => p.tension >= 0 && p.tension <= 1));
check('Max tension is 1.0 (normalized)', Math.max(...curve.map(p => p.tension)) === 1);
check('Tension at 0% is 0', curve[0].tension === 0);
check('Peak is in second half (climax zone)', 
  curve.reduce((m, p) => p.tension > m.tension ? p : m, curve[0]).timestamp.percentage >= 50);

// Test with empty events
const emptyReading = makeReading({});
const emptyCurve = computeTensionCurve(tm, emptyReading, 10);
check('Empty reading: returns points', emptyCurve.length > 0);

// ═══════════════════════════════════════════════
section('Coarse-Graining');
// ═══════════════════════════════════════════════

const cg = coarseGrain(tm.rootSpan, reading1);

check('Returns SpanSignificance object', cg !== undefined && cg !== null);
check('Root span has significance', typeof cg.meanSignificance === 'number');
check('Root span has children', (cg.children?.length ?? 0) >= 2);
check('Act significance is aggregated', cg.children![0].meanSignificance >= 0);

// ═══════════════════════════════════════════════
section('Pacing');
// ═══════════════════════════════════════════════

const pacing = computePacing(tm.rootSpan, tm);

check('Returns PacingScore object', pacing !== undefined);
check('Root has event density', typeof pacing.eventDensity === 'number');
check('Root has children', (pacing.children?.length ?? 0) >= 2);
check('Event density > 0 for non-empty spans', pacing.eventDensity > 0);

// ═══════════════════════════════════════════════
section('Divergence');
// ═══════════════════════════════════════════════

const reading2 = makeReading({
  'e01': 0.1, 'e02': 0.8, 'e03': 0.3, 'e04': 0.5, 'e05': 0.9,
});

const div = computeDivergence(reading1, reading2);

check('Returns DivergenceMap', div !== undefined);
check('Has events array', Array.isArray(div.events));
check('Events count matches', div.events.length === 5);
check('Mean divergence > 0', div.meanEventDivergence > 0);
check('Max divergence > 0', div.maxEventDivergence > 0);
check('Mean ≤ max', div.meanEventDivergence <= div.maxEventDivergence);

// Check specific divergences
const e02div = div.events.find(e => e.eventId === 'e02');
check('e02 divergence = |0.3 - 0.8| = 0.5', 
  e02div !== undefined && Math.abs(e02div!.diff - 0.5) < 0.01);
const e03div = div.events.find(e => e.eventId === 'e03');
check('e03 divergence = |0.7 - 0.3| = 0.4', 
  e03div !== undefined && Math.abs(e03div!.diff - 0.4) < 0.01);

// Top divergent events should be ordered
check('Top divergent events sorted by diff desc', 
  div.topDivergentEvents.length > 0 && 
  div.topDivergentEvents[0].diff >= div.topDivergentEvents[div.topDivergentEvents.length - 1].diff);

// Divergence count with threshold
check('Divergent event count > 0', div.divergentEventCount > 0);

// Self-divergence should be 0
const selfDiv = computeDivergence(reading1, reading1);
check('Self-divergence: mean = 0', selfDiv.meanEventDivergence === 0);
check('Self-divergence: max = 0', selfDiv.maxEventDivergence === 0);
check('Self-divergence: no divergent events', selfDiv.divergentEventCount === 0);

// ═══════════════════════════════════════════════
section('Entity Registry — Edge Cases');
// ═══════════════════════════════════════════════

const reg = new EntityRegistry();

// Empty registry
check('Empty toPromptContext returns empty string', reg.toPromptContext() === '');
check('Empty getAll returns empty array', reg.getAll().length === 0);
check('Lookup on empty returns null', reg.lookup('anything') === null);

// Special characters in names
reg.register({
  id: 'dr-watson',
  type: 'character',
  canonicalName: "Dr. Watson",
  aliases: ["John H. Watson", "Watson"],
  description: "Sherlock's companion",
});

check('Lookup with punctuation: "Dr. Watson"', reg.lookup('Dr. Watson') === 'dr-watson');
check('Lookup normalized: "dr watson"', reg.lookup('dr watson') === 'dr-watson');
check('Lookup alias with punctuation', reg.lookup('John H. Watson') === 'dr-watson');

// Multiple types
reg.register({ id: 'baker-st', type: 'setting', canonicalName: '221B Baker Street', aliases: ['Baker Street'], description: 'Holmes residence' });
reg.register({ id: 'violin', type: 'item', canonicalName: "Holmes's Violin", aliases: ['the violin'], description: 'Stradivarius' });

check('getByType character count', reg.getByType('character').length === 1);
check('getByType setting count', reg.getByType('setting').length === 1);
check('getByType item count', reg.getByType('item').length === 1);
check('getByType absential count (empty)', reg.getByType('absential').length === 0);
check('Total count = 3', reg.count === 3);

// Prompt context has all types
const ctx = reg.toPromptContext();
check('Prompt context has Characters section', ctx.includes('Characters'));
check('Prompt context has Settings section', ctx.includes('Settings'));
check('Prompt context has Items section', ctx.includes('Items'));
check('Prompt context does NOT have empty Absentials', !ctx.includes('Absentials'));

// ═══════════════════════════════════════════════
section('Chunker — Edge Cases');
// ═══════════════════════════════════════════════

// Empty text
const emptyChunks = chunkText('');
check('Empty text: returns 1 chunk', emptyChunks.length === 1);

// Single paragraph
const singleChunks = chunkText('Just one paragraph.');
check('Single paragraph: returns 1 chunk', singleChunks.length === 1);

// Text with only scene breaks but short
const shortScene = 'First scene.\n\n* * *\n\nSecond scene.';
const shortSceneChunks = chunkText(shortScene);
check('Short scene-break text: single chunk (under target)', shortSceneChunks.length === 1);

// Roman numeral detection
const romanText = 'A'.repeat(20000) + '\n\nI.\n\n' + 'B'.repeat(20000) + '\n\nII.\n\n' + 'C'.repeat(20000);
const romanChunks = chunkText(romanText, { targetChunkSize: 15000 });
check('Roman numeral chapters detected', romanChunks.filter(c => !c.isOverlap).length >= 2);

// Token estimation
check('Token estimate: 0 chars = 0 tokens', estimateTokens(0) === 0);
check('Token estimate: 100 chars = 25 tokens', estimateTokens(100) === 25);
check('Token estimate: 1 char = 1 token (ceiling)', estimateTokens(1) === 1);

// getChunkStats
const statsChunks = chunkText('test');
const stats = getChunkStats(statsChunks);
check('Stats: totalChunks >= 1', stats.totalChunks >= 1);
check('Stats: contentChunks >= 1', stats.contentChunks >= 1);
check('Stats: avgChunkSize > 0', stats.avgChunkSize > 0);

// ═══════════════════════════════════════════════
section('TextModel Fixture Integrity');
// ═══════════════════════════════════════════════

// Verify the test fixture itself is well-formed
check('Fixture has 2 acts', tm.rootSpan.childSpans.length === 2);
check('Act 1 has 2 scenes', tm.rootSpan.childSpans[0].childSpans.length === 2);
check('Act 2 has 1 scene', tm.rootSpan.childSpans[1].childSpans.length === 1);
check('5 events total', Object.keys(tm.events).length === 5);
check('2 characters', Object.keys(tm.diegetic.characters).length === 2);
check('1 setting', Object.keys(tm.diegetic.settings).length === 1);
check('Events reference valid characters', 
  (tm.events['e03'] as any).participants.every((p: string) => p in tm.diegetic.characters));

// ═══════════════════════════════════════════════
//  Summary
// ═══════════════════════════════════════════════

console.log(`  (${sectionPassed}/${sectionPassed + sectionFailed} passed)\n`);
console.log(`${'═'.repeat(40)}`);
console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
console.log(`${'═'.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
