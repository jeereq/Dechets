import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { exigerPoste } from '../../lib/acces.js';
import { ErreurMetier, lire } from '../../lib/erreurs.js';
import { prisma } from '../../prisma.js';
import { alerterMenage } from '../../services/alertes.js';

const STATUTS = ['RECUE', 'PLANIFIEE', 'TERMINEE', 'ANNULEE'] as const;

export async function demandesGestion(app: FastifyInstance) {
  const chef = { preHandler: exigerPoste('SUPERVISEUR') };
  const id = (request: unknown) => lire(z.object({ id: z.string().min(1) }), (request as { params: unknown }).params).id;

  app.get('/demandes', async (request, reply) => {
    const { statut } = lire(z.object({ statut: z.enum(STATUTS).optional() }), request.query);
    const demandes = await prisma.demandeCollecte.findMany({
      where: statut ? { statut } : { statut: { in: ['RECUE', 'PLANIFIEE'] } },
      orderBy: [{ statut: 'asc' }, { creeLe: 'asc' }],
      take: 100,
      include: {
        menage: {
          select: { id: true, nom: true, code: true, telephone: true, avenue: true, parcelle: true, repere: true, commune: { select: { nom: true } } },
        },
        equipe: { select: { id: true, nom: true } },
      },
    });
    return reply.send({ data: demandes });
  });

  /** Fixe (ou deplace) le jour du passage et previent le menage. */
  app.post('/demandes/:id/planifier', chef, async (request, reply) => {
    const demandeId = id(request);
    const corps = lire(
      z.object({ datePlanifiee: z.coerce.date(), equipeId: z.string().min(1).nullable().optional() }),
      request.body,
    );

    const change = await prisma.demandeCollecte.updateMany({
      where: { id: demandeId, statut: { in: ['RECUE', 'PLANIFIEE'] } },
      data: {
        statut: 'PLANIFIEE',
        datePlanifiee: corps.datePlanifiee,
        ...(corps.equipeId !== undefined ? { equipeId: corps.equipeId } : {}),
      },
    });
    if (change.count === 0) throw new ErreurMetier(409, 'Cette demande ne peut plus etre planifiee.');

    const demande = await prisma.demandeCollecte.findUniqueOrThrow({
      where: { id: demandeId },
      include: { menage: true },
    });
    const date = corps.datePlanifiee.toLocaleDateString(demande.menage.langue === 'EN' ? 'en-GB' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });
    void alerterMenage(demande.menage, 'demande_planifiee', { reference: demande.reference, date });
    return reply.send({ data: { id: demande.id, statut: demande.statut, datePlanifiee: demande.datePlanifiee } });
  });

  app.post('/demandes/:id/terminer', chef, async (request, reply) => {
    const demandeId = id(request);
    const change = await prisma.demandeCollecte.updateMany({
      where: { id: demandeId, statut: 'PLANIFIEE' },
      data: { statut: 'TERMINEE' },
    });
    if (change.count === 0) throw new ErreurMetier(409, 'Seule une demande planifiee peut etre terminee.');
    return reply.send({ data: { id: demandeId, statut: 'TERMINEE' } });
  });

  /** Annulation par l'equipe : le cout est rendu au credit, comme pour le menage. */
  app.post('/demandes/:id/annuler', chef, async (request, reply) => {
    const demandeId = id(request);
    const demande = await prisma.$transaction(async (tx) => {
      const change = await tx.demandeCollecte.updateMany({
        where: { id: demandeId, statut: { in: ['RECUE', 'PLANIFIEE'] } },
        data: { statut: 'ANNULEE' },
      });
      if (change.count === 0) return null;
      const d = await tx.demandeCollecte.findUniqueOrThrow({ where: { id: demandeId } });
      if (d.cout > 0) await tx.menage.update({ where: { id: d.menageId }, data: { credit: { increment: d.cout } } });
      return d;
    });
    if (!demande) throw new ErreurMetier(409, 'Cette demande ne peut plus etre annulee.');

    const menage = await prisma.menage.findUniqueOrThrow({ where: { id: demande.menageId } });
    void alerterMenage(menage, 'demande_annulee', { reference: demande.reference, montant: String(demande.cout) });
    return reply.send({ data: { id: demande.id, statut: 'ANNULEE' } });
  });
}
