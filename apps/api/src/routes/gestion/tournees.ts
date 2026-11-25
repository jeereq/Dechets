import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { agentDe, exigerPoste, journee } from '../../lib/acces.js';
import { ErreurMetier, lire } from '../../lib/erreurs.js';
import { prisma } from '../../prisma.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ)');

const corpsEquipe = z.object({
  nom: z.string().trim().min(2).max(60),
  vehicule: z.enum(['CAMION', 'TRICYCLE']),
  jours: z.array(z.number().int().min(1).max(7)).max(7),
  communeSlug: z.string().trim().min(1).nullable().optional(),
});

/** 1 = lundi ... 7 = dimanche pour une date AAAA-MM-JJ. */
const jourIso = (date: string) => {
  const j = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return j === 0 ? 7 : j;
};

export async function tourneesGestion(app: FastifyInstance) {
  const chef = { preHandler: exigerPoste('SUPERVISEUR') };

  // --- equipes ---------------------------------------------------------------

  app.get('/equipes', async (_request, reply) => {
    const equipes = await prisma.equipe.findMany({
      orderBy: { nom: 'asc' },
      include: {
        commune: { select: { slug: true, nom: true } },
        membres: { where: { actif: true }, select: { id: true, nom: true, poste: true } },
        _count: { select: { menages: true } },
      },
    });
    return reply.send({
      data: equipes.map((e) => ({
        id: e.id,
        nom: e.nom,
        vehicule: e.vehicule,
        jours: e.jours,
        commune: e.commune,
        membres: e.membres,
        menages: e._count.menages,
      })),
    });
  });

  async function communeId(slug: string | null | undefined) {
    if (!slug) return null;
    const commune = await prisma.commune.findUnique({ where: { slug } });
    if (!commune) throw new ErreurMetier(404, 'Commune inconnue');
    return commune.id;
  }

  app.post('/equipes', chef, async (request, reply) => {
    const corps = lire(corpsEquipe, request.body);
    const equipe = await prisma.equipe.create({
      data: {
        nom: corps.nom,
        vehicule: corps.vehicule,
        jours: [...new Set(corps.jours)].sort(),
        communeId: await communeId(corps.communeSlug),
      },
    });
    return reply.status(201).send({ data: { id: equipe.id } });
  });

  app.patch('/equipes/:id', chef, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const corps = lire(corpsEquipe.partial(), request.body);
    const existe = await prisma.equipe.findUnique({ where: { id } });
    if (!existe) throw new ErreurMetier(404, 'Equipe introuvable');
    await prisma.equipe.update({
      where: { id },
      data: {
        ...(corps.nom ? { nom: corps.nom } : {}),
        ...(corps.vehicule ? { vehicule: corps.vehicule } : {}),
        ...(corps.jours ? { jours: [...new Set(corps.jours)].sort() } : {}),
        ...(corps.communeSlug !== undefined ? { communeId: await communeId(corps.communeSlug) } : {}),
      },
    });
    return reply.send({ data: { id } });
  });

  // --- passages du jour --------------------------------------------------------

  app.get('/passages', async (request, reply) => {
    const { date, equipeId } = lire(
      z.object({ date: dateSchema, equipeId: z.string().min(1).optional() }),
      request.query,
    );
    const { debut, fin } = journee(date);
    const passages = await prisma.passage.findMany({
      where: { date: { gte: debut, lt: fin }, ...(equipeId ? { equipeId } : {}) },
      orderBy: [{ equipeId: 'asc' }, { creeLe: 'asc' }],
      include: {
        menage: { select: { id: true, code: true, nom: true, telephone: true, avenue: true, parcelle: true, repere: true } },
        equipe: { select: { id: true, nom: true } },
        agent: { select: { nom: true } },
      },
    });
    return reply.send({ data: passages });
  });

  /**
   * Prepare la tournee d'un jour : un passage par abonne actif des equipes qui
   * travaillent ce jour-la, plus les demandes planifiees pour cette date.
   * Rejouer la commande ne cree jamais de doublon.
   */
  app.post('/passages/generer', chef, async (request, reply) => {
    const { date } = lire(z.object({ date: dateSchema }), request.body);
    const { debut, fin } = journee(date);
    const jour = jourIso(date);

    const [equipes, demandes, existants] = await Promise.all([
      prisma.equipe.findMany({
        where: { jours: { has: jour } },
        include: { menages: { where: { statut: 'ACTIF' }, select: { id: true } } },
      }),
      prisma.demandeCollecte.findMany({
        where: { statut: 'PLANIFIEE', datePlanifiee: { gte: debut, lt: fin }, equipeId: { not: null } },
        select: { menageId: true, equipeId: true },
      }),
      prisma.passage.findMany({ where: { date: { gte: debut, lt: fin } }, select: { menageId: true } }),
    ]);

    const deja = new Set(existants.map((p) => p.menageId));
    const aCreer: Array<{ menageId: string; equipeId: string }> = [];
    for (const e of equipes) {
      for (const m of e.menages) {
        if (!deja.has(m.id)) {
          deja.add(m.id);
          aCreer.push({ menageId: m.id, equipeId: e.id });
        }
      }
    }
    for (const d of demandes) {
      if (d.equipeId && !deja.has(d.menageId)) {
        deja.add(d.menageId);
        aCreer.push({ menageId: d.menageId, equipeId: d.equipeId });
      }
    }

    if (aCreer.length) {
      await prisma.passage.createMany({ data: aCreer.map((p) => ({ ...p, date: debut })) });
    }
    return reply.send({ data: { crees: aCreer.length } });
  });

  /** Tant que l'application de terrain n'existe pas, le superviseur note le resultat. */
  app.post('/passages/:id/marquer', chef, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const corps = lire(
      z.object({
        resultat: z.enum(['COLLECTE', 'PERSONNE_SUR_PLACE', 'ACCES_IMPOSSIBLE', 'DECHETS_REFUSES', 'RIEN_A_PRENDRE']),
        nbSacs: z.number().int().min(0).max(200).optional(),
      }),
      request.body,
    );
    const change = await prisma.passage.updateMany({
      where: { id, statut: 'A_FAIRE' },
      data: { statut: 'FAIT', resultat: corps.resultat, nbSacs: corps.nbSacs ?? null },
    });
    if (change.count === 0) throw new ErreurMetier(409, 'Ce passage est deja enregistre.');
    return reply.send({ data: { id, statut: 'FAIT' } });
  });

  app.post('/passages/:id/valider', chef, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const agent = agentDe(request);
    const passage = await prisma.$transaction(async (tx) => {
      const change = await tx.passage.updateMany({
        where: { id, statut: 'FAIT' },
        data: { statut: 'VALIDE', valideParId: agent.id, valideLe: new Date() },
      });
      if (change.count === 0) return null;
      const p = await tx.passage.findUniqueOrThrow({ where: { id } });
      // La demande planifiee ce jour-la est maintenant servie.
      const { debut, fin } = journee(p.date.toISOString().slice(0, 10));
      await tx.demandeCollecte.updateMany({
        where: { menageId: p.menageId, statut: 'PLANIFIEE', datePlanifiee: { gte: debut, lt: fin } },
        data: { statut: 'TERMINEE' },
      });
      return p;
    });
    if (!passage) throw new ErreurMetier(409, 'Seul un passage fait peut etre valide.');
    return reply.send({ data: { id, statut: 'VALIDE' } });
  });

  app.post('/passages/:id/refuser', chef, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const change = await prisma.passage.updateMany({ where: { id, statut: 'FAIT' }, data: { statut: 'REFUSE' } });
    if (change.count === 0) throw new ErreurMetier(409, 'Seul un passage fait peut etre refuse.');
    return reply.send({ data: { id, statut: 'REFUSE' } });
  });
}
