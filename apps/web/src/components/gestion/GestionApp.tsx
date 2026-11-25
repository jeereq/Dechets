'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  g,
  garderJetonGestion,
  lireJetonGestion,
  sessionExpiree,
  texteErreurGestion,
  type Agent,
} from '@/lib/gestion-api';
import { lien, type Locale } from '@/lib/i18n';
import { ConnexionPersonnel } from './ConnexionPersonnel';
import type { ContexteGestion, PageGestion } from './contexte';
import { POSTES } from './libelles';
import { VueAbonnes } from './VueAbonnes';
import { VueDemandes } from './VueDemandes';
import { VueEquipe } from './VueEquipe';
import { VuePaiements } from './VuePaiements';
import { VueRealisations } from './VueRealisations';
import { VueReglages } from './VueReglages';
import { VueTableau } from './VueTableau';
import { VueTournees } from './VueTournees';
import { VueZones } from './VueZones';

const MENU: Array<{ page: PageGestion; libelle: string; chef?: boolean }> = [
  { page: 'tableau', libelle: 'Tableau de bord' },
  { page: 'abonnes', libelle: 'Abonnés' },
  { page: 'demandes', libelle: 'Demandes', chef: true },
  { page: 'tournees', libelle: 'Tournées', chef: true },
  { page: 'paiements', libelle: 'Paiements' },
  { page: 'zones', libelle: 'Zones et contacts', chef: true },
  { page: 'realisations', libelle: 'Réalisations', chef: true },
  { page: 'equipe', libelle: 'Équipe', chef: true },
  { page: 'reglages', libelle: 'Réglages', chef: true },
];

const PAGES = MENU.map((m) => m.page);

const pageDepuisHash = (): PageGestion => {
  const h = window.location.hash.replace('#', '') as PageGestion;
  return PAGES.includes(h) ? h : 'tableau';
};

type Etat = { nom: 'chargement' } | { nom: 'connexion'; message?: string } | { nom: 'connecte'; agent: Agent };

export function GestionApp({ locale }: { locale: Locale }) {
  const [etat, setEtat] = useState<Etat>({ nom: 'chargement' });
  const [page, setPage] = useState<PageGestion>('tableau');
  const [annonce, setAnnonce] = useState<{ texte: string; ok: boolean } | null>(null);
  const minuterie = useRef<number | null>(null);

  const annoncer = useCallback((texte: string, ok = true) => {
    setAnnonce({ texte, ok });
    if (minuterie.current) window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => setAnnonce(null), ok ? 4500 : 9000);
  }, []);

  const deconnecter = useCallback((message?: string) => {
    garderJetonGestion(null);
    setEtat({ nom: 'connexion', message });
  }, []);

  const ouvrir = useCallback(async () => {
    if (!lireJetonGestion()) return setEtat({ nom: 'connexion' });
    try {
      setEtat({ nom: 'connecte', agent: await g<Agent>('/moi') });
    } catch (e) {
      if (sessionExpiree(e)) deconnecter('Votre session a expiré. Reconnectez-vous.');
      else setEtat({ nom: 'connexion', message: texteErreurGestion(e) });
    }
  }, [deconnecter]);

  useEffect(() => {
    void ouvrir();
    setPage(pageDepuisHash());
    const suivre = () => setPage(pageDepuisHash());
    window.addEventListener('hashchange', suivre);
    return () => window.removeEventListener('hashchange', suivre);
  }, [ouvrir]);

  // Un message de succès ne suit pas d'une page à l'autre.
  useEffect(() => setAnnonce(null), [page]);

  const aller = useCallback((p: PageGestion) => {
    window.location.hash = p;
    window.scrollTo({ top: 0 });
  }, []);

  if (etat.nom === 'chargement') {
    return (
      <div className="gs-connexion" role="status">
        <p className="gs-vide">Chargement…</p>
      </div>
    );
  }

  if (etat.nom === 'connexion') {
    return <ConnexionPersonnel message={etat.message} locale={locale} onConnecte={(jeton) => { garderJetonGestion(jeton); void ouvrir(); }} />;
  }

  const agent = etat.agent;
  const estChef = agent.poste === 'SUPERVISEUR';
  const menu = MENU.filter((m) => !m.chef || estChef);
  // Un agent de recouvrement qui ouvre une page réservée retombe sur le tableau.
  const courante = menu.some((m) => m.page === page) ? page : 'tableau';

  const ctx: ContexteGestion = {
    agent,
    aller,
    expirer: () => deconnecter('Votre session a expiré. Reconnectez-vous.'),
    annoncer,
    estChef,
  };

  return (
    <div className="gs">
      <aside className="gs-menu">
        <Link href={lien(locale, 'accueil')} className="gs-menu__logo" aria-label="Retour au site">
          <Image src="/logo-benime-mark.png" alt="" width={40} height={40} />
          <span>
            BENIME
            <small>Back-office</small>
          </span>
        </Link>
        <nav aria-label="Principale" className="gs-menu__liens">
          {menu.map((m) => (
            <button
              key={m.page}
              className={`gs-menu__lien${courante === m.page ? ' gs-menu__lien--actif' : ''}`}
              aria-current={courante === m.page ? 'page' : undefined}
              onClick={() => aller(m.page)}
            >
              {m.libelle}
            </button>
          ))}
        </nav>
        <div className="gs-menu__pied">
          <strong>{agent.nom}</strong>
          <span>{POSTES[agent.poste]}</span>
          <button className="gs-menu__sortie" onClick={() => deconnecter()}>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="gs-corps">
        {annonce ? (
          <p className={`gs-annonce ${annonce.ok ? 'gs-annonce--ok' : 'gs-annonce--ko'}`} role={annonce.ok ? 'status' : 'alert'}>
            {annonce.texte}
            <button className="gs-annonce__fermer" onClick={() => setAnnonce(null)} aria-label="Fermer">×</button>
          </p>
        ) : null}
        {courante === 'tableau' ? <VueTableau ctx={ctx} /> : null}
        {courante === 'abonnes' ? <VueAbonnes ctx={ctx} /> : null}
        {courante === 'demandes' ? <VueDemandes ctx={ctx} /> : null}
        {courante === 'tournees' ? <VueTournees ctx={ctx} /> : null}
        {courante === 'paiements' ? <VuePaiements ctx={ctx} /> : null}
        {courante === 'zones' ? <VueZones ctx={ctx} /> : null}
        {courante === 'realisations' ? <VueRealisations ctx={ctx} /> : null}
        {courante === 'equipe' ? <VueEquipe ctx={ctx} /> : null}
        {courante === 'reglages' ? <VueReglages ctx={ctx} /> : null}
      </main>
    </div>
  );
}
