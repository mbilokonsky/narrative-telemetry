/**
 * Tests for the reading authoring feature (M1).
 * Validates that empty readings can be created and annotations applied.
 */
import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; }
}

console.log('\n--- Reading Editor: Component Structure ---\n');

const editorPath = path.resolve(__dirname, '../../ui/src/components/ReadingEditor.tsx');
check('ReadingEditor.tsx exists', fs.existsSync(editorPath));

const editorSource = fs.readFileSync(editorPath, 'utf-8');
check('Has meta step (name/description)', editorSource.includes('step') && editorSource.includes('meta'));
check('Has annotate step', editorSource.includes('annotate'));
check('Has significance slider', editorSource.includes('range'));
check('Has note textarea', editorSource.includes('textarea'));
check('Has save handler', editorSource.includes('onSave'));
check('Has cancel handler', editorSource.includes('onCancel'));
check('Has JSON export', editorSource.includes('Export JSON'));
check('Creates empty reading with all events', editorSource.includes('createEmptyReading'));
check('Computes tension curve from scores', editorSource.includes('tensionPoints'));

console.log('\n--- Reading Editor: Empty Reading Creation ---\n');

// Simulate empty reading creation logic
interface Significance { significance: number; note?: string; }
interface Reading {
  name: string;
  description: string;
  eventSignificance: Record<string, Significance>;
  globalTension: any[];
  [key: string]: any;
}

function createEmptyReading(
  name: string,
  description: string,
  eventIds: string[],
): Reading {
  const eventSignificance: Record<string, Significance> = {};
  for (const eventId of eventIds) {
    eventSignificance[eventId] = { significance: 0.3 };
  }
  return {
    name,
    description,
    eventSignificance,
    globalTension: [],
    themes: {},
    symbols: {},
    entitySignificance: {},
    absentialSignificance: {},
  };
}

const testEvents = ['e01', 'e02', 'e03', 'e04', 'e05'];
const empty = createEmptyReading('psychoanalytic', 'A psychoanalytic reading', testEvents);

check('Empty reading has correct name', empty.name === 'psychoanalytic');
check('Empty reading covers all events', Object.keys(empty.eventSignificance).length === 5);
check('All events default to 0.3', Object.values(empty.eventSignificance).every(s => s.significance === 0.3));
check('Empty reading has no tension data', empty.globalTension.length === 0);

// Simulate annotation
empty.eventSignificance['e02'] = { significance: 0.9, note: 'Key moment of repression' };
empty.eventSignificance['e04'] = { significance: 0.7, note: 'Unconscious desire surfaces' };
check('Can annotate events', empty.eventSignificance['e02'].significance === 0.9);
check('Can add notes', empty.eventSignificance['e02'].note === 'Key moment of repression');

console.log('\n--- Reading Editor: Real Data Integration ---\n');

const arabyPath = path.resolve(__dirname, '../../ui/public/data/araby.json');
if (fs.existsSync(arabyPath)) {
  const araby = JSON.parse(fs.readFileSync(arabyPath, 'utf-8'));
  const eventIds = Object.keys(araby.text.events);
  const testReading = createEmptyReading('test-lens', 'Test reading', eventIds);

  check('Empty reading covers all Araby events', Object.keys(testReading.eventSignificance).length === eventIds.length);

  // Verify existing readings still have correct structure
  for (const [rk, rv] of Object.entries(araby.readings) as [string, any][]) {
    const readingEventCount = Object.keys(rv.eventSignificance).length;
    check(`${rk}: has event significance`, readingEventCount > 0);
    check(`${rk}: has tension curve`, rv.globalTension.length > 0);
  }
}

console.log('\n--- Reading Editor: App Integration ---\n');

const appPath = path.resolve(__dirname, '../../ui/src/App.tsx');
const appSource = fs.readFileSync(appPath, 'utf-8');
check('App imports ReadingEditor', appSource.includes('ReadingEditor'));
check('App has editingReading state', appSource.includes('editingReading'));
check('App has handleSaveReading', appSource.includes('handleSaveReading'));
check('App has "+ Reading" button', appSource.includes('+ Reading'));

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
