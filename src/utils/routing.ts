import { GameId } from '../types/game';
import { GAMES } from '../games/registry';

export type BoardCraftRoute =
  | { screen: 'library'; roomCode?: string }
  | { screen: 'game'; gameId: GameId; mode?: 'ai' | 'local'; roomCode?: string }
  | { screen: 'not-found'; path: string; roomCode?: string };

function normalizeRoomCode(value: string | null): string | undefined {
  const normalized = value?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  return normalized || undefined;
}

export function parseBoardCraftRoute(pathname: string, search: string): BoardCraftRoute {
  const params = new URLSearchParams(search);
  const roomCode = normalizeRoomCode(params.get('room'));
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/' || cleanPath === '/index.html') {
    return { screen: 'library', roomCode };
  }

  const match = cleanPath.match(/^\/play\/([^/]+)$/);
  if (!match) return { screen: 'not-found', path: pathname, roomCode };

  let rawId = match[1];
  try {
    rawId = decodeURIComponent(rawId);
  } catch {
    return { screen: 'not-found', path: pathname, roomCode };
  }
  const game = GAMES.find((item) => item.id === rawId);
  if (!game) return { screen: 'not-found', path: pathname, roomCode };

  const requestedMode = params.get('mode');
  const mode = requestedMode === 'ai' || requestedMode === 'local' ? requestedMode : undefined;
  return { screen: 'game', gameId: game.id, mode, roomCode };
}

export function boardCraftRouteHref(route: Exclude<BoardCraftRoute, { screen: 'not-found' }>, baseUrl: string): string {
  const url = new URL(baseUrl);
  url.pathname = route.screen === 'library' ? '/' : `/play/${route.gameId}`;
  url.search = '';

  if (route.screen === 'game' && route.mode) url.searchParams.set('mode', route.mode);
  if (route.roomCode) url.searchParams.set('room', normalizeRoomCode(route.roomCode) ?? route.roomCode);

  return `${url.pathname}${url.search}${url.hash}`;
}

export function writeBoardCraftRoute(
  route: Exclude<BoardCraftRoute, { screen: 'not-found' }>,
  replace = false,
): void {
  const next = boardCraftRouteHref(route, window.location.href);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === next) return;

  if (replace) window.history.replaceState({ boardCraft: true }, '', next);
  else window.history.pushState({ boardCraft: true }, '', next);
}
