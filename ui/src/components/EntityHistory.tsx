import { useMemo } from 'react'
import type { StoryModel, StoryEvent } from '../types'
import { significanceColor } from '../utils'

interface EntityHistoryProps {
  model: StoryModel;
  entityId: string;
  entityType: 'character' | 'setting' | 'item' | 'absential';
  activeReading: string;
  readingKeys: string[];
  onSelectEvent: (id: string) => void;
}

interface CausalFactor {
  eventId: string;
  role: string;
  description?: string;
}

interface HistoryEntry {
  percentage: number;
  eventId: string;
  event?: StoryEvent;
  source: 'diegetic' | 'interpretive';
  readingKey?: string;
  description: string;
  changeType?: string;
  factors?: CausalFactor[];
}

const CHANGE_TYPE_COLORS: Record<string, string> = {
  emotional: '#e8a845',
  epistemic: '#45a8e8',
  relational: '#b845e8',
  status: '#45e87b',
  atmospheric: '#9b59b6',
};

export function EntityHistory({
  model,
  entityId,
  entityType,
  activeReading,
  readingKeys,
  onSelectEvent,
}: EntityHistoryProps) {
  const history = useMemo(() => {
    const entries: HistoryEntry[] = [];

    // 1. Diegetic state transitions from entity stateHistory
    let entity: any = null;
    if (entityType === 'character') entity = model.text.diegetic.characters[entityId];
    else if (entityType === 'setting') entity = model.text.diegetic.settings[entityId];
    else if (entityType === 'item') entity = model.text.diegetic.items[entityId];
    else if (entityType === 'absential') entity = model.text.absentials[entityId];

    if (entity?.stateHistory) {
      for (const state of entity.stateHistory) {
        const eventId = state.causedBy?.eventId ?? state.data?.generatedBy;
        if (!eventId || eventId === 'init') continue;

        const evt = model.text.events[eventId];
        let description = '';
        const transDesc = state.data?.transitionDescription as string | undefined;
        if (entityType === 'absential') {
          const status = state.data?.status ?? '';
          const intensity = state.data?.intensity ?? 0;
          const urgency = state.data?.urgency ?? 0;
          description = `${status} (intensity: ${(intensity as number).toFixed(1)}, urgency: ${(urgency as number).toFixed(1)})`;
          if (transDesc) description = `${transDesc} — ${description}`;
        } else if (transDesc) {
          description = transDesc;
        } else if (evt) {
          description = evt.description;
        }

        // Extract causal factors if present
        const factors: CausalFactor[] = (state.causedBy?.factors ?? []).map((f: any) => ({
          eventId: f.eventId,
          role: f.role ?? 'contributing',
          description: f.description,
        }));

        entries.push({
          percentage: state.timestamp.percentage,
          eventId,
          event: evt,
          source: 'diegetic',
          description,
          factors: factors.length > 0 ? factors : undefined,
        });
      }
    }

    // 2. Interpretive state effects from readings
    for (const rk of readingKeys) {
      const reading = model.readings[rk];
      for (const [eventId, ann] of Object.entries(reading.eventSignificance)) {
        if (!ann.effects) continue;
        for (const effect of ann.effects) {
          if (effect.entityId === entityId) {
            const evt = model.text.events[eventId];
            entries.push({
              percentage: evt?.timestamp.percentage ?? 0,
              eventId,
              event: evt,
              source: 'interpretive',
              readingKey: rk,
              description: effect.description,
              changeType: (effect as any).stateChanges?.type ?? undefined,
            });
          }
        }
      }
    }

    // Sort by story position
    entries.sort((a, b) => a.percentage - b.percentage);
    return entries;
  }, [model, entityId, entityType, readingKeys]);

  if (history.length === 0) return null;

  const diegeticCount = history.filter(h => h.source === 'diegetic').length;
  const interpretiveCount = history.filter(h => h.source === 'interpretive').length;

  return (
    <div className="entity-history">
      <div className="eh-header">
        <div className="eh-label">State History</div>
        <div className="eh-counts">
          {diegeticCount > 0 && <span className="eh-count diegetic">{diegeticCount} textual</span>}
          {interpretiveCount > 0 && <span className="eh-count interpretive">{interpretiveCount} interpretive</span>}
        </div>
      </div>

      <div className="eh-timeline">
        {history.map((entry, i) => {
          const sig = entry.event
            ? (model.readings[activeReading]?.eventSignificance[entry.eventId]?.significance ?? 0)
            : 0;

          return (
            <div
              key={`${entry.eventId}-${entry.source}-${i}`}
              className={`eh-entry ${entry.source}`}
              onClick={() => onSelectEvent(entry.eventId)}
            >
              <div className="eh-entry-gutter">
                <div className="eh-entry-pct">{entry.percentage.toFixed(0)}%</div>
                <div className="eh-entry-line" />
              </div>
              <div className="eh-entry-content">
                <div className="eh-entry-header">
                  <span
                    className="eh-entry-source"
                    style={{
                      color: entry.source === 'diegetic' ? 'var(--text-dim)' : 'var(--accent)',
                      background: entry.source === 'diegetic' ? 'var(--bg-hover)' : 'var(--accent-dim)',
                    }}
                  >
                    {entry.source === 'diegetic' ? 'text' : entry.readingKey}
                  </span>
                  {entry.changeType && (
                    <span
                      className="eh-entry-type"
                      style={{ color: CHANGE_TYPE_COLORS[entry.changeType] ?? 'var(--text-dim)' }}
                    >
                      {entry.changeType}
                    </span>
                  )}
                  <span
                    className="eh-entry-sig"
                    style={{ color: significanceColor(sig) }}
                  >
                    {sig.toFixed(1)}
                  </span>
                </div>
                <div className="eh-entry-desc">{entry.description}</div>
                {entry.event && entry.source === 'interpretive' && (
                  <div className="eh-entry-event">{entry.event.description}</div>
                )}
                {entry.factors && entry.factors.length > 1 && (
                  <div className="eh-factors">
                    {entry.factors.map((f, fi) => {
                      const factorEvt = model.text.events[f.eventId];
                      return (
                        <div
                          key={fi}
                          className={`eh-factor ${f.role}`}
                          onClick={(e) => { e.stopPropagation(); onSelectEvent(f.eventId); }}
                        >
                          <span className="eh-factor-role">{f.role}</span>
                          <span className="eh-factor-desc">
                            {f.description ?? factorEvt?.description ?? f.eventId}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .entity-history { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }
        .eh-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .eh-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); font-weight: 600; }
        .eh-counts { display: flex; gap: 6px; }
        .eh-count { font-size: 10px; padding: 1px 6px; border-radius: 3px; }
        .eh-count.diegetic { color: var(--text-dim); background: var(--bg-hover); }
        .eh-count.interpretive { color: var(--accent); background: var(--accent-dim); }
        .eh-timeline { display: flex; flex-direction: column; }
        .eh-entry { display: flex; gap: 8px; cursor: pointer; padding: 2px 0; }
        .eh-entry:hover .eh-entry-desc { color: var(--text-bright); }
        .eh-entry-gutter { display: flex; flex-direction: column; align-items: center; width: 30px; min-width: 30px; }
        .eh-entry-pct { font-family: var(--mono); font-size: 9px; color: var(--text-dim); }
        .eh-entry-line { width: 1px; flex: 1; min-height: 8px; background: var(--border); }
        .eh-entry:last-child .eh-entry-line { display: none; }
        .eh-entry-content { flex: 1; padding-bottom: 8px; }
        .eh-entry-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
        .eh-entry-source { font-size: 9px; padding: 1px 5px; border-radius: 2px; font-weight: 600; text-transform: capitalize; }
        .eh-entry-type { font-size: 9px; color: var(--text-dim); font-style: italic; }
        .eh-entry-sig { font-family: var(--mono); font-size: 10px; margin-left: auto; }
        .eh-entry-desc { font-size: 12px; color: var(--text); line-height: 1.5; }
        .eh-entry-event { font-size: 11px; color: var(--text-dim); line-height: 1.4; margin-top: 2px; font-style: italic; }
        .eh-entry.interpretive { border-left: 2px dotted var(--accent); padding-left: 6px; margin-left: -8px; }
        .eh-factors { margin-top: 4px; display: flex; flex-direction: column; gap: 2px; padding-left: 4px; border-left: 1px solid var(--border); }
        .eh-factor { display: flex; gap: 4px; align-items: baseline; font-size: 11px; cursor: pointer; padding: 1px 0; }
        .eh-factor:hover .eh-factor-desc { color: var(--text-bright); }
        .eh-factor-role { font-size: 9px; font-weight: 600; text-transform: uppercase; min-width: 65px; flex-shrink: 0; }
        .eh-factor.primary .eh-factor-role { color: var(--accent); }
        .eh-factor.contributing .eh-factor-role { color: #45a8e8; }
        .eh-factor.necessary .eh-factor-role { color: #45e87b; }
        .eh-factor.catalytic .eh-factor-role { color: #e8a845; }
        .eh-factor.enabling .eh-factor-role { color: #9b59b6; }
        .eh-factor.opposing .eh-factor-role { color: #e84545; }
        .eh-factor.complicating .eh-factor-role { color: #e86445; }
        .eh-factor-desc { color: var(--text-dim); line-height: 1.4; }
      `}</style>
    </div>
  );
}
