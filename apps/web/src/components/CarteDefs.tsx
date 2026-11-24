import { CARTE_KINSHASA } from '@/lib/carte-kinshasa';
import {
  chargement,
  COMMUNES_PERIPHERIQUES,
  GRANDES_COMMUNES,
  NIVEAUX,
  RESEAU,
  type Debris,
  type Sac,
} from '@/lib/carte-camions';

/**
 * Éléments partagés de l'animation CarteCamions, déclarés une seule fois par page :
 * fond de carte (communes, quartiers, rues), camions et tricycles. Chaque bandeau vert
 * n'a qu'à les référencer avec <use>.
 *
 * Proportions : la route fait 9 unités de large, le camion 4,4 sur 12,5 et le tricycle
 * 3,5 sur 7,6 — un camion occupe donc à peu près la moitié de la chaussée.
 */

const TEINTES = ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.075)', 'rgba(255,255,255,0.04)'];
const TOITS = ['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.09)'];

function Sacs({ sacs, debris }: { sacs: Sac[]; debris: Debris[] }) {
  return (
    <>
      {sacs.map((sac, i) => (
        <g key={i}>
          <circle cx={sac.x} cy={sac.y} r={sac.r} fill={sac.c} />
          <circle
            cx={sac.x - sac.r * 0.3}
            cy={sac.y - sac.r * 0.32}
            r={sac.r * 0.38}
            fill="rgba(255,255,255,0.2)"
          />
        </g>
      ))}
      {debris.map((d, i) => (
        <rect
          key={i}
          x={d.x - d.l / 2}
          y={d.y - d.h / 2}
          width={d.l}
          height={d.h}
          rx="0.2"
          fill={d.c}
          transform={`rotate(${d.a} ${d.x} ${d.y})`}
        />
      ))}
    </>
  );
}

/** Camion à benne ouverte, vu de dessus, tourné vers la droite (12,5 × 4,4). */
function Camion({ niveau, index }: { niveau: number; index: number }) {
  const charge = chargement({
    niveau,
    x0: -10,
    longueur: 15.4,
    demiLargeur: 3.4,
    rayon: 1.55,
    graine: 11 + index,
  });
  return (
    <g id={`cc-camion-${index}`}>
      <g transform="scale(0.5)">
        <rect x="-12" y="-3.6" width="25" height="9" rx="2.2" fill="rgba(0,0,0,0.3)" />
        {[-8.2, -3.6, 7].map((x) => (
          <g key={x} fill="#141715">
            <rect x={x} y="-5.7" width="3.6" height="1.5" rx="0.6" />
            <rect x={x} y="4.2" width="3.6" height="1.5" rx="0.6" />
          </g>
        ))}
        <rect x="-11" y="-4.4" width="17.6" height="8.8" rx="1.3" fill="#f7f8f6" />
        <rect x="-11" y="-4.4" width="17.6" height="0.9" rx="0.4" fill="#2bb24c" />
        <rect x="-11" y="3.5" width="17.6" height="0.9" rx="0.4" fill="#2bb24c" />
        <rect x="-10" y="-3.4" width="15.6" height="6.8" rx="0.8" fill="#c4ccc1" />
        <Sacs {...charge} />
        <rect x="6.9" y="-4.1" width="5.1" height="8.2" rx="1.7" fill="#f3f7f2" />
        <rect x="7.3" y="-3.5" width="2.4" height="7" rx="1" fill="#e2e9e4" />
        <rect x="10" y="-3.2" width="1.5" height="6.4" rx="0.5" fill="#7fc4e8" />
        <rect x="9.2" y="-5.1" width="1" height="0.9" fill="#141715" />
        <rect x="9.2" y="4.2" width="1" height="0.9" fill="#141715" />
      </g>
    </g>
  );
}

/** Tricycle à benne ouverte, vu de dessus, tourné vers la droite (7,6 × 3,5). */
function Tricycle({ niveau, index }: { niveau: number; index: number }) {
  const charge = chargement({
    niveau,
    x0: -5.4,
    longueur: 6.8,
    demiLargeur: 2,
    rayon: 1.02,
    graine: 41 + index,
  });
  return (
    <g id={`cc-tricycle-${index}`}>
      <g transform="scale(0.45)">
        <rect x="-7" y="-3.2" width="15.5" height="7" rx="1.6" fill="rgba(0,0,0,0.28)" />
        <g fill="#141715">
          <rect x="-4.6" y="-3.9" width="3.2" height="1.2" rx="0.5" />
          <rect x="-4.6" y="2.7" width="3.2" height="1.2" rx="0.5" />
        </g>
        <rect x="-6.3" y="-2.9" width="8.6" height="5.8" rx="0.9" fill="#6a7f52" />
        <rect x="-5.4" y="-2.1" width="6.8" height="4.2" rx="0.5" fill="#b9c3a6" />
        <Sacs {...charge} />
        <rect x="2.3" y="-2.5" width="4" height="5" rx="1.4" fill="#3b4a2f" />
        <rect x="2.6" y="-2" width="1.8" height="4" rx="0.8" fill="#4a5c38" />
        <circle cx="3.8" cy="0" r="1.15" fill="#f3f7f2" />
        <rect x="6.1" y="-2.8" width="0.7" height="5.6" rx="0.3" fill="#202422" />
        <rect x="6.4" y="-0.6" width="2.7" height="1.2" rx="0.5" fill="#141715" />
      </g>
    </g>
  );
}

export function CarteDefs() {
  const communes = CARTE_KINSHASA.communes;
  const routes = [...RESEAU.aretes, ...RESEAU.boucles];
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', overflow: 'hidden' }}
    >
      <defs>
        {communes.map((commune, i) => (
          <path key={commune.nom} id={`cc-${i}`} d={commune.d} />
        ))}

        <g id="cc-fond">
          {communes.map((commune, i) =>
            commune.nom === 'Lingwala' ? (
              <use key={commune.nom} href={`#cc-${i}`} fill="rgba(245,168,0,0.17)" />
            ) : (
              <use key={commune.nom} href={`#cc-${i}`} fill={TEINTES[i % TEINTES.length]} />
            ),
          )}

          {communes.map((commune, i) =>
            commune.nom === 'Lingwala' ? (
              <use
                key={commune.nom}
                href={`#cc-${i}`}
                fill="none"
                stroke="#f5a800"
                strokeWidth="1.1"
                strokeDasharray="5 2.5"
              />
            ) : (
              <use
                key={commune.nom}
                href={`#cc-${i}`}
                fill="none"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="0.7"
              />
            ),
          )}

          {RESEAU.batiments.map((chemins, i) => (
            <path key={i} d={chemins.join('')} fill={TOITS[i]} />
          ))}
          {RESEAU.arbres.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill="rgba(61,220,106,0.2)" />
              <circle
                cx={x - r * 0.25}
                cy={y - r * 0.25}
                r={r * 0.5}
                fill="rgba(61,220,106,0.14)"
              />
            </g>
          ))}

          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {routes.map((d, i) => (
              <path key={`b${i}`} d={d} stroke="rgba(255,255,255,0.3)" strokeWidth="9.8" />
            ))}
            {routes.map((d, i) => (
              <path key={`c${i}`} d={d} stroke="#2a5a42" strokeWidth="8.4" />
            ))}
            {RESEAU.aretes.map((d, i) => (
              <path
                key={`p${i}`}
                d={d}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="0.3"
                strokeDasharray="2.2 2.6"
              />
            ))}
          </g>

          {RESEAU.tas.map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle cx="-0.9" cy="0.4" r="1.5" fill="#1b2420" />
              <circle cx="1" cy="-0.5" r="1.3" fill="#2d3a46" />
              <circle cx="0.3" cy="1.4" r="1.1" fill="#151b18" />
              <rect x="0.8" y="1.2" width="1" height="0.6" fill="#b08a55" />
            </g>
          ))}

          {communes.map((commune) => {
            const grande = GRANDES_COMMUNES.has(commune.nom);
            const pilote = commune.nom === 'Lingwala';
            return (
              <text
                key={commune.nom}
                x={commune.x}
                y={commune.y}
                textAnchor="middle"
                fontSize={grande ? 5.5 : 3.4}
                fontWeight={pilote ? 800 : 600}
                letterSpacing={grande ? 1.3 : 0.6}
                fill={pilote ? '#f5a800' : 'rgba(255,255,255,0.5)'}
                stroke="rgba(11,60,34,0.75)"
                strokeWidth="0.9"
                paintOrder="stroke"
                style={{ textTransform: 'uppercase' }}
              >
                {commune.nom}
              </text>
            );
          })}
        </g>

        {NIVEAUX.map((niveau, i) => (
          <Camion key={`c${i}`} niveau={niveau} index={i} />
        ))}
        {NIVEAUX.map((niveau, i) => (
          <Tricycle key={`t${i}`} niveau={niveau} index={i} />
        ))}
      </defs>
    </svg>
  );
}
