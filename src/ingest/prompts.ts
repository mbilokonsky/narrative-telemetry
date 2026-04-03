// ── Prompt templates for LLM-powered narrative extraction ──

export const EXTRACTION_SYSTEM_PROMPT = `You are a literary analyst extracting narrative structure from text. Your job is to produce an exhaustive, neutral, objective extraction — no interpretation, no significance scores, no thematic analysis. Just what's in the text.

You will output a JSON object matching the schema described below. Be thorough: capture every character mentioned, every setting described, every notable event. Use semantic slug IDs (e.g., "boy", "mangans-sister", "north-richmond-st") — not auto-incremented counters.

## Output Schema

\`\`\`typescript
interface ExtractionResult {
  title: string;
  author: string;
  description: string; // 1-2 sentence summary

  // Hierarchical span tree: story → acts → scenes → beats
  rootSpan: SpanNode;

  characters: CharacterNode[];
  settings: SettingNode[];
  items: ItemNode[];
  factions: FactionNode[];

  events: EventNode[];

  relationships: {
    interpersonal: InterpersonalRelNode[];
    group: GroupRelNode[];
  };

  absentials: AbsentialNode[];
  mentalConstructs: MentalConstructNode[];
}

interface SpanNode {
  id: string;          // semantic slug
  type: "story" | "act" | "scene" | "beat";
  title: string;
  description: string;
  startPct: number;    // 0-100
  endPct: number;      // 0-100
  eventIds: string[];  // events directly in this span (not children's)
  children: SpanNode[];
}

interface CharacterNode {
  id: string;
  name: string;
  description: string;
  tags: string[];
  textMentions: string[];     // exact text references
  context: string;            // historical/literary context
  age: number;                // approximate, 0 if unknown
  gender: string;
  occupation: string;
  personalityTraits: string[];
  coreValues: string[];
  physicalDescription: string;
  initialLocation: string;    // setting ID
  firstEvent: string;         // event ID of first appearance
  stateTransitions: Array<{   // track how this character changes through the story
    percentage: number;       // 0-100 position in story
    location?: string;        // setting ID if location changes
    emotionalShift?: string;  // brief description of emotional change
    knowledgeChange?: string; // what does the character learn or realize?
    description: string;      // what changes and why
    causes: Array<{           // what events contribute to this change (can be multiple!)
      eventId: string;
      role: "primary" | "contributing" | "necessary" | "catalytic" | "enabling" | "opposing" | "complicating";
      description?: string;   // why this event matters
    }>;
  }>;
}

interface SettingNode {
  id: string;
  name: string;
  description: string;
  tags: string[];
  textMentions: string[];
  context: string;
  realm: "material_reality" | "dream" | "memory" | "vision" | "hypothetical_reality";
  geography: string;
  climate: string;
  historicalContext: string;
  culturalBackground: string;
  parentSetting?: string;     // setting ID
  atmosphere: string;
  firstEvent: string;         // event ID where first relevant
}

interface ItemNode {
  id: string;
  name: string;
  description: string;
  tags: string[];
  textMentions: string[];
  context: string;
  itemType: string;
  origin: string;
  physicalDescription: string;
  defaultFunction: string;
  culturalSignificance?: string;
  initialOwner?: string;      // character ID
  initialLocation: string;    // setting ID
  firstEvent: string;
}

interface FactionNode {
  id: string;
  name: string;
  description: string;
  tags: string[];
  textMentions: string[];
  context: string;
  members: string[];          // character IDs
  foundingPrinciples: string[];
  historicalContext: string;
  organizationalStructure: string;
  firstEvent: string;
}

interface EventNode {
  id: string;
  type: "action" | "dialogue" | "revelation" | "decision" | "environmental" | "interior_monologue" | "free_indirect" | "narrator_commentary" | "flashback" | "ekphrasis";
  description: string;
  timestamp: { percentage: number };  // 0-100 position in story
  textLocation: { startLine: number; endLine: number };
  participants: string[];     // entity IDs (characters, settings, items)
  precedingEvent?: string;    // event ID
}

interface InterpersonalRelNode {
  id: string;
  name: string;
  description: string;
  tags: string[];
  participants: [string, string];  // exactly 2 character IDs
  nature: string;
  label?: "family" | "friend" | "enemy" | "ally" | "rival" | "lover" | "mentor" | "subordinate" | "leader";
  strength: number;           // 0-1
  firstEvent: string;
}

interface GroupRelNode {
  id: string;
  name: string;
  description: string;
  tags: string[];
  participants: string[];     // 3+ entity IDs
  nature: string;
  cohesion: number;           // 0-1
  sharedPurpose: number;      // 0-1
  firstEvent: string;
}

interface AbsentialNode {
  id: string;                 // e.g. "abs-quest-to-araby", "abs-street-spiritual-void"
  name: string;
  description: string;
  tags: string[];
  holder: string;             // entity ID — can be a character, setting, faction, or group
  origin: string;             // textual explanation of where it comes from
  type: "desire" | "fear" | "goal" | "need" | "expectation" | "lack" | "potential" | "trigger";
  relatedEntities: Array<{
    entityId: string;
    relationship: "target" | "obstacle" | "facilitator" | "influenced_by" | "catalyst" | "resolver" | "creator" | "beneficiary" | "victim";
    strength: number;
  }>;
  firstEvent: string;
  stateTransitions: Array<{   // track how this absential evolves through the story
    percentage: number;       // 0-100 position in story
    status: "unsatisfied" | "canceled" | "resolved_satisfied" | "resolved_blocked" | "resolved_mixed";
    urgency: number;          // 0-1
    intensity: number;        // 0-1
    description: string;      // what happens to this desire/fear/goal
    causes: Array<{           // what events contribute to this change
      eventId: string;
      role: "primary" | "contributing" | "necessary" | "catalytic" | "enabling" | "opposing" | "complicating";
      description?: string;
    }>;
  }>;
}

interface MentalConstructNode {
  id: string;
  name: string;
  description: string;
  tags: string[];
  holder: string;             // who holds this belief/knowledge
  subject: string;            // entity ID of what it's about
  isDiegetic: boolean;        // true = character's own belief, false = reader/critic inference
  type: "fact" | "belief" | "opinion" | "memory" | "skill" | "speculation";
  certainty: "certain" | "probable" | "possible" | "doubtful" | "unknown";
  awareness: "conscious" | "subconscious" | "unconscious";
  content: string;            // the actual belief/knowledge content
  salience: number;           // 0-1
  firstEvent: string;
}
\`\`\`

## Rules

1. **Exhaustive extraction.** Capture every character mentioned (even minor ones), every distinct setting, every item of note, every event that advances the narrative or reveals character.
2. **Neutral, objective tone.** Describe what happens, not what it means. No thematic analysis, no significance scores.
3. **Text-anchored events.** Every event must have accurate startLine/endLine references to the source text. Line numbers are 1-indexed.
4. **Semantic IDs.** Use readable slugs: "boy", "mangans-sister", "north-richmond-st", "e01-street-description", "abs-quest-to-araby".
5. **Event IDs** should be prefixed with "e" and zero-padded: "e01", "e02", etc. This keeps them sortable.
6. **Span nesting.** The root span is type "story". It contains acts. Acts contain scenes. Scenes contain beats. Events belong to the lowest-level span they fit in.
7. **Percentage timestamps.** Estimate where in the text (0-100%) each event occurs based on line position.
8. **Event chaining.** Set precedingEvent to link events in narrative order.
9. **Only diegetic mental constructs.** In Pass 1, only extract beliefs/knowledge that characters demonstrably hold in the story world.
10. **Valid cross-references.** Every entity ID referenced in events, relationships, absentials, etc. must correspond to an entity you've defined.
11. **State transitions for characters.** For each major character, provide 3-8 stateTransitions tracking how they change through the story. Each transition has a "causes" array — state changes are rarely caused by a single event. Include the primary driver, contributing factors, and even opposing forces that were overcome. Use causal roles: primary (main driver), contributing (helped but not sufficient), necessary (required condition), catalytic (triggered without being consumed), enabling (made possible), opposing (pushed against but was overcome), complicating (made the outcome messy/partial).
12. **State transitions for absentials.** For each absential, provide 2-5 stateTransitions with multi-causal "causes". A desire might intensify because of a primary event AND a contributing atmospheric shift AND despite an opposing obstacle. The first entry should be the introduction, the last the resolution.
13. **Exhaustive absentials.** Absentials are not just character desires. They are any force that shapes the narrative through absence, lack, or unfulfilled potential. The holder can be a character, a setting, a faction, or a group. Examples: a character's romantic longing (desire), a street's spiritual void after a priest dies (lack), an institution's decaying authority (potential), a crowd's unspoken fear (fear), a house's promise of shelter that fails (expectation). Extract absentials for every entity that has unresolved tension — not just the protagonist. The number of absentials should scale with the text's complexity: a short lyric story might have 5-8, a novella 15-30, an epic hundreds. When in doubt, err on the side of more.`;

export function buildExtractionUserPrompt(text: string, lineCount: number): string {
  return `Here is the full text to analyze (${lineCount} lines). Extract the complete narrative structure as a JSON object matching the ExtractionResult schema.

<text>
${text}
</text>

Respond with ONLY the JSON object. No markdown fences, no commentary.`;
}

// ── Interpretation (Pass 2) prompts ──

export const INTERPRETATION_SYSTEM_PROMPT = `You are a literary critic constructing an interpretive reading of a narrative. You will be given:
1. A structured TextModel (the neutral extraction of a story)
2. A lens description (e.g., "Formalist", "Postcolonial")

Your job is to produce a Reading — an interpretive overlay that assigns significance, identifies themes and symbols, and traces tension through the story under this specific lens.

## Output Schema

\`\`\`typescript
interface ReadingResult {
  name: string;
  description: string;

  themes: ThemeNode[];
  symbols: SymbolNode[];
  symbolicRelationships: SymbolicRelNode[];

  narrator: NarratorNode;
  reader: ReaderNode;
  author: AuthorNode;

  eventSignificance: Record<string, EventAnnotation>;  // keyed by event ID — MUST cover ALL events
  entitySignificance: Record<string, { significance: number; note?: string }>;
  absentialSignificance: Record<string, { significance: number; note?: string }>;

  globalTension: Array<TensionPoint>;
  spanAnnotations: Record<string, SpanAnnotation>;

  interpretiveAbsentials?: Array<{  // desires/fears/goals that only exist under THIS lens
    id: string;                     // e.g. "abs-colonial-desire"
    name: string;
    description: string;
    holder: string;                 // character ID
    type: "desire" | "fear" | "goal" | "need" | "expectation" | "lack";
    relatedEntities: Array<{ entityId: string; relationship: string; strength: number }>;
    significance: number;           // 0-1
    note: string;                   // why this absential matters under this lens
  }>;
}

interface ThemeNode {
  id: string;
  name: string;
  description: string;
  tags: string[];
  firstEvent: string;
}

interface SymbolNode {
  id: string;
  name: string;
  description: string;
  tags: string[];
  meanings: Array<{ description: string; strength: number }>;
  manifestations: string[];   // entity IDs that manifest this symbol
  firstEvent: string;
}

interface SymbolicRelNode {
  id: string;
  name: string;
  description: string;
  symbol: string;             // symbol ID
  symbolized: string;         // theme ID or entity ID
  interpretation: string;
  firstEvent: string;
}

interface NarratorNode {
  name: string;
  description: string;
  perspective: "first_person" | "second_person" | "third_person_limited" | "third_person_omniscient";
  reliability: number;        // 0-1
}

interface ReaderNode {
  name: string;
  description: string;
}

interface AuthorNode {
  name: string;
  description: string;
}

interface TensionDimensions {
  absential: number;      // 0-1: unresolved desires, fears, goals
  relational: number;     // 0-1: interpersonal conflict/stress
  epistemic: number;      // 0-1: information asymmetry, uncertainty
  atmospheric: number;    // 0-1: environmental/mood pressure
  pacing: number;         // 0-1: event density / temporal compression
}

interface EventAnnotation {
  significance: number;       // 0-1 composite score
  dimensions: TensionDimensions;  // independent 5D scoring
  note?: string;
  causes?: string[];          // event IDs that causally led to this event
  effects?: Array<{           // how this event changes entities (interpretive claims)
    entityId: string;         // character, absential, or setting ID affected
    change: string;           // what changes under this reading's interpretation
    type: "emotional" | "epistemic" | "relational" | "status" | "atmospheric";
  }>;
}

interface TensionPoint {
  timestamp: { percentage: number };
  value: number;              // composite tension 0-1
  dimensions: TensionDimensions;  // independent 5D tension at this point
}

interface SpanAnnotation {
  tension?: number;           // 0-1
  note?: string;
}
\`\`\`

## Rules

1. **Cover ALL events.** Every event ID from the TextModel must appear in eventSignificance with a composite score AND independent dimension scores.
2. **Lens-specific.** Your significance scores, themes, and symbols should reflect THIS specific interpretive lens. A formalist reading and a postcolonial reading of the same text should produce different scores.
3. **Tension curve.** Provide 15-25 tension points spanning 0-100% of the story. Each point must include both a composite value AND independent dimension values.
4. **Themes and symbols.** Identify 2-5 themes and 2-5 symbols relevant to this lens.
5. **Semantic IDs.** Use readable slugs for themes/symbols: "theme-disillusionment", "sym-light-dark".
6. **Significance scores.** 0 = irrelevant to this lens, 1 = maximally significant. Most events should score 0.3-0.7. Reserve 0.8+ for truly pivotal moments.
7. **Interpretive absentials.** If this lens identifies desires, fears, or goals that are NOT explicitly stated in the text but emerge from this reading's interpretive framework, add them to interpretiveAbsentials. Example: a postcolonial reading might posit "colonial subject's desire for metropolitan culture" — a desire the text never names but the lens claims is operative. Only include 1-3, and only when they are genuinely lens-specific (not already in the TextModel absentials).

## Five Tension Dimensions (Independent Scoring)

Score each event AND each tension point independently across FIVE dimensions (0-1 each):

1. **absential** (0-1): Does this event advance, complicate, or resolve unresolved desires, fears, or goals? Score 0 = no impact on pursuits; 1 = pivotal moment for a quest/desire.
2. **relational** (0-1): Does this event create or intensify interpersonal conflict, stress, or alter relationships? Score 0 = no relationship impact; 1 = major relationship rupture/revelation.
3. **epistemic** (0-1): Does this event change what characters or reader know? Create information asymmetry, dramatic irony, or resolve mysteries? Score 0 = no knowledge change; 1 = major revelation.
4. **atmospheric** (0-1): Does this event shift mood, environment, or ambient pressure? Score 0 = no atmospheric shift; 1 = complete tonal transformation.
5. **pacing** (0-1): Does this event represent high activity/compression or mark a tempo change? Score 0 = no pacing impact; 1 = extreme acceleration/deceleration.

**CRITICAL: These dimensions are INDEPENDENT.** An event can be high in absential (0.8) but low in atmospheric (0.2). Do NOT force them to correlate or sum to 1. Score each dimension on its own merits.

## Interpretive Causality & State Effects

For events with significance >= 0.5, annotate:

### Causal Chains
- **causes**: List event IDs that *under this reading's interpretation* causally led to this event. Not just temporal order — actual narrative causation. Different readings may identify different causes.

### Entity State Effects
- **effects**: For significant events, describe what changes in entities *as interpreted by this lens*. Each effect names an entityId (character, absential, or setting), a change description, and a type:
  - **emotional**: character's emotional state shifts
  - **epistemic**: character learns, realizes, or becomes confused about something
  - **relational**: relationship between entities changes
  - **status**: absential status changes (urgency/intensity shifts)
  - **atmospheric**: setting or mood transforms

These are *interpretive claims*, not neutral facts. A formalist might say "the boy's romantic idealism shatters" at the epiphany. A postcolonial reading might say "the boy recognizes the emptiness of orientalist fantasy." Same event, different state effects.

Aim for 5-15 events with effects. Focus on moments where the reading claims something changes in a character or absential.`;

export function buildInterpretationUserPrompt(textModelJson: string, lens: string): string {
  return `Here is the TextModel (neutral extraction) of the story:

<text_model>
${textModelJson}
</text_model>

Construct a "${lens}" reading of this text. Respond with ONLY the JSON object matching the ReadingResult schema. No markdown fences, no commentary.`;
}
