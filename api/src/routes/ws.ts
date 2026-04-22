import type { FastifyInstance } from 'fastify';
import { resolveSession } from '../middleware/auth.js';
import { register, unregister } from '../ws/registry.js';

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
    const { id: ticketId } = req.params as { id: string };

    const sessionId =
      (req.headers['session_id'] as string | undefined) ??
      getCookieValue(req.headers.cookie, 'session_id');

    if (!sessionId) { socket.close(4001, 'Unauthorized'); return; }

    let authUser: Awaited<ReturnType<typeof resolveSession>>;
    try {
      authUser = await resolveSession(sessionId);
    } catch {
      socket.close(4001, 'Unauthorized');
      return;
    }

    const ticket = await app.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) { socket.close(4004, 'Not found'); return; }
    if (!authUser.isSpecialist && ticket.userId !== authUser.user_id) {
      socket.close(4003, 'Forbidden');
      return;
    }

    register(ticketId, socket);

    const pingInterval = setInterval(() => {
      if (socket.readyState === 1) socket.ping();
    }, 30_000);

    socket.on('close', () => {
      clearInterval(pingInterval);
      unregister(ticketId, socket);
    });

    socket.on('error', () => {
      clearInterval(pingInterval);
      unregister(ticketId, socket);
    });
  });
}
