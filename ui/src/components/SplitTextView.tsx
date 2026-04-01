import { useEffect, useRef, useMemo } from 'react'
import type { StoryEvent, Reading, Selection, Character, Setting, Item } from '../types'
import { significanceColor } from '../utils'
import { computeEventDivergence, buildDivergenceMap } from '../divergence'

interface SplitTextViewProps {
  lines: string[];
  events: Record<string, StoryEvent>;
  entities: {
    characters: Record<string, Character>;
    settings: Record<string, Setting>;
    items: Record<string, Item>;
  };
  readingA: Reading;
  readingB: Reading;
  selection: Selection;
  onSelectEvent: (id: string) => void;
}

export function SplitTextView({
  lines,
  events,
  readingA,
  readingB,
  selection,
  onSelectEvent,
}: SplitTextViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)

  // Compute divergence map
  const divergenceMap = useMemo(() => {
    const divergences = computeEventDivergence(readingA, readingB, events)
    return buildDivergenceMap(divergences)
  }, [readingA, readingB, events])

  // Build line → event IDs map
  const lineEventMap = useMemo(() => {
    const map = new Map<number, string[]>()
    for (const evt of Object.values(events)) {
      for (let l = evt.textLocation.startLine; l <= evt.textLocation.endLine; l++) {
        const existing = map.get(l)
        if (existing) existing.push(evt.id)
        else map.set(l, [evt.id])
      }
    }
    return map
  }, [events])

  // Scroll selected event into view
  useEffect(() => {
    if (selection?.type === 'event' && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selection])

  const selectedEventId = selection?.type === 'event' ? selection.id : null
  const selectedEvent = selectedEventId ? events[selectedEventId] : null

  function renderColumn(reading: Reading, label: string) {
    return (
      <div className="split-column">
        <div className="split-column-header">{label}</div>
        <div className="split-column-content">
          {lines.map((line, idx) => {
            const lineNum = idx + 1
            const eventIds = lineEventMap.get(lineNum)
            const isPartOfSelection =
              selectedEvent &&
              lineNum >= selectedEvent.textLocation.startLine &&
              lineNum <= selectedEvent.textLocation.endLine

            let maxSig = 0
            let maxDivergence = 0
            let bestEventId: string | undefined
            let bestSig = -1

            if (eventIds) {
              for (const eid of eventIds) {
                const sig = reading.eventSignificance[eid]?.significance ?? 0
                if (sig > maxSig) maxSig = sig
                if (sig > bestSig) { bestSig = sig; bestEventId = eid }
                const div = divergenceMap.get(eid) ?? 0
                if (div > maxDivergence) maxDivergence = div
              }
            }

            const hasEvent = eventIds && eventIds.length > 0
            const bgAlpha = isPartOfSelection ? 0.35 : hasEvent ? 0.12 : 0
            const bgColor = bgAlpha > 0 ? significanceColor(maxSig, bgAlpha) : 'transparent'

            // Divergence glow: high divergence gets a pulsing outline
            const isDivergent = maxDivergence > 0.15
            const divergenceClass = isDivergent
              ? maxDivergence > 0.3 ? 'divergence-high' : 'divergence-medium'
              : ''

            return (
              <div
                key={lineNum}
                ref={isPartOfSelection ? selectedRef : undefined}
                className={`split-line ${hasEvent ? 'has-event' : ''} ${isPartOfSelection ? 'selected' : ''} ${divergenceClass}`}
                style={{ background: bgColor }}
                onClick={bestEventId ? () => onSelectEvent(bestEventId!) : undefined}
              >
                <span className="split-line-number">{lineNum}</span>
                <span className="split-line-text">{line || '\u00A0'}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="split-text-view" ref={containerRef}>
      {renderColumn(readingA, readingA.name)}
      <div className="split-divider" />
      {renderColumn(readingB, readingB.name)}

      <style>{`
        .split-text-view {
          display: flex;
          height: 100%;
          overflow: hidden;
        }
        .split-column {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .split-column-header {
          position: sticky;
          top: 0;
          z-index: 10;
          padding: 8px 12px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
          color: var(--accent);
          letter-spacing: 0.03em;
        }
        .split-column-content {
          padding: 8px 0;
        }
        .split-divider {
          width: 1px;
          background: var(--border);
          flex-shrink: 0;
        }
        .split-line {
          display: flex;
          align-items: baseline;
          padding: 1px 8px;
          border-radius: 2px;
          transition: background 0.15s;
          line-height: 1.7;
        }
        .split-line.has-event {
          cursor: pointer;
        }
        .split-line.has-event:hover {
          filter: brightness(1.3);
        }
        .split-line.selected {
          border-left: 3px solid var(--accent);
          padding-left: 5px;
        }
        .split-line.divergence-medium {
          box-shadow: inset 2px 0 0 0 hsl(45, 90%, 55%);
          animation: divergence-pulse 2s ease-in-out infinite;
        }
        .split-line.divergence-high {
          box-shadow: inset 3px 0 0 0 hsl(0, 80%, 55%);
          animation: divergence-pulse 1.5s ease-in-out infinite;
        }
        @keyframes divergence-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .split-line-number {
          display: inline-block;
          width: 28px;
          min-width: 28px;
          text-align: right;
          margin-right: 10px;
          color: var(--text-dim);
          font-family: var(--mono);
          font-size: 10px;
          opacity: 0.4;
          user-select: none;
        }
        .split-line-text {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .split-line.selected .split-line-text {
          color: var(--text-bright);
        }
      `}</style>
    </div>
  )
}
