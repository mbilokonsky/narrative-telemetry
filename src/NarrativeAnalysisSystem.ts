import {
  StoryModel,
  StorySpan,
  Event,
  NarrativeEntity,
  NarrativeEntityState,
  Absential,
  AbsentialState,
  AbsentialStatus,
  Character,
  CharacterState,
  Setting,
  SettingState,
  Item,
  ItemState,
  Faction,
  FactionState,
  Theme,
  ThemeState,
  NarrativeSymbol,
  SymbolState,
  Author,
  AuthorState,
  Narrator,
  NarratorState,
  Reader,
  ReaderState,
  Relationship,
  RelationshipState,
  InterpersonalRelationship,
  GroupRelationship,
  SymbolicRelationship,
  MentalConstruct,
  MentalConstructState,
  Timestamp,
  StorySpanType,
  NarrativeEventType,
  NarrativeEntityID,
  EventID,
  DiegeticEntityType,
  NonDiegeticEntityType,
  EntityStateChange,
  EventCause,
  EventEffect,
  PacingMetric,
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
        narrativeElementStates: [],
        dominantElements: [],
        tension: 0,
        pacing: defaultPacing(),
      },
      entities: {
        diegetic: { characters: {}, settings: {}, items: {}, factions: {} },
        nonDiegetic: { themes: {}, symbols: {}, authors: {}, narrators: {}, readers: {} },
      },
      relationships: { interpersonal: {}, group: {}, symbolic: {} },
      mentalConstructs: {},
      events: {},
      absentials: {},
      globalTension: [],
    };
  }

  getRootSpanId(): string {
    return this.model.rootSpan.id;
  }

  // ── Span management ──

  createSpan(parentSpanId: string, type: StorySpanType, title: string, description: string, startPct: number, endPct: number): string {
    const parent = this.findSpan(parentSpanId);
    if (!parent) throw new Error(`Parent span ${parentSpanId} not found`);
    const id = generateId('span');
    const span: StorySpan = {
      id, type, title, description,
      startTimestamp: { percentage: startPct },
      endTimestamp: { percentage: endPct },
      events: [],
      childSpans: [],
      narrativeElementStates: [],
      dominantElements: [],
      tension: 0,
      pacing: defaultPacing(),
    };
    parent.childSpans.push(span);
    return id;
  }

  updateSpanTension(spanId: string, tension: number): void {
    const span = this.findSpan(spanId);
    if (span) span.tension = tension;
  }

  private findSpan(spanId: string, from?: StorySpan): StorySpan | null {
    const root = from ?? this.model.rootSpan;
    if (root.id === spanId) return root;
    for (const child of root.childSpans) {
      const found = this.findSpan(spanId, child);
      if (found) return found;
    }
    return null;
  }

  // ── Entity registration ──

  addCharacter(data: Omit<Character, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('char');
    this.model.entities.diegetic.characters[id] = { ...data, id } as Character;
    return id;
  }

  addSetting(data: Omit<Setting, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('setting');
    this.model.entities.diegetic.settings[id] = { ...data, id } as Setting;
    return id;
  }

  addItem(data: Omit<Item, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('item');
    this.model.entities.diegetic.items[id] = { ...data, id } as Item;
    return id;
  }

  addFaction(data: Omit<Faction, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('faction');
    this.model.entities.diegetic.factions[id] = { ...data, id } as Faction;
    return id;
  }

  addTheme(data: Omit<Theme, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('theme');
    this.model.entities.nonDiegetic.themes[id] = { ...data, id } as Theme;
    return id;
  }

  addSymbol(data: Omit<NarrativeSymbol, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('symbol');
    this.model.entities.nonDiegetic.symbols[id] = { ...data, id } as NarrativeSymbol;
    return id;
  }

  addAuthor(data: Omit<Author, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('author');
    this.model.entities.nonDiegetic.authors[id] = { ...data, id } as Author;
    return id;
  }

  addNarrator(data: Omit<Narrator, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('narrator');
    this.model.entities.nonDiegetic.narrators[id] = { ...data, id } as Narrator;
    return id;
  }

  addReader(data: Omit<Reader, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('reader');
    this.model.entities.nonDiegetic.readers[id] = { ...data, id } as Reader;
    return id;
  }

  addAbsential(data: Omit<Absential, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('absential');
    this.model.absentials[id] = { ...data, id } as Absential;
    return id;
  }

  addRelationship(data: InterpersonalRelationship | GroupRelationship | SymbolicRelationship): string {
    const id = data.id ?? generateId('rel');
    const rel = { ...data, id } as typeof data;
    if (rel.type === 'interpersonal') {
      this.model.relationships.interpersonal[id] = rel as InterpersonalRelationship;
    } else if (rel.type === 'group') {
      this.model.relationships.group[id] = rel as GroupRelationship;
    } else {
      this.model.relationships.symbolic[id] = rel as SymbolicRelationship;
    }
    return id;
  }

  addMentalConstruct(data: Omit<MentalConstruct, 'id'> & { id?: string }): string {
    const id = data.id ?? generateId('mc');
    this.model.mentalConstructs[id] = { ...data, id } as MentalConstruct;
    return id;
  }

  // ── Event dispatch ──

  dispatchEvent(spanId: string, data: Omit<Event, 'id'> & { id?: string }): string {
    const span = this.findSpan(spanId);
    if (!span) throw new Error(`Span ${spanId} not found`);
    const id = data.id ?? generateId('evt');
    const event: Event = { ...data, id } as Event;
    span.events.push(event);
    this.model.events[id] = event;
    this.applyEffects(event);
    return id;
  }

  private applyEffects(event: Event): void {
    for (const change of event.effects.entityChanges) {
      const entity = this.findEntity(change.entityId);
      if (!entity) continue;
      const lastState = entity.stateHistory[entity.stateHistory.length - 1];
      if (!lastState) continue;
      const newData = { ...lastState.data, ...change.changes };
      entity.stateHistory.push({
        timestamp: event.timestamp,
        data: newData,
        causedBy: { eventId: event.id },
      });
      entity.lastSeen = event.id;
    }
  }

  private findEntity(id: NarrativeEntityID): NarrativeEntity | null {
    const d = this.model.entities.diegetic;
    const n = this.model.entities.nonDiegetic;
    return (
      d.characters[id] ??
      d.settings[id] ??
      d.items[id] ??
      d.factions[id] ??
      n.themes[id] ??
      n.symbols[id] ??
      n.authors[id] ??
      n.narrators[id] ??
      n.readers[id] ??
      this.model.absentials[id] ??
      this.model.mentalConstructs[id] ??
      null
    );
  }

  // ── Absential state transitions ──

  updateAbsentialStatus(absentialId: string, status: AbsentialStatus, eventId: EventID, timestamp: Timestamp): void {
    const abs = this.model.absentials[absentialId];
    if (!abs) throw new Error(`Absential ${absentialId} not found`);
    const lastState = abs.stateHistory[abs.stateHistory.length - 1];
    abs.stateHistory.push({
      timestamp,
      data: { ...lastState.data, status },
      causedBy: { eventId },
    });
  }

  // ── Tension tracking ──

  recordGlobalTension(timestamp: Timestamp, value: number): void {
    this.model.globalTension.push({ timestamp, value });
  }

  // ── Output ──

  getModel(): StoryModel {
    return this.model;
  }
}

function defaultPacing(): PacingMetric {
  return {
    pace: 0,
    dominantEventType: NarrativeEventType.ACTION,
    tensionLevel: 0,
    absentialResolutionRate: 0,
    knowledgeAcquisitionRate: 0,
  };
}
