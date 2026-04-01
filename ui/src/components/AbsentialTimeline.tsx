import { useMemo } from 'react'
import type { Absential, StoryEvent, Reading } from '../types'
import { significanceColor } from '../utils'

interface AbsentialTimelineProps {
  absential: Absential;
  events: Record<string, StoryEvent>;
  reading: Reading;
  onSelectEvent: (id: string) => void;
}

interface TimelinePoint {
  percentage: number;
  type: 'state-change' | 'event';
  label: string;
  intensity: number;
  status?: string;
  eventId?: string;
  significance?: number;
}

function buildTimeline(
  absential: Absential,
  events: Record<string, StoryEvent>,
  reading: Reading,
): TimelinePoint[] {
  const points: TimelinePoint[] = []

  for (const state of absential.stateHistory) {
    const status = state.data?.status as string | undefined
    const intensity = (state.data?.intensity as number) ?? 0
    points.push({
      percentage: state.timestamp.percentage,
      type: 'state-change',
      label: `${status ?? 'unknown'} (intensity: ${intensity})`,
      intensity,
      status,
    })
  }

  for (const [eventId, evt] of Object.entries(events)) {
    const sig = reading.eventSignificance[eventId]
    if (sig && sig.significance > 0) {
      points.push({
        percentage: evt.timestamp.percentage,
        type: 'event',
        label: evt.description,
        intensity: sig.significance,
        eventId,
        significance: sig.significance,
      })
    }
  }

  return points.sort((a, b) => a.percentage - b.percentage)
}

const STATUS_COLORS: Record<string, string> = {
  unsatisfied: '#e8a845',
  active: '#45a8e8',
  satisfied: '#45e87b',
  resolved: '#45e87b',
  resolved_blocked: '#e84545',
  blocked: '#e84545',
  failed: '#e84545',
}

export function AbsentialTimeline({
  absential,
  events,
  reading,
  onSelectEvent,
}: AbsentialTimelineProps) {
  const timeline = useMemo(
    () => buildTimeline(absential, events, reading),
    [absential, events, reading]
  )

  const absentialSig = reading.absentialSignificance[absential.id]
  const statePoints = timeline.filter(p => p.type === 'state-change')
  const eventPoints = timeline.filter(p => p.type === 'event')

  // SVG dimensions
  const width = 300
  const height = 120
  const padding = { top: 10, right: 10, bottom: 20, left: 10 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  return (
    <div className="absential-timeline">
      <div className="abs-tl-header">
        <h3>{absential.name}</h3>
        <p className="abs-tl-desc">{absential.description}</p>
      </div>

      {absentialSig && (
        <div className="abs-tl-section">
          <div className="abs-tl-label">Reading Significance</div>
          <div className="abs-tl-sig-row">
            <div className="abs-tl-sig-bar-wrap">
              <div
                className="abs-tl-sig-bar"
                style={{
                  width: `${absentialSig.significance * 100}%`,
                  background: significanceColor(absentialSig.significance),
                }}
              />
              <span className="abs-tl-sig-value">{absentialSig.significance.toFixed(2)}</span>
            </div>
            {absentialSig.note && <div className="abs-tl-sig-note">{absentialSig.note}</div>}
          </div>
        </div>
      )}

      <div className="abs-tl-section">
        <div className="abs-tl-label">State History</div>
        {statePoints.map((p, i) => (
          <div key={i} className="abs-tl-state-item">
            <span
              className="abs-tl-state-dot"
              style={{ background: STATUS_COLORS[p.status ?? ''] ?? '#888' }}
            />
            <span className="abs-tl-state-pct">{p.percentage}%</span>
            <span className="abs-tl-state-label">{p.label}</span>
          </div>
        ))}
      </div>

      <div className="abs-tl-section">
        <div className="abs-tl-label">Event Intensity Timeline</div>
        <svg width={width} height={height} className="abs-tl-chart">
          {/* Background */}
          <rect
            x={padding.left} y={padding.top}
            width={plotW} height={plotH}
            fill="var(--bg, #1a1a2e)" rx={2}
          />

          {/* State change markers */}
          {statePoints.map((p, i) => {
            const x = padding.left + (p.percentage / 100) * plotW
            return (
              <g key={`s-${i}`}>
                <line
                  x1={x} y1={padding.top} x2={x} y2={padding.top + plotH}
                  stroke={STATUS_COLORS[p.status ?? ''] ?? '#888'}
                  strokeWidth={2}
                  strokeDasharray="4,3"
                  opacity={0.7}
                />
                <circle
                  cx={x} cy={padding.top + 6}
                  r={4}
                  fill={STATUS_COLORS[p.status ?? ''] ?? '#888'}
                />
              </g>
            )
          })}

          {/* Event bars */}
          {eventPoints.map((p, i) => {
            const x = padding.left + (p.percentage / 100) * plotW
            const barH = (p.significance ?? 0) * plotH
            return (
              <rect
                key={`e-${i}`}
                x={x - 1.5} y={padding.top + plotH - barH}
                width={3} height={barH}
                fill={significanceColor(p.significance ?? 0, 0.8)}
                rx={1}
                className="abs-tl-event-bar"
                onClick={() => p.eventId && onSelectEvent(p.eventId)}
              />
            )
          })}

          {/* X-axis labels */}
          <text x={padding.left} y={height - 4} fill="var(--text-dim)" fontSize={9}>0%</text>
          <text x={padding.left + plotW / 2} y={height - 4} fill="var(--text-dim)" fontSize={9} textAnchor="middle">50%</text>
          <text x={padding.left + plotW} y={height - 4} fill="var(--text-dim)" fontSize={9} textAnchor="end">100%</text>
        </svg>
      </div>

      <div className="abs-tl-section">
        <div className="abs-tl-label">Significant Events ({eventPoints.length})</div>
        <div className="abs-tl-event-list">
          {eventPoints.slice(0, 15).map((p, i) => (
            <div
              key={i}
              className="abs-tl-event-item"
              onClick={() => p.eventId && onSelectEvent(p.eventId)}
            >
              <span className="abs-tl-event-pct">{p.percentage}%</span>
              <span
                className="abs-tl-event-dot"
                style={{ background: significanceColor(p.significance ?? 0) }}
              />
              <span className="abs-tl-event-label">{p.label}</span>
            </div>
          ))}
          {eventPoints.length > 15 && (
            <div className="abs-tl-more">+{eventPoints.length - 15} more events</div>
          )}
        </div>
      </div>

      <style>{`
        .absential-timeline {
          font-size: 13px;
        }
        .absential-timeline h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-bright);
          margin: 0 0 6px;
        }
        .abs-tl-desc {
          color: var(--text);
          line-height: 1.5;
          margin-top: 4px;
        }
        .abs-tl-section {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }
        .abs-tl-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dim);
          font-weight: 600;
          margin-bottom: 6px;
        }
        .abs-tl-sig-row {}
        .abs-tl-sig-bar-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 16px;
        }
        .abs-tl-sig-bar {
          height: 8px;
          border-radius: 2px;
          min-width: 4px;
        }
        .abs-tl-sig-value {
          font-size: 12px;
          font-family: var(--mono);
          color: var(--text);
        }
        .abs-tl-sig-note {
          font-size: 12px;
          color: var(--text-dim);
          margin-top: 4px;
          font-style: italic;
          line-height: 1.4;
        }
        .abs-tl-state-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 0;
          font-size: 12px;
        }
        .abs-tl-state-dot {
          width: 8px;
          height: 8px;
          min-width: 8px;
          border-radius: 50%;
        }
        .abs-tl-state-pct {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
          min-width: 28px;
        }
        .abs-tl-state-label {
          color: var(--text);
        }
        .abs-tl-chart {
          display: block;
          width: 100%;
          max-width: 300px;
        }
        .abs-tl-event-bar {
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .abs-tl-event-bar:hover {
          opacity: 0.7;
        }
        .abs-tl-event-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 300px;
          overflow-y: auto;
        }
        .abs-tl-event-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 3px 0;
          cursor: pointer;
          font-size: 12px;
        }
        .abs-tl-event-item:hover {
          color: var(--text-bright);
        }
        .abs-tl-event-pct {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          min-width: 28px;
          flex-shrink: 0;
        }
        .abs-tl-event-dot {
          width: 6px;
          height: 6px;
          min-width: 6px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }
        .abs-tl-event-label {
          color: var(--text);
          line-height: 1.4;
        }
        .abs-tl-more {
          font-size: 11px;
          color: var(--text-dim);
          padding: 4px 0;
        }
      `}</style>
    </div>
  )
}
