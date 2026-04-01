/**
 * Tests for absential timeline data extraction.
 * Validates that we can build absential lifecycle data from StoryModel.
 */
import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; }
}

// ── Types matching the UI ──

interface AbsentialState {
  timestamp: { percentage: number };
  data: {
    type?: string;
    status?: string;
    urgency?: number;
    intensity?: number;
    [key: string]: any;
  };
  causedBy?: Record<string, any>;
}

interface Absential {
  id: string;
  name: string;
  description: string;
  stateHistory: AbsentialState[];
}

interface TimelinePoint {
  percentage: number;
  type: 'state-change' | 'event';
  label: string;
  intensity: number;
  status?: string;
  eventId?: string;
  significance?: number;
}

/**
 * Build a timeline for a given absential.
 * Combines state history transitions with related events.
 */
function buildAbsentialTimeline(
  absential: Absential,
  events: Record<string, any>,
  eventSignificance: Record<string, { significance: number; note?: string }>,
): TimelinePoint[] {
  const points: TimelinePoint[] = [];

  // Add state history transitions
  for (const state of absential.stateHistory) {
    points.push({
      percentage: state.timestamp.percentage,
      type: 'state-change',
      label: `${state.data.status ?? 'unknown'} (intensity: ${state.data.intensity ?? 0})`,
      intensity: state.data.intensity ?? 0,
      status: state.data.status,
    });
  }

  // Add events that are significant in this reading, placed at their timeline position
  // Events near the absential's lifecycle (between first and last state) are most relevant
  for (const [eventId, evt] of Object.entries(events) as [string, any][]) {
    const sig = eventSignificance[eventId];
    if (sig && sig.significance > 0) {
      points.push({
        percentage: evt.timestamp.percentage,
        type: 'event',
        label: evt.description,
        intensity: sig.significance,
        eventId,
        significance: sig.significance,
      });
    }
  }

  return points.sort((a, b) => a.percentage - b.percentage);
}

// ── Test with real data ──

console.log('\n--- Absential Timeline: Data Structure ---\n');

const arabyPath = path.resolve(__dirname, '../../ui/public/data/araby.json');
if (fs.existsSync(arabyPath)) {
  const araby = JSON.parse(fs.readFileSync(arabyPath, 'utf-8'));
  const absentials = araby.text.absentials;
  const events = araby.text.events;
  const readingKey = Object.keys(araby.readings)[0];
  const reading = araby.readings[readingKey];

  check('Araby has absentials', Object.keys(absentials).length > 0, `${Object.keys(absentials).length} found`);
  check('Araby has events', Object.keys(events).length > 0);
  check('Reading has eventSignificance', Object.keys(reading.eventSignificance).length > 0);
  check('Reading has absentialSignificance', Object.keys(reading.absentialSignificance).length > 0);

  // Test timeline building for each absential
  console.log('\n--- Absential Timeline: Build ---\n');

  for (const [absId, abs] of Object.entries(absentials) as [string, Absential][]) {
    const timeline = buildAbsentialTimeline(abs, events, reading.eventSignificance);
    check(`${absId}: timeline has points`, timeline.length > 0, `${timeline.length} points`);
    check(`${absId}: timeline is sorted`, timeline.every((p, i) => i === 0 || p.percentage >= timeline[i-1].percentage));

    const stateChanges = timeline.filter(p => p.type === 'state-change');
    check(`${absId}: has state changes`, stateChanges.length > 0);

    const eventPoints = timeline.filter(p => p.type === 'event');
    check(`${absId}: has event points`, eventPoints.length > 0);

    // All intensities should be 0-1
    check(`${absId}: intensities in range`, timeline.every(p => p.intensity >= 0 && p.intensity <= 1));
  }

  // Test specific absential
  console.log('\n--- Absential Timeline: Specific (abs-longing) ---\n');

  const longing = absentials['abs-longing'];
  if (longing) {
    const timeline = buildAbsentialTimeline(longing, events, reading.eventSignificance);
    check('abs-longing: has name', longing.name === "The boy's romantic longing");
    check('abs-longing: has state history', longing.stateHistory.length > 0);

    const absentialSig = reading.absentialSignificance['abs-longing'];
    check('abs-longing: has reading significance', absentialSig !== undefined);
    check('abs-longing: significance = 1.0', absentialSig?.significance === 1);
    check('abs-longing: has significance note', !!absentialSig?.note);

    // Timeline should span most of the story
    const minPct = Math.min(...timeline.map(p => p.percentage));
    const maxPct = Math.max(...timeline.map(p => p.percentage));
    check('abs-longing: timeline spans story', maxPct - minPct > 50, `${minPct}%-${maxPct}%`);
  }
} else {
  console.log('  (araby.json not found, skipping real data tests)');
}

// ── Test with multiple stories ──
console.log('\n--- Absential Timeline: Multi-Story ---\n');

const storyPaths = [
  'ui/public/data/dubliners/eveline-formalist.json',
  'ui/public/data/dubliners/the-dead-formalist.json',
  'ui/public/data/mansfield/miss-brill-formalist.json',
];

for (const sp of storyPaths) {
  const fullPath = path.resolve(__dirname, '../..', sp);
  if (!fs.existsSync(fullPath)) continue;

  const story = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  const title = story.text.title;
  const absCount = Object.keys(story.text.absentials).length;
  check(`${title}: has absentials`, absCount > 0, `${absCount} found`);

  const rk = Object.keys(story.readings)[0];
  const absSignCount = Object.keys(story.readings[rk].absentialSignificance || {}).length;
  check(`${title}: has absential significance`, absSignCount > 0, `${absSignCount} scored`);
}

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
