import { useState, useRef, useMemo } from 'react'
import type { StoryModel, Selection, Reading } from '../types'

interface RelationshipGraphProps {
  model: StoryModel;
  reading: Reading;
  selection: Selection;
  onSelectEntity: (id: string) => void;
}

interface GraphNode {
  id: string;
  name: string;
  type: 'character' | 'setting' | 'item';
  significance: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
  name: string;
  nature: string;
}

const NODE_COLORS = {
  character: '#7b8cde',
  setting: '#45e87b',
  item: '#e8a845',
};

function buildGraph(model: StoryModel, reading: Reading): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const nodeIds = new Set<string>();

  // Add characters
  for (const [id, char] of Object.entries(model.text.diegetic.characters)) {
    const sig = reading.entitySignificance[id]?.significance ?? 0.3;
    nodes.push({ id, name: char.name, type: 'character', significance: sig, x: 0, y: 0, vx: 0, vy: 0 });
    nodeIds.add(id);
  }

  // Add settings
  for (const [id, setting] of Object.entries(model.text.diegetic.settings)) {
    const sig = reading.entitySignificance[id]?.significance ?? 0.2;
    nodes.push({ id, name: setting.name, type: 'setting', significance: sig, x: 0, y: 0, vx: 0, vy: 0 });
    nodeIds.add(id);
  }

  // Build edges from relationships
  const edges: GraphEdge[] = [];
  const interpersonal = model.text.relationships.interpersonal as Record<string, any>;
  for (const rel of Object.values(interpersonal)) {
    if (rel.participants && rel.participants.length >= 2) {
      const [source, target] = rel.participants;
      if (nodeIds.has(source) && nodeIds.has(target)) {
        edges.push({ source, target, name: rel.name ?? '', nature: rel.nature ?? '' });
      }
    }
  }

  // Also connect characters who co-participate in events
  const eventCoparticipation = new Map<string, number>();
  for (const evt of Object.values(model.text.events)) {
    for (let i = 0; i < evt.participants.length; i++) {
      for (let j = i + 1; j < evt.participants.length; j++) {
        const key = [evt.participants[i], evt.participants[j]].sort().join('|');
        eventCoparticipation.set(key, (eventCoparticipation.get(key) ?? 0) + 1);
      }
    }
  }
  // Add implicit edges for frequent co-participation (>= 3 events)
  for (const [key, count] of eventCoparticipation) {
    if (count >= 3) {
      const [a, b] = key.split('|');
      if (nodeIds.has(a) && nodeIds.has(b) && !edges.some(e =>
        (e.source === a && e.target === b) || (e.source === b && e.target === a)
      )) {
        edges.push({ source: a, target: b, name: `${count} shared events`, nature: 'co-participation' });
      }
    }
  }

  // Initialize positions in a circle
  const cx = 200, cy = 150;
  const radius = Math.min(cx, cy) * 0.7;
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    node.x = cx + radius * Math.cos(angle);
    node.y = cy + radius * Math.sin(angle);
  });

  return { nodes, edges };
}

function simulate(nodes: GraphNode[], edges: GraphEdge[], iterations: number) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const W = 400, H = 300;

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = 2000 * alpha / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist - 80) * 0.02 * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    }

    // Center gravity
    for (const node of nodes) {
      node.vx += (W / 2 - node.x) * 0.005 * alpha;
      node.vy += (H / 2 - node.y) * 0.005 * alpha;
    }

    // Apply velocities with damping
    for (const node of nodes) {
      node.vx *= 0.8;
      node.vy *= 0.8;
      node.x += node.vx;
      node.y += node.vy;
      // Keep in bounds
      node.x = Math.max(30, Math.min(W - 30, node.x));
      node.y = Math.max(30, Math.min(H - 30, node.y));
    }
  }
}

export function RelationshipGraph({ model, reading, selection, onSelectEntity }: RelationshipGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const graphRef = useRef<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);

  const graph = useMemo(() => {
    const g = buildGraph(model, reading);
    simulate(g.nodes, g.edges, 100);
    graphRef.current = g;
    return g;
  }, [model, reading]);

  const selectedId = selection?.type === 'entity' ? selection.entityId : null;
  const W = 400, H = 300;

  return (
    <div className="rel-graph">
      <div className="rel-graph-header">Entity Relationships</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="rel-graph-svg">
        {/* Edges */}
        {graph.edges.map((edge, i) => {
          const s = graph.nodes.find(n => n.id === edge.source);
          const t = graph.nodes.find(n => n.id === edge.target);
          if (!s || !t) return null;
          const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target ||
                                selectedId === edge.source || selectedId === edge.target;
          return (
            <g key={`e-${i}`}>
              <line
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke={isHighlighted ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={isHighlighted ? 1.5 : 0.8}
                opacity={isHighlighted ? 0.8 : 0.4}
              />
              {isHighlighted && (
                <text
                  x={(s.x + t.x) / 2}
                  y={(s.y + t.y) / 2 - 4}
                  textAnchor="middle"
                  fill="var(--text-dim)"
                  fontSize={8}
                >
                  {edge.nature || edge.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {graph.nodes.map(node => {
          const radius = 6 + node.significance * 12;
          const isSelected = selectedId === node.id;
          const isHovered = hoveredNode === node.id;

          return (
            <g
              key={node.id}
              onClick={() => onSelectEntity(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={node.x} cy={node.y} r={radius}
                fill={NODE_COLORS[node.type]}
                opacity={isSelected || isHovered ? 1 : 0.7}
                stroke={isSelected ? 'var(--text-bright)' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
              />
              <text
                x={node.x}
                y={node.y + radius + 11}
                textAnchor="middle"
                fill={isSelected || isHovered ? 'var(--text-bright)' : 'var(--text-dim)'}
                fontSize={10}
                fontWeight={isSelected ? 600 : 400}
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="rel-graph-legend">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="rel-legend-item">
            <div className="rel-legend-dot" style={{ background: color }} />
            <span>{type}</span>
          </div>
        ))}
        <div className="rel-legend-item">
          <span className="rel-legend-count">{graph.nodes.length} entities, {graph.edges.length} relationships</span>
        </div>
      </div>

      <style>{`
        .rel-graph {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .rel-graph-header {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dim);
          font-weight: 600;
          margin-bottom: 8px;
        }
        .rel-graph-svg {
          display: block;
          width: 100%;
          height: auto;
          background: var(--bg);
          border-radius: 4px;
          border: 1px solid var(--border);
        }
        .rel-graph-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 6px;
          align-items: center;
        }
        .rel-legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--text-dim);
          text-transform: capitalize;
        }
        .rel-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .rel-legend-count {
          font-size: 10px;
          color: var(--text-dim);
          margin-left: auto;
        }
      `}</style>
    </div>
  );
}
