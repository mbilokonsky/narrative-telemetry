"use strict";
/**
 * Text chunking for long narrative texts.
 *
 * Strategy (in priority order):
 * 1. Chapter markers — detect "Chapter N", "CHAPTER", "Part N", "I.", "II.", etc.
 * 2. Scene breaks — detect "* * *", "---", blank line clusters (3+ blank lines)
 * 3. Token budget — if no markers found, split at ~15K tokens per chunk, breaking at paragraph boundaries
 *
 * Each chunk includes overlap context from the previous chunk for continuity.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkText = chunkText;
exports.estimateTokens = estimateTokens;
exports.getChunkStats = getChunkStats;
const DEFAULT_TARGET_SIZE = 60000; // ~15K tokens at 4 chars/token
const DEFAULT_OVERLAP_PARAGRAPHS = 2;
// Chapter detection patterns
const DEFAULT_CHAPTER_MARKERS = [
    /^\s*Chapter\s+[\dIVXLC]+/im, // Chapter 1, Chapter I, Chapter XII
    /^\s*CHAPTER\s+[\dIVXLC]+/im, // CHAPTER 1
    /^\s*Part\s+[\dIVXLC]+/im, // Part 1, Part I
    /^\s*PART\s+[\dIVXLC]+/im, // PART 1
    /^\s*Book\s+[\dIVXLC]+/im, // Book 1
    /^\s*BOOK\s+[\dIVXLC]+/im, // BOOK 1
    /^\s*Section\s+[\dIVXLC]+/im, // Section 1
    /^\s*SECTION\s+[\dIVXLC]+/im, // SECTION 1
    /^\s*[IVXLC]+\s*\.?\s*$/m, // I.  II.  III (standalone)
    /^\s*[\d]+\s*\.\s*$/m, // 1.  2.  3. (standalone, but be careful)
];
// Scene break patterns
const SCENE_BREAK_PATTERNS = [
    /^\s*\*\s*\*\s*\*\s*$/m, // * * *
    /^\s*#{3,}\s*$/m, // ###
    /^\s*-{3,}\s*$/m, // ---
    /^\s*_\s*_\s*_\s*$/m, // _ _ _
];
/**
 * Split text into chunks using multi-strategy detection.
 */
function chunkText(text, options = {}) {
    var _a, _b, _c;
    const targetSize = (_a = options.targetChunkSize) !== null && _a !== void 0 ? _a : DEFAULT_TARGET_SIZE;
    const overlapParas = (_b = options.overlapParagraphs) !== null && _b !== void 0 ? _b : DEFAULT_OVERLAP_PARAGRAPHS;
    const chapterMarkers = (_c = options.chapterMarkers) !== null && _c !== void 0 ? _c : DEFAULT_CHAPTER_MARKERS;
    // If text is short enough, return as single chunk
    if (text.length <= targetSize) {
        return [{
                index: 0,
                text,
                startPct: 0,
                endPct: 100,
                isOverlap: false,
            }];
    }
    // Try chapter markers first
    const chapterBoundaries = findChapterBoundaries(text, chapterMarkers);
    if (chapterBoundaries.length > 1) {
        return splitByBoundaries(text, chapterBoundaries, overlapParas);
    }
    // Try scene breaks
    const sceneBoundaries = findSceneBoundaries(text);
    if (sceneBoundaries.length > 1) {
        return splitByBoundaries(text, sceneBoundaries, overlapParas);
    }
    // Fall back to token budget with paragraph breaks
    return splitByTokenBudget(text, targetSize, overlapParas);
}
/**
 * Find chapter boundaries in text.
 */
function findChapterBoundaries(text, markers) {
    const boundaries = [0];
    for (const pattern of markers) {
        const regex = new RegExp(pattern.source, 'gm');
        let match;
        while ((match = regex.exec(text)) !== null) {
            // Don't add duplicates or very close boundaries
            const pos = match.index;
            if (!boundaries.some(b => Math.abs(b - pos) < 100)) {
                boundaries.push(pos);
            }
        }
    }
    // Sort and add end boundary
    boundaries.sort((a, b) => a - b);
    if (boundaries[boundaries.length - 1] !== text.length) {
        boundaries.push(text.length);
    }
    return [...new Set(boundaries)]; // dedupe
}
/**
 * Find scene break boundaries.
 */
function findSceneBoundaries(text) {
    const boundaries = [0];
    for (const pattern of SCENE_BREAK_PATTERNS) {
        const regex = new RegExp(pattern.source, 'gm');
        let match;
        while ((match = regex.exec(text)) !== null) {
            const pos = match.index;
            if (!boundaries.some(b => Math.abs(b - pos) < 50)) {
                boundaries.push(pos);
            }
        }
    }
    // Also detect blank line clusters (3+ consecutive blank lines)
    const blankClusterPattern = /\n\s*\n\s*\n\s*\n/g;
    let match;
    while ((match = blankClusterPattern.exec(text)) !== null) {
        const pos = match.index;
        if (!boundaries.some(b => Math.abs(b - pos) < 100)) {
            boundaries.push(pos);
        }
    }
    boundaries.sort((a, b) => a - b);
    if (boundaries[boundaries.length - 1] !== text.length) {
        boundaries.push(text.length);
    }
    return [...new Set(boundaries)];
}
/**
 * Split text by pre-defined boundaries with overlap.
 */
function splitByBoundaries(text, boundaries, overlapParas) {
    const chunks = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
        const start = boundaries[i];
        const end = boundaries[i + 1];
        const chunkText = text.slice(start, end);
        const startPct = (start / text.length) * 100;
        const endPct = (end / text.length) * 100;
        chunks.push({
            index: i,
            text: chunkText,
            startPct,
            endPct,
            isOverlap: false,
        });
        // Add overlap context to next chunk if there is one
        if (i < boundaries.length - 2 && overlapParas > 0) {
            const overlapText = extractOverlap(text, end, overlapParas, 'forward');
            if (overlapText) {
                chunks.push({
                    index: i,
                    text: `[CONTEXT FROM PREVIOUS SECTION]\n\n${overlapText}`,
                    startPct,
                    endPct,
                    isOverlap: true,
                });
            }
        }
    }
    return chunks;
}
/**
 * Split text by token budget, breaking at paragraph boundaries.
 */
function splitByTokenBudget(text, targetSize, overlapParas) {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;
    let chunkStartIndex = 0;
    let lastOverlapText = '';
    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        if (currentSize + para.length > targetSize && currentChunk.length > 0) {
            // Finish current chunk
            const chunkText = currentChunk.join('\n\n');
            const startChar = paragraphs.slice(0, chunkStartIndex).join('\n\n').length;
            const endChar = startChar + chunkText.length;
            chunks.push({
                index: chunks.filter(c => !c.isOverlap).length,
                text: lastOverlapText
                    ? `[CONTEXT FROM PREVIOUS SECTION]\n\n${lastOverlapText}\n\n${chunkText}`
                    : chunkText,
                startPct: (startChar / text.length) * 100,
                endPct: (endChar / text.length) * 100,
                isOverlap: false,
            });
            // Save overlap for next chunk
            lastOverlapText = extractOverlapFromParagraphs(currentChunk, overlapParas);
            // Start new chunk
            currentChunk = [para];
            currentSize = para.length;
            chunkStartIndex = i;
        }
        else {
            currentChunk.push(para);
            currentSize += para.length + 2; // +2 for \n\n
        }
    }
    // Don't forget the last chunk
    if (currentChunk.length > 0) {
        const chunkText = currentChunk.join('\n\n');
        const startChar = paragraphs.slice(0, chunkStartIndex).join('\n\n').length;
        const endChar = text.length;
        chunks.push({
            index: chunks.filter(c => !c.isOverlap).length,
            text: lastOverlapText
                ? `[CONTEXT FROM PREVIOUS SECTION]\n\n${lastOverlapText}\n\n${chunkText}`
                : chunkText,
            startPct: (startChar / text.length) * 100,
            endPct: 100,
            isOverlap: false,
        });
    }
    return chunks;
}
/**
 * Extract overlap text (last N paragraphs) from a position in text.
 */
function extractOverlap(text, position, paraCount, direction) {
    const searchText = direction === 'forward'
        ? text.slice(position, position + 5000) // look ahead
        : text.slice(Math.max(0, position - 5000), position); // look back
    const paragraphs = searchText.split(/\n\s*\n/).filter(p => p.trim());
    if (direction === 'forward') {
        return paragraphs.slice(0, paraCount).join('\n\n');
    }
    else {
        return paragraphs.slice(-paraCount).join('\n\n');
    }
}
/**
 * Extract overlap from end of paragraph array.
 */
function extractOverlapFromParagraphs(paragraphs, count) {
    return paragraphs.slice(-count).join('\n\n');
}
/**
 * Estimate token count from character count.
 * Rough estimate: 4 characters per token for English text.
 */
function estimateTokens(charCount) {
    return Math.ceil(charCount / 4);
}
/**
 * Get chunk statistics for debugging.
 */
function getChunkStats(chunks) {
    const contentChunks = chunks.filter(c => !c.isOverlap);
    const totalChars = contentChunks.reduce((sum, c) => sum + c.text.length, 0);
    return {
        totalChunks: chunks.length,
        contentChunks: contentChunks.length,
        overlapChunks: chunks.filter(c => c.isOverlap).length,
        totalChars,
        avgChunkSize: contentChunks.length > 0 ? Math.round(totalChars / contentChunks.length) : 0,
        estimatedTokens: estimateTokens(totalChars),
    };
}
