import { useState } from 'react'

interface HelpViewProps {
  onClose: () => void;
}

type Section = 'overview' | 'model' | 'ui' | 'absentials' | 'readings' | 'tension' | 'causality' | 'graph' | 'compare' | 'state';

const SECTIONS: { id: Section; title: string }[] = [
  { id: 'overview', title: 'What Is This?' },
  { id: 'model', title: 'The Data Model' },
  { id: 'readings', title: 'Readings & Superposition' },
  { id: 'absentials', title: 'Absentials' },
  { id: 'tension', title: 'Tension & 5D Scoring' },
  { id: 'causality', title: 'Causal Chains' },
  { id: 'state', title: 'Entity State History' },
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
        {active === 'state' && <StateSection />}
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
        .help-content { flex: 1; overflow-y: auto; padding: 24px 32px; max-width: 760px; }
        .help-content h2 { font-size: 20px; font-weight: 600; color: var(--text-bright); margin: 0 0 16px; }
        .help-content h3 { font-size: 15px; font-weight: 600; color: var(--text-bright); margin: 20px 0 8px; }
        .help-content p { font-size: 14px; color: var(--text); line-height: 1.7; margin: 0 0 12px; }
        .help-content ul { margin: 0 0 12px; padding-left: 20px; }
        .help-content li { font-size: 14px; color: var(--text); line-height: 1.7; margin-bottom: 4px; }
        .help-content code { font-family: var(--mono); font-size: 13px; background: var(--bg-hover); padding: 1px 5px; border-radius: 3px; color: var(--accent); }
        .help-content .help-diagram { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 16px; margin: 12px 0; font-family: var(--mono); font-size: 12px; line-height: 1.6; color: var(--text-dim); white-space: pre; overflow-x: auto; }
        .help-content .help-key { display: inline-block; padding: 2px 8px; border: 1px solid var(--border); border-radius: 3px; font-size: 11px; font-family: var(--mono); color: var(--text-dim); margin: 0 2px; }
        .help-content .help-note { background: var(--accent-dim); border-left: 3px solid var(--accent); padding: 10px 14px; border-radius: 0 4px 4px 0; margin: 12px 0; font-size: 13px; color: var(--text); line-height: 1.6; }
        .help-content .help-figure { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 16px; margin: 16px 0; }
        .help-content .help-figure svg { display: block; margin: 0 auto; }
        .help-content .help-figure-caption { font-size: 11px; color: var(--text-dim); text-align: center; margin-top: 8px; font-style: italic; }
      `}</style>
    </div>
  );
}

// ── Inline SVG illustrations ──

function SignificanceColorBar() {
  return (
    <div className="help-figure">
      <svg width="400" height="40" viewBox="0 0 400 40">
        <defs>
          <linearGradient id="sig-grad">
            <stop offset="0%" stopColor="hsl(225, 20%, 65%)" />
            <stop offset="50%" stopColor="hsl(225, 52%, 55%)" />
            <stop offset="100%" stopColor="hsl(225, 85%, 45%)" />
          </linearGradient>
        </defs>
        <rect x="20" y="5" width="360" height="16" rx="3" fill="url(#sig-grad)" />
        <text x="20" y="36" fill="var(--text-dim)" fontSize="10">0.0 — faint (low significance)</text>
        <text x="380" y="36" fill="var(--text-dim)" fontSize="10" textAnchor="end">1.0 — vivid (high significance)</text>
      </svg>
      <div className="help-figure-caption">Significance color scale: a single-hue blue ramp (accessible for colorblind users)</div>
    </div>
  );
}

function TensionSparklines() {
  return (
    <div className="help-figure">
      <svg width="400" height="160" viewBox="0 0 400 160">
        {[
          { label: 'ABS', color: '#e8a845', path: 'M40,22 L120,18 L200,10 L280,14 L360,8' },
          { label: 'REL', color: '#e86445', path: 'M40,22 L120,20 L200,16 L280,8 L360,18' },
          { label: 'EPI', color: '#45a8e8', path: 'M40,24 L120,22 L200,20 L280,10 L360,6' },
          { label: 'ATM', color: '#9b59b6', path: 'M40,14 L120,10 L200,16 L280,20 L360,22' },
          { label: 'PAC', color: '#45e87b', path: 'M40,20 L120,16 L200,22 L280,12 L360,14' },
        ].map((dim, i) => {
          const y = i * 30 + 4;
          return (
            <g key={dim.label} transform={`translate(0,${y})`}>
              <text x="32" y="16" textAnchor="end" fill={dim.color} fontSize="9" fontWeight="600">{dim.label}</text>
              <rect x="40" y="2" width="320" height="24" fill="var(--bg)" rx="2" opacity="0.5" />
              <path d={dim.path} fill="none" stroke={dim.color} strokeWidth="1.5" opacity="0.8" />
            </g>
          );
        })}
        <text x="40" y="158" fill="var(--text-dim)" fontSize="9">0%</text>
        <text x="200" y="158" fill="var(--text-dim)" fontSize="9" textAnchor="middle">50%</text>
        <text x="360" y="158" fill="var(--text-dim)" fontSize="9" textAnchor="end">100%</text>
      </svg>
      <div className="help-figure-caption">5D sparklines: each dimension gets its own row, showing independent tension trajectories</div>
    </div>
  );
}

function NarrativePressureDiagram() {
  return (
    <div className="help-figure">
      <svg width="400" height="110" viewBox="0 0 400 110">
        <rect x="40" y="5" width="320" height="75" fill="var(--bg)" rx="3" />
        {/* Smoothed curve */}
        <path d="M40,70 C80,68 120,50 160,35 C200,20 240,15 280,25 C320,35 340,60 360,70" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.8" />
        {/* Area fill */}
        <path d="M40,70 C80,68 120,50 160,35 C200,20 240,15 280,25 C320,35 340,60 360,70 L360,80 L40,80 Z" fill="var(--accent)" opacity="0.1" />
        {/* Event dots */}
        <circle cx="80" cy="65" r="3" fill="hsl(225, 40%, 58%)" opacity="0.7" />
        <circle cx="140" cy="42" r="4" fill="hsl(225, 60%, 52%)" opacity="0.7" />
        <circle cx="200" cy="22" r="5" fill="hsl(225, 80%, 48%)" opacity="0.7" />
        <circle cx="260" cy="20" r="4.5" fill="hsl(225, 75%, 49%)" opacity="0.7" />
        <circle cx="320" cy="40" r="3.5" fill="hsl(225, 55%, 54%)" opacity="0.7" />
        {/* State transition marker */}
        <line x1="100" y1="5" x2="100" y2="80" stroke="#e8a845" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.6" />
        <line x1="300" y1="5" x2="300" y2="80" stroke="#e84545" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.6" />
        {/* Labels */}
        <text x="100" y="98" fill="#e8a845" fontSize="8" textAnchor="middle">introduced</text>
        <text x="300" y="98" fill="#e84545" fontSize="8" textAnchor="middle">resolved</text>
        <text x="40" y="98" fill="var(--text-dim)" fontSize="9">0%</text>
        <text x="360" y="98" fill="var(--text-dim)" fontSize="9" textAnchor="end">100%</text>
      </svg>
      <div className="help-figure-caption">Absential narrative pressure: curve = smoothed intensity, dots = individual events (size = relevance, color = significance), dashed lines = state transitions</div>
    </div>
  );
}

function RelationshipGraphDiagram() {
  return (
    <div className="help-figure">
      <svg width="300" height="180" viewBox="0 0 300 180">
        {/* Edges */}
        <line x1="150" y1="40" x2="80" y2="110" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
        <line x1="150" y1="40" x2="220" y2="90" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
        <line x1="150" y1="40" x2="150" y2="140" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
        <line x1="80" y1="110" x2="150" y2="140" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
        {/* Character nodes (blue) */}
        <circle cx="150" cy="40" r="14" fill="#7b8cde" opacity="0.8" />
        <text x="150" y="44" textAnchor="middle" fill="white" fontSize="8" fontWeight="600">Gabriel</text>
        <circle cx="80" cy="110" r="10" fill="#7b8cde" opacity="0.7" />
        <text x="80" y="114" textAnchor="middle" fill="white" fontSize="7">Gretta</text>
        <circle cx="220" cy="90" r="8" fill="#7b8cde" opacity="0.7" />
        <text x="220" y="94" textAnchor="middle" fill="white" fontSize="7">Miss Ivors</text>
        {/* Setting node (green) */}
        <circle cx="150" cy="140" r="9" fill="#45e87b" opacity="0.7" />
        <text x="150" y="144" textAnchor="middle" fill="white" fontSize="7">Morkan's</text>
        {/* Legend */}
        <circle cx="20" cy="165" r="5" fill="#7b8cde" />
        <text x="30" y="168" fill="var(--text-dim)" fontSize="9">Character</text>
        <circle cx="100" cy="165" r="5" fill="#45e87b" />
        <text x="110" y="168" fill="var(--text-dim)" fontSize="9">Setting</text>
        <circle cx="170" cy="165" r="5" fill="#e8a845" />
        <text x="180" y="168" fill="var(--text-dim)" fontSize="9">Item</text>
      </svg>
      <div className="help-figure-caption">Relationship graph: node size = significance, edges = explicit relationships + co-participation</div>
    </div>
  );
}

function CausalChainDiagram() {
  return (
    <div className="help-figure">
      <svg width="400" height="160" viewBox="0 0 400 160">
        {/* Diegetic chain */}
        <text x="10" y="15" fill="var(--text-dim)" fontSize="9" fontWeight="600">DIEGETIC (narrative sequence)</text>
        {[
          { x: 30, label: 'Uncle promises', pct: '30%' },
          { x: 140, label: 'Uncle arrives late', pct: '75%' },
          { x: 270, label: 'Bazaar closing', pct: '90%' },
        ].map((node, i) => (
          <g key={i}>
            <rect x={node.x} y="22" width="100" height="30" rx="3" fill="var(--bg)" stroke="var(--border)" />
            <text x={node.x + 50} y="35" textAnchor="middle" fill="var(--text)" fontSize="8">{node.label}</text>
            <text x={node.x + 50} y="47" textAnchor="middle" fill="var(--text-dim)" fontSize="7">{node.pct}</text>
            {i < 2 && <path d={`M${node.x + 100},37 L${node.x + 130},37`} fill="none" stroke="var(--text-dim)" strokeWidth="1" markerEnd="url(#arrow)" />}
          </g>
        ))}

        {/* Interpretive chains */}
        <text x="10" y="80" fill="var(--accent)" fontSize="9" fontWeight="600">INTERPRETIVE (per-reading)</text>
        <rect x="30" y="90" width="160" height="26" rx="3" fill="var(--accent-dim, rgba(123,140,222,0.15))" stroke="var(--accent)" strokeDasharray="3,2" />
        <text x="35" y="100" fill="var(--accent)" fontSize="7" fontWeight="600">FORMALIST</text>
        <text x="35" y="112" fill="var(--text)" fontSize="8">uncle's lateness causes failure</text>

        <rect x="210" y="90" width="170" height="26" rx="3" fill="rgba(232, 100, 69, 0.1)" stroke="#e86445" strokeDasharray="3,2" />
        <text x="215" y="100" fill="#e86445" fontSize="7" fontWeight="600">PSYCHOANALYTIC</text>
        <text x="215" y="112" fill="var(--text)" fontSize="8">unconscious self-sabotage</text>

        <text x="200" y="140" textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontStyle="italic">Same event, different causal explanation</text>

        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <path d="M0,0 L6,2 L0,4" fill="var(--text-dim)" />
          </marker>
        </defs>
      </svg>
      <div className="help-figure-caption">Causal chains: diegetic (objective sequence) vs interpretive (lens-specific causation)</div>
    </div>
  );
}

function StateHistoryDiagram() {
  return (
    <div className="help-figure">
      <svg width="400" height="150" viewBox="0 0 400 150">
        {/* Timeline line */}
        <line x1="50" y1="0" x2="50" y2="140" stroke="var(--border)" strokeWidth="1" />

        {[
          { y: 10, pct: '0%', src: 'text', srcColor: 'var(--text-dim)', bg: 'var(--bg-hover)', label: 'Initial: at home, anxious' },
          { y: 40, pct: '35%', src: 'text', srcColor: 'var(--text-dim)', bg: 'var(--bg-hover)', label: 'Conversation: hope rises' },
          { y: 70, pct: '35%', src: 'formalist', srcColor: 'var(--accent)', bg: 'var(--accent-dim, rgba(123,140,222,0.1))', label: 'Structural pivot: promise creates obligation' },
          { y: 100, pct: '85%', src: 'text', srcColor: 'var(--text-dim)', bg: 'var(--bg-hover)', label: 'Arrives at closing bazaar' },
          { y: 130, pct: '85%', src: 'psychoanalytic', srcColor: '#e86445', bg: 'rgba(232, 100, 69, 0.08)', label: 'Unconscious desire for failure realized' },
        ].map((entry, i) => (
          <g key={i}>
            <text x="45" y={entry.y + 10} textAnchor="end" fill="var(--text-dim)" fontSize="8" fontFamily="var(--mono)">{entry.pct}</text>
            <circle cx="50" cy={entry.y + 8} r="3" fill={entry.srcColor} />
            <rect x="60" y={entry.y} width="320" height="20" rx="3" fill={entry.bg} />
            <text x="65" y={entry.y + 9} fill={entry.srcColor} fontSize="7" fontWeight="600">{entry.src}</text>
            <text x="130" y={entry.y + 13} fill="var(--text)" fontSize="9">{entry.label}</text>
          </g>
        ))}
      </svg>
      <div className="help-figure-caption">Entity state history: diegetic transitions (from text) and interpretive effects (from readings) in a unified timeline</div>
    </div>
  );
}

function DivergenceDiagram() {
  return (
    <div className="help-figure">
      <svg width="400" height="80" viewBox="0 0 400 80">
        {/* Two columns */}
        <rect x="5" y="0" width="190" height="75" rx="4" fill="var(--bg)" stroke="var(--border)" />
        <rect x="205" y="0" width="190" height="75" rx="4" fill="var(--bg)" stroke="var(--border)" />
        <text x="100" y="14" textAnchor="middle" fill="var(--accent)" fontSize="9" fontWeight="600">Reading A</text>
        <text x="300" y="14" textAnchor="middle" fill="var(--accent)" fontSize="9" fontWeight="600">Reading B</text>

        {/* Low divergence line */}
        <rect x="10" y="22" width="180" height="14" rx="2" fill="hsl(225, 30%, 62%)" opacity="0.12" />
        <rect x="210" y="22" width="180" height="14" rx="2" fill="hsl(225, 35%, 60%)" opacity="0.15" />
        <text x="15" y="32" fill="var(--text-dim)" fontSize="8">an ordinary moment</text>
        <text x="215" y="32" fill="var(--text-dim)" fontSize="8">an ordinary moment</text>

        {/* High divergence line */}
        <rect x="10" y="42" width="180" height="14" rx="2" fill="hsl(225, 80%, 48%)" opacity="0.35" />
        <rect x="210" y="42" width="180" height="14" rx="2" fill="hsl(225, 25%, 63%)" opacity="0.1" />
        <rect x="7" y="42" width="3" height="14" rx="1" fill="hsl(25, 85%, 50%)" />
        <rect x="207" y="42" width="3" height="14" rx="1" fill="hsl(25, 85%, 50%)" />
        <text x="15" y="52" fill="var(--text-bright)" fontSize="8" fontWeight="600">"O love! O love!" (0.85)</text>
        <text x="215" y="52" fill="var(--text-dim)" fontSize="8">"O love! O love!" (0.30)</text>

        {/* Legend */}
        <rect x="10" y="65" width="12" height="4" rx="1" fill="hsl(45, 80%, 55%)" />
        <text x="26" y="70" fill="var(--text-dim)" fontSize="8">moderate divergence</text>
        <rect x="160" y="65" width="12" height="4" rx="1" fill="hsl(25, 85%, 50%)" />
        <text x="176" y="70" fill="var(--text-dim)" fontSize="8">high divergence</text>
      </svg>
      <div className="help-figure-caption">Compare mode: side-by-side text with synchronized scrolling. Colored left borders mark where readings disagree.</div>
    </div>
  );
}

// ── Sections ──

function OverviewSection() {
  return <>
    <h2>What Is Narrative Telemetry?</h2>
    <p>Narrative Telemetry is a framework for computational narrative analysis. It models stories as <strong>traces</strong> — borrowing OpenTelemetry's span/event architecture to represent the unfolding of a narrative as nested spans (story, acts, scenes, beats) with events dispatched within them.</p>
    <p>The core insight: <strong>significance is relational, not intrinsic.</strong> An event's importance depends on the interpretive lens applied to it. The same event can be a 0.85 in a formalist reading and a 0.30 in a psychoanalytic one. The text exists in superposition; each reading collapses it.</p>

    <h3>What You're Looking At</h3>
    <p>This UI lets you explore 11 analyzed stories (5 Joyce Dubliners + 5 Mansfield + 1 hand-coded Araby), each with two interpretive readings (formalist, psychoanalytic, feminist, marxist, or phenomenological):</p>
    <ul>
      <li><strong>Left panel</strong>: Span waterfall (story structure) + absential list (desires/fears/goals)</li>
      <li><strong>Center panel</strong>: The text itself, with entity annotations and significance-colored event highlighting</li>
      <li><strong>Right panel</strong>: Detail inspector, relationship graph, tension chart, causal chains, state history</li>
    </ul>

    <h3>Key Concepts</h3>
    <ul>
      <li><strong>TextModel</strong>: The neutral, objective extraction — what's in the text (diegetic facts)</li>
      <li><strong>Reading</strong>: An interpretive overlay — what it means under a specific lens (significance, themes, causal claims)</li>
      <li><strong>Absential</strong>: Something desired, feared, or needed that shapes narrative tension by its absence</li>
      <li><strong>Significance</strong>: A 0-1 score that is always (event, reading) — never intrinsic to the event</li>
      <li><strong>State History</strong>: How entities change through the story, distinguishing textual facts from interpretive claims</li>
    </ul>

    <SignificanceColorBar />
  </>;
}

function ModelSection() {
  return <>
    <h2>The Data Model</h2>
    <p>Every analyzed story is a <code>StoryModel</code> with two layers:</p>

    <div className="help-diagram">{`StoryModel
├── text: TextModel                    ← neutral, exhaustive
│   ├── rootSpan                       ← story > acts > scenes > beats
│   ├── diegetic                       ← characters, settings, items
│   ├── events                         ← what happens, with text line anchors
│   ├── relationships                  ← interpersonal, group
│   ├── absentials                     ← desires, fears, goals (with state transitions)
│   └── annotations                    ← entity mentions in the text
└── readings: Record<name, Reading>
    ├── themes, symbols                ← interpretive constructs
    ├── interpretiveAbsentials         ← desires only visible under this lens
    ├── eventSignificance              ← per-event scores + 5D dimensions
    │   ├── significance (0-1)
    │   ├── dimensions (absential/relational/epistemic/atmospheric/pacing)
    │   ├── causes / effects           ← interpretive causal chains
    │   └── note
    └── globalTension                  ← tension curve (composite + 5D)`}</div>

    <h3>Diegetic vs Non-Diegetic</h3>
    <p><strong>Diegetic</strong> entities exist in the story world: characters, settings, items, relationships, absentials. They live in the TextModel. These are facts about the text.</p>
    <p><strong>Non-diegetic</strong> entities are about the story: themes, symbols, narrator framing, interpretive absentials. They live in Readings and vary by lens.</p>
    <p>Some things exist in both: absentials can be diegetic (the boy explicitly promises to go to Araby) or interpretive (a postcolonial reading posits "colonial desire for metropolitan culture" — never stated in the text).</p>

    <h3>Events</h3>
    <p>Events are anchored to specific lines in the source text. They have participants (entity IDs), a type, and a position in the story (0-100%). Types include:</p>
    <ul>
      <li><code>action</code>, <code>dialogue</code>, <code>revelation</code>, <code>decision</code>, <code>environmental</code></li>
      <li><code>interior_monologue</code>, <code>free_indirect</code>, <code>narrator_commentary</code>, <code>flashback</code>, <code>ekphrasis</code></li>
    </ul>
    <p>Events are chained via <code>precedingEvent</code>, forming the diegetic narrative sequence.</p>

    <h3>Multi-Causal State Model</h3>
    <p>State changes are rarely caused by a single event. Each transition can have multiple causal factors with roles:</p>
    <ul>
      <li><strong>primary</strong> — the main driver</li>
      <li><strong>contributing</strong> — helped but wasn't sufficient alone</li>
      <li><strong>necessary</strong> — required condition</li>
      <li><strong>opposing</strong> — pushed against but was overcome</li>
      <li><strong>complicating</strong> — made the outcome partial or mixed</li>
    </ul>
  </>;
}

function ReadingsSection() {
  return <>
    <h2>Readings & Superposition</h2>
    <p>A <strong>Reading</strong> is an interpretive overlay on the neutral TextModel. It assigns significance scores, identifies themes and symbols, traces tension, and constructs causal explanations — all through a specific critical lens.</p>

    <div className="help-note">
      The same text supports multiple readings simultaneously. A formalist reading of The Dead cares about Gabriel's epiphany as structural climax; a psychoanalytic reading sees it as the return of the repressed. Both are valid collapses of the same textual superposition.
    </div>

    <h3>Available Lenses</h3>
    <p>The current corpus uses five critical frameworks:</p>
    <ul>
      <li><strong>Formalist</strong> — structure, style, epiphany timing, narrative technique</li>
      <li><strong>Psychoanalytic</strong> — desire, repression, the unconscious, memory as symptom</li>
      <li><strong>Feminist</strong> — gender performance, patriarchal structures, female agency/paralysis</li>
      <li><strong>Marxist</strong> — class anxiety, economic alienation, labor, commodification</li>
      <li><strong>Phenomenological</strong> — sensory experience, embodiment, perception, temporality</li>
    </ul>

    <h3>Significance Scores</h3>
    <p>Every event gets a <code>significance</code> score from 0 to 1. In the text view, significance controls the background color intensity:</p>
    <SignificanceColorBar />

    <h3>Creating Your Own Reading</h3>
    <p>Click <strong>+ Reading</strong> in the top bar. Name your lens, describe its perspective, then annotate events with the significance slider and interpretive notes. Your reading appears in the reading selector immediately and can be exported as JSON.</p>
  </>;
}

function AbsentialsSection() {
  return <>
    <h2>Absentials</h2>
    <p>An <strong>absential</strong> is something that shapes the narrative through its absence: an unfulfilled desire, an unresolved fear, an unreached goal. The term comes from Terrence Deacon's theory of incomplete nature — what's <em>not</em> present drives what <em>is</em> present.</p>

    <h3>Examples</h3>
    <ul>
      <li><strong>"The boy's romantic longing"</strong> (Araby) — a desire for connection with Mangan's sister that is never fulfilled</li>
      <li><strong>"Gabriel's fear of inadequacy"</strong> (The Dead) — an anxiety that shapes every interaction at the party</li>
      <li><strong>"Laura's desire to stop the party"</strong> (The Garden Party) — a moral impulse that class pressure overrides</li>
    </ul>

    <h3>Diegetic vs Interpretive Absentials</h3>
    <p>Some absentials are textually explicit (the boy <em>promises</em> to go to Araby). Others are interpretive — a feminist reading might posit "Eveline's internalized patriarchal duty" as an absential the text never names but the lens claims is operative.</p>

    <h3>Reading the Narrative Pressure Chart</h3>
    <p>Click an absential in the left panel to see its trajectory:</p>
    <NarrativePressureDiagram />
    <ul>
      <li>The <strong>curve</strong> is computed from events where the absential's <code>holder</code> (the character who holds the desire) interacts with its <code>relatedEntities</code> (target, obstacle, facilitator). Events are weighted by how many of this absential's specific entities co-occur.</li>
      <li><strong>Dots</strong> are individual events. Size = relevance to this specific absential. Color = reading significance.</li>
      <li><strong>Dashed vertical lines</strong> mark state transitions (introduction, intensification, resolution).</li>
    </ul>

    <h3>Overlaying Absentials</h3>
    <p><span className="help-key">Shift</span>+click additional absentials to overlay their curves as dashed colored lines. Watch how different desires build and break relative to each other.</p>
  </>;
}

function TensionSection() {
  return <>
    <h2>Tension & 5D Scoring</h2>
    <p>The <strong>tension chart</strong> in the right panel shows how narrative tension evolves across the story. Each reading produces its own tension curve.</p>

    <h3>Composite View</h3>
    <p>The default view shows a single tension line per reading. X-axis = story position (0-100%), Y-axis = tension (0.0-1.0). A dashed vertical line marks the currently selected event.</p>

    <h3>5D Sparkline View</h3>
    <p>Click the <strong>5D</strong> button to decompose tension into five independent sparklines:</p>
    <TensionSparklines />
    <ul>
      <li><strong style={{color: '#e8a845'}}>ABS (Absential)</strong> — unresolved desires, fears, goals</li>
      <li><strong style={{color: '#e86445'}}>REL (Relational)</strong> — interpersonal conflict and relationship stress</li>
      <li><strong style={{color: '#45a8e8'}}>EPI (Epistemic)</strong> — information asymmetry, dramatic irony, revelations</li>
      <li><strong style={{color: '#9b59b6'}}>ATM (Atmospheric)</strong> — environmental pressure, mood shifts</li>
      <li><strong style={{color: '#45e87b'}}>PAC (Pacing)</strong> — event density, narrative acceleration/deceleration</li>
    </ul>
    <div className="help-note">These dimensions are independent. A scene can have high absential tension (many unresolved quests) but low relational tension (no interpersonal conflict). The sparkline view makes these differences visible.</div>
  </>;
}

function CausalitySection() {
  return <>
    <h2>Causal Chains</h2>
    <p>Events in a narrative are connected by two kinds of causality:</p>
    <CausalChainDiagram />

    <h3>Diegetic Chains (Narrative Sequence)</h3>
    <p>Every event has a <code>precedingEvent</code> — the event that narratively comes before it. This forms an objective chain that is the same regardless of interpretive lens. Click an event to see its chain in the <strong>Causal Chain Explorer</strong> panel.</p>

    <h3>Interpretive Chains (Per-Reading)</h3>
    <p>Readings annotate events with <code>causes</code> and <code>effects</code> — causal relationships that are lens-specific. A formalist might say the uncle's lateness causes the failed quest; a psychoanalytic reading might trace unconscious self-sabotage.</p>
    <p>In the event detail panel, <strong>"Caused by"</strong> and <strong>"Causes"</strong> appear as clickable links. Follow the chain to see how different readings construct different causal explanations for the same outcome.</p>
  </>;
}

function StateSection() {
  return <>
    <h2>Entity State History</h2>
    <p>Characters, absentials, and other entities change through the story. The <strong>State History</strong> panel (visible when you select an entity or absential) shows a unified timeline of these changes.</p>

    <StateHistoryDiagram />

    <h3>Two Sources of State Changes</h3>
    <ul>
      <li><strong>Textual (diegetic)</strong>: tagged "text" — what the text objectively shows. "Gabriel moves to the window" is a location change. "Eveline grips the railing" is an action.</li>
      <li><strong>Interpretive (per-reading)</strong>: tagged with the reading name — what a lens claims an event does to an entity. "The boy's romantic idealism shatters" is a formalist claim; "orientalist fantasy collapses" is a postcolonial one.</li>
    </ul>

    <h3>Multi-Causal Factors</h3>
    <p>When a state transition has multiple causes, they're shown as a nested list below the entry. Each factor shows its <strong>role</strong> — was it the primary driver, a contributing factor, or an opposing force that was overcome? Click any factor to navigate to its causative event.</p>

    <div className="help-note">Characters in the regenerated stories have 6-9 state transitions each, tracking location changes, emotional shifts, and knowledge gains. Absentials have 2-5 transitions tracking urgency and intensity across their lifecycle.</div>
  </>;
}

function CompareSection() {
  return <>
    <h2>Comparing Readings</h2>
    <p>All 10 regenerated stories have two readings. Click <strong>Compare</strong> to enter split-screen mode.</p>
    <DivergenceDiagram />

    <h3>Split Text View</h3>
    <p>The center panel divides into two synchronized columns showing the same text with each reading's significance coloring. Scrolling is locked together so the same lines stay aligned. Events where readings disagree are marked with colored left borders:</p>
    <ul>
      <li><strong style={{color: '#e8a845'}}>Amber border</strong>: moderate divergence (significance difference &gt; 0.15)</li>
      <li><strong style={{color: 'hsl(25, 85%, 50%)'}}>Dark amber border</strong>: high divergence (difference &gt; 0.3)</li>
    </ul>

    <h3>Detail Panel in Compare Mode</h3>
    <p>When you select an event in compare mode, the detail panel shows significance bars for both readings side by side, with each reading's interpretive note and causal claims. This is where the superposition concept becomes tangible — the same event, explained differently.</p>
  </>;
}

function GraphSection() {
  return <>
    <h2>Relationship Graph</h2>
    <p>The force-directed graph in the right panel (visible when no event is selected) shows the web of narrative relationships.</p>
    <RelationshipGraphDiagram />

    <h3>Nodes</h3>
    <ul>
      <li><strong style={{color: '#7b8cde'}}>Blue</strong>: Characters — sized by significance in the current reading</li>
      <li><strong style={{color: '#45e87b'}}>Green</strong>: Settings</li>
      <li><strong style={{color: '#e8a845'}}>Amber</strong>: Items</li>
    </ul>

    <h3>Edges</h3>
    <ul>
      <li><strong>Explicit</strong>: interpersonal relationships from the TextModel (e.g., "Gabriel + Gretta: married couple")</li>
      <li><strong>Implicit</strong>: characters who appear in 3+ events together get a connection</li>
    </ul>
    <p>Hover over a node to highlight its connections and see relationship labels. Click to select the entity and see its full detail (events, relationships, state history).</p>
  </>;
}

function UISection() {
  return <>
    <h2>UI Guide</h2>

    <h3>Top Bar</h3>
    <ul>
      <li><strong>Story selector</strong>: dropdown grouped by collection (Hand-Coded / Dubliners / Mansfield)</li>
      <li><strong>Reading tabs</strong>: switch between available readings for this story</li>
      <li><strong>Compare</strong>: toggle synchronized split-screen mode (available on all stories with 2+ readings)</li>
      <li><strong>+ Reading</strong>: create a custom reading with your own significance annotations</li>
      <li><strong>+ Analyze</strong>: paste new text for live LLM analysis (requires <code>npm run server</code>)</li>
      <li><strong>? Help</strong>: this page</li>
    </ul>

    <h3>Left Panel</h3>
    <ul>
      <li><strong>Span Waterfall</strong>: hierarchical story structure (story &gt; acts &gt; scenes). Click to see span details. Colored dots show event significance within each span.</li>
      <li><strong>Absentials</strong>: list of desires/fears/goals with significance scores. Click to see narrative pressure timeline. <span className="help-key">Shift</span>+click to overlay multiple absentials.</li>
    </ul>

    <h3>Center Panel</h3>
    <ul>
      <li><strong>Background shading</strong>: blue intensity reflects event significance at each line</li>
      <li><strong>Underlined text</strong>: entity annotations. Click to see entity details. Dotted underline = diegetic annotation. Badge with number = overlapping annotations (click to choose which entity)</li>
      <li><strong>Click any shaded line</strong>: select the event at that location to see its details, causal chain, and state effects in the right panel</li>
    </ul>

    <h3>Right Panel (varies by selection)</h3>
    <ul>
      <li><strong>Nothing selected</strong>: story metadata, entity counts, relationship graph, tension chart</li>
      <li><strong>Event selected</strong>: event details, participants, significance per reading with notes, causal chain explorer (diegetic + interpretive), state effects, tension chart with position marker</li>
      <li><strong>Entity selected</strong>: entity details, participating events, relationships, state history (textual + interpretive), significance</li>
      <li><strong>Absential selected</strong>: narrative pressure chart with overlay support, state transitions, key moments, state history</li>
    </ul>
  </>;
}
