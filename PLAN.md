# Narrative-Telemetry: Strategic Plan

## Where We Are

A working analytical engine with 277 tests passing. The architecture is sound (TextModel + Reading superposition), the LLM pipeline follows two-pass extraction, OTEL export works, and we have authorial profiles for 30 stories across two authors. The UI is functional but read-only.

The problem: **none of this is visible.** The "holy shit" moments are locked in JSON files and CLI output. The engine is production-quality; the experience is not.

## Guiding Principle

Ship demos that make the invisible visible. Every milestone should produce something you can show someone who's never heard of this project and watch their face change.

---

## SHORT TERM: The "Holy Shit" Demos (1-3 weeks)

### S1. Interactive Multi-Story Explorer
**What**: Upgrade the UI from single-story viewer to a full explorer. Story selector dropdown, load any story from the output corpus. Instantly browse all 30 analyzed stories.

**Why**: We already HAVE 30 analyzed stories. The only reason nobody can see them is the UI is hardcoded to araby.json. This is the lowest-effort, highest-impact change.

**Effort**: Low (2-3 days)
**Pros**: Instant portfolio — "here are 30 stories analyzed through a computational lens"
**Cons**: Still read-only, still formalist-only for the auto-generated ones
**Ship criterion**: Story picker works, any story loads, span waterfall + text + tension chart all update

### S2. Absential Timeline Visualization
**What**: A new UI panel: select an absential (e.g., "the boy's romantic longing"), see a timeline showing where it's introduced, every event where it's active, its tension accumulation, and the moment of resolution. Like a debugger for narrative desire.

**Why**: Absentials are the most novel concept in the system. Making them *visible* — watching a character's desire grow event by event until it breaks — is emotionally powerful and theoretically distinctive. Nobody else has this.

**Effort**: Medium (3-5 days)
**Pros**: Unique, demonstrates the absential concept viscerally, works for any story
**Cons**: Depends on absential quality from LLM extraction (some stories may have sparse absentials)
**Ship criterion**: Click an absential, see its full lifecycle across the text, with tension overlay

### S3. Live Reading Comparison Side-by-Side
**What**: Split-screen mode where the same text is shown twice with two different readings applied. Events that diverge most between readings pulse or glow. Click a divergent event to see both readings' notes side-by-side.

**Why**: This is the superposition concept made tangible. Same text, different significance, different meaning. The visual contrast is immediately striking — "formalist says this is a 0.9, postcolonial says it's a 0.3, here's why."

**Effort**: Medium (we have compare mode already, but it needs to be more dramatic)
**Pros**: Demonstrates the core architectural insight, academically compelling
**Cons**: Requires two readings per story (currently only Araby has both formalist + postcolonial)
**Ship criterion**: Split text view, divergence highlighting, per-event annotation comparison

### S4. "Paste and Analyze" — Live LLM Ingestion in the UI
**What**: A "New Story" mode in the UI where you paste raw text, hit "Analyze", and watch entities and events appear in real-time as the LLM extracts them. Then hit "Generate Reading" to layer an interpretive lens.

**Why**: This is the demo that makes non-technical people understand what this does. They paste a paragraph from their favorite novel and watch it decompose into structure in real time. It's magic.

**Effort**: High (4-7 days — needs streaming, backend API or in-browser LLM call, progress UI)
**Pros**: The single most impressive demo possible. "I can do this with ANY text."
**Cons**: Requires API key management, costs money per use, latency, error handling
**Ship criterion**: Paste text → watch extraction animate → switch to reading mode → see significance colors appear

---

## MEDIUM TERM: The Scholarly Tool (1-3 months)

### M1. Reading Authoring in the UI
**What**: Users can create readings directly in the UI. Click an event to assign significance, add notes. Create themes and symbols. Draw connections. Save readings alongside the text.

**Why**: Without this, the tool is passive — you can look at what the LLM generated but can't engage with it as a scholar. Authoring turns it from a viewer into a research instrument. A scholar should be able to disagree with the formalist reading and create their own.

**Effort**: High
**Pros**: Transforms the tool from "interesting demo" to "thing I'd actually use for research"
**Cons**: Complex UI work (forms, validation, state management, save/load)
**Risk**: Scope creep — could easily become a 3-month project if not scoped tightly

### M2. Entity Relationship Graph
**What**: Interactive force-directed graph showing characters, settings, and their relationships. Filter by relationship type, reading, time range. Click nodes to inspect. Edges weighted by interaction frequency or tension.

**Why**: Narrative is relational. Seeing the web of connections — who knows whom, who's in conflict with whom, which settings connect which characters — is one of the most intuitive ways to understand a story's structure.

**Effort**: Medium (D3 or similar, but the data is already there)
**Pros**: Visually stunning, immediately comprehensible, works for complex narratives (LotR would look amazing)
**Cons**: Graph layout is hard to get right; can look cluttered for dense narratives

### M3. OTEL Query Layer (Jaeger/Tempo Integration)
**What**: Docker compose with Jaeger or Grafana Tempo. Export stories to traces. Query with TraceQL: "show me all events where significance > 0.8 in the postcolonial reading" or "find spans where epistemic tension exceeds relational tension."

**Why**: This is the architectural payoff — the reason we modeled everything as spans and events. Getting the query layer "for free" from OTEL tooling validates the entire approach.

**Effort**: Medium (Docker setup, import pipeline, documentation)
**Pros**: Validates the OTEL thesis, enables power-user queries, impressive to engineers
**Cons**: Jaeger UI isn't designed for narrative analysis (may feel awkward for scholars)

### M4. Dimension-Specific Tension Scoring
**What**: Update the LLM interpretation prompt to score each event on all five tension dimensions independently (absential, relational, epistemic, atmospheric, pacing) rather than deriving them from a single composite.

**Why**: The FINDINGS.md flagged this: "dimensional tension curves are derived from a shared scalar composite through proportional decomposition." This is the biggest analytical limitation. True independent dimension scoring would make the TensionField genuinely multi-dimensional and enable real dimensional analysis ("Joyce's epistemic peaks differ from Mansfield's").

**Effort**: Low-Medium (prompt change + derive pipeline update)
**Pros**: Massive analytical improvement, makes TensionField data real
**Cons**: Higher token cost per interpretation, may need prompt tuning

### M5. Interpretive Causality
**What**: Populate `ReadingEventAnnotation.causes` and `effects`. Each reading can say "this event was caused by that event" and "this event changed character X's emotional state from Y to Z."

**Why**: Causality is how readers actually think about stories. "The uncle's lateness *caused* the boy to arrive at a closing bazaar" is a causal chain, not just a sequence. Different readings may attribute different causes to the same outcome.

**Effort**: Medium (prompt changes, UI for causal chain visualization)
**Pros**: Enables "why did this happen?" queries, per-reading causal disagreement
**Cons**: Causality is hard for LLMs to get right; may need human validation

---

## LONG TERM: The Platform (3-12 months)

### L1. Narrative Generation from Structure
**What**: Reverse the pipeline. Given a StoryModel (spans, entities, absentials, events), generate prose that realizes the structure. "Here's a three-act story with these characters, this absential arc, and this epiphany timing — write it."

**Why**: This closes the loop. Analysis → structure → generation. If the ontology is rich enough to capture what makes a story work, it should be rich enough to *produce* stories. This is the "game narrative systems" vision — define the structure, generate the text.

**Pros**: Genuinely novel, massive commercial potential (game dev, creative writing tools)
**Cons**: Extremely hard to do well. Generated prose may feel mechanical. Requires the ontology to be truly sufficient.
**Risk**: High. But the payoff is transformative.

### L2. Cross-Work Structural Search
**What**: Given a large corpus (hundreds of stories/novels), find structurally similar works. "This story has the same absential architecture as Araby but the pacing of Miss Brill." Structural fingerprinting as a discovery mechanism.

**Why**: This turns the tool from "analyze one story" to "navigate a literary corpus by structure." Scholars could find patterns they'd never notice by reading alone. "Show me all stories where the epistemic peak comes before the midpoint" is a query that could yield genuine literary discoveries.

**Pros**: Academically groundbreaking, publishable, enables new kinds of literary scholarship
**Cons**: Requires a large analyzed corpus (expensive), similarity metrics need tuning

### L3. Collaborative Reading Platform
**What**: Multi-user. A class of students all create readings of the same text. Professor sees aggregate patterns. "17 students marked this event as highly significant; 3 didn't — why?" Readings as data, pedagogy as analysis.

**Why**: This is how narrative-telemetry becomes a standard. If it's used in classrooms, if students learn to think in terms of TextModel + Reading, if the vocabulary ("absential", "significance as relational") enters critical discourse — then the tool shapes the field.

**Pros**: Institutional adoption, recurring revenue, shapes how people think about narrative
**Cons**: Requires auth, multi-tenancy, real backend, hosting. Big engineering lift.

### L4. Real-Time Narrative Monitoring
**What**: For game narratives, interactive fiction, or serialized media — narrative-telemetry as a live system. Events fire as the story unfolds. Tension curves update in real-time. Absentials resolve. The OTEL analogy becomes literal: narrative as a running system being observed.

**Why**: This is the video game vision. A narrative designer sees the tension curve of a player's playthrough in real-time. "Player X has 3 unresolved absentials and rising epistemic tension — this is the moment to trigger the revelation."

**Pros**: Massive market (games, interactive media), technically natural extension of the architecture
**Cons**: Requires real-time infrastructure, game engine integration, very different UX

### L5. Training LLMs to Read
**What**: Use the corpus of (text, TextModel, Reading) triples as training data. Fine-tune a model that can do extraction and interpretation natively, without the massive prompt engineering. The structured output IS the training signal.

**Why**: This is the deepest version of the vision — teaching machines to read the way literary scholars read. Not summarization. Not sentiment analysis. Structural decomposition with interpretive layering.

**Pros**: Could produce a genuinely novel AI capability, publishable, fundable
**Cons**: Requires large corpus, fine-tuning infrastructure, evaluation metrics for "good reading"

---

## What To Do First

The short-term items (S1-S4) are ordered by impact/effort ratio:

1. **S1 (Multi-Story Explorer)** — unblocks everything. Show what we have.
2. **S3 (Side-by-Side Reading Comparison)** — demonstrates the core insight.
3. **S2 (Absential Timeline)** — demonstrates the most novel concept.
4. **S4 (Paste and Analyze)** — the crowd-pleaser, but hardest.

Do S1 first (it's 2-3 days and makes everything else more impactful), then S3+S2 in parallel, then S4.

For medium-term, **M4 (Dimension-Specific Scoring)** is the most important because it fixes the biggest analytical limitation. **M1 (Reading Authoring)** is the most important for making this a real tool vs a demo.

For long-term, **L1 (Generation from Structure)** is the highest-risk, highest-reward bet. **L3 (Collaborative Platform)** is the most likely path to adoption. They're not mutually exclusive.

---

## Success Metrics

- **Short term**: "I showed this to [literary scholar / game designer / AI researcher] and they immediately wanted to try it with their own text"
- **Medium term**: Someone writes a paper using this tool. A game studio experiments with it.
- **Long term**: "Absential" enters critical vocabulary. Narrative-telemetry becomes the OTEL of storytelling.
