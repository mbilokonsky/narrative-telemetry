"use strict";
/**
 * TensionField — hierarchical, entity-scoped tension decomposition.
 *
 * Every span node gets a TensionField containing:
 * 1. Per-entity tension vectors (each character/setting carries its own tensions)
 * 2. Interaction tensions between co-present entities (emergent, non-reducible)
 * 3. Reader-level epistemic tension (dramatic irony — what reader knows vs characters)
 * 4. Composite tension (the old scalar, now derived from the field)
 *
 * The tension tree mirrors the span tree:
 *   Story → Acts → Scenes → Beats
 * Each level inherits and composes entity tensions from its children.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTensionField = computeTensionField;
exports.flattenTensionField = flattenTensionField;
// ── Default dimension weights for composite calculation ──
const DEFAULT_WEIGHTS = {
    absential: 0.30,
    relational: 0.25,
    epistemic: 0.20,
    atmospheric: 0.10,
    pacing: 0.15,
};
// ── Core computation ──
/**
 * Compute the full tension field tree for a story model under a reading.
 *
 * Walks the span tree, computing per-entity tensions at each span node
 * based on which entities are present (via event participants) and
 * what absentials/relationships/constructs are active at that point.
 */
function computeTensionField(model, reading, weights = DEFAULT_WEIGHTS) {
    return computeSpanTensionField(model.rootSpan, model, reading, weights);
}
function computeSpanTensionField(span, model, reading, weights) {
    // Collect all events in this span (direct, not children's)
    const spanEventIds = span.events;
    const spanEvents = spanEventIds
        .map(id => model.events[id])
        .filter(e => e !== undefined);
    // Find entities present in this span via event participants
    const presentEntityIds = new Set();
    for (const evt of spanEvents) {
        for (const pid of (evt.participants ?? [])) {
            presentEntityIds.add(pid);
        }
    }
    // Compute per-entity tensions
    const entityTensions = [];
    for (const entityId of presentEntityIds) {
        const entity = findEntity(model, entityId);
        if (!entity)
            continue;
        const entityType = entity.type;
        const dimensions = computeEntityDimensions(entityId, entityType, span, model, reading, spanEvents);
        const composite = weightedSum(dimensions, weights);
        entityTensions.push({
            entityId,
            entityType,
            entityName: entity.name,
            dimensions,
            composite,
            activeAbsentials: findActiveAbsentials(entityId, model),
            stressedRelationships: findStressedRelationships(entityId, model),
        });
    }
    // Compute interaction tensions between co-present entities
    const interactions = computeInteractionTensions([...presentEntityIds], model, reading, spanEvents);
    // Compute reader tension
    const readerTension = computeReaderTension(model, reading, spanEvents);
    // Aggregate field dimensions (sum of all entity contributions)
    const fieldDimensions = aggregateDimensions(entityTensions);
    // Add interaction intensity to relational dimension
    const interactionBoost = interactions.reduce((sum, i) => sum + i.intensity, 0) / Math.max(interactions.length, 1);
    fieldDimensions.relational = Math.min(1, fieldDimensions.relational + interactionBoost * 0.3);
    // Add reader tension to epistemic dimension
    fieldDimensions.epistemic = Math.min(1, fieldDimensions.epistemic + readerTension.knowledgeAdvantage * 0.2 + readerTension.suspense * 0.2);
    const composite = weightedSum(fieldDimensions, weights);
    // Recurse into child spans
    const children = span.childSpans.map(child => computeSpanTensionField(child, model, reading, weights));
    return {
        spanId: span.id,
        spanTitle: span.title,
        spanType: span.type,
        timestamp: {
            startPct: span.startTimestamp.percentage,
            endPct: span.endTimestamp.percentage,
        },
        entities: entityTensions,
        interactions,
        reader: readerTension,
        fieldDimensions,
        composite,
        children,
    };
}
// ── Entity dimension computation ──
function computeEntityDimensions(entityId, entityType, span, model, reading, spanEvents) {
    const midPct = (span.startTimestamp.percentage + span.endTimestamp.percentage) / 2;
    // Absential tension: count and intensity of unresolved absentials held by this entity
    const absentialTension = computeAbsentialTension(entityId, model, reading, midPct);
    // Relational tension: stressed relationships involving this entity
    const relationalTension = computeRelationalTension(entityId, model, midPct);
    // Epistemic tension: knowledge gaps, beliefs, mental constructs
    const epistemicTension = computeEpistemicTension(entityId, model, midPct);
    // Atmospheric tension: settings contribute atmospheric tension
    const atmosphericTension = entityType === 'setting'
        ? computeAtmosphericTension(entityId, model, reading)
        : 0;
    // Pacing tension: event density in this span
    const pacingTension = computePacingTension(spanEvents, span);
    return {
        absential: clamp(absentialTension),
        relational: clamp(relationalTension),
        epistemic: clamp(epistemicTension),
        atmospheric: clamp(atmosphericTension),
        pacing: clamp(pacingTension),
    };
}
function computeAbsentialTension(entityId, model, reading, currentPct) {
    let tension = 0;
    let count = 0;
    for (const [absId, abs] of Object.entries(model.absentials)) {
        if (abs.holder !== entityId)
            continue;
        // Check if absential is active (unresolved) at this point
        const lastState = abs.stateHistory[abs.stateHistory.length - 1];
        const status = lastState?.data?.status;
        const isResolved = status === 'resolved_satisfied' || status === 'resolved_blocked' ||
            status === 'resolved_mixed' || status === 'canceled';
        if (!isResolved) {
            const sig = reading.absentialSignificance[absId]?.significance ?? 0.3;
            tension += sig;
            count++;
        }
    }
    return count > 0 ? tension / count : 0;
}
function computeRelationalTension(entityId, model, currentPct) {
    let tension = 0;
    let count = 0;
    for (const [relId, rel] of Object.entries(model.relationships.interpersonal)) {
        const p = rel.participants ?? [];
        if (p[0] !== entityId && p[1] !== entityId)
            continue;
        // Relationships labeled as enemy, rival create higher tension
        const label = rel.label ?? rel.stateHistory?.[0]?.data?.label;
        const labelTension = {
            enemy: 0.9, rival: 0.7, subordinate: 0.4,
            lover: 0.3, friend: 0.1, family: 0.2,
            ally: 0.1, mentor: 0.15, leader: 0.2,
        };
        tension += labelTension[label] ?? 0.2;
        count++;
    }
    return count > 0 ? tension / count : 0;
}
function computeEpistemicTension(entityId, model, currentPct) {
    let tension = 0;
    let count = 0;
    for (const [mcId, mc] of Object.entries(model.mentalConstructs)) {
        if (mc.holder !== entityId)
            continue;
        const lastState = mc.stateHistory[mc.stateHistory.length - 1];
        const certainty = lastState?.data?.certainty;
        // Lower certainty = higher epistemic tension
        const certaintyTension = {
            certain: 0.0, probable: 0.2, possible: 0.5,
            uncertain: 0.7, unknown: 0.9,
        };
        tension += certaintyTension[certainty] ?? 0.3;
        count++;
    }
    return count > 0 ? tension / count : 0;
}
function computeAtmosphericTension(settingId, model, reading) {
    // Use the setting's entity significance as atmospheric contribution
    const sig = reading.entitySignificance[settingId]?.significance ?? 0.2;
    return sig;
}
function computePacingTension(events, span) {
    const spanDuration = span.endTimestamp.percentage - span.startTimestamp.percentage;
    if (spanDuration <= 0)
        return 0;
    // Event density: events per percentage point
    const density = events.length / spanDuration;
    // Normalize: 1 event per 5% = moderate (0.5), >1 per 2% = high (1.0)
    return Math.min(1, density * 5);
}
// ── Interaction tensions ──
function computeInteractionTensions(entityIds, model, reading, spanEvents) {
    const interactions = [];
    // Check all pairs of co-present entities
    for (let i = 0; i < entityIds.length; i++) {
        for (let j = i + 1; j < entityIds.length; j++) {
            const e1 = entityIds[i];
            const e2 = entityIds[j];
            // Find relationship between them
            const rel = findRelationship(e1, e2, model);
            if (!rel)
                continue;
            // Determine interaction type and intensity
            const label = rel.label ?? rel.stateHistory?.[0]?.data?.label;
            let type = 'conflict';
            let intensity = 0.3;
            if (label === 'enemy' || label === 'rival') {
                type = 'conflict';
                intensity = 0.8;
            }
            else if (label === 'lover') {
                // Check if relationship is reciprocated
                type = 'unrequited'; // default assumption
                intensity = 0.6;
            }
            else if (label === 'ally' || label === 'friend') {
                type = 'alliance_under_stress';
                intensity = 0.2;
            }
            // Check for asymmetric knowledge (dramatic irony between entities)
            const mc1about2 = findMentalConstructsAbout(e1, e2, model);
            const mc2about1 = findMentalConstructsAbout(e2, e1, model);
            if (mc1about2.length !== mc2about1.length || mc1about2.length > 0) {
                type = 'asymmetry';
                intensity = Math.max(intensity, 0.5);
            }
            // Find events involving both entities
            const sharedEvents = spanEvents
                .filter(e => e.participants?.includes(e1) && e.participants?.includes(e2))
                .map(e => e.id);
            if (sharedEvents.length > 0 || intensity > 0.3) {
                interactions.push({
                    entity1: e1,
                    entity2: e2,
                    type,
                    intensity: clamp(intensity),
                    description: `${findEntityName(e1, model)} × ${findEntityName(e2, model)}: ${type}`,
                    sourceEvents: sharedEvents,
                });
            }
        }
    }
    return interactions;
}
// ── Reader tension ──
function computeReaderTension(model, reading, spanEvents) {
    // Count revelation events (reader learns something)
    const revelations = spanEvents.filter(e => e.type === 'revelation').length;
    // Open questions: count unresolved absentials visible to reader
    const unresolvedAbsentials = Object.values(model.absentials).filter(abs => {
        const lastState = abs.stateHistory[abs.stateHistory.length - 1];
        const status = lastState?.data?.status;
        return status !== 'resolved_satisfied' && status !== 'resolved_blocked' &&
            status !== 'resolved_mixed' && status !== 'canceled';
    }).length;
    // Knowledge advantage: reader perspective elements from the reading
    const hasNarratorPerspective = reading.narrator?.perspective !== undefined;
    const knowledgeAdvantage = hasNarratorPerspective ? 0.3 : 0.1;
    return {
        knowledgeAdvantage: clamp(knowledgeAdvantage + revelations * 0.1),
        openQuestions: unresolvedAbsentials,
        suspense: clamp(unresolvedAbsentials * 0.15),
    };
}
// ── Helpers ──
function findEntity(model, id) {
    if (model.diegetic.characters[id])
        return { name: model.diegetic.characters[id].name, type: 'character' };
    if (model.diegetic.settings[id])
        return { name: model.diegetic.settings[id].name, type: 'setting' };
    if (model.diegetic.items[id])
        return { name: model.diegetic.items[id].name, type: 'item' };
    if (model.diegetic.factions[id])
        return { name: model.diegetic.factions[id].name, type: 'faction' };
    return undefined;
}
function findEntityName(id, model) {
    return findEntity(model, id)?.name ?? id;
}
function findActiveAbsentials(entityId, model) {
    return Object.entries(model.absentials)
        .filter(([_, abs]) => {
        if (abs.holder !== entityId)
            return false;
        const lastState = abs.stateHistory[abs.stateHistory.length - 1];
        const status = lastState?.data?.status;
        return status !== 'resolved_satisfied' && status !== 'resolved_blocked' &&
            status !== 'resolved_mixed' && status !== 'canceled';
    })
        .map(([id]) => id);
}
function findStressedRelationships(entityId, model) {
    return Object.entries(model.relationships.interpersonal)
        .filter(([_, rel]) => {
        if ((rel.participants ?? [])[0] !== entityId && (rel.participants ?? [])[1] !== entityId)
            return false;
        const label = rel.label ?? rel.stateHistory?.[0]?.data?.label;
        return ['enemy', 'rival', 'subordinate'].includes(label);
    })
        .map(([id]) => id);
}
function findRelationship(e1, e2, model) {
    return Object.values(model.relationships.interpersonal).find(rel => ((rel.participants ?? [])[0] === e1 && (rel.participants ?? [])[1] === e2) || ((rel.participants ?? [])[0] === e2 && (rel.participants ?? [])[1] === e1));
}
function findMentalConstructsAbout(holder, subject, model) {
    return Object.values(model.mentalConstructs).filter(mc => mc.holder === holder && mc.subject === subject);
}
function aggregateDimensions(entities) {
    if (entities.length === 0) {
        return { absential: 0, relational: 0, epistemic: 0, atmospheric: 0, pacing: 0 };
    }
    const sum = { absential: 0, relational: 0, epistemic: 0, atmospheric: 0, pacing: 0 };
    for (const et of entities) {
        sum.absential += et.dimensions.absential;
        sum.relational += et.dimensions.relational;
        sum.epistemic += et.dimensions.epistemic;
        sum.atmospheric += et.dimensions.atmospheric;
        sum.pacing += et.dimensions.pacing;
    }
    // Normalize by entity count but don't divide below entity count
    // (more entities = more tension sources, which is real)
    const scale = Math.sqrt(entities.length); // sub-linear scaling
    return {
        absential: clamp(sum.absential / scale),
        relational: clamp(sum.relational / scale),
        epistemic: clamp(sum.epistemic / scale),
        atmospheric: clamp(sum.atmospheric / scale),
        pacing: clamp(sum.pacing / scale),
    };
}
function weightedSum(dims, weights) {
    const totalWeight = weights.absential + weights.relational + weights.epistemic +
        weights.atmospheric + weights.pacing;
    if (totalWeight === 0)
        return 0;
    return clamp((dims.absential * weights.absential +
        dims.relational * weights.relational +
        dims.epistemic * weights.epistemic +
        dims.atmospheric * weights.atmospheric +
        dims.pacing * weights.pacing) / totalWeight);
}
function clamp(v) {
    return Math.max(0, Math.min(1, v));
}
/**
 * Flatten a tension field tree into per-dimension curves (sampled at regular intervals).
 *
 * This is the plotting-friendly output — multiple curves instead of one scalar.
 */
function flattenTensionField(field, steps = 20) {
    // Collect all leaf-level fields with their timestamps
    const leaves = [];
    collectLeaves(field, leaves);
    if (leaves.length === 0) {
        // Return flat zeros
        return Array.from({ length: steps + 1 }, (_, i) => ({
            timestamp: { percentage: (i / steps) * 100 },
            absential: 0, relational: 0, epistemic: 0, atmospheric: 0, pacing: 0, composite: 0,
        }));
    }
    // Sample at regular intervals
    const points = [];
    for (let i = 0; i <= steps; i++) {
        const pct = (i / steps) * 100;
        // Find the field(s) that contain this percentage
        const activeFields = leaves.filter(f => pct >= f.timestamp.startPct && pct <= f.timestamp.endPct);
        if (activeFields.length === 0) {
            points.push({
                timestamp: { percentage: pct },
                absential: 0, relational: 0, epistemic: 0, atmospheric: 0, pacing: 0, composite: 0,
            });
        }
        else {
            // Average the active fields
            const avg = { absential: 0, relational: 0, epistemic: 0, atmospheric: 0, pacing: 0 };
            let compositeSum = 0;
            for (const f of activeFields) {
                avg.absential += f.fieldDimensions.absential;
                avg.relational += f.fieldDimensions.relational;
                avg.epistemic += f.fieldDimensions.epistemic;
                avg.atmospheric += f.fieldDimensions.atmospheric;
                avg.pacing += f.fieldDimensions.pacing;
                compositeSum += f.composite;
            }
            const n = activeFields.length;
            points.push({
                timestamp: { percentage: pct },
                absential: avg.absential / n,
                relational: avg.relational / n,
                epistemic: avg.epistemic / n,
                atmospheric: avg.atmospheric / n,
                pacing: avg.pacing / n,
                composite: compositeSum / n,
            });
        }
    }
    return points;
}
function collectLeaves(field, leaves) {
    if (field.children.length === 0) {
        leaves.push(field);
    }
    else {
        for (const child of field.children) {
            collectLeaves(child, leaves);
        }
    }
}
