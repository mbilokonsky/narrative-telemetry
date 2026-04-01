import type { TensionPoint, Selection, StoryEvent } from '../types'

interface TensionChartProps {
  tensions: { key: string; points: TensionPoint[]; color: string }[];
  selection: Selection;
  events: Record<string, StoryEvent>;
}

const W = 320;
const H = 120;
const PAD = { top: 20, right: 12, bottom: 24, left: 32 };

export function TensionChart({ tensions, selection, events }: TensionChartProps) {
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  function toX(pct: number) {
    return PAD.left + (pct / 100) * plotW;
  }
  function toY(val: number) {
    return PAD.top + (1 - val) * plotH;
  }

  // Get marker position from selection
  let markerPct: number | null = null;
  if (selection?.type === 'event') {
    const evt = events[selection.id];
    if (evt) markerPct = evt.timestamp.percentage;
  }

  return (
    <div className="tension-chart">
      <div className="tension-header">Tension</div>
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

        {/* Tension lines */}
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
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.85}
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
      {tensions.length > 1 && (
        <div className="tension-legend">
          {tensions.map(({ key, color }) => (
            <div key={key} className="legend-item">
              <div className="legend-swatch" style={{ background: color }} />
              <span>{key}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .tension-chart {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .tension-header {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dim);
          font-weight: 600;
          margin-bottom: 8px;
        }
        .tension-chart svg {
          display: block;
          width: 100%;
          height: auto;
        }
        .tension-legend {
          display: flex;
          gap: 12px;
          margin-top: 6px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-dim);
          text-transform: capitalize;
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
