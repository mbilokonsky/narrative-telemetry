import { useMemo } from 'react'
import type { Absential, StoryEvent, Reading } from '../types'
import { significanceColor } from '../utils'

interface AbsentialTimelineProps {
  absential: Absential;
  absentialId: string;
  events: Record<string, StoryEvent>;
  reading: Reading;
  diegetic: { characters: Record<string, any> };
  onSelectEvent: (id: string) => void;
}

interface TrajectoryPoint {
  percentage: number;
  intensity: number;
  eventId: string;
  description: string;
  significance: number;
}

const STATUS_COLORS: Record<string, string> = {
  unsatisfied: '#e8a845',
  active: '#45a8e8',
  satisfied: '#45e87b',
  resolved: '#45e87b',
  resolved_satisfied: '#45e87b',
  resolved_blocked: '#e84545',
  resolved_mixed: '#b845e8',
  blocked: '#e84545',
  failed: '#e84545',
  canceled: '#888',
}

/**
 * Build a trajectory for an absential by finding events where its holder
 * or related entities participate, using their significance as intensity.
 */
function buildTrajectory(
  absential: Absential,
  events: Record<string, StoryEvent>,
  reading: Reading,
): TrajectoryPoint[] {
  // Get the holder and related entity IDs
  const holder = (absential as any).holder as string | undefined
  const relatedEntities: string[] = ((absential as any).relatedEntities ?? [])
    .map((r: any) => r.entityId ?? r)
    .filter(Boolean)

  // Build set of relevant entity IDs
  const relevantIds = new Set<string>()
  if (holder) relevantIds.add(holder)
  for (const re of relatedEntities) relevantIds.add(re)

  // Find events involving these entities
  const points: TrajectoryPoint[] = []
  for (const [eventId, evt] of Object.entries(events)) {
    const isRelevant = evt.participants.some(p => relevantIds.has(p))
    if (!isRelevant) continue

    const sig = reading.eventSignificance[eventId]?.significance ?? 0
    if (sig <= 0) continue

    points.push({
      percentage: evt.timestamp.percentage,
      intensity: sig,
      eventId,
      description: evt.description,
      significance: sig,
    })
  }

  return points.sort((a, b) => a.percentage - b.percentage)
}

/**
 * Compute a smoothed intensity curve from trajectory points.
 * Uses a simple rolling average with Gaussian-like weighting.
 */
function smoothCurve(
  points: TrajectoryPoint[],
  numSamples: number = 30,
  bandwidth: number = 8,
): { pct: number; value: number }[] {
  if (points.length === 0) return []

  const curve: { pct: number; value: number }[] = []
  for (let i = 0; i < numSamples; i++) {
    const pct = (i / (numSamples - 1)) * 100
    let weightSum = 0
    let valueSum = 0

    for (const p of points) {
      const dist = Math.abs(p.percentage - pct)
      const weight = Math.exp(-(dist * dist) / (2 * bandwidth * bandwidth))
      weightSum += weight
      valueSum += weight * p.intensity
    }

    curve.push({ pct, value: weightSum > 0 ? valueSum / weightSum : 0 })
  }

  return curve
}

export function AbsentialTimeline({
  absential,
  absentialId,
  events,
  reading,
  diegetic,
  onSelectEvent,
}: AbsentialTimelineProps) {
  const trajectory = useMemo(
    () => buildTrajectory(absential, events, reading),
    [absential, events, reading]
  )

  const curve = useMemo(
    () => smoothCurve(trajectory),
    [trajectory]
  )

  const absentialSig = reading.absentialSignificance[absentialId]
  const stateHistory = absential.stateHistory ?? []
  const holder = (absential as any).holder as string | undefined
  const holderName = holder ? (diegetic.characters[holder]?.name ?? holder) : undefined
  const relatedEntities: any[] = (absential as any).relatedEntities ?? []

  // SVG dimensions
  const width = 300
  const height = 100
  const pad = { top: 8, right: 8, bottom: 18, left: 8 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  function toX(pct: number) { return pad.left + (pct / 100) * plotW }
  function toY(val: number) { return pad.top + (1 - val) * plotH }

  // Build SVG path for the smoothed curve
  const curvePath = curve.length > 0
    ? curve.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.pct)},${toY(p.value)}`).join(' ')
    : ''

  // Area fill path
  const areaPath = curvePath
    ? `${curvePath} L${toX(curve[curve.length - 1].pct)},${toY(0)} L${toX(curve[0].pct)},${toY(0)} Z`
    : ''

  return (
    <div className="absential-timeline">
      <div className="abs-tl-header">
        <h3>{absential.name}</h3>
        <p className="abs-tl-desc">{absential.description}</p>
      </div>

      {holderName && (
        <div className="abs-tl-section">
          <div className="abs-tl-meta">
            <span className="abs-tl-label-inline">Held by:</span> {holderName}
            {relatedEntities.length > 0 && (
              <> &middot; <span className="abs-tl-label-inline">Involving:</span>{' '}
                {relatedEntities.slice(0, 3).map((r: any) => {
                  const eid = r.entityId ?? r
                  const name = diegetic.characters[eid]?.name ?? eid
                  return name
                }).join(', ')}
              </>
            )}
          </div>
        </div>
      )}

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
        <div className="abs-tl-label">Intensity Trajectory ({trajectory.length} relevant events)</div>
        <svg width={width} height={height} className="abs-tl-chart">
          {/* Background */}
          <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="var(--bg, #1a1a2e)" rx={2} />

          {/* Area fill */}
          {areaPath && (
            <path d={areaPath} fill="var(--accent)" opacity={0.1} />
          )}

          {/* Smoothed intensity curve */}
          {curvePath && (
            <path d={curvePath} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" opacity={0.8} />
          )}

          {/* State change markers */}
          {stateHistory.map((state, i) => {
            const pct = state.timestamp.percentage
            const status = state.data?.status as string | undefined
            const x = toX(pct)
            return (
              <g key={`s-${i}`}>
                <line x1={x} y1={pad.top} x2={x} y2={pad.top + plotH} stroke={STATUS_COLORS[status ?? ''] ?? '#888'} strokeWidth={2} strokeDasharray="3,2" opacity={0.7} />
                <circle cx={x} cy={pad.top + 5} r={4} fill={STATUS_COLORS[status ?? ''] ?? '#888'} />
              </g>
            )
          })}

          {/* Event dots on the trajectory */}
          {trajectory.map((p, i) => (
            <circle
              key={`e-${i}`}
              cx={toX(p.percentage)}
              cy={toY(p.intensity)}
              r={3}
              fill={significanceColor(p.significance)}
              opacity={0.7}
              className="abs-tl-event-dot"
              onClick={() => onSelectEvent(p.eventId)}
            />
          ))}

          {/* X axis */}
          <text x={pad.left} y={height - 3} fill="var(--text-dim)" fontSize={8}>0%</text>
          <text x={pad.left + plotW / 2} y={height - 3} fill="var(--text-dim)" fontSize={8} textAnchor="middle">50%</text>
          <text x={pad.left + plotW} y={height - 3} fill="var(--text-dim)" fontSize={8} textAnchor="end">100%</text>
        </svg>
      </div>

      <div className="abs-tl-section">
        <div className="abs-tl-label">State Transitions</div>
        {stateHistory.map((state, i) => {
          const status = state.data?.status as string | undefined
          const intensity = (state.data?.intensity as number) ?? 0
          return (
            <div key={i} className="abs-tl-state-item">
              <span className="abs-tl-state-dot" style={{ background: STATUS_COLORS[status ?? ''] ?? '#888' }} />
              <span className="abs-tl-state-pct">{state.timestamp.percentage}%</span>
              <span className="abs-tl-state-status">{status ?? 'unknown'}</span>
              <span className="abs-tl-state-intensity">({intensity.toFixed(1)})</span>
            </div>
          )
        })}
      </div>

      {trajectory.length > 0 && (
        <div className="abs-tl-section">
          <div className="abs-tl-label">Key Events</div>
          <div className="abs-tl-event-list">
            {trajectory.filter(p => p.significance >= 0.5).slice(0, 10).map((p, i) => (
              <div key={i} className="abs-tl-event-item" onClick={() => onSelectEvent(p.eventId)}>
                <span className="abs-tl-event-pct">{p.percentage}%</span>
                <span className="abs-tl-event-dot-inline" style={{ background: significanceColor(p.significance) }} />
                <span className="abs-tl-event-label">{p.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .absential-timeline { font-size: 13px; }
        .absential-timeline h3 { font-size: 15px; font-weight: 600; color: var(--text-bright); margin: 0 0 6px; }
        .abs-tl-desc { color: var(--text); line-height: 1.5; margin-top: 4px; }
        .abs-tl-section { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); }
        .abs-tl-meta { font-size: 12px; color: var(--text); line-height: 1.5; }
        .abs-tl-label-inline { font-size: 11px; font-weight: 600; color: var(--text-dim); }
        .abs-tl-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); font-weight: 600; margin-bottom: 6px; }
        .abs-tl-sig-bar-wrap { display: flex; align-items: center; gap: 8px; height: 16px; }
        .abs-tl-sig-bar { height: 8px; border-radius: 2px; min-width: 4px; }
        .abs-tl-sig-value { font-size: 12px; font-family: var(--mono); color: var(--text); }
        .abs-tl-sig-note { font-size: 12px; color: var(--text-dim); margin-top: 4px; font-style: italic; line-height: 1.4; }
        .abs-tl-chart { display: block; width: 100%; max-width: 300px; }
        .abs-tl-event-dot { cursor: pointer; transition: r 0.15s; }
        .abs-tl-event-dot:hover { r: 5; }
        .abs-tl-state-item { display: flex; align-items: center; gap: 6px; padding: 3px 0; font-size: 12px; }
        .abs-tl-state-dot { width: 8px; height: 8px; min-width: 8px; border-radius: 50%; }
        .abs-tl-state-pct { font-family: var(--mono); font-size: 11px; color: var(--text-dim); min-width: 28px; }
        .abs-tl-state-status { color: var(--text); text-transform: capitalize; }
        .abs-tl-state-intensity { color: var(--text-dim); font-size: 11px; }
        .abs-tl-event-list { display: flex; flex-direction: column; gap: 3px; max-height: 250px; overflow-y: auto; }
        .abs-tl-event-item { display: flex; align-items: flex-start; gap: 5px; padding: 3px 0; cursor: pointer; font-size: 12px; }
        .abs-tl-event-item:hover .abs-tl-event-label { color: var(--text-bright); }
        .abs-tl-event-pct { font-family: var(--mono); font-size: 10px; color: var(--text-dim); min-width: 25px; flex-shrink: 0; }
        .abs-tl-event-dot-inline { width: 6px; height: 6px; min-width: 6px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
        .abs-tl-event-label { color: var(--text); line-height: 1.4; }
      `}</style>
    </div>
  )
}
