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

const northRichmondSt = sys.addSetting({
  id: 'north-richmond-st',
  textMentions: ['North Richmond Street'],
  context: 'A real street in Dublin\'s north side. \'Being blind\' means it\'s a dead-end (cul-de-sac). The Christian Brothers\' School on this street was a real institution. Joyce lived briefly at 17 North Richmond Street as a child.',
  name: 'North Richmond Street', description: 'A blind (dead-end) street in Dublin',
  tags: ['dublin', 'residential', 'dead-end'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Dead-end street in north Dublin',
  climate: 'Damp, cold, winter', historicalContext: 'Turn-of-century Dublin under British rule',
  culturalBackground: 'Catholic, working-class Irish',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { light: 0.3, warmth: 0.2 }, culturalNorms: { catholicism: 0.9, propriety: 0.8 }, tension: 0.2, atmosphere: 'quiet, decaying, suffocating' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const house = sys.addSetting({
  id: 'house',
  textMentions: ['our house', 'the house'],
  context: 'The house at the blind end of the street, formerly the priest\'s. The musty air, waste room, and wild garden establish the atmosphere of decay that pervades the story.',
  name: 'The boy\'s house (former priest\'s house)', description: 'House at the blind end, formerly inhabited by a dead priest',
  tags: ['domestic', 'gloomy', 'religious-remnants'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'End of North Richmond Street',
  climate: 'Cold, damp interior', historicalContext: 'Previous tenant was a priest who died in the back drawing-room',
  culturalBackground: 'Catholic household', parentSetting: northRichmondSt,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { light: 0.2, mustiness: 0.8 }, culturalNorms: { catholicism: 0.9 }, tension: 0.1, atmosphere: 'musty, dark, haunted by absence' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const backDrawingRoom = sys.addSetting({
  id: 'back-drawing-room',
  textMentions: ['back drawing-room'],
  context: 'The room where the priest died becomes the boy\'s private space for intense emotional experience — a secular confession booth.',
  name: 'The back drawing-room', description: 'Room where the priest died; the boy retreats here for private emotional experiences',
  tags: ['domestic', 'death', 'devotion'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Back room of the house',
  climate: 'Dark, damp', historicalContext: 'The priest died here',
  culturalBackground: 'Residual religious atmosphere', parentSetting: house,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { light: 0.1, rain: 0.7 }, culturalNorms: {}, tension: 0.3, atmosphere: 'dark, rainy, intimate' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const wildGarden = sys.addSetting({
  id: 'wild-garden',
  textMentions: ['wild garden'],
  context: 'The overgrown garden with its central apple-tree evokes the Garden of Eden — another paradise lost.',
  name: 'The wild garden', description: 'Overgrown garden behind the house with a central apple-tree and straggling bushes',
  tags: ['garden', 'decay', 'nature'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Behind the house',
  climate: 'Overgrown, damp', historicalContext: 'Part of the priest\'s former property',
  culturalBackground: 'Neglected', parentSetting: house,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { wildness: 0.8 }, culturalNorms: {}, tension: 0, atmosphere: 'wild, neglected' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const marketStreets = sys.addSetting({
  id: 'market-streets',
  textMentions: ['flaring streets'],
  context: 'The Saturday evening markets where the aunt shops. The street-singers\' \'come-all-you about O\'Donovan Rossa\' references Jeremiah O\'Donovan Rossa (1831-1915), an Irish Fenian and nationalist leader, grounding the story in political context.',
  name: 'The market streets', description: 'Flaring streets jostled by drunken men and bargaining women on Saturday evenings',
  tags: ['commercial', 'sensory', 'hostile'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Dublin market area',
  climate: 'Cold, busy', historicalContext: 'Saturday evening markets',
  culturalBackground: 'Working-class commerce, street-singers, labourers',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { noise: 0.9, crowding: 0.8, light: 0.6 }, culturalNorms: { commerce: 0.9 }, tension: 0.3, atmosphere: 'flaring, hostile to romance' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const classroom = sys.addSetting({
  id: 'classroom',
  textMentions: ['classroom', 'class'],
  context: 'The Christian Brothers\' School — a network of Catholic schools founded by Edmund Rice, providing education to working-class Irish boys.',
  name: 'The classroom', description: 'The boy\'s school where he cannot concentrate',
  tags: ['school', 'constraint', 'distraction'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Unspecified Dublin school',
  climate: 'Indoor', historicalContext: 'Christian Brothers\' School',
  culturalBackground: 'Catholic education',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: {}, culturalNorms: { discipline: 0.8 }, tension: 0.2, atmosphere: 'tedious, constraining' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const buckinghamSt = sys.addSetting({
  id: 'buckingham-st',
  textMentions: ['Buckingham Street'],
  context: 'A real Dublin street leading to Westland Row Station (now Pearse Station). Named after the Duke of Buckingham — one of many Dublin streets bearing English/colonial names.',
  name: 'Buckingham Street / the station', description: 'Street leading to the train station; the boy walks here clutching the florin',
  tags: ['transit', 'journey'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Street near the train station',
  climate: 'Night, gas-lit', historicalContext: 'Dublin infrastructure',
  culturalBackground: 'Commercial Dublin',
  stateHistory: [{ timestamp: ts(70), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { light: 0.5, crowding: 0.6 }, culturalNorms: {}, tension: 0.5, atmosphere: 'thronged with buyers, glaring with gas' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const trainCarriage = sys.addSetting({
  id: 'train-carriage',
  textMentions: ['third-class carriage', 'bare carriage'],
  context: 'Third-class was the cheapest fare. The \'special train for the bazaar\' and the boy\'s solitary journey emphasize his isolation.',
  name: 'The train carriage', description: 'A deserted third-class carriage on the special train to the bazaar',
  tags: ['transit', 'isolation'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Dublin rail line',
  climate: 'Cold, bare', historicalContext: 'Special train for bazaar-goers',
  culturalBackground: 'Third-class',
  stateHistory: [{ timestamp: ts(73), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { emptiness: 0.9 }, culturalNorms: {}, tension: 0.4, atmosphere: 'bare, deserted, slow' }, causedBy: {} }],
  firstIntroduced: 'init',
});

const arabyHall = sys.addSetting({
  id: 'araby-hall',
  textMentions: ['Araby', 'bazaar', 'the hall'],
  context: 'Based on the real \'Araby\' bazaar held in Dublin in May 1894 at the Royal Dublin Society grounds in Ballsbridge, a charity event with an orientalist theme. The real bazaar raised funds for Jervis Street Hospital.',
  name: 'Araby bazaar', description: 'A large hall displaying the magical name, nearly empty and closing',
  tags: ['bazaar', 'exotic', 'commercial', 'disillusionment'], type: DiegeticEntityType.SETTING,
  realm: RealmType.MATERIAL_REALITY, geography: 'Large hall in Dublin',
  climate: 'Dark, closing down', historicalContext: 'Charity bazaars were common in Dublin',
  culturalBackground: 'Pseudo-oriental commercial spectacle',
  stateHistory: [{ timestamp: ts(80), data: { ...base('init'), currentCharacters: [], currentItems: [], dominantFactions: {}, environmentalConditions: { light: 0.2, emptiness: 0.8 }, culturalNorms: { commerce: 0.9 }, tension: 0.6, atmosphere: 'dark, nearly empty, church-like silence' }, causedBy: {} }],
  firstIntroduced: 'init',
});

// ── Characters ──

const boy = sys.addCharacter({
  id: 'boy',
  textMentions: [],
  context: 'The unnamed narrator, looking back on a childhood experience. Joyce\'s Dubliners stories frequently use unnamed first-person narrators to achieve universality.',
  name: 'The boy (narrator as child)', description: 'Unnamed boy consumed by a romantic infatuation',
  tags: ['protagonist', 'youth', 'romantic', 'naive'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: { ...emptyEmotion(), anticipation: 0.6, joy: 0.3, intensity: 0.4 }, mentalConstructs: [], inventory: [], location: northRichmondSt, factionRelationships: {}, age: 12, gender: 'male', occupation: 'student', personalityTraits: ['imaginative', 'sensitive', 'earnest', 'naive'], coreValues: ['devotion', 'romance', 'adventure'], physicalDescription: 'Young boy, unspecified', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const mangansSister = sys.addCharacter({
  id: 'mangans-sister',
  textMentions: ['Mangan\'s sister'],
  context: 'Never named — she exists in the story only as someone\'s sister and as the boy\'s idealized projection. Her namelessness is often noted by critics as significant.',
  name: 'Mangan\'s sister', description: 'Unnamed older sister of the boy\'s friend, object of his infatuation',
  tags: ['love-interest', 'unattainable', 'idealized'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: northRichmondSt, factionRelationships: {}, age: 14, gender: 'female', occupation: 'student (convent)', personalityTraits: ['graceful', 'distant'], coreValues: [], physicalDescription: 'Figure defined by light from half-opened door, soft rope of hair, silver bracelet', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const uncle = sys.addCharacter({
  id: 'uncle',
  textMentions: ['my uncle', 'uncle'],
  context: 'The boy\'s guardian, whose forgetfulness and drinking represent the adult world\'s indifference to the boy\'s inner life.',
  name: 'The uncle', description: 'The boy\'s uncle and guardian, often drunk, forgetful',
  tags: ['guardian', 'obstacle', 'unreliable'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: house, factionRelationships: {}, age: 45, gender: 'male', occupation: 'unspecified', personalityTraits: ['forgetful', 'well-meaning', 'unreliable'], coreValues: [], physicalDescription: 'Unspecified', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const aunt = sys.addCharacter({
  id: 'aunt',
  textMentions: ['my aunt', 'aunt'],
  context: 'The more sympathetic guardian, who ultimately intervenes to get the boy his money. Her Freemasonry comment reflects the Catholic suspicion of Protestant organizations in turn-of-century Dublin.',
  name: 'The aunt', description: 'The boy\'s aunt, a cautious domestic presence',
  tags: ['guardian', 'domestic'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: house, factionRelationships: {}, age: 40, gender: 'female', occupation: 'homemaker', personalityTraits: ['cautious', 'practical', 'devout'], coreValues: ['propriety', 'religion'], physicalDescription: 'Unspecified', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const mangan = sys.addCharacter({
  id: 'mangan',
  textMentions: ['Mangan'],
  context: 'The boy\'s friend, notable mainly as the sister\'s brother. The name may allude to James Clarence Mangan, an Irish poet whom Joyce admired and who wrote orientalist verse — connecting to the story\'s \'Eastern enchantment\' theme.',
  name: 'Mangan', description: 'The boy\'s friend, brother of the girl, barely individuated',
  tags: ['friend', 'minor'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: northRichmondSt, factionRelationships: {}, age: 12, gender: 'male', occupation: 'student', personalityTraits: [], coreValues: [], physicalDescription: 'Unspecified', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const mrsMercer = sys.addCharacter({
  id: 'mrs-mercer',
  textMentions: ['Mrs Mercer', 'Mrs. Mercer'],
  context: 'A pawnbroker\'s widow who collects used stamps \'for some pious purpose.\' She embodies the intersection of commerce and piety that pervades Dublin in Dubliners.',
  name: 'Mrs. Mercer', description: 'A garrulous old pawnbroker\'s widow who collects used stamps for pious purposes',
  tags: ['minor', 'obstacle', 'pious'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(55), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: house, factionRelationships: {}, age: 65, gender: 'female', occupation: 'pawnbroker\'s widow', personalityTraits: ['garrulous', 'pious'], coreValues: ['piety'], physicalDescription: 'Old', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const schoolmaster = sys.addCharacter({
  id: 'schoolmaster',
  textMentions: ['my master'],
  context: 'The boy\'s teacher at the Christian Brothers\' School, a Catholic educational institution common in Dublin.',
  name: 'The schoolmaster', description: 'The boy\'s teacher, notices his declining attention',
  tags: ['minor', 'authority'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(40), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: classroom, factionRelationships: {}, age: 40, gender: 'male', occupation: 'teacher', personalityTraits: ['stern', 'observant'], coreValues: ['discipline'], physicalDescription: 'Face passes from amiability to sternness', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const stallLady = sys.addCharacter({
  id: 'stall-lady',
  textMentions: ['young lady', 'the young lady'],
  context: 'The stall attendant whose banal flirtation with two Englishmen provides the story\'s devastating structural mirror to the boy\'s own romantic quest.',
  name: 'The young lady at the stall', description: 'A young woman flirting with two gentlemen at a bazaar stall, speaks to the boy without interest',
  tags: ['minor', 'mirror', 'english'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(83), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: arabyHall, factionRelationships: {}, age: 22, gender: 'female', occupation: 'stall attendant', personalityTraits: ['flirtatious', 'indifferent'], coreValues: [], physicalDescription: 'Unspecified', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const twoGentlemen = sys.addCharacter({
  id: 'two-gentlemen',
  textMentions: ['two young gentlemen', 'young gentlemen'],
  context: 'Their English accents are the only detail given. In a postcolonial reading, they represent English cultural ownership of even the \'oriental\' fantasy space.',
  name: 'The two young gentlemen', description: 'Two young men with English accents flirting with the stall lady',
  tags: ['minor', 'english'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(83), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: arabyHall, factionRelationships: {}, age: 25, gender: 'male', occupation: 'unspecified', personalityTraits: [], coreValues: [], physicalDescription: 'English accents noted', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const turnstileMan = sys.addCharacter({
  id: 'turnstile-man',
  textMentions: ['weary-looking man'],
  context: 'Appears only to take the boy\'s shilling at the entrance.',
  name: 'The weary-looking man', description: 'Man at the turnstile who takes the boy\'s shilling',
  tags: ['minor', 'incidental'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(80), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: arabyHall, factionRelationships: {}, age: 50, gender: 'male', occupation: 'turnstile attendant', personalityTraits: ['weary'], coreValues: [], physicalDescription: 'Weary-looking', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
});

const deadPriest = sys.addCharacter({
  id: 'dead-priest',
  textMentions: ['The former tenant', 'priest', 'the late tenant'],
  context: 'The unnamed priest who previously rented the house and died in the back drawing-room. He left his money to institutions and his furniture to his sister — a detail suggesting both charity and the absence of family. His eclectic library (Scott, a devotional text, Vidocq) hints at a complex inner life.',
  name: 'The dead priest', description: 'Former tenant who died in the back drawing-room; an absent presence haunting the house',
  tags: ['absent', 'death', 'religion'], type: DiegeticEntityType.CHARACTER,
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), emotionalState: emptyEmotion(), mentalConstructs: [], inventory: [], location: house, factionRelationships: {}, age: 0, gender: 'male', occupation: 'priest (deceased)', personalityTraits: ['charitable'], coreValues: ['charity', 'religion'], physicalDescription: 'Deceased', skills: {}, socialStatus: {} }, causedBy: {} }],
  firstIntroduced: 'init',
  lastSeen: 'init',
});

// ── Items ──

const bookAbbot = sys.addItem({
  id: 'book-abbot',
  textMentions: ['The Abbot'],
  context: 'The Abbot (1820) by Sir Walter Scott — a historical romance about Mary Queen of Scots. Scott was hugely popular but represented English literary culture. The presence of this book in an Irish priest\'s library reflects the cultural penetration of English literature.',
  name: 'The Abbot (Walter Scott)', description: 'A romantic historical novel found among the dead priest\'s papers',
  tags: ['book', 'priest', 'romance'], type: DiegeticEntityType.ITEM, itemType: 'book',
  origin: 'The dead priest\'s collection', physicalDescription: 'Paper-covered, curled and damp pages',
  defaultFunction: 'Reading material',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), location: house, condition: 'damp, curled pages', owner: null, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

const bookDevout = sys.addItem({
  id: 'book-devout',
  textMentions: ['The Devout Communicant'],
  context: 'A Catholic devotional manual by Pacificus Baker (1695). Its presence alongside Scott and Vidocq suggests the priest\'s reading ranged from pious to adventurous — or perhaps that he was more complex than his vocation suggests.',
  name: 'The Devout Communicant', description: 'A religious text found among the dead priest\'s papers',
  tags: ['book', 'priest', 'religion'], type: DiegeticEntityType.ITEM, itemType: 'book',
  origin: 'The dead priest\'s collection', physicalDescription: 'Paper-covered, curled and damp pages',
  defaultFunction: 'Religious instruction',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), location: house, condition: 'damp, curled pages', owner: null, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

const bookVidocq = sys.addItem({
  id: 'book-vidocq',
  textMentions: ['The Memoirs of Vidocq', 'Vidocq'],
  context: 'The Memoirs of Eug\u00e8ne Fran\u00e7ois Vidocq (1775-1857), a French criminal who became the founder of the S\u00fbret\u00e9 Nationale, the first modern detective bureau. The boy \'liked it best because its leaves were yellow\' — drawn to the sensory quality rather than the content, a detail that prefigures his conflation of surface and substance throughout the story.',
  name: 'The Memoirs of Vidocq', description: 'Memoirs of a French criminal-turned-detective; the boy liked it best because its leaves were yellow',
  tags: ['book', 'priest', 'adventure', 'secular'], type: DiegeticEntityType.ITEM, itemType: 'book',
  origin: 'The dead priest\'s collection', physicalDescription: 'Yellow leaves',
  defaultFunction: 'Entertainment / adventure reading',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), location: house, condition: 'yellow leaves', owner: null, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

const bicyclePump = sys.addItem({
  id: 'bicycle-pump',
  textMentions: ['rusty bicycle-pump'],
  context: 'Found under a bush in the wild garden. A mundane object that emphasizes the priest\'s mortality and the passage of time — even his possessions are decaying.',
  name: 'The rusty bicycle-pump', description: 'Found under a bush in the wild garden, belonging to the dead priest',
  tags: ['priest', 'decay', 'mundane'], type: DiegeticEntityType.ITEM, itemType: 'bicycle part',
  origin: 'The dead priest\'s possessions', physicalDescription: 'Rusty',
  defaultFunction: 'Inflating bicycle tyres (now useless)',
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), location: wildGarden, condition: 'rusty', owner: null, isHidden: true }, causedBy: {} }],
  firstIntroduced: 'init',
});

const silverBracelet = sys.addItem({
  id: 'silver-bracelet',
  textMentions: ['silver bracelet', 'bracelet'],
  context: 'The bracelet she turns \'round and round her wrist\' during their conversation is one of the story\'s most precisely observed sensory details. It\'s the kind of unconscious gesture that a boy in love would fixate on.',
  name: 'The silver bracelet', description: 'Bracelet on Mangan\'s sister\'s wrist, which she turns round and round during the conversation',
  tags: ['jewelry', 'sensory', 'iconic'], type: DiegeticEntityType.ITEM, itemType: 'jewelry',
  origin: 'Unknown', physicalDescription: 'Silver bracelet',
  defaultFunction: 'Adornment',
  stateHistory: [{ timestamp: ts(30), data: { ...base('init'), location: mangansSister, condition: 'normal', owner: mangansSister, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

const florin = sys.addItem({
  id: 'florin',
  textMentions: ['florin'],
  context: 'A two-shilling coin (one-tenth of a pound). Worth roughly \u00a312-15 in today\'s money. The boy pays a shilling (half the florin) at the turnstile and is left with two pennies and a sixpence — not enough to buy anything meaningful at the bazaar.',
  name: 'The florin', description: 'Two-shilling coin the uncle gives the boy for the bazaar',
  tags: ['money', 'permission'], type: DiegeticEntityType.ITEM, itemType: 'coin',
  origin: 'The uncle', physicalDescription: 'A florin (two shillings)',
  defaultFunction: 'Currency for Araby',
  stateHistory: [{ timestamp: ts(65), data: { ...base('init'), location: house, condition: 'normal', owner: uncle, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

const remainingCoins = sys.addItem({
  id: 'remaining-coins',
  textMentions: ['two pennies', 'sixpence'],
  context: 'The boy \'allowed the two pennies to fall against the sixpence in my pocket\' — the sound of insufficient funds, the auditory counterpart to his visual epiphany.',
  name: 'Two pennies and a sixpence', description: 'The boy\'s remaining change after paying entrance; he lets them fall against each other',
  tags: ['money', 'failure', 'sound'], type: DiegeticEntityType.ITEM, itemType: 'coins',
  origin: 'Change from bazaar entrance fee', physicalDescription: 'Two pennies and a sixpence',
  defaultFunction: 'Insufficient currency',
  stateHistory: [{ timestamp: ts(85), data: { ...base('init'), location: boy, condition: 'in pocket', owner: boy, isHidden: false }, causedBy: {} }],
  firstIntroduced: 'init',
});

// ── Relationships ──

sys.addInterpersonalRelationship({
  id: 'rel-boy-mangans-sister', type: RelationshipType.INTERPERSONAL,
  participants: [boy, mangansSister], nature: 'One-sided romantic infatuation',
  name: 'Boy → Mangan\'s sister', description: 'The boy\'s consuming, idealized love',
  tags: ['romance', 'unrequited', 'idealized'],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), strength: 0.8, dynamics: { power: -0.7, influence: 0.9, conflict: 0.1 }, label: RelationshipLabel.LOVER, specificLabel: 'unrequited infatuation' }, causedBy: {} }],
  firstIntroduced: 'init',
} as InterpersonalRelationship);

sys.addInterpersonalRelationship({
  id: 'rel-boy-uncle', type: RelationshipType.INTERPERSONAL,
  participants: [boy, uncle], nature: 'Guardian-ward, marked by negligence',
  name: 'Boy ↔ Uncle', description: 'Dependent on unreliable guardian',
  tags: ['family', 'guardian', 'obstacle'],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), strength: 0.4, dynamics: { power: -0.8, influence: 0.3, conflict: 0.3 }, label: RelationshipLabel.FAMILY }, causedBy: {} }],
  firstIntroduced: 'init',
} as InterpersonalRelationship);

sys.addInterpersonalRelationship({
  id: 'rel-boy-mangan', type: RelationshipType.INTERPERSONAL,
  participants: [boy, mangan], nature: 'Childhood friendship',
  name: 'Boy ↔ Mangan', description: 'Friends who play in the street together',
  tags: ['friendship', 'childhood'],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), strength: 0.5, dynamics: { power: 0, influence: 0.2, conflict: 0 }, label: RelationshipLabel.FRIEND }, causedBy: {} }],
  firstIntroduced: 'init',
} as InterpersonalRelationship);

sys.addInterpersonalRelationship({
  id: 'rel-uncle-aunt', type: RelationshipType.INTERPERSONAL,
  participants: [uncle, aunt], nature: 'Married couple, domestic tension',
  name: 'Uncle ↔ Aunt', description: 'The aunt manages the uncle\'s shortcomings',
  tags: ['marriage', 'domestic'],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), strength: 0.5, dynamics: { power: -0.2, influence: 0.4, conflict: 0.3 }, label: RelationshipLabel.FAMILY }, causedBy: {} }],
  firstIntroduced: 'init',
} as InterpersonalRelationship);

// ── Absentials ──

const absLonging = sys.addAbsential({
  id: 'abs-longing',
  name: 'The boy\'s romantic longing', description: 'Unfulfilled desire to connect with Mangan\'s sister',
  tags: ['desire', 'romance', 'core-driver'], holder: boy, origin: 'Idealized perception of Mangan\'s sister',
  childAbsentials: ['abs-speak', 'abs-quest'], conflictingAbsentials: [],
  relatedEntities: [{ entityId: mangansSister, relationship: EntityAbsentialRelationship.TARGET, strength: 0.9 }],
  relatedAbsentials: [],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), type: AbsentialType.DESIRE, status: AbsentialStatus.UNSATISFIED, urgency: 0.5, intensity: 0.7 }, causedBy: {} }],
  firstIntroduced: 'init',
});

const absSpeak = sys.addAbsential({
  id: 'abs-speak',
  name: 'The boy\'s desire to speak to her', description: 'Desire to actually talk to Mangan\'s sister',
  tags: ['desire', 'communication'], holder: boy, origin: 'The silent watching/following ritual',
  parentAbsential: absLonging, childAbsentials: [], conflictingAbsentials: [],
  relatedEntities: [{ entityId: mangansSister, relationship: EntityAbsentialRelationship.TARGET, strength: 0.7 }],
  relatedAbsentials: [],
  stateHistory: [{ timestamp: ts(10), data: { ...base('init'), type: AbsentialType.DESIRE, status: AbsentialStatus.UNSATISFIED, urgency: 0.6, intensity: 0.5 }, causedBy: {} }],
  firstIntroduced: 'init',
});

const absQuest = sys.addAbsential({
  id: 'abs-quest',
  name: 'The quest to Araby', description: 'Promise to bring Mangan\'s sister something from the bazaar',
  tags: ['quest', 'promise', 'concrete-goal'], holder: boy, origin: 'The conversation at the railing',
  parentAbsential: absLonging, childAbsentials: [], conflictingAbsentials: [],
  relatedEntities: [
    { entityId: mangansSister, relationship: EntityAbsentialRelationship.BENEFICIARY, strength: 0.8 },
    { entityId: arabyHall, relationship: EntityAbsentialRelationship.TARGET, strength: 0.7 },
    { entityId: uncle, relationship: EntityAbsentialRelationship.OBSTACLE, strength: 0.6 },
  ],
  relatedAbsentials: [],
  stateHistory: [{ timestamp: ts(35), data: { ...base('init'), type: AbsentialType.GOAL, status: AbsentialStatus.UNSATISFIED, urgency: 0.7, intensity: 0.8 }, causedBy: {} }],
  firstIntroduced: 'init',
});

sys.addAbsential({
  id: 'abs-mangans-wish',
  name: 'Mangan\'s sister\'s wish to attend Araby', description: 'She would love to go but cannot because of a convent retreat',
  tags: ['desire', 'blocked', 'convent'], holder: mangansSister, origin: 'Mentioned during the conversation',
  childAbsentials: [], conflictingAbsentials: [],
  relatedEntities: [{ entityId: arabyHall, relationship: EntityAbsentialRelationship.TARGET, strength: 0.5 }],
  relatedAbsentials: [],
  stateHistory: [{ timestamp: ts(35), data: { ...base('init'), type: AbsentialType.DESIRE, status: AbsentialStatus.RESOLVED_BLOCKED, urgency: 0.3, intensity: 0.3 }, causedBy: {} }],
  firstIntroduced: 'init',
});

sys.addAbsential({
  id: 'abs-priest-absence',
  name: 'The dead priest\'s lingering absence', description: 'The priest is gone but his traces permeate the house',
  tags: ['absence', 'death', 'atmosphere'], holder: deadPriest, origin: 'Death of the former tenant',
  childAbsentials: [], conflictingAbsentials: [],
  relatedEntities: [{ entityId: house, relationship: EntityAbsentialRelationship.INFLUENCED_BY, strength: 0.7 }],
  relatedAbsentials: [],
  stateHistory: [{ timestamp: ts(0), data: { ...base('init'), type: AbsentialType.LACK, status: AbsentialStatus.UNSATISFIED, urgency: 0, intensity: 0.4 }, causedBy: {} }],
  firstIntroduced: 'init',
});

// ── Diegetic mental constructs ──

sys.addMentalConstruct({
  id: 'mc-ideal-image',
  name: 'The boy\'s idealized image of Mangan\'s sister',
  description: 'A near-sacred figure surrounded by light, worthy of devotion',
  tags: ['idealization', 'romance'], subject: mangansSister, holder: boy, isDiegetic: true,
  relatedConstructs: [], conflictingConstructs: [], supportingConstructs: [],
  stateHistory: [{ timestamp: ts(5), data: { ...base('init'), content: 'She is an almost sacred figure, surrounded by light', type: MentalConstructType.BELIEF, certainty: CertaintyLevel.CERTAIN, awareness: AwarenessLevel.CONSCIOUS, emotionalAssociation: { devotion: 0.9, awe: 0.8 }, salience: 0.95 }, causedBy: {} }],
  firstIntroduced: 'init',
});

sys.addMentalConstruct({
  id: 'mc-araby-fantasy',
  name: 'The boy\'s fantasy of Araby',
  description: 'The word "Araby" casts an Eastern enchantment — the bazaar as exotic quest destination',
  tags: ['fantasy', 'orientalism'], subject: arabyHall, holder: boy, isDiegetic: true,
  relatedConstructs: ['mc-ideal-image'], conflictingConstructs: [], supportingConstructs: ['mc-ideal-image'],
  stateHistory: [{ timestamp: ts(38), data: { ...base('init'), content: 'The syllables of Araby cast an Eastern enchantment over me', type: MentalConstructType.BELIEF, certainty: CertaintyLevel.CERTAIN, awareness: AwarenessLevel.CONSCIOUS, emotionalAssociation: { enchantment: 0.9, anticipation: 0.8 }, salience: 0.9 }, causedBy: {} }],
  firstIntroduced: 'init',
});

sys.addMentalConstruct({
  id: 'mc-aunt-suspicion',
  name: 'The aunt\'s suspicion about Freemasonry',
  description: 'The aunt hopes the bazaar is not some Freemason affair',
  tags: ['suspicion', 'religion'], subject: arabyHall, holder: aunt, isDiegetic: true,
  relatedConstructs: [], conflictingConstructs: [], supportingConstructs: [],
  stateHistory: [{ timestamp: ts(42), data: { ...base('init'), content: 'Hopes it is not some Freemason affair', type: MentalConstructType.SPECULATION, certainty: CertaintyLevel.DOUBTFUL, awareness: AwarenessLevel.CONSCIOUS, emotionalAssociation: { suspicion: 0.5 }, salience: 0.3 }, causedBy: {} }],
  firstIntroduced: 'init',
});

// ── Span structure ──

const act1 = sys.createSpan(rootId, StorySpanType.ACT, 'Act 1: The Street and the Infatuation', 'Setting, characters, the boy\'s growing obsession', 0, 34);
const act2 = sys.createSpan(rootId, StorySpanType.ACT, 'Act 2: The Promise and the Waiting', 'The conversation, the agonizing wait', 34, 72);
const act3 = sys.createSpan(rootId, StorySpanType.ACT, 'Act 3: Araby and the Epiphany', 'The journey and devastating realization', 72, 100);

const s1a = sys.createSpan(act1, StorySpanType.SCENE, 'North Richmond Street described', 'The blind street, the dead priest, the house', 0, 9);
const s1b = sys.createSpan(act1, StorySpanType.SCENE, 'Street play and first sightings', 'Winter evenings, play, watching Mangan\'s sister', 9, 18);
const s1c = sys.createSpan(act1, StorySpanType.SCENE, 'The daily ritual of following', 'Morning watching, following her through the streets', 18, 23);
const s1d = sys.createSpan(act1, StorySpanType.SCENE, 'The chalice passage', 'Her image in hostile places, the market, the chalice metaphor', 23, 30);
const s1e = sys.createSpan(act1, StorySpanType.SCENE, 'The back drawing-room', '"O love! O love!" in the room where the priest died', 30, 34);

const s2a = sys.createSpan(act2, StorySpanType.SCENE, 'The conversation at the railing', 'First real exchange, Araby mentioned, the promise', 34, 42);
const s2b = sys.createSpan(act2, StorySpanType.SCENE, 'Days of distraction', 'School, enchantment, the aunt\'s Freemasonry comment', 42, 50);
const s2c = sys.createSpan(act2, StorySpanType.SCENE, 'Saturday — waiting for the uncle', 'Clock-watching, Mrs. Mercer, the uncle arrives late', 50, 68);
const s2d = sys.createSpan(act2, StorySpanType.SCENE, 'The uncle gives money', 'Uncle drunk, forgotten, aunt intervenes, Arab\'s Farewell', 68, 72);

const s3a = sys.createSpan(act3, StorySpanType.SCENE, 'The journey', 'Buckingham Street, the train ride', 72, 80);
const s3b = sys.createSpan(act3, StorySpanType.SCENE, 'Arriving at the bazaar', 'Turnstile, the dark hall, church-like silence, coins on salver', 80, 86);
const s3c = sys.createSpan(act3, StorySpanType.SCENE, 'The stall and the flirtation', 'Overhearing the banal English flirtation, the young lady\'s question', 86, 95);
const s3d = sys.createSpan(act3, StorySpanType.SCENE, 'The epiphany', 'The lights go out, the boy sees himself clearly', 95, 100);

// ── Events ──

const e01 = sys.addEvent(s1a, { id: 'e01-street-described', type: NarrativeEventType.ENVIRONMENTAL, description: 'North Richmond Street described as blind, quiet except when the Christian Brothers\' School sets boys free. Uninhabited house at the blind end.', timestamp: ts(1), textLocation: loc(4, 9), participants: [northRichmondSt] });

const e02 = sys.addEvent(s1a, { id: 'e02-priest-legacy', type: NarrativeEventType.ENVIRONMENTAL, description: 'The dead priest\'s legacy: musty air, waste room littered with papers, three books found (The Abbot, The Devout Communicant, The Memoirs of Vidocq). Rusty bicycle-pump in the wild garden.', timestamp: ts(3), textLocation: loc(11, 21), participants: [deadPriest, house, bookAbbot, bookDevout, bookVidocq, bicyclePump, wildGarden], precedingEvent: 'e01-street-described' });

const e03 = sys.addEvent(s1b, { id: 'e03-winter-play', type: NarrativeEventType.ACTION, description: 'Winter evenings: the boys play in the dark streets, running through muddy lanes, past dark gardens and odorous stables. If the uncle is seen they hide; if Mangan\'s sister appears they watch from the shadow.', timestamp: ts(10), textLocation: loc(23, 43), participants: [boy, mangan, uncle, mangansSister, northRichmondSt], precedingEvent: 'e02-priest-legacy' });

const e04 = sys.addEvent(s1b, { id: 'e04-sister-appears', type: NarrativeEventType.ENVIRONMENTAL, description: 'Mangan\'s sister appears at the doorstep to call her brother. Her figure defined by the light from the half-opened door, dress swinging, soft rope of hair tossed from side to side.', timestamp: ts(14), textLocation: loc(36, 43), participants: [mangansSister, mangan, boy], precedingEvent: 'e03-winter-play' });

const e05 = sys.addEvent(s1c, { id: 'e05-daily-following', type: NarrativeEventType.ACTION, description: 'Every morning the boy lies on the floor in the front parlour watching her door through the blind, then follows her silently through the streets, quickening his pace to pass her.', timestamp: ts(19), textLocation: loc(45, 53), participants: [boy, mangansSister], precedingEvent: 'e04-sister-appears' });

const e06 = sys.addEvent(s1d, { id: 'e06-chalice-passage', type: NarrativeEventType.ACTION, description: 'Her image accompanies the boy to the Saturday market with his aunt. Amid drunken men, bargaining women, street-singers chanting about O\'Donovan Rossa. He imagines bearing his chalice safely through a throng of foes.', timestamp: ts(25), textLocation: loc(55, 63), participants: [boy, mangansSister, aunt, marketStreets], precedingEvent: 'e05-daily-following' });

const e07 = sys.addEvent(s1d, { id: 'e07-harp-metaphor', type: NarrativeEventType.REVELATION, description: 'Strange prayers and praises spring to the boy\'s lips. His eyes fill with tears he cannot explain. His body is like a harp and her words and gestures are like fingers running upon the wires.', timestamp: ts(28), textLocation: loc(63, 70), participants: [boy, mangansSister], precedingEvent: 'e06-chalice-passage' });

const e08 = sys.addEvent(s1e, { id: 'e08-o-love', type: NarrativeEventType.REVELATION, description: 'In the back drawing-room where the priest died, on a dark rainy evening, the boy presses his palms together and murmurs "O love! O love!" many times.', timestamp: ts(32), textLocation: loc(72, 80), participants: [boy, backDrawingRoom, deadPriest], precedingEvent: 'e07-harp-metaphor' });

const e09 = sys.addEvent(s2a, { id: 'e09-conversation', type: NarrativeEventType.DIALOGUE, description: 'At last she speaks to him. She asks if he is going to Araby. She cannot go because of a convent retreat. She turns a silver bracelet round and round her wrist. Light catches the white curve of her neck.', timestamp: ts(36), textLocation: loc(82, 97), participants: [boy, mangansSister, silverBracelet], precedingEvent: 'e08-o-love' });

sys.updateAbsentialStatus('abs-speak', AbsentialStatus.RESOLVED_SATISFIED, 'e09-conversation', ts(36));

const e10 = sys.addEvent(s2a, { id: 'e10-promise', type: NarrativeEventType.DIALOGUE, description: '"If I go," I said, "I will bring you something." The boy makes the promise.', timestamp: ts(40), textLocation: loc(99, 101), participants: [boy, mangansSister], precedingEvent: 'e09-conversation' });

const e11 = sys.addEvent(s2b, { id: 'e11-distraction', type: NarrativeEventType.ACTION, description: 'Days of distraction: the boy wishes to annihilate the intervening days, chafes against school. The syllables of "Araby" cast an Eastern enchantment. Her image comes between him and the page.', timestamp: ts(44), textLocation: loc(103, 108), participants: [boy, classroom, schoolmaster], precedingEvent: 'e10-promise' });

const e12 = sys.addEvent(s2b, { id: 'e12-freemasonry', type: NarrativeEventType.DIALOGUE, description: 'The boy asks for leave to go to the bazaar on Saturday night. His aunt is surprised and hopes it is not some Freemason affair.', timestamp: ts(46), textLocation: loc(109, 110), participants: [boy, aunt], precedingEvent: 'e11-distraction' });

const e13 = sys.addEvent(s2b, { id: 'e13-schoolmaster', type: NarrativeEventType.ACTION, description: 'The schoolmaster\'s face passes from amiability to sternness; he hopes the boy is not beginning to idle.', timestamp: ts(48), textLocation: loc(111, 112), participants: [schoolmaster, boy], precedingEvent: 'e12-freemasonry' });

const e14 = sys.addEvent(s2c, { id: 'e14-saturday-reminder', type: NarrativeEventType.DIALOGUE, description: 'Saturday morning: the boy reminds his uncle about the bazaar. "Yes, boy, I know." The uncle is fussing at the hallstand.', timestamp: ts(51), textLocation: loc(117, 122), participants: [boy, uncle], precedingEvent: 'e13-schoolmaster' });

const e15 = sys.addEvent(s2c, { id: 'e15-clock-watching', type: NarrativeEventType.ACTION, description: 'The boy sits staring at the clock. Mounts the staircase, sings in the empty rooms. From the front window watches companions playing, looks at the dark house where she lives, sees her brown-clad figure cast by imagination.', timestamp: ts(55), textLocation: loc(127, 137), participants: [boy, house, mangansSister], precedingEvent: 'e14-saturday-reminder' });

const e16 = sys.addEvent(s2c, { id: 'e16-mrs-mercer', type: NarrativeEventType.ACTION, description: 'Mrs. Mercer arrives, sits at the fire. The boy endures the gossip of the tea-table. The meal stretches beyond an hour. Mrs. Mercer leaves after eight o\'clock.', timestamp: ts(58), textLocation: loc(139, 145), participants: [mrsMercer, boy, aunt, house], precedingEvent: 'e15-clock-watching' });

const e17 = sys.addEvent(s2c, { id: 'e17-aunt-warning', type: NarrativeEventType.DIALOGUE, description: 'The aunt says: "I\'m afraid you may put off your bazaar for this night of Our Lord."', timestamp: ts(62), textLocation: loc(146, 148), participants: [aunt, boy], precedingEvent: 'e16-mrs-mercer' });

const e18 = sys.addEvent(s2d, { id: 'e18-uncle-arrives', type: NarrativeEventType.ACTION, description: 'At nine o\'clock the uncle\'s latchkey in the halldoor. He talks to himself, the hallstand rocks under his overcoat. The boy interprets these signs. The uncle has forgotten about the bazaar.', timestamp: ts(68), textLocation: loc(150, 154), participants: [uncle, boy, house], precedingEvent: 'e17-aunt-warning' });

const e19 = sys.addEvent(s2d, { id: 'e19-aunt-intervenes', type: NarrativeEventType.DIALOGUE, description: 'The aunt intervenes: "Can\'t you give him the money and let him go? You\'ve kept him late enough as it is." The uncle apologizes, quotes "All work and no play," asks about The Arab\'s Farewell to his Steed.', timestamp: ts(70), textLocation: loc(156, 168), participants: [aunt, uncle, boy, florin], precedingEvent: 'e18-uncle-arrives' });

const e20 = sys.addEvent(s3a, { id: 'e20-buckingham-st', type: NarrativeEventType.ACTION, description: 'The boy holds a florin tightly, strides down Buckingham Street. The streets thronged with buyers, glaring with gas. He takes a seat in a third-class carriage of a deserted train.', timestamp: ts(74), textLocation: loc(170, 178), participants: [boy, florin, buckinghamSt, trainCarriage], precedingEvent: 'e19-aunt-intervenes' });

const e21 = sys.addEvent(s3a, { id: 'e21-train-ride', type: NarrativeEventType.ACTION, description: 'After intolerable delay the train creeps among ruinous houses, over the twinkling river. At Westland Row a crowd is pressed back — special train for the bazaar. The boy remains alone.', timestamp: ts(77), textLocation: loc(174, 179), participants: [boy, trainCarriage], precedingEvent: 'e20-buckingham-st' });

const e22 = sys.addEvent(s3b, { id: 'e22-entering-bazaar', type: NarrativeEventType.ACTION, description: 'The boy passes through a turnstile, handing a shilling to a weary-looking man. He finds himself in a big hall girdled by a gallery. Nearly all stalls closed, greater part in darkness.', timestamp: ts(82), textLocation: loc(184, 189), participants: [boy, turnstileMan, arabyHall], precedingEvent: 'e21-train-ride' });

const e23 = sys.addEvent(s3b, { id: 'e23-church-silence', type: NarrativeEventType.ENVIRONMENTAL, description: 'A silence like that which pervades a church after a service. Two men counting money on a salver. The fall of the coins.', timestamp: ts(84), textLocation: loc(188, 193), participants: [boy, arabyHall], precedingEvent: 'e22-entering-bazaar' });

const e24 = sys.addEvent(s3c, { id: 'e24-examining-wares', type: NarrativeEventType.ACTION, description: 'Remembering with difficulty why he had come, the boy examines porcelain vases and flowered tea-sets at a stall.', timestamp: ts(87), textLocation: loc(195, 196), participants: [boy, arabyHall], precedingEvent: 'e23-church-silence' });

const e25 = sys.addEvent(s3c, { id: 'e25-english-flirtation', type: NarrativeEventType.DIALOGUE, description: 'A young lady is talking and laughing with two young gentlemen. The boy remarks their English accents. Banal flirtation: "O, I never said such a thing!" / "O, but you did!" / "O, there\'s a ... fib!"', timestamp: ts(89), textLocation: loc(197, 211), participants: [stallLady, twoGentlemen, boy], precedingEvent: 'e24-examining-wares' });

const e26 = sys.addEvent(s3c, { id: 'e26-no-thank-you', type: NarrativeEventType.DIALOGUE, description: 'The young lady comes over and asks if he wishes to buy anything. Her tone is not encouraging — she speaks out of a sense of duty. The boy murmurs "No, thank you."', timestamp: ts(91), textLocation: loc(213, 219), participants: [stallLady, boy], precedingEvent: 'e25-english-flirtation' });

const e27 = sys.addEvent(s3c, { id: 'e27-coins-falling', type: NarrativeEventType.ACTION, description: 'The boy lingers before her stall to make his interest seem real, then turns away. He allows the two pennies to fall against the sixpence in his pocket.', timestamp: ts(93), textLocation: loc(225, 228), participants: [boy, remainingCoins], precedingEvent: 'e26-no-thank-you' });

const e28 = sys.addEvent(s3d, { id: 'e28-epiphany', type: NarrativeEventType.REVELATION, description: 'A voice calls from the gallery that the light is out. The upper hall is completely dark. Gazing up into the darkness the boy sees himself as a creature driven and derided by vanity; his eyes burn with anguish and anger.', timestamp: ts(98), textLocation: loc(228, 233), participants: [boy, arabyHall], precedingEvent: 'e27-coins-falling' });

sys.updateAbsentialStatus('abs-quest', AbsentialStatus.RESOLVED_BLOCKED, 'e28-epiphany', ts(98));
sys.updateAbsentialStatus('abs-longing', AbsentialStatus.RESOLVED_MIXED, 'e28-epiphany', ts(98));

// ════════════════════════════════════════════════════════
//  PASS 2: Reading 1 — Formalist / Epiphanic
// ════════════════════════════════════════════════════════

sys.createReading('formalist', 'A formalist reading focused on narrative structure, imagery patterns, the Joycean epiphany as formal device, light/dark symbolism, and the movement from romantic idealization to devastating self-knowledge.',
  { id: 'narr-formalist', name: 'Retrospective first-person narrator', description: 'The adult narrator looking back with ironic distance', tags: ['retrospective', 'ironic'], type: NonDiegeticEntityType.NARRATOR, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), reliability: 0.7, mentalConstructs: [], perspective: NarratorPerspective.FIRST_PERSON }, causedBy: {} }], firstIntroduced: 'init' },
  { id: 'reader-formalist', name: 'Formalist implied reader', description: 'A reader attuned to structure and imagery', tags: ['formalist'], type: NonDiegeticEntityType.READER, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), mentalConstructs: [], emotions: emptyEmotion() }, causedBy: {} }], firstIntroduced: 'init' },
  { id: 'author-formalist', name: 'James Joyce', description: 'Joyce as craftsman of the epiphany', tags: ['modernist'], type: NonDiegeticEntityType.AUTHOR, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), style: { irony: 0.9, lyricism: 0.8, precision: 0.9 }, themes: [] }, causedBy: {} }], firstIntroduced: 'init' },
);

sys.addTheme('formalist', { id: 'th-disillusionment', name: 'Disillusionment / Epiphany', description: 'Movement from romantic idealization to painful self-awareness', tags: ['epiphany', 'loss-of-innocence'], type: NonDiegeticEntityType.THEME, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.3, relatedElements: [boy, mangansSister, arabyHall], manifestations: [], progression: [] }, causedBy: {} }], firstIntroduced: 'init' });
sys.addTheme('formalist', { id: 'th-paralysis', name: 'Paralysis', description: 'Pervasive stasis and entrapment — the central Dubliners theme', tags: ['stasis', 'entrapment'], type: NonDiegeticEntityType.THEME, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.5, relatedElements: [northRichmondSt, uncle, house], manifestations: [], progression: [] }, causedBy: {} }], firstIntroduced: 'init' });
sys.addTheme('formalist', { id: 'th-secular-devotion', name: 'Secular devotion / religious language for profane love', description: 'The boy\'s love is described in liturgical terms — chalice, prayers, adoration', tags: ['religion', 'secular-sacred'], type: NonDiegeticEntityType.THEME, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.6, relatedElements: [boy, mangansSister, deadPriest], manifestations: [], progression: [] }, causedBy: {} }], firstIntroduced: 'init' });

sys.addSymbol('formalist', { id: 'sym-light-dark', name: 'Light and darkness', description: 'Light = idealization, the girl illuminated; darkness = reality, Dublin, the closing bazaar', tags: ['imagery'], type: NonDiegeticEntityType.SYMBOL, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentMeanings: [{ description: 'Light = romantic idealization', strength: 0.8 }, { description: 'Darkness = reality, disillusionment', strength: 0.8 }], currentManifestations: [mangansSister, northRichmondSt, arabyHall] }, causedBy: {} }], firstIntroduced: 'init' });
sys.addSymbol('formalist', { id: 'sym-chalice', name: 'The chalice', description: '"I bore my chalice safely through a throng of foes" — the boy as knight/priest', tags: ['religious', 'quest'], type: NonDiegeticEntityType.SYMBOL, stateHistory: [{ timestamp: ts(25), data: { ...base('init'), currentMeanings: [{ description: 'Sacred vessel for profane devotion', strength: 0.9 }, { description: 'The boy as questing knight-priest', strength: 0.7 }], currentManifestations: [boy, mangansSister, marketStreets] }, causedBy: {} }], firstIntroduced: 'init' });
sys.addSymbol('formalist', { id: 'sym-blind-street', name: 'The blind street', description: 'Physical dead-end as metaphor for spiritual/emotional dead-end', tags: ['setting-as-symbol'], type: NonDiegeticEntityType.SYMBOL, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentMeanings: [{ description: 'Dead-end street = dead-end desire', strength: 0.7 }], currentManifestations: [northRichmondSt] }, causedBy: {} }], firstIntroduced: 'init' });

sys.annotateEvent('formalist', 'e01-street-described', { significance: 0.6, note: 'Establishes the "blind" setting — dead-end street as structural premonition' });
sys.annotateEvent('formalist', 'e02-priest-legacy', { significance: 0.5, note: 'The priest\'s books span sacred, romantic, and criminal — foreshadows the story\'s range' });
sys.annotateEvent('formalist', 'e03-winter-play', { significance: 0.4, note: 'Communal play contrasted with individual obsession' });
sys.annotateEvent('formalist', 'e04-sister-appears', { significance: 0.7, note: 'First appearance of the light imagery — her figure defined by light from the half-opened door' });
sys.annotateEvent('formalist', 'e05-daily-following', { significance: 0.6, note: 'The ritual of watching/following establishes pattern of devotion' });
sys.annotateEvent('formalist', 'e06-chalice-passage', { significance: 0.9, note: 'The chalice passage — peak of religious imagery for secular love' });
sys.annotateEvent('formalist', 'e07-harp-metaphor', { significance: 0.8, note: 'The harp metaphor — body as instrument played by her words and gestures' });
sys.annotateEvent('formalist', 'e08-o-love', { significance: 0.85, note: '"O love! O love!" — private devotion in the dead priest\'s room; secular prayer' });
sys.annotateEvent('formalist', 'e09-conversation', { significance: 0.9, note: 'Light on her neck, the silver bracelet, the half-opened door — culmination of light imagery' });
sys.annotateEvent('formalist', 'e10-promise', { significance: 0.8, note: 'The promise creates the concrete quest — the story\'s structural turning point' });
sys.annotateEvent('formalist', 'e11-distraction', { significance: 0.5, note: '"Eastern enchantment" — the word Araby as incantation' });
sys.annotateEvent('formalist', 'e12-freemasonry', { significance: 0.3, note: 'Minor friction — aunt\'s Freemasonry comment as social texture' });
sys.annotateEvent('formalist', 'e13-schoolmaster', { significance: 0.3, note: 'External recognition of the boy\'s inner transformation' });
sys.annotateEvent('formalist', 'e14-saturday-reminder', { significance: 0.4, note: 'Rising tension, the uncle as obstacle' });
sys.annotateEvent('formalist', 'e15-clock-watching', { significance: 0.6, note: 'The boy sees her imagined figure from the upper window — light imagery inverted (dark looking out)' });
sys.annotateEvent('formalist', 'e16-mrs-mercer', { significance: 0.4, note: 'Mrs. Mercer as embodiment of the tedious adult world' });
sys.annotateEvent('formalist', 'e17-aunt-warning', { significance: 0.4, note: '"This night of Our Lord" — religious language used to deny, not enable' });
sys.annotateEvent('formalist', 'e18-uncle-arrives', { significance: 0.7, note: 'Interpreting signs (rocking hallstand, talking to himself) — ironic epistemology' });
sys.annotateEvent('formalist', 'e19-aunt-intervenes', { significance: 0.5, note: '"The Arab\'s Farewell to his Steed" — internal literary parallel' });
sys.annotateEvent('formalist', 'e20-buckingham-st', { significance: 0.5, note: 'The florin held tightly — the quest object reduced to coin' });
sys.annotateEvent('formalist', 'e21-train-ride', { significance: 0.5, note: 'The empty train — isolation intensifies' });
sys.annotateEvent('formalist', 'e22-entering-bazaar', { significance: 0.6, note: '"The magical name" but the reality is a closing hall' });
sys.annotateEvent('formalist', 'e23-church-silence', { significance: 0.7, note: 'Church-like silence + coins on a salver — religion and commerce fused' });
sys.annotateEvent('formalist', 'e24-examining-wares', { significance: 0.5, note: '"Remembering with difficulty why I had come" — the quest already dissolving' });
sys.annotateEvent('formalist', 'e25-english-flirtation', { significance: 0.8, note: 'Structural mirror to the boy\'s romance — deflated, trivial, banal' });
sys.annotateEvent('formalist', 'e26-no-thank-you', { significance: 0.7, note: 'Her tone "not encouraging" — the stall lady as anti-Mangan\'s-sister' });
sys.annotateEvent('formalist', 'e27-coins-falling', { significance: 0.6, note: 'The coins falling against each other — sound replacing the imagined gift' });
sys.annotateEvent('formalist', 'e28-epiphany', { significance: 1.0, note: 'THE epiphany. "Driven and derided by vanity." Light extinguished, darkness total.' });

sys.annotateEntity('formalist', boy, 1.0, 'Protagonist and center of consciousness');
sys.annotateEntity('formalist', mangansSister, 0.85, 'The object of idealization — more symbol than person');
sys.annotateEntity('formalist', uncle, 0.5, 'Structural obstacle; embodies paralysis');
sys.annotateEntity('formalist', deadPriest, 0.6, 'Absent presence — his traces haunt the text');
sys.annotateEntity('formalist', stallLady, 0.7, 'Structural mirror to Mangan\'s sister');

sys.annotateAbsential('formalist', 'abs-longing', 1.0, 'The story\'s engine — transforms into the epiphany');
sys.annotateAbsential('formalist', 'abs-quest', 0.85, 'The concrete quest that fails, triggering the formal climax');
sys.annotateAbsential('formalist', 'abs-priest-absence', 0.5, 'Atmospheric — the absent priest as predecessor to the boy\'s crisis');

for (const [pct, val] of [[0,0.2],[10,0.3],[20,0.5],[28,0.6],[32,0.65],[36,0.75],[40,0.7],[45,0.55],[51,0.6],[55,0.7],[62,0.8],[68,0.85],[74,0.75],[82,0.8],[89,0.9],[93,0.85],[98,1.0]] as [number,number][]) {
  sys.addTensionPoint('formalist', ts(pct), val);
}

// ════════════════════════════════════════════════════════
//  PASS 2: Reading 2 — Postcolonial
// ════════════════════════════════════════════════════════

sys.createReading('postcolonial', 'A postcolonial reading focused on "Araby" as orientalist fantasy, English cultural dominance, commerce and empire, Dublin as colonized space, and the boy\'s desire as mimicry of imperial romance.',
  { id: 'narr-postcolonial', name: 'Retrospective narrator (colonial subject)', description: 'The narrator as adult Irish subject reflecting on colonial fantasy', tags: ['retrospective', 'colonial-subject'], type: NonDiegeticEntityType.NARRATOR, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), reliability: 0.8, mentalConstructs: [], perspective: NarratorPerspective.FIRST_PERSON }, causedBy: {} }], firstIntroduced: 'init' },
  { id: 'reader-postcolonial', name: 'Postcolonial implied reader', description: 'A reader attuned to imperial structures and orientalism', tags: ['postcolonial'], type: NonDiegeticEntityType.READER, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), mentalConstructs: [], emotions: emptyEmotion() }, causedBy: {} }], firstIntroduced: 'init' },
  { id: 'author-postcolonial', name: 'James Joyce', description: 'Joyce as Irish writer navigating the colonial condition', tags: ['irish', 'exile'], type: NonDiegeticEntityType.AUTHOR, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), style: { irony: 0.9, anti_imperial: 0.7 }, themes: [] }, causedBy: {} }], firstIntroduced: 'init' },
);

sys.addTheme('postcolonial', { id: 'th-orientalism', name: 'Orientalism', description: '"Araby" as orientalist fantasy — the exotic East as projection of desire', tags: ['orientalism', 'empire'], type: NonDiegeticEntityType.THEME, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.7, relatedElements: [arabyHall, boy], manifestations: [], progression: [] }, causedBy: {} }], firstIntroduced: 'init' });
sys.addTheme('postcolonial', { id: 'th-commerce', name: 'Commerce and Empire', description: 'Everything reduces to commercial transaction', tags: ['commerce', 'capitalism'], type: NonDiegeticEntityType.THEME, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.5, relatedElements: [arabyHall, florin, remainingCoins, marketStreets], manifestations: [], progression: [] }, causedBy: {} }], firstIntroduced: 'init' });
sys.addTheme('postcolonial', { id: 'th-english-dominance', name: 'English cultural dominance', description: 'English accents, English literature, the colonizer\'s commerce', tags: ['english', 'colonial'], type: NonDiegeticEntityType.THEME, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.4, relatedElements: [twoGentlemen, stallLady, bookAbbot], manifestations: [], progression: [] }, causedBy: {} }], firstIntroduced: 'init' });
sys.addTheme('postcolonial', { id: 'th-dublin-colonized', name: 'Dublin as colonized space', description: 'Paralysis as colonial paralysis — British rule, Catholic constraint, economic stagnation', tags: ['dublin', 'colonial'], type: NonDiegeticEntityType.THEME, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), prevalence: 0.6, relatedElements: [northRichmondSt, house, classroom], manifestations: [], progression: [] }, causedBy: {} }], firstIntroduced: 'init' });

sys.addSymbol('postcolonial', { id: 'sym-name-araby', name: 'The name "Araby"', description: 'An orientalist signifier — an exotic elsewhere that never delivers', tags: ['orientalism'], type: NonDiegeticEntityType.SYMBOL, stateHistory: [{ timestamp: ts(0), data: { ...base('init'), currentMeanings: [{ description: 'Orientalist fantasy projected onto a Dublin charity bazaar', strength: 0.9 }], currentManifestations: [arabyHall] }, causedBy: {} }], firstIntroduced: 'init' });
sys.addSymbol('postcolonial', { id: 'sym-arabs-farewell', name: '"The Arab\'s Farewell to his Steed"', description: 'Sentimental orientalist verse — the colonizer\'s romanticized East', tags: ['orientalism', 'poetry'], type: NonDiegeticEntityType.SYMBOL, stateHistory: [{ timestamp: ts(70), data: { ...base('init'), currentMeanings: [{ description: 'Sentimental orientalism — the East as the colonizer imagines it', strength: 0.8 }], currentManifestations: [uncle] }, causedBy: {} }], firstIntroduced: 'init' });
sys.addSymbol('postcolonial', { id: 'sym-coins', name: 'The florin / coins', description: 'Imperial currency — desire reduces to financial transaction', tags: ['money', 'empire'], type: NonDiegeticEntityType.SYMBOL, stateHistory: [{ timestamp: ts(65), data: { ...base('init'), currentMeanings: [{ description: 'Imperial currency mediating all desire', strength: 0.7 }], currentManifestations: [florin, remainingCoins] }, causedBy: {} }], firstIntroduced: 'init' });

sys.annotateEvent('postcolonial', 'e01-street-described', { significance: 0.7, note: 'Christian Brothers\' School — Catholic education under British rule' });
sys.annotateEvent('postcolonial', 'e02-priest-legacy', { significance: 0.6, note: 'Walter Scott (English romance), devotional text, Vidocq (French secular) — colonial cultural mix' });
sys.annotateEvent('postcolonial', 'e03-winter-play', { significance: 0.3, note: 'Background texture of colonized Dublin' });
sys.annotateEvent('postcolonial', 'e04-sister-appears', { significance: 0.4, note: 'Domestic scene, minor in this reading' });
sys.annotateEvent('postcolonial', 'e05-daily-following', { significance: 0.3, note: 'The following ritual — minor' });
sys.annotateEvent('postcolonial', 'e06-chalice-passage', { significance: 0.7, note: 'O\'Donovan Rossa ballads, "troubles in our native land" — explicit colonial context' });
sys.annotateEvent('postcolonial', 'e07-harp-metaphor', { significance: 0.3, note: 'Private emotional intensity — less central' });
sys.annotateEvent('postcolonial', 'e08-o-love', { significance: 0.3, note: 'Personal devotion — less central' });
sys.annotateEvent('postcolonial', 'e09-conversation', { significance: 0.5, note: 'The convent retreat — Catholic institutional constraint' });
sys.annotateEvent('postcolonial', 'e10-promise', { significance: 0.6, note: 'Promise to bring something from "Araby" — desire mediated by orientalist fantasy' });
sys.annotateEvent('postcolonial', 'e11-distraction', { significance: 0.8, note: '"Eastern enchantment" — the key phrase. Enchanted by an orientalist signifier, not a real place.' });
sys.annotateEvent('postcolonial', 'e12-freemasonry', { significance: 0.5, note: 'Freemasonry = Protestant/English threat in Catholic Irish imagination' });
sys.annotateEvent('postcolonial', 'e13-schoolmaster', { significance: 0.2, note: 'Minor' });
sys.annotateEvent('postcolonial', 'e14-saturday-reminder', { significance: 0.3, note: 'Minor' });
sys.annotateEvent('postcolonial', 'e15-clock-watching', { significance: 0.3, note: 'Minor' });
sys.annotateEvent('postcolonial', 'e16-mrs-mercer', { significance: 0.3, note: 'Pawnbroker\'s widow collecting stamps — colonial commerce and pious charity intertwined' });
sys.annotateEvent('postcolonial', 'e17-aunt-warning', { significance: 0.2, note: 'Minor' });
sys.annotateEvent('postcolonial', 'e18-uncle-arrives', { significance: 0.4, note: 'Failed patriarch in a colonized domestic space' });
sys.annotateEvent('postcolonial', 'e19-aunt-intervenes', { significance: 0.9, note: '"The Arab\'s Farewell to his Steed" — the uncle performs orientalist sentiment. The adult version of the boy\'s fantasy.' });
sys.annotateEvent('postcolonial', 'e20-buckingham-st', { significance: 0.6, note: 'Buckingham Street — named for the English palace. Imperial geography.' });
sys.annotateEvent('postcolonial', 'e21-train-ride', { significance: 0.4, note: 'Colonial infrastructure, "ruinous houses"' });
sys.annotateEvent('postcolonial', 'e22-entering-bazaar', { significance: 0.7, note: 'The "magical name" costs a shilling. Enchantment is purchased.' });
sys.annotateEvent('postcolonial', 'e23-church-silence', { significance: 0.8, note: 'Coins on a salver — the bazaar is commerce, not wonder' });
sys.annotateEvent('postcolonial', 'e24-examining-wares', { significance: 0.5, note: 'The orientalist spell is breaking' });
sys.annotateEvent('postcolonial', 'e25-english-flirtation', { significance: 1.0, note: 'THE key moment. English accents. The colonizer owns even the fantasy of the East.' });
sys.annotateEvent('postcolonial', 'e26-no-thank-you', { significance: 0.7, note: 'English woman speaks to Irish boy "out of a sense of duty" — colonial condescension' });
sys.annotateEvent('postcolonial', 'e27-coins-falling', { significance: 0.6, note: 'Imperial coins — all that remains' });
sys.annotateEvent('postcolonial', 'e28-epiphany', { significance: 0.9, note: '"Vanity" encompasses both personal vanity and the vanity of colonial fantasy' });

sys.annotateEntity('postcolonial', boy, 0.9, 'Colonial subject who internalizes orientalist fantasy');
sys.annotateEntity('postcolonial', mangansSister, 0.4, 'Catalyst, not the focus');
sys.annotateEntity('postcolonial', twoGentlemen, 0.9, 'English accents at the heart of the "oriental" bazaar — the colonizer');
sys.annotateEntity('postcolonial', stallLady, 0.8, 'English woman in the oriental bazaar — complicit in colonial commerce');
sys.annotateEntity('postcolonial', uncle, 0.6, 'Performs orientalist sentiment via the poem');
sys.annotateEntity('postcolonial', deadPriest, 0.5, 'His library mixes colonial and religious culture');

sys.annotateAbsential('postcolonial', 'abs-longing', 0.6, 'The longing is a symptom of colonial desire');
sys.annotateAbsential('postcolonial', 'abs-quest', 0.8, 'The quest to "Araby" is a quest for an orientalist elsewhere that doesn\'t exist');

for (const [pct, val] of [[0,0.3],[10,0.2],[25,0.5],[36,0.4],[44,0.6],[58,0.3],[70,0.7],[74,0.6],[82,0.7],[89,1.0],[93,0.9],[98,0.95]] as [number,number][]) {
  sys.addTensionPoint('postcolonial', ts(pct), val);
}

// ════════════════════════════════════════════════════════
//  Text Annotations (diegetic — factual references)
// ════════════════════════════════════════════════════════

// Street and settings
sys.annotate('north-richmond-st', 4, 0, 4, 21, 'North Richmond Street');
sys.annotate('back-drawing-room', 72, 34, 72, 53, 'back drawing-room');
sys.annotate('wild-garden', 18, 4, 18, 15, 'wild garden');
sys.annotate('buckingham-st', 170, 47, 170, 64, 'Buckingham Street');

// The priest's books — each is both an item AND a reference to the dead priest
sys.annotate('book-abbot', 15, 38, 15, 47, 'The Abbot');
sys.annotate('dead-priest', 15, 38, 15, 47, 'The Abbot', 'Part of the dead priest\'s library');
sys.annotate('book-devout', 16, 0, 16, 18, 'Devout Communicant');
sys.annotate('dead-priest', 16, 0, 16, 18, 'Devout Communicant', 'Part of the dead priest\'s library');
sys.annotate('book-vidocq', 16, 25, 16, 47, 'The Memoirs of Vidocq');
sys.annotate('dead-priest', 16, 25, 16, 47, 'The Memoirs of Vidocq', 'Part of the dead priest\'s library');

// Other items
sys.annotate('bicycle-pump', 19, 32, 19, 50, 'rusty bicycle-pump');
sys.annotate('dead-priest', 19, 32, 19, 50, 'rusty bicycle-pump', 'The late tenant\'s possession');
sys.annotate('silver-bracelet', 89, 29, 89, 44, 'silver bracelet');
sys.annotate('mangans-sister', 89, 29, 89, 44, 'silver bracelet', 'Defines her presence — she turns it round and round');
sys.annotate('florin', 170, 9, 170, 15, 'florin');

// "Araby" — simultaneously the setting and the boy's fantasy
sys.annotate('araby-hall', 84, 10, 84, 15, 'Araby');
sys.annotate('mc-araby-fantasy', 84, 10, 84, 15, 'Araby', 'The word carries the Eastern enchantment');
sys.annotate('araby-hall', 107, 36, 107, 41, 'Araby');
sys.annotate('mc-araby-fantasy', 107, 36, 107, 41, 'Araby', 'The syllables cast an enchantment');

// Characters
sys.annotate('mangans-sister', 36, 3, 36, 18, "Mangan's sister");

// ════════════════════════════════════════════════════════
//  Reading-level annotations (interpretive)
// ════════════════════════════════════════════════════════

// Postcolonial: "Araby" is also an orientalist signifier
sys.annotateText('postcolonial', 'sym-name-araby', 84, 10, 84, 15, 'Araby', 'Orientalist signifier — the exotic East as projection');
sys.annotateText('postcolonial', 'sym-name-araby', 107, 36, 107, 41, 'Araby', '"Eastern enchantment" — orientalist fantasy');
sys.annotateText('postcolonial', 'th-english-dominance', 15, 38, 15, 47, 'The Abbot', 'Walter Scott — English literary culture in an Irish priest\'s library');

// Formalist: the "blind" street as symbol
sys.annotateText('formalist', 'sym-blind-street', 4, 29, 4, 34, 'blind', 'Dead-end street as structural premonition of dead-end desire');

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
