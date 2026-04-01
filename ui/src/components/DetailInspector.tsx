import type { StoryModel, Selection } from '../types'
import { significanceColor } from '../utils'
import { TensionChart } from './TensionChart'

interface DetailInspectorProps {
  model: StoryModel;
  selection: Selection;
  activeReading: string;
  compareMode: boolean;
  readingKeys: string[];
}

const READING_COLORS: Record<string, string> = {};
function getReadingColor(key: string, idx: number): string {
  if (!READING_COLORS[key]) {
    const colors = ['#7b8cde', '#de9a7b', '#7bdeab', '#de7bb8'];
    READING_COLORS[key] = colors[idx % colors.length];
  }
  return READING_COLORS[key];
}

function resolveParticipant(id: string, model: StoryModel): string {
  const chars = model.text.diegetic.characters;
  if (chars[id]) return chars[id].name;
  const settings = model.text.diegetic.settings;
  if (settings[id]) return settings[id].name;
  const items = model.text.diegetic.items;
  if (items[id]) return items[id].name;
  return id;
}

function findSpan(root: import('../types').StorySpan, id: string): import('../types').StorySpan | null {
  if (root.id === id) return root;
  for (const child of root.childSpans) {
    const found = findSpan(child, id);
    if (found) return found;
  }
  return null;
}

export function DetailInspector({
  model,
  selection,
  activeReading,
  compareMode,
  readingKeys,
}: DetailInspectorProps) {
  const displayedReadings = compareMode ? readingKeys : [activeReading];

  const tensionData = displayedReadings.map((key, idx) => ({
    key,
    points: model.readings[key].globalTension,
    color: getReadingColor(key, idx),
  }));

  // Overview (no selection)
  if (!selection) {
    const charCount = Object.keys(model.text.diegetic.characters).length;
    const settingCount = Object.keys(model.text.diegetic.settings).length;
    const eventCount = Object.keys(model.text.events).length;
    const itemCount = Object.keys(model.text.diegetic.items).length;

    return (
      <div className="detail-inspector">
        <div className="detail-section">
          <h3>{model.text.title}</h3>
          <div className="detail-meta">{model.text.author}</div>
          <p className="detail-desc">{model.text.description}</p>
        </div>
        <div className="detail-section">
          <div className="detail-label">Entities</div>
          <div className="detail-stats">
            <span>{charCount} characters</span>
            <span>{settingCount} settings</span>
            <span>{itemCount} items</span>
            <span>{eventCount} events</span>
          </div>
        </div>
        <div className="detail-section">
          <div className="detail-label">Readings</div>
          {readingKeys.map(key => (
            <div key={key} className="reading-desc">
              <strong>{key}</strong>
              <p>{model.readings[key].description}</p>
            </div>
          ))}
        </div>
        <TensionChart
          tensions={tensionData}
          selection={selection}
          events={model.text.events}
        />
        <DetailStyle />
      </div>
    );
  }

  // Event selected
  if (selection.type === 'event') {
    const evt = model.text.events[selection.id];
    if (!evt) return <div className="detail-inspector">Unknown event<DetailStyle /></div>;

    return (
      <div className="detail-inspector">
        <div className="detail-section">
          <div className="detail-label">Event</div>
          <h3>{evt.id}</h3>
          <div className="detail-badge">{evt.type}</div>
          <p className="detail-desc">{evt.description}</p>
        </div>
        <div className="detail-section">
          <div className="detail-label">Text Location</div>
          <div className="detail-meta">
            Lines {evt.textLocation.startLine}&#8211;{evt.textLocation.endLine}
            {' '}&middot;{' '}
            {evt.timestamp.percentage}%
          </div>
        </div>
        <div className="detail-section">
          <div className="detail-label">Participants</div>
          <div className="detail-tags">
            {evt.participants.map(p => (
              <span key={p} className="detail-tag">{resolveParticipant(p, model)}</span>
            ))}
          </div>
        </div>
        <div className="detail-section">
          <div className="detail-label">Significance</div>
          <div className="sig-rows">
            {displayedReadings.map(key => {
              const sig = model.readings[key].eventSignificance[evt.id];
              return (
                <div key={key} className="sig-row">
                  <div className="sig-reading-name">{key}</div>
                  <div className="sig-bar-wrap">
                    <div
                      className="sig-bar"
                      style={{
                        width: `${(sig?.significance ?? 0) * 100}%`,
                        background: significanceColor(sig?.significance ?? 0),
                      }}
                    />
                    <span className="sig-value">
                      {(sig?.significance ?? 0).toFixed(2)}
                    </span>
                  </div>
                  {sig?.note && <div className="sig-note">{sig.note}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <TensionChart
          tensions={tensionData}
          selection={selection}
          events={model.text.events}
        />
        <DetailStyle />
      </div>
    );
  }

  // Span selected
  if (selection.type === 'span') {
    const span = findSpan(model.text.rootSpan, selection.id);
    if (!span) return <div className="detail-inspector">Unknown span<DetailStyle /></div>;

    return (
      <div className="detail-inspector">
        <div className="detail-section">
          <div className="detail-label">{span.type}</div>
          <h3>{span.title}</h3>
          <p className="detail-desc">{span.description}</p>
          <div className="detail-meta">
            {span.startTimestamp.percentage}%&#8211;{span.endTimestamp.percentage}%
          </div>
        </div>
        {span.events.length > 0 && (
          <div className="detail-section">
            <div className="detail-label">Events ({span.events.length})</div>
            <div className="span-event-list">
              {span.events.map(eid => {
                const evt = model.text.events[eid];
                if (!evt) return null;
                const sig = model.readings[activeReading].eventSignificance[eid]?.significance ?? 0;
                return (
                  <div key={eid} className="span-event-item">
                    <div
                      className="span-event-dot"
                      style={{ background: significanceColor(sig) }}
                    />
                    <div>
                      <div className="span-event-id">{eid}</div>
                      <div className="span-event-desc">{evt.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <TensionChart
          tensions={tensionData}
          selection={selection}
          events={model.text.events}
        />
        <DetailStyle />
      </div>
    );
  }

  return null;
}

function DetailStyle() {
  return (
    <style>{`
      .detail-inspector {
        font-size: 13px;
      }
      .detail-inspector h3 {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-bright);
        margin: 0 0 6px;
      }
      .detail-section {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);
      }
      .detail-section:last-of-type {
        border-bottom: none;
      }
      .detail-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-dim);
        font-weight: 600;
        margin-bottom: 6px;
      }
      .detail-meta {
        color: var(--text-dim);
        font-size: 12px;
        margin-top: 4px;
      }
      .detail-desc {
        color: var(--text);
        line-height: 1.6;
        margin-top: 4px;
      }
      .detail-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        background: var(--bg-hover);
        color: var(--text-dim);
        font-size: 11px;
        text-transform: capitalize;
        margin-bottom: 6px;
      }
      .detail-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .detail-stats span {
        padding: 3px 8px;
        background: var(--bg-hover);
        border-radius: 3px;
        font-size: 12px;
        color: var(--text);
      }
      .detail-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .detail-tag {
        padding: 2px 8px;
        background: var(--accent-dim);
        border: 1px solid var(--accent);
        border-radius: 3px;
        font-size: 12px;
        color: var(--accent);
      }
      .reading-desc {
        margin-bottom: 8px;
      }
      .reading-desc strong {
        color: var(--text-bright);
        font-size: 13px;
        text-transform: capitalize;
      }
      .reading-desc p {
        color: var(--text-dim);
        font-size: 12px;
        margin-top: 2px;
        line-height: 1.5;
      }
      .sig-rows {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .sig-row {
      }
      .sig-reading-name {
        font-size: 11px;
        text-transform: capitalize;
        color: var(--text-dim);
        margin-bottom: 3px;
      }
      .sig-bar-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 16px;
      }
      .sig-bar {
        height: 8px;
        border-radius: 2px;
        min-width: 4px;
        transition: width 0.2s;
      }
      .sig-value {
        font-size: 12px;
        font-family: var(--mono);
        color: var(--text);
        min-width: 32px;
      }
      .sig-note {
        font-size: 12px;
        color: var(--text-dim);
        margin-top: 2px;
        font-style: italic;
        line-height: 1.5;
      }
      .span-event-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .span-event-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      .span-event-dot {
        width: 8px;
        height: 8px;
        min-width: 8px;
        border-radius: 2px;
        margin-top: 4px;
        transform: rotate(45deg);
      }
      .span-event-id {
        font-family: var(--mono);
        font-size: 11px;
        color: var(--text);
      }
      .span-event-desc {
        font-size: 12px;
        color: var(--text-dim);
        line-height: 1.4;
      }
    `}</style>
  );
}
