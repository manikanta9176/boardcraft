import { Player } from '../types/game';

type Base = { turn: Player; winner: Player | 'draw' | null };

export type SnakeState = Base & {
  gameId: 'snake';
  body: [number, number][];
  direction: 'up' | 'right' | 'down' | 'left';
  food: [number, number];
  score: number;
  best: number;
  status: 'playing' | 'lost';
};

export type RacerState = Base & {
  gameId: 'pocket-racer';
  lane: number;
  road: number[][];
  score: number;
  best: number;
  status: 'playing' | 'crashed';
};

export type DiceDuelState = Base & {
  gameId: 'dice-duel';
  scores: Record<Player, number>;
  turnScore: number;
  die: number | null;
  goal: number;
};

export const YAHTZEE_CATEGORIES = [
  'Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Three of a kind', 'Four of a kind',
  'Full house', 'Small straight', 'Large straight', 'Yahtzee', 'Chance',
] as const;
export type YahtzeeCategory = typeof YAHTZEE_CATEGORIES[number];
export type YahtzeeState = Base & {
  gameId: 'yahtzee';
  dice: number[];
  held: boolean[];
  rollsLeft: number;
  scores: Partial<Record<YahtzeeCategory, number>>;
  status: 'playing' | 'complete';
};

export type TambolaTicket = (number | null)[][];
export type TambolaState = Base & {
  gameId: 'tambola';
  tickets: Record<Player, TambolaTicket>;
  called: number[];
  scores: Record<Player, number>;
  rowClaims: Record<Player, boolean[]>;
  status: 'playing' | 'complete';
};

export type CarromDisc = {
  id: string;
  owner: Player | 'queen' | 'striker';
  x: number;
  y: number;
  vx: number;
  vy: number;
  pocketed: boolean;
};
export type CarromState = Base & {
  gameId: 'carrom';
  discs: CarromDisc[];
  scores: Record<Player, number>;
  shots: number;
  status: 'playing' | 'complete';
  lastShot: 'clean' | 'foul' | null;
};

export type PartyGameState = SnakeState | RacerState | DiceDuelState | YahtzeeState | TambolaState | CarromState;

const BEST_KEYS = {
  snake: 'playdeck:snake-best:v1',
  racer: 'playdeck:racer-best:v1',
} as const;
function readBest(key: string): number {
  try { return Math.max(0, Number(window.localStorage.getItem(key)) || 0); } catch { return 0; }
}
export function savePartyBest(game: 'snake' | 'pocket-racer', score: number): void {
  try { window.localStorage.setItem(BEST_KEYS[game === 'snake' ? 'snake' : 'racer'], String(Math.max(0, Math.floor(score)))); } catch { /* storage can be disabled */ }
}

function randomSnakeFood(body: [number, number][]): [number, number] {
  const empty: [number, number][] = [];
  for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) if (!body.some(([bx, by]) => bx === x && by === y)) empty.push([x, y]);
  return empty[Math.floor(Math.random() * empty.length)] ?? [0, 0];
}
export function createSnakeState(): SnakeState {
  const body: [number, number][] = [[8, 9], [7, 9], [6, 9]];
  return { gameId: 'snake', body, direction: 'right', food: randomSnakeFood(body), score: 0, best: readBest(BEST_KEYS.snake), status: 'playing', turn: 1, winner: null };
}
export function turnSnake(state: SnakeState, next: SnakeState['direction']): SnakeState {
  const reverse: Record<SnakeState['direction'], SnakeState['direction']> = { up: 'down', down: 'up', left: 'right', right: 'left' };
  if (state.status !== 'playing' || reverse[state.direction] === next) return state;
  return { ...state, direction: next };
}
export function stepSnake(state: SnakeState): SnakeState {
  if (state.status !== 'playing') return state;
  const [x, y] = state.body[0];
  const delta = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }[state.direction];
  const head: [number, number] = [x + delta[0], y + delta[1]];
  const ate = head[0] === state.food[0] && head[1] === state.food[1];
  const bodyToCheck = ate ? state.body : state.body.slice(0, -1);
  if (head[0] < 0 || head[0] >= 18 || head[1] < 0 || head[1] >= 18 || bodyToCheck.some(([bx, by]) => bx === head[0] && by === head[1])) {
    return { ...state, status: 'lost' };
  }
  const body = [head, ...(ate ? state.body : state.body.slice(0, -1))];
  const score = state.score + Number(ate);
  return { ...state, body, food: ate ? randomSnakeFood(body) : state.food, score, best: Math.max(state.best, score) };
}

function newRoadRow(): number[] {
  const row = [0, 0, 0];
  const obstacles = Math.random() < 0.78 ? 1 : 2;
  for (let i = 0; i < obstacles; i++) {
    const available = row.flatMap((value, lane) => value === 0 ? [lane] : []);
    row[available[Math.floor(Math.random() * available.length)]] = 1;
  }
  return row;
}
export function createRacerState(): RacerState {
  const key = BEST_KEYS.racer;
  return { gameId: 'pocket-racer', lane: 1, road: Array.from({ length: 8 }, () => [0, 0, 0]), score: 0, best: readBest(key), status: 'playing', turn: 1, winner: null };
}
export function moveRacer(state: RacerState, lane: number): RacerState {
  if (state.status !== 'playing' || lane < 0 || lane > 2 || Math.abs(state.lane - lane) > 1) return state;
  const road = [newRoadRow(), ...state.road.slice(0, -1)];
  if (road[road.length - 1][lane] === 1) return { ...state, lane, road, status: 'crashed' };
  const score = state.score + 1;
  return { ...state, lane, road, score, best: Math.max(state.best, score) };
}

export function createDiceDuelState(): DiceDuelState {
  return { gameId: 'dice-duel', turn: 1, winner: null, scores: { 1: 0, 2: 0 }, turnScore: 0, die: null, goal: 50 };
}
export function rollDiceDuel(state: DiceDuelState): DiceDuelState {
  if (state.winner !== null) return state;
  const die = 1 + Math.floor(Math.random() * 6);
  if (die === 1) return { ...state, die, turnScore: 0, turn: state.turn === 1 ? 2 : 1 };
  return { ...state, die, turnScore: state.turnScore + die };
}
export function bankDiceDuel(state: DiceDuelState): DiceDuelState {
  if (state.winner !== null || state.turnScore === 0) return state;
  const scores = { ...state.scores, [state.turn]: state.scores[state.turn] + state.turnScore };
  const winner = scores[state.turn] >= state.goal ? state.turn : null;
  return { ...state, scores, turnScore: 0, die: null, turn: winner ? state.turn : state.turn === 1 ? 2 : 1, winner };
}

export function createYahtzeeState(): YahtzeeState {
  return { gameId: 'yahtzee', turn: 1, winner: null, dice: [0, 0, 0, 0, 0], held: [false, false, false, false, false], rollsLeft: 3, scores: {}, status: 'playing' };
}
export function rollYahtzee(state: YahtzeeState): YahtzeeState {
  if (state.status !== 'playing' || state.rollsLeft <= 0) return state;
  return { ...state, dice: state.dice.map((value, index) => state.held[index] ? value : 1 + Math.floor(Math.random() * 6)), rollsLeft: state.rollsLeft - 1 };
}
export function toggleHeldDie(state: YahtzeeState, index: number): YahtzeeState {
  if (state.status !== 'playing' || state.dice[index] === 0 || state.rollsLeft === 3) return state;
  const held = [...state.held];
  held[index] = !held[index];
  return { ...state, held };
}
export function scoreYahtzeeCategory(state: YahtzeeState, category: YahtzeeCategory): YahtzeeState {
  if (state.status !== 'playing' || state.dice.some((die) => die === 0) || category in state.scores) return state;
  const dice = state.dice;
  const counts = Array(7).fill(0) as number[];
  dice.forEach((die) => counts[die]++);
  const sum = dice.reduce((total, die) => total + die, 0);
  const unique = new Set(dice);
  let score = 0;
  if (['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'].includes(category)) {
    const face = YAHTZEE_CATEGORIES.indexOf(category) + 1;
    score = counts[face] * face;
  } else if (category === 'Three of a kind' && counts.some((count) => count >= 3)) score = sum;
  else if (category === 'Four of a kind' && counts.some((count) => count >= 4)) score = sum;
  else if (category === 'Full house' && counts.includes(3) && counts.includes(2)) score = 25;
  else if (category === 'Small straight' && ['1234', '2345', '3456'].some((run) => [...run].every((face) => unique.has(Number(face))))) score = 30;
  else if (category === 'Large straight' && ['12345', '23456'].some((run) => [...run].every((face) => unique.has(Number(face))))) score = 40;
  else if (category === 'Yahtzee' && counts.includes(5)) score = 50;
  else if (category === 'Chance') score = sum;
  const scores = { ...state.scores, [category]: score };
  const status = YAHTZEE_CATEGORIES.every((item) => item in scores) ? 'complete' : 'playing';
  return { ...state, scores, dice: [0, 0, 0, 0, 0], held: [false, false, false, false, false], rollsLeft: 3, status };
}

function shuffle<T>(values: T[]): T[] {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}
function createTicket(): TambolaTicket {
  let rows: boolean[][];
  for (;;) {
    rows = Array.from({ length: 3 }, () => Array(9).fill(false));
    for (const row of rows) shuffle(Array.from({ length: 9 }, (_, index) => index)).slice(0, 5).forEach((col) => { row[col] = true; });
    if (Array.from({ length: 9 }, (_, col) => rows.some((row) => row[col])).every(Boolean)) break;
  }
  const ticket: TambolaTicket = rows.map(() => Array<number | null>(9).fill(null));
  for (let col = 0; col < 9; col++) {
    const low = col === 0 ? 1 : col * 10;
    const high = col === 8 ? 90 : col * 10 + 9;
    const numbers = shuffle(Array.from({ length: high - low + 1 }, (_, index) => low + index)).slice(0, rows.filter((row) => row[col]).length).sort((a, b) => a - b);
    const rowIndices = rows.flatMap((row, index) => row[col] ? [index] : []);
    rowIndices.forEach((row, index) => { ticket[row][col] = numbers[index]; });
  }
  return ticket;
}
export function createTambolaState(): TambolaState {
  return { gameId: 'tambola', turn: 1, winner: null, tickets: { 1: createTicket(), 2: createTicket() }, called: [], scores: { 1: 0, 2: 0 }, rowClaims: { 1: [false, false, false], 2: [false, false, false] }, status: 'playing' };
}
export function callTambolaNumber(state: TambolaState): TambolaState {
  if (state.status !== 'playing' || state.called.length >= 90) return state;
  const remaining = Array.from({ length: 90 }, (_, index) => index + 1).filter((number) => !state.called.includes(number));
  const number = remaining[Math.floor(Math.random() * remaining.length)];
  const called = [...state.called, number];
  const rowClaims = { 1: [...state.rowClaims[1]], 2: [...state.rowClaims[2]] };
  const scores = { ...state.scores };
  for (const player of [1, 2] as Player[]) for (let row = 0; row < 3; row++) {
    if (!rowClaims[player][row] && state.tickets[player][row].filter((cell) => cell !== null).every((cell) => cell === number || called.includes(cell!))) {
      rowClaims[player][row] = true;
      scores[player] += 1;
    }
  }
  const full = ([1, 2] as Player[]).filter((player) => state.tickets[player].flat().filter((cell) => cell !== null).every((cell) => called.includes(cell!)));
  const winner = full.length === 2 ? 'draw' : full.length === 1 ? full[0] : null;
  return { ...state, called, rowClaims, scores, winner, turn: state.turn === 1 ? 2 : 1, status: winner !== null ? 'complete' : called.length === 90 ? 'complete' : 'playing' };
}

function initialCarromDiscs(): CarromDisc[] {
  const discs: CarromDisc[] = [{ id: 'queen', owner: 'queen', x: 50, y: 50, vx: 0, vy: 0, pocketed: false }];
  for (let index = 0; index < 12; index++) {
    const angle = (index / 12) * Math.PI * 2;
    const radius = index < 6 ? 8 : 14;
    discs.push({ id: `coin-${index}`, owner: index % 2 === 0 ? 1 : 2, x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius, vx: 0, vy: 0, pocketed: false });
  }
  discs.push({ id: 'striker', owner: 'striker', x: 50, y: 88, vx: 0, vy: 0, pocketed: false });
  return discs;
}
export function createCarromState(): CarromState {
  return { gameId: 'carrom', turn: 1, winner: null, discs: initialCarromDiscs(), scores: { 1: 0, 2: 0 }, shots: 0, status: 'playing', lastShot: null };
}
export function shootCarrom(state: CarromState, dx: number, dy: number, power: number): CarromState {
  if (state.status !== 'playing' || power < 0.08) return state;
  const discs = state.discs.map((disc) => ({ ...disc, vx: 0, vy: 0 }));
  const striker = discs.find((disc) => disc.owner === 'striker')!;
  striker.pocketed = false;
  striker.x = 50;
  striker.y = state.turn === 1 ? 88 : 12;
  const norm = Math.hypot(dx, dy) || 1;
  const velocity = Math.min(4.2, Math.max(1.2, power * 0.12));
  striker.vx = (dx / norm) * velocity;
  striker.vy = (dy / norm) * velocity;
  const scores = { ...state.scores };
  const pocketed: (Player | 'queen')[] = [];
  let strikerFoul = false;
  const holes: [number, number][] = [[7, 7], [93, 7], [7, 93], [93, 93]];
  for (let frame = 0; frame < 420; frame++) {
    let moving = false;
    for (const disc of discs) {
      if (disc.pocketed || (Math.abs(disc.vx) + Math.abs(disc.vy) < 0.015)) continue;
      moving = true;
      disc.x += disc.vx;
      disc.y += disc.vy;
      disc.vx *= 0.982;
      disc.vy *= 0.982;
      if (disc.x < 7 || disc.x > 93) { disc.x = Math.min(93, Math.max(7, disc.x)); disc.vx *= -0.78; }
      if (disc.y < 7 || disc.y > 93) { disc.y = Math.min(93, Math.max(7, disc.y)); disc.vy *= -0.78; }
      const hole = holes.some(([hx, hy]) => Math.hypot(disc.x - hx, disc.y - hy) < 5.5);
      if (hole) {
        disc.pocketed = true;
        disc.vx = disc.vy = 0;
        if (disc.owner === 'striker') strikerFoul = true;
        else pocketed.push(disc.owner);
      }
    }
    for (let a = 0; a < discs.length; a++) for (let b = a + 1; b < discs.length; b++) {
      const first = discs[a]; const second = discs[b];
      if (first.pocketed || second.pocketed || (first.owner !== 'striker' && second.owner !== 'striker' && first.vx === 0 && first.vy === 0 && second.vx === 0 && second.vy === 0)) continue;
      const dx = second.x - first.x; const dy = second.y - first.y; const distance = Math.hypot(dx, dy) || 0.001;
      const minimum = first.owner === 'striker' || second.owner === 'striker' ? 4.6 : 4;
      if (distance >= minimum) continue;
      const nx = dx / distance; const ny = dy / distance;
      const overlap = minimum - distance;
      first.x -= nx * overlap / 2; first.y -= ny * overlap / 2;
      second.x += nx * overlap / 2; second.y += ny * overlap / 2;
      const relative = (second.vx - first.vx) * nx + (second.vy - first.vy) * ny;
      if (relative < 0) {
        const impulse = -(1.45 * relative) / 2;
        first.vx -= impulse * nx; first.vy -= impulse * ny;
        second.vx += impulse * nx; second.vy += impulse * ny;
        moving = true;
      }
    }
    if (!moving) break;
  }
  discs.forEach((disc) => {
    if (disc.pocketed && disc.owner === state.turn) scores[state.turn]++;
    if (disc.pocketed && disc.owner === 'queen') scores[state.turn] += 3;
    disc.vx = 0; disc.vy = 0;
  });
  const allCoinsGone = discs.filter((disc) => disc.owner !== 'striker').every((disc) => disc.pocketed);
  const other: Player = state.turn === 1 ? 2 : 1;
  const keepTurn = !strikerFoul && (pocketed.includes(state.turn) || pocketed.includes('queen'));
  const nextTurn = keepTurn ? state.turn : other;
  const nextStriker = discs.find((disc) => disc.owner === 'striker')!;
  nextStriker.pocketed = false; nextStriker.x = 50; nextStriker.y = nextTurn === 1 ? 88 : 12;
  const winner: Player | 'draw' | null = allCoinsGone ? scores[1] === scores[2] ? 'draw' : scores[1] > scores[2] ? 1 : 2 : null;
  return { ...state, discs, scores, turn: nextTurn, winner, shots: state.shots + 1, status: allCoinsGone ? 'complete' : 'playing', lastShot: strikerFoul ? 'foul' : 'clean' };
}
