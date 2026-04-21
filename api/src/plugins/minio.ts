import fp from 'fastify-plugin';
import { Client as MinioClient } from 'minio';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    minio: MinioClient;
    minioBucket: string;
  }
}

export default fp(async (app: FastifyInstance) => {
  const bucket = process.env.MINIO_BUCKET ?? 'support';

  const minio = new MinioClient({
    endPoint: process.env.MINIO_ENDPOINT ?? 'minio',
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? '',
    secretKey: process.env.MINIO_SECRET_KEY ?? '',
  });

  const exists = await minio.bucketExists(bucket);
  if (!exists) await minio.makeBucket(bucket);

  app.decorate('minio', minio);
  app.decorate('minioBucket', bucket);
});
