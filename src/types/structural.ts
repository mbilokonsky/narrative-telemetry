import { StorySpanType, Timestamp, NarrativeEntityID, EventID, SpanID, NarrativeEventType } from './core';
import {
  Character, Setting, Item, Faction,
  InterpersonalRelationship, GroupRelationship, SymbolicRelationship,
  Theme, NarrativeSymbol, Author, Narrator, Reader,
  MentalConstruct, Absential,
} from './narrativeEntity';
import { Event } from './events';

// ── Text annotations (overlapping, stackable) ──

export interface TextAnnotation {
  entityId: NarrativeEntityID;
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
  mentionText: string;
  note?: string;
}

// ── Structural (shared, neutral) ──

export interface StorySpan {
  id: SpanID;
  type: StorySpanType;
  title: string;
  description: string;
  startTimestamp: Timestamp;
  endTimestamp: Timestamp;
  events: EventID[];
  childSpans: StorySpan[];
}

export interface TextModel {
  title: string;
  author: string;
  description: string;
  rootSpan: StorySpan;
  diegetic: {
    characters: Record<NarrativeEntityID, Character>;
    settings: Record<NarrativeEntityID, Setting>;
    items: Record<NarrativeEntityID, Item>;
    factions: Record<NarrativeEntityID, Faction>;
  };
  events: Record<EventID, Event>;
  relationships: {
    interpersonal: Record<NarrativeEntityID, InterpersonalRelationship>;
    group: Record<NarrativeEntityID, GroupRelationship>;
  };
  absentials: Record<NarrativeEntityID, Absential>;
  mentalConstructs: Record<NarrativeEntityID, MentalConstruct>;
  annotations: TextAnnotation[];
}

// ── Reading (interpretive overlay) ──

export interface PacingMetric {
  pace: number;
  dominantEventType: NarrativeEventType;
  tensionLevel: number;
  absentialResolutionRate: number;
  knowledgeAcquisitionRate: number;
}

export interface ReadingEventEffect {
  entityId: NarrativeEntityID;
  stateChanges: Record<string, unknown>;
  description: string;
}

export interface TensionDimensions {
  absential: number;    // 0-1: unresolved desires, fears, goals
  relational: number;   // 0-1: interpersonal conflict/stress
  epistemic: number;    // 0-1: information asymmetry, uncertainty
  atmospheric: number;  // 0-1: environmental/mood pressure
  pacing: number;       // 0-1: event density / temporal compression
}

export interface ReadingEventAnnotation {
  significance: number;
  dimensions?: TensionDimensions;
  note?: string;
  causes?: EventID[];
  effects?: ReadingEventEffect[];
}

export interface ReadingSignificance {
  significance: number;
  note?: string;
}

export interface ReadingSpanAnnotation {
  tension?: number;
  pacing?: PacingMetric;
  dominantElements?: NarrativeEntityID[];
  note?: string;
}

export interface Reading {
  name: string;
  description: string;

  themes: Record<NarrativeEntityID, Theme>;
  symbols: Record<NarrativeEntityID, NarrativeSymbol>;
  symbolicRelationships: Record<NarrativeEntityID, SymbolicRelationship>;
  narrator: Narrator;
  reader: Reader;
  author: Author;

  eventSignificance: Record<EventID, ReadingEventAnnotation>;
  entitySignificance: Record<NarrativeEntityID, ReadingSignificance>;
  absentialSignificance: Record<NarrativeEntityID, ReadingSignificance>;

  mentalConstructs: Record<NarrativeEntityID, MentalConstruct>;

  annotations: TextAnnotation[];

  globalTension: Array<{ timestamp: Timestamp; value: number; dimensions?: TensionDimensions }>;
  spanAnnotations: Record<SpanID, ReadingSpanAnnotation>;
}

// ── Top-level model ──

export interface StoryModel {
  text: TextModel;
  readings: Record<string, Reading>;
}
