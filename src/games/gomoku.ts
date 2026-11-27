import { Difficulty, Player } from '../types/game';

export const GOMOKU_SIZE = 15;
export type GomokuCell = Player | null;

export interface GomokuState {
  board: GomokuCell[][];
  turn: Player;
  winner: Player | 'draw' | null;
  winningLine: [number, number][] | null;
  lastMove: [number, number] | null;
  moveCount: number;
}

export function createInitialGomokuState(): GomokuState {
  return {
    board: Array.from({ length: GOMOKU_SIZE }, () => Array(GOMOKU_SIZE).fill(null)),
    turn: 1,
    winner: null,
    winningLine: null,
    lastMove: null,
    moveCount: 0,
  };
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

function checkGomokuWin(board: GomokuCell[][], row: number, col: number, player: Player): [number, number][] | null {
  for (const [dr, dc] of DIRECTIONS) {
    const line: [number, number][] = [[row, col]];
    for (let step = 1; step < 5; step++) {
      const nr = row + dr * step;
      const nc = col + dc * step;
      if (nr < 0 || nr >= GOMOKU_SIZE || nc < 0 || nc >= GOMOKU_SIZE || board[nr][nc] !== player) break;
      line.push([nr, nc]);
    }
    for (let step = 1; step < 5; step++) {
      const nr = row - dr * step;
      const nc = col - dc * step;
      if (nr < 0 || nr >= GOMOKU_SIZE || nc < 0 || nc >= GOMOKU_SIZE || board[nr][nc] !== player) break;
      line.unshift([nr, nc]);
    }
    if (line.length >= 5) return line.slice(0, 5);
  }
  return null;
}

export function applyGomokuMove(state: GomokuState, row: number, col: number): GomokuState {
  if (state.winner !== null || state.board[row][col] !== null) return state;

  const board = state.board.map((r) => [...r]);
  board[row][col] = state.turn;
  const moveCount = state.moveCount + 1;

  const winLine = checkGomokuWin(board, row, col, state.turn);
  if (winLine) {
    return {
      board,
      turn: state.turn,
      winner: state.turn,
      winningLine: winLine,
      lastMove: [row, col],
      moveCount,
    };
  }

  return {
    board,
    turn: state.turn === 1 ? 2 : 1,
    winner: moveCount === GOMOKU_SIZE * GOMOKU_SIZE ? 'draw' : null,
    winningLine: null,
    lastMove: [row, col],
    moveCount,
  };
}

function scoreDirectionPattern(count: number, openEnds: number): number {
  if (count >= 5) return 100000;
  if (openEnds === 0) return 0;
  if (count === 4) return openEnds === 2 ? 20000 : 2500;
  if (count === 3) return openEnds === 2 ? 1200 : 200;
  if (count === 2) return openEnds === 2 ? 120 : 25;
  if (count === 1) return openEnds === 2 ? 12 : 3;
  return 0;
}

function evaluatePoint(board: GomokuCell[][], row: number, col: number, player: Player): number {
  let total = 0;
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < GOMOKU_SIZE && c >= 0 && c < GOMOKU_SIZE && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    if (r >= 0 && r < GOMOKU_SIZE && c >= 0 && c < GOMOKU_SIZE && board[r][c] === null) {
      openEnds++;
    }

    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < GOMOKU_SIZE && c >= 0 && c < GOMOKU_SIZE && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (r >= 0 && r < GOMOKU_SIZE && c >= 0 && c < GOMOKU_SIZE && board[r][c] === null) {
      openEnds++;
    }

    total += scoreDirectionPattern(count, openEnds);
  }
  return total;
}

function getCandidateCells(board: GomokuCell[][]): [number, number][] {
  const candidates: [number, number][] = [];
  let hasStone = false;

  for (let r = 0; r < GOMOKU_SIZE; r++) {
    for (let c = 0; c < GOMOKU_SIZE; c++) {
      if (board[r][c] !== null) {
        hasStone = true;
        continue;
      }
      let near = false;
      for (let dr = -2; dr <= 2 && !near; dr++) {
        for (let dc = -2; dc <= 2 && !near; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < GOMOKU_SIZE && nc >= 0 && nc < GOMOKU_SIZE && board[nr][nc] !== null) {
            near = true;
          }
        }
      }
      if (near) candidates.push([r, c]);
    }
  }

  if (!hasStone) return [[7, 7]];
  return candidates;
}

export function chooseGomokuAIMove(state: GomokuState, difficulty: Difficulty): [number, number] | null {
  if (state.winner !== null) return null;
  const candidates = getCandidateCells(state.board);
  if (candidates.length === 0) return null;

  const aiPlayer = state.turn;
  const opp: Player = aiPlayer === 1 ? 2 : 1;

  if (difficulty === 'easy' && Math.random() < 0.5) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  let bestScore = -Infinity;
  let bestMoves: [number, number][] = [];

  for (const [r, c] of candidates) {
    const attack = evaluatePoint(state.board, r, c, aiPlayer);
    const defense = evaluatePoint(state.board, r, c, opp);
    const centerBias = 14 - (Math.abs(r - 7) + Math.abs(c - 7));

    // Slightly prioritize winning immediately, otherwise block urgent threats
    const score =
      attack >= 100000
        ? 1000000
        : defense >= 100000
          ? 500000
          : difficulty === 'hard'
            ? attack * 1.15 + defense * 1.05 + centerBias
            : attack + defense * 0.9 + centerBias;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [[r, c]];
    } else if (score === bestScore) {
      bestMoves.push([r, c]);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
