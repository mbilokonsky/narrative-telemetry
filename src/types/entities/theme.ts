// this file is nested within the entities/ folder
import { NarrativeEntityID, Timestamp } from '../core';
import { NonDiegeticEntity, NonDiegeticEntityType, NarrativeEntityState } from '../narrativeEntity';

export interface ThemeState extends NarrativeEntityState {
  prevalence: number;
  relatedElements: NarrativeEntityID[];
  manifestations: Array<{
    elementId: NarrativeEntityID;
    timestamp: Timestamp;
    strength: number;
    description: string;
  }>;
  progression: Array<{
    timestamp: Timestamp;
    prevalence: number;
    dominantManifestation: string;
  }>;
}

export interface Theme extends NonDiegeticEntity<ThemeState> {
  type: NonDiegeticEntityType.THEME;
}