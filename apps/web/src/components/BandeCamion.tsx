'use client';

import { useEffect, useRef } from 'react';

/**
 * Bande decorative au-dessus du pied de page. Le tricycle de BENIME longe le
 * trottoir, ramasse trois sacs poubelles, les porte au camion compacteur gare
 * plus loin et les lui donne ; puis il repart. Dessins originaux d'apres les
 * vehicules de BENIME, animation 100 % CSS (voir globals.css, « bande »).
 * Pause hors ecran et onglet cache ; coupee si l'appareil demande moins
 * d'animations.
 *
 * Reperes : le camion est a l'echelle 0.72, pose a x = 983 ; le tricycle aussi,
 * sur sa propre route ; les sacs sont sur le trottoir, au premier plan.
 */
const MAISONS = [0, 330, 660, 990, 1320];
const FENTES = [16, 30, 44]; // place des sacs dans la benne du tricycle (x local)

/** Immeubles lointains, plus clairs et plus petits : donnent de la profondeur a la rue. */
const LOINTAIN: Array<[number, number, number]> = [
  [10, 70, 46], [64, 52, 38], [110, 78, 52], [168, 60, 34], [208, 84, 44], [260, 56, 58],
  [326, 72, 40], [372, 48, 50], [428, 80, 36], [472, 62, 56], [534, 74, 42], [582, 54, 48],
  [636, 82, 38], [682, 58, 54], [746, 70, 44], [796, 50, 40], [846, 78, 56], [910, 60, 36],
  [954, 72, 50], [1012, 52, 44], [1064, 80, 40], [1112, 62, 54], [1176, 70, 38], [1220, 54, 50],
  [1278, 76, 46], [1330, 58, 42], [1380, 68, 58],
];

/** Dalles du trottoir, pour qu'il ne soit pas qu'une bande unie. */
const DALLES = Array.from({ length: 26 }, (_, i) => 18 + i * 58);

/** Rayon, balancement et retard de chaque arbre : ils ne bougent pas tous ensemble. */
const ARBRES: Array<{ x: number; y: number; r: number; delai: number; duree: number }> = [];
MAISONS.forEach((x, i) => {
  ARBRES.push({ x: x + 145, y: 76, r: 17, delai: -(i * 1.3), duree: 5.2 + (i % 3) * 0.7 });
  ARBRES.push({ x: x + 244, y: 88, r: 13, delai: -(i * 0.9 + 2), duree: 4.6 + (i % 2) * 0.9 });
});

const POTEAUX = [96, 548, 852, 1304];

function Defs() {
  return (
    <defs>
      <linearGradient id="bc-ciel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#D5E7DE" />
        <stop offset="0.6" stopColor="#E8F2EC" />
        <stop offset="1" stopColor="#F3F8F4" />
      </linearGradient>
      <radialGradient id="bc-soleil" cx="0.8" cy="0" r="0.55">
        <stop offset="0" stopColor="#FFFBE8" stopOpacity="0.95" />
        <stop offset="1" stopColor="#FFFBE8" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bc-brume" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#EEF5F0" stopOpacity="0" />
        <stop offset="1" stopColor="#EEF5F0" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id="bc-mur" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E2EEE5" />
        <stop offset="1" stopColor="#C9DDCD" />
      </linearGradient>
      <linearGradient id="bc-mur-b" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#DFEBE2" />
        <stop offset="1" stopColor="#C4D9C9" />
      </linearGradient>
      <linearGradient id="bc-rebord" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#D2E2D6" />
        <stop offset="1" stopColor="#B4CABA" />
      </linearGradient>
      <linearGradient id="bc-verre" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FDFFFD" />
        <stop offset="1" stopColor="#CFE3DB" />
      </linearGradient>
      <radialGradient id="bc-feuille" cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" stopColor="#BFE2C6" />
        <stop offset="1" stopColor="#7DB08A" />
      </radialGradient>
      <linearGradient id="bc-tronc" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#A08468" />
        <stop offset="1" stopColor="#6E563F" />
      </linearGradient>
      <linearGradient id="bc-asphalte" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#707D75" />
        <stop offset="0.5" stopColor="#5C6962" />
        <stop offset="1" stopColor="#4D5953" />
      </linearGradient>
      <linearGradient id="bc-trottoir" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#DEE8DE" />
        <stop offset="1" stopColor="#C4D3C7" />
      </linearGradient>
      <pattern id="bc-grain" width="28" height="22" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="4" r="0.7" fill="#fff" opacity="0.10" />
        <circle cx="14" cy="9" r="0.6" fill="#000" opacity="0.16" />
        <circle cx="22" cy="3" r="0.8" fill="#000" opacity="0.12" />
        <circle cx="8" cy="16" r="0.7" fill="#fff" opacity="0.08" />
        <circle cx="25" cy="17" r="0.6" fill="#000" opacity="0.14" />
        <circle cx="17" cy="20" r="0.5" fill="#fff" opacity="0.10" />
      </pattern>
      <radialGradient id="bc-ombre" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#10130F" stopOpacity="0.55" />
        <stop offset="0.7" stopColor="#10130F" stopOpacity="0.22" />
        <stop offset="1" stopColor="#10130F" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bc-blanc" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.55" stopColor="#F3F6F3" />
        <stop offset="1" stopColor="#D9E0DB" />
      </linearGradient>
      <linearGradient id="bc-vert" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3DD066" />
        <stop offset="1" stopColor="#1E9639" />
      </linearGradient>
      <linearGradient id="bc-vitre" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#CDEBF7" />
        <stop offset="1" stopColor="#7BB1CD" />
      </linearGradient>
      <linearGradient id="bc-benne-tri" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6F8456" />
        <stop offset="1" stopColor="#47593A" />
      </linearGradient>
      <radialGradient id="bc-moyeu" cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#EEF2EF" />
        <stop offset="1" stopColor="#8A9590" />
      </radialGradient>
      <radialGradient id="bc-sac-g" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#566860" />
        <stop offset="1" stopColor="#1E2622" />
      </radialGradient>
      <radialGradient id="bc-fanal" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFC94D" stopOpacity="0.9" />
        <stop offset="1" stopColor="#FFC94D" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function Roue({ cx, rayon, classe }: { cx: number; rayon: number; classe?: string }) {
  const ecrous = [0, 72, 144, 216, 288];
  return (
    <g>
      {/* contact avec la chaussee */}
      <ellipse cx={cx} cy="0.5" rx={rayon * 1.05} ry="2.2" fill="#10130F" opacity="0.35" />
      <g className={classe}>
        <circle cx={cx} cy={-rayon} r={rayon} fill="#1A1D1C" />
        <circle
          cx={cx}
          cy={-rayon}
          r={rayon * 0.9}
          fill="none"
          stroke="#2E3330"
          strokeWidth={rayon * 0.12}
          strokeDasharray={`${rayon * 0.22} ${rayon * 0.2}`}
        />
        <circle cx={cx} cy={-rayon} r={rayon * 0.72} fill="#2B2F2D" />
        <circle cx={cx} cy={-rayon} r={rayon * 0.5} fill="url(#bc-moyeu)" />
        <circle cx={cx} cy={-rayon} r={rayon * 0.5} fill="none" stroke="#5E6862" strokeWidth="0.6" />
        {ecrous.map((angle) => (
          <circle
            key={angle}
            cx={cx + Math.cos((angle * Math.PI) / 180) * rayon * 0.3}
            cy={-rayon + Math.sin((angle * Math.PI) / 180) * rayon * 0.3}
            r={rayon * 0.065}
            fill="#59635E"
          />
        ))}
        <circle cx={cx} cy={-rayon} r={rayon * 0.13} fill="#6A7570" />
        {/* valve : repere visible quand la roue tourne */}
        <circle cx={cx + rayon * 0.62} cy={-rayon} r={rayon * 0.07} fill="#D9A441" />
      </g>
      {/* reflet sur le haut du pneu */}
      <path
        d={`M${cx - rayon * 0.8} ${-rayon * 1.45} A${rayon} ${rayon} 0 0 1 ${cx + rayon * 0.2} ${-rayon * 1.98}`}
        stroke="#fff"
        strokeOpacity="0.14"
        strokeWidth={rayon * 0.09}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function Camion() {
  return (
    <g transform="translate(983 146) scale(0.72)">
      <ellipse cx="152" cy="3" rx="178" ry="10" fill="url(#bc-ombre)" />
      <g className="bc-vib">
        <g className="bc-camion-corps">
          <rect x="4" y="-36" width="290" height="10" fill="#2B2F2D" />
          <rect x="4" y="-36" width="290" height="2" fill="#4A514D" />
          {/* reservoir et traverses du chassis, entre les essieux */}
          <rect x="112" y="-30" width="58" height="14" rx="5" fill="#3B413D" />
          <rect x="112" y="-30" width="58" height="3" rx="1.5" fill="#59615C" />
          <rect x="176" y="-28" width="40" height="3" fill="#232725" />
          <rect x="176" y="-22" width="40" height="3" fill="#232725" />
          {/* benne blanche */}
          <rect x="80" y="-130" width="158" height="98" rx="6" fill="url(#bc-blanc)" />
          <rect x="82" y="-127" width="154" height="2.5" rx="1.2" fill="#fff" opacity="0.9" />
          <rect x="232" y="-126" width="5" height="90" rx="2" fill="#000" opacity="0.06" />
          <path d="M120 -124v88M160 -124v88M200 -124v88" stroke="#D5DCD7" strokeWidth="1" opacity="0.7" />
          <rect x="80" y="-130" width="158" height="4" rx="2" fill="#E1E6E2" />
          <rect x="80" y="-44" width="158" height="12" fill="#E7EBE7" />
          <path d="M90 -82h140v6H90z" fill="url(#bc-vert)" />
          <path d="M90 -75h140v3H90z" fill="#1C1F1D" />
          <path d="M90 -62h140v5H90z" fill="#2BB24C" opacity="0.0" />
          {/* logo BENIME */}
          <image href="/logo-benime-mark.png" x="97" y="-119" width="24" height="33" />
          <text
            x="126"
            y="-106"
            fontSize="15"
            fontWeight="800"
            fill="#D6262B"
            textLength="64"
            lengthAdjust="spacingAndGlyphs"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            BENIME
          </text>
          <rect x="193" y="-117" width="38" height="13" rx="6.5" fill="#2D6FD0" />
          <text
            x="212"
            y="-107.5"
            fontSize="9"
            fontWeight="700"
            fill="#fff"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            congo
          </text>
          <text
            x="126"
            y="-93"
            fontSize="10.5"
            fontWeight="800"
            fill="#2E8B3A"
            textLength="105"
            lengthAdjust="spacingAndGlyphs"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            ASSAINISSEMENT
          </text>
          <text
            x="126"
            y="-86.5"
            fontSize="5.2"
            fontStyle="italic"
            fill="#2D6FD0"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            Collecte - Transport - Valorisation
          </text>
          {/* bavette verte et blanche sous la benne, comme sur le camion */}
          <g>
            <rect x="96" y="-36" width="64" height="12" fill="#2BB24C" />
            <rect x="106" y="-36" width="8" height="12" fill="#fff" />
            <rect x="130" y="-36" width="8" height="12" fill="#fff" />
          </g>
          {/* compacteur vert a l'arriere */}
          <path d="M18 -136h60l8 6v98H0v-66z" fill="url(#bc-vert)" />
          <path d="M18 -136h60l8 6v10H14z" fill="#22983E" />
          <path d="M10 -120l60 78M32 -126l50 66" stroke="#1E8E3A" strokeWidth="3.5" fill="none" />
          <path d="M12 -121l60 78M34 -127l50 66" stroke="#fff" strokeWidth="1" opacity="0.18" fill="none" />
          {/* verins hydrauliques et charniere du couvercle */}
          <rect x="66" y="-118" width="4" height="46" rx="2" fill="#B9C2BD" />
          <rect x="66" y="-118" width="4" height="12" rx="2" fill="#6B7570" />
          <circle cx="68" cy="-120" r="3" fill="#3B413D" />
          {/* feux arriere, plaque et bavettes */}
          <rect x="0" y="-92" width="4" height="12" rx="1" fill="#E23B2E" />
          <rect x="-1" y="-62" width="3" height="5" rx="1" fill="#F5A800" />
          <rect x="6" y="-46" width="20" height="9" rx="1" fill="#F3F6F1" stroke="#9AA39E" strokeWidth="0.6" />
          <rect x="9" y="-43" width="14" height="1.6" fill="#6B7570" />
          <rect x="9" y="-40" width="10" height="1.6" fill="#6B7570" />
          <path d="M60 -126v70" stroke="#1C1F1D" strokeWidth="3" fill="none" />
          <rect x="0" y="-38" width="86" height="6" fill="#1E8E3A" />
          <rect x="0" y="-54" width="3" height="14" fill="#D93025" />
          {/* goulotte de chargement */}
          <rect x="3" y="-84" width="32" height="48" fill="#1F5E2A" />
          <rect x="3" y="-84" width="32" height="6" fill="#154720" />
          <rect x="29" y="-84" width="6" height="48" fill="#000" opacity="0.14" />
          <rect className="bc-plaque" x="6" y="-80" width="6" height="42" fill="#17562A" />
          <rect
            className="bc-couvercle"
            x="0"
            y="-90"
            width="34"
            height="7"
            rx="2"
            fill="#2BB24C"
          />
          {/* echappement vertical derriere la cabine */}
          <rect x="232" y="-118" width="4.5" height="84" rx="2" fill="#4A514D" />
          <rect x="232" y="-118" width="1.6" height="84" fill="#7C8681" />
          <rect x="230.5" y="-121" width="7.5" height="4" rx="1.5" fill="#2B2F2D" />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              className={`bc-fumee bc-fumee--${i + 1}`}
              cx="234"
              cy="-124"
              r="3.4"
              fill="#9AA39E"
            />
          ))}
          {/* cabine */}
          <path d="M240 -36v-72q0 -4 4 -4h32l22 28 4 4v44z" fill="url(#bc-blanc)" />
          <path d="M244 -110h32l8 10h-42z" fill="#fff" opacity="0.8" />
          <path d="M258 -104v66" stroke="#CDD4CF" strokeWidth="1.2" />
          <rect x="262" y="-66" width="9" height="2.6" rx="1.3" fill="#8C9691" />
          <path d="M250 -100h24l16 22h-40z" fill="url(#bc-vitre)" />
          <path d="M254 -98l8 0 -6 18h-4z" fill="#fff" opacity="0.5" />
          <path d="M268 -98l5 0 -9 18h-4z" fill="#fff" opacity="0.28" />
          <path d="M252 -78h36" stroke="#5E8CA6" strokeWidth="0.8" />
          <rect x="240" y="-52" width="64" height="6" fill="url(#bc-vert)" />
          <rect x="297" y="-59" width="6" height="9" rx="1.5" fill="#FFF1C2" stroke="#C9D0CB" strokeWidth="0.8" />
          <rect x="298.5" y="-57" width="3" height="3" rx="1" fill="#fff" />
          <rect x="294" y="-45" width="11" height="3" fill="#2B2F2D" />
          <path d="M296 -44.5h8M296 -43h8" stroke="#59615C" strokeWidth="0.6" />
          <rect x="293" y="-41" width="14" height="6" rx="2" fill="#C9D0CB" />
          <rect x="293" y="-41" width="14" height="1.6" rx="0.8" fill="#fff" opacity="0.8" />
          <rect x="262" y="-82" width="2" height="30" fill="#C9D0CB" />
          <rect x="236" y="-92" width="6" height="14" rx="2" fill="#2B2F2D" />
          <rect x="237" y="-90" width="1.6" height="10" rx="0.8" fill="#8C9691" />
          <path d="M241 -86h8" stroke="#2B2F2D" strokeWidth="1.6" />
          <rect x="256" y="-116" width="12" height="3" rx="1" fill="#3B413D" />
          <circle className="bc-gyrophare" cx="262" cy="-120" r="4.5" fill="#F5A800" />
          <circle className="bc-gyrophare bc-halo" cx="262" cy="-120" r="13" fill="url(#bc-fanal)" />
        </g>
        <path d="M24 -20a24 24 0 0 1 48 0z" fill="#2B2F2D" />
        <path d="M54 -20a24 24 0 0 1 48 0z" fill="#2B2F2D" />
        <path d="M248 -20a24 24 0 0 1 48 0z" fill="#2B2F2D" />
        <path d="M26 -20a22 22 0 0 1 44 0" stroke="#3E4540" strokeWidth="2" fill="none" />
        <path d="M250 -20a22 22 0 0 1 44 0" stroke="#3E4540" strokeWidth="2" fill="none" />
        <rect x="100" y="-14" width="5" height="14" rx="1" fill="#1A1D1C" />
        <rect x="101" y="-12" width="3" height="9" fill="#3E4540" />
        <Roue cx={48} rayon={20} />
        <Roue cx={78} rayon={20} />
        <Roue cx={272} rayon={20} />
      </g>
    </g>
  );
}

function Tricycle() {
  return (
    <g transform="translate(70 0)">
      <g className="bc-retourne">
        <g transform="translate(-70 0)">
          <ellipse cx="72" cy="3" rx="92" ry="8" fill="url(#bc-ombre)" />
          <g className="bc-vib">
            {/* benne : fond, sacs, puis paroi avant qui cache le bas des sacs */}
            <rect x="0" y="-60" width="94" height="44" rx="2" fill="#46583A" />
            {FENTES.map((x, i) => (
              <g key={x} className={`bc-sac-benne bc-sac-benne--${i + 1}`}>
                <ellipse cx={x} cy="-62" rx="12" ry="11" fill="#2F3A34" />
                <ellipse cx={x - 4} cy="-66" rx="4" ry="3" fill="#46544D" opacity="0.7" />
                <rect x={x - 3.5} y="-77" width="7" height="6" rx="2" fill="#1F2824" />
              </g>
            ))}
            <rect x="0" y="-56" width="94" height="40" rx="2" fill="url(#bc-benne-tri)" />
            <rect x="0" y="-56" width="94" height="3" fill="#8DA26F" opacity="0.55" />
            <path d="M18 -56v40M36 -56v40M54 -56v40M72 -56v40" stroke="#3F5030" strokeWidth="2" />
            <path d="M19.5 -56v40M37.5 -56v40M55.5 -56v40M73.5 -56v40" stroke="#8DA26F" strokeWidth="0.8" opacity="0.45" />
            <path d="M6 -30l8 -2M60 -40l10 3M82 -24l6 -1" stroke="#9A6A3A" strokeWidth="1.2" opacity="0.4" />
            <rect x="85" y="-46" width="6" height="3" rx="1" fill="#D9A441" />
            <rect x="85" y="-26" width="6" height="3" rx="1" fill="#D93025" />
            <rect x="-2" y="-59" width="98" height="5" rx="2" fill="#46583A" />
            <rect x="0" y="-18" width="94" height="5" fill="#3C4A31" />
            <rect x="-16" y="-8" width="16" height="3" rx="1" fill="#2B2F2D" />
            <rect x="-16" y="-8" width="16" height="1" fill="#59615C" />
            {/* garde-boue arriere et echappement */}
            <path d="M22 -16a18 18 0 0 1 36 0z" fill="#3B413D" />
            <rect x="94" y="-26" width="9" height="3.4" rx="1.4" fill="#59615C" />
            {/* cadre et moteur */}
            <rect x="92" y="-34" width="36" height="6" fill="#2B2F2D" />
            <rect x="100" y="-42" width="24" height="22" rx="3" fill="#3A3F3C" />
            <rect x="102" y="-40" width="20" height="3" rx="1.5" fill="#5A625D" />
            <path d="M104 -33h16M104 -29h16M104 -25h16" stroke="#2B2F2D" strokeWidth="1.2" />
            {/* fourche, phare et roue avant */}
            <path d="M138 -16L126 -66" stroke="#2B2F2D" strokeWidth="4" fill="none" />
            <path d="M120 -70h14" stroke="#2B2F2D" strokeWidth="4" strokeLinecap="round" />
            <circle cx="144" cy="-60" r="6" fill="#C9D0CB" />
            <circle cx="144" cy="-60" r="4.6" fill="#FFF1C2" />
            <circle cx="142.6" cy="-61.4" r="1.6" fill="#fff" />
            <path d="M122 -20a18 18 0 0 1 36 0z" fill="#2B2F2D" />
            <path d="M124 -20a16 16 0 0 1 32 0" stroke="#3E4540" strokeWidth="1.6" fill="none" />
            {/* conducteur */}
            <rect x="102" y="-48" width="22" height="9" rx="3" fill="#2B2F2D" />
            <rect x="104" y="-78" width="16" height="30" rx="4" fill="#2B5C9E" />
            <rect x="104" y="-78" width="5" height="30" rx="2.5" fill="#fff" opacity="0.12" />
            <rect x="104" y="-70" width="16" height="2.4" fill="#F3F7F2" opacity="0.8" />
            <circle cx="112" cy="-86" r="7" fill="#8A5A3C" />
            <path d="M114 -91a7 7 0 0 1 5 6 7 7 0 0 1 -7 7a8 8 0 0 0 2 -13z" fill="#6D4630" opacity="0.7" />
            <circle cx="116" cy="-86" r="0.9" fill="#1A1D1C" />
            <path d="M105 -88a7 7 0 0 1 14 0z" fill="#F3F7F2" />
            <rect x="118" y="-72" width="14" height="4" rx="2" fill="#2B5C9E" />
            <circle cx="133" cy="-70" r="2.6" fill="#8A5A3C" />
            <rect x="134" y="-72" width="8" height="2.6" rx="1.3" fill="#2B2F2D" />
            {/* toit */}
            <rect x="98" y="-106" width="2.5" height="30" fill="#2B2F2D" />
            <rect x="132" y="-106" width="2.5" height="36" fill="#2B2F2D" />
            <rect x="92" y="-110" width="48" height="5" rx="2" fill="#202422" />
            <rect x="92" y="-110" width="48" height="1.6" rx="0.8" fill="#59615C" />
            <rect x="142" y="-84" width="3" height="10" rx="1" fill="#2B2F2D" />
            <rect x="143" y="-86" width="8" height="5" rx="1.4" fill="#3B413D" />
            <rect x="144" y="-85" width="6" height="3" rx="1" fill="#9FC0D1" />
            {[0, 1].map((i) => (
              <circle
                key={i}
                className={`bc-fumee bc-fumee--${i + 1} bc-fumee--petite`}
                cx="93"
                cy="-24"
                r="2.4"
                fill="#9AA39E"
              />
            ))}
            <Roue cx={40} rayon={16} classe="bc-roue" />
            <Roue cx={138} rayon={16} classe="bc-roue" />
          </g>
          {/* l'eboueur, debout sur le marchepied arriere */}
          <g transform="translate(-10 -8)">
            <rect x="-5" y="-22" width="5" height="22" fill="#2B3A55" />
            <rect x="1" y="-22" width="5" height="22" fill="#2B3A55" />
            <rect x="-7" y="-5" width="8" height="5" rx="1.5" fill="#1C1F1D" />
            <rect x="0" y="-5" width="8" height="5" rx="1.5" fill="#1C1F1D" />
            <rect x="-8" y="-46" width="16" height="26" rx="3" fill="#F28C28" />
            <rect x="-8" y="-38" width="16" height="3" fill="#F3F7F2" opacity="0.92" />
            <rect x="-8" y="-30" width="16" height="3" fill="#F3F7F2" opacity="0.92" />
            <path d="M-4 -46v26M4 -46v26" stroke="#F3F7F2" strokeWidth="2" opacity="0.9" />
            <rect x="-8" y="-46" width="5" height="26" rx="2.5" fill="#fff" opacity="0.14" />
            <circle cx="0" cy="-54" r="7" fill="#8A5A3C" />
            <path d="M2 -60a7 7 0 0 1 5 6 7 7 0 0 1 -7 7a8 8 0 0 0 2 -13z" fill="#6D4630" opacity="0.7" />
            <circle cx="3.6" cy="-54" r="0.9" fill="#1A1D1C" />
            <path d="M-7.5 -55a7.5 7.5 0 0 1 15 0z" fill="#F3F7F2" />
            <rect x="-2" y="-62" width="4" height="2.6" rx="1" fill="#fff" />
            <rect x="0" y="-56" width="9" height="1.6" rx="0.8" fill="#DADFDB" />
            <g className="bc-bras">
              <rect x="-3" y="-46" width="6" height="22" rx="3" fill="#F28C28" />
              <circle cx="0" cy="-22" r="3.5" fill="#F3F7F2" />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

export function BandeCamion() {
  const racine = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = racine.current;
    if (!element) return;
    let visibleEcran = true;
    const appliquer = () => {
      element.dataset.pause = String(!visibleEcran || document.hidden);
    };
    const observateur = new IntersectionObserver(([entree]) => {
      visibleEcran = entree?.isIntersecting ?? true;
      appliquer();
    });
    observateur.observe(element);
    document.addEventListener('visibilitychange', appliquer);
    appliquer();
    return () => {
      observateur.disconnect();
      document.removeEventListener('visibilitychange', appliquer);
    };
  }, []);

  return (
    <div className="bande-camion" ref={racine} aria-hidden="true">
      <svg
        viewBox="0 0 1440 190"
        width="100%"
        height="100%"
        preserveAspectRatio="xMaxYMax slice"
        focusable="false"
      >
        <Defs />

        {/* ciel, soleil, nuages et oiseaux */}
        <rect width="1440" height="190" fill="url(#bc-ciel)" />
        <rect width="1440" height="120" fill="url(#bc-soleil)" />
        {[
          { y: 8, echelle: 1, duree: 150, delai: -20 },
          { y: 20, echelle: 0.7, duree: 190, delai: -95 },
          { y: 4, echelle: 0.85, duree: 170, delai: -140 },
        ].map((n, i) => (
          <g
            key={i}
            className="bc-nuage"
            style={{ animationDuration: `${n.duree}s`, animationDelay: `${n.delai}s` }}
          >
            <g transform={`translate(0 ${n.y}) scale(${n.echelle})`} fill="#fff" opacity="0.8">
              <ellipse cx="0" cy="8" rx="46" ry="9" />
              <ellipse cx="-18" cy="3" rx="20" ry="9" />
              <ellipse cx="8" cy="-1" rx="24" ry="11" />
              <ellipse cx="30" cy="5" rx="18" ry="7" />
            </g>
          </g>
        ))}
        {[
          { y: 16, duree: 70, delai: -12 },
          { y: 24, duree: 70, delai: -17 },
        ].map((o, i) => (
          <g
            key={i}
            className="bc-oiseau"
            style={{ animationDuration: `${o.duree}s`, animationDelay: `${o.delai}s` }}
          >
            <path
              className="bc-aile"
              d={`M0 ${o.y} q4 -4 8 0 q4 -4 8 0`}
              stroke="#6B7C72"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* immeubles lointains, dans la brume */}
        <g fill="#CFE1D4" opacity="0.8">
          {LOINTAIN.map(([x, h, l]) => (
            <g key={x}>
              <rect x={x} y={118 - h} width={l} height={h} />
              <rect x={x} y={118 - h} width={l} height="3" fill="#C4D8CA" />
              <rect x={x + l - 5} y={118 - h} width="5" height={h} fill="#B9CFC0" opacity="0.5" />
            </g>
          ))}
        </g>
        <rect y="70" width="1440" height="48" fill="url(#bc-brume)" opacity="0.4" />

        {/* poteaux d'eclairage */}
        {POTEAUX.map((x) => (
          <g key={x}>
            <rect x={x} y="58" width="3" height="58" fill="#7C8A82" />
            <rect x={x - 0.5} y="58" width="1.4" height="58" fill="#A8B5AD" />
            <path d={`M${x + 1.5} 60q0 -8 12 -8h10`} stroke="#7C8A82" strokeWidth="2.4" fill="none" />
            <rect x={x + 20} y="50" width="12" height="5" rx="2.5" fill="#6B7973" />
            <rect x={x + 22} y="54" width="8" height="1.6" fill="#FFF3C4" opacity="0.8" />
            <rect x={x - 3} y="112" width="9" height="4" rx="1" fill="#6B7973" />
          </g>
        ))}

        {/* facades */}
        {MAISONS.map((x) => (
          <g key={x}>
            {/* maison 1 : etage, toit-terrasse avec reservoir d'eau */}
            <rect x={x + 20} y="36" width="112" height="84" fill="url(#bc-mur)" />
            <rect x={x + 124} y="36" width="8" height="84" fill="#9FB8A5" opacity="0.28" />
            <rect x={x + 20} y="108" width="112" height="12" fill="#98B29F" opacity="0.22" />
            <rect x={x + 16} y="32" width="120" height="7" fill="url(#bc-rebord)" />
            <rect x={x + 16} y="38" width="120" height="3" fill="#000" opacity="0.07" />
            <rect x={x + 100} y="21" width="20" height="11" rx="3" fill="#C7D9CC" />
            <rect x={x + 100} y="21" width="20" height="3" rx="1.5" fill="#E4EFE7" />
            <rect x={x + 103} y="31" width="3" height="3" fill="#A9BDB0" />
            <rect x={x + 114} y="31" width="3" height="3" fill="#A9BDB0" />
            {[36, 84].map((fx) => (
              <g key={fx}>
                <rect x={x + fx - 2} y="50" width="24" height="28" fill="#A9C1AF" />
                <rect x={x + fx} y="52" width="20" height="24" fill="url(#bc-verre)" />
                <path d={`M${x + fx + 2} ${74}l10 -20h5l-10 20z`} fill="#fff" opacity="0.55" />
                <rect x={x + fx + 9.2} y="52" width="1.6" height="24" fill="#A9C1AF" />
                <rect x={x + fx - 4} y="78" width="28" height="3" fill="#B3C9B9" />
                <rect x={x + fx - 4} y="81" width="28" height="2" fill="#000" opacity="0.07" />
              </g>
            ))}
            <rect x={x + 108} y="88" width="14" height="9" rx="1.5" fill="#E9F1EB" stroke="#B3C9B9" strokeWidth="0.8" />
            <path d={`M${x + 111} 90.5h8M${x + 111} 93h8`} stroke="#B3C9B9" strokeWidth="0.8" />
            <rect x={x + 58} y="86" width="26" height="34" fill="#A9C1AF" />
            <rect x={x + 60} y="88" width="22" height="32" fill="#B1C9B7" />
            <rect x={x + 62} y="90" width="8" height="12" fill="#C4D8CA" />
            <rect x={x + 72} y="90" width="8" height="12" fill="#C4D8CA" />
            <circle cx={x + 79} cy="106" r="1.3" fill="#7D9585" />
            <rect x={x + 56} y="118" width="30" height="3" fill="#98B29F" />

            {/* maison 2 : boutique avec store a rayures et rideau metallique */}
            <rect x={x + 150} y="62" width="88" height="58" fill="url(#bc-mur-b)" />
            <rect x={x + 232} y="62" width="6" height="58" fill="#9FB8A5" opacity="0.26" />
            <rect x={x + 146} y="58" width="96" height="6" fill="url(#bc-rebord)" />
            <rect x={x + 146} y="63" width="96" height="3" fill="#000" opacity="0.07" />
            <rect x={x + 164} y="72" width="22" height="22" fill="#A9C1AF" />
            <rect x={x + 166} y="74" width="18" height="18" fill="url(#bc-verre)" />
            <path d={`M${x + 168} 91l8 -16h4l-8 16z`} fill="#fff" opacity="0.55" />
            <rect x={x + 194} y="92" width="38" height="28" fill="#8FA896" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect key={i} x={x + 194} y={94 + i * 4} width="38" height="1.2" fill="#7B9482" />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <rect
                key={i}
                x={x + 192 + i * 6}
                y="84"
                width="6"
                height="9"
                fill={i % 2 === 0 ? '#3FBF63' : '#F4F8F5'}
              />
            ))}
            <rect x={x + 192} y="92" width="42" height="2" fill="#000" opacity="0.12" />

            {/* maison 3 : immeuble haut, balcons et antenne */}
            <rect x={x + 252} y="28" width="66" height="92" fill="url(#bc-mur)" />
            <rect x={x + 311} y="28" width="7" height="92" fill="#9FB8A5" opacity="0.28" />
            <rect x={x + 252} y="108" width="66" height="12" fill="#98B29F" opacity="0.22" />
            <rect x={x + 248} y="24" width="74" height="6" fill="url(#bc-rebord)" />
            <rect x={x + 248} y="29" width="74" height="3" fill="#000" opacity="0.07" />
            <rect x={x + 284} y="8" width="1.6" height="16" fill="#8FA896" />
            <path d={`M${x + 278} 12h14M${x + 280} 16h10`} stroke="#8FA896" strokeWidth="1.2" />
            {[[262, 40], [290, 40], [262, 74], [290, 74]].map(([fx, fy]) => (
              <g key={`${fx}-${fy}`}>
                <rect x={x + fx - 2} y={fy - 2} width="20" height="24" fill="#A9C1AF" />
                <rect x={x + fx} y={fy} width="16" height="20" fill="url(#bc-verre)" />
                <path d={`M${x + fx + 2} ${fy + 18}l7 -16h4l-7 16z`} fill="#fff" opacity="0.5" />
                <rect x={x + fx + 7.2} y={fy} width="1.6" height="20" fill="#A9C1AF" />
              </g>
            ))}
            <rect x={x + 256} y="62" width="58" height="3" fill="#B3C9B9" />
            <path
              d={`M${x + 258} 62v-8M${x + 266} 62v-8M${x + 274} 62v-8M${x + 282} 62v-8M${x + 290} 62v-8M${x + 298} 62v-8M${x + 306} 62v-8M${x + 258} 54h54`}
              stroke="#A9C1AF"
              strokeWidth="1"
              fill="none"
            />
            <rect x={x + 262} y="100" width="22" height="20" fill="#B1C9B7" />
            <rect x={x + 264} y="102" width="18" height="18" fill="#C4D8CA" />

            {/* arbres : feuillage en plusieurs masses, tronc ombre */}
          </g>
        ))}

        {/* trottoir du fond et bordure */}
        <rect y="110" width="1440" height="8" fill="#D2E0D5" />
        <rect y="110" width="1440" height="1.5" fill="#E8F1EA" />
        <g stroke="#B9CBBE" strokeWidth="0.8" opacity="0.7">
          {Array.from({ length: 40 }, (_, i) => (
            <path key={i} d={`M${i * 38 + 6} 111v6`} />
          ))}
        </g>

        {ARBRES.map((a, i) => (
          <g key={i}>
            <ellipse cx={a.x + 2} cy="116" rx={a.r * 0.9} ry="2.6" fill="url(#bc-ombre)" />
            <g
              className="bc-arbre"
              style={{ animationDuration: `${a.duree}s`, animationDelay: `${a.delai}s` }}
            >
              <path
                d={`M${a.x - 2.2} 118L${a.x - 1.4} ${a.y + 6}h3.6l0.8 ${112 - a.y}z`}
                fill="url(#bc-tronc)"
              />
              <path
                d={`M${a.x} ${a.y + 16}l-7 -8M${a.x + 1} ${a.y + 12}l6 -7`}
                stroke="#7B6048"
                strokeWidth="1.8"
                fill="none"
              />
              <circle cx={a.x - a.r * 0.55} cy={a.y + a.r * 0.35} r={a.r * 0.68} fill="url(#bc-feuille)" />
              <circle cx={a.x + a.r * 0.6} cy={a.y + a.r * 0.3} r={a.r * 0.72} fill="url(#bc-feuille)" />
              <circle cx={a.x} cy={a.y} r={a.r} fill="url(#bc-feuille)" />
              <circle cx={a.x - a.r * 0.3} cy={a.y - a.r * 0.35} r={a.r * 0.42} fill="#D2EED6" opacity="0.55" />
              <circle cx={a.x + a.r * 0.45} cy={a.y + a.r * 0.5} r={a.r * 0.5} fill="#5F9570" opacity="0.28" />
            </g>
          </g>
        ))}

        {/* chaussee : degrade, grain, usure, reparation, plaque d'egout */}
        <rect y="118" width="1440" height="44" fill="url(#bc-asphalte)" />
        <rect y="118" width="1440" height="44" fill="url(#bc-grain)" />
        <rect y="116" width="1440" height="3" fill="#8A9890" />
        <rect y="116" width="1440" height="1" fill="#A9B6AE" />
        <rect y="119" width="1440" height="3" fill="#000" opacity="0.16" />
        <rect y="126" width="1440" height="7" fill="#000" opacity="0.045" />
        <rect y="146" width="1440" height="8" fill="#000" opacity="0.05" />
        <rect x="860" y="150" width="86" height="7" rx="2" fill="#000" opacity="0.09" />
        <rect x="330" y="128" width="120" height="5" rx="2" fill="#000" opacity="0.07" />
        <path d="M612 154l14 -5 10 3 12 -4" stroke="#2F3833" strokeWidth="0.9" fill="none" opacity="0.6" />
        <path d="M1180 126l10 4 8 -2" stroke="#2F3833" strokeWidth="0.9" fill="none" opacity="0.5" />
        <ellipse cx="402" cy="153" rx="15" ry="3.6" fill="#3F4944" />
        <ellipse cx="402" cy="152.4" rx="13" ry="2.8" fill="#55615A" />
        <path d="M391 152.4h22M394 151h16" stroke="#3F4944" strokeWidth="0.8" />
        <g fill="#EEF3EE" opacity="0.92">
          {Array.from({ length: 18 }, (_, i) => (
            <rect key={i} x={20 + i * 82} y="139" width="40" height="3" rx="0.6" />
          ))}
        </g>
        <g fill="#5C6962" opacity="0.5">
          {[60, 330, 520, 780, 1090, 1330].map((x) => (
            <rect key={x} x={x} y="139" width="12" height="3" />
          ))}
        </g>

        {/* trottoir de premier plan : bordure eclairee, dalles, herbes folles */}
        <rect y="162" width="1440" height="28" fill="url(#bc-trottoir)" />
        <rect y="158" width="1440" height="5" fill="#B7C7BB" />
        <rect y="158" width="1440" height="1.8" fill="#EDF4EE" />
        <rect y="162" width="1440" height="2.4" fill="#000" opacity="0.1" />
        <g stroke="#AEC0B3" strokeWidth="0.9" opacity="0.75">
          {DALLES.map((x) => (
            <path key={x} d={`M${x} 164L${x - 5} 190`} />
          ))}
          <path d="M0 177H1440" />
        </g>
        <g fill="#8DB195" opacity="0.9">
          {[150, 392, 701, 1015, 1260].map((x) => (
            <path key={x} d={`M${x} 164l-2 -6l3 4l1 -6l1 6l3 -4l-1 6z`} />
          ))}
        </g>
        <ellipse cx="560" cy="183" rx="22" ry="2.6" fill="#8AA091" opacity="0.18" />

        <Camion />

        <g className="bc-tricycle">
          <g transform="translate(0 154) scale(0.72)">
            <Tricycle />
          </g>
        </g>

        {[244, 480, 716].map((x, i) => (
          <g key={x} className={`bc-sac bc-sac--${i + 1}`}>
            <ellipse cx={x} cy="177" rx="12" ry="2.4" fill="url(#bc-ombre)" />
            <ellipse cx={x} cy="171" rx="10" ry="8.6" fill="url(#bc-sac-g)" />
            <ellipse cx={x + 1} cy="175" rx="9" ry="4.4" fill="#10140F" opacity="0.22" />
            <ellipse cx={x - 3.4} cy="167.6" rx="3.6" ry="2.4" fill="#9BB0A5" opacity="0.4" />
            <path d={`M${x - 3} 163.6q3 -5 6 0z`} fill="#1B221E" />
            <path d={`M${x - 2.4} 163.2l-4 -3 M${x + 2.4} 163.2l4 -3`} stroke="#1B221E" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        ))}
      </svg>
    </div>
  );
}
