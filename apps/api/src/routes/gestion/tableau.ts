import type { FastifyInstance } from 'fastify';
import { prisma } from '../../prisma.js';

export async function tableauGestion(app: FastifyInstance) {
  /** Les chiffres du jour : ce qui demande une action d'abord. */
  app.get('/tableau', async (_request, reply) => {
    const maintenant = new Date();
    const debutMois = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));
    const il7Jours = new Date(maintenant.getTime() - 6 * 24 * 3600 * 1000);
    il7Jours.setUTCHours(0, 0, 0, 0);

    const [
      menagesActifs,
      demandesARecevoir,
      demandesPlanifiees,
      passagesAValider,
      paiementsARapprocher,
      encaisseMois,
      communesOuvertes,
      leadsEnAttente,
      contactsATraiter,
      creditTotal,
      recents,
      dernieresDemandes,
    ] = await Promise.all([
      prisma.menage.count({ where: { statut: 'ACTIF' } }),
      prisma.demandeCollecte.count({ where: { statut: 'RECUE' } }),
      prisma.demandeCollecte.count({ where: { statut: 'PLANIFIEE' } }),
      prisma.passage.count({ where: { statut: 'FAIT' } }),
      prisma.paiement.count({ where: { statut: 'A_RAPPROCHER' } }),
      prisma.paiement.aggregate({ _sum: { montant: true }, where: { statut: 'RECU', modifieLe: { gte: debutMois } } }),
      prisma.commune.count({ where: { statut: 'OUVERTE' } }),
      prisma.lead.count({ where: { prevenuLe: null } }),
      prisma.messageContact.count({ where: { traiteLe: null } }),
      prisma.menage.aggregate({ _sum: { credit: true } }),
      prisma.paiement.findMany({
        where: { statut: 'RECU', modifieLe: { gte: il7Jours } },
        select: { montant: true, modifieLe: true },
      }),
      prisma.demandeCollecte.findMany({
        where: { statut: 'RECUE' },
        orderBy: { creeLe: 'asc' },
        take: 6,
        include: { menage: { select: { nom: true, code: true, avenue: true, commune: { select: { nom: true } } } } },
      }),
    ]);

    // Encaissements des sept derniers jours, un total par jour.
    const parJour = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(il7Jours.getTime() + i * 24 * 3600 * 1000);
      parJour.set(d.toISOString().slice(0, 10), 0);
    }
    for (const p of recents) {
      const cle = p.modifieLe.toISOString().slice(0, 10);
      if (parJour.has(cle)) parJour.set(cle, (parJour.get(cle) ?? 0) + p.montant);
    }

    return reply.send({
      data: {
        menagesActifs,
        demandesARecevoir,
        demandesPlanifiees,
        passagesAValider,
        paiementsARapprocher,
        encaisseMois: encaisseMois._sum.montant ?? 0,
        communesOuvertes,
        leadsEnAttente,
        contactsATraiter,
        creditTotal: creditTotal._sum.credit ?? 0,
        serie: [...parJour.entries()].map(([date, montant]) => ({ date, montant })),
        dernieresDemandes: dernieresDemandes.map((d) => ({
          id: d.id,
          reference: d.reference,
          type: d.type,
          dateSouhaitee: d.dateSouhaitee,
          creeLe: d.creeLe,
          menage: d.menage,
        })),
      },
    });
  });
}
