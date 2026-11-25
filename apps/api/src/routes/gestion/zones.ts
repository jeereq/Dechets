import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../env.js';
import { exigerPoste } from '../../lib/acces.js';
import { ErreurMetier, lire } from '../../lib/erreurs.js';
import { prisma } from '../../prisma.js';
import { envoyerSms } from '../../services/notifications.js';

export async function zonesGestion(app: FastifyInstance) {
  const chef = { preHandler: exigerPoste('SUPERVISEUR') };

  app.get('/communes', chef, async (_request, reply) => {
    const [communes, leads] = await Promise.all([
      prisma.commune.findMany({ orderBy: { nom: 'asc' }, include: { _count: { select: { menages: true } } } }),
      prisma.lead.groupBy({ by: ['communeId'], where: { prevenuLe: null }, _count: { _all: true } }),
    ]);
    const enAttente = new Map(leads.map((l) => [l.communeId, l._count._all]));
    return reply.send({
      data: communes.map((c) => ({
        slug: c.slug,
        nom: c.nom,
        statut: c.statut,
        ouverteLe: c.ouverteLe,
        menages: c._count.menages,
        leadsEnAttente: enAttente.get(c.id) ?? 0,
      })),
    });
  });

  app.patch('/communes/:slug', chef, async (request, reply) => {
    const { slug } = lire(z.object({ slug: z.string().min(1) }), request.params);
    const { statut } = lire(z.object({ statut: z.enum(['OUVERTE', 'DEMANDES_RECUES', 'FERMEE']) }), request.body);
    const commune = await prisma.commune.findUnique({ where: { slug } });
    if (!commune) throw new ErreurMetier(404, 'Commune inconnue');
    await prisma.commune.update({
      where: { slug },
      data: { statut, ...(statut === 'OUVERTE' && !commune.ouverteLe ? { ouverteLe: new Date() } : {}) },
    });
    return reply.send({ data: { slug, statut } });
  });

  /** Previent par SMS ceux qui avaient laisse leur numero pour cette commune. */
  app.post('/communes/:slug/prevenir', chef, async (request, reply) => {
    const { slug } = lire(z.object({ slug: z.string().min(1) }), request.params);
    const commune = await prisma.commune.findUnique({ where: { slug } });
    if (!commune) throw new ErreurMetier(404, 'Commune inconnue');
    if (commune.statut !== 'OUVERTE') {
      throw new ErreurMetier(409, "Ouvrez d'abord la commune avant de prevenir les personnes en attente.");
    }

    const leads = await prisma.lead.findMany({ where: { communeId: commune.id, prevenuLe: null } });
    let envoyes = 0;
    let echecs = 0;
    for (const lead of leads) {
      const texte = `BENIME : nous passons maintenant a ${commune.nom}. Inscrivez-vous : ${env.SITE_URL}/fr/espace`;
      const resultat = await envoyerSms({ telephone: lead.telephone, texte });
      if (resultat.envoye) {
        envoyes++;
        await prisma.lead.update({ where: { id: lead.id }, data: { prevenuLe: new Date() } });
      } else {
        echecs++;
      }
    }
    return reply.send({ data: { envoyes, echecs } });
  });

  app.get('/leads', chef, async (_request, reply) => {
    const leads = await prisma.lead.findMany({
      where: { prevenuLe: null },
      orderBy: { creeLe: 'desc' },
      take: 200,
      include: { commune: { select: { nom: true, slug: true } } },
    });
    return reply.send({ data: leads });
  });

  app.get('/contacts', chef, async (_request, reply) => {
    const messages = await prisma.messageContact.findMany({ orderBy: [{ traiteLe: 'asc' }, { creeLe: 'desc' }], take: 100 });
    return reply.send({ data: messages });
  });

  app.post('/contacts/:id/traiter', chef, async (request, reply) => {
    const { id } = lire(z.object({ id: z.string().min(1) }), request.params);
    const change = await prisma.messageContact.updateMany({ where: { id, traiteLe: null }, data: { traiteLe: new Date() } });
    if (change.count === 0) throw new ErreurMetier(409, 'Ce message est deja traite.');
    return reply.send({ data: { id } });
  });
}
