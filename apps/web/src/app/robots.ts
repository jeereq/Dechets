import type { MetadataRoute } from 'next';
import { URL_SITE } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/fr/gestion', '/en/gestion', '/fr/espace', '/en/espace'] },
    ],
    sitemap: `${URL_SITE}/sitemap.xml`,
    host: URL_SITE,
  };
}
