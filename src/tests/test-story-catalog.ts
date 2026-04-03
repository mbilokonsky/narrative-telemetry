/**
 * Tests for the story catalog and data file integrity.
 * Validates that all catalog entries point to real files and that
 * the JSON files contain valid StoryModel data.
 */
import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; }
}

// We can't import the TS catalog directly (different tsconfig), so we
// replicate the catalog data paths and validate them against the filesystem.

const UI_PUBLIC = path.resolve(__dirname, '../../ui/public');

interface CatalogEntry {
  slug: string;
  title: string;
  author: string;
  collection: string;
  dataPath: string;
  textPath?: string;
}

const catalog: CatalogEntry[] = [
  { slug: 'araby', title: 'Araby', author: 'James Joyce', collection: 'hand-coded', dataPath: '/data/araby.json', textPath: '/data/araby.txt' },
  { slug: 'the-dead', title: 'The Dead', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/the-dead.json', textPath: '/data/dubliners/the-dead.txt' },
  { slug: 'eveline', title: 'Eveline', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/eveline.json', textPath: '/data/dubliners/eveline.txt' },
  { slug: 'a-painful-case', title: 'A Painful Case', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/a-painful-case.json', textPath: '/data/dubliners/a-painful-case.txt' },
  { slug: 'counterparts', title: 'Counterparts', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/counterparts.json', textPath: '/data/dubliners/counterparts.txt' },
  { slug: 'the-boarding-house', title: 'The Boarding House', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/the-boarding-house.json', textPath: '/data/dubliners/the-boarding-house.txt' },
  { slug: 'the-garden-party', title: 'The Garden Party', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/the-garden-party.json', textPath: '/data/mansfield/the-garden-party.txt' },
  { slug: 'miss-brill', title: 'Miss Brill', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/miss-brill.json', textPath: '/data/mansfield/miss-brill.txt' },
  { slug: 'the-daughters-of-the-late-colonel', title: 'The Daughters of the Late Colonel', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/the-daughters-of-the-late-colonel.json', textPath: '/data/mansfield/the-daughters-of-the-late-colonel.txt' },
  { slug: 'life-of-ma-parker', title: 'Life of Ma Parker', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/life-of-ma-parker.json', textPath: '/data/mansfield/life-of-ma-parker.txt' },
  { slug: 'her-first-ball', title: 'Her First Ball', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/her-first-ball.json', textPath: '/data/mansfield/her-first-ball.txt' },
];

console.log('\n--- Story Catalog: Data Integrity ---\n');

// Test 1: All slugs are unique
const slugs = catalog.map(s => s.slug);
const uniqueSlugs = new Set(slugs);
check('All slugs are unique', slugs.length === uniqueSlugs.size, `${slugs.length} entries, ${uniqueSlugs.size} unique`);

// Test 2: Catalog has expected count
check('Catalog has 11 entries (10 regenerated + 1 hand-coded Araby)', catalog.length === 11);

// Test 3: All data files exist
console.log('\n--- Story Catalog: File Existence ---\n');
for (const entry of catalog) {
  const filePath = path.join(UI_PUBLIC, entry.dataPath);
  check(`${entry.slug}: data file exists`, fs.existsSync(filePath), filePath);
}

// Test 4: Text files exist for all stories
console.log('\n--- Story Catalog: Text File Existence ---\n');
// All entries now have textPath in the catalog, just use those
const textPaths: Record<string, string> = {};
for (const entry of catalog) {
  if (entry.textPath) textPaths[entry.slug] = entry.textPath;
}
for (const entry of catalog) {
  const tp = textPaths[entry.slug];
  if (tp) {
    const filePath = path.join(UI_PUBLIC, tp);
    const exists = fs.existsSync(filePath);
    check(`${entry.slug}: text file exists`, exists, filePath);
    if (exists) {
      const content = fs.readFileSync(filePath, 'utf-8');
      check(`${entry.slug}: text has content (${content.split('\n').length} lines)`, content.length > 100);
    }
  }
}

// Test 5: All JSON files are valid and contain required StoryModel fields
console.log('\n--- Story Catalog: JSON Validity ---\n');
for (const entry of catalog) {
  const filePath = path.join(UI_PUBLIC, entry.dataPath);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const hasText = data.text && typeof data.text === 'object';
    const hasTitle = hasText && typeof data.text.title === 'string';
    const hasRootSpan = hasText && data.text.rootSpan && typeof data.text.rootSpan === 'object';
    const hasEvents = hasText && data.text.events && typeof data.text.events === 'object';
    const hasReadings = data.readings && typeof data.readings === 'object' && Object.keys(data.readings).length > 0;
    const hasDiegetic = hasText && data.text.diegetic && typeof data.text.diegetic === 'object';

    check(`${entry.slug}: valid StoryModel structure`,
      hasTitle && hasRootSpan && hasEvents && hasReadings && hasDiegetic,
      `title=${hasTitle} rootSpan=${hasRootSpan} events=${hasEvents} readings=${hasReadings} diegetic=${hasDiegetic}`
    );

    // Validate event count > 0
    const eventCount = Object.keys(data.text.events).length;
    check(`${entry.slug}: has events (${eventCount})`, eventCount > 0);

    // Validate at least one reading has tension data
    const readingKeys = Object.keys(data.readings);
    const hasTension = readingKeys.some((k: string) =>
      data.readings[k].globalTension && data.readings[k].globalTension.length > 0
    );
    check(`${entry.slug}: has tension curve data`, hasTension);
  } catch (e: any) {
    check(`${entry.slug}: parseable JSON`, false, e.message);
  }
}

// Test 6: Author distribution
const joyceCount = catalog.filter(s => s.author === 'James Joyce').length;
const mansfieldCount = catalog.filter(s => s.author === 'Katherine Mansfield').length;
check('6 Joyce entries (5 regen + 1 hand-coded)', joyceCount === 6);
check('5 Mansfield entries', mansfieldCount === 5);

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
