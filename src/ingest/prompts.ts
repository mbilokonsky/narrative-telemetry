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
  type: "action" | "dialogue" | "revelation" | "decision" | "environmental";
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
  id: string;                 // e.g. "abs-quest-to-araby"
  name: string;
  description: string;
  tags: string[];
  holder: string;             // character ID who holds this desire/fear/goal
  origin: string;             // textual explanation of where it comes from
  type: "desire" | "fear" | "goal" | "need" | "expectation" | "lack" | "potential" | "trigger";
  initialStatus: "unsatisfied" | "canceled" | "resolved_satisfied" | "resolved_blocked" | "resolved_mixed";
  urgency: number;            // 0-1
  intensity: number;          // 0-1
  relatedEntities: Array<{
    entityId: string;
    relationship: "target" | "obstacle" | "facilitator" | "influenced_by" | "catalyst" | "resolver" | "creator" | "beneficiary" | "victim";
    strength: number;
  }>;
  firstEvent: string;
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
10. **Valid cross-references.** Every entity ID referenced in events, relationships, absentials, etc. must correspond to an entity you've defined.`;

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

  globalTension: Array<{ timestamp: { percentage: number }; value: number }>;
  spanAnnotations: Record<string, SpanAnnotation>;
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

interface EventAnnotation {
  significance: number;       // 0-1
  note?: string;
  causes?: string[];          // event IDs
}

interface SpanAnnotation {
  tension?: number;           // 0-1
  note?: string;
}
\`\`\`

## Rules

1. **Cover ALL events.** Every event ID from the TextModel must appear in eventSignificance with a score from 0 to 1.
2. **Lens-specific.** Your significance scores, themes, and symbols should reflect THIS specific interpretive lens. A formalist reading and a postcolonial reading of the same text should produce different scores.
3. **Tension curve.** Provide 15-25 tension points spanning 0-100% of the story. Tension should reflect narrative tension under this lens.
4. **Themes and symbols.** Identify 2-5 themes and 2-5 symbols relevant to this lens.
5. **Semantic IDs.** Use readable slugs for themes/symbols: "theme-disillusionment", "sym-light-dark".
6. **Significance scores.** 0 = irrelevant to this lens, 1 = maximally significant. Most events should score 0.3-0.7. Reserve 0.8+ for truly pivotal moments.`;

export function buildInterpretationUserPrompt(textModelJson: string, lens: string): string {
  return `Here is the TextModel (neutral extraction) of the story:

<text_model>
${textModelJson}
</text_model>

Construct a "${lens}" reading of this text. Respond with ONLY the JSON object matching the ReadingResult schema. No markdown fences, no commentary.`;
}
