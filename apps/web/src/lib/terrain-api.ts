import { appeler, ErreurApi, HORS_RESEAU } from './espace-api';
import { lireJetonGestion } from './gestion-api';

/**
 * Client de l'application de terrain. Le jeton est celui du personnel, partagé
 * avec le back-office : une même personne ouvre les deux avec un seul code SMS.
 */
export function terrain<T>(chemin: string, options: { methode?: string; corps?: unknown } = {}): Promise<T> {
  return appeler<T>(`/terrain${chemin}`, { ...options, jeton: lireJetonGestion() });
}

export function appelerPersonnel<T>(chemin: string, options: { methode?: string; corps?: unknown } = {}): Promise<T> {
  return appeler<T>(chemin, { ...options, jeton: lireJetonGestion() });
}

// --- formes renvoyées par l'API ---------------------------------------------

export type Poste = 'SUPERVISEUR' | 'CHAUFFEUR' | 'EBOUEUR' | 'RECOUVREMENT';

export type Resultat = 'COLLECTE' | 'PERSONNE_SUR_PLACE' | 'ACCES_IMPOSSIBLE' | 'DECHETS_REFUSES' | 'RIEN_A_PRENDRE';

export interface AgentTerrain {
  id: string;
  nom: string;
  telephone: string;
  poste: Poste;
  equipe: { id: string; nom: string; vehicule: 'CAMION' | 'TRICYCLE' } | null;
  peutCollecter: boolean;
  peutEncaisser: boolean;
  aujourdhui: string;
}

export interface PassageTerrain {
  id: string;
  statut: 'A_FAIRE' | 'FAIT' | 'VALIDE' | 'REFUSE';
  resultat: Resultat | null;
  nbSacs: number | null;
  demande: string | null;
  menage: {
    id: string;
    code: string;
    nom: string;
    telephone: string;
    avenue: string;
    parcelle: string;
    repere: string | null;
    commune: { nom: string };
  };
  equipe: { id: string; nom: string };
  /** Enregistré sur ce téléphone, pas encore envoyé : à renvoyer dès que le réseau revient. */
  enAttente?: boolean;
}

export interface Bilan {
  total: number;
  aFaire: number;
  faits: number;
  sacs: number;
}

export interface Tournee {
  date: string;
  aujourdhui: string;
  equipe: { id: string } | null;
  equipes: Array<{ id: string; nom: string }>;
  passages: PassageTerrain[];
  bilan: Bilan;
}

export interface AbonneTrouve {
  code: string;
  nom: string;
  telephone: string;
  avenue: string;
  parcelle: string;
  formule: 'PAR_PASSAGE' | 'MENSUELLE';
  credit: number;
  statut: 'ACTIF' | 'SUSPENDU' | 'RESILIE';
  commune: { nom: string };
}

export interface EncaissementLigne {
  id: string;
  reference: string;
  montant: number;
  mode: 'CASH' | 'VIREMENT' | string;
  objet: string;
  statut: string;
  creeLe: string;
  menage: { code: string; nom: string };
}

export interface Caisse {
  date: string;
  especes: number;
  virements: number;
  elements: EncaissementLigne[];
}

export interface EncaissementFait {
  id: string;
  reference: string;
  montant: number;
  mode: string;
  objet: string;
  statut: string;
  creeLe: string;
}

// --- file d'attente hors-ligne ------------------------------------------------
//
// À Kinshasa le réseau coupe souvent au milieu d'une tournée. Un résultat de
// passage noté sans réseau est gardé dans le téléphone, puis envoyé dès que la
// connexion revient. L'envoi est sans danger à répéter : le serveur donne le
// même résultat si le passage a déjà été enregistré. Les encaissements, eux,
// exigent toujours le réseau : de l'argent ne se met pas en file d'attente.

export interface Marquage {
  passageId: string;
  resultat: Resultat;
  nbSacs?: number;
  le: string;
}

const CLE_ATTENTE = 'benime_terrain_attente';
const CLE_CACHE = 'benime_terrain_cache';
const CLE_AGENT = 'benime_terrain_agent';

function lire<T>(cle: string, defaut: T): T {
  try {
    const brut = window.localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}

function ecrire(cle: string, valeur: unknown): void {
  try {
    window.localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    /* navigation privée ou stockage plein : on continue sans */
  }
}

export const fileAttente = (): Marquage[] => lire<Marquage[]>(CLE_ATTENTE, []);

/** Profil gardé pour ouvrir l'application sans réseau. */
export const garderAgent = (agent: AgentTerrain) => ecrire(CLE_AGENT, agent);
export const agentGarde = (): AgentTerrain | null => lire<AgentTerrain | null>(CLE_AGENT, null);

export function viderTerrainLocal(): void {
  try {
    window.localStorage.removeItem(CLE_ATTENTE);
    window.localStorage.removeItem(CLE_CACHE);
    window.localStorage.removeItem(CLE_AGENT);
  } catch {
    /* rien à vider */
  }
}

/** Dernière tournée reçue, pour l'afficher sans réseau. */
export function garderTournee(cle: string, tournee: Tournee): void {
  const cache = lire<Record<string, Tournee>>(CLE_CACHE, {});
  // On ne garde que les trois dernières pour ne pas remplir le téléphone.
  const garde = Object.entries({ ...cache, [cle]: tournee }).slice(-3);
  ecrire(CLE_CACHE, Object.fromEntries(garde));
}

export const tourneeGardee = (cle: string): Tournee | null => lire<Record<string, Tournee>>(CLE_CACHE, {})[cle] ?? null;

/** Applique les résultats encore en attente à une tournée reçue ou gardée. */
export function avecAttente(tournee: Tournee): Tournee {
  const attente = new Map(fileAttente().map((m) => [m.passageId, m]));
  if (attente.size === 0) return tournee;
  const passages = tournee.passages.map((p) => {
    const m = attente.get(p.id);
    return m && p.statut !== 'VALIDE'
      ? { ...p, statut: 'FAIT' as const, resultat: m.resultat, nbSacs: m.resultat === 'COLLECTE' ? (m.nbSacs ?? null) : null, enAttente: true }
      : p;
  });
  const compte = (s: string) => passages.filter((p) => p.statut === s).length;
  return {
    ...tournee,
    passages,
    bilan: {
      total: passages.length,
      aFaire: compte('A_FAIRE') + compte('REFUSE'),
      faits: compte('FAIT') + compte('VALIDE'),
      sacs: passages.reduce((total, p) => total + (p.nbSacs ?? 0), 0),
    },
  };
}

function poster(m: Marquage) {
  return terrain(`/passages/${m.passageId}/marquer`, {
    corps: { resultat: m.resultat, ...(m.resultat === 'COLLECTE' ? { nbSacs: m.nbSacs } : {}) },
  });
}

/**
 * Note le résultat d'un passage. Sans réseau, le résultat est gardé dans le
 * téléphone et la fonction renvoie `true` (« en attente d'envoi »).
 */
export async function marquerPassage(m: Omit<Marquage, 'le'>): Promise<boolean> {
  const marquage: Marquage = { ...m, le: new Date().toISOString() };
  try {
    await poster(marquage);
    // Un résultat plus ancien pour ce passage n'a plus lieu d'être renvoyé.
    ecrire(CLE_ATTENTE, fileAttente().filter((x) => x.passageId !== m.passageId));
    return false;
  } catch (e) {
    if (e instanceof ErreurApi && e.statut === HORS_RESEAU) {
      ecrire(CLE_ATTENTE, [...fileAttente().filter((x) => x.passageId !== m.passageId), marquage]);
      return true;
    }
    throw e;
  }
}

export interface BilanEnvoi {
  envoyes: number;
  restants: number;
  /** Résultats que le serveur a refusés (passage validé entre-temps, autre équipe...). */
  refuses: Array<{ passageId: string; message: string }>;
}

let envoiEnCours: Promise<BilanEnvoi> | null = null;

/** Envoie ce qui attend. Plusieurs appels simultanés partagent le même envoi. */
export function envoyerAttente(): Promise<BilanEnvoi> {
  if (envoiEnCours) return envoiEnCours;
  envoiEnCours = (async () => {
    const bilan: BilanEnvoi = { envoyes: 0, restants: 0, refuses: [] };
    for (const m of fileAttente()) {
      try {
        await poster(m);
        bilan.envoyes += 1;
        ecrire(CLE_ATTENTE, fileAttente().filter((x) => !(x.passageId === m.passageId && x.le === m.le)));
      } catch (e) {
        if (e instanceof ErreurApi && (e.statut === HORS_RESEAU || e.statut >= 500)) break;
        if (e instanceof ErreurApi && e.statut === 401) throw e;
        // 400, 403, 404, 409 : réessayer ne changerait rien.
        bilan.refuses.push({ passageId: m.passageId, message: e instanceof ErreurApi ? e.message : 'Refusé' });
        ecrire(CLE_ATTENTE, fileAttente().filter((x) => !(x.passageId === m.passageId && x.le === m.le)));
      }
    }
    bilan.restants = fileAttente().length;
    return bilan;
  })().finally(() => {
    envoiEnCours = null;
  });
  return envoiEnCours;
}

export function texteErreurTerrain(e: unknown): string {
  if (e instanceof ErreurApi) {
    if (e.statut === HORS_RESEAU) return 'Pas de réseau. Réessayez quand la connexion revient.';
    if (e.statut >= 500) return 'Un souci est survenu côté serveur. Réessayez dans un moment.';
    return e.message;
  }
  return 'Un souci est survenu. Réessayez.';
}
