'use client';

import { useState } from 'react';
import { g, type DemandeGestion, type EquipeGestion } from '@/lib/gestion-api';
import { formaterPrix } from '@/lib/format';
import { useAction, useCharge, type ContexteGestion } from './contexte';
import { dateFr, STATUT_DEMANDE, TYPE_DEMANDE } from './libelles';
import { Chargement, Confirmer, EnTete, Etat, Vide } from './Petits';

const ONGLETS: Array<[string, string]> = [
  ['', 'À traiter'],
  ['RECUE', 'Reçues'],
  ['PLANIFIEE', 'Planifiées'],
  ['TERMINEE', 'Terminées'],
  ['ANNULEE', 'Annulées'],
];

const demain = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export function VueDemandes({ ctx }: { ctx: ContexteGestion }) {
  const [statut, setStatut] = useState('');
  const { donnees, erreur, recharger } = useCharge<DemandeGestion[]>(`/demandes${statut ? `?statut=${statut}` : ''}`, ctx);
  const { donnees: equipes } = useCharge<EquipeGestion[]>('/equipes', ctx);
  const { occupe, agir } = useAction(ctx);
  const [planif, setPlanif] = useState<string | null>(null);
  const [date, setDate] = useState(demain());
  const [equipeId, setEquipeId] = useState('');

  function ouvrirPlanification(d: DemandeGestion) {
    setPlanif(d.id);
    setDate((d.datePlanifiee ?? d.dateSouhaitee ?? new Date(Date.now() + 86400000).toISOString()).slice(0, 10));
    setEquipeId(d.equipe?.id ?? '');
  }

  return (
    <>
      <EnTete titre="Demandes de passage" aide="Les passages demandés par les abonnés en plus de leur tournée." />

      <div className="gs-onglets" role="tablist">
        {ONGLETS.map(([valeur, libelle]) => (
          <button
            key={valeur}
            role="tab"
            aria-selected={statut === valeur}
            className={`gs-onglet${statut === valeur ? ' gs-onglet--actif' : ''}`}
            onClick={() => setStatut(valeur)}
          >
            {libelle}
          </button>
        ))}
      </div>

      {!donnees ? (
        <Chargement erreur={erreur} onReessayer={recharger} />
      ) : donnees.length === 0 ? (
        <Vide>Aucune demande ici.</Vide>
      ) : (
        <ul className="gs-cartes-liste">
          {donnees.map((d) => (
            <li key={d.id} className="gs-demande">
              <div className="gs-demande__tete">
                <div>
                  <strong>{d.menage.nom}</strong> <span className="gs-discret">{d.menage.code}</span>
                  <div className="gs-discret">
                    {d.menage.avenue}, {d.menage.parcelle} · {d.menage.commune.nom}
                    {d.menage.repere ? ` · ${d.menage.repere}` : ''}
                  </div>
                  <div className="gs-discret">
                    <a href={`tel:${d.menage.telephone}`}>{d.menage.telephone}</a>
                  </div>
                </div>
                <Etat statut={d.statut} libelle={STATUT_DEMANDE[d.statut] ?? d.statut} />
              </div>

              <p className="gs-demande__corps">
                {d.reference} · {TYPE_DEMANDE[d.type]}
                {d.dateSouhaitee ? ` · souhaité le ${dateFr(d.dateSouhaitee)}` : ''} · {formaterPrix(d.cout)}
                {d.datePlanifiee ? ` · planifié le ${dateFr(d.datePlanifiee)}` : ''}
                {d.equipe ? ` · ${d.equipe.nom}` : ''}
              </p>

              {planif === d.id ? (
                <form
                  className="gs-formulaire gs-formulaire--ligne"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void agir(
                      () =>
                        g(`/demandes/${d.id}/planifier`, {
                          corps: { datePlanifiee: `${date}T08:00:00.000Z`, equipeId: equipeId || null },
                        }),
                      'Demande planifiée. L’abonné est prévenu.',
                      () => {
                        setPlanif(null);
                        recharger();
                      },
                    );
                  }}
                >
                  <label>
                    Jour du passage
                    <input className="gs-champ" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} required />
                  </label>
                  <label>
                    Équipe
                    <select className="gs-champ" value={equipeId} onChange={(e) => setEquipeId(e.target.value)} required>
                      <option value="">Choisir…</option>
                      {(equipes ?? []).map((e) => (
                        <option key={e.id} value={e.id}>{e.nom}</option>
                      ))}
                    </select>
                  </label>
                  <button className="gs-bouton gs-bouton--plein" disabled={occupe}>Planifier</button>
                  <button type="button" className="gs-bouton" onClick={() => setPlanif(null)}>Annuler</button>
                </form>
              ) : d.statut === 'RECUE' || d.statut === 'PLANIFIEE' ? (
                <div className="gs-actions-ligne">
                  <button className="gs-bouton gs-bouton--plein" onClick={() => ouvrirPlanification(d)}>
                    {d.statut === 'RECUE' ? 'Planifier' : 'Changer le jour'}
                  </button>
                  {d.statut === 'PLANIFIEE' ? (
                    <button
                      className="gs-bouton"
                      disabled={occupe}
                      onClick={() => void agir(() => g(`/demandes/${d.id}/terminer`, { corps: {} }), 'Demande terminée.', recharger)}
                    >
                      Marquer terminée
                    </button>
                  ) : null}
                  <Confirmer
                    libelle="Annuler"
                    question={`Annuler cette demande ? ${formaterPrix(d.cout)} seront rendus au crédit de l’abonné.`}
                    occupe={occupe}
                    onConfirme={() => void agir(() => g(`/demandes/${d.id}/annuler`, { corps: {} }), 'Demande annulée, crédit rendu.', recharger)}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
