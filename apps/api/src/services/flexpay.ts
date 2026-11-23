import { env } from '../env.js';

/**
 * FlexPay : mobile money et carte bancaire.
 *
 * Ce module ne fait que parler a FlexPay. Il n'ecrit pas en base : c'est la
 * route de paiement qui enregistre le resultat, pour que la logique metier
 * reste au meme endroit.
 *
 * Sans identifiants, le mode « mock » renvoie une reponse credible afin que le
 * parcours de paiement soit testable avant l'ouverture du compte marchand.
 */

export interface DemandePaiement {
  telephone: string; // format international, +243...
  montant: number; // en francs congolais
  reference: string; // notre reference interne, PM-0001
  devise?: 'CDF' | 'USD';
}

export interface ReponsePaiement {
  accepte: boolean;
  orderNumber?: string;
  message: string;
}

const configure = () => Boolean(env.FLEXPAY_MERCHANT && env.FLEXPAY_TOKEN);

export async function demanderPaiementMobile(
  demande: DemandePaiement,
): Promise<ReponsePaiement> {
  if (!configure()) {
    console.info('[flexpay:mock] %s %s FC (%s)', demande.telephone, demande.montant, demande.reference);
    return {
      accepte: true,
      orderNumber: `MOCK-${demande.reference}`,
      message: 'Mode simule : aucun paiement reel na ete demande.',
    };
  }

  const reponse = await fetch(`${env.FLEXPAY_BASE_URL}/paymentService`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.FLEXPAY_TOKEN}`,
    },
    body: JSON.stringify({
      merchant: env.FLEXPAY_MERCHANT,
      type: '1', // 1 = mobile money
      reference: demande.reference,
      amount: String(demande.montant),
      currency: demande.devise ?? 'CDF',
      phone: demande.telephone.replace('+', ''),
      callbackUrl: env.FLEXPAY_CALLBACK_URL,
    }),
  });

  const corps = (await reponse.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
    orderNumber?: string;
  };

  return {
    accepte: reponse.ok && corps.code === '0',
    orderNumber: corps.orderNumber,
    message: corps.message ?? `HTTP ${reponse.status}`,
  };
}

export interface NotificationFlexpay {
  code: string;
  reference: string;
  orderNumber?: string;
  amount?: string;
  phone?: string;
}

/** Vrai quand FlexPay confirme que l'argent est arrive. */
export function paiementConfirme(notification: NotificationFlexpay): boolean {
  return notification.code === '0';
}
