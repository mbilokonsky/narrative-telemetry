/**
 * Regenerate selected stories with dual readings.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... npx ts-node src/ingest/regenerate.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { ingestText, ingestTextChunked } from './pipeline';
import { deriveAnnotations, collectEntities } from '../derive/annotations';

interface StorySpec {
  slug: string;
  title: string;
  collection: 'dubliners' | 'mansfield';
  textFile: string;
  lenses: string[];
}

const STORIES: StorySpec[] = [
  // Joyce
  { slug: 'the-dead', title: 'The Dead', collection: 'dubliners', textFile: 'corpus/dubliners/the-dead.txt', lenses: ['formalist', 'psychoanalytic'] },
  { slug: 'eveline', title: 'Eveline', collection: 'dubliners', textFile: 'corpus/dubliners/eveline.txt', lenses: ['formalist', 'feminist'] },
  { slug: 'a-painful-case', title: 'A Painful Case', collection: 'dubliners', textFile: 'corpus/dubliners/a-painful-case.txt', lenses: ['psychoanalytic', 'marxist'] },
  { slug: 'counterparts', title: 'Counterparts', collection: 'dubliners', textFile: 'corpus/dubliners/counterparts.txt', lenses: ['marxist', 'psychoanalytic'] },
  { slug: 'the-boarding-house', title: 'The Boarding House', collection: 'dubliners', textFile: 'corpus/dubliners/the-boarding-house.txt', lenses: ['formalist', 'feminist'] },

  // Mansfield
  { slug: 'the-garden-party', title: 'The Garden Party', collection: 'mansfield', textFile: 'corpus/mansfield/the-garden-party.txt', lenses: ['formalist', 'marxist'] },
  { slug: 'miss-brill', title: 'Miss Brill', collection: 'mansfield', textFile: 'corpus/mansfield/miss-brill.txt', lenses: ['formalist', 'psychoanalytic'] },
  { slug: 'the-daughters-of-the-late-colonel', title: 'The Daughters of the Late Colonel', collection: 'mansfield', textFile: 'corpus/mansfield/the-daughters-of-the-late-colonel.txt', lenses: ['feminist', 'psychoanalytic'] },
  { slug: 'life-of-ma-parker', title: 'Life of Ma Parker', collection: 'mansfield', textFile: 'corpus/mansfield/life-of-ma-parker.txt', lenses: ['marxist', 'phenomenological'] },
  { slug: 'her-first-ball', title: 'Her First Ball', collection: 'mansfield', textFile: 'corpus/mansfield/her-first-ball.txt', lenses: ['formalist', 'phenomenological'] },
];

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Narrative Telemetry — Story Regeneration ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const outputDir = path.resolve(__dirname, '../../output');
  const results: { slug: string; status: string; time: number }[] = [];

  for (let i = 0; i < STORIES.length; i++) {
    const spec = STORIES[i];
    const textPath = path.resolve(__dirname, '../..', spec.textFile);

    console.log(`\n[${ i + 1}/${STORIES.length}] ${spec.title}`);
    console.log(`  Text: ${spec.textFile}`);
    console.log(`  Lenses: ${spec.lenses.join(', ')}`);

    if (!fs.existsSync(textPath)) {
      console.log(`  ✗ Text file not found!`);
      results.push({ slug: spec.slug, status: 'MISSING', time: 0 });
      continue;
    }

    const text = fs.readFileSync(textPath, 'utf-8');
    const startTime = Date.now();

    try {
      const useChunked = text.length > 50000;
      const pipeline = useChunked ? ingestTextChunked : ingestText;

      console.log(`  Extracting + interpreting (${text.length.toLocaleString()} chars, ${useChunked ? 'chunked' : 'single'})...`);

      const model = await pipeline(text, {
        title: spec.title,
        lenses: spec.lenses,
        verbose: true,
      });

      // Derive text annotations
      const lines = text.split('\n');
      const entities = collectEntities(model.text.diegetic);
      const annotations = deriveAnnotations(lines, entities);
      model.text.annotations = [...(model.text.annotations ?? []), ...annotations];

      // Save
      const outPath = path.join(outputDir, spec.collection, `${spec.slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(model, null, 2));

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const eventCount = Object.keys(model.text.events).length;
      const readingCount = Object.keys(model.readings).length;
      const annCount = annotations.length;

      console.log(`  ✓ ${eventCount} events, ${readingCount} readings, ${annCount} annotations (${elapsed}s)`);
      results.push({ slug: spec.slug, status: 'OK', time: parseFloat(elapsed) });
    } catch (err: any) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✗ FAILED: ${err.message} (${elapsed}s)`);
      results.push({ slug: spec.slug, status: `FAILED: ${err.message.slice(0, 80)}`, time: parseFloat(elapsed) });
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('Results:');
  let totalTime = 0;
  for (const r of results) {
    console.log(`  ${r.status === 'OK' ? '✓' : '✗'} ${r.slug}: ${r.status} (${r.time}s)`);
    totalTime += r.time;
  }
  console.log(`\nTotal time: ${(totalTime / 60).toFixed(1)} minutes`);
  console.log(`Succeeded: ${results.filter(r => r.status === 'OK').length}/${results.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
