import { notFound } from 'next/navigation';
import { EspaceApp } from '@/components/espace/EspaceApp';
import { getCommunes, getReglages } from '@/lib/api';
import { LOCALES, estLocale, getDictionnaire } from '@/lib/i18n';
import { COORDONNEES } from '@/lib/societe';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!estLocale(locale)) return {};
  const t = getDictionnaire(locale);
  // L'espace personnel n'a rien à faire dans un moteur de recherche.
  return {
    title: t.espace.metaTitre,
    description: t.espace.metaDescription,
    robots: { index: false, follow: false },
  };
}

export default async function EspacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();
  const t = getDictionnaire(locale);
  const [communes, reglages] = await Promise.all([getCommunes(), getReglages()]);

  return (
    <EspaceApp
      locale={locale}
      t={t.espace}
      donnees={{
        communes,
        prix: {
          passage: Number(reglages.prix_par_passage) || 6000,
          mensuel: Number(reglages.prix_mensuel) || 15,
        },
        telService: COORDONNEES.telephone1,
      }}
    />
  );
}
