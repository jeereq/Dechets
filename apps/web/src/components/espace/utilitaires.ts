import type { Locale } from '@/lib/i18n';

/** « Bonjour {nom} » -> « Bonjour Marie ». */
export function remplir(texte: string, valeurs: Record<string, string | number>): string {
  return texte.replace(/\{(\w+)\}/g, (_, cle: string) => String(valeurs[cle] ?? ''));
}

export function dateCourte(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}

export function dateHeure(iso: string, locale: Locale): string {
  const date = new Date(iso);
  return date.toLocaleString(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function dateLongue(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Date locale au format AAAA-MM-JJ, pour le champ « jour ». */
export function isoLocal(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mois}-${jour}`;
}

export function joursA(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoLocal(d);
}
