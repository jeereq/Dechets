'use client';

import { useEffect, useRef } from 'react';

/**
 * Bande decorative au-dessus du pied de page : un camion compacteur passe dans
 * l'avenue et charge trois sacs poubelles. Dessin original, sans image ni script
 * d'animation (tout est en CSS). L'animation se met en pause hors ecran et quand
 * l'onglet est cache ; elle est coupee si l'appareil demande moins d'animations.
 */
const MAISONS = [0, 330, 660, 990, 1320];

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
      <svg viewBox="0 0 1440 150" width="100%" height="100%" preserveAspectRatio="xMidYMax slice" focusable="false">
        <rect width="1440" height="150" fill="#EEF4F0" />
        {MAISONS.map((x) => (
          <g key={x}>
            <rect x={x + 20} y="34" width="110" height="64" fill="#D6E6DA" />
            <rect x={x + 36} y="46" width="20" height="22" fill="#F7FBF8" />
            <rect x={x + 82} y="46" width="20" height="22" fill="#F7FBF8" />
            <rect x={x + 150} y="52" width="86" height="46" fill="#D6E6DA" />
            <rect x={x + 166} y="62" width="18" height="20" fill="#F7FBF8" />
            <rect x={x + 252} y="26" width="64" height="72" fill="#D6E6DA" />
            <rect x={x + 264} y="38" width="16" height="20" fill="#F7FBF8" />
            <circle cx={x + 138} cy="64" r="18" fill="#9CC9A8" />
            <circle cx={x + 246} cy="70" r="14" fill="#9CC9A8" />
          </g>
        ))}
        <rect y="96" width="1440" height="38" fill="#59665F" />
        <rect y="134" width="1440" height="16" fill="#CFDCCF" />
        <rect y="130" width="1440" height="4" fill="#B9C9BD" />
        <g fill="#E8EFE9">
          {Array.from({ length: 18 }, (_, i) => (
            <rect key={i} x={20 + i * 82} y="114" width="40" height="3" />
          ))}
        </g>

        <g className="bc-camion">
          <g transform="translate(0 10) scale(0.62)">
            <g className="bc-corps">
              <rect x="0" y="76" width="122" height="76" rx="5" fill="#2E9E3F" />
              <rect x="0" y="76" width="122" height="14" rx="5" fill="#27843A" />
              <rect x="-8" y="100" width="16" height="52" rx="3" fill="#1F6B2C" />
              <rect x="30" y="108" width="62" height="4" fill="#27843A" />
              <rect x="30" y="122" width="62" height="4" fill="#27843A" />
              <rect x="126" y="94" width="72" height="58" rx="6" fill="#F3F7F2" />
              <path d="M150 100h38a4 4 0 0 1 4 4v18h-42z" fill="#9FD1E8" />
              <rect x="126" y="148" width="76" height="8" rx="3" fill="#1F6B2C" />
              <rect x="0" y="148" width="126" height="8" rx="3" fill="#27843A" />
              <circle cx="194" cy="136" r="3" fill="#F5A800" />
            </g>
            {[34, 160].map((cx) => (
              <g key={cx} className="bc-roue">
                <circle cx={cx} cy="160" r="14" fill="#2B2F2D" />
                <circle cx={cx} cy="160" r="6" fill="#AEB8B2" />
                <rect x={cx - 1} y="148" width="2" height="24" fill="#6A7570" />
              </g>
            ))}
            <circle cx="-26" cy="126" r="6" fill="#8A5A3C" />
            <rect x="-32" y="133" width="12" height="22" rx="3" fill="#F28C28" />
            <rect x="-31" y="155" width="4" height="17" fill="#2B3A55" />
            <rect x="-25" y="155" width="4" height="17" fill="#2B3A55" />
            <rect x="-35" y="119" width="12" height="4" rx="2" fill="#F3F7F2" />
          </g>
        </g>

        {[460, 720, 980].map((x, i) => (
          <g key={x} className={`bc-sac bc-sac--${i + 1}`}>
            <ellipse cx={x} cy="138" rx="9" ry="8" fill="#2F3A34" />
            <rect x={x - 3} y="127" width="6" height="4" rx="1.5" fill="#1F2824" />
          </g>
        ))}
      </svg>
    </div>
  );
}
