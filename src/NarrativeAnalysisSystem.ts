import {
  StoryModel,
  TextModel,
  StorySpan,
  Reading,
  ReadingEventAnnotation,
  ReadingSignificance,
  ReadingSpanAnnotation,
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

let counter = 0;
function generateId(prefix: string): string {
  return `${prefix}_${++counter}`;
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

  // ── Tension ──

  addTensionPoint(readingName: string, timestamp: Timestamp, value: number): void {
    this.getReading(readingName).globalTension.push({ timestamp, value });
  }

  // ── Output ──

  getModel(): StoryModel {
    return this.model;
  }
}
