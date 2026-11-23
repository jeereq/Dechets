import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ZodTypeAny, z } from 'zod';

/** Une erreur que l'on peut montrer telle quelle a la personne. */
export class ErreurMetier extends Error {
  constructor(
    public readonly statut: number,
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

/** Valide un corps ou des parametres : renvoie la valeur typee ou une 400. */
export function lire<S extends ZodTypeAny>(schema: S, valeur: unknown): z.infer<S> {
  const resultat = schema.safeParse(valeur);
  if (!resultat.success) {
    throw new ErreurMetier(400, 'Donnees invalides', {
      details: resultat.error.flatten().fieldErrors,
    });
  }
  return resultat.data;
}

export function gestionnaireErreurs(
  erreur: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (erreur instanceof ErreurMetier) {
    return reply.status(erreur.statut).send({ erreur: erreur.message, ...erreur.extra });
  }

  const statut =
    typeof erreur === 'object' && erreur && 'statusCode' in erreur
      ? Number((erreur as { statusCode: unknown }).statusCode)
      : 500;

  if (statut >= 400 && statut < 500) {
    return reply
      .status(statut)
      .send({ erreur: erreur instanceof Error ? erreur.message : 'Requete invalide' });
  }

  request.log.error(erreur);
  return reply.status(500).send({ erreur: 'Une erreur est survenue. Reessayez dans un moment.' });
}
