import { describe, expect, it } from 'vitest';
import { boardCraftRouteHref, parseBoardCraftRoute } from '../routing';

describe('BoardCraft routes', () => {
  it('opens a game directly and keeps its mode and room code', () => {
    expect(parseBoardCraftRoute('/play/nine-mens-morris', '?mode=local&room=ab-c123')).toEqual({
      screen: 'game',
      gameId: 'nine-mens-morris',
      mode: 'local',
      roomCode: 'ABC123',
    });
  });

  it('resolves the library and invite links at the root', () => {
    expect(parseBoardCraftRoute('/', '?room=abc123')).toEqual({ screen: 'library', roomCode: 'ABC123' });
  });

  it('shows a not found route for unknown game names', () => {
    expect(parseBoardCraftRoute('/play/not-a-game', '')).toEqual({ screen: 'not-found', path: '/play/not-a-game' });
  });

  it('builds shareable links without carrying unrelated query parameters', () => {
    expect(boardCraftRouteHref({ screen: 'game', gameId: 'reversi', mode: 'ai', roomCode: 'A1B2C3' }, 'https://games.example/?utm_source=old'))
      .toBe('/play/reversi?mode=ai&room=A1B2C3');
  });
});
