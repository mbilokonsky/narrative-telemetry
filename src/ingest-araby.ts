import { NarrativeAnalysisSystem } from './NarrativeAnalysisSystem';
import { saveStoryModel } from './persistence';
import {
  StorySpanType,
  NarrativeEventType,
  DiegeticEntityType,
  NonDiegeticEntityType,
  NarratorPerspective,
  RealmType,
  RelationshipType,
  AbsentialType,
  AbsentialStatus,
  EntityAbsentialRelationship,
  MentalConstructType,
  CertaintyLevel,
  AwarenessLevel,
  RelationshipLabel,
  InterpersonalRelationship,
} from './types';

// ── Helpers ──

function ts(pct: number) {
  return { percentage: pct };
}

function emptyEmotion() {
  return { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0, intensity: 0 };
}

function baseState(eventId: string, pct: number) {
  return {
    version: 'v1',
    activeAbsentials: [] as string[],
    currentRelationships: [] as string[],
    symbolsPresent: [] as string[],
    significance: 0.5,
    generatedBy: eventId,
  };
}

// ── Build the model ──

const sys = new NarrativeAnalysisSystem(
  'Araby',
  'James Joyce',
  'A boy in Dublin becomes infatuated with his friend\'s sister and promises to bring her something from the Araby bazaar, only to arrive too late and experience a moment of devastating self-awareness.'
);

const rootId = sys.getRootSpanId();

// ── Narrator ──

const narratorId = sys.addNarrator({
  name: 'Unnamed first-person narrator (the boy, retrospective)',
  description: 'The adult narrator looking back on a childhood experience with ironic distance',
  tags: ['retrospective', 'first-person', 'unreliable-by-youth'],
  type: NonDiegeticEntityType.NARRATOR,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      reliability: 0.7,
      mentalConstructs: [],
      perspective: NarratorPerspective.FIRST_PERSON,
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

// ── Reader ──

const readerId = sys.addReader({
  name: 'Implied reader',
  description: 'The reader whose knowledge state we track',
  tags: ['implied-reader'],
  type: NonDiegeticEntityType.READER,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      mentalConstructs: [],
      emotions: emptyEmotion(),
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

// ── Author ──

const authorId = sys.addAuthor({
  name: 'James Joyce',
  description: 'Author of Dubliners',
  tags: ['modernist', 'irish'],
  type: NonDiegeticEntityType.AUTHOR,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      style: { irony: 0.9, lyricism: 0.8, realism: 0.85 },
      themes: [],
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

// ── Settings ──

const northRichmondId = sys.addSetting({
  name: 'North Richmond Street',
  description: 'A blind (dead-end) street in Dublin where the boy lives',
  tags: ['dublin', 'residential', 'dead-end'],
  type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY,
  geography: 'Dead-end street in north Dublin',
  climate: 'Damp, cold, winter',
  historicalContext: 'Turn-of-century Dublin under British rule',
  culturalBackground: 'Catholic, working-class Irish',
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      currentCharacters: [],
      currentItems: [],
      dominantFactions: {},
      environmentalConditions: { light: 0.3, warmth: 0.2 },
      culturalNorms: { catholicism: 0.9, propriety: 0.8 },
      tension: 0.2,
      atmosphere: 'quiet, decaying, suffocating',
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

const houseId = sys.addSetting({
  name: 'The boy\'s house (former priest\'s house)',
  description: 'The house where the boy lives with his uncle and aunt, formerly inhabited by a dead priest',
  tags: ['domestic', 'gloomy', 'religious-remnants'],
  type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY,
  geography: 'End of North Richmond Street',
  climate: 'Cold, damp interior',
  historicalContext: 'Previous tenant was a priest who died in the back drawing-room',
  culturalBackground: 'Catholic household',
  parentSetting: northRichmondId,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      currentCharacters: [],
      currentItems: [],
      dominantFactions: {},
      environmentalConditions: { light: 0.2, mustiness: 0.8 },
      culturalNorms: { catholicism: 0.9 },
      tension: 0.1,
      atmosphere: 'musty, dark, haunted by absence',
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

const arabyBazaarId = sys.addSetting({
  name: 'Araby bazaar',
  description: 'A grand bazaar in Dublin, exotic in name but disappointing in reality',
  tags: ['bazaar', 'exotic', 'commercial', 'disillusionment'],
  type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY,
  geography: 'Large hall in Dublin',
  climate: 'Dark, closing down',
  historicalContext: 'Charity bazaars were common in Dublin at the time',
  culturalBackground: 'Pseudo-oriental commercial spectacle',
  stateHistory: [{
    timestamp: ts(75),
    data: {
      ...baseState('init', 75),
      currentCharacters: [],
      currentItems: [],
      dominantFactions: {},
      environmentalConditions: { light: 0.3, grandeur: 0.2 },
      culturalNorms: { commerce: 0.9 },
      tension: 0.6,
      atmosphere: 'dark, nearly empty, closing',
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

// ── Characters ──

const boyId = sys.addCharacter({
  name: 'The boy (narrator as child)',
  description: 'An unnamed boy living with his uncle and aunt on North Richmond Street, consumed by a romantic infatuation',
  tags: ['protagonist', 'youth', 'romantic', 'naive'],
  type: DiegeticEntityType.CHARACTER,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      emotionalState: { ...emptyEmotion(), anticipation: 0.6, joy: 0.3, intensity: 0.4 },
      mentalConstructs: [],
      inventory: [],
      location: northRichmondId,
      factionRelationships: {},
      age: 12,
      gender: 'male',
      occupation: 'student',
      personalityTraits: ['imaginative', 'sensitive', 'earnest', 'naive'],
      coreValues: ['devotion', 'romance', 'adventure'],
      physicalDescription: 'Young boy, unspecified',
      skills: {},
      socialStatus: {},
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

const mangansId = sys.addCharacter({
  name: 'Mangan\'s sister',
  description: 'The unnamed older sister of the boy\'s friend Mangan, object of the boy\'s infatuation',
  tags: ['love-interest', 'unattainable', 'idealized'],
  type: DiegeticEntityType.CHARACTER,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      emotionalState: emptyEmotion(),
      mentalConstructs: [],
      inventory: [],
      location: northRichmondId,
      factionRelationships: {},
      age: 14,
      gender: 'female',
      occupation: 'student (convent)',
      personalityTraits: ['graceful', 'distant'],
      coreValues: [],
      physicalDescription: 'Her figure defined by the light from the half-opened door, the soft rope of her hair, the silver bracelet',
      skills: {},
      socialStatus: {},
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

const uncleId = sys.addCharacter({
  name: 'The uncle',
  description: 'The boy\'s uncle, often drunk, forgetful, represents the adult world\'s indifference',
  tags: ['guardian', 'obstacle', 'alcoholic'],
  type: DiegeticEntityType.CHARACTER,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      emotionalState: emptyEmotion(),
      mentalConstructs: [],
      inventory: [],
      location: houseId,
      factionRelationships: {},
      age: 45,
      gender: 'male',
      occupation: 'unspecified',
      personalityTraits: ['forgetful', 'well-meaning', 'unreliable'],
      coreValues: [],
      physicalDescription: 'Unspecified',
      skills: {},
      socialStatus: {},
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

const auntId = sys.addCharacter({
  name: 'The aunt',
  description: 'The boy\'s aunt, a background domestic presence',
  tags: ['guardian', 'domestic'],
  type: DiegeticEntityType.CHARACTER,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      emotionalState: emptyEmotion(),
      mentalConstructs: [],
      inventory: [],
      location: houseId,
      factionRelationships: {},
      age: 40,
      gender: 'female',
      occupation: 'homemaker',
      personalityTraits: ['cautious', 'practical'],
      coreValues: ['propriety'],
      physicalDescription: 'Unspecified',
      skills: {},
      socialStatus: {},
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

// ── Items ──

const coinId = sys.addItem({
  name: 'The florin',
  description: 'The coin the uncle gives the boy for the bazaar',
  tags: ['money', 'permission', 'too-late'],
  type: DiegeticEntityType.ITEM,
  itemType: 'coin',
  origin: 'The uncle\'s pocket',
  physicalDescription: 'A florin (two shillings)',
  defaultFunction: 'Currency for purchasing a gift at Araby',
  stateHistory: [{
    timestamp: ts(60),
    data: {
      ...baseState('init', 60),
      location: houseId,
      condition: 'normal',
      owner: uncleId,
      isHidden: false,
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

// ── Themes ──

const disillusionmentId = sys.addTheme({
  name: 'Disillusionment / Epiphany',
  description: 'The movement from romantic idealization to painful self-awareness',
  tags: ['epiphany', 'loss-of-innocence', 'vanity'],
  type: NonDiegeticEntityType.THEME,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      prevalence: 0.3,
      relatedElements: [boyId, mangansId, arabyBazaarId],
      manifestations: [],
      progression: [],
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

const paralysisId = sys.addTheme({
  name: 'Paralysis',
  description: 'The pervasive stasis and entrapment of Dublin life — a central Dubliners theme',
  tags: ['dublin', 'stasis', 'entrapment'],
  type: NonDiegeticEntityType.THEME,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      prevalence: 0.5,
      relatedElements: [northRichmondId, houseId, uncleId],
      manifestations: [],
      progression: [],
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

// ── Symbols ──

const lightDarkId = sys.addSymbol({
  name: 'Light and darkness',
  description: 'Recurring imagery of light (idealization, the girl) vs darkness (reality, Dublin)',
  tags: ['imagery', 'contrast'],
  type: NonDiegeticEntityType.SYMBOL,
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      currentMeanings: [
        { description: 'Light = romantic idealization, the girl illuminated', strength: 0.8 },
        { description: 'Darkness = reality, decay, Dublin', strength: 0.8 },
      ],
      currentManifestations: [mangansId, northRichmondId, arabyBazaarId],
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

// ── Relationships ──

const boyMangansRelId = sys.addRelationship({
  id: 'rel_boy_mangans',
  type: RelationshipType.INTERPERSONAL,
  participants: [boyId, mangansId],
  nature: 'One-sided romantic infatuation',
  name: 'Boy → Mangan\'s sister',
  description: 'The boy\'s consuming, idealized love for Mangan\'s sister',
  tags: ['romance', 'unrequited', 'idealized'],
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      strength: 0.8,
      dynamics: { power: -0.7, influence: 0.9, conflict: 0.1 },
      label: RelationshipLabel.LOVER,
      specificLabel: 'unrequited infatuation',
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
} as InterpersonalRelationship);

const boyUncleRelId = sys.addRelationship({
  id: 'rel_boy_uncle',
  type: RelationshipType.INTERPERSONAL,
  participants: [boyId, uncleId],
  nature: 'Guardian-ward, marked by the uncle\'s negligence',
  name: 'Boy ↔ Uncle',
  description: 'The boy depends on his uncle who is unreliable and forgetful',
  tags: ['family', 'guardian', 'obstacle'],
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      strength: 0.4,
      dynamics: { power: -0.8, influence: 0.3, conflict: 0.3 },
      label: RelationshipLabel.FAMILY,
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
} as InterpersonalRelationship);

// ── Absentials ──

const longingAbsId = sys.addAbsential({
  name: 'The boy\'s romantic longing',
  description: 'The boy\'s unfulfilled desire to connect with and prove his devotion to Mangan\'s sister',
  tags: ['desire', 'romance', 'core-driver'],
  holder: boyId,
  origin: 'The boy\'s idealized perception of Mangan\'s sister',
  childAbsentials: [],
  conflictingAbsentials: [],
  relatedEntities: [
    { entityId: mangansId, relationship: EntityAbsentialRelationship.TARGET, strength: 0.9 },
  ],
  relatedAbsentials: [],
  stateHistory: [{
    timestamp: ts(0),
    data: {
      ...baseState('init', 0),
      type: AbsentialType.DESIRE,
      status: AbsentialStatus.UNSATISFIED,
      significance: 0.9,
      urgency: 0.5,
      intensity: 0.7,
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

const questAbsId = sys.addAbsential({
  name: 'The quest to Araby',
  description: 'The boy\'s promise to bring Mangan\'s sister something from the bazaar — a concrete absential decomposed from the romantic longing',
  tags: ['quest', 'promise', 'concrete-goal'],
  holder: boyId,
  origin: 'Conversation with Mangan\'s sister about the bazaar',
  parentAbsential: longingAbsId,
  childAbsentials: [],
  conflictingAbsentials: [],
  relatedEntities: [
    { entityId: mangansId, relationship: EntityAbsentialRelationship.BENEFICIARY, strength: 0.8 },
    { entityId: arabyBazaarId, relationship: EntityAbsentialRelationship.TARGET, strength: 0.7 },
    { entityId: uncleId, relationship: EntityAbsentialRelationship.OBSTACLE, strength: 0.6 },
  ],
  relatedAbsentials: [],
  stateHistory: [{
    timestamp: ts(30),
    data: {
      ...baseState('init', 30),
      type: AbsentialType.GOAL,
      status: AbsentialStatus.UNSATISFIED,
      significance: 0.8,
      urgency: 0.7,
      intensity: 0.8,
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

// Wire parent-child
sys.getModel().absentials[longingAbsId].childAbsentials.push(questAbsId);

// ── Mental Constructs ──

const boyBeliefId = sys.addMentalConstruct({
  name: 'The boy\'s idealized image of Mangan\'s sister',
  description: 'The boy\'s belief that Mangan\'s sister is a figure of transcendent beauty and holiness',
  tags: ['idealization', 'romance', 'self-deception'],
  subject: mangansId,
  holder: boyId,
  isDiegetic: true,
  relatedConstructs: [],
  conflictingConstructs: [],
  supportingConstructs: [],
  stateHistory: [{
    timestamp: ts(5),
    data: {
      ...baseState('init', 5),
      content: 'She is an almost sacred figure, surrounded by light, worthy of a knight\'s quest',
      type: MentalConstructType.BELIEF,
      certainty: CertaintyLevel.CERTAIN,
      awareness: AwarenessLevel.CONSCIOUS,
      emotionalAssociation: { devotion: 0.9, awe: 0.8 },
      salience: 0.95,
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

const boyEpiphanyId = sys.addMentalConstruct({
  name: 'The boy\'s epiphany — self as vain creature',
  description: 'The final realization that his quest was driven by vanity, not love',
  tags: ['epiphany', 'disillusionment', 'self-knowledge'],
  subject: boyId,
  holder: boyId,
  isDiegetic: true,
  relatedConstructs: [boyBeliefId],
  conflictingConstructs: [boyBeliefId],
  supportingConstructs: [],
  stateHistory: [{
    timestamp: ts(95),
    data: {
      ...baseState('init', 95),
      content: 'I saw myself as a creature driven and derided by vanity; and my eyes burned with anguish and anger.',
      type: MentalConstructType.BELIEF,
      certainty: CertaintyLevel.CERTAIN,
      awareness: AwarenessLevel.CONSCIOUS,
      emotionalAssociation: { anguish: 0.9, anger: 0.8, shame: 0.9 },
      salience: 1.0,
    },
    causedBy: {},
  }],
  firstIntroduced: 'init',
});

// ── Span structure ──
// Story → 3 acts → scenes within each

const act1Id = sys.createSpan(rootId, StorySpanType.ACT, 'Act 1: The Street and the Infatuation', 'Establishes setting, characters, and the boy\'s growing obsession', 0, 30);
const act2Id = sys.createSpan(rootId, StorySpanType.ACT, 'Act 2: The Promise and the Waiting', 'The conversation with Mangan\'s sister, the agonizing wait for Saturday', 30, 70);
const act3Id = sys.createSpan(rootId, StorySpanType.ACT, 'Act 3: Araby and the Epiphany', 'The journey to the bazaar and the devastating realization', 70, 100);

const scene1aId = sys.createSpan(act1Id, StorySpanType.SCENE, 'North Richmond Street', 'Description of the blind street, the dead priest, the neighborhood', 0, 10);
const scene1bId = sys.createSpan(act1Id, StorySpanType.SCENE, 'Watching from the shadows', 'The boy watches Mangan\'s sister from the parlour blind every morning', 10, 20);
const scene1cId = sys.createSpan(act1Id, StorySpanType.SCENE, 'The boy\'s inner world', 'His fantasies intensify — carrying her image through the market crowds', 20, 30);

const scene2aId = sys.createSpan(act2Id, StorySpanType.SCENE, 'The conversation at the railing', 'First real conversation with Mangan\'s sister; she mentions the bazaar', 30, 40);
const scene2bId = sys.createSpan(act2Id, StorySpanType.SCENE, 'Days of distraction', 'School becomes unbearable; the boy can think of nothing but Araby', 40, 55);
const scene2cId = sys.createSpan(act2Id, StorySpanType.SCENE, 'Saturday evening — waiting for the uncle', 'The uncle forgets, comes home late and drunk; the boy waits in anguish', 55, 70);

const scene3aId = sys.createSpan(act3Id, StorySpanType.SCENE, 'The train ride', 'Late train to Araby, the boy alone in the carriage', 70, 80);
const scene3bId = sys.createSpan(act3Id, StorySpanType.SCENE, 'The bazaar', 'Nearly empty, stalls closing, a banal flirtation overheard', 80, 95);
const scene3cId = sys.createSpan(act3Id, StorySpanType.SCENE, 'The epiphany', 'The lights go out; the boy sees himself clearly', 95, 100);

// ── Events ──

// Act 1 events
const evt1 = sys.dispatchEvent(scene1aId, {
  type: NarrativeEventType.ENVIRONMENTAL,
  description: 'The narrator describes North Richmond Street as blind, quiet, with the uninhabited house at the end detached from its neighbours',
  timestamp: ts(2),
  cause: { diageticCause: northRichmondId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [],
    newEntities: [],
  },
  significance: 0.5,
});

const evt2 = sys.dispatchEvent(scene1bId, {
  type: NarrativeEventType.ACTION,
  description: 'Every morning the boy watches from the parlour blind for Mangan\'s sister to emerge, then follows her silently through the streets',
  timestamp: ts(12),
  cause: { diageticCause: boyId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [{
      entityId: boyId,
      changes: {
        emotionalState: { ...emptyEmotion(), anticipation: 0.8, joy: 0.5, intensity: 0.6 },
      } as any,
    }],
    newEntities: [],
  },
  significance: 0.7,
});

const evt3 = sys.dispatchEvent(scene1cId, {
  type: NarrativeEventType.REVELATION,
  description: 'The boy carries her image through the market crowds like a chalice through a throng of foes — his devotion takes on religious intensity',
  timestamp: ts(25),
  cause: { diageticCause: boyId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [{
      entityId: boyId,
      changes: {
        emotionalState: { ...emptyEmotion(), anticipation: 0.9, joy: 0.4, intensity: 0.8 },
      } as any,
    }],
    newEntities: [],
  },
  significance: 0.8,
});

// Act 2 events
const evt4 = sys.dispatchEvent(scene2aId, {
  type: NarrativeEventType.DIALOGUE,
  description: 'Mangan\'s sister speaks to the boy for the first time at the railing. She asks if he is going to Araby. He promises to bring her something.',
  timestamp: ts(35),
  cause: { diageticCause: mangansId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [{
      entityId: boyId,
      changes: {
        emotionalState: { ...emptyEmotion(), anticipation: 0.95, joy: 0.7, intensity: 0.9 },
      } as any,
    }],
    newEntities: [],
  },
  significance: 0.9,
});

// This event creates the quest absential — wire it
sys.updateAbsentialStatus(questAbsId, AbsentialStatus.UNSATISFIED, evt4, ts(35));

const evt5 = sys.dispatchEvent(scene2bId, {
  type: NarrativeEventType.ACTION,
  description: 'The boy cannot concentrate at school; the syllables of "Araby" cast an Eastern enchantment over him',
  timestamp: ts(45),
  cause: { diageticCause: boyId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [{
      entityId: boyId,
      changes: {
        emotionalState: { ...emptyEmotion(), anticipation: 0.95, fear: 0.2, intensity: 0.85 },
      } as any,
    }],
    newEntities: [],
  },
  significance: 0.6,
});

const evt6 = sys.dispatchEvent(scene2cId, {
  type: NarrativeEventType.ACTION,
  description: 'Saturday evening: the uncle has not come home. The boy waits in the empty house, watching the clock, growing more desperate.',
  timestamp: ts(60),
  cause: { diageticCause: uncleId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [{
      entityId: boyId,
      changes: {
        emotionalState: { ...emptyEmotion(), anger: 0.5, fear: 0.6, anticipation: 0.9, intensity: 0.9 },
      } as any,
    }],
    newEntities: [],
  },
  significance: 0.8,
});

const evt7 = sys.dispatchEvent(scene2cId, {
  type: NarrativeEventType.DIALOGUE,
  description: 'The uncle finally arrives at 9pm, half-drunk. He has forgotten about Araby. After being reminded, he gives the boy a florin.',
  timestamp: ts(65),
  cause: { diageticCause: uncleId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [
      {
        entityId: coinId,
        changes: { owner: boyId } as any,
      },
      {
        entityId: boyId,
        changes: {
          emotionalState: { ...emptyEmotion(), anger: 0.3, anticipation: 0.8, fear: 0.4, intensity: 0.8 },
        } as any,
      },
    ],
    newEntities: [],
  },
  significance: 0.7,
});

// Act 3 events
const evt8 = sys.dispatchEvent(scene3aId, {
  type: NarrativeEventType.ACTION,
  description: 'The boy takes a late, nearly empty train to the bazaar. He sits alone in a bare carriage.',
  timestamp: ts(75),
  cause: { diageticCause: boyId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [{
      entityId: boyId,
      changes: {
        location: arabyBazaarId,
        emotionalState: { ...emptyEmotion(), anticipation: 0.7, fear: 0.5, intensity: 0.7 },
      } as any,
    }],
    newEntities: [],
  },
  significance: 0.6,
});

const evt9 = sys.dispatchEvent(scene3bId, {
  type: NarrativeEventType.ENVIRONMENTAL,
  description: 'The bazaar is nearly over. Most stalls are closed. The hall is in darkness. The boy hears a banal English flirtation at one of the remaining stalls.',
  timestamp: ts(85),
  cause: { diageticCause: arabyBazaarId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [{
      entityId: boyId,
      changes: {
        emotionalState: { ...emptyEmotion(), sadness: 0.6, anger: 0.4, disgust: 0.3, intensity: 0.7 },
      } as any,
    }],
    newEntities: [],
  },
  significance: 0.8,
});

// Update theme prevalence at the bazaar
sys.dispatchEvent(scene3bId, {
  type: NarrativeEventType.ENVIRONMENTAL,
  description: 'The theme of disillusionment surges as the boy sees the reality of the bazaar',
  timestamp: ts(88),
  cause: { diageticCause: arabyBazaarId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [{
      entityId: disillusionmentId,
      changes: { prevalence: 0.9 } as any,
    }],
    newEntities: [],
  },
  significance: 0.7,
});

const evt10 = sys.dispatchEvent(scene3cId, {
  type: NarrativeEventType.REVELATION,
  description: 'The lights go out in the upper part of the hall. Gazing up into the darkness, the boy sees himself as a creature driven and derided by vanity; his eyes burn with anguish and anger.',
  timestamp: ts(98),
  cause: { diageticCause: boyId, nondiageticCause: '' as any },
  effects: {
    effectOf: '' as any,
    entityChanges: [{
      entityId: boyId,
      changes: {
        emotionalState: { ...emptyEmotion(), sadness: 0.9, anger: 0.8, disgust: 0.7, intensity: 1.0 },
      } as any,
    }],
    newEntities: [],
  },
  significance: 1.0,
});

// Resolve absentials
sys.updateAbsentialStatus(questAbsId, AbsentialStatus.RESOLVED_BLOCKED, evt10, ts(98));
sys.updateAbsentialStatus(longingAbsId, AbsentialStatus.RESOLVED_MIXED, evt10, ts(98));

// Record global tension arc
sys.recordGlobalTension(ts(0), 0.2);
sys.recordGlobalTension(ts(10), 0.3);
sys.recordGlobalTension(ts(25), 0.5);
sys.recordGlobalTension(ts(35), 0.7);
sys.recordGlobalTension(ts(45), 0.6);
sys.recordGlobalTension(ts(60), 0.8);
sys.recordGlobalTension(ts(65), 0.75);
sys.recordGlobalTension(ts(75), 0.7);
sys.recordGlobalTension(ts(85), 0.85);
sys.recordGlobalTension(ts(98), 1.0);

// ── Save ──

const model = sys.getModel();
const filePath = saveStoryModel(model);
console.log(`Story model saved to: ${filePath}`);
console.log(`Characters: ${Object.keys(model.entities.diegetic.characters).length}`);
console.log(`Settings: ${Object.keys(model.entities.diegetic.settings).length}`);
console.log(`Items: ${Object.keys(model.entities.diegetic.items).length}`);
console.log(`Themes: ${Object.keys(model.entities.nonDiegetic.themes).length}`);
console.log(`Symbols: ${Object.keys(model.entities.nonDiegetic.symbols).length}`);
console.log(`Narrators: ${Object.keys(model.entities.nonDiegetic.narrators).length}`);
console.log(`Events: ${Object.keys(model.events).length}`);
console.log(`Absentials: ${Object.keys(model.absentials).length}`);
console.log(`Relationships: ${Object.keys(model.relationships.interpersonal).length + Object.keys(model.relationships.group).length + Object.keys(model.relationships.symbolic).length}`);
console.log(`Mental Constructs: ${Object.keys(model.mentalConstructs).length}`);
console.log(`Root span children: ${model.rootSpan.childSpans.length}`);
console.log(`Total scenes: ${model.rootSpan.childSpans.reduce((n, act) => n + act.childSpans.length, 0)}`);
