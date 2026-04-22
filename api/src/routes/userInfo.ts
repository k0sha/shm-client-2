import type { FastifyInstance } from 'fastify';
import { requireSpecialist } from '../middleware/auth.js';
import { fetchShmUser, fetchShmUserServices } from '../lib/shm.js';

export default async function userInfoRoutes(app: FastifyInstance) {
  // GET /v1/users/:userId/info — specialist only, fetches live data from SHM
  app.get('/v1/users/:userId/info', { preHandler: requireSpecialist }, async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const id = Number(userId);
    if (isNaN(id)) return reply.status(400).send({ error: 'Invalid userId' });

    const [user, services] = await Promise.all([
      fetchShmUser(id),
      fetchShmUserServices(id),
    ]);

    if (!user) return reply.status(404).send({ error: 'User not found in SHM' });

    return {
      user_id: user.user_id,
      login: user.login,
      login2: user.login2,
      full_name: user.full_name,
      balance: user.balance,
      bonuses: user.credit,
      discount: user.discount,
      services: services.map((s) => ({
        user_service_id: s.user_service_id,
        name: s.name,
        status: s.status,
        expire: s.expire,
      })),
    };
  });
}
