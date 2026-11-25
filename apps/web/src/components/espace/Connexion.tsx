'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { appeler } from '@/lib/espace-api';
import { lien, type Locale } from '@/lib/i18n';
import { texteErreur, type TextesEspace } from './contexte';
import { remplir } from './utilitaires';

interface ReponseCode {
  envoye: boolean;
  expireDansSecondes: number;
  codeDeTest?: string;
}

interface ReponseVerif {
  jeton: string;
  type: 'MENAGE' | 'PERSONNEL' | 'VISITEUR';
  nouveau: boolean;
}

export function Connexion({
  locale,
  t,
  message,
  onConnecte,
}: {
  locale: Locale;
  t: TextesEspace;
  message?: string | null;
  onConnecte: (jeton: string, nouveau: boolean) => void;
}) {
  const [etape, setEtape] = useState<'telephone' | 'code'>('telephone');
  const [telephone, setTelephone] = useState('');
  const [code, setCode] = useState('');
  const [codeTest, setCodeTest] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(message ?? null);
  const [attente, setAttente] = useState(0);

  // Délai avant de pouvoir redemander un code.
  useEffect(() => {
    if (attente <= 0) return;
    const id = window.setTimeout(() => setAttente((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [attente]);

  async function envoyerCode(event?: React.FormEvent) {
    event?.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const reponse = await appeler<ReponseCode>('/auth/code', {
        corps: { telephone },
        jeton: null,
      });
      setCodeTest(reponse.codeDeTest ?? null);
      setCode('');
      setEtape('code');
      setAttente(30);
    } catch (e) {
      setErreur(texteErreur(e, t));
    } finally {
      setOccupe(false);
    }
  }

  async function verifier(event: React.FormEvent) {
    event.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const reponse = await appeler<ReponseVerif>('/auth/verifier', {
        corps: { telephone, code, espace: undefined },
        jeton: null,
      });
      onConnecte(reponse.jeton, reponse.nouveau || reponse.type === 'VISITEUR');
    } catch (e) {
      setErreur(texteErreur(e, t));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="app-plein">
      <div className="app-entree">
        <Image
          src="/logo-benime.png"
          alt="BENIME CONGO"
          width={200}
          height={47}
          priority
          className="app-entree__logo"
        />
        <h1 className="app-entree__titre">
          {etape === 'telephone' ? t.connexion.titre : t.connexion.codeTitre}
        </h1>
        <p className="app-entree__texte">
          {etape === 'telephone'
            ? t.connexion.texte
            : remplir(t.connexion.codeTexte, { telephone })}
        </p>

        {etape === 'telephone' ? (
          <form className="app-formulaire" onSubmit={envoyerCode}>
            <div className="champ">
              <label htmlFor="app-tel">{t.connexion.telephone}</label>
              <input
                id="app-tel"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t.connexion.exemple}
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
                minLength={9}
              />
            </div>
            {erreur ? (
              <p className="app-erreur" role="alert">
                {erreur}
              </p>
            ) : null}
            <button className="bouton bouton--principal bouton--grand" disabled={occupe}>
              {occupe ? t.connexion.envoi : t.connexion.envoyer}
            </button>
          </form>
        ) : (
          <form className="app-formulaire" onSubmit={verifier}>
            <div className="champ">
              <label htmlFor="app-code">{t.connexion.code}</label>
              <input
                id="app-code"
                className="app-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
            </div>
            {codeTest ? (
              <p className="app-info">{remplir(t.connexion.codeTest, { code: codeTest })}</p>
            ) : null}
            {erreur ? (
              <p className="app-erreur" role="alert">
                {erreur}
              </p>
            ) : null}
            <button
              className="bouton bouton--principal bouton--grand"
              disabled={occupe || code.length !== 6}
            >
              {occupe ? t.connexion.verification : t.connexion.verifier}
            </button>
            <div className="app-liens">
              <button
                type="button"
                className="app-lien"
                onClick={() => {
                  setEtape('telephone');
                  setErreur(null);
                }}
              >
                {t.connexion.changerNumero}
              </button>
              <button
                type="button"
                className="app-lien"
                disabled={occupe || attente > 0}
                onClick={() => envoyerCode()}
              >
                {t.connexion.renvoyer}
                {attente > 0 ? ` (${attente})` : ''}
              </button>
            </div>
          </form>
        )}

        <Link className="app-lien app-lien--centre" href={lien(locale, 'accueil')}>
          {t.retourSite}
        </Link>
      </div>
    </div>
  );
}
