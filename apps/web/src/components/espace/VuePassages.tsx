'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  appeler,
  ErreurApi,
  type ApercuDemande,
  type Demande,
} from '@/lib/espace-api';
import { formaterPrix } from '@/lib/format';
import { estSessionExpiree, texteErreur, type Contexte } from './contexte';
import { IconeApp } from './IconesApp';
import { dateCourte, joursA, remplir } from './utilitaires';

type TypeDemande = Demande['type'];

export function VuePassages({ ctx }: { ctx: Contexte }) {
  const { t, locale, menage } = ctx;
  const [demandes, setDemandes] = useState<Demande[] | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [type, setType] = useState<TypeDemande>('DES_QUE_POSSIBLE');
  const [date, setDate] = useState(joursA(1));
  const [apercu, setApercu] = useState<ApercuDemande | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [aAnnuler, setAAnnuler] = useState<string | null>(null);

  const gerer = useCallback(
    (e: unknown) => {
      if (estSessionExpiree(e)) ctx.expirer();
      else setErreur(texteErreur(e, t));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const charger = useCallback(async () => {
    try {
      setDemandes(await appeler<Demande[]>('/demandes'));
    } catch (e) {
      setDemandes([]);
      gerer(e);
    }
  }, [gerer]);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function ouvrir() {
    setOuvert(true);
    setErreur(null);
    setSucces(null);
    try {
      setApercu(await appeler<ApercuDemande>('/demandes/apercu'));
    } catch (e) {
      gerer(e);
    }
  }

  async function confirmer(event: React.FormEvent) {
    event.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const d = await appeler<Demande & { credit: number }>('/demandes', {
        corps: { type, dateSouhaitee: type === 'JOUR_PRECIS' ? new Date(`${date}T08:00:00`).toISOString() : undefined },
      });
      ctx.majMenage({ ...menage, credit: d.credit });
      setSucces(remplir(t.passages.succes, { reference: d.reference }));
      setOuvert(false);
      await charger();
    } catch (e) {
      if (e instanceof ErreurApi && e.statut === 402) setErreur(t.passages.insuffisant);
      else gerer(e);
    } finally {
      setOccupe(false);
    }
  }

  async function annuler(id: string) {
    setOccupe(true);
    setErreur(null);
    try {
      const d = await appeler<Demande & { credit: number }>(`/demandes/${id}/annuler`, { corps: {} });
      ctx.majMenage({ ...menage, credit: d.credit });
      setSucces(t.passages.annulee);
      setAAnnuler(null);
      await charger();
    } catch (e) {
      gerer(e);
    } finally {
      setOccupe(false);
    }
  }

  const options: Array<[TypeDemande, string, string]> = [
    ['DES_QUE_POSSIBLE', t.passages.desQuePossible, t.passages.desQuePossibleAide],
    ['JOUR_PRECIS', t.passages.jourPrecis, t.passages.jourPrecisAide],
    ['PROCHAIN_PASSAGE', t.passages.prochainPassage, t.passages.prochainPassageAide],
  ];

  return (
    <div className="app-page">
      <h1 className="app-page__titre">{t.passages.titre}</h1>

      {succes ? (
        <p className="app-succes" role="status">
          <IconeApp nom="verifie" />
          {succes}
        </p>
      ) : null}

      {!ouvert ? (
        <button className="bouton bouton--principal bouton--grand" onClick={ouvrir}>
          <IconeApp nom="plus" />
          {t.passages.nouvelle}
        </button>
      ) : (
        <form className="app-carte app-formulaire" onSubmit={confirmer}>
          <fieldset className="app-choix">
            <legend>{t.passages.quand}</legend>
            {options.map(([valeur, titre, aide]) => (
              <label key={valeur} className={`app-option${type === valeur ? ' app-option--active' : ''}`}>
                <input
                  type="radio"
                  name="type"
                  value={valeur}
                  checked={type === valeur}
                  onChange={() => setType(valeur)}
                />
                <span className="app-option__texte">
                  <strong>{titre}</strong>
                  <span>{aide}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {type === 'JOUR_PRECIS' ? (
            <div className="champ">
              <label htmlFor="dem-date">{t.passages.date}</label>
              <input
                id="dem-date"
                type="date"
                value={date}
                min={joursA(1)}
                max={joursA(30)}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          ) : null}

          {apercu ? (
            <dl className="app-recap">
              <div>
                <dt>{t.passages.cout}</dt>
                <dd>{formaterPrix(apercu.cout)}</dd>
              </div>
              <div>
                <dt>{t.passages.credit}</dt>
                <dd>{formaterPrix(menage.credit)}</dd>
              </div>
              {apercu.suffisant ? (
                <div className="app-recap__fin">
                  <dt>{t.passages.reste}</dt>
                  <dd>{formaterPrix(apercu.resteApres)}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {apercu && !apercu.suffisant ? (
            <p className="app-erreur" role="alert">
              {t.passages.insuffisant}
            </p>
          ) : erreur ? (
            <p className="app-erreur" role="alert">
              {erreur}
            </p>
          ) : null}

          {apercu && !apercu.suffisant ? (
            <button type="button" className="bouton bouton--soleil bouton--grand" onClick={() => ctx.aller('credit')}>
              {t.passages.recharger}
            </button>
          ) : (
            <button className="bouton bouton--principal bouton--grand" disabled={occupe || !apercu}>
              {occupe ? t.passages.envoi : t.passages.confirmer}
            </button>
          )}
          <button type="button" className="app-lien app-lien--centre" onClick={() => setOuvert(false)}>
            {t.profil.fermer}
          </button>
        </form>
      )}

      {!ouvert && erreur ? (
        <p className="app-erreur" role="alert">
          {erreur}
        </p>
      ) : null}

      <section className="app-carte">
        <h2 className="app-titre">{t.passages.historique}</h2>
        {demandes === null ? (
          <p className="discret">{t.chargement}</p>
        ) : demandes.length === 0 ? (
          <p className="discret">{t.passages.aucune}</p>
        ) : (
          <ul className="app-liste">
            {demandes.map((d) => {
              const ouverte = d.statut === 'RECUE' || d.statut === 'PLANIFIEE';
              return (
                <li key={d.id} className="app-demande">
                  <div className="app-ligne">
                    <span className="app-ligne__texte">
                      <strong>{d.reference}</strong>
                      <span>
                        {t.passages.types[d.type]}
                        {d.dateSouhaitee ? ` · ${dateCourte(d.dateSouhaitee, locale)}` : ''}
                      </span>
                      {d.datePlanifiee ? (
                        <span>{remplir(t.passages.pour, { date: dateCourte(d.datePlanifiee, locale) })}</span>
                      ) : null}
                    </span>
                    <span
                      className={`etat ${
                        d.statut === 'PLANIFIEE' || d.statut === 'TERMINEE'
                          ? 'etat--ok'
                          : d.statut === 'ANNULEE'
                            ? 'etat--ko'
                            : 'etat--attente'
                      }`}
                    >
                      {t.passages.statuts[d.statut]}
                    </span>
                  </div>
                  {ouverte ? (
                    aAnnuler === d.id ? (
                      <div className="app-confirmer">
                        <p>{remplir(t.passages.annulerQuestion, { montant: formaterPrix(d.cout) })}</p>
                        <div className="app-confirmer__boutons">
                          <button className="bouton bouton--secondaire" onClick={() => setAAnnuler(null)}>
                            {t.passages.annulerNon}
                          </button>
                          <button className="bouton bouton--danger" disabled={occupe} onClick={() => annuler(d.id)}>
                            {t.passages.annulerOui}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="app-lien" onClick={() => setAAnnuler(d.id)}>
                        {t.passages.annuler}
                      </button>
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
