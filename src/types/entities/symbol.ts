// this file is nested within the entities/ folder
import { NarrativeEntityID } from '../core';
import { Nondiagetic, NondiageticEntityType, NarrativeEntityState } from '../narrativeEntity';

export interface SymbolState extends NarrativeEntityState {
  currentMeanings: Array<{
    description: string;
    strength: number;
  }>;
  currentManifestations: NarrativeEntityID[];
}

export interface Symbol extends Nondiagetic<SymbolState> {
  type: NondiageticEntityType.SYMBOL;
}