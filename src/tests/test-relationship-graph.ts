/**
 * Tests for entity relationship graph (M2).
 * Validates graph building from story data.
 */
import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); failed++; }
}

console.log('\n--- Relationship Graph: Component ---\n');

const graphPath = path.resolve(__dirname, '../../ui/src/components/RelationshipGraph.tsx');
check('RelationshipGraph.tsx exists', fs.existsSync(graphPath));
const graphSource = fs.readFileSync(graphPath, 'utf-8');
check('Has force simulation', graphSource.includes('simulate'));
check('Has node rendering', graphSource.includes('GraphNode'));
check('Has edge rendering', graphSource.includes('GraphEdge'));
check('Has co-participation detection', graphSource.includes('co-participation'));
check('Has node type colors', graphSource.includes('NODE_COLORS'));
check('Has entity selection', graphSource.includes('onSelectEntity'));

console.log('\n--- Relationship Graph: Data Validation ---\n');

// Replicate graph building logic
interface GraphNode { id: string; name: string; type: string; }
interface GraphEdge { source: string; target: string; name: string; }

function buildGraphFromStory(story: any): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const nodeIds = new Set<string>();

  for (const [id, char] of Object.entries(story.text.diegetic.characters) as any[]) {
    nodes.push({ id, name: char.name, type: 'character' });
    nodeIds.add(id);
  }
  for (const [id, setting] of Object.entries(story.text.diegetic.settings) as any[]) {
    nodes.push({ id, name: setting.name, type: 'setting' });
    nodeIds.add(id);
  }

  const edges: GraphEdge[] = [];
  const interpersonal = story.text.relationships?.interpersonal ?? {};
  for (const rel of Object.values(interpersonal) as any[]) {
    if (rel.participants?.length >= 2) {
      const [source, target] = rel.participants;
      if (nodeIds.has(source) && nodeIds.has(target)) {
        edges.push({ source, target, name: rel.name ?? '' });
      }
    }
  }
  return { nodes, edges };
}

const arabyPath = path.resolve(__dirname, '../../ui/public/data/araby.json');
if (fs.existsSync(arabyPath)) {
  const araby = JSON.parse(fs.readFileSync(arabyPath, 'utf-8'));
  const g = buildGraphFromStory(araby);

  check('Araby: has nodes', g.nodes.length > 0, `${g.nodes.length} nodes`);
  check('Araby: has character nodes', g.nodes.some(n => n.type === 'character'));
  check('Araby: has setting nodes', g.nodes.some(n => n.type === 'setting'));
  check('Araby: has edges', g.edges.length > 0, `${g.edges.length} edges`);
  check('Araby: edges reference valid nodes', g.edges.every(e =>
    g.nodes.some(n => n.id === e.source) && g.nodes.some(n => n.id === e.target)
  ));
}

// Test with a more complex story
const deadPath = path.resolve(__dirname, '../../ui/public/data/dubliners/the-dead-formalist.json');
if (fs.existsSync(deadPath)) {
  const dead = JSON.parse(fs.readFileSync(deadPath, 'utf-8'));
  const g = buildGraphFromStory(dead);
  check('The Dead: has multiple nodes', g.nodes.length >= 5, `${g.nodes.length} nodes`);
  check('The Dead: has relationships', g.edges.length > 0, `${g.edges.length} edges`);
}

console.log('\n--- Relationship Graph: Integration ---\n');

const inspectorPath = path.resolve(__dirname, '../../ui/src/components/DetailInspector.tsx');
const inspectorSource = fs.readFileSync(inspectorPath, 'utf-8');
check('DetailInspector imports RelationshipGraph', inspectorSource.includes('RelationshipGraph'));
check('DetailInspector renders RelationshipGraph', inspectorSource.includes('<RelationshipGraph'));

const appPath = path.resolve(__dirname, '../../ui/src/App.tsx');
const appSource = fs.readFileSync(appPath, 'utf-8');
check('App passes onSelectEntity to DetailInspector', appSource.includes('onSelectEntity={handleSelectEntity}'));

console.log(`\nPassed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
