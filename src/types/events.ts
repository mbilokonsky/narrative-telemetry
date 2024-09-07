import { NarrativeEntityID, NarrativeEventType, EventID, Timestamp } from './core';
import { NarrativeEntity, NarrativeEntityState } from './narrativeEntity';
import { Absential } from './entities/absential';
import { Character } from './entities/character';
import { Item } from './entities/item';
import { Setting } from './entities/setting';
import { Faction } from './entities/faction';
import { Theme } from './entities/theme';
import { Symbol } from './entities/symbol';
import { Author } from './entities/author';
import { Narrator } from './entities/narrator';
import { Reader } from './entities/reader';
import { Relationship } from './entities/relationship';

export type EntityStateChange<T extends NarrativeEntityState> = {
  [K in keyof T]?: T[K];
};

export type NewEntityCreation<T extends NarrativeEntity> = {
  [K in keyof T]: T[K];
};

export type AnyNewEntityCreation =
  NewEntityCreation<Absential> |
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
  newEntities: AnyNewEntityCreation[];
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