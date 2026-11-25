'use client';

import { useCallback, useEffect, useState } from 'react';
import { appeler, ErreurApi, HORS_RESEAU } from '@/lib/espace-api';
import { formaterPrix } from '@/lib/format';
import {
  appelerPersonnel,
  terrain,
  texteErreurTerrain,
  type AbonneTrouve,
  type Caisse,
  type EncaissementFait,
} from '@/lib/terrain-api';
import { IconeApp } from '../espace/IconesApp';
import { Etat } from '../gestion/Petits';
import { MODES, OBJETS, STATUT_PAIEMENT } from '../gestion/libelles';
import { heureCourte, type ContexteTerrain } from './contexte';

const MONTANT_MIN = 500;
const MONTANT_MAX = 500_000;

type ModeSaisi = 'CASH' | 'VIREMENT';
type Objet = 'RECHARGE_CREDIT' | 'PASSAGE' | 'ABONNEMENT';

type Etape =
  | { nom: 'recherche' }
  | { nom: 'saisie'; abonne: AbonneTrouve }
  | { nom: 'confirmation'; abonne: AbonneTrouve; montant: number; mode: ModeSaisi; objet: Objet }
  | { nom: 'fait'; abonne: AbonneTrouve; paiement: EncaissementFait };

export function VueEncaisser({ ctx }: { ctx: ContexteTerrain }) {
  const [etape, setEtape] = useState<Etape>({ nom: 'recherche' });
  const [caisse, setCaisse] = useState<Caisse | null>(null);
  const [erreurCaisse, setErreurCaisse] = useState<string | null>(null);
  const { expirer } = ctx;

  const chargerCaisse = useCallback(async () => {
    try {
      setCaisse(await terrain<Caisse>('/encaissements'));
      setErreurCaisse(null);
    } catch (e) {
      if (e instanceof ErreurApi && e.statut === 401) expirer();
      else setErreurCaisse(texteErreurTerrain(e));
    }
  }, [expirer]);

  useEffect(() => {
    void chargerCaisse();
  }, [chargerCaisse]);

  if (etape.nom === 'saisie') {
    return (
      <Saisie
        abonne={etape.abonne}
        onRetour={() => setEtape({ nom: 'recherche' })}
        onContinuer={(montant, mode, objet) => setEtape({ nom: 'confirmation', abonne: etape.abonne, montant, mode, objet })}
      />
    );
  }

  if (etape.nom === 'confirmation') {
    return (
      <Confirmation
        ctx={ctx}
        {...etape}
        onModifier={() => setEtape({ nom: 'saisie', abonne: etape.abonne })}
        onFait={(paiement) => {
          setEtape({ nom: 'fait', abonne: etape.abonne, paiement });
          void chargerCaisse();
        }}
        onVerifier={() => {
          setEtape({ nom: 'recherche' });
          void chargerCaisse();
        }}
      />
    );
  }

  if (etape.nom === 'fait') {
    const { paiement, abonne } = etape;
    const cash = paiement.mode === 'CASH';
    return (
      <div className="app-page app-page--centre">
        <div className="app-resultat app-resultat--ok" role="status">
          <span className="app-resultat__icone">
            <IconeApp nom="verifie" taille={40} />
          </span>
          <h1>{cash ? 'Encaissé' : 'Virement noté'}</h1>
          <p className="app-resultat__solde">{formaterPrix(paiement.montant)}</p>
          <p>
            {abonne.nom} · {abonne.code}
          </p>
          <p className="discret">
            {cash
              ? 'Le crédit est ajouté et l’abonné reçoit son reçu par SMS.'
              : 'Le superviseur le confirmera après avoir vu le virement sur le relevé.'}
          </p>
          <p className="tr-reference">Référence {paiement.reference}</p>
        </div>
        <button className="bouton bouton--principal bouton--grand" onClick={() => setEtape({ nom: 'recherche' })}>
          Encaisser un autre abonné
        </button>
      </div>
    );
  }

  return (
    <Recherche
      ctx={ctx}
      caisse={caisse}
      erreurCaisse={erreurCaisse}
      onChoisir={(abonne) => setEtape({ nom: 'saisie', abonne })}
    />
  );
}

// --- étape 1 : retrouver l'abonné ------------------------------------------------

function Recherche({
  ctx,
  caisse,
  erreurCaisse,
  onChoisir,
}: {
  ctx: ContexteTerrain;
  caisse: Caisse | null;
  erreurCaisse: string | null;
  onChoisir: (abonne: AbonneTrouve) => void;
}) {
  const [q, setQ] = useState('');
  const [resultats, setResultats] = useState<AbonneTrouve[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const { expirer } = ctx;

  useEffect(() => {
    const terme = q.trim();
    if (terme.length < 2) {
      setResultats(null);
      setErreur(null);
      return;
    }
    let actif = true;
    // On attend la fin de la frappe avant d'interroger le serveur.
    const minuterie = window.setTimeout(() => {
      setOccupe(true);
      terrain<AbonneTrouve[]>(`/abonnes?${new URLSearchParams({ q: terme })}`)
        .then((r) => {
          if (!actif) return;
          setResultats(r);
          setErreur(null);
        })
        .catch((e) => {
          if (!actif) return;
          if (e instanceof ErreurApi && e.statut === 401) return expirer();
          setErreur(texteErreurTerrain(e));
        })
        .finally(() => actif && setOccupe(false));
    }, 350);
    return () => {
      actif = false;
      window.clearTimeout(minuterie);
    };
  }, [q, expirer]);

  return (
    <div className="app-page">
      <h1 className="app-page__titre">Encaisser</h1>

      <div className="champ tr-recherche">
        <label htmlFor="tr-q">Numéro, nom ou téléphone de l’abonné</label>
        <div className="tr-recherche__champ">
          <IconeApp nom="rechercher" taille={22} />
          <input
            id="tr-q"
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="MN-0012, Marie, 0812…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {erreur ? (
        <p className="app-erreur" role="alert">
          {erreur}
        </p>
      ) : null}

      {occupe && !resultats ? <p className="app-vide">Recherche…</p> : null}

      {resultats && resultats.length === 0 ? (
        <p className="app-vide">Aucun abonné trouvé. Vérifiez le numéro ou essayez le nom.</p>
      ) : null}

      {resultats && resultats.length > 0 ? (
        <ul className="tr-liste" aria-label="Abonnés trouvés">
          {resultats.map((a) => (
            <li key={a.code}>
              <button className="tr-abonne" onClick={() => onChoisir(a)}>
                <span className="tr-abonne__texte">
                  <strong>{a.nom}</strong>
                  <span>
                    {a.code} · Avenue {a.avenue}, n° {a.parcelle}
                  </span>
                  <span>{a.commune.nom}</span>
                </span>
                <span className="tr-abonne__credit">
                  {formaterPrix(a.credit)}
                  <small>crédit</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <section className="app-carte tr-caisse" aria-label="Ma caisse du jour">
        <div className="app-carte__tete">
          <h2 className="app-titre">Ma caisse du jour</h2>
        </div>
        {erreurCaisse ? <p className="app-erreur">{erreurCaisse}</p> : null}
        {caisse ? (
          <>
            <dl className="tr-caisse__chiffres">
              <div>
                <dt>Espèces à remettre</dt>
                <dd>{formaterPrix(caisse.especes)}</dd>
              </div>
              <div>
                <dt>Virements à rapprocher</dt>
                <dd>{formaterPrix(caisse.virements)}</dd>
              </div>
            </dl>
            {caisse.elements.length === 0 ? (
              <p className="app-vide">Rien d’encaissé aujourd’hui.</p>
            ) : (
              <ul className="app-liste">
                {caisse.elements.map((l) => (
                  <li key={l.id} className="tr-ligne">
                    <span className="tr-ligne__texte">
                      <strong>{l.menage.nom}</strong>
                      <span>
                        {l.menage.code} · {MODES[l.mode] ?? l.mode} · {heureCourte(l.creeLe)}
                      </span>
                    </span>
                    <span className="tr-ligne__montant">
                      {formaterPrix(l.montant)}
                      {l.statut !== 'RECU' ? <Etat statut={l.statut} libelle={STATUT_PAIEMENT[l.statut] ?? l.statut} /> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : !erreurCaisse ? (
          <p className="app-vide">Chargement…</p>
        ) : null}
      </section>
    </div>
  );
}

// --- étape 2 : montant, mode, objet ------------------------------------------------

function useTarifs() {
  const [passage, setPassage] = useState(0);
  useEffect(() => {
    appeler<Record<string, string>>('/reglages/publics', { jeton: null })
      .then((r) => setPassage(Number.parseInt(r.prix_par_passage ?? '', 10) || 0))
      .catch(() => undefined);
  }, []);
  // Sans les prix du serveur, on propose des montants ronds courants.
  return (passage > 0 ? [1, 2, 3, 5].map((n) => passage * n) : [1000, 2000, 5000, 10000]).filter(
    (m) => m >= MONTANT_MIN && m <= MONTANT_MAX,
  );
}

function Saisie({
  abonne,
  onRetour,
  onContinuer,
}: {
  abonne: AbonneTrouve;
  onRetour: () => void;
  onContinuer: (montant: number, mode: ModeSaisi, objet: Objet) => void;
}) {
  const presets = useTarifs();
  const [montant, setMontant] = useState<number | null>(null);
  const [autre, setAutre] = useState('');
  const [mode, setMode] = useState<ModeSaisi>('CASH');
  const [objet, setObjet] = useState<Objet>('RECHARGE_CREDIT');

  const choisi = autre ? Number.parseInt(autre, 10) : montant;
  const valide = choisi !== null && Number.isFinite(choisi) && choisi >= MONTANT_MIN && choisi <= MONTANT_MAX;

  return (
    <div className="app-page">
      <button className="app-retour" onClick={onRetour}>
        <IconeApp nom="retour" />
        Autre abonné
      </button>

      <section className="app-carte tr-abonne-fiche">
        <h1 className="app-titre">{abonne.nom}</h1>
        <p className="tr-abonne-fiche__ligne">
          {abonne.code} · Avenue {abonne.avenue}, n° {abonne.parcelle} · {abonne.commune.nom}
        </p>
        <p className="tr-abonne-fiche__credit">
          Crédit actuel <strong>{formaterPrix(abonne.credit)}</strong>
        </p>
        {abonne.statut === 'SUSPENDU' ? (
          <p className="app-info">Ce compte est suspendu. Vous pouvez encaisser, mais prévenez le superviseur.</p>
        ) : null}
      </section>

      <form
        className="app-carte app-formulaire"
        onSubmit={(e) => {
          e.preventDefault();
          if (valide && choisi !== null) onContinuer(choisi, mode, objet);
        }}
      >
        <fieldset className="app-choix">
          <legend>Montant reçu</legend>
          <div className="app-montants">
            {presets.map((m) => (
              <button
                type="button"
                key={m}
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
            <label htmlFor="tr-autre">Autre montant (FC)</label>
            <input
              id="tr-autre"
              inputMode="numeric"
              placeholder="0"
              value={autre}
              onChange={(e) => setAutre(e.target.value.replace(/\D/g, ''))}
            />
            <span className="champ__aide">
              Entre {formaterPrix(MONTANT_MIN)} et {formaterPrix(MONTANT_MAX)}.
            </span>
          </div>
        </fieldset>

        <fieldset className="app-choix">
          <legend>Comment l’abonné a payé</legend>
          <div className="app-segment" role="group">
            {(['CASH', 'VIREMENT'] as ModeSaisi[]).map((m) => (
              <button
                type="button"
                key={m}
                className={`app-segment__option${mode === m ? ' app-segment__option--actif' : ''}`}
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {MODES[m]}
              </button>
            ))}
          </div>
          <p className="champ__aide">
            {mode === 'CASH'
              ? 'Le crédit est ajouté tout de suite.'
              : 'Le crédit sera ajouté quand le superviseur aura vu le virement sur le relevé.'}
          </p>
        </fieldset>

        <fieldset className="app-choix">
          <legend>Pour quoi ?</legend>
          {(['RECHARGE_CREDIT', 'PASSAGE', 'ABONNEMENT'] as Objet[]).map((o) => (
            <label key={o} className={`app-option${objet === o ? ' app-option--active' : ''}`}>
              <input type="radio" name="objet" value={o} checked={objet === o} onChange={() => setObjet(o)} />
              <span className="app-option__texte">
                <strong>{OBJETS[o]}</strong>
              </span>
            </label>
          ))}
        </fieldset>

        <button className="bouton bouton--principal bouton--grand" disabled={!valide}>
          {valide && choisi !== null ? `Continuer · ${formaterPrix(choisi)}` : 'Continuer'}
        </button>
      </form>
    </div>
  );
}

// --- étape 3 : vérifier avant d'enregistrer -----------------------------------

function Confirmation({
  ctx,
  abonne,
  montant,
  mode,
  objet,
  onModifier,
  onFait,
  onVerifier,
}: {
  ctx: ContexteTerrain;
  abonne: AbonneTrouve;
  montant: number;
  mode: ModeSaisi;
  objet: Objet;
  onModifier: () => void;
  onFait: (paiement: EncaissementFait) => void;
  onVerifier: () => void;
}) {
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [incertain, setIncertain] = useState(false);

  async function enregistrer() {
    if (occupe) return;
    setOccupe(true);
    setErreur(null);
    try {
      const paiement = await appelerPersonnel<EncaissementFait>('/encaissements', {
        corps: { menageCode: abonne.code, montant, mode, objet },
      });
      onFait(paiement);
    } catch (e) {
      if (e instanceof ErreurApi && e.statut === 401) return ctx.expirer();
      // Une coupure peut survenir après que le serveur a enregistré : on ne laisse
      // pas recommencer à l'aveugle, sous peine d'encaisser deux fois.
      if (e instanceof ErreurApi && e.statut === HORS_RESEAU) setIncertain(true);
      setErreur(texteErreurTerrain(e));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="app-page">
      <button className="app-retour" onClick={onModifier} disabled={occupe}>
        <IconeApp nom="retour" />
        Modifier
      </button>
      <h1 className="app-page__titre">Vérifiez avant d’enregistrer</h1>

      <section className="app-carte">
        <dl className="app-recap">
          <div>
            <dt>Abonné</dt>
            <dd>
              {abonne.nom}
              <br />
              {abonne.code}
            </dd>
          </div>
          <div>
            <dt>Paiement</dt>
            <dd>{MODES[mode]}</dd>
          </div>
          <div>
            <dt>Pour</dt>
            <dd>{OBJETS[objet]}</dd>
          </div>
          <div className="app-recap__fin">
            <dt>Montant</dt>
            <dd>{formaterPrix(montant)}</dd>
          </div>
        </dl>
      </section>

      {erreur ? (
        <p className="app-erreur" role="alert">
          {erreur}
          {incertain ? ' L’encaissement a peut-être été enregistré : regardez « Ma caisse du jour » avant de recommencer.' : ''}
        </p>
      ) : null}

      {incertain ? (
        <button className="bouton bouton--principal bouton--grand" onClick={onVerifier}>
          Voir ma caisse du jour
        </button>
      ) : (
        <button className="bouton bouton--principal bouton--grand" onClick={() => void enregistrer()} disabled={occupe}>
          {occupe ? 'Enregistrement…' : `Enregistrer ${formaterPrix(montant)}`}
        </button>
      )}
    </div>
  );
}
