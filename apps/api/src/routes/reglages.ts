import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';

/** Reglages que le site public a le droit de lire. */
const CLES_PUBLIQUES = [
  'prix_par_passage',
  'prix_mensuel',
  'passages_par_semaine',
  'devise',
  'devise_mensuel',
  'stat_plastique_tonnes',
  'stat_part_valorisee',
] as const;

export async function reglagesRoutes(app: FastifyInstance) {
  /**
   * Les prix affiches sur le site viennent d'ici, pas du code.
   * Le back-office les modifie sans redeployer.
   */
  app.get('/reglages/publics', async () => {
    const reglages = await prisma.reglage.findMany({
      where: { cle: { in: [...CLES_PUBLIQUES] } },
    });

    const data = Object.fromEntries(reglages.map((r) => [r.cle, r.valeur]));
    return { data };
  });
}
