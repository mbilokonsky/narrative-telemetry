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
  { slug: 'the-sisters', title: 'The Sisters', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/the-sisters-formalist.json' },
  { slug: 'an-encounter', title: 'An Encounter', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/an-encounter-formalist.json' },
  { slug: 'araby-auto', title: 'Araby (auto)', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/araby-formalist.json' },
  { slug: 'eveline', title: 'Eveline', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/eveline-formalist.json' },
  { slug: 'after-the-race', title: 'After the Race', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/after-the-race-formalist.json' },
  { slug: 'two-gallants', title: 'Two Gallants', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/two-gallants-formalist.json' },
  { slug: 'the-boarding-house', title: 'The Boarding House', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/the-boarding-house-formalist.json' },
  { slug: 'a-little-cloud', title: 'A Little Cloud', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/a-little-cloud-formalist.json' },
  { slug: 'counterparts', title: 'Counterparts', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/counterparts-formalist.json' },
  { slug: 'clay', title: 'Clay', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/clay-formalist.json' },
  { slug: 'a-painful-case', title: 'A Painful Case', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/a-painful-case-formalist.json' },
  { slug: 'ivy-day-in-the-committee-room', title: 'Ivy Day in the Committee Room', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/ivy-day-in-the-committee-room-formalist.json' },
  { slug: 'a-mother', title: 'A Mother', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/a-mother-formalist.json' },
  { slug: 'grace', title: 'Grace', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/grace-formalist.json' },
  { slug: 'the-dead', title: 'The Dead', author: 'James Joyce', collection: 'dubliners', dataPath: '/data/dubliners/the-dead-formalist.json' },
  { slug: 'at-the-bay', title: 'At the Bay', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/at-the-bay-formalist.json' },
  { slug: 'the-garden-party', title: 'The Garden Party', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/the-garden-party-formalist.json' },
  { slug: 'miss-brill', title: 'Miss Brill', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/miss-brill-formalist.json' },
  { slug: 'the-daughters-of-the-late-colonel', title: 'The Daughters of the Late Colonel', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/the-daughters-of-the-late-colonel-formalist.json' },
  { slug: 'her-first-ball', title: 'Her First Ball', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/her-first-ball-formalist.json' },
  { slug: 'the-voyage', title: 'The Voyage', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/the-voyage-formalist.json' },
  { slug: 'the-stranger', title: 'The Stranger', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/the-stranger-formalist.json' },
  { slug: 'marriage-a-la-mode', title: 'Marriage a la Mode', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/marriage-a-la-mode-formalist.json' },
  { slug: 'mr-and-mrs-dove', title: 'Mr. and Mrs. Dove', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/mr-and-mrs-dove-formalist.json' },
  { slug: 'the-young-girl', title: 'The Young Girl', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/the-young-girl-formalist.json' },
  { slug: 'life-of-ma-parker', title: 'Life of Ma Parker', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/life-of-ma-parker-formalist.json' },
  { slug: 'the-singing-lesson', title: 'The Singing Lesson', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/the-singing-lesson-formalist.json' },
  { slug: 'the-ladys-maid', title: "The Lady's Maid", author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/the-ladys-maid-formalist.json' },
  { slug: 'bank-holiday', title: 'Bank Holiday', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/bank-holiday-formalist.json' },
  { slug: 'an-ideal-family', title: 'An Ideal Family', author: 'Katherine Mansfield', collection: 'mansfield', dataPath: '/data/mansfield/an-ideal-family-formalist.json' },
];

console.log('\n--- Story Catalog: Data Integrity ---\n');

// Test 1: All slugs are unique
const slugs = catalog.map(s => s.slug);
const uniqueSlugs = new Set(slugs);
check('All slugs are unique', slugs.length === uniqueSlugs.size, `${slugs.length} entries, ${uniqueSlugs.size} unique`);

// Test 2: Catalog has expected count
check('Catalog has 31 entries (30 stories + 1 hand-coded Araby)', catalog.length === 31);

// Test 3: All data files exist
console.log('\n--- Story Catalog: File Existence ---\n');
for (const entry of catalog) {
  const filePath = path.join(UI_PUBLIC, entry.dataPath);
  check(`${entry.slug}: data file exists`, fs.existsSync(filePath), filePath);
}

// Test 4: Text files exist for all stories
console.log('\n--- Story Catalog: Text File Existence ---\n');
const textPaths: Record<string, string> = {
  'araby': '/data/araby.txt',
  'the-sisters': '/data/dubliners/the-sisters.txt',
  'an-encounter': '/data/dubliners/an-encounter.txt',
  'araby-auto': '/data/dubliners/araby.txt',
  'eveline': '/data/dubliners/eveline.txt',
  'after-the-race': '/data/dubliners/after-the-race.txt',
  'two-gallants': '/data/dubliners/two-gallants.txt',
  'the-boarding-house': '/data/dubliners/the-boarding-house.txt',
  'a-little-cloud': '/data/dubliners/a-little-cloud.txt',
  'counterparts': '/data/dubliners/counterparts.txt',
  'clay': '/data/dubliners/clay.txt',
  'a-painful-case': '/data/dubliners/a-painful-case.txt',
  'ivy-day-in-the-committee-room': '/data/dubliners/ivy-day-in-the-committee-room.txt',
  'a-mother': '/data/dubliners/a-mother.txt',
  'grace': '/data/dubliners/grace.txt',
  'the-dead': '/data/dubliners/the-dead.txt',
  'at-the-bay': '/data/mansfield/at-the-bay.txt',
  'the-garden-party': '/data/mansfield/the-garden-party.txt',
  'miss-brill': '/data/mansfield/miss-brill.txt',
  'the-daughters-of-the-late-colonel': '/data/mansfield/the-daughters-of-the-late-colonel.txt',
  'her-first-ball': '/data/mansfield/her-first-ball.txt',
  'the-voyage': '/data/mansfield/the-voyage.txt',
  'the-stranger': '/data/mansfield/the-stranger.txt',
  'marriage-a-la-mode': '/data/mansfield/marriage-a-la-mode.txt',
  'mr-and-mrs-dove': '/data/mansfield/mr-and-mrs-dove.txt',
  'the-young-girl': '/data/mansfield/the-young-girl.txt',
  'life-of-ma-parker': '/data/mansfield/life-of-ma-parker.txt',
  'the-singing-lesson': '/data/mansfield/the-singing-lesson.txt',
  'the-ladys-maid': '/data/mansfield/the-ladys-maid.txt',
  'bank-holiday': '/data/mansfield/bank-holiday.txt',
  'an-ideal-family': '/data/mansfield/an-ideal-family.txt',
};
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
check('16 Joyce entries (15 auto + 1 hand-coded)', joyceCount === 16);
check('15 Mansfield entries', mansfieldCount === 15);

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
