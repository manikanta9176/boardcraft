import { CheckersState, CheckersStepMove, applyCheckersStep, createInitialCheckersState } from './checkers';
import { Connect4State, applyConnect4Move, createInitialConnect4State } from './connect4';
import { DotsBoxesState, EdgeMove, applyDotsEdgeMove, createInitialDotsBoxesState } from './dotsAndBoxes';
import { GomokuState, applyGomokuMove, createInitialGomokuState } from './gomoku';
import { MancalaState, applyMancalaMove, createInitialMancalaState } from './mancala';
import { MorrisMove, MorrisState, applyMorrisMove, createInitialMorrisState } from './morris/engine';
import { MorrisVariantId } from './morris/topologies';
import { ReversiState, applyReversiMove, createInitialReversiState } from './reversi';
import { ArcadeState, createArcadeState } from './arcade';
import { GameId } from '../types/game';

export type AnyGameState =
  | { kind: 'morris'; data: MorrisState }
  | { kind: 'connect4'; data: Connect4State }
  | { kind: 'reversi'; data: ReversiState }
  | { kind: 'checkers'; data: CheckersState }
  | { kind: 'mancala'; data: MancalaState }
  | { kind: 'gomoku'; data: GomokuState }
  | { kind: 'dots-and-boxes'; data: DotsBoxesState }
  | { kind: 'arcade'; data: ArcadeState };

export function isMorrisId(id: GameId): id is MorrisVariantId {
  return (
    id === 'three-mens-morris' ||
    id === 'six-mens-morris' ||
    id === 'nine-mens-morris' ||
    id === 'twelve-mens-morris'
  );
}

export function createInitialGameState(id: GameId): AnyGameState {
  if (isMorrisId(id)) return { kind: 'morris', data: createInitialMorrisState(id) };
  switch (id) {
    case 'connect4':
      return { kind: 'connect4', data: createInitialConnect4State() };
    case 'reversi':
      return { kind: 'reversi', data: createInitialReversiState() };
    case 'checkers':
      return { kind: 'checkers', data: createInitialCheckersState() };
    case 'mancala':
      return { kind: 'mancala', data: createInitialMancalaState() };
    case 'gomoku':
      return { kind: 'gomoku', data: createInitialGomokuState() };
    case 'dots-and-boxes':
      return { kind: 'dots-and-boxes', data: createInitialDotsBoxesState() };
    case '2048':
    case 'minesweeper':
    case 'word-guess':
    case 'chess':
    case 'ludo':
    case 'ashta-chamma':
    case 'carrom':
    case 'tambola':
    case 'dice-duel':
    case 'yahtzee':
    case 'snake':
    case 'pocket-racer':
      return { kind: 'arcade', data: createArcadeState(id) };
  }
  throw new Error(`Unsupported game: ${id}`);
}

export type MoveSoundEvent = 'place' | 'move' | 'capture' | 'mill' | 'win';

export function applyRemoteMove(
  state: AnyGameState,
  payload: unknown,
): { next: AnyGameState; soundEvent: MoveSoundEvent } | null {
  switch (state.kind) {
    case 'morris': {
      const move = payload as MorrisMove;
      const updated = applyMorrisMove(state.data, move);
      if (updated === state.data) return null;
      const soundEvent: MoveSoundEvent =
        updated.winner !== null
          ? 'win'
          : updated.phase === 'capture'
            ? 'mill'
            : move.type === 'capture'
              ? 'capture'
              : move.type === 'move'
                ? 'move'
                : 'place';
      return { next: { kind: 'morris', data: updated }, soundEvent };
    }
    case 'connect4': {
      const col = payload as number;
      const updated = applyConnect4Move(state.data, col);
      if (updated === state.data) return null;
      return {
        next: { kind: 'connect4', data: updated },
        soundEvent: updated.winner !== null ? 'win' : 'place',
      };
    }
    case 'reversi': {
      const [r, c] = payload as [number, number];
      const updated = applyReversiMove(state.data, r, c);
      if (updated === state.data) return null;
      return {
        next: { kind: 'reversi', data: updated },
        soundEvent: updated.winner !== null ? 'win' : 'place',
      };
    }
    case 'checkers': {
      const step = payload as CheckersStepMove;
      const updated = applyCheckersStep(state.data, step);
      if (updated === state.data) return null;
      const soundEvent: MoveSoundEvent =
        updated.winner !== null ? 'win' : step.captured ? 'capture' : 'move';
      return { next: { kind: 'checkers', data: updated }, soundEvent };
    }
    case 'mancala': {
      const pit = payload as number;
      const updated = applyMancalaMove(state.data, pit);
      if (updated === state.data) return null;
      const soundEvent: MoveSoundEvent =
        updated.winner !== null ? 'win' : updated.lastCaptured ? 'capture' : 'place';
      return { next: { kind: 'mancala', data: updated }, soundEvent };
    }
    case 'gomoku': {
      const [r, c] = payload as [number, number];
      const updated = applyGomokuMove(state.data, r, c);
      if (updated === state.data) return null;
      return {
        next: { kind: 'gomoku', data: updated },
        soundEvent: updated.winner !== null ? 'win' : 'place',
      };
    }
    case 'dots-and-boxes': {
      const edge = payload as EdgeMove;
      const updated = applyDotsEdgeMove(state.data, edge);
      if (updated === state.data) return null;
      const soundEvent: MoveSoundEvent =
        updated.winner !== null
          ? 'win'
          : updated.lastClaimedBoxes.length > 0
            ? 'mill'
            : 'place';
      return { next: { kind: 'dots-and-boxes', data: updated }, soundEvent };
    }
    case 'arcade':
      return null;
  }
}
