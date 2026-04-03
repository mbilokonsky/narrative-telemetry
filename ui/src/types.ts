/**
 * UI types — re-exported from the engine type system.
 *
 * This file used to be a hand-maintained subset of the engine types.
 * Now it re-exports directly from @narrative-telemetry/types to prevent
 * type drift between engine and UI.
 *
 * UI-only types (Selection) are defined here.
 */
export type {
  // Core
  Timestamp,
  EventID,
  SpanID,
  NarrativeEntityID,
  CausalRole,
  CausalFactor,
  State,
  Emotion,

  // Structural
  StoryModel,
  TextModel,
  StorySpan,
  Reading,
  ReadingEventAnnotation,
  ReadingSignificance,
  ReadingEventEffect,
  ReadingSpanAnnotation,
  TextAnnotation,
  TensionDimensions,

  // Events
  Event as StoryEvent,

  // Entities
  Character,
  Setting,
  Item,
  Absential,
  AbsentialState,
  Relationship,
} from '@narrative-telemetry/types';

// Re-export enums as values (not just types)
export {
  StorySpanType,
  NarrativeEventType,
  AbsentialType,
  AbsentialStatus,
} from '@narrative-telemetry/types';

// ── UI-only types ──

/** @deprecated Use ReadingEventAnnotation instead */
export type Significance = import('@narrative-telemetry/types').ReadingEventAnnotation;

export interface TensionPoint {
  timestamp: import('@narrative-telemetry/types').Timestamp;
  value: number;
  dimensions?: import('@narrative-telemetry/types').TensionDimensions;
}

export type Selection =
  | { type: 'event'; id: string }
  | { type: 'span'; id: string }
  | { type: 'entity'; entityId: string }
  | { type: 'absential'; absentialId: string; compareIds?: string[] }
  | null;
