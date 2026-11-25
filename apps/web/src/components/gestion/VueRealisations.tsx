'use client';

import { useState } from 'react';
import { g, type RealisationGestion } from '@/lib/gestion-api';
import { useAction, useCharge, type ContexteGestion } from './contexte';
import { dateFr } from './libelles';
import { Chargement, Confirmer, EnTete, Etat, Vide } from './Petits';

export function VueRealisations({ ctx }: { ctx: ContexteGestion }) {
  const { donnees, erreur, recharger } = useCharge<RealisationGestion[]>('/realisations', ctx);
  const { occupe, agir } = useAction(ctx);
  const [ajout, setAjout] = useState(false);
  const [lieu, setLieu] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [legende, setLegende] = useState('');

  return (
    <>
      <EnTete
        titre="Réalisations"
        aide="Les chantiers et nettoyages que vous voulez montrer. Une réalisation « publiée » est prête à apparaître sur le site."
        actions={<button className="gs-bouton gs-bouton--plein" onClick={() => setAjout(!ajout)}>Ajouter une réalisation</button>}
      />

      {ajout ? (
        <form
          className="gs-panneau gs-formulaire"
          onSubmit={(e) => {
            e.preventDefault();
            void agir(
              () => g('/realisations', { corps: { lieu, date: `${date}T12:00:00.000Z`, legende: legende || null, publiee: false } }),
              'Réalisation ajoutée.',
              () => {
                setAjout(false);
                setLieu('');
                setLegende('');
                recharger();
              },
            );
          }}
        >
          <label>
            Lieu
            <input className="gs-champ" value={lieu} onChange={(e) => setLieu(e.target.value)} required minLength={2} placeholder="Avenue de la Paix, Lingwala" />
          </label>
          <label>
            Date
            <input className="gs-champ" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            Légende (facultatif)
            <textarea className="gs-champ" rows={3} value={legende} onChange={(e) => setLegende(e.target.value)} maxLength={400} />
          </label>
          <div className="gs-actions-ligne">
            <button className="gs-bouton gs-bouton--plein" disabled={occupe}>Enregistrer</button>
            <button type="button" className="gs-bouton" onClick={() => setAjout(false)}>Annuler</button>
          </div>
        </form>
      ) : null}

      {!donnees ? (
        <Chargement erreur={erreur} onReessayer={recharger} />
      ) : donnees.length === 0 ? (
        <Vide>Aucune réalisation enregistrée.</Vide>
      ) : (
        <ul className="gs-cartes-liste">
          {donnees.map((r) => (
            <li key={r.id} className="gs-demande">
              <div className="gs-demande__tete">
                <div>
                  <strong>{r.lieu}</strong>
                  <div className="gs-discret">{dateFr(r.date)}</div>
                </div>
                <Etat statut={r.publiee ? 'VALIDE' : 'RECUE'} libelle={r.publiee ? 'Publiée' : 'Brouillon'} />
              </div>
              {r.legende ? <p className="gs-demande__corps">{r.legende}</p> : null}
              <div className="gs-actions-ligne">
                <button
                  className="gs-bouton"
                  disabled={occupe}
                  onClick={() => void agir(() => g(`/realisations/${r.id}`, { methode: 'PATCH', corps: { publiee: !r.publiee } }), r.publiee ? 'Retirée de la publication.' : 'Publiée.', recharger)}
                >
                  {r.publiee ? 'Dépublier' : 'Publier'}
                </button>
                <Confirmer libelle="Supprimer" question="Supprimer définitivement cette réalisation ?" occupe={occupe} onConfirme={() => void agir(() => g(`/realisations/${r.id}`, { methode: 'DELETE' }), 'Réalisation supprimée.', recharger)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
