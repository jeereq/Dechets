'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { appeler } from '@/lib/espace-api';
import {
  g,
  garderJetonGestion,
  lireJetonGestion,
  sessionExpiree,
  texteErreurGestion,
  type Agent,
} from '@/lib/gestion-api';
import { lien, type Locale } from '@/lib/i18n';
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

function ConnexionPersonnel({
  message,
  locale,
  onConnecte,
}: {
  message?: string | null;
  locale: Locale;
  onConnecte: (jeton: string) => void;
}) {
  const [etape, setEtape] = useState<'telephone' | 'code'>('telephone');
  const [telephone, setTelephone] = useState('');
  const [code, setCode] = useState('');
  const [codeTest, setCodeTest] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(message ?? null);

  async function envoyer(event: React.FormEvent) {
    event.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const r = await appeler<{ codeDeTest?: string }>('/auth/code', { corps: { telephone }, jeton: null });
      setCodeTest(r.codeDeTest ?? null);
      setEtape('code');
    } catch (e) {
      setErreur(texteErreurGestion(e));
    } finally {
      setOccupe(false);
    }
  }

  async function verifier(event: React.FormEvent) {
    event.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const r = await appeler<{ jeton: string }>('/auth/verifier', {
        corps: { telephone, code, espace: 'PERSONNEL' },
        jeton: null,
      });
      onConnecte(r.jeton);
    } catch (e) {
      setErreur(texteErreurGestion(e));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="gs-connexion">
      <div className="gs-connexion__carte">
        <Image src="/logo-benime.png" alt="BENIME CONGO" width={170} height={40} priority />
        <h1>Back-office</h1>
        <p className="gs-discret">
          {etape === 'telephone'
            ? 'Réservé à l’équipe BENIME. Entrez votre numéro : nous vous envoyons un code par SMS.'
            : `Code envoyé au ${telephone}.`}
        </p>
        {etape === 'telephone' ? (
          <form className="gs-formulaire" onSubmit={envoyer}>
            <label>
              Votre téléphone
              <input className="gs-champ" type="tel" inputMode="tel" autoComplete="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="081 234 5678" required minLength={9} />
            </label>
            {erreur ? <p className="gs-annonce gs-annonce--ko" role="alert">{erreur}</p> : null}
            <button className="gs-bouton gs-bouton--plein gs-bouton--grand" disabled={occupe}>{occupe ? 'Envoi…' : 'Recevoir mon code'}</button>
          </form>
        ) : (
          <form className="gs-formulaire" onSubmit={verifier}>
            <label>
              Code à 6 chiffres
              <input className="gs-champ gs-champ--code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus />
            </label>
            {codeTest ? <p className="gs-info">Code de test : {codeTest}</p> : null}
            {erreur ? <p className="gs-annonce gs-annonce--ko" role="alert">{erreur}</p> : null}
            <button className="gs-bouton gs-bouton--plein gs-bouton--grand" disabled={occupe || code.length !== 6}>{occupe ? 'Vérification…' : 'Entrer'}</button>
            <button type="button" className="app-lien app-lien--centre" onClick={() => { setEtape('telephone'); setErreur(null); }}>Changer de numéro</button>
          </form>
        )}
        <Link className="app-lien app-lien--centre" href={lien(locale, 'accueil')}>Retour au site</Link>
      </div>
    </div>
  );
}
