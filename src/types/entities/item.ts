// this file is nested within the entities/ folder
import { NarrativeEntityID } from '../core';
import { DiegeticEntity, DiegeticEntityType, NarrativeEntityState } from '../narrativeEntity';

export interface ItemState extends NarrativeEntityState {
  location: NarrativeEntityID;
  condition: string;
  owner: NarrativeEntityID | null;
  isHidden: boolean;
  currentUse?: string;
}

export interface Item extends DiegeticEntity<ItemState> {
  type: DiegeticEntityType.ITEM;
  itemType: string;
  origin: string;
  physicalDescription: string;
  defaultFunction: string;
  culturalSignificance?: string;
}