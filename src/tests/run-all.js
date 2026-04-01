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
/**
 * Unified test runner — runs all test suites and reports combined results.
 */
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const suites = [
    { name: 'Unit Tests', script: 'src/tests/unit.ts' },
    { name: 'Chunked Extraction', script: 'src/tests/validate-chunked.ts' },
    { name: 'Auto-Generated Output', script: 'src/tests/validate-auto.ts' },
    { name: 'OTEL Export', script: 'src/tests/validate-otel.ts' },
];
let totalPassed = 0;
let totalFailed = 0;
let allGreen = true;
console.log('╔══════════════════════════════════════╗');
console.log('║   narrative-telemetry test suite     ║');
console.log('╚══════════════════════════════════════╝\n');
for (const suite of suites) {
    console.log(`\n${'▶'.repeat(1)} Running: ${suite.name}`);
    console.log('─'.repeat(40));
    try {
        const output = (0, child_process_1.execSync)(`npx ts-node ${suite.script}`, {
            cwd: path.resolve(__dirname, '../..'),
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        // Parse results from output
        const match = output.match(/Passed:\s*(\d+)\s*Failed:\s*(\d+)/);
        if (match) {
            const p = parseInt(match[1]);
            const f = parseInt(match[2]);
            totalPassed += p;
            totalFailed += f;
            if (f > 0)
                allGreen = false;
            console.log(`  ✅ ${suite.name}: ${p} passed, ${f} failed`);
        }
        else {
            console.log(`  ✅ ${suite.name}: completed (no summary found)`);
        }
    }
    catch (err) {
        allGreen = false;
        const output = (err.stdout ?? '') + (err.stderr ?? '');
        const match = output.match(/Passed:\s*(\d+)\s*Failed:\s*(\d+)/);
        if (match) {
            const p = parseInt(match[1]);
            const f = parseInt(match[2]);
            totalPassed += p;
            totalFailed += f;
            console.log(`  ❌ ${suite.name}: ${p} passed, ${f} failed`);
        }
        else {
            totalFailed++;
            console.log(`  ❌ ${suite.name}: CRASHED`);
            console.log(output.split('\n').slice(-5).map((l) => `     ${l}`).join('\n'));
        }
    }
}
console.log('\n' + '═'.repeat(40));
console.log(`Total: ${totalPassed + totalFailed} tests | ${totalPassed} passed | ${totalFailed} failed`);
console.log('═'.repeat(40));
console.log(allGreen ? '\n✅ ALL TESTS PASS\n' : '\n❌ SOME TESTS FAILED\n');
process.exit(allGreen ? 0 : 1);
