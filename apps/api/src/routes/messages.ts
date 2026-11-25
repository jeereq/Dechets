import type { FastifyInstance } from 'fastify';
import { exiger, sessionDe } from '../lib/session.js';
import { prisma } from '../prisma.js';

export async function messagesRoutes(app: FastifyInstance) {
  /**
   * Les messages envoyes au menage (SMS et WhatsApp), du plus recent au plus
   * ancien. L'application les affiche comme une conversation.
   */
  app.get('/messages', { preHandler: exiger('MENAGE') }, async (request, reply) => {
    const session = sessionDe(request);
    const messages = await prisma.notification.findMany({
      where: { menageId: session.id as string },
      orderBy: { creeLe: 'desc' },
      take: 60,
      select: { id: true, canal: true, modele: true, contenu: true, statut: true, creeLe: true },
    });
    return reply.send({ data: messages });
  });
}
