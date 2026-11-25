import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { agentDe, exigerPoste } from '../../lib/acces.js';
import { ErreurMetier, lire } from '../../lib/erreurs.js';
import { telephoneSchema } from '../../lib/telephone.js';
import { prisma } from '../../prisma.js';

const POSTES = ['SUPERVISEUR', 'CHAUFFEUR', 'EBOUEUR', 'RECOUVREMENT'] as const;

export async function personnelGestion(app: FastifyInstance) {
  const chef = { preHandler: exigerPoste('SUPERVISEUR') };

  app.get('/personnel', chef, async (_request, reply) => {
    const gens = await prisma.personnel.findMany({
      orderBy: [{ actif: 'desc' }, { nom: 'asc' }],
      include: { equipe: { select: { id: true, nom: true } } },
    });
    return reply.send({
      data: gens.map((g) => ({
        id: g.id,
        nom: g.nom,
        telephone: g.telephone,
        poste: g.poste,
        actif: g.actif,
        equipe: g.equipe,
      })),
    });
  });

  app.post('/personnel', chef, async (request, reply) => {
    const corps = lire(
      z.object({
        nom: z.string().trim().min(2).max(120),
        telephone: telephoneSchema,
        poste: z.enum(POSTES),
        equipeId: z.string().min(1).nullable().optional(),
      }),
      request.body,
    );
    try {
      const g = await prisma.personnel.create({ data: { ...corps, equipeId: corps.equipeId ?? null } });
      return reply.status(201).send({ data: { id: g.id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ErreurMetier(409, 'Ce numero est deja enregistre.');
      }
      throw e;
    }
  });

  app.patch('/personnel/:id', chef, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const moi = agentDe(request);
    const corps = lire(
      z
        .object({
          nom: z.string().trim().min(2).max(120),
          poste: z.enum(POSTES),
          actif: z.boolean(),
          equipeId: z.string().min(1).nullable(),
        })
        .partial()
        .refine((v) => Object.keys(v).length > 0, 'Rien a modifier'),
      request.body,
    );

    // On ne peut pas se couper soi-meme l'acces : il faut toujours un superviseur.
    if (id === moi.id && (corps.actif === false || (corps.poste && corps.poste !== 'SUPERVISEUR'))) {
      throw new ErreurMetier(409, 'Vous ne pouvez pas retirer votre propre acces.');
    }
    try {
      await prisma.personnel.update({ where: { id }, data: corps });
      return reply.send({ data: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new ErreurMetier(404, 'Membre introuvable');
      }
      throw e;
    }
  });
}
