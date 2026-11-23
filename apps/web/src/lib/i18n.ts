import { en } from './dictionnaires/en';
import { fr, type Dictionnaire } from './dictionnaires/fr';
import { ln } from './dictionnaires/ln';

export const LOCALES = ['fr', 'ln', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_PAR_DEFAUT: Locale = 'fr';

export const ETIQUETTES_LOCALES: Record<Locale, string> = {
  fr: 'FR',
  ln: 'LN',
  en: 'EN',
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly (infer U)[]
    ? readonly U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

function fusionner<T>(base: T, surcouche: DeepPartial<T> | undefined): T {
  if (!surcouche) return base;

  const resultat = { ...base } as Record<string, unknown>;

  for (const [cle, valeur] of Object.entries(surcouche as Record<string, unknown>)) {
    if (valeur === undefined) continue;

    const valeurBase = (base as Record<string, unknown>)[cle];

    if (
      valeurBase &&
      typeof valeurBase === 'object' &&
      !Array.isArray(valeurBase) &&
      valeur &&
      typeof valeur === 'object' &&
      !Array.isArray(valeur)
    ) {
      resultat[cle] = fusionner(valeurBase, valeur as DeepPartial<unknown>);
    } else {
      resultat[cle] = valeur;
    }
  }

  return resultat as T;
}

const SURCOUCHES: Record<Locale, DeepPartial<Dictionnaire> | undefined> = {
  fr: undefined,
  ln,
  en,
};

/**
 * Renvoie le dictionnaire complet d'une langue.
 * Toute cle absente retombe sur le francais : une traduction partielle
 * n'affiche jamais de texte vide.
 */
export function getDictionnaire(locale: Locale): Dictionnaire {
  return fusionner(fr, SURCOUCHES[locale]);
}

export function estLocale(valeur: string): valeur is Locale {
  return (LOCALES as readonly string[]).includes(valeur);
}

/** Chemins des pages, par langue. Les segments restent en francais. */
export const CHEMINS = {
  accueil: '',
  travaux: 'nos-travaux',
  zones: 'ou-nous-passons',
  valorisation: 'ou-vont-vos-dechets',
  formules: 'formules',
  questions: 'questions',
} as const;

export function lien(locale: Locale, cle: keyof typeof CHEMINS): string {
  const segment = CHEMINS[cle];
  return segment ? `/${locale}/${segment}` : `/${locale}`;
}

export type { Dictionnaire };
