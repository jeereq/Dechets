'use client';

import { useState } from 'react';
import { appelerSimple, g, type Page, type PaiementGestion } from '@/lib/gestion-api';
import { formaterPrix } from '@/lib/format';
import { useAction, useCharge, type ContexteGestion } from './contexte';
import { dateHeureFr, MODES, OBJETS, STATUT_PAIEMENT } from './libelles';
import { Chargement, Confirmer, EnTete, Etat, Pagination, Vide } from './Petits';

export function VuePaiements({ ctx }: { ctx: ContexteGestion }) {
  const [statut, setStatut] = useState('');
  const [mode, setMode] = useState('');
  const [q, setQ] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const [encaisser, setEncaisser] = useState(false);

  const chemin = `/paiements?page=${page}&taille=15${statut ? `&statut=${statut}` : ''}${mode ? `&mode=${mode}` : ''}${recherche ? `&q=${encodeURIComponent(recherche)}` : ''}`;
  const { donnees, erreur, recharger } = useCharge<Page<PaiementGestion> & { somme: number }>(chemin, ctx);
  const { occupe, agir } = useAction(ctx);

  return (
    <>
      <EnTete
        titre="Paiements"
        aide="Mobile money et carte sont confirmés par FlexPay. Les virements se rapprochent ici, avec le relevé bancaire."
        actions={
          <button className="gs-bouton gs-bouton--plein" onClick={() => setEncaisser(!encaisser)}>
            Encaisser (espèces ou virement)
          </button>
        }
      />

      {encaisser ? <FormulaireEncaissement ctx={ctx} onFini={() => { setEncaisser(false); recharger(); }} /> : null}

      <form
        className="gs-filtres"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setRecherche(q.trim());
        }}
      >
        <input className="gs-champ" type="search" placeholder="Référence, nom ou n° d’abonné" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un paiement" />
        <select className="gs-champ" value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }} aria-label="État">
          <option value="">Tous les états</option>
          {Object.entries(STATUT_PAIEMENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="gs-champ" value={mode} onChange={(e) => { setMode(e.target.value); setPage(1); }} aria-label="Mode">
          <option value="">Tous les modes</option>
          {Object.entries(MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="gs-bouton gs-bouton--plein">Chercher</button>
      </form>

      {!donnees ? (
        <Chargement erreur={erreur} onReessayer={recharger} />
      ) : donnees.elements.length === 0 ? (
        <Vide>Aucun paiement ne correspond.</Vide>
      ) : (
        <>
          <p className="gs-resume">
            Total {statut ? STATUT_PAIEMENT[statut].toLowerCase() : 'reçu'} : <strong>{formaterPrix(donnees.somme)}</strong>
          </p>
          <div className="gs-tableau-boite">
            <table className="gs-tableau">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Abonné</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th className="gs-droite">Montant</th>
                  <th>État</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {donnees.elements.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.reference}
                      <span className="gs-discret">{OBJETS[p.objet] ?? p.objet}</span>
                    </td>
                    <td>
                      {p.menage.nom}
                      <span className="gs-discret">{p.menage.code}</span>
                    </td>
                    <td>
                      {dateHeureFr(p.creeLe)}
                      {p.agent ? <span className="gs-discret">par {p.agent}</span> : null}
                    </td>
                    <td>{MODES[p.mode] ?? p.mode}</td>
                    <td className="gs-droite">{formaterPrix(p.montant)}</td>
                    <td><Etat statut={p.statut} libelle={STATUT_PAIEMENT[p.statut]} /></td>
                    <td className="gs-droite">
                      {ctx.estChef && ['VIREMENT', 'CASH'].includes(p.mode) && p.statut !== 'RECU' && p.statut !== 'ECHEC' ? (
                        <span className="gs-actions-ligne">
                          <button
                            className="gs-bouton gs-bouton--plein"
                            disabled={occupe}
                            onClick={() => void agir(() => g(`/paiements/${p.id}/confirmer`, { corps: {} }), 'Paiement confirmé, crédit ajouté.', recharger)}
                          >
                            Confirmer
                          </button>
                          <Confirmer
                            libelle="Rejeter"
                            question="Rejeter ce paiement ? Le crédit de l’abonné ne sera pas modifié."
                            occupe={occupe}
                            onConfirme={() => void agir(() => g(`/paiements/${p.id}/rejeter`, { corps: {} }), 'Paiement rejeté.', recharger)}
                          />
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={donnees.page} taille={donnees.taille} total={donnees.total} onChange={setPage} />
        </>
      )}
    </>
  );
}

function FormulaireEncaissement({ ctx: c, onFini }: { ctx: ContexteGestion; onFini: () => void }) {
  const [code, setCode] = useState('');
  const [montant, setMontant] = useState('');
  const [modeEnc, setModeEnc] = useState<'CASH' | 'VIREMENT'>('CASH');
  const [objet, setObjet] = useState('RECHARGE_CREDIT');
  const a = useAction(c);
  return (
    <form
      className="gs-panneau gs-formulaire gs-formulaire--ligne"
      onSubmit={(e) => {
        e.preventDefault();
        void a.agir(
          () => appelerSimple('/encaissements', { corps: { menageCode: code, montant: Number(montant), mode: modeEnc, objet } }),
          modeEnc === 'CASH' ? 'Encaissement enregistré, crédit ajouté.' : 'Virement enregistré, à rapprocher avec le relevé.',
          onFini,
        );
      }}
    >
      <label>
        N° d’abonné
        <input className="gs-champ" value={code} onChange={(e) => setCode(e.target.value)} placeholder="MN-0001" required minLength={3} />
      </label>
      <label>
        Montant (FC)
        <input className="gs-champ" inputMode="numeric" value={montant} onChange={(e) => setMontant(e.target.value.replace(/\D/g, ''))} required />
      </label>
      <label>
        Mode
        <select className="gs-champ" value={modeEnc} onChange={(e) => setModeEnc(e.target.value as 'CASH' | 'VIREMENT')}>
          <option value="CASH">Espèces</option>
          <option value="VIREMENT">Virement</option>
        </select>
      </label>
      <label>
        Objet
        <select className="gs-champ" value={objet} onChange={(e) => setObjet(e.target.value)}>
          {Object.entries(OBJETS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <button className="gs-bouton gs-bouton--plein" disabled={a.occupe}>Enregistrer</button>
    </form>
  );
}
