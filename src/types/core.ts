export enum StorySpanType {
  STORY = 'story',
  ACT = 'act',
  SCENE = 'scene',
  BEAT = 'beat'
}

export enum NarrativeEventType {
  ACTION = 'action',
  DIALOGUE = 'dialogue',
  REVELATION = 'revelation',
  DECISION = 'decision',
  ENVIRONMENTAL = 'environmental'
}

export enum RealmType {
  MATERIAL_REALITY = 'material_reality',
  DREAM = 'dream',
  MEMORY = 'memory',
  VISION = 'vision',
  ALTERNATE_REALITY = 'alternate_reality',
  VIRTUAL_REALITY = 'virtual_reality',
  HYPOTHETICAL_REALITY = 'hypothetical_reality'
}

export enum RelationshipLabel {
  FAMILY = 'family',
  FRIEND = 'friend',
  ENEMY = 'enemy',
  ALLY = 'ally',
  RIVAL = 'rival',
  LOVER = 'lover',
  MENTOR = 'mentor',
  SUBORDINATE = 'subordinate',
  LEADER = 'leader'
}

export enum NarratorPerspective {
  FIRST_PERSON = 'first_person',
  SECOND_PERSON = 'second_person',
  THIRD_PERSON_LIMITED = 'third_person_limited',
  THIRD_PERSON_OMNISCIENT = 'third_person_omniscient'
}

export type NarrativeEntityID = string;
export type NarrativeStateVersion = string;
export type SpanID = string;
export type EventID = string;

export type Timestamp = {
  chapter?: number;
  paragraph?: number;
  line?: number;
  timeCode?: string;
  percentage: number;
};

export interface State<T> {
  timestamp: Timestamp;
  data: T;
  causedBy: {
    eventId?: EventID;
    spanId?: SpanID;
  };
}

export interface Emotion {
  joy: number;
  trust: number;
  fear: number;
  surprise: number;
  sadness: number;
  disgust: number;
  anger: number;
  anticipation: number;
  intensity: number;
}