import type { AgentTerrain } from '@/lib/terrain-api';

export type PageTerrain = 'tournee' | 'encaisser' | 'moi';

export interface ContexteTerrain {
  agent: AgentTerrain;
  aller: (page: PageTerrain) => void;
  /** Session expirée : retour à la connexion, sans perdre ce qui attend d'être envoyé. */
  expirer: () => void;
  annoncer: (texte: string, ok?: boolean) => void;
  /** Nombre de passages notés sans réseau, en attente d'envoi. */
  enAttente: number;
  /** À appeler après avoir changé la file d'attente. */
  actualiserAttente: () => void;
  /** Tente d'envoyer la file ; rend vrai si tout est parti. */
  envoyer: () => Promise<boolean>;
  enLigne: boolean;
  deconnecter: () => void;
  /** Augmente à chaque envoi réussi : les vues se rechargent. */
  versionDonnees: number;
}

export const POSTES = {
  SUPERVISEUR: 'Superviseur',
  CHAUFFEUR: 'Chauffeur',
  EBOUEUR: 'Éboueur',
  RECOUVREMENT: 'Agent de recouvrement',
} as const;

/** « 2026-11-25 » -> « mercredi 25 novembre ». */
export function jourLong(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

export function decaler(date: string, jours: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

export function heureCourte(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kinshasa' });
}
