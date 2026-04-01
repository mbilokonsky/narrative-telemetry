import { StorySpanType, Timestamp, NarrativeEntityID, NarrativeStateVersion, EventID, NarrativeEventType } from './core';
import { Event } from './events';
import { Absential, Character, Setting, Item, Faction, InterpersonalRelationship, SymbolicRelationship, GroupRelationship, Reader, Theme, NarrativeSymbol, Author, Narrator, MentalConstruct } from './narrativeEntity';

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
    diegetic: {
      characters: Record<NarrativeEntityID, Character>;
      settings: Record<NarrativeEntityID, Setting>;
      items: Record<NarrativeEntityID, Item>;
      factions: Record<NarrativeEntityID, Faction>;
    };
    nonDiegetic: {
      themes: Record<NarrativeEntityID, Theme>;
      symbols: Record<NarrativeEntityID, NarrativeSymbol>;
      authors: Record<NarrativeEntityID, Author>;
      narrators: Record<NarrativeEntityID, Narrator>;
      readers: Record<NarrativeEntityID, Reader>;
    };
  };
  relationships: {
    interpersonal: Record<NarrativeEntityID, InterpersonalRelationship>;
    group: Record<NarrativeEntityID, GroupRelationship>;
    symbolic: Record<NarrativeEntityID, SymbolicRelationship>;
  };
  mentalConstructs: Record<NarrativeEntityID, MentalConstruct>;
  events: Record<EventID, Event>;
  absentials: Record<NarrativeEntityID, Absential>;
  globalTension: Array<{ timestamp: Timestamp; value: number }>;
}