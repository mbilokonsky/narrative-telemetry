import * as fs from 'fs';
import * as path from 'path';
import { StoryModel } from '../types';
import { storyModelToOtel, OtelExportOptions } from './otel';
import { jaegerExport } from './jaeger';
import { otlpExport } from './otlp';
import { consoleExport } from './console';

// ── Parse CLI args ──

function usage(): never {
  console.error(`Usage: npx ts-node src/export/cli.ts <story-file.json> [options]

Options:
  --format <fmt>      Export format: jaeger, otlp, console (default: jaeger)
  --output <path>     Output file path (default: traces/<slug>.<fmt>.json)
  --reading <name>    Which reading to use for attributes (default: first available)
  --base-time <sec>   Base time in seconds since epoch (default: now)
  --duration <sec>    Story duration in seconds (default: 3600)
  --help              Show this help

Examples:
  npx ts-node src/export/cli.ts data/araby.json
  npx ts-node src/export/cli.ts data/araby.json --format otlp --output traces/araby-otlp.json
  npx ts-node src/export/cli.ts data/araby.json --format console
  npx ts-node src/export/cli.ts data/araby.json --reading formalist --duration 7200`);
  process.exit(1);
}

interface ExportCliArgs {
  storyFile: string;
  format: 'jaeger' | 'otlp' | 'console';
  output?: string;
  readingName?: string;
  baseTime?: number;
  durationSeconds?: number;
}

function parseArgs(argv: string[]): ExportCliArgs {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes('--help')) usage();

  const storyFile = args[0];
  let format: 'jaeger' | 'otlp' | 'console' = 'jaeger';
  let output: string | undefined;
  let readingName: string | undefined;
  let baseTime: number | undefined;
  let durationSeconds: number | undefined;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--format':
        if (!args[i + 1]) { console.error('--format requires a value'); process.exit(1); }
        format = args[++i] as any;
        if (!['jaeger', 'otlp', 'console'].includes(format)) {
          console.error(`Unknown format: ${format}. Use jaeger, otlp, or console.`);
          process.exit(1);
        }
        break;
      case '--output':
        if (!args[i + 1]) { console.error('--output requires a value'); process.exit(1); }
        output = args[++i];
        break;
      case '--reading':
        if (!args[i + 1]) { console.error('--reading requires a value'); process.exit(1); }
        readingName = args[++i];
        break;
      case '--base-time':
        if (!args[i + 1]) { console.error('--base-time requires a value'); process.exit(1); }
        baseTime = Number(args[++i]);
        break;
      case '--duration':
        if (!args[i + 1]) { console.error('--duration requires a value'); process.exit(1); }
        durationSeconds = Number(args[++i]);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        usage();
    }
  }

  return { storyFile, format, output, readingName, baseTime, durationSeconds };
}

// ── Main ──

function main() {
  const args = parseArgs(process.argv);

  const storyPath = path.resolve(args.storyFile);
  if (!fs.existsSync(storyPath)) {
    console.error(`File not found: ${storyPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(storyPath, 'utf-8');
  const model: StoryModel = JSON.parse(raw);

  console.log(`[otel] Loaded "${model.text.title}" by ${model.text.author}`);
  console.log(`[otel] Readings: ${Object.keys(model.readings).join(', ') || '(none)'}`);

  const otelOptions: OtelExportOptions = {
    baseTime: args.baseTime,
    durationSeconds: args.durationSeconds,
    readingName: args.readingName,
  };

  const trace = storyModelToOtel(model, otelOptions);
  console.log(`[otel] Mapped: ${trace.spans.length} spans, ${trace.spans.reduce((s, sp) => s + sp.events.length, 0)} events`);

  if (args.format === 'console') {
    consoleExport(trace);
    return;
  }

  const exported = args.format === 'jaeger'
    ? jaegerExport(trace)
    : otlpExport(trace);

  // Determine output path
  const slug = path.basename(storyPath, '.json');
  const defaultOutput = path.resolve('traces', `${slug}.${args.format}.json`);
  const outPath = args.output ? path.resolve(args.output) : defaultOutput;

  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outPath, exported, 'utf-8');
  console.log(`[otel] Written ${args.format} trace to ${outPath}`);
}

main();
