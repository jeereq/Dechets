import type { StatutCommune } from './communes.js';

/** Langues de l'interface. */
export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';

/** Formules d'abonnement. */
export type Formule = 'PAR_PASSAGE' | 'MENSUELLE';

/** Modes de paiement acceptes. */
export type ModePaiement =
  | 'AIRTEL_MONEY'
  | 'ORANGE_MONEY'
  | 'M_PESA'
  | 'AFRIMONEY'
  | 'CARTE'
  | 'CASH'
  | 'VIREMENT';

/** Canaux de notification. */
export type Canal = 'SMS' | 'WHATSAPP';

/** Une commune telle que l'API la renvoie au site. */
export interface CommunePublique {
  slug: string;
  nom: string;
  statut: StatutCommune;
  /** Nombre de menages servis, nul tant que la commune n'est pas ouverte. */
  menages: number | null;
  ouverteLe: string | null;
}

/** Corps attendu par POST /leads : « prevenez-moi a l'ouverture ». */
export interface CreerLeadPayload {
  telephone: string;
  communeSlug: string;
  nom?: string;
}

/** Corps attendu par POST /contact. */
export interface CreerMessagePayload {
  nom: string;
  telephone: string;
  message: string;
  email?: string;
}

export interface ReponseApi<T> {
  data: T;
}

export interface ErreurApi {
  erreur: string;
  details?: unknown;
}
