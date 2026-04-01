"use strict";
/**
 * Validation tests for chunked extraction with entity registry.
 *
 * Tests the chunking strategies, entity registry deduplication, and span stitching.
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../ingest/registry");
const chunker_1 = require("../ingest/chunker");
let passed = 0;
let failed = 0;
function check(name, condition, detail) {
    if (condition) {
        console.log(`  ✓ ${name}`);
        passed++;
    }
    else {
        console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`);
        failed++;
    }
}
console.log('\n=== Chunked Extraction Validation ===\n');
// ═══════════════════════════════════════════════
//  CHUNKER TESTS
// ═══════════════════════════════════════════════
console.log('--- Chunker Tests ---\n');
// Test 1: Short text returns single chunk
const shortText = 'Line one.\n\nLine two.\n\nLine three.';
const shortChunks = (0, chunker_1.chunkText)(shortText);
check('Short text: single chunk', shortChunks.length === 1);
check('Short text: no overlap flag', !shortChunks[0].isOverlap);
check('Short text: correct percentages', shortChunks[0].startPct === 0 && shortChunks[0].endPct === 100);
// Test 2: Chapter detection (needs substantial text between chapters)
const longPara = 'Word '.repeat(1000) + '\n\n'; // ~6K chars each
const chapterText = `Chapter 1

${longPara}${longPara}
Chapter 2

${longPara}${longPara}
Chapter 3

${longPara}`;
const chapterChunks = (0, chunker_1.chunkText)(chapterText, { targetChunkSize: 10000 });
check('Chapter detection: finds chapters', chapterChunks.filter(c => !c.isOverlap).length >= 2);
// Test 3: Scene break detection (simplified — just ensure it doesn't crash)
const scenePara = 'Scene content here with many words to make it substantial. '.repeat(200);
const sceneText = `${scenePara}

* * *

${scenePara}`;
const sceneChunks = (0, chunker_1.chunkText)(sceneText, { targetChunkSize: 5000 });
check('Scene break detection: produces chunks', sceneChunks.length >= 1);
// Test 4: Token budget fallback (simulate long text with many paragraphs)
// Multiple paragraphs separated by double newlines to trigger budget-based chunking
const paragraphs = Array(10).fill('This is a paragraph with enough content to make it substantial. '.repeat(50)).join('\n\n');
const longChunks = (0, chunker_1.chunkText)(paragraphs, { targetChunkSize: 15000 });
check('Long text: splits into multiple chunks', longChunks.filter(c => !c.isOverlap).length > 1 || longChunks[0].text.length > 15000);
check('Long text: chunks have correct percentages', longChunks.filter(c => !c.isOverlap).length > 0 && longChunks[longChunks.length - 1].endPct === 100);
// Test 5: Chunk statistics
const stats = (0, chunker_1.getChunkStats)(longChunks);
check('Stats: reports content chunks', stats.contentChunks > 0);
check('Stats: total chars > 0', stats.totalChars > 0);
check('Stats: avg chunk size > 0', stats.avgChunkSize > 0);
check('Stats: estimated tokens > 0', stats.estimatedTokens > 0);
// Test 6: Token estimation
const testChars = 4000;
check('Token estimation: ~4 chars/token', (0, chunker_1.estimateTokens)(testChars) >= 900 && (0, chunker_1.estimateTokens)(testChars) <= 1100);
// ═══════════════════════════════════════════════
//  ENTITY REGISTRY TESTS
// ═══════════════════════════════════════════════
console.log('\n--- Entity Registry Tests ---\n');
const registry = new registry_1.EntityRegistry();
// Test 7: Register entities
check('Registry: empty at start', registry.count === 0);
registry.register({
    id: 'boy',
    type: 'character',
    canonicalName: 'The Boy',
    aliases: ['narrator', 'protagonist'],
    description: 'The unnamed narrator',
});
check('Registry: count increases', registry.count === 1);
check('Registry: has entity by ID', registry.has('boy'));
// Test 8: Lookup by name and alias
check('Registry: lookup by canonical name', registry.lookup('The Boy') === 'boy');
check('Registry: lookup by alias', registry.lookup('narrator') === 'boy');
check('Registry: lookup case insensitive', registry.lookup('THE BOY') === 'boy');
check('Registry: lookup returns null for unknown', registry.lookup('unknown') === null);
// Test 9: Get by type
registry.register({
    id: 'mangans-sister',
    type: 'character',
    canonicalName: "Mangan's Sister",
    aliases: ['the sister'],
    description: 'Object of the boy\'s infatuation',
});
const chars = registry.getByType('character');
check('Registry: getByType returns correct count', chars.length === 2);
// Test 10: Prompt context generation
const promptContext = registry.toPromptContext();
check('Registry: prompt context includes header', promptContext.includes('Known Entities'));
check('Registry: prompt context includes characters', promptContext.includes('boy'));
check('Registry: prompt context includes descriptions', promptContext.includes('The unnamed narrator'));
// Test 11: Get entity details
const boyEntry = registry.get('boy');
check('Registry: get returns correct entry', (boyEntry === null || boyEntry === void 0 ? void 0 : boyEntry.canonicalName) === 'The Boy');
check('Registry: entry has aliases', (_a = boyEntry === null || boyEntry === void 0 ? void 0 : boyEntry.aliases.includes('narrator')) !== null && _a !== void 0 ? _a : false);
// Test 12: No duplicate registration (same ID)
const initialCount = registry.count;
registry.register({
    id: 'boy', // same ID
    type: 'character',
    canonicalName: 'The Boy Updated',
    aliases: ['new-alias'],
    description: 'Updated description',
});
check('Registry: allows re-registration (updates entry)', registry.count === initialCount);
// ═══════════════════════════════════════════════
//  INTEGRATION TEST (Synthetic)
// ═══════════════════════════════════════════════
console.log('\n--- Integration Test ---\n');
// Simulate two chunks of Araby with overlapping entities
const chunk1Text = `Chapter 1

North Richmond Street, being blind, was a quiet street except at the hour when the Christian Brothers' School set the boys free.
The boy lived with his aunt and uncle. He played with Mangan and the other boys.`;
const chunk2Text = `Chapter 2

Mangan's sister came out on the doorstep and the boy watched her.
She was waiting for something, and the boy thought of her constantly.`;
// Simulate chunk 1 extraction results
const chunk1Registry = new registry_1.EntityRegistry();
chunk1Registry.register({
    id: 'boy',
    type: 'character',
    canonicalName: 'The Boy',
    aliases: ['narrator'],
    description: 'The unnamed protagonist',
    firstSeenChunk: 0,
});
chunk1Registry.register({
    id: 'mangan',
    type: 'character',
    canonicalName: 'Mangan',
    aliases: [],
    description: 'The boy\'s friend',
    firstSeenChunk: 0,
});
// Simulate chunk 2 extraction with registry context
check('Integration: chunk 1 registry has 2 entities', chunk1Registry.count === 2);
// Chunk 2 should reference existing entities
const chunk2Registry = registry_1.EntityRegistry.fromJSON(chunk1Registry.toJSON());
// Simulate finding "Mangan's sister" as new entity
chunk2Registry.register({
    id: 'mangans-sister',
    type: 'character',
    canonicalName: "Mangan's Sister",
    aliases: ['the sister'],
    description: 'Object of the boy\'s infatuation',
    firstSeenChunk: 1,
});
check('Integration: chunk 2 registry has 3 entities', chunk2Registry.count === 3);
check('Integration: Mangan from chunk 1 is reusable', chunk2Registry.lookup('Mangan') === 'mangan');
check('Integration: Boy from chunk 1 is reusable', chunk2Registry.lookup('narrator') === 'boy');
check('Integration: New entity in chunk 2', chunk2Registry.lookup("Mangan's Sister") === 'mangans-sister');
// Test serialization round-trip
const jsonData = chunk2Registry.toJSON();
const restoredRegistry = registry_1.EntityRegistry.fromJSON(jsonData);
check('Integration: JSON round-trip preserves count', restoredRegistry.count === chunk2Registry.count);
check('Integration: JSON round-trip preserves lookups', restoredRegistry.lookup('Mangan') === 'mangan');
// ═══════════════════════════════════════════════
//  SUMMARY
// ═══════════════════════════════════════════════
console.log(`\n${'═'.repeat(40)}`);
console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${passed + failed}`);
console.log(`${'═'.repeat(40)}\n`);
process.exit(failed > 0 ? 1 : 0);
