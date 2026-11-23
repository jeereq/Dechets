/**
 * Les 24 communes de Kinshasa.
 *
 * `statut` est la valeur de depart utilisee par le seed de la base. En
 * production, c'est la table `Commune` qui fait foi : le back-office ouvre et
 * ferme les communes, et le site lit la base, jamais cette liste.
 */
export type StatutCommune = 'OUVERTE' | 'DEMANDES_RECUES' | 'FERMEE';

export interface CommuneSeed {
  /** Identifiant d'URL, en minuscules sans accent. */
  slug: string;
  nom: string;
  statut: StatutCommune;
}

export const COMMUNES_KINSHASA: readonly CommuneSeed[] = [
  { slug: 'bandalungwa', nom: 'Bandalungwa', statut: 'FERMEE' },
  { slug: 'barumbu', nom: 'Barumbu', statut: 'FERMEE' },
  { slug: 'bumbu', nom: 'Bumbu', statut: 'FERMEE' },
  { slug: 'gombe', nom: 'Gombe', statut: 'FERMEE' },
  { slug: 'kalamu', nom: 'Kalamu', statut: 'FERMEE' },
  { slug: 'kasa-vubu', nom: 'Kasa-Vubu', statut: 'FERMEE' },
  { slug: 'kimbanseke', nom: 'Kimbanseke', statut: 'FERMEE' },
  { slug: 'kinshasa', nom: 'Kinshasa', statut: 'FERMEE' },
  { slug: 'kintambo', nom: 'Kintambo', statut: 'FERMEE' },
  { slug: 'kisenso', nom: 'Kisenso', statut: 'FERMEE' },
  { slug: 'lemba', nom: 'Lemba', statut: 'FERMEE' },
  { slug: 'limete', nom: 'Limete', statut: 'OUVERTE' },
  { slug: 'lingwala', nom: 'Lingwala', statut: 'FERMEE' },
  { slug: 'makala', nom: 'Makala', statut: 'FERMEE' },
  { slug: 'maluku', nom: 'Maluku', statut: 'FERMEE' },
  { slug: 'masina', nom: 'Masina', statut: 'FERMEE' },
  { slug: 'matete', nom: 'Matete', statut: 'FERMEE' },
  { slug: 'mont-ngafula', nom: 'Mont-Ngafula', statut: 'FERMEE' },
  { slug: 'ndjili', nom: 'Ndjili', statut: 'FERMEE' },
  { slug: 'ngaba', nom: 'Ngaba', statut: 'FERMEE' },
  { slug: 'ngaliema', nom: 'Ngaliema', statut: 'FERMEE' },
  { slug: 'ngiri-ngiri', nom: 'Ngiri-Ngiri', statut: 'FERMEE' },
  { slug: 'nsele', nom: 'Nsele', statut: 'FERMEE' },
  { slug: 'selembao', nom: 'Selembao', statut: 'FERMEE' },
];
