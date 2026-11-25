import { notFound } from 'next/navigation';
import { GestionApp } from '@/components/gestion/GestionApp';
import { LOCALES, estLocale } from '@/lib/i18n';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Le back-office n'a rien à faire dans un moteur de recherche.
export const metadata: Metadata = {
  title: 'Back-office',
  robots: { index: false, follow: false },
};

export default async function GestionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();
  return <GestionApp locale={locale} />;
}
