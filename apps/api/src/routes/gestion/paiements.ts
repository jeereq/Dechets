import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { exigerPoste, pagination } from '../../lib/acces.js';
import { ErreurMetier, lire } from '../../lib/erreurs.js';
import { prisma } from '../../prisma.js';
import { confirmerPaiement, echouerPaiement } from '../../services/paiements.js';

const filtres = z.object({
  statut: z.enum(['EN_ATTENTE', 'RECU', 'A_RAPPROCHER', 'ECHEC']).optional(),
  mode: z.enum(['AIRTEL_MONEY', 'ORANGE_MONEY', 'M_PESA', 'AFRIMONEY', 'CARTE', 'CASH', 'VIREMENT']).optional(),
  q: z.string().trim().max(60).optional(),
});

export async function paiementsGestion(app: FastifyInstance) {
  const chef = { preHandler: exigerPoste('SUPERVISEUR') };

  app.get('/paiements', async (request, reply) => {
    const f = lire(filtres, request.query);
    const { take, skip, page, taille } = pagination(request.query);
    const where: Prisma.PaiementWhereInput = {
      ...(f.statut ? { statut: f.statut } : {}),
      ...(f.mode ? { mode: f.mode } : {}),
      ...(f.q
        ? {
            OR: [
              { reference: { contains: f.q, mode: 'insensitive' } },
              { menage: { nom: { contains: f.q, mode: 'insensitive' } } },
              { menage: { code: { contains: f.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [total, somme, lignes] = await Promise.all([
      prisma.paiement.count({ where }),
      prisma.paiement.aggregate({ _sum: { montant: true }, where: { ...where, statut: f.statut ?? 'RECU' } }),
      prisma.paiement.findMany({
        where,
        orderBy: { creeLe: 'desc' },
        take,
        skip,
        include: { menage: { select: { id: true, code: true, nom: true } }, agent: { select: { nom: true } } },
      }),
    ]);
    return reply.send({
      data: {
        total,
        page,
        taille,
        somme: somme._sum.montant ?? 0,
        elements: lignes.map((p) => ({
          id: p.id,
          reference: p.reference,
          montant: p.montant,
          mode: p.mode,
          objet: p.objet,
          statut: p.statut,
          creeLe: p.creeLe,
          menage: p.menage,
          agent: p.agent?.nom ?? null,
        })),
      },
    });
  });

  /**
   * Rapproche un virement avec le releve bancaire. Un paiement mobile ou carte
   * ne se confirme jamais a la main : seul FlexPay en fait foi.
   */
  app.post('/paiements/:id/confirmer', chef, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const p = await prisma.paiement.findUnique({ where: { id } });
    if (!p) throw new ErreurMetier(404, 'Paiement introuvable');
    if (!['VIREMENT', 'CASH'].includes(p.mode)) {
      throw new ErreurMetier(409, 'Un paiement mobile ou par carte est confirme par FlexPay, pas a la main.');
    }
    const resultat = await confirmerPaiement(id);
    return reply.send({ data: { id, resultat } });
  });

  app.post('/paiements/:id/rejeter', chef, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const p = await prisma.paiement.findUnique({ where: { id } });
    if (!p) throw new ErreurMetier(404, 'Paiement introuvable');
    if (!['VIREMENT', 'CASH'].includes(p.mode) || p.statut === 'RECU') {
      throw new ErreurMetier(409, 'Ce paiement ne peut pas etre rejete.');
    }
    await echouerPaiement(id);
    return reply.send({ data: { id, statut: 'ECHEC' } });
  });
}
