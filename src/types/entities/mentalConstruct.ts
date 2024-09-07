// this file is nested within the entities/ folder
import { NarrativeEntityID, Timestamp, EventID } from '../core';
import { NarrativeEntity, NarrativeEntityState } from '../narrativeEntity';

export enum MentalConstructType {
  FACT = 'fact',
  BELIEF = 'belief',
  OPINION = 'opinion',
  MEMORY = 'memory',
  SKILL = 'skill',
  SPECULATION = 'speculation'
}

export enum CertaintyLevel {
  CERTAIN = 'certain',
  PROBABLE = 'probable',
  POSSIBLE = 'possible',
  DOUBTFUL = 'doubtful',
  UNKNOWN = 'unknown'
}

export enum AwarenessLevel {
  CONSCIOUS = 'conscious',
  SUBCONSCIOUS = 'subconscious',
  UNCONSCIOUS = 'unconscious'
}

export interface MentalConstructState extends NarrativeEntityState {
  content: string;
  type: MentalConstructType;
  certainty: CertaintyLevel;
  awareness: AwarenessLevel;
  emotionalAssociation: Record<string, number>;
  salience: number;
}

export interface MentalConstruct extends NarrativeEntity<MentalConstructState> {
  subject: NarrativeEntityID;
  holder: NarrativeEntityID;
  isDiegetic: boolean;
  source?: NarrativeEntityID | EventID;
  relatedConstructs: Set<NarrativeEntityID>;
  conflictingConstructs: Set<NarrativeEntityID>;
  supportingConstructs: Set<NarrativeEntityID>;
}

export interface MentalConstructRelationship {
  constructId: NarrativeEntityID;
  acquiredAt: Timestamp;
  lastRecalledAt: Timestamp;
  recallFrequency: number;
}

export interface MentalConstructQuery {
  holder: NarrativeEntityID;
  subject?: NarrativeEntityID;
  type?: MentalConstructType;
  certainty?: CertaintyLevel;
  awareness?: AwarenessLevel;
  timepoint: Timestamp;
}