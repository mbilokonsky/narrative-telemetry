// this file is nested within the entities/ folder
import { NarrativeEntityID, Emotion } from '../core';
import { DiageticEntity, DiageticEntityType, NarrativeEntityState } from '../narrativeEntity';
import { MentalConstructRelationship } from './mentalConstruct';

export interface CharacterState extends NarrativeEntityState {
  emotionalState: Emotion;
  mentalConstructs: MentalConstructRelationship[];
  inventory: NarrativeEntityID[];
  location: NarrativeEntityID;
  factionRelationships: Record<NarrativeEntityID, {
    type: string;
    strength: number;
  }>;
  age: number;
  gender: string;
  occupation: string;
  personalityTraits: string[];
  coreValues: string[];
  physicalDescription: string;
  skills: Record<string, number>;
  socialStatus: Record<NarrativeEntityID, number>;
}

export interface Character extends DiageticEntity<CharacterState> {
  type: DiageticEntityType.CHARACTER;
}