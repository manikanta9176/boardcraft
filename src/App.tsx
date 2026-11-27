import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameHeader } from './components/GameHeader';
import { GameOverBanner } from './components/GameOverBanner';
import { ConfettiBurst } from './components/ConfettiBurst';
import { LobbyView } from './components/LobbyView';
import { NotFoundView } from './components/NotFoundView';
import { OnlineBar } from './components/OnlineBar';
import { PlayerBar } from './components/PlayerBar';
import type { PlayerMetric } from './components/PlayerBar';
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
import { MORRIS_TOPOLOGIES, MorrisVariantId } from './games/morris/topologies';
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
import { ActiveTransport, PeerCallbacks, hostNearbyGame, hostOnlineRoom, joinNearbyGame, joinOnlineRoom } from './multiplayer/onlinePeer';
import { HotspotHostSession, createHotspotHostSession, joinHotspotOffer } from './multiplayer/hotspotDirect';
import { NearbyGameListing, createNearbyHostCredentials, publishNearbyGame, removeNearbyGame } from './multiplayer/nearbyDiscovery';
import {
  ConnectionPhase,
  NetMessage,
  TransportKind,
  generateRoomCode,
  normalizeRoomCode,
} from './multiplayer/types';
import { loadMostRecentSavedGame, loadPreferences, loadSavedMatch, removeSavedMatch, saveMatch, savePreferences, SavedMatch } from './utils/persistence';
import { parseBoardCraftRoute, writeBoardCraftRoute } from './utils/routing';

const MultiplayerModal = lazy(() => import('./components/MultiplayerModal').then((module) => ({ default: module.MultiplayerModal })));

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
    !!candidate.data && typeof candidate.data === 'object' && !Array.isArray(candidate.data) &&
    (candidate.data.turn === 1 || candidate.data.turn === 2) &&
    (candidate.data.winner === null || candidate.data.winner === 1 || candidate.data.winner === 2 || candidate.data.winner === 'draw')
  );
}

function isCell(value: unknown): boolean {
  return value === null || value === 1 || value === 2;
}

function isGrid(value: unknown, rows: number, columns: number, validCell: (cell: unknown) => boolean = isCell): boolean {
  return Array.isArray(value) && value.length === rows && value.every((row) =>
    Array.isArray(row) && row.length === columns && row.every(validCell),
  );
}

function isValidStateForGame(gameId: GameId, value: unknown): value is AnyGameState {
  if (!isAnyGameState(value)) return false;
  const initial = createInitialGameState(gameId);
  if (value.kind !== initial.kind) return false;

  switch (value.kind) {
    case 'morris':
      return value.data.variant === gameId &&
        Array.isArray(value.data.board) && value.data.board.length === MORRIS_TOPOLOGIES[gameId as MorrisVariantId].nodes.length &&
        value.data.board.every(isCell) &&
        ['placement', 'movement', 'capture', 'gameover'].includes(value.data.phase) &&
        typeof value.data.statusText === 'string' &&
        !!value.data.toPlace && !!value.data.captured &&
        [1, 2].every((player) => Number.isInteger(value.data.toPlace[player as Player]) && value.data.toPlace[player as Player] >= 0);
    case 'connect4':
      return isGrid(value.data.board, 6, 7) && (value.data.winningCells === null || Array.isArray(value.data.winningCells));
    case 'reversi':
      return isGrid(value.data.board, 8, 8) && Array.isArray(value.data.flippedCells) && typeof value.data.passedTurn === 'boolean';
    case 'checkers':
      return isGrid(value.data.board, 8, 8, (cell) => cell === null || (!!cell && typeof cell === 'object' &&
        ((cell as { player?: unknown }).player === 1 || (cell as { player?: unknown }).player === 2) &&
        typeof (cell as { king?: unknown }).king === 'boolean'));
    case 'mancala':
      return Array.isArray(value.data.pits) && value.data.pits.length === 14 && value.data.pits.every((pit) => Number.isInteger(pit) && pit >= 0) &&
        typeof value.data.extraTurn === 'boolean' && typeof value.data.lastCaptured === 'boolean';
    case 'gomoku':
      return isGrid(value.data.board, 15, 15) && Number.isInteger(value.data.moveCount) && value.data.moveCount >= 0;
    case 'dots-and-boxes':
      return isGrid(value.data.hEdges, 5, 4) && isGrid(value.data.vEdges, 4, 5) && isGrid(value.data.boxes, 4, 4) &&
        !!value.data.scores &&
        Number.isInteger(value.data.scores[1]) && Number.isInteger(value.data.scores[2]);
  }
}

function restoreSavedMatch(gameId: GameId): (SavedMatch & { state: AnyGameState; history: AnyGameState[] }) | null {
  const saved = loadSavedMatch(gameId);
  if (!saved) return null;
  const validHistory = saved.history.length <= 80 && saved.history.every((state) => isValidStateForGame(gameId, state));
  if (!validHistory || !isValidStateForGame(gameId, saved.state)) {
    removeSavedMatch(gameId);
    return null;
  }
  return { ...saved, state: saved.state, history: saved.history as AnyGameState[] };
}

function getBootState() {
  const route = parseBoardCraftRoute(window.location.pathname, window.location.search);
  const preferences = loadPreferences();
  const activeGameId = route.screen === 'game'
    ? route.gameId
    : preferences.lastGameId ?? 'nine-mens-morris';
  const savedMatch = restoreSavedMatch(activeGameId);
  const resumeCandidateId = preferences.lastGameId ?? loadMostRecentSavedGame();
  const resumeCandidate = resumeCandidateId
    ? resumeCandidateId === activeGameId
      ? savedMatch
      : restoreSavedMatch(resumeCandidateId)
    : null;
  const resumeGameId = resumeCandidate ? resumeCandidateId : savedMatch ? activeGameId : null;
  return { route, preferences, activeGameId, savedMatch, resumeGameId };
}

export function App() {
  const [boot] = useState(getBootState);
  const initialMode = boot.route.screen === 'game' && boot.route.mode
    ? boot.route.mode
    : boot.savedMatch?.mode ?? 'ai';
  const [activeGameId, setActiveGameId] = useState<GameId>(boot.activeGameId);
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>(boot.savedMatch?.difficulty ?? boot.preferences.difficulty);
  const [themeId, setThemeId] = useState<ThemeId>(boot.preferences.themeId);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(boot.preferences.soundEnabled);

  const [gameState, setGameState] = useState<AnyGameState>(boot.savedMatch?.state ?? createInitialGameState(boot.activeGameId));
  const [history, setHistory] = useState<AnyGameState[]>(boot.savedMatch?.history ?? []);
  const [checkersSelected, setCheckersSelected] = useState<[number, number] | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [showLobby, setShowLobby] = useState(boot.route.screen !== 'game');
  const [notFoundPath, setNotFoundPath] = useState(boot.route.screen === 'not-found' ? boot.route.path : null);
  const [resumeGameId, setResumeGameId] = useState<GameId | null>(boot.resumeGameId);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [multiplayerOpen, setMultiplayerOpen] = useState(false);
  const [multiplayerTab, setMultiplayerTab] = useState<'online' | 'hotspot'>('online');
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('idle');
  const [transportKind, setTransportKind] = useState<TransportKind | null>(null);
  const [roomCode, setRoomCode] = useState(boot.route.roomCode ?? '');
  const [hotspotOfferCode, setHotspotOfferCode] = useState('');
  const [hotspotAnswerCode, setHotspotAnswerCode] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [hostPlayer, setHostPlayer] = useState<Player>(1);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [reactionToast, setReactionToast] = useState<string | null>(null);
  const [inviteJoinCode, setInviteJoinCode] = useState(boot.route.roomCode ?? '');

  const aiTimerRef = useRef<number | null>(null);
  const transportRef = useRef<ActiveTransport | null>(null);
  const hotspotHostRef = useRef<HotspotHostSession | null>(null);
  const nearbyHostRef = useRef<{ hostId: string; hostToken: string; gameId: GameId; active: boolean; heartbeat: number | null } | null>(null);
  const roomCodeRef = useRef(boot.route.roomCode ?? '');
  const gameStateRef = useRef(gameState);
  const activeGameIdRef = useRef(activeGameId);
  const hostPlayerRef = useRef<Player>(hostPlayer);
  const reactionTimerRef = useRef<number | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  gameStateRef.current = gameState;
  activeGameIdRef.current = activeGameId;
  hostPlayerRef.current = hostPlayer;
  const theme = THEMES[themeId];
  const toggleTheme = useCallback(() => {
    setThemeId((current) => current === 'paper' ? 'stackdome' : 'paper');
  }, []);
  const activeMeta = useMemo(
    () => GAMES.find((g) => g.id === activeGameId) ?? GAMES[0],
    [activeGameId],
  );

  useEffect(() => {
    document.title = notFoundPath
      ? 'Game not found — BoardCraft'
      : showLobby
        ? 'BoardCraft — Classic Strategy, Morris & Online Multiplayer'
        : `${activeMeta.name} — BoardCraft`;
  }, [activeMeta.name, notFoundPath, showLobby]);

  useEffect(() => {
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', theme.bgApp);
  }, [theme.bgApp]);

  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!savePreferences({ themeId, soundEnabled, difficulty, lastGameId: resumeGameId })) {
      setStorageUnavailable(true);
    } else setStorageUnavailable(false);
  }, [themeId, soundEnabled, difficulty, resumeGameId]);

  useEffect(() => {
    if (showLobby || mode === 'online') return;
    if (history.length === 0) {
      removeSavedMatch(activeGameId);
      setResumeGameId((current) => current === activeGameId ? loadMostRecentSavedGame() : current);
      return;
    }
    const saved = saveMatch(activeGameId, {
      state: gameState,
      history,
      mode,
      difficulty,
    });
    if (saved) {
      setResumeGameId(activeGameId);
      setStorageUnavailable(false);
    }
    else setStorageUnavailable(true);
  }, [activeGameId, difficulty, gameState, history, mode, showLobby]);

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
  const stopNearbyPresence = useCallback(() => {
    const session = nearbyHostRef.current;
    if (!session) return;
    session.active = false;
    if (session.heartbeat !== null) window.clearInterval(session.heartbeat);
    nearbyHostRef.current = null;
    void removeNearbyGame(session.hostId, session.hostToken);
  }, []);
  useEffect(() => () => stopNearbyPresence(), [stopNearbyPresence]);
  const closeRules = useCallback(() => setRulesOpen(false), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const openLibrary = useCallback(() => {
    if (mode === 'online') return;
    setShowLobby(true);
    setNotFoundPath(null);
    writeBoardCraftRoute({ screen: 'library' });
  }, [mode]);

  const resetConnection = useCallback(() => {
    stopNearbyPresence();
    transportRef.current?.close();
    transportRef.current = null;
    hotspotHostRef.current = null;
    setConnectionPhase('idle');
    setTransportKind(null);
    setRoomCode('');
    roomCodeRef.current = '';
    setHotspotOfferCode('');
    setHotspotAnswerCode('');
    setConnectionError(null);
    setLatencyMs(null);
    setIsHost(false);
    setHostPlayer(1);
    setMode((current) => current === 'online' ? 'local' : current);
  }, [stopNearbyPresence]);

  const closeMultiplayer = useCallback(() => {
    if (connectionPhase !== 'connected' && (transportKind === 'nearby-discovery' || transportKind === 'hotspot-direct')) {
      resetConnection();
    }
    setMultiplayerOpen(false);
  }, [connectionPhase, resetConnection, transportKind]);

  const createPeerCallbacks = useCallback((host: boolean, afterWaiting?: () => void): PeerCallbacks => ({
    onWaiting: () => {
      setConnectionPhase('waiting');
      afterWaiting?.();
    },
    onConnected: () => {
      if (host) stopNearbyPresence();
      setConnectionPhase('connected');
      setConnectionError(null);
      setMode('online');
      setShowLobby(false);
      setNotFoundPath(null);
      writeBoardCraftRoute({ screen: 'game', gameId: activeGameIdRef.current, roomCode: roomCodeRef.current || undefined }, true);
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
        setNotFoundPath(null);
        writeBoardCraftRoute({ screen: 'game', gameId: message.gameId, roomCode: roomCodeRef.current || undefined }, true);
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
        setNotFoundPath(null);
        writeBoardCraftRoute({ screen: 'game', gameId: message.gameId, roomCode: roomCodeRef.current || undefined }, true);
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
        setNotFoundPath(null);
        writeBoardCraftRoute({ screen: 'game', gameId: message.gameId, roomCode: roomCodeRef.current || undefined }, true);
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
      stopNearbyPresence();
      setConnectionError(reason ?? 'The other player disconnected.');
      setConnectionPhase('error');
      setRoomCode('');
      roomCodeRef.current = '';
      setMode((current) => current === 'online' ? 'local' : current);
      writeBoardCraftRoute({ screen: 'game', gameId: activeGameIdRef.current, mode: 'local' }, true);
      setMultiplayerOpen(true);
    },
    onError: (message) => {
      stopNearbyPresence();
      setConnectionError(message);
      setConnectionPhase('error');
    },
  }), [sendNetworkMessage, stopNearbyPresence]);

  const openMultiplayer = (tab: 'online' | 'hotspot' = 'online', gameId?: GameId) => {
    if (gameId) {
      setActiveGameId(gameId);
      activeGameIdRef.current = gameId;
      const next = createInitialGameState(gameId);
      gameStateRef.current = next;
      setGameState(next);
      setHistory([]);
      setShowLobby(false);
      setNotFoundPath(null);
      writeBoardCraftRoute({ screen: 'game', gameId, mode: mode === 'local' ? 'local' : 'ai' });
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
    roomCodeRef.current = code;
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
    roomCodeRef.current = normalized;
    setIsHost(false);
    const transport = joinOnlineRoom(normalized, createPeerCallbacks(false));
    transportRef.current = transport;
  };

  const startNearbyHost = (targetGameId: GameId) => {
    resetConnection();
    const { hostId, hostToken } = createNearbyHostCredentials();
    const initial = createInitialGameState(targetGameId);
    activeGameIdRef.current = targetGameId;
    gameStateRef.current = initial;
    setActiveGameId(targetGameId);
    setGameState(initial);
    setHistory([]);
    setCheckersSelected(null);
    setShowLobby(false);
    setNotFoundPath(null);
    setMode('local');
    writeBoardCraftRoute({ screen: 'game', gameId: targetGameId, mode: 'local' }, true);

    setConnectionError(null);
    setConnectionPhase('initializing');
    setTransportKind('nearby-discovery');
    setRoomCode('');
    roomCodeRef.current = '';
    setIsHost(true);
    setHostPlayer(1);
    hostPlayerRef.current = 1;

    const session = { hostId, hostToken, gameId: targetGameId, active: true, heartbeat: null as number | null };
    nearbyHostRef.current = session;
    const advertise = async () => {
      if (!session.active) return;
      try {
        await publishNearbyGame(hostId, hostToken, targetGameId);
        if (!session.active) {
          void removeNearbyGame(hostId, hostToken);
          return;
        }
        if (session.heartbeat === null) {
          session.heartbeat = window.setInterval(() => {
            void publishNearbyGame(hostId, hostToken, targetGameId).catch((error: unknown) => {
              if (!session.active) return;
              setConnectionError(error instanceof Error ? error.message : 'Nearby discovery was interrupted.');
              setConnectionPhase('error');
              stopNearbyPresence();
              transportRef.current?.close();
            });
          }, 15_000);
        }
      } catch (error) {
        if (!session.active) return;
        setConnectionError(error instanceof Error ? error.message : 'Could not start nearby discovery.');
        setConnectionPhase('error');
        stopNearbyPresence();
        transportRef.current?.close();
      }
    };

    transportRef.current = hostNearbyGame(hostId, createPeerCallbacks(true, () => void advertise()));
  };

  const joinNearby = (room: NearbyGameListing) => {
    resetConnection();
    const initial = createInitialGameState(room.gameId);
    activeGameIdRef.current = room.gameId;
    gameStateRef.current = initial;
    setActiveGameId(room.gameId);
    setGameState(initial);
    setHistory([]);
    setCheckersSelected(null);
    setNotFoundPath(null);
    setShowLobby(false);
    setMode('local');

    setConnectionError(null);
    setConnectionPhase('connecting');
    setTransportKind('nearby-discovery');
    setRoomCode('');
    roomCodeRef.current = '';
    setIsHost(false);
    setHostPlayer(1);
    hostPlayerRef.current = 1;
    transportRef.current = joinNearbyGame(room.peerId, createPeerCallbacks(false));
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

  const handleBrowserNavigation = useCallback(() => {
    const route = parseBoardCraftRoute(window.location.pathname, window.location.search);
    const nextRoomCode = route.roomCode ?? '';
    setInviteJoinCode(nextRoomCode);
    setRoomCode(nextRoomCode);
    roomCodeRef.current = nextRoomCode;
    setRulesOpen(false);
    setMobileMenuOpen(false);

    if (route.screen === 'game') {
      if (mode === 'online') resetConnection();
      const saved = restoreSavedMatch(route.gameId);
      const nextState = saved?.state ?? createInitialGameState(route.gameId);
      const nextMode = route.mode ?? saved?.mode ?? (mode === 'online' ? 'local' : 'ai');
      setActiveGameId(route.gameId);
      activeGameIdRef.current = route.gameId;
      setMode(nextMode);
      setDifficulty(saved?.difficulty ?? loadPreferences().difficulty);
      setGameState(nextState);
      gameStateRef.current = nextState;
      setHistory(saved?.history ?? []);
      setResumeGameId((current) => saved ? route.gameId : current === route.gameId ? null : current);
      setCheckersSelected(null);
      setNotFoundPath(null);
      setShowLobby(false);
      setMultiplayerOpen(Boolean(route.roomCode));
      if (route.roomCode) setMultiplayerTab('online');
      return;
    }

    if (mode === 'online') resetConnection();
    setShowLobby(true);
    setNotFoundPath(route.screen === 'not-found' ? route.path : null);
    setMultiplayerOpen(false);
  }, [mode, resetConnection]);

  useEffect(() => {
    window.addEventListener('popstate', handleBrowserNavigation);
    return () => window.removeEventListener('popstate', handleBrowserNavigation);
  }, [handleBrowserNavigation]);

  const handleSelectGame = (id: GameId) => {
    if (mode === 'online' && !isHost) return;
    const saved = mode === 'online' ? null : restoreSavedMatch(id);
    const nextMode = saved?.mode ?? mode;
    setActiveGameId(id);
    activeGameIdRef.current = id;
    if (saved) {
      if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
      setAiThinking(false);
      setMode(saved.mode);
      setDifficulty(saved.difficulty);
      setGameState(saved.state);
      gameStateRef.current = saved.state;
      setHistory(saved.history);
      setResumeGameId(id);
      setCheckersSelected(null);
    }
    setShowLobby(false);
    setNotFoundPath(null);
    writeBoardCraftRoute({
      screen: 'game',
      gameId: id,
      mode: nextMode === 'ai' || nextMode === 'local' ? nextMode : undefined,
      roomCode: mode === 'online' ? roomCodeRef.current || undefined : undefined,
    });
    if (!saved) resetGame(id, mode !== 'online');
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
    setNotFoundPath(null);
    writeBoardCraftRoute({ screen: 'game', gameId: activeGameId, mode: nextMode });
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
          p1Metric: { value: String(on1), label: 'on board', detail: `Reserve ${s.toPlace[1]}` } satisfies PlayerMetric,
          p2Metric: { value: String(on2), label: 'on board', detail: `Reserve ${s.toPlace[2]}` } satisfies PlayerMetric,
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
          p1Metric: { value: String(c1), label: 'discs', detail: 'played' } satisfies PlayerMetric,
          p2Metric: { value: String(c2), label: 'discs', detail: 'played' } satisfies PlayerMetric,
          statusHint: s.winner === null ? 'Drop a disc into any open column' : undefined,
          gameOverSubtitle: s.winner === 'draw' ? 'Board is full' : 'Aligned 4 discs in a row',
        };
      }
      case 'reversi': {
        const s = gameState.data;
        const counts = countReversiDiscs(s.board);
        return {
          p1Metric: { value: String(counts[1]), label: 'discs' } satisfies PlayerMetric,
          p2Metric: { value: String(counts[2]), label: 'discs' } satisfies PlayerMetric,
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
          p1Metric: { value: String(counts[1]), label: 'pieces', detail: `${counts.kings1} kings` } satisfies PlayerMetric,
          p2Metric: { value: String(counts[2]), label: 'pieces', detail: `${counts.kings2} kings` } satisfies PlayerMetric,
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
          p1Metric: { value: String(s.pits[6]), label: 'seeds', detail: 'in store' } satisfies PlayerMetric,
          p2Metric: { value: String(s.pits[13]), label: 'seeds', detail: 'in store' } satisfies PlayerMetric,
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
          p1Metric: { value: String(Math.ceil(s.moveCount / 2)), label: 'moves', detail: 'played' } satisfies PlayerMetric,
          p2Metric: { value: String(Math.floor(s.moveCount / 2)), label: 'moves', detail: 'played' } satisfies PlayerMetric,
          statusHint: s.winner === null ? 'Connect 5 stones in a row to win' : undefined,
          gameOverSubtitle: s.winner === 'draw' ? 'All 225 intersections filled' : '5 stones aligned',
        };
      }
      case 'dots-and-boxes': {
        const s = gameState.data;
        return {
          p1Metric: { value: String(s.scores[1]), label: 'boxes' } satisfies PlayerMetric,
          p2Metric: { value: String(s.scores[2]), label: 'boxes' } satisfies PlayerMetric,
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
    setNotFoundPath(null);
    writeBoardCraftRoute({ screen: 'game', gameId: id, mode: nextMode });
    resetGame(id, false);
  };

  const resumeLastGame = () => {
    if (!resumeGameId) return;
    const saved = restoreSavedMatch(resumeGameId);
    if (!saved) {
      setResumeGameId(null);
      return;
    }
    setActiveGameId(resumeGameId);
    activeGameIdRef.current = resumeGameId;
    setMode(saved.mode);
    setDifficulty(saved.difficulty);
    setGameState(saved.state);
    gameStateRef.current = saved.state;
    setHistory(saved.history);
    setCheckersSelected(null);
    setShowLobby(false);
    setNotFoundPath(null);
    writeBoardCraftRoute({ screen: 'game', gameId: resumeGameId, mode: saved.mode });
  };

  const playAgain = () => {
    if (mode === 'online' && !isHost) {
      sendNetworkMessage({ type: 'REMATCH_REQUEST' });
      return;
    }
    resetGame(activeGameId);
  };

  const disconnectOnline = () => {
    resetConnection();
    setMode('local');
    writeBoardCraftRoute({ screen: 'game', gameId: activeGameId, mode: 'local' }, true);
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
      className="app-shell flex w-full overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: theme.bgApp, color: theme.textPrimary }}
    >
      <Sidebar
        activeGame={activeGameId}
        onSelectGame={handleSelectGame}
        onOpenLobby={openLibrary}
        onOpenMultiplayer={() => openMultiplayer('online')}
        isLobby={showLobby}
        gameSelectionDisabled={onlineConnected && !isHost}
        theme={theme}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={closeMobileMenu}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {showLobby ? (
          <main className="flex-1 overflow-y-auto">
            {notFoundPath ? (
              <NotFoundView path={notFoundPath} theme={theme} onGoHome={openLibrary} />
            ) : (
              <LobbyView
                theme={theme}
                onLaunchGame={launchGame}
                onOpenMultiplayer={openMultiplayer}
                onOpenMenu={() => setMobileMenuOpen(true)}
                onToggleTheme={toggleTheme}
                resumeGameId={resumeGameId}
                onResumeGame={resumeLastGame}
                storageUnavailable={storageUnavailable}
              />
            )}
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
              onToggleTheme={toggleTheme}
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

            <main className="match-main flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col items-center gap-4">
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
                  onDisconnect={disconnectOnline}
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
          onClose={closeRules}
        />
      )}

      {multiplayerOpen && (
        <Suspense fallback={null}>
          <MultiplayerModal
            theme={theme}
            initialTab={multiplayerTab}
            initialJoinCode={inviteJoinCode}
            gameId={activeGameId}
            phase={connectionPhase}
            transportKind={transportKind}
            nearbyHostActive={transportKind === 'nearby-discovery' && connectionPhase === 'waiting' && isHost}
            roomCode={roomCode}
            hotspotOfferCode={hotspotOfferCode}
            hotspotAnswerCode={hotspotAnswerCode}
            errorMsg={connectionError}
            onClose={closeMultiplayer}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onStartNearbyHost={startNearbyHost}
            onJoinNearbyGame={joinNearby}
            onStartHotspotHost={startHotspotHost}
            onAcceptHotspotAnswer={acceptHotspotAnswer}
            onJoinHotspotOffer={joinHotspot}
            onResetConnection={resetConnection}
          />
        </Suspense>
      )}

      {reactionToast && (
        <div className="safe-toast fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-2xl px-5 py-3 text-base font-semibold shadow-xl animate-float-up" style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }} aria-live="polite">
          {reactionToast}
        </div>
      )}
    </div>
  );
}

export default App;
