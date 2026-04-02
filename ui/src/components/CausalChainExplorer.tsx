import { useMemo, useState } from 'react'
import type { StoryModel, StoryEvent, Reading } from '../types'
import { significanceColor } from '../utils'

interface CausalChainExplorerProps {
  model: StoryModel;
  eventId: string;
  activeReading: string;
  readingKeys: string[];
  onSelectEvent: (id: string) => void;
}

interface ChainNode {
  eventId: string;
  event: StoryEvent;
  depth: number;
  source: 'diegetic' | 'interpretive';
  readingKey?: string;
}

/**
 * Trace the diegetic chain backward via precedingEvent.
 */
function traceDiegeticChain(
  startId: string,
  events: Record<string, StoryEvent>,
  direction: 'backward' | 'forward',
): ChainNode[] {
  const chain: ChainNode[] = [];
  const visited = new Set<string>();

  if (direction === 'backward') {
    let current = startId;
    let depth = 0;
    while (current && !visited.has(current)) {
      visited.add(current);
      const evt = events[current];
      if (!evt) break;
      const prev = evt.precedingEvent;
      if (!prev || !events[prev]) break;
      depth--;
      chain.unshift({ eventId: prev, event: events[prev], depth, source: 'diegetic' });
      current = prev;
    }
  } else {
    // Forward: find events whose precedingEvent is this one
    let currentSet = new Set([startId]);
    let depth = 0;
    while (currentSet.size > 0) {
      const nextSet = new Set<string>();
      for (const [eid, evt] of Object.entries(events)) {
        if (evt.precedingEvent && currentSet.has(evt.precedingEvent) && !visited.has(eid)) {
          depth++;
          chain.push({ eventId: eid, event: evt, depth, source: 'diegetic' });
          visited.add(eid);
          nextSet.add(eid);
        }
      }
      currentSet = nextSet;
      if (chain.length > 20) break;
    }
  }

  return chain;
}

/**
 * Trace interpretive causal chains from reading annotations.
 */
function traceInterpretiveChain(
  startId: string,
  reading: Reading,
  readingKey: string,
  events: Record<string, StoryEvent>,
  direction: 'backward' | 'forward',
): ChainNode[] {
  const chain: ChainNode[] = [];
  const visited = new Set<string>();

  if (direction === 'backward') {
    const causes = reading.eventSignificance[startId]?.causes;
    if (causes) {
      for (const causeId of causes) {
        if (events[causeId] && !visited.has(causeId)) {
          visited.add(causeId);
          chain.push({ eventId: causeId, event: events[causeId], depth: -1, source: 'interpretive', readingKey });
        }
      }
    }
  } else {
    const sig = reading.eventSignificance[startId];
    if (sig?.effects) {
      for (const eff of sig.effects) {
        const effId = eff.entityId;
        if (events[effId] && !visited.has(effId)) {
          visited.add(effId);
          chain.push({ eventId: effId, event: events[effId], depth: 1, source: 'interpretive', readingKey });
        }
      }
    }
    // Also find events that list startId in their causes
    for (const [eid, ann] of Object.entries(reading.eventSignificance)) {
      if (ann.causes?.includes(startId) && events[eid] && !visited.has(eid)) {
        visited.add(eid);
        chain.push({ eventId: eid, event: events[eid], depth: 1, source: 'interpretive', readingKey });
      }
    }
  }

  return chain;
}

function resolveParticipant(id: string, model: StoryModel): string {
  return model.text.diegetic.characters[id]?.name
    ?? model.text.diegetic.settings[id]?.name
    ?? model.text.diegetic.items[id]?.name
    ?? id;
}

export function CausalChainExplorer({
  model,
  eventId,
  activeReading,
  readingKeys,
  onSelectEvent,
}: CausalChainExplorerProps) {
  const [showForward, setShowForward] = useState(true);
  const [showBackward, setShowBackward] = useState(true);

  const event = model.text.events[eventId];
  if (!event) return null;

  const backwardDiegetic = useMemo(
    () => traceDiegeticChain(eventId, model.text.events, 'backward'),
    [eventId, model.text.events]
  );
  const forwardDiegetic = useMemo(
    () => traceDiegeticChain(eventId, model.text.events, 'forward'),
    [eventId, model.text.events]
  );

  // Interpretive chains from all readings
  const interpretiveChains = useMemo(() => {
    const chains: { readingKey: string; backward: ChainNode[]; forward: ChainNode[] }[] = [];
    for (const rk of readingKeys) {
      const reading = model.readings[rk];
      const backward = traceInterpretiveChain(eventId, reading, rk, model.text.events, 'backward');
      const forward = traceInterpretiveChain(eventId, reading, rk, model.text.events, 'forward');
      if (backward.length > 0 || forward.length > 0) {
        chains.push({ readingKey: rk, backward, forward });
      }
    }
    return chains;
  }, [eventId, model.readings, readingKeys, model.text.events]);

  const hasDiegeticChain = backwardDiegetic.length > 0 || forwardDiegetic.length > 0;
  const hasInterpretiveChain = interpretiveChains.length > 0;

  function renderChainNode(node: ChainNode, reading?: Reading) {
    const sig = reading
      ? reading.eventSignificance[node.eventId]?.significance ?? 0
      : model.readings[activeReading]?.eventSignificance[node.eventId]?.significance ?? 0;

    return (
      <div
        key={node.eventId}
        className="cc-node"
        onClick={() => onSelectEvent(node.eventId)}
        style={{ borderLeft: `3px solid ${significanceColor(sig)}` }}
      >
        <div className="cc-node-header">
          <span className="cc-node-pct">{node.event.timestamp.percentage.toFixed(0)}%</span>
          <span className="cc-node-id">{node.eventId}</span>
          {node.source === 'interpretive' && (
            <span className="cc-node-reading">{node.readingKey}</span>
          )}
        </div>
        <div className="cc-node-desc">{node.event.description}</div>
        <div className="cc-node-participants">
          {node.event.participants.map(p => resolveParticipant(p, model)).join(', ')}
        </div>
      </div>
    );
  }

  return (
    <div className="causal-chain-explorer">
      <div className="cc-header">
        <div className="cc-label">Causal Chain</div>
        <div className="cc-toggles">
          <button
            className={`cc-toggle ${showBackward ? 'active' : ''}`}
            onClick={() => setShowBackward(v => !v)}
          >
            Causes
          </button>
          <button
            className={`cc-toggle ${showForward ? 'active' : ''}`}
            onClick={() => setShowForward(v => !v)}
          >
            Effects
          </button>
        </div>
      </div>

      {/* Diegetic chain */}
      {hasDiegeticChain && (
        <div className="cc-section">
          <div className="cc-section-label">Narrative Sequence (diegetic)</div>
          {showBackward && backwardDiegetic.length > 0 && (
            <div className="cc-chain">
              <div className="cc-direction">what came before</div>
              {backwardDiegetic.slice(-5).map(node => renderChainNode(node))}
            </div>
          )}

          <div className="cc-current" style={{ borderLeft: `3px solid ${significanceColor(
            model.readings[activeReading]?.eventSignificance[eventId]?.significance ?? 0
          )}` }}>
            <div className="cc-current-label">current event</div>
            <div className="cc-node-desc">{event.description}</div>
          </div>

          {showForward && forwardDiegetic.length > 0 && (
            <div className="cc-chain">
              <div className="cc-direction">what comes after</div>
              {forwardDiegetic.slice(0, 5).map(node => renderChainNode(node))}
            </div>
          )}
        </div>
      )}

      {/* Interpretive chains */}
      {hasInterpretiveChain && (
        <div className="cc-section">
          <div className="cc-section-label">Interpretive Causality (per-reading)</div>
          {interpretiveChains.map(chain => (
            <div key={chain.readingKey} className="cc-reading-chain">
              <div className="cc-reading-name">{chain.readingKey}</div>
              {showBackward && chain.backward.length > 0 && (
                <div className="cc-chain">
                  <div className="cc-direction">caused by</div>
                  {chain.backward.map(node => renderChainNode(node, model.readings[chain.readingKey]))}
                </div>
              )}
              {showForward && chain.forward.length > 0 && (
                <div className="cc-chain">
                  <div className="cc-direction">causes</div>
                  {chain.forward.map(node => renderChainNode(node, model.readings[chain.readingKey]))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!hasDiegeticChain && !hasInterpretiveChain && (
        <div className="cc-empty">No causal chain data available for this event.</div>
      )}

      <style>{`
        .causal-chain-explorer { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }
        .cc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .cc-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); font-weight: 600; }
        .cc-toggles { display: flex; gap: 4px; }
        .cc-toggle { padding: 2px 8px; border: 1px solid var(--border); border-radius: 3px; background: none; color: var(--text-dim); font-size: 10px; cursor: pointer; }
        .cc-toggle.active { background: var(--accent-dim); color: var(--accent); border-color: var(--accent); }
        .cc-section { margin-bottom: 12px; }
        .cc-section-label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; font-weight: 600; }
        .cc-chain { display: flex; flex-direction: column; gap: 2px; margin: 4px 0; }
        .cc-direction { font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 0 2px 8px; }
        .cc-node { padding: 6px 8px; border-radius: 3px; cursor: pointer; transition: background 0.15s; background: var(--bg); }
        .cc-node:hover { background: var(--bg-hover); }
        .cc-node-header { display: flex; gap: 6px; align-items: center; margin-bottom: 2px; }
        .cc-node-pct { font-family: var(--mono); font-size: 10px; color: var(--text-dim); }
        .cc-node-id { font-family: var(--mono); font-size: 10px; color: var(--text-dim); }
        .cc-node-reading { font-size: 9px; color: var(--accent); background: var(--accent-dim); padding: 1px 5px; border-radius: 2px; margin-left: auto; }
        .cc-node-desc { font-size: 12px; color: var(--text); line-height: 1.4; }
        .cc-node-participants { font-size: 10px; color: var(--text-dim); margin-top: 2px; }
        .cc-current { padding: 8px; border-radius: 3px; background: var(--accent-dim); margin: 4px 0; }
        .cc-current-label { font-size: 9px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; font-weight: 600; }
        .cc-current .cc-node-desc { color: var(--text-bright); }
        .cc-reading-chain { margin-bottom: 8px; }
        .cc-reading-name { font-size: 11px; color: var(--accent); text-transform: capitalize; font-weight: 600; margin-bottom: 2px; }
        .cc-empty { font-size: 12px; color: var(--text-dim); font-style: italic; }
      `}</style>
    </div>
  );
}
