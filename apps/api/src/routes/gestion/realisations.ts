import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { exigerPoste } from '../../lib/acces.js';
import { ErreurMetier, lire } from '../../lib/erreurs.js';
import { prisma } from '../../prisma.js';

const corps = z.object({
  lieu: z.string().trim().min(2).max(160),
  date: z.coerce.date(),
  legende: z.string().trim().max(400).nullable().optional(),
  photoAvant: z.string().trim().max(300).nullable().optional(),
  photoApres: z.string().trim().max(300).nullable().optional(),
  publiee: z.boolean().optional(),
});

export async function realisationsGestion(app: FastifyInstance) {
  const chef = { preHandler: exigerPoste('SUPERVISEUR') };

  app.get('/realisations', chef, async (_request, reply) => {
    return reply.send({ data: await prisma.realisation.findMany({ orderBy: { date: 'desc' }, take: 100 }) });
  });

  app.post('/realisations', chef, async (request, reply) => {
    const r = await prisma.realisation.create({ data: lire(corps, request.body) });
    return reply.status(201).send({ data: r });
  });

  app.patch('/realisations/:id', chef, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    try {
      const r = await prisma.realisation.update({ where: { id }, data: lire(corps.partial(), request.body) });
      return reply.send({ data: r });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new ErreurMetier(404, 'Realisation introuvable');
      }
      throw e;
    }
  });

  app.delete('/realisations/:id', chef, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    await prisma.realisation.deleteMany({ where: { id } });
    return reply.send({ data: { id } });
  });
}
