import type { Prisma } from '@prisma/client';

type Client = Prisma.TransactionClient;

/**
 * Reference lisible et sans doublon, meme avec des demandes simultanees :
 * le compteur est incremente par la base, pas calcule en memoire.
 */
export async function prochaineReference(
  tx: Client,
  prefixe: 'MN' | 'DM' | 'PM',
): Promise<string> {
  const compteur = await tx.compteur.upsert({
    where: { cle: prefixe },
    update: { valeur: { increment: 1 } },
    create: { cle: prefixe, valeur: 1 },
  });
  return `${prefixe}-${String(compteur.valeur).padStart(4, '0')}`;
}
