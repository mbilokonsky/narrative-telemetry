export interface Timestamp {
  percentage: number;
}

export interface StorySpan {
  id: string;
  type: 'story' | 'act' | 'scene';
  title: string;
  description: string;
  startTimestamp: Timestamp;
  endTimestamp: Timestamp;
  events: string[];
  childSpans: StorySpan[];
}

export interface StoryEvent {
  id: string;
  type: string;
  description: string;
  timestamp: Timestamp;
  textLocation: { startLine: number; endLine: number };
  participants: string[];
  precedingEvent?: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  tags: string[];
  type: string;
  textMentions?: string[];
  context?: string;
}

export interface Setting {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  type?: string;
  textMentions?: string[];
  context?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  type?: string;
  textMentions?: string[];
  context?: string;
}

export interface Absential {
  id: string;
  name: string;
  description: string;
  stateHistory: unknown[];
}

export interface Significance {
  significance: number;
  note?: string;
}

export interface TensionPoint {
  timestamp: Timestamp;
  value: number;
}

export interface Reading {
  name: string;
  description: string;
  themes: unknown;
  symbols: Record<string, unknown>;
  narrator: unknown;
  reader: unknown;
  author: unknown;
  eventSignificance: Record<string, Significance>;
  entitySignificance: Record<string, Significance>;
  absentialSignificance: Record<string, Significance>;
  globalTension: TensionPoint[];
  spanAnnotations: Record<string, unknown>;
}

export interface StoryModel {
  text: {
    title: string;
    author: string;
    description: string;
    rootSpan: StorySpan;
    diegetic: {
      characters: Record<string, Character>;
      settings: Record<string, Setting>;
      items: Record<string, Item>;
      factions: Record<string, unknown>;
    };
    events: Record<string, StoryEvent>;
    relationships: { interpersonal: Record<string, unknown>; group: Record<string, unknown> };
    absentials: Record<string, Absential>;
    mentalConstructs: Record<string, unknown>;
  };
  readings: Record<string, Reading>;
}

export interface Relationship {
  id: string;
  type: string;
  participants: string[];
  nature?: string;
  name: string;
  description: string;
  tags?: string[];
}

export type Selection =
  | { type: 'event'; id: string }
  | { type: 'span'; id: string }
  | { type: 'entity'; entityId: string }
  | null;
