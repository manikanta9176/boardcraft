import { GameId } from '../types/game';

export interface NearbyGameListing {
  hostId: string;
  peerId: string;
  gameId: GameId;
  updatedAt: number;
  expiresAt: number;
}

export interface NearbyHostCredentials {
  hostId: string;
  hostToken: string;
}

async function request<T>(method: 'GET' | 'POST' | 'DELETE', body?: unknown): Promise<T> {
  const response = await fetch('/api/nearby', {
    method,
    cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  const result = isJson ? await response.json().catch(() => ({})) as { error?: string } & T : {} as { error?: string } & T;
  if (!isJson) throw new Error('Nearby discovery needs the Vercel API. Run `npx vercel dev` for local development.');
  if (!response.ok) throw new Error(result.error || 'Nearby discovery is temporarily unavailable.');
  return result;
}

export function createNearbyHostCredentials(): NearbyHostCredentials {
  return { hostId: crypto.randomUUID(), hostToken: crypto.randomUUID() };
}

export async function publishNearbyGame(hostId: string, hostToken: string, gameId: GameId): Promise<void> {
  await request('POST', { hostId, hostToken, gameId });
}

export async function findNearbyGames(): Promise<NearbyGameListing[]> {
  const result = await request<{ rooms: NearbyGameListing[] }>('GET');
  return Array.isArray(result.rooms) ? result.rooms : [];
}

export async function removeNearbyGame(hostId: string, hostToken: string): Promise<void> {
  await request('DELETE', { hostId, hostToken }).catch(() => undefined);
}
