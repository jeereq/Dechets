import type { Metadata } from 'next';
import { LOCALES, type Locale } from './i18n';

/**
 * Adresse publique du site : variable d'environnement, sinon l'adresse de
 * production fournie par Vercel, sinon le poste local.
 */
export const URL_SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
).replace(/\/$/, '');

export const urlAbsolue = (chemin: string) => `${URL_SITE}${chemin.startsWith('/') ? chemin : `/${chemin}`}`;

/** Langue au format Open Graph. */
const LOCALE_OG: Record<Locale, string> = { fr: 'fr_FR', en: 'en_US' };

/** Description de 155 caracteres au plus, coupee a la fin d'un mot. */
export function resumer(texte: string, max = 155): string {
  const propre = texte.replace(/\s+/g, ' ').trim();
  if (propre.length <= max) return propre;
  const coupe = propre.slice(0, max - 1);
  return `${coupe.slice(0, coupe.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '')}…`;
}

const cheminLocale = (locale: Locale, chemin: string) => (chemin ? `/${locale}/${chemin}` : `/${locale}`);

/**
 * Metadonnees d'une page : titre, description, adresse canonique, langues
 * alternatives (hreflang) et partage sur les reseaux.
 * `chemin` : '' pour l'accueil, sinon 'questions', 'nos-services/energie'...
 */
export function metaPage({
  locale,
  chemin,
  titre,
  description,
  titreComplet,
}: {
  locale: Locale;
  chemin: string;
  titre: string;
  description: string;
  /** Titre a utiliser tel quel, sans le suffixe du site (accueil). */
  titreComplet?: string;
}): Metadata {
  const resume = resumer(description);
  const canonique = cheminLocale(locale, chemin);
  const langues = Object.fromEntries(LOCALES.map((l) => [l, cheminLocale(l, chemin)]));

  return {
    title: titreComplet ? { absolute: titreComplet } : titre,
    description: resume,
    alternates: {
      canonical: canonique,
      languages: { ...langues, 'x-default': cheminLocale('fr', chemin) },
    },
    openGraph: {
      type: 'website',
      url: canonique,
      title: titreComplet ?? titre,
      description: resume,
      locale: LOCALE_OG[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_OG[l]),
      images: [
        {
          url: `/${locale}/og`,
          width: 1200,
          height: 630,
          alt: titreComplet ?? titre,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titreComplet ?? titre,
      description: resume,
      images: [`/${locale}/og`],
    },
  };
}

