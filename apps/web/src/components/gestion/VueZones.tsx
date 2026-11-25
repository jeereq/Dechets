'use client';

import { g, type CommuneGestion, type ContactGestion } from '@/lib/gestion-api';
import { useAction, useCharge, type ContexteGestion } from './contexte';
import { dateFr, dateHeureFr, STATUT_COMMUNE } from './libelles';
import { Chargement, Confirmer, EnTete, Etat, Vide } from './Petits';

export function VueZones({ ctx }: { ctx: ContexteGestion }) {
  const { donnees, erreur, recharger } = useCharge<CommuneGestion[]>('/communes', ctx);
  const { donnees: contacts, recharger: rechargerContacts } = useCharge<ContactGestion[]>('/contacts', ctx);
  const { occupe, agir } = useAction(ctx);

  const ouvertes = (donnees ?? []).filter((c) => c.statut === 'OUVERTE');
  const autres = (donnees ?? []).filter((c) => c.statut !== 'OUVERTE');

  return (
    <>
      <EnTete
        titre="Zones et contacts"
        aide="Ouvrir une commune la montre en vert sur le site. Ensuite, prévenez par SMS les personnes qui attendaient."
      />

      {!donnees ? (
        <Chargement erreur={erreur} onReessayer={recharger} />
      ) : (
        <div className="gs-tableau-boite">
          <table className="gs-tableau">
            <thead>
              <tr>
                <th>Commune</th>
                <th>État sur le site</th>
                <th className="gs-droite">Abonnés</th>
                <th className="gs-droite">À prévenir</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...ouvertes, ...autres].map((c) => (
                <tr key={c.slug}>
                  <td>
                    <strong>{c.nom}</strong>
                    {c.ouverteLe ? <span className="gs-discret">depuis le {dateFr(c.ouverteLe)}</span> : null}
                  </td>
                  <td>
                    <select
                      className="gs-champ gs-champ--discret"
                      value={c.statut}
                      disabled={occupe}
                      aria-label={`État de ${c.nom}`}
                      onChange={(e) => void agir(() => g(`/communes/${c.slug}`, { methode: 'PATCH', corps: { statut: e.target.value } }), `${c.nom} : état mis à jour.`, recharger)}
                    >
                      {Object.entries(STATUT_COMMUNE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="gs-droite">{c.menages}</td>
                  <td className="gs-droite">{c.leadsEnAttente}</td>
                  <td className="gs-droite">
                    {c.statut === 'OUVERTE' && c.leadsEnAttente > 0 ? (
                      <Confirmer
                        danger={false}
                        libelle="Prévenir"
                        question={`Envoyer un SMS aux ${c.leadsEnAttente} personnes qui attendent ${c.nom} ?`}
                        occupe={occupe}
                        onConfirme={() =>
                          void agir(
                            async () => {
                              const r = await g<{ envoyes: number; echecs: number }>(`/communes/${c.slug}/prevenir`, { corps: {} });
                              ctx.annoncer(`${r.envoyes} SMS envoyés${r.echecs ? `, ${r.echecs} échecs` : ''}.`, r.echecs === 0);
                            },
                            '',
                            recharger,
                          )
                        }
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="gs-sous-titre">Messages reçus par le site</h2>
      {!contacts ? (
        <Chargement />
      ) : contacts.length === 0 ? (
        <Vide>Aucun message.</Vide>
      ) : (
        <ul className="gs-cartes-liste">
          {contacts.map((m) => (
            <li key={m.id} className="gs-demande">
              <div className="gs-demande__tete">
                <div>
                  <strong>{m.nom}</strong>
                  <div className="gs-discret">
                    <a href={`tel:${m.telephone}`}>{m.telephone}</a>
                    {m.email ? <> · <a href={`mailto:${m.email}`}>{m.email}</a></> : null} · {dateHeureFr(m.creeLe)}
                  </div>
                </div>
                <Etat statut={m.traiteLe ? 'TERMINEE' : 'RECUE'} libelle={m.traiteLe ? 'Traité' : 'À traiter'} />
              </div>
              <p className="gs-demande__corps">{m.message}</p>
              {!m.traiteLe ? (
                <div className="gs-actions-ligne">
                  <button className="gs-bouton" disabled={occupe} onClick={() => void agir(() => g(`/contacts/${m.id}/traiter`, { corps: {} }), 'Message marqué comme traité.', rechargerContacts)}>
                    Marquer traité
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
