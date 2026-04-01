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

## Current State (591 tests passing)

### What exists and works
- **Type system**: characters, settings, items, factions, themes, symbols, relationships (interpersonal/group/symbolic), absentials, mental constructs, narrator, reader, author, text annotations, 5D tension dimensions, interpretive causality
- **NarrativeAnalysisSystem**: Pass 1 (text-building) + Pass 2 (reading-building) APIs + compareReadings()
- **LLM pipeline** (`src/ingest/`): two-pass extraction (extract.ts → interpret.ts), text chunking with entity deduplication, CLI interface, 5D tension scoring, causal chain annotation
- **OTEL export** (`src/export/`): Jaeger, OTLP, console formats — deterministic trace IDs, full attribute encoding, Docker Compose with Jaeger, batch import script
- **Derive** (`src/derive/`): tension curves, TensionField (5-dimensional entity-scoped), pacing, divergence, authorial profiling
- **Analytics** (`src/analytics/`): Joyce vs Mansfield comparative analysis across 30 stories
- **API server** (`src/server.ts`): Express API for live LLM ingestion with SSE progress streaming
- **UI** (`ui/`): multi-story explorer (30 stories), span waterfall, annotated text view, split-screen reading comparison with divergence highlighting, absential timeline, entity relationship graph, tension chart with 5D toggle, reading authoring, paste-and-analyze, entity inspector with causal chain navigation
- **Corpus**: 30 stories analyzed (15 Joyce Dubliners + 15 Mansfield), hand-coded Araby with formalist + postcolonial readings
- **Persistence**: JSON file save/load
- **Tests**: 591 passing (16 test suites)

### Completed features (S1-S4 + M1-M5)
- **S1**: Multi-story explorer — browse all 30 analyzed stories via dropdown
- **S2**: Absential timeline visualization — click absentials to see lifecycle with tension overlay
- **S3**: Side-by-side reading comparison — split-screen with divergence pulsing
- **S4**: Paste-and-analyze — live LLM ingestion via API server
- **M1**: Reading authoring — create custom readings with significance slider + notes
- **M2**: Entity relationship graph — force-directed SVG visualization
- **M3**: OTEL query layer — Docker Compose with Jaeger, batch import
- **M4**: 5D tension scoring — independent absential/relational/epistemic/atmospheric/pacing
- **M5**: Interpretive causality — per-reading causal chains with clickable navigation

### What's next (see PLAN.md for long-term roadmap)
- **L1**: Narrative generation from structure (reverse the pipeline)
- **L2**: Cross-work structural search (find structurally similar stories)
- **L3**: Collaborative reading platform (multi-user classrooms)
- **L4**: Real-time narrative monitoring (game narrative systems)
- **L5**: Training LLMs to read (fine-tuning on structured readings)

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
    │   ├── significance         ← composite 0-1
    │   ├── dimensions           ← 5D: absential/relational/epistemic/atmospheric/pacing
    │   ├── causes/effects       ← interpretive causal chains
    │   └── note                 ← interpretive annotation
    ├── entitySignificance, absentialSignificance
    ├── mentalConstructs         ← interpretive (what the critic notices)
    ├── annotations              ← reading-specific text anchors
    ├── globalTension            ← tension curve (composite + optional 5D)
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
| `src/server.ts` | Express API server for live LLM ingestion |
| `src/export/import-to-jaeger.ts` | Batch import stories to Jaeger |
| `docker-compose.yml` | Jaeger all-in-one for OTEL query layer |
| `ui/src/storyCatalog.ts` | Story catalog with all 31 entries |
| `ui/src/divergence.ts` | Event divergence computation for comparisons |
| `ui/src/components/StorySelector.tsx` | Multi-story dropdown selector |
| `ui/src/components/SplitTextView.tsx` | Side-by-side reading comparison |
| `ui/src/components/AbsentialList.tsx` | Absential list in left panel |
| `ui/src/components/AbsentialTimeline.tsx` | Absential lifecycle visualization |
| `ui/src/components/AnalyzeView.tsx` | Paste-and-analyze UI |
| `ui/src/components/ReadingEditor.tsx` | Reading authoring interface |
| `ui/src/components/RelationshipGraph.tsx` | Force-directed entity graph |

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

# API server (for paste-and-analyze)
ANTHROPIC_API_KEY=... npm run server   # Express on port 3001

# OTEL query layer
docker compose up -d             # start Jaeger
npm run otel:import              # import all stories to Jaeger
# open http://localhost:16686    # Jaeger UI

# UI
npm run ui:dev                   # Vite dev server (auto-copies data)
npm run ui:build                 # production build

# Tests (591 total, 16 suites)
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

**Layout**: top bar (story selector + reading selector + compare/analyze/reading buttons) | left (span waterfall + absential list) | center (annotated text or split view or event list) | right (detail inspector + relationship graph + tension chart)

**Key features**: multi-story explorer (30 stories), event highlighting by significance, overlapping entity annotations, split-screen reading comparison with divergence pulsing, absential lifecycle visualization, entity relationship graph, 5D tension chart, reading authoring with significance slider, paste-and-analyze live LLM ingestion, causal chain navigation

## Known Limitations

- **Flat absential state histories**: LLM extraction doesn't produce intermediate state transitions, so tension computation uses event-significance fallback instead of absential accumulation strategy.
- **5D tension data on existing corpus**: The 30 pre-analyzed stories were generated before the 5D prompt update, so they have scalar-only tension. Re-running the pipeline would produce 5D data.
- **Source text for auto-analyzed stories**: The auto-analyzed stories in output/ don't include source text, so the UI shows an event list instead of annotated text for those stories. Only hand-coded Araby has the full text view.
- **Causal chains on existing corpus**: Similarly, the existing readings were generated without the causality prompt, so causes/effects are empty. New analyses will produce them.
- **API server requires manual start**: The paste-and-analyze feature needs `npm run server` running separately.
