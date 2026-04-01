# Narrative-Telemetry

A framework for narrative analysis that models stories as traces — borrowing OpenTelemetry's span/event architecture to represent the unfolding of a narrative, then layering multiple interpretive readings over a shared textual spine.

## Core Principles

**Significance is relational, not intrinsic.** An event's importance is a property of the relationship between that event and a given reading. The text exists in superposition; each reading collapses it into an interpretive frame. Never put significance scores on events or entities directly — they belong in Reading annotations.

**Observe first, interpret later.** Pass 1 exhaustively extracts what's in the text (events, entities, relationships) with no interpretive framing. Pass 2+ constructs readings that assign significance, themes, symbols, and causality over that shared spine.

**The ontology is deliberately broad.** The type system should accommodate a 2000-word short story, a 500,000-word epic, and a multi-volume historical work. Empty fields on a given entity are expected and fine — don't trim the types to fit one text.

**OTEL is the endgame.** The span/event/attribute structure is designed to eventually export to OTLP so we can use Jaeger, Grafana Tempo, and TraceQL as the query layer rather than building one from scratch.

## Architecture

```
StoryModel
├── text: TextModel          ← shared, neutral, exhaustive
│   ├── rootSpan: StorySpan  ← nested: story → acts → scenes → beats
│   ├── diegetic             ← characters, settings, items, factions
│   ├── events               ← neutral observations anchored to text lines
│   ├── relationships        ← interpersonal, group (diegetic facts)
│   ├── absentials           ← character desires/fears/goals
│   └── mentalConstructs     ← diegetic beliefs/knowledge
└── readings: Record<string, Reading>  ← interpretive overlays
    ├── themes, symbols, symbolic relationships
    ├── narrator, reader, author
    ├── eventSignificance    ← the "collapse" from superposition
    ├── entitySignificance, absentialSignificance
    ├── mentalConstructs     ← interpretive (what the critic/reader notices)
    ├── globalTension        ← tension curve (interpretive)
    └── spanAnnotations      ← per-span tension, pacing, notes
```

### Key type locations
- `src/types/core.ts` — enums, IDs, Timestamp, State<T>, Emotion
- `src/types/events.ts` — Event, TextLocation
- `src/types/narrativeEntity.ts` — NarrativeEntity, NarrativeEntityState, diegetic/non-diegetic base types, re-exports all entity types
- `src/types/entities/` — one file per entity type (character, setting, absential, etc.)
- `src/types/structural.ts` — StorySpan, TextModel, Reading, ReadingEventAnnotation, StoryModel
- `src/NarrativeAnalysisSystem.ts` — the system class with Pass 1 and Pass 2 APIs

### Diegetic vs non-diegetic split
- **Diegetic** (in the story world): characters, settings, items, factions, interpersonal/group relationships, absentials, diegetic mental constructs → live in TextModel
- **Non-diegetic** (about the story): themes, symbols, symbolic relationships, narrator framing, reader state, author intent → live in Reading

### Entity IDs
Use semantic slugs, not auto-generated counters. A bounded text has a bounded namespace. Examples: `boy`, `mangans-sister`, `north-richmond-st`, `florin`, `abs-quest-to-araby`. This makes the JSON readable, the ingestion debuggable, and cross-references obvious.

## Commands

```bash
npm run build       # tsc
npm run ingest      # run src/ingest-araby.ts → writes data/araby.json
npm run validate    # run src/validate.ts → checks all success criteria
npm run ui:dev      # start the UI dev server (Vite + React)
npm run ui:build    # production build of the UI
```

## Working with the code

### Adding a new text
1. Put the source text in `corpus/`
2. Create `src/ingest-{name}.ts` following the two-pass pattern:
   - Pass 1: register entities, create spans, extract events with text anchors
   - Pass 2: create readings with significance annotations, themes, symbols, tension curves
3. Add an npm script for it
4. The output goes to `data/{slug}.json` (gitignored)

### Adding a new entity type
1. Create `src/types/entities/{type}.ts` with `{Type}State extends NarrativeEntityState` and the entity interface
2. Re-export from `src/types/narrativeEntity.ts`
3. Add a storage slot in the appropriate place (TextModel.diegetic for diegetic, Reading for non-diegetic)
4. Add a registration method to NarrativeAnalysisSystem

### Adding a new reading to an existing text
Readings are independent — you can add one to an existing ingestion without touching Pass 1. Just call `sys.createReading(...)` and annotate events/entities/absentials.

## What exists today
- Type system covering: characters, settings, items, factions, themes, symbols, relationships (interpersonal/group/symbolic), absentials, mental constructs, narrator, reader, author
- NarrativeAnalysisSystem with Pass 1 (text-building) and Pass 2 (reading-building) APIs
- JSON file persistence (save/load/list/delete)
- Exhaustive encoding of Joyce's "Araby" with 28 events, 11 characters, 9 settings, 7 items, 5 absentials
- Two demonstration readings (formalist, postcolonial) that diverge on the same event set
- Validation suite (35 checks)

## UI

The UI lives in `ui/` (Vite + React + TypeScript). It loads `data/araby.json` and `corpus/araby.txt` from `ui/public/data/`. After running `npm run ingest`, copy fresh data:

```bash
cp data/araby.json ui/public/data/
cp corpus/araby.txt ui/public/data/
```

Layout:
- **Top bar:** Story title + reading selector (tabs) + compare toggle
- **Left panel:** Span waterfall (Jaeger-style nested spans with event dots colored by significance)
- **Center panel:** Full text with event highlighting colored by active reading's significance
- **Right panel:** Detail inspector (event/span details, per-reading significance + notes)
- **Bottom of right panel:** Tension chart (SVG line chart, overlays both readings in compare mode)

## LLM Ingestion Pipeline (`src/ingest/`)

Two-pass LLM extraction following the observe-first-interpret-later principle:

- `extract.ts` — Pass 1: raw text → TextModel (entities, events, spans, relationships, absentials)
- `interpret.ts` — Pass 2: TextModel + lens → Reading (themes, symbols, significance, tension)
- `chunker.ts` — splits long texts at chapter/scene boundaries with paragraph overlap
- `registry.ts` — cross-chunk entity deduplication (entities from chunk N inform chunk N+1)
- `pipeline.ts` — orchestrates: extract → interpret → derive → export
- `cli.ts` — `npx ts-node src/ingest/cli.ts corpus/eveline.txt --title "Eveline"`
- `client.ts` — Anthropic API client (supports API key and OAuth)

## OTEL Export (`src/export/`)

Maps narrative structure to OpenTelemetry trace format:

- Story → Trace (deterministic trace ID from SHA-256 of title+author)
- Spans → OTEL Spans (preserving hierarchy)
- Events → OTEL Span Events with full attribute encoding
- Attributes: `narrative.span.type`, `narrative.event.significance`, `narrative.reading.*`, etc.

Export formats:
- `otel.ts` — raw OTEL trace structure
- `otlp.ts` — OTLP v1 JSON (for Grafana Tempo, OTEL Collector)
- `jaeger.ts` — Jaeger-compatible format
- `console.ts` — human-readable text output
- `cli.ts` — `npx ts-node src/export/cli.ts data/araby.json --format otlp`

## Derive (`src/derive/`)

Analytical tools that operate on StoryModel + Reading:

- `tension.ts` — compute normalized tension curves from event significance
- `tensionField.ts` — hierarchical entity-scoped tension decomposition (per-entity x 5 dimensions: absential, relational, epistemic, atmospheric, pacing)
- `coarseGrain.ts` — aggregate significance at span level
- `pacing.ts` — event density scoring per span
- `divergence.ts` — measure how two readings differ on the same events
- `author-profile.ts` — aggregate per-story readings into authorial structural signatures

## Generated Outputs (`output/`)

LLM-generated analysis outputs are checked in because they're expensive to reproduce. Includes:
- `output/dubliners/` — formalist readings of all 15 Dubliners stories
- `output/mansfield/` — formalist readings of 15 Mansfield stories
- `output/joyce-profile.json`, `output/mansfield-profile.json` — authorial signatures
- `output/comparative-analysis.json` — Joyce vs Mansfield divergence analysis
- `FINDINGS.md` — human-readable comparative findings

## Tests

```bash
npx ts-node src/tests/run-all.ts           # all 235 tests
npx ts-node src/tests/unit.ts              # unit tests (62)
npx ts-node src/tests/validate-otel.ts     # OTEL export (61)
npx ts-node src/tests/test-tension-field.ts # TensionField (41)
npx ts-node src/tests/test-compare-readings.ts # compareReadings (26)
npx ts-node src/tests/validate-chunked.ts  # chunked extraction (33)
npx ts-node src/tests/test-eveline.ts      # Eveline corpus (12)
```

## What doesn't exist yet
- Query layer via OTEL tooling (export works; need to run Jaeger/Tempo against it)
- Interpretive causality (ReadingEventAnnotation.causes/effects fields exist but are unpopulated)
- UI: reading creation/editing, entity relationship graph
- More interpretive lenses in the LLM pipeline (postcolonial, psychoanalytic, etc.)
