'use client';

import { useSyncExternalStore } from 'react';

/**
 * Etat du chargement, hors des composants : l'en-tete est recree a chaque
 * changement de page, son etat local serait perdu au moment ou on en a besoin.
 */

/** Le chargement reste affiche au moins ce temps, pour qu'on le voie meme sur une requete rapide. */
const DUREE_MINIMALE = 450;
/** Filet de securite : une navigation qui n'aboutit pas ne laisse pas la barre tourner sans fin. */
const DUREE_MAXIMALE = 15000;

let requetes = 0;
let navigation = false;
let visible = false;
let debut = 0;
let fermeture: ReturnType<typeof setTimeout> | undefined;
let securite: ReturnType<typeof setTimeout> | undefined;
const abonnes = new Set<() => void>();

function evaluer() {
  if (fermeture) clearTimeout(fermeture);
  if (requetes > 0 || navigation) {
    if (!visible) {
      visible = true;
      debut = Date.now();
    }
  } else if (visible) {
    const reste = Math.max(0, DUREE_MINIMALE - (Date.now() - debut));
    fermeture = setTimeout(() => {
      visible = false;
      abonnes.forEach((fonction) => fonction());
    }, reste);
  }
  abonnes.forEach((fonction) => fonction());
}

export function debutNavigation() {
  navigation = true;
  if (securite) clearTimeout(securite);
  securite = setTimeout(finNavigation, DUREE_MAXIMALE);
  evaluer();
}

export function finNavigation() {
  if (!navigation) return;
  navigation = false;
  if (securite) clearTimeout(securite);
  evaluer();
}

/** Toute requete lancee depuis le navigateur passe par `suivre`. */
export async function suivre<T>(requete: Promise<T>): Promise<T> {
  requetes += 1;
  evaluer();
  try {
    return await requete;
  } finally {
    requetes = Math.max(0, requetes - 1);
    evaluer();
  }
}

export function useChargement(): boolean {
  return useSyncExternalStore(
    (rappel) => {
      abonnes.add(rappel);
      return () => abonnes.delete(rappel);
    },
    () => visible,
    () => false,
  );
}
