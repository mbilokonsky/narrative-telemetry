import * as fs from 'fs';
import * as path from 'path';

/**
 * Entity Registry for chunked extraction.
 * 
 * Tracks all known entities across chunks so the LLM can reuse canonical IDs.
 * Prevents duplicates like "Mangan's sister" vs "the sister" vs "Mangan sister".
 */

export type EntityType = 'character' | 'setting' | 'item' | 'faction' | 'absential';

export interface RegistryEntry {
  id: string;
  type: EntityType;
  canonicalName: string;
  aliases: string[];
  description: string;
  firstSeenChunk: number;
}

export class EntityRegistry {
  private entities: Map<string, RegistryEntry> = new Map();
  private nameIndex: Map<string, string> = new Map(); // name/alias -> id

  /**
   * Register a new entity or update an existing one.
   */
  register(entry: Omit<RegistryEntry, 'firstSeenChunk'> & { firstSeenChunk?: number }): void {
    const fullEntry: RegistryEntry = {
      ...entry,
      firstSeenChunk: entry.firstSeenChunk ?? 0,
    };

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
  lookup(nameOrAlias: string): string | null {
    const normalized = this.normalize(nameOrAlias);
    return this.nameIndex.get(normalized) ?? null;
  }

  /**
   * Get an entity by ID.
   */
  get(id: string): RegistryEntry | undefined {
    return this.entities.get(id);
  }

  /**
   * Check if an entity exists.
   */
  has(id: string): boolean {
    return this.entities.has(id);
  }

  /**
   * Get all entities of a specific type.
   */
  getByType(type: EntityType): RegistryEntry[] {
    return [...this.entities.values()].filter(e => e.type === type);
  }

  /**
   * Get all registered entities.
   */
  getAll(): RegistryEntry[] {
    return [...this.entities.values()];
  }

  /**
   * Get count of registered entities.
   */
  get count(): number {
    return this.entities.size;
  }

  /**
   * Generate a compact prompt context for the LLM.
   * 
   * This gets prepended to extraction prompts for chunks after the first,
   * so the LLM knows which entity IDs to reuse.
   */
  toPromptContext(): string {
    if (this.entities.size === 0) {
      return '';
    }

    const lines: string[] = [
      '## Known Entities (REUSE these IDs — do not create duplicates)',
      '',
    ];

    // Group by type
    const byType: Record<EntityType, RegistryEntry[]> = {
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
      if (entries.length === 0) continue;
      
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
  toJSON(): RegistryEntry[] {
    return this.getAll();
  }

  /**
   * Load registry from JSON.
   */
  static fromJSON(entries: RegistryEntry[]): EntityRegistry {
    const registry = new EntityRegistry();
    for (const entry of entries) {
      registry.register(entry);
    }
    return registry;
  }

  /**
   * Save registry to file.
   */
  save(filePath: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(this.toJSON(), null, 2), 'utf-8');
  }

  /**
   * Load registry from file.
   */
  static load(filePath: string): EntityRegistry {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const entries = JSON.parse(raw) as RegistryEntry[];
    return EntityRegistry.fromJSON(entries);
  }

  private normalize(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
