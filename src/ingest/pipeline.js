"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestText = ingestText;
exports.ingestTextChunked = ingestTextChunked;
exports.generateReading = generateReading;
exports.deriveInsights = deriveInsights;
exports.exportToOtel = exportToOtel;
const extract_1 = require("./extract");
const interpret_1 = require("./interpret");
const derive_1 = require("../derive");
const otel_1 = require("../export/otel");
const jaeger_1 = require("../export/jaeger");
const otlp_1 = require("../export/otlp");
const console_1 = require("../export/console");
// ── Pipeline functions ──
/**
 * Full pipeline: raw text → TextModel → Readings → StoryModel
 */
async function ingestText(text, options = {}) {
    const extractOpts = {
        ...options.extract,
        model: options.model ?? options.extract?.model,
    };
    const textModel = await (0, extract_1.extractTextModel)(text, extractOpts);
    const readings = {};
    const lenses = options.lenses ?? [];
    for (const lens of lenses) {
        const interpretOpts = {
            ...options.interpret,
            model: options.model ?? options.interpret?.model,
        };
        const { name, reading } = await (0, interpret_1.interpretReading)(textModel, lens, interpretOpts);
        readings[name] = reading;
    }
    return { text: textModel, readings };
}
/**
 * Chunked pipeline for long texts: splits text, maintains entity registry across chunks.
 */
async function ingestTextChunked(text, options = {}) {
    const chunkOpts = {
        model: options.model ?? options.extract?.model,
        maxTokens: options.extract?.maxTokens,
        temperature: options.extract?.temperature,
        onChunkComplete: options.verbose
            ? (idx, total, registrySize) => console.log(`  Chunk ${idx + 1}/${total}: ${registrySize} entities in registry`)
            : undefined,
    };
    const textModel = await (0, extract_1.extractTextModelChunked)(text, chunkOpts);
    const readings = {};
    const lenses = options.lenses ?? [];
    for (const lens of lenses) {
        const interpretOpts = {
            ...options.interpret,
            model: options.model ?? options.interpret?.model,
        };
        const { name, reading } = await (0, interpret_1.interpretReading)(textModel, lens, interpretOpts);
        readings[name] = reading;
    }
    return { text: textModel, readings };
}
/**
 * Generate a single reading for an existing StoryModel.
 */
async function generateReading(model, lens, options = {}) {
    const { name, reading } = await (0, interpret_1.interpretReading)(model.text, lens, options);
    model.readings[name] = reading;
    return reading;
}
/**
 * Derive mechanical insights from a StoryModel (no LLM needed).
 */
function deriveInsights(model) {
    const readingNames = Object.keys(model.readings);
    // Tension curves per reading
    const tensionCurves = {};
    for (const name of readingNames) {
        tensionCurves[name] = (0, derive_1.computeTensionCurve)(model.text, model.readings[name]);
    }
    // Coarse-grain significance per reading
    const coarseGrained = {};
    for (const name of readingNames) {
        coarseGrained[name] = (0, derive_1.coarseGrain)(model.text.rootSpan, model.readings[name]);
    }
    // Pacing (text-level, reading-independent)
    const pacing = (0, derive_1.computePacing)(model.text.rootSpan, model.text);
    // Divergence between first two readings (if we have at least two)
    let divergence;
    if (readingNames.length >= 2) {
        divergence = (0, derive_1.computeDivergence)(model.readings[readingNames[0]], model.readings[readingNames[1]]);
    }
    return { tensionCurves, coarseGrained, pacing, divergence };
}
/**
 * Export a StoryModel to OTEL trace format.
 * Returns the serialized string (Jaeger/OTLP JSON) or prints to console.
 */
function exportToOtel(model, format = 'jaeger', options) {
    const trace = (0, otel_1.storyModelToOtel)(model, options);
    if (format === 'console') {
        (0, console_1.consoleExport)(trace);
        return;
    }
    return format === 'jaeger' ? (0, jaeger_1.jaegerExport)(trace) : (0, otlp_1.otlpExport)(trace);
}
