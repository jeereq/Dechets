import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { agentDe, exigerPoste, journee } from '../lib/acces.js';
import { ErreurMetier, lire } from '../lib/erreurs.js';
import { prisma } from '../prisma.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ)');

/** Aujourd'hui a Kinshasa (UTC+1, pas d'heure d'ete), au format AAAA-MM-JJ. */
const aujourdhui = () => new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 10);

const RESULTATS = ['COLLECTE', 'PERSONNE_SUR_PLACE', 'ACCES_IMPOSSIBLE', 'DECHETS_REFUSES', 'RIEN_A_PRENDRE'] as const;

const corpsMarquage = z.object({
  resultat: z.enum(RESULTATS),
  nbSacs: z.number().int().min(1).max(200).optional(),
});

/**
 * Application de terrain. Les chauffeurs et eboueurs notent leurs passages, les
 * agents de recouvrement encaissent. Le superviseur voit tout et peut faire les deux.
 */
export async function terrainRoutes(app: FastifyInstance) {
  app.addHook('preHandler', exigerPoste('SUPERVISEUR', 'CHAUFFEUR', 'EBOUEUR', 'RECOUVREMENT'));

  const collecte = { preHandler: exigerPoste('SUPERVISEUR', 'CHAUFFEUR', 'EBOUEUR') };
  const caisse = { preHandler: exigerPoste('SUPERVISEUR', 'RECOUVREMENT') };

  app.get('/moi', async (request, reply) => {
    const agent = agentDe(request);
    const equipe = agent.equipeId
      ? await prisma.equipe.findUnique({
          where: { id: agent.equipeId },
          select: { id: true, nom: true, vehicule: true },
        })
      : null;
    return reply.send({
      data: {
        id: agent.id,
        nom: agent.nom,
        telephone: agent.telephone,
        poste: agent.poste,
        equipe,
        peutCollecter: agent.poste !== 'RECOUVREMENT',
        peutEncaisser: agent.poste === 'RECOUVREMENT' || agent.poste === 'SUPERVISEUR',
        aujourdhui: aujourdhui(),
      },
    });
  });

  // --- tournee -----------------------------------------------------------------

  /**
   * Les passages d'un jour. Un chauffeur ou un eboueur ne voit que ceux de son
   * equipe ; le superviseur voit toutes les equipes et peut en choisir une.
   */
  app.get('/tournee', collecte, async (request, reply) => {
    const agent = agentDe(request);
    const { date, equipeId } = lire(
      z.object({ date: dateSchema.optional(), equipeId: z.string().min(1).optional() }),
      request.query,
    );
    const jour = date ?? aujourdhui();
    const { debut, fin } = journee(jour);
    const estChef = agent.poste === 'SUPERVISEUR';

    if (!estChef && !agent.equipeId) {
      return reply.send({
        data: { date: jour, aujourdhui: aujourdhui(), equipe: null, equipes: [], passages: [], bilan: bilan([]) },
      });
    }

    const filtreEquipe = estChef ? (equipeId ? { equipeId } : {}) : { equipeId: agent.equipeId as string };

    const [passages, demandes, equipes] = await Promise.all([
      prisma.passage.findMany({
        where: { date: { gte: debut, lt: fin }, ...filtreEquipe },
        orderBy: [{ menage: { avenue: 'asc' } }, { menage: { parcelle: 'asc' } }],
        include: {
          menage: {
            select: {
              id: true,
              code: true,
              nom: true,
              telephone: true,
              avenue: true,
              parcelle: true,
              repere: true,
              commune: { select: { nom: true } },
            },
          },
          equipe: { select: { id: true, nom: true } },
        },
      }),
      prisma.demandeCollecte.findMany({
        where: { statut: 'PLANIFIEE', datePlanifiee: { gte: debut, lt: fin } },
        select: { menageId: true, reference: true },
      }),
      estChef
        ? prisma.equipe.findMany({ orderBy: { nom: 'asc' }, select: { id: true, nom: true } })
        : Promise.resolve([] as Array<{ id: string; nom: string }>),
    ]);

    const parMenage = new Map(demandes.map((d) => [d.menageId, d.reference]));
    const lignes = passages.map((p) => ({
      id: p.id,
      statut: p.statut,
      resultat: p.resultat,
      nbSacs: p.nbSacs,
      demande: parMenage.get(p.menageId) ?? null,
      menage: p.menage,
      equipe: p.equipe,
    }));

    return reply.send({
      data: {
        date: jour,
        aujourdhui: aujourdhui(),
        equipe: estChef ? null : { id: agent.equipeId },
        equipes,
        passages: lignes,
        bilan: bilan(lignes),
      },
    });
  });

  /**
   * Note le resultat d'un passage. On peut corriger tant que le superviseur n'a
   * pas valide, et refaire un passage qu'il a refuse. Rejouer la meme requete
   * (mauvais reseau, envoi en double) donne le meme resultat.
   */
  app.post('/passages/:id/marquer', collecte, async (request, reply) => {
    const agent = agentDe(request);
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const corps = lire(corpsMarquage, request.body);

    if (corps.resultat === 'COLLECTE' && !corps.nbSacs) {
      throw new ErreurMetier(400, 'Indiquez le nombre de sacs collectes.');
    }

    const passage = await prisma.passage.findUnique({ where: { id }, select: { equipeId: true, date: true, statut: true } });
    if (!passage) throw new ErreurMetier(404, 'Passage introuvable.');
    if (agent.poste !== 'SUPERVISEUR' && passage.equipeId !== agent.equipeId) {
      throw new ErreurMetier(403, "Ce passage n'est pas dans la tournee de votre equipe.");
    }
    if (passage.date.toISOString().slice(0, 10) > aujourdhui()) {
      throw new ErreurMetier(409, "Ce passage est prevu un autre jour : vous ne pouvez pas l'enregistrer maintenant.");
    }
    if (passage.statut === 'VALIDE') {
      throw new ErreurMetier(409, 'Ce passage est deja valide par le superviseur.');
    }

    const change = await prisma.passage.updateMany({
      where: { id, statut: { in: ['A_FAIRE', 'FAIT', 'REFUSE'] } },
      data: {
        statut: 'FAIT',
        resultat: corps.resultat,
        nbSacs: corps.resultat === 'COLLECTE' ? (corps.nbSacs ?? null) : null,
        agentId: agent.id,
      },
    });
    if (change.count === 0) throw new ErreurMetier(409, 'Ce passage est deja valide par le superviseur.');
    return reply.send({ data: { id, statut: 'FAIT' } });
  });

  // --- encaissements ---------------------------------------------------------

  /** Cherche un abonne par numero (MN-0001), nom ou telephone. */
  app.get('/abonnes', caisse, async (request, reply) => {
    const { q } = lire(z.object({ q: z.string().trim().min(2).max(60) }), request.query);
    const chiffres = q.replace(/\D/g, '');
    const menages = await prisma.menage.findMany({
      where: {
        statut: { not: 'RESILIE' },
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { nom: { contains: q, mode: 'insensitive' } },
          ...(chiffres.length >= 4 ? [{ telephone: { contains: chiffres } }] : []),
        ],
      },
      orderBy: { nom: 'asc' },
      take: 12,
      select: {
        code: true,
        nom: true,
        telephone: true,
        avenue: true,
        parcelle: true,
        formule: true,
        credit: true,
        statut: true,
        commune: { select: { nom: true } },
      },
    });
    return reply.send({ data: menages });
  });

  /** Ce que l'agent a encaisse un jour : la somme a remettre en caisse. */
  app.get('/encaissements', caisse, async (request, reply) => {
    const agent = agentDe(request);
    const { date } = lire(z.object({ date: dateSchema.optional() }), request.query);
    const jour = date ?? aujourdhui();
    // Le jour de Kinshasa commence a 23h UTC la veille.
    const { debut: minuit } = journee(jour);
    const debut = new Date(minuit.getTime() - 3600 * 1000);
    const fin = new Date(debut.getTime() + 24 * 3600 * 1000);

    const lignes = await prisma.paiement.findMany({
      where: { agentId: agent.id, creeLe: { gte: debut, lt: fin }, statut: { not: 'ECHEC' } },
      orderBy: { creeLe: 'desc' },
      include: { menage: { select: { code: true, nom: true } } },
    });

    const somme = (mode: 'CASH' | 'VIREMENT') =>
      lignes.filter((l) => l.mode === mode).reduce((total, l) => total + l.montant, 0);

    return reply.send({
      data: {
        date: jour,
        especes: somme('CASH'),
        virements: somme('VIREMENT'),
        elements: lignes.map((l) => ({
          id: l.id,
          reference: l.reference,
          montant: l.montant,
          mode: l.mode,
          objet: l.objet,
          statut: l.statut,
          creeLe: l.creeLe,
          menage: l.menage,
        })),
      },
    });
  });
}

function bilan(lignes: Array<{ statut: string; nbSacs: number | null }>) {
  const compte = (s: string) => lignes.filter((l) => l.statut === s).length;
  return {
    total: lignes.length,
    aFaire: compte('A_FAIRE') + compte('REFUSE'),
    faits: compte('FAIT') + compte('VALIDE'),
    sacs: lignes.reduce((total, l) => total + (l.nbSacs ?? 0), 0),
  };
}
