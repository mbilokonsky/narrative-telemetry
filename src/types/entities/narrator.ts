// this file is nested within the entities/ folder
import { NarratorPerspective } from '../core';
import { NonDiegeticEntity, NonDiegeticEntityType, NarrativeEntityState } from '../narrativeEntity';
import { MentalConstructRelationship } from './mentalConstruct';

export interface NarratorState extends NarrativeEntityState {
  reliability: number;
  mentalConstructs: MentalConstructRelationship[];
  perspective: NarratorPerspective;
}

export interface Narrator extends NonDiegeticEntity<NarratorState> {
  type: NonDiegeticEntityType.NARRATOR;
}