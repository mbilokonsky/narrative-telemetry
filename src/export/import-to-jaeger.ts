/**
 * Import all analyzed stories into Jaeger as OTEL traces.
 *
 * Usage:
 *   docker compose up -d                    # start Jaeger
 *   npx ts-node src/export/import-to-jaeger.ts   # import all stories
 *
 * Then open http://localhost:16686 to query narrative traces.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { StoryModel } from '../types';
import { storyModelToOtel } from './otel';
import { otlpExport } from './otlp';

const JAEGER_OTLP_URL = process.env.JAEGER_URL ?? 'http://localhost:4318';
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

function findStoryFiles(): { path: string; name: string }[] {
  const files: { path: string; name: string }[] = [];

  // Hand-coded stories
  const dataDir = path.resolve(__dirname, '../../ui/public/data');
  const arabyPath = path.join(dataDir, 'araby.json');
  if (fs.existsSync(arabyPath)) {
    files.push({ path: arabyPath, name: 'araby (hand-coded)' });
  }

  // Auto-generated stories
  for (const collection of ['dubliners', 'mansfield']) {
    const dir = path.join(OUTPUT_DIR, collection);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.json')) {
        files.push({ path: path.join(dir, file), name: `${collection}/${file}` });
      }
    }
  }

  return files;
}

async function sendToJaeger(otlpJson: string): Promise<boolean> {
  return new Promise((resolve) => {
    const url = new URL(`${JAEGER_OTLP_URL}/v1/traces`);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(otlpJson),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            console.error(`  HTTP ${res.statusCode}: ${body.slice(0, 200)}`);
            resolve(false);
          }
        });
      },
    );
    req.on('error', (err) => {
      console.error(`  Connection error: ${err.message}`);
      resolve(false);
    });
    req.write(otlpJson);
    req.end();
  });
}

async function main() {
  console.log('Narrative Telemetry → Jaeger Import');
  console.log('═'.repeat(40));
  console.log(`Target: ${JAEGER_OTLP_URL}\n`);

  const files = findStoryFiles();
  console.log(`Found ${files.length} story files\n`);

  let imported = 0;
  let failed = 0;

  for (const file of files) {
    process.stdout.write(`  ${file.name}... `);
    try {
      const raw = fs.readFileSync(file.path, 'utf-8');
      const model: StoryModel = JSON.parse(raw);

      const trace = storyModelToOtel(model);
      const otlpJson = otlpExport(trace);

      const ok = await sendToJaeger(otlpJson);
      if (ok) {
        const readingCount = Object.keys(model.readings).length;
        const eventCount = Object.keys(model.text.events).length;
        console.log(`✓ (${eventCount} events, ${readingCount} readings)`);
        imported++;
      } else {
        console.log('✗ (failed to send)');
        failed++;
      }
    } catch (err: any) {
      console.log(`✗ (${err.message})`);
      failed++;
    }
  }

  console.log(`\n${'═'.repeat(40)}`);
  console.log(`Imported: ${imported} | Failed: ${failed}`);
  if (imported > 0) {
    console.log(`\nOpen Jaeger UI: http://localhost:16686`);
    console.log(`Service name: "narrative-telemetry"`);
  }
}

main().catch(console.error);
