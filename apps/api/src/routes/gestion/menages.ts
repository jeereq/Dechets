import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { exigerPoste, pagination } from '../../lib/acces.js';
import { ErreurMetier, lire } from '../../lib/erreurs.js';
import { prisma } from '../../prisma.js';

const filtres = z.object({
  q: z.string().trim().max(80).optional(),
  communeSlug: z.string().trim().optional(),
  statut: z.enum(['ACTIF', 'SUSPENDU', 'RESILIE']).optional(),
});

const corpsMaj = z
  .object({
    statut: z.enum(['ACTIF', 'SUSPENDU', 'RESILIE']),
    equipeId: z.string().min(1).nullable(),
    formule: z.enum(['PAR_PASSAGE', 'MENSUELLE']),
    nom: z.string().trim().min(2).max(120),
    repere: z.string().trim().max(200).nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Rien a modifier');

export async function menagesGestion(app: FastifyInstance) {
  app.get('/menages', async (request, reply) => {
    const f = lire(filtres, request.query);
    const { take, skip, page, taille } = pagination(request.query);

    const where: Prisma.MenageWhereInput = {
      ...(f.statut ? { statut: f.statut } : {}),
      ...(f.communeSlug ? { commune: { slug: f.communeSlug } } : {}),
      ...(f.q
        ? {
            OR: [
              { nom: { contains: f.q, mode: 'insensitive' } },
              { code: { contains: f.q, mode: 'insensitive' } },
              { telephone: { contains: f.q.replace(/\s/g, '') } },
              { avenue: { contains: f.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, lignes] = await Promise.all([
      prisma.menage.count({ where }),
      prisma.menage.findMany({
        where,
        orderBy: { creeLe: 'desc' },
        take,
        skip,
        include: { commune: { select: { nom: true, slug: true } }, equipe: { select: { id: true, nom: true } } },
      }),
    ]);

    return reply.send({
      data: {
        total,
        page,
        taille,
        elements: lignes.map((m) => ({
          id: m.id,
          code: m.code,
          nom: m.nom,
          telephone: m.telephone,
          commune: m.commune,
          avenue: m.avenue,
          parcelle: m.parcelle,
          formule: m.formule,
          credit: m.credit,
          statut: m.statut,
          equipe: m.equipe,
          creeLe: m.creeLe,
        })),
      },
    });
  });

  app.get('/menages/:id', async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const m = await prisma.menage.findUnique({
      where: { id },
      include: {
        commune: { select: { nom: true, slug: true } },
        equipe: { select: { id: true, nom: true } },
        demandes: { orderBy: { creeLe: 'desc' }, take: 15 },
        paiements: { orderBy: { creeLe: 'desc' }, take: 15 },
        passages: { orderBy: { date: 'desc' }, take: 15 },
        notifications: { orderBy: { creeLe: 'desc' }, take: 10 },
      },
    });
    if (!m) throw new ErreurMetier(404, 'Abonne introuvable');
    return reply.send({ data: m });
  });

  app.patch('/menages/:id', { preHandler: exigerPoste('SUPERVISEUR') }, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const corps = lire(corpsMaj, request.body);
    if (corps.equipeId) {
      const equipe = await prisma.equipe.findUnique({ where: { id: corps.equipeId } });
      if (!equipe) throw new ErreurMetier(404, 'Equipe introuvable');
    }
    try {
      const m = await prisma.menage.update({ where: { id }, data: corps });
      return reply.send({ data: { id: m.id, statut: m.statut, equipeId: m.equipeId, formule: m.formule } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new ErreurMetier(404, 'Abonne introuvable');
      }
      throw e;
    }
  });
}
