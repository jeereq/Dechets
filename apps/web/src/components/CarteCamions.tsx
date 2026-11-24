'use client';

import { useEffect, useRef, useState } from 'react';
import { CARTE_KINSHASA } from '@/lib/carte-kinshasa';

/**
 * Fond animé des bandeaux verts : la carte de Kinshasa, ses grandes avenues,
 * et les camions de BENIME qui y circulent.
 *
 * Les contours des communes sont les vrais (OpenStreetMap, voir carte-kinshasa.ts).
 * Les rues sont un tracé STYLISÉ : les grands axes suivent la géographie de la ville
 * (30 Juin, Lumumba, route de Matadi, route de Kikwit…) sans prétendre au relevé exact.
 *
 * Animation SMIL (animateMotion) : fonctionne partout, se met en pause hors écran
 * ou onglet caché, et reste figée si l'appareil demande moins d'animations.
 */

type Pt = [number, number];

const arrondi = (n: number) => Math.round(n * 10) / 10;

/** Courbe de Catmull-Rom → chemin SVG en Béziers. */
function lisse(pts: Pt[]): string {
  let d = `M${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = arrondi(p1[0] + (p2[0] - p0[0]) / 6);
    const c1y = arrondi(p1[1] + (p2[1] - p0[1]) / 6);
    const c2x = arrondi(p2[0] - (p3[0] - p1[0]) / 6);
    const c2y = arrondi(p2[1] - (p3[1] - p1[1]) / 6);
    d += `C${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function longueur(pts: Pt[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  }
  return total * 1.04;
}

/** Grandes avenues, en coordonnées de la carte (935 × 847). */
const AVENUES: Record<string, Pt[]> = {
  // Boulevard du 30 Juin puis boulevard Lumumba, jusqu'à l'aéroport de N'djili
  lumumba: [
    [452, 96],
    [478, 122],
    [502, 150],
    [528, 180],
    [562, 198],
    [620, 216],
    [668, 232],
    [712, 241],
    [780, 250],
    [855, 258],
    [920, 262],
  ],
  // Route de Matadi, vers l'ouest
  matadi: [
    [447, 134],
    [410, 150],
    [372, 178],
    [338, 222],
    [300, 272],
    [250, 318],
    [195, 365],
  ],
  // Avenue Kasa-Vubu puis route de Mont-Ngafula
  kasavubu: [
    [486, 121],
    [470, 160],
    [452, 205],
    [440, 250],
    [430, 300],
    [410, 340],
    [392, 400],
    [393, 470],
    [392, 560],
    [396, 625],
  ],
  // Avenue Bokassa, vers Kisenso
  bokassa: [
    [528, 136],
    [510, 180],
    [492, 230],
    [478, 280],
    [500, 320],
    [540, 350],
    [574, 377],
  ],
  // Route des Poids lourds : Limete, Matete, Ndjili, Kimbanseke
  poidslourds: [
    [500, 215],
    [550, 230],
    [598, 260],
    [630, 300],
    [660, 349],
    [700, 400],
    [752, 459],
    [800, 505],
  ],
  // Lemba, Matete, Masina
  lemba: [
    [513, 337],
    [560, 330],
    [598, 303],
    [640, 285],
    [712, 241],
  ],
  // Limete, Masina, Nsele
  nsele: [
    [590, 160],
    [640, 190],
    [690, 215],
    [712, 241],
    [760, 215],
    [800, 190],
    [830, 170],
    [900, 140],
  ],
  // Kintambo, Bandalungwa, Ngiri-Ngiri
  kintambo: [
    [364, 182],
    [395, 190],
    [430, 205],
    [470, 222],
    [510, 225],
  ],
  // Selembao, Lemba
  selembao: [
    [390, 349],
    [430, 330],
    [470, 335],
    [513, 337],
  ],
  // Mont-Ngafula, Kimbanseke
  kimbanseke: [
    [395, 625],
    [450, 560],
    [520, 500],
    [600, 480],
    [660, 470],
    [752, 459],
  ],
  // Bord du fleuve, Gombe
  gombe: [
    [398, 92],
    [430, 80],
    [470, 72],
    [515, 66],
    [552, 78],
  ],
};

/** Camions : avenue suivie, phase de départ (0 à 1) et nombre de passages en parallèle. */
const CAMIONS: Array<{ avenue: keyof typeof AVENUES; phase: number }> = [
  { avenue: 'lumumba', phase: 0 },
  { avenue: 'lumumba', phase: 0.5 },
  { avenue: 'matadi', phase: 0.2 },
  { avenue: 'kasavubu', phase: 0.35 },
  { avenue: 'bokassa', phase: 0.7 },
  { avenue: 'poidslourds', phase: 0.15 },
  { avenue: 'poidslourds', phase: 0.65 },
  { avenue: 'lemba', phase: 0.5 },
  { avenue: 'nsele', phase: 0.3 },
  { avenue: 'kintambo', phase: 0.8 },
  { avenue: 'selembao', phase: 0.1 },
  { avenue: 'kimbanseke', phase: 0.55 },
  { avenue: 'gombe', phase: 0.4 },
];

const VITESSE = 26; // unités de carte par seconde, en moyenne

const COMMUNES_PERIPHERIQUES = new Set(['Nsele', 'Mont-Ngafula', 'Kimbanseke', 'Ngaliema']);

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

const GRILLE_URBAINE = quadrillage(11, -18) + quadrillage(13, 72);
const GRILLE_PERIPHERIQUE = quadrillage(38, -18) + quadrillage(44, 72);

const TRACES = Object.fromEntries(
  Object.entries(AVENUES).map(([nom, pts]) => [
    nom,
    { d: lisse(pts), duree: Math.round((2 * longueur(pts)) / VITESSE) },
  ]),
) as Record<string, { d: string; duree: number }>;

const VUE_INITIALE = '50 105 900 190';

export function CarteCamions() {
  const racine = useRef<HTMLDivElement>(null);
  const dessin = useRef<SVGSVGElement>(null);
  const [vue, setVue] = useState(VUE_INITIALE);

  useEffect(() => {
    const element = racine.current;
    const svg = dessin.current;
    if (!element || !svg) return;

    // Cadrage : on garde une échelle lisible et on centre sur le cœur de la ville.
    const mesurer = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      const largeur = Math.min(900, Math.max(300, width / 1.6));
      const hauteur = (largeur * height) / width;
      setVue(
        `${arrondi(500 - largeur / 2)} ${arrondi(205 - hauteur / 2)} ${arrondi(largeur)} ${arrondi(hauteur)}`,
      );
    };
    mesurer();
    const redim = new ResizeObserver(mesurer);
    redim.observe(element);

    const sobre = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visibleEcran = true;
    const appliquer = () => {
      if (sobre.matches || !visibleEcran || document.hidden) {
        svg.pauseAnimations();
        // Image fixe : les camions restent répartis sur les avenues.
        if (sobre.matches) svg.setCurrentTime(6);
      } else {
        svg.unpauseAnimations();
      }
    };
    const observateur = new IntersectionObserver(([entree]) => {
      visibleEcran = entree?.isIntersecting ?? true;
      appliquer();
    });
    observateur.observe(element);
    document.addEventListener('visibilitychange', appliquer);
    sobre.addEventListener('change', appliquer);
    appliquer();

    return () => {
      redim.disconnect();
      observateur.disconnect();
      document.removeEventListener('visibilitychange', appliquer);
      sobre.removeEventListener('change', appliquer);
    };
  }, []);

  return (
    <div className="carte-camions" ref={racine} aria-hidden="true">
      <svg
        ref={dessin}
        viewBox={vue}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          {CARTE_KINSHASA.communes.map((commune, i) => (
            <path key={commune.nom} id={`cc-${i}`} d={commune.d} />
          ))}
          <clipPath id="cc-urbain">
            {CARTE_KINSHASA.communes.map((commune, i) =>
              COMMUNES_PERIPHERIQUES.has(commune.nom) ? null : (
                <use key={commune.nom} href={`#cc-${i}`} />
              ),
            )}
          </clipPath>
          <clipPath id="cc-peripherie">
            {CARTE_KINSHASA.communes.map((commune, i) =>
              COMMUNES_PERIPHERIQUES.has(commune.nom) ? (
                <use key={commune.nom} href={`#cc-${i}`} />
              ) : null,
            )}
          </clipPath>
        </defs>

        {CARTE_KINSHASA.communes.map((commune, i) => (
          <use key={commune.nom} href={`#cc-${i}`} fill="rgba(255,255,255,0.085)" />
        ))}

        <g clipPath="url(#cc-urbain)">
          <path
            d={GRILLE_URBAINE}
            stroke="rgba(255,255,255,0.075)"
            strokeWidth="0.55"
            fill="none"
          />
        </g>
        <g clipPath="url(#cc-peripherie)">
          <path
            d={GRILLE_PERIPHERIQUE}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.55"
            fill="none"
          />
        </g>

        {CARTE_KINSHASA.communes.map((commune, i) => (
          <use
            key={commune.nom}
            href={`#cc-${i}`}
            fill="none"
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="0.8"
          />
        ))}

        {Object.entries(TRACES).map(([nom, trace]) => (
          <g key={nom} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={trace.d} stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
            <path d={trace.d} stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
          </g>
        ))}

        {CAMIONS.map((camion, i) => {
          const trace = TRACES[camion.avenue]!;
          return (
            <g key={i}>
              <animateMotion
                path={trace.d}
                dur={`${trace.duree}s`}
                begin={`-${arrondi(trace.duree * camion.phase)}s`}
                repeatCount="indefinite"
                rotate="auto"
                calcMode="spline"
                keyTimes="0;0.5;1"
                keyPoints="0;1;0"
                keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
              />
              <g transform="scale(1.55)">
                <circle r="10" fill="rgba(255,255,255,0.14)" />
                <rect x="-9" y="-2.6" width="18" height="6.4" rx="1.4" fill="rgba(0,0,0,0.28)" />
                <rect x="-9.3" y="-3.4" width="7.2" height="6.8" rx="1.3" fill="#3ddc6a" />
                <rect x="-2.6" y="-3.2" width="8.2" height="6.4" rx="0.8" fill="#ffffff" />
                <rect x="-2.6" y="-0.5" width="8.2" height="1" fill="#2bb24c" />
                <rect x="5.2" y="-3" width="4.1" height="6" rx="1.3" fill="#f3f7f2" />
                <rect x="7.5" y="-2.5" width="1.4" height="5" rx="0.5" fill="#7fc4e8" />
                <circle cx="2.6" cy="0" r="0.9" fill="#f5a800">
                  <animate
                    attributeName="opacity"
                    values="1;0.25;1"
                    dur="0.9s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
