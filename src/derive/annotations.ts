/**
 * Derive TextAnnotation objects from entity textMentions.
 *
 * The LLM extraction produces textMentions (string snippets) on entities
 * but not character-level annotations. This module searches for those
 * mentions in the source text and produces precise TextAnnotation objects
 * with startLine/startChar/endLine/endChar positions.
 */
import { TextAnnotation } from '../types/structural';

interface Entity {
  id: string;
  name: string;
  textMentions?: string[];
}

/**
 * Given a source text (as lines) and a set of entities with textMentions,
 * produce TextAnnotation objects by searching for each mention in the text.
 */
export function deriveAnnotations(
  lines: string[],
  entities: Entity[],
): TextAnnotation[] {
  const annotations: TextAnnotation[] = [];

  for (const entity of entities) {
    const mentions = entity.textMentions ?? [];
    // Also search for the entity name itself
    const searchTerms = new Set([...mentions, entity.name]);

    for (const mention of searchTerms) {
      // Skip pronouns and very short terms — they match too broadly
      if (!mention || mention.length < 3) continue;
      const lower = mention.toLowerCase();
      if (['the', 'she', 'her', 'his', 'him', 'man', 'boy', 'old'].includes(lower)) continue;

      // Search for this mention in the text
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        let searchFrom = 0;

        while (searchFrom < line.length) {
          const charIdx = line.indexOf(mention, searchFrom);
          if (charIdx === -1) break;

          annotations.push({
            entityId: entity.id,
            startLine: lineIdx + 1, // 1-indexed
            startChar: charIdx,
            endLine: lineIdx + 1,
            endChar: charIdx + mention.length,
            mentionText: mention,
          });

          searchFrom = charIdx + mention.length;
        }
      }
    }
  }

  // Deduplicate: same entity at same position
  const seen = new Set<string>();
  const deduped: TextAnnotation[] = [];
  for (const ann of annotations) {
    const key = `${ann.entityId}:${ann.startLine}:${ann.startChar}:${ann.endChar}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(ann);
    }
  }

  return deduped;
}

/**
 * Extract all entities with textMentions from a StoryModel's diegetic data.
 */
export function collectEntities(diegetic: {
  characters: Record<string, Entity>;
  settings: Record<string, Entity>;
  items: Record<string, Entity>;
  factions?: Record<string, Entity>;
}): Entity[] {
  return [
    ...Object.values(diegetic.characters),
    ...Object.values(diegetic.settings),
    ...Object.values(diegetic.items),
    ...Object.values(diegetic.factions ?? {}),
  ];
}
