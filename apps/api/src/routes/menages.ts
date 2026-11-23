import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ErreurMetier, lire } from '../lib/erreurs.js';
import { signerJeton } from '../lib/jeton.js';
import { prochaineReference } from '../lib/references.js';
import { exiger, sessionDe } from '../lib/session.js';
import { env } from '../env.js';
import { prisma } from '../prisma.js';
import { alerterMenage } from '../services/alertes.js';
import { profilMenage } from './auth.js';

const corpsInscription = z.object({
  nom: z.string().trim().min(2, 'Votre nom, svp').max(120),
  communeSlug: z.string().trim().min(1),
  avenue: z.string().trim().min(2, "Le nom de l'avenue").max(120),
  parcelle: z.string().trim().min(1, 'Le numero de parcelle').max(40),
  repere: z.string().trim().max(200).optional(),
  formule: z.enum(['PAR_PASSAGE', 'MENSUELLE']),
  langue: z.enum(['FR', 'EN']).default('FR'),
});

const corpsProfil = z
  .object({
    nom: z.string().trim().min(2).max(120),
    repere: z.string().trim().max(200).nullable(),
    langue: z.enum(['FR', 'EN']),
    alerteSms: z.boolean(),
    alerteWa: z.boolean(),
    formule: z.enum(['PAR_PASSAGE', 'MENSUELLE']),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Rien a modifier');

export async function menagesRoutes(app: FastifyInstance) {
  /**
   * Inscription. Le telephone vient du jeton (verifie par SMS) : on ne peut
   * donc inscrire que son propre numero.
   */
  app.post('/menages', { preHandler: exiger('VISITEUR') }, async (request, reply) => {
    const session = sessionDe(request);
    const corps = lire(corpsInscription, request.body);

    const commune = await prisma.commune.findUnique({ where: { slug: corps.communeSlug } });
    if (!commune) throw new ErreurMetier(404, 'Commune inconnue');
    if (commune.statut !== 'OUVERTE') {
      throw new ErreurMetier(409, `${commune.nom} n'est pas encore desservie. Laissez votre numero pour etre prevenu.`);
    }

    let menage;
    try {
      menage = await prisma.$transaction(async (tx) => {
        const code = await prochaineReference(tx, 'MN');
        return tx.menage.create({
          data: {
            code,
            nom: corps.nom,
            telephone: session.tel,
            communeId: commune.id,
            avenue: corps.avenue,
            parcelle: corps.parcelle,
            repere: corps.repere || null,
            formule: corps.formule,
            langue: corps.langue,
          },
        });
      });
    } catch (erreur) {
      if (erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === 'P2002') {
        throw new ErreurMetier(409, 'Ce numero a deja un compte. Connectez-vous.');
      }
      throw erreur;
    }

    void alerterMenage(menage, 'bienvenue', { nom: menage.nom, code: menage.code });

    // La session de visiteur devient une session de menage.
    const jeton = signerJeton({ tel: session.tel, typ: 'MENAGE', id: menage.id }, env.SESSION_JOURS * 24 * 3600);
    return reply.status(201).send({ data: { jeton, menage: await profilMenage(menage.id) } });
  });

  app.patch('/moi', { preHandler: exiger('MENAGE') }, async (request, reply) => {
    const session = sessionDe(request);
    const corps = lire(corpsProfil, request.body);
    await prisma.menage.update({ where: { id: session.id as string }, data: corps });
    return reply.send({ data: await profilMenage(session.id as string) });
  });
}
