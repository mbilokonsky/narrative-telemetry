// this file is nested within the entities/ folder
import { NarrativeEntityID } from '../core';
import { NonDiegeticEntity, NonDiegeticEntityType, NarrativeEntityState } from '../narrativeEntity';

export interface AuthorState extends NarrativeEntityState {
  style: Record<string, number>;
  themes: NarrativeEntityID[];
}

export interface Author extends NonDiegeticEntity<AuthorState> {
  type: NonDiegeticEntityType.AUTHOR;
}