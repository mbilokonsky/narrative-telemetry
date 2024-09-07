// this file is nested within the entities/ folder
import { NarrativeEntityID } from '../core';
import { NarrativeEntity, NarrativeEntityState } from '../narrativeEntity';

export enum AbsentialType {
  DESIRE = 'desire',
  FEAR = 'fear',
  GOAL = 'goal',
  NEED = 'need',
  EXPECTATION = 'expectation',
  LACK = 'lack',
  POTENTIAL = 'potential',
  TRIGGER = 'trigger'
}

export enum AbsentialStatus {
  UNSATISFIED = 'unsatisfied',
  CANCELED = 'canceled',
  UNSATISFIED_MIXED = 'unsatisfied_mixed',
  RESOLVED_SATISFIED = 'resolved_satisfied',
  RESOLVED_BLOCKED = 'resolved_blocked',
  RESOLVED_MIXED = 'resolved_mixed'
}

export enum EntityAbsentialRelationship {
  TARGET = 'target',
  OBSTACLE = 'obstacle',
  FACILITATOR = 'facilitator',
  INFLUENCED_BY = 'influenced_by',
  INFLUENCES = 'influences',
  CATALYST = 'catalyst',
  RESOLVER = 'resolver',
  CREATOR = 'creator',
  BENEFICIARY = 'beneficiary',
  VICTIM = 'victim'
}

export enum AbsentialRelationship {
  SUPPORTS = 'supports',
  HINDERS = 'hinders',
  PREREQUISITE = 'prerequisite',
  ALTERNATIVE = 'alternative',
  CONTRADICTS = 'contradicts',
  ENABLES = 'enables',
  MOTIVATES = 'motivates',
  RESOLVES = 'resolves'
}

export interface AbsentialState extends NarrativeEntityState {
  type: AbsentialType;
  status: AbsentialStatus;
  significance: number;
  urgency: number;
  intensity: number;
}

export interface Absential extends NarrativeEntity<AbsentialState> {
  holder: NarrativeEntityID;
  origin: string;
  parentAbsential?: NarrativeEntityID;
  childAbsentials: NarrativeEntityID[];
  conflictingAbsentials: NarrativeEntityID[];
  relatedEntities: Array<{
    entityId: NarrativeEntityID;
    relationship: EntityAbsentialRelationship;
    strength: number;
  }>;
  relatedAbsentials: Array<{
    absentialId: NarrativeEntityID;
    relationship: AbsentialRelationship;
    strength: number;
  }>;
}