// this file is nested within the entities/ folder
import { NarrativeEntityID, RealmType } from '../core';
import { DiageticEntity, DiageticEntityType, NarrativeEntityState } from '../narrativeEntity';

export interface SettingState extends NarrativeEntityState {
  currentCharacters: NarrativeEntityID[];
  currentItems: NarrativeEntityID[];
  dominantFactions: Record<NarrativeEntityID, number>;
  environmentalConditions: Record<string, number>;
  culturalNorms: Record<string, number>;
  tension: number;
  atmosphere: string;
}

export interface Setting extends DiageticEntity<SettingState> {
  type: DiageticEntityType.SETTING;
  realm: RealmType;
  geography: string;
  climate: string;
  historicalContext: string;
  culturalBackground: string;
  parentSetting?: NarrativeEntityID;
  childSettings?: NarrativeEntityID[];
}