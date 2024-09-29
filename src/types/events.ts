import { NarrativeEntityID, NarrativeEventType, EventID, Timestamp } from './core';
import { Author, Character, Faction, Item, NarrativeEntity, NarrativeEntityState, Narrator, Reader, Relationship, Setting, Symbol, Theme } from './narrativeEntity';
import { Absential, AbsentialState } from './entities/absential';

export type EntityStateChange<T extends NarrativeEntityState> = {
  [K in keyof T]?: T[K];
};

export type NewEntityCreation<T extends NarrativeEntity> = {
  [K in keyof T]: T[K];
};

export type AnyNewEntityCreation =
  NewEntityCreation<Character> |
  NewEntityCreation<Item> |
  NewEntityCreation<Setting> |
  NewEntityCreation<Faction> |
  NewEntityCreation<Theme> |
  NewEntityCreation<Symbol> |
  NewEntityCreation<Author> |
  NewEntityCreation<Narrator> |
  NewEntityCreation<Reader> |
  NewEntityCreation<Relationship>;

export interface EventCause {
  diageticCause: NarrativeEntityID;
  nondiageticCause: EventID;
}

export interface EventEffect {
  effectOf: EventID;
  entityChanges: Array<{
    entityId: NarrativeEntityID;
    changes: EntityStateChange<NarrativeEntityState>;
  }>;
  absentialChanges: Array<{
    absentialId: NarrativeEntityID;
    changes: Partial<AbsentialState>;
  }>;
  newEntities: AnyNewEntityCreation[];
  newAbsentials: Absential[];
}

export interface Event {
  id: EventID;
  type: NarrativeEventType;
  description: string;
  timestamp: Timestamp;
  duration?: Timestamp;
  cause: EventCause;
  effects: EventEffect;
  significance: number;
}

export interface CausalChain {
  events: EventID[];
  finalEffect: EventEffect;
}

export interface DiageticEvent extends Event {
  type: NarrativeEventType;
}

export interface NondiageticEvent extends Event {
  type: NarrativeEventType;
}
