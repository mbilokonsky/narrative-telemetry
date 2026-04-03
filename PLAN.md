# Narrative-Telemetry: Strategic Plan

## Where We Are

S1-S4 and M1-M5 are implemented. 690 tests across 17 suites, all passing. The UI is a full multi-story explorer with reading authoring, absential timelines, relationship graphs, causal chain navigation, and paste-and-analyze. The LLM pipeline produces 5D tension scoring, multi-causal state transitions, and interpretive causality.

Three reviewer personas identified concrete issues. All R1-R10 fixes and T1-T2 theoretical improvements are now implemented.

---

## COMPLETED: Reviewer-Identified Fixes

### R1. Fix Conditional Hooks Violation (Critical — will crash)
**Source**: Staff Engineer
**What**: `CausalChainExplorer.tsx` calls `useMemo` after an early return, violating React's rules of hooks. Will crash in development mode.
**Fix**: Move the guard below the hooks or return empty data from hooks when event is null.

### R2. Replace Green-to-Red Color Scale (Critical — accessibility)
**Source**: Kenji Morimoto (Information Design)
**What**: `significanceColor` in `utils.ts` uses green-to-red, which (a) implies "safe to dangerous" when significance isn't danger, (b) fails for red-green colorblindness (~8% of males), (c) has too narrow a lightness ramp (40-50) for dark backgrounds. Used in 7+ components.
**Fix**: Replace with a single-hue sequential ramp (light-to-dark blue or similar) or a perceptually uniform palette. This improves every component simultaneously.

### R3. Synchronized Scrolling in SplitTextView (Important — defeats purpose)
**Source**: Kenji Morimoto
**What**: The two comparison columns scroll independently, so line numbers drift apart. This defeats the purpose of side-by-side comparison.
**Fix**: Synchronize scroll positions between the two columns.

### R4. Remove Pulsing Animation (Important — accessibility)
**Source**: Kenji Morimoto
**What**: Continuous pulsing at 1.5-2s intervals on divergent events can trigger vestibular disorders. Animation should be transient, not persistent data encoding.
**Fix**: Replace with a static left-border whose color/width encodes divergence magnitude.

### R5. Unify Engine and UI Type Systems (Important — structural risk)
**Source**: Staff Engineer
**What**: `ui/src/types.ts` is a hand-maintained subset of engine types, already diverged (missing `beat` span type, missing Timestamp fields, `unknown` for Reading sub-types). Every new feature risks silent type drift.
**Fix**: Share types via a common package, or import engine types directly into the UI build. The engine has zero browser-incompatible runtime deps.

### R6. Add Runtime Validation for LLM Output (Important — silent corruption)
**Source**: Staff Engineer
**What**: `ExtractionResult` and `ReadingResult` use `any[]` with no runtime validation. Malformed LLM output produces subtly broken StoryModels.
**Fix**: Add Zod schemas for both wire types and validate immediately after `JSON.parse`.

### R7. Server Security Basics (Important)
**Source**: Staff Engineer
**What**: `/api/ingest` has no auth, rate limiting, or timeout on LLM calls.
**Fix**: Add API key check, request timeout, basic rate limiting.

### R8. 5D Tension Chart Legibility (Important — unreadable)
**Source**: Kenji Morimoto
**What**: Five overlapping lines at 0.6 opacity in a 76px-tall plot are indistinguishable. Legend swatches too small to match.
**Fix**: Use sparklines-per-dimension or stacked area approach. Increase chart height when 5D is active.

### R9. Absential Timeline Transparency (Minor — misleading)
**Source**: Kenji Morimoto
**What**: The `intensity = relevance × significance` curve looks like measured data but encodes editorial choices. The explanatory text is 10px gray italic — nobody reads it.
**Fix**: Make the methodology visible: label axes, show the raw data points more prominently, move explanation into a visible tooltip or header.

### R10. Description in State Version Field Hack (Minor — code smell)
**Source**: Staff Engineer
**What**: `extract.ts` stuffs transition descriptions into `version` field via `as any`, which `EntityHistory.tsx` must reverse-parse. 
**Fix**: Add a `description` field to the state data type.

---

## COMPLETED: Architectural Questions from Dr. Vasquez

### T1. Reading-Scoped Absentials
**Source**: Dr. Vasquez
**What**: Absentials are diegetic (in TextModel), but desire is already interpretive. A postcolonial reading might posit "colonial subject's desire for metropolitan culture" which a formalist would never identify. Currently there's no place for reading-specific absentials.
**Fix**: Add `absentials` to `Reading` alongside existing `themes` and `symbols`. TextModel absentials remain for clearly textual desires (the boy promises to go to Araby — that's diegetic). Reading absentials capture interpretive constructs.

### T2. Expand NarrativeEventType Taxonomy
**Source**: Dr. Vasquez
**What**: The current enum (action, dialogue, revelation, decision, environmental) misses categories critical for modernist fiction: free indirect discourse, interior monologue, narrator commentary, flashback, ekphrasis.
**Fix**: Expand the enum. Accept that this is a taxonomy choice, not a neutral fact.

### T3. Theoretical Grounding for 5D Tension
**Source**: Dr. Vasquez
**What**: The five dimensions mix narratological, phenomenological, and novel categories without theoretical justification. "Absential" is a coinage; "atmospheric" is phenomenological; "pacing" is structural.
**Fix**: Document the theoretical sources. Consider making dimensions user-configurable rather than fixed. Acknowledge this is a pragmatic decomposition, not a theoretical claim.

### T4. Validate Extraction Neutrality
**Source**: Dr. Vasquez
**What**: How do we know Pass 1 extraction is actually neutral? Interpretive framing may leak into "objective" event identification.
**Fix**: Run comparative extractions with different models. Document where neutrality is impossible (event boundary decisions are always interpretive to some degree). Be honest about this in the help system.

---

## COMPLETED (S1-S4, M1-M5)

All short-term and medium-term items from the original plan are implemented:

- **S1**: Multi-story explorer (30 stories, dropdown, auto text setup)
- **S2**: Absential timeline with Gaussian-smoothed narrative pressure curves
- **S3**: Side-by-side reading comparison with divergence highlighting
- **S4**: Paste-and-analyze with Express API server and SSE streaming
- **M1**: Reading authoring (significance slider, notes, JSON export)
- **M2**: Entity relationship graph (force-directed SVG)
- **M3**: OTEL query layer (Docker Compose + Jaeger + batch import)
- **M4**: 5D tension scoring (independent per-event dimensions)
- **M5**: Interpretive causality (per-reading causes/effects)
- **Enrichment**: Derived text annotations for all 30 stories
- **Corpus**: Source texts from Project Gutenberg
- **State model**: Multi-causal state transitions with causal roles
- **Help system**: 9-section guide + causal chain explorer

---

## LONG TERM: The Platform (unchanged from original plan)

### L1. Narrative Generation from Structure
Reverse the pipeline. Given a StoryModel, generate prose. The "game narrative systems" vision.

### L2. Cross-Work Structural Search
Structural fingerprinting across a large corpus. "Show me stories where epistemic tension peaks before the midpoint."

### L3. Collaborative Reading Platform
Multi-user. A class creates readings of the same text. Professor sees aggregate patterns.

### L4. Real-Time Narrative Monitoring
For game narratives — tension curves and absential resolution in real-time as a story unfolds.

### L5. Training LLMs to Read
Use (text, TextModel, Reading) triples as training data. Fine-tune models that can extract and interpret natively.

---

## Regeneration Plan

The existing 30 analyzed stories were generated before the following prompt updates:
- 5D dimension-specific tension scoring (M4)
- Interpretive causality with causes/effects (M5)
- Multi-step state transitions for characters and absentials
- Multi-causal state model with causal roles

Once R1-R8 fixes are complete, regenerate the corpus with the updated prompts. This is token-expensive so should be done once, after all prompt changes are settled.

---

## Priority Order

1. **R1** (hooks crash) — 5 minutes, must fix
2. **R2** (color scale) — 30 minutes, highest visual impact
3. **R3** (sync scrolling) — 30 minutes, makes compare mode usable
4. **R4** (pulsing animation) — 15 minutes, accessibility
5. **R5** (unified types) — 1-2 hours, prevents future bugs
6. **R6** (LLM validation) — 1 hour, prevents silent corruption
7. **R7** (server security) — 30 minutes
8. **R8** (5D chart) — 1 hour, makes the feature usable
9. **T1** (reading-scoped absentials) — 2-3 hours, deepens the model
10. **T2** (event type taxonomy) — 1 hour
11. **R9, R10** (minor fixes) — 30 minutes each
12. **T3, T4** (theoretical/documentation) — ongoing
13. **Regenerate corpus** — after all prompt changes settle
14. **Long-term (L1-L5)** — future phases

---

## Success Metrics

- **Immediate**: All three reviewers sign off on the fixes (re-run /review)
- **Short term**: "I showed this to a literary scholar and they wanted to try it with their own text"
- **Medium term**: Someone writes a paper using this tool. A game studio experiments with it.
- **Long term**: "Absential" enters critical vocabulary. Narrative-telemetry becomes the OTEL of storytelling.
