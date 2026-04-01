# Narrative-Telemetry Implementation Plan

## Goal
Build a working `NarrativeAnalysisSystem` that can ingest "Araby" by James Joyce and produce a valid, populated `StoryModel` — proving the type system and persistence tier work end-to-end.

## Success Criteria
All of the following must be true before we call this a working prototype:

1. **Compiles clean** — `tsc --noEmit` produces zero errors
2. **Ingestion script runs without crashing** — `npm run ingest` completes successfully
3. **StoryModel is structurally complete** — the generated model contains:
   - At least 3 characters (the boy, Mangan's sister, the uncle)
   - At least 3 settings (North Richmond Street, the house, Araby bazaar)
   - At least 1 theme (disillusionment / vanity)
   - At least 1 narrator
   - A root span of type STORY with child spans (acts or scenes)
   - At least 5 events distributed across spans
   - At least 2 absentials (the boy's romantic longing, the quest to Araby)
   - At least 1 relationship
   - At least 1 mental construct
4. **Causality is wired** — events reference causes; entity state histories have >1 entry where state changed due to an event
5. **Persistence round-trips** — save the model, load it back, and the loaded model deep-equals the original
6. **Spans nest correctly** — root span contains child spans; child spans contain events; no orphan events

## Approach
Hand-code a detailed ingestion of "Araby" using the `NarrativeAnalysisSystem` class. This is not LLM-driven analysis — it's a manual encoding that exercises every part of the type system and proves the machinery works.

## Cycles

### Cycle 1 — Scaffold + Ingest + Validate
- [x] Implement `NarrativeAnalysisSystem` class with full CRUD for all entity types
- [x] Implement span management (create, close, find, nest)
- [x] Implement event dispatch with effect application
- [x] Wire up entity state transitions on event effects
- [x] Add `npm run ingest` script entry point
- [x] Create the story model metadata (title, author, description)
- [x] Register all characters (4), settings (3), items (1)
- [x] Register themes (2), symbols (1), narrator, reader, author
- [x] Create span structure (story → 3 acts → 9 scenes)
- [x] Dispatch 11 events across scenes with causes and effects
- [x] Register absentials (2) and wire resolution/negation to events
- [x] Register relationships (2) and mental constructs (2)
- [x] Run ingestion — passes
- [x] Run validation — 18/18 checks pass
- [x] Verify persistence round-trip — passes

## Status
**COMPLETE — all 18 validation checks pass. Prototype is working.**

### What was built
- `src/NarrativeAnalysisSystem.ts` — core system class with entity CRUD, span management, event dispatch with automatic state application, absential status transitions, tension tracking
- `src/ingest-araby.ts` — hand-coded ingestion of Joyce's "Araby" exercising all entity types
- `src/validate.ts` — automated validation of all 6 success criteria (18 individual checks)
- `src/persistence.ts` — JSON file persistence (save/load/list/delete)

### Model stats for "Araby"
- 4 characters, 3 settings, 1 item
- 2 themes, 1 symbol, 1 narrator, 1 reader, 1 author
- 2 relationships, 2 mental constructs, 2 absentials
- 3 acts → 9 scenes, 11 events
- 10 global tension data points
- Full causal wiring: events → state changes, absential transitions
