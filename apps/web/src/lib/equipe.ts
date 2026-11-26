/**
 * Équipe dirigeante affichée sur l'accueil.
 *
 * Les cartes ci-dessous sont PROVISOIRES : elles ne portent que la fonction.
 * Pour publier la version finale, renseignez `nom` (et `photo`, un fichier placé dans
 * public/photos/equipe/, avec l'accord de la personne) ; la carte affiche alors le nom,
 * la photo et la phrase de présentation `presentation`.
 */
export type MembreEquipe = {
  id: string;
  fonction: { fr: string; en: string };
  nom?: string;
  photo?: string;
  presentation?: { fr: string; en: string };
};

export const EQUIPE_DIRIGEANTE: MembreEquipe[] = [
  { id: 'direction', fonction: { fr: 'Direction générale', en: 'General management' } },
  { id: 'assainissement', fonction: { fr: 'Responsable Assainissement', en: 'Head of Sanitation' } },
  { id: 'energie', fonction: { fr: 'Responsable Énergie', en: 'Head of Energy' } },
  { id: 'construction', fonction: { fr: 'Responsable Construction & BTP', en: 'Head of Construction & Public Works' } },
  { id: 'agriculture', fonction: { fr: 'Responsable Agriculture', en: 'Head of Agriculture' } },
  { id: 'events', fonction: { fr: 'Responsable Events / Industrie créative', en: 'Head of Events / Creative Industry' } },
];
