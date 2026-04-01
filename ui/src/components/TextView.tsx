import { useEffect, useRef, useMemo, type ReactNode } from 'react'
import type { StoryEvent, Reading, Selection, Character, Setting, Item } from '../types'
import { significanceColor } from '../utils'

interface EntityMention {
  entityId: string;
  mention: string;
}

interface Entities {
  characters: Record<string, Character>;
  settings: Record<string, Setting>;
  items: Record<string, Item>;
}

interface TextViewProps {
  lines: string[];
  events: Record<string, StoryEvent>;
  entities: Entities;
  reading: Reading;
  compareReading?: Reading;
  selection: Selection;
  onSelectEvent: (id: string) => void;
  onSelectEntity: (entityId: string) => void;
}

/** Build a sorted list of all entity mentions (longest first to avoid partial matches). */
function collectMentions(entities: Entities): EntityMention[] {
  const mentions: EntityMention[] = [];

  const addEntity = (id: string, entity: { name: string; textMentions?: string[] }) => {
    if (entity.textMentions && entity.textMentions.length > 0) {
      for (const m of entity.textMentions) {
        mentions.push({ entityId: id, mention: m });
      }
    }
    // Always include the entity name as a mention
    mentions.push({ entityId: id, mention: entity.name });
  };

  for (const [id, c] of Object.entries(entities.characters)) addEntity(id, c);
  for (const [id, s] of Object.entries(entities.settings)) addEntity(id, s);
  for (const [id, i] of Object.entries(entities.items)) addEntity(id, i);

  // Deduplicate (same entityId + mention)
  const seen = new Set<string>();
  const deduped: EntityMention[] = [];
  for (const m of mentions) {
    const key = `${m.entityId}::${m.mention}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(m);
    }
  }

  // Sort by mention length descending (longest first)
  deduped.sort((a, b) => b.mention.length - a.mention.length);
  return deduped;
}

/** Annotate a line of text with clickable entity mentions. */
function annotateLine(
  line: string,
  mentions: EntityMention[],
  onSelectEntity: (entityId: string) => void,
): ReactNode {
  if (!line) return '\u00A0';

  // Find all non-overlapping matches
  type Match = { start: number; end: number; entityId: string };
  const matches: Match[] = [];
  const occupied = new Uint8Array(line.length);

  for (const { entityId, mention } of mentions) {
    let searchFrom = 0;
    while (searchFrom < line.length) {
      const idx = line.indexOf(mention, searchFrom);
      if (idx === -1) break;
      const end = idx + mention.length;
      // Check no overlap
      let overlap = false;
      for (let i = idx; i < end; i++) {
        if (occupied[i]) { overlap = true; break; }
      }
      if (!overlap) {
        matches.push({ start: idx, end, entityId });
        for (let i = idx; i < end; i++) occupied[i] = 1;
      }
      searchFrom = idx + 1;
    }
  }

  if (matches.length === 0) return line;

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (cursor < m.start) {
      parts.push(line.slice(cursor, m.start));
    }
    parts.push(
      <span
        key={`em-${i}`}
        className="entity-mention"
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity(m.entityId);
        }}
      >
        {line.slice(m.start, m.end)}
      </span>
    );
    cursor = m.end;
  }
  if (cursor < line.length) {
    parts.push(line.slice(cursor));
  }
  return <>{parts}</>;
}

export function TextView({
  lines,
  events,
  entities,
  reading,
  compareReading,
  selection,
  onSelectEvent,
  onSelectEntity,
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

  // Collect entity mentions once
  const mentions = useMemo(() => collectMentions(entities), [entities]);

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
              <span className="line-text">
                {annotateLine(line, mentions, onSelectEntity)}
              </span>
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
        .entity-mention {
          border-bottom: 1px dotted var(--text-muted, #666);
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .entity-mention:hover {
          border-bottom-color: var(--text-bright, #eee);
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
