/** Met en forme un montant en francs congolais : 7000 -> « 7 000 FC ». */
export function formaterPrix(valeur: string | number | undefined, devise = 'CDF'): string {
  if (valeur === undefined || valeur === '') return '—';

  const nombre = typeof valeur === 'number' ? valeur : Number(valeur);
  if (Number.isNaN(nombre)) return String(valeur);

  const separe = nombre.toLocaleString('fr-FR').replace(/ | /g, ' ');
  return `${separe} ${devise === 'CDF' ? 'FC' : devise}`;
}

/** « 2026-11-23T... » -> « 23 novembre 2026 ». */
export function formaterDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
