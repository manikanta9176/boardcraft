import { Difficulty, Player } from '../types/game';

export const DOTS_GRID = 5; // 5x5 dots => 4x4 boxes
export const BOX_GRID = DOTS_GRID - 1;

export interface EdgeMove {
  orientation: 'h' | 'v';
  row: number;
  col: number;
}

export interface DotsBoxesState {
  hEdges: (Player | null)[][]; // 5 rows x 4 cols
  vEdges: (Player | null)[][]; // 4 rows x 5 cols
  boxes: (Player | null)[][];  // 4 rows x 4 cols
  turn: Player;
  scores: Record<Player, number>;
  winner: Player | 'draw' | null;
  lastEdge: EdgeMove | null;
  lastClaimedBoxes: [number, number][];
}

export function createInitialDotsBoxesState(): DotsBoxesState {
  return {
    hEdges: Array.from({ length: DOTS_GRID }, () => Array(BOX_GRID).fill(null)),
    vEdges: Array.from({ length: BOX_GRID }, () => Array(DOTS_GRID).fill(null)),
    boxes: Array.from({ length: BOX_GRID }, () => Array(BOX_GRID).fill(null)),
    turn: 1,
    scores: { 1: 0, 2: 0 },
    winner: null,
    lastEdge: null,
    lastClaimedBoxes: [],
  };
}

export function getLegalDotsEdges(state: DotsBoxesState): EdgeMove[] {
  if (state.winner !== null) return [];
  const moves: EdgeMove[] = [];
  for (let r = 0; r < DOTS_GRID; r++) {
    for (let c = 0; c < BOX_GRID; c++) {
      if (state.hEdges[r][c] === null) moves.push({ orientation: 'h', row: r, col: c });
    }
  }
  for (let r = 0; r < BOX_GRID; r++) {
    for (let c = 0; c < DOTS_GRID; c++) {
      if (state.vEdges[r][c] === null) moves.push({ orientation: 'v', row: r, col: c });
    }
  }
  return moves;
}

function countBoxSides(hEdges: (Player | null)[][], vEdges: (Player | null)[][], br: number, bc: number): number {
  let sides = 0;
  if (hEdges[br][bc] !== null) sides++;
  if (hEdges[br + 1][bc] !== null) sides++;
  if (vEdges[br][bc] !== null) sides++;
  if (vEdges[br][bc + 1] !== null) sides++;
  return sides;
}

export function applyDotsEdgeMove(state: DotsBoxesState, move: EdgeMove): DotsBoxesState {
  if (state.winner !== null) return state;

  const hEdges = state.hEdges.map((r) => [...r]);
  const vEdges = state.vEdges.map((r) => [...r]);
  const boxes = state.boxes.map((r) => [...r]);

  if (move.orientation === 'h') {
    if (hEdges[move.row][move.col] !== null) return state;
    hEdges[move.row][move.col] = state.turn;
  } else {
    if (vEdges[move.row][move.col] !== null) return state;
    vEdges[move.row][move.col] = state.turn;
  }

  const claimed: [number, number][] = [];
  for (let br = 0; br < BOX_GRID; br++) {
    for (let bc = 0; bc < BOX_GRID; bc++) {
      if (boxes[br][bc] === null && countBoxSides(hEdges, vEdges, br, bc) === 4) {
        boxes[br][bc] = state.turn;
        claimed.push([br, bc]);
      }
    }
  }

  const scores = {
    1: state.scores[1] + (state.turn === 1 ? claimed.length : 0),
    2: state.scores[2] + (state.turn === 2 ? claimed.length : 0),
  };

  const totalBoxes = BOX_GRID * BOX_GRID;
  let winner: Player | 'draw' | null = null;
  if (scores[1] + scores[2] === totalBoxes) {
    winner = scores[1] > scores[2] ? 1 : scores[2] > scores[1] ? 2 : 'draw';
  }

  return {
    hEdges,
    vEdges,
    boxes,
    turn: claimed.length > 0 || winner !== null ? state.turn : state.turn === 1 ? 2 : 1,
    scores,
    winner,
    lastEdge: move,
    lastClaimedBoxes: claimed,
  };
}

function adjacentBoxesForEdge(move: EdgeMove): [number, number][] {
  const adj: [number, number][] = [];
  if (move.orientation === 'h') {
    if (move.row > 0) adj.push([move.row - 1, move.col]);
    if (move.row < BOX_GRID) adj.push([move.row, move.col]);
  } else {
    if (move.col > 0) adj.push([move.row, move.col - 1]);
    if (move.col < BOX_GRID) adj.push([move.row, move.col]);
  }
  return adj;
}

export function chooseDotsBoxesAIMove(state: DotsBoxesState, difficulty: Difficulty): EdgeMove | null {
  const moves = getLegalDotsEdges(state);
  if (moves.length === 0) return null;

  if (difficulty === 'easy' && Math.random() < 0.65) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // 1. Always capture any box that already has 3 sides
  const capturing = moves.filter((m) =>
    adjacentBoxesForEdge(m).some(([br, bc]) => countBoxSides(state.hEdges, state.vEdges, br, bc) === 3),
  );
  if (capturing.length > 0) {
    return capturing[Math.floor(Math.random() * capturing.length)];
  }

  // 2. Avoid creating a 3-sided box (which gives opponent a free capture)
  const safeMoves = moves.filter((m) =>
    adjacentBoxesForEdge(m).every(([br, bc]) => countBoxSides(state.hEdges, state.vEdges, br, bc) < 2),
  );
  if (safeMoves.length > 0) {
    return safeMoves[Math.floor(Math.random() * safeMoves.length)];
  }

  // 3. Hard mode: when forced to give away a chain, minimize the chain length given away
  if (difficulty === 'hard') {
    let minChain = Infinity;
    let bestMoves: EdgeMove[] = [];
    for (const m of moves) {
      let sim = applyDotsEdgeMove(state, m);
      let oppGain = 0;
      // Simulate greedy opponent captures
      while (sim.winner === null && sim.turn !== state.turn) {
        const oppMoves = getLegalDotsEdges(sim);
        const cap = oppMoves.find((om) =>
          adjacentBoxesForEdge(om).some(([br, bc]) => countBoxSides(sim.hEdges, sim.vEdges, br, bc) === 3),
        );
        if (!cap) break;
        const before = sim.scores[sim.turn];
        sim = applyDotsEdgeMove(sim, cap);
        oppGain += sim.scores[sim.turn] - before;
      }
      if (oppGain < minChain) {
        minChain = oppGain;
        bestMoves = [m];
      } else if (oppGain === minChain) {
        bestMoves.push(m);
      }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return moves[Math.floor(Math.random() * moves.length)];
}
