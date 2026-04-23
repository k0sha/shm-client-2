import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';

export default async function fileRoutes(app: FastifyInstance) {
  app.get('/v1/files/*', { preHandler: requireAuth }, async (req, reply) => {
    const key = (req.params as { '*': string })['*'];
    const { user_id, isSpecialist } = req.authUser;

    const attachment = await app.prisma.attachment.findFirst({
      where: { minioKey: key },
      include: { message: { select: { ticket: { select: { userId: true } } } } },
    });

    if (!attachment) return reply.status(404).send({ error: 'Not found' });

    if (!isSpecialist && attachment.message.ticket.userId !== user_id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    let stat;
    try {
      stat = await app.minio.statObject(app.minioBucket, key);
    } catch {
      return reply.status(404).send({ error: 'Not found' });
    }

    const stream = await app.minio.getObject(app.minioBucket, key);
    const filename = key.split('/').pop() ?? 'file';
    reply.header('Content-Type', stat.metaData?.['content-type'] ?? 'application/octet-stream');
    reply.header('Content-Length', stat.size);
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    reply.header('Cache-Control', 'private, max-age=3600');
    return reply.send(stream);
  });
}
