"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTensionCurve = computeTensionCurve;
/**
 * Compute a tension curve for a reading.
 *
 * Two strategies depending on data quality:
 *
 * 1. **Absential-based** (preferred): If absentials have proper multi-state histories
 *    with introduction and resolution at different timestamps:
 *    tension(t) = Σ( significance(abs) × duration_active(abs, t) )
 *
 * 2. **Event-significance-based** (fallback): If absential state histories are flat,
 *    derive tension from cumulative event significance. High-significance events
 *    build tension; the curve naturally rises toward the climax.
 *    tension(t) = cumulative significance weighted by narrative position.
 */
function computeTensionCurve(textModel, reading, steps = 20) {
    // Check if absentials have meaningful state transitions
    const hasGoodAbsentials = checkAbsentialQuality(textModel);
    if (hasGoodAbsentials) {
        return computeFromAbsentials(textModel, reading, steps);
    }
    else {
        return computeFromEventSignificance(textModel, reading, steps);
    }
}
function checkAbsentialQuality(textModel) {
    const absentials = Object.values(textModel.absentials);
    if (absentials.length === 0)
        return false;
    // Check if any absential has multiple state entries at different timestamps
    let multiState = 0;
    for (const abs of absentials) {
        if (abs.stateHistory.length >= 2) {
            const pcts = abs.stateHistory.map(s => { var _a, _b; return (_b = (_a = s.timestamp) === null || _a === void 0 ? void 0 : _a.percentage) !== null && _b !== void 0 ? _b : 0; });
            if (new Set(pcts).size >= 2)
                multiState++;
        }
    }
    return multiState >= 2; // at least 2 absentials with real transitions
}
/**
 * Strategy 1: Absential-based tension (when state histories are good)
 */
function computeFromAbsentials(textModel, reading, steps) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const absentials = Object.values(textModel.absentials);
    const intervals = [];
    for (const abs of absentials) {
        const sig = (_b = (_a = reading.absentialSignificance[abs.id]) === null || _a === void 0 ? void 0 : _a.significance) !== null && _b !== void 0 ? _b : 0.3;
        const startPct = (_e = (_d = (_c = abs.stateHistory[0]) === null || _c === void 0 ? void 0 : _c.timestamp) === null || _d === void 0 ? void 0 : _d.percentage) !== null && _e !== void 0 ? _e : 0;
        let endPct = 100;
        for (const state of abs.stateHistory) {
            const status = (_f = state.data) === null || _f === void 0 ? void 0 : _f.status;
            if (status === 'resolved_satisfied' ||
                status === 'resolved_blocked' ||
                status === 'resolved_mixed' ||
                status === 'canceled') {
                if (((_h = (_g = state.timestamp) === null || _g === void 0 ? void 0 : _g.percentage) !== null && _h !== void 0 ? _h : 0) > startPct) {
                    endPct = state.timestamp.percentage;
                    break;
                }
            }
        }
        intervals.push({ id: abs.id, significance: sig, startPct, endPct });
    }
    const points = [];
    for (let i = 0; i <= steps; i++) {
        const pct = (i / steps) * 100;
        let tension = 0;
        for (const interval of intervals) {
            if (pct >= interval.startPct && pct <= interval.endPct) {
                // Tension accumulates over time — longer unresolved = more tension
                const elapsed = pct - interval.startPct;
                const duration = interval.endPct - interval.startPct;
                const accumulation = duration > 0 ? elapsed / duration : 1;
                tension += interval.significance * accumulation;
            }
        }
        points.push({ timestamp: { percentage: pct }, tension });
    }
    return normalize(points);
}
/**
 * Strategy 2: Event-significance-based tension (fallback)
 *
 * Build tension from event significance scores. The idea:
 * - Each event adds its significance to a running "tension budget"
 * - Tension decays slightly between events (resolved subplots, breathing room)
 * - The curve naturally peaks where high-significance events cluster
 */
function computeFromEventSignificance(textModel, reading, steps) {
    var _a, _b, _c, _d;
    // Collect events with their timestamps and significance
    const events = [];
    for (const [evtId, evt] of Object.entries(textModel.events)) {
        const sig = (_b = (_a = reading.eventSignificance[evtId]) === null || _a === void 0 ? void 0 : _a.significance) !== null && _b !== void 0 ? _b : 0;
        // Use event timestamp percentage, or estimate from position in event list
        const pct = (_d = (_c = evt.timestamp) === null || _c === void 0 ? void 0 : _c.percentage) !== null && _d !== void 0 ? _d : estimateEventPosition(evtId, textModel);
        events.push({ pct, significance: sig });
    }
    events.sort((a, b) => a.pct - b.pct);
    if (events.length === 0)
        return [];
    // Sample tension at regular intervals
    const decay = 0.15; // tension decays 15% per step without new events
    const points = [];
    for (let i = 0; i <= steps; i++) {
        const pct = (i / steps) * 100;
        // Sum significance of all events up to this point, with distance-based decay
        let tension = 0;
        for (const evt of events) {
            if (evt.pct <= pct) {
                const distance = (pct - evt.pct) / 100; // 0 to 1
                const weight = Math.exp(-decay * distance * steps); // exponential decay
                tension += evt.significance * weight;
            }
        }
        points.push({ timestamp: { percentage: pct }, tension });
    }
    return normalize(points);
}
/**
 * Estimate event position as percentage through the story
 * based on its position in the events object
 */
function estimateEventPosition(evtId, textModel) {
    const allIds = Object.keys(textModel.events);
    const idx = allIds.indexOf(evtId);
    if (idx === -1 || allIds.length <= 1)
        return 50;
    return (idx / (allIds.length - 1)) * 100;
}
function normalize(points) {
    const maxTension = Math.max(...points.map(p => p.tension), 0.001);
    return points.map(p => ({
        timestamp: p.timestamp,
        tension: p.tension / maxTension,
    }));
}
