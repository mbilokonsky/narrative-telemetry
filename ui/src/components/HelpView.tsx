import { useState } from 'react'

interface HelpViewProps {
  onClose: () => void;
}

type Section = 'overview' | 'model' | 'ui' | 'absentials' | 'readings' | 'tension' | 'causality' | 'graph' | 'compare';

const SECTIONS: { id: Section; title: string }[] = [
  { id: 'overview', title: 'What Is This?' },
  { id: 'model', title: 'The Data Model' },
  { id: 'readings', title: 'Readings & Superposition' },
  { id: 'absentials', title: 'Absentials' },
  { id: 'tension', title: 'Tension & 5D Scoring' },
  { id: 'causality', title: 'Causal Chains' },
  { id: 'compare', title: 'Comparing Readings' },
  { id: 'graph', title: 'Relationship Graph' },
  { id: 'ui', title: 'UI Guide' },
];

export function HelpView({ onClose }: HelpViewProps) {
  const [active, setActive] = useState<Section>('overview');

  return (
    <div className="help-view">
      <div className="help-sidebar">
        <div className="help-sidebar-title">Help</div>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`help-nav-item ${active === s.id ? 'active' : ''}`}
            onClick={() => setActive(s.id)}
          >
            {s.title}
          </button>
        ))}
        <button className="help-close-btn" onClick={onClose}>Back to Explorer</button>
      </div>
      <div className="help-content">
        {active === 'overview' && <OverviewSection />}
        {active === 'model' && <ModelSection />}
        {active === 'readings' && <ReadingsSection />}
        {active === 'absentials' && <AbsentialsSection />}
        {active === 'tension' && <TensionSection />}
        {active === 'causality' && <CausalitySection />}
        {active === 'compare' && <CompareSection />}
        {active === 'graph' && <GraphSection />}
        {active === 'ui' && <UISection />}
      </div>

      <style>{`
        .help-view { display: flex; height: 100%; overflow: hidden; }
        .help-sidebar { width: 220px; min-width: 220px; background: var(--bg-surface); border-right: 1px solid var(--border); padding: 16px 0; display: flex; flex-direction: column; overflow-y: auto; }
        .help-sidebar-title { font-size: 14px; font-weight: 600; color: var(--text-bright); padding: 0 16px 12px; }
        .help-nav-item { display: block; width: 100%; text-align: left; padding: 8px 16px; border: none; background: none; color: var(--text-dim); font-size: 13px; cursor: pointer; transition: all 0.15s; }
        .help-nav-item:hover { color: var(--text); background: var(--bg-hover); }
        .help-nav-item.active { color: var(--accent); background: var(--accent-dim); border-left: 2px solid var(--accent); padding-left: 14px; }
        .help-close-btn { margin-top: auto; padding: 10px 16px; border: none; background: none; color: var(--text-dim); font-size: 12px; cursor: pointer; text-align: left; border-top: 1px solid var(--border); }
        .help-close-btn:hover { color: var(--accent); }
        .help-content { flex: 1; overflow-y: auto; padding: 24px 32px; max-width: 720px; }
        .help-content h2 { font-size: 20px; font-weight: 600; color: var(--text-bright); margin: 0 0 16px; }
        .help-content h3 { font-size: 15px; font-weight: 600; color: var(--text-bright); margin: 20px 0 8px; }
        .help-content p { font-size: 14px; color: var(--text); line-height: 1.7; margin: 0 0 12px; }
        .help-content ul { margin: 0 0 12px; padding-left: 20px; }
        .help-content li { font-size: 14px; color: var(--text); line-height: 1.7; margin-bottom: 4px; }
        .help-content code { font-family: var(--mono); font-size: 13px; background: var(--bg-hover); padding: 1px 5px; border-radius: 3px; color: var(--accent); }
        .help-content .help-diagram { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 16px; margin: 12px 0; font-family: var(--mono); font-size: 12px; line-height: 1.6; color: var(--text-dim); white-space: pre; overflow-x: auto; }
        .help-content .help-key { display: inline-block; padding: 2px 8px; border: 1px solid var(--border); border-radius: 3px; font-size: 11px; font-family: var(--mono); color: var(--text-dim); margin: 0 2px; }
        .help-content .help-note { background: var(--accent-dim); border-left: 3px solid var(--accent); padding: 10px 14px; border-radius: 0 4px 4px 0; margin: 12px 0; font-size: 13px; color: var(--text); line-height: 1.6; }
      `}</style>
    </div>
  );
}

function OverviewSection() {
  return <>
    <h2>What Is Narrative Telemetry?</h2>
    <p>Narrative Telemetry is a framework for computational narrative analysis. It models stories as <strong>traces</strong> — borrowing OpenTelemetry's span/event architecture to represent the unfolding of a narrative as nested spans (story → acts → scenes → beats) with events dispatched within them.</p>
    <p>The core insight: <strong>significance is relational, not intrinsic.</strong> An event's importance depends on the interpretive lens applied to it. The same event can be a 0.9 in a formalist reading and a 0.3 in a postcolonial reading. The text exists in superposition; each reading collapses it.</p>

    <h3>What You're Looking At</h3>
    <p>This UI lets you explore 30 analyzed stories (15 Joyce Dubliners + 15 Mansfield) through their structural decomposition:</p>
    <ul>
      <li><strong>Left panel</strong>: Span waterfall (story structure) + absential list (desires/fears/goals)</li>
      <li><strong>Center panel</strong>: The text itself, with entity annotations and significance-colored event highlighting</li>
      <li><strong>Right panel</strong>: Detail inspector, relationship graph, and tension chart</li>
    </ul>

    <h3>Key Concepts</h3>
    <ul>
      <li><strong>TextModel</strong>: The neutral, objective extraction — what's in the text</li>
      <li><strong>Reading</strong>: An interpretive overlay — what it means under a specific lens</li>
      <li><strong>Absential</strong>: Something desired, feared, or needed that shapes narrative tension by its absence</li>
      <li><strong>Significance</strong>: A 0-1 score that is always (event, reading) — never intrinsic to the event</li>
    </ul>
  </>;
}

function ModelSection() {
  return <>
    <h2>The Data Model</h2>
    <p>Every analyzed story is a <code>StoryModel</code> with two layers:</p>

    <div className="help-diagram">{`StoryModel
├── text: TextModel              ← neutral, exhaustive
│   ├── rootSpan                 ← story → acts → scenes → beats
│   ├── diegetic                 ← characters, settings, items, factions
│   ├── events                   ← what happens, with text line anchors
│   ├── relationships            ← interpersonal, group
│   ├── absentials               ← desires, fears, goals
│   └── annotations              ← entity mentions in the text
└── readings: Record<name, Reading>
    ├── themes, symbols          ← interpretive constructs
    ├── eventSignificance        ← per-event 0-1 scores + notes
    ├── globalTension            ← tension curve (composite + 5D)
    └── causes/effects           ← interpretive causal chains`}</div>

    <h3>Diegetic vs Non-Diegetic</h3>
    <p><strong>Diegetic</strong> entities exist in the story world: characters, settings, items, relationships, absentials. They live in the TextModel and are objective facts about the text.</p>
    <p><strong>Non-diegetic</strong> entities are about the story: themes, symbols, narrator framing, reader state. They live in Readings and depend on the interpretive lens.</p>

    <h3>Semantic IDs</h3>
    <p>Every entity uses readable slugs: <code>boy</code>, <code>mangans-sister</code>, <code>north-richmond-st</code>, <code>abs-quest-to-araby</code>. No auto-incremented counters. A bounded text has a bounded namespace.</p>

    <h3>Events</h3>
    <p>Events are anchored to specific lines in the source text (<code>textLocation.startLine</code> to <code>endLine</code>). They have participants (entity IDs), a type (action, dialogue, revelation, decision, environmental), and a position in the story (0-100%).</p>
    <p>Events are chained via <code>precedingEvent</code> — each event points to the one that narratively precedes it, forming the diegetic causal chain.</p>
  </>;
}

function ReadingsSection() {
  return <>
    <h2>Readings & Superposition</h2>
    <p>A <strong>Reading</strong> is an interpretive overlay on the neutral TextModel. It assigns significance scores, identifies themes and symbols, and traces tension — all through a specific critical lens.</p>

    <div className="help-note">
      The same text can support multiple readings simultaneously. A formalist reading cares about structure and style; a postcolonial reading cares about colonial dynamics and orientalism. Both are valid collapses of the same textual superposition.
    </div>

    <h3>Significance Scores</h3>
    <p>Every event gets a <code>significance</code> score from 0 (irrelevant to this lens) to 1 (maximally significant). Most events score 0.3-0.7. Only truly pivotal moments reach 0.8+.</p>
    <p>In the text view, significance controls the background color intensity — greener = lower significance, redder = higher.</p>

    <h3>Creating Your Own Reading</h3>
    <p>Click <strong>+ Reading</strong> in the top bar. Name your lens (e.g., "psychoanalytic"), describe its perspective, then click through events to assign significance scores with the slider and add interpretive notes. Your reading appears in the reading selector immediately.</p>
  </>;
}

function AbsentialsSection() {
  return <>
    <h2>Absentials</h2>
    <p>An <strong>absential</strong> is something that shapes the narrative through its absence: an unfulfilled desire, an unresolved fear, an unreached goal. The term comes from Terrence Deacon's theory of incomplete nature — what's <em>not</em> present drives what <em>is</em> present.</p>

    <h3>Examples</h3>
    <ul>
      <li><strong>"The boy's romantic longing"</strong> (Araby) — a desire for connection with Mangan's sister that is never fulfilled</li>
      <li><strong>"The quest to Araby"</strong> — a goal (bring her a gift from the bazaar) that fails</li>
      <li><strong>"Gabriel's fear of inadequacy"</strong> (The Dead) — an anxiety that shapes every interaction</li>
    </ul>

    <h3>Reading the Timeline</h3>
    <p>Click an absential in the left panel to see its <strong>Narrative Pressure</strong> chart:</p>
    <ul>
      <li>The <strong>curve</strong> shows how much narrative attention this absential receives across the story. It's computed from events where the absential's <code>holder</code> (the character who holds the desire) meets its <code>relatedEntities</code> (target, obstacle, facilitator)</li>
      <li><strong>Colored dots</strong> are individual events. Size = relevance to this specific absential. Color = reading significance</li>
      <li><strong>Dashed vertical lines</strong> mark state transitions (introduction, resolution)</li>
      <li><strong>Key Moments</strong> lists the highest-pressure events with their relevance score</li>
    </ul>

    <h3>Overlaying Absentials</h3>
    <p><span className="help-key">Shift</span>+click additional absentials to overlay their curves. This lets you watch how different desires interact — e.g., romantic longing peaks early while the quest to Araby builds later, and both crash at the epiphany.</p>
  </>;
}

function TensionSection() {
  return <>
    <h2>Tension & 5D Scoring</h2>
    <p>The <strong>tension chart</strong> in the right panel shows how narrative tension evolves across the story. Each reading produces its own tension curve.</p>

    <h3>Reading the Chart</h3>
    <ul>
      <li>X-axis: position in the story (0-100%)</li>
      <li>Y-axis: tension value (0.0-1.0)</li>
      <li>Colored lines: one per reading (when comparing)</li>
      <li>Dashed vertical line: currently selected event's position</li>
    </ul>

    <h3>Five Tension Dimensions</h3>
    <p>Click the <strong>5D</strong> button on the tension chart to decompose tension into five independent dimensions:</p>
    <ul>
      <li><strong style={{color: '#e8a845'}}>Absential</strong> — unresolved desires, fears, goals. How much do characters want what they can't have?</li>
      <li><strong style={{color: '#e86445'}}>Relational</strong> — interpersonal conflict. Are relationships under stress?</li>
      <li><strong style={{color: '#45a8e8'}}>Epistemic</strong> — information asymmetry. What do characters not know? What does the reader know that they don't?</li>
      <li><strong style={{color: '#9b59b6'}}>Atmospheric</strong> — environmental pressure. Mood, setting, ambient dread</li>
      <li><strong style={{color: '#45e87b'}}>Pacing</strong> — event density. Is the narrative accelerating or dwelling?</li>
    </ul>
    <div className="help-note">These dimensions are independent. A story can have high absential tension (many unresolved quests) but low relational tension (no interpersonal conflict). The 5D view reveals these differences.</div>

    <p>Note: The existing 30 pre-analyzed stories have scalar-only tension data. Stories analyzed through the "Analyze" feature will produce full 5D data.</p>
  </>;
}

function CausalitySection() {
  return <>
    <h2>Causal Chains</h2>
    <p>Events in a narrative are connected by two kinds of causality:</p>

    <h3>Diegetic Chains</h3>
    <p>Every event has a <code>precedingEvent</code> — the event that narratively comes before it. This forms an objective chain: the uncle's lateness → the boy's late arrival at the bazaar → finding it closed. This chain is the same regardless of interpretive lens.</p>
    <p>In the <strong>Causal Chain Explorer</strong> (available from the event detail panel), you can trace backward and forward through this chain to see the full narrative sequence.</p>

    <h3>Interpretive Chains</h3>
    <p>Readings can annotate events with <code>causes</code> and <code>effects</code> — causal relationships that are lens-specific. A formalist might say the uncle's lateness causes the failed quest (structural mechanics). A psychoanalytic reading might say the boy's unconscious self-sabotage causes his failure (desire for failure).</p>
    <p>When viewing an event in the detail panel, <strong>"Caused by"</strong> and <strong>"Causes"</strong> links let you navigate the interpretive causal chain. These are clickable — follow the chain to understand how one reading constructs narrative causation differently from another.</p>

    <div className="help-note">
      The pre-analyzed stories don't yet have interpretive causality populated (they were generated before this feature was added). New analyses will include causal annotations. The diegetic chain (precedingEvent) is available for all stories.
    </div>
  </>;
}

function CompareSection() {
  return <>
    <h2>Comparing Readings</h2>
    <p>When a story has multiple readings (currently only hand-coded Araby has both formalist and postcolonial), click <strong>Compare</strong> to enter split-screen mode.</p>

    <h3>Split Text View</h3>
    <p>The center panel divides into two columns showing the same text with each reading's significance coloring. Events that diverge between readings pulse with colored borders:</p>
    <ul>
      <li><strong style={{color: '#e8a845'}}>Yellow border (pulsing)</strong>: moderate divergence (difference &gt; 0.15)</li>
      <li><strong style={{color: '#e84545'}}>Red border (faster pulse)</strong>: high divergence (difference &gt; 0.3)</li>
    </ul>
    <p>The most divergent event in Araby is <code>e08-o-love</code> ("O love! O love!") — formalist: 0.85, postcolonial: 0.30. The formalist sees it as the story's emotional peak; the postcolonial reading sees it as a symptom of orientalist fantasy.</p>

    <h3>Detail Panel in Compare Mode</h3>
    <p>When you select an event in compare mode, the detail panel shows significance bars for both readings side by side, with each reading's interpretive note. This is where the superposition concept becomes tangible.</p>
  </>;
}

function GraphSection() {
  return <>
    <h2>Relationship Graph</h2>
    <p>The force-directed graph in the right panel (visible when no event is selected) shows the web of narrative relationships.</p>

    <h3>Node Types</h3>
    <ul>
      <li><strong style={{color: '#7b8cde'}}>Blue circles</strong>: Characters</li>
      <li><strong style={{color: '#45e87b'}}>Green circles</strong>: Settings</li>
      <li><strong style={{color: '#e8a845'}}>Amber circles</strong>: Items</li>
    </ul>
    <p>Node size reflects entity significance in the current reading. More significant entities are larger.</p>

    <h3>Edges</h3>
    <p>Edges come from two sources:</p>
    <ul>
      <li><strong>Explicit relationships</strong>: interpersonal relationships defined in the TextModel (e.g., "Boy → Mangan's sister: one-sided romantic infatuation")</li>
      <li><strong>Implicit co-participation</strong>: characters who appear in 3+ events together get a dashed connection</li>
    </ul>
    <p>Hover over a node to highlight its connections and see relationship labels.</p>
  </>;
}

function UISection() {
  return <>
    <h2>UI Guide</h2>

    <h3>Top Bar</h3>
    <ul>
      <li><strong>Story selector</strong>: dropdown grouped by collection (Hand-Coded / Dubliners / Mansfield)</li>
      <li><strong>Reading tabs</strong>: switch between available readings for this story</li>
      <li><strong>Compare</strong>: toggle split-screen mode (when 2+ readings exist)</li>
      <li><strong>+ Reading</strong>: create a custom reading with your own significance annotations</li>
      <li><strong>+ Analyze</strong>: paste new text for live LLM analysis (requires API server)</li>
      <li><strong>? Help</strong>: this help page</li>
    </ul>

    <h3>Left Panel</h3>
    <ul>
      <li><strong>Span Waterfall</strong>: hierarchical story structure. Click to see span details. Colored dots show event significance within each span.</li>
      <li><strong>Absentials</strong>: list of desires/fears/goals. Click to see timeline. Shift-click to overlay multiple.</li>
    </ul>

    <h3>Center Panel</h3>
    <ul>
      <li><strong>Line numbers</strong>: left margin</li>
      <li><strong>Background color</strong>: green→red gradient reflecting event significance at each line</li>
      <li><strong>Underlined text</strong>: entity annotations. Click to see entity details. Dotted underline = diegetic annotation. Badge with number = overlapping annotations (click to disambiguate)</li>
      <li><strong>Click any colored line</strong>: select the event at that location</li>
    </ul>

    <h3>Right Panel</h3>
    <ul>
      <li><strong>Overview</strong> (nothing selected): story metadata, entity counts, reading descriptions, relationship graph, tension chart</li>
      <li><strong>Event selected</strong>: event details, participants, significance per reading (with notes), causal links, tension chart with position marker</li>
      <li><strong>Entity selected</strong>: entity details, context, events it participates in, relationships, significance per reading</li>
      <li><strong>Absential selected</strong>: narrative pressure chart, state transitions, key moments</li>
    </ul>

    <h3>Keyboard Hints</h3>
    <ul>
      <li><span className="help-key">Shift</span>+click absentials to overlay curves</li>
      <li>Click any event in the tension chart or key moments list to jump to it</li>
    </ul>
  </>;
}
