'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  appeler,
  MONTANT_MAX,
  MONTANT_MIN,
  type Paiement,
  type Recu,
} from '@/lib/espace-api';
import { formaterPrix } from '@/lib/format';
import { estSessionExpiree, texteErreur, type Contexte } from './contexte';
import { IconeApp } from './IconesApp';
import { dateHeure, dateLongue, remplir } from './utilitaires';

type ModeEnLigne = 'AIRTEL_MONEY' | 'ORANGE_MONEY' | 'M_PESA' | 'AFRIMONEY' | 'CARTE';
const MODES: ModeEnLigne[] = ['AIRTEL_MONEY', 'ORANGE_MONEY', 'M_PESA', 'AFRIMONEY', 'CARTE'];

type Etape =
  | { nom: 'liste' }
  | { nom: 'recharge' }
  | { nom: 'attente'; reference: string; montant: number }
  | { nom: 'resultat'; reussi: boolean };

interface ReponsePaiement extends Paiement {
  etape: 'CONFIRMER_SUR_TELEPHONE' | 'REDIRIGER';
  url?: string;
  message?: string;
}

const DELAI_SONDAGE = 3000;
const SONDAGES_MAX = 60;

export function VueCredit({ ctx }: { ctx: Contexte }) {
  const { t, locale, menage, prix } = ctx;
  const [etape, setEtape] = useState<Etape>({ nom: 'liste' });
  const [paiements, setPaiements] = useState<Paiement[] | null>(null);
  const [montant, setMontant] = useState<number>(prix.passage * 2);
  const [autre, setAutre] = useState('');
  const [mode, setMode] = useState<ModeEnLigne>('AIRTEL_MONEY');
  const [numero, setNumero] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recu, setRecu] = useState<Recu | 'indisponible' | null>(null);
  const sondage = useRef<number | null>(null);

  const arreterSondage = () => {
    if (sondage.current) window.clearTimeout(sondage.current);
    sondage.current = null;
  };
  useEffect(() => arreterSondage, []);

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
      setPaiements(await appeler<Paiement[]>('/paiements'));
    } catch (e) {
      setPaiements([]);
      gerer(e);
    }
  }, [gerer]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const montantChoisi = autre ? Number.parseInt(autre, 10) : montant;
  const montantValide =
    Number.isFinite(montantChoisi) && montantChoisi >= MONTANT_MIN && montantChoisi <= MONTANT_MAX;

  function suivre(reference: string, essai = 0) {
    arreterSondage();
    sondage.current = window.setTimeout(async () => {
      try {
        const p = await appeler<Paiement & { credit: number }>(`/paiements/${reference}`);
        if (p.statut === 'RECU') {
          ctx.majMenage({ ...menage, credit: p.credit });
          setEtape({ nom: 'resultat', reussi: true });
          void charger();
          return;
        }
        if (p.statut === 'ECHEC') {
          setEtape({ nom: 'resultat', reussi: false });
          void charger();
          return;
        }
      } catch (e) {
        if (estSessionExpiree(e)) return ctx.expirer();
        // une coupure passagère ne doit pas arrêter le suivi
      }
      if (essai + 1 >= SONDAGES_MAX) {
        setEtape({ nom: 'liste' });
        void charger();
        return;
      }
      suivre(reference, essai + 1);
    }, DELAI_SONDAGE);
  }

  async function payer(event: React.FormEvent) {
    event.preventDefault();
    if (!montantValide) return;
    setOccupe(true);
    setErreur(null);
    try {
      const reponse = await appeler<ReponsePaiement>('/paiements', {
        corps:
          mode === 'CARTE'
            ? { mode, montant: montantChoisi }
            : { mode, montant: montantChoisi, telephone: numero.trim() || undefined },
      });
      if (reponse.etape === 'REDIRIGER' && reponse.url) {
        window.location.href = reponse.url;
        return;
      }
      setEtape({ nom: 'attente', reference: reponse.reference, montant: reponse.montant });
      suivre(reponse.reference);
    } catch (e) {
      gerer(e);
    } finally {
      setOccupe(false);
    }
  }

  async function voirRecu(reference: string) {
    setRecu('indisponible');
    try {
      setRecu(await appeler<Recu>(`/paiements/${reference}/recu`));
    } catch (e) {
      if (estSessionExpiree(e)) ctx.expirer();
    }
  }

  function terminer() {
    arreterSondage();
    setEtape({ nom: 'liste' });
    setAutre('');
    setErreur(null);
  }

  if (etape.nom === 'attente') {
    return (
      <div className="app-page app-page--centre">
        <div className="app-attente" role="status" aria-live="polite">
          <span className="app-attente__rond" aria-hidden="true" />
          <h1>{t.credit.attente}</h1>
          <p>{remplir(t.credit.attenteTexte, { montant: formaterPrix(etape.montant) })}</p>
          <p className="discret">{t.credit.verifie}</p>
        </div>
        <button className="app-lien app-lien--centre" onClick={terminer}>
          {t.profil.fermer}
        </button>
      </div>
    );
  }

  if (etape.nom === 'resultat') {
    return (
      <div className="app-page app-page--centre">
        <div className={`app-resultat ${etape.reussi ? 'app-resultat--ok' : 'app-resultat--ko'}`} role="status">
          <span className="app-resultat__icone">
            <IconeApp nom={etape.reussi ? 'verifie' : 'croix'} taille={40} />
          </span>
          <h1>{etape.reussi ? t.credit.reussi : t.credit.echec}</h1>
          <p>{etape.reussi ? t.credit.reussiTexte : t.credit.echecTexte}</p>
          {etape.reussi ? <p className="app-resultat__solde">{formaterPrix(menage.credit)}</p> : null}
        </div>
        {etape.reussi ? (
          <button className="bouton bouton--principal bouton--grand" onClick={terminer}>
            {t.credit.termine}
          </button>
        ) : (
          <button className="bouton bouton--principal bouton--grand" onClick={() => setEtape({ nom: 'recharge' })}>
            {t.credit.reessayer}
          </button>
        )}
      </div>
    );
  }

  if (etape.nom === 'recharge') {
    const presets = [1, 2, 3, 5].map((n) => prix.passage * n);
    return (
      <div className="app-page">
        <button className="app-retour" onClick={terminer}>
          <IconeApp nom="retour" />
          {t.credit.titre}
        </button>
        <h1 className="app-page__titre">{t.credit.recharger}</h1>

        <form className="app-carte app-formulaire" onSubmit={payer}>
          <fieldset className="app-choix">
            <legend>{t.credit.montant}</legend>
            <div className="app-montants">
              {presets.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`app-montant${!autre && montant === m ? ' app-montant--actif' : ''}`}
                  onClick={() => {
                    setMontant(m);
                    setAutre('');
                  }}
                >
                  {formaterPrix(m)}
                </button>
              ))}
            </div>
            <div className="champ">
              <label htmlFor="cr-autre">{t.credit.autre}</label>
              <input
                id="cr-autre"
                inputMode="numeric"
                value={autre}
                onChange={(e) => setAutre(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
              />
              <span className="champ__aide">
                {remplir(t.credit.autreAide, { min: formaterPrix(MONTANT_MIN), max: formaterPrix(MONTANT_MAX) })}
              </span>
            </div>
          </fieldset>

          <fieldset className="app-choix">
            <legend>{t.credit.mode}</legend>
            {MODES.map((m) => (
              <label key={m} className={`app-option${mode === m ? ' app-option--active' : ''}`}>
                <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                <span className="app-option__texte">
                  <strong>{t.credit.modes[m]}</strong>
                </span>
              </label>
            ))}
          </fieldset>

          {mode === 'CARTE' ? (
            <p className="app-info">{t.credit.carte}</p>
          ) : (
            <div className="champ">
              <label htmlFor="cr-numero">{t.credit.numero}</label>
              <input
                id="cr-numero"
                type="tel"
                inputMode="tel"
                placeholder={menage.telephone}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
              <span className="champ__aide">{t.credit.numeroAide}</span>
            </div>
          )}

          {erreur ? (
            <p className="app-erreur" role="alert">
              {erreur}
            </p>
          ) : null}

          <button className="bouton bouton--principal bouton--grand" disabled={occupe || !montantValide}>
            {occupe
              ? t.credit.envoi
              : remplir(t.credit.payer, { montant: montantValide ? formaterPrix(montantChoisi) : '…' })}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-page">
      <h1 className="app-page__titre">{t.credit.titre}</h1>

      <section className="app-solde">
        <p className="app-solde__libelle">{t.credit.solde}</p>
        <p className="app-solde__montant">{formaterPrix(menage.credit)}</p>
        <button className="bouton bouton--soleil" onClick={() => setEtape({ nom: 'recharge' })}>
          <IconeApp nom="plus" taille={20} />
          {t.credit.recharger}
        </button>
      </section>

      {erreur ? (
        <p className="app-erreur" role="alert">
          {erreur}
        </p>
      ) : null}

      <section className="app-carte">
        <h2 className="app-titre">{t.credit.historique}</h2>
        {paiements === null ? (
          <p className="discret">{t.chargement}</p>
        ) : paiements.length === 0 ? (
          <p className="discret">{t.credit.aucun}</p>
        ) : (
          <ul className="app-liste">
            {paiements.map((p) => (
              <li key={p.id} className="app-demande">
                <div className="app-ligne">
                  <span className="app-ligne__texte">
                    <strong>{formaterPrix(p.montant)}</strong>
                    <span>
                      {t.credit.modes[p.mode as keyof typeof t.credit.modes] ?? p.mode} ·{' '}
                      {t.credit.objets[p.objet as keyof typeof t.credit.objets] ?? p.objet}
                    </span>
                    <span>{dateHeure(p.creeLe, locale)}</span>
                  </span>
                  <span
                    className={`etat ${
                      p.statut === 'RECU' ? 'etat--ok' : p.statut === 'ECHEC' ? 'etat--ko' : 'etat--attente'
                    }`}
                  >
                    {t.credit.statuts[p.statut]}
                  </span>
                </div>
                {p.statut === 'RECU' ? (
                  <button className="app-lien" onClick={() => voirRecu(p.reference)}>
                    <IconeApp nom="recu" taille={18} /> {t.credit.voirRecu}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {recu ? (
        <div className="app-feuille" role="dialog" aria-modal="true" aria-label={t.credit.recu.titre}>
          <div className="app-recu">
            <h2>{t.credit.recu.titre}</h2>
            {recu === 'indisponible' ? (
              <p className="discret">{t.credit.recu.indisponible}</p>
            ) : (
              <>
                <p className="app-recu__emetteur">{recu.emetteur}</p>
                <dl className="app-recap">
                  <div>
                    <dt>{t.credit.recu.numero}</dt>
                    <dd>{recu.numero}</dd>
                  </div>
                  <div>
                    <dt>{t.credit.recu.date}</dt>
                    <dd>{dateLongue(recu.date, locale)}</dd>
                  </div>
                  <div>
                    <dt>{t.credit.recu.abonne}</dt>
                    <dd>
                      {recu.abonne.nom} ({recu.abonne.code})
                    </dd>
                  </div>
                  <div>
                    <dt>{t.credit.recu.objet}</dt>
                    <dd>{t.credit.objets[recu.objet as keyof typeof t.credit.objets] ?? recu.objet}</dd>
                  </div>
                  <div>
                    <dt>{t.credit.recu.mode}</dt>
                    <dd>{t.credit.modes[recu.mode as keyof typeof t.credit.modes] ?? recu.mode}</dd>
                  </div>
                  <div className="app-recap__fin">
                    <dt>{t.credit.recu.montant}</dt>
                    <dd>{formaterPrix(recu.montant, recu.devise)}</dd>
                  </div>
                </dl>
              </>
            )}
            <div className="app-recu__actions">
              {recu !== 'indisponible' ? (
                <button className="bouton bouton--principal" onClick={() => window.print()}>
                  {t.credit.recu.imprimer}
                </button>
              ) : null}
              <button className="bouton bouton--secondaire" onClick={() => setRecu(null)}>
                {t.credit.recu.fermer}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
