import { prisma } from '../prisma.js';

/** Valeurs d'exemple utilisees tant que BENIME n'a pas fixe ses tarifs. */
const PAR_DEFAUT: Record<string, number> = {
  prix_par_passage: 2000,
  prix_mensuel: 7000,
};

export async function lireReglageEntier(cle: keyof typeof PAR_DEFAUT): Promise<number> {
  const reglage = await prisma.reglage.findUnique({ where: { cle } });
  const valeur = reglage ? Number.parseInt(reglage.valeur, 10) : Number.NaN;
  return Number.isFinite(valeur) && valeur >= 0 ? valeur : (PAR_DEFAUT[cle] as number);
}
