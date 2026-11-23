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

// ---------------------------------------------------------------------------
// Carte bancaire et verification
// ---------------------------------------------------------------------------

/**
 * A valider avec la documentation FlexPay au moment d'ouvrir le compte
 * marchand : les adresses et les champs ci-dessous suivent le fonctionnement
 * decrit pour leur API carte et leur verification de transaction, mais n'ont
 * pas encore ete testes contre leur serveur. Le mode « mock » permet de
 * developper tout le parcours en attendant.
 */

export interface ReponseCarte extends ReponsePaiement {
  /** Page de paiement FlexPay ou envoyer le client. */
  url?: string;
}

export async function demanderPaiementCarte(demande: {
  reference: string;
  montant: number;
  devise?: 'CDF' | 'USD';
  description: string;
  retour: string; // page du site ou revenir apres le paiement
}): Promise<ReponseCarte> {
  if (!configure()) {
    console.info('[flexpay:mock:carte] %s %s FC', demande.reference, demande.montant);
    return {
      accepte: true,
      orderNumber: `MOCK-${demande.reference}`,
      url: `${demande.retour}?paiement=${demande.reference}&simule=1`,
      message: 'Mode simule : aucun paiement reel na ete demande.',
    };
  }

  const reponse = await fetch(env.FLEXPAY_CARD_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      authorization: `Bearer ${env.FLEXPAY_TOKEN}`,
      merchant: env.FLEXPAY_MERCHANT,
      reference: demande.reference,
      amount: String(demande.montant),
      currency: demande.devise ?? 'CDF',
      description: demande.description,
      callback_url: env.FLEXPAY_CALLBACK_URL,
      approve_url: `${demande.retour}?paiement=${demande.reference}&statut=ok`,
      cancel_url: `${demande.retour}?paiement=${demande.reference}&statut=annule`,
      decline_url: `${demande.retour}?paiement=${demande.reference}&statut=refuse`,
      home_url: demande.retour,
    }),
  });

  const corps = (await reponse.json().catch(() => ({}))) as {
    code?: string | number;
    message?: string;
    orderNumber?: string;
    url?: string;
  };

  return {
    accepte: reponse.ok && String(corps.code) === '0' && Boolean(corps.url),
    orderNumber: corps.orderNumber,
    url: corps.url,
    message: corps.message ?? `HTTP ${reponse.status}`,
  };
}

export type EtatTransaction = 'RECU' | 'ECHEC' | 'EN_ATTENTE';

/**
 * Demande a FlexPay l'etat reel d'une transaction. On ne croit jamais
 * seulement le message de rappel recu : n'importe qui peut appeler cette
 * adresse, alors on verifie aupres de la source.
 */
export async function verifierTransaction(orderNumber: string): Promise<EtatTransaction> {
  if (!configure()) {
    return orderNumber.startsWith('MOCK-') ? 'RECU' : 'EN_ATTENTE';
  }

  const reponse = await fetch(`${env.FLEXPAY_BASE_URL}/check/${encodeURIComponent(orderNumber)}`, {
    headers: { authorization: `Bearer ${env.FLEXPAY_TOKEN}` },
  });
  if (!reponse.ok) return 'EN_ATTENTE';

  const corps = (await reponse.json().catch(() => ({}))) as {
    code?: string | number;
    transaction?: { status?: string | number };
  };
  if (String(corps.code) !== '0') return 'EN_ATTENTE';

  // 0 = paye, 1 = echec, 2 = en attente.
  const statut = String(corps.transaction?.status);
  return statut === '0' ? 'RECU' : statut === '1' ? 'ECHEC' : 'EN_ATTENTE';
}

/** Vrai quand FlexPay est configure avec de vrais identifiants. */
export const flexpayReel = configure;
