/**
 * Données de l'animation « camions sur la carte de Kinshasa » (voir CarteCamions.tsx).
 *
 * Le réseau de rues, les circuits et les phases de départ viennent de
 * scripts/generer-circuits.py (carte-camions-donnees.ts) : les rues sont une grille
 * STYLISÉE, et les phases sont calculées pour qu'aucun véhicule n'en touche un autre.
 */

export { CIRCUITS_DONNEES as CIRCUITS, RESEAU } from '@/lib/carte-camions-donnees';

export type TypeVehicule = 'camion' | 'tricycle';

/** Niveaux de chargement : 1 = plein à ras bord, puis de moins en moins chargé. */
export const NIVEAUX = [1, 0.8, 0.5, 0.15] as const;

export const COMMUNES_PERIPHERIQUES = new Set(['Nsele', 'Mont-Ngafula', 'Kimbanseke', 'Ngaliema']);
export const GRANDES_COMMUNES = new Set([
  'Nsele',
  'Mont-Ngafula',
  'Kimbanseke',
  'Ngaliema',
  'Masina',
  'Limete',
  'Selembao',
]);

// --- Chargements -------------------------------------------------------------

export type Sac = { x: number; y: number; r: number; c: string };
export type Debris = { x: number; y: number; l: number; h: number; a: number; c: string };

const COULEURS_SACS = ['#1b2420', '#26312c', '#151b18', '#2d3a46', '#34443a', '#1f2a26'];
const COULEURS_DEBRIS = ['#b08a55', '#8a6a3a', '#7fc4e8', '#d9e2dc'];

function alea(graine: number) {
  let a = graine;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sacs et saletés dans une benne ouverte, vue de dessus. Le chargement part de
 * l'arrière (x0) et avance vers la cabine selon le niveau ; au-delà de 0,75 les
 * sacs débordent de la benne.
 */
export function chargement(opts: {
  niveau: number;
  x0: number;
  longueur: number;
  demiLargeur: number;
  rayon: number;
  graine: number;
}): { sacs: Sac[]; debris: Debris[] } {
  const { niveau, x0, longueur, demiLargeur, rayon, graine } = opts;
  const hasard = alea(graine);
  const sacs: Sac[] = [];
  const debris: Debris[] = [];
  const pas = rayon * 1.55;
  const colonnes = Math.max(1, Math.round((niveau * longueur) / pas));
  const rangees = niveau < 0.3 ? 2 : 3;
  for (let c = 0; c < colonnes; c++) {
    for (let k = 0; k < rangees; k++) {
      const y =
        rangees === 2 ? (k === 0 ? -1 : 1) * demiLargeur * 0.4 : (k - 1) * demiLargeur * 0.64;
      const tirage = hasard();
      sacs.push({
        x: x0 + rayon + c * pas + (hasard() - 0.5) * pas * 0.3,
        y: y + (hasard() - 0.5) * 0.7,
        r: rayon * (0.92 + hasard() * 0.28),
        c:
          tirage < 0.1
            ? '#d9e2dc'
            : tirage < 0.18
              ? '#2e6aa8'
              : COULEURS_SACS[Math.floor(hasard() * COULEURS_SACS.length)]!,
      });
    }
  }
  if (niveau >= 0.75) {
    // Sacs qui débordent sur les côtés, et quelques saletés posées dessus
    for (let c = 1; c < colonnes; c += 2) {
      for (const cote of [-1, 1]) {
        sacs.push({
          x: x0 + rayon + c * pas,
          y: cote * (demiLargeur + rayon * 0.15),
          r: rayon * 0.95,
          c: COULEURS_SACS[Math.floor(hasard() * COULEURS_SACS.length)]!,
        });
      }
    }
  }
  if (niveau >= 0.45) {
    const nb = niveau >= 0.75 ? 7 : 3;
    for (let i = 0; i < nb; i++) {
      debris.push({
        x: x0 + hasard() * Math.min(longueur, colonnes * pas),
        y: (hasard() - 0.5) * demiLargeur * 1.6,
        l: 0.9 + hasard() * 1.1,
        h: 0.5 + hasard() * 0.6,
        a: Math.round(hasard() * 180),
        c: COULEURS_DEBRIS[Math.floor(hasard() * COULEURS_DEBRIS.length)]!,
      });
    }
  }
  return { sacs, debris };
}
