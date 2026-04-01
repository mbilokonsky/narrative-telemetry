import type { Absential, Reading, Selection } from '../types'
import { significanceColor } from '../utils'

interface AbsentialListProps {
  absentials: Record<string, Absential>;
  reading: Reading;
  selection: Selection;
  onSelect: (id: string) => void;
}

export function AbsentialList({ absentials, reading, selection, onSelect }: AbsentialListProps) {
  const entries = Object.entries(absentials)
  if (entries.length === 0) return null

  const selectedId = selection?.type === 'absential' ? selection.absentialId : null

  return (
    <div className="absential-list">
      <div className="absential-list-header">Absentials</div>
      {entries.map(([id, abs]) => {
        const sig = reading.absentialSignificance[id]?.significance ?? 0
        const isSelected = id === selectedId

        return (
          <div
            key={id}
            className={`absential-list-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(id)}
          >
            <div
              className="absential-list-indicator"
              style={{ background: significanceColor(sig) }}
            />
            <div className="absential-list-content">
              <div className="absential-list-name">{abs.name}</div>
              <div className="absential-list-type">
                {(abs.stateHistory[0]?.data?.type as string) ?? 'desire'}
              </div>
            </div>
            <div className="absential-list-sig">{sig.toFixed(1)}</div>
          </div>
        )
      })}

      <style>{`
        .absential-list {
          border-top: 1px solid var(--border);
          padding: 8px 0;
        }
        .absential-list-header {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dim);
          font-weight: 600;
          padding: 4px 12px 8px;
        }
        .absential-list-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .absential-list-item:hover {
          background: var(--bg-hover, rgba(255,255,255,0.05));
        }
        .absential-list-item.selected {
          background: var(--accent-dim, rgba(123,140,222,0.15));
          border-left: 2px solid var(--accent);
          padding-left: 10px;
        }
        .absential-list-indicator {
          width: 6px;
          height: 6px;
          min-width: 6px;
          border-radius: 50%;
        }
        .absential-list-content {
          flex: 1;
          min-width: 0;
        }
        .absential-list-name {
          font-size: 12px;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .absential-list-type {
          font-size: 10px;
          color: var(--text-dim);
          text-transform: capitalize;
        }
        .absential-list-sig {
          font-size: 11px;
          font-family: var(--mono);
          color: var(--text-dim);
          min-width: 24px;
          text-align: right;
        }
      `}</style>
    </div>
  )
}
