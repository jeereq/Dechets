import { API_BASE } from './api';

/**
 * Client de l'espace ménage. Le jeton de session (obtenu par code SMS) est
 * gardé dans le téléphone et envoyé à chaque appel.
 */

const CLE_JETON = 'benime_jeton';

export function lireJeton(): string | null {
  try {
    return window.localStorage.getItem(CLE_JETON);
  } catch {
    return null;
  }
}

export function garderJeton(jeton: string | null): void {
  try {
    if (jeton) window.localStorage.setItem(CLE_JETON, jeton);
    else window.localStorage.removeItem(CLE_JETON);
  } catch {
    /* navigation privée : la session durera le temps de l'onglet */
  }
}

export class ErreurApi extends Error {
  constructor(
    public statut: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** 0 = pas de réseau. */
export const HORS_RESEAU = 0;

export async function appeler<T>(
  chemin: string,
  options: { methode?: string; corps?: unknown; jeton?: string | null } = {},
): Promise<T> {
  const jeton = options.jeton === undefined ? lireJeton() : options.jeton;
  let reponse: Response;
  try {
    reponse = await fetch(`${API_BASE}${chemin}`, {
      method: options.methode ?? (options.corps ? 'POST' : 'GET'),
      headers: {
        ...(options.corps ? { 'content-type': 'application/json' } : {}),
        ...(jeton ? { authorization: `Bearer ${jeton}` } : {}),
      },
      body: options.corps ? JSON.stringify(options.corps) : undefined,
    });
  } catch {
    throw new ErreurApi(HORS_RESEAU, 'reseau');
  }

  const corps = (await reponse.json().catch(() => ({}))) as {
    data?: T;
    erreur?: string;
    details?: unknown;
  };
  if (!reponse.ok) throw new ErreurApi(reponse.status, corps.erreur ?? 'erreur', corps.details);
  return corps.data as T;
}

// --- formes renvoyées par l'API ---------------------------------------------

export type Formule = 'PAR_PASSAGE' | 'MENSUELLE';

export interface Menage {
  id: string;
  code: string;
  nom: string;
  telephone: string;
  commune: { slug: string; nom: string };
  avenue: string;
  parcelle: string;
  repere: string | null;
  formule: Formule;
  langue: 'FR' | 'EN';
  alerteSms: boolean;
  alerteWa: boolean;
  credit: number;
  statut: string;
}

export interface Demande {
  id: string;
  reference: string;
  type: 'DES_QUE_POSSIBLE' | 'JOUR_PRECIS' | 'PROCHAIN_PASSAGE';
  dateSouhaitee: string | null;
  statut: 'RECUE' | 'PLANIFIEE' | 'TERMINEE' | 'ANNULEE';
  datePlanifiee: string | null;
  cout: number;
  creeLe: string;
}

export interface Paiement {
  id: string;
  reference: string;
  montant: number;
  mode: string;
  objet: string;
  statut: 'EN_ATTENTE' | 'RECU' | 'A_RAPPROCHER' | 'ECHEC';
  creeLe: string;
}

export interface Message {
  id: string;
  canal: 'SMS' | 'WHATSAPP';
  modele: string;
  contenu: string;
  statut: string;
  creeLe: string;
}

export interface Recu {
  numero: string;
  date: string;
  montant: number;
  devise: string;
  mode: string;
  objet: string;
  abonne: { code: string; nom: string; telephone: string };
  emetteur: string;
}

export interface ApercuDemande {
  cout: number;
  credit: number;
  resteApres: number;
  suffisant: boolean;
}

export const MONTANT_MIN = 500;
export const MONTANT_MAX = 500_000;
