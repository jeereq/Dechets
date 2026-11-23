import type { MetadataRoute } from 'next';
import { CHEMINS, LOCALES } from '@/lib/i18n';
import { IDS_SERVICES } from '@/lib/services';
import { urlAbsolue } from '@/lib/seo';

/** Toutes les pages publiques, avec leur version dans chaque langue. */
export default function sitemap(): MetadataRoute.Sitemap {
  const chemins = [
    ...Object.values(CHEMINS),
    ...IDS_SERVICES.map((id) => `${CHEMINS.services}/${id}`),
  ];
  const adresse = (locale: string, chemin: string) =>
    urlAbsolue(chemin ? `/${locale}/${chemin}` : `/${locale}`);

  return chemins.flatMap((chemin) =>
    LOCALES.map((locale) => ({
      url: adresse(locale, chemin),
      lastModified: new Date(),
      changeFrequency: chemin === '' ? ('weekly' as const) : ('monthly' as const),
      priority: chemin === '' ? 1 : chemin.includes('/') ? 0.6 : 0.8,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, adresse(l, chemin)])),
      },
    })),
  );
}
