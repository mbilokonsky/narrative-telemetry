import { useState } from 'react'
import type { TensionPoint, Selection, StoryEvent } from '../types'

interface TensionChartProps {
  tensions: { key: string; points: TensionPoint[]; color: string }[];
  selection: Selection;
  events: Record<string, StoryEvent>;
}

const W = 320;
const H_COMPOSITE = 120;
const H_SPARKLINE = 28;
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

  const hasDimensions = tensions.some(t =>
    t.points.some(p => p.dimensions !== undefined)
  );

  let markerPct: number | null = null;
  if (selection?.type === 'event') {
    const evt = events[selection.id];
    if (evt) markerPct = evt.timestamp.percentage;
  }

  function toX(pct: number, plotW: number) {
    return PAD.left + (pct / 100) * plotW;
  }
  function toY(val: number, plotH: number, offsetY: number) {
    return offsetY + (1 - val) * plotH;
  }

  const plotW = W - PAD.left - PAD.right;

  // ── Sparkline mode (5D) ──
  if (showDimensions && hasDimensions && tensions.length > 0) {
    const dims = Object.keys(DIMENSION_COLORS);
    const points = [...tensions[0].points]
      .filter(p => p.dimensions)
      .sort((a, b) => a.timestamp.percentage - b.timestamp.percentage);

    const totalH = dims.length * H_SPARKLINE + PAD.bottom + 4;

    return (
      <div className="tension-chart">
        <div className="tension-header-row">
          <div className="tension-header">Tension — 5D</div>
          <button className="tension-dim-toggle active" onClick={() => setShowDimensions(false)}>
            Composite
          </button>
        </div>

        <svg width={W} height={totalH} viewBox={`0 0 ${W} ${totalH}`} className="tension-chart-svg">
          {dims.map((dim, di) => {
            const y0 = di * H_SPARKLINE + 2;
            const sparkH = H_SPARKLINE - 4;
            const color = DIMENSION_COLORS[dim];

            const d = points
              .map((pt, i) => {
                const val = pt.dimensions?.[dim as keyof typeof pt.dimensions] ?? 0;
                return `${i === 0 ? 'M' : 'L'}${toX(pt.timestamp.percentage, plotW)},${toY(val, sparkH, y0)}`;
              })
              .join(' ');

            const area = d
              ? `${d} L${toX(points[points.length - 1].timestamp.percentage, plotW)},${y0 + sparkH} L${toX(points[0].timestamp.percentage, plotW)},${y0 + sparkH} Z`
              : '';

            return (
              <g key={dim}>
                {/* Label */}
                <text x={PAD.left - 4} y={y0 + sparkH / 2 + 3} textAnchor="end" fill={color} fontSize={8} fontWeight={600}>
                  {DIMENSION_LABELS[dim].slice(0, 4)}
                </text>
                {/* Background */}
                <rect x={PAD.left} y={y0} width={plotW} height={sparkH} fill="var(--bg)" rx={1} opacity={0.5} />
                {/* Area */}
                {area && <path d={area} fill={color} opacity={0.1} />}
                {/* Line */}
                {d && <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" opacity={0.8} />}
                {/* Marker */}
                {markerPct !== null && (
                  <line x1={toX(markerPct, plotW)} x2={toX(markerPct, plotW)} y1={y0} y2={y0 + sparkH}
                    stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="2,2" opacity={0.5} />
                )}
              </g>
            );
          })}
          {/* X axis */}
          {[0, 50, 100].map(p => (
            <text key={p} x={toX(p, plotW)} y={totalH - 4} textAnchor="middle" fill="var(--text-dim)" fontSize={9}>{p}%</text>
          ))}
        </svg>
        <TensionChartStyle />
      </div>
    );
  }

  // ── Composite mode ──
  const plotH = H_COMPOSITE - PAD.top - PAD.bottom;

  return (
    <div className="tension-chart">
      <div className="tension-header-row">
        <div className="tension-header">Tension</div>
        {hasDimensions && (
          <button className="tension-dim-toggle" onClick={() => setShowDimensions(true)}>5D</button>
        )}
      </div>
      <svg width={W} height={H_COMPOSITE} viewBox={`0 0 ${W} ${H_COMPOSITE}`} className="tension-chart-svg">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <line key={v} x1={PAD.left} x2={W - PAD.right} y1={toY(v, plotH, PAD.top)} y2={toY(v, plotH, PAD.top)}
            stroke="var(--border)" strokeWidth={0.5} />
        ))}
        {[0, 0.5, 1].map(v => (
          <text key={v} x={PAD.left - 6} y={toY(v, plotH, PAD.top) + 3} textAnchor="end" fill="var(--text-dim)" fontSize={9}>
            {v.toFixed(1)}
          </text>
        ))}
        {[0, 25, 50, 75, 100].map(p => (
          <text key={p} x={toX(p, plotW)} y={H_COMPOSITE - 4} textAnchor="middle" fill="var(--text-dim)" fontSize={9}>{p}%</text>
        ))}

        {/* Lines */}
        {tensions.map(({ key, points, color }) => {
          if (points.length === 0) return null;
          const sorted = [...points].sort((a, b) => a.timestamp.percentage - b.timestamp.percentage);
          const d = sorted.map((pt, i) => `${i === 0 ? 'M' : 'L'}${toX(pt.timestamp.percentage, plotW)},${toY(pt.value, plotH, PAD.top)}`).join(' ');
          return <path key={key} d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />;
        })}

        {/* Marker */}
        {markerPct !== null && (
          <line x1={toX(markerPct, plotW)} x2={toX(markerPct, plotW)} y1={PAD.top} y2={H_COMPOSITE - PAD.bottom}
            stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 2" opacity={0.8} />
        )}
      </svg>

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
      <TensionChartStyle />
    </div>
  );
}

function TensionChartStyle() {
  return (
    <style>{`
      .tension-chart { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); }
      .tension-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      .tension-header { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); font-weight: 600; }
      .tension-dim-toggle { padding: 2px 8px; border: 1px solid var(--border); border-radius: 3px; background: transparent; color: var(--text-dim); font-size: 10px; font-weight: 600; cursor: pointer; }
      .tension-dim-toggle:hover { color: var(--text); border-color: var(--text-dim); }
      .tension-dim-toggle.active { background: var(--accent-dim); color: var(--accent); border-color: var(--accent); }
      .tension-chart-svg { display: block; width: 100%; height: auto; }
      .tension-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
      .legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-dim); text-transform: capitalize; }
      .legend-swatch { width: 12px; height: 3px; border-radius: 1px; }
    `}</style>
  );
}
