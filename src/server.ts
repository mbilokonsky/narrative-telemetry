/**
 * API server for the narrative-telemetry UI.
 * Provides endpoints for live LLM ingestion (paste-and-analyze).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... npx ts-node src/server.ts
 *   # or
 *   npm run server
 */
import express from 'express';
import cors from 'cors';
import { ingestText, ingestTextChunked } from './ingest/pipeline';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

/**
 * POST /api/ingest
 * Body: { text: string, title?: string, lenses?: string[], model?: string }
 * Returns: StoryModel JSON
 *
 * Uses SSE to stream progress updates, then sends the final result.
 */
app.post('/api/ingest', async (req, res) => {
  const { text, title, lenses = ['formalist'], model } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "text" field' });
    return;
  }

  if (text.length < 50) {
    res.status(400).json({ error: 'Text too short (minimum 50 characters)' });
    return;
  }

  // Set up SSE for progress streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function sendEvent(type: string, data: any) {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  }

  try {
    sendEvent('progress', { stage: 'extracting', message: 'Extracting narrative structure...' });

    const useChunked = text.length > 50000;
    const pipeline = useChunked ? ingestTextChunked : ingestText;

    const result = await pipeline(text, {
      title,
      lenses,
      model,
      verbose: false,
    });

    sendEvent('progress', { stage: 'complete', message: 'Analysis complete' });
    sendEvent('result', { model: result });
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    sendEvent('error', { message: err.message ?? 'Unknown error' });
    res.end();
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (_req, res) => {
  const hasKey = !!(process.env.ANTHROPIC_API_KEY);
  res.json({ status: 'ok', hasApiKey: hasKey });
});

app.listen(PORT, () => {
  console.log(`Narrative Telemetry API server running on http://localhost:${PORT}`);
  console.log(`API key configured: ${!!process.env.ANTHROPIC_API_KEY}`);
});
