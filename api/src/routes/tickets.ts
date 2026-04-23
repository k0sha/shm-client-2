import type { FastifyInstance } from 'fastify';
import { requireAuth, requireSpecialist } from '../middleware/auth.js';
import { notifyWebhook } from '../lib/webhook.js';
import { notifySpecialists } from '../ws/notifyRegistry.js';

const FILES_PATH = process.env.FILES_PUBLIC_PATH ?? '/shm_support/v1/files';
const VALID_TICKET_TYPES = new Set(['vpn', 'setup', 'payment', 'account', 'other']);
const MAX_TICKETS = 500;

function attachFileUrls(
  messages: Array<{ attachments: Array<{ minioKey: string }> } & Record<string, unknown>>,
) {
  for (const msg of messages) {
    for (const att of msg.attachments) {
      (att as Record<string, unknown>).url = `${FILES_PATH}/${att.minioKey}`;
    }
  }
}

export default async function ticketRoutes(app: FastifyInstance) {
  // GET /v1/tickets
  app.get('/v1/tickets', { preHandler: requireAuth }, async (req) => {
    const { user_id, isSpecialist } = req.authUser;
    const query = req.query as { status?: string; own?: string; limit?: string };

    const where: Record<string, unknown> = {};
    if (!isSpecialist || query.own === 'true') where.userId = user_id;
    if (query.status) where.status = query.status;

    const limit = Math.min(Number(query.limit) || MAX_TICKETS, MAX_TICKETS);

    const tickets = await app.prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        number: true,
        userId: true,
        userLogin: true,
        userLogin2: true,
        userFullName: true,
        type: true,
        status: true,
        assignedTo: true,
        lastMessage: true,
        unreadForUser: true,
        unreadForSpec: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return tickets.map((tk) => ({
      ...tk,
      unread: tk.userId === user_id ? tk.unreadForUser > 0 : tk.unreadForSpec > 0,
    }));
  });

  // POST /v1/tickets
  app.post('/v1/tickets', { preHandler: requireAuth }, async (req, reply) => {
    const { user_id, login, login2, full_name } = req.authUser;
    const body = req.body as { type?: string };

    if (!body.type || !VALID_TICKET_TYPES.has(body.type)) {
      return reply.status(400).send({ error: 'invalid ticket type' });
    }

    const ticket = await app.prisma.ticket.create({
      data: {
        userId: user_id,
        userLogin: login,
        userLogin2: login2 ?? null,
        userFullName: full_name ?? null,
        type: body.type,
        status: 'open',
      },
    });

    notifySpecialists({ type: 'new_ticket', ticket: { ...ticket, unread: true } });

    notifyWebhook({
      event: 'support_new_ticket',
      ticket_id: ticket.id,
      ticket_number: ticket.number,
      ticket_type: ticket.type,
      user_login: ticket.userLogin,
      user_id: ticket.userId,
    });

    return reply.status(201).send(ticket);
  });

  // GET /v1/tickets/:id
  app.get('/v1/tickets/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { user_id, isSpecialist } = req.authUser;

    const ticket = await app.prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true },
        },
      },
    });

    if (!ticket) return reply.status(404).send({ error: 'Not found' });
    if (!isSpecialist && ticket.userId !== user_id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const isTicketOwner = ticket.userId === user_id;
    const wasUnread = isTicketOwner ? ticket.unreadForUser > 0 : ticket.unreadForSpec > 0;
    if (isTicketOwner) {
      if (ticket.unreadForUser > 0) {
        await app.prisma.ticket.update({ where: { id }, data: { unreadForUser: 0 } });
      }
    } else {
      if (ticket.unreadForSpec > 0) {
        await app.prisma.ticket.update({ where: { id }, data: { unreadForSpec: 0 } });
      }
    }

    attachFileUrls(ticket.messages);
    const messagesWithOwn = ticket.messages.map((msg) => ({ ...msg, isOwn: msg.authorId === user_id }));
    return { ...ticket, unreadForUser: 0, unreadForSpec: 0, unread: wasUnread, messages: messagesWithOwn };
  });

  // PATCH /v1/tickets/:id
  app.patch('/v1/tickets/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { user_id, isSpecialist, full_name, login } = req.authUser;
    const body = req.body as { status?: string; take?: boolean };

    const ticket = await app.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return reply.status(404).send({ error: 'Not found' });
    if (!isSpecialist && ticket.userId !== user_id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const data: {
      status?: string;
      assignedTo?: string;
      assignedToId?: number;
    } = {};
    if (body.status) data.status = body.status;
    if (isSpecialist && body.take) {
      data.assignedTo = full_name ?? login;
      data.assignedToId = user_id;
      data.status = 'in_progress';
    }

    const updated = await app.prisma.ticket.update({ where: { id }, data });

    if (data.status) {
      notifyWebhook({
        event: 'support_status_changed',
        ticket_id: ticket.id,
        ticket_number: ticket.number,
        ticket_type: ticket.type,
        status: updated.status,
        user_id: ticket.userId,
      });
    }

    return updated;
  });

  // DELETE /v1/tickets/:id
  app.delete('/v1/tickets/:id', { preHandler: requireSpecialist }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.ticket.delete({ where: { id } });
    return reply.status(204).send();
  });
}
