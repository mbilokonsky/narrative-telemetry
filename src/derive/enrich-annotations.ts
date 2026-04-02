/**
 * Enrich all story JSON files with derived TextAnnotations.
 *
 * For each story that has both a JSON analysis and a source text file,
 * search for entity textMentions in the text and add TextAnnotation
 * objects to the JSON.
 *
 * Usage:
 *   npx ts-node src/derive/enrich-annotations.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { deriveAnnotations, collectEntities } from './annotations';

const OUTPUT_DIR = path.resolve(__dirname, '../../output');
const CORPUS_DIR = path.resolve(__dirname, '../../corpus');

interface StoryFile {
  jsonPath: string;
  textPath: string;
  name: string;
}

function findStoryPairs(): StoryFile[] {
  const pairs: StoryFile[] = [];

  for (const collection of ['dubliners', 'mansfield']) {
    const jsonDir = path.join(OUTPUT_DIR, collection);
    const textDir = path.join(CORPUS_DIR, collection);
    if (!fs.existsSync(jsonDir) || !fs.existsSync(textDir)) continue;

    for (const jsonFile of fs.readdirSync(jsonDir)) {
      if (!jsonFile.endsWith('.json')) continue;
      const slug = jsonFile.replace(/-formalist\.json$/, '');
      const textFile = `${slug}.txt`;
      const textPath = path.join(textDir, textFile);

      if (fs.existsSync(textPath)) {
        pairs.push({
          jsonPath: path.join(jsonDir, jsonFile),
          textPath,
          name: `${collection}/${slug}`,
        });
      }
    }
  }

  return pairs;
}

function main() {
  console.log('Enriching stories with derived annotations...\n');

  const pairs = findStoryPairs();
  let enriched = 0;

  for (const pair of pairs) {
    const raw = fs.readFileSync(pair.jsonPath, 'utf-8');
    const model = JSON.parse(raw);
    const text = fs.readFileSync(pair.textPath, 'utf-8');
    const lines = text.split('\n');

    const existingCount = (model.text.annotations ?? []).length;
    const entities = collectEntities(model.text.diegetic);
    const newAnnotations = deriveAnnotations(lines, entities);

    if (newAnnotations.length > 0) {
      // Merge with existing annotations (if any)
      model.text.annotations = [
        ...(model.text.annotations ?? []),
        ...newAnnotations,
      ];

      fs.writeFileSync(pair.jsonPath, JSON.stringify(model, null, 2));
      console.log(`  ${pair.name}: +${newAnnotations.length} annotations (was ${existingCount})`);
      enriched++;
    } else {
      console.log(`  ${pair.name}: no mentions found`);
    }
  }

  console.log(`\nEnriched ${enriched}/${pairs.length} stories`);
}

main();
