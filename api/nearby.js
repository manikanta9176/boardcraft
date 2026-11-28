import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

const PRESENCE_TTL_SECONDS = 60;
const INDEX_TTL_SECONDS = 120;
const MAX_RESULTS = 20;
const GAME_IDS = new Set([
  'three-mens-morris',
  'six-mens-morris',
  'nine-mens-morris',
  'twelve-mens-morris',
  'connect4',
  'reversi',
  'checkers',
  'mancala',
  'gomoku',
  'dots-and-boxes',
]);

function json(res, status, value) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(value));
}

function header(req, name) {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return {};
}

function validateOrigin(req) {
  const origin = header(req, 'origin');
  const host = header(req, 'host');
  if (!origin || !host) return true;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function createNetworkKey(req) {
  const secret = process.env.BOARDCRAFT_NEARBY_SECRET;
  if (!secret) throw new Error('Nearby play is not configured on this deployment yet. Use offline QR pairing or add Nearby Play settings in Vercel.');

  const ip = header(req, 'x-forwarded-for')?.split(',')[0]?.trim()
    || (process.env.NODE_ENV !== 'production' ? 'local-development' : '');
  if (!ip) throw new Error('Nearby discovery could not identify this network.');

  const host = header(req, 'host') || 'local';
  const networkAddress = normalizeNetworkAddress(ip);
  const networkHash = createHmac('sha256', secret).update(networkAddress).digest('hex').slice(0, 32);
  const deployment = createHmac('sha256', secret).update(host).digest('hex').slice(0, 12);
  return `boardcraft:nearby:v1:${deployment}:${networkHash}`;
}

function normalizeNetworkAddress(address) {
  const family = isIP(address);
  if (family === 4) return `${address}/32`;
  if (family !== 6) return address;

  let value = address.toLowerCase();
  if (value.includes('.')) {
    const separator = value.lastIndexOf(':');
    const octets = value.slice(separator + 1).split('.').map(Number);
    if (octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
      const high = ((octets[0] << 8) | octets[1]).toString(16);
      const low = ((octets[2] << 8) | octets[3]).toString(16);
      value = `${value.slice(0, separator + 1)}${high}:${low}`;
    }
  }

  const [leftPart = '', rightPart = ''] = value.split('::');
  const left = leftPart ? leftPart.split(':') : [];
  const right = rightPart ? rightPart.split(':') : [];
  const zeroCount = Math.max(0, 8 - left.length - right.length);
  const groups = [...left, ...Array(zeroCount).fill('0'), ...right];
  if (groups.slice(0, 5).every((group) => parseInt(group || '0', 16) === 0) && parseInt(groups[5] || '0', 16) === 0xffff) {
    const high = parseInt(groups[6] || '0', 16);
    const low = parseInt(groups[7] || '0', 16);
    const ipv4 = `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
    return `${ipv4}/32`;
  }
  return `${groups.slice(0, 4).map((group) => parseInt(group || '0', 16).toString(16).padStart(4, '0')).join(':')}/64`;
}

function hashHostToken(token) {
  const secret = process.env.BOARDCRAFT_NEARBY_SECRET;
  return createHmac('sha256', secret).update(`host-token:${token}`).digest('hex');
}

async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Nearby play is not configured on this deployment yet. Use offline QR pairing or add Nearby Play settings in Vercel.');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error('The nearby lobby is temporarily unavailable.');
  return result.result;
}

function hostKey(indexKey, hostId) {
  return `${indexKey}:host:${hostId}`;
}

const memoryStore = globalThis.__boardcraftNearbyMemory ??= new Map();

async function memoryList(indexKey) {
  const now = Date.now();
  return [...memoryStore.entries()]
    .filter(([key, entry]) => key.startsWith(`${indexKey}:host:`) && entry.expiresAt > now)
    .map(([, entry]) => {
      const { tokenHash: _tokenHash, ...room } = entry.value.room;
      return { ...room, expiresAt: entry.expiresAt };
    })
    .slice(0, MAX_RESULTS);
}

async function listRooms(indexKey) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === 'production') throw new Error('Nearby play is not configured on this deployment yet. Use offline QR pairing or add Nearby Play settings in Vercel.');
    return memoryList(indexKey);
  }

  const now = Date.now();
  await redisCommand(['ZREMRANGEBYSCORE', indexKey, '-inf', String(now)]);
  const ids = await redisCommand(['ZRANGEBYSCORE', indexKey, String(now), '+inf', 'LIMIT', '0', String(MAX_RESULTS)]);
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const values = await redisCommand(['MGET', ...ids.map((id) => hostKey(indexKey, id))]);
  return (Array.isArray(values) ? values : [])
    .filter((value) => typeof value === 'string')
    .map((value) => {
      const { tokenHash: _tokenHash, ...room } = JSON.parse(value);
      return room;
    });
}

async function publishRoom(indexKey, room, tokenHash) {
  const expiresAt = Date.now() + PRESENCE_TTL_SECONDS * 1000;
  const storedRoom = { ...room, tokenHash };
  const value = JSON.stringify({ ...storedRoom, expiresAt });
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === 'production') throw new Error('Nearby play is not configured on this deployment yet. Use offline QR pairing or add Nearby Play settings in Vercel.');
    const key = hostKey(indexKey, room.hostId);
    const existing = memoryStore.get(key);
    if (existing && existing.value.tokenHash !== tokenHash) return false;
    memoryStore.set(key, { value: { room: storedRoom }, expiresAt });
    return true;
  }

  const key = hostKey(indexKey, room.hostId);
  const existing = await redisCommand(['GET', key]);
  if (existing && JSON.parse(existing).tokenHash !== tokenHash) return false;
  if (!existing) {
    const created = await redisCommand(['SET', key, value, 'EX', String(PRESENCE_TTL_SECONDS), 'NX']);
    if (created !== 'OK') {
      const racedValue = await redisCommand(['GET', key]);
      if (!racedValue || JSON.parse(racedValue).tokenHash !== tokenHash) return false;
    }
  } else {
    await redisCommand(['SET', key, value, 'EX', String(PRESENCE_TTL_SECONDS)]);
  }
  await redisCommand(['ZADD', indexKey, String(expiresAt), room.hostId]);
  await redisCommand(['EXPIRE', indexKey, String(INDEX_TTL_SECONDS)]);
  return true;
}

async function removeRoom(indexKey, hostId, tokenHash) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    const key = hostKey(indexKey, hostId);
    const existing = memoryStore.get(key);
    if (!existing) return true;
    if (existing.value.room.tokenHash !== tokenHash) return false;
    memoryStore.delete(key);
    return true;
  }
  const key = hostKey(indexKey, hostId);
  const existing = await redisCommand(['GET', key]);
  if (existing && JSON.parse(existing).tokenHash !== tokenHash) return false;
  await redisCommand(['ZREM', indexKey, hostId]);
  await redisCommand(['DEL', key]);
  return true;
}

function validHostId(value) {
  return typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
}

function validHostToken(value) {
  return validHostId(value);
}

export default async function handler(req, res) {
  if (!validateOrigin(req)) return json(res, 403, { error: 'This nearby lobby only accepts requests from PlayDeck.' });
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  let indexKey;
  try {
    indexKey = createNetworkKey(req);
  } catch (error) {
    return json(res, 503, { error: error instanceof Error ? error.message : 'Nearby discovery is unavailable.' });
  }

  try {
    if (req.method === 'GET') {
      return json(res, 200, { rooms: await listRooms(indexKey) });
    }

    const body = parseBody(req);
    if (!validHostId(body.hostId)) return json(res, 400, { error: 'Invalid nearby session.' });
    if (!validHostToken(body.hostToken)) return json(res, 400, { error: 'Invalid nearby session credentials.' });
    const tokenHash = hashHostToken(body.hostToken);

    if (req.method === 'DELETE') {
      const removed = await removeRoom(indexKey, body.hostId, tokenHash);
      if (!removed) return json(res, 403, { error: 'Only the host can stop this nearby listing.' });
      return json(res, 200, { ok: true });
    }

    if (!GAME_IDS.has(body.gameId)) return json(res, 400, { error: 'Choose a valid PlayDeck game.' });
    const room = {
      hostId: body.hostId,
      peerId: `bc-nearby-${body.hostId}`,
      gameId: body.gameId,
      updatedAt: Date.now(),
    };
    const published = await publishRoom(indexKey, room, tokenHash);
    if (!published) return json(res, 403, { error: 'This nearby session belongs to another host.' });
    return json(res, 200, { ok: true, expiresInSeconds: PRESENCE_TTL_SECONDS });
  } catch (error) {
    return json(res, 503, { error: error instanceof Error ? error.message : 'The nearby lobby is temporarily unavailable.' });
  }
}
