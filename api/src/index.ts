import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import prismaPlugin from './plugins/prisma.js';
import minioPlugin from './plugins/minio.js';
import ticketRoutes from './routes/tickets.js';
import messageRoutes from './routes/messages.js';
import attachmentRoutes from './routes/attachments.js';
import userInfoRoutes from './routes/userInfo.js';
import fileRoutes from './routes/files.js';
import wsRoutes from './routes/ws.js';

const app = Fastify({ logger: true });

await app.register(cookie);
await app.register(cors, { origin: process.env.CORS_ORIGIN ?? true, credentials: true });
await app.register(multipart);
await app.register(websocket);
await app.register(prismaPlugin);
await app.register(minioPlugin);

await app.register(ticketRoutes);
await app.register(messageRoutes);
await app.register(attachmentRoutes);
await app.register(userInfoRoutes);
await app.register(fileRoutes);
await app.register(wsRoutes);

app.get('/health', async () => ({ ok: true }));

await app.listen({ port: Number(process.env.PORT ?? 3002), host: '0.0.0.0' });
