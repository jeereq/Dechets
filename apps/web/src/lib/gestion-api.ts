import { appeler, ErreurApi, HORS_RESEAU } from './espace-api';

/** Jeton du personnel : séparé de celui des ménages, un même téléphone peut avoir les deux. */
const CLE = 'benime_jeton_gestion';

export function lireJetonGestion(): string | null {
  try {
    return window.localStorage.getItem(CLE);
  } catch {
    return null;
  }
}

export function garderJetonGestion(jeton: string | null): void {
  try {
    if (jeton) window.localStorage.setItem(CLE, jeton);
    else window.localStorage.removeItem(CLE);
  } catch {
    /* navigation privée */
  }
}

/** Appel authentifié sous /gestion. */
export function g<T>(chemin: string, options: { methode?: string; corps?: unknown } = {}): Promise<T> {
  return appeler<T>(`/gestion${chemin}`, { ...options, jeton: lireJetonGestion() });
}

export function appelerSimple<T>(chemin: string, options: { methode?: string; corps?: unknown } = {}): Promise<T> {
  return appeler<T>(chemin, { ...options, jeton: lireJetonGestion() });
}

export function texteErreurGestion(e: unknown): string {
  if (e instanceof ErreurApi) {
    if (e.statut === HORS_RESEAU) return 'Pas de connexion. Vérifiez le réseau et réessayez.';
    if (e.statut >= 500) return 'Un souci est survenu côté serveur. Réessayez dans un moment.';
    return e.message;
  }
  return 'Un souci est survenu. Réessayez.';
}

export const sessionExpiree = (e: unknown) => e instanceof ErreurApi && e.statut === 401;

// --- formes renvoyées par l'API ---------------------------------------------

export type Poste = 'SUPERVISEUR' | 'CHAUFFEUR' | 'EBOUEUR' | 'RECOUVREMENT';

export interface Agent {
  id: string;
  nom: string;
  telephone: string;
  poste: Poste;
  equipe: { id: string; nom: string } | null;
}

export interface Page<T> {
  total: number;
  page: number;
  taille: number;
  elements: T[];
}

export interface Tableau {
  menagesActifs: number;
  demandesARecevoir: number;
  demandesPlanifiees: number;
  passagesAValider: number;
  paiementsARapprocher: number;
  encaisseMois: number;
  communesOuvertes: number;
  leadsEnAttente: number;
  contactsATraiter: number;
  creditTotal: number;
  serie: Array<{ date: string; montant: number }>;
  dernieresDemandes: Array<{
    id: string;
    reference: string;
    type: string;
    dateSouhaitee: string | null;
    creeLe: string;
    menage: { nom: string; code: string; avenue: string; commune: { nom: string } };
  }>;
}

export interface LigneMenage {
  id: string;
  code: string;
  nom: string;
  telephone: string;
  commune: { nom: string; slug: string };
  avenue: string;
  parcelle: string;
  formule: 'PAR_PASSAGE' | 'MENSUELLE';
  credit: number;
  statut: 'ACTIF' | 'SUSPENDU' | 'RESILIE';
  equipe: { id: string; nom: string } | null;
  creeLe: string;
}

export interface DetailMenage extends LigneMenage {
  repere: string | null;
  langue: 'FR' | 'EN';
  alerteSms: boolean;
  alerteWa: boolean;
  demandes: Array<{ id: string; reference: string; type: string; statut: string; creeLe: string; cout: number }>;
  paiements: Array<{ id: string; reference: string; montant: number; mode: string; statut: string; creeLe: string }>;
  passages: Array<{ id: string; date: string; statut: string; resultat: string | null }>;
  notifications: Array<{ id: string; canal: string; contenu: string; creeLe: string; statut: string }>;
}

export interface DemandeGestion {
  id: string;
  reference: string;
  type: 'DES_QUE_POSSIBLE' | 'JOUR_PRECIS' | 'PROCHAIN_PASSAGE';
  dateSouhaitee: string | null;
  statut: 'RECUE' | 'PLANIFIEE' | 'TERMINEE' | 'ANNULEE';
  datePlanifiee: string | null;
  cout: number;
  creeLe: string;
  menage: {
    id: string;
    nom: string;
    code: string;
    telephone: string;
    avenue: string;
    parcelle: string;
    repere: string | null;
    commune: { nom: string };
  };
  equipe: { id: string; nom: string } | null;
}

export interface EquipeGestion {
  id: string;
  nom: string;
  vehicule: 'CAMION' | 'TRICYCLE';
  jours: number[];
  commune: { slug: string; nom: string } | null;
  membres: Array<{ id: string; nom: string; poste: Poste }>;
  menages: number;
}

export interface PassageGestion {
  id: string;
  date: string;
  statut: 'A_FAIRE' | 'FAIT' | 'VALIDE' | 'REFUSE';
  resultat: string | null;
  nbSacs: number | null;
  menage: { id: string; code: string; nom: string; telephone: string; avenue: string; parcelle: string; repere: string | null };
  equipe: { id: string; nom: string };
  agent: { nom: string } | null;
}

export interface PaiementGestion {
  id: string;
  reference: string;
  montant: number;
  mode: string;
  objet: string;
  statut: 'EN_ATTENTE' | 'RECU' | 'A_RAPPROCHER' | 'ECHEC';
  creeLe: string;
  menage: { id: string; code: string; nom: string };
  agent: string | null;
}

export interface MembrePersonnel {
  id: string;
  nom: string;
  telephone: string;
  poste: Poste;
  actif: boolean;
  equipe: { id: string; nom: string } | null;
}

export interface CommuneGestion {
  slug: string;
  nom: string;
  statut: 'OUVERTE' | 'DEMANDES_RECUES' | 'FERMEE';
  ouverteLe: string | null;
  menages: number;
  leadsEnAttente: number;
}

export interface ContactGestion {
  id: string;
  nom: string;
  telephone: string;
  email: string | null;
  message: string;
  traiteLe: string | null;
  creeLe: string;
}

export interface RealisationGestion {
  id: string;
  lieu: string;
  date: string;
  legende: string | null;
  publiee: boolean;
}
