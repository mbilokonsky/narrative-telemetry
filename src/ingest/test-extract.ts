import * as fs from 'fs';
import * as path from 'path';
import { extractTextModel } from './extract';

async function main() {
  const text = fs.readFileSync(path.resolve(__dirname, '../../corpus/araby.txt'), 'utf-8');
  console.log(`Read ${text.split('\n').length} lines from corpus/araby.txt`);

  const textModel = await extractTextModel(text);

  // Validation checks
  const chars = Object.keys(textModel.diegetic.characters);
  const settings = Object.keys(textModel.diegetic.settings);
  const items = Object.keys(textModel.diegetic.items);
  const events = Object.keys(textModel.events);
  const absentials = Object.keys(textModel.absentials);
  const rels = Object.keys(textModel.relationships.interpersonal);

  console.log('\n=== Phase 1 Validation ===');
  console.log(`Characters: ${chars.length} (target: ~11)`);
  console.log(`  IDs: ${chars.join(', ')}`);
  console.log(`Settings: ${settings.length} (target: ~9)`);
  console.log(`  IDs: ${settings.join(', ')}`);
  console.log(`Items: ${items.length} (target: ~7)`);
  console.log(`  IDs: ${items.join(', ')}`);
  console.log(`Events: ${events.length} (target: ~28)`);
  console.log(`Absentials: ${absentials.length} (target: ~5)`);
  console.log(`Relationships: ${rels.length}`);

  // Check span nesting
  const root = textModel.rootSpan;
  console.log(`\nSpan tree: ${root.childSpans.length} acts`);
  for (const act of root.childSpans) {
    console.log(`  ${act.title}: ${act.childSpans.length} scenes, ${act.events.length} direct events`);
    for (const scene of act.childSpans) {
      console.log(`    ${scene.title}: ${scene.childSpans.length} beats, ${scene.events.length} direct events`);
    }
  }

  // Check event cross-references
  let badRefs = 0;
  const allEntityIds = new Set([...chars, ...settings, ...items, ...Object.keys(textModel.diegetic.factions)]);
  for (const [eid, evt] of Object.entries(textModel.events)) {
    for (const pid of evt.participants) {
      if (!allEntityIds.has(pid)) {
        console.log(`  WARNING: Event ${eid} references unknown participant: ${pid}`);
        badRefs++;
      }
    }
  }
  console.log(`\nCross-reference check: ${badRefs} bad references`);

  // Write output for inspection
  const outPath = path.resolve(__dirname, '../../data/araby-extracted.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ text: textModel, readings: {} }, null, 2));
  console.log(`\nWrote output to ${outPath}`);
}

main().catch(err => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
