import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';

export async function communesRoutes(app: FastifyInstance) {
  /**
   * Liste des communes de Kinshasa avec leur etat.
   * C'est ce que lit la page « Ou nous passons » du site.
   */
  app.get('/communes', async () => {
    const communes = await prisma.commune.findMany({
      orderBy: { nom: 'asc' },
      select: {
        slug: true,
        nom: true,
        statut: true,
        ouverteLe: true,
        _count: { select: { menages: true } },
      },
    });

    return {
      data: communes.map((c) => ({
        slug: c.slug,
        nom: c.nom,
        statut: c.statut,
        menages: c.statut === 'OUVERTE' ? c._count.menages : null,
        ouverteLe: c.ouverteLe?.toISOString() ?? null,
      })),
    };
  });

  /** Les seules communes ouvertes, pour la FAQ et le bandeau d'accueil. */
  app.get('/communes/ouvertes', async () => {
    const communes = await prisma.commune.findMany({
      where: { statut: 'OUVERTE' },
      orderBy: { nom: 'asc' },
      select: { slug: true, nom: true, ouverteLe: true },
    });

    return {
      data: communes.map((c) => ({
        slug: c.slug,
        nom: c.nom,
        ouverteLe: c.ouverteLe?.toISOString() ?? null,
      })),
    };
  });
}
