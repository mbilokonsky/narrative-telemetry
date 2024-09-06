enum StorySpanType {
  STORY = 'story',
  ACT = 'act',
  SCENE = 'scene',
  BEAT = 'beat'
}

enum NarrativeEventType {
  ACTION = 'action',
  DIALOGUE = 'dialogue',
  REVELATION = 'revelation',
  DECISION = 'decision',
  ENVIRONMENTAL = 'environmental'
}

enum AbsentialType {
  DESIRE = 'desire',
  FEAR = 'fear',
  GOAL = 'goal',
  NEED = 'need',
  EXPECTATION = 'expectation',
  LACK = 'lack',
  POTENTIAL = 'potential',
  TRIGGER = 'trigger'
}

enum AbsentialStatus {
  UNSATISFIED = 'unsatisfied',
  CANCELED = 'canceled',
  UNSATISFIED_MIXED = 'unsatisfied_mixed',
  RESOLVED_SATISFIED = 'resolved_satisfied',
  RESOLVED_BLOCKED = 'resolved_blocked',
  RESOLVED_MIXED = 'resolved_mixed'
}

enum RealmType {
  MATERIAL_REALITY = 'material_reality',
  DREAM = 'dream',
  MEMORY = 'memory',
  VISION = 'vision',
  ALTERNATE_REALITY = 'alternate_reality',
  VIRTUAL_REALITY = 'virtual_reality',
  HYPOTHETICAL_REALITY = 'hypothetical_reality'
}

enum RelationshipLabel {
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

enum FactionMembershipStatus {
  ASPIRANT = 'aspirant',
  MEMBER = 'member',
  LEADER = 'leader',
  FORMER_MEMBER = 'former_member',
  ENEMY = 'enemy',
  NEUTRAL = 'neutral'
}

enum ConsciousnessLevel {
  UNCONSCIOUS = 'unconscious',
  SUBCONSCIOUS = 'subconscious',
  CONSCIOUS = 'conscious',
  HYPERAWARE = 'hyperaware'
}

enum DiageticElementType {
  CHARACTER = 'character',
  SETTING = 'setting',
  ITEM = 'item',
  FACTION = 'faction'
}

enum ExtradiageticElementType {
  READER = 'reader',
  THEME = 'theme',
  SYMBOL = 'symbol',
  AUTHOR = 'author',
  NARRATOR = 'narrator'
}

enum NarratorPerspective {
  FIRST_PERSON = 'first_person',
  SECOND_PERSON = 'second_person',
  THIRD_PERSON_LIMITED = 'third_person_limited',
  THIRD_PERSON_OMNISCIENT = 'third_person_omniscient'
}

type NarrativeElementID = string
type NarrativeStateVersion = string
type KnowledgeID = string
type AbsentialID = string
type SpanID = string
type EventID = string

type Timestamp = {
  chapter?: number;
  paragraph?: number;
  line?: number;
  timeCode?: string;
  percentage: number;
};

interface State<T> {
  timestamp: Timestamp;
  data: T;
  causedBy: {
    eventId?: NarrativeElementID;
    spanId?: SpanID;
  };
}

interface Emotion {
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

interface Knowledge {
  id: KnowledgeID;
  subject: NarrativeElementID;
  content: string;
  knower: NarrativeElementID;
  type: 'fact' | 'experience' | 'speculation' | 'misconception' | 'opinion';
  confidence: number;
  truthValue: number;
  source: NarrativeElementID | EventID;
  acquiredAt: Timestamp;
  updatedAt: Timestamp;
  relatedKnowledge: KnowledgeID[];
  certainty: number;
  emotionalImpact: Partial<Emotion>;
}

interface Absential {
  id: AbsentialID;
  description: string;
  type: AbsentialType;
  status: AbsentialStatus;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  significance: number;
  urgency: number;
  intensity: number;
  consciousnessLevel?: ConsciousnessLevel;
  origin: string;
  parentAbsential?: AbsentialID;
  childAbsentials: AbsentialID[];
  conflictingAbsentials: AbsentialID[];
  relatedElements: NarrativeElementID[];
}

interface AbsentialConflict {
  id: string;
  absentials: AbsentialID[];
  description: string;
  intensity: number;
  resolutionStrategy?: string;
}

interface NarrativeElementState {
  version: NarrativeStateVersion;
  attributes: Record<string, number | string>;
  activeAbsentials: AbsentialID[];
  currentRelationships: string[];
  symbolsPresent: string[];
  significance: number;
}

interface NarrativeElement<T extends NarrativeElementState = NarrativeElementState> {
  id: NarrativeElementID;
  name: string;
  description: string;
  tags: string[];
  stateHistory: State<T>[];
  firstIntroduced: EventID;
  lastSeen?: EventID;
}

interface DiageticElement<T extends NarrativeElementState = NarrativeElementState> extends NarrativeElement<T> {
  type: DiageticElementType;
}

interface ExtradiageticElement<T extends NarrativeElementState = NarrativeElementState> extends NarrativeElement<T> {
  type: ExtradiageticElementType;
}

interface CharacterState extends NarrativeElementState {
  emotionalState: Emotion;
  knowledge: Record<KnowledgeID, Knowledge>;
  inventory: NarrativeElementID[];
  location: NarrativeElementID;
  factionMemberships: Record<NarrativeElementID, FactionMembershipStatus>;
}

interface SettingState extends NarrativeElementState {
  currentCharacters: NarrativeElementID[];
  currentItems: NarrativeElementID[];
  dominantFactions: Record<NarrativeElementID, number>;
  environmentalConditions: Record<string, number>;
  culturalNorms: Record<string, number>;
}

interface ItemState extends NarrativeElementState {
  location: NarrativeElementID;
  condition: number;
  condition_description: string;
}

interface RelationshipState extends NarrativeElementState {
  strength: number;
  dynamics: {
    power: number;
    influence: number;
    conflict: number;
  };
}

interface FactionState extends NarrativeElementState {
  members: NarrativeElementID[];
  knowledge: Record<KnowledgeID, Knowledge>;
  influence: number;
  resources: Record<string, number>;
  ideology: Record<string, number>;
  relationships: Record<NarrativeElementID, RelationshipState>;
}

interface ReaderState extends NarrativeElementState {
  knowledge: Record<KnowledgeID, Knowledge>;
  emotions: Emotion;
  expectations: AbsentialID[];
}

interface ThemeState extends NarrativeElementState {
  prevalence: number;
  relatedElements: NarrativeElementID[];
}

interface SymbolState extends NarrativeElementState {
  currentMeanings: Array<{
    description: string;
    strength: number;
  }>;
  currentManifestations: NarrativeElementID[];
}

interface AuthorState extends NarrativeElementState {
  style: Record<string, number>;
  themes: NarrativeElementID[];
}

interface NarratorState extends NarrativeElementState {
  reliability: number;
  knowledge: Record<KnowledgeID, Knowledge>;
  perspective: NarratorPerspective;
}

interface Character extends DiageticElement<CharacterState> {
  type: DiageticElementType.CHARACTER;
}

interface Setting extends DiageticElement<SettingState> {
  type: DiageticElementType.SETTING;
  realm: RealmType;
  parentSetting?: NarrativeElementID;
  childSettings?: NarrativeElementID[];
}

interface Item extends DiageticElement<ItemState> {
  type: DiageticElementType.ITEM;
}


interface Faction extends DiageticElement<FactionState> {
  type: DiageticElementType.FACTION;
}

interface Reader extends ExtradiageticElement<ReaderState> {
  type: ExtradiageticElementType.READER;
}

interface Theme extends ExtradiageticElement<ThemeState> {
  type: ExtradiageticElementType.THEME;
}

interface Symbol extends ExtradiageticElement<SymbolState> {
  type: ExtradiageticElementType.SYMBOL;
}

interface Author extends ExtradiageticElement<AuthorState> {
  type: ExtradiageticElementType.AUTHOR;
}

interface Narrator extends ExtradiageticElement<NarratorState> {
  type: ExtradiageticElementType.NARRATOR;
}

interface InterpersonalRelationship extends NarrativeElement<RelationshipState> {
  participants: [NarrativeElementID, NarrativeElementID]; // Exactly two participants
  nature: string;
  label?: RelationshipLabel;
  specificLabel?: string;
}

interface SymbolicRelationship extends NarrativeElement<NarrativeElementState> {
  symbol: NarrativeElementID; // ID of the Symbol
  symbolized: NarrativeElementID; // ID of the element being symbolized
  interpretation: string;
  strength: number; // 0 to 1, representing how strongly the symbol represents the symbolized
}

interface GroupRelationship extends NarrativeElement<RelationshipState> {
  participants: NarrativeElementID[]; // More than two participants
  subRelationships: NarrativeElementID[]; // IDs of InterpersonalRelationships within the group
  groupDynamics: {
    cohesion: number;
    sharedPurpose: number;
    internalConflict: number;
  };
  emergentProperties?: {
    traits: Record<string, number>;
    absentials: AbsentialID[];
  };
}

interface Causality {
  cause: NarrativeElementID | EventID;
  effect: NarrativeElementID | EventID;
  strength: number; // 0 to 1, representing how strong the causal link is
  description: string;
}

interface Event {
  id: EventID;
  type: NarrativeEventType;
  description: string;
  timestamp: Timestamp;
  duration?: Timestamp;
  affectedElements: Array<{
    elementId: NarrativeElementID;
    changes: Partial<NarrativeElementState>;
  }>;
  causes: Causality[];
  effects: Causality[];
  significance: number;
}

interface StorySpan {
  id: string;
  type: StorySpanType;
  title: string;
  description: string;
  startTimestamp: Timestamp;
  endTimestamp: Timestamp;
  events: Event[];
  childSpans: StorySpan[];
  narrativeElementStates: Array<{
    elementId: NarrativeElementID;
    stateVersion: NarrativeStateVersion;
  }>;
  dominantElements: NarrativeElementID[];
  tension: number;
}

interface StoryModel {
  title: string;
  author: string;
  description: string;
  rootSpan: StorySpan;
  diageticElements: {
    characters: Record<NarrativeElementID, Character>;
    settings: Record<NarrativeElementID, Setting>;
    items: Record<NarrativeElementID, Item>;
    factions: Record<NarrativeElementID, Faction>;
  };
  extradiageticElements: {
    reader: Reader;
    themes: Record<string, Theme>;
    symbols: Record<string, Symbol>;
    authors: Record<string, Author>;
    narrators: Record<string, Narrator>;
  };
  relationships: {
    interpersonal: Record<NarrativeElementID, InterpersonalRelationship>;
    group: Record<NarrativeElementID, GroupRelationship>;
    symbolic: Record<NarrativeElementID, SymbolicRelationship>;
  };
  events: Record<EventID, Event>;
  causality: Causality[];
  absentials: Record<AbsentialID, Absential>;
  absentialConflicts: Record<string, AbsentialConflict>;
  globalTension: Array<{ timestamp: Timestamp, value: number }>;
}

export {
  StorySpanType, NarrativeEventType, AbsentialType, AbsentialStatus, RealmType, RelationshipLabel,
  FactionMembershipStatus, ConsciousnessLevel, DiageticElementType, ExtradiageticElementType, NarratorPerspective,
  NarrativeElementID, NarrativeStateVersion, KnowledgeID, AbsentialID, SpanID, EventID,
  Timestamp, State, Emotion, Knowledge, Absential, AbsentialConflict,
  NarrativeElementState, CharacterState, SettingState, ItemState, FactionState,
  ReaderState, ThemeState, SymbolState, AuthorState, NarratorState,
  NarrativeElement, DiageticElement, ExtradiageticElement,
  Character, Setting, Item, Faction,
  Reader, Theme, Symbol, Author, Narrator,
  InterpersonalRelationship, SymbolicRelationship, GroupRelationship,
  Causality, Event, StorySpan, StoryModel
};