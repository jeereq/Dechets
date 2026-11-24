'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { debutNavigation, finNavigation, useChargement } from '@/lib/chargement';

/**
 * Barre de chargement en bas de l'en-tete : elle tourne pendant un changement
 * de page et pendant chaque requete envoyee a l'API.
 */
export function ChargementEntete({ libelle }: { libelle: string }) {
  const chemin = usePathname();
  const visible = useChargement();

  // clic sur un lien interne : la navigation commence
  useEffect(() => {
    const surClic = (evenement: MouseEvent) => {
      if (evenement.button !== 0) return;
      if (evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return;
      const lien = (evenement.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!lien || lien.target === '_blank' || lien.hasAttribute('download')) return;
      const url = new URL(lien.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      debutNavigation();
    };
    // phase de capture : le composant Link de Next consomme le clic avant la phase normale
    document.addEventListener('click', surClic, true);
    return () => document.removeEventListener('click', surClic, true);
  }, []);

  // la page a change : la navigation est finie
  useEffect(() => {
    finNavigation();
  }, [chemin]);

  return (
    <div
      className={`chargement${visible ? ' chargement--actif' : ''}`}
      role="progressbar"
      aria-label={libelle}
      aria-busy={visible}
      aria-hidden={!visible}
    />
  );
}
