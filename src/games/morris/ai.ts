import { Difficulty, Player } from '../../types/game';
import {
  MorrisMove,
  MorrisState,
  applyMorrisMove,
  countPiecesOnBoard,
  getLegalMorrisMoves,
  getOpponent,
  isPlayerFlying,
} from './engine';
import { MORRIS_TOPOLOGIES } from './topologies';

function evaluateMorris(state: MorrisState, aiPlayer: Player): number {
  const opp = getOpponent(aiPlayer);
  if (state.winner === aiPlayer) return 100000;
  if (state.winner === opp) return -100000;
  if (state.winner === 'draw') return 0;

  const topo = MORRIS_TOPOLOGIES[state.variant];
  const myBoard = countPiecesOnBoard(state.board, aiPlayer);
  const oppBoard = countPiecesOnBoard(state.board, opp);
  const myTotal = myBoard + state.toPlace[aiPlayer];
  const oppTotal = oppBoard + state.toPlace[opp];

  let score = (myTotal - oppTotal) * 200;

  // Evaluate mills & two-in-a-row threats
  let myMills = 0;
  let oppMills = 0;
  let myTwo = 0;
  let oppTwo = 0;

  for (const [a, b, c] of topo.mills) {
    const cells = [state.board[a], state.board[b], state.board[c]];
    const myC = cells.filter((x) => x === aiPlayer).length;
    const oppC = cells.filter((x) => x === opp).length;
    if (myC === 3) myMills++;
    else if (oppC === 3) oppMills++;
    else if (myC === 2 && oppC === 0) myTwo++;
    else if (oppC === 2 && myC === 0) oppTwo++;
  }

  score += (myMills - oppMills) * 45;
  score += (myTwo - oppTwo) * 24;

  // Mobility & node degree
  let myMobility = 0;
  let oppMobility = 0;
  for (let i = 0; i < state.board.length; i++) {
    const owner = state.board[i];
    if (owner !== null) {
      const deg = topo.adjacency[i].length;
      if (owner === aiPlayer) score += deg * 3;
      else score -= deg * 3;
      for (const adj of topo.adjacency[i]) {
        if (state.board[adj] === null) {
          if (owner === aiPlayer) myMobility++;
          else oppMobility++;
        }
      }
    }
  }
  score += (myMobility - oppMobility) * 6;

  // If in capture phase on current turn
  if (state.phase === 'capture') {
    score += state.turn === aiPlayer ? 120 : -120;
  }

  // Slight bonus if flying is unlocked vs not
  if (isPlayerFlying(state, aiPlayer)) score += 30;
  if (isPlayerFlying(state, opp)) score -= 25;

  return score;
}

function orderMoves(state: MorrisState, moves: MorrisMove[]): MorrisMove[] {
  const topo = MORRIS_TOPOLOGIES[state.variant];
  return [...moves].sort((a, b) => {
    const degA = topo.adjacency[a.to].length;
    const degB = topo.adjacency[b.to].length;
    return degB - degA;
  });
}

function alphabeta(
  state: MorrisState,
  depth: number,
  alpha: number,
  beta: number,
  aiPlayer: Player,
): number {
  if (depth <= 0 || state.phase === 'gameover') {
    const base = evaluateMorris(state, aiPlayer);
    // Prefer faster wins / slower losses
    if (state.winner === aiPlayer) return base + depth * 100;
    if (state.winner === getOpponent(aiPlayer)) return base - depth * 100;
    return base;
  }

  const moves = orderMoves(state, getLegalMorrisMoves(state));
  if (moves.length === 0) return evaluateMorris(state, aiPlayer);

  const maximizing = state.turn === aiPlayer;
  if (maximizing) {
    let value = -Infinity;
    for (const move of moves) {
      const next = applyMorrisMove(state, move);
      // Capture doesn't consume full ply depth or consumes half; keep depth - 1 for speed
      const nextDepth = state.phase === 'capture' ? depth : depth - 1;
      value = Math.max(value, alphabeta(next, nextDepth, alpha, beta, aiPlayer));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  } else {
    let value = Infinity;
    for (const move of moves) {
      const next = applyMorrisMove(state, move);
      const nextDepth = state.phase === 'capture' ? depth : depth - 1;
      value = Math.min(value, alphabeta(next, nextDepth, alpha, beta, aiPlayer));
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return value;
  }
}

export function chooseMorrisAIMove(state: MorrisState, difficulty: Difficulty): MorrisMove | null {
  const moves = getLegalMorrisMoves(state);
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    // 50% random, 50% shallow heuristic
    if (Math.random() < 0.55) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
  }

  const depth =
    difficulty === 'easy'
      ? 1
      : difficulty === 'medium'
        ? state.variant === 'three-mens-morris'
          ? 4
          : 2
        : state.variant === 'three-mens-morris'
          ? 6
          : moves.length > 25
            ? 2
            : 3;

  const aiPlayer = state.turn;
  const ordered = orderMoves(state, moves);
  let bestScore = -Infinity;
  let bestMoves: MorrisMove[] = [];

  for (const move of ordered) {
    const next = applyMorrisMove(state, move);
    const score = alphabeta(next, depth - 1, -Infinity, Infinity, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
