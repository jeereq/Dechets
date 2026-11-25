'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ErreurApi, HORS_RESEAU } from '@/lib/espace-api';
import {
  avecAttente,
  garderTournee,
  marquerPassage,
  terrain,
  texteErreurTerrain,
  tourneeGardee,
  type PassageTerrain,
  type Resultat,
  type Tournee,
} from '@/lib/terrain-api';
import { IconeApp } from '../espace/IconesApp';
import { Etat } from '../gestion/Petits';
import { RESULTAT_PASSAGE } from '../gestion/libelles';
import { decaler, jourLong, type ContexteTerrain } from './contexte';

type Filtre = 'afaire' | 'faits' | 'tous';

const STATUT: Record<PassageTerrain['statut'], string> = {
  A_FAIRE: 'À faire',
  FAIT: 'Fait',
  VALIDE: 'Validé',
  REFUSE: 'À refaire',
};

const CHOIX: Array<{ resultat: Resultat; aide: string }> = [
  { resultat: 'COLLECTE', aide: 'Les sacs ont été pris' },
  { resultat: 'PERSONNE_SUR_PLACE', aide: '' },
  { resultat: 'ACCES_IMPOSSIBLE', aide: 'Portail fermé, route bloquée…' },
  { resultat: 'DECHETS_REFUSES', aide: 'Déchets non acceptés' },
  { resultat: 'RIEN_A_PRENDRE', aide: 'Aucun sac devant la parcelle' },
];

export function VueTournee({ ctx }: { ctx: ContexteTerrain }) {
  const { agent, versionDonnees } = ctx;
  const estChef = agent.poste === 'SUPERVISEUR';
  const [date, setDate] = useState(agent.aujourdhui);
  const [equipeId, setEquipeId] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('afaire');
  const [tournee, setTournee] = useState<Tournee | null>(null);
  const [ancienne, setAncienne] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [version, setVersion] = useState(0);

  const cle = `${date}|${equipeId}`;
  const { expirer } = ctx;

  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreur(null);
    const query = new URLSearchParams({ date, ...(equipeId ? { equipeId } : {}) }).toString();
    terrain<Tournee>(`/tournee?${query}`)
      .then((t) => {
        if (!actif) return;
        garderTournee(cle, t);
        setTournee(avecAttente(t));
        setAncienne(false);
      })
      .catch((e) => {
        if (!actif) return;
        if (e instanceof ErreurApi && e.statut === 401) return expirer();
        if (e instanceof ErreurApi && e.statut === HORS_RESEAU) {
          const gardee = tourneeGardee(cle);
          if (gardee) {
            setTournee(avecAttente(gardee));
            setAncienne(true);
            return;
          }
        }
        setErreur(texteErreurTerrain(e));
      })
      .finally(() => actif && setChargement(false));
    return () => {
      actif = false;
    };
  }, [cle, date, equipeId, expirer, version, versionDonnees]);

  const recharger = useCallback(() => setVersion((v) => v + 1), []);

  const visibles = useMemo(() => {
    const liste = tournee?.passages ?? [];
    if (filtre === 'tous') return liste;
    if (filtre === 'faits') return liste.filter((p) => p.statut === 'FAIT' || p.statut === 'VALIDE');
    return liste.filter((p) => p.statut === 'A_FAIRE' || p.statut === 'REFUSE');
  }, [tournee, filtre]);

  const bilan = tournee?.bilan;
  const pct = bilan && bilan.total > 0 ? Math.round((bilan.faits / bilan.total) * 100) : 0;
  const estAujourdhui = date === agent.aujourdhui;
  const sansEquipe = !estChef && !agent.equipe;

  async function enregistrer(p: PassageTerrain, resultat: Resultat, nbSacs?: number): Promise<boolean> {
    try {
      const gardeSurLeTelephone = await marquerPassage({ passageId: p.id, resultat, nbSacs });
      ctx.actualiserAttente();
      ctx.annoncer(
        gardeSurLeTelephone
          ? 'Passage gardé sur ce téléphone. Il sera envoyé dès que le réseau revient.'
          : 'Passage enregistré.',
        true,
      );
      setOuvert(null);
      recharger();
      return true;
    } catch (e) {
      if (e instanceof ErreurApi && e.statut === 401) ctx.expirer();
      else ctx.annoncer(texteErreurTerrain(e), false);
      // Le passage a pu être validé entre-temps : on remet la liste à jour.
      if (e instanceof ErreurApi && e.statut === 409) recharger();
      return false;
    }
  }

  return (
    <div className="app-page">
      <section className="tr-jour" aria-label="Jour">
        <button
          className="tr-jour__fleche"
          onClick={() => setDate(decaler(date, -1))}
          aria-label="Jour précédent"
        >
          <IconeApp nom="retour" />
        </button>
        <div className="tr-jour__texte">
          <strong>{estAujourdhui ? 'Aujourd’hui' : jourLong(date)}</strong>
          <span>{estAujourdhui ? jourLong(date) : date < agent.aujourdhui ? 'Jour passé' : ''}</span>
        </div>
        <button
          className="tr-jour__fleche tr-jour__fleche--droite"
          onClick={() => setDate(decaler(date, 1))}
          disabled={date >= agent.aujourdhui}
          aria-label="Jour suivant"
        >
          <IconeApp nom="retour" />
        </button>
      </section>

      {estChef && tournee ? (
        <div className="champ">
          <label htmlFor="tr-equipe">Équipe</label>
          <select id="tr-equipe" value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
            <option value="">Toutes les équipes</option>
            {tournee.equipes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {ancienne ? (
        <p className="app-info" role="status">
          Tournée enregistrée sur ce téléphone, sans réseau. Elle se mettra à jour dès que la connexion revient.
        </p>
      ) : null}

      {sansEquipe ? (
        <p className="app-info">
          Vous n’êtes rattaché à aucune équipe pour l’instant. Demandez au superviseur de vous ajouter à une équipe.
        </p>
      ) : null}

      {erreur ? (
        <p className="app-erreur" role="alert">
          {erreur}{' '}
          <button className="app-lien" onClick={recharger}>
            Réessayer
          </button>
        </p>
      ) : null}

      {bilan && bilan.total > 0 ? (
        <section className="tr-bilan" aria-label="Avancement">
          <div className="tr-bilan__haut">
            <strong>
              {bilan.faits} sur {bilan.total}
            </strong>
            <span>
              {bilan.sacs} sac{bilan.sacs > 1 ? 's' : ''} collecté{bilan.sacs > 1 ? 's' : ''}
            </span>
          </div>
          <div
            className="tr-bilan__barre"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={bilan.total}
            aria-valuenow={bilan.faits}
            aria-label="Passages faits"
          >
            <span style={{ width: `${pct}%` }} />
          </div>
        </section>
      ) : null}

      {tournee && tournee.passages.length > 0 ? (
        <div className="app-segment tr-filtres" role="group" aria-label="Filtrer">
          {(
            [
              ['afaire', `À faire (${bilan?.aFaire ?? 0})`],
              ['faits', `Faits (${bilan?.faits ?? 0})`],
              ['tous', 'Tous'],
            ] as Array<[Filtre, string]>
          ).map(([valeur, libelle]) => (
            <button
              key={valeur}
              className={`app-segment__option${filtre === valeur ? ' app-segment__option--actif' : ''}`}
              aria-pressed={filtre === valeur}
              onClick={() => setFiltre(valeur)}
            >
              {libelle}
            </button>
          ))}
        </div>
      ) : null}

      {chargement && !tournee ? <p className="app-vide">Chargement…</p> : null}

      {tournee && tournee.passages.length === 0 && !sansEquipe ? (
        <p className="app-vide">
          {estAujourdhui
            ? 'Aucun passage prévu aujourd’hui. Le superviseur prépare la tournée depuis le back-office.'
            : 'Aucun passage ce jour-là.'}
        </p>
      ) : null}

      {tournee && tournee.passages.length > 0 && visibles.length === 0 ? (
        <p className="app-vide">
          {filtre === 'afaire' ? 'Tous les passages sont faits. Bravo !' : 'Rien à afficher ici.'}
        </p>
      ) : null}

      <ul className="tr-liste">
        {visibles.map((p) => (
          <li key={p.id}>
            <CartePassage
              passage={p}
              ouvert={ouvert === p.id}
              afficherEquipe={estChef && !equipeId}
              onOuvrir={() => setOuvert(ouvert === p.id ? null : p.id)}
              onEnregistrer={(resultat, nbSacs) => enregistrer(p, resultat, nbSacs)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CartePassage({
  passage: p,
  ouvert,
  afficherEquipe,
  onOuvrir,
  onEnregistrer,
}: {
  passage: PassageTerrain;
  ouvert: boolean;
  afficherEquipe: boolean;
  onOuvrir: () => void;
  onEnregistrer: (resultat: Resultat, nbSacs?: number) => Promise<boolean>;
}) {
  const m = p.menage;
  const verrouille = p.statut === 'VALIDE';

  return (
    <article className={`tr-passage tr-passage--${p.statut.toLowerCase()}`}>
      <header className="tr-passage__tete">
        <div>
          <h2>{m.nom}</h2>
          <p className="tr-passage__code">
            {m.code}
            {afficherEquipe ? ` · ${p.equipe.nom}` : ''}
            {p.demande ? ` · demande ${p.demande}` : ''}
          </p>
        </div>
        <Etat statut={p.statut === 'REFUSE' ? 'ECHEC' : p.statut} libelle={STATUT[p.statut]} />
      </header>

      <p className="tr-passage__adresse">
        Avenue {m.avenue}, n° {m.parcelle} · {m.commune.nom}
      </p>
      {m.repere ? <p className="tr-passage__repere">Repère : {m.repere}</p> : null}

      {p.statut === 'REFUSE' ? (
        <p className="tr-passage__alerte">Le superviseur a refusé ce passage. Merci de le refaire.</p>
      ) : null}

      {p.resultat ? (
        <p className="tr-passage__resultat">
          {RESULTAT_PASSAGE[p.resultat]}
          {p.resultat === 'COLLECTE' && p.nbSacs ? ` · ${p.nbSacs} sac${p.nbSacs > 1 ? 's' : ''}` : ''}
          {p.enAttente ? <span className="tr-passage__attente"> · à envoyer</span> : null}
        </p>
      ) : null}

      <div className="tr-passage__actions">
        <a className="tr-bouton-appel" href={`tel:${m.telephone}`} aria-label={`Appeler ${m.nom}`}>
          <IconeApp nom="telephone" taille={20} />
          Appeler
        </a>
        {!verrouille ? (
          <button className="bouton bouton--principal tr-passage__saisir" onClick={onOuvrir} aria-expanded={ouvert}>
            {p.statut === 'A_FAIRE' || p.statut === 'REFUSE' ? 'Enregistrer' : 'Modifier'}
          </button>
        ) : (
          <span className="tr-passage__verrou">Validé par le superviseur</span>
        )}
      </div>

      {ouvert && !verrouille ? <FormulaireResultat passage={p} onEnregistrer={onEnregistrer} onAnnuler={onOuvrir} /> : null}
    </article>
  );
}

function FormulaireResultat({
  passage,
  onEnregistrer,
  onAnnuler,
}: {
  passage: PassageTerrain;
  onEnregistrer: (resultat: Resultat, nbSacs?: number) => Promise<boolean>;
  onAnnuler: () => void;
}) {
  const [resultat, setResultat] = useState<Resultat | null>(passage.resultat);
  const [sacs, setSacs] = useState(passage.nbSacs ?? 1);
  const [occupe, setOccupe] = useState(false);

  async function valider(event: React.FormEvent) {
    event.preventDefault();
    if (!resultat || occupe) return;
    setOccupe(true);
    const ok = await onEnregistrer(resultat, resultat === 'COLLECTE' ? sacs : undefined);
    // En cas de succès, la carte se referme : rien à remettre à jour ici.
    if (!ok) setOccupe(false);
  }

  return (
    <form className="tr-formulaire" onSubmit={valider}>
      <fieldset className="app-choix">
        <legend>Que s’est-il passé ?</legend>
        {CHOIX.map((c) => (
          <Fragment key={c.resultat}>
            <label className={`app-option${resultat === c.resultat ? ' app-option--active' : ''}`}>
              <input
                type="radio"
                name={`resultat-${passage.id}`}
                value={c.resultat}
                checked={resultat === c.resultat}
                onChange={() => setResultat(c.resultat)}
              />
              <span className="app-option__texte">
                <strong>{RESULTAT_PASSAGE[c.resultat]}</strong>
                {c.aide ? <span>{c.aide}</span> : null}
              </span>
            </label>
            {c.resultat === 'COLLECTE' && resultat === 'COLLECTE' ? (
        <div className="tr-sacs" role="group" aria-label="Nombre de sacs">
          <span className="tr-sacs__libelle">Nombre de sacs</span>
          <button type="button" className="tr-sacs__bouton" onClick={() => setSacs(Math.max(1, sacs - 1))} aria-label="Un sac de moins" disabled={sacs <= 1}>
            <IconeApp nom="moins" taille={26} />
          </button>
          <input
            className="tr-sacs__valeur"
            inputMode="numeric"
            aria-label="Nombre de sacs"
            value={sacs}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value.replace(/\D/g, ''), 10);
              setSacs(Number.isFinite(n) ? Math.min(Math.max(n, 1), 200) : 1);
            }}
          />
          <button type="button" className="tr-sacs__bouton" onClick={() => setSacs(Math.min(200, sacs + 1))} aria-label="Un sac de plus">
            <IconeApp nom="plus" taille={26} />
          </button>
        </div>
            ) : null}
          </Fragment>
        ))}
      </fieldset>

      <div className="tr-formulaire__boutons">
        <button type="button" className="bouton bouton--secondaire" onClick={onAnnuler} disabled={occupe}>
          Annuler
        </button>
        <button className="bouton bouton--principal" disabled={!resultat || occupe}>
          {occupe ? 'Envoi…' : 'Valider le passage'}
        </button>
      </div>
    </form>
  );
}
