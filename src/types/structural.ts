import { StorySpanType, Timestamp, NarrativeEntityID, NarrativeStateVersion, EventID, NarrativeEventType } from './core';
import { Event } from './events';
import { Absential, Character, Setting, Item, Faction, InterpersonalRelationship, SymbolicRelationship, GroupRelationship, Reader, Theme, Symbol, Author, Narrator } from './narrativeEntity';

export interface StorySpan {
  id: string;
  type: StorySpanType;
  title: string;
  description: string;
  startTimestamp: Timestamp;
  endTimestamp: Timestamp;
  events: Event[];
  childSpans: StorySpan[];
  narrativeElementStates: Array<{
    elementId: NarrativeEntityID;
    stateVersion: NarrativeStateVersion;
  }>;
  dominantElements: NarrativeEntityID[];
  tension: number;
  pacing: PacingMetric;
}

export interface PacingMetric {
  pace: number; // -1 to 1, where -1 is very slow, 0 is neutral, 1 is very fast
  dominantEventType: NarrativeEventType;
  tensionLevel: number;
  absentialResolutionRate: number;
  knowledgeAcquisitionRate: number;
}

export interface StoryModel {
  title: string;
  author: string;
  description: string;
  rootSpan: StorySpan;
  entities: {
    diagetic: {
      characters: Record<NarrativeEntityID, Character>;
      settings: Record<NarrativeEntityID, Setting>;
      items: Record<NarrativeEntityID, Item>;
      factions: Record<NarrativeEntityID, Faction>;
    },
    nondiagetic: {
      themes: Record<string, Theme>;
      symbols: Record<string, Symbol>;
      authors: Record<string, Author>;
      narrators: Record<string, Narrator>;
      readers: Record<string, Reader>;
    }
  }
  relationships: {
    interpersonal: Record<NarrativeEntityID, InterpersonalRelationship>;
    group: Record<NarrativeEntityID, GroupRelationship>;
    symbolic: Record<NarrativeEntityID, SymbolicRelationship>;
  };
  events: Record<EventID, Event>;
  absentials: Record<string, Absential>;
  globalTension: Array<{ timestamp: Timestamp; value: number }>;
}