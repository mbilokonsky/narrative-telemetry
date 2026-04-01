// this file is nested within the entities/ folder
import { Emotion } from '../core';
import { NonDiegeticEntity, NonDiegeticEntityType, NarrativeEntityState } from '../narrativeEntity';
import { MentalConstructRelationship } from './mentalConstruct';

export interface ReaderState extends NarrativeEntityState {
  mentalConstructs: MentalConstructRelationship[];
  emotions: Emotion;
}

export interface Reader extends NonDiegeticEntity<ReaderState> {
  type: NonDiegeticEntityType.READER;
}