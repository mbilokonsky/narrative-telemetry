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
  compareAbsentials?: Array<{ id: string; absential: Absential }>;
}

interface TrajectoryPoint {
  percentage: number;
  relevance: number;  // how relevant this event is to THIS absential (0-1)
  significance: number;  // reading significance of the event
  intensity: number;  // relevance * significance = absential-specific pressure
  eventId: string;
  description: string;
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
 * Build an absential-specific trajectory.
 *
 * Instead of showing all holder events equally, we weight each event
 * by how many of THIS absential's relatedEntities participate.
 * An event involving the holder + the target + the obstacle is more
 * relevant to this absential than one involving only the holder.
 */
function buildTrajectory(
  absential: Absential,
  events: Record<string, StoryEvent>,
  reading: Reading,
): TrajectoryPoint[] {
  const holder = absential.holder
  const relatedEntities = absential.relatedEntities ?? []
  const relatedIds = new Set(relatedEntities.map(r => r.entityId))

  // All entity IDs connected to this absential
  const allConnected = new Set<string>()
  if (holder) allConnected.add(holder)
  for (const id of relatedIds) allConnected.add(id)

  if (allConnected.size === 0) return []

  const points: TrajectoryPoint[] = []

  for (const [eventId, evt] of Object.entries(events)) {
    // Count how many absential-connected entities participate in this event
    const matchingParticipants = evt.participants.filter(p => allConnected.has(p))
    if (matchingParticipants.length === 0) continue

    // Relevance: what fraction of connected entities appear?
    // Boost if the holder is present, boost more if target/obstacle entities appear
    let relevance = 0
    const hasHolder = holder ? matchingParticipants.includes(holder) : false
    const relatedMatches = matchingParticipants.filter(p => relatedIds.has(p))

    if (hasHolder && relatedMatches.length > 0) {
      // Holder + related entities = highly relevant to this absential
      relevance = 0.7 + 0.3 * (relatedMatches.length / Math.max(relatedIds.size, 1))
    } else if (relatedMatches.length > 0) {
      // Related entities without holder = moderately relevant
      relevance = 0.4 + 0.3 * (relatedMatches.length / Math.max(relatedIds.size, 1))
    } else if (hasHolder) {
      // Holder alone = weakly relevant (could be about anything)
      relevance = 0.2
    }

    const significance = reading.eventSignificance[eventId]?.significance ?? 0
    const intensity = relevance * significance

    if (intensity > 0.05) {
      points.push({
        percentage: evt.timestamp.percentage,
        relevance,
        significance,
        intensity,
        eventId,
        description: evt.description,
      })
    }
  }

  return points.sort((a, b) => a.percentage - b.percentage)
}

/**
 * Compute a smoothed intensity curve from trajectory points.
 */
function smoothCurve(
  points: TrajectoryPoint[],
  numSamples: number = 40,
  bandwidth: number = 6,
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
  compareAbsentials = [],
}: AbsentialTimelineProps) {
  const trajectory = useMemo(
    () => buildTrajectory(absential, events, reading),
    [absential, events, reading]
  )

  const curve = useMemo(
    () => smoothCurve(trajectory),
    [trajectory]
  )

  // Comparison curves
  const COMPARE_COLORS = ['#e86445', '#45e87b', '#e8a845', '#9b59b6', '#45a8e8']
  const compareCurves = useMemo(() => {
    return compareAbsentials.map((comp, i) => ({
      id: comp.id,
      name: comp.absential.name,
      color: COMPARE_COLORS[i % COMPARE_COLORS.length],
      curve: smoothCurve(buildTrajectory(comp.absential, events, reading)),
    }))
  }, [compareAbsentials, events, reading])

  const absentialSig = reading.absentialSignificance[absentialId]
  const stateHistory = absential.stateHistory ?? []
  const holder = absential.holder
  const holderName = holder ? (diegetic.characters[holder]?.name ?? holder) : undefined
  const relatedEntities = absential.relatedEntities ?? []

  // Find the introduction point (first event in trajectory)
  const introPoint = trajectory.length > 0 ? trajectory[0].percentage : 0
  // Find the peak intensity point
  const peakPoint = trajectory.length > 0
    ? trajectory.reduce((best, p) => p.intensity > best.intensity ? p : best, trajectory[0])
    : null

  // SVG dimensions
  const width = 300
  const height = 100
  const pad = { top: 8, right: 8, bottom: 18, left: 8 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  function toX(pct: number) { return pad.left + (pct / 100) * plotW }
  function toY(val: number) { return pad.top + (1 - Math.min(val, 1)) * plotH }

  // Build SVG path for the smoothed curve
  const curvePath = curve.length > 0
    ? curve.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.pct)},${toY(p.value)}`).join(' ')
    : ''

  // Area fill
  const areaPath = curvePath && curve.length > 0
    ? `${curvePath} L${toX(curve[curve.length - 1].pct)},${toY(0)} L${toX(curve[0].pct)},${toY(0)} Z`
    : ''

  // State transitions — position them at the percentage where they make sense
  // If all states are at 0%, distribute them: first at introPoint, last at 100%
  const effectiveStates = stateHistory.map((state) => {
    const rawPct = state.timestamp.percentage
    // If the state is at 0% and it's not the only state, reposition
    if (rawPct === 0 && stateHistory.length === 1) {
      // Single state: show at the introduction point
      return { ...state, effectivePct: introPoint }
    }
    return { ...state, effectivePct: rawPct }
  })

  return (
    <div className="absential-timeline">
      <div className="abs-tl-header">
        <h3>{absential.name}</h3>
        <p className="abs-tl-desc">{absential.description}</p>
      </div>

      <div className="abs-tl-section">
        <div className="abs-tl-meta">
          {holderName && (
            <><span className="abs-tl-label-inline">Held by:</span> {holderName}</>
          )}
          {relatedEntities.length > 0 && (
            <>
              {holderName && <> &middot; </>}
              <span className="abs-tl-label-inline">Involves:</span>{' '}
              {relatedEntities.slice(0, 4).map((r, i) => {
                const name = diegetic.characters[r.entityId]?.name ?? r.entityId
                return <span key={i}>{i > 0 ? ', ' : ''}{name} <span className="abs-tl-role">({r.relationship})</span></span>
              })}
            </>
          )}
        </div>
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
        <div className="abs-tl-label">
          Narrative Pressure
          {trajectory.length > 0 && (
            <span className="abs-tl-label-detail">
              {' '}({trajectory.length} events where {holderName ?? 'holder'} meets related entities)
            </span>
          )}
        </div>
        {trajectory.length === 0 ? (
          <div className="abs-tl-empty">No events found involving both holder and related entities</div>
        ) : (
          <>
            <svg width={width} height={height} className="abs-tl-chart">
              <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="var(--bg, #1a1a2e)" rx={2} />

              {/* Area fill */}
              {areaPath && <path d={areaPath} fill="var(--accent)" opacity={0.12} />}

              {/* Comparison curves (behind primary) */}
              {compareCurves.map(comp => {
                if (comp.curve.length === 0) return null
                const d = comp.curve.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.pct)},${toY(p.value)}`).join(' ')
                return (
                  <path key={comp.id} d={d} fill="none" stroke={comp.color} strokeWidth={1.5}
                    strokeLinejoin="round" strokeDasharray="4,3" opacity={0.7} />
                )
              })}

              {/* Primary curve */}
              {curvePath && (
                <path d={curvePath} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" opacity={0.85} />
              )}

              {/* State markers */}
              {effectiveStates.map((state, i) => {
                const status = state.data?.status as string | undefined
                const x = toX(state.effectivePct)
                return (
                  <g key={`s-${i}`}>
                    <line x1={x} y1={pad.top} x2={x} y2={pad.top + plotH}
                      stroke={STATUS_COLORS[status ?? ''] ?? '#888'} strokeWidth={1.5} strokeDasharray="3,2" opacity={0.6} />
                  </g>
                )
              })}

              {/* Event dots — sized by relevance, colored by significance */}
              {trajectory.map((p, i) => (
                <circle
                  key={`e-${i}`}
                  cx={toX(p.percentage)}
                  cy={toY(p.intensity)}
                  r={2 + p.relevance * 3}
                  fill={significanceColor(p.significance)}
                  opacity={0.75}
                  className="abs-tl-event-dot"
                  onClick={() => onSelectEvent(p.eventId)}
                >
                  <title>{`${p.percentage.toFixed(0)}% — relevance: ${p.relevance.toFixed(2)}, significance: ${p.significance.toFixed(2)}`}</title>
                </circle>
              ))}

              {/* Peak marker */}
              {peakPoint && (
                <g>
                  <line x1={toX(peakPoint.percentage)} y1={pad.top} x2={toX(peakPoint.percentage)} y2={pad.top + plotH}
                    stroke="var(--accent)" strokeWidth={1} strokeDasharray="2,2" opacity={0.4} />
                </g>
              )}

              {/* X axis */}
              <text x={pad.left} y={height - 3} fill="var(--text-dim)" fontSize={8}>0%</text>
              <text x={pad.left + plotW / 2} y={height - 3} fill="var(--text-dim)" fontSize={8} textAnchor="middle">50%</text>
              <text x={pad.left + plotW} y={height - 3} fill="var(--text-dim)" fontSize={8} textAnchor="end">100%</text>
            </svg>

            {compareCurves.length > 0 && (
              <div className="abs-tl-overlay-legend">
                <div className="abs-tl-legend-item">
                  <span className="abs-tl-legend-line" style={{ background: 'var(--accent)' }} />
                  <span>{absential.name}</span>
                </div>
                {compareCurves.map(comp => (
                  <div key={comp.id} className="abs-tl-legend-item">
                    <span className="abs-tl-legend-line" style={{ background: comp.color, borderStyle: 'dashed' }} />
                    <span>{comp.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="abs-tl-curve-legend">
              Curve = event significance weighted by co-occurrence of this absential's
              holder + {relatedEntities.length > 0
                ? relatedEntities.map(r => r.relationship).join('/')
                : 'related entities'}.
              Dot size = relevance. {compareCurves.length > 0 ? 'Dashed lines = overlaid absentials.' : 'Shift-click to overlay.'}
            </div>
          </>
        )}
      </div>

      <div className="abs-tl-section">
        <div className="abs-tl-label">Resolution</div>
        {effectiveStates.map((state, i) => {
          const status = state.data?.status as string | undefined
          const intensity = (state.data?.intensity as number) ?? 0
          const urgency = (state.data?.urgency as number) ?? 0
          return (
            <div key={i} className="abs-tl-state-item">
              <span className="abs-tl-state-dot" style={{ background: STATUS_COLORS[status ?? ''] ?? '#888' }} />
              <span className="abs-tl-state-status">{(status ?? 'unknown').replace(/_/g, ' ')}</span>
              <span className="abs-tl-state-detail">intensity {intensity.toFixed(1)}, urgency {urgency.toFixed(1)}</span>
            </div>
          )
        })}
      </div>

      {trajectory.length > 0 && (
        <div className="abs-tl-section">
          <div className="abs-tl-label">Key Moments</div>
          <div className="abs-tl-event-list">
            {trajectory
              .filter(p => p.intensity >= 0.15)
              .sort((a, b) => b.intensity - a.intensity)
              .slice(0, 8)
              .sort((a, b) => a.percentage - b.percentage)
              .map((p, i) => (
                <div key={i} className="abs-tl-event-item" onClick={() => onSelectEvent(p.eventId)}>
                  <span className="abs-tl-event-pct">{p.percentage.toFixed(0)}%</span>
                  <span className="abs-tl-event-dot-inline" style={{ background: significanceColor(p.significance) }} />
                  <span className="abs-tl-event-label">{p.description}</span>
                  <span className="abs-tl-event-relevance">r:{p.relevance.toFixed(1)}</span>
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
        .abs-tl-meta { font-size: 12px; color: var(--text); line-height: 1.6; }
        .abs-tl-label-inline { font-weight: 600; color: var(--text-dim); font-size: 11px; }
        .abs-tl-role { color: var(--text-dim); font-size: 10px; }
        .abs-tl-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); font-weight: 600; margin-bottom: 6px; }
        .abs-tl-label-detail { text-transform: none; letter-spacing: normal; font-weight: 400; font-size: 10px; }
        .abs-tl-sig-bar-wrap { display: flex; align-items: center; gap: 8px; height: 16px; }
        .abs-tl-sig-bar { height: 8px; border-radius: 2px; min-width: 4px; }
        .abs-tl-sig-value { font-size: 12px; font-family: var(--mono); color: var(--text); }
        .abs-tl-sig-note { font-size: 12px; color: var(--text-dim); margin-top: 4px; font-style: italic; line-height: 1.4; }
        .abs-tl-chart { display: block; width: 100%; max-width: 300px; }
        .abs-tl-event-dot { cursor: pointer; transition: opacity 0.15s; }
        .abs-tl-event-dot:hover { opacity: 1 !important; }
        .abs-tl-overlay-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
        .abs-tl-legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text); }
        .abs-tl-legend-line { display: inline-block; width: 14px; height: 2px; border-radius: 1px; }
        .abs-tl-curve-legend { font-size: 10px; color: var(--text-dim); line-height: 1.5; margin-top: 6px; font-style: italic; }
        .abs-tl-empty { font-size: 12px; color: var(--text-dim); font-style: italic; padding: 8px 0; }
        .abs-tl-state-item { display: flex; align-items: center; gap: 6px; padding: 3px 0; font-size: 12px; }
        .abs-tl-state-dot { width: 8px; height: 8px; min-width: 8px; border-radius: 50%; }
        .abs-tl-state-status { color: var(--text); text-transform: capitalize; }
        .abs-tl-state-detail { color: var(--text-dim); font-size: 11px; margin-left: auto; }
        .abs-tl-event-list { display: flex; flex-direction: column; gap: 3px; max-height: 250px; overflow-y: auto; }
        .abs-tl-event-item { display: flex; align-items: flex-start; gap: 5px; padding: 3px 0; cursor: pointer; font-size: 12px; }
        .abs-tl-event-item:hover .abs-tl-event-label { color: var(--text-bright); }
        .abs-tl-event-pct { font-family: var(--mono); font-size: 10px; color: var(--text-dim); min-width: 25px; flex-shrink: 0; }
        .abs-tl-event-dot-inline { width: 6px; height: 6px; min-width: 6px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
        .abs-tl-event-label { color: var(--text); line-height: 1.4; flex: 1; }
        .abs-tl-event-relevance { font-family: var(--mono); font-size: 9px; color: var(--text-dim); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
