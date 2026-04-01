import * as fs from 'fs';
import * as path from 'path';
import { ingestText, deriveInsights } from './pipeline';
import { saveStoryModel } from '../persistence';

// ── Parse CLI args ──

function usage(): never {
  console.error(`Usage: npx ts-node src/ingest/cli.ts <text-file> [options]

Options:
  --lens <name>       Interpretive lens (repeatable, e.g. --lens formalist --lens postcolonial)
  --output <path>     Output JSON file path (default: data/<slug>.json via persistence)
  --derive            Include derived insights in output
  --help              Show this help

Examples:
  npx ts-node src/ingest/cli.ts corpus/araby.txt --lens formalist
  npx ts-node src/ingest/cli.ts corpus/araby.txt --lens formalist --lens postcolonial --derive
  npx ts-node src/ingest/cli.ts corpus/araby.txt --output output/araby.json`);
  process.exit(1);
}

interface CliArgs {
  textFile: string;
  lenses: string[];
  output?: string;
  derive: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2); // strip node + script path
  if (args.length === 0 || args.includes('--help')) usage();

  const textFile = args[0];
  const lenses: string[] = [];
  let output: string | undefined;
  let derive = false;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--lens':
        if (!args[i + 1]) { console.error('--lens requires a value'); process.exit(1); }
        lenses.push(args[++i]);
        break;
      case '--output':
        if (!args[i + 1]) { console.error('--output requires a value'); process.exit(1); }
        output = args[++i];
        break;
      case '--derive':
        derive = true;
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        usage();
    }
  }

  return { textFile, lenses, output, derive };
}

// ── Main ──

async function main() {
  const args = parseArgs(process.argv);

  const textPath = path.resolve(args.textFile);
  if (!fs.existsSync(textPath)) {
    console.error(`File not found: ${textPath}`);
    process.exit(1);
  }

  const text = fs.readFileSync(textPath, 'utf-8');
  console.log(`[cli] Read ${text.split('\n').length} lines from ${args.textFile}`);

  // Run pipeline
  const model = await ingestText(text, { lenses: args.lenses });

  const readingCount = Object.keys(model.readings).length;
  const eventCount = Object.keys(model.text.events).length;
  console.log(`[cli] Extracted: ${eventCount} events, ${readingCount} reading(s)`);

  // Derive insights if requested
  let insights;
  if (args.derive && readingCount > 0) {
    insights = deriveInsights(model);
    console.log(`[cli] Derived insights: ${Object.keys(insights.tensionCurves).length} tension curve(s), pacing computed`);
    if (insights.divergence) {
      console.log(`[cli] Divergence: ${insights.divergence.divergentEventCount} events with diff > 0.2`);
    }
  }

  // Output
  if (args.output) {
    const outPath = path.resolve(args.output);
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const output = insights ? { ...model, derived: insights } : model;
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`[cli] Written to ${outPath}`);
  } else {
    const savedPath = saveStoryModel(model);
    console.log(`[cli] Saved to ${savedPath}`);
  }
}

main().catch(err => {
  console.error('[cli] Fatal error:', err.message);
  process.exit(1);
});
