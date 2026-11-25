'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { appeler, ErreurApi, garderJeton, lireJeton, type Menage } from '@/lib/espace-api';
import type { Locale } from '@/lib/i18n';
import { Connexion } from './Connexion';
import type { Contexte, DonneesPubliques, TextesEspace, Vue } from './contexte';
import { IconeApp, type NomIconeApp } from './IconesApp';
import { Inscription } from './Inscription';
import { VueAccueil } from './VueAccueil';
import { VueCredit } from './VueCredit';
import { VueMessages } from './VueMessages';
import { VuePassages } from './VuePassages';
import { VueProfil } from './VueProfil';

type Etat =
  | { nom: 'chargement' }
  | { nom: 'connexion'; message?: string }
  | { nom: 'inscription' }
  | { nom: 'connecte'; menage: Menage };

const VUES: Vue[] = ['accueil', 'passages', 'credit', 'messages', 'profil'];
const ONGLETS: Array<{ vue: Exclude<Vue, 'profil'>; icone: NomIconeApp }> = [
  { vue: 'accueil', icone: 'accueil' },
  { vue: 'passages', icone: 'passages' },
  { vue: 'credit', icone: 'credit' },
  { vue: 'messages', icone: 'messages' },
];

function vueDepuisHash(): Vue {
  const hash = window.location.hash.replace('#', '') as Vue;
  return VUES.includes(hash) ? hash : 'accueil';
}

export function EspaceApp({
  locale,
  t,
  donnees,
}: {
  locale: Locale;
  t: TextesEspace;
  donnees: DonneesPubliques;
}) {
  const [etat, setEtat] = useState<Etat>({ nom: 'chargement' });
  const [vue, setVue] = useState<Vue>('accueil');
  const [horsLigne, setHorsLigne] = useState(false);

  // Application installable : le service worker garde l'enveloppe en mémoire.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const maj = () => setHorsLigne(!navigator.onLine);
    maj();
    window.addEventListener('online', maj);
    window.addEventListener('offline', maj);
    return () => {
      window.removeEventListener('online', maj);
      window.removeEventListener('offline', maj);
    };
  }, []);

  // La vue suit le « # » de l'adresse : le bouton retour du téléphone fonctionne.
  useEffect(() => {
    setVue(vueDepuisHash());
    const suivre = () => setVue(vueDepuisHash());
    window.addEventListener('hashchange', suivre);
    return () => window.removeEventListener('hashchange', suivre);
  }, []);

  const aller = useCallback((v: Vue) => {
    window.location.hash = v;
    window.scrollTo({ top: 0 });
  }, []);

  const deconnecter = useCallback((message?: string) => {
    garderJeton(null);
    setEtat({ nom: 'connexion', message });
  }, []);

  const ouvrirSession = useCallback(async () => {
    if (!lireJeton()) return setEtat({ nom: 'connexion' });
    try {
      const moi = await appeler<{ type: string; menage?: Menage }>('/moi');
      if (moi.type === 'MENAGE' && moi.menage) setEtat({ nom: 'connecte', menage: moi.menage });
      else if (moi.type === 'VISITEUR') setEtat({ nom: 'inscription' });
      else deconnecter();
    } catch (e) {
      if (e instanceof ErreurApi && e.statut === 401) deconnecter();
      else setEtat({ nom: 'connexion', message: t.erreurReseau });
    }
  }, [deconnecter, t.erreurReseau]);

  useEffect(() => {
    void ouvrirSession();
  }, [ouvrirSession]);

  if (etat.nom === 'chargement') {
    return (
      <div className="app-plein app-plein--centre" role="status">
        <Image src="/logo-benime-mark.png" alt="" width={72} height={72} priority />
        <p className="discret">{t.chargement}</p>
      </div>
    );
  }

  if (etat.nom === 'connexion') {
    return (
      <Connexion
        locale={locale}
        t={t}
        message={etat.message}
        onConnecte={(jeton, nouveau) => {
          garderJeton(jeton);
          if (nouveau) setEtat({ nom: 'inscription' });
          else void ouvrirSession();
        }}
      />
    );
  }

  if (etat.nom === 'inscription') {
    return (
      <Inscription
        locale={locale}
        t={t}
        communes={donnees.communes}
        prix={donnees.prix}
        onCree={(menage) => {
          setEtat({ nom: 'connecte', menage });
          aller('accueil');
        }}
        onAnnuler={() => deconnecter()}
      />
    );
  }

  const ctx: Contexte = {
    locale,
    t,
    menage: etat.menage,
    majMenage: (menage) => setEtat({ nom: 'connecte', menage }),
    aller,
    expirer: () => deconnecter(t.sessionExpiree),
    prix: donnees.prix,
    telService: donnees.telService,
  };

  const initiale = etat.menage.nom.trim().charAt(0).toUpperCase() || '·';

  return (
    <div className="app">
      <header className="app-barre">
        <Image src="/logo-benime-mark.png" alt="" width={34} height={34} />
        <span className="app-barre__titre">My BENIME</span>
        <button
          className="app-avatar"
          onClick={() => aller('profil')}
          aria-label={t.profil.titre}
          aria-current={vue === 'profil' ? 'page' : undefined}
        >
          {initiale}
        </button>
      </header>

      {horsLigne ? (
        <p className="app-horsligne" role="status">
          {t.horsLigne}
        </p>
      ) : null}

      <main className="app-corps">
        {vue === 'accueil' ? <VueAccueil ctx={ctx} /> : null}
        {vue === 'passages' ? <VuePassages ctx={ctx} /> : null}
        {vue === 'credit' ? <VueCredit ctx={ctx} /> : null}
        {vue === 'messages' ? <VueMessages ctx={ctx} /> : null}
        {vue === 'profil' ? <VueProfil ctx={ctx} onSortie={() => deconnecter()} /> : null}
      </main>

      <nav className="app-onglets" aria-label="Menu">
        {ONGLETS.map(({ vue: v, icone }) => (
          <button
            key={v}
            className={`app-onglet${vue === v ? ' app-onglet--actif' : ''}`}
            onClick={() => aller(v)}
            aria-current={vue === v ? 'page' : undefined}
          >
            <IconeApp nom={icone} />
            <span>{t.onglets[v]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
