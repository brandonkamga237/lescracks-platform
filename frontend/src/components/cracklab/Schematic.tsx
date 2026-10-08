import { memo } from 'react';

type NodeKind = 'client' | 'edge' | 'service' | 'db' | 'cache' | 'queue' | 'store';
type Column = Array<[NodeKind, string]>;

// One small architecture per category: the lab's illustration is the subject itself, a system diagram.
const TEMPLATES: Record<string, Column[]> = {
  backend: [[['client', 'client']], [['edge', 'api']], [['service', 'service'], ['service', 'worker']], [['db', 'postgres'], ['cache', 'cache']]],
  architecture: [[['client', 'client']], [['edge', 'lb']], [['service', 'svc-a'], ['service', 'svc-b'], ['service', 'svc-c']], [['queue', 'queue']], [['db', 'db']]],
  database: [[['service', 'app']], [['edge', 'pool']], [['db', 'primary']], [['db', 'replica'], ['db', 'replica']]],
  devops: [[['store', 'repo']], [['edge', 'ci']], [['store', 'registry']], [['service', 'node'], ['service', 'node'], ['service', 'node']]],
  frontend: [[['client', 'browser']], [['edge', 'cdn']], [['service', 'ssr']], [['edge', 'api']]],
  securite: [[['client', 'client']], [['edge', 'waf']], [['edge', 'auth']], [['service', 'api']], [['store', 'vault']]],
  mobile: [[['client', 'mobile']], [['store', 'local']], [['edge', 'sync']], [['db', 'db']]],
  data: [[['service', 'source'], ['service', 'source']], [['queue', 'stream']], [['service', 'etl']], [['store', 'warehouse']]],
  cloud: [[['client', 'client']], [['edge', 'dns']], [['service', 'region-a'], ['service', 'region-b']], [['db', 'db']]],
};

const W = 320;
const H = 180;
const NODE_W = 52;
const NODE_H = 26;

function normalize(category: string) {
  return category.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function hash(text: string) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return value >>> 0;
}

function Shape({ kind, x, y }: { kind: NodeKind; x: number; y: number }) {
  const left = x - NODE_W / 2;
  const top = y - NODE_H / 2;
  switch (kind) {
    case 'client':
      return <g><rect x={left} y={top} width={NODE_W} height={NODE_H} rx={2} /><line x1={left} y1={top + 6} x2={left + NODE_W} y2={top + 6} /></g>;
    case 'edge':
      return <rect x={left} y={top} width={NODE_W} height={NODE_H} rx={NODE_H / 2} />;
    case 'db':
      return <g><path d={`M${left} ${top + 4} v${NODE_H - 8} a${NODE_W / 2} 4 0 0 0 ${NODE_W} 0 v${-(NODE_H - 8)}`} /><ellipse cx={x} cy={top + 4} rx={NODE_W / 2} ry={4} /></g>;
    case 'cache':
      return <rect x={left} y={top} width={NODE_W} height={NODE_H} rx={2} strokeDasharray="3 2" />;
    case 'queue':
      return <g><rect x={left} y={top} width={NODE_W} height={NODE_H} rx={2} />{[1, 2, 3].map((i) => <line key={i} x1={left + NODE_W - i * 6} y1={top + 5} x2={left + NODE_W - i * 6} y2={top + NODE_H - 5} />)}</g>;
    case 'store':
      return <path d={`M${left} ${top} h${NODE_W - 8} l8 8 v${NODE_H - 8} h${-NODE_W} z M${left + NODE_W - 8} ${top} v8 h8`} />;
    default:
      return <rect x={left} y={top} width={NODE_W} height={NODE_H} rx={2} />;
  }
}

interface SchematicProps {
  seed: string;
  category: string;
  /** Node labels: on for the large drawing, off for a thumbnail where they would be unreadable. */
  labels?: boolean;
  className?: string;
}

/**
 * A deterministic system diagram for a challenge: the category picks the architecture, the slug
 * picks the variation and which component is the one under study (drawn in gold).
 */
function Schematic({ seed, category, labels = true, className = '' }: SchematicProps) {
  const h = hash(seed);
  const columns = (TEMPLATES[normalize(category)] ?? TEMPLATES.backend).map((column) => [...column]);
  // Variation: one middle column gains or loses a node, so two challenges of a category differ.
  const middle = 1 + (h % Math.max(1, columns.length - 2));
  if ((h >> 3) % 2 === 0 && columns[middle].length < 3) columns[middle].push(columns[middle][0]);
  else if (columns[middle].length > 1) columns[middle].pop();

  const margin = 34;
  const step = (W - margin * 2) / (columns.length - 1);
  const placed = columns.map((column, c) => column.map(([kind, label], r) => ({
    kind, label, x: margin + c * step, y: H / 2 + (r - (column.length - 1) / 2) * (NODE_H + 16),
  })));
  const candidates = placed.slice(1).flat();
  const hot = candidates[(h >> 5) % candidates.length];

  const edges: Array<{ d: string; hot: boolean }> = [];
  for (let c = 0; c < placed.length - 1; c++) {
    for (const from of placed[c]) {
      for (const to of placed[c + 1]) {
        // Fan-outs connect everything; wider meshes only link facing nodes, or the drawing turns to noise.
        if (placed[c].length > 1 && placed[c + 1].length > 1 && placed[c].indexOf(from) !== placed[c + 1].indexOf(to)) continue;
        const x1 = from.x + NODE_W / 2;
        const x2 = to.x - NODE_W / 2 - 3;
        const mid = (x1 + x2) / 2;
        edges.push({ d: from.y === to.y ? `M${x1} ${from.y} H${x2}` : `M${x1} ${from.y} H${mid} V${to.y} H${x2}`, hot: to === hot });
      }
    }
  }
  const bounds = placed.slice(1, -1).flat();
  const boundary = bounds.length ? {
    x: Math.min(...bounds.map((n) => n.x)) - NODE_W / 2 - 8,
    y: Math.min(...bounds.map((n) => n.y)) - NODE_H / 2 - 10,
    right: Math.max(...bounds.map((n) => n.x)) + NODE_W / 2 + 8,
    bottom: Math.max(...bounds.map((n) => n.y)) + NODE_H / 2 + 10,
  } : null;

  // The frame hugs the drawing, so a thumbnail shows the system rather than empty margins.
  const all = placed.flat();
  const pad = labels ? 14 : 8;
  const minX = Math.min(...all.map((n) => n.x)) - NODE_W / 2 - pad;
  const maxX = Math.max(...all.map((n) => n.x)) + NODE_W / 2 + pad;
  const minY = Math.min(boundary?.y ?? H, ...all.map((n) => n.y - NODE_H / 2)) - pad;
  const maxY = Math.max(boundary?.bottom ?? 0, ...all.map((n) => n.y + NODE_H / 2)) + pad;

  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className={className} role="img" aria-label={`Schéma d’architecture, ${category}`} fill="none" strokeWidth={labels ? 1 : 1.5}>
      <defs>
        {(['plain', 'hot'] as const).map((tone) => (
          <marker key={tone} id={`arrow-${tone}-${h}`} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L6 3 L0 6" fill="none" className={tone === 'hot' ? 'stroke-gold-400' : 'stroke-t4'} />
          </marker>
        ))}
      </defs>
      {boundary && (
        <rect x={boundary.x} y={boundary.y} width={boundary.right - boundary.x} height={boundary.bottom - boundary.y} rx={4}
          className="stroke-line" strokeDasharray="2 3" />
      )}
      <g className="stroke-t4">
        {edges.filter((edge) => !edge.hot).map((edge) => <path key={edge.d} d={edge.d} markerEnd={`url(#arrow-plain-${h})`} />)}
      </g>
      <g className="stroke-gold-400">
        {edges.filter((edge) => edge.hot).map((edge) => <path key={edge.d} d={edge.d} markerEnd={`url(#arrow-hot-${h})`} />)}
      </g>
      {placed.flat().map((node) => (
        <g key={`${node.x}-${node.y}`} className={node === hot ? 'fill-gold-400/10 stroke-gold-400' : 'fill-noir-900 stroke-t3'}>
          <Shape kind={node.kind} x={node.x} y={node.y} />
          {labels && (
            <text x={node.kind === 'queue' ? node.x - 9 : node.x} y={node.y + (node.kind === 'db' ? 6 : node.kind === 'client' ? 5 : 3)} textAnchor="middle"
              className={`stroke-none font-mono text-[7.5px] ${node === hot ? 'fill-gold-400' : 'fill-t3'}`}>{node.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default memo(Schematic);
