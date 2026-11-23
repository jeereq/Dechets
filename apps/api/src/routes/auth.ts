import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../env.js';
import { ErreurMetier, lire } from '../lib/erreurs.js';
import { signerJeton } from '../lib/jeton.js';
import { exiger, sessionDe } from '../lib/session.js';
import { telephoneSchema } from '../lib/telephone.js';
import { prisma } from '../prisma.js';
import { envoyerCodeConnexion } from '../services/alertes.js';

const VALIDITE_CODE_MS = 10 * 60 * 1000;
const ATTENTE_ENTRE_CODES_MS = 30 * 1000;
const CODES_PAR_HEURE = 5;
const ESSAIS_MAX = 5;

const empreinte = (telephone: string, code: string) =>
  createHmac('sha256', env.JWT_SECRET).update(`${telephone}:${code}`).digest('hex');

const memeEmpreinte = (a: string, b: string) => {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Le code n'est renvoye que sans fournisseur SMS reel et hors production : pour tester. */
const exposerCode = env.NODE_ENV !== 'production' && env.SMS_PROVIDER === 'mock';

export async function profilMenage(id: string) {
  const menage = await prisma.menage.findUnique({
    where: { id },
    include: { commune: { select: { slug: true, nom: true } } },
  });
  if (!menage) return null;
  return {
    id: menage.id,
    code: menage.code,
    nom: menage.nom,
    telephone: menage.telephone,
    commune: menage.commune,
    avenue: menage.avenue,
    parcelle: menage.parcelle,
    repere: menage.repere,
    formule: menage.formule,
    langue: menage.langue,
    alerteSms: menage.alerteSms,
    alerteWa: menage.alerteWa,
    credit: menage.credit,
    statut: menage.statut,
  };
}

export async function authRoutes(app: FastifyInstance) {
  /** Etape 1 : on envoie un code a six chiffres par SMS. */
  app.post('/auth/code', async (request, reply) => {
    const { telephone } = lire(z.object({ telephone: telephoneSchema }), request.body);

    const recents = await prisma.codeConnexion.findMany({
      where: { telephone, creeLe: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      orderBy: { creeLe: 'desc' },
      select: { creeLe: true },
    });

    if (recents[0] && Date.now() - recents[0].creeLe.getTime() < ATTENTE_ENTRE_CODES_MS) {
      throw new ErreurMetier(429, 'Un code vient de vous etre envoye. Patientez quelques secondes.');
    }
    if (recents.length >= CODES_PAR_HEURE) {
      throw new ErreurMetier(429, 'Trop de demandes. Reessayez dans une heure.');
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await prisma.codeConnexion.create({
      data: {
        telephone,
        empreinte: empreinte(telephone, code),
        expireLe: new Date(Date.now() + VALIDITE_CODE_MS),
      },
    });

    const menage = await prisma.menage.findUnique({ where: { telephone }, select: { langue: true } });
    const envoi = await envoyerCodeConnexion(telephone, code, menage?.langue ?? 'FR');
    if (!envoi.envoye) {
      throw new ErreurMetier(502, "Le SMS n'a pas pu etre envoye. Reessayez dans un moment.");
    }

    return reply.send({
      data: { envoye: true, expireDansSecondes: VALIDITE_CODE_MS / 1000, ...(exposerCode ? { codeDeTest: code } : {}) },
    });
  });

  /** Etape 2 : on verifie le code et on ouvre la session. */
  app.post('/auth/verifier', async (request, reply) => {
    const { telephone, code, espace } = lire(
      z.object({
        telephone: telephoneSchema,
        code: z.string().trim().regex(/^\d{6}$/, 'Le code a six chiffres'),
        // Une personne du personnel qui est aussi abonnee choisit son espace.
        espace: z.enum(['MENAGE', 'PERSONNEL']).optional(),
      }),
      request.body,
    );

    const ligne = await prisma.codeConnexion.findFirst({
      where: { telephone, utiliseLe: null, expireLe: { gt: new Date() } },
      orderBy: { creeLe: 'desc' },
    });

    if (!ligne || ligne.tentatives >= ESSAIS_MAX) {
      throw new ErreurMetier(401, 'Code expire ou invalide. Demandez un nouveau code.');
    }

    if (!memeEmpreinte(ligne.empreinte, empreinte(telephone, code))) {
      await prisma.codeConnexion.update({ where: { id: ligne.id }, data: { tentatives: { increment: 1 } } });
      throw new ErreurMetier(401, 'Code incorrect.');
    }

    // Usage unique, meme si deux requetes arrivent en meme temps.
    const consomme = await prisma.codeConnexion.updateMany({
      where: { id: ligne.id, utiliseLe: null },
      data: { utiliseLe: new Date() },
    });
    if (consomme.count === 0) {
      throw new ErreurMetier(401, 'Code expire ou invalide. Demandez un nouveau code.');
    }

    const [menage, personnel] = await Promise.all([
      prisma.menage.findUnique({ where: { telephone }, select: { id: true } }),
      prisma.personnel.findFirst({ where: { telephone, actif: true }, select: { id: true } }),
    ]);

    const choisi =
      espace === 'PERSONNEL' ? (personnel ? 'PERSONNEL' : null) :
      espace === 'MENAGE' ? (menage ? 'MENAGE' : null) :
      menage ? 'MENAGE' : personnel ? 'PERSONNEL' : null;

    if (espace && !choisi) {
      throw new ErreurMetier(403, "Ce numero n'a pas acces a cet espace.");
    }

    const duree = env.SESSION_JOURS * 24 * 3600;
    const type = choisi ?? 'VISITEUR';
    const id = type === 'MENAGE' ? menage?.id : type === 'PERSONNEL' ? personnel?.id : undefined;
    const jeton = signerJeton({ tel: telephone, typ: type, id }, duree);

    return reply.send({
      data: {
        jeton,
        type,
        // Un visiteur n'a pas encore de compte : l'application propose l'inscription.
        nouveau: type === 'VISITEUR',
        espacesDisponibles: [menage ? 'MENAGE' : null, personnel ? 'PERSONNEL' : null].filter(Boolean),
      },
    });
  });

  /** Qui suis-je ? Sert a l'ouverture de l'application. */
  app.get('/moi', { preHandler: exiger('MENAGE', 'PERSONNEL', 'VISITEUR') }, async (request, reply) => {
    const session = sessionDe(request);

    if (session.typ === 'MENAGE' && session.id) {
      const menage = await profilMenage(session.id);
      if (!menage) throw new ErreurMetier(401, 'Compte introuvable.');
      return reply.send({ data: { type: 'MENAGE', menage } });
    }

    if (session.typ === 'PERSONNEL' && session.id) {
      const personnel = await prisma.personnel.findUnique({
        where: { id: session.id },
        select: { id: true, nom: true, poste: true, telephone: true, equipe: { select: { id: true, nom: true } } },
      });
      if (!personnel) throw new ErreurMetier(401, 'Compte introuvable.');
      return reply.send({ data: { type: 'PERSONNEL', personnel } });
    }

    return reply.send({ data: { type: 'VISITEUR', telephone: session.tel } });
  });
}
