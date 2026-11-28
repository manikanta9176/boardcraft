import { chooseCheckersAIMove } from './checkers';
import { chooseConnect4AIMove } from './connect4';
import { chooseDotsBoxesAIMove } from './dotsAndBoxes';
import { chooseGomokuAIMove } from './gomoku';
import { chooseMancalaAIMove } from './mancala';
import { chooseMorrisAIMove } from './morris/ai';
import { MORRIS_TOPOLOGIES } from './morris/topologies';
import { chooseReversiAIMove } from './reversi';
import { AnyGameState } from './stateTypes';

export function getSuggestedHint(state: AnyGameState): string | null {
  if (state.data.winner !== null) return null;

  switch (state.kind) {
    case 'morris': {
      const move = chooseMorrisAIMove(state.data, 'hard');
      if (!move) return null;
      const topo = MORRIS_TOPOLOGIES[state.data.variant];
      const toLabel = topo.nodes[move.to]?.label ?? `#${move.to}`;
      if (move.type === 'place') return `Try placing on ${toLabel}`;
      if (move.type === 'capture') return `Try capturing the piece at ${toLabel}`;
      const fromLabel = move.from !== undefined ? topo.nodes[move.from]?.label : '';
      return `Try moving ${fromLabel} → ${toLabel}`;
    }
    case 'connect4': {
      const col = chooseConnect4AIMove(state.data, 'hard');
      return col !== null ? `Try dropping into Column ${col + 1}` : null;
    }
    case 'reversi': {
      const move = chooseReversiAIMove(state.data, 'hard');
      return move ? `Try Row ${move[0] + 1}, Column ${move[1] + 1}` : null;
    }
    case 'checkers': {
      const step = chooseCheckersAIMove(state.data, 'hard');
      if (!step) return null;
      return `Try ${step.captured ? 'jumping' : 'moving'} (${step.from[0] + 1},${step.from[1] + 1}) → (${step.to[0] + 1},${step.to[1] + 1})`;
    }
    case 'mancala': {
      const pit = chooseMancalaAIMove(state.data, 'hard');
      if (pit === null) return null;
      const displayIdx = pit < 6 ? pit + 1 : 13 - pit;
      return `Try sowing from pit #${displayIdx} (left to right)`;
    }
    case 'gomoku': {
      const move = chooseGomokuAIMove(state.data, 'hard');
      return move ? `Try intersection Row ${move[0] + 1}, Col ${move[1] + 1}` : null;
    }
    case 'dots-and-boxes': {
      const edge = chooseDotsBoxesAIMove(state.data, 'hard');
      if (!edge) return null;
      return `Try a ${edge.orientation === 'h' ? 'horizontal' : 'vertical'} edge at row ${edge.row + 1}, col ${edge.col + 1}`;
    }
    case 'arcade':
      return null;
  }
}
