// this file is nested within the entities/ folder
import { NarrativeEntityID } from '../core';
import { DiageticEntity, DiageticEntityType, NarrativeEntityState } from '../narrativeEntity';

export interface ItemState extends NarrativeEntityState {
  location: NarrativeEntityID;
  condition: string;
  owner: NarrativeEntityID | null;
  isHidden: boolean;
  currentUse?: string;
}

export interface Item extends DiageticEntity<ItemState> {
  type: DiageticEntityType.ITEM;
  itemType: string;
  origin: string;
  physicalDescription: string;
  defaultFunction: string;
  culturalSignificance?: string;
}