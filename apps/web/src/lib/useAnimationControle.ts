'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Met en pause les animations SVG (SMIL) quand le bandeau est hors écran ou l'onglet caché,
 * et les fige si l'appareil demande moins d'animations. `imageFixe` : instant (en secondes)
 * où l'animation est gelée dans ce dernier cas.
 */
export function useAnimationControle(
  racine: RefObject<HTMLElement | null>,
  dessin: RefObject<SVGSVGElement | null>,
  imageFixe = 6,
) {
  useEffect(() => {
    const element = racine.current;
    const svg = dessin.current;
    if (!element || !svg) return;

    const sobre = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visibleEcran = true;
    const appliquer = () => {
      const enPause = sobre.matches || !visibleEcran || document.hidden;
      element.dataset.pause = enPause ? 'oui' : 'non'; // met aussi en pause la dérive CSS
      if (enPause) {
        svg.pauseAnimations();
        if (sobre.matches) svg.setCurrentTime(imageFixe);
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
      observateur.disconnect();
      document.removeEventListener('visibilitychange', appliquer);
      sobre.removeEventListener('change', appliquer);
    };
  }, [racine, dessin, imageFixe]);
}
