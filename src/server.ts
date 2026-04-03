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
app.use(express.json({ limit: '1mb' }));

// Simple rate limiter: max 5 requests per minute per IP, with periodic eviction
const rateLimitMap = new Map<string, number[]>();
function rateLimit(ip: string, windowMs = 60000, max = 5): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= max) return false;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}
// Evict stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap) {
    const fresh = timestamps.filter(t => now - t < 60000);
    if (fresh.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, fresh);
  }
}, 300000);

const MAX_TEXT_LENGTH = 500_000; // ~500K chars max

/**
 * POST /api/ingest
 * Body: { text: string, title?: string, lenses?: string[], model?: string }
 * Returns: StoryModel JSON via SSE stream
 *
 * Requires ANTHROPIC_API_KEY to be set on the server.
 */
app.post('/api/ingest', async (req, res) => {
  // Check API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'Server has no ANTHROPIC_API_KEY configured' });
    return;
  }

  // Rate limiting
  const clientIp = req.ip ?? 'unknown';
  if (!rateLimit(clientIp)) {
    res.status(429).json({ error: 'Rate limit exceeded (max 5 requests/minute)' });
    return;
  }

  const { text, title, lenses = ['formalist'], model } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "text" field' });
    return;
  }

  if (text.length < 50) {
    res.status(400).json({ error: 'Text too short (minimum 50 characters)' });
    return;
  }

  if (text.length > MAX_TEXT_LENGTH) {
    res.status(400).json({ error: `Text too long (maximum ${MAX_TEXT_LENGTH.toLocaleString()} characters)` });
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

    // 5-minute timeout on the pipeline call
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timed out (5 minute limit)')), 300000)
    );

    const result = await Promise.race([pipeline(text, {
      title,
      lenses,
      model,
      verbose: false,
    }), timeout]);

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
