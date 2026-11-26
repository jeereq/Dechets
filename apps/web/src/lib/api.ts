import { COMMUNES_KINSHASA, type CommunePublique } from '@benime/shared';
import { suivre } from './chargement';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Le site doit s'afficher meme si l'API est arretee : chaque lecture a une
 * valeur de repli. Un site public qui tombe parce qu'une API tousse n'est pas
 * acceptable ici.
 */
async function lire<T>(chemin: string, repli: T, revalidate = 300): Promise<T> {
  try {
    const reponse = await fetch(`${BASE}${chemin}`, { next: { revalidate } });
    if (!reponse.ok) return repli;
    const corps = (await reponse.json()) as { data: T };
    return corps.data ?? repli;
  } catch {
    return repli;
  }
}

const COMMUNES_REPLI: CommunePublique[] = COMMUNES_KINSHASA.map((c) => ({
  slug: c.slug,
  nom: c.nom,
  statut: c.statut,
  menages: null,
  ouverteLe: null,
}));

export function getCommunes(): Promise<CommunePublique[]> {
  return lire<CommunePublique[]>('/communes', COMMUNES_REPLI);
}

export interface ReglagesPublics {
  prix_par_passage?: string;
  prix_mensuel?: string;
  passages_par_semaine?: string;
  devise?: string;
  devise_mensuel?: string;
  stat_plastique_tonnes?: string;
  stat_part_valorisee?: string;
}

const REGLAGES_REPLI: ReglagesPublics = {
  prix_par_passage: '6000',
  prix_mensuel: '15',
  passages_par_semaine: '1',
  devise: 'CDF',
  devise_mensuel: 'USD',
};

export function getReglages(): Promise<ReglagesPublics> {
  return lire<ReglagesPublics>('/reglages/publics', REGLAGES_REPLI);
}

export async function envoyerLead(payload: {
  telephone: string;
  communeSlug: string;
}): Promise<{ ok: boolean; message?: string }> {
  try {
    const reponse = await suivre(
      fetch(`${BASE}/leads`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    if (reponse.ok) return { ok: true };

    const corps = (await reponse.json().catch(() => ({}))) as { erreur?: string };
    return { ok: false, message: corps.erreur };
  } catch {
    return { ok: false };
  }
}

export async function envoyerContact(payload: {
  nom: string;
  telephone: string;
  email: string;
  message: string;
}): Promise<{ ok: boolean; message?: string }> {
  try {
    const reponse = await suivre(
      fetch(`${BASE}/contact`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    if (reponse.ok) return { ok: true };

    const corps = (await reponse.json().catch(() => ({}))) as { erreur?: string };
    return { ok: false, message: corps.erreur };
  } catch {
    return { ok: false };
  }
}

export const API_BASE = BASE;
