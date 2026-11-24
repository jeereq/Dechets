'use client';

import { useEffect, useRef, useState } from 'react';
import { CIRCUITS } from '@/lib/carte-camions';

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

const VUE_INITIALE = '50 105 900 190';

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
        // Image fixe : les véhicules restent répartis sur les circuits.
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

        {/* Lingwala, commune pilote : un halo qui pulse */}
        <circle cx="447" cy="134" r="4" fill="none" stroke="#f5a800" strokeWidth="1">
          <animate attributeName="r" values="4;16" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="2.6s" repeatCount="indefinite" />
        </circle>

        {CIRCUITS.flatMap((circuit) =>
          circuit.vehicules.map((vehicule, i) => (
            <g key={`${circuit.nom}-${i}`}>
              <animateMotion
                path={circuit.d}
                dur={`${circuit.duree}s`}
                begin={`-${arrondi(circuit.duree * vehicule.phase)}s`}
                repeatCount="indefinite"
                rotate="auto"
              />
              <g transform={`scale(${vehicule.type === 'camion' ? 1.6 : 1.9})`}>
                <circle r="12" fill="rgba(255,255,255,0.1)" />
                <use href={`#cc-${vehicule.type}-${vehicule.niveau}`} />
                {vehicule.type === 'camion' ? (
                  <circle cx="8.4" cy="0" r="0.95" fill="#f5a800">
                    <animate
                      attributeName="opacity"
                      values="1;0.2;1"
                      dur="0.9s"
                      repeatCount="indefinite"
                    />
                  </circle>
                ) : null}
              </g>
            </g>
          )),
        )}
      </svg>
    </div>
  );
}
