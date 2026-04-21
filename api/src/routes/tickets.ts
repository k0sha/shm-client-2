import type { FastifyInstance } from 'fastify';
import { requireAuth, requireSpecialist } from '../middleware/auth.js';

export default async function ticketRoutes(app: FastifyInstance) {
  // GET /v1/tickets — user sees own, specialist sees all
  app.get('/v1/tickets', { preHandler: requireAuth }, async (req, reply) => {
    const { user_id, isSpecialist } = req.authUser;
    const query = req.query as { status?: string; search?: string };

    const where: Record<string, unknown> = {};
    if (!isSpecialist) where.userId = user_id;
    if (query.status) where.status = query.status;

    const tickets = await app.prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { text: true, createdAt: true },
        },
      },
    });

    return tickets;
  });

  // POST /v1/tickets — create
  app.post('/v1/tickets', { preHandler: requireAuth }, async (req, reply) => {
    const { user_id } = req.authUser;
    const body = req.body as { type: string; message?: string };

    if (!body.type) return reply.status(400).send({ error: 'type required' });

    const ticket = await app.prisma.ticket.create({
      data: {
        userId: user_id,
        type: body.type,
        status: 'open',
        messages: body.message?.trim()
          ? {
              create: {
                authorId: user_id,
                isSpecialist: false,
                text: body.message.trim(),
              },
            }
          : undefined,
      },
      include: { messages: true },
    });

    return reply.status(201).send(ticket);
  });

  // GET /v1/tickets/:id — get with all messages + attachments
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

    return ticket;
  });

  // PATCH /v1/tickets/:id — update status or assignedTo
  app.patch('/v1/tickets/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { user_id, isSpecialist, full_name, login } = req.authUser;
    const body = req.body as { status?: string; assignedTo?: string };

    const ticket = await app.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return reply.status(404).send({ error: 'Not found' });
    if (!isSpecialist && ticket.userId !== user_id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;

    // Specialist taking ticket into work
    if (isSpecialist && body.assignedTo === 'me') {
      data.assignedTo = full_name ?? login;
      data.status = 'in_progress';
    }

    const updated = await app.prisma.ticket.update({ where: { id }, data });
    return updated;
  });

  // DELETE /v1/tickets/:id — specialist only
  app.delete('/v1/tickets/:id', { preHandler: requireSpecialist }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.ticket.delete({ where: { id } });
    return reply.status(204).send();
  });
}
