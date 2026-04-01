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
  RelationshipLabel,
  AbsentialType,
  AbsentialStatus,
  EntityAbsentialRelationship,
  MentalConstructType,
  CertaintyLevel,
  AwarenessLevel,
  InterpersonalRelationship,
} from './types';

// ── Helpers ──

function ts(pct: number) { return { percentage: pct }; }
function loc(start: number, end: number) { return { startLine: start, endLine: end }; }
function emptyEmotion() { return { joy: 0, trust: 0, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 0, intensity: 0 }; }
function base(eventId: string) {
  return { version: 'v1', activeAbsentials: [] as string[], currentRelationships: [] as string[], generatedBy: eventId };
}

// ════════════════════════════════════════════════════════
//  PASS 1: Text Annotation (neutral, exhaustive)
// ════════════════════════════════════════════════════════

const sys = new NarrativeAnalysisSystem(
  'Araby',
  'James Joyce',
  'A boy in Dublin becomes infatuated with his friend\'s sister and promises to bring her something from the Araby bazaar, only to arrive too late and experience a moment of devastating self-awareness.'
);

const rootId = sys.getRootSpanId();

// ── Settings ──

const northRichmondId = sys.addSetting({
  name: 'North Richmond Street', description: 'A blind (dead-end) street in Dublin',
  tags: ['dublin', 'residential', 'dead-end'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Dead-end street in north Dublin',
  climate: 'Damp, cold, winter', historicalContext: 'Turn-of-century Dublin under British rule',
  culturalBackground: 'Catholic, working-class Irish',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { light: 0.3, warmth: 0.2 }, culturalNorms: { catholicism: 0.9, propriety: 0.8 }, tension: 0.2, atmosphere: 'quiet, decaying, suffocating' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const houseId = sys.addSetting({
  name: 'The boy\'s house (former priest\'s house)', description: 'House at the blind end, formerly inhabited by a dead priest',
  tags: ['domestic', 'gloomy', 'religious-remnants'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'End of North Richmond Street',
  climate: 'Cold, damp interior', historicalContext: 'Previous tenant was a priest who died in the back drawing-room',
  culturalBackground: 'Catholic household', parentSetting: northRichmondId,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { light: 0.2, mustiness: 0.8 }, culturalNorms: { catholicism: 0.9 }, tension: 0.1, atmosphere: 'musty, dark, haunted by absence' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const backDrawingRoomId = sys.addSetting({
  name: 'The back drawing-room', description: 'Room where the priest died; the boy retreats here for private emotional experiences',
  tags: ['domestic', 'death', 'devotion'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Back room of the house',
  climate: 'Dark, damp', historicalContext: 'The priest died here',
  culturalBackground: 'Residual religious atmosphere', parentSetting: houseId,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { light: 0.1, rain: 0.7 }, culturalNorms: {}, tension: 0.3, atmosphere: 'dark, rainy, intimate' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const wildGardenId = sys.addSetting({
  name: 'The wild garden', description: 'Overgrown garden behind the house with a central apple-tree and straggling bushes',
  tags: ['garden', 'decay', 'nature'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Behind the house',
  climate: 'Overgrown, damp', historicalContext: 'Part of the priest\'s former property',
  culturalBackground: 'Neglected', parentSetting: houseId,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { wildness: 0.8 }, culturalNorms: {}, tension: 0, atmosphere: 'wild, neglected' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const marketStreetsId = sys.addSetting({
  name: 'The market streets', description: 'Flaring streets jostled by drunken men and bargaining women on Saturday evenings',
  tags: ['commercial', 'sensory', 'hostile'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Dublin market area',
  climate: 'Cold, busy', historicalContext: 'Saturday evening markets',
  culturalBackground: 'Working-class commerce, street-singers, labourers',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { noise: 0.9, crowding: 0.8, light: 0.6 }, culturalNorms: { commerce: 0.9 }, tension: 0.3, atmosphere: 'flaring, hostile to romance' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const classroomId = sys.addSetting({
  name: 'The classroom', description: 'The boy\'s school where he cannot concentrate',
  tags: ['school', 'constraint', 'distraction'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Unspecified Dublin school',
  climate: 'Indoor', historicalContext: 'Christian Brothers\' School',
  culturalBackground: 'Catholic education',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: {}, culturalNorms: { discipline: 0.8 }, tension: 0.2, atmosphere: 'tedious, constraining' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const buckinghamStId = sys.addSetting({
  name: 'Buckingham Street / the station', description: 'Street leading to the train station; the boy walks here clutching the florin',
  tags: ['transit', 'journey'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Street near the train station',
  climate: 'Night, gas-lit', historicalContext: 'Dublin infrastructure',
  culturalBackground: 'Commercial Dublin',
  stateHistory: [{ timestamp: ts(70), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { light: 0.5, crowding: 0.6 }, culturalNorms: {}, tension: 0.5, atmosphere: 'thronged with buyers, glaring with gas' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const trainCarriageId = sys.addSetting({
  name: 'The train carriage', description: 'A deserted third-class carriage on the special train to the bazaar',
  tags: ['transit', 'isolation'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Dublin rail line',
  climate: 'Cold, bare', historicalContext: 'Special train for bazaar-goers',
  culturalBackground: 'Third-class',
  stateHistory: [{ timestamp: ts(73), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { emptiness: 0.9 }, culturalNorms: {}, tension: 0.4, atmosphere: 'bare, deserted, slow' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const arabyHallId = sys.addSetting({
  name: 'Araby bazaar', description: 'A large hall displaying the magical name, nearly empty and closing',
  tags: ['bazaar', 'exotic', 'commercial', 'disillusionment'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Large hall in Dublin',
  climate: 'Dark, closing down', historicalContext: 'Charity bazaars were common in Dublin',
  culturalBackground: 'Pseudo-oriental commercial spectacle',
  stateHistory: [{ timestamp: ts(80), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { light: 0.2, emptiness: 0.8 }, culturalNorms: { commerce: 0.9 }, tension: 0.6, atmosphere: 'dark, nearly empty, church-like silence' }, causedBy: {} }],
  firstIntroduced: 'init',
});

// ── Characters ──

const boyId = sys.addCharacter({
  name: 'The boy (narrator as child)', description: 'Unnamed boy consumed by a romantic infatuation',
  tags: ['protagonist', 'youth', 'romantic', 'naive'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: { ...emptyEmotion(), anticipation: 0.6, joy: 0.3, intensity: 0.4 }, mentalConstructs: [], inventory: [], location: northRichmondId, factionRelationships: {}, age: 12, gender: 'male', occupation: 'student', personalityTraits: ['imaginative', 'sensitive', 'earnest', 'naive'], coreValues: ['devotion', 'romance', 'adventure'], physicalDescription: 'Young boy, unspecified', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const mangansId = sys.addCharacter({
  name: 'Mangan\'s sister', description: 'Unnamed older sister of the boy\'s friend, object of his infatuation',
  tags: ['love-interest', 'unattainable', 'idealized'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: northRichmondId, factionRelationships: {}, age: 14, gender: 'female', occupation: 'student (convent)', personalityTraits: ['graceful', 'distant'], coreValues: [], physicalDescription: 'Figure defined by light from half-opened door, soft rope of hair, silver bracelet', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const uncleId = sys.addCharacter({
  name: 'The uncle', description: 'The boy\'s uncle and guardian, often drunk, forgetful',
  tags: ['guardian', 'obstacle', 'unreliable'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: houseId, factionRelationships: {}, age: 45, gender: 'male', occupation: 'unspecified', personalityTraits: ['forgetful', 'well-meaning', 'unreliable'], coreValues: [], physicalDescription: 'Unspecified', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const auntId = sys.addCharacter({
  name: 'The aunt', description: 'The boy\'s aunt, a cautious domestic presence',
  tags: ['guardian', 'domestic'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: houseId, factionRelationships: {}, age: 40, gender: 'female', occupation: 'homemaker', personalityTraits: ['cautious', 'practical', 'devout'], coreValues: ['propriety', 'religion'], physicalDescription: 'Unspecified', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const manganId = sys.addCharacter({
  name: 'Mangan', description: 'The boy\'s friend, brother of the girl, barely individuated',
  tags: ['friend', 'minor'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: northRichmondId, factionRelationships: {}, age: 12, gender: 'male', occupation: 'student', personalityTraits: [], coreValues: [], physicalDescription: 'Unspecified', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const mrsMercerId = sys.addCharacter({
  name: 'Mrs. Mercer', description: 'A garrulous old pawnbroker\'s widow who collects used stamps for pious purposes',
  tags: ['minor', 'obstacle', 'pious'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(55), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: houseId, factionRelationships: {}, age: 65, gender: 'female', occupation: 'pawnbroker\'s widow', personalityTraits: ['garrulous', 'pious'], coreValues: ['piety'], physicalDescription: 'Old', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const schoolmasterId = sys.addCharacter({
  name: 'The schoolmaster', description: 'The boy\'s teacher, notices his declining attention',
  tags: ['minor', 'authority'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(40), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: classroomId, factionRelationships: {}, age: 40, gender: 'male', occupation: 'teacher', personalityTraits: ['stern', 'observant'], coreValues: ['discipline'], physicalDescription: 'Face passes from amiability to sternness', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const stallLadyId = sys.addCharacter({
  name: 'The young lady at the stall', description: 'A young woman flirting with two gentlemen at a bazaar stall, speaks to the boy without interest',
  tags: ['minor', 'mirror', 'english'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(83), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: arabyHallId, factionRelationships: {}, age: 22, gender: 'female', occupation: 'stall attendant', personalityTraits: ['flirtatious', 'indifferent'], coreValues: [], physicalDescription: 'Unspecified', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const twoGentlemenId = sys.addCharacter({
  name: 'The two young gentlemen', description: 'Two young men with English accents flirting with the stall lady',
  tags: ['minor', 'english'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(83), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: arabyHallId, factionRelationships: {}, age: 25, gender: 'male', occupation: 'unspecified', personalityTraits: [], coreValues: [], physicalDescription: 'English accents noted', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const turnstileManId = sys.addCharacter({
  name: 'The weary-looking man', description: 'Man at the turnstile who takes the boy\'s shilling',
  tags: ['minor', 'incidental'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(80), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: arabyHallId, factionRelationships: {}, age: 50, gender: 'male', occupation: 'turnstile attendant', personalityTraits: ['weary'], coreValues: [], physicalDescription: 'Weary-looking', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const deadPriestId = sys.addCharacter({
  name: 'The dead priest', description: 'Former tenant who died in the back drawing-room; an absent presence haunting the house',
  tags: ['absent', 'death', 'religion'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: houseId, factionRelationships: {}, age: 0, gender: 'male', occupation: 'priest (deceased)', personalityTraits: ['charitable'], coreValues: ['charity', 'religion'], physicalDescription: 'Deceased', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
  lastSeen: 'init',
});

// ── Items ──

const bookAbbot = sys.addItem({
  name: 'The Abbot (Walter Scott)', description: 'A romantic historical novel found among the dead priest\'s papers',
  tags: ['book', 'priest', 'romance'], type: DiegeticEntityType.ITEM, itemType: 'book',
  origin: 'The dead priest\'s collection', physicalDescription: 'Paper-covered, curled and damp pages',
  defaultFunction: 'Reading material',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), location: houseId, condition: 'damp, curled pages', owner: null, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

const bookDevout = sys.addItem({
  name: 'The Devout Communicant', description: 'A religious text found among the dead priest\'s papers',
  tags: ['book', 'priest', 'religion'], type: DiegeticEntityType.ITEM, itemType: 'book',
  origin: 'The dead priest\'s collection', physicalDescription: 'Paper-covered, curled and damp pages',
  defaultFunction: 'Religious instruction',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), location: houseId, condition: 'damp, curled pages', owner: null, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

const bookVidocq = sys.addItem({
  name: 'The Memoirs of Vidocq', description: 'Memoirs of a French criminal-turned-detective; the boy liked it best because its leaves were yellow',
  tags: ['book', 'priest', 'adventure', 'secular'], type: DiegeticEntityType.ITEM, itemType: 'book',
  origin: 'The dead priest\'s collection', physicalDescription: 'Yellow leaves',
  defaultFunction: 'Entertainment / adventure reading',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), location: houseId, condition: 'yellow leaves', owner: null, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

const bicyclePump = sys.addItem({
  name: 'The rusty bicycle-pump', description: 'Found under a bush in the wild garden, belonging to the dead priest',
  tags: ['priest', 'decay', 'mundane'], type: DiegeticEntityType.ITEM, itemType: 'bicycle part',
  origin: 'The dead priest\'s possessions', physicalDescription: 'Rusty',
  defaultFunction: 'Inflating bicycle tyres (now useless)',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), location: wildGardenId, condition: 'rusty', owner: null, isHidden: true }, causedBy: {} }],
  firstIntroduced: 'init',
});

const silverBracelet = sys.addItem({
  name: 'The silver bracelet', description: 'Bracelet on Mangan\'s sister\'s wrist, which she turns round and round during the conversation',
  tags: ['jewelry', 'sensory', 'iconic'], type: DiegeticEntityType.ITEM, itemType: 'jewelry',
  origin: 'Unknown', physicalDescription: 'Silver bracelet',
  defaultFunction: 'Adornment',
  stateHistory: [{ timestamp: ts(30), data: { ...base('init'), location: mangansId, condition: 'normal', owner: mangansId, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

const florin = sys.addItem({
  name: 'The florin', description: 'Two-shilling coin the uncle gives the boy for the bazaar',
  tags: ['money', 'permission'], type: DiegeticEntityType.ITEM, itemType: 'coin',
  origin: 'The uncle', physicalDescription: 'A florin (two shillings)',
  defaultFunction: 'Currency for Araby',
  stateHistory: [{ timestamp: ts(65), data: { ...base('init'), location: houseId, condition: 'normal', owner: uncleId, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

const remainingCoins = sys.addItem({
  name: 'Two pennies and a sixpence', description: 'The boy\'s remaining change after paying entrance; he lets them fall against each other',
  tags: ['money', 'failure', 'sound'], type: DiegeticEntityType.ITEM, itemType: 'coins',
  origin: 'Change from bazaar entrance fee', physicalDescription: 'Two pennies and a sixpence',
  defaultFunction: 'Insufficient currency',
  stateHistory: [{ timestamp: ts(85), data: { ...base('init'), location: boyId, condition: 'in pocket', owner: boyId, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

// ── Relationships ──

sys.addInterpersonalRelationship({
  id: 'rel_boy_mangans', type: RelationshipType.INTERPERSONAL,
  participants: [boyId, mangansId], nature: 'One-sided romantic infatuation',
  name: 'Boy → Mangan\'s sister', description: 'The boy\'s consuming, idealized love',
  tags: ['romance', 'unrequited', 'idealized'],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), strength: 0.8, dynamics: { power: -0.7, influence: 0.9, conflict: 0.1 }, label: RelationshipLabel.LOVER, specificLabel: 'unrequited infatuation' }, causedBy: {} }],
  firstIntroduced: 'init',
} as InterpersonalRelationship);

sys.addInterpersonalRelationship({
  id: 'rel_boy_uncle', type: RelationshipType.INTERPERSONAL,
  participants: [boyId, uncleId], nature: 'Guardian-ward, marked by negligence',
  name: 'Boy ↔ Uncle', description: 'Dependent on unreliable guardian',
  tags: ['family', 'guardian', 'obstacle'],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), strength: 0.4, dynamics: { power: -0.8, influence: 0.3, conflict: 0.3 }, label: RelationshipLabel.FAMILY }, causedBy: {} }],
  firstIntroduced: 'init',
} as InterpersonalRelationship);

sys.addInterpersonalRelationship({
  id: 'rel_boy_mangan', type: RelationshipType.INTERPERSONAL,
  participants: [boyId, manganId], nature: 'Childhood friendship',
  name: 'Boy ↔ Mangan', description: 'Friends who play in the street together',
  tags: ['friendship', 'childhood'],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), strength: 0.5, dynamics: { power: 0, influence: 0.2, conflict: 0 }, label: RelationshipLabel.FRIEND }, causedBy: {} }],
  firstIntroduced: 'init',
} as InterpersonalRelationship);

sys.addInterpersonalRelationship({
  id: 'rel_uncle_aunt', type: RelationshipType.INTERPERSONAL,
  participants: [uncleId, auntId], nature: 'Married couple, domestic tension',
  name: 'Uncle ↔ Aunt', description: 'The aunt manages the uncle\'s shortcomings',
  tags: ['marriage', 'domestic'],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), strength: 0.5, dynamics: { power: -0.2, influence: 0.4, conflict: 0.3 }, label: RelationshipLabel.FAMILY }, causedBy: {} }],
  firstIntroduced: 'init',
} as InterpersonalRelationship);

// ── Absentials ──

const absLonging = sys.addAbsential({
  name: 'The boy\'s romantic longing', description: 'Unfulfilled desire to connect with Mangan\'s sister',
  tags: ['desire', 'romance', 'core-driver'], holder: boyId, origin: 'Idealized perception of Mangan\'s sister',
  childAbsentials: [], conflictingAbsentials: [],
  relatedEntities: [{ entityId: mangansId, relationship: EntityAbsentialRelationship.TARGET, strength: 0.9 }],
  relatedAbsentials: [],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), type: AbsentialType.DESIRE, status: AbsentialStatus.UNSATISFIED, urgency: 0.5, intensity: 0.7 }, causedBy: {} }],
  firstIntroduced: 'init',
});

const absSpeak = sys.addAbsential({
  name: 'The boy\'s desire to speak to her', description: 'Desire to actually talk to Mangan\'s sister',
  tags: ['desire', 'communication'], holder: boyId, origin: 'The silent watching/following ritual',
  parentAbsential: absLonging, childAbsentials: [], conflictingAbsentials: [],
  relatedEntities: [{ entityId: mangansId, relationship: EntityAbsentialRelationship.TARGET, strength: 0.7 }],
  relatedAbsentials: [],
  stateHistory: [{ timestamp: ts(10), data: { ...base('init'), type: AbsentialType.DESIRE, status: AbsentialStatus.UNSATISFIED, urgency: 0.6, intensity: 0.5 }, causedBy: {} }],
  firstIntroduced: 'init',
});

const absQuest = sys.addAbsential({
  name: 'The quest to Araby', description: 'Promise to bring Mangan\'s sister something from the bazaar',
  tags: ['quest', 'promise', 'concrete-goal'], holder: boyId, origin: 'The conversation at the railing',
  parentAbsential: absLonging, childAbsentials: [], conflictingAbsentials: [],
  relatedEntities: [
    { entityId: mangansId, relationship: EntityAbsentialRelationship.BENEFICIARY, strength: 0.8 },
    { entityId: arabyHallId, relationship: EntityAbsentialRelationship.TARGET, strength: 0.7 },
    { entityId: uncleId, relationship: EntityAbsentialRelationship.OBSTACLE, strength: 0.6 },
  ],
  relatedAbsentials: [],
  stateHistory: [{ timestamp: ts(35), data: { ...base('init'), type: AbsentialType.GOAL, status: AbsentialStatus.UNSATISFIED, urgency: 0.7, intensity: 0.8 }, causedBy: {} }],
  firstIntroduced: 'init',
});

const absMangansWish = sys.addAbsential({
  name: 'Mangan\'s sister\'s wish to attend Araby', description: 'She would love to go but cannot because of a convent retreat',
  tags: ['desire', 'blocked', 'convent'], holder: mangansId, origin: 'Mentioned during the conversation',
  childAbsentials: [], conflictingAbsentials: [],
  relatedEntities: [{ entityId: arabyHallId, relationship: EntityAbsentialRelationship.TARGET, strength: 0.5 }],
  relatedAbsentials: [],
  stateHistory: [{ timestamp: ts(35), data: { ...base('init'), type: AbsentialType.DESIRE, status: AbsentialStatus.RESOLVED_BLOCKED, urgency: 0.3, intensity: 0.3 }, causedBy: {} }],
  firstIntroduced: 'init',
});

const absPriestAbsence = sys.addAbsential({
  name: 'The dead priest\'s lingering absence', description: 'The priest is gone but his traces — books, bicycle-pump, musty air — permeate the house',
  tags: ['absence', 'death', 'atmosphere'], holder: deadPriestId, origin: 'Death of the former tenant',
  childAbsentials: [], conflictingAbsentials: [],
  relatedEntities: [{ entityId: houseId, relationship: EntityAbsentialRelationship.INFLUENCED_BY, strength: 0.7 }],
  relatedAbsentials: [],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), type: AbsentialType.LACK, status: AbsentialStatus.UNSATISFIED, urgency: 0, intensity: 0.4 }, causedBy: {} }],
  firstIntroduced: 'init',
});

// Wire parent-child absentials
const model = sys.getModel();
model.text.absentials[absLonging].childAbsentials.push(absSpeak, absQuest);

// ── Diegetic mental constructs ──

const mcBoyIdealImage = sys.addMentalConstruct({
  name: 'The boy\'s idealized image of Mangan\'s sister',
  description: 'A near-sacred figure surrounded by light, worthy of devotion',
  tags: ['idealization', 'romance'], subject: mangansId, holder: boyId, isDiegetic: true,
  relatedConstructs: [], conflictingConstructs: [], supportingConstructs: [],
  stateHistory: [{ timestamp: ts(5), data: { ...base('init'), content: 'She is an almost sacred figure, surrounded by light', type: MentalConstructType.BELIEF, certainty: CertaintyLevel.CERTAIN, awareness: AwarenessLevel.CONSCIOUS, emotionalAssociation: { devotion: 0.9, awe: 0.8 }, salience: 0.95 }, causedBy: {} }],
  firstIntroduced: 'init',
});

const mcBoyArabyFantasy = sys.addMentalConstruct({
  name: 'The boy\'s fantasy of Araby',
  description: 'The word "Araby" casts an Eastern enchantment — the bazaar as exotic quest destination',
  tags: ['fantasy', 'orientalism'], subject: arabyHallId, holder: boyId, isDiegetic: true,
  relatedConstructs: [mcBoyIdealImage], conflictingConstructs: [], supportingConstructs: [mcBoyIdealImage],
  stateHistory: [{ timestamp: ts(38), data: { ...base('init'), content: 'The syllables of Araby cast an Eastern enchantment over me', type: MentalConstructType.BELIEF, certainty: CertaintyLevel.CERTAIN, awareness: AwarenessLevel.CONSCIOUS, emotionalAssociation: { enchantment: 0.9, anticipation: 0.8 }, salience: 0.9 }, causedBy: {} }],
  firstIntroduced: 'init',
});

const mcAuntSuspicion = sys.addMentalConstruct({
  name: 'The aunt\'s suspicion about Freemasonry',
  description: 'The aunt hopes the bazaar is not some Freemason affair',
  tags: ['suspicion', 'religion', 'social-anxiety'], subject: arabyHallId, holder: auntId, isDiegetic: true,
  relatedConstructs: [], conflictingConstructs: [], supportingConstructs: [],
  stateHistory: [{ timestamp: ts(42), data: { ...base('init'), content: 'Hopes it is not some Freemason affair', type: MentalConstructType.SPECULATION, certainty: CertaintyLevel.DOUBTFUL, awareness: AwarenessLevel.CONSCIOUS, emotionalAssociation: { suspicion: 0.5 }, salience: 0.3 }, causedBy: {} }],
  firstIntroduced: 'init',
});

// ── Span structure ──

const act1Id = sys.createSpan(rootId, StorySpanType.ACT, 'Act 1: The Street and the Infatuation', 'Setting, characters, the boy\'s growing obsession', 0, 34);
const act2Id = sys.createSpan(rootId, StorySpanType.ACT, 'Act 2: The Promise and the Waiting', 'The conversation, the agonizing wait', 34, 72);
const act3Id = sys.createSpan(rootId, StorySpanType.ACT, 'Act 3: Araby and the Epiphany', 'The journey and devastating realization', 72, 100);

const s1a = sys.createSpan(act1Id, StorySpanType.SCENE, 'North Richmond Street described', 'The blind street, the dead priest, the house', 0, 9);
const s1b = sys.createSpan(act1Id, StorySpanType.SCENE, 'Street play and first sightings', 'Winter evenings, play, watching Mangan\'s sister', 9, 18);
const s1c = sys.createSpan(act1Id, StorySpanType.SCENE, 'The daily ritual of following', 'Morning watching, following her through the streets', 18, 23);
const s1d = sys.createSpan(act1Id, StorySpanType.SCENE, 'The chalice passage', 'Her image in hostile places, the market, the chalice metaphor', 23, 30);
const s1e = sys.createSpan(act1Id, StorySpanType.SCENE, 'The back drawing-room', '"O love! O love!" in the room where the priest died', 30, 34);

const s2a = sys.createSpan(act2Id, StorySpanType.SCENE, 'The conversation at the railing', 'First real exchange, Araby mentioned, the promise', 34, 42);
const s2b = sys.createSpan(act2Id, StorySpanType.SCENE, 'Days of distraction', 'School, enchantment, the aunt\'s Freemasonry comment', 42, 50);
const s2c = sys.createSpan(act2Id, StorySpanType.SCENE, 'Saturday — waiting for the uncle', 'Clock-watching, Mrs. Mercer, the uncle arrives late', 50, 68);
const s2d = sys.createSpan(act2Id, StorySpanType.SCENE, 'The uncle gives money', 'Uncle drunk, forgotten, aunt intervenes, Arab\'s Farewell', 68, 72);

const s3a = sys.createSpan(act3Id, StorySpanType.SCENE, 'The journey', 'Buckingham Street, the train ride', 72, 80);
const s3b = sys.createSpan(act3Id, StorySpanType.SCENE, 'Arriving at the bazaar', 'Turnstile, the dark hall, church-like silence, coins on salver', 80, 86);
const s3c = sys.createSpan(act3Id, StorySpanType.SCENE, 'The stall and the flirtation', 'Overhearing the banal English flirtation, the young lady\'s question', 86, 95);
const s3d = sys.createSpan(act3Id, StorySpanType.SCENE, 'The epiphany', 'The lights go out, the boy sees himself clearly', 95, 100);

// ── Events (beat by beat, anchored to text) ──

const e01 = sys.addEvent(s1a, {
  type: NarrativeEventType.ENVIRONMENTAL,
  description: 'North Richmond Street described as blind, quiet except when the Christian Brothers\' School sets boys free. Uninhabited house at the blind end.',
  timestamp: ts(1), textLocation: loc(4, 9), participants: [northRichmondId],
});

const e02 = sys.addEvent(s1a, {
  type: NarrativeEventType.ENVIRONMENTAL,
  description: 'The dead priest\'s legacy: musty air, waste room littered with papers, three books found (The Abbot, The Devout Communicant, The Memoirs of Vidocq). Rusty bicycle-pump in the wild garden.',
  timestamp: ts(3), textLocation: loc(11, 21), participants: [deadPriestId, houseId, bookAbbot, bookDevout, bookVidocq, bicyclePump, wildGardenId],
  precedingEvent: e01,
});

const e03 = sys.addEvent(s1b, {
  type: NarrativeEventType.ACTION,
  description: 'Winter evenings: the boys play in the dark streets, running through muddy lanes, past dark gardens and odorous stables. If the uncle is seen they hide; if Mangan\'s sister appears they watch from the shadow.',
  timestamp: ts(10), textLocation: loc(23, 43), participants: [boyId, manganId, uncleId, mangansId, northRichmondId],
  precedingEvent: e02,
});

const e04 = sys.addEvent(s1b, {
  type: NarrativeEventType.ENVIRONMENTAL,
  description: 'Mangan\'s sister appears at the doorstep to call her brother. Her figure defined by the light from the half-opened door, dress swinging, soft rope of hair tossed from side to side.',
  timestamp: ts(14), textLocation: loc(36, 43), participants: [mangansId, manganId, boyId],
  precedingEvent: e03,
});

const e05 = sys.addEvent(s1c, {
  type: NarrativeEventType.ACTION,
  description: 'Every morning the boy lies on the floor in the front parlour watching her door through the blind, then follows her silently through the streets, quickening his pace to pass her.',
  timestamp: ts(19), textLocation: loc(45, 53), participants: [boyId, mangansId],
  precedingEvent: e04,
});

const e06 = sys.addEvent(s1d, {
  type: NarrativeEventType.ACTION,
  description: 'Her image accompanies the boy to the Saturday market with his aunt. Amid drunken men, bargaining women, street-singers chanting about O\'Donovan Rossa. He imagines bearing his chalice safely through a throng of foes.',
  timestamp: ts(25), textLocation: loc(55, 63), participants: [boyId, mangansId, auntId, marketStreetsId],
  precedingEvent: e05,
});

const e07 = sys.addEvent(s1d, {
  type: NarrativeEventType.REVELATION,
  description: 'Strange prayers and praises spring to the boy\'s lips. His eyes fill with tears he cannot explain. His body is like a harp and her words and gestures are like fingers running upon the wires.',
  timestamp: ts(28), textLocation: loc(63, 70), participants: [boyId, mangansId],
  precedingEvent: e06,
});

const e08 = sys.addEvent(s1e, {
  type: NarrativeEventType.REVELATION,
  description: 'In the back drawing-room where the priest died, on a dark rainy evening, the boy presses his palms together and murmurs "O love! O love!" many times.',
  timestamp: ts(32), textLocation: loc(72, 80), participants: [boyId, backDrawingRoomId, deadPriestId],
  precedingEvent: e07,
});

const e09 = sys.addEvent(s2a, {
  type: NarrativeEventType.DIALOGUE,
  description: 'At last she speaks to him. She asks if he is going to Araby. She cannot go because of a convent retreat. She turns a silver bracelet round and round her wrist. Light catches the white curve of her neck.',
  timestamp: ts(36), textLocation: loc(82, 97), participants: [boyId, mangansId, silverBracelet],
  precedingEvent: e08,
});

// Resolve absSpeak
sys.updateAbsentialStatus(absSpeak, AbsentialStatus.RESOLVED_SATISFIED, e09, ts(36));

const e10 = sys.addEvent(s2a, {
  type: NarrativeEventType.DIALOGUE,
  description: '"If I go," I said, "I will bring you something." The boy makes the promise.',
  timestamp: ts(40), textLocation: loc(99, 101), participants: [boyId, mangansId],
  precedingEvent: e09,
});

const e11 = sys.addEvent(s2b, {
  type: NarrativeEventType.ACTION,
  description: 'Days of distraction: the boy wishes to annihilate the intervening days, chafes against school. The syllables of "Araby" cast an Eastern enchantment. Her image comes between him and the page.',
  timestamp: ts(44), textLocation: loc(103, 108), participants: [boyId, classroomId, schoolmasterId],
  precedingEvent: e10,
});

const e12 = sys.addEvent(s2b, {
  type: NarrativeEventType.DIALOGUE,
  description: 'The boy asks for leave to go to the bazaar on Saturday night. His aunt is surprised and hopes it is not some Freemason affair.',
  timestamp: ts(46), textLocation: loc(109, 110), participants: [boyId, auntId],
  precedingEvent: e11,
});

const e13 = sys.addEvent(s2b, {
  type: NarrativeEventType.ACTION,
  description: 'The schoolmaster\'s face passes from amiability to sternness; he hopes the boy is not beginning to idle.',
  timestamp: ts(48), textLocation: loc(111, 112), participants: [schoolmasterId, boyId],
  precedingEvent: e12,
});

const e14 = sys.addEvent(s2c, {
  type: NarrativeEventType.DIALOGUE,
  description: 'Saturday morning: the boy reminds his uncle about the bazaar. "Yes, boy, I know." The uncle is fussing at the hallstand.',
  timestamp: ts(51), textLocation: loc(117, 122), participants: [boyId, uncleId],
  precedingEvent: e13,
});

const e15 = sys.addEvent(s2c, {
  type: NarrativeEventType.ACTION,
  description: 'The boy sits staring at the clock. Mounts the staircase, sings in the empty rooms. From the front window watches companions playing, looks at the dark house where she lives, sees her brown-clad figure cast by imagination.',
  timestamp: ts(55), textLocation: loc(127, 137), participants: [boyId, houseId, mangansId],
  precedingEvent: e14,
});

const e16 = sys.addEvent(s2c, {
  type: NarrativeEventType.ACTION,
  description: 'Mrs. Mercer arrives, sits at the fire. The boy endures the gossip of the tea-table. The meal stretches beyond an hour. Mrs. Mercer leaves after eight o\'clock.',
  timestamp: ts(58), textLocation: loc(139, 145), participants: [mrsMercerId, boyId, auntId, houseId],
  precedingEvent: e15,
});

const e17 = sys.addEvent(s2c, {
  type: NarrativeEventType.DIALOGUE,
  description: 'The aunt says: "I\'m afraid you may put off your bazaar for this night of Our Lord."',
  timestamp: ts(62), textLocation: loc(146, 148), participants: [auntId, boyId],
  precedingEvent: e16,
});

const e18 = sys.addEvent(s2d, {
  type: NarrativeEventType.ACTION,
  description: 'At nine o\'clock the uncle\'s latchkey in the halldoor. He talks to himself, the hallstand rocks under his overcoat. The boy interprets these signs. The uncle has forgotten about the bazaar.',
  timestamp: ts(68), textLocation: loc(150, 154), participants: [uncleId, boyId, houseId],
  precedingEvent: e17,
});

const e19 = sys.addEvent(s2d, {
  type: NarrativeEventType.DIALOGUE,
  description: 'The aunt intervenes: "Can\'t you give him the money and let him go? You\'ve kept him late enough as it is." The uncle apologizes, quotes "All work and no play," asks about The Arab\'s Farewell to his Steed.',
  timestamp: ts(70), textLocation: loc(156, 168), participants: [auntId, uncleId, boyId, florin],
  precedingEvent: e18,
});

const e20 = sys.addEvent(s3a, {
  type: NarrativeEventType.ACTION,
  description: 'The boy holds a florin tightly, strides down Buckingham Street. The streets thronged with buyers, glaring with gas. He takes a seat in a third-class carriage of a deserted train.',
  timestamp: ts(74), textLocation: loc(170, 178), participants: [boyId, florin, buckinghamStId, trainCarriageId],
  precedingEvent: e19,
});

const e21 = sys.addEvent(s3a, {
  type: NarrativeEventType.ACTION,
  description: 'After intolerable delay the train creeps among ruinous houses, over the twinkling river. At Westland Row a crowd is pressed back — special train for the bazaar. The boy remains alone.',
  timestamp: ts(77), textLocation: loc(174, 179), participants: [boyId, trainCarriageId],
  precedingEvent: e20,
});

const e22 = sys.addEvent(s3b, {
  type: NarrativeEventType.ACTION,
  description: 'The boy passes through a turnstile, handing a shilling to a weary-looking man. He finds himself in a big hall girdled by a gallery. Nearly all stalls closed, greater part in darkness.',
  timestamp: ts(82), textLocation: loc(184, 189), participants: [boyId, turnstileManId, arabyHallId],
  precedingEvent: e21,
});

const e23 = sys.addEvent(s3b, {
  type: NarrativeEventType.ENVIRONMENTAL,
  description: 'A silence like that which pervades a church after a service. Two men counting money on a salver. The fall of the coins.',
  timestamp: ts(84), textLocation: loc(188, 193), participants: [boyId, arabyHallId],
  precedingEvent: e22,
});

const e24 = sys.addEvent(s3c, {
  type: NarrativeEventType.ACTION,
  description: 'Remembering with difficulty why he had come, the boy examines porcelain vases and flowered tea-sets at a stall.',
  timestamp: ts(87), textLocation: loc(195, 196), participants: [boyId, arabyHallId],
  precedingEvent: e23,
});

const e25 = sys.addEvent(s3c, {
  type: NarrativeEventType.DIALOGUE,
  description: 'A young lady is talking and laughing with two young gentlemen. The boy remarks their English accents. Banal flirtation: "O, I never said such a thing!" / "O, but you did!" / "O, there\'s a ... fib!"',
  timestamp: ts(89), textLocation: loc(197, 211), participants: [stallLadyId, twoGentlemenId, boyId],
  precedingEvent: e24,
});

const e26 = sys.addEvent(s3c, {
  type: NarrativeEventType.DIALOGUE,
  description: 'The young lady comes over and asks if he wishes to buy anything. Her tone is not encouraging — she speaks out of a sense of duty. The boy murmurs "No, thank you."',
  timestamp: ts(91), textLocation: loc(213, 219), participants: [stallLadyId, boyId],
  precedingEvent: e25,
});

const e27 = sys.addEvent(s3c, {
  type: NarrativeEventType.ACTION,
  description: 'The boy lingers before her stall to make his interest seem real, then turns away. He allows the two pennies to fall against the sixpence in his pocket.',
  timestamp: ts(93), textLocation: loc(225, 228), participants: [boyId, remainingCoins],
  precedingEvent: e26,
});

const e28 = sys.addEvent(s3d, {
  type: NarrativeEventType.REVELATION,
  description: 'A voice calls from the gallery that the light is out. The upper hall is completely dark. Gazing up into the darkness the boy sees himself as a creature driven and derided by vanity; his eyes burn with anguish and anger.',
  timestamp: ts(98), textLocation: loc(228, 233), participants: [boyId, arabyHallId],
  precedingEvent: e27,
});

// Resolve absentials
sys.updateAbsentialStatus(absQuest, AbsentialStatus.RESOLVED_BLOCKED, e28, ts(98));
sys.updateAbsentialStatus(absLonging, AbsentialStatus.RESOLVED_MIXED, e28, ts(98));

// ════════════════════════════════════════════════════════
//  PASS 2: Reading 1 — Formalist / Epiphanic
// ════════════════════════════════════════════════════════

sys.createReading(
  'formalist',
  'A formalist reading focused on narrative structure, imagery patterns, the Joycean epiphany as formal device, light/dark symbolism, and the movement from romantic idealization to devastating self-knowledge.',
  {
    id: 'narr_formalist', name: 'Retrospective first-person narrator', description: 'The adult narrator looking back with ironic distance',
    tags: ['retrospective', 'ironic'], type: NonDiegeticEntityType.NARRATOR,
    stateHistory: [{ timestamp: ts(0), data: { ...base('init'), reliability: 0.7, mentalConstructs: [], perspective: NarratorPerspective.FIRST_PERSON }, causedBy: {} }],
    firstIntroduced: 'init',
  },
  {
    id: 'reader_formalist', name: 'Formalist implied reader', description: 'A reader attuned to structure and imagery',
    tags: ['formalist'], type: NonDiegeticEntityType.READER,
    stateHistory: [{ timestamp: ts(0), data: { ...base('init'), mentalConstructs: [], emotions: emptyEmotion() }, causedBy: {} }],
    firstIntroduced: 'init',
  },
  {
    id: 'author_formalist', name: 'James Joyce', description: 'Joyce as craftsman of the epiphany',
    tags: ['modernist'], type: NonDiegeticEntityType.AUTHOR,
    stateHistory: [{ timestamp: ts(0), data: { ...base('init'), style: { irony: 0.9, lyricism: 0.8, precision: 0.9 }, themes: [] }, causedBy: {} }],
    firstIntroduced: 'init',
  },
);

// Themes
const thDisillusion = sys.addTheme('formalist', {
  name: 'Disillusionment / Epiphany', description: 'Movement from romantic idealization to painful self-awareness',
  tags: ['epiphany', 'loss-of-innocence'], type: NonDiegeticEntityType.THEME,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.3, relatedElements: [boyId, mangansId, arabyHallId], manifestations: [], progression: [] }, causedBy: {} }],
  firstIntroduced: 'init',
});

const thParalysis = sys.addTheme('formalist', {
  name: 'Paralysis', description: 'Pervasive stasis and entrapment — the central Dubliners theme',
  tags: ['stasis', 'entrapment'], type: NonDiegeticEntityType.THEME,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.5, relatedElements: [northRichmondId, uncleId, houseId], manifestations: [], progression: [] }, causedBy: {} }],
  firstIntroduced: 'init',
});

const thReligiousDeviation = sys.addTheme('formalist', {
  name: 'Secular devotion / religious language for profane love',
  description: 'The boy\'s love is described in liturgical terms — chalice, prayers, adoration',
  tags: ['religion', 'secular-sacred'], type: NonDiegeticEntityType.THEME,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.6, relatedElements: [boyId, mangansId, deadPriestId], manifestations: [], progression: [] }, causedBy: {} }],
  firstIntroduced: 'init',
});

// Symbols
const symLightDark = sys.addSymbol('formalist', {
  name: 'Light and darkness', description: 'Light = idealization, the girl illuminated; darkness = reality, Dublin, the closing bazaar',
  tags: ['imagery', 'contrast'], type: NonDiegeticEntityType.SYMBOL,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentMeanings: [{ description: 'Light = romantic idealization', strength: 0.8 }, { description: 'Darkness = reality, disillusionment', strength: 0.8 }], currentManifestations: [mangansId, northRichmondId, arabyHallId] }, causedBy: {} }],
  firstIntroduced: 'init',
});

const symChalice = sys.addSymbol('formalist', {
  name: 'The chalice', description: '"I bore my chalice safely through a throng of foes" — the boy as knight/priest carrying sacred devotion through a profane world',
  tags: ['imagery', 'religious', 'quest'], type: NonDiegeticEntityType.SYMBOL,
  stateHistory: [{ timestamp: ts(25), data: { ...base('init'), currentMeanings: [{ description: 'Sacred vessel for profane devotion', strength: 0.9 }, { description: 'The boy as questing knight-priest', strength: 0.7 }], currentManifestations: [boyId, mangansId, marketStreetsId] }, causedBy: {} }],
  firstIntroduced: 'init',
});

const symBlindStreet = sys.addSymbol('formalist', {
  name: 'The blind street', description: 'Physical dead-end as metaphor for spiritual/emotional dead-end',
  tags: ['setting-as-symbol'], type: NonDiegeticEntityType.SYMBOL,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentMeanings: [{ description: 'Dead-end street = dead-end desire', strength: 0.7 }], currentManifestations: [northRichmondId] }, causedBy: {} }],
  firstIntroduced: 'init',
});

// Event significance for formalist reading
sys.annotateEvent('formalist', e01, { significance: 0.6, note: 'Establishes the "blind" setting — dead-end street as structural premonition' });
sys.annotateEvent('formalist', e02, { significance: 0.5, note: 'The priest\'s books span sacred, romantic, and criminal — foreshadows the story\'s range' });
sys.annotateEvent('formalist', e03, { significance: 0.4, note: 'Communal play contrasted with individual obsession' });
sys.annotateEvent('formalist', e04, { significance: 0.7, note: 'First appearance of the light imagery — her figure defined by light from the half-opened door' });
sys.annotateEvent('formalist', e05, { significance: 0.6, note: 'The ritual of watching/following establishes pattern of devotion' });
sys.annotateEvent('formalist', e06, { significance: 0.9, note: 'The chalice passage — peak of religious imagery for secular love' });
sys.annotateEvent('formalist', e07, { significance: 0.8, note: 'The harp metaphor — body as instrument played by her words and gestures' });
sys.annotateEvent('formalist', e08, { significance: 0.85, note: '"O love! O love!" — private devotion in the dead priest\'s room; secular prayer' });
sys.annotateEvent('formalist', e09, { significance: 0.9, note: 'The conversation: light on her neck, the silver bracelet, the half-opened door — culmination of light imagery' });
sys.annotateEvent('formalist', e10, { significance: 0.8, note: 'The promise creates the concrete quest — the story\'s structural turning point' });
sys.annotateEvent('formalist', e11, { significance: 0.5, note: '"Eastern enchantment" — the word Araby as incantation' });
sys.annotateEvent('formalist', e12, { significance: 0.3, note: 'Minor friction — aunt\'s Freemasonry comment as social texture' });
sys.annotateEvent('formalist', e13, { significance: 0.3, note: 'External recognition of the boy\'s inner transformation' });
sys.annotateEvent('formalist', e14, { significance: 0.4, note: 'Saturday morning — rising tension, the uncle as obstacle' });
sys.annotateEvent('formalist', e15, { significance: 0.6, note: 'The boy sees her imagined figure from the upper window — light imagery inverted (he\'s in the dark looking out)' });
sys.annotateEvent('formalist', e16, { significance: 0.4, note: 'Mrs. Mercer as embodiment of the tedious adult world' });
sys.annotateEvent('formalist', e17, { significance: 0.4, note: '"This night of Our Lord" — religious language used to deny, not enable' });
sys.annotateEvent('formalist', e18, { significance: 0.7, note: 'The uncle\'s arrival: interpreting signs (rocking hallstand, talking to himself) — ironic epistemology' });
sys.annotateEvent('formalist', e19, { significance: 0.5, note: '"The Arab\'s Farewell to his Steed" — internal literary parallel to the boy\'s own farewell' });
sys.annotateEvent('formalist', e20, { significance: 0.5, note: 'The florin held tightly — the quest object reduced to coin' });
sys.annotateEvent('formalist', e21, { significance: 0.5, note: 'The empty train — isolation intensifies' });
sys.annotateEvent('formalist', e22, { significance: 0.6, note: 'Entering the bazaar — "the magical name" but the reality is a closing hall' });
sys.annotateEvent('formalist', e23, { significance: 0.7, note: 'Church-like silence + coins on a salver — religion and commerce fused' });
sys.annotateEvent('formalist', e24, { significance: 0.5, note: '"Remembering with difficulty why I had come" — the quest already dissolving' });
sys.annotateEvent('formalist', e25, { significance: 0.8, note: 'The banal flirtation is a structural mirror to the boy\'s own romance — deflated, trivial' });
sys.annotateEvent('formalist', e26, { significance: 0.7, note: 'Her tone "not encouraging" — the stall lady as anti-Mangan\'s-sister' });
sys.annotateEvent('formalist', e27, { significance: 0.6, note: 'The coins falling against each other — sound replacing the imagined gift' });
sys.annotateEvent('formalist', e28, { significance: 1.0, note: 'THE epiphany. "Driven and derided by vanity." Light extinguished, darkness total. The formal climax.' });

// Entity significance
sys.annotateEntity('formalist', boyId, 1.0, 'Protagonist and center of consciousness');
sys.annotateEntity('formalist', mangansId, 0.85, 'The object of idealization — more symbol than person in this reading');
sys.annotateEntity('formalist', uncleId, 0.5, 'Structural obstacle; embodies paralysis');
sys.annotateEntity('formalist', deadPriestId, 0.6, 'Absent presence — his traces (books, room, pump) haunt the text');
sys.annotateEntity('formalist', stallLadyId, 0.7, 'Structural mirror to Mangan\'s sister');

// Absential significance
sys.annotateAbsential('formalist', absLonging, 1.0, 'The story\'s engine — transforms into the epiphany');
sys.annotateAbsential('formalist', absQuest, 0.85, 'The concrete quest that fails, triggering the formal climax');
sys.annotateAbsential('formalist', absPriestAbsence, 0.5, 'Atmospheric — the absent priest as predecessor to the boy\'s spiritual crisis');

// Tension curve
for (const [pct, val] of [[0, 0.2], [10, 0.3], [20, 0.5], [28, 0.6], [32, 0.65], [36, 0.75], [40, 0.7], [45, 0.55], [51, 0.6], [55, 0.7], [62, 0.8], [68, 0.85], [74, 0.75], [82, 0.8], [89, 0.9], [93, 0.85], [98, 1.0]] as [number, number][]) {
  sys.addTensionPoint('formalist', ts(pct), val);
}

// ════════════════════════════════════════════════════════
//  PASS 2: Reading 2 — Postcolonial
// ════════════════════════════════════════════════════════

sys.createReading(
  'postcolonial',
  'A postcolonial reading focused on "Araby" as orientalist fantasy, English cultural dominance, commerce and empire, Dublin as colonized space, and the boy\'s desire as mimicry of imperial romance.',
  {
    id: 'narr_postcolonial', name: 'Retrospective narrator (colonial subject)',
    description: 'The narrator as an adult Irish subject reflecting on colonial fantasy',
    tags: ['retrospective', 'colonial-subject'], type: NonDiegeticEntityType.NARRATOR,
    stateHistory: [{ timestamp: ts(0), data: { ...base('init'), reliability: 0.8, mentalConstructs: [], perspective: NarratorPerspective.FIRST_PERSON }, causedBy: {} }],
    firstIntroduced: 'init',
  },
  {
    id: 'reader_postcolonial', name: 'Postcolonial implied reader',
    description: 'A reader attuned to imperial structures and orientalism',
    tags: ['postcolonial'], type: NonDiegeticEntityType.READER,
    stateHistory: [{ timestamp: ts(0), data: { ...base('init'), mentalConstructs: [], emotions: emptyEmotion() }, causedBy: {} }],
    firstIntroduced: 'init',
  },
  {
    id: 'author_postcolonial', name: 'James Joyce',
    description: 'Joyce as Irish writer navigating the colonial condition',
    tags: ['irish', 'exile'], type: NonDiegeticEntityType.AUTHOR,
    stateHistory: [{ timestamp: ts(0), data: { ...base('init'), style: { irony: 0.9, anti_imperial: 0.7 }, themes: [] }, causedBy: {} }],
    firstIntroduced: 'init',
  },
);

// Themes
const thOrientalism = sys.addTheme('postcolonial', {
  name: 'Orientalism', description: '"Araby" as orientalist fantasy — the exotic East as projection of desire',
  tags: ['orientalism', 'fantasy', 'empire'], type: NonDiegeticEntityType.THEME,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.7, relatedElements: [arabyHallId, boyId], manifestations: [], progression: [] }, causedBy: {} }],
  firstIntroduced: 'init',
});

const thCommerce = sys.addTheme('postcolonial', {
  name: 'Commerce and Empire', description: 'Everything reduces to commercial transaction — the bazaar is a marketplace, not a quest destination',
  tags: ['commerce', 'capitalism', 'empire'], type: NonDiegeticEntityType.THEME,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.5, relatedElements: [arabyHallId, florin, remainingCoins, marketStreetsId], manifestations: [], progression: [] }, causedBy: {} }],
  firstIntroduced: 'init',
});

const thEnglishDominance = sys.addTheme('postcolonial', {
  name: 'English cultural dominance', description: 'English accents at the bazaar, English literature in the priest\'s collection, the colonizer\'s language and commerce',
  tags: ['english', 'colonial', 'cultural-imperialism'], type: NonDiegeticEntityType.THEME,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.4, relatedElements: [twoGentlemenId, stallLadyId, bookAbbot], manifestations: [], progression: [] }, causedBy: {} }],
  firstIntroduced: 'init',
});

const thDublinColonized = sys.addTheme('postcolonial', {
  name: 'Dublin as colonized space', description: 'The city\'s paralysis is colonial paralysis — British rule, Catholic constraint, economic stagnation',
  tags: ['dublin', 'colonial', 'paralysis'], type: NonDiegeticEntityType.THEME,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.6, relatedElements: [northRichmondId, houseId, classroomId], manifestations: [], progression: [] }, causedBy: {} }],
  firstIntroduced: 'init',
});

// Symbols
sys.addSymbol('postcolonial', {
  name: 'The name "Araby"', description: 'The word itself is an orientalist signifier — an exotic elsewhere that never delivers',
  tags: ['orientalism', 'naming'], type: NonDiegeticEntityType.SYMBOL,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentMeanings: [{ description: 'Orientalist fantasy projected onto a Dublin charity bazaar', strength: 0.9 }], currentManifestations: [arabyHallId] }, causedBy: {} }],
  firstIntroduced: 'init',
});

sys.addSymbol('postcolonial', {
  name: '"The Arab\'s Farewell to his Steed"', description: 'The uncle\'s poem — sentimental orientalist verse, the colonizer\'s romanticized East',
  tags: ['orientalism', 'poetry', 'uncle'], type: NonDiegeticEntityType.SYMBOL,
  stateHistory: [{ timestamp: ts(70), data: { ...base('init'), currentMeanings: [{ description: 'Sentimental orientalism — the East as the colonizer imagines it', strength: 0.8 }], currentManifestations: [uncleId] }, causedBy: {} }],
  firstIntroduced: 'init',
});

sys.addSymbol('postcolonial', {
  name: 'The florin / coins', description: 'Imperial currency — the boy\'s quest reduces to a financial transaction within the colonial economy',
  tags: ['money', 'empire', 'commerce'], type: NonDiegeticEntityType.SYMBOL,
  stateHistory: [{ timestamp: ts(65), data: { ...base('init'), currentMeanings: [{ description: 'Imperial currency mediating all desire', strength: 0.7 }], currentManifestations: [florin, remainingCoins] }, causedBy: {} }],
  firstIntroduced: 'init',
});

// Event significance — very different from the formalist reading
sys.annotateEvent('postcolonial', e01, { significance: 0.7, note: 'Christian Brothers\' School — Catholic education under British rule, the street named for an English duke' });
sys.annotateEvent('postcolonial', e02, { significance: 0.6, note: 'The priest\'s library: Walter Scott (English romance), a devotional text, Vidocq (French secular) — colonial cultural mix' });
sys.annotateEvent('postcolonial', e03, { significance: 0.3, note: 'Street play — background texture of colonized Dublin' });
sys.annotateEvent('postcolonial', e04, { significance: 0.4, note: 'Domestic scene, minor' });
sys.annotateEvent('postcolonial', e05, { significance: 0.3, note: 'The following ritual — minor in this reading' });
sys.annotateEvent('postcolonial', e06, { significance: 0.7, note: 'The market: O\'Donovan Rossa ballads, "troubles in our native land" — explicit colonial context. The boy\'s private romance exists within public political reality.' });
sys.annotateEvent('postcolonial', e07, { significance: 0.3, note: 'Private emotional intensity — less central to this reading' });
sys.annotateEvent('postcolonial', e08, { significance: 0.3, note: 'Personal devotion — less central' });
sys.annotateEvent('postcolonial', e09, { significance: 0.5, note: 'The convent retreat blocks Mangan\'s sister — Catholic institutional constraint' });
sys.annotateEvent('postcolonial', e10, { significance: 0.6, note: 'The promise to bring something from "Araby" — desire mediated by orientalist fantasy' });
sys.annotateEvent('postcolonial', e11, { significance: 0.8, note: '"Eastern enchantment" — the key phrase. The boy is enchanted by an orientalist signifier, not a real place.' });
sys.annotateEvent('postcolonial', e12, { significance: 0.5, note: 'Freemasonry = Protestant/English threat in Catholic Irish imagination' });
sys.annotateEvent('postcolonial', e13, { significance: 0.2, note: 'Minor' });
sys.annotateEvent('postcolonial', e14, { significance: 0.3, note: 'Minor' });
sys.annotateEvent('postcolonial', e15, { significance: 0.3, note: 'Minor' });
sys.annotateEvent('postcolonial', e16, { significance: 0.3, note: 'Mrs. Mercer: pawnbroker\'s widow collecting stamps — colonial commerce and pious charity intertwined' });
sys.annotateEvent('postcolonial', e17, { significance: 0.2, note: 'Minor' });
sys.annotateEvent('postcolonial', e18, { significance: 0.4, note: 'The uncle as failed patriarch in a colonized domestic space' });
sys.annotateEvent('postcolonial', e19, { significance: 0.9, note: '"The Arab\'s Farewell to his Steed" — the uncle performs orientalist sentiment. The poem is the adult version of the boy\'s Araby fantasy. Colonial culture produces this orientalism at every level.' });
sys.annotateEvent('postcolonial', e20, { significance: 0.6, note: 'Buckingham Street — named for the English palace. Imperial geography.' });
sys.annotateEvent('postcolonial', e21, { significance: 0.4, note: 'The train: colonial infrastructure, "ruinous houses"' });
sys.annotateEvent('postcolonial', e22, { significance: 0.7, note: 'The bazaar entrance fee — the "magical name" costs a shilling. Enchantment is purchased.' });
sys.annotateEvent('postcolonial', e23, { significance: 0.8, note: 'Coins on a salver — the bazaar is a site of commerce, not wonder. Church-like silence = the death of the fantasy.' });
sys.annotateEvent('postcolonial', e24, { significance: 0.5, note: '"Remembering with difficulty" — the orientalist spell is breaking' });
sys.annotateEvent('postcolonial', e25, { significance: 1.0, note: 'THE key moment for this reading. English accents. The bazaar\'s "oriental" fantasy is run by English people. The colonizer owns even the fantasy of the East. The boy\'s quest has always been within the colonial economy.' });
sys.annotateEvent('postcolonial', e26, { significance: 0.7, note: 'The English woman speaks to the Irish boy "out of a sense of duty" — colonial condescension' });
sys.annotateEvent('postcolonial', e27, { significance: 0.6, note: 'The imperial coins — all that remains of the quest' });
sys.annotateEvent('postcolonial', e28, { significance: 0.9, note: 'The epiphany: "vanity" encompasses both personal vanity and the vanity of colonial fantasy. The boy sees through both his romance and the orientalist spectacle.' });

// Entity significance — different priorities
sys.annotateEntity('postcolonial', boyId, 0.9, 'Colonial subject who internalizes orientalist fantasy');
sys.annotateEntity('postcolonial', mangansId, 0.4, 'Less central — the girl is a catalyst, not the focus');
sys.annotateEntity('postcolonial', twoGentlemenId, 0.9, 'English accents at the heart of the "oriental" bazaar — the colonizer');
sys.annotateEntity('postcolonial', stallLadyId, 0.8, 'English woman in the oriental bazaar — complicit in colonial commerce');
sys.annotateEntity('postcolonial', uncleId, 0.6, 'Performs orientalist sentiment via the poem');
sys.annotateEntity('postcolonial', deadPriestId, 0.5, 'His library mixes colonial and religious culture');

// Absential significance
sys.annotateAbsential('postcolonial', absLonging, 0.6, 'Important but the longing is a symptom of colonial desire, not the primary focus');
sys.annotateAbsential('postcolonial', absQuest, 0.8, 'The quest to "Araby" is the quest for an orientalist elsewhere that doesn\'t exist');

// Tension curve — peaks at different moments
for (const [pct, val] of [[0, 0.3], [10, 0.2], [25, 0.5], [36, 0.4], [44, 0.6], [58, 0.3], [70, 0.7], [74, 0.6], [82, 0.7], [89, 1.0], [93, 0.9], [98, 0.95]] as [number, number][]) {
  sys.addTensionPoint('postcolonial', ts(pct), val);
}

// ════════════════════════════════════════════════════════
//  Save
// ════════════════════════════════════════════════════════

const finalModel = sys.getModel();
const filePath = saveStoryModel(finalModel);

console.log(`\nStory model saved to: ${filePath}\n`);
console.log('=== TextModel ===');
console.log(`Characters: ${Object.keys(finalModel.text.diegetic.characters).length}`);
console.log(`Settings: ${Object.keys(finalModel.text.diegetic.settings).length}`);
console.log(`Items: ${Object.keys(finalModel.text.diegetic.items).length}`);
console.log(`Events: ${Object.keys(finalModel.text.events).length}`);
console.log(`Absentials: ${Object.keys(finalModel.text.absentials).length}`);
console.log(`Relationships: ${Object.keys(finalModel.text.relationships.interpersonal).length + Object.keys(finalModel.text.relationships.group).length}`);
console.log(`Mental constructs: ${Object.keys(finalModel.text.mentalConstructs).length}`);
console.log(`Spans: ${finalModel.text.rootSpan.childSpans.length} acts → ${finalModel.text.rootSpan.childSpans.reduce((n, a) => n + a.childSpans.length, 0)} scenes`);
console.log(`\n=== Readings ===`);
for (const [name, reading] of Object.entries(finalModel.readings)) {
  const annotated = Object.keys(reading.eventSignificance).length;
  const themes = Object.keys(reading.themes).length;
  const symbols = Object.keys(reading.symbols).length;
  console.log(`  ${name}: ${themes} themes, ${symbols} symbols, ${annotated}/${Object.keys(finalModel.text.events).length} events annotated`);
}
