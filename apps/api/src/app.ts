import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import { corsOrigins, env } from './env.js';
import { communesRoutes } from './routes/communes.js';
import { contactRoutes } from './routes/contact.js';
import { leadsRoutes } from './routes/leads.js';
import { reglagesRoutes } from './routes/reglages.js';

export async function construireApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
          : undefined,
    },
  });

  await app.register(sensible);
  await app.register(cors, { origin: corsOrigins, credentials: true });

  app.get('/health', async () => ({
    data: { statut: 'ok', service: 'benime-api', heure: new Date().toISOString() },
  }));

  await app.register(communesRoutes);
  await app.register(leadsRoutes);
  await app.register(contactRoutes);
  await app.register(reglagesRoutes);

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({ erreur: `Route inconnue : ${request.method} ${request.url}` });
  });

  return app;
}
