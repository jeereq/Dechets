import { prisma } from '../prisma.js';

/** Grille tarifaire BENIME du 18/11/2026 (menage simple) : 6 000 FC l'evacuation, 15 USD par mois. */
const PAR_DEFAUT: Record<string, number> = {
  prix_par_passage: 6000,
  prix_mensuel: 15,
};

export async function lireReglageEntier(cle: keyof typeof PAR_DEFAUT): Promise<number> {
  const reglage = await prisma.reglage.findUnique({ where: { cle } });
  const valeur = reglage ? Number.parseInt(reglage.valeur, 10) : Number.NaN;
  return Number.isFinite(valeur) && valeur >= 0 ? valeur : (PAR_DEFAUT[cle] as number);
}
