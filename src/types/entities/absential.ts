// this file is nested within the entities/ folder
import { NarrativeEntityID, EventID, Timestamp } from '../core';
import { NarrativeEntity, NarrativeEntityState } from '../narrativeEntity';

export enum AbsentialType {
  DESIRE = 'desire',
  FEAR = 'fear',
  GOAL = 'goal',
  NEED = 'need',
  EXPECTATION = 'expectation',
  LACK = 'lack',
  POTENTIAL = 'potential',
  TRIGGER = 'trigger'
}

export enum AbsentialStatus {
  UNSATISFIED = 'unsatisfied',
  CANCELED = 'canceled',
  UNSATISFIED_MIXED = 'unsatisfied_mixed',
  RESOLVED_SATISFIED = 'resolved_satisfied',
  RESOLVED_BLOCKED = 'resolved_blocked',
  RESOLVED_MIXED = 'resolved_mixed'
}

export enum EntityAbsentialRelationship {
  TARGET = 'target',
  OBSTACLE = 'obstacle',
  FACILITATOR = 'facilitator',
  INFLUENCED_BY = 'influenced_by',
  INFLUENCES = 'influences',
  CATALYST = 'catalyst',
  RESOLVER = 'resolver',
  CREATOR = 'creator',
  BENEFICIARY = 'beneficiary',
  VICTIM = 'victim'
}

export enum AbsentialRelationship {
  SUPPORTS = 'supports',
  HINDERS = 'hinders',
  PREREQUISITE = 'prerequisite',
  ALTERNATIVE = 'alternative',
  CONTRADICTS = 'contradicts',
  ENABLES = 'enables',
  MOTIVATES = 'motivates',
  RESOLVES = 'resolves'
}

// ── AbsentialField: the generative tension source ──

/**
 * The source of an absential field — what generates the tension.
 * Can be an entity (the Ring), a relationship (class divide),
 * a condition (Dublin's paralysis), or a prior event.
 */
export interface AbsentialSource {
  entityId: NarrativeEntityID;
  role: 'origin' | 'carrier' | 'amplifier' | 'expression' | 'context';
}

/**
 * How an absential field activates for a specific entity.
 * Each manifestation has its own trajectory — Gandalf's experience
 * of the Ring's potential is different from Frodo's.
 */
export interface AbsentialManifestation {
  entityId: NarrativeEntityID;
  nature: string;              // "temptation resisted", "gradual corruption", "fatal desire"
  intensity: number;           // 0-1: how strongly the field activates for this entity
  status: AbsentialStatus;     // current status for this entity's experience
  stateTransitions: AbsentialManifestationTransition[];
}

/**
 * A change in how an entity experiences an absential field.
 * Closes the loop: field → event → state change → field reconfiguration.
 */
export interface AbsentialManifestationTransition {
  timestamp: Timestamp;
  eventId: EventID;            // the event that caused this change
  status: AbsentialStatus;
  intensity: number;
  urgency: number;
  description: string;         // what changed in this entity's experience of the field
  reconfigures?: string[];     // IDs of other absential fields this transition affects
}

/**
 * An event driven by absential pressure.
 * The missing arrow: field → event.
 */
export interface AbsentialDrivenEvent {
  eventId: EventID;
  role: 'caused_by' | 'resists' | 'expresses' | 'transforms' | 'resolves';
  description?: string;
}

// ── The AbsentialField itself ──

export interface AbsentialState extends NarrativeEntityState {
  type: AbsentialType;
  status: AbsentialStatus;
  urgency: number;
  intensity: number;
}

/**
 * An AbsentialField is a tension source that emerges from a relational web
 * and drives narrative through its manifestations in different entities.
 *
 * The core loop:
 *   field tension → drives events → events mutate state →
 *   state changes reconfigure the field → new tension → ...
 *
 * Fields are not "held" by a single entity. They have sources (what
 * generates the tension) and manifestations (how each entity experiences
 * it). The same field produces different trajectories for different entities.
 */
export interface Absential extends NarrativeEntity<AbsentialState> {
  // ── Legacy (backward compatible) ──
  holder: NarrativeEntityID;   // primary entity; use sources for richer model
  origin: string;

  // ── Sources: what generates this field ──
  sources?: AbsentialSource[];

  // ── Manifestations: per-entity trajectories through the field ──
  manifestations?: AbsentialManifestation[];

  // ── Events this field drives (field → event arrow) ──
  drivenEvents?: AbsentialDrivenEvent[];

  // ── Field relationships ──
  parentAbsential?: NarrativeEntityID;
  childAbsentials: NarrativeEntityID[];
  conflictingAbsentials: NarrativeEntityID[];
  relatedEntities: Array<{
    entityId: NarrativeEntityID;
    relationship: EntityAbsentialRelationship;
    strength: number;
  }>;
  relatedAbsentials: Array<{
    absentialId: NarrativeEntityID;
    relationship: AbsentialRelationship;
    strength: number;
  }>;
}
