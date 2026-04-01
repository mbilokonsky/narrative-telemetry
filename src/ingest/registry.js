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
exports.EntityRegistry = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class EntityRegistry {
    constructor() {
        this.entities = new Map();
        this.nameIndex = new Map(); // name/alias -> id
    }
    /**
     * Register a new entity or update an existing one.
     */
    register(entry) {
        var _a;
        const fullEntry = Object.assign(Object.assign({}, entry), { firstSeenChunk: (_a = entry.firstSeenChunk) !== null && _a !== void 0 ? _a : 0 });
        this.entities.set(entry.id, fullEntry);
        // Index canonical name
        this.nameIndex.set(this.normalize(entry.canonicalName), entry.id);
        // Index aliases
        for (const alias of entry.aliases) {
            this.nameIndex.set(this.normalize(alias), entry.id);
        }
    }
    /**
     * Look up an entity ID by name or alias.
     * Returns null if not found.
     */
    lookup(nameOrAlias) {
        var _a;
        const normalized = this.normalize(nameOrAlias);
        return (_a = this.nameIndex.get(normalized)) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Get an entity by ID.
     */
    get(id) {
        return this.entities.get(id);
    }
    /**
     * Check if an entity exists.
     */
    has(id) {
        return this.entities.has(id);
    }
    /**
     * Get all entities of a specific type.
     */
    getByType(type) {
        return [...this.entities.values()].filter(e => e.type === type);
    }
    /**
     * Get all registered entities.
     */
    getAll() {
        return [...this.entities.values()];
    }
    /**
     * Get count of registered entities.
     */
    get count() {
        return this.entities.size;
    }
    /**
     * Generate a compact prompt context for the LLM.
     *
     * This gets prepended to extraction prompts for chunks after the first,
     * so the LLM knows which entity IDs to reuse.
     */
    toPromptContext() {
        if (this.entities.size === 0) {
            return '';
        }
        const lines = [
            '## Known Entities (REUSE these IDs — do not create duplicates)',
            '',
        ];
        // Group by type
        const byType = {
            character: [],
            setting: [],
            item: [],
            faction: [],
            absential: [],
        };
        for (const entry of this.entities.values()) {
            byType[entry.type].push(entry);
        }
        for (const [type, entries] of Object.entries(byType)) {
            if (entries.length === 0)
                continue;
            lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}s (${entries.length})`);
            for (const e of entries) {
                const aliasStr = e.aliases.length > 0 ? ` [aka: ${e.aliases.join(', ')}]` : '';
                lines.push(`- ${e.id}: ${e.canonicalName}${aliasStr} — ${e.description}`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Serialize registry to JSON.
     */
    toJSON() {
        return this.getAll();
    }
    /**
     * Load registry from JSON.
     */
    static fromJSON(entries) {
        const registry = new EntityRegistry();
        for (const entry of entries) {
            registry.register(entry);
        }
        return registry;
    }
    /**
     * Save registry to file.
     */
    save(filePath) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(this.toJSON(), null, 2), 'utf-8');
    }
    /**
     * Load registry from file.
     */
    static load(filePath) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const entries = JSON.parse(raw);
        return EntityRegistry.fromJSON(entries);
    }
    normalize(name) {
        return name
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
exports.EntityRegistry = EntityRegistry;
