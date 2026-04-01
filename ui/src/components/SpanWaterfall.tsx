import type { StorySpan, StoryEvent, Reading, Selection } from '../types'
import { significanceColor } from '../utils'

interface SpanWaterfallProps {
  rootSpan: StorySpan;
  events: Record<string, StoryEvent>;
  reading: Reading;
  selection: Selection;
  onSelectEvent: (id: string) => void;
  onSelectSpan: (id: string) => void;
}

const SPAN_COLORS: Record<string, string> = {
  story: '#4a4e6a',
  act: '#3d4260',
  scene: '#353a55',
};

function SpanBar({
  span,
  events,
  reading,
  selection,
  onSelectEvent,
  onSelectSpan,
  depth,
}: {
  span: StorySpan;
  events: Record<string, StoryEvent>;
  reading: Reading;
  selection: Selection;
  onSelectEvent: (id: string) => void;
  onSelectSpan: (id: string) => void;
  depth: number;
}) {
  const startPct = span.startTimestamp.percentage;
  const endPct = span.endTimestamp.percentage;
  const widthPct = Math.max(endPct - startPct, 1);
  const isSelected = selection?.type === 'span' && selection.id === span.id;

  return (
    <div className="span-row" style={{ paddingLeft: depth * 8 }}>
      <div
        className={`span-bar ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelectSpan(span.id)}
        title={span.description}
      >
        <div className="span-label">{span.title}</div>
        <div className="span-track">
          <div
            className="span-fill"
            style={{
              left: `${startPct}%`,
              width: `${widthPct}%`,
              background: SPAN_COLORS[span.type] ?? SPAN_COLORS.scene,
            }}
          >
            {span.events.map(eventId => {
              const evt = events[eventId];
              if (!evt) return null;
              const sig = reading.eventSignificance[eventId]?.significance ?? 0;
              const evtPos = ((evt.timestamp.percentage - startPct) / widthPct) * 100;
              const isEvtSelected = selection?.type === 'event' && selection.id === eventId;
              return (
                <div
                  key={eventId}
                  className={`event-dot ${isEvtSelected ? 'selected' : ''}`}
                  style={{
                    left: `${Math.min(Math.max(evtPos, 2), 98)}%`,
                    background: significanceColor(sig),
                  }}
                  title={evt.description}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectEvent(eventId);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
      {span.childSpans.map(child => (
        <SpanBar
          key={child.id}
          span={child}
          events={events}
          reading={reading}
          selection={selection}
          onSelectEvent={onSelectEvent}
          onSelectSpan={onSelectSpan}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function SpanWaterfall({
  rootSpan,
  events,
  reading,
  selection,
  onSelectEvent,
  onSelectSpan,
}: SpanWaterfallProps) {
  return (
    <div className="span-waterfall">
      <div className="waterfall-header">Span Waterfall</div>
      <SpanBar
        span={rootSpan}
        events={events}
        reading={reading}
        selection={selection}
        onSelectEvent={onSelectEvent}
        onSelectSpan={onSelectSpan}
        depth={0}
      />

      <style>{`
        .span-waterfall {
          padding: 4px 8px;
        }
        .waterfall-header {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dim);
          padding: 4px 8px 8px;
          font-weight: 600;
        }
        .span-row {
          margin-bottom: 2px;
        }
        .span-bar {
          cursor: pointer;
          border-radius: 3px;
          padding: 2px 6px;
          transition: background 0.1s;
        }
        .span-bar:hover {
          background: var(--bg-hover);
        }
        .span-bar.selected {
          background: var(--bg-selected);
          outline: 1px solid var(--accent);
        }
        .span-label {
          font-size: 12px;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }
        .span-track {
          position: relative;
          height: 14px;
          background: var(--bg);
          border-radius: 2px;
          overflow: hidden;
        }
        .span-fill {
          position: absolute;
          top: 0;
          height: 100%;
          border-radius: 2px;
          min-width: 4px;
        }
        .event-dot {
          position: absolute;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          transform: translate(-50%, -50%) rotate(45deg);
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.3);
          transition: transform 0.1s;
          z-index: 1;
        }
        .event-dot:hover {
          transform: translate(-50%, -50%) rotate(45deg) scale(1.4);
          z-index: 2;
        }
        .event-dot.selected {
          transform: translate(-50%, -50%) rotate(45deg) scale(1.5);
          box-shadow: 0 0 6px rgba(255,255,255,0.4);
          z-index: 2;
        }
      `}</style>
    </div>
  );
}
