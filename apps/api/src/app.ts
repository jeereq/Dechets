import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import { corsOrigins, env } from './env.js';
import { gestionnaireErreurs } from './lib/erreurs.js';
import { authRoutes } from './routes/auth.js';
import { communesRoutes } from './routes/communes.js';
import { contactRoutes } from './routes/contact.js';
import { demandesRoutes } from './routes/demandes.js';
import { leadsRoutes } from './routes/leads.js';
import { menagesRoutes } from './routes/menages.js';
import { messagesRoutes } from './routes/messages.js';
import { paiementsRoutes } from './routes/paiements.js';
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

  // Avant les routes : les modules enregistres heritent du gestionnaire.
  app.setErrorHandler(gestionnaireErreurs);

  await app.register(sensible);
  await app.register(cors, { origin: corsOrigins, credentials: true });

  app.get('/health', async () => ({
    data: { statut: 'ok', service: 'benime-api', heure: new Date().toISOString() },
  }));

  await app.register(communesRoutes);
  await app.register(leadsRoutes);
  await app.register(contactRoutes);
  await app.register(reglagesRoutes);
  await app.register(authRoutes);
  await app.register(menagesRoutes);
  await app.register(demandesRoutes);
  await app.register(messagesRoutes);
  await app.register(paiementsRoutes);

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({ erreur: `Route inconnue : ${request.method} ${request.url}` });
  });

  return app;
}
