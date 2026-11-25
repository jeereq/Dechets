import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { exigerPoste } from '../../lib/acces.js';
import { ErreurMetier, lire } from '../../lib/erreurs.js';
import { prisma } from '../../prisma.js';

/** Reglages que le back-office peut modifier, et la forme de chacun. */
const REGLES: Record<string, 'nombre' | 'texte' | 'booleen' | 'statistique'> = {
  prix_par_passage: 'nombre',
  prix_mensuel: 'nombre',
  passages_par_semaine: 'nombre',
  devise: 'texte',
  devise_mensuel: 'texte',
  // Chiffres affiches sur la page « Ou vont vos dechets » ; vides tant que BENIME ne les a pas renseignes.
  stat_plastique_tonnes: 'statistique',
  stat_part_valorisee: 'statistique',
  alerte_veille_passage: 'booleen',
  canal_sms: 'booleen',
  canal_whatsapp: 'booleen',
};

export async function reglagesGestion(app: FastifyInstance) {
  const chef = { preHandler: exigerPoste('SUPERVISEUR') };

  const lireTous = async () => {
    const lignes = await prisma.reglage.findMany({ where: { cle: { in: Object.keys(REGLES) } } });
    return Object.fromEntries(lignes.map((l) => [l.cle, l.valeur]));
  };

  app.get('/reglages', chef, async (_request, reply) => reply.send({ data: await lireTous() }));

  app.put('/reglages', chef, async (request, reply) => {
    const corps = lire(z.record(z.string(), z.string().trim().max(40)), request.body);
    for (const [cle, valeur] of Object.entries(corps)) {
      const regle = REGLES[cle];
      if (!regle) throw new ErreurMetier(400, `Reglage inconnu : ${cle}`);
      if (regle === 'nombre' && !/^\d{1,9}$/.test(valeur)) throw new ErreurMetier(400, `${cle} doit etre un nombre entier`);
      if (regle === 'statistique' && valeur !== '' && !/^\d{1,7}([.,]\d{1,2})?$/.test(valeur)) throw new ErreurMetier(400, `${cle} doit etre un nombre (ex. 12 ou 12,5), ou vide`);
      if (regle === 'booleen' && !['true', 'false'].includes(valeur)) throw new ErreurMetier(400, `${cle} : oui ou non`);
      if (regle === 'texte' && valeur.length < 2) throw new ErreurMetier(400, `${cle} ne peut pas etre vide`);
    }
    await prisma.$transaction(
      Object.entries(corps).map(([cle, valeur]) =>
        prisma.reglage.upsert({ where: { cle }, update: { valeur }, create: { cle, valeur } }),
      ),
    );
    return reply.send({ data: await lireTous() });
  });
}
