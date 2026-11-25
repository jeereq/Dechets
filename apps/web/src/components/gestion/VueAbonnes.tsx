'use client';

import { useState } from 'react';
import {
  g,
  type DetailMenage,
  type EquipeGestion,
  type LigneMenage,
  type Page,
} from '@/lib/gestion-api';
import { formaterPrix } from '@/lib/format';
import { useAction, useCharge, type ContexteGestion } from './contexte';
import {
  dateFr,
  dateHeureFr,
  FORMULE,
  MODES,
  STATUT_DEMANDE,
  STATUT_MENAGE,
  STATUT_PAIEMENT,
  STATUT_PASSAGE,
  TYPE_DEMANDE,
} from './libelles';
import { Chargement, EnTete, Etat, Pagination, Vide } from './Petits';

export function VueAbonnes({ ctx }: { ctx: ContexteGestion }) {
  const [q, setQ] = useState('');
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [ouvert, setOuvert] = useState<string | null>(null);

  const chemin = `/menages?page=${page}&taille=15${recherche ? `&q=${encodeURIComponent(recherche)}` : ''}${statut ? `&statut=${statut}` : ''}`;
  const { donnees, erreur, chargement, recharger } = useCharge<Page<LigneMenage>>(chemin, ctx);

  return (
    <>
      <EnTete titre="Abonnés" aide="Cherchez par nom, numéro d’abonné, téléphone ou avenue." />

      <form
        className="gs-filtres"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setRecherche(q.trim());
        }}
      >
        <input
          className="gs-champ"
          type="search"
          placeholder="Rechercher un abonné…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher un abonné"
        />
        <select
          className="gs-champ"
          value={statut}
          onChange={(e) => {
            setStatut(e.target.value);
            setPage(1);
          }}
          aria-label="Filtrer par état"
        >
          <option value="">Tous les états</option>
          {Object.entries(STATUT_MENAGE).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="gs-bouton gs-bouton--plein">Chercher</button>
      </form>

      {!donnees ? (
        <Chargement erreur={erreur} onReessayer={recharger} />
      ) : donnees.elements.length === 0 ? (
        <Vide>Aucun abonné ne correspond.</Vide>
      ) : (
        <div className={`gs-tableau-boite${chargement ? ' gs-charge' : ''}`}>
          <table className="gs-tableau">
            <thead>
              <tr>
                <th>N°</th>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Adresse</th>
                <th>Formule</th>
                <th className="gs-droite">Crédit</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
              {donnees.elements.map((m) => (
                <tr key={m.id} className="gs-cliquable" onClick={() => setOuvert(m.id)}>
                  <td>
                    <button className="gs-lien" onClick={() => setOuvert(m.id)}>
                      {m.code}
                    </button>
                  </td>
                  <td>{m.nom}</td>
                  <td>{m.telephone}</td>
                  <td>
                    {m.avenue}, {m.parcelle} · {m.commune.nom}
                  </td>
                  <td>{FORMULE[m.formule]}</td>
                  <td className="gs-droite">{formaterPrix(m.credit)}</td>
                  <td>
                    <Etat statut={m.statut} libelle={STATUT_MENAGE[m.statut] ?? m.statut} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {donnees ? <Pagination page={donnees.page} taille={donnees.taille} total={donnees.total} onChange={setPage} /> : null}

      {ouvert ? <FicheAbonne id={ouvert} ctx={ctx} onFermer={() => setOuvert(null)} onMaj={recharger} /> : null}
    </>
  );
}

function FicheAbonne({
  id,
  ctx,
  onFermer,
  onMaj,
}: {
  id: string;
  ctx: ContexteGestion;
  onFermer: () => void;
  onMaj: () => void;
}) {
  const { donnees: m, erreur, recharger } = useCharge<DetailMenage>(`/menages/${id}`, ctx);
  const { donnees: equipes } = useCharge<EquipeGestion[]>(ctx.estChef ? '/equipes' : null, ctx);
  const { occupe, agir } = useAction(ctx);
  const [statut, setStatut] = useState<string | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);

  const statutActuel = statut ?? m?.statut ?? 'ACTIF';
  const equipeActuelle = equipeId ?? m?.equipe?.id ?? '';
  const modifie = m && (statutActuel !== m.statut || equipeActuelle !== (m.equipe?.id ?? ''));

  return (
    <div className="gs-tiroir" role="dialog" aria-modal="true" aria-label="Fiche abonné">
      <button className="gs-tiroir__fond" onClick={onFermer} aria-label="Fermer" />
      <aside className="gs-tiroir__corps">
        <div className="gs-tiroir__tete">
          <h2>{m ? m.nom : 'Abonné'}</h2>
          <button className="gs-bouton" onClick={onFermer}>
            Fermer
          </button>
        </div>

        {!m ? (
          <Chargement erreur={erreur} onReessayer={recharger} />
        ) : (
          <>
            <dl className="gs-fiche">
              <div><dt>N° d’abonné</dt><dd>{m.code}</dd></div>
              <div><dt>Téléphone</dt><dd><a href={`tel:${m.telephone}`}>{m.telephone}</a></dd></div>
              <div><dt>Adresse</dt><dd>{m.avenue}, parcelle {m.parcelle} · {m.commune.nom}</dd></div>
              {m.repere ? <div><dt>Repère</dt><dd>{m.repere}</dd></div> : null}
              <div><dt>Formule</dt><dd>{FORMULE[m.formule]}</dd></div>
              <div><dt>Crédit</dt><dd>{formaterPrix(m.credit)}</dd></div>
              <div><dt>Alertes</dt><dd>{[m.alerteSms ? 'SMS' : null, m.alerteWa ? 'WhatsApp' : null].filter(Boolean).join(' + ') || 'Aucune'} · {m.langue === 'EN' ? 'English' : 'Français'}</dd></div>
              <div><dt>Inscrit le</dt><dd>{dateFr(m.creeLe)}</dd></div>
            </dl>

            {ctx.estChef ? (
              <form
                className="gs-formulaire gs-formulaire--ligne"
                onSubmit={(e) => {
                  e.preventDefault();
                  void agir(
                    () => g(`/menages/${m.id}`, { methode: 'PATCH', corps: { statut: statutActuel, equipeId: equipeActuelle || null } }),
                    'Fiche mise à jour.',
                    () => {
                      recharger();
                      onMaj();
                    },
                  );
                }}
              >
                <label>
                  État
                  <select className="gs-champ" value={statutActuel} onChange={(e) => setStatut(e.target.value)}>
                    {Object.entries(STATUT_MENAGE).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Équipe de collecte
                  <select className="gs-champ" value={equipeActuelle} onChange={(e) => setEquipeId(e.target.value)}>
                    <option value="">Aucune</option>
                    {(equipes ?? []).map((e) => (
                      <option key={e.id} value={e.id}>{e.nom}</option>
                    ))}
                  </select>
                </label>
                <button className="gs-bouton gs-bouton--plein" disabled={!modifie || occupe}>
                  Enregistrer
                </button>
              </form>
            ) : null}

            <h3>Demandes</h3>
            {m.demandes.length === 0 ? <Vide>Aucune demande.</Vide> : (
              <ul className="gs-liste">
                {m.demandes.map((d) => (
                  <li key={d.id}>
                    {d.reference} · {TYPE_DEMANDE[d.type]} <Etat statut={d.statut} libelle={STATUT_DEMANDE[d.statut] ?? d.statut} />
                    <span className="gs-discret">{dateFr(d.creeLe)}</span>
                  </li>
                ))}
              </ul>
            )}

            <h3>Paiements</h3>
            {m.paiements.length === 0 ? <Vide>Aucun paiement.</Vide> : (
              <ul className="gs-liste">
                {m.paiements.map((p) => (
                  <li key={p.id}>
                    {formaterPrix(p.montant)} · {MODES[p.mode] ?? p.mode} <Etat statut={p.statut} libelle={STATUT_PAIEMENT[p.statut] ?? p.statut} />
                    <span className="gs-discret">{p.reference} · {dateFr(p.creeLe)}</span>
                  </li>
                ))}
              </ul>
            )}

            <h3>Passages</h3>
            {m.passages.length === 0 ? <Vide>Aucun passage.</Vide> : (
              <ul className="gs-liste">
                {m.passages.map((p) => (
                  <li key={p.id}>
                    {dateFr(p.date)} <Etat statut={p.statut} libelle={STATUT_PASSAGE[p.statut] ?? p.statut} />
                  </li>
                ))}
              </ul>
            )}

            <h3>Derniers messages envoyés</h3>
            {m.notifications.length === 0 ? <Vide>Aucun message.</Vide> : (
              <ul className="gs-liste">
                {m.notifications.map((n) => (
                  <li key={n.id}>
                    {n.contenu}
                    <span className="gs-discret">{n.canal === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} · {dateHeureFr(n.creeLe)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
