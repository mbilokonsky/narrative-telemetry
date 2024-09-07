// this file is nested within the entities/ folder
import { NarrativeEntityID, RelationshipLabel } from '../core';
import { NarrativeEntity, NarrativeEntityState } from '../narrativeEntity';

export enum RelationshipType {
  INTERPERSONAL = 'interpersonal',
  GROUP = 'group',
  SYMBOLIC = 'symbolic'
}

export interface RelationshipState extends NarrativeEntityState {
  strength: number;
  dynamics: {
    power: number;
    influence: number;
    conflict: number;
  };
  label?: RelationshipLabel;
  specificLabel?: string;
}

export interface Relationship extends NarrativeEntity<RelationshipState> {
  type: RelationshipType;
  participants: NarrativeEntityID[];
  nature: string;
}

export interface InterpersonalRelationship extends Relationship {
  type: RelationshipType.INTERPERSONAL;
  participants: [NarrativeEntityID, NarrativeEntityID];
}

export interface GroupRelationship extends Relationship {
  type: RelationshipType.GROUP;
  subRelationships: NarrativeEntityID[];
  groupDynamics: {
    cohesion: number;
    sharedPurpose: number;
    internalConflict: number;
  };
}

export interface SymbolicRelationship extends Relationship {
  type: RelationshipType.SYMBOLIC;
  symbol: NarrativeEntityID;
  symbolized: NarrativeEntityID;
  interpretation: string;
}