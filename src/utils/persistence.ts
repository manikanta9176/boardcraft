import { Difficulty, GameId, ThemeId } from '../types/game';

const STORAGE_VERSION = 1;
const PREFERENCES_KEY = `boardcraft:preferences:v${STORAGE_VERSION}`;
const MATCHES_KEY = `boardcraft:matches:v${STORAGE_VERSION}`;
const MAX_HISTORY = 80;

export interface PlayerPreferences {
  themeId: ThemeId;
  soundEnabled: boolean;
  difficulty: Difficulty;
  lastGameId: GameId | null;
}

export interface SavedMatch {
  state: unknown;
  history: unknown[];
  mode: 'ai' | 'local';
  difficulty: Difficulty;
  savedAt: number;
}

const cache = new Map<string, string | null>();

function readRaw(key: string): string | null {
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const value = window.localStorage.getItem(key);
    cache.set(key, value);
    return value;
  } catch {
    cache.set(key, null);
    return null;
  }
}

function writeRaw(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    cache.set(key, value);
    return true;
  } catch {
    cache.delete(key);
    return false;
  }
}

function parseRaw(key: string): unknown {
  const raw = readRaw(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isGameId(value: unknown): value is GameId {
  return value === 'three-mens-morris' || value === 'six-mens-morris' || value === 'nine-mens-morris' || value === 'twelve-mens-morris' || value === 'connect4' || value === 'reversi' || value === 'checkers' || value === 'mancala' || value === 'gomoku' || value === 'dots-and-boxes';
}

function normalizeThemeId(value: unknown): ThemeId | null {
  if (value === 'paper' || value === 'sea-glass') return 'paper';
  if (value === 'obsidian' || value === 'birch' || value === 'walnut') return value;
  return null;
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

export function loadPreferences(): PlayerPreferences {
  const value = parseRaw(PREFERENCES_KEY);
  if (isRecord(value) && value.version === STORAGE_VERSION) {
    return {
      themeId: normalizeThemeId(value.themeId) ?? 'paper',
      soundEnabled: typeof value.soundEnabled === 'boolean' ? value.soundEnabled : true,
      difficulty: isDifficulty(value.difficulty) ? value.difficulty : 'medium',
      lastGameId: isGameId(value.lastGameId) ? value.lastGameId : null,
    };
  }

  // Read the two keys used by earlier BoardCraft builds.
  const legacyTheme = readRaw('boardcraft-theme');
  const legacySound = readRaw('boardcraft-sound');
  return {
    themeId: normalizeThemeId(legacyTheme) ?? 'paper',
    soundEnabled: legacySound === null ? true : legacySound === 'true',
    difficulty: 'medium',
    lastGameId: null,
  };
}

export function savePreferences(preferences: PlayerPreferences): boolean {
  return writeRaw(PREFERENCES_KEY, JSON.stringify({ version: STORAGE_VERSION, ...preferences }));
}

function readMatches(): Partial<Record<GameId, SavedMatch>> {
  const value = parseRaw(MATCHES_KEY);
  if (!isRecord(value) || value.version !== STORAGE_VERSION || !isRecord(value.matches)) return {};

  const matches: Partial<Record<GameId, SavedMatch>> = {};
  for (const [key, rawMatch] of Object.entries(value.matches)) {
    if (!isGameId(key) || !isRecord(rawMatch)) continue;
    if ((rawMatch.mode !== 'ai' && rawMatch.mode !== 'local') || !isDifficulty(rawMatch.difficulty)) continue;
    if (!Array.isArray(rawMatch.history) || typeof rawMatch.savedAt !== 'number' || !isRecord(rawMatch.state)) continue;
    matches[key] = {
      state: rawMatch.state,
      history: rawMatch.history.slice(-MAX_HISTORY),
      mode: rawMatch.mode,
      difficulty: rawMatch.difficulty,
      savedAt: rawMatch.savedAt,
    };
  }
  return matches;
}

export function loadSavedMatch(gameId: GameId): SavedMatch | null {
  return readMatches()[gameId] ?? null;
}

export function loadSavedGameIds(): GameId[] {
  return Object.keys(readMatches()).filter(isGameId);
}

export function loadMostRecentSavedGame(): GameId | null {
  let mostRecent: GameId | null = null;
  let latestSavedAt = -1;
  for (const [gameId, match] of Object.entries(readMatches())) {
    if (isGameId(gameId) && match.savedAt > latestSavedAt) {
      mostRecent = gameId;
      latestSavedAt = match.savedAt;
    }
  }
  return mostRecent;
}

export function saveMatch(gameId: GameId, match: Omit<SavedMatch, 'savedAt'>): boolean {
  const matches = readMatches();
  matches[gameId] = {
    ...match,
    history: match.history.slice(-MAX_HISTORY),
    savedAt: Date.now(),
  };
  return writeRaw(MATCHES_KEY, JSON.stringify({ version: STORAGE_VERSION, matches }));
}

export function removeSavedMatch(gameId: GameId): boolean {
  const matches = readMatches();
  if (!matches[gameId]) return true;
  delete matches[gameId];
  return writeRaw(MATCHES_KEY, JSON.stringify({ version: STORAGE_VERSION, matches }));
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key) cache.delete(event.key);
    else cache.clear();
  });
}
