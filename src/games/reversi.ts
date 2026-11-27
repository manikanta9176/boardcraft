import { Difficulty, Player } from '../types/game';

export const REVERSI_SIZE = 8;
export type ReversiCell = Player | null;

export interface ReversiState {
  board: ReversiCell[][];
  turn: Player;
  winner: Player | 'draw' | null;
  lastMove: [number, number] | null;
  flippedCells: [number, number][];
  passedTurn: boolean;
}

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export function createInitialReversiState(): ReversiState {
  const board: ReversiCell[][] = Array.from({ length: REVERSI_SIZE }, () =>
    Array(REVERSI_SIZE).fill(null),
  );
  board[3][3] = 2;
  board[3][4] = 1;
  board[4][3] = 1;
  board[4][4] = 2;
  return {
    board,
    turn: 1,
    winner: null,
    lastMove: null,
    flippedCells: [],
    passedTurn: false,
  };
}

export function getFlipsForMove(
  board: ReversiCell[][],
  row: number,
  col: number,
  player: Player,
): [number, number][] {
  if (board[row][col] !== null) return [];
  const opp: Player = player === 1 ? 2 : 1;
  const flips: [number, number][] = [];

  for (const [dr, dc] of DIRS) {
    const line: [number, number][] = [];
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < REVERSI_SIZE && c >= 0 && c < REVERSI_SIZE && board[r][c] === opp) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }
    if (line.length > 0 && r >= 0 && r < REVERSI_SIZE && c >= 0 && c < REVERSI_SIZE && board[r][c] === player) {
      flips.push(...line);
    }
  }
  return flips;
}

export function getLegalReversiMoves(board: ReversiCell[][], player: Player): [number, number][] {
  const moves: [number, number][] = [];
  for (let r = 0; r < REVERSI_SIZE; r++) {
    for (let c = 0; c < REVERSI_SIZE; c++) {
      if (getFlipsForMove(board, r, c, player).length > 0) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

export function countReversiDiscs(board: ReversiCell[][]): { 1: number; 2: number } {
  let p1 = 0;
  let p2 = 0;
  for (let r = 0; r < REVERSI_SIZE; r++) {
    for (let c = 0; c < REVERSI_SIZE; c++) {
      if (board[r][c] === 1) p1++;
      else if (board[r][c] === 2) p2++;
    }
  }
  return { 1: p1, 2: p2 };
}

export function applyReversiMove(state: ReversiState, row: number, col: number): ReversiState {
  if (state.winner !== null) return state;
  const flips = getFlipsForMove(state.board, row, col, state.turn);
  if (flips.length === 0) return state;

  const board = state.board.map((r) => [...r]);
  board[row][col] = state.turn;
  for (const [fr, fc] of flips) {
    board[fr][fc] = state.turn;
  }

  const nextPlayer: Player = state.turn === 1 ? 2 : 1;
  const nextMoves = getLegalReversiMoves(board, nextPlayer);
  if (nextMoves.length > 0) {
    return {
      board,
      turn: nextPlayer,
      winner: null,
      lastMove: [row, col],
      flippedCells: flips,
      passedTurn: false,
    };
  }

  // Next player has no legal moves—check if current player can move again
  const currentMoves = getLegalReversiMoves(board, state.turn);
  if (currentMoves.length > 0) {
    return {
      board,
      turn: state.turn,
      winner: null,
      lastMove: [row, col],
      flippedCells: flips,
      passedTurn: true,
    };
  }

  // Neither player can move: game over
  const counts = countReversiDiscs(board);
  const winner: Player | 'draw' = counts[1] > counts[2] ? 1 : counts[2] > counts[1] ? 2 : 'draw';
  return {
    board,
    turn: state.turn,
    winner,
    lastMove: [row, col],
    flippedCells: flips,
    passedTurn: false,
  };
}

const POSITION_WEIGHTS = [
  [120, -20, 20,  5,  5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [ 20,  -5, 15,  3,  3, 15,  -5,  20],
  [  5,  -5,  3,  3,  3,  3,  -5,   5],
  [  5,  -5,  3,  3,  3,  3,  -5,   5],
  [ 20,  -5, 15,  3,  3, 15,  -5,  20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20,  5,  5, 20, -20, 120],
];

function evaluateReversi(state: ReversiState, aiPlayer: Player): number {
  const opp: Player = aiPlayer === 1 ? 2 : 1;
  const counts = countReversiDiscs(state.board);
  if (state.winner === aiPlayer) return 100000 + (counts[aiPlayer] - counts[opp]);
  if (state.winner === opp) return -100000 - (counts[opp] - counts[aiPlayer]);
  if (state.winner === 'draw') return 0;

  let score = 0;
  for (let r = 0; r < REVERSI_SIZE; r++) {
    for (let c = 0; c < REVERSI_SIZE; c++) {
      if (state.board[r][c] === aiPlayer) score += POSITION_WEIGHTS[r][c];
      else if (state.board[r][c] === opp) score -= POSITION_WEIGHTS[r][c];
    }
  }

  const aiMob = getLegalReversiMoves(state.board, aiPlayer).length;
  const oppMob = getLegalReversiMoves(state.board, opp).length;
  score += (aiMob - oppMob) * 8;

  const totalDiscs = counts[1] + counts[2];
  if (totalDiscs > 50) {
    score += (counts[aiPlayer] - counts[opp]) * 12;
  }
  return score;
}

function reversiMinimax(
  state: ReversiState,
  depth: number,
  alpha: number,
  beta: number,
  aiPlayer: Player,
): number {
  if (depth === 0 || state.winner !== null) {
    return evaluateReversi(state, aiPlayer);
  }
  const moves = getLegalReversiMoves(state.board, state.turn);
  const maximizing = state.turn === aiPlayer;

  if (maximizing) {
    let val = -Infinity;
    for (const [r, c] of moves) {
      val = Math.max(val, reversiMinimax(applyReversiMove(state, r, c), depth - 1, alpha, beta, aiPlayer));
      alpha = Math.max(alpha, val);
      if (alpha >= beta) break;
    }
    return val;
  } else {
    let val = Infinity;
    for (const [r, c] of moves) {
      val = Math.min(val, reversiMinimax(applyReversiMove(state, r, c), depth - 1, alpha, beta, aiPlayer));
      beta = Math.min(beta, val);
      if (alpha >= beta) break;
    }
    return val;
  }
}

export function chooseReversiAIMove(state: ReversiState, difficulty: Difficulty): [number, number] | null {
  const moves = getLegalReversiMoves(state.board, state.turn);
  if (moves.length === 0) return null;
  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }
  const depth = difficulty === 'medium' ? 2 : 4;
  const aiPlayer = state.turn;
  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const [r, c] of moves) {
    const score = reversiMinimax(applyReversiMove(state, r, c), depth - 1, -Infinity, Infinity, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }
  return bestMove;
}
