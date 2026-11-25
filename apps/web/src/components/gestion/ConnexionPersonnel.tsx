'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { appeler } from '@/lib/espace-api';
import { texteErreurGestion } from '@/lib/gestion-api';
import { lien, type Locale } from '@/lib/i18n';

/** Connexion du personnel par code SMS. Même session pour le back-office et l'application de terrain. */
export function ConnexionPersonnel({
  message,
  locale,
  onConnecte,
  titre = 'Back-office',
}: {
  message?: string | null;
  locale: Locale;
  onConnecte: (jeton: string) => void;
  titre?: string;
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
        <h1>{titre}</h1>
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
