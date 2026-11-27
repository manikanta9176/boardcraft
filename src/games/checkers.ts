import { Difficulty, Player } from '../types/game';

export const CHECKERS_SIZE = 8;

export interface CheckersPiece {
  player: Player;
  king: boolean;
}

export type CheckersCell = CheckersPiece | null;

export interface CheckersStepMove {
  from: [number, number];
  to: [number, number];
  captured: [number, number] | null;
}

export interface CheckersState {
  board: CheckersCell[][];
  turn: Player;
  winner: Player | 'draw' | null;
  mustContinueFrom: [number, number] | null;
  lastMove: { from: [number, number]; to: [number, number] } | null;
  movesWithoutCaptureOrPawn: number;
}

export function createInitialCheckersState(): CheckersState {
  const board: CheckersCell[][] = Array.from({ length: CHECKERS_SIZE }, () =>
    Array(CHECKERS_SIZE).fill(null),
  );
  for (let r = 0; r < CHECKERS_SIZE; r++) {
    for (let c = 0; c < CHECKERS_SIZE; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = { player: 2, king: false };
        else if (r > 4) board[r][c] = { player: 1, king: false };
      }
    }
  }
  return {
    board,
    turn: 1,
    winner: null,
    mustContinueFrom: null,
    lastMove: null,
    movesWithoutCaptureOrPawn: 0,
  };
}

function getDirections(piece: CheckersPiece): number[] {
  if (piece.king) return [-1, 1];
  return piece.player === 1 ? [-1] : [1];
}

function getPieceJumps(board: CheckersCell[][], r: number, c: number): CheckersStepMove[] {
  const piece = board[r][c];
  if (!piece) return [];
  const jumps: CheckersStepMove[] = [];
  const opp: Player = piece.player === 1 ? 2 : 1;

  for (const dr of getDirections(piece)) {
    for (const dc of [-1, 1]) {
      const mr = r + dr;
      const mc = c + dc;
      const lr = r + dr * 2;
      const lc = c + dc * 2;
      if (
        lr >= 0 &&
        lr < CHECKERS_SIZE &&
        lc >= 0 &&
        lc < CHECKERS_SIZE &&
        board[mr][mc]?.player === opp &&
        board[lr][lc] === null
      ) {
        jumps.push({
          from: [r, c],
          to: [lr, lc],
          captured: [mr, mc],
        });
      }
    }
  }
  return jumps;
}

function getPieceSimpleMoves(board: CheckersCell[][], r: number, c: number): CheckersStepMove[] {
  const piece = board[r][c];
  if (!piece) return [];
  const moves: CheckersStepMove[] = [];

  for (const dr of getDirections(piece)) {
    for (const dc of [-1, 1]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < CHECKERS_SIZE && nc >= 0 && nc < CHECKERS_SIZE && board[nr][nc] === null) {
        moves.push({
          from: [r, c],
          to: [nr, nc],
          captured: null,
        });
      }
    }
  }
  return moves;
}

export function getLegalCheckersSteps(state: CheckersState): CheckersStepMove[] {
  if (state.winner !== null) return [];

  if (state.mustContinueFrom) {
    const [mr, mc] = state.mustContinueFrom;
    return getPieceJumps(state.board, mr, mc);
  }

  const allJumps: CheckersStepMove[] = [];
  const allSimple: CheckersStepMove[] = [];

  for (let r = 0; r < CHECKERS_SIZE; r++) {
    for (let c = 0; c < CHECKERS_SIZE; c++) {
      const piece = state.board[r][c];
      if (piece?.player === state.turn) {
        allJumps.push(...getPieceJumps(state.board, r, c));
        allSimple.push(...getPieceSimpleMoves(state.board, r, c));
      }
    }
  }

  // Captures are mandatory in standard Checkers
  return allJumps.length > 0 ? allJumps : allSimple;
}

export function countCheckersPieces(board: CheckersCell[][]): {
  1: number;
  2: number;
  kings1: number;
  kings2: number;
} {
  let p1 = 0;
  let p2 = 0;
  let k1 = 0;
  let k2 = 0;
  for (let r = 0; r < CHECKERS_SIZE; r++) {
    for (let c = 0; c < CHECKERS_SIZE; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      if (cell.player === 1) {
        p1++;
        if (cell.king) k1++;
      } else {
        p2++;
        if (cell.king) k2++;
      }
    }
  }
  return { 1: p1, 2: p2, kings1: k1, kings2: k2 };
}

export function applyCheckersStep(state: CheckersState, move: CheckersStepMove): CheckersState {
  if (state.winner !== null) return state;
  const legal = getLegalCheckersSteps(state);
  const valid = legal.some(
    (m) =>
      m.from[0] === move.from[0] &&
      m.from[1] === move.from[1] &&
      m.to[0] === move.to[0] &&
      m.to[1] === move.to[1],
  );
  if (!valid) return state;

  const board = state.board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const moving = board[fr][fc]!;
  board[fr][fc] = null;

  let promoted = false;
  if (!moving.king && ((moving.player === 1 && tr === 0) || (moving.player === 2 && tr === CHECKERS_SIZE - 1))) {
    moving.king = true;
    promoted = true;
  }
  board[tr][tc] = moving;

  if (move.captured) {
    board[move.captured[0]][move.captured[1]] = null;
    // In American Checkers, reaching king row ends the turn immediately
    if (!promoted) {
      const moreJumps = getPieceJumps(board, tr, tc);
      if (moreJumps.length > 0) {
        return {
          board,
          turn: state.turn,
          winner: null,
          mustContinueFrom: [tr, tc],
          lastMove: { from: move.from, to: move.to },
          movesWithoutCaptureOrPawn: 0,
        };
      }
    }
  }

  const nextTurn: Player = state.turn === 1 ? 2 : 1;
  const counts = countCheckersPieces(board);
  if (counts[nextTurn] === 0) {
    return {
      board,
      turn: state.turn,
      winner: state.turn,
      mustContinueFrom: null,
      lastMove: { from: move.from, to: move.to },
      movesWithoutCaptureOrPawn: 0,
    };
  }

  const movesWithout = move.captured || !moving.king ? 0 : state.movesWithoutCaptureOrPawn + 1;
  if (movesWithout >= 80) {
    return {
      board,
      turn: nextTurn,
      winner: 'draw',
      mustContinueFrom: null,
      lastMove: { from: move.from, to: move.to },
      movesWithoutCaptureOrPawn: movesWithout,
    };
  }

  const nextState: CheckersState = {
    board,
    turn: nextTurn,
    winner: null,
    mustContinueFrom: null,
    lastMove: { from: move.from, to: move.to },
    movesWithoutCaptureOrPawn: movesWithout,
  };

  if (getLegalCheckersSteps(nextState).length === 0) {
    return {
      ...nextState,
      winner: state.turn,
    };
  }

  return nextState;
}

function evaluateCheckers(state: CheckersState, aiPlayer: Player): number {
  const opp: Player = aiPlayer === 1 ? 2 : 1;
  if (state.winner === aiPlayer) return 100000;
  if (state.winner === opp) return -100000;
  if (state.winner === 'draw') return 0;

  let score = 0;
  for (let r = 0; r < CHECKERS_SIZE; r++) {
    for (let c = 0; c < CHECKERS_SIZE; c++) {
      const p = state.board[r][c];
      if (!p) continue;
      let val = p.king ? 180 : 100;
      // Advancement bonus for non-kings
      if (!p.king) {
        val += p.player === 1 ? (7 - r) * 5 : r * 5;
      }
      // Center control
      if (c >= 2 && c <= 5 && r >= 2 && r <= 5) val += 10;
      // Back row protection
      if ((p.player === 1 && r === 7) || (p.player === 2 && r === 0)) val += 8;

      score += p.player === aiPlayer ? val : -val;
    }
  }
  return score;
}

function checkersMinimax(
  state: CheckersState,
  depth: number,
  alpha: number,
  beta: number,
  aiPlayer: Player,
): number {
  if (depth <= 0 || state.winner !== null) {
    return evaluateCheckers(state, aiPlayer);
  }
  const steps = getLegalCheckersSteps(state);
  if (steps.length === 0) return evaluateCheckers(state, aiPlayer);

  const maximizing = state.turn === aiPlayer;
  if (maximizing) {
    let val = -Infinity;
    for (const step of steps) {
      const next = applyCheckersStep(state, step);
      const nextDepth = next.mustContinueFrom ? depth : depth - 1;
      val = Math.max(val, checkersMinimax(next, nextDepth, alpha, beta, aiPlayer));
      alpha = Math.max(alpha, val);
      if (alpha >= beta) break;
    }
    return val;
  } else {
    let val = Infinity;
    for (const step of steps) {
      const next = applyCheckersStep(state, step);
      const nextDepth = next.mustContinueFrom ? depth : depth - 1;
      val = Math.min(val, checkersMinimax(next, nextDepth, alpha, beta, aiPlayer));
      beta = Math.min(beta, val);
      if (alpha >= beta) break;
    }
    return val;
  }
}

export function chooseCheckersAIMove(state: CheckersState, difficulty: Difficulty): CheckersStepMove | null {
  const steps = getLegalCheckersSteps(state);
  if (steps.length === 0) return null;
  if (steps.length === 1) return steps[0];

  if (difficulty === 'easy' && Math.random() < 0.6) {
    return steps[Math.floor(Math.random() * steps.length)];
  }

  const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6;
  const aiPlayer = state.turn;
  let bestScore = -Infinity;
  let bestSteps: CheckersStepMove[] = [];

  for (const step of steps) {
    const next = applyCheckersStep(state, step);
    const nextDepth = next.mustContinueFrom ? depth : depth - 1;
    const score = checkersMinimax(next, nextDepth, -Infinity, Infinity, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestSteps = [step];
    } else if (score === bestScore) {
      bestSteps.push(step);
    }
  }
  return bestSteps[Math.floor(Math.random() * bestSteps.length)];
}
