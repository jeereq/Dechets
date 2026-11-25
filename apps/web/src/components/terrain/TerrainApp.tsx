'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ErreurApi, HORS_RESEAU } from '@/lib/espace-api';
import { garderJetonGestion, lireJetonGestion } from '@/lib/gestion-api';
import type { Locale } from '@/lib/i18n';
import {
  agentGarde,
  envoyerAttente,
  fileAttente,
  garderAgent,
  terrain,
  texteErreurTerrain,
  viderTerrainLocal,
  type AgentTerrain,
} from '@/lib/terrain-api';
import { ConnexionPersonnel } from '../gestion/ConnexionPersonnel';
import { IconeApp, type NomIconeApp } from '../espace/IconesApp';
import type { ContexteTerrain, PageTerrain } from './contexte';
import { VueEncaisser } from './VueEncaisser';
import { VueMoi } from './VueMoi';
import { VueTournee } from './VueTournee';

type Etat = { nom: 'chargement' } | { nom: 'connexion'; message?: string } | { nom: 'connecte'; agent: AgentTerrain };

const PAGES: PageTerrain[] = ['tournee', 'encaisser', 'moi'];

const pageDepuisHash = (): PageTerrain | null => {
  const h = window.location.hash.replace('#', '') as PageTerrain;
  return PAGES.includes(h) ? h : null;
};

export function TerrainApp({ locale }: { locale: Locale }) {
  const [etat, setEtat] = useState<Etat>({ nom: 'chargement' });
  const [page, setPage] = useState<PageTerrain | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; ok: boolean } | null>(null);
  const [enAttente, setEnAttente] = useState(0);
  const [enLigne, setEnLigne] = useState(true);
  const [version, setVersion] = useState(0);
  const minuterie = useRef<number | null>(null);

  const annoncer = useCallback((texte: string, ok = true) => {
    setAnnonce({ texte, ok });
    if (minuterie.current) window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => setAnnonce(null), ok ? 4500 : 9000);
  }, []);

  const actualiserAttente = useCallback(() => setEnAttente(fileAttente().length), []);

  /** La session a expiré : on garde les résultats non envoyés pour la prochaine connexion. */
  const expirer = useCallback(() => {
    garderJetonGestion(null);
    setEtat({ nom: 'connexion', message: 'Votre session a expiré. Reconnectez-vous.' });
  }, []);

  const deconnecter = useCallback(() => {
    garderJetonGestion(null);
    viderTerrainLocal();
    setEnAttente(0);
    setEtat({ nom: 'connexion' });
  }, []);

  const envoyer = useCallback(async (): Promise<boolean> => {
    if (fileAttente().length === 0) return true;
    try {
      const bilan = await envoyerAttente();
      actualiserAttente();
      if (bilan.envoyes > 0) {
        setVersion((v) => v + 1);
        annoncer(
          bilan.envoyes === 1 ? '1 passage envoyé.' : `${bilan.envoyes} passages envoyés.`,
          true,
        );
      }
      if (bilan.refuses.length > 0) {
        annoncer(
          `${bilan.refuses.length} passage${bilan.refuses.length > 1 ? 's' : ''} non accepté${bilan.refuses.length > 1 ? 's' : ''} : ${bilan.refuses[0]?.message ?? ''}`,
          false,
        );
        setVersion((v) => v + 1);
      }
      return bilan.restants === 0;
    } catch (e) {
      if (e instanceof ErreurApi && e.statut === 401) expirer();
      return false;
    }
  }, [actualiserAttente, annoncer, expirer]);

  const ouvrir = useCallback(async () => {
    if (!lireJetonGestion()) return setEtat({ nom: 'connexion' });
    try {
      const agent = await terrain<AgentTerrain>('/moi');
      garderAgent(agent);
      setEtat({ nom: 'connecte', agent });
    } catch (e) {
      if (e instanceof ErreurApi && e.statut === HORS_RESEAU) {
        // Sans réseau, on rouvre avec le dernier profil connu : la tournée gardée reste utilisable.
        const garde = agentGarde();
        if (garde) return setEtat({ nom: 'connecte', agent: garde });
      }
      if (e instanceof ErreurApi && (e.statut === 401 || e.statut === 403)) {
        garderJetonGestion(null);
        setEtat({
          nom: 'connexion',
          message: e.statut === 403 ? 'Ce numéro n’a pas accès à l’application de terrain.' : 'Votre session a expiré. Reconnectez-vous.',
        });
      } else {
        setEtat({ nom: 'connexion', message: texteErreurTerrain(e) });
      }
    }
  }, []);

  useEffect(() => {
    void ouvrir();
    actualiserAttente();
    setPage(pageDepuisHash());
    setEnLigne(navigator.onLine);
    const suivre = () => setPage(pageDepuisHash());
    window.addEventListener('hashchange', suivre);
    return () => window.removeEventListener('hashchange', suivre);
  }, [ouvrir, actualiserAttente]);

  // Le réseau revient : on envoie ce qui attendait.
  useEffect(() => {
    const retour = () => {
      setEnLigne(true);
      void envoyer();
    };
    const coupure = () => setEnLigne(false);
    window.addEventListener('online', retour);
    window.addEventListener('offline', coupure);
    return () => {
      window.removeEventListener('online', retour);
      window.removeEventListener('offline', coupure);
    };
  }, [envoyer]);

  // À l'ouverture, on tente aussi d'envoyer, au cas où l'événement « online » a été manqué.
  useEffect(() => {
    if (etat.nom === 'connecte') void envoyer();
  }, [etat.nom, envoyer]);

  // Un service worker garde l'application ouverte sans réseau. Dès que l'écran principal
  // est affiché, on lui demande de garder la page et les fichiers déjà chargés.
  useEffect(() => {
    if (etat.nom !== 'connecte' || !('serviceWorker' in navigator)) return;
    let actif = true;
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        if (!actif) return;
        const fichiers = performance
          .getEntriesByType('resource')
          .map((r) => r.name)
          .filter((u) => /\/_next\/static\/|\.(png|jpe?g|svg|webp|woff2?)$/.test(new URL(u).pathname));
        reg.active?.postMessage({ type: 'garder', urls: [window.location.pathname, ...fichiers] });
      })
      .catch(() => undefined);
    return () => {
      actif = false;
    };
  }, [etat.nom]);

  useEffect(() => setAnnonce(null), [page]);

  const aller = useCallback((p: PageTerrain) => {
    window.location.hash = p;
    window.scrollTo({ top: 0 });
  }, []);

  if (etat.nom === 'chargement') {
    return (
      <div className="app-plein app-plein--centre" role="status">
        <span className="app-attente__rond" aria-hidden="true" />
        <p>Chargement…</p>
      </div>
    );
  }

  if (etat.nom === 'connexion') {
    return (
      <ConnexionPersonnel
        titre="BENIME Terrain"
        message={etat.message}
        locale={locale}
        onConnecte={(jeton) => {
          garderJetonGestion(jeton);
          void ouvrir();
        }}
      />
    );
  }

  const agent = etat.agent;
  const onglets: Array<{ page: PageTerrain; libelle: string; icone: NomIconeApp }> = [
    ...(agent.peutCollecter ? [{ page: 'tournee' as const, libelle: 'Tournée', icone: 'passages' as const }] : []),
    ...(agent.peutEncaisser ? [{ page: 'encaisser' as const, libelle: 'Encaisser', icone: 'credit' as const }] : []),
    { page: 'moi' as const, libelle: 'Moi', icone: 'profil' as const },
  ];
  const courante = onglets.find((o) => o.page === page)?.page ?? onglets[0].page;

  const ctx: ContexteTerrain = {
    agent,
    aller,
    expirer,
    annoncer,
    enAttente,
    actualiserAttente,
    envoyer,
    enLigne,
    deconnecter,
    versionDonnees: version,
  };

  return (
    <div className="app tr">
      <header className="app-barre">
        <h1 className="app-barre__titre">BENIME Terrain</h1>
        <button className="app-avatar" onClick={() => aller('moi')} aria-label="Mon profil">
          {agent.nom.trim().charAt(0).toUpperCase()}
        </button>
      </header>

      {!enLigne ? (
        <p className="app-horsligne" role="status">
          Pas de réseau. Vos passages sont gardés sur ce téléphone.
        </p>
      ) : enAttente > 0 ? (
        <p className="app-horsligne tr-envoi" role="status">
          {enAttente} passage{enAttente > 1 ? 's' : ''} à envoyer
          <button className="tr-envoi__bouton" onClick={() => void envoyer()}>
            Envoyer
          </button>
        </p>
      ) : null}

      <main className="app-corps">
        {annonce ? (
          <p className={annonce.ok ? 'app-succes tr-annonce' : 'app-erreur tr-annonce'} role={annonce.ok ? 'status' : 'alert'}>
            {annonce.texte}
          </p>
        ) : null}
        {courante === 'tournee' ? <VueTournee ctx={ctx} /> : null}
        {courante === 'encaisser' ? <VueEncaisser ctx={ctx} /> : null}
        {courante === 'moi' ? <VueMoi ctx={ctx} locale={locale} /> : null}
      </main>

      <nav className="app-onglets" aria-label="Principale" style={{ gridTemplateColumns: `repeat(${onglets.length}, 1fr)` }}>
        {onglets.map((o) => (
          <button
            key={o.page}
            className={`app-onglet${courante === o.page ? ' app-onglet--actif' : ''}`}
            aria-current={courante === o.page ? 'page' : undefined}
            onClick={() => aller(o.page)}
          >
            <IconeApp nom={o.icone} />
            {o.libelle}
          </button>
        ))}
      </nav>
    </div>
  );
}
