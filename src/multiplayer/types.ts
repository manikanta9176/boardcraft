import { GameId, Player } from '../types/game';

export type TransportKind = 'online-room' | 'hotspot-direct' | 'nearby-discovery';

export type ConnectionPhase =
  | 'idle'
  | 'initializing'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'error';

export type NetMessage =
  | { type: 'HELLO'; gameId: GameId; hostPlayer: Player }
  | { type: 'SYNC_STATE'; gameId: GameId; hostPlayer: Player; state: unknown }
  | { type: 'MOVE'; gameId: GameId; payload: unknown }
  | { type: 'SWITCH_GAME'; gameId: GameId }
  | { type: 'RESET_GAME'; gameId: GameId }
  | { type: 'SWAP_SIDES'; hostPlayer: Player }
  | { type: 'REMATCH_REQUEST' }
  | { type: 'REMATCH_ACCEPT' }
  | { type: 'REACTION'; emoji: string; label: string }
  | { type: 'PING'; ts: number }
  | { type: 'PONG'; ts: number };

const ROOM_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateRoomCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  }
  return code;
}

export function normalizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function roomToPeerId(code: string): string {
  return `boardcraft-v1-${normalizeRoomCode(code)}`;
}

export function buildRoomInviteUrl(code: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('room', normalizeRoomCode(code));
  return url.toString();
}
