import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { broadcast } from '../ws/registry.js';
import { notifyUser, notifySpecialists } from '../ws/notifyRegistry.js';
import { notifyWebhook } from '../lib/webhook.js';
import { randomUUID } from 'crypto';
import path from 'path';

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const FILES_PATH = process.env.FILES_PUBLIC_PATH ?? '/shm_support/v1/files';

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/heic', 'image/heif',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  // Archives
  'application/zip', 'application/x-zip-compressed',
  // macOS installers
  'application/x-apple-diskimage',
  'application/x-newton-compatible-pkg',
  // Windows installers
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msi',
  // Linux installers
  'application/vnd.debian.binary-package',
  'application/x-rpm',
  'application/x-executable',
  // Android
  'application/vnd.android.package-archive',
  // Mobile browsers often send this for any file type
  'application/octet-stream',
]);

// All allowed extensions — used as fallback when MIME is application/octet-stream
const ALLOWED_OCTET_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
  '.pdf', '.doc', '.docx', '.txt',
  '.zip',
  '.dmg', '.pkg', '.exe', '.msi', '.deb', '.rpm', '.appimage', '.apk',
]);

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
        const ext = path.extname(part.filename || '').toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(part.mimetype)) {
          return reply.status(400).send({ error: `File type not allowed: ${part.mimetype}` });
        }
        if (part.mimetype === 'application/octet-stream' && !ALLOWED_OCTET_EXTENSIONS.has(ext)) {
          return reply.status(400).send({ error: `File type not allowed: ${ext}` });
        }
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
      ticket_id: ticketId,
      ticket_number: ticket.number,
      ticket_type: ticket.type,
      user_login: ticket.userLogin,
    };
    if (isTicketOwner) {
      notifySpecialists({ type: 'new_message', ticketId, isSpecialist, target: 'specialist', lastMessage });
      if (ticket.assignedToId) {
        notifyWebhook({ event: 'support_new_message', ...webhookBase, user_id: ticket.assignedToId });
      } else {
        notifyWebhook({ event: 'support_new_message_unassigned', ...webhookBase, user_id: ticket.userId });
      }
    } else {
      notifyUser(ticket.userId, { type: 'new_message', ticketId, isSpecialist, target: 'user', lastMessage });
      notifyWebhook({ event: 'support_new_message', ...webhookBase, user_id: ticket.userId });
    }

    return reply.status(201).send({ ...message, isOwn: true });
  });
}
