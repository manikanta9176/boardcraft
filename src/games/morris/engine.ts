import { Player } from '../../types/game';
import { MORRIS_TOPOLOGIES, MorrisTopology, MorrisVariantId } from './topologies';

export type MorrisCell = Player | null;
export type MorrisPhase = 'placement' | 'movement' | 'capture' | 'gameover';

export interface MorrisState {
  variant: MorrisVariantId;
  board: MorrisCell[];
  turn: Player;
  phase: MorrisPhase;
  toPlace: Record<Player, number>;
  captured: Record<Player, number>; // pieces captured BY player
  selectedNode: number | null;
  winner: Player | 'draw' | null;
  winningLine: number[] | null;
  lastMove: { from?: number; to?: number; captured?: number } | null;
  movesWithoutCapture: number;
  positionCounts: Record<string, number>;
  statusText: string;
}

export interface MorrisMove {
  type: 'place' | 'move' | 'capture';
  from?: number;
  to: number;
}

export function getOpponent(player: Player): Player {
  return player === 1 ? 2 : 1;
}

export function countPiecesOnBoard(board: MorrisCell[], player: Player): number {
  let count = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === player) count++;
  }
  return count;
}

export function isPlayerFlying(state: MorrisState, player: Player): boolean {
  const topo = MORRIS_TOPOLOGIES[state.variant];
  if (!topo.canFly) return false;
  if (state.toPlace[player] > 0) return false;
  return countPiecesOnBoard(state.board, player) === 3;
}

export function isNodeInMill(board: MorrisCell[], topo: MorrisTopology, node: number, player: Player): boolean {
  for (const millIdx of topo.nodeMills[node]) {
    const [a, b, c] = topo.mills[millIdx];
    if (board[a] === player && board[b] === player && board[c] === player) {
      return true;
    }
  }
  return false;
}

export function getFormedMill(board: MorrisCell[], topo: MorrisTopology, node: number, player: Player): number[] | null {
  for (const millIdx of topo.nodeMills[node]) {
    const mill = topo.mills[millIdx];
    if (board[mill[0]] === player && board[mill[1]] === player && board[mill[2]] === player) {
      return [...mill];
    }
  }
  return null;
}

export function getCapturableNodes(board: MorrisCell[], topo: MorrisTopology, victim: Player): number[] {
  const nonMill: number[] = [];
  const allVictim: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === victim) {
      allVictim.push(i);
      if (!isNodeInMill(board, topo, i, victim)) {
        nonMill.push(i);
      }
    }
  }
  return nonMill.length > 0 ? nonMill : allVictim;
}

export function getValidDestinations(state: MorrisState, fromNode: number): number[] {
  const topo = MORRIS_TOPOLOGIES[state.variant];
  if (state.board[fromNode] !== state.turn) return [];
  if (isPlayerFlying(state, state.turn)) {
    const res: number[] = [];
    for (let i = 0; i < state.board.length; i++) {
      if (state.board[i] === null) res.push(i);
    }
    return res;
  }
  return topo.adjacency[fromNode].filter((n) => state.board[n] === null);
}

export function hasAnyLegalMove(state: MorrisState, player: Player): boolean {
  if (state.toPlace[player] > 0) {
    return state.board.some((cell) => cell === null);
  }
  const topo = MORRIS_TOPOLOGIES[state.variant];
  if (isPlayerFlying({ ...state, turn: player }, player)) {
    return state.board.some((cell) => cell === null);
  }
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] === player) {
      for (const adj of topo.adjacency[i]) {
        if (state.board[adj] === null) return true;
      }
    }
  }
  return false;
}

export function getLegalMorrisMoves(state: MorrisState): MorrisMove[] {
  if (state.phase === 'gameover') return [];
  const topo = MORRIS_TOPOLOGIES[state.variant];

  if (state.phase === 'capture') {
    const victim = getOpponent(state.turn);
    return getCapturableNodes(state.board, topo, victim).map((to) => ({
      type: 'capture',
      to,
    }));
  }

  if (state.phase === 'placement') {
    const moves: MorrisMove[] = [];
    for (let i = 0; i < state.board.length; i++) {
      if (state.board[i] === null) moves.push({ type: 'place', to: i });
    }
    return moves;
  }

  // Movement phase
  const moves: MorrisMove[] = [];
  const flying = isPlayerFlying(state, state.turn);
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] === state.turn) {
      if (flying) {
        for (let j = 0; j < state.board.length; j++) {
          if (state.board[j] === null) moves.push({ type: 'move', from: i, to: j });
        }
      } else {
        for (const adj of topo.adjacency[i]) {
          if (state.board[adj] === null) moves.push({ type: 'move', from: i, to: adj });
        }
      }
    }
  }
  return moves;
}

function serializePosition(board: MorrisCell[], turn: Player, toPlace: Record<Player, number>): string {
  return `${turn}|${toPlace[1]},${toPlace[2]}|${board.map((c) => c ?? 0).join('')}`;
}

export function createInitialMorrisState(variant: MorrisVariantId): MorrisState {
  const topo = MORRIS_TOPOLOGIES[variant];
  return {
    variant,
    board: Array(topo.nodes.length).fill(null),
    turn: 1,
    phase: 'placement',
    toPlace: { 1: topo.piecesPerPlayer, 2: topo.piecesPerPlayer },
    captured: { 1: 0, 2: 0 },
    selectedNode: null,
    winner: null,
    winningLine: null,
    lastMove: null,
    movesWithoutCapture: 0,
    positionCounts: {},
    statusText: 'Place a piece on any intersection',
  };
}

function finalizeTurn(state: MorrisState): MorrisState {
  const topo = MORRIS_TOPOLOGIES[state.variant];
  const nextTurn = getOpponent(state.turn);
  const nextToPlace = state.toPlace;
  const bothPlaced = nextToPlace[1] === 0 && nextToPlace[2] === 0;
  const nextPhase: MorrisPhase = bothPlaced ? 'movement' : 'placement';

  // Check material loss after placement
  if (topo.hasCaptures && nextToPlace[nextTurn] === 0) {
    const nextCount = countPiecesOnBoard(state.board, nextTurn);
    if (nextCount < 3) {
      return {
        ...state,
        turn: nextTurn,
        phase: 'gameover',
        winner: state.turn,
        statusText: `Player ${state.turn} wins (opponent reduced below 3 pieces)`,
      };
    }
  }

  // Check if next player is blocked or board full after placement
  const candidate: MorrisState = { ...state, turn: nextTurn, phase: nextPhase, selectedNode: null };
  if (!hasAnyLegalMove(candidate, nextTurn)) {
    // Special case for 12 Men's Morris: if board is completely full right after placement, it's a draw
    const boardFull = state.board.every((c) => c !== null);
    if (boardFull) {
      return {
        ...candidate,
        phase: 'gameover',
        winner: 'draw',
        statusText: 'Draw — board is completely full with no legal moves',
      };
    }
    return {
      ...candidate,
      phase: 'gameover',
      winner: state.turn,
      statusText: `Player ${state.turn} wins (opponent has no legal moves)`,
    };
  }

  // Repetition or 50-move rule in movement phase
  if (nextPhase === 'movement') {
    const posKey = serializePosition(state.board, nextTurn, nextToPlace);
    const count = (state.positionCounts[posKey] ?? 0) + 1;
    const positionCounts = { ...state.positionCounts, [posKey]: count };
    if (count >= 3 || state.movesWithoutCapture >= 50) {
      return {
        ...candidate,
        positionCounts,
        phase: 'gameover',
        winner: 'draw',
        statusText: count >= 3 ? 'Draw by threefold repetition' : 'Draw by 50-move rule',
      };
    }
    const flying = isPlayerFlying(candidate, nextTurn);
    return {
      ...candidate,
      positionCounts,
      statusText: flying ? 'Fly a piece to any empty intersection' : 'Slide a piece to an adjacent intersection',
    };
  }

  return {
    ...candidate,
    statusText: 'Place a piece on any empty intersection',
  };
}

export function applyMorrisMove(state: MorrisState, move: MorrisMove): MorrisState {
  if (state.phase === 'gameover') return state;
  const topo = MORRIS_TOPOLOGIES[state.variant];

  if (move.type === 'capture' && state.phase === 'capture') {
    const victim = getOpponent(state.turn);
    const capturable = getCapturableNodes(state.board, topo, victim);
    if (!capturable.includes(move.to)) return state;

    const nextBoard = [...state.board];
    nextBoard[move.to] = null;

    const nextState: MorrisState = {
      ...state,
      board: nextBoard,
      captured: {
        ...state.captured,
        [state.turn]: state.captured[state.turn] + 1,
      },
      lastMove: { ...state.lastMove, captured: move.to },
      movesWithoutCapture: 0,
      selectedNode: null,
    };
    return finalizeTurn(nextState);
  }

  if (move.type === 'place' && state.phase === 'placement') {
    if (state.board[move.to] !== null || state.toPlace[state.turn] <= 0) return state;

    const nextBoard = [...state.board];
    nextBoard[move.to] = state.turn;
    const nextToPlace = {
      ...state.toPlace,
      [state.turn]: state.toPlace[state.turn] - 1,
    };

    const formedMill = getFormedMill(nextBoard, topo, move.to, state.turn);
    if (formedMill) {
      if (!topo.hasCaptures) {
        // Three Men's Morris: forming 3 in a row wins immediately!
        return {
          ...state,
          board: nextBoard,
          toPlace: nextToPlace,
          phase: 'gameover',
          winner: state.turn,
          winningLine: formedMill,
          lastMove: { to: move.to },
          selectedNode: null,
          statusText: `Player ${state.turn} wins with 3 in a row!`,
        };
      }
      // Capture phase (if opponent has any pieces on board)
      const victim = getOpponent(state.turn);
      if (countPiecesOnBoard(nextBoard, victim) > 0) {
        return {
          ...state,
          board: nextBoard,
          toPlace: nextToPlace,
          phase: 'capture',
          lastMove: { to: move.to },
          selectedNode: null,
          statusText: 'Mill formed! Remove an opponent piece',
        };
      }
    }

    return finalizeTurn({
      ...state,
      board: nextBoard,
      toPlace: nextToPlace,
      lastMove: { to: move.to },
      movesWithoutCapture: 0,
      selectedNode: null,
    });
  }

  if (move.type === 'move' && state.phase === 'movement' && move.from !== undefined) {
    if (state.board[move.from] !== state.turn || state.board[move.to] !== null) return state;
    const flying = isPlayerFlying(state, state.turn);
    if (!flying && !topo.adjacency[move.from].includes(move.to)) return state;

    const nextBoard = [...state.board];
    nextBoard[move.from] = null;
    nextBoard[move.to] = state.turn;

    const formedMill = getFormedMill(nextBoard, topo, move.to, state.turn);
    if (formedMill) {
      if (!topo.hasCaptures) {
        return {
          ...state,
          board: nextBoard,
          phase: 'gameover',
          winner: state.turn,
          winningLine: formedMill,
          lastMove: { from: move.from, to: move.to },
          selectedNode: null,
          statusText: `Player ${state.turn} wins with 3 in a row!`,
        };
      }
      return {
        ...state,
        board: nextBoard,
        phase: 'capture',
        lastMove: { from: move.from, to: move.to },
        selectedNode: null,
        statusText: 'Mill formed! Remove an opponent piece',
      };
    }

    return finalizeTurn({
      ...state,
      board: nextBoard,
      lastMove: { from: move.from, to: move.to },
      movesWithoutCapture: state.movesWithoutCapture + 1,
      selectedNode: null,
    });
  }

  return state;
}
