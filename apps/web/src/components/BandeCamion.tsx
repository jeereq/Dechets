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

function Roue({ cx, rayon, classe }: { cx: number; rayon: number; classe?: string }) {
  return (
    <g className={classe}>
      <circle cx={cx} cy={-rayon} r={rayon} fill="#1F2221" />
      <circle cx={cx} cy={-rayon} r={rayon * 0.74} fill="#2B2F2D" />
      <circle cx={cx} cy={-rayon} r={rayon * 0.46} fill="#B9C0BC" />
      <circle cx={cx} cy={-rayon} r={rayon * 0.16} fill="#6A7570" />
      <rect x={cx - 1.2} y={-rayon * 1.78} width="2.4" height={rayon * 1.56} fill="#8C9691" />
      <rect
        x={cx - rayon * 0.78}
        y={-rayon - 1.2}
        width={rayon * 1.56}
        height="2.4"
        fill="#8C9691"
      />
    </g>
  );
}

function Camion() {
  return (
    <g transform="translate(983 146) scale(0.72)">
      <ellipse cx="152" cy="2" rx="160" ry="8" fill="#000" opacity="0.22" />
      <g className="bc-vib">
        <g className="bc-camion-corps">
          <rect x="4" y="-36" width="290" height="10" fill="#2B2F2D" />
          {/* benne blanche */}
          <rect x="80" y="-130" width="158" height="98" rx="6" fill="#F7F8F6" />
          <rect x="80" y="-130" width="158" height="4" rx="2" fill="#E1E6E2" />
          <rect x="80" y="-44" width="158" height="12" fill="#E7EBE7" />
          <path d="M90 -82h140v6H90z" fill="#2BB24C" />
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
          <path d="M18 -136h60l8 6v98H0v-66z" fill="#2BB24C" />
          <path d="M18 -136h60l8 6v10H14z" fill="#22983E" />
          <path d="M10 -120l60 78M32 -126l50 66" stroke="#1E8E3A" strokeWidth="3.5" fill="none" />
          <path d="M60 -126v70" stroke="#1C1F1D" strokeWidth="3" fill="none" />
          <rect x="0" y="-38" width="86" height="6" fill="#1E8E3A" />
          <rect x="0" y="-54" width="3" height="14" fill="#D93025" />
          {/* goulotte de chargement */}
          <rect x="3" y="-84" width="32" height="48" fill="#1F5E2A" />
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
          {/* cabine */}
          <path d="M240 -36v-72q0 -4 4 -4h32l22 28 4 4v44z" fill="#F7F8F6" />
          <path d="M250 -100h24l16 22h-40z" fill="#9FD1E8" />
          <path d="M254 -98l8 0 -6 18h-4z" fill="#fff" opacity="0.45" />
          <rect x="240" y="-52" width="64" height="6" fill="#2BB24C" />
          <rect x="298" y="-58" width="5" height="8" rx="1" fill="#FFE9A6" />
          <rect x="296" y="-42" width="10" height="8" fill="#2B2F2D" />
          <rect x="262" y="-82" width="2" height="30" fill="#C9D0CB" />
          <rect x="236" y="-92" width="6" height="14" rx="2" fill="#2B2F2D" />
          <circle className="bc-gyrophare" cx="262" cy="-118" r="4.5" fill="#F5A800" />
        </g>
        <path d="M24 -20a24 24 0 0 1 48 0z" fill="#2B2F2D" />
        <path d="M54 -20a24 24 0 0 1 48 0z" fill="#2B2F2D" />
        <path d="M248 -20a24 24 0 0 1 48 0z" fill="#2B2F2D" />
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
          <ellipse cx="72" cy="2" rx="80" ry="6" fill="#000" opacity="0.22" />
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
            <rect x="0" y="-56" width="94" height="40" rx="2" fill="#5A6E45" />
            <path d="M18 -56v40M36 -56v40M54 -56v40M72 -56v40" stroke="#4C5F3B" strokeWidth="2" />
            <rect x="-2" y="-59" width="98" height="5" rx="2" fill="#46583A" />
            <rect x="0" y="-18" width="94" height="5" fill="#3C4A31" />
            <rect x="-16" y="-8" width="16" height="3" rx="1" fill="#2B2F2D" />
            {/* cadre et moteur */}
            <rect x="92" y="-34" width="36" height="6" fill="#2B2F2D" />
            <rect x="100" y="-42" width="24" height="22" rx="3" fill="#3A3F3C" />
            {/* fourche, phare et roue avant */}
            <path d="M138 -16L126 -66" stroke="#2B2F2D" strokeWidth="4" fill="none" />
            <path d="M120 -70h14" stroke="#2B2F2D" strokeWidth="4" strokeLinecap="round" />
            <circle cx="144" cy="-60" r="5" fill="#FFE9A6" />
            <path d="M122 -20a18 18 0 0 1 36 0z" fill="#2B2F2D" />
            {/* conducteur */}
            <rect x="104" y="-78" width="16" height="30" rx="4" fill="#2B5C9E" />
            <circle cx="112" cy="-86" r="7" fill="#8A5A3C" />
            <path d="M105 -88a7 7 0 0 1 14 0z" fill="#F3F7F2" />
            <rect x="118" y="-72" width="14" height="4" rx="2" fill="#2B5C9E" />
            {/* toit */}
            <rect x="98" y="-106" width="2.5" height="30" fill="#2B2F2D" />
            <rect x="132" y="-106" width="2.5" height="36" fill="#2B2F2D" />
            <rect x="92" y="-110" width="48" height="5" rx="2" fill="#202422" />
            <Roue cx={40} rayon={16} classe="bc-roue" />
            <Roue cx={138} rayon={16} classe="bc-roue" />
          </g>
          {/* l'eboueur, debout sur le marchepied arriere */}
          <g transform="translate(-10 -8)">
            <rect x="-5" y="-22" width="5" height="22" fill="#2B3A55" />
            <rect x="1" y="-22" width="5" height="22" fill="#2B3A55" />
            <rect x="-6" y="-3" width="7" height="3" fill="#1C1F1D" />
            <rect x="0" y="-3" width="7" height="3" fill="#1C1F1D" />
            <rect x="-8" y="-46" width="16" height="26" rx="3" fill="#F28C28" />
            <rect x="-8" y="-38" width="16" height="3" fill="#F3F7F2" />
            <rect x="-8" y="-30" width="16" height="3" fill="#F3F7F2" />
            <circle cx="0" cy="-54" r="7" fill="#8A5A3C" />
            <path d="M-7.5 -55a7.5 7.5 0 0 1 15 0z" fill="#F3F7F2" />
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
        <rect width="1440" height="190" fill="#EEF4F0" />
        {MAISONS.map((x) => (
          <g key={x}>
            <rect x={x + 20} y="36" width="112" height="84" fill="#D6E6DA" />
            <rect x={x + 16} y="32" width="120" height="7" fill="#C2D6C7" />
            <rect x={x + 36} y="52" width="20" height="24" fill="#F7FBF8" />
            <rect x={x + 84} y="52" width="20" height="24" fill="#F7FBF8" />
            <rect x={x + 60} y="88" width="22" height="32" fill="#B8CFBE" />
            <rect x={x + 150} y="62" width="88" height="58" fill="#D6E6DA" />
            <rect x={x + 146} y="58" width="96" height="6" fill="#C2D6C7" />
            <rect x={x + 166} y="74" width="18" height="20" fill="#F7FBF8" />
            <rect x={x + 252} y="28" width="66" height="92" fill="#D6E6DA" />
            <rect x={x + 248} y="24" width="74" height="6" fill="#C2D6C7" />
            <rect x={x + 262} y="42" width="16" height="20" fill="#F7FBF8" />
            <rect x={x + 290} y="42" width="16" height="20" fill="#F7FBF8" />
            <rect x={x + 262} y="76" width="16" height="20" fill="#F7FBF8" />
            <rect x={x + 143} y="82" width="4" height="38" fill="#8C735B" />
            <circle cx={x + 145} cy="76" r="17" fill="#9CC9A8" />
            <rect x={x + 242} y="92" width="4" height="28" fill="#8C735B" />
            <circle cx={x + 244} cy="88" r="13" fill="#9CC9A8" />
          </g>
        ))}
        <rect y="118" width="1440" height="44" fill="#59665F" />
        <rect y="116" width="1440" height="3" fill="#6E7C74" />
        <rect y="162" width="1440" height="28" fill="#CFDCCF" />
        <rect y="159" width="1440" height="4" fill="#B9C9BD" />
        <g fill="#E8EFE9">
          {Array.from({ length: 18 }, (_, i) => (
            <rect key={i} x={20 + i * 82} y="139" width="40" height="3" />
          ))}
        </g>

        <Camion />

        <g className="bc-tricycle">
          <g transform="translate(0 154) scale(0.72)">
            <Tricycle />
          </g>
        </g>

        {[244, 480, 716].map((x, i) => (
          <g key={x} className={`bc-sac bc-sac--${i + 1}`}>
            <ellipse cx={x} cy="172" rx="9" ry="8" fill="#2F3A34" />
            <rect x={x - 3} y="162" width="6" height="4" rx="1.5" fill="#1F2824" />
          </g>
        ))}
      </svg>
    </div>
  );
}
