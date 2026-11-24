/**
 * Données de l'animation « camions sur la carte de Kinshasa » (voir CarteCamions.tsx).
 *
 * Les rues sont un tracé STYLISÉ : les circuits suivent la géographie de la ville
 * sans prétendre au relevé exact. Coordonnées dans le repère de la carte (935 × 847).
 */

export type Pt = [number, number];

const arrondi = (n: number) => Math.round(n * 10) / 10;

/** Courbe de Catmull-Rom ouverte → chemin SVG en Béziers. */
export function lisse(pts: Pt[]): string {
  let d = `M${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    d += courbe(p0, p1, p2, p3);
  }
  return d;
}

/** Courbe de Catmull-Rom fermée : le véhicule boucle sans à-coup et sans jamais reculer. */
export function lisseFerme(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 0; i < n; i++) {
    d += courbe(pts[(i - 1 + n) % n]!, pts[i]!, pts[(i + 1) % n]!, pts[(i + 2) % n]!);
  }
  return `${d}Z`;
}

function courbe(p0: Pt, p1: Pt, p2: Pt, p3: Pt): string {
  const c1x = arrondi(p1[0] + (p2[0] - p0[0]) / 6);
  const c1y = arrondi(p1[1] + (p2[1] - p0[1]) / 6);
  const c2x = arrondi(p2[0] - (p3[0] - p1[0]) / 6);
  const c2y = arrondi(p2[1] - (p3[1] - p1[1]) / 6);
  return `C${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
}

function perimetre(pts: Pt[]): number {
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total * 1.04;
}

/** Grandes avenues sans circulation de camions : elles complètent le réseau. */
const AVENUES: Pt[][] = [
  // Route de Matadi, vers l'ouest
  [
    [338, 222],
    [300, 272],
    [250, 318],
    [195, 365],
  ],
  // Avenue de l'Université, vers Mont-Ngafula
  [
    [392, 400],
    [393, 470],
    [392, 560],
    [396, 625],
  ],
  // Route de Kikwit, vers Kimbanseke
  [
    [700, 395],
    [752, 459],
    [800, 505],
  ],
  // Route de l'aéroport, vers Nsele
  [
    [712, 241],
    [780, 250],
    [855, 258],
    [920, 262],
  ],
  // Route de Maluku
  [
    [830, 170],
    [900, 140],
    [935, 120],
  ],
  // Mont-Ngafula, Kimbanseke
  [
    [396, 625],
    [450, 560],
    [520, 500],
    [600, 480],
    [660, 470],
    [752, 459],
  ],
];

/** Circuits fermés. Chaque camion ou tricycle parcourt le sien, toujours dans le même sens. */
const CIRCUITS_PTS: Record<string, Pt[]> = {
  // Boulevard du 30 Juin, Lumumba, Lemba, avenue Bokassa
  lumumba: [
    [528, 180],
    [562, 198],
    [620, 216],
    [668, 232],
    [712, 241],
    [672, 268],
    [640, 285],
    [598, 303],
    [560, 330],
    [513, 337],
    [496, 305],
    [478, 280],
    [484, 245],
    [492, 215],
    [510, 195],
  ],
  // Route de Matadi, avenue Kasa-Vubu
  matadi: [
    [447, 134],
    [410, 150],
    [372, 178],
    [338, 222],
    [312, 262],
    [345, 295],
    [392, 305],
    [432, 298],
    [440, 250],
    [452, 205],
    [466, 168],
  ],
  // Bord du fleuve, Gombe, Kinshasa
  gombe: [
    [400, 95],
    [440, 80],
    [490, 70],
    [540, 80],
    [545, 115],
    [520, 142],
    [486, 150],
    [455, 142],
    [425, 120],
  ],
  // Matete, Ndjili, Kisenso
  ndjili: [
    [600, 262],
    [632, 300],
    [662, 349],
    [700, 395],
    [650, 412],
    [600, 395],
    [574, 377],
    [540, 350],
    [560, 320],
    [585, 285],
  ],
  // Masina, Nsele
  masina: [
    [712, 241],
    [760, 215],
    [800, 190],
    [830, 170],
    [872, 188],
    [852, 232],
    [805, 262],
    [752, 262],
  ],
  // Limete
  limete: [
    [545, 120],
    [600, 125],
    [640, 160],
    [625, 200],
    [565, 200],
    [530, 180],
    [522, 150],
  ],
  // Kintambo, Bandalungwa, Ngiri-Ngiri
  kintambo: [
    [364, 182],
    [395, 172],
    [432, 200],
    [470, 222],
    [510, 225],
    [490, 252],
    [450, 262],
    [420, 242],
    [392, 214],
  ],
};

export type TypeVehicule = 'camion' | 'tricycle';

/** Chargements : 0 = presque vide, 3 = plein à ras bord. Les index renvoient à NIVEAUX. */
export const NIVEAUX = [1, 0.8, 0.5, 0.15] as const;

type Vehicule = { type: TypeVehicule; niveau: number; phase: number };

const COMPOSITION: Record<string, Vehicule[]> = {
  lumumba: [
    { type: 'camion', niveau: 0, phase: 0 },
    { type: 'tricycle', niveau: 2, phase: 0.33 },
    { type: 'camion', niveau: 3, phase: 0.66 },
  ],
  matadi: [
    { type: 'camion', niveau: 2, phase: 0.1 },
    { type: 'tricycle', niveau: 0, phase: 0.6 },
  ],
  gombe: [
    { type: 'tricycle', niveau: 3, phase: 0.2 },
    { type: 'tricycle', niveau: 1, phase: 0.7 },
  ],
  ndjili: [
    { type: 'camion', niveau: 1, phase: 0.3 },
    { type: 'tricycle', niveau: 2, phase: 0.8 },
  ],
  masina: [
    { type: 'camion', niveau: 2, phase: 0.5 },
    { type: 'tricycle', niveau: 1, phase: 0 },
  ],
  limete: [{ type: 'tricycle', niveau: 1, phase: 0.4 }],
  kintambo: [
    { type: 'tricycle', niveau: 2, phase: 0.15 },
    { type: 'tricycle', niveau: 3, phase: 0.6 },
  ],
};

const VITESSE = 24; // unités de carte par seconde

export const ROUTES_DECOR: string[] = [
  ...AVENUES.map((pts) => lisse(pts)),
  ...Object.values(CIRCUITS_PTS).map((pts) => lisseFerme(pts)),
];

export const CIRCUITS = Object.entries(CIRCUITS_PTS).map(([nom, pts]) => ({
  nom,
  d: lisseFerme(pts),
  duree: Math.round(perimetre(pts) / VITESSE),
  vehicules: COMPOSITION[nom] ?? [],
}));

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

/** Quadrillage de petites rues, en deux familles de lignes perpendiculaires. */
function quadrillage(pas: number, angle: number): string {
  const rad = (angle * Math.PI) / 180;
  const cx = 468;
  const cy = 423;
  const demi = 760;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  const vx = -uy;
  const vy = ux;
  let d = '';
  for (let k = -demi; k <= demi; k += pas) {
    const ox = cx + vx * k;
    const oy = cy + vy * k;
    d += `M${arrondi(ox - ux * demi)} ${arrondi(oy - uy * demi)}L${arrondi(ox + ux * demi)} ${arrondi(oy + uy * demi)}`;
  }
  return d;
}

export const GRILLE_URBAINE = quadrillage(11, -18) + quadrillage(13, 72);
export const GRILLE_PERIPHERIQUE = quadrillage(38, -18) + quadrillage(44, 72);

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
