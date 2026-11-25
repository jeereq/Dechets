'use client';

import type { Tableau } from '@/lib/gestion-api';
import { formaterPrix } from '@/lib/format';
import { useCharge, type ContexteGestion, type PageGestion } from './contexte';
import { dateFr, TYPE_DEMANDE } from './libelles';
import { Chargement, EnTete } from './Petits';

export function VueTableau({ ctx }: { ctx: ContexteGestion }) {
  const { donnees: d, erreur, recharger } = useCharge<Tableau>('/tableau', ctx);
  if (!d) return <Chargement erreur={erreur} onReessayer={recharger} />;

  // Ce qui attend une action en premier ; les chiffres de fond ensuite.
  const toutes: Array<{ valeur: number; libelle: string; page: PageGestion; chef?: boolean }> = [
    { valeur: d.demandesARecevoir, libelle: 'demandes à planifier', page: 'demandes', chef: true },
    { valeur: d.passagesAValider, libelle: 'passages à valider', page: 'tournees', chef: true },
    { valeur: d.paiementsARapprocher, libelle: 'virements à rapprocher', page: 'paiements' },
    { valeur: d.contactsATraiter, libelle: 'messages du site à traiter', page: 'zones', chef: true },
    { valeur: d.leadsEnAttente, libelle: 'personnes à prévenir', page: 'zones', chef: true },
  ];
  const actions = toutes.filter((a) => !a.chef || ctx.estChef);

  const max = Math.max(...d.serie.map((s) => s.montant), 1);

  return (
    <>
      <EnTete titre={`Bonjour ${ctx.agent.nom.split(' ')[0]}`} aide="Voici ce qui demande votre attention aujourd’hui." />

      <section className="gs-actions" aria-label="À traiter">
        {actions.map((a) => (
          <button
            key={a.libelle}
            className={`gs-action${a.valeur > 0 ? ' gs-action--active' : ''}`}
            onClick={() => ctx.aller(a.page)}
          >
            <strong>{a.valeur}</strong>
            <span>{a.libelle}</span>
          </button>
        ))}
      </section>

      <section className="gs-cartes">
        <div className="gs-stat">
          <span>Abonnés actifs</span>
          <strong>{d.menagesActifs}</strong>
        </div>
        <div className="gs-stat">
          <span>Encaissé ce mois</span>
          <strong>{formaterPrix(d.encaisseMois)}</strong>
        </div>
        <div className="gs-stat">
          <span>Crédit total des abonnés</span>
          <strong>{formaterPrix(d.creditTotal)}</strong>
        </div>
        <div className="gs-stat">
          <span>Communes desservies</span>
          <strong>{d.communesOuvertes}</strong>
        </div>
      </section>

      <div className="gs-deux">
        <section className="gs-panneau">
          <h2>Encaissements des 7 derniers jours</h2>
          <div className="gs-barres" role="img" aria-label="Encaissements par jour">
            {d.serie.map((s) => (
              <div key={s.date} className="gs-barre">
                <span className="gs-barre__valeur">{s.montant ? formaterPrix(s.montant) : ''}</span>
                <span className="gs-barre__fut" style={{ height: `${Math.max((s.montant / max) * 100, s.montant ? 4 : 1)}%` }} />
                <span className="gs-barre__jour">
                  {new Date(`${s.date}T00:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'UTC' })}
                </span>
              </div>
            ))}
          </div>
        </section>

        {ctx.estChef ? (
          <section className="gs-panneau">
            <div className="gs-panneau__tete">
              <h2>Demandes les plus anciennes</h2>
              <button className="app-lien" onClick={() => ctx.aller('demandes')}>
                Tout voir
              </button>
            </div>
            {d.dernieresDemandes.length === 0 ? (
              <p className="gs-vide">Aucune demande en attente.</p>
            ) : (
              <ul className="gs-liste">
                {d.dernieresDemandes.map((x) => (
                  <li key={x.id}>
                    <strong>{x.menage.nom}</strong> · {x.menage.avenue}, {x.menage.commune.nom}
                    <span className="gs-discret">
                      {x.reference} · {TYPE_DEMANDE[x.type]}
                      {x.dateSouhaitee ? ` · ${dateFr(x.dateSouhaitee)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </>
  );
}
