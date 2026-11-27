import { Difficulty, Player } from '../types/game';

export const C4_ROWS = 6;
export const C4_COLS = 7;

export type C4Cell = Player | null;

export interface Connect4State {
  board: C4Cell[][];
  turn: Player;
  winner: Player | 'draw' | null;
  winningCells: [number, number][] | null;
  lastMove: [number, number] | null;
}

export function createInitialConnect4State(): Connect4State {
  return {
    board: Array.from({ length: C4_ROWS }, () => Array(C4_COLS).fill(null)),
    turn: 1,
    winner: null,
    winningCells: null,
    lastMove: null,
  };
}

export function getAvailableColumns(board: C4Cell[][]): number[] {
  const cols: number[] = [];
  for (let c = 0; c < C4_COLS; c++) {
    if (board[0][c] === null) cols.push(c);
  }
  return cols;
}

function findDropRow(board: C4Cell[][], col: number): number {
  for (let r = C4_ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) return r;
  }
  return -1;
}

function checkConnect4Win(board: C4Cell[][], player: Player): [number, number][] | null {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      if (board[r][c] !== player) continue;
      for (const [dr, dc] of dirs) {
        const line: [number, number][] = [[r, c]];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= C4_ROWS || nc < 0 || nc >= C4_COLS || board[nr][nc] !== player) break;
          line.push([nr, nc]);
        }
        if (line.length === 4) return line;
      }
    }
  }
  return null;
}

export function applyConnect4Move(state: Connect4State, col: number): Connect4State {
  if (state.winner !== null) return state;
  const row = findDropRow(state.board, col);
  if (row === -1) return state;

  const board = state.board.map((r) => [...r]);
  board[row][col] = state.turn;

  const winLine = checkConnect4Win(board, state.turn);
  if (winLine) {
    return {
      board,
      turn: state.turn,
      winner: state.turn,
      winningCells: winLine,
      lastMove: [row, col],
    };
  }

  const isDraw = board[0].every((cell) => cell !== null);
  return {
    board,
    turn: state.turn === 1 ? 2 : 1,
    winner: isDraw ? 'draw' : null,
    winningCells: null,
    lastMove: [row, col],
  };
}

function scoreWindow(window: C4Cell[], aiPlayer: Player): number {
  const opp: Player = aiPlayer === 1 ? 2 : 1;
  let aiCount = 0;
  let oppCount = 0;
  let empty = 0;
  for (const c of window) {
    if (c === aiPlayer) aiCount++;
    else if (c === opp) oppCount++;
    else empty++;
  }
  if (aiCount === 4) return 10000;
  if (oppCount === 4) return -10000;
  if (aiCount === 3 && empty === 1) return 12;
  if (aiCount === 2 && empty === 2) return 3;
  if (oppCount === 3 && empty === 1) return -14;
  if (oppCount === 2 && empty === 2) return -2;
  return 0;
}

function evaluateConnect4(board: C4Cell[][], aiPlayer: Player): number {
  let score = 0;
  // Center column preference
  const centerCol = Math.floor(C4_COLS / 2);
  for (let r = 0; r < C4_ROWS; r++) {
    if (board[r][centerCol] === aiPlayer) score += 4;
  }

  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c <= C4_COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], aiPlayer);
    }
  }
  for (let c = 0; c < C4_COLS; c++) {
    for (let r = 0; r <= C4_ROWS - 4; r++) {
      score += scoreWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], aiPlayer);
    }
  }
  for (let r = 0; r <= C4_ROWS - 4; r++) {
    for (let c = 0; c <= C4_COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]], aiPlayer);
      score += scoreWindow([board[r + 3][c], board[r + 2][c + 1], board[r + 1][c + 2], board[r][c + 3]], aiPlayer);
    }
  }
  return score;
}

const COL_ORDER = [3, 2, 4, 1, 5, 0, 6];

function c4Minimax(
  state: Connect4State,
  depth: number,
  alpha: number,
  beta: number,
  aiPlayer: Player,
): number {
  if (state.winner === aiPlayer) return 100000 + depth * 100;
  if (state.winner !== null && state.winner !== 'draw') return -100000 - depth * 100;
  if (state.winner === 'draw') return 0;
  if (depth === 0) return evaluateConnect4(state.board, aiPlayer);

  const cols = COL_ORDER.filter((c) => state.board[0][c] === null);
  const maximizing = state.turn === aiPlayer;

  if (maximizing) {
    let val = -Infinity;
    for (const c of cols) {
      const next = applyConnect4Move(state, c);
      val = Math.max(val, c4Minimax(next, depth - 1, alpha, beta, aiPlayer));
      alpha = Math.max(alpha, val);
      if (alpha >= beta) break;
    }
    return val;
  } else {
    let val = Infinity;
    for (const c of cols) {
      const next = applyConnect4Move(state, c);
      val = Math.min(val, c4Minimax(next, depth - 1, alpha, beta, aiPlayer));
      beta = Math.min(beta, val);
      if (alpha >= beta) break;
    }
    return val;
  }
}

export function chooseConnect4AIMove(state: Connect4State, difficulty: Difficulty): number | null {
  const validCols = COL_ORDER.filter((c) => state.board[0][c] === null);
  if (validCols.length === 0) return null;

  if (difficulty === 'easy' && Math.random() < 0.6) {
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6;
  const aiPlayer = state.turn;
  let bestScore = -Infinity;
  let bestCol = validCols[0];

  for (const col of validCols) {
    const next = applyConnect4Move(state, col);
    const score = c4Minimax(next, depth - 1, -Infinity, Infinity, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}
