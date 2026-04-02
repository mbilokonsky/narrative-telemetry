import { useState, useEffect, useCallback } from 'react'
import './App.css'
import type { StoryModel, Selection } from './types'
import { storyCatalog, getStoryBySlug } from './storyCatalog'
import { StorySelector } from './components/StorySelector'
import { ReadingSelector } from './components/ReadingSelector'
import { SpanWaterfall } from './components/SpanWaterfall'
import { TextView } from './components/TextView'
import { SplitTextView } from './components/SplitTextView'
import { AbsentialList } from './components/AbsentialList'
import { AnalyzeView } from './components/AnalyzeView'
import { ReadingEditor } from './components/ReadingEditor'
import { DetailInspector } from './components/DetailInspector'

function App() {
  const [currentSlug, setCurrentSlug] = useState(storyCatalog[0].slug)
  const [model, setModel] = useState<StoryModel | null>(null)
  const [text, setText] = useState<string[]>([])
  const [activeReading, setActiveReading] = useState<string>('')
  const [compareMode, setCompareMode] = useState(false)
  const [selection, setSelection] = useState<Selection>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzeMode, setAnalyzeMode] = useState(false)
  const [editingReading, setEditingReading] = useState(false)

  const loadStory = useCallback((slug: string) => {
    const entry = getStoryBySlug(slug)
    if (!entry) {
      setError(`Story "${slug}" not found in catalog`)
      return
    }

    setLoading(true)
    setError(null)
    setSelection(null)

    const fetches: Promise<any>[] = [
      fetch(entry.dataPath).then(r => {
        if (!r.ok) throw new Error(`Failed to load ${entry.dataPath}: ${r.status}`)
        return r.json()
      }),
    ]

    if (entry.textPath) {
      fetches.push(
        fetch(entry.textPath)
          .then(r => r.ok ? r.text() : '')
          .catch(() => '')
      )
    } else {
      fetches.push(Promise.resolve(''))
    }

    Promise.all(fetches)
      .then(([json, txt]) => {
        setModel(json)
        setText(txt ? txt.split('\n') : [])
        const readingKeys = Object.keys(json.readings)
        if (readingKeys.length > 0) {
          setActiveReading(readingKeys[0])
        }
        setCompareMode(false)
        setLoading(false)
      })
      .catch(e => {
        setError(String(e))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadStory(currentSlug)
  }, [currentSlug, loadStory])

  const handleSelectStory = useCallback((slug: string) => {
    setCurrentSlug(slug)
  }, [])

  const handleSelectEvent = useCallback((eventId: string) => {
    setSelection(prev =>
      prev?.type === 'event' && prev.id === eventId ? null : { type: 'event', id: eventId }
    )
  }, [])

  const handleSelectSpan = useCallback((spanId: string) => {
    setSelection(prev =>
      prev?.type === 'span' && prev.id === spanId ? null : { type: 'span', id: spanId }
    )
  }, [])

  const handleSelectEntity = useCallback((entityId: string) => {
    setSelection(prev =>
      prev?.type === 'entity' && prev.entityId === entityId ? null : { type: 'entity', entityId }
    )
  }, [])

  const handleAnalysisComplete = useCallback((resultModel: StoryModel, sourceText: string) => {
    setModel(resultModel)
    setText(sourceText.split('\n'))
    const readingKeys = Object.keys(resultModel.readings)
    if (readingKeys.length > 0) setActiveReading(readingKeys[0])
    setCompareMode(false)
    setSelection(null)
    setAnalyzeMode(false)
    setCurrentSlug('')
  }, [])

  const handleSaveReading = useCallback((readingName: string, reading: import('./types').Reading) => {
    setModel(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        readings: { ...prev.readings, [readingName]: reading },
      };
    });
    setActiveReading(readingName);
    setEditingReading(false);
  }, [])

  const handleSelectAbsential = useCallback((absentialId: string, addToCompare?: boolean) => {
    setSelection(prev => {
      if (addToCompare && prev?.type === 'absential') {
        // Shift-click: toggle this absential in the compare set
        const existing = prev.compareIds ?? []
        const isAlreadyCompared = existing.includes(absentialId)
        if (absentialId === prev.absentialId) return prev // can't remove primary
        const newCompare = isAlreadyCompared
          ? existing.filter(id => id !== absentialId)
          : [...existing, absentialId]
        return { ...prev, compareIds: newCompare.length > 0 ? newCompare : undefined }
      }
      // Normal click: select as primary, clear comparisons
      if (prev?.type === 'absential' && prev.absentialId === absentialId && !prev.compareIds?.length) {
        return null
      }
      return { type: 'absential', absentialId }
    })
  }, [])

  if (editingReading && model) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ReadingEditor
          model={model}
          onSave={handleSaveReading}
          onCancel={() => setEditingReading(false)}
        />
      </div>
    )
  }

  if (analyzeMode) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="top-bar">
          <div className="top-bar-left">
            <div className="top-bar-title">Narrative Telemetry</div>
          </div>
          <button className="analyze-toggle" onClick={() => setAnalyzeMode(false)}>
            Back to Explorer
          </button>
        </div>
        <AnalyzeView
          onAnalysisComplete={handleAnalysisComplete}
          onCancel={() => setAnalyzeMode(false)}
        />
      </div>
    )
  }

  if (error) {
    return <div className="loading">Error: {error}</div>
  }
  if (!model || loading) {
    return <div className="loading">Loading...</div>
  }

  const readingKeys = Object.keys(model.readings)

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-left">
          <div className="top-bar-title">
            Narrative Telemetry
          </div>
          <StorySelector
            currentSlug={currentSlug}
            onSelect={handleSelectStory}
            loading={loading}
          />
        </div>
        <div className="top-bar-meta">
          <span className="story-meta">{model.text.title} — {model.text.author}</span>
          <ReadingSelector
            readings={readingKeys}
            active={activeReading}
            onSelect={setActiveReading}
            compareMode={compareMode}
            onToggleCompare={readingKeys.length >= 2 ? () => setCompareMode(c => !c) : undefined}
          />
          <button className="analyze-toggle" onClick={() => setEditingReading(true)}>
            + Reading
          </button>
          <button className="analyze-toggle" onClick={() => setAnalyzeMode(true)}>
            + Analyze
          </button>
        </div>
      </div>
      <div className="main-layout">
        <div className="panel-left">
          <SpanWaterfall
            rootSpan={model.text.rootSpan}
            events={model.text.events}
            reading={model.readings[activeReading]}
            selection={selection}
            onSelectEvent={handleSelectEvent}
            onSelectSpan={handleSelectSpan}
          />
          {Object.keys(model.text.absentials).length > 0 && (
            <AbsentialList
              absentials={model.text.absentials}
              reading={model.readings[activeReading]}
              selection={selection}
              onSelect={handleSelectAbsential}
            />
          )}
        </div>
        <div className="panel-center">
          {text.length > 0 ? (
            compareMode && readingKeys.length >= 2 ? (
              <SplitTextView
                lines={text}
                events={model.text.events}
                entities={model.text.diegetic}
                readingA={model.readings[activeReading]}
                readingB={model.readings[readingKeys.find(k => k !== activeReading) ?? activeReading]}
                selection={selection}
                onSelectEvent={handleSelectEvent}
              />
            ) : (
              <TextView
                lines={text}
                events={model.text.events}
                entities={model.text.diegetic}
                reading={model.readings[activeReading]}
                selection={selection}
                onSelectEvent={handleSelectEvent}
                onSelectEntity={handleSelectEntity}
                textAnnotations={model.text.annotations}
              />
            )
          ) : (
            <EventListView
              events={model.text.events}
              reading={model.readings[activeReading]}
              selection={selection}
              onSelectEvent={handleSelectEvent}
              entities={model.text.diegetic}
            />
          )}
        </div>
        <div className="panel-right">
          <DetailInspector
            model={model}
            selection={selection}
            activeReading={activeReading}
            compareMode={compareMode}
            readingKeys={readingKeys}
            onSelectEvent={handleSelectEvent}
            onSelectEntity={handleSelectEntity}
          />
        </div>
      </div>
    </>
  )
}

/** Fallback view when source text is not available — shows events chronologically. */
function EventListView({
  events,
  reading,
  selection,
  onSelectEvent,
  entities,
}: {
  events: Record<string, import('./types').StoryEvent>;
  reading: import('./types').Reading;
  selection: Selection;
  onSelectEvent: (id: string) => void;
  entities: { characters: Record<string, import('./types').Character> };
}) {
  const sorted = Object.values(events).sort(
    (a, b) => a.timestamp.percentage - b.timestamp.percentage
  )

  const selectedId = selection?.type === 'event' ? selection.id : null

  return (
    <div className="event-list-view">
      <div className="event-list-header">
        Events (source text not available)
      </div>
      <div className="event-list-content">
        {sorted.map(evt => {
          const sig = reading.eventSignificance[evt.id]?.significance ?? 0
          const note = reading.eventSignificance[evt.id]?.note
          const isSelected = evt.id === selectedId
          const participants = evt.participants
            .map(p => entities.characters[p]?.name ?? p)
            .join(', ')

          return (
            <div
              key={evt.id}
              className={`event-list-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectEvent(evt.id)}
              style={{
                borderLeft: `3px solid hsl(${40 + sig * 280}, 80%, ${40 + sig * 30}%)`,
              }}
            >
              <div className="event-list-item-header">
                <span className="event-list-type">{evt.type}</span>
                <span className="event-list-sig">{(sig * 100).toFixed(0)}%</span>
              </div>
              <div className="event-list-desc">{evt.description}</div>
              {participants && (
                <div className="event-list-participants">{participants}</div>
              )}
              {note && <div className="event-list-note">{note}</div>}
            </div>
          )
        })}
      </div>

      <style>{`
        .event-list-view {
          height: 100%;
          overflow-y: auto;
          padding: 16px;
        }
        .event-list-header {
          font-size: 12px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }
        .event-list-content {
          max-width: 700px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .event-list-item {
          padding: 10px 12px;
          background: var(--bg-surface);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .event-list-item:hover {
          filter: brightness(1.15);
        }
        .event-list-item.selected {
          outline: 1px solid var(--accent);
          background: var(--bg-surface);
          filter: brightness(1.2);
        }
        .event-list-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .event-list-type {
          font-size: 10px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .event-list-sig {
          font-size: 11px;
          color: var(--accent);
          font-family: var(--mono);
        }
        .event-list-desc {
          font-size: 13px;
          color: var(--text);
          line-height: 1.5;
        }
        .event-list-participants {
          font-size: 11px;
          color: var(--text-dim);
          margin-top: 4px;
        }
        .event-list-note {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
          font-style: italic;
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}

export default App
