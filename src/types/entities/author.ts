// this file is nested within the entities/ folder
import { NarrativeEntityID } from '../core';
import { Nondiagetic, NondiageticEntityType, NarrativeEntityState } from '../narrativeEntity';

export interface AuthorState extends NarrativeEntityState {
  style: Record<string, number>;
  themes: NarrativeEntityID[];
}

export interface Author extends Nondiagetic<AuthorState> {
  type: NondiageticEntityType.AUTHOR;
}