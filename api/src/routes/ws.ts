import type { FastifyInstance } from 'fastify';
import { resolveSession } from '../middleware/auth.js';
import { register, unregister } from '../ws/registry.js';
import {
  registerUser, unregisterUser,
  registerSpecialist, unregisterSpecialist,
} from '../ws/notifyRegistry.js';

interface RawWs {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  ping(): void;
  on(event: string, listener: (...args: unknown[]) => void): unknown;
}

// @fastify/websocket <=v8 wraps WebSocket in SocketStream (.socket = actual WebSocket)
// @fastify/websocket v9+ passes WebSocket directly
function extractRawWs(socket: unknown): RawWs {
  const s = socket as Record<string, unknown>;
  const inner = s.socket as Record<string, unknown> | undefined;
  if (inner && typeof inner.readyState === 'number') return inner as unknown as RawWs;
  return socket as RawWs;
}

function getCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === name) return decodeURIComponent(v);
  }
  return undefined;
}

export default async function wsRoutes(app: FastifyInstance) {
  app.get('/v1/tickets/:id/ws', { websocket: true }, async (socket, req) => {
    const raw = extractRawWs(socket);
    const { id: ticketId } = req.params as { id: string };

    const sessionId =
      (req.headers['session_id'] as string | undefined) ||
      getCookieValue(req.headers.cookie, 'session_id');

    if (!sessionId) { raw.close(4001, 'Unauthorized'); return; }

    let authUser: Awaited<ReturnType<typeof resolveSession>>;
    try {
      authUser = await resolveSession(sessionId);
    } catch {
      raw.close(4001, 'Unauthorized');
      return;
    }

    const ticket = await app.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) { raw.close(4004, 'Not found'); return; }
    if (!authUser.isSpecialist && ticket.userId !== authUser.user_id) {
      raw.close(4003, 'Forbidden');
      return;
    }

    register(ticketId, raw);

    const pingInterval = setInterval(() => {
      if (raw.readyState === 1) raw.ping();
    }, 30_000);

    // Держим промис живым до закрытия сокета.
    // Без этого async-хендлер завершается и @fastify/websocket закрывает соединение.
    await new Promise<void>((resolve) => {
      const cleanup = () => {
        clearInterval(pingInterval);
        unregister(ticketId, raw);
        resolve();
      };
      socket.on('close', cleanup);
      socket.on('error', cleanup);
    });
  });

  app.get('/v1/ws', { websocket: true }, async (socket, req) => {
    const raw = extractRawWs(socket);

    const sessionId =
      (req.headers['session_id'] as string | undefined) ||
      getCookieValue(req.headers.cookie, 'session_id');

    if (!sessionId) { raw.close(4001, 'Unauthorized'); return; }

    let authUser: Awaited<ReturnType<typeof resolveSession>>;
    try {
      authUser = await resolveSession(sessionId);
    } catch {
      raw.close(4001, 'Unauthorized');
      return;
    }

    if (authUser.isSpecialist) {
      registerSpecialist(raw);
    }
    registerUser(authUser.user_id, raw);

    const pingInterval = setInterval(() => {
      if (raw.readyState === 1) raw.ping();
    }, 30_000);

    await new Promise<void>((resolve) => {
      const cleanup = () => {
        clearInterval(pingInterval);
        if (authUser.isSpecialist) {
          unregisterSpecialist(raw);
        }
        unregisterUser(authUser.user_id, raw);
        resolve();
      };
      socket.on('close', cleanup);
      socket.on('error', cleanup);
    });
  });
}
