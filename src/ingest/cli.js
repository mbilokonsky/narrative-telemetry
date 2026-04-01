"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pipeline_1 = require("./pipeline");
const persistence_1 = require("../persistence");
// ── Parse CLI args ──
function usage() {
    console.error(`Usage: npx ts-node src/ingest/cli.ts <text-file> [options]

Options:
  --lens <name>       Interpretive lens (repeatable, e.g. --lens formalist --lens postcolonial)
  --output <path>     Output JSON file path (default: data/<slug>.json via persistence)
  --derive            Include derived insights in output
  --chunked           Use chunked extraction for long texts (auto-detected if > 50K chars)
  --title <title>     Override story title
  --model <model>     LLM model to use (default: claude-haiku-4-5)
  --verbose           Show detailed progress
  --otel <format>     Export OTEL trace: jaeger, otlp, console (requires at least one --lens)
  --otel-output <p>   Output path for OTEL trace (default: traces/<slug>.<fmt>.json)
  --help              Show this help

Examples:
  npx ts-node src/ingest/cli.ts corpus/araby.txt --lens formalist
  npx ts-node src/ingest/cli.ts corpus/araby.txt --lens formalist --lens postcolonial --derive
  npx ts-node src/ingest/cli.ts corpus/araby.txt --output output/araby.json
  npx ts-node src/ingest/cli.ts novel.txt --chunked --lens formalist --derive
  npx ts-node src/ingest/cli.ts corpus/araby.txt --lens formalist --derive --otel jaeger --otel-output traces/araby.json`);
    process.exit(1);
}
function parseArgs(argv) {
    const args = argv.slice(2); // strip node + script path
    if (args.length === 0 || args.includes('--help'))
        usage();
    const textFile = args[0];
    const lenses = [];
    let output;
    let derive = false;
    let chunked = false;
    let title;
    let model;
    let verbose = false;
    let otel;
    let otelOutput;
    for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
            case '--lens':
                if (!args[i + 1]) {
                    console.error('--lens requires a value');
                    process.exit(1);
                }
                lenses.push(args[++i]);
                break;
            case '--output':
                if (!args[i + 1]) {
                    console.error('--output requires a value');
                    process.exit(1);
                }
                output = args[++i];
                break;
            case '--title':
                if (!args[i + 1]) {
                    console.error('--title requires a value');
                    process.exit(1);
                }
                title = args[++i];
                break;
            case '--model':
                if (!args[i + 1]) {
                    console.error('--model requires a value');
                    process.exit(1);
                }
                model = args[++i];
                break;
            case '--derive':
                derive = true;
                break;
            case '--chunked':
                chunked = true;
                break;
            case '--verbose':
                verbose = true;
                break;
            case '--otel':
                if (!args[i + 1]) {
                    console.error('--otel requires a value');
                    process.exit(1);
                }
                otel = args[++i];
                if (!['jaeger', 'otlp', 'console'].includes(otel)) {
                    console.error(`Unknown otel format: ${otel}. Use jaeger, otlp, or console.`);
                    process.exit(1);
                }
                break;
            case '--otel-output':
                if (!args[i + 1]) {
                    console.error('--otel-output requires a value');
                    process.exit(1);
                }
                otelOutput = args[++i];
                break;
            default:
                console.error(`Unknown option: ${args[i]}`);
                usage();
        }
    }
    return { textFile, lenses, output, derive, chunked, title, model, verbose, otel, otelOutput };
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
    // Auto-detect chunked mode for long texts
    const shouldChunk = args.chunked || text.length > 50000;
    if (shouldChunk && !args.chunked) {
        console.log(`[cli] Auto-enabling chunked mode for ${text.length.toLocaleString()} char text`);
    }
    const options = {
        lenses: args.lenses,
        title: args.title,
        model: args.model,
        verbose: args.verbose,
    };
    // Run pipeline
    const model = shouldChunk
        ? await (0, pipeline_1.ingestTextChunked)(text, options)
        : await (0, pipeline_1.ingestText)(text, options);
    const readingCount = Object.keys(model.readings).length;
    const eventCount = Object.keys(model.text.events).length;
    console.log(`[cli] Extracted: ${eventCount} events, ${readingCount} reading(s)`);
    // Derive insights if requested
    let insights;
    if (args.derive && readingCount > 0) {
        insights = (0, pipeline_1.deriveInsights)(model);
        console.log(`[cli] Derived insights: ${Object.keys(insights.tensionCurves).length} tension curve(s), pacing computed`);
        if (insights.divergence) {
            console.log(`[cli] Divergence: ${insights.divergence.divergentEventCount} events with diff > 0.2`);
        }
    }
    // Output
    if (args.output) {
        const outPath = path.resolve(args.output);
        const outDir = path.dirname(outPath);
        if (!fs.existsSync(outDir))
            fs.mkdirSync(outDir, { recursive: true });
        const output = insights ? { ...model, derived: insights } : model;
        fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
        console.log(`[cli] Written to ${outPath}`);
    }
    else {
        const savedPath = (0, persistence_1.saveStoryModel)(model);
        console.log(`[cli] Saved to ${savedPath}`);
    }
    // OTEL export
    if (args.otel) {
        console.log(`[cli] Exporting OTEL trace (${args.otel})...`);
        const result = (0, pipeline_1.exportToOtel)(model, args.otel);
        if (typeof result === 'string') {
            const slug = path.basename(args.textFile, path.extname(args.textFile));
            const defaultOtelPath = path.resolve('traces', `${slug}.${args.otel}.json`);
            const otelPath = args.otelOutput ? path.resolve(args.otelOutput) : defaultOtelPath;
            const otelDir = path.dirname(otelPath);
            if (!fs.existsSync(otelDir))
                fs.mkdirSync(otelDir, { recursive: true });
            fs.writeFileSync(otelPath, result, 'utf-8');
            console.log(`[cli] OTEL trace written to ${otelPath}`);
        }
    }
}
main().catch(err => {
    console.error('[cli] Fatal error:', err.message);
    process.exit(1);
});
