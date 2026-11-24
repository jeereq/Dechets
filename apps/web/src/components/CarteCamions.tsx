'use client';

import { useEffect, useRef, useState } from 'react';
import { CIRCUITS, RESEAU } from '@/lib/carte-camions';
import { useAnimationControle } from '@/lib/useAnimationControle';

/**
 * Fond animé des bandeaux verts : la carte de Kinshasa, ses avenues, et les camions
 * et tricycles de BENIME, chargés de déchets, qui y circulent.
 *
 * Le fond de carte et les véhicules sont dessinés une fois par page dans CarteDefs ;
 * ici on ne fait que les placer et les animer. Chaque véhicule suit un circuit fermé,
 * toujours dans le même sens : il n'y a jamais de marche arrière.
 *
 * Animation SMIL (animateMotion) : fonctionne partout, se met en pause hors écran
 * ou onglet caché, et reste figée si l'appareil demande moins d'animations.
 *
 * `voile` règle l'assombrissement qui garde le texte lisible : « degrade » si le
 * texte est à gauche, « uniforme » s'il y en a partout.
 */

const arrondi = (n: number) => Math.round(n * 10) / 10;

const VUE_INITIALE = '323 96 343 108';

export function CarteCamions({ voile = 'degrade' }: { voile?: 'degrade' | 'uniforme' }) {
  const racine = useRef<HTMLDivElement>(null);
  const dessin = useRef<SVGSVGElement>(null);
  const [vue, setVue] = useState(VUE_INITIALE);

  useEffect(() => {
    const element = racine.current;
    const svg = dessin.current;
    if (!element || !svg) return;

    // Cadrage : une échelle lisible, centrée sur le cœur de la ville.
    const mesurer = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      const echelle = width >= 900 ? 4.2 : 3.4; // pixels par unité de carte
      const largeur = width / echelle;
      const hauteur = (largeur * height) / width;
      setVue(
        `${arrondi(495 - largeur / 2)} ${arrondi(150 - hauteur / 2)} ${arrondi(largeur)} ${arrondi(hauteur)}`,
      );
    };
    mesurer();
    const redim = new ResizeObserver(mesurer);
    redim.observe(element);

    return () => redim.disconnect();
  }, []);

  useAnimationControle(racine, dessin);

  return (
    <div className={`carte-camions carte-camions--${voile}`} ref={racine} aria-hidden="true">
      <svg
        ref={dessin}
        viewBox={vue}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <use href="#cc-fond" />

        {/* Tas de déchets le long des rues : un halo les signale */}
        {RESEAU.tas.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill="none" stroke="#f5a800" strokeWidth="0.45">
            <animate
              attributeName="r"
              values="2;6.5"
              dur="2.8s"
              begin={`-${(i * 0.7).toFixed(1)}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.85;0"
              dur="2.8s"
              begin={`-${(i * 0.7).toFixed(1)}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {CIRCUITS.flatMap((circuit) =>
          circuit.vehicules.map((vehicule, i) => {
            const camion = vehicule.type === 'camion';
            return (
              <g key={`${circuit.nom}-${i}`}>
                <animateMotion
                  path={circuit.d}
                  dur={`${circuit.duree}s`}
                  begin={`-${arrondi(circuit.duree * vehicule.phase)}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                />
                <path
                  d={camion ? 'M6 -1.6L16 -4.6L16 4.6L6 1.6Z' : 'M4 -1.2L11 -3.4L11 3.4L4 1.2Z'}
                  fill="rgba(255,240,180,0.2)"
                />
                <use href={`#cc-${vehicule.type}-${vehicule.niveau}`} />
                {camion ? (
                  <circle cx="3.7" cy="0" r="0.5" fill="#f5a800">
                    <animate
                      attributeName="opacity"
                      values="1;0.2;1"
                      dur="0.9s"
                      repeatCount="indefinite"
                    />
                  </circle>
                ) : null}
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
