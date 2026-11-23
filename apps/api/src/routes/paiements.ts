import { timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../env.js';
import { ErreurMetier, lire } from '../lib/erreurs.js';
import { prochaineReference } from '../lib/references.js';
import { exiger, sessionDe } from '../lib/session.js';
import { telephoneSchema } from '../lib/telephone.js';
import { prisma } from '../prisma.js';
import {
  demanderPaiementCarte,
  demanderPaiementMobile,
  paiementConfirme,
  verifierTransaction,
  type NotificationFlexpay,
} from '../services/flexpay.js';
import { confirmerPaiement, echouerPaiement, MODES_MOBILE } from '../services/paiements.js';

const MONTANT_MIN = 500;
const MONTANT_MAX = 500_000;

const corpsPaiement = z.discriminatedUnion('mode', [
  z.object({
    mode: z.enum(MODES_MOBILE),
    montant: z.number().int().min(MONTANT_MIN).max(MONTANT_MAX),
    // Par defaut le numero du compte ; on peut payer depuis le numero d'un proche.
    telephone: telephoneSchema.optional(),
  }),
  z.object({
    mode: z.literal('CARTE'),
    montant: z.number().int().min(MONTANT_MIN).max(MONTANT_MAX),
  }),
]);

const corpsEncaissement = z.object({
  menageCode: z.string().trim().min(3),
  montant: z.number().int().min(MONTANT_MIN).max(MONTANT_MAX),
  mode: z.enum(['CASH', 'VIREMENT']),
  objet: z.enum(['PASSAGE', 'ABONNEMENT', 'RECHARGE_CREDIT']).default('RECHARGE_CREDIT'),
});

const present = (p: {
  id: string;
  reference: string;
  montant: number;
  mode: string;
  objet: string;
  statut: string;
  creeLe: Date;
}) => ({
  id: p.id,
  reference: p.reference,
  montant: p.montant,
  mode: p.mode,
  objet: p.objet,
  statut: p.statut,
  creeLe: p.creeLe,
});

function secretValide(fourni: unknown): boolean {
  const attendu = env.FLEXPAY_CALLBACK_SECRET;
  // Sans secret configure (developpement), on n'impose rien ; en production le
  // secret est a definir avec l'adresse de rappel donnee a FlexPay.
  if (!attendu) return env.NODE_ENV !== 'production';
  if (typeof fourni !== 'string') return false;
  const a = Buffer.from(fourni);
  const b = Buffer.from(attendu);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function paiementsRoutes(app: FastifyInstance) {
  /** Recharge de credit par mobile money ou carte. */
  app.post('/paiements', { preHandler: exiger('MENAGE') }, async (request, reply) => {
    const session = sessionDe(request);
    const corps = lire(corpsPaiement, request.body);
    const menage = await prisma.menage.findUniqueOrThrow({ where: { id: session.id as string } });

    const paiement = await prisma.$transaction(async (tx) =>
      tx.paiement.create({
        data: {
          reference: await prochaineReference(tx, 'PM'),
          menageId: menage.id,
          montant: corps.montant,
          mode: corps.mode,
          objet: 'RECHARGE_CREDIT',
        },
      }),
    );

    if (corps.mode === 'CARTE') {
      const reponse = await demanderPaiementCarte({
        reference: paiement.reference,
        montant: paiement.montant,
        description: `Recharge BENIME ${menage.code}`,
        retour: `${env.SITE_URL}/paiement`,
      });
      if (!reponse.accepte) {
        await echouerPaiement(paiement.id);
        throw new ErreurMetier(502, "Le paiement par carte n'a pas pu demarrer. Reessayez ou choisissez le mobile money.");
      }
      await prisma.paiement.update({
        where: { id: paiement.id },
        data: { flexpayOrderNumber: reponse.orderNumber ?? null },
      });
      return reply.status(201).send({
        data: { ...present(paiement), etape: 'REDIRIGER', url: reponse.url, message: reponse.message },
      });
    }

    const reponse = await demanderPaiementMobile({
      telephone: corps.telephone ?? menage.telephone,
      montant: paiement.montant,
      reference: paiement.reference,
    });
    if (!reponse.accepte) {
      await echouerPaiement(paiement.id);
      throw new ErreurMetier(502, "La demande n'a pas pu etre envoyee a votre operateur. Verifiez le numero et reessayez.");
    }
    await prisma.paiement.update({
      where: { id: paiement.id },
      data: { flexpayOrderNumber: reponse.orderNumber ?? null },
    });

    return reply.status(201).send({
      data: {
        ...present(paiement),
        etape: 'CONFIRMER_SUR_TELEPHONE',
        message: 'Confirmez le paiement sur votre telephone avec votre code secret.',
      },
    });
  });

  app.get('/paiements', { preHandler: exiger('MENAGE') }, async (request, reply) => {
    const session = sessionDe(request);
    const paiements = await prisma.paiement.findMany({
      where: { menageId: session.id as string },
      orderBy: { creeLe: 'desc' },
      take: 50,
    });
    return reply.send({ data: paiements.map(present) });
  });

  /**
   * Suivi d'un paiement. Si le rappel de FlexPay tarde ou se perd, on
   * interroge FlexPay nous-memes : le menage ne reste pas bloque.
   */
  app.get('/paiements/:reference', { preHandler: exiger('MENAGE') }, async (request, reply) => {
    const session = sessionDe(request);
    const { reference } = lire(z.object({ reference: z.string().min(3) }), request.params);

    let paiement = await prisma.paiement.findFirst({
      where: { reference, menageId: session.id as string },
    });
    if (!paiement) throw new ErreurMetier(404, 'Paiement introuvable');

    if (paiement.statut === 'EN_ATTENTE' && paiement.flexpayOrderNumber) {
      const etat = await verifierTransaction(paiement.flexpayOrderNumber);
      if (etat === 'RECU') await confirmerPaiement(paiement.id);
      if (etat === 'ECHEC') await echouerPaiement(paiement.id);
      paiement = await prisma.paiement.findUniqueOrThrow({ where: { id: paiement.id } });
    }

    const menage = await prisma.menage.findUniqueOrThrow({
      where: { id: session.id as string },
      select: { credit: true },
    });
    return reply.send({ data: { ...present(paiement), credit: menage.credit } });
  });

  /** Recu : donnees structurees, l'application ou le site en fait une page ou un PDF. */
  app.get('/paiements/:reference/recu', { preHandler: exiger('MENAGE') }, async (request, reply) => {
    const session = sessionDe(request);
    const { reference } = lire(z.object({ reference: z.string().min(3) }), request.params);
    const paiement = await prisma.paiement.findFirst({
      where: { reference, menageId: session.id as string },
      include: { menage: { select: { code: true, nom: true, telephone: true } } },
    });
    if (!paiement) throw new ErreurMetier(404, 'Paiement introuvable');
    if (paiement.statut !== 'RECU') throw new ErreurMetier(409, "Ce paiement n'est pas encore confirme.");

    return reply.send({
      data: {
        numero: paiement.reference,
        date: paiement.modifieLe,
        montant: paiement.montant,
        devise: 'CDF',
        mode: paiement.mode,
        objet: paiement.objet,
        abonne: paiement.menage,
        emetteur: 'BENIME CONGO SARL — BENIME CONGO Assainissement',
      },
    });
  });

  /**
   * Rappel de FlexPay. N'importe qui peut appeler cette adresse : on exige le
   * secret, puis on redemande l'etat reel a FlexPay avant de creditier quoi que ce soit.
   */
  app.post('/webhooks/flexpay', async (request, reply) => {
    const requete = request.query as { cle?: string };
    if (!secretValide(requete.cle)) {
      return reply.status(401).send({ erreur: 'Non autorise' });
    }

    const notif = (request.body ?? {}) as Partial<NotificationFlexpay>;
    if (!notif.reference) return reply.status(400).send({ erreur: 'Reference manquante' });

    const paiement = await prisma.paiement.findUnique({ where: { reference: notif.reference } });
    // On repond 200 meme si inconnu : FlexPay ne doit pas reessayer indefiniment.
    if (!paiement || !paiement.flexpayOrderNumber) return reply.send({ data: { recu: true } });

    const etat = await verifierTransaction(paiement.flexpayOrderNumber);
    if (etat === 'RECU' && paiementConfirme(notif as NotificationFlexpay)) {
      await confirmerPaiement(paiement.id);
    } else if (etat === 'ECHEC') {
      await echouerPaiement(paiement.id);
    }
    return reply.send({ data: { recu: true } });
  });

  /** Especes et virements : l'agent de recouvrement saisit ce qu'il a recu. */
  app.post('/encaissements', { preHandler: exiger('PERSONNEL') }, async (request, reply) => {
    const session = sessionDe(request);
    const corps = lire(corpsEncaissement, request.body);

    const agent = await prisma.personnel.findFirst({
      where: { id: session.id as string, actif: true },
    });
    if (!agent || !['RECOUVREMENT', 'SUPERVISEUR'].includes(agent.poste)) {
      throw new ErreurMetier(403, "Seuls les agents de recouvrement et les superviseurs encaissent.");
    }

    const menage = await prisma.menage.findUnique({ where: { code: corps.menageCode.toUpperCase() } });
    if (!menage) throw new ErreurMetier(404, 'Abonne introuvable. Verifiez le numero.');

    const paiement = await prisma.$transaction(async (tx) =>
      tx.paiement.create({
        data: {
          reference: await prochaineReference(tx, 'PM'),
          menageId: menage.id,
          montant: corps.montant,
          mode: corps.mode,
          objet: corps.objet,
          agentId: agent.id,
          // Un virement n'est vrai qu'une fois vu sur le releve : il attend le rapprochement.
          statut: corps.mode === 'VIREMENT' ? 'A_RAPPROCHER' : 'EN_ATTENTE',
        },
      }),
    );

    if (corps.mode === 'CASH') await confirmerPaiement(paiement.id);

    const final = await prisma.paiement.findUniqueOrThrow({ where: { id: paiement.id } });
    return reply.status(201).send({ data: present(final) });
  });
}
