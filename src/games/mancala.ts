import { Difficulty, Player } from '../types/game';

// Pits layout (14 slots):
// Player 1 owns pits 0..5 (left to right on bottom), Store = 6
// Player 2 owns pits 7..12 (right to left on top), Store = 13
export interface MancalaState {
  pits: number[]; // length 14
  turn: Player;
  winner: Player | 'draw' | null;
  lastPit: number | null;
  extraTurn: boolean;
  lastCaptured: boolean;
}

export function createInitialMancalaState(): MancalaState {
  return {
    pits: [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0],
    turn: 1,
    winner: null,
    lastPit: null,
    extraTurn: false,
    lastCaptured: false,
  };
}

export function getMancalaLegalMoves(state: MancalaState): number[] {
  if (state.winner !== null) return [];
  const start = state.turn === 1 ? 0 : 7;
  const moves: number[] = [];
  for (let i = start; i < start + 6; i++) {
    if (state.pits[i] > 0) moves.push(i);
  }
  return moves;
}

export function applyMancalaMove(state: MancalaState, pitIdx: number): MancalaState {
  if (state.winner !== null) return state;
  const isP1 = state.turn === 1;
  const minPit = isP1 ? 0 : 7;
  const maxPit = isP1 ? 5 : 12;
  if (pitIdx < minPit || pitIdx > maxPit || state.pits[pitIdx] === 0) return state;

  const pits = [...state.pits];
  let seeds = pits[pitIdx];
  pits[pitIdx] = 0;

  const ownStore = isP1 ? 6 : 13;
  const oppStore = isP1 ? 13 : 6;

  let idx = pitIdx;
  while (seeds > 0) {
    idx = (idx + 1) % 14;
    if (idx === oppStore) continue;
    pits[idx]++;
    seeds--;
  }

  let extraTurn = idx === ownStore;
  let lastCaptured = false;

  // Capture rule: last seed landed in an empty pit on current player's side, opposite pit has seeds
  if (!extraTurn && idx >= minPit && idx <= maxPit && pits[idx] === 1) {
    const opposite = 12 - idx;
    if (pits[opposite] > 0) {
      pits[ownStore] += pits[opposite] + 1;
      pits[opposite] = 0;
      pits[idx] = 0;
      lastCaptured = true;
    }
  }

  // Check if either side is completely empty
  const p1Empty = pits.slice(0, 6).every((s) => s === 0);
  const p2Empty = pits.slice(7, 13).every((s) => s === 0);

  if (p1Empty || p2Empty) {
    for (let i = 0; i < 6; i++) {
      pits[6] += pits[i];
      pits[i] = 0;
    }
    for (let i = 7; i < 13; i++) {
      pits[13] += pits[i];
      pits[i] = 0;
    }
    const winner: Player | 'draw' = pits[6] > pits[13] ? 1 : pits[13] > pits[6] ? 2 : 'draw';
    return {
      pits,
      turn: state.turn,
      winner,
      lastPit: pitIdx,
      extraTurn: false,
      lastCaptured,
    };
  }

  return {
    pits,
    turn: extraTurn ? state.turn : isP1 ? 2 : 1,
    winner: null,
    lastPit: pitIdx,
    extraTurn,
    lastCaptured,
  };
}

function evaluateMancala(state: MancalaState, aiPlayer: Player): number {
  const aiStore = aiPlayer === 1 ? 6 : 13;
  const oppStore = aiPlayer === 1 ? 13 : 6;
  if (state.winner === aiPlayer) return 10000 + (state.pits[aiStore] - state.pits[oppStore]);
  if (state.winner !== null && state.winner !== 'draw') {
    return -10000 - (state.pits[oppStore] - state.pits[aiStore]);
  }
  if (state.winner === 'draw') return 0;

  const aiSide = aiPlayer === 1 ? state.pits.slice(0, 6) : state.pits.slice(7, 13);
  const oppSide = aiPlayer === 1 ? state.pits.slice(7, 13) : state.pits.slice(0, 6);
  const aiSideSum = aiSide.reduce((a, b) => a + b, 0);
  const oppSideSum = oppSide.reduce((a, b) => a + b, 0);

  return (state.pits[aiStore] - state.pits[oppStore]) * 10 + (aiSideSum - oppSideSum) * 2;
}

function mancalaMinimax(
  state: MancalaState,
  depth: number,
  alpha: number,
  beta: number,
  aiPlayer: Player,
): number {
  if (depth <= 0 || state.winner !== null) {
    return evaluateMancala(state, aiPlayer);
  }
  const moves = getMancalaLegalMoves(state);
  const maximizing = state.turn === aiPlayer;

  if (maximizing) {
    let val = -Infinity;
    for (const pit of moves) {
      const next = applyMancalaMove(state, pit);
      const nextDepth = next.turn === state.turn ? depth : depth - 1;
      val = Math.max(val, mancalaMinimax(next, nextDepth, alpha, beta, aiPlayer));
      alpha = Math.max(alpha, val);
      if (alpha >= beta) break;
    }
    return val;
  } else {
    let val = Infinity;
    for (const pit of moves) {
      const next = applyMancalaMove(state, pit);
      const nextDepth = next.turn === state.turn ? depth : depth - 1;
      val = Math.min(val, mancalaMinimax(next, nextDepth, alpha, beta, aiPlayer));
      beta = Math.min(beta, val);
      if (alpha >= beta) break;
    }
    return val;
  }
}

export function chooseMancalaAIMove(state: MancalaState, difficulty: Difficulty): number | null {
  const moves = getMancalaLegalMoves(state);
  if (moves.length === 0) return null;
  if (difficulty === 'easy' && Math.random() < 0.65) {
    return moves[Math.floor(Math.random() * moves.length)];
  }
  const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6;
  const aiPlayer = state.turn;
  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const pit of moves) {
    const next = applyMancalaMove(state, pit);
    const score = mancalaMinimax(next, depth - 1, -Infinity, Infinity, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = pit;
    }
  }
  return bestMove;
}
