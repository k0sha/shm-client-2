import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { broadcast } from '../ws/registry.js';
import { notifyUser, notifySpecialists } from '../ws/notifyRegistry.js';
import { notifyWebhook, notifySpecialistsWebhook } from '../lib/webhook.js';
import { randomUUID } from 'crypto';
import path from 'path';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const FILES_PATH = process.env.FILES_PUBLIC_PATH ?? '/shm_support/v1/files';

export default async function messageRoutes(app: FastifyInstance) {
  app.post('/v1/tickets/:id/messages', { preHandler: requireAuth }, async (req, reply) => {
    const { id: ticketId } = req.params as { id: string };
    const { user_id, isSpecialist, login, full_name } = req.authUser;

    const ticket = await app.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return reply.status(404).send({ error: 'Not found' });
    if (!isSpecialist && ticket.userId !== user_id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return reply.status(400).send({ error: 'Ticket is closed' });
    }

    const parts = req.parts({ limits: { fileSize: MAX_FILE_SIZE } });
    let text = '';
    const uploads: { filename: string; minioKey: string; mimeType: string; size: number }[] = [];

    for await (const part of parts) {
      if (part.type === 'field' && part.fieldname === 'text') {
        text = String(part.value);
      } else if (part.type === 'file') {
        const ext = path.extname(part.filename || '');
        const minioKey = `tickets/${ticketId}/${randomUUID()}${ext}`;
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        await app.minio.putObject(app.minioBucket, minioKey, buffer, buffer.length, {
          'Content-Type': part.mimetype,
        });
        uploads.push({ filename: part.filename || 'file', minioKey, mimeType: part.mimetype, size: buffer.length });
      }
    }

    if (!text.trim() && uploads.length === 0) {
      return reply.status(400).send({ error: 'Message or file required' });
    }

    const authorName = full_name ?? login;

    const message = await app.prisma.message.create({
      data: {
        ticketId,
        authorId: user_id,
        authorName,
        isSpecialist,
        text: text.trim() || null,
        attachments: uploads.length > 0 ? { create: uploads } : undefined,
      },
      include: { attachments: true },
    });

    const isTicketOwner = ticket.userId === user_id;
    await app.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
        lastMessage: text.trim() || undefined,
        ...(isTicketOwner
          ? { unreadForSpec: { increment: 1 }, unreadForUser: 0 }
          : { unreadForUser: { increment: 1 }, unreadForSpec: 0 }),
      },
    });

    for (const att of message.attachments) {
      (att as Record<string, unknown>).url = `${FILES_PATH}/${att.minioKey}`;
    }

    broadcast(ticketId, { type: 'message', data: { ...message, isOwn: false } });

    const lastMessage = text.trim() || null;
    const webhookBase = {
      event: 'support_new_message',
      ticket_id: ticketId,
      ticket_number: ticket.number,
      ticket_type: ticket.type,
      message: lastMessage?.slice(0, 200),
    };
    if (isTicketOwner) {
      notifySpecialists({ type: 'new_message', ticketId, isSpecialist, target: 'specialist', lastMessage });
      notifySpecialistsWebhook(webhookBase);
    } else {
      notifyUser(ticket.userId, { type: 'new_message', ticketId, isSpecialist, target: 'user', lastMessage });
      notifyWebhook({ ...webhookBase, user_id: ticket.userId });
    }

    return reply.status(201).send({ ...message, isOwn: true });
  });
}
