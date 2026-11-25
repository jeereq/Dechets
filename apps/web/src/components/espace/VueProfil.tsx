'use client';

import { useState } from 'react';
import { appeler, garderJeton, type Formule, type Menage } from '@/lib/espace-api';
import { formaterPrix } from '@/lib/format';
import { estSessionExpiree, texteErreur, type Contexte } from './contexte';
import { IconeApp } from './IconesApp';
import { remplir } from './utilitaires';

export function VueProfil({ ctx, onSortie }: { ctx: Contexte; onSortie: () => void }) {
  const { t, menage } = ctx;
  const [nom, setNom] = useState(menage.nom);
  const [repere, setRepere] = useState(menage.repere ?? '');
  const [langue, setLangue] = useState(menage.langue);
  const [alerteSms, setAlerteSms] = useState(menage.alerteSms);
  const [alerteWa, setAlerteWa] = useState(menage.alerteWa);
  const [formule, setFormule] = useState<Formule>(menage.formule);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  async function enregistrer(event: React.FormEvent) {
    event.preventDefault();
    setOccupe(true);
    setMessage(null);
    try {
      const maj = await appeler<Menage>('/moi', {
        methode: 'PATCH',
        corps: { nom, repere: repere.trim() || null, langue, alerteSms, alerteWa, formule },
      });
      ctx.majMenage(maj);
      setMessage({ ok: true, texte: t.profil.enregistre });
    } catch (e) {
      if (estSessionExpiree(e)) ctx.expirer();
      else setMessage({ ok: false, texte: texteErreur(e, t) });
    } finally {
      setOccupe(false);
    }
  }

  function sortir() {
    garderJeton(null);
    onSortie();
  }

  return (
    <div className="app-page">
      <button className="app-retour" onClick={() => ctx.aller('accueil')}>
        <IconeApp nom="retour" />
        {t.onglets.accueil}
      </button>
      <h1 className="app-page__titre">{t.profil.titre}</h1>

      <section className="app-carte">
        <dl className="app-recap">
          <div>
            <dt>{t.profil.telephone}</dt>
            <dd>{menage.telephone}</dd>
          </div>
          <div>
            <dt>{t.profil.adresse}</dt>
            <dd>
              {menage.avenue}, {menage.parcelle} · {menage.commune.nom}
            </dd>
          </div>
        </dl>
      </section>

      <form className="app-carte app-formulaire" onSubmit={enregistrer}>
        <div className="champ">
          <label htmlFor="pr-nom">{t.profil.nom}</label>
          <input id="pr-nom" value={nom} onChange={(e) => setNom(e.target.value)} required minLength={2} />
        </div>
        <div className="champ">
          <label htmlFor="pr-repere">{t.profil.repere}</label>
          <input id="pr-repere" value={repere} onChange={(e) => setRepere(e.target.value)} />
        </div>

        <fieldset className="app-choix">
          <legend>{t.profil.langue}</legend>
          <div className="app-segment">
            {(['FR', 'EN'] as const).map((l) => (
              <label key={l} className={`app-segment__option${langue === l ? ' app-segment__option--actif' : ''}`}>
                <input type="radio" name="langue" checked={langue === l} onChange={() => setLangue(l)} />
                {l === 'FR' ? 'Français' : 'English'}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="app-choix">
          <legend>{t.profil.alertes}</legend>
          <label className="app-interrupteur">
            <input type="checkbox" checked={alerteSms} onChange={(e) => setAlerteSms(e.target.checked)} />
            <span>{t.profil.sms}</span>
          </label>
          <label className="app-interrupteur">
            <input type="checkbox" checked={alerteWa} onChange={(e) => setAlerteWa(e.target.checked)} />
            <span>{t.profil.whatsapp}</span>
          </label>
        </fieldset>

        <fieldset className="app-choix">
          <legend>{t.profil.formule}</legend>
          <div className="app-segment">
            {(
              [
                ['MENSUELLE', t.inscription.mensuelle],
                ['PAR_PASSAGE', t.inscription.parPassage],
              ] as const
            ).map(([valeur, titre]) => (
              <label
                key={valeur}
                className={`app-segment__option${formule === valeur ? ' app-segment__option--actif' : ''}`}
              >
                <input type="radio" name="formule" checked={formule === valeur} onChange={() => setFormule(valeur)} />
                {titre}
              </label>
            ))}
          </div>
          <span className="champ__aide">
            {formule === 'MENSUELLE'
              ? remplir(t.inscription.mensuelleTexte, { prix: formaterPrix(ctx.prix.mensuel, 'USD') })
              : remplir(t.inscription.parPassageTexte, { prix: formaterPrix(ctx.prix.passage) })}
          </span>
        </fieldset>

        {message ? (
          <p className={message.ok ? 'app-succes' : 'app-erreur'} role={message.ok ? 'status' : 'alert'}>
            {message.texte}
          </p>
        ) : null}

        <button className="bouton bouton--principal bouton--grand" disabled={occupe}>
          {occupe ? t.profil.envoi : t.profil.enregistrer}
        </button>
      </form>

      <section className="app-carte">
        <h2 className="app-titre">{t.profil.aide}</h2>
        <a className="bouton bouton--secondaire" href={`tel:${ctx.telService.replace(/[^+\d]/g, '')}`}>
          <IconeApp nom="telephone" taille={20} />
          {t.profil.appeler} · {ctx.telService}
        </a>
      </section>

      <button className="bouton bouton--danger-contour bouton--grand" onClick={sortir}>
        {t.profil.deconnexion}
      </button>
    </div>
  );
}
