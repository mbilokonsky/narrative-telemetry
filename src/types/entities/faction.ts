// this file is nested within the entities/ folder
import { NarrativeEntityID } from '../core';
import { DiageticEntity, DiageticEntityType, NarrativeEntityState } from '../narrativeEntity';
import { MentalConstructRelationship } from './mentalConstruct';
import { RelationshipState } from './relationship';

export interface FactionState extends NarrativeEntityState {
  members: NarrativeEntityID[];
  sharedMentalConstructs: MentalConstructRelationship[];
  influence: number;
  resources: Record<string, number>;
  ideology: Record<string, number>;
  relationships: Record<NarrativeEntityID, RelationshipState>;
  publicOpinion: number;
}

export interface Faction extends DiageticEntity<FactionState> {
  type: DiageticEntityType.FACTION;
  foundingPrinciples: string[];
  historicalContext: string;
  organizationalStructure: string;
  recruitmentMethods: string[];
  symbolism: {
    colors: string[];
    emblem: string;
    motto: string;
  };
}
