import { GameId } from '../types/game';

export type ArcadeGameId = '2048' | 'minesweeper' | 'word-guess';
type ArcadeBase = { turn: 1; winner: null };

export type Tile2048State = ArcadeBase & {
  gameId: '2048';
  board: number[][];
  score: number;
  best: number;
  reached2048: boolean;
  over: boolean;
};

export type MineTile = { mine: boolean; adjacent: number; revealed: boolean; flagged: boolean };
export type MinesweeperState = ArcadeBase & {
  gameId: 'minesweeper';
  board: MineTile[][];
  mineCount: number;
  flags: number;
  status: 'playing' | 'won' | 'lost';
};

export type WordGuessState = ArcadeBase & {
  gameId: 'word-guess';
  target: string;
  guesses: string[];
  current: string;
  status: 'playing' | 'won' | 'lost';
};

export type ArcadeState = Tile2048State | MinesweeperState | WordGuessState;
export type Move2048 = 'up' | 'right' | 'down' | 'left';

const FOUR = 4;
const MINE_ROWS = 9;
const MINE_COLUMNS = 9;
const MINE_COUNT = 10;
const BEST_SCORE_KEY = 'playdeck:2048-best:v1';
const WORDS = [
  'ABOUT', 'ABOVE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN', 'AGENT',
  'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE', 'ALONG',
  'ALTER', 'AMONG', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA', 'ARGUE',
  'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AUDIO', 'AVOID', 'AWAKE', 'AWARD', 'AWARE', 'BADLY',
  'BAKER', 'BASES', 'BASIC', 'BASIS', 'BEACH', 'BEGAN', 'BEGIN', 'BEING', 'BELOW', 'BENCH',
  'BIRTH', 'BLACK', 'BLAME', 'BLANK', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOOST', 'BRAIN',
  'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIEF', 'BRING', 'BROAD', 'BROKE', 'BROWN',
  'BUILD', 'BUILT', 'BUYER', 'CABLE', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHART',
  'CHASE', 'CHEAP', 'CHECK', 'CHEER', 'CHEST', 'CHIEF', 'CHILD', 'CHINA', 'CHOSE', 'CIVIL',
  'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLOCK', 'CLOSE', 'COACH', 'COAST', 'COULD',
  'COUNT', 'COURT', 'COVER', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM', 'CRIME', 'CROSS', 'CROWD',
  'CROWN', 'CURVE', 'CYCLE', 'DAILY', 'DANCE', 'DATED', 'DEALT', 'DEATH', 'DEBUT', 'DELAY',
  'DEPTH', 'DOING', 'DOUBT', 'DOZEN', 'DRAFT', 'DRAMA', 'DREAM', 'DRESS', 'DRINK', 'DRIVE',
  'DROVE', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY',
  'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH',
  'FALSE', 'FAULT', 'FIBER', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED',
  'FLASH', 'FLEET', 'FLOOR', 'FOCUS', 'FORCE', 'FORTH', 'FORTY', 'FOUND', 'FRAME', 'FRESH',
  'FRONT', 'FRUIT', 'FULLY', 'FUNNY', 'GIANT', 'GIVEN', 'GLASS', 'GLOBE', 'GOING', 'GRACE',
  'GRADE', 'GRAND', 'GRANT', 'GRASS', 'GREAT', 'GREEN', 'GROSS', 'GROUP', 'GROWN', 'GUARD',
  'GUESS', 'GUEST', 'GUIDE', 'HAPPY', 'HEART', 'HEAVY', 'HENCE', 'HORSE', 'HOTEL', 'HOUSE',
  'HUMAN', 'IDEAL', 'IMAGE', 'INDEX', 'INNER', 'INPUT', 'ISSUE', 'JOINT', 'JUDGE', 'KNOWN',
  'LABEL', 'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAVE', 'LEGAL',
  'LEVEL', 'LIGHT', 'LIMIT', 'LOCAL', 'LOGIC', 'LOOSE', 'LOWER', 'LUCKY', 'LUNCH', 'MAJOR',
  'MAKER', 'MARCH', 'MATCH', 'MAYOR', 'MEANT', 'MEDIA', 'METAL', 'MIGHT', 'MINOR', 'MINUS',
  'MIXED', 'MODEL', 'MONEY', 'MONTH', 'MORAL', 'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE',
  'MUSIC', 'NEEDS', 'NEVER', 'NEWLY', 'NIGHT', 'NOISE', 'NORTH', 'NOTED', 'NOVEL', 'NURSE',
  'OCCUR', 'OCEAN', 'OFFER', 'OFTEN', 'ORDER', 'OTHER', 'OUGHT', 'PAINT', 'PANEL', 'PAPER',
  'PARTY', 'PEACE', 'PHASE', 'PHONE', 'PHOTO', 'PIECE', 'PILOT', 'PITCH', 'PLACE', 'PLAIN',
  'PLANE', 'PLANT', 'PLATE', 'POINT', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME',
  'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'QUEEN', 'QUICK', 'QUIET', 'QUITE',
  'RADIO', 'RAISE', 'RANGE', 'RAPID', 'RATIO', 'REACH', 'REACT', 'READY', 'REFER', 'RIGHT',
  'RIVAL', 'RIVER', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SCALE', 'SCENE', 'SCOPE',
  'SCORE', 'SENSE', 'SERVE', 'SEVEN', 'SHALL', 'SHAPE', 'SHARE', 'SHARP', 'SHEET', 'SHELF',
  'SHELL', 'SHIFT', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORT', 'SHOWN', 'SIGHT', 'SINCE', 'SIXTH',
  'SKILL', 'SLEEP', 'SMALL', 'SMART', 'SMILE', 'SOLID', 'SOLVE', 'SORRY', 'SOUND', 'SOUTH',
  'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT', 'SPOKE', 'SPORT', 'STAFF',
  'STAGE', 'STAKE', 'STAND', 'START', 'STATE', 'STEAM', 'STEEL', 'STICK', 'STILL', 'STOCK',
  'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE',
  'SUGAR', 'SUITE', 'SUPER', 'SWEET', 'TABLE', 'TAKEN', 'TASTE', 'TEACH', 'TEETH', 'THANK',
  'THEIR', 'THEME', 'THERE', 'THESE', 'THICK', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE',
  'THROW', 'TIGHT', 'TIMES', 'TITLE', 'TODAY', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER',
  'TRACK', 'TRADE', 'TRAIN', 'TREAT', 'TREND', 'TRIAL', 'TRIED', 'TRUCK', 'TRULY', 'TRUST',
  'TRUTH', 'TWICE', 'UNDER', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE',
  'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOICE', 'WASTE', 'WATCH',
  'WATER', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WOMAN', 'WOMEN',
  'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WRITE', 'WRONG', 'WROTE', 'YIELD',
  'YOUNG', 'YOUTH', 'ZEBRA',
];

function spawnTile(board: number[][]): number[][] {
  const empty: [number, number][] = [];
  board.forEach((row, r) => row.forEach((value, c) => { if (value === 0) empty.push([r, c]); }));
  if (!empty.length) return board;
  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  const next = board.map((line) => [...line]);
  next[row][col] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function canMove2048(board: number[][]): boolean {
  for (let row = 0; row < FOUR; row++) {
    for (let col = 0; col < FOUR; col++) {
      if (board[row][col] === 0) return true;
      if (col < FOUR - 1 && board[row][col] === board[row][col + 1]) return true;
      if (row < FOUR - 1 && board[row][col] === board[row + 1][col]) return true;
    }
  }
  return false;
}

export function createArcadeState(gameId: GameId): ArcadeState {
  if (gameId === '2048') {
    const empty = Array.from({ length: FOUR }, () => Array<number>(FOUR).fill(0));
    return { gameId: '2048', board: spawnTile(spawnTile(empty)), score: 0, best: load2048BestScore(), reached2048: false, over: false, turn: 1, winner: null };
  }
  if (gameId === 'minesweeper') {
    const positions = Array.from({ length: MINE_ROWS * MINE_COLUMNS }, (_, index) => index);
    for (let index = positions.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [positions[index], positions[swap]] = [positions[swap], positions[index]];
    }
    const mined = new Set(positions.slice(0, MINE_COUNT));
    const board = Array.from({ length: MINE_ROWS }, (_, row) => Array.from({ length: MINE_COLUMNS }, (_, col) => {
      const mine = mined.has(row * MINE_COLUMNS + col);
      let adjacent = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (dy === 0 && dx === 0) continue;
        const y = row + dy;
        const x = col + dx;
        if (y >= 0 && y < MINE_ROWS && x >= 0 && x < MINE_COLUMNS && mined.has(y * MINE_COLUMNS + x)) adjacent++;
      }
      return { mine, adjacent, revealed: false, flagged: false };
    }));
    return { gameId: 'minesweeper', board, mineCount: MINE_COUNT, flags: 0, status: 'playing', turn: 1, winner: null };
  }
  if (gameId === 'word-guess') {
    const now = new Date();
    const day = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000);
    const index = ((day % WORDS.length) + WORDS.length) % WORDS.length;
    return { gameId: 'word-guess', target: WORDS[index], guesses: [], current: '', status: 'playing', turn: 1, winner: null };
  }
  throw new Error(`Unsupported arcade game: ${gameId}`);
}

export function load2048BestScore(): number {
  try {
    const score = Number(window.localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
  } catch {
    return 0;
  }
}

export function save2048BestScore(score: number): void {
  try {
    if (Number.isFinite(score) && score >= 0) window.localStorage.setItem(BEST_SCORE_KEY, String(Math.floor(score)));
  } catch {
    // Keep the game playable when browser storage is unavailable.
  }
}

export function move2048(state: Tile2048State, direction: Move2048): Tile2048State {
  if (state.over) return state;
  const next = state.board.map((row) => [...row]);
  let gained = 0;
  for (let lineIndex = 0; lineIndex < FOUR; lineIndex++) {
    const coords: [number, number][] = Array.from({ length: FOUR }, (_, offset) => {
      const fromStart = direction === 'left' || direction === 'up';
      const index = fromStart ? offset : FOUR - 1 - offset;
      return direction === 'left' || direction === 'right' ? [lineIndex, index] : [index, lineIndex];
    });
    const values = coords.map(([row, col]) => state.board[row][col]).filter((value) => value > 0);
    const merged: number[] = [];
    for (let index = 0; index < values.length; index++) {
      if (values[index] === values[index + 1]) {
        const value = values[index] * 2;
        merged.push(value);
        gained += value;
        index++;
      } else merged.push(values[index]);
    }
    while (merged.length < FOUR) merged.push(0);
    coords.forEach(([row, col], index) => { next[row][col] = merged[index]; });
  }

  if (next.every((row, index) => row.every((value, col) => value === state.board[index][col]))) return state;
  const board = spawnTile(next);
  const reached2048 = state.reached2048 || board.some((row) => row.includes(2048));
  return { ...state, board, score: state.score + gained, best: Math.max(state.best, state.score + gained), reached2048, over: !canMove2048(board) };
}

function withMines(board: MineTile[][]): MineTile[][] {
  return board.map((line, row) => line.map((tile, col) => {
    if (tile.mine) return tile;
    let adjacent = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dy === 0 && dx === 0) continue;
      const y = row + dy;
      const x = col + dx;
      if (y >= 0 && y < MINE_ROWS && x >= 0 && x < MINE_COLUMNS && board[y][x].mine) adjacent++;
    }
    return { ...tile, adjacent };
  }));
}

export function toggleMineFlag(state: MinesweeperState, row: number, col: number): MinesweeperState {
  const tile = state.board[row]?.[col];
  if (state.status !== 'playing' || !tile || tile.revealed || (!tile.flagged && state.flags >= state.mineCount)) return state;
  const board = state.board.map((line) => line.map((item) => ({ ...item })));
  board[row][col].flagged = !tile.flagged;
  const flags = state.flags + (tile.flagged ? -1 : 1);
  return { ...state, board, flags, status: state.status };
}

export function revealMineTile(state: MinesweeperState, row: number, col: number): MinesweeperState {
  const target = state.board[row]?.[col];
  if (state.status !== 'playing' || !target || target.revealed || target.flagged) return state;
  let board = state.board.map((line) => line.map((tile) => ({ ...tile })));
  if (target.mine && !board.some((line) => line.some((tile) => tile.revealed))) {
    const spare = board.flatMap((line, r) => line.map((tile, c) => ({ tile, r, c })))
      .find(({ tile, r: y, c: x }) => !tile.mine && (y !== row || x !== col));
    if (spare) {
      board[row][col].mine = false;
      board[spare.r][spare.c].mine = true;
      board = withMines(board);
    }
  }
  if (board[row][col].mine) {
    board = board.map((line) => line.map((tile) => ({ ...tile, revealed: tile.revealed || tile.mine })));
    return { ...state, board, status: 'lost' };
  }

  const queue: [number, number][] = [[row, col]];
  const visited = new Set<string>();
  while (queue.length) {
    const [y, x] = queue.shift()!;
    const key = `${y}:${x}`;
    if (visited.has(key) || y < 0 || y >= MINE_ROWS || x < 0 || x >= MINE_COLUMNS) continue;
    visited.add(key);
    const tile = board[y][x];
    if (tile.mine || tile.flagged || tile.revealed) continue;
    tile.revealed = true;
    if (tile.adjacent === 0) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (dy !== 0 || dx !== 0) queue.push([y + dy, x + dx]);
      }
    }
  }
  const safeRevealed = board.flat().filter((tile) => tile.revealed && !tile.mine).length;
  const status = safeRevealed === MINE_ROWS * MINE_COLUMNS - state.mineCount ? 'won' : 'playing';
  return { ...state, board, status };
}

export function typeWordLetter(state: WordGuessState, letter: string): WordGuessState {
  if (state.status !== 'playing' || !/^[A-Z]$/.test(letter) || state.current.length >= 5) return state;
  return { ...state, current: state.current + letter };
}

export function removeWordLetter(state: WordGuessState): WordGuessState {
  if (state.status !== 'playing' || !state.current) return state;
  return { ...state, current: state.current.slice(0, -1) };
}

export function submitWordGuess(state: WordGuessState): WordGuessState {
  if (state.status !== 'playing' || state.current.length !== 5) return state;
  const guesses = [...state.guesses, state.current];
  const status = state.current === state.target ? 'won' : guesses.length >= 6 ? 'lost' : 'playing';
  return { ...state, guesses, current: '', status };
}

export function gradeWordGuess(guess: string, target: string): ('correct' | 'present' | 'absent')[] {
  const result: ('correct' | 'present' | 'absent')[] = Array(5).fill('absent');
  const remaining = target.split('');
  for (let index = 0; index < 5; index++) {
    if (guess[index] === target[index]) {
      result[index] = 'correct';
      remaining[index] = '';
    }
  }
  for (let index = 0; index < 5; index++) {
    if (result[index] === 'correct') continue;
    const found = remaining.indexOf(guess[index]);
    if (found !== -1) {
      result[index] = 'present';
      remaining[found] = '';
    }
  }
  return result;
}
