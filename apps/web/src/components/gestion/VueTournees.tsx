'use client';

import { useState } from 'react';
import {
  g,
  type CommuneGestion,
  type EquipeGestion,
  type PassageGestion,
} from '@/lib/gestion-api';
import { useAction, useCharge, type ContexteGestion } from './contexte';
import { JOURS, RESULTAT_PASSAGE, STATUT_PASSAGE } from './libelles';
import { Chargement, EnTete, Etat, Vide } from './Petits';

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function VueTournees({ ctx }: { ctx: ContexteGestion }) {
  const [onglet, setOnglet] = useState<'passages' | 'equipes'>('passages');
  return (
    <>
      <EnTete titre="Tournées" aide="Préparez la journée, suivez les passages et validez ce que les équipes ont fait." />
      <div className="gs-onglets" role="tablist">
        {(
          [
            ['passages', 'Passages du jour'],
            ['equipes', 'Équipes'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} role="tab" aria-selected={onglet === v} className={`gs-onglet${onglet === v ? ' gs-onglet--actif' : ''}`} onClick={() => setOnglet(v)}>
            {l}
          </button>
        ))}
      </div>
      {onglet === 'passages' ? <Passages ctx={ctx} /> : <Equipes ctx={ctx} />}
    </>
  );
}

function Passages({ ctx }: { ctx: ContexteGestion }) {
  const [date, setDate] = useState(aujourdhui());
  const [equipeId, setEquipeId] = useState('');
  const { donnees: equipes } = useCharge<EquipeGestion[]>('/equipes', ctx);
  const { donnees, erreur, recharger } = useCharge<PassageGestion[]>(`/passages?date=${date}${equipeId ? `&equipeId=${equipeId}` : ''}`, ctx);
  const { occupe, agir } = useAction(ctx);
  const [marquer, setMarquer] = useState<string | null>(null);
  const [resultat, setResultat] = useState('COLLECTE');
  const [sacs, setSacs] = useState('');

  const comptes = (donnees ?? []).reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.statut]: (acc[p.statut] ?? 0) + 1 }), {});

  return (
    <>
      <div className="gs-filtres">
        <label className="gs-etiquette">
          Jour
          <input className="gs-champ" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="gs-etiquette">
          Équipe
          <select className="gs-champ" value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
            <option value="">Toutes</option>
            {(equipes ?? []).map((e) => (
              <option key={e.id} value={e.id}>{e.nom}</option>
            ))}
          </select>
        </label>
        <button
          className="gs-bouton gs-bouton--plein gs-filtres__fin"
          disabled={occupe}
          onClick={() =>
            void agir(
              () => g<{ crees: number }>('/passages/generer', { corps: { date } }),
              'Tournée préparée.',
              recharger,
            )
          }
        >
          Préparer la tournée de ce jour
        </button>
      </div>

      {donnees ? (
        <p className="gs-resume">
          {donnees.length} passage{donnees.length > 1 ? 's' : ''} · {comptes.A_FAIRE ?? 0} à faire · {comptes.FAIT ?? 0} à valider · {comptes.VALIDE ?? 0} validés
          {comptes.REFUSE ? ` · ${comptes.REFUSE} refusés` : ''}
        </p>
      ) : null}

      {!donnees ? (
        <Chargement erreur={erreur} onReessayer={recharger} />
      ) : donnees.length === 0 ? (
        <Vide>Aucun passage ce jour-là. Appuyez sur « Préparer la tournée » pour créer la liste des équipes qui travaillent ce jour.</Vide>
      ) : (
        <div className="gs-tableau-boite">
          <table className="gs-tableau">
            <thead>
              <tr>
                <th>Abonné</th>
                <th>Adresse</th>
                <th>Équipe</th>
                <th>État</th>
                <th>Résultat</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {donnees.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.menage.nom}</strong>
                    <span className="gs-discret">{p.menage.code}</span>
                  </td>
                  <td>
                    {p.menage.avenue}, {p.menage.parcelle}
                    {p.menage.repere ? <span className="gs-discret">{p.menage.repere}</span> : null}
                  </td>
                  <td>{p.equipe.nom}</td>
                  <td><Etat statut={p.statut} libelle={STATUT_PASSAGE[p.statut]} /></td>
                  <td>
                    {p.resultat ? RESULTAT_PASSAGE[p.resultat] : '—'}
                    {p.nbSacs != null ? <span className="gs-discret">{p.nbSacs} sac{p.nbSacs > 1 ? 's' : ''}</span> : null}
                  </td>
                  <td className="gs-droite">
                    {p.statut === 'A_FAIRE' ? (
                      marquer === p.id ? (
                        <form
                          className="gs-formulaire gs-formulaire--ligne"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void agir(
                              () => g(`/passages/${p.id}/marquer`, { corps: { resultat, nbSacs: sacs ? Number(sacs) : undefined } }),
                              'Passage enregistré.',
                              () => {
                                setMarquer(null);
                                setSacs('');
                                recharger();
                              },
                            );
                          }}
                        >
                          <select className="gs-champ" value={resultat} onChange={(e) => setResultat(e.target.value)}>
                            {Object.entries(RESULTAT_PASSAGE).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <input className="gs-champ gs-champ--court" inputMode="numeric" placeholder="Sacs" value={sacs} onChange={(e) => setSacs(e.target.value.replace(/\D/g, ''))} />
                          <button className="gs-bouton gs-bouton--plein" disabled={occupe}>OK</button>
                        </form>
                      ) : (
                        <button className="gs-bouton" onClick={() => setMarquer(p.id)}>Marquer fait</button>
                      )
                    ) : p.statut === 'FAIT' ? (
                      <span className="gs-actions-ligne">
                        <button className="gs-bouton gs-bouton--plein" disabled={occupe} onClick={() => void agir(() => g(`/passages/${p.id}/valider`, { corps: {} }), 'Passage validé.', recharger)}>
                          Valider
                        </button>
                        <button className="gs-bouton gs-bouton--danger" disabled={occupe} onClick={() => void agir(() => g(`/passages/${p.id}/refuser`, { corps: {} }), 'Passage refusé.', recharger)}>
                          Refuser
                        </button>
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Equipes({ ctx }: { ctx: ContexteGestion }) {
  const { donnees, erreur, recharger } = useCharge<EquipeGestion[]>('/equipes', ctx);
  const { donnees: communes } = useCharge<CommuneGestion[]>('/communes', ctx);
  const { occupe, agir } = useAction(ctx);
  const [edition, setEdition] = useState<EquipeGestion | 'nouvelle' | null>(null);

  const [nom, setNom] = useState('');
  const [vehicule, setVehicule] = useState<'CAMION' | 'TRICYCLE'>('TRICYCLE');
  const [jours, setJours] = useState<number[]>([]);
  const [communeSlug, setCommuneSlug] = useState('');

  function ouvrir(e: EquipeGestion | 'nouvelle') {
    setEdition(e);
    if (e === 'nouvelle') {
      setNom('');
      setVehicule('TRICYCLE');
      setJours([]);
      setCommuneSlug('');
    } else {
      setNom(e.nom);
      setVehicule(e.vehicule);
      setJours(e.jours);
      setCommuneSlug(e.commune?.slug ?? '');
    }
  }

  return (
    <>
      <div className="gs-actions-ligne">
        <button className="gs-bouton gs-bouton--plein" onClick={() => ouvrir('nouvelle')}>
          Nouvelle équipe
        </button>
      </div>

      {edition ? (
        <form
          className="gs-panneau gs-formulaire"
          onSubmit={(e) => {
            e.preventDefault();
            const corps = { nom, vehicule, jours, communeSlug: communeSlug || null };
            void agir(
              () => (edition === 'nouvelle' ? g('/equipes', { corps }) : g(`/equipes/${edition.id}`, { methode: 'PATCH', corps })),
              'Équipe enregistrée.',
              () => {
                setEdition(null);
                recharger();
              },
            );
          }}
        >
          <h2>{edition === 'nouvelle' ? 'Nouvelle équipe' : `Modifier ${edition.nom}`}</h2>
          <label>
            Nom
            <input className="gs-champ" value={nom} onChange={(e) => setNom(e.target.value)} required minLength={2} placeholder="Équipe 1" />
          </label>
          <label>
            Véhicule
            <select className="gs-champ" value={vehicule} onChange={(e) => setVehicule(e.target.value as 'CAMION' | 'TRICYCLE')}>
              <option value="TRICYCLE">Tricycle</option>
              <option value="CAMION">Camion</option>
            </select>
          </label>
          <label>
            Commune
            <select className="gs-champ" value={communeSlug} onChange={(e) => setCommuneSlug(e.target.value)}>
              <option value="">Aucune</option>
              {(communes ?? []).filter((c) => c.statut === 'OUVERTE').map((c) => (
                <option key={c.slug} value={c.slug}>{c.nom}</option>
              ))}
            </select>
          </label>
          <fieldset className="gs-jours">
            <legend>Jours de passage</legend>
            {JOURS.map((j, i) => (
              <label key={j} className={`gs-jour${jours.includes(i + 1) ? ' gs-jour--actif' : ''}`}>
                <input
                  type="checkbox"
                  checked={jours.includes(i + 1)}
                  onChange={(e) => setJours(e.target.checked ? [...jours, i + 1] : jours.filter((x) => x !== i + 1))}
                />
                {j}
              </label>
            ))}
          </fieldset>
          <div className="gs-actions-ligne">
            <button className="gs-bouton gs-bouton--plein" disabled={occupe}>Enregistrer</button>
            <button type="button" className="gs-bouton" onClick={() => setEdition(null)}>Annuler</button>
          </div>
        </form>
      ) : null}

      {!donnees ? (
        <Chargement erreur={erreur} onReessayer={recharger} />
      ) : donnees.length === 0 ? (
        <Vide>Aucune équipe. Créez la première pour pouvoir préparer des tournées.</Vide>
      ) : (
        <ul className="gs-cartes-liste gs-cartes-liste--grille">
          {donnees.map((e) => (
            <li key={e.id} className="gs-demande">
              <div className="gs-demande__tete">
                <strong>{e.nom}</strong>
                <span className="gs-discret">{e.vehicule === 'CAMION' ? 'Camion' : 'Tricycle'}</span>
              </div>
              <p className="gs-demande__corps">
                {e.commune?.nom ?? 'Sans commune'} · {e.menages} abonné{e.menages > 1 ? 's' : ''}
                <br />
                {e.jours.length ? e.jours.map((j) => JOURS[j - 1]).join(', ') : 'Aucun jour défini'}
                <br />
                {e.membres.length ? e.membres.map((m) => m.nom).join(', ') : 'Aucun membre'}
              </p>
              <div className="gs-actions-ligne">
                <button className="gs-bouton" onClick={() => ouvrir(e)}>Modifier</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
