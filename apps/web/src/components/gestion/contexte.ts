import { useCallback, useEffect, useState } from 'react';
import { g, sessionExpiree, texteErreurGestion, type Agent } from '@/lib/gestion-api';

export type PageGestion =
  | 'tableau'
  | 'abonnes'
  | 'demandes'
  | 'tournees'
  | 'paiements'
  | 'equipe'
  | 'zones'
  | 'realisations'
  | 'reglages';

export interface ContexteGestion {
  agent: Agent;
  aller: (page: PageGestion) => void;
  expirer: () => void;
  /** Message affiché en haut : succès (vert) ou problème (rouge). */
  annoncer: (texte: string, ok?: boolean) => void;
  estChef: boolean;
}

/**
 * Charge une ressource sous /gestion. Passer `null` suspend le chargement.
 * Les données précédentes restent affichées pendant un rechargement.
 */
export function useCharge<T>(chemin: string | null, ctx: ContexteGestion) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [compteur, setCompteur] = useState(0);
  const { expirer } = ctx;

  useEffect(() => {
    if (!chemin) return;
    let actif = true;
    setChargement(true);
    setErreur(null);
    g<T>(chemin)
      .then((d) => actif && setDonnees(d))
      .catch((e) => {
        if (sessionExpiree(e)) expirer();
        else if (actif) setErreur(texteErreurGestion(e));
      })
      .finally(() => actif && setChargement(false));
    return () => {
      actif = false;
    };
  }, [chemin, compteur, expirer]);

  const recharger = useCallback(() => setCompteur((n) => n + 1), []);
  return { donnees, erreur, chargement, recharger };
}

/** Lance une action, annonce le résultat, puis appelle `apres` en cas de succès. */
export function useAction(ctx: ContexteGestion) {
  const [occupe, setOccupe] = useState(false);
  const { annoncer, expirer } = ctx;

  const agir = useCallback(
    async (action: () => Promise<unknown>, succes: string, apres?: () => void) => {
      setOccupe(true);
      try {
        await action();
        if (succes) annoncer(succes, true);
        apres?.();
        return true;
      } catch (e) {
        if (sessionExpiree(e)) expirer();
        else annoncer(texteErreurGestion(e), false);
        return false;
      } finally {
        setOccupe(false);
      }
    },
    [annoncer, expirer],
  );

  return { occupe, agir };
}
