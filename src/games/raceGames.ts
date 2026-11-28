import { Player } from '../types/game';

export type RaceGameId = 'ludo' | 'ashta-chamma';
export type RaceState = {
  gameId: RaceGameId;
  turn: Player;
  winner: Player | null;
  die: number | null;
  tokens: Record<Player, number[]>;
  trackLength: number;
  lastCapture: boolean;
};

export function createRaceState(gameId: RaceGameId): RaceState {
  return {
    gameId, turn: 1, winner: null, die: null,
    tokens: { 1: [-1, -1, -1, -1], 2: [-1, -1, -1, -1] },
    trackLength: gameId === 'ludo' ? 52 : 28,
    lastCapture: false,
  };
}

export function rollRaceDie(state: RaceState): RaceState {
  if (state.winner !== null || state.die !== null) return state;
  const die = state.gameId === 'ludo'
    ? 1 + Math.floor(Math.random() * 6)
    : (() => {
      const shells = Math.floor(Math.random() * 5);
      return shells === 0 || shells === 4 ? 8 : shells;
    })();
  return { ...state, die, lastCapture: false };
}

export function getMovableRaceTokens(state: RaceState): number[] {
  if (state.winner !== null || state.die === null) return [];
  const die = state.die;
  const finish = state.trackLength + 5;
  return state.tokens[state.turn].flatMap((progress, index) => {
    if (progress === -1) return state.gameId === 'ludo' ? die === 6 ? [index] : [] : die === 4 || die === 8 ? [index] : [];
    return progress + die <= finish ? [index] : [];
  });
}

export function raceTrackIndex(state: Pick<RaceState, 'gameId' | 'trackLength'>, player: Player, progress: number): number {
  const start = player === 1 ? 0 : Math.floor(state.trackLength / 2);
  return (start + progress) % state.trackLength;
}

export function moveRaceToken(state: RaceState, tokenIndex: number): RaceState {
  const die = state.die;
  if (die === null || !getMovableRaceTokens(state).includes(tokenIndex)) return state;
  const tokens = { 1: [...state.tokens[1]], 2: [...state.tokens[2]] };
  const oldProgress = tokens[state.turn][tokenIndex];
  const progress = oldProgress === -1 ? 0 : oldProgress + die;
  tokens[state.turn][tokenIndex] = progress;
  let captured = false;
  const finish = state.trackLength + 5;
  if (progress < state.trackLength) {
    const landing = raceTrackIndex(state, state.turn, progress);
    const opponent: Player = state.turn === 1 ? 2 : 1;
    const safe = landing % (state.gameId === 'ludo' ? 13 : 7) === 0;
    if (!safe) tokens[opponent] = tokens[opponent].map((other) => {
      if (other >= 0 && other < state.trackLength && raceTrackIndex(state, opponent, other) === landing) {
        captured = true;
        return -1;
      }
      return other;
    });
  }
  const winner = tokens[state.turn].every((value) => value === finish) ? state.turn : null;
  const bonus = die === (state.gameId === 'ludo' ? 6 : 8) || captured || winner !== null;
  return { ...state, tokens, turn: bonus ? state.turn : state.turn === 1 ? 2 : 1, die: null, winner, lastCapture: captured };
}

export function skipRaceTurn(state: RaceState): RaceState {
  if (state.die === null || getMovableRaceTokens(state).length > 0) return state;
  return { ...state, turn: state.turn === 1 ? 2 : 1, die: null, lastCapture: false };
}
