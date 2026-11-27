export type MorrisVariantId =
  | 'three-mens-morris'
  | 'six-mens-morris'
  | 'nine-mens-morris'
  | 'twelve-mens-morris';

export interface MorrisNode {
  id: number;
  x: number; // 0..100 SVG coordinate
  y: number; // 0..100 SVG coordinate
  label: string;
}

export interface MorrisTopology {
  id: MorrisVariantId;
  piecesPerPlayer: number;
  hasCaptures: boolean;
  canFly: boolean;
  nodes: MorrisNode[];
  edges: [number, number][];
  adjacency: number[][];
  mills: [number, number, number][];
  nodeMills: number[][]; // mill indices each node belongs to
}

function buildAdjacency(nodeCount: number, edges: [number, number][]): number[][] {
  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const [a, b] of edges) {
    if (!adj[a].includes(b)) adj[a].push(b);
    if (!adj[b].includes(a)) adj[b].push(a);
  }
  return adj;
}

function buildNodeMills(nodeCount: number, mills: [number, number, number][]): number[][] {
  const map: number[][] = Array.from({ length: nodeCount }, () => []);
  mills.forEach((mill, idx) => {
    for (const node of mill) {
      map[node].push(idx);
    }
  });
  return map;
}

function createTopology(
  id: MorrisVariantId,
  piecesPerPlayer: number,
  hasCaptures: boolean,
  canFly: boolean,
  nodes: MorrisNode[],
  edges: [number, number][],
  mills: [number, number, number][],
): MorrisTopology {
  return {
    id,
    piecesPerPlayer,
    hasCaptures,
    canFly,
    nodes,
    edges,
    adjacency: buildAdjacency(nodes.length, edges),
    mills,
    nodeMills: buildNodeMills(nodes.length, mills),
  };
}

// Three Men's Morris: 3x3 grid with orthogonal + main diagonal lines
const threeGrid = [16, 50, 84];
const threeLabels = ['a3', 'b3', 'c3', 'a2', 'b2', 'c2', 'a1', 'b1', 'c1'];
const threeNodes: MorrisNode[] = threeLabels.map((label, i) => ({
  id: i,
  x: threeGrid[i % 3],
  y: threeGrid[Math.floor(i / 3)],
  label,
}));
const threeEdges: [number, number][] = [
  [0, 1], [1, 2],
  [3, 4], [4, 5],
  [6, 7], [7, 8],
  [0, 3], [3, 6],
  [1, 4], [4, 7],
  [2, 5], [5, 8],
  [0, 4], [4, 8],
  [2, 4], [4, 6],
];
const threeMills: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// Six Men's Morris: 2 concentric squares (16 nodes)
const sixMap = [12, 31, 50, 69, 88];
const sixCoords: [number, number, string][] = [
  [0, 0, 'a5'], [2, 0, 'c5'], [4, 0, 'e5'], [4, 2, 'e3'],
  [4, 4, 'e1'], [2, 4, 'c1'], [0, 4, 'a1'], [0, 2, 'a3'],
  [1, 1, 'b4'], [2, 1, 'c4'], [3, 1, 'd4'], [3, 2, 'd3'],
  [3, 3, 'd2'], [2, 3, 'c2'], [1, 3, 'b2'], [1, 2, 'b3'],
];
const sixNodes: MorrisNode[] = sixCoords.map(([gx, gy, label], id) => ({
  id,
  x: sixMap[gx],
  y: sixMap[gy],
  label,
}));
const sixEdges: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
  [1, 9], [3, 11], [5, 13], [7, 15],
];
const sixMills: [number, number, number][] = [
  [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
  [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
];

// Nine & Twelve Men's Morris: 3 concentric squares (24 nodes)
const nineMap = [8, 22, 36, 50, 64, 78, 92];
const nineCoords: [number, number, string][] = [
  // Outer square (0..7)
  [0, 0, 'a7'], [3, 0, 'd7'], [6, 0, 'g7'], [6, 3, 'g4'],
  [6, 6, 'g1'], [3, 6, 'd1'], [0, 6, 'a1'], [0, 3, 'a4'],
  // Middle square (8..15)
  [1, 1, 'b6'], [3, 1, 'd6'], [5, 1, 'f6'], [5, 3, 'f4'],
  [5, 5, 'f2'], [3, 5, 'd2'], [1, 5, 'b2'], [1, 3, 'b4'],
  // Inner square (16..23)
  [2, 2, 'c5'], [3, 2, 'd5'], [4, 2, 'e5'], [4, 3, 'e4'],
  [4, 4, 'e3'], [3, 4, 'd3'], [2, 4, 'c3'], [2, 3, 'c4'],
];
const nineNodes: MorrisNode[] = nineCoords.map(([gx, gy, label], id) => ({
  id,
  x: nineMap[gx],
  y: nineMap[gy],
  label,
}));
const nineEdges: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
  [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
  [1, 9], [9, 17],
  [3, 11], [11, 19],
  [5, 13], [13, 21],
  [7, 15], [15, 23],
];
const nineMills: [number, number, number][] = [
  [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
  [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
  [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
  [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23],
];

const twelveEdges: [number, number][] = [
  ...nineEdges,
  [0, 8], [8, 16],
  [2, 10], [10, 18],
  [4, 12], [12, 20],
  [6, 14], [14, 22],
];
const twelveMills: [number, number, number][] = [
  ...nineMills,
  [0, 8, 16], [2, 10, 18], [4, 12, 20], [6, 14, 22],
];

export const MORRIS_TOPOLOGIES: Record<MorrisVariantId, MorrisTopology> = {
  'three-mens-morris': createTopology('three-mens-morris', 3, false, false, threeNodes, threeEdges, threeMills),
  'six-mens-morris': createTopology('six-mens-morris', 6, true, false, sixNodes, sixEdges, sixMills),
  'nine-mens-morris': createTopology('nine-mens-morris', 9, true, true, nineNodes, nineEdges, nineMills),
  'twelve-mens-morris': createTopology('twelve-mens-morris', 12, true, true, nineNodes, twelveEdges, twelveMills),
};
