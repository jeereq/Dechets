import { prisma } from '../prisma.js';
import { alerterMenage } from './alertes.js';

/**
 * Regle un paiement une seule fois, quoi qu'il arrive : rappel FlexPay en
 * double, verification manuelle en meme temps, agent qui valide deux fois.
 * Le passage EN_ATTENTE/A_RAPPROCHER -> RECU est fait par la base (updateMany
 * conditionnel) ; seule la requete qui l'emporte credite le compte.
 */
export async function confirmerPaiement(paiementId: string): Promise<'confirme' | 'deja_regle'> {
  const resultat = await prisma.$transaction(async (tx) => {
    const change = await tx.paiement.updateMany({
      where: { id: paiementId, statut: { in: ['EN_ATTENTE', 'A_RAPPROCHER'] } },
      data: { statut: 'RECU' },
    });
    if (change.count === 0) return null;

    const paiement = await tx.paiement.findUniqueOrThrow({ where: { id: paiementId } });
    const menage = await tx.menage.update({
      where: { id: paiement.menageId },
      data: { credit: { increment: paiement.montant } },
    });
    return { paiement, menage };
  });

  if (!resultat) return 'deja_regle';

  void alerterMenage(resultat.menage, 'recu_paiement', {
    montant: String(resultat.paiement.montant),
    reference: resultat.paiement.reference,
  });
  return 'confirme';
}

/** Un paiement deja recu ne repasse jamais en echec. */
export async function echouerPaiement(paiementId: string): Promise<void> {
  await prisma.paiement.updateMany({
    where: { id: paiementId, statut: { in: ['EN_ATTENTE', 'A_RAPPROCHER'] } },
    data: { statut: 'ECHEC' },
  });
}

export const MODES_MOBILE = ['AIRTEL_MONEY', 'ORANGE_MONEY', 'M_PESA', 'AFRIMONEY'] as const;
