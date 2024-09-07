import { NarrativeEntityID, NarrativeStateVersion, EventID, State } from './core';

export interface NarrativeEntityState {
  version: NarrativeStateVersion;
  activeAbsentials: string[];
  currentRelationships: NarrativeEntityID[];
  symbolsPresent: NarrativeEntityID[];
  significance: number;
  generatedBy: EventID;
}

export interface NarrativeEntity<T extends NarrativeEntityState = NarrativeEntityState> {
  id: NarrativeEntityID;
  name: string;
  description: string;
  tags: string[];
  stateHistory: State<T>[];
  firstIntroduced: EventID;
  lastSeen?: EventID;
}

export enum DiageticEntityType {
  CHARACTER = 'character',
  SETTING = 'setting',
  ITEM = 'item',
  FACTION = 'faction'
}

export enum NondiageticEntityType {
  READER = 'reader',
  THEME = 'theme',
  SYMBOL = 'symbol',
  AUTHOR = 'author',
  NARRATOR = 'narrator'
}

export type NarrativeEntityType = DiageticEntityType | NondiageticEntityType;

export interface DiageticEntity<T extends NarrativeEntityState = NarrativeEntityState> extends NarrativeEntity<T> {
  type: DiageticEntityType;
}

export interface Nondiagetic<T extends NarrativeEntityState = NarrativeEntityState> extends NarrativeEntity<T> {
  type: NondiageticEntityType;
}

export * from './entities/absential';
export * from './entities/author';
export * from './entities/character';
export * from './entities/faction';
export * from './entities/item';
export * from './entities/mentalConstruct';
export * from './entities/narrator';
export * from './entities/reader';
export * from './entities/relationship';
export * from './entities/setting';
export * from './entities/symbol';
export * from './entities/theme';