import type { FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import type { AuthUser, ShmUser } from '../types/index.js';

const SHM_INTERNAL_URL = process.env.SHM_INTERNAL_URL ?? 'http://host.docker.internal:8082';
const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  user: AuthUser;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

async function resolveSession(sessionId: string): Promise<AuthUser> {
  const cached = cache.get(sessionId);
  if (cached && cached.expiresAt > Date.now()) return cached.user;

  const headers = { session_id: sessionId };
  const timeout = 4000;

  const [userRes, roleRes] = await Promise.allSettled([
    axios.get<ShmUser>(`${SHM_INTERNAL_URL}/shm/v1/user`, { headers, timeout }),
    axios.get(`${SHM_INTERNAL_URL}/shm/v1/storage/manage/support_role`, { headers, timeout }),
  ]);

  if (userRes.status === 'rejected') {
    const err = userRes.reason as { code?: string; message?: string };
    console.error(`[auth] SHM user request failed: ${err.code ?? err.message} — SHM_INTERNAL_URL=${SHM_INTERNAL_URL}`);
    throw new Error('unauthorized');
  }
  if (userRes.value.status !== 200) {
    throw new Error('unauthorized');
  }

  const shmUser = userRes.value.data;
  const isSpecialist = roleRes.status === 'fulfilled' && !!roleRes.value.data;

  const user: AuthUser = {
    user_id: shmUser.user_id,
    login: shmUser.login,
    login2: shmUser.login2,
    full_name: shmUser.full_name,
    isSpecialist,
  };

  cache.set(sessionId, { user, expiresAt: Date.now() + CACHE_TTL_MS });
  return user;
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const sessionId = req.headers['session_id'] as string | undefined
    ?? req.cookies?.session_id;

  if (!sessionId) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    req.authUser = await resolveSession(sessionId);
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function requireSpecialist(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (!req.authUser?.isSpecialist) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
}
