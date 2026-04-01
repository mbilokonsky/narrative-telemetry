import { useState } from 'react'
import type { TensionPoint, Selection, StoryEvent } from '../types'

interface TensionChartProps {
  tensions: { key: string; points: TensionPoint[]; color: string }[];
  selection: Selection;
  events: Record<string, StoryEvent>;
}

const W = 320;
const H = 120;
const PAD = { top: 20, right: 12, bottom: 24, left: 32 };

const DIMENSION_COLORS: Record<string, string> = {
  absential: '#e8a845',
  relational: '#e86445',
  epistemic: '#45a8e8',
  atmospheric: '#9b59b6',
  pacing: '#45e87b',
};

const DIMENSION_LABELS: Record<string, string> = {
  absential: 'Absential',
  relational: 'Relational',
  epistemic: 'Epistemic',
  atmospheric: 'Atmospheric',
  pacing: 'Pacing',
};

export function TensionChart({ tensions, selection, events }: TensionChartProps) {
  const [showDimensions, setShowDimensions] = useState(false);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  function toX(pct: number) {
    return PAD.left + (pct / 100) * plotW;
  }
  function toY(val: number) {
    return PAD.top + (1 - val) * plotH;
  }

  // Check if any tension data has dimensional values
  const hasDimensions = tensions.some(t =>
    t.points.some(p => p.dimensions !== undefined)
  );

  // Get marker position from selection
  let markerPct: number | null = null;
  if (selection?.type === 'event') {
    const evt = events[selection.id];
    if (evt) markerPct = evt.timestamp.percentage;
  }

  // Build dimensional paths for the first reading (when showing dimensions)
  const dimensionPaths: { dim: string; d: string; color: string }[] = [];
  if (showDimensions && hasDimensions && tensions.length > 0) {
    const points = [...tensions[0].points]
      .filter(p => p.dimensions)
      .sort((a, b) => a.timestamp.percentage - b.timestamp.percentage);

    for (const dim of Object.keys(DIMENSION_COLORS)) {
      const d = points
        .map((pt, i) => {
          const val = pt.dimensions?.[dim as keyof typeof pt.dimensions] ?? 0;
          return `${i === 0 ? 'M' : 'L'}${toX(pt.timestamp.percentage)},${toY(val)}`;
        })
        .join(' ');
      if (d) {
        dimensionPaths.push({ dim, d, color: DIMENSION_COLORS[dim] });
      }
    }
  }

  return (
    <div className="tension-chart">
      <div className="tension-header-row">
        <div className="tension-header">Tension</div>
        {hasDimensions && (
          <button
            className={`tension-dim-toggle ${showDimensions ? 'active' : ''}`}
            onClick={() => setShowDimensions(v => !v)}
          >
            5D
          </button>
        )}
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <line
            key={v}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={toY(v)}
            y2={toY(v)}
            stroke="var(--border)"
            strokeWidth={0.5}
          />
        ))}
        {/* Y axis labels */}
        {[0, 0.5, 1].map(v => (
          <text
            key={v}
            x={PAD.left - 6}
            y={toY(v) + 3}
            textAnchor="end"
            fill="var(--text-dim)"
            fontSize={9}
          >
            {v.toFixed(1)}
          </text>
        ))}
        {/* X axis labels */}
        {[0, 25, 50, 75, 100].map(p => (
          <text
            key={p}
            x={toX(p)}
            y={H - 4}
            textAnchor="middle"
            fill="var(--text-dim)"
            fontSize={9}
          >
            {p}%
          </text>
        ))}

        {/* Dimensional curves (behind composite) */}
        {showDimensions && dimensionPaths.map(({ dim, d, color }) => (
          <path
            key={`dim-${dim}`}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.6}
          />
        ))}

        {/* Composite tension lines */}
        {tensions.map(({ key, points, color }) => {
          if (points.length === 0) return null;
          const sorted = [...points].sort(
            (a, b) => a.timestamp.percentage - b.timestamp.percentage
          );
          const d = sorted
            .map(
              (pt, i) =>
                `${i === 0 ? 'M' : 'L'}${toX(pt.timestamp.percentage)},${toY(pt.value)}`
            )
            .join(' ');
          return (
            <path
              key={key}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={showDimensions ? 2.5 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={showDimensions ? 0.4 : 0.85}
            />
          );
        })}

        {/* Selection marker */}
        {markerPct !== null && (
          <line
            x1={toX(markerPct)}
            x2={toX(markerPct)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            opacity={0.8}
          />
        )}
      </svg>

      {/* Legend */}
      {(tensions.length > 1 || showDimensions) && (
        <div className="tension-legend">
          {showDimensions ? (
            Object.entries(DIMENSION_LABELS).map(([dim, label]) => (
              <div key={dim} className="legend-item">
                <div className="legend-swatch" style={{ background: DIMENSION_COLORS[dim] }} />
                <span>{label}</span>
              </div>
            ))
          ) : (
            tensions.map(({ key, color }) => (
              <div key={key} className="legend-item">
                <div className="legend-swatch" style={{ background: color }} />
                <span>{key}</span>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .tension-chart {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .tension-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .tension-header {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dim);
          font-weight: 600;
        }
        .tension-dim-toggle {
          padding: 2px 8px;
          border: 1px solid var(--border);
          border-radius: 3px;
          background: transparent;
          color: var(--text-dim);
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tension-dim-toggle:hover {
          color: var(--text);
          border-color: var(--text-dim);
        }
        .tension-dim-toggle.active {
          background: var(--accent-dim);
          color: var(--accent);
          border-color: var(--accent);
        }
        .tension-chart svg {
          display: block;
          width: 100%;
          height: auto;
        }
        .tension-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--text-dim);
        }
        .legend-swatch {
          width: 10px;
          height: 3px;
          border-radius: 1px;
        }
      `}</style>
    </div>
  );
}
