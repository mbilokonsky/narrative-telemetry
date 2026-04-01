"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestText = ingestText;
exports.ingestTextChunked = ingestTextChunked;
exports.generateReading = generateReading;
exports.deriveInsights = deriveInsights;
const extract_1 = require("./extract");
const interpret_1 = require("./interpret");
const derive_1 = require("../derive");
// ── Pipeline functions ──
/**
 * Full pipeline: raw text → TextModel → Readings → StoryModel
 */
function ingestText(text_1) {
    return __awaiter(this, arguments, void 0, function* (text, options = {}) {
        var _a, _b, _c, _d, _e;
        const extractOpts = Object.assign(Object.assign({}, options.extract), { model: (_a = options.model) !== null && _a !== void 0 ? _a : (_b = options.extract) === null || _b === void 0 ? void 0 : _b.model });
        const textModel = yield (0, extract_1.extractTextModel)(text, extractOpts);
        const readings = {};
        const lenses = (_c = options.lenses) !== null && _c !== void 0 ? _c : [];
        for (const lens of lenses) {
            const interpretOpts = Object.assign(Object.assign({}, options.interpret), { model: (_d = options.model) !== null && _d !== void 0 ? _d : (_e = options.interpret) === null || _e === void 0 ? void 0 : _e.model });
            const { name, reading } = yield (0, interpret_1.interpretReading)(textModel, lens, interpretOpts);
            readings[name] = reading;
        }
        return { text: textModel, readings };
    });
}
/**
 * Chunked pipeline for long texts: splits text, maintains entity registry across chunks.
 */
function ingestTextChunked(text_1) {
    return __awaiter(this, arguments, void 0, function* (text, options = {}) {
        var _a, _b, _c, _d, _e, _f, _g;
        const chunkOpts = {
            model: (_a = options.model) !== null && _a !== void 0 ? _a : (_b = options.extract) === null || _b === void 0 ? void 0 : _b.model,
            maxTokens: (_c = options.extract) === null || _c === void 0 ? void 0 : _c.maxTokens,
            temperature: (_d = options.extract) === null || _d === void 0 ? void 0 : _d.temperature,
            onChunkComplete: options.verbose
                ? (idx, total, registrySize) => console.log(`  Chunk ${idx + 1}/${total}: ${registrySize} entities in registry`)
                : undefined,
        };
        const textModel = yield (0, extract_1.extractTextModelChunked)(text, chunkOpts);
        const readings = {};
        const lenses = (_e = options.lenses) !== null && _e !== void 0 ? _e : [];
        for (const lens of lenses) {
            const interpretOpts = Object.assign(Object.assign({}, options.interpret), { model: (_f = options.model) !== null && _f !== void 0 ? _f : (_g = options.interpret) === null || _g === void 0 ? void 0 : _g.model });
            const { name, reading } = yield (0, interpret_1.interpretReading)(textModel, lens, interpretOpts);
            readings[name] = reading;
        }
        return { text: textModel, readings };
    });
}
/**
 * Generate a single reading for an existing StoryModel.
 */
function generateReading(model_1, lens_1) {
    return __awaiter(this, arguments, void 0, function* (model, lens, options = {}) {
        const { name, reading } = yield (0, interpret_1.interpretReading)(model.text, lens, options);
        model.readings[name] = reading;
        return reading;
    });
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
