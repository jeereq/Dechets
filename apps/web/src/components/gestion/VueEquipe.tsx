'use client';

import { useState } from 'react';
import { g, type EquipeGestion, type MembrePersonnel, type Poste } from '@/lib/gestion-api';
import { useAction, useCharge, type ContexteGestion } from './contexte';
import { POSTES } from './libelles';
import { Chargement, EnTete, Etat, Vide } from './Petits';

export function VueEquipe({ ctx }: { ctx: ContexteGestion }) {
  const { donnees, erreur, recharger } = useCharge<MembrePersonnel[]>('/personnel', ctx);
  const { donnees: equipes } = useCharge<EquipeGestion[]>('/equipes', ctx);
  const { occupe, agir } = useAction(ctx);
  const [ajout, setAjout] = useState(false);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [poste, setPoste] = useState<Poste>('EBOUEUR');
  const [equipeId, setEquipeId] = useState('');

  return (
    <>
      <EnTete
        titre="Équipe BENIME"
        aide="Le superviseur et l’agent de recouvrement ouvrent ce back-office avec leur téléphone (code SMS). Chauffeurs et éboueurs auront l’application de terrain."
        actions={
          <button className="gs-bouton gs-bouton--plein" onClick={() => setAjout(!ajout)}>
            Ajouter une personne
          </button>
        }
      />

      {ajout ? (
        <form
          className="gs-panneau gs-formulaire gs-formulaire--ligne"
          onSubmit={(e) => {
            e.preventDefault();
            void agir(
              () => g('/personnel', { corps: { nom, telephone, poste, equipeId: equipeId || null } }),
              'Personne ajoutée.',
              () => {
                setAjout(false);
                setNom('');
                setTelephone('');
                recharger();
              },
            );
          }}
        >
          <label>
            Nom
            <input className="gs-champ" value={nom} onChange={(e) => setNom(e.target.value)} required minLength={2} />
          </label>
          <label>
            Téléphone
            <input className="gs-champ" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} required minLength={9} placeholder="081 234 5678" />
          </label>
          <label>
            Poste
            <select className="gs-champ" value={poste} onChange={(e) => setPoste(e.target.value as Poste)}>
              {Object.entries(POSTES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>
            Équipe
            <select className="gs-champ" value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
              <option value="">Aucune</option>
              {(equipes ?? []).map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </label>
          <button className="gs-bouton gs-bouton--plein" disabled={occupe}>Ajouter</button>
        </form>
      ) : null}

      {!donnees ? (
        <Chargement erreur={erreur} onReessayer={recharger} />
      ) : donnees.length === 0 ? (
        <Vide>Personne pour l’instant.</Vide>
      ) : (
        <div className="gs-tableau-boite">
          <table className="gs-tableau">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Poste</th>
                <th>Équipe</th>
                <th>État</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {donnees.map((p) => (
                <tr key={p.id} className={p.actif ? '' : 'gs-inactif'}>
                  <td>{p.nom}</td>
                  <td>{p.telephone}</td>
                  <td>
                    <select
                      className="gs-champ gs-champ--discret"
                      value={p.poste}
                      disabled={occupe}
                      aria-label={`Poste de ${p.nom}`}
                      onChange={(e) => void agir(() => g(`/personnel/${p.id}`, { methode: 'PATCH', corps: { poste: e.target.value } }), 'Poste mis à jour.', recharger)}
                    >
                      {Object.entries(POSTES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td>
                    <select
                      className="gs-champ gs-champ--discret"
                      value={p.equipe?.id ?? ''}
                      disabled={occupe}
                      aria-label={`Équipe de ${p.nom}`}
                      onChange={(e) => void agir(() => g(`/personnel/${p.id}`, { methode: 'PATCH', corps: { equipeId: e.target.value || null } }), 'Équipe mise à jour.', recharger)}
                    >
                      <option value="">Aucune</option>
                      {(equipes ?? []).map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
                    </select>
                  </td>
                  <td><Etat statut={p.actif ? 'ACTIF' : 'RESILIE'} libelle={p.actif ? 'Actif' : 'Désactivé'} /></td>
                  <td className="gs-droite">
                    {p.id !== ctx.agent.id ? (
                      <button
                        className={`gs-bouton${p.actif ? ' gs-bouton--danger' : ''}`}
                        disabled={occupe}
                        onClick={() => void agir(() => g(`/personnel/${p.id}`, { methode: 'PATCH', corps: { actif: !p.actif } }), p.actif ? 'Accès retiré.' : 'Accès rétabli.', recharger)}
                      >
                        {p.actif ? 'Désactiver' : 'Réactiver'}
                      </button>
                    ) : (
                      <span className="gs-discret">Vous</span>
                    )}
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
