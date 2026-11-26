'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CARTE, CIRCUITS, ECHELLES, TAS } from '@/lib/carte-camions';
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
 * Immersion : la carte est vue en perspective, légèrement inclinée, et dérive très lentement.
 * Le fond est empilé en couches 3D (le sol, puis cinq étages de bâtiments) : en bougeant, les
 * toits se décalent des murs et du sol, ce qui donne du relief aux immeubles. La carte est
 * inscrite dans un cadre à bords fondus (voir .carte-camions) : elle ne touche jamais le bord
 * de la section.
 *
 * `voile` règle l'assombrissement qui garde le texte lisible : « degrade » si le
 * texte est à gauche, « uniforme » s'il y en a partout.
 */

const arrondi = (n: number) => Math.round(n * 10) / 10;

/** Débord de la scène par rapport au cadre visible (en part de la largeur / hauteur du cadre). */
const DEBORD = { x: 0.18, y: 0.3 } as const;
/** Nombre d'étages de bâtiments dessinés dans carte-lingwala.svg (cc-n1 … cc-n5). */
const ETAGES = [1, 2, 3, 4, 5] as const;

const VUE_INITIALE = `${CARTE.largeur - 343 - 343 * DEBORD.x} ${CARTE.hauteur / 2 - 54 - 108 * DEBORD.y} ${343 * (1 + 2 * DEBORD.x)} ${108 * (1 + 2 * DEBORD.y)}`;

export function CarteCamions({
  voile = 'degrade',
  echelle: echelleImposee,
  centre = false,
}: {
  voile?: 'degrade' | 'uniforme' | 'aucun';
  /** Pixels par unité de carte (par défaut : selon la largeur de l'écran). */
  echelle?: number;
  /** Centre la vue sur la zone des véhicules au lieu de la caler sur le bord droit. */
  centre?: boolean;
}) {
  const racine = useRef<HTMLDivElement>(null);
  const dessin = useRef<SVGSVGElement>(null);
  const [vue, setVue] = useState(VUE_INITIALE);
  const [pas, setPas] = useState(1.6); // épaisseur d'un étage, en pixels d'écran

  useEffect(() => {
    const element = racine.current;
    const svg = dessin.current;
    if (!element || !svg) return;

    // Cadrage : une échelle lisible, centrée sur le cœur de la ville.
    const mesurer = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      const grand = width >= 900;
      const echelle = echelleImposee ?? (grand ? 5 : 3.8); // pixels par unité de carte
      const largeur = width / echelle;
      const hauteur = (largeur * height) / width;
      // Les véhicules sont dans la moitié droite de la carte : sur grand écran on cale la
      // vue sur le bord droit (le texte est à gauche, sous le dégradé) ; sur mobile on la
      // centre sur la zone des véhicules.
      const centreZone = (CARTE.zoneX + CARTE.largeur) / 2;
      const brut = grand && !centre ? CARTE.largeur - largeur : centreZone - largeur / 2;
      const x0 = Math.max(0, Math.min(brut, CARTE.largeur - largeur));
      const y0 = Math.max(0, Math.min(CARTE.hauteur / 2 - hauteur / 2, CARTE.hauteur - hauteur));
      // La scène 3D déborde du cadre : on agrandit la vue d'autant, le cadre voit la même carte.
      setVue(
        `${arrondi(x0 - largeur * DEBORD.x)} ${arrondi(y0 - hauteur * DEBORD.y)} ${arrondi(largeur * (1 + 2 * DEBORD.x))} ${arrondi(hauteur * (1 + 2 * DEBORD.y))}`,
      );
      setPas(Math.round(echelle * 0.27 * 100) / 100);
    };
    mesurer();
    const redim = new ResizeObserver(mesurer);
    redim.observe(element);

    return () => redim.disconnect();
  }, [echelleImposee, centre]);

  useAnimationControle(racine, dessin);

  return (
    <div className={`carte-camions carte-camions--${voile}`} ref={racine} aria-hidden="true">
      <div className="carte-scene" style={{ '--pas': `${pas}px` } as CSSProperties}>
        {/* Sol : rues, îlots, ombres des bâtiments, noms d'avenues */}
        <svg className="carte-couche" viewBox={vue} preserveAspectRatio="xMaxYMid slice" focusable="false">
          <use href="/carte-lingwala.svg#cc-sol" />
        </svg>

        {/* Étages des bâtiments : chaque couche est surélevée d'un cran (translateZ) */}
        {ETAGES.map((n) => (
          <svg
            key={n}
            className="carte-couche"
            style={{ transform: `translateZ(calc(var(--pas) * ${n}))` }}
            viewBox={vue}
            preserveAspectRatio="xMaxYMid slice"
            focusable="false"
          >
            <use href={`/carte-lingwala.svg#cc-n${n}`} />
          </svg>
        ))}

      <svg
        ref={dessin}
        className="carte-couche"
        style={{ transform: 'translateZ(calc(var(--pas) * 0.6))' }}
        viewBox={vue}
        preserveAspectRatio="xMaxYMid slice"
        focusable="false"
      >

        {/* Tas de déchets le long des rues : un halo les signale */}
        {TAS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="none" stroke="#f5a800" strokeWidth="0.4">
            <animate
              attributeName="r"
              values="1.5;5"
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
            const echelle = camion ? ECHELLES.camion : ECHELLES.tricycle;
            return (
              <g key={`${circuit.nom}-${i}`}>
                <animateMotion
                  path={circuit.d}
                  dur={`${circuit.duree}s`}
                  begin={`-${arrondi(circuit.duree * vehicule.phase)}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                />
                <g transform={`scale(${echelle})`}>
                  {/* Ombre portée sur la chaussée */}
                  <rect
                    x={camion ? -7 : -4.6}
                    y={camion ? -2.9 : -2.3}
                    width={camion ? 14 : 9.2}
                    height={camion ? 5.8 : 4.6}
                    rx="1.6"
                    transform="translate(0.9 1.3)"
                    fill="rgba(2,20,10,0.38)"
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
              </g>
            );
          }),
        )}
      </svg>
      </div>
      <div className="carte-lueur" />
    </div>
  );
}
