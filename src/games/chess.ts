import { Player } from '../types/game';

export type ChessKind = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type ChessPiece = { player: Player; kind: ChessKind };
export type ChessSquare = [number, number];
export type ChessMove = { from: ChessSquare; to: ChessSquare; promotion?: Exclude<ChessKind, 'king' | 'pawn'> };
export type ChessState = {
  gameId: 'chess';
  board: (ChessPiece | null)[][];
  turn: Player;
  winner: Player | 'draw' | null;
  status: 'playing' | 'check' | 'checkmate' | 'stalemate';
  castling: Record<Player, { king: boolean; queen: boolean }>;
  enPassant: ChessSquare | null;
  lastMove: ChessMove | null;
};

const opposite = (player: Player): Player => player === 1 ? 2 : 1;
const inBounds = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8;
const sameSquare = (a: ChessSquare, b: ChessSquare) => a[0] === b[0] && a[1] === b[1];
const directions = {
  rook: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  king: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};
const knightSteps = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];

export function createChessState(): ChessState {
  const board: (ChessPiece | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back: ChessKind[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { player: 2, kind: back[col] };
    board[1][col] = { player: 2, kind: 'pawn' };
    board[6][col] = { player: 1, kind: 'pawn' };
    board[7][col] = { player: 1, kind: back[col] };
  }
  return {
    gameId: 'chess', board, turn: 1, winner: null, status: 'playing',
    castling: { 1: { king: true, queen: true }, 2: { king: true, queen: true } },
    enPassant: null, lastMove: null,
  };
}

export function isChessSquareAttacked(board: ChessState['board'], [row, col]: ChessSquare, by: Player): boolean {
  const pawnSourceRow = row + (by === 1 ? 1 : -1);
  for (const dc of [-1, 1]) {
    const piece = inBounds(pawnSourceRow, col + dc) ? board[pawnSourceRow][col + dc] : null;
    if (piece?.player === by && piece.kind === 'pawn') return true;
  }
  for (const [dr, dc] of knightSteps) {
    const piece = inBounds(row + dr, col + dc) ? board[row + dr][col + dc] : null;
    if (piece?.player === by && piece.kind === 'knight') return true;
  }
  for (const [dr, dc] of directions.king) {
    const piece = inBounds(row + dr, col + dc) ? board[row + dr][col + dc] : null;
    if (piece?.player === by && piece.kind === 'king') return true;
    for (let step = 1; step < 8; step++) {
      const y = row + dr * step;
      const x = col + dc * step;
      if (!inBounds(y, x)) break;
      const blocker = board[y][x];
      if (!blocker) continue;
      if (blocker.player === by && (blocker.kind === 'queen' || (step === 1 && blocker.kind === 'king') ||
        ((dr === 0 || dc === 0) && blocker.kind === 'rook') || ((dr !== 0 && dc !== 0) && blocker.kind === 'bishop'))) return true;
      break;
    }
  }
  return false;
}

export function isChessKingInCheck(board: ChessState['board'], player: Player): boolean {
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    if (board[row][col]?.player === player && board[row][col]?.kind === 'king') {
      return isChessSquareAttacked(board, [row, col], opposite(player));
    }
  }
  return true;
}

function pseudoMoves(state: ChessState, from: ChessSquare): ChessMove[] {
  const [row, col] = from;
  const piece = state.board[row]?.[col];
  if (!piece || piece.player !== state.turn || state.winner !== null) return [];
  const moves: ChessMove[] = [];
  const add = (toRow: number, toCol: number) => {
    if (inBounds(toRow, toCol) && state.board[toRow][toCol]?.player !== piece.player) moves.push({ from, to: [toRow, toCol] });
  };
  if (piece.kind === 'pawn') {
    const step = piece.player === 1 ? -1 : 1;
    const startRow = piece.player === 1 ? 6 : 1;
    const nextRow = row + step;
    if (inBounds(nextRow, col) && !state.board[nextRow][col]) {
      add(nextRow, col);
      if (row === startRow && !state.board[row + step * 2][col]) add(row + step * 2, col);
    }
    for (const dc of [-1, 1]) {
      const target = inBounds(nextRow, col + dc) ? state.board[nextRow][col + dc] : null;
      if (target && target.player !== piece.player) add(nextRow, col + dc);
      else if (state.enPassant && sameSquare(state.enPassant, [nextRow, col + dc])) moves.push({ from, to: [nextRow, col + dc] });
    }
  } else if (piece.kind === 'knight') {
    knightSteps.forEach(([dr, dc]) => add(row + dr, col + dc));
  } else if (piece.kind === 'king') {
    directions.king.forEach(([dr, dc]) => add(row + dr, col + dc));
    const homeRow = piece.player === 1 ? 7 : 0;
    const rights = state.castling[piece.player];
    if (row === homeRow && col === 4 && !isChessKingInCheck(state.board, piece.player)) {
      if (rights.king && !state.board[homeRow][5] && !state.board[homeRow][6] &&
        !isChessSquareAttacked(state.board, [homeRow, 5], opposite(piece.player)) && !isChessSquareAttacked(state.board, [homeRow, 6], opposite(piece.player))) {
        moves.push({ from, to: [homeRow, 6] });
      }
      if (rights.queen && !state.board[homeRow][1] && !state.board[homeRow][2] && !state.board[homeRow][3] &&
        !isChessSquareAttacked(state.board, [homeRow, 3], opposite(piece.player)) && !isChessSquareAttacked(state.board, [homeRow, 2], opposite(piece.player))) {
        moves.push({ from, to: [homeRow, 2] });
      }
    }
  } else {
    const rays = piece.kind === 'rook' ? directions.rook : piece.kind === 'bishop' ? directions.bishop : directions.king;
    for (const [dr, dc] of rays) {
      for (let distance = 1; distance < 8; distance++) {
        const y = row + dr * distance;
        const x = col + dc * distance;
        if (!inBounds(y, x)) break;
        if (!state.board[y][x]) moves.push({ from, to: [y, x] });
        else {
          if (state.board[y][x]?.player !== piece.player) moves.push({ from, to: [y, x] });
          break;
        }
      }
    }
  }
  return moves;
}

function applyCore(state: ChessState, move: ChessMove): ChessState {
  const board = state.board.map((line) => [...line]);
  const piece = board[move.from[0]][move.from[1]];
  if (!piece) return state;
  const rights = {
    1: { ...state.castling[1] },
    2: { ...state.castling[2] },
  };
  if (piece.kind === 'king') rights[piece.player].king = false;
  if (piece.kind === 'rook') {
    if (move.from[0] === (piece.player === 1 ? 7 : 0) && move.from[1] === 0) rights[piece.player].queen = false;
    if (move.from[0] === (piece.player === 1 ? 7 : 0) && move.from[1] === 7) rights[piece.player].king = false;
  }
  const captured = board[move.to[0]][move.to[1]];
  if (captured?.kind === 'rook') {
    const capturedHome = captured.player === 1 ? 7 : 0;
    if (move.to[0] === capturedHome && move.to[1] === 0) rights[captured.player].queen = false;
    if (move.to[0] === capturedHome && move.to[1] === 7) rights[captured.player].king = false;
  }
  board[move.from[0]][move.from[1]] = null;
  if (piece.kind === 'pawn' && state.enPassant && sameSquare(move.to, state.enPassant) && move.from[1] !== move.to[1]) {
    board[move.from[0]][move.to[1]] = null;
  }
  const reachesLastRank = piece.kind === 'pawn' && (move.to[0] === 0 || move.to[0] === 7);
  board[move.to[0]][move.to[1]] = reachesLastRank ? { ...piece, kind: move.promotion ?? 'queen' } : piece;
  if (piece.kind === 'king' && Math.abs(move.to[1] - move.from[1]) === 2) {
    const row = move.from[0];
    if (move.to[1] === 6) {
      board[row][5] = board[row][7];
      board[row][7] = null;
    } else {
      board[row][3] = board[row][0];
      board[row][0] = null;
    }
  }
  const enPassant = piece.kind === 'pawn' && Math.abs(move.to[0] - move.from[0]) === 2
    ? [((move.from[0] + move.to[0]) / 2), move.from[1]] as ChessSquare
    : null;
  return { ...state, board, turn: opposite(state.turn), castling: rights, enPassant, lastMove: move };
}

function allLegalMoves(state: ChessState): ChessMove[] {
  const moves: ChessMove[] = [];
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    if (state.board[row][col]?.player !== state.turn) continue;
    for (const move of pseudoMoves(state, [row, col])) {
      const next = applyCore(state, move);
      if (!isChessKingInCheck(next.board, state.turn)) moves.push(move);
    }
  }
  return moves;
}

export function getLegalChessMoves(state: ChessState, from: ChessSquare): ChessMove[] {
  if (state.winner !== null || state.board[from[0]]?.[from[1]]?.player !== state.turn) return [];
  return allLegalMoves(state).filter((move) => sameSquare(move.from, from));
}

export function applyChessMove(state: ChessState, move: ChessMove): ChessState {
  if (!getLegalChessMoves(state, move.from).some((candidate) => sameSquare(candidate.to, move.to))) return state;
  const next = applyCore(state, move);
  const inCheck = isChessKingInCheck(next.board, next.turn);
  const replies = allLegalMoves(next);
  if (replies.length === 0) {
    return inCheck ? { ...next, winner: state.turn, status: 'checkmate' } : { ...next, winner: 'draw', status: 'stalemate' };
  }
  return { ...next, status: inCheck ? 'check' : 'playing' };
}
