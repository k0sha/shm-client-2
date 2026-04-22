import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';

export default async function fileRoutes(app: FastifyInstance) {
  app.get('/v1/files/*', { preHandler: requireAuth }, async (req, reply) => {
    const key = (req.params as { '*': string })['*'];

    let stat;
    try {
      stat = await app.minio.statObject(app.minioBucket, key);
    } catch {
      return reply.status(404).send({ error: 'Not found' });
    }

    const stream = await app.minio.getObject(app.minioBucket, key);
    reply.header('Content-Type', stat.metaData?.['content-type'] ?? 'application/octet-stream');
    reply.header('Content-Length', stat.size);
    reply.header('Cache-Control', 'private, max-age=3600');
    return reply.send(stream);
  });
}
