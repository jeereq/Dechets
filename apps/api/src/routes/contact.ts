import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const corpsContact = z.object({
  nom: z.string().trim().min(2, 'Nom trop court').max(120),
  telephone: z.string().trim().min(9).max(20),
  email: z.string().trim().email('Adresse e-mail invalide').optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Message trop court').max(2000),
});

export async function contactRoutes(app: FastifyInstance) {
  app.post('/contact', async (request, reply) => {
    const parsed = corpsContact.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        erreur: 'Donnees invalides',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { nom, telephone, email, message } = parsed.data;

    const enregistre = await prisma.messageContact.create({
      data: { nom, telephone, email: email || null, message },
      select: { id: true },
    });

    return reply.status(201).send({ data: { id: enregistre.id } });
  });
}
