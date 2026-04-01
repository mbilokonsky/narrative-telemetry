interface ReadingSelectorProps {
  readings: string[];
  active: string;
  onSelect: (key: string) => void;
  compareMode: boolean;
  onToggleCompare: () => void;
}

export function ReadingSelector({
  readings,
  active,
  onSelect,
  compareMode,
  onToggleCompare,
}: ReadingSelectorProps) {
  return (
    <div className="reading-selector">
      <div className="reading-tabs">
        {readings.map(key => (
          <button
            key={key}
            className={`reading-tab ${key === active ? 'active' : ''}`}
            onClick={() => onSelect(key)}
          >
            {key}
          </button>
        ))}
      </div>
      <button
        className={`compare-toggle ${compareMode ? 'active' : ''}`}
        onClick={onToggleCompare}
      >
        Compare
      </button>

      <style>{`
        .reading-selector {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .reading-tabs {
          display: flex;
          gap: 4px;
        }
        .reading-tab {
          padding: 4px 12px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: transparent;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 13px;
          text-transform: capitalize;
          transition: all 0.15s;
        }
        .reading-tab:hover {
          color: var(--text);
          border-color: var(--text-dim);
        }
        .reading-tab.active {
          background: var(--accent-dim);
          color: var(--accent);
          border-color: var(--accent);
        }
        .compare-toggle {
          padding: 4px 10px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: transparent;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 12px;
          transition: all 0.15s;
        }
        .compare-toggle:hover {
          color: var(--text);
          border-color: var(--text-dim);
        }
        .compare-toggle.active {
          background: var(--accent-dim);
          color: var(--accent);
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
