import { storyCatalog, type StoryEntry } from '../storyCatalog';

interface StorySelectorProps {
  currentSlug: string;
  onSelect: (slug: string) => void;
  loading?: boolean;
}

const grouped = {
  'hand-coded': storyCatalog.filter(s => s.collection === 'hand-coded'),
  'dubliners': storyCatalog.filter(s => s.collection === 'dubliners'),
  'mansfield': storyCatalog.filter(s => s.collection === 'mansfield'),
};

const groupLabels: Record<string, string> = {
  'hand-coded': 'Hand-Coded (Multi-Reading)',
  'dubliners': 'James Joyce — Dubliners',
  'mansfield': 'Katherine Mansfield',
};

export function StorySelector({ currentSlug, onSelect, loading }: StorySelectorProps) {
  return (
    <div className="story-selector">
      <select
        value={currentSlug}
        onChange={e => onSelect(e.target.value)}
        disabled={loading}
      >
        {Object.entries(grouped).map(([group, stories]) => (
          <optgroup key={group} label={groupLabels[group]}>
            {stories.map((s: StoryEntry) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {loading && <span className="story-loading-indicator">Loading...</span>}

      <style>{`
        .story-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .story-selector select {
          padding: 4px 8px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: var(--bg-surface);
          color: var(--text);
          font-size: 13px;
          cursor: pointer;
          max-width: 260px;
        }
        .story-selector select:hover {
          border-color: var(--text-dim);
        }
        .story-selector select:disabled {
          opacity: 0.5;
          cursor: wait;
        }
        .story-loading-indicator {
          font-size: 11px;
          color: var(--accent);
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
