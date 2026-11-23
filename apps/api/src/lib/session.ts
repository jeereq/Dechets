import type { FastifyReply, FastifyRequest } from 'fastify';
import { ErreurMetier } from './erreurs.js';
import { verifierJeton, type Session, type TypeSession } from './jeton.js';

declare module 'fastify' {
  interface FastifyRequest {
    session?: Session;
  }
}

/**
 * Garde de route : exige un jeton valide d'un des types donnes.
 *   app.get('/moi', { preHandler: exiger('MENAGE', 'PERSONNEL') }, ...)
 */
export function exiger(...types: TypeSession[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const entete = request.headers.authorization ?? '';
    const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : '';
    const session = jeton ? verifierJeton(jeton) : null;

    if (!session) {
      throw new ErreurMetier(401, 'Connectez-vous pour continuer.');
    }
    if (!types.includes(session.typ)) {
      throw new ErreurMetier(403, "Cet espace n'est pas ouvert avec votre compte.");
    }
    request.session = session;
  };
}

/** Session deja validee par `exiger`. */
export function sessionDe(request: FastifyRequest): Session {
  if (!request.session) throw new ErreurMetier(401, 'Connectez-vous pour continuer.');
  return request.session;
}
