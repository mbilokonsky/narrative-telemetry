import {
  StoryModel,
  TextModel,
  StorySpan,
  Reading,
  ReadingEventAnnotation,
  ReadingSignificance,
  ReadingSpanAnnotation,
  TextAnnotation,
  PacingMetric,
  Event,
  TextLocation,
  NarrativeEntity,
  NarrativeEntityState,
  Absential,
  AbsentialStatus,
  Character,
  Setting,
  Item,
  Faction,
  Theme,
  NarrativeSymbol,
  SymbolicRelationship,
  Author,
  Narrator,
  Reader,
  InterpersonalRelationship,
  GroupRelationship,
  MentalConstruct,
  Timestamp,
  StorySpanType,
  NarrativeEventType,
  NarrativeEntityID,
  EventID,
  SpanID,
} from './types';
import {
  computeTensionCurve, TensionPoint,
  coarseGrain, SpanSignificance,
  computeDivergence, DivergenceMap,
} from './derive';

let counter = 0;

// ── Comparison helpers ──

interface TensionDiff {
  timestamp: Timestamp;
  diff: number; // absolute difference in tension
  reading1_value: number;
  reading2_value: number;
}

interface CoarseGrainDiff {
  spanId: string;
  spanTitle: string;
  mean_significance_diff: number;
  reading1_mean: number;
  reading2_mean: number;
}
function generateId(prefix: string): string {
  return `${prefix}_${++counter}`;
}


// ── Helper functions for comparison ──

function compareTensionCurves(curve1: TensionPoint[], curve2: TensionPoint[]): TensionDiff[] {
  const diffs: TensionDiff[] = [];
  const minLen = Math.min(curve1.length, curve2.length);
  for (let i = 0; i < minLen; i++) {
    diffs.push({
      timestamp: curve1[i].timestamp,
      diff: Math.abs(curve1[i].tension - curve2[i].tension),
      reading1_value: curve1[i].tension,
      reading2_value: curve2[i].tension,
    });
  }
  return diffs;
}

function compareCoarseGrains(cg1: SpanSignificance, cg2: SpanSignificance): CoarseGrainDiff {
  return {
    spanId: 'root',
    spanTitle: 'Story',
    mean_significance_diff: Math.abs(cg1.meanSignificance - cg2.meanSignificance),
    reading1_mean: cg1.meanSignificance,
    reading2_mean: cg2.meanSignificance,
  };
}

function generateComparisonSummary(name1: string, name2: string, divergence: DivergenceMap, tensionDiff: TensionDiff[], coarseGrainDiff: CoarseGrainDiff): string {
  const lines: string[] = [];
  lines.push(`Comparison: "${name1}" vs "${name2}"`);
  lines.push('');
  lines.push(`Divergence:`);
  lines.push(`  Events with significant diff: ${divergence.divergentEventCount}`);
  lines.push(`  Mean divergence: ${divergence.meanEventDivergence.toFixed(3)}`);
  lines.push(`  Max divergence: ${divergence.maxEventDivergence.toFixed(3)}`);
  lines.push('');
  const avgTensionDiff = tensionDiff.length > 0 ? tensionDiff.reduce((sum, td) => sum + td.diff, 0) / tensionDiff.length : 0;
  lines.push(`Tension:`);
  lines.push(`  Average tension difference: ${avgTensionDiff.toFixed(3)}`);
  lines.push('');
  lines.push(`Structure (coarse-graining):`);
  lines.push(`  Mean significance diff: ${coarseGrainDiff.mean_significance_diff.toFixed(3)}`);
  lines.push(`  "${name1}" mean: ${coarseGrainDiff.reading1_mean.toFixed(3)}`);
  lines.push(`  "${name2}" mean: ${coarseGrainDiff.reading2_mean.toFixed(3)}`);
  return lines.join('\n');
}
export class NarrativeAnalysisSystem {
  private model: StoryModel;

  constructor(title: string, author: string, description: string) {
    const rootSpanId = generateId('span');
    this.model = {
      text: {
        title,
        author,
        description,
        rootSpan: {
          id: rootSpanId,
          type: StorySpanType.STORY,
          title,
          description,
          startTimestamp: { percentage: 0 },
          endTimestamp: { percentage: 100 },
          events: [],
          childSpans: [],
        },
        diegetic: { characters: {}, settings: {}, items: {}, factions: {} },
        events: {},
        relationships: { interpersonal: {}, group: {} },
        absentials: {},
        mentalConstructs: {},
        annotations: [],
      },
      readings: {},
    };
  }

  // ═══════════════════════════════════════════════
  //  PASS 1: Text-building (neutral, exhaustive)
  // ═══════════════════════════════════════════════

  getRootSpanId(): string {
    return this.model.text.rootSpan.id;
  }

  // ── Spans ──

  createSpan(parentSpanId: string, type: StorySpanType, title: string, description: string, startPct: number, endPct: number): string {
    const parent = this.findSpan(parentSpanId);
    if (!parent) throw new Error(`Parent span ${parentSpanId} not found`);
    const id = generateId('span');
    parent.childSpans.push({
      id, type, title, description,
      startTimestamp: { percentage: startPct },
      endTimestamp: { percentage: endPct },
      events: [],
      childSpans: [],
    });
    return id;
  }

  private findSpan(spanId: string, from?: StorySpan): StorySpan | null {
    const root = from ?? this.model.text.rootSpan;
    if (root.id === spanId) return root;
    for (const child of root.childSpans) {
      const found = this.findSpan(spanId, child);
      if (found) return found;
    }
    return null;
  }

  // ── Diegetic entities ──

  addCharacter(data: Omit<Character, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('char');
    this.model.text.diegetic.characters[id] = { ...data, id } as Character;
    return id;
  }

  addSetting(data: Omit<Setting, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('setting');
    this.model.text.diegetic.settings[id] = { ...data, id } as Setting;
    return id;
  }

  addItem(data: Omit<Item, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('item');
    this.model.text.diegetic.items[id] = { ...data, id } as Item;
    return id;
  }

  addFaction(data: Omit<Faction, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('faction');
    this.model.text.diegetic.factions[id] = { ...data, id } as Faction;
    return id;
  }

  // ── Diegetic relationships ──

  addInterpersonalRelationship(data: Omit<InterpersonalRelationship, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('rel');
    this.model.text.relationships.interpersonal[id] = { ...data, id } as InterpersonalRelationship;
    return id;
  }

  addGroupRelationship(data: Omit<GroupRelationship, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('rel');
    this.model.text.relationships.group[id] = { ...data, id } as GroupRelationship;
    return id;
  }

  // ── Absentials ──

  addAbsential(data: Omit<Absential, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('abs');
    this.model.text.absentials[id] = { ...data, id } as Absential;
    return id;
  }

  updateAbsentialStatus(absentialId: string, status: AbsentialStatus, eventId: EventID, timestamp: Timestamp): void {
    const abs = this.model.text.absentials[absentialId];
    if (!abs) throw new Error(`Absential ${absentialId} not found`);
    const lastState = abs.stateHistory[abs.stateHistory.length - 1];
    abs.stateHistory.push({
      timestamp,
      data: { ...lastState.data, status },
      causedBy: { eventId },
    });
  }

  // ── Diegetic mental constructs ──

  addMentalConstruct(data: Omit<MentalConstruct, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('mc');
    this.model.text.mentalConstructs[id] = { ...data, id } as MentalConstruct;
    return id;
  }

  // ── Text annotations (diegetic) ──

  annotate(entityId: NarrativeEntityID, startLine: number, startChar: number, endLine: number, endChar: number, mentionText: string, note?: string): void {
    this.model.text.annotations.push({ entityId, startLine, startChar, endLine, endChar, mentionText, note });
  }

  // ── Events ──

  addEvent(spanId: string, data: Omit<Event, 'id'> & { id?: string }): string {
    const span = this.findSpan(spanId);
    if (!span) throw new Error(`Span ${spanId} not found`);
    const id = data.id ?? generateId('evt');
    const event: Event = { ...data, id } as Event;
    span.events.push(id);
    this.model.text.events[id] = event;
    return id;
  }

  // ═══════════════════════════════════════════════
  //  PASS 2+: Reading construction (interpretive)
  // ═══════════════════════════════════════════════

  createReading(name: string, description: string, narrator: Narrator, reader: Reader, author: Author): void {
    this.model.readings[name] = {
      name,
      description,
      themes: {},
      symbols: {},
      symbolicRelationships: {},
      narrator,
      reader,
      author,
      eventSignificance: {},
      entitySignificance: {},
      absentialSignificance: {},
      mentalConstructs: {},
      annotations: [],
      globalTension: [],
      spanAnnotations: {},
    };
  }

  private getReading(name: string): Reading {
    const r = this.model.readings[name];
    if (!r) throw new Error(`Reading "${name}" not found`);
    return r;
  }

  // ── Interpretive entities ──

  addTheme(readingName: string, data: Omit<Theme, 'id'> & { id?: string }): string {
    const r = this.getReading(readingName);
    const id = data.id ?? generateId('theme');
    r.themes[id] = { ...data, id } as Theme;
    return id;
  }

  addSymbol(readingName: string, data: Omit<NarrativeSymbol, 'id'> & { id?: string }): string {
    const r = this.getReading(readingName);
    const id = data.id ?? generateId('sym');
    r.symbols[id] = { ...data, id } as NarrativeSymbol;
    return id;
  }

  addSymbolicRelationship(readingName: string, data: Omit<SymbolicRelationship, 'id'> & { id?: string }): string {
    const r = this.getReading(readingName);
    const id = data.id ?? generateId('symrel');
    r.symbolicRelationships[id] = { ...data, id } as SymbolicRelationship;
    return id;
  }

  addReadingMentalConstruct(readingName: string, data: Omit<MentalConstruct, 'id'> & { id?: string }): string {
    const r = this.getReading(readingName);
    const id = data.id ?? generateId('rmc');
    r.mentalConstructs[id] = { ...data, id } as MentalConstruct;
    return id;
  }

  // ── Significance annotations ──

  annotateEvent(readingName: string, eventId: EventID, annotation: ReadingEventAnnotation): void {
    this.getReading(readingName).eventSignificance[eventId] = annotation;
  }

  annotateEntity(readingName: string, entityId: NarrativeEntityID, significance: number, note?: string): void {
    this.getReading(readingName).entitySignificance[entityId] = { significance, note };
  }

  annotateAbsential(readingName: string, absentialId: NarrativeEntityID, significance: number, note?: string): void {
    this.getReading(readingName).absentialSignificance[absentialId] = { significance, note };
  }

  annotateSpan(readingName: string, spanId: SpanID, annotation: ReadingSpanAnnotation): void {
    this.getReading(readingName).spanAnnotations[spanId] = annotation;
  }

  // ── Reading-level text annotations (interpretive) ──

  annotateText(readingName: string, entityId: NarrativeEntityID, startLine: number, startChar: number, endLine: number, endChar: number, mentionText: string, note?: string): void {
    this.getReading(readingName).annotations.push({ entityId, startLine, startChar, endLine, endChar, mentionText, note });
  }

  // ── Tension ──

  addTensionPoint(readingName: string, timestamp: Timestamp, value: number): void {
    this.getReading(readingName).globalTension.push({ timestamp, value });
  }

  // ── Output ──

  getModel(): StoryModel {
    return this.model;
  }

  // ═══════════════════════════════════════════════
  //  READING COMPARISON API
  // ═══════════════════════════════════════════════

  /**
   * Add a reading to the story model.
   */
  addReading(reading: Reading): void {
    this.model.readings[reading.name] = reading;
  }

  /**
   * Get a reading by name (public API).
   */
  getReadingByName(name: string): Reading | undefined {
    return this.model.readings[name];
  }

  /**
   * List all reading names in the model.
   */
  listReadings(): string[] {
    return Object.keys(this.model.readings);
  }

  /**
   * Get tension curve for a specific reading.
   */
  getTensionCurve(readingName: string): TensionPoint[] {
    const reading = this.getReadingByName(readingName);
    if (!reading) {
      throw new Error(`Reading "${readingName}" not found`);
    }
    return computeTensionCurve(this.model.text, reading);
  }

  /**
   * Compare two readings: divergence, tension differences, structural differences.
   */
  compareReadings(
    readingName1: string,
    readingName2: string,
  ): {
    divergence: DivergenceMap | null;
    tension_diff: TensionDiff[];
    coarse_grain_diff: CoarseGrainDiff;
    summary: string;
  } {
    const r1 = this.getReadingByName(readingName1);
    const r2 = this.getReadingByName(readingName2);

    if (!r1) throw new Error(`Reading "${readingName1}" not found`);
    if (!r2) throw new Error(`Reading "${readingName2}" not found`);

    // Divergence
    const divergence = computeDivergence(r1, r2);

    // Tension comparison
    const curve1 = computeTensionCurve(this.model.text, r1);
    const curve2 = computeTensionCurve(this.model.text, r2);
    const tension_diff = compareTensionCurves(curve1, curve2);

    // Coarse-grain comparison
    const cg1 = coarseGrain(this.model.text.rootSpan, r1);
    const cg2 = coarseGrain(this.model.text.rootSpan, r2);
    const coarse_grain_diff = compareCoarseGrains(cg1, cg2);

    // Summary
    const summary = generateComparisonSummary(
      readingName1,
      readingName2,
      divergence,
      tension_diff,
      coarse_grain_diff,
    );

    return { divergence, tension_diff, coarse_grain_diff, summary };
  }
}
