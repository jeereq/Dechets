'use client';

import { useState } from 'react';
import type { CommunePublique } from '@benime/shared';
import { appeler, garderJeton, type Formule, type Menage } from '@/lib/espace-api';
import { formaterPrix } from '@/lib/format';
import type { Locale } from '@/lib/i18n';
import { texteErreur, type TextesEspace } from './contexte';
import { remplir } from './utilitaires';

export function Inscription({
  locale,
  t,
  communes,
  prix,
  onCree,
  onAnnuler,
}: {
  locale: Locale;
  t: TextesEspace;
  communes: CommunePublique[];
  prix: { passage: number; mensuel: number };
  onCree: (menage: Menage) => void;
  onAnnuler: () => void;
}) {
  const ouvertes = communes.filter((c) => c.statut === 'OUVERTE');
  const [nom, setNom] = useState('');
  const [communeSlug, setCommuneSlug] = useState(ouvertes.length === 1 ? (ouvertes[0]?.slug ?? '') : '');
  const [avenue, setAvenue] = useState('');
  const [parcelle, setParcelle] = useState('');
  const [repere, setRepere] = useState('');
  const [formule, setFormule] = useState<Formule>('MENSUELLE');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function creer(event: React.FormEvent) {
    event.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const reponse = await appeler<{ jeton: string; menage: Menage }>('/menages', {
        corps: {
          nom,
          communeSlug,
          avenue,
          parcelle,
          repere: repere || undefined,
          formule,
          langue: locale === 'en' ? 'EN' : 'FR',
        },
      });
      garderJeton(reponse.jeton);
      onCree(reponse.menage);
    } catch (e) {
      setErreur(texteErreur(e, t));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="app-plein">
      <div className="app-entree app-entree--large">
        <h1 className="app-entree__titre">{t.inscription.titre}</h1>
        <p className="app-entree__texte">{t.inscription.texte}</p>

        <form className="app-formulaire" onSubmit={creer}>
          <div className="champ">
            <label htmlFor="ins-nom">{t.inscription.nom}</label>
            <input
              id="ins-nom"
              autoComplete="name"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              minLength={2}
            />
          </div>

          <div className="champ">
            <label htmlFor="ins-commune">{t.inscription.commune}</label>
            <select
              id="ins-commune"
              value={communeSlug}
              onChange={(e) => setCommuneSlug(e.target.value)}
              required
            >
              <option value="">{t.inscription.communeChoisir}</option>
              {ouvertes.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="champ">
            <label htmlFor="ins-avenue">{t.inscription.avenue}</label>
            <input
              id="ins-avenue"
              value={avenue}
              onChange={(e) => setAvenue(e.target.value)}
              required
              minLength={2}
            />
          </div>

          <div className="champ">
            <label htmlFor="ins-parcelle">{t.inscription.parcelle}</label>
            <input
              id="ins-parcelle"
              inputMode="text"
              value={parcelle}
              onChange={(e) => setParcelle(e.target.value)}
              required
            />
          </div>

          <div className="champ">
            <label htmlFor="ins-repere">{t.inscription.repere}</label>
            <input id="ins-repere" value={repere} onChange={(e) => setRepere(e.target.value)} />
            <span className="champ__aide">{t.inscription.repereAide}</span>
          </div>

          <fieldset className="app-choix">
            <legend>{t.inscription.formule}</legend>
            {(
              [
                ['MENSUELLE', t.inscription.mensuelle, t.inscription.mensuelleTexte, formaterPrix(prix.mensuel, 'USD')],
                ['PAR_PASSAGE', t.inscription.parPassage, t.inscription.parPassageTexte, formaterPrix(prix.passage)],
              ] as const
            ).map(([valeur, titre, texte, montant]) => (
              <label key={valeur} className={`app-option${formule === valeur ? ' app-option--active' : ''}`}>
                <input
                  type="radio"
                  name="formule"
                  value={valeur}
                  checked={formule === valeur}
                  onChange={() => setFormule(valeur)}
                />
                <span className="app-option__texte">
                  <strong>{titre}</strong>
                  <span>{remplir(texte, { prix: montant })}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {erreur ? (
            <p className="app-erreur" role="alert">
              {erreur}
            </p>
          ) : null}

          <button className="bouton bouton--principal bouton--grand" disabled={occupe}>
            {occupe ? t.inscription.creation : t.inscription.creer}
          </button>
          <button type="button" className="app-lien app-lien--centre" onClick={onAnnuler}>
            {t.connexion.changerNumero}
          </button>
        </form>
      </div>
    </div>
  );
}
