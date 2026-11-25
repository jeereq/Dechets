import type { Personnel, Poste } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { prisma } from '../prisma.js';
import { ErreurMetier } from './erreurs.js';
import { verifierJeton } from './jeton.js';

declare module 'fastify' {
  interface FastifyRequest {
    agent?: Personnel;
  }
}

/**
 * Garde du back-office : une session de personnel, un compte encore actif et un
 * poste autorise. Le poste est relu en base a chaque appel : retirer un acces
 * prend effet tout de suite, sans attendre l'expiration du jeton.
 */
export function exigerPoste(...postes: Poste[]) {
  return async (request: FastifyRequest) => {
    const entete = request.headers.authorization ?? '';
    const session = entete.startsWith('Bearer ') ? verifierJeton(entete.slice(7)) : null;
    if (!session) throw new ErreurMetier(401, 'Connectez-vous pour continuer.');
    if (session.typ !== 'PERSONNEL' || !session.id) {
      throw new ErreurMetier(403, "Cet espace est reserve a l'equipe BENIME.");
    }

    const agent = await prisma.personnel.findFirst({ where: { id: session.id, actif: true } });
    if (!agent) throw new ErreurMetier(401, 'Compte introuvable ou desactive.');
    if (!postes.includes(agent.poste)) {
      throw new ErreurMetier(403, "Votre poste n'a pas acces a cette page.");
    }
    request.agent = agent;
  };
}

export function agentDe(request: FastifyRequest): Personnel {
  if (!request.agent) throw new ErreurMetier(401, 'Connectez-vous pour continuer.');
  return request.agent;
}

/** « 2026-11-25 » -> minuit UTC ; renvoie aussi le lendemain pour borner une journee. */
export function journee(date: string): { debut: Date; fin: Date } {
  const debut = new Date(`${date}T00:00:00.000Z`);
  return { debut, fin: new Date(debut.getTime() + 24 * 3600 * 1000) };
}

export const pagination = (query: unknown) => {
  const q = (query ?? {}) as { page?: string; taille?: string };
  const taille = Math.min(Math.max(Number.parseInt(q.taille ?? '20', 10) || 20, 1), 100);
  const page = Math.max(Number.parseInt(q.page ?? '1', 10) || 1, 1);
  return { take: taille, skip: (page - 1) * taille, page, taille };
};
