import { useEffect, useRef, useMemo, useState, type ReactNode } from 'react'
import type { StoryEvent, Reading, Selection, Character, Setting, Item, TextAnnotation } from '../types'
import { significanceColor } from '../utils'

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
  textAnnotations?: TextAnnotation[];
}

/** Annotation with source tag for styling purposes. */
interface TaggedAnnotation extends TextAnnotation {
  source: 'diegetic' | 'reading';
}

/** A segment of a line that may have zero or more annotations. */
interface LineSegment {
  startChar: number;
  endChar: number;
  text: string;
  annotations: TaggedAnnotation[];
}

/** Resolve entity name from model entities. */
function resolveEntityName(entityId: string, entities: Entities): string {
  const entity = entities.characters[entityId] ?? entities.settings[entityId] ?? entities.items[entityId];
  return entity ? entity.name : entityId;
}

/**
 * Given a line number and the line text, compute the annotation segments.
 * Annotations can overlap; we split the line into non-overlapping segments
 * where each segment carries all annotations that cover it.
 */
function computeLineSegments(
  lineNum: number,
  lineText: string,
  annotations: TaggedAnnotation[],
): LineSegment[] {
  if (annotations.length === 0) {
    return [{ startChar: 0, endChar: lineText.length, text: lineText, annotations: [] }];
  }

  // Calculate effective char ranges on this line for each annotation
  type EffectiveAnnotation = { start: number; end: number; annotation: TaggedAnnotation };
  const effective: EffectiveAnnotation[] = [];

  for (const ann of annotations) {
    const start = ann.startLine < lineNum ? 0 : ann.startChar;
    const end = ann.endLine > lineNum ? lineText.length : ann.endChar;
    if (start < end && start < lineText.length) {
      effective.push({ start, end: Math.min(end, lineText.length), annotation: ann });
    }
  }

  if (effective.length === 0) {
    return [{ startChar: 0, endChar: lineText.length, text: lineText, annotations: [] }];
  }

  // Collect all boundary points
  const boundaries = new Set<number>();
  boundaries.add(0);
  boundaries.add(lineText.length);
  for (const ea of effective) {
    boundaries.add(ea.start);
    boundaries.add(ea.end);
  }
  const sorted = Array.from(boundaries).sort((a, b) => a - b);

  // Build segments between consecutive boundary points
  const segments: LineSegment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const s = sorted[i];
    const e = sorted[i + 1];
    if (s >= e) continue;
    const covering = effective
      .filter(ea => ea.start <= s && ea.end >= e)
      .map(ea => ea.annotation);
    segments.push({
      startChar: s,
      endChar: e,
      text: lineText.slice(s, e),
      annotations: covering,
    });
  }

  return segments;
}

/** Popup for disambiguating overlapping annotations. */
function AnnotationPopup({
  annotations,
  entities,
  onSelect,
  onClose,
}: {
  annotations: TaggedAnnotation[];
  entities: Entities;
  onSelect: (entityId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="annotation-popup" onClick={e => e.stopPropagation()}>
      <div className="annotation-popup-header">
        Multiple annotations
        <span className="annotation-popup-close" onClick={onClose}>&times;</span>
      </div>
      {annotations.map((ann, i) => (
        <div
          key={`${ann.entityId}-${i}`}
          className="annotation-popup-item"
          onClick={() => {
            onSelect(ann.entityId);
            onClose();
          }}
        >
          <span
            className="annotation-popup-dot"
            style={{ background: ann.source === 'diegetic' ? 'var(--text-muted, #666)' : 'var(--accent, #7b8cde)' }}
          />
          <span className="annotation-popup-name">{resolveEntityName(ann.entityId, entities)}</span>
          <span className="annotation-popup-source">{ann.source}</span>
        </div>
      ))}
    </div>
  );
}

/** Render a single annotated segment. */
function AnnotatedSegment({
  segment,
  entities,
  onSelectEntity,
  onPopupToggle,
}: {
  segment: LineSegment;
  entities: Entities;
  onSelectEntity: (entityId: string) => void;
  onPopupToggle?: (open: boolean) => void;
}) {
  const [showPopup, setShowPopup] = useState(false);

  if (segment.annotations.length === 0) {
    return <>{segment.text}</>;
  }

  // Deduplicate annotations by entityId (keep unique entities)
  const uniqueByEntity = new Map<string, TaggedAnnotation>();
  for (const ann of segment.annotations) {
    if (!uniqueByEntity.has(ann.entityId)) {
      uniqueByEntity.set(ann.entityId, ann);
    }
  }
  const uniqueAnnotations = Array.from(uniqueByEntity.values());
  const count = uniqueAnnotations.length;
  const hasMultiple = count > 1;
  const hasDiegetic = uniqueAnnotations.some(a => a.source === 'diegetic');
  const hasReading = uniqueAnnotations.some(a => a.source === 'reading');
  const hasMixed = hasDiegetic && hasReading;

  // Determine underline style class
  let styleClass = 'annotation-diegetic';
  if (hasMixed || hasMultiple) {
    styleClass = 'annotation-overlap';
  } else if (hasReading) {
    styleClass = 'annotation-reading';
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultiple) {
      const next = !showPopup;
      setShowPopup(next);
      onPopupToggle?.(next);
    } else {
      onSelectEntity(uniqueAnnotations[0].entityId);
    }
  };

  return (
    <span
      className={`entity-mention ${styleClass}`}
      style={{ position: 'relative' }}
      onClick={handleClick}
    >
      {segment.text}
      {hasMultiple && (
        <span className="annotation-badge">{count}</span>
      )}
      {showPopup && (
        <AnnotationPopup
          annotations={uniqueAnnotations}
          entities={entities}
          onSelect={onSelectEntity}
          onClose={() => { setShowPopup(false); onPopupToggle?.(false); }}
        />
      )}
    </span>
  );
}

/** Annotate a line using structured annotation positions. */
function annotateLine(
  lineNum: number,
  lineText: string,
  annotations: TaggedAnnotation[],
  entities: Entities,
  onSelectEntity: (entityId: string) => void,
  onPopupToggle?: (open: boolean) => void,
): ReactNode {
  if (!lineText) return '\u00A0';

  // Filter annotations that cover this line
  const lineAnnotations = annotations.filter(
    ann => ann.startLine <= lineNum && ann.endLine >= lineNum
  );

  const segments = computeLineSegments(lineNum, lineText, lineAnnotations);

  // If no segments have annotations, return plain text
  if (segments.every(s => s.annotations.length === 0)) {
    return lineText;
  }

  return (
    <>
      {segments.map((seg, i) => (
        <AnnotatedSegment
          key={`${seg.startChar}-${i}`}
          segment={seg}
          entities={entities}
          onSelectEntity={onSelectEntity}
          onPopupToggle={onPopupToggle}
        />
      ))}
    </>
  );
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
  textAnnotations,
}: TextViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  const [popupLine, setPopupLine] = useState<number | null>(null);

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

  // Collect all applicable annotations with source tags
  const allAnnotations: TaggedAnnotation[] = useMemo(() => {
    const result: TaggedAnnotation[] = [];

    // Diegetic annotations from text
    if (textAnnotations) {
      for (const ann of textAnnotations) {
        result.push({ ...ann, source: 'diegetic' });
      }
    }

    // Active reading's annotations
    if (reading.annotations) {
      for (const ann of reading.annotations) {
        result.push({ ...ann, source: 'reading' });
      }
    }

    // Compare reading's annotations (if in compare mode)
    if (compareReading?.annotations) {
      for (const ann of compareReading.annotations) {
        result.push({ ...ann, source: 'reading' });
      }
    }

    return result;
  }, [textAnnotations, reading, compareReading]);

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
              style={{
                background: bgColor,
                position: popupLine === lineNum ? 'relative' : undefined,
                zIndex: popupLine === lineNum ? 1000 : undefined,
              }}
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
                {annotateLine(lineNum, line, allAnnotations, entities, onSelectEntity,
                  (open) => setPopupLine(open ? lineNum : null))}
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
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .entity-mention:hover {
          border-bottom-color: var(--text-bright, #eee);
        }
        .entity-mention.annotation-diegetic {
          border-bottom: 1px dotted var(--text-muted, #666);
        }
        .entity-mention.annotation-reading {
          border-bottom: 1px dotted var(--accent, #7b8cde);
        }
        .entity-mention.annotation-overlap {
          border-bottom: 2px dotted var(--accent, #7b8cde);
        }
        .annotation-badge {
          display: inline-block;
          position: relative;
          top: -0.6em;
          left: 1px;
          font-size: 9px;
          font-family: var(--mono);
          background: var(--accent, #7b8cde);
          color: var(--bg, #1a1a2e);
          border-radius: 6px;
          min-width: 12px;
          height: 12px;
          line-height: 12px;
          text-align: center;
          padding: 0 2px;
          font-weight: 700;
        }
        .annotation-popup {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 100;
          background: var(--bg-panel, #1e1e34);
          border: 1px solid var(--border, #333);
          border-radius: 6px;
          padding: 4px 0;
          min-width: 200px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          font-size: 12px;
          white-space: nowrap;
        }
        .annotation-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 10px 6px;
          font-size: 11px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid var(--border, #333);
        }
        .annotation-popup-close {
          cursor: pointer;
          font-size: 14px;
          color: var(--text-dim);
        }
        .annotation-popup-close:hover {
          color: var(--text-bright);
        }
        .annotation-popup-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          cursor: pointer;
          color: var(--text);
        }
        .annotation-popup-item:hover {
          background: var(--bg-hover, #2a2a4a);
        }
        .annotation-popup-dot {
          width: 6px;
          height: 6px;
          min-width: 6px;
          border-radius: 50%;
        }
        .annotation-popup-name {
          color: var(--text-bright, #eee);
          font-weight: 500;
        }
        .annotation-popup-source {
          color: var(--text-dim);
          font-size: 10px;
          margin-left: auto;
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
