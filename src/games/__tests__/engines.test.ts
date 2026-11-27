import { describe, expect, it } from 'vitest';
import { applyCheckersStep, chooseCheckersAIMove, createInitialCheckersState, getLegalCheckersSteps } from '../checkers';
import { applyConnect4Move, chooseConnect4AIMove, createInitialConnect4State } from '../connect4';
import { applyDotsEdgeMove, chooseDotsBoxesAIMove, createInitialDotsBoxesState } from '../dotsAndBoxes';
import { applyGomokuMove, chooseGomokuAIMove, createInitialGomokuState } from '../gomoku';
import { applyMancalaMove, chooseMancalaAIMove, createInitialMancalaState } from '../mancala';
import { chooseMorrisAIMove } from '../morris/ai';
import { applyMorrisMove, createInitialMorrisState, getLegalMorrisMoves } from '../morris/engine';
import { MORRIS_TOPOLOGIES } from '../morris/topologies';
import { applyReversiMove, chooseReversiAIMove, createInitialReversiState, getLegalReversiMoves } from '../reversi';

describe('Morris family topologies & engines', () => {
  it('validates Three, Six, Nine, and Twelve Men Morris topologies', () => {
    expect(MORRIS_TOPOLOGIES['three-mens-morris'].nodes).toHaveLength(9);
    expect(MORRIS_TOPOLOGIES['six-mens-morris'].nodes).toHaveLength(16);
    expect(MORRIS_TOPOLOGIES['nine-mens-morris'].nodes).toHaveLength(24);
    expect(MORRIS_TOPOLOGIES['twelve-mens-morris'].nodes).toHaveLength(24);
    expect(MORRIS_TOPOLOGIES['twelve-mens-morris'].mills).toHaveLength(20);
  });

  it('Three Men Morris wins immediately on 3 in a row', () => {
    let s = createInitialMorrisState('three-mens-morris');
    s = applyMorrisMove(s, { type: 'place', to: 0 }); // P1
    s = applyMorrisMove(s, { type: 'place', to: 3 }); // P2
    s = applyMorrisMove(s, { type: 'place', to: 1 }); // P1
    s = applyMorrisMove(s, { type: 'place', to: 4 }); // P2
    s = applyMorrisMove(s, { type: 'place', to: 2 }); // P1 completes 0-1-2
    expect(s.winner).toBe(1);
    expect(s.phase).toBe('gameover');
    expect(s.winningLine).toEqual([0, 1, 2]);
  });

  it('Nine Men Morris enters capture phase on mill and protects opponent mills', () => {
    let s = createInitialMorrisState('nine-mens-morris');
    s = applyMorrisMove(s, { type: 'place', to: 0 }); // P1
    s = applyMorrisMove(s, { type: 'place', to: 8 }); // P2
    s = applyMorrisMove(s, { type: 'place', to: 1 }); // P1
    s = applyMorrisMove(s, { type: 'place', to: 9 }); // P2
    s = applyMorrisMove(s, { type: 'place', to: 2 }); // P1 forms mill 0-1-2
    expect(s.phase).toBe('capture');
    const legalCaps = getLegalMorrisMoves(s).map((m) => m.to);
    expect(legalCaps).toEqual([8, 9]);
  });

  it('Morris AI returns valid moves for all 4 variants', () => {
    for (const variant of [
      'three-mens-morris',
      'six-mens-morris',
      'nine-mens-morris',
      'twelve-mens-morris',
    ] as const) {
      const s = createInitialMorrisState(variant);
      const move = chooseMorrisAIMove(s, 'medium');
      expect(move).not.toBeNull();
      const next = applyMorrisMove(s, move!);
      expect(next).not.toBe(s);
    }
  });
});

describe('Classic Strategy Engines', () => {
  it('Connect Four detects vertical win and AI picks legal column', () => {
    let s = createInitialConnect4State();
    for (let i = 0; i < 3; i++) {
      s = applyConnect4Move(s, 3); // P1
      s = applyConnect4Move(s, 4); // P2
    }
    s = applyConnect4Move(s, 3); // P1 4th in col 3
    expect(s.winner).toBe(1);
    expect(s.winningCells).toHaveLength(4);

    const fresh = createInitialConnect4State();
    const aiCol = chooseConnect4AIMove(fresh, 'medium');
    expect(aiCol).not.toBeNull();
  });

  it('Reversi starts with 4 legal moves and flips discs properly', () => {
    const s = createInitialReversiState();
    const moves = getLegalReversiMoves(s.board, 1);
    expect(moves).toHaveLength(4);
    const next = applyReversiMove(s, moves[0][0], moves[0][1]);
    expect(next.flippedCells.length).toBeGreaterThan(0);
    expect(chooseReversiAIMove(next, 'medium')).not.toBeNull();
  });

  it('Checkers starts with 7 legal opening moves and AI chooses valid step', () => {
    const s = createInitialCheckersState();
    const steps = getLegalCheckersSteps(s);
    expect(steps).toHaveLength(7);
    const next = applyCheckersStep(s, steps[0]);
    expect(next.turn).toBe(2);
    expect(chooseCheckersAIMove(next, 'medium')).not.toBeNull();
  });

  it('Mancala grants extra turn when landing in own store', () => {
    const s = createInitialMancalaState();
    // Pit 2 has 4 seeds: lands in 3, 4, 5, 6 (P1 store) -> extra turn!
    const next = applyMancalaMove(s, 2);
    expect(next.extraTurn).toBe(true);
    expect(next.turn).toBe(1);
    expect(next.pits[6]).toBe(1);
    expect(chooseMancalaAIMove(applyMancalaMove(next, 0), 'medium')).not.toBeNull();
  });

  it('Gomoku detects 5-in-a-row win', () => {
    let s = createInitialGomokuState();
    for (let i = 0; i < 4; i++) {
      s = applyGomokuMove(s, 7, 3 + i); // P1
      s = applyGomokuMove(s, 8, 3 + i); // P2
    }
    s = applyGomokuMove(s, 7, 7); // P1 5th stone
    expect(s.winner).toBe(1);
    expect(s.winningLine).toHaveLength(5);

    const fresh = createInitialGomokuState();
    expect(chooseGomokuAIMove(fresh, 'medium')).toEqual([7, 7]);
  });

  it('Dots & Boxes awards box and grants bonus turn', () => {
    let s = createInitialDotsBoxesState();
    s = applyDotsEdgeMove(s, { orientation: 'h', row: 0, col: 0 }); // P1
    s = applyDotsEdgeMove(s, { orientation: 'h', row: 1, col: 0 }); // P2
    s = applyDotsEdgeMove(s, { orientation: 'v', row: 0, col: 0 }); // P1
    s = applyDotsEdgeMove(s, { orientation: 'v', row: 0, col: 1 }); // P2 completes box (0,0)
    expect(s.scores[2]).toBe(1);
    expect(s.turn).toBe(2); // bonus turn
    expect(chooseDotsBoxesAIMove(s, 'hard')).not.toBeNull();
  });
});
