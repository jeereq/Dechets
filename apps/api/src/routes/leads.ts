import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { telephoneSchema } from '../lib/telephone.js';
import { prisma } from '../prisma.js';

const corpsLead = z.object({
  telephone: telephoneSchema,
  communeSlug: z.string().trim().min(1),
  nom: z.string().trim().min(2).max(120).optional(),
});

export async function leadsRoutes(app: FastifyInstance) {
  /**
   * « Prevenez-moi quand vous arrivez chez moi. »
   * Appele par le bandeau de la page « Ou nous passons ».
   */
  app.post('/leads', async (request, reply) => {
    const parsed = corpsLead.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        erreur: 'Donnees invalides',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { telephone, communeSlug, nom } = parsed.data;

    const commune = await prisma.commune.findUnique({
      where: { slug: communeSlug },
      select: { id: true, nom: true, statut: true },
    });

    if (!commune) {
      return reply.status(404).send({ erreur: 'Commune inconnue' });
    }

    if (commune.statut === 'OUVERTE') {
      return reply.status(409).send({
        erreur: `${commune.nom} est deja desservie : vous pouvez vous inscrire directement.`,
      });
    }

    const lead = await prisma.lead.upsert({
      where: { telephone_communeId: { telephone, communeId: commune.id } },
      update: { nom: nom ?? undefined },
      create: { telephone, communeId: commune.id, nom: nom ?? null },
      select: { id: true, creeLe: true },
    });

    // Une commune qui recoit des demandes passe de FERMEE a DEMANDES_RECUES,
    // pour que le back-office voie ou la demande monte.
    if (commune.statut === 'FERMEE') {
      await prisma.commune.update({
        where: { id: commune.id },
        data: { statut: 'DEMANDES_RECUES' },
      });
    }

    return reply.status(201).send({ data: { id: lead.id, commune: commune.nom } });
  });
}
