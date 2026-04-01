import { useEffect, useRef, useMemo } from 'react'
import type { StoryEvent, Reading, Selection } from '../types'
import { significanceColor } from '../utils'

interface TextViewProps {
  lines: string[];
  events: Record<string, StoryEvent>;
  reading: Reading;
  compareReading?: Reading;
  selection: Selection;
  onSelectEvent: (id: string) => void;
}

export function TextView({
  lines,
  events,
  reading,
  compareReading,
  selection,
  onSelectEvent,
}: TextViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Build a map: lineNum (1-indexed) -> event IDs covering that line
  const lineEventMap = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const evt of Object.values(events)) {
      for (let l = evt.textLocation.startLine; l <= evt.textLocation.endLine; l++) {
        const existing = map.get(l);
        if (existing) {
          existing.push(evt.id);
        } else {
          map.set(l, [evt.id]);
        }
      }
    }
    return map;
  }, [events]);

  // Scroll selected event into view
  useEffect(() => {
    if (selection?.type === 'event' && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selection]);

  const selectedEventId = selection?.type === 'event' ? selection.id : null;
  const selectedEvent = selectedEventId ? events[selectedEventId] : null;

  return (
    <div className="text-view" ref={containerRef}>
      <div className="text-content">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const eventIds = lineEventMap.get(lineNum);
          const isPartOfSelection =
            selectedEvent &&
            lineNum >= selectedEvent.textLocation.startLine &&
            lineNum <= selectedEvent.textLocation.endLine;

          // Get max significance for this line from active reading
          let maxSig = 0;
          let maxSigCompare = 0;
          if (eventIds) {
            for (const eid of eventIds) {
              const sig = reading.eventSignificance[eid]?.significance ?? 0;
              if (sig > maxSig) maxSig = sig;
              if (compareReading) {
                const sig2 = compareReading.eventSignificance[eid]?.significance ?? 0;
                if (sig2 > maxSigCompare) maxSigCompare = sig2;
              }
            }
          }

          const hasEvent = eventIds && eventIds.length > 0;
          const bgAlpha = isPartOfSelection ? 0.35 : hasEvent ? 0.12 : 0;
          const bgColor = bgAlpha > 0 ? significanceColor(maxSig, bgAlpha) : 'transparent';

          // Find the most significant event on this line for click target
          let bestEventId: string | undefined;
          if (eventIds && eventIds.length > 0) {
            let best = -1;
            for (const eid of eventIds) {
              const sig = reading.eventSignificance[eid]?.significance ?? 0;
              if (sig > best) {
                best = sig;
                bestEventId = eid;
              }
            }
          }

          return (
            <div
              key={lineNum}
              ref={isPartOfSelection ? selectedRef : undefined}
              className={`text-line ${hasEvent ? 'has-event' : ''} ${isPartOfSelection ? 'selected' : ''}`}
              style={{ background: bgColor }}
              onClick={bestEventId ? () => onSelectEvent(bestEventId!) : undefined}
            >
              {compareReading && (
                <div className="compare-gutter">
                  {hasEvent && (
                    <>
                      <div
                        className="gutter-bar primary"
                        style={{ background: significanceColor(maxSig, 0.7) }}
                      />
                      <div
                        className="gutter-bar compare"
                        style={{ background: significanceColor(maxSigCompare, 0.7) }}
                      />
                    </>
                  )}
                </div>
              )}
              <span className="line-number">{lineNum}</span>
              <span className="line-text">{line || '\u00A0'}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .text-view {
          height: 100%;
          overflow-y: auto;
          padding: 16px 0;
        }
        .text-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .text-line {
          display: flex;
          align-items: baseline;
          padding: 1px 8px;
          border-radius: 2px;
          transition: background 0.15s;
          line-height: 1.7;
        }
        .text-line.has-event {
          cursor: pointer;
        }
        .text-line.has-event:hover {
          filter: brightness(1.3);
        }
        .text-line.selected {
          border-left: 3px solid var(--accent);
          padding-left: 5px;
        }
        .line-number {
          display: inline-block;
          width: 36px;
          min-width: 36px;
          text-align: right;
          margin-right: 16px;
          color: var(--text-dim);
          font-family: var(--mono);
          font-size: 11px;
          opacity: 0.5;
          user-select: none;
        }
        .line-text {
          font-family: var(--mono);
          font-size: 13px;
          color: var(--text);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .text-line.selected .line-text {
          color: var(--text-bright);
        }
        .compare-gutter {
          display: flex;
          gap: 2px;
          width: 12px;
          min-width: 12px;
          margin-right: 4px;
          align-self: stretch;
        }
        .gutter-bar {
          width: 5px;
          border-radius: 1px;
          min-height: 4px;
        }
      `}</style>
    </div>
  );
}
