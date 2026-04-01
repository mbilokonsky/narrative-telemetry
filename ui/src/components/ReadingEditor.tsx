import { useState, useCallback } from 'react'
import type { StoryModel, Reading, Significance, StoryEvent } from '../types'
import { significanceColor } from '../utils'

interface ReadingEditorProps {
  model: StoryModel;
  onSave: (name: string, reading: Reading) => void;
  onCancel: () => void;
}

function createEmptyReading(name: string, description: string, events: Record<string, StoryEvent>): Reading {
  const eventSignificance: Record<string, Significance> = {};
  for (const eventId of Object.keys(events)) {
    eventSignificance[eventId] = { significance: 0.3 };
  }

  return {
    name,
    description,
    themes: {},
    symbols: {},
    narrator: { id: 'narrator', name: 'Narrator', description: '', tags: [], type: 'narrator' },
    reader: { id: 'reader', name: 'Reader', description: '', tags: [], type: 'reader' },
    author: { id: 'author', name: 'Author', description: '', tags: [], type: 'author' },
    eventSignificance,
    entitySignificance: {},
    absentialSignificance: {},
    globalTension: [],
    spanAnnotations: {},
  } as unknown as Reading;
}

export function ReadingEditor({ model, onSave, onCancel }: ReadingEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'meta' | 'annotate'>('meta');
  const [reading, setReading] = useState<Reading | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const handleStartAnnotating = useCallback(() => {
    if (!name.trim()) return;
    const newReading = createEmptyReading(name.trim(), description.trim(), model.text.events);
    setReading(newReading);
    setStep('annotate');
  }, [name, description, model.text.events]);

  const handleSetSignificance = useCallback((eventId: string, significance: number) => {
    setReading(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        eventSignificance: {
          ...prev.eventSignificance,
          [eventId]: {
            ...prev.eventSignificance[eventId],
            significance,
          },
        },
      };
    });
  }, []);

  const handleSetNote = useCallback((eventId: string, note: string) => {
    setReading(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        eventSignificance: {
          ...prev.eventSignificance,
          [eventId]: {
            ...prev.eventSignificance[eventId],
            note: note || undefined,
          },
        },
      };
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!reading || !name.trim()) return;
    // Compute a basic tension curve from the scored events
    const events = Object.values(model.text.events).sort(
      (a, b) => a.timestamp.percentage - b.timestamp.percentage
    );
    const tensionPoints: Reading['globalTension'] = [];
    const windowSize = Math.max(1, Math.floor(events.length / 20));

    for (let i = 0; i < events.length; i += windowSize) {
      const window = events.slice(i, i + windowSize);
      const avgSig = window.reduce((sum, evt) => {
        return sum + (reading.eventSignificance[evt.id]?.significance ?? 0.3);
      }, 0) / window.length;
      const midEvt = window[Math.floor(window.length / 2)];
      tensionPoints.push({
        timestamp: { percentage: midEvt.timestamp.percentage },
        value: avgSig,
      });
    }

    const finalReading = { ...reading, globalTension: tensionPoints };
    onSave(name.trim(), finalReading);
  }, [reading, name, model.text.events, onSave]);

  const handleExportJson = useCallback(() => {
    if (!reading) return;
    const blob = new Blob([JSON.stringify(reading, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.trim().toLowerCase().replace(/\s+/g, '-')}-reading.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [reading, name]);

  if (step === 'meta') {
    return (
      <div className="reading-editor">
        <div className="re-header">
          <h2>Create a New Reading</h2>
          <p>Name your interpretive lens and describe its perspective.</p>
        </div>
        <div className="re-form">
          <div className="re-field">
            <label>Reading Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., psychoanalytic"
              className="re-input"
            />
          </div>
          <div className="re-field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the interpretive framework..."
              className="re-textarea"
              rows={4}
            />
          </div>
          <div className="re-actions">
            <button className="re-btn primary" onClick={handleStartAnnotating} disabled={!name.trim()}>
              Start Annotating
            </button>
            <button className="re-btn" onClick={onCancel}>Cancel</button>
          </div>
        </div>
        <ReadingEditorStyle />
      </div>
    );
  }

  // Annotation step
  if (!reading) return null;

  const sortedEvents = Object.values(model.text.events).sort(
    (a, b) => a.timestamp.percentage - b.timestamp.percentage
  );
  const selectedEvt = selectedEvent ? model.text.events[selectedEvent] : null;
  const selectedSig = selectedEvent ? reading.eventSignificance[selectedEvent] : null;

  const annotatedCount = Object.values(reading.eventSignificance).filter(
    s => s.significance !== 0.3 || s.note
  ).length;

  return (
    <div className="reading-editor annotating">
      <div className="re-top-bar">
        <div className="re-reading-name">{name}</div>
        <div className="re-progress">{annotatedCount}/{sortedEvents.length} annotated</div>
        <div className="re-top-actions">
          <button className="re-btn small" onClick={handleExportJson}>Export JSON</button>
          <button className="re-btn small primary" onClick={handleSave}>Save Reading</button>
          <button className="re-btn small" onClick={onCancel}>Cancel</button>
        </div>
      </div>

      <div className="re-layout">
        <div className="re-event-list">
          {sortedEvents.map(evt => {
            const sig = reading.eventSignificance[evt.id]?.significance ?? 0.3;
            const hasNote = !!reading.eventSignificance[evt.id]?.note;
            const isSelected = evt.id === selectedEvent;

            return (
              <div
                key={evt.id}
                className={`re-event-item ${isSelected ? 'selected' : ''} ${hasNote ? 'has-note' : ''}`}
                onClick={() => setSelectedEvent(evt.id)}
                style={{ borderLeft: `3px solid ${significanceColor(sig)}` }}
              >
                <div className="re-event-header">
                  <span className="re-event-pct">{evt.timestamp.percentage}%</span>
                  <span className="re-event-sig">{sig.toFixed(2)}</span>
                </div>
                <div className="re-event-desc">{evt.description}</div>
              </div>
            );
          })}
        </div>

        <div className="re-annotation-panel">
          {selectedEvt && selectedSig ? (
            <>
              <div className="re-ann-header">
                <h3>{selectedEvt.id}</h3>
                <div className="re-ann-type">{selectedEvt.type}</div>
              </div>
              <p className="re-ann-desc">{selectedEvt.description}</p>

              <div className="re-ann-field">
                <label>Significance ({selectedSig.significance.toFixed(2)})</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={selectedSig.significance}
                  onChange={e => handleSetSignificance(selectedEvt.id, parseFloat(e.target.value))}
                  className="re-slider"
                  style={{
                    background: `linear-gradient(to right, ${significanceColor(0)} 0%, ${significanceColor(0.5)} 50%, ${significanceColor(1)} 100%)`,
                  }}
                />
              </div>

              <div className="re-ann-field">
                <label>Note</label>
                <textarea
                  value={selectedSig.note ?? ''}
                  onChange={e => handleSetNote(selectedEvt.id, e.target.value)}
                  placeholder="Why is this event significant under this lens?"
                  className="re-textarea"
                  rows={3}
                />
              </div>

              <div className="re-ann-field">
                <label>Participants</label>
                <div className="re-participants">
                  {selectedEvt.participants.map(p => {
                    const entity = model.text.diegetic.characters[p];
                    return (
                      <span key={p} className="re-participant">{entity?.name ?? p}</span>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="re-ann-empty">
              Select an event to annotate
            </div>
          )}
        </div>
      </div>
      <ReadingEditorStyle />
    </div>
  );
}

function ReadingEditorStyle() {
  return (
    <style>{`
      .reading-editor {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 24px;
        height: 100%;
        overflow-y: auto;
      }
      .reading-editor.annotating {
        padding: 0;
        align-items: stretch;
      }
      .re-header {
        text-align: center;
        margin-bottom: 24px;
      }
      .re-header h2 {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-bright);
        margin: 0 0 8px;
      }
      .re-header p {
        color: var(--text-dim);
        font-size: 14px;
      }
      .re-form {
        width: 100%;
        max-width: 480px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .re-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .re-field label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-dim);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .re-input {
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--bg-surface);
        color: var(--text);
        font-size: 14px;
      }
      .re-textarea {
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--bg-surface);
        color: var(--text);
        font-size: 13px;
        line-height: 1.5;
        resize: vertical;
      }
      .re-input:focus,
      .re-textarea:focus {
        outline: none;
        border-color: var(--accent);
      }
      .re-actions {
        display: flex;
        gap: 8px;
      }
      .re-btn {
        padding: 8px 20px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: transparent;
        color: var(--text);
        font-size: 14px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .re-btn:hover {
        border-color: var(--text-dim);
      }
      .re-btn.primary {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
        font-weight: 600;
      }
      .re-btn.primary:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .re-btn.small {
        padding: 4px 12px;
        font-size: 12px;
      }
      .re-top-bar {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 8px 16px;
        background: var(--bg-surface);
        border-bottom: 1px solid var(--border);
        min-height: 44px;
      }
      .re-reading-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--accent);
        text-transform: capitalize;
      }
      .re-progress {
        font-size: 12px;
        color: var(--text-dim);
      }
      .re-top-actions {
        margin-left: auto;
        display: flex;
        gap: 6px;
      }
      .re-layout {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      .re-event-list {
        width: 380px;
        min-width: 380px;
        overflow-y: auto;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        border-right: 1px solid var(--border);
      }
      .re-event-item {
        padding: 8px 10px;
        border-radius: 3px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .re-event-item:hover {
        background: var(--bg-hover, rgba(255,255,255,0.03));
      }
      .re-event-item.selected {
        background: var(--accent-dim, rgba(123,140,222,0.12));
      }
      .re-event-item.has-note {
        position: relative;
      }
      .re-event-item.has-note::after {
        content: '';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--accent);
      }
      .re-event-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2px;
      }
      .re-event-pct {
        font-family: var(--mono);
        font-size: 10px;
        color: var(--text-dim);
      }
      .re-event-sig {
        font-family: var(--mono);
        font-size: 11px;
        color: var(--text);
      }
      .re-event-desc {
        font-size: 12px;
        color: var(--text);
        line-height: 1.4;
      }
      .re-annotation-panel {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
      }
      .re-ann-header h3 {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-bright);
        margin: 0 0 4px;
      }
      .re-ann-type {
        font-size: 11px;
        color: var(--text-dim);
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .re-ann-desc {
        font-size: 13px;
        color: var(--text);
        line-height: 1.6;
        margin-bottom: 16px;
      }
      .re-ann-field {
        margin-bottom: 14px;
      }
      .re-ann-field label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-dim);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 6px;
      }
      .re-slider {
        width: 100%;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        border-radius: 3px;
        outline: none;
        cursor: pointer;
      }
      .re-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--text-bright);
        cursor: pointer;
        border: 2px solid var(--bg);
      }
      .re-participants {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .re-participant {
        padding: 2px 8px;
        background: var(--bg-hover);
        border-radius: 3px;
        font-size: 12px;
        color: var(--text);
      }
      .re-ann-empty {
        color: var(--text-dim);
        font-size: 14px;
        padding: 40px 0;
        text-align: center;
      }
    `}</style>
  );
}
