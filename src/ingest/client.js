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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Create an Anthropic client that works with both standard API keys
 * and OAuth tokens (sk-ant-oat01-*).
 *
 * Priority:
 * 1. ANTHROPIC_API_KEY env var (standard API key)
 * 2. OAuth token from OpenClaw auth profiles
 */
function createClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    // If standard API key is set, use it normally
    if (apiKey && !apiKey.startsWith('sk-ant-oat')) {
        return new sdk_1.default({ apiKey });
    }
    // Try OAuth token (from env or auth profiles)
    const oauthToken = (apiKey === null || apiKey === void 0 ? void 0 : apiKey.startsWith('sk-ant-oat'))
        ? apiKey
        : loadOAuthToken();
    if (oauthToken) {
        return new sdk_1.default({
            apiKey: '', // must be empty string, not null
            authToken: oauthToken,
            defaultHeaders: {
                'anthropic-beta': 'claude-code-20250219,oauth-2025-04-20',
                'user-agent': 'claude-cli/2.1.62',
                'x-app': 'cli',
            },
        });
    }
    // Fallback: let Anthropic SDK handle it (will error if no key)
    return new sdk_1.default();
}
function loadOAuthToken() {
    var _a, _b, _c;
    const profilePaths = [
        path.join((_a = process.env.HOME) !== null && _a !== void 0 ? _a : '', '.openclaw/agents/main/agent/auth-profiles.json'),
    ];
    for (const p of profilePaths) {
        try {
            if (fs.existsSync(p)) {
                const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
                const profile = (_b = data.profiles) === null || _b === void 0 ? void 0 : _b['anthropic:default'];
                if ((_c = profile === null || profile === void 0 ? void 0 : profile.token) === null || _c === void 0 ? void 0 : _c.startsWith('sk-ant-oat')) {
                    return profile.token;
                }
            }
        }
        catch (_d) {
            // ignore
        }
    }
    return undefined;
}
