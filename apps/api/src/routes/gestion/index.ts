import type { FastifyInstance } from 'fastify';
import { exigerPoste, agentDe } from '../../lib/acces.js';
import { prisma } from '../../prisma.js';
import { demandesGestion } from './demandes.js';
import { menagesGestion } from './menages.js';
import { paiementsGestion } from './paiements.js';
import { personnelGestion } from './personnel.js';
import { realisationsGestion } from './realisations.js';
import { reglagesGestion } from './reglages.js';
import { tableauGestion } from './tableau.js';
import { tourneesGestion } from './tournees.js';
import { zonesGestion } from './zones.js';

/**
 * Back-office : tout ce qui est sous /gestion est reserve au personnel.
 * Le superviseur peut tout faire ; l'agent de recouvrement voit les abonnes et
 * les paiements. Les chauffeurs et eboueurs auront leur propre application.
 */
export async function gestionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', exigerPoste('SUPERVISEUR', 'RECOUVREMENT'));

  app.get('/moi', async (request, reply) => {
    const agent = agentDe(request);
    const equipe = agent.equipeId
      ? await prisma.equipe.findUnique({ where: { id: agent.equipeId }, select: { id: true, nom: true } })
      : null;
    return reply.send({
      data: { id: agent.id, nom: agent.nom, telephone: agent.telephone, poste: agent.poste, equipe },
    });
  });

  await app.register(tableauGestion);
  await app.register(menagesGestion);
  await app.register(demandesGestion);
  await app.register(tourneesGestion);
  await app.register(paiementsGestion);
  await app.register(personnelGestion);
  await app.register(zonesGestion);
  await app.register(realisationsGestion);
  await app.register(reglagesGestion);
}
