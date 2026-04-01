import { useState, useEffect, useCallback } from 'react'
import './App.css'
import type { StoryModel, Selection } from './types'
import { ReadingSelector } from './components/ReadingSelector'
import { SpanWaterfall } from './components/SpanWaterfall'
import { TextView } from './components/TextView'
import { DetailInspector } from './components/DetailInspector'

function App() {
  const [model, setModel] = useState<StoryModel | null>(null)
  const [text, setText] = useState<string[]>([])
  const [activeReading, setActiveReading] = useState<string>('')
  const [compareMode, setCompareMode] = useState(false)
  const [selection, setSelection] = useState<Selection>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/data/araby.json').then(r => r.json()),
      fetch('/data/araby.txt').then(r => r.text()),
    ])
      .then(([json, txt]: [StoryModel, string]) => {
        setModel(json)
        setText(txt.split('\n'))
        const readingKeys = Object.keys(json.readings)
        if (readingKeys.length > 0) {
          setActiveReading(readingKeys[0])
        }
      })
      .catch(e => setError(String(e)))
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

  if (error) {
    return <div className="loading">Error: {error}</div>
  }
  if (!model || text.length === 0) {
    return <div className="loading">Loading...</div>
  }

  const readingKeys = Object.keys(model.readings)

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title">
          Narrative Telemetry
          <span className="story-title">
            {model.text.title} — {model.text.author}
          </span>
        </div>
        <ReadingSelector
          readings={readingKeys}
          active={activeReading}
          onSelect={setActiveReading}
          compareMode={compareMode}
          onToggleCompare={() => setCompareMode(c => !c)}
        />
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
        </div>
        <div className="panel-center">
          <TextView
            lines={text}
            events={model.text.events}
            reading={model.readings[activeReading]}
            compareReading={compareMode ? model.readings[readingKeys.find(k => k !== activeReading) ?? activeReading] : undefined}
            selection={selection}
            onSelectEvent={handleSelectEvent}
          />
        </div>
        <div className="panel-right">
          <DetailInspector
            model={model}
            selection={selection}
            activeReading={activeReading}
            compareMode={compareMode}
            readingKeys={readingKeys}
          />
        </div>
      </div>
    </>
  )
}

export default App
