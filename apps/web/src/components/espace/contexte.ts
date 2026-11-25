import type { CommunePublique } from '@benime/shared';
import type { Dictionnaire } from '@/lib/dictionnaires/fr';
import { ErreurApi, HORS_RESEAU, type Menage } from '@/lib/espace-api';
import type { Locale } from '@/lib/i18n';

export type TextesEspace = Dictionnaire['espace'];
export type Vue = 'accueil' | 'passages' | 'credit' | 'messages' | 'profil';

export interface Contexte {
  locale: Locale;
  t: TextesEspace;
  menage: Menage;
  majMenage: (menage: Menage) => void;
  aller: (vue: Vue) => void;
  /** Appelé quand l'API répond 401 : on revient à l'écran de connexion. */
  expirer: () => void;
  prix: { passage: number; mensuel: number };
  telService: string;
}

export interface DonneesPubliques {
  communes: CommunePublique[];
  prix: { passage: number; mensuel: number };
  telService: string;
}

/** Texte à montrer pour une erreur d'API, dans la langue de la personne. */
export function texteErreur(erreur: unknown, t: TextesEspace): string {
  if (erreur instanceof ErreurApi) {
    if (erreur.statut === HORS_RESEAU) return t.erreurReseau;
    if (erreur.statut >= 500) return t.erreurGenerique;
    return erreur.message;
  }
  return t.erreurGenerique;
}

export function estSessionExpiree(erreur: unknown): boolean {
  return erreur instanceof ErreurApi && erreur.statut === 401;
}
