'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type Contexte = {
  /** Slug de la commune touchee sur la carte, dans la liste ou ailleurs. */
  choisie: string | null;
  choisir: (slug: string | null) => void;
};

const CommuneChoisieContexte = createContext<Contexte>({ choisie: null, choisir: () => {} });

/** Garde la commune choisie, pour que la carte, la liste et le formulaire restent d'accord. */
export function CommuneChoisieProvider({ children }: { children: ReactNode }) {
  const [choisie, choisir] = useState<string | null>(null);
  const valeur = useMemo(() => ({ choisie, choisir }), [choisie]);
  return <CommuneChoisieContexte.Provider value={valeur}>{children}</CommuneChoisieContexte.Provider>;
}

export const useCommuneChoisie = () => useContext(CommuneChoisieContexte);
