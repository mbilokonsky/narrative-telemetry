# LLM Ingestion Pipeline — Implementation Plan

## Goal
Replace hand-coded ingestion (74KB `ingest-araby.ts`) with a general LLM-powered pipeline that extracts narrative structure from any text and derives insights mechanically.

## Validation Strategy
Run the pipeline against `corpus/araby.txt` and compare output against the hand-coded Araby model. The hand-coded version is our ground truth — we don't need to match it exactly, but the pipeline should capture the same entities, events, and structural elements at comparable quality.

## Architecture

```
Raw Text → Pass 1 (Extract) → TextModel → Pass 2 (Read) → Reading → Pass 3 (Derive) → Insights
```

**Key principle:** TextModel is objective (what's in the text). Reading is subjective (what it means under a lens). Derivations are mechanical (computed from structured data, no LLM needed).

---

## Phase 1: Extract (Pass 1 — TextModel)
**Status:** done
**Files:** `src/ingest/extract.ts`, `src/ingest/prompts.ts`

LLM reads raw text and produces a neutral, exhaustive TextModel:
- **Spans:** Identify story structure (acts, scenes, beats) with percentage timestamps
- **Entities:** Characters, settings, items, factions — with initial state
- **Events:** Beat-by-beat narrative events, text-anchored (line numbers or percentage), with participants and event type
- **Relationships:** Interpersonal and group relationships between entities
- **Absentials:** Unrealized states owned by entities, with initial status
- **Mental constructs:** Character beliefs, knowledge, memories

### Approach
- Feed the full text + TypeScript type definitions as schema reference
- Use Claude Sonnet for extraction (quality/speed balance)
- Request structured JSON output matching our types
- For short texts (<30K tokens): single prompt
- Chunking strategy for longer texts: chapter-by-chapter with entity registry carried forward (design the interface now, implement chunking later)

### Prompt Design (`src/ingest/prompts.ts`)
- System prompt: "You are a literary analyst extracting narrative structure..."
- Include relevant type definitions inline (StorySpan, Character, Setting, Event, etc.)
- Instruct: exhaustive extraction, no interpretation, text-anchored events
- Output: JSON matching TextModel schema

### Validation
- Run against `corpus/araby.txt`
- Compare entity count: hand-coded has 11 chars, 9 settings, 7 items, 28 events, 5 absentials
- Verify span nesting is valid (acts contain scenes contain beats)
- Verify events reference valid entity IDs

---

## Phase 2: Interpret (Pass 2 — Reading)
**Status:** queued (depends on Phase 1)
**Files:** `src/ingest/interpret.ts`

Given a completed TextModel + a lens description, LLM produces a Reading:
- **Themes:** Recurring ideas/motifs identified under this lens
- **Symbols:** Concrete objects representing abstract ideas
- **Symbolic relationships:** Connections between symbols and themes
- **Event significance:** 0-1 score for every event (how important is this event under this lens?)
- **Entity significance:** 0-1 score for entities
- **Absential significance:** 0-1 score for absentials
- **Narrator/Reader/Author:** Perspective metadata

### Approach
- Feed TextModel JSON + lens description to LLM
- Lens examples: "Formalist" (structure, craft, literary devices), "Postcolonial" (power, empire, cultural dominance)
- Request significance scores for ALL events (not just highlights)
- Multiple readings from same TextModel = the whole point

### Validation
- Generate "Formalist" reading of Araby, compare against hand-coded
- Hand-coded has: 3 themes, 3 symbols, 28/28 events annotated, 17-point tension curve peaking at e28
- Generate "Postcolonial" reading, compare against hand-coded
- Hand-coded has: 4 themes, 3 symbols, different significance scores, peaks at e25
- The two readings should demonstrably diverge on ≥5 events (significance diff > 0.2)

---

## Phase 3: Derive (Pass 3 — Computed Insights)
**Status:** queued (depends on Phase 2)
**Files:** `src/derive/tension.ts`, `src/derive/coarseGrain.ts`, `src/derive/pacing.ts`, `src/derive/divergence.ts`

Pure functions, no LLM. Compute insights from the structured model.

### Tension Curves (`tension.ts`)
- For each timestamp in the story, compute: `tension(t) = Σ(significance(absential) × time_unresolved(absential, t))`
- An absential contributes tension from when it's introduced until it's resolved/negated
- Produces an array of `{timestamp, tension}` points
- Should approximate the hand-coded tension curve shape (peak near climax)

### Coarse-Graining (`coarseGrain.ts`)
- Aggregate beat-level event significance up through the span tree
- Scene significance = mean of its beat-level event significances
- Act significance = mean of its scene significances
- Produces per-span significance summaries

### Pacing Metrics (`pacing.ts`)
- Event density: events per unit of story-time per span
- High density = fast pacing, low density = slow/reflective
- Produces per-span pacing scores

### Reading Divergence (`divergence.ts`)
- Given two readings of the same text: `divergence(r1, r2) → DivergenceMap`
- Per-event: `|r1.significance[eventId] - r2.significance[eventId]|`
- Per-entity: same
- Aggregate: mean divergence, max divergence, top-N most divergent events
- This IS the groovy commutator applied to narrative — where does lens-order matter most?

### Validation
- Derived tension curve for Formalist reading should peak near event 28 (the epiphany)
- Derived tension curve for Postcolonial reading should peak near event 25 (English flirtation)
- Divergence between the two readings should flag ≥5 events with diff > 0.2

---

## Phase 4: Pipeline & CLI
**Status:** queued (depends on Phases 1-3)
**Files:** `src/ingest/pipeline.ts`, `src/ingest/cli.ts`, update `package.json`

### Pipeline (`pipeline.ts`)
- Orchestrates: read file → extract → interpret → derive
- `ingestText(text: string, options: IngestOptions): Promise<StoryModel>`
- `generateReading(model: StoryModel, lens: string): Promise<Reading>`
- `deriveInsights(model: StoryModel): DerivedInsights`

### CLI (`cli.ts`)
- `npx ts-node src/ingest/cli.ts ./corpus/araby.txt --lens "formalist"`
- Reads text, runs pipeline, outputs JSON to stdout or file
- Optional: `--lens` flag (can be repeated for multiple readings)
- Optional: `--output ./output/araby.json`
- Optional: `--derive` flag to include computed insights

### package.json
- Add `@anthropic-ai/sdk` dependency
- Add script: `"ingest:auto": "npx ts-node src/ingest/cli.ts"`

---

## Stop Condition
All four phases complete. Pipeline successfully ingests Araby, produces TextModel + at least one Reading + derived insights. Results comparable to hand-coded version. Branch pushed, PR opened.

## Out of Scope (for this PR)
- Chunking for long texts (novels) — design interface only
- OTEL export
- UI visualization
- Persistence beyond JSON files
- Actual `compareReadings()` method on NarrativeAnalysisSystem class
