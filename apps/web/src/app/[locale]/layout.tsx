import { notFound } from 'next/navigation';
import { LOCALES, estLocale, getDictionnaire } from '@/lib/i18n';
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

  return {
    title: { default: t.meta.nomSite, template: `%s · ${t.meta.nomSite}` },
    description: t.meta.descriptionSite,
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

  return <>{children}</>;
}
