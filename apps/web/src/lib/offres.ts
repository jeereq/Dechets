import { getDictionnaire, lien, type Locale } from '@/lib/i18n';

/**
 * Les offres de la grille tarifaire (dictionnaire `formules.grille`), identifiées par leur
 * position : « g1-2 » = deuxième ligne du premier groupe... Le menu « Tarification » et la
 * grille y renvoient vers la page Contact, dont le message est alors prérempli.
 */
export type Offre = { id: string; nom: string; prix: string; etiquette: string };
export type GroupeOffres = { titre: string; offres: Offre[] };

export function groupesOffres(locale: Locale): GroupeOffres[] {
  return getDictionnaire(locale).formules.grille.map((groupe, g) => ({
    titre: groupe.titre,
    offres: groupe.lignes.map((ligne, l) => ({
      id: `g${g}-${l}`,
      nom: ligne.nom,
      prix: ligne.prix,
      etiquette: `${groupe.titre} · ${ligne.nom} (${ligne.prix})`,
    })),
  }));
}

/** id -> libellé complet, pour préremplir le message du formulaire de contact. */
export function etiquettesOffres(locale: Locale): Record<string, string> {
  return Object.fromEntries(groupesOffres(locale).flatMap((g) => g.offres.map((o) => [o.id, o.etiquette])));
}

/** Adresse de la page Contact avec l'offre choisie, ouverte sur le formulaire. */
export function lienOffre(locale: Locale, id: string): string {
  return `${lien(locale, 'questions')}?offre=${id}#ecrire`;
}
