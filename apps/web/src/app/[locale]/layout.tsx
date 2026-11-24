import { Atkinson_Hyperlegible } from 'next/font/google';
import { notFound } from 'next/navigation';
import { DonneesStructurees } from '@/components/DonneesStructurees';
import { LOCALES, estLocale, getDictionnaire } from '@/lib/i18n';
import { URL_SITE, urlAbsolue } from '@/lib/seo';
import { COORDONNEES, MENTIONS } from '@/lib/societe';
import type { Metadata, Viewport } from 'next';
import '../globals.css';

const police = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--police',
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#0F6B37',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!estLocale(locale)) return {};
  const t = getDictionnaire(locale);

  return {
    metadataBase: new URL(URL_SITE),
    applicationName: t.meta.nomSite,
    title: { default: t.meta.titreAccueil, template: `%s · ${t.meta.nomSite}` },
    description: t.meta.descriptionSite,
    manifest: '/manifest.webmanifest',
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: { siteName: t.meta.nomSite, type: 'website' },
    formatDetection: { telephone: true, email: true, address: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();
  const t = getDictionnaire(locale);

  const entreprise = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${URL_SITE}/#entreprise`,
    name: COORDONNEES.activite,
    legalName: COORDONNEES.raisonSociale,
    url: urlAbsolue(`/${locale}`),
    logo: urlAbsolue('/icon-512.png'),
    image: urlAbsolue(`/${locale}/og`),
    description: t.meta.descriptionSite,
    telephone: [COORDONNEES.telephone1, COORDONNEES.telephone2].map((n) => n.replace(/\s/g, '')),
    email: COORDONNEES.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '65A Avenue Lubefu, Quartier Mososo',
      addressLocality: 'Limete',
      addressRegion: 'Kinshasa',
      addressCountry: 'CD',
    },
    areaServed: { '@type': 'AdministrativeArea', name: 'Lingwala, Kinshasa' },
    knowsLanguage: ['fr', 'en'],
    // NIF : A2324487S (voir MENTIONS) — identifiant fiscal de la societe.
    taxID: MENTIONS.find((m) => m.startsWith('NIF'))?.replace('NIF : ', ''),
  };

  return (
    <html lang={locale} className={police.variable}>
      <body style={{ fontFamily: 'var(--police), system-ui, sans-serif' }}>
        <DonneesStructurees donnees={entreprise} />
        {children}
      </body>
    </html>
  );
}
