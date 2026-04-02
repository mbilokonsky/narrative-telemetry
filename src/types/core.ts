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

export type CausalRole =
  | 'primary'          // the main driver of this state change
  | 'contributing'     // helped cause it but wasn't sufficient alone
  | 'necessary'        // required condition — without it, change wouldn't happen
  | 'catalytic'        // triggered the change without being consumed by it
  | 'enabling'         // made the change possible but didn't push toward it
  | 'opposing'         // pushed against this change but was overcome
  | 'complicating';    // made the change messier/partial/mixed

export interface CausalFactor {
  eventId: EventID;
  role: CausalRole;
  description?: string;  // why this event matters to this state change
}

export interface State<T> {
  timestamp: Timestamp;
  data: T;
  causedBy: {
    eventId?: EventID;   // legacy: single primary cause (backward compatible)
    spanId?: SpanID;
    factors?: CausalFactor[];  // rich: multiple causes with roles
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