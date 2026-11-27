import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('BoardCraft browser persistence', () => {
  let values: Map<string, string>;
  let persistence: typeof import('../persistence');

  beforeEach(async () => {
    vi.resetModules();
    values = new Map();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
      addEventListener: vi.fn(),
    });
    persistence = await import('../persistence');
  });

  afterEach(() => vi.unstubAllGlobals());

  it('migrates theme and sound preferences from the earlier keys', () => {
    values.set('boardcraft-theme', 'birch');
    values.set('boardcraft-sound', 'false');
    vi.resetModules();
    return import('../persistence').then(({ loadPreferences }) => {
      expect(loadPreferences()).toEqual({ themeId: 'birch', soundEnabled: false, difficulty: 'medium', lastGameId: null });
    });
  });

  it('stores a minimal, versioned match and clears it when restarted', () => {
    const match = {
      state: { kind: 'connect4', data: { turn: 2 } },
      history: [{ kind: 'connect4', data: { turn: 1 } }],
      mode: 'ai' as const,
      difficulty: 'hard' as const,
    };

    expect(persistence.saveMatch('connect4', match)).toBe(true);
    expect(persistence.loadSavedMatch('connect4')).toMatchObject(match);
    expect(persistence.loadSavedGameIds()).toEqual(['connect4']);
    expect(persistence.loadMostRecentSavedGame()).toBe('connect4');
    expect(persistence.removeSavedMatch('connect4')).toBe(true);
    expect(persistence.loadSavedMatch('connect4')).toBeNull();
    expect(persistence.loadMostRecentSavedGame()).toBeNull();
  });

  it('ignores malformed saved preferences and match records', () => {
    values.set('boardcraft:preferences:v1', '{broken');
    values.set('boardcraft:matches:v1', JSON.stringify({ version: 1, matches: { connect4: { state: null } } }));
    vi.resetModules();
    return import('../persistence').then(({ loadPreferences, loadSavedMatch }) => {
      expect(loadPreferences().themeId).toBe('obsidian');
      expect(loadSavedMatch('connect4')).toBeNull();
    });
  });

  it('degrades gracefully when browser storage is unavailable', async () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => { throw new Error('storage disabled'); },
        setItem: () => { throw new Error('storage disabled'); },
      },
      addEventListener: vi.fn(),
    });
    vi.resetModules();
    const { loadPreferences, savePreferences } = await import('../persistence');
    expect(loadPreferences().soundEnabled).toBe(true);
    expect(savePreferences({ themeId: 'obsidian', soundEnabled: true, difficulty: 'medium', lastGameId: null })).toBe(false);
  });
});
