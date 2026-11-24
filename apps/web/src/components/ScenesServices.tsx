'use client';

import { useRef, type ReactNode } from 'react';
import { useAnimationControle } from '@/lib/useAnimationControle';

/**
 * Fonds animés des pages de service : une scène par activité de BENIME CONGO.
 * (L'assainissement garde la carte des camions : voir CarteCamions.)
 *
 * Dessins originaux, plats, en filigrane sur le vert du bandeau ; animation SMIL, mise en
 * pause hors écran et figée si l'appareil demande moins d'animations. Les éléments
 * principaux sont à droite de la scène (zone visible aussi sur mobile).
 */

export type SceneService = 'energie' | 'construction' | 'agriculture' | 'events';

const SOLEIL = '#f5a800';
const VERT = '#3ddc6a';
const BLEU = '#5bb4e8';
const BLANC = (a: number) => `rgba(255,255,255,${a})`;

function Sol() {
  return (
    <>
      <rect x="0" y="330" width="1200" height="60" fill={BLANC(0.07)} />
      <line x1="0" y1="330" x2="1200" y2="330" stroke={BLANC(0.28)} strokeWidth="1.5" />
    </>
  );
}

function Anime({
  attr,
  valeurs,
  duree,
  temps,
  debut = 0,
}: {
  attr: string;
  valeurs: string;
  duree: number;
  temps?: string;
  debut?: number;
}) {
  return (
    <animate
      attributeName={attr}
      values={valeurs}
      keyTimes={temps}
      dur={`${duree}s`}
      begin={`-${debut}s`}
      repeatCount="indefinite"
    />
  );
}

function Transforme({
  type,
  valeurs,
  duree,
  temps,
  debut = 0,
}: {
  type: 'rotate' | 'translate' | 'scale';
  valeurs: string;
  duree: number;
  temps?: string;
  debut?: number;
}) {
  return (
    <animateTransform
      attributeName="transform"
      type={type}
      values={valeurs}
      keyTimes={temps}
      dur={`${duree}s`}
      begin={`-${debut}s`}
      repeatCount="indefinite"
    />
  );
}

// --- Énergie : solaire, lignes électriques, château d'eau --------------------------------

function SceneEnergie() {
  const panneaux = [0, 1, 2, 3];
  const grille = (x: number, y: number) => {
    const traits: ReactNode[] = [];
    for (let k = 1; k < 4; k++) {
      traits.push(
        <line
          key={`v${k}`}
          x1={x + 26 * k}
          y1={y + 8 - 2 * k}
          x2={x + 26 * k}
          y2={y + 62 - 2 * k}
          stroke={BLANC(0.35)}
          strokeWidth="1"
        />,
      );
    }
    for (let k = 1; k < 3; k++) {
      traits.push(
        <line
          key={`h${k}`}
          x1={x}
          y1={y + 8 + 18 * k}
          x2={x + 104}
          y2={y + 18 * k}
          stroke={BLANC(0.35)}
          strokeWidth="1"
        />,
      );
    }
    return traits;
  };
  const fil1 = 'M330 170Q485 212 640 170';
  const fil2 = 'M640 170Q790 205 905 252';
  return (
    <>
      <defs>
        <linearGradient id="sv-brillance" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="sv-panneaux">
          {panneaux.map((i) => {
            const x = 700 + i * 118;
            return <polygon key={i} points={`${x},258 ${x + 104},250 ${x + 104},304 ${x},312`} />;
          })}
        </clipPath>
      </defs>
      <Sol />

      {/* soleil */}
      <circle cx="1020" cy="146" r="58" fill={SOLEIL} opacity="0.16">
        <Anime attr="r" valeurs="54;68;54" duree={5} />
      </circle>
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 1020 146"
          to="360 1020 146"
          dur="50s"
          repeatCount="indefinite"
        />
        {Array.from({ length: 14 }, (_, i) => (
          <line
            key={i}
            x1="1020"
            y1="98"
            x2="1020"
            y2="84"
            transform={`rotate(${(i * 360) / 14} 1020 146)`}
            stroke={SOLEIL}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        ))}
      </g>
      <circle cx="1020" cy="146" r="32" fill={SOLEIL} />

      {/* poteaux et lignes électriques */}
      {[330, 640].map((x) => (
        <g key={x}>
          <rect x={x - 3} y="150" width="6" height="180" fill={BLANC(0.38)} />
          <rect x={x - 30} y="166" width="60" height="5" rx="2" fill={BLANC(0.5)} />
          <circle cx={x - 26} cy="166" r="3" fill={BLANC(0.7)} />
          <circle cx={x + 26} cy="166" r="3" fill={BLANC(0.7)} />
        </g>
      ))}
      {[fil1, fil2].map((d) => (
        <path key={d} d={d} fill="none" stroke={BLANC(0.5)} strokeWidth="1.6" />
      ))}
      {[0, 1.3, 2.6].map((debut) => (
        <circle key={`a${debut}`} r="4.5" fill={SOLEIL}>
          <animateMotion path={fil1} dur="4s" begin={`-${debut}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {[0, 1.5, 3].map((debut) => (
        <circle key={`b${debut}`} r="4.5" fill={SOLEIL}>
          <animateMotion path={fil2} dur="4.5s" begin={`-${debut}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* maison alimentée */}
      <g>
        <rect x="430" y="270" width="104" height="60" fill={BLANC(0.16)} />
        <polygon points="420,270 482,226 544,270" fill={BLANC(0.26)} />
        <line x1="482" y1="196" x2="482" y2="228" stroke={BLANC(0.5)} strokeWidth="1.6" />
        {[448, 496].map((x) => (
          <rect key={x} x={x} y="286" width="22" height="22" rx="2" fill={SOLEIL}>
            <Anime attr="opacity" valeurs="0.55;1;0.55" duree={3.2} debut={x / 100} />
          </rect>
        ))}
      </g>

      {/* panneaux solaires */}
      {panneaux.map((i) => {
        const x = 700 + i * 118;
        return (
          <g key={i}>
            <line x1={x + 52} y1="282" x2={x + 52} y2="330" stroke={BLANC(0.4)} strokeWidth="4" />
            <polygon
              points={`${x},258 ${x + 104},250 ${x + 104},304 ${x},312`}
              fill="#1c4e7c"
              stroke={BLANC(0.55)}
              strokeWidth="1.5"
            />
            {grille(x, 250)}
          </g>
        );
      })}
      <g clipPath="url(#sv-panneaux)">
        <g>
          <Transforme type="translate" valeurs="640 0;1180 0" duree={4.5} />
          <rect
            x="0"
            y="230"
            width="70"
            height="110"
            fill="url(#sv-brillance)"
            transform="skewX(-20)"
          />
        </g>
      </g>
      {/* onduleur et éclair */}
      <rect x="1012" y="286" width="34" height="44" rx="4" fill={BLANC(0.25)} stroke={BLANC(0.5)} />
      <polygon points="1032,292 1022,312 1030,312 1026,326 1040,304 1031,304" fill={SOLEIL}>
        <Anime attr="opacity" valeurs="1;0.35;1" duree={1.6} />
      </polygon>

      {/* château d'eau : forage et pompage */}
      <line x1="1106" y1="236" x2="1098" y2="330" stroke={BLANC(0.4)} strokeWidth="3" />
      <line x1="1162" y1="236" x2="1170" y2="330" stroke={BLANC(0.4)} strokeWidth="3" />
      <line x1="1106" y1="270" x2="1166" y2="300" stroke={BLANC(0.3)} strokeWidth="2" />
      <line x1="1162" y1="270" x2="1102" y2="300" stroke={BLANC(0.3)} strokeWidth="2" />
      <rect x="1090" y="176" width="86" height="62" rx="12" fill={BLEU} opacity="0.22" />
      <rect x="1093" y="226" width="80" height="8" rx="3" fill={BLEU} opacity="0.85">
        <Anime attr="y" valeurs="226;184;184;226" temps="0;0.55;0.8;1" duree={9} />
        <Anime attr="height" valeurs="8;50;50;8" temps="0;0.55;0.8;1" duree={9} />
      </rect>
      <rect
        x="1090"
        y="176"
        width="86"
        height="62"
        rx="12"
        fill="none"
        stroke={BLANC(0.6)}
        strokeWidth="2"
      />
      <path
        d="M1060 330V206H1090"
        fill="none"
        stroke={BLANC(0.5)}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {[0, 0.8, 1.6].map((debut) => (
        <circle key={debut} r="3.2" fill={BLEU}>
          <animateMotion
            path="M1060 330V206H1090"
            dur="2.4s"
            begin={`-${debut}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
      <rect x="1034" y="306" width="48" height="24" rx="3" fill={BLANC(0.22)} />
      {[0, 0.6, 1.2].map((debut) => (
        <circle key={debut} cx="1176" cy="240" r="2.8" fill={BLEU}>
          <Anime attr="cy" valeurs="240;326" duree={1.8} debut={debut} />
          <Anime attr="opacity" valeurs="1;1;0" temps="0;0.8;1" duree={1.8} debut={debut} />
        </circle>
      ))}
    </>
  );
}

// --- Construction : grue, immeuble qui monte, pelleteuse ----------------------------------

function SceneConstruction() {
  const niveaux = [0, 1, 2];
  const zigzag = () => {
    let d = 'M793 330';
    for (let y = 330, i = 0; y > 124; y -= 22, i++) {
      d += `L${i % 2 === 0 ? 807 : 793} ${y - 22}`;
    }
    return d;
  };
  const temps = '0;0.2;0.5;0.65;0.75;0.9;1';
  return (
    <>
      <Sol />

      {/* immeuble qui monte étage par étage */}
      {[560, 620, 680, 740].map((x) => (
        <line key={x} x1={x} y1="330" x2={x} y2="190" stroke={BLANC(0.3)} strokeWidth="3" />
      ))}
      {niveaux.map((k) => {
        const y = 330 - 46 * (k + 1);
        const a = (k * 2.6) / 14;
        return (
          <g key={k} opacity="0">
            <Anime
              attr="opacity"
              valeurs="0;0;1;1;0"
              temps={`0;${a.toFixed(3)};${(a + 0.04).toFixed(3)};0.93;1`}
              duree={14}
            />
            <rect x="556" y={y} width="188" height="46" fill={BLANC(0.14)} />
            <rect x="552" y={y - 3} width="196" height="6" fill={BLANC(0.4)} />
            {[576, 636, 696].map((x) => (
              <rect
                key={x}
                x={x}
                y={y + 12}
                width="30"
                height="24"
                rx="2"
                fill="rgba(11,60,34,0.75)"
              />
            ))}
          </g>
        );
      })}

      {/* tas de matériaux */}
      <polygon points="758,330 782,300 806,330" fill={BLANC(0.26)} />
      <rect x="812" y="318" width="26" height="12" fill={BLANC(0.3)} />
      <rect x="812" y="306" width="26" height="12" fill={BLANC(0.22)} />

      {/* grue à tour */}
      <path d={zigzag()} fill="none" stroke={BLANC(0.45)} strokeWidth="2" />
      <rect x="793" y="112" width="3" height="218" fill={BLANC(0.5)} />
      <rect x="804" y="112" width="3" height="218" fill={BLANC(0.5)} />
      <rect x="610" y="104" width="270" height="8" fill={SOLEIL} />
      <line x1="800" y1="80" x2="620" y2="104" stroke={BLANC(0.5)} strokeWidth="1.5" />
      <line x1="800" y1="80" x2="878" y2="104" stroke={BLANC(0.5)} strokeWidth="1.5" />
      <rect x="796" y="78" width="8" height="28" fill={SOLEIL} />
      <rect x="846" y="112" width="34" height="22" fill={BLANC(0.45)} />
      <rect x="776" y="112" width="38" height="24" rx="3" fill={SOLEIL} />
      <rect x="782" y="117" width="14" height="12" rx="2" fill="rgba(11,60,34,0.8)" />
      <g>
        <Transforme
          type="translate"
          valeurs="0 0;0 0;-170 0;-170 0;-170 0;0 0;0 0"
          temps={temps}
          duree={12}
        />
        <rect x="764" y="112" width="12" height="7" fill={BLANC(0.7)} />
        <line x1="770" y1="119" x2="770" y2="300" stroke={BLANC(0.7)} strokeWidth="1.5">
          <Anime attr="y2" valeurs="300;160;160;180;180;160;300" temps={temps} duree={12} />
        </line>
        <g>
          <Transforme
            type="translate"
            valeurs="0 0;0 -140;0 -140;0 -120;0 -120;0 -140;0 0"
            temps={temps}
            duree={12}
          />
          <g>
            <Anime attr="opacity" valeurs="1;1;1;1;0;0;1" temps={temps} duree={12} />
            <rect x="754" y="300" width="32" height="22" fill={BLANC(0.5)} stroke={BLANC(0.8)} />
            <line x1="754" y1="311" x2="786" y2="311" stroke={BLANC(0.8)} />
            <line x1="770" y1="300" x2="770" y2="322" stroke={BLANC(0.8)} />
          </g>
        </g>
      </g>

      {/* pelleteuse */}
      <polygon points="935,330 975,296 1015,330" fill={BLANC(0.24)} />
      <rect x="1040" y="312" width="140" height="22" rx="11" fill={BLANC(0.38)} />
      {[1058, 1110, 1162].map((x) => (
        <circle key={x} cx={x} cy="323" r="7" fill={BLANC(0.6)}>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${x} 323`}
            to={`360 ${x} 323`}
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      ))}
      <rect x="1062" y="276" width="100" height="36" rx="6" fill={SOLEIL} />
      <rect x="1120" y="250" width="44" height="30" rx="4" fill={SOLEIL} />
      <rect x="1128" y="256" width="28" height="18" rx="2" fill="rgba(11,60,34,0.8)" />
      <g transform="translate(1066 290)">
        <g>
          <Transforme type="rotate" valeurs="24;40;24" duree={5} />
          <rect x="-96" y="-7" width="96" height="14" rx="5" fill={SOLEIL} />
          <g transform="translate(-96 0)">
            <g>
              <Transforme type="rotate" valeurs="-64;-30;-64" duree={5} />
              <rect x="-62" y="-5" width="62" height="10" rx="4" fill={SOLEIL} />
              <g transform="translate(-62 0)">
                <g>
                  <Transforme type="rotate" valeurs="-30;40;-30" duree={5} />
                  <path d="M0 -6L-22 -4L-26 12L-4 16Z" fill={BLANC(0.7)} />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>

      {/* camion benne qui passe */}
      <g>
        <Transforme type="translate" valeurs="1300 0;-260 0" duree={20} />
        <g transform="translate(0 348)">
          <polygon points="0,-34 54,-34 62,-12 0,-12" fill={BLANC(0.3)} />
          <rect x="54" y="-30" width="30" height="24" rx="4" fill={BLANC(0.45)} />
          <rect x="62" y="-26" width="14" height="10" fill="rgba(11,60,34,0.7)" />
          <rect x="0" y="-12" width="86" height="6" fill={BLANC(0.3)} />
          {[14, 40, 70].map((x) => (
            <circle key={x} cx={x} cy="-3" r="9" fill={BLANC(0.7)}>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${x} -3`}
                to={`-360 ${x} -3`}
                dur="1.2s"
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      </g>
    </>
  );
}

// --- Agriculture : cultures, élevage, pisciculture, laiterie ------------------------------

function Vache({ x, debut }: { x: number; debut: number }) {
  return (
    <g transform={`translate(${x} 330)`}>
      {[10, 18, 52, 60].map((l) => (
        <rect key={l} x={l} y="-26" width="5" height="26" fill={BLANC(0.5)} />
      ))}
      <rect x="4" y="-58" width="64" height="38" rx="14" fill={BLANC(0.55)} />
      <ellipse cx="24" cy="-42" rx="9" ry="7" fill={BLANC(0.25)} />
      <ellipse cx="50" cy="-34" rx="7" ry="6" fill={BLANC(0.25)} />
      <g>
        <Transforme type="rotate" valeurs="0 68 -48;22 68 -48;0 68 -48" duree={4} debut={debut} />
        <rect x="64" y="-54" width="24" height="12" rx="6" fill={BLANC(0.55)} />
        <rect x="84" y="-46" width="12" height="10" rx="4" fill={BLANC(0.7)} />
        <polygon points="68,-54 74,-64 78,-54" fill={BLANC(0.5)} />
      </g>
      <g>
        <Transforme
          type="rotate"
          valeurs="-14 6 -50;14 6 -50;-14 6 -50"
          duree={1.8}
          debut={debut}
        />
        <rect x="1" y="-50" width="3" height="26" rx="1.5" fill={BLANC(0.5)} />
      </g>
    </g>
  );
}

function SceneAgriculture() {
  const rangs = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const bouteilles = [0, 1, 2, 3];
  return (
    <>
      <path d="M0 330Q200 280 420 318T760 306T1200 312V330H0Z" fill={VERT} opacity="0.1" />
      <Sol />

      {/* soleil */}
      <circle cx="930" cy="140" r="26" fill={SOLEIL} />
      <circle cx="930" cy="140" r="42" fill={SOLEIL} opacity="0.16">
        <Anime attr="r" valeurs="38;50;38" duree={5} />
      </circle>

      {/* étang : pisciculture */}
      <ellipse cx="500" cy="352" rx="116" ry="22" fill={BLEU} opacity="0.28" />
      <ellipse
        cx="500"
        cy="352"
        rx="116"
        ry="22"
        fill="none"
        stroke={BLANC(0.4)}
        strokeWidth="1.5"
      />
      {[0, 1.6].map((debut) => (
        <ellipse
          key={debut}
          cx="470"
          cy="352"
          rx="6"
          ry="2"
          fill="none"
          stroke={BLANC(0.6)}
          strokeWidth="1"
        >
          <Anime attr="rx" valeurs="6;44" duree={3.2} debut={debut} />
          <Anime attr="ry" valeurs="2;10" duree={3.2} debut={debut} />
          <Anime attr="opacity" valeurs="0.9;0" duree={3.2} debut={debut} />
        </ellipse>
      ))}
      {[
        { debut: 0, fond: '#f5a800' },
        { debut: 5, fond: BLANC(0.8) },
        { debut: 9, fond: '#f5a800' },
      ].map(({ debut, fond }) => (
        <g key={debut}>
          <animateMotion
            path="M390 352C420 336 470 336 500 352C530 368 580 368 610 352C580 338 530 338 500 352C470 366 420 368 390 352Z"
            dur="12s"
            begin={`-${debut}s`}
            repeatCount="indefinite"
            rotate="auto"
          />
          <ellipse cx="0" cy="0" rx="9" ry="4.5" fill={fond} />
          <polygon points="-8,0 -15,-5 -15,5" fill={fond} />
        </g>
      ))}

      {/* laiterie : bouteilles de lait sur le tapis */}
      <rect x="586" y="250" width="118" height="80" fill={BLANC(0.16)} />
      <polygon points="578,250 645,214 712,250" fill={BLANC(0.26)} />
      <rect x="628" y="216" width="14" height="22" fill={BLANC(0.3)} />
      <rect x="586" y="300" width="150" height="8" rx="3" fill={BLANC(0.4)} />
      {bouteilles.map((i) => (
        <g key={i}>
          <Transforme type="translate" valeurs="-30 0;150 0" duree={6} debut={i * 1.5} />
          <rect x="600" y="280" width="11" height="20" rx="2" fill="#fff" />
          <rect x="603" y="274" width="5" height="7" fill="#fff" />
          <rect x="600" y="287" width="11" height="6" fill={BLEU} opacity="0.8" />
        </g>
      ))}

      {/* champ : les cultures poussent, arrosage */}
      {rangs.map((i) => (
        <g key={i} transform={`translate(${776 + i * 20} 330)`}>
          <g>
            <Transforme
              type="scale"
              valeurs="1 0.12;1 1;1 1;1 0.12"
              temps="0;0.55;0.9;1"
              duree={10}
              debut={i * 0.4}
            />
            <line x1="0" y1="0" x2="0" y2="-34" stroke={VERT} strokeWidth="3" />
            <ellipse cx="-7" cy="-22" rx="8" ry="3.5" transform="rotate(-30 -7 -22)" fill={VERT} />
            <ellipse cx="7" cy="-30" rx="8" ry="3.5" transform="rotate(30 7 -30)" fill={VERT} />
          </g>
        </g>
      ))}
      <rect x="868" y="296" width="4" height="34" fill={BLANC(0.5)} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx="870" cy="296" r="2.4" fill={BLEU}>
          <animateMotion
            path={`M0 0Q${-34 + i * 17} -46 ${-70 + i * 35} 28`}
            dur="1.6s"
            begin={`-${i * 0.3}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* tracteur */}
      <g>
        <Transforme type="translate" valeurs="-200 0;1300 0" duree={26} />
        <g transform="translate(0 346)">
          <rect x="0" y="-38" width="58" height="26" rx="5" fill={SOLEIL} />
          <rect x="34" y="-60" width="26" height="26" rx="4" fill={BLANC(0.5)} />
          <rect x="39" y="-56" width="16" height="14" fill="rgba(11,60,34,0.7)" />
          <circle cx="16" cy="-4" r="16" fill={BLANC(0.7)}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 16 -4"
              to="360 16 -4"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="16" cy="-4" r="5" fill="rgba(11,60,34,0.7)" />
          <circle cx="52" cy="-1" r="10" fill={BLANC(0.7)}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 52 -1"
              to="360 52 -1"
              dur="1.1s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </g>

      {/* vaches */}
      <Vache x={1010} debut={0} />
      <Vache x={1100} debut={1.4} />
    </>
  );
}

// --- Événements et industries créatives : scène, projecteurs, caméra, foule -----------------

function SceneEvenements() {
  const barres = Array.from({ length: 16 }, (_, i) => i);
  const projecteurs = [
    { x: 830, c: SOLEIL, a: 1, debut: 0 },
    { x: 970, c: '#ffffff', a: -1, debut: 1.2 },
    { x: 1110, c: VERT, a: 1, debut: 2.4 },
  ];
  const confettis = Array.from({ length: 26 }, (_, i) => i);
  const couleurs = [SOLEIL, VERT, '#ffffff', BLEU, '#ff6b6b'];
  const foule = Array.from({ length: 17 }, (_, i) => i);
  return (
    <>
      <Sol />

      {/* ruban lumineux : écran LED et égaliseur */}
      <rect
        x="780"
        y="140"
        width="380"
        height="150"
        rx="6"
        fill="rgba(11,60,34,0.7)"
        stroke={BLANC(0.5)}
        strokeWidth="2"
      />
      {barres.map((i) => (
        <rect
          key={i}
          x={796 + i * 22.5}
          y="270"
          width="14"
          height="10"
          rx="2"
          fill={i % 3 === 0 ? SOLEIL : i % 3 === 1 ? VERT : '#fff'}
        >
          <Anime
            attr="y"
            valeurs={`270;${180 + ((i * 37) % 60)};${230 - ((i * 23) % 40)};270`}
            duree={1.4 + (i % 4) * 0.3}
            debut={i * 0.17}
          />
          <Anime
            attr="height"
            valeurs={`10;${100 - ((i * 37) % 60)};${50 + ((i * 23) % 40)};10`}
            duree={1.4 + (i % 4) * 0.3}
            debut={i * 0.17}
          />
        </rect>
      ))}

      {/* scène et structure d'éclairage */}
      <rect x="760" y="296" width="420" height="34" fill={BLANC(0.22)} />
      <rect x="760" y="294" width="420" height="5" fill={BLANC(0.5)} />
      <line x1="770" y1="98" x2="1170" y2="98" stroke={BLANC(0.55)} strokeWidth="5" />
      <line x1="770" y1="98" x2="770" y2="296" stroke={BLANC(0.3)} strokeWidth="4" />
      <line x1="1170" y1="98" x2="1170" y2="296" stroke={BLANC(0.3)} strokeWidth="4" />
      {projecteurs.map(({ x, c, a, debut }) => (
        <g key={x}>
          <g>
            <Transforme
              type="rotate"
              valeurs={`${-14 * a} ${x} 104;${14 * a} ${x} 104;${-14 * a} ${x} 104`}
              duree={5}
              debut={debut}
            />
            <polygon
              points={`${x - 5},106 ${x + 5},106 ${x + 70},300 ${x - 70},300`}
              fill={c}
              opacity="0.16"
            />
          </g>
          <rect x={x - 9} y="98" width="18" height="12" rx="3" fill={c} />
        </g>
      ))}

      {/* artiste sur scène */}
      <g transform="translate(960 296)">
        <rect x="-9" y="-58" width="18" height="40" rx="8" fill={BLANC(0.7)} />
        <rect x="-8" y="-18" width="6" height="18" fill={BLANC(0.6)} />
        <rect x="2" y="-18" width="6" height="18" fill={BLANC(0.6)} />
        <circle cx="0" cy="-68" r="9" fill={BLANC(0.8)} />
        <g>
          <Transforme type="rotate" valeurs="-20 6 -52;-150 6 -52;-20 6 -52" duree={1.8} />
          <rect x="3" y="-56" width="6" height="30" rx="3" fill={BLANC(0.7)} />
          <circle cx="6" cy="-28" r="4" fill={SOLEIL} />
        </g>
      </g>

      {/* haut-parleurs et ondes */}
      {[742, 1196].map((x) => (
        <g key={x}>
          <rect
            x={x - 22}
            y="238"
            width="44"
            height="92"
            rx="5"
            fill={BLANC(0.22)}
            stroke={BLANC(0.5)}
          />
          <circle cx={x} cy="268" r="11" fill={BLANC(0.3)}>
            <Anime attr="r" valeurs="11;14;11" duree={0.7} />
          </circle>
          <circle cx={x} cy="304" r="7" fill={BLANC(0.3)}>
            <Anime attr="r" valeurs="7;9;7" duree={0.7} />
          </circle>
        </g>
      ))}

      {/* caméra en tournage */}
      <g transform="translate(600 330)">
        <line x1="0" y1="-60" x2="-26" y2="0" stroke={BLANC(0.5)} strokeWidth="4" />
        <line x1="0" y1="-60" x2="26" y2="0" stroke={BLANC(0.5)} strokeWidth="4" />
        <line x1="0" y1="-60" x2="0" y2="0" stroke={BLANC(0.5)} strokeWidth="4" />
        <rect x="-30" y="-100" width="52" height="34" rx="5" fill={BLANC(0.45)} />
        <polygon points="22,-92 44,-100 44,-66 22,-74" fill={BLANC(0.6)} />
        <circle cx="-20" cy="-92" r="4" fill="#ff4d4d">
          <Anime attr="opacity" valeurs="1;1;0.15;0.15" temps="0;0.5;0.5;1" duree={1.2} />
        </circle>
      </g>

      {/* mégaphone : communication et marketing */}
      <g transform="translate(470 296)">
        <polygon points="0,-8 40,-30 40,12 0,-2" fill={SOLEIL} />
        <rect x="-14" y="-10" width="16" height="12" rx="3" fill={BLANC(0.6)} />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d="M56 -16Q70 -9 56 -2"
            fill="none"
            stroke={BLANC(0.8)}
            strokeWidth="3"
            strokeLinecap="round"
          >
            <Transforme type="translate" valeurs="0 0;26 0" duree={1.8} debut={i * 0.6} />
            <Anime attr="opacity" valeurs="0;1;0" duree={1.8} debut={i * 0.6} />
          </path>
        ))}
      </g>

      {/* foule */}
      {foule.map((i) => (
        <g key={i} transform={`translate(${718 + i * 28} 346)`}>
          <g>
            <Transforme
              type="translate"
              valeurs="0 0;0 -5;0 0"
              duree={0.9 + (i % 3) * 0.2}
              debut={i * 0.13}
            />
            <circle cx="0" cy="-14" r="8" fill={BLANC(0.42)} />
            <rect x="-12" y="-6" width="24" height="26" rx="10" fill={BLANC(0.34)} />
            {i % 2 === 0 ? (
              <rect x="9" y="-26" width="4" height="22" rx="2" fill={BLANC(0.5)}>
                <Transforme
                  type="rotate"
                  valeurs="-16 11 -6;16 11 -6;-16 11 -6"
                  duree={0.8}
                  debut={i * 0.1}
                />
              </rect>
            ) : null}
          </g>
        </g>
      ))}

      {/* confettis */}
      {confettis.map((i) => (
        <rect
          key={i}
          x={720 + ((i * 53) % 470)}
          y="-10"
          width="7"
          height="4"
          fill={couleurs[i % couleurs.length]}
        >
          <Anime attr="y" valeurs="-10;340" duree={4 + (i % 5)} debut={i * 0.6} />
          <Transforme type="rotate" valeurs="0;360" duree={1.5 + (i % 3) * 0.4} />
        </rect>
      ))}
    </>
  );
}

const SCENES: Record<SceneService, () => ReactNode> = {
  energie: SceneEnergie,
  construction: SceneConstruction,
  agriculture: SceneAgriculture,
  events: SceneEvenements,
};

export function FondService({ scene }: { scene: SceneService }) {
  const racine = useRef<HTMLDivElement>(null);
  const dessin = useRef<SVGSVGElement>(null);
  useAnimationControle(racine, dessin, 3);
  const Scene = SCENES[scene];
  return (
    <div
      className="carte-camions carte-camions--degrade fond-service"
      ref={racine}
      aria-hidden="true"
    >
      <svg
        ref={dessin}
        viewBox="0 0 1200 380"
        width="100%"
        height="100%"
        preserveAspectRatio="xMaxYMax slice"
        focusable="false"
      >
        <Scene />
      </svg>
    </div>
  );
}
