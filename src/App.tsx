import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameHeader } from './components/GameHeader';
import { GameOverBanner } from './components/GameOverBanner';
import { ConfettiBurst } from './components/ConfettiBurst';
import { LobbyView } from './components/LobbyView';
import { MultiplayerModal } from './components/MultiplayerModal';
import { OnlineBar } from './components/OnlineBar';
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
import { applyRemoteMove } from './games/stateTypes';
import { ActiveTransport, PeerCallbacks, hostOnlineRoom, joinOnlineRoom } from './multiplayer/onlinePeer';
import { HotspotHostSession, createHotspotHostSession, joinHotspotOffer } from './multiplayer/hotspotDirect';
import {
  ConnectionPhase,
  NetMessage,
  TransportKind,
  generateRoomCode,
  normalizeRoomCode,
} from './multiplayer/types';

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

function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && GAMES.some((game) => game.id === value);
}

function isAnyGameState(value: unknown): value is AnyGameState {
  if (!value || typeof value !== 'object' || !('kind' in value) || !('data' in value)) return false;
  const candidate = value as { kind?: unknown; data?: { turn?: unknown; winner?: unknown } };
  return (
    ['morris', 'connect4', 'reversi', 'checkers', 'mancala', 'gomoku', 'dots-and-boxes'].includes(String(candidate.kind)) &&
    !!candidate.data &&
    (candidate.data.turn === 1 || candidate.data.turn === 2) &&
    (candidate.data.winner === null || candidate.data.winner === 1 || candidate.data.winner === 2 || candidate.data.winner === 'draw')
  );
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
  const [showLobby, setShowLobby] = useState(true);
  const [multiplayerOpen, setMultiplayerOpen] = useState(false);
  const [multiplayerTab, setMultiplayerTab] = useState<'online' | 'hotspot'>('online');
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('idle');
  const [transportKind, setTransportKind] = useState<TransportKind | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [hotspotOfferCode, setHotspotOfferCode] = useState('');
  const [hotspotAnswerCode, setHotspotAnswerCode] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [hostPlayer, setHostPlayer] = useState<Player>(1);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [reactionToast, setReactionToast] = useState<string | null>(null);
  const [inviteJoinCode] = useState(() => normalizeRoomCode(new URLSearchParams(window.location.search).get('room') ?? ''));

  const aiTimerRef = useRef<number | null>(null);
  const transportRef = useRef<ActiveTransport | null>(null);
  const hotspotHostRef = useRef<HotspotHostSession | null>(null);
  const gameStateRef = useRef(gameState);
  const activeGameIdRef = useRef(activeGameId);
  const hostPlayerRef = useRef<Player>(hostPlayer);
  const reactionTimerRef = useRef<number | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  gameStateRef.current = gameState;
  activeGameIdRef.current = activeGameId;
  hostPlayerRef.current = hostPlayer;
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

  useEffect(() => {
    if (inviteJoinCode) {
      setMultiplayerTab('online');
      setMultiplayerOpen(true);
    }
  }, [inviteJoinCode]);

  useEffect(() => () => {
    transportRef.current?.close();
    if (reactionTimerRef.current !== null) window.clearTimeout(reactionTimerRef.current);
    if (pingTimerRef.current !== null) window.clearInterval(pingTimerRef.current);
  }, []);

  const sendNetworkMessage = useCallback((message: NetMessage) => {
    transportRef.current?.send(message);
  }, []);
  const closeMultiplayer = useCallback(() => setMultiplayerOpen(false), []);

  const resetConnection = useCallback(() => {
    transportRef.current?.close();
    transportRef.current = null;
    hotspotHostRef.current = null;
    setConnectionPhase('idle');
    setTransportKind(null);
    setRoomCode('');
    setHotspotOfferCode('');
    setHotspotAnswerCode('');
    setConnectionError(null);
    setLatencyMs(null);
    setIsHost(false);
    setHostPlayer(1);
    setMode((current) => current === 'online' ? 'local' : current);
  }, []);

  const createPeerCallbacks = useCallback((host: boolean): PeerCallbacks => ({
    onWaiting: () => setConnectionPhase('waiting'),
    onConnected: () => {
      setConnectionPhase('connected');
      setConnectionError(null);
      setMode('online');
      setShowLobby(false);
      setMultiplayerOpen(false);
      if (host) {
        window.setTimeout(() => {
          transportRef.current?.send({
            type: 'SYNC_STATE',
            gameId: activeGameIdRef.current,
            hostPlayer: hostPlayerRef.current,
            state: gameStateRef.current,
          });
        }, 80);
      }
    },
    onMessage: (message) => {
      if (message.type === 'PING') {
        if (Number.isFinite(message.ts)) sendNetworkMessage({ type: 'PONG', ts: message.ts });
        return;
      }
      if (message.type === 'PONG') {
        if (Number.isFinite(message.ts)) setLatencyMs(Math.max(0, Date.now() - message.ts));
        return;
      }
      if (message.type === 'REACTION') {
        if (typeof message.emoji !== 'string' || typeof message.label !== 'string') return;
        setReactionToast(`${message.emoji} ${message.label}`);
        if (reactionTimerRef.current !== null) window.clearTimeout(reactionTimerRef.current);
        reactionTimerRef.current = window.setTimeout(() => setReactionToast(null), 2200);
        return;
      }
      if (message.type === 'SYNC_STATE') {
        if (host || !isGameId(message.gameId) || (message.hostPlayer !== 1 && message.hostPlayer !== 2) || !isAnyGameState(message.state)) return;
        const initial = createInitialGameState(message.gameId);
        if (initial.kind !== message.state.kind) return;
        setHostPlayer(message.hostPlayer);
        setActiveGameId(message.gameId);
        activeGameIdRef.current = message.gameId;
        gameStateRef.current = message.state;
        setGameState(message.state);
        setHistory([]);
        setCheckersSelected(null);
        setShowLobby(false);
        return;
      }
      if (message.type === 'SWITCH_GAME') {
        if (host || !isGameId(message.gameId)) return;
        const next = createInitialGameState(message.gameId);
        activeGameIdRef.current = message.gameId;
        gameStateRef.current = next;
        setActiveGameId(message.gameId);
        setGameState(next);
        setHistory([]);
        setCheckersSelected(null);
        return;
      }
      if (message.type === 'RESET_GAME') {
        if (host || !isGameId(message.gameId)) return;
        const next = createInitialGameState(message.gameId);
        activeGameIdRef.current = message.gameId;
        gameStateRef.current = next;
        setActiveGameId(message.gameId);
        setGameState(next);
        setHistory([]);
        setCheckersSelected(null);
        return;
      }
      if (message.type === 'SWAP_SIDES') {
        if (host || (message.hostPlayer !== 1 && message.hostPlayer !== 2)) return;
        setHostPlayer(message.hostPlayer);
        hostPlayerRef.current = message.hostPlayer;
        return;
      }
      if (message.type === 'REMATCH_REQUEST') {
        if (!host) return;
        setReactionToast('Your opponent wants a rematch');
        if (reactionTimerRef.current !== null) window.clearTimeout(reactionTimerRef.current);
        reactionTimerRef.current = window.setTimeout(() => setReactionToast(null), 2400);
        return;
      }
      if (message.type === 'MOVE') {
        if (!isGameId(message.gameId)) return;
        const remotePlayer: Player = host ? (hostPlayerRef.current === 1 ? 2 : 1) : hostPlayerRef.current;
        const current = gameStateRef.current;
        if (message.gameId !== activeGameIdRef.current || current.data.turn !== remotePlayer) return;
        try {
          const result = applyRemoteMove(current, message.payload);
          if (!result) return;
          gameStateRef.current = result.next;
          setHistory((historyItems) => [...historyItems, current]);
          setGameState(result.next);
          if (result.soundEvent === 'win') sound.win();
          else if (result.soundEvent === 'mill') sound.mill();
          else if (result.soundEvent === 'capture') sound.capture();
          else if (result.soundEvent === 'move') sound.move();
          else sound.place();
        } catch {
          // Malformed data from a stale or incompatible peer is ignored.
        }
      }
    },
    onDisconnected: (reason) => {
      setConnectionError(reason ?? 'The other player disconnected.');
      setConnectionPhase('error');
      setMode((current) => current === 'online' ? 'local' : current);
      setMultiplayerOpen(true);
    },
    onError: (message) => {
      setConnectionError(message);
      setConnectionPhase('error');
    },
  }), [sendNetworkMessage]);

  const openMultiplayer = (tab: 'online' | 'hotspot' = 'online', gameId?: GameId) => {
    if (gameId) {
      setActiveGameId(gameId);
      activeGameIdRef.current = gameId;
      const next = createInitialGameState(gameId);
      gameStateRef.current = next;
      setGameState(next);
      setHistory([]);
      setShowLobby(false);
    }
    setMultiplayerTab(tab);
    setMultiplayerOpen(true);
  };

  const createRoom = () => {
    resetConnection();
    const code = generateRoomCode();
    setConnectionError(null);
    setConnectionPhase('initializing');
    setTransportKind('online-room');
    setRoomCode(code);
    setIsHost(true);
    setHostPlayer(1);
    hostPlayerRef.current = 1;
    const transport = hostOnlineRoom(code, createPeerCallbacks(true));
    transportRef.current = transport;
  };

  const joinRoom = (code: string) => {
    resetConnection();
    const normalized = normalizeRoomCode(code);
    setConnectionError(null);
    setConnectionPhase('connecting');
    setTransportKind('online-room');
    setRoomCode(normalized);
    setIsHost(false);
    const transport = joinOnlineRoom(normalized, createPeerCallbacks(false));
    transportRef.current = transport;
  };

  const startHotspotHost = async () => {
    resetConnection();
    setConnectionError(null);
    setConnectionPhase('initializing');
    setTransportKind('hotspot-direct');
    setIsHost(true);
    setHostPlayer(1);
    hostPlayerRef.current = 1;
    try {
      const session = await createHotspotHostSession(createPeerCallbacks(true));
      hotspotHostRef.current = session;
      transportRef.current = session.transport;
      setHotspotOfferCode(session.offerCode);
      setConnectionPhase('waiting');
    } catch (error) {
      setConnectionPhase('error');
      setConnectionError(error instanceof Error ? error.message : 'Could not create a local connection.');
    }
  };

  const acceptHotspotAnswer = async (answerCode: string) => {
    try {
      if (!hotspotHostRef.current) throw new Error('Create a hotspot offer first.');
      setConnectionPhase('connecting');
      await hotspotHostRef.current.acceptAnswer(answerCode);
    } catch (error) {
      setConnectionPhase('error');
      setConnectionError(error instanceof Error ? error.message : 'Could not connect to that answer code.');
    }
  };

  const joinHotspot = async (offerCode: string) => {
    resetConnection();
    setConnectionError(null);
    setConnectionPhase('connecting');
    setTransportKind('hotspot-direct');
    setIsHost(false);
    try {
      const session = await joinHotspotOffer(offerCode, createPeerCallbacks(false));
      transportRef.current = session.transport;
      setHotspotAnswerCode(session.answerCode);
      setConnectionPhase('waiting');
    } catch (error) {
      setConnectionPhase('error');
      setConnectionError(error instanceof Error ? error.message : 'Could not read that offer code.');
    }
  };

  useEffect(() => {
    if (connectionPhase !== 'connected') return;
    pingTimerRef.current = window.setInterval(() => {
      sendNetworkMessage({ type: 'PING', ts: Date.now() });
    }, 3000);
    return () => {
      if (pingTimerRef.current !== null) window.clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    };
  }, [connectionPhase, sendNetworkMessage]);

  const resetGame = useCallback(
    (targetId: GameId = activeGameId, notifyPeer = true) => {
      if (aiTimerRef.current) {
        window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
      setAiThinking(false);
      setCheckersSelected(null);
      setHistory([]);
      const next = createInitialGameState(targetId);
      gameStateRef.current = next;
      setGameState(next);
      if (notifyPeer && mode === 'online' && isHost) {
        sendNetworkMessage({ type: 'RESET_GAME', gameId: targetId });
      }
    },
    [activeGameId, isHost, mode, sendNetworkMessage],
  );

  const handleSelectGame = (id: GameId) => {
    if (mode === 'online' && !isHost) return;
    setActiveGameId(id);
    activeGameIdRef.current = id;
    setShowLobby(false);
    resetGame(id, mode !== 'online');
    if (mode === 'online') sendNetworkMessage({ type: 'SWITCH_GAME', gameId: id });
  };

  const handleModeChange = (nextMode: GameMode) => {
    if (nextMode === 'online') {
      openMultiplayer('online');
      return;
    }
    if (nextMode === mode) return;
    if (connectionPhase === 'connected') resetConnection();
    setMode(nextMode);
    setShowLobby(false);
    resetGame(activeGameId);
  };

  const pushState = useCallback((next: AnyGameState, payload?: unknown) => {
    const previous = gameStateRef.current;
    gameStateRef.current = next;
    setHistory((items) => [...items, previous]);
    setGameState(next);
    if (payload !== undefined && mode === 'online') {
      sendNetworkMessage({ type: 'MOVE', gameId: activeGameIdRef.current, payload });
    }
  }, [mode, sendNetworkMessage]);

  const handleUndo = () => {
    if (history.length === 0 || aiThinking || mode === 'online') return;
    if (mode === 'ai') {
      // Pop back to the last state where it was Player 1's turn
      let idx = history.length - 1;
      while (idx > 0 && history[idx].data.turn !== 1) {
        idx--;
      }
      gameStateRef.current = history[idx];
      setGameState(history[idx]);
      setHistory(history.slice(0, idx));
    } else {
      const prev = history[history.length - 1];
      gameStateRef.current = prev;
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
    if (
      mode !== 'ai' ||
      winner !== null ||
      turn !== 2 ||
      connectionPhase === 'initializing' ||
      connectionPhase === 'waiting' ||
      connectionPhase === 'connecting'
    ) {
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
  }, [gameState, mode, difficulty, turn, winner, pushState, connectionPhase]);

  const onlineConnected = mode === 'online' && connectionPhase === 'connected';
  const localPlayer: Player = isHost ? hostPlayer : hostPlayer === 1 ? 2 : 1;
  const connectionInProgress = connectionPhase === 'initializing' || connectionPhase === 'waiting' || connectionPhase === 'connecting';
  const humanDisabled =
    (mode === 'ai' && (turn === 2 || aiThinking)) ||
    connectionInProgress ||
    (mode === 'online' && (connectionPhase !== 'connected' || turn !== localPlayer));

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
    pushState({ kind: 'morris', data: updated }, move);
  };

  const handleConnect4Drop = (col: number) => {
    if (gameState.kind !== 'connect4') return;
    const updated = applyConnect4Move(gameState.data, col);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else sound.place();
    pushState({ kind: 'connect4', data: updated }, col);
  };

  const handleReversiPlace = (row: number, col: number) => {
    if (gameState.kind !== 'reversi') return;
    const updated = applyReversiMove(gameState.data, row, col);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else sound.place();
    pushState({ kind: 'reversi', data: updated }, [row, col]);
  };

  const handleCheckersStep = (move: CheckersStepMove) => {
    if (gameState.kind !== 'checkers') return;
    const updated = applyCheckersStep(gameState.data, move);
    if (updated === gameState.data) return;
    setCheckersSelected(null);
    if (updated.winner !== null) sound.win();
    else if (move.captured) sound.capture();
    else sound.move();
    pushState({ kind: 'checkers', data: updated }, move);
  };

  const handleMancalaPit = (pitIdx: number) => {
    if (gameState.kind !== 'mancala') return;
    const updated = applyMancalaMove(gameState.data, pitIdx);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else if (updated.lastCaptured) sound.capture();
    else sound.place();
    pushState({ kind: 'mancala', data: updated }, pitIdx);
  };

  const handleGomokuPlace = (row: number, col: number) => {
    if (gameState.kind !== 'gomoku') return;
    const updated = applyGomokuMove(gameState.data, row, col);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else sound.place();
    pushState({ kind: 'gomoku', data: updated }, [row, col]);
  };

  const handleDotsEdge = (edge: EdgeMove) => {
    if (gameState.kind !== 'dots-and-boxes') return;
    const updated = applyDotsEdgeMove(gameState.data, edge);
    if (updated === gameState.data) return;
    if (updated.winner !== null) sound.win();
    else if (updated.lastClaimedBoxes.length > 0) sound.mill();
    else sound.place();
    pushState({ kind: 'dots-and-boxes', data: updated }, edge);
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

  const launchGame = (id: GameId, nextMode: 'ai' | 'local') => {
    setActiveGameId(id);
    activeGameIdRef.current = id;
    setMode(nextMode);
    setShowLobby(false);
    resetGame(id, false);
  };

  const playAgain = () => {
    if (mode === 'online' && !isHost) {
      sendNetworkMessage({ type: 'REMATCH_REQUEST' });
      return;
    }
    resetGame(activeGameId);
  };

  const swapSides = () => {
    if (!isHost) return;
    const nextPlayer: Player = hostPlayer === 1 ? 2 : 1;
    setHostPlayer(nextPlayer);
    hostPlayerRef.current = nextPlayer;
    sendNetworkMessage({ type: 'SWAP_SIDES', hostPlayer: nextPlayer });
  };

  return (
    <div
      className="h-screen w-screen flex overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: theme.bgApp, color: theme.textPrimary }}
    >
      <Sidebar
        activeGame={activeGameId}
        onSelectGame={handleSelectGame}
        onOpenLobby={() => { if (mode !== 'online') setShowLobby(true); }}
        onOpenMultiplayer={() => openMultiplayer('online')}
        isLobby={showLobby}
        gameSelectionDisabled={onlineConnected && !isHost}
        theme={theme}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {showLobby ? (
          <main className="flex-1 overflow-y-auto">
            <LobbyView theme={theme} onLaunchGame={launchGame} onOpenMultiplayer={openMultiplayer} onOpenMenu={() => setMobileMenuOpen(true)} />
          </main>
        ) : (
          <>
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
              canUndo={history.length > 0 && !aiThinking && mode !== 'online'}
              canReset={mode !== 'online' || isHost}
              onUndo={handleUndo}
              onReset={() => resetGame(activeGameId)}
              onOpenRules={() => setRulesOpen(true)}
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
              onOpenMultiplayer={() => openMultiplayer('online')}
              multiplayerConnected={onlineConnected}
            />

            <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col items-center gap-4">
              {onlineConnected && (
                <OnlineBar
                  theme={theme}
                  transportKind={transportKind ?? 'online-room'}
                  roomCode={roomCode}
                  isHost={isHost}
                  localPlayer={localPlayer}
                  latencyMs={latencyMs}
                  onSwapSides={swapSides}
                  onSendReaction={(emoji, label) => sendNetworkMessage({ type: 'REACTION', emoji, label })}
                  onDisconnect={resetConnection}
                />
              )}

              <PlayerBar
                turn={turn}
                winner={winner}
                mode={mode}
                aiThinking={aiThinking}
                localPlayer={localPlayer}
                theme={theme}
                p1Metric={p1Metric}
                p2Metric={p2Metric}
                statusHint={winner === null ? statusHint : undefined}
              />

              {winner !== null && (
                <GameOverBanner
                  winner={winner}
                  mode={mode}
                  localPlayer={localPlayer}
                  isHost={isHost}
                  theme={theme}
                  onPlayAgain={playAgain}
                  subtitle={gameOverSubtitle}
                />
              )}
              {winner !== null && winner !== 'draw' && <ConfettiBurst theme={theme} />}

              <div className="w-full flex-1 flex items-center justify-center py-1">
                {gameState.kind === 'morris' && (
                  <MorrisBoard state={gameState.data} theme={theme} disabled={humanDisabled} onSelectNode={handleMorrisSelect} onMove={handleMorrisMove} />
                )}
                {gameState.kind === 'connect4' && (
                  <Connect4Board state={gameState.data} theme={theme} disabled={humanDisabled} onDropColumn={handleConnect4Drop} />
                )}
                {gameState.kind === 'reversi' && (
                  <ReversiBoard state={gameState.data} theme={theme} disabled={humanDisabled} onPlace={handleReversiPlace} />
                )}
                {gameState.kind === 'checkers' && (
                  <CheckersBoard state={gameState.data} theme={theme} disabled={humanDisabled} selected={checkersSelected} onSelect={setCheckersSelected} onStep={handleCheckersStep} />
                )}
                {gameState.kind === 'mancala' && (
                  <MancalaBoard state={gameState.data} theme={theme} disabled={humanDisabled} onSelectPit={handleMancalaPit} />
                )}
                {gameState.kind === 'gomoku' && (
                  <GomokuBoard state={gameState.data} theme={theme} disabled={humanDisabled} onPlace={handleGomokuPlace} />
                )}
                {gameState.kind === 'dots-and-boxes' && (
                  <DotsBoxesBoard state={gameState.data} theme={theme} disabled={humanDisabled} onDrawEdge={handleDotsEdge} />
                )}
              </div>
            </main>
          </>
        )}
      </div>

      {rulesOpen && (
        <RulesModal
          game={activeMeta}
          theme={theme}
          onClose={() => setRulesOpen(false)}
        />
      )}

      {multiplayerOpen && (
        <MultiplayerModal
          theme={theme}
          initialTab={multiplayerTab}
          initialJoinCode={inviteJoinCode}
          phase={connectionPhase}
          transportKind={transportKind}
          roomCode={roomCode}
          hotspotOfferCode={hotspotOfferCode}
          hotspotAnswerCode={hotspotAnswerCode}
          errorMsg={connectionError}
          onClose={closeMultiplayer}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onStartHotspotHost={startHotspotHost}
          onAcceptHotspotAnswer={acceptHotspotAnswer}
          onJoinHotspotOffer={joinHotspot}
          onResetConnection={resetConnection}
        />
      )}

      {reactionToast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-2xl px-5 py-3 text-base font-semibold shadow-xl animate-float-up" style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }} aria-live="polite">
          {reactionToast}
        </div>
      )}
    </div>
  );
}

export default App;
