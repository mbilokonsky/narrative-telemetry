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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const extract_1 = require("./extract");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const text = fs.readFileSync(path.resolve(__dirname, '../../corpus/araby.txt'), 'utf-8');
        console.log(`Read ${text.split('\n').length} lines from corpus/araby.txt`);
        const textModel = yield (0, extract_1.extractTextModel)(text);
        // Validation checks
        const chars = Object.keys(textModel.diegetic.characters);
        const settings = Object.keys(textModel.diegetic.settings);
        const items = Object.keys(textModel.diegetic.items);
        const events = Object.keys(textModel.events);
        const absentials = Object.keys(textModel.absentials);
        const rels = Object.keys(textModel.relationships.interpersonal);
        console.log('\n=== Phase 1 Validation ===');
        console.log(`Characters: ${chars.length} (target: ~11)`);
        console.log(`  IDs: ${chars.join(', ')}`);
        console.log(`Settings: ${settings.length} (target: ~9)`);
        console.log(`  IDs: ${settings.join(', ')}`);
        console.log(`Items: ${items.length} (target: ~7)`);
        console.log(`  IDs: ${items.join(', ')}`);
        console.log(`Events: ${events.length} (target: ~28)`);
        console.log(`Absentials: ${absentials.length} (target: ~5)`);
        console.log(`Relationships: ${rels.length}`);
        // Check span nesting
        const root = textModel.rootSpan;
        console.log(`\nSpan tree: ${root.childSpans.length} acts`);
        for (const act of root.childSpans) {
            console.log(`  ${act.title}: ${act.childSpans.length} scenes, ${act.events.length} direct events`);
            for (const scene of act.childSpans) {
                console.log(`    ${scene.title}: ${scene.childSpans.length} beats, ${scene.events.length} direct events`);
            }
        }
        // Check event cross-references
        let badRefs = 0;
        const allEntityIds = new Set([...chars, ...settings, ...items, ...Object.keys(textModel.diegetic.factions)]);
        for (const [eid, evt] of Object.entries(textModel.events)) {
            for (const pid of evt.participants) {
                if (!allEntityIds.has(pid)) {
                    console.log(`  WARNING: Event ${eid} references unknown participant: ${pid}`);
                    badRefs++;
                }
            }
        }
        console.log(`\nCross-reference check: ${badRefs} bad references`);
        // Write output for inspection
        const outPath = path.resolve(__dirname, '../../data/araby-extracted.json');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify({ text: textModel, readings: {} }, null, 2));
        console.log(`\nWrote output to ${outPath}`);
    });
}
main().catch(err => {
    console.error('Extraction failed:', err);
    process.exit(1);
});
