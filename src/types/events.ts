import { NarrativeEventType, EventID, Timestamp, NarrativeEntityID } from './core';

export interface TextLocation {
  startLine: number;
  endLine: number;
}

export interface Event {
  id: EventID;
  type: NarrativeEventType;
  description: string;
  timestamp: Timestamp;
  duration?: Timestamp;
  textLocation: TextLocation;
  participants: NarrativeEntityID[];
  precedingEvent?: EventID;
}
