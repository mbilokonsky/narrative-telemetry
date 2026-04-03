/**
 * Tests for the API server (structural validation, not live LLM calls).
 * Validates the server module imports and endpoint structure.
 */
import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; }
}

console.log('\n--- Server: Module Structure ---\n');

// Test that server module exists and is valid TypeScript
const serverPath = path.resolve(__dirname, '../server.ts');
check('server.ts exists', fs.existsSync(serverPath));

const serverSource = fs.readFileSync(serverPath, 'utf-8');
check('imports express', serverSource.includes("import express from 'express'"));
check('imports cors', serverSource.includes("import cors from 'cors'"));
check('imports ingestText', serverSource.includes('ingestText'));
check('defines /api/ingest endpoint', serverSource.includes('/api/ingest'));
check('defines /api/health endpoint', serverSource.includes('/api/health'));
check('uses SSE headers', serverSource.includes('text/event-stream'));
check('handles text validation', serverSource.includes('Missing or invalid'));
check('handles short text', serverSource.includes('Text too short'));

// Test that pipeline module exports are available
console.log('\n--- Server: Pipeline Integration ---\n');

const pipelinePath = path.resolve(__dirname, '../ingest/pipeline.ts');
check('pipeline.ts exists', fs.existsSync(pipelinePath));

const pipelineSource = fs.readFileSync(pipelinePath, 'utf-8');
check('exports ingestText', pipelineSource.includes('export async function ingestText'));
check('exports ingestTextChunked', pipelineSource.includes('export async function ingestTextChunked'));

// Test that AnalyzeView component exists
console.log('\n--- Server: UI Integration ---\n');

const analyzeViewPath = path.resolve(__dirname, '../../ui/src/components/AnalyzeView.tsx');
check('AnalyzeView.tsx exists', fs.existsSync(analyzeViewPath));

const analyzeSource = fs.readFileSync(analyzeViewPath, 'utf-8');
check('AnalyzeView calls /api/ingest', analyzeSource.includes('/api/ingest'));
check('AnalyzeView calls /api/health', analyzeSource.includes('/api/health'));
check('AnalyzeView handles SSE', analyzeSource.includes('text/event-stream') || analyzeSource.includes('data: '));
check('AnalyzeView has text area', analyzeSource.includes('textarea'));
check('AnalyzeView has lens selector', analyzeSource.includes('formalist'));
check('AnalyzeView shows progress', analyzeSource.includes('extracting'));
check('AnalyzeView handles errors', analyzeSource.includes('error'));
check('AnalyzeView calls onAnalysisComplete', analyzeSource.includes('onAnalysisComplete'));

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
