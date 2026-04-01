// this file is nested within the entities/ folder
import { NarrativeEntityID } from '../core';
import { NonDiegeticEntity, NonDiegeticEntityType, NarrativeEntityState } from '../narrativeEntity';

export interface SymbolState extends NarrativeEntityState {
  currentMeanings: Array<{
    description: string;
    strength: number;
  }>;
  currentManifestations: NarrativeEntityID[];
}

export interface NarrativeSymbol extends NonDiegeticEntity<SymbolState> {
  type: NonDiegeticEntityType.SYMBOL;
}