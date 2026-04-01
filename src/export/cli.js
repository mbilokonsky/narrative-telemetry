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
const otel_1 = require("./otel");
const jaeger_1 = require("./jaeger");
const otlp_1 = require("./otlp");
const console_1 = require("./console");
// ── Parse CLI args ──
function usage() {
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
function parseArgs(argv) {
    const args = argv.slice(2);
    if (args.length === 0 || args.includes('--help'))
        usage();
    const storyFile = args[0];
    let format = 'jaeger';
    let output;
    let readingName;
    let baseTime;
    let durationSeconds;
    for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
            case '--format':
                if (!args[i + 1]) {
                    console.error('--format requires a value');
                    process.exit(1);
                }
                format = args[++i];
                if (!['jaeger', 'otlp', 'console'].includes(format)) {
                    console.error(`Unknown format: ${format}. Use jaeger, otlp, or console.`);
                    process.exit(1);
                }
                break;
            case '--output':
                if (!args[i + 1]) {
                    console.error('--output requires a value');
                    process.exit(1);
                }
                output = args[++i];
                break;
            case '--reading':
                if (!args[i + 1]) {
                    console.error('--reading requires a value');
                    process.exit(1);
                }
                readingName = args[++i];
                break;
            case '--base-time':
                if (!args[i + 1]) {
                    console.error('--base-time requires a value');
                    process.exit(1);
                }
                baseTime = Number(args[++i]);
                break;
            case '--duration':
                if (!args[i + 1]) {
                    console.error('--duration requires a value');
                    process.exit(1);
                }
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
    const model = JSON.parse(raw);
    console.log(`[otel] Loaded "${model.text.title}" by ${model.text.author}`);
    console.log(`[otel] Readings: ${Object.keys(model.readings).join(', ') || '(none)'}`);
    const otelOptions = {
        baseTime: args.baseTime,
        durationSeconds: args.durationSeconds,
        readingName: args.readingName,
    };
    const trace = (0, otel_1.storyModelToOtel)(model, otelOptions);
    console.log(`[otel] Mapped: ${trace.spans.length} spans, ${trace.spans.reduce((s, sp) => s + sp.events.length, 0)} events`);
    if (args.format === 'console') {
        (0, console_1.consoleExport)(trace);
        return;
    }
    const exported = args.format === 'jaeger'
        ? (0, jaeger_1.jaegerExport)(trace)
        : (0, otlp_1.otlpExport)(trace);
    // Determine output path
    const slug = path.basename(storyPath, '.json');
    const defaultOutput = path.resolve('traces', `${slug}.${args.format}.json`);
    const outPath = args.output ? path.resolve(args.output) : defaultOutput;
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir))
        fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, exported, 'utf-8');
    console.log(`[otel] Written ${args.format} trace to ${outPath}`);
}
main();
