import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ErreurMetier, lire } from '../lib/erreurs.js';
import { lireReglageEntier } from '../lib/prix.js';
import { prochaineReference } from '../lib/references.js';
import { exiger, sessionDe } from '../lib/session.js';
import { prisma } from '../prisma.js';
import { alerterMenage } from '../services/alertes.js';

const DEMANDES_OUVERTES_MAX = 3;
const JOURS_A_L_AVANCE_MAX = 30;

const corpsDemande = z
  .object({
    type: z.enum(['DES_QUE_POSSIBLE', 'JOUR_PRECIS', 'PROCHAIN_PASSAGE']),
    dateSouhaitee: z.coerce.date().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type !== 'JOUR_PRECIS') return;
    if (!v.dateSouhaitee) {
      ctx.addIssue({ code: 'custom', path: ['dateSouhaitee'], message: 'Choisissez un jour' });
      return;
    }
    const demain = new Date();
    demain.setHours(0, 0, 0, 0);
    demain.setDate(demain.getDate() + 1);
    const limite = new Date(demain);
    limite.setDate(limite.getDate() + JOURS_A_L_AVANCE_MAX);
    if (v.dateSouhaitee < demain || v.dateSouhaitee > limite) {
      ctx.addIssue({
        code: 'custom',
        path: ['dateSouhaitee'],
        message: `Choisissez un jour entre demain et dans ${JOURS_A_L_AVANCE_MAX} jours`,
      });
    }
  });

const present = (d: {
  id: string;
  reference: string;
  type: string;
  dateSouhaitee: Date | null;
  statut: string;
  datePlanifiee: Date | null;
  cout: number;
  creeLe: Date;
}) => ({
  id: d.id,
  reference: d.reference,
  type: d.type,
  dateSouhaitee: d.dateSouhaitee,
  statut: d.statut,
  datePlanifiee: d.datePlanifiee,
  cout: d.cout,
  creeLe: d.creeLe,
});

export async function demandesRoutes(app: FastifyInstance) {
  /** Ce que coute un passage en plus, et ce qui reste apres : sert a l'ecran « Verifier ». */
  app.get('/demandes/apercu', { preHandler: exiger('MENAGE') }, async (request, reply) => {
    const session = sessionDe(request);
    const [cout, menage] = await Promise.all([
      lireReglageEntier('prix_par_passage'),
      prisma.menage.findUniqueOrThrow({ where: { id: session.id as string }, select: { credit: true } }),
    ]);
    return reply.send({
      data: { cout, credit: menage.credit, resteApres: Math.max(menage.credit - cout, 0), suffisant: menage.credit >= cout },
    });
  });

  app.get('/demandes', { preHandler: exiger('MENAGE') }, async (request, reply) => {
    const session = sessionDe(request);
    const demandes = await prisma.demandeCollecte.findMany({
      where: { menageId: session.id as string },
      orderBy: { creeLe: 'desc' },
      take: 50,
    });
    return reply.send({ data: demandes.map(present) });
  });

  /**
   * Demande d'un passage en plus. Le cout est debite du credit tout de suite
   * (et rendu si la demande est annulee) : pas de dette a recouvrer ensuite.
   */
  app.post('/demandes', { preHandler: exiger('MENAGE') }, async (request, reply) => {
    const session = sessionDe(request);
    const menageId = session.id as string;
    const corps = lire(corpsDemande, request.body);
    const cout = await lireReglageEntier('prix_par_passage');

    const demande = await prisma.$transaction(async (tx) => {
      const menage = await tx.menage.findUniqueOrThrow({ where: { id: menageId } });
      if (menage.statut !== 'ACTIF') {
        throw new ErreurMetier(403, "Votre compte n'est pas actif. Contactez le service.");
      }

      const ouvertes = await tx.demandeCollecte.count({
        where: { menageId, statut: { in: ['RECUE', 'PLANIFIEE'] } },
      });
      if (ouvertes >= DEMANDES_OUVERTES_MAX) {
        throw new ErreurMetier(409, `Vous avez deja ${DEMANDES_OUVERTES_MAX} demandes en cours.`);
      }

      // Debit atomique : deux demandes simultanees ne peuvent pas depenser deux fois le meme credit.
      const debit = await tx.menage.updateMany({
        where: { id: menageId, credit: { gte: cout } },
        data: { credit: { decrement: cout } },
      });
      if (debit.count === 0) {
        throw new ErreurMetier(402, 'Votre credit est insuffisant. Rechargez-le pour demander un passage.', {
          cout,
          credit: menage.credit,
          manque: cout - menage.credit,
        });
      }

      return tx.demandeCollecte.create({
        data: {
          reference: await prochaineReference(tx, 'DM'),
          menageId,
          type: corps.type,
          dateSouhaitee: corps.type === 'JOUR_PRECIS' ? corps.dateSouhaitee : null,
          equipeId: menage.equipeId,
          cout,
        },
      });
    });

    const menage = await prisma.menage.findUniqueOrThrow({ where: { id: menageId } });
    void alerterMenage(menage, 'demande_recue', { reference: demande.reference });

    return reply.status(201).send({ data: { ...present(demande), credit: menage.credit } });
  });

  app.post('/demandes/:id/annuler', { preHandler: exiger('MENAGE') }, async (request, reply) => {
    const session = sessionDe(request);
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);

    const demande = await prisma.$transaction(async (tx) => {
      // La transition RECUE/PLANIFIEE -> ANNULEE ne reussit qu'une fois : pas de double remboursement.
      const change = await tx.demandeCollecte.updateMany({
        where: { id, menageId: session.id as string, statut: { in: ['RECUE', 'PLANIFIEE'] } },
        data: { statut: 'ANNULEE' },
      });
      if (change.count === 0) return null;

      const d = await tx.demandeCollecte.findUniqueOrThrow({ where: { id } });
      if (d.cout > 0) {
        await tx.menage.update({ where: { id: d.menageId }, data: { credit: { increment: d.cout } } });
      }
      return d;
    });

    if (!demande) {
      const existe = await prisma.demandeCollecte.findFirst({ where: { id, menageId: session.id as string } });
      throw existe
        ? new ErreurMetier(409, 'Cette demande ne peut plus etre annulee.')
        : new ErreurMetier(404, 'Demande introuvable');
    }

    const menage = await prisma.menage.findUniqueOrThrow({ where: { id: session.id as string } });
    void alerterMenage(menage, 'demande_annulee', { reference: demande.reference, montant: String(demande.cout) });

    return reply.send({ data: { ...present(demande), credit: menage.credit } });
  });
}
