import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';

const PRESIGNED_EXPIRY_SEC = 60 * 60; // 1 hour

export default async function attachmentRoutes(app: FastifyInstance) {
  // GET /v1/attachments/:id — returns presigned URL for download
  app.get('/v1/attachments/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { user_id, isSpecialist } = req.authUser;

    const attachment = await app.prisma.attachment.findUnique({
      where: { id },
      include: { message: { include: { ticket: true } } },
    });

    if (!attachment) return reply.status(404).send({ error: 'Not found' });

    const ticket = attachment.message.ticket;
    if (!isSpecialist && ticket.userId !== user_id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const url = await app.minio.presignedGetObject(
      app.minioBucket,
      attachment.minioKey,
      PRESIGNED_EXPIRY_SEC,
    );

    return { url, filename: attachment.filename, mimeType: attachment.mimeType };
  });
}
