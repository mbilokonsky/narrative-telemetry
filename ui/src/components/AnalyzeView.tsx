import { useState, useCallback } from 'react'
import type { StoryModel } from '../types'

interface AnalyzeViewProps {
  onAnalysisComplete: (model: StoryModel, text: string) => void;
  onCancel: () => void;
}

type AnalysisStage = 'idle' | 'extracting' | 'interpreting' | 'complete' | 'error';

const API_URL = 'http://localhost:3001';

const SAMPLE_TEXT = `She sat at the window watching the evening invade the avenue. Her head was leaned against the window curtains, and in her nostrils was the odour of dusty cretonne. She was tired.

Few people passed. The man out of the last house passed on his way home; she heard his footsteps clacking along the concrete pavement and afterwards crunching on the cinder path before the new red houses.`;

export function AnalyzeView({ onAnalysisComplete, onCancel }: AnalyzeViewProps) {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [lens, setLens] = useState('formalist')
  const [stage, setStage] = useState<AnalysisStage>('idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return

    setStage('extracting')
    setMessage('Connecting to analysis server...')
    setError('')

    try {
      // First check server health
      const healthRes = await fetch(`${API_URL}/api/health`).catch(() => null)
      if (!healthRes || !healthRes.ok) {
        setStage('error')
        setError('Cannot connect to analysis server. Start it with: npm run server')
        return
      }

      const health = await healthRes.json()
      if (!health.hasApiKey) {
        setStage('error')
        setError('Server has no ANTHROPIC_API_KEY configured. Start with: ANTHROPIC_API_KEY=... npm run server')
        return
      }

      setMessage('Extracting narrative structure...')

      const response = await fetch(`${API_URL}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          title: title.trim() || undefined,
          lenses: [lens],
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Server error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      // Read SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let resultModel: StoryModel | null = null

      if (reader) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6)
            if (payload === '[DONE]') continue

            try {
              const event = JSON.parse(payload)
              if (event.type === 'progress') {
                setStage(event.stage === 'complete' ? 'complete' : 'extracting')
                setMessage(event.message)
              } else if (event.type === 'result') {
                resultModel = event.model
              } else if (event.type === 'error') {
                throw new Error(event.message)
              }
            } catch (e: any) {
              if (e.message && !e.message.includes('JSON')) throw e
            }
          }
        }
      }

      if (resultModel) {
        setStage('complete')
        setMessage('Analysis complete! Loading results...')
        // Small delay for the user to see the "complete" state
        setTimeout(() => {
          onAnalysisComplete(resultModel!, text.trim())
        }, 500)
      } else {
        throw new Error('No result received from server')
      }
    } catch (err: any) {
      setStage('error')
      setError(err.message ?? 'Unknown error')
    }
  }, [text, title, lens, onAnalysisComplete])

  return (
    <div className="analyze-view">
      <div className="analyze-header">
        <h2>Analyze a Text</h2>
        <p>Paste any narrative text and watch it decompose into structure.</p>
      </div>

      {stage === 'idle' || stage === 'error' ? (
        <div className="analyze-form">
          <div className="analyze-field">
            <label>Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Story title"
              className="analyze-input"
            />
          </div>

          <div className="analyze-field">
            <label>Interpretive Lens</label>
            <select
              value={lens}
              onChange={e => setLens(e.target.value)}
              className="analyze-select"
            >
              <option value="formalist">Formalist</option>
              <option value="postcolonial">Postcolonial</option>
              <option value="psychoanalytic">Psychoanalytic</option>
              <option value="feminist">Feminist</option>
              <option value="marxist">Marxist</option>
              <option value="new historicist">New Historicist</option>
            </select>
          </div>

          <div className="analyze-field">
            <label>Narrative Text</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your story here..."
              className="analyze-textarea"
              rows={16}
            />
            <div className="analyze-char-count">
              {text.length.toLocaleString()} characters
              {text.length > 0 && text.length < 200 && (
                <span className="analyze-warning"> (short text may produce sparse results)</span>
              )}
            </div>
          </div>

          {error && (
            <div className="analyze-error">{error}</div>
          )}

          <div className="analyze-actions">
            <button
              className="analyze-btn primary"
              onClick={handleAnalyze}
              disabled={text.trim().length < 50}
            >
              Analyze
            </button>
            <button className="analyze-btn" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="analyze-btn sample"
              onClick={() => { setText(SAMPLE_TEXT); setTitle('Eveline (excerpt)') }}
            >
              Load Sample
            </button>
          </div>
        </div>
      ) : (
        <div className="analyze-progress">
          <div className="analyze-spinner" />
          <div className="analyze-progress-stage">{stage}</div>
          <div className="analyze-progress-message">{message}</div>
        </div>
      )}

      <style>{`
        .analyze-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 24px;
          height: 100%;
          overflow-y: auto;
        }
        .analyze-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .analyze-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-bright);
          margin: 0 0 8px;
        }
        .analyze-header p {
          color: var(--text-dim);
          font-size: 14px;
        }
        .analyze-form {
          width: 100%;
          max-width: 640px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .analyze-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .analyze-field label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .analyze-input,
        .analyze-select {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: var(--bg-surface);
          color: var(--text);
          font-size: 14px;
        }
        .analyze-input:focus,
        .analyze-select:focus,
        .analyze-textarea:focus {
          outline: none;
          border-color: var(--accent);
        }
        .analyze-textarea {
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: var(--bg-surface);
          color: var(--text);
          font-size: 13px;
          font-family: var(--mono);
          line-height: 1.6;
          resize: vertical;
          min-height: 200px;
        }
        .analyze-char-count {
          font-size: 11px;
          color: var(--text-dim);
          text-align: right;
        }
        .analyze-warning {
          color: #e8a845;
        }
        .analyze-error {
          padding: 10px 12px;
          background: rgba(232, 69, 69, 0.15);
          border: 1px solid rgba(232, 69, 69, 0.3);
          border-radius: 4px;
          color: #e84545;
          font-size: 13px;
          line-height: 1.5;
        }
        .analyze-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .analyze-btn {
          padding: 8px 20px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: transparent;
          color: var(--text);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .analyze-btn:hover {
          border-color: var(--text-dim);
          color: var(--text-bright);
        }
        .analyze-btn.primary {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
          font-weight: 600;
        }
        .analyze-btn.primary:hover {
          filter: brightness(1.1);
        }
        .analyze-btn.primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          filter: none;
        }
        .analyze-btn.sample {
          margin-left: auto;
          font-size: 12px;
          color: var(--text-dim);
        }
        .analyze-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 60px 24px;
        }
        .analyze-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .analyze-progress-stage {
          font-size: 14px;
          font-weight: 600;
          color: var(--accent);
          text-transform: capitalize;
        }
        .analyze-progress-message {
          font-size: 13px;
          color: var(--text-dim);
        }
      `}</style>
    </div>
  )
}
