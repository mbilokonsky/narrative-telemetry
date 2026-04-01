# Narrative-Telemetry

## Vision

Narrative-telemetry is a framework for computational narrative analysis that aims to become a standard for structured representation of storytelling — for scholars, game developers, and AI systems that need to "read."

The core insight: **stories can be modeled as traces.** Borrowing OpenTelemetry's span/event architecture, we represent the unfolding of a narrative as nested spans (story → acts → scenes → beats) with events dispatched within them. Multiple interpretive **readings** can be layered over a shared textual spine, each assigning its own significance, themes, and meaning to the same events. The text exists in superposition; each reading collapses it.

The ambition: if this ontology is rich enough to capture what makes a story work — from a 2000-word Joyce story to Lord of the Rings to the Decline and Fall of the Roman Empire — then it's rich enough to power narrative generation, teach LLMs to read with interpretive depth, and serve as the backbone for game narrative systems.

## Core Principles

**Significance is relational, not intrinsic.** An event's importance is a property of (event, reading), never of the event alone. The same event can be a 0.9 in a formalist reading and a 0.3 in a postcolonial reading. Never put significance scores on Event or NarrativeEntityState directly — they belong in Reading annotations only.

**Observe first, interpret later.** Pass 1 exhaustively extracts what's in the text (events, entities, relationships) with no interpretive framing. Pass 2+ constructs readings that layer significance, themes, symbols, and causality. These passes must be separate in both code and LLM prompts.

**The ontology is deliberately broad.** Empty fields on a given entity are expected. The type system accommodates short stories, novels, epics, historical works. Don't trim types to fit one text.

**Text annotations can overlap.** A single word can simultaneously reference multiple entities (e.g., "Araby" = setting + mental construct + orientalist symbol). Use the character-level TextAnnotation system, not string matching. Diegetic annotations live in TextModel; interpretive annotations live in Reading.

**OTEL is the endgame.** The span/event/attribute structure is designed to export to OTLP so we can use Jaeger, Grafana Tempo, and TraceQL as the query layer rather than building one from scratch.

**Semantic IDs everywhere.** Use slugs (`boy`, `mangans-sister`, `e09-conversation`, `abs-quest-to-araby`), not auto-generated counters. A bounded text has a bounded namespace. Readable JSON is debuggable JSON.

## Current State (277 tests passing)

### What exists and works
- **Type system**: characters, settings, items, factions, themes, symbols, relationships (interpersonal/group/symbolic), absentials, mental constructs, narrator, reader, author, text annotations
- **NarrativeAnalysisSystem**: Pass 1 (text-building) + Pass 2 (reading-building) APIs + compareReadings()
- **LLM pipeline** (`src/ingest/`): two-pass extraction (extract.ts → interpret.ts), text chunking with entity deduplication for long texts, CLI interface
- **OTEL export** (`src/export/`): Jaeger, OTLP, console formats — deterministic trace IDs, full attribute encoding
- **Derive** (`src/derive/`): tension curves, TensionField (5-dimensional entity-scoped), pacing, divergence, authorial profiling
- **Analytics** (`src/analytics/`): Joyce vs Mansfield comparative analysis across 30 stories
- **UI** (`ui/`): span waterfall, annotated text view with overlapping entity annotations, reading comparison, tension chart, entity inspector with context
- **Corpus**: 30 stories analyzed (15 Joyce Dubliners + 15 Mansfield), hand-coded Araby with formalist + postcolonial readings
- **Persistence**: JSON file save/load
- **Tests**: 277 passing (unit, OTEL, TensionField, compareReadings, chunking, Eveline corpus)

### What's next (see PLAN.md for full roadmap)
- **S1**: Multi-story explorer UI (load any of 30 analyzed stories)
- **S2**: Absential timeline visualization (watch a desire accumulate and break)
- **S3**: Side-by-side reading comparison (superposition made visible)
- **S4**: Paste-and-analyze (live LLM ingestion in the UI)
- **M4**: Dimension-specific tension scoring (fix the biggest analytical limitation)
- **M1**: Reading authoring in the UI (scholars create their own readings)

## Architecture

```
StoryModel
├── text: TextModel              ← shared, neutral, exhaustive
│   ├── rootSpan: StorySpan      ← nested: story → acts → scenes → beats
│   ├── diegetic                 ← characters, settings, items, factions
│   ├── events                   ← neutral observations anchored to text lines
│   ├── relationships            ← interpersonal, group (diegetic facts)
│   ├── absentials               ← character desires/fears/goals
│   ├── mentalConstructs         ← diegetic beliefs/knowledge
│   └── annotations              ← character-level text anchors (overlapping OK)
└── readings: Record<string, Reading>
    ├── themes, symbols, symbolic relationships
    ├── narrator, reader, author
    ├── eventSignificance        ← the "collapse" from superposition
    ├── entitySignificance, absentialSignificance
    ├── mentalConstructs         ← interpretive (what the critic notices)
    ├── annotations              ← reading-specific text anchors
    ├── globalTension            ← tension curve
    └── spanAnnotations          ← per-span tension, pacing, notes
```

### Key files
| File | What |
|------|------|
| `src/types/structural.ts` | StoryModel, TextModel, Reading, TextAnnotation, StorySpan |
| `src/types/events.ts` | Event, TextLocation |
| `src/types/narrativeEntity.ts` | NarrativeEntity base, DiegeticEntity, NonDiegeticEntity |
| `src/types/entities/*.ts` | Character, Setting, Item, Absential, MentalConstruct, etc. |
| `src/NarrativeAnalysisSystem.ts` | Core API (Pass 1 + Pass 2 + comparison) |
| `src/ingest/extract.ts` | LLM Pass 1: text → TextModel |
| `src/ingest/interpret.ts` | LLM Pass 2: TextModel + lens → Reading |
| `src/ingest/chunker.ts` | Long-text splitting with overlap |
| `src/ingest/registry.ts` | Cross-chunk entity deduplication |
| `src/ingest/pipeline.ts` | Orchestrates extract → interpret → derive → export |
| `src/export/otel.ts` | StoryModel → OTEL traces |
| `src/export/otlp.ts` | OTEL → OTLP v1 JSON |
| `src/export/jaeger.ts` | OTEL → Jaeger format |
| `src/derive/tensionField.ts` | 5-dimensional entity-scoped tension decomposition |
| `src/derive/tension.ts` | Normalized tension curves |
| `src/derive/divergence.ts` | Reading comparison metrics |
| `src/derive/author-profile.ts` | Authorial signature aggregation |
| `src/analytics/compare-authors.ts` | Cross-corpus comparative analysis |

### Diegetic vs non-diegetic split
- **Diegetic** (in the story world): characters, settings, items, factions, interpersonal/group relationships, absentials, diegetic mental constructs → TextModel
- **Non-diegetic** (about the story): themes, symbols, symbolic relationships, narrator framing, reader state, author intent → Reading

## Commands

```bash
# Core
npm run build                    # tsc
npm run ingest                   # manual Araby ingestion → data/araby.json
npm run validate                 # 35-check validation suite

# LLM pipeline
npx ts-node src/ingest/cli.ts corpus/araby.txt --title "Araby" --lens formalist
npx ts-node src/export/cli.ts data/araby.json --format otlp --output traces/araby.json

# UI
npm run ui:dev                   # Vite dev server
npm run ui:build                 # production build

# Tests (277 total)
npx ts-node src/tests/run-all.ts # all tests
```

## Working with the code

### Adding a new text via LLM pipeline
```bash
# 1. Put text in corpus/
cp my-story.txt corpus/

# 2. Extract + interpret (requires ANTHROPIC_API_KEY)
npx ts-node src/ingest/cli.ts corpus/my-story.txt \
  --title "My Story" --lens formalist --output output/my-story.json

# 3. Copy to UI public dir
cp output/my-story.json ui/public/data/
```

### Adding a new text manually
1. Create `src/ingest-{name}.ts` following the two-pass pattern in `ingest-araby.ts`
2. Pass 1: register entities, spans, events with text anchors and semantic slug IDs
3. Pass 2: create readings with significance annotations, themes, symbols, tension curves
4. Add an npm script

### Adding a new reading to an existing text
Readings are independent — add one without touching Pass 1:
```typescript
sys.createReading('psychoanalytic', 'A psychoanalytic reading...', narrator, reader, author);
sys.annotateEvent('psychoanalytic', 'e08-o-love', { significance: 1.0, note: '...' });
// etc.
```

### Adding a new entity type
1. Create `src/types/entities/{type}.ts` — `{Type}State extends NarrativeEntityState` + entity interface
2. Re-export from `src/types/narrativeEntity.ts`
3. Add storage slot in TextModel.diegetic (if diegetic) or Reading (if non-diegetic)
4. Add registration method to NarrativeAnalysisSystem

## Generated Outputs (`output/`)

LLM-generated analysis outputs are checked in because they're expensive to reproduce:
- `output/dubliners/` — formalist readings of all 15 Dubliners stories
- `output/mansfield/` — formalist readings of 15 Mansfield stories
- `output/joyce-profile.json`, `output/mansfield-profile.json` — authorial signatures
- `output/comparative-analysis.json` — Joyce vs Mansfield divergence analysis
- `FINDINGS.md` — human-readable comparative findings

## UI

Lives in `ui/` (Vite + React + TypeScript). Loads data from `ui/public/data/`.

**Layout**: top bar (reading selector + compare toggle) | left (span waterfall) | center (annotated text) | right (detail inspector + tension chart)

**Key features**: event highlighting by significance, overlapping entity annotations with popup selector, per-reading side-by-side comparison, entity context (reader-facing background notes like a critical edition)

## Known Limitations

- **Dimension-specific tension**: TensionField has 5 dimensions but they're currently derived proportionally from composite significance, not scored independently by the LLM. Fix: update interpretation prompt (see PLAN.md M4).
- **Interpretive causality**: `ReadingEventAnnotation.causes/effects` fields exist in the type but are never populated.
- **Flat absential state histories**: LLM extraction doesn't produce intermediate state transitions, so tension computation uses event-significance fallback instead of absential accumulation strategy.
- **UI is read-only**: No reading creation/editing (see PLAN.md M1).
- **UI loads one story**: Hardcoded to araby.json (see PLAN.md S1).
