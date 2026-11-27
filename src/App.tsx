import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameHeader } from './components/GameHeader';
import { GameOverBanner } from './components/GameOverBanner';
import { PlayerBar } from './components/PlayerBar';
import { RulesModal } from './components/RulesModal';
import { Sidebar } from './components/Sidebar';
import { CheckersBoard } from './components/boards/CheckersBoard';
import { Connect4Board } from './components/boards/Connect4Board';
import { DotsBoxesBoard } from './components/boards/DotsBoxesBoard';
import { GomokuBoard } from './components/boards/GomokuBoard';
import { MancalaBoard } from './components/boards/MancalaBoard';
import { MorrisBoard } from './components/boards/MorrisBoard';
import { ReversiBoard } from './components/boards/ReversiBoard';
import {
  CheckersState,
  CheckersStepMove,
  applyCheckersStep,
  chooseCheckersAIMove,
  countCheckersPieces,
  createInitialCheckersState,
} from './games/checkers';
import {
  Connect4State,
  applyConnect4Move,
  chooseConnect4AIMove,
  createInitialConnect4State,
} from './games/connect4';
import {
  DotsBoxesState,
  EdgeMove,
  applyDotsEdgeMove,
  chooseDotsBoxesAIMove,
  createInitialDotsBoxesState,
} from './games/dotsAndBoxes';
import {
  GomokuState,
  applyGomokuMove,
  chooseGomokuAIMove,
  createInitialGomokuState,
} from './games/gomoku';
import {
  MancalaState,
  applyMancalaMove,
  chooseMancalaAIMove,
  createInitialMancalaState,
} from './games/mancala';
import { chooseMorrisAIMove } from './games/morris/ai';
import {
  MorrisMove,
  MorrisState,
  applyMorrisMove,
  countPiecesOnBoard,
  createInitialMorrisState,
} from './games/morris/engine';
import { MorrisVariantId } from './games/morris/topologies';
import { GAMES } from './games/registry';
import {
  ReversiState,
  applyReversiMove,
  chooseReversiAIMove,
  countReversiDiscs,
  createInitialReversiState,
} from './games/reversi';
import { Difficulty, GameId, GameMode, Player, THEMES, ThemeId } from './types/game';
import { sound } from './utils/sound';

type AnyGameState =
  | { kind: 'morris'; data: MorrisState }
  | { kind: 'connect4'; data: Connect4State }
  | { kind: 'reversi'; data: ReversiState }
  | { kind: 'checkers'; data: CheckersState }
  | { kind: 'mancala'; data: MancalaState }
  | { kind: 'gomoku'; data: GomokuState }
  | { kind: 'dots-and-boxes'; data: DotsBoxesState };

function isMorrisId(id: GameId): id is MorrisVariantId {
  return (
    id === 'three-mens-morris' ||
    id === 'six-mens-morris' ||
    id === 'nine-mens-morris' ||
    id === 'twelve-mens-morris'
  );
}

function createInitialGameState(id: GameId): AnyGameState {
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
  }
}

export function App() {
  const [activeGameId, setActiveGameId] = useState<GameId>('nine-mens-morris');
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('boardcraft-theme') as ThemeId | null;
    return saved && THEMES[saved] ? saved : 'obsidian';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('boardcraft-sound');
    return saved === null ? true : saved === 'true';
  });

  const [gameState, setGameState] = useState<AnyGameState>(() =>
    createInitialGameState('nine-mens-morris'),
  );
  const [history, setHistory] = useState<AnyGameState[]>([]);
  const [checkersSelected, setCheckersSelected] = useState<[number, number] | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const aiTimerRef = useRef<number | null>(null);
  const theme = THEMES[themeId];
  const activeMeta = useMemo(
    () => GAMES.find((g) => g.id === activeGameId) ?? GAMES[0],
    [activeGameId],
  );

  useEffect(() => {
    localStorage.setItem('boardcraft-theme', themeId);
  }, [themeId]);

  useEffect(() => {
    sound.enabled = soundEnabled;
    localStorage.setItem('boardcraft-sound', String(soundEnabled));
  }, [soundEnabled]);

  const resetGame = useCallback(
    (targetId: GameId = activeGameId) => {
      if (aiTimerRef.current) {
        window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
      setAiThinking(false);
      setCheckersSelected(null);
      setHistory([]);
      setGameState(createInitialGameState(targetId));
    },
    [activeGameId],
  );

  const handleSelectGame = (id: GameId) => {
    setActiveGameId(id);
    resetGame(id);
  };

  const handleModeChange = (nextMode: GameMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetGame(activeGameId);
  };

  const pushState = useCallback((next: AnyGameState) => {
    setGameState((prev) => {
      setHistory((h) => [...h, prev]);
      return next;
    });
  }, []);

  const handleUndo = () => {
    if (history.length === 0 || aiThinking) return;
    if (mode === 'ai') {
      // Pop back to the last state where it was Player 1's turn
      let idx = history.length - 1;
      while (idx > 0 && history[idx].data.turn !== 1) {
        idx--;
      }
      setGameState(history[idx]);
      setHistory(history.slice(0, idx));
    } else {
      const prev = history[history.length - 1];
      setGameState(prev);
      setHistory(history.slice(0, -1));
    }
    setCheckersSelected(null);
  };

  // Current turn & winner extraction
  const turn: Player = gameState.data.turn;
  const winner: Player | 'draw' | null = gameState.data.winner;

  // AI Turn Effect
  useEffect(() => {
    if (mode !== 'ai' || winner !== null || turn !== 2) {
      setAiThinking(false);
      return;
    }

    setAiThinking(true);
    const delay = gameState.kind === 'mancala' || gameState.kind === 'dots-and-boxes' ? 360 : 280;

    aiTimerRef.current = window.setTimeout(() => {
      let nextState: AnyGameState | null = null;

      if (gameState.kind === 'morris') {
        const move = chooseMorrisAIMove(gameState.data, difficulty);
        if (move) {
          const updated = applyMorrisMove(gameState.data, move);
          if (updated.winner !== null) sound.win();
          else if (updated.phase === 'capture') sound.mill();
          else if (move.type === 'capture') sound.capture();
          else sound.place();
          nextState = { kind: 'morris', data: updated };
        }
      } else if (gameState.kind === 'connect4') {
        const col = chooseConnect4AIMove(gameState.data, difficulty);
        if (col !== null) {
          const updated = applyConnect4Move(gameState.data, col);
          if (updated.winner !== null) sound.win();
          else sound.place();
          nextState = { kind: 'connect4', data: updated };
        }
      } else if (gameState.kind === 'reversi') {
        const move = chooseReversiAIMove(gameState.data, difficulty);
        if (move) {
          const updated = applyReversiMove(gameState.data, move[0], move[1]);
          if (updated.winner !== null) sound.win();
          else sound.place();
          nextState = { kind: 'reversi', data: updated };
        }
      } else if (gameState.kind === 'checkers') {
        const move = chooseCheckersAIMove(gameState.data, difficulty);
        if (move) {
          const updated = applyCheckersStep(gameState.data, move);
          if (updated.winner !== null) sound.win();
          else if (move.captured) sound.capture();
          else sound.move();
          nextState = { kind: 'checkers', data: updated };
        }
      } else if (gameState.kind === 'mancala') {
        const pit = chooseMancalaAIMove(gameState.data, difficulty);
        if (pit !== null) {
          const updated = applyMancalaMove(gameState.data, pit);
          if (updated.winner !== null) sound.win();
          else if (updated.lastCaptured) sound.capture();
          else sound.place();
          nextState = { kind: 'mancala', data: updated };
        }
      } else if (gameState.kind === 'gomoku') {
        const move = chooseGomokuAIMove(gameState.data, difficulty);
        if (move) {
          const updated = applyGomokuMove(gameState.data, move[0], move[1]);
          if (updated.winner !== null) sound.win();
          else sound.place();
          nextState = { kind: 'gomoku', data: updated };
        }
      } else if (gameState.kind === 'dots-and-boxes') {
        const edge = chooseDotsBoxesAIMove(gameState.data, difficulty);
        if (edge) {
          const updated = applyDotsEdgeMove(gameState.data, edge);
          if (updated.winner !== null) sound.win();
          else if (updated.lastClaimedBoxes.length > 0) sound.mill();
          else sound.place();
          nextState = { kind: 'dots-and-boxes', data: updated };
        }
      }

      if (nextState) {
        pushState(nextState);
      }
      setAiThinking(false);
    }, delay);

    return () => {
      if (aiTimerRef.current) {
        window.clearTimeout(aiTimerRef.current);
      }
    };
  }, [gameState, mode, difficulty, turn, winner, pushState]);

  const humanDisabled = mode === 'ai' && (turn === 2 || aiThinking);

  // Handlers for each game
  const handleMorrisSelect = (nodeId: number | null) => {
    if (gameState.kind !== 'morris') return;
    setGameState({
      kind: 'morris',
      data: { ...gameState.data, selectedNode: nodeId },
    });
  };

  const handleMorrisMove = (move: MorrisMove) => {
    if (gameState.kind !== 'morris') return;
    const updated = applyMorrisMove(gameState.data, move);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else if (updated.phase === 'capture') sound.mill();
    else if (move.type === 'capture') sound.capture();
    else if (move.type === 'move') sound.move();
    else sound.place();
    pushState({ kind: 'morris', data: updated });
  };

  const handleConnect4Drop = (col: number) => {
    if (gameState.kind !== 'connect4') return;
    const updated = applyConnect4Move(gameState.data, col);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else sound.place();
    pushState({ kind: 'connect4', data: updated });
  };

  const handleReversiPlace = (row: number, col: number) => {
    if (gameState.kind !== 'reversi') return;
    const updated = applyReversiMove(gameState.data, row, col);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else sound.place();
    pushState({ kind: 'reversi', data: updated });
  };

  const handleCheckersStep = (move: CheckersStepMove) => {
    if (gameState.kind !== 'checkers') return;
    const updated = applyCheckersStep(gameState.data, move);
    if (updated === gameState.data) return;
    setCheckersSelected(null);
    if (updated.winner !== null) sound.win();
    else if (move.captured) sound.capture();
    else sound.move();
    pushState({ kind: 'checkers', data: updated });
  };

  const handleMancalaPit = (pitIdx: number) => {
    if (gameState.kind !== 'mancala') return;
    const updated = applyMancalaMove(gameState.data, pitIdx);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else if (updated.lastCaptured) sound.capture();
    else sound.place();
    pushState({ kind: 'mancala', data: updated });
  };

  const handleGomokuPlace = (row: number, col: number) => {
    if (gameState.kind !== 'gomoku') return;
    const updated = applyGomokuMove(gameState.data, row, col);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else sound.place();
    pushState({ kind: 'gomoku', data: updated });
  };

  const handleDotsEdge = (edge: EdgeMove) => {
    if (gameState.kind !== 'dots-and-boxes') return;
    const updated = applyDotsEdgeMove(gameState.data, edge);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else if (updated.lastClaimedBoxes.length > 0) sound.mill();
    else sound.place();
    pushState({ kind: 'dots-and-boxes', data: updated });
  };

  // Compute PlayerBar metrics & status hints
  const { p1Metric, p2Metric, statusHint, gameOverSubtitle } = useMemo(() => {
    switch (gameState.kind) {
      case 'morris': {
        const s = gameState.data;
        const on1 = countPiecesOnBoard(s.board, 1);
        const on2 = countPiecesOnBoard(s.board, 2);
        return {
          p1Metric: `Board: ${on1} • Reserve: ${s.toPlace[1]}`,
          p2Metric: `Board: ${on2} • Reserve: ${s.toPlace[2]}`,
          statusHint: s.statusText,
          gameOverSubtitle: s.statusText,
        };
      }
      case 'connect4': {
        const s = gameState.data;
        let c1 = 0;
        let c2 = 0;
        for (const row of s.board) {
          for (const cell of row) {
            if (cell === 1) c1++;
            else if (cell === 2) c2++;
          }
        }
        return {
          p1Metric: `${c1} discs played`,
          p2Metric: `${c2} discs played`,
          statusHint: s.winner === null ? 'Drop a disc into any open column' : undefined,
          gameOverSubtitle: s.winner === 'draw' ? 'Board is full' : 'Aligned 4 discs in a row',
        };
      }
      case 'reversi': {
        const s = gameState.data;
        const counts = countReversiDiscs(s.board);
        return {
          p1Metric: `${counts[1]} discs`,
          p2Metric: `${counts[2]} discs`,
          statusHint: s.passedTurn
            ? 'Opponent had no legal moves — turn passed!'
            : s.winner === null
              ? 'Outflank opponent discs to flip them'
              : undefined,
          gameOverSubtitle: `Final score: ${counts[1]} – ${counts[2]}`,
        };
      }
      case 'checkers': {
        const s = gameState.data;
        const counts = countCheckersPieces(s.board);
        return {
          p1Metric: `${counts[1]} pieces (${counts.kings1} Kings)`,
          p2Metric: `${counts[2]} pieces (${counts.kings2} Kings)`,
          statusHint: s.mustContinueFrom
            ? 'Multi-jump! Continue jumping with the highlighted piece'
            : s.winner === null
              ? 'Select a piece to move (captures are mandatory)'
              : undefined,
          gameOverSubtitle: `Remaining pieces: ${counts[1]} – ${counts[2]}`,
        };
      }
      case 'mancala': {
        const s = gameState.data;
        return {
          p1Metric: `Store: ${s.pits[6]}`,
          p2Metric: `Store: ${s.pits[13]}`,
          statusHint: s.extraTurn
            ? 'Landed in Store — bonus turn!'
            : s.lastCaptured
              ? 'Opposite pit captured!'
              : s.winner === null
                ? 'Choose one of your pits to sow seeds counter-clockwise'
                : undefined,
          gameOverSubtitle: `Final Store count: ${s.pits[6]} – ${s.pits[13]}`,
        };
      }
      case 'gomoku': {
        const s = gameState.data;
        return {
          p1Metric: `Move #${Math.ceil(s.moveCount / 2)}`,
          p2Metric: `Move #${Math.floor(s.moveCount / 2)}`,
          statusHint: s.winner === null ? 'Connect 5 stones in a row to win' : undefined,
          gameOverSubtitle: s.winner === 'draw' ? 'All 225 intersections filled' : '5 stones aligned',
        };
      }
      case 'dots-and-boxes': {
        const s = gameState.data;
        return {
          p1Metric: `${s.scores[1]} boxes`,
          p2Metric: `${s.scores[2]} boxes`,
          statusHint:
            s.lastClaimedBoxes.length > 0 && s.winner === null
              ? `Box claimed! Bonus turn active`
              : s.winner === null
                ? 'Draw an edge between adjacent dots'
                : undefined,
          gameOverSubtitle: `Final boxes: ${s.scores[1]} – ${s.scores[2]}`,
        };
      }
    }
  }, [gameState]);

  return (
    <div
      className="h-screen w-screen flex overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: theme.bgApp, color: theme.textPrimary }}
    >
      <Sidebar
        activeGame={activeGameId}
        onSelectGame={handleSelectGame}
        theme={theme}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <GameHeader
          game={activeMeta}
          mode={mode}
          onModeChange={handleModeChange}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          theme={theme}
          onThemeChange={setThemeId}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          canUndo={history.length > 0 && !aiThinking}
          onUndo={handleUndo}
          onReset={() => resetGame(activeGameId)}
          onOpenRules={() => setRulesOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col items-center gap-4">
          <PlayerBar
            turn={turn}
            winner={winner}
            mode={mode}
            aiThinking={aiThinking}
            theme={theme}
            p1Metric={p1Metric}
            p2Metric={p2Metric}
            statusHint={winner === null ? statusHint : undefined}
          />

          {winner !== null && (
            <GameOverBanner
              winner={winner}
              mode={mode}
              theme={theme}
              onPlayAgain={() => resetGame(activeGameId)}
              subtitle={gameOverSubtitle}
            />
          )}

          <div className="w-full flex-1 flex items-center justify-center py-1">
            {gameState.kind === 'morris' && (
              <MorrisBoard
                state={gameState.data}
                theme={theme}
                disabled={humanDisabled}
                onSelectNode={handleMorrisSelect}
                onMove={handleMorrisMove}
              />
            )}
            {gameState.kind === 'connect4' && (
              <Connect4Board
                state={gameState.data}
                theme={theme}
                disabled={humanDisabled}
                onDropColumn={handleConnect4Drop}
              />
            )}
            {gameState.kind === 'reversi' && (
              <ReversiBoard
                state={gameState.data}
                theme={theme}
                disabled={humanDisabled}
                onPlace={handleReversiPlace}
              />
            )}
            {gameState.kind === 'checkers' && (
              <CheckersBoard
                state={gameState.data}
                theme={theme}
                disabled={humanDisabled}
                selected={checkersSelected}
                onSelect={setCheckersSelected}
                onStep={handleCheckersStep}
              />
            )}
            {gameState.kind === 'mancala' && (
              <MancalaBoard
                state={gameState.data}
                theme={theme}
                disabled={humanDisabled}
                onSelectPit={handleMancalaPit}
              />
            )}
            {gameState.kind === 'gomoku' && (
              <GomokuBoard
                state={gameState.data}
                theme={theme}
                disabled={humanDisabled}
                onPlace={handleGomokuPlace}
              />
            )}
            {gameState.kind === 'dots-and-boxes' && (
              <DotsBoxesBoard
                state={gameState.data}
                theme={theme}
                disabled={humanDisabled}
                onDrawEdge={handleDotsEdge}
              />
            )}
          </div>
        </main>
      </div>

      {rulesOpen && (
        <RulesModal
          game={activeMeta}
          theme={theme}
          onClose={() => setRulesOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
