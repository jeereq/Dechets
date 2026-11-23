import type { NomIcone } from '@/components/Icone';

/** Icône et photo de chaque activité. Les textes sont dans les dictionnaires. */
export const VISUELS_SERVICES: Record<string, { icone: NomIcone; photo?: string; alt?: string }> = {
  assainissement: { icone: 'recyclage', photo: 'camion.jpg', alt: 'Camion de collecte BENIME' },
  energie: { icone: 'eclair' },
  construction: { icone: 'batiment' },
  agriculture: { icone: 'plante' },
  events: { icone: 'etoile' },
};
