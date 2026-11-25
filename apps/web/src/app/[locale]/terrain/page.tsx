import { notFound } from 'next/navigation';
import { TerrainApp } from '@/components/terrain/TerrainApp';
import { LOCALES, estLocale } from '@/lib/i18n';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// L'application de terrain n'a rien à faire dans un moteur de recherche.
export const metadata: Metadata = {
  title: 'BENIME Terrain',
  robots: { index: false, follow: false },
  manifest: '/terrain.webmanifest',
  appleWebApp: { capable: true, title: 'BENIME Terrain', statusBarStyle: 'default' },
};

export default async function TerrainPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();
  return <TerrainApp locale={locale} />;
}
