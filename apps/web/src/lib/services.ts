import type { NomIcone } from '@/components/Icone';

export type PhotoService = { fichier: string; alt: string; auteur?: string };

/**
 * Icône et photos de chaque activité. Les textes sont dans les dictionnaires.
 *
 * Les photos d'assainissement sont celles de BENIME. Pour les autres
 * activités, ce sont des photos libres de droits (licence Unsplash) en
 * attendant les photos des vrais chantiers : à remplacer au fur et à mesure.
 */
export const VISUELS_SERVICES: Record<string, { icone: NomIcone; photos: PhotoService[] }> = {
  assainissement: {
    icone: 'recyclage',
    photos: [
      { fichier: 'camion.jpg', alt: 'Camion de collecte BENIME' },
      { fichier: 'equipe.jpg', alt: 'Équipe de collecte BENIME à Limete' },
      { fichier: 'tri-agent.jpg', alt: 'Agent BENIME au tri des déchets' },
      { fichier: 'agents.jpg', alt: 'Agents BENIME en tenue' },
    ],
  },
  energie: {
    icone: 'eclair',
    photos: [
      { fichier: 'services/energie-1.jpg', alt: 'Panneaux solaires installés sur un terrain', auteur: 'American Public Power Association' },
      { fichier: 'services/energie-2.jpg', alt: 'Électricien casqué raccordant un câble', auteur: 'Emmanuel Ikwuegbu' },
      { fichier: 'services/energie-3.jpg', alt: "Technicien travaillant sur un tableau électrique", auteur: 'Raze Solar' },
      { fichier: 'services/energie-4.jpg', alt: 'Rangées de panneaux solaires sous un ciel bleu', auteur: 'American Public Power Association' },
    ],
  },
  construction: {
    icone: 'batiment',
    photos: [
      { fichier: 'services/construction-1.jpg', alt: 'Deux hommes casqués sur un chantier avec échafaudages', auteur: 'Mark Potterton' },
      { fichier: 'services/construction-2.jpg', alt: 'Ouvriers en gilets sur une dalle de béton', auteur: 'Scott Blake' },
      { fichier: 'services/construction-3.jpg', alt: 'Ouvrier sur une charpente en bois', auteur: 'Josh Olalde' },
      { fichier: 'services/construction-4.jpg', alt: 'Immeuble en cours de construction', auteur: 'Tolu Olubode' },
    ],
  },
  agriculture: {
    icone: 'plante',
    photos: [
      { fichier: 'services/agriculture-1.jpg', alt: "Agriculteur au milieu d'un champ de soja", auteur: 'Richard Nyoni' },
      { fichier: 'services/agriculture-2.jpg', alt: 'Ouvrières agricoles plantant dans un champ', auteur: 'alexandr Kornienko' },
      { fichier: 'services/agriculture-3.jpg', alt: 'Mains tenant une poignée de grains', auteur: 'Ali Mkumbwa' },
      { fichier: 'services/agriculture-4.jpg', alt: 'Femme penchée sur ses cultures', auteur: 'Annie Spratt' },
    ],
  },
  events: {
    icone: 'etoile',
    photos: [
      { fichier: 'services/events-1.jpg', alt: 'Scène éclairée devant le public', auteur: 'Nainoa Shizuru' },
      { fichier: 'services/events-2.jpg', alt: "Lumières de scène au-dessus d'une foule", auteur: 'Yvette de Wit' },
      { fichier: 'services/events-3.jpg', alt: "Public enthousiaste pendant un concert", auteur: 'Nicholas Green' },
      { fichier: 'services/events-4.jpg', alt: 'Confettis et lumières devant une scène', auteur: 'Danny Howe' },
    ],
  },
};

export const IDS_SERVICES = Object.keys(VISUELS_SERVICES);
