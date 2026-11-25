'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { POSTES, type ContexteTerrain } from './contexte';

export function VueMoi({ ctx, locale }: { ctx: ContexteTerrain; locale: Locale }) {
  const { agent, enAttente } = ctx;
  const [confirme, setConfirme] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function envoyer() {
    setEnvoi(true);
    await ctx.envoyer();
    setEnvoi(false);
  }

  return (
    <div className="app-page">
      <h1 className="app-page__titre">{agent.nom}</h1>

      <section className="app-carte">
        <dl className="app-recap">
          <div>
            <dt>Poste</dt>
            <dd>{POSTES[agent.poste]}</dd>
          </div>
          <div>
            <dt>Équipe</dt>
            <dd>{agent.equipe ? `${agent.equipe.nom} · ${agent.equipe.vehicule === 'CAMION' ? 'camion' : 'tricycle'}` : 'Aucune'}</dd>
          </div>
          <div className="app-recap__fin">
            <dt>Téléphone</dt>
            <dd>{agent.telephone}</dd>
          </div>
        </dl>
      </section>

      {enAttente > 0 ? (
        <section className="app-carte">
          <h2 className="app-titre">
            {enAttente} passage{enAttente > 1 ? 's' : ''} pas encore envoyé{enAttente > 1 ? 's' : ''}
          </h2>
          <p className="discret">Ils sont gardés sur ce téléphone et partent dès que le réseau revient.</p>
          <button className="bouton bouton--principal" onClick={() => void envoyer()} disabled={envoi || !ctx.enLigne}>
            {envoi ? 'Envoi…' : ctx.enLigne ? 'Envoyer maintenant' : 'Pas de réseau'}
          </button>
        </section>
      ) : null}

      {agent.poste === 'SUPERVISEUR' || agent.poste === 'RECOUVREMENT' ? (
        <Link className="bouton bouton--secondaire bouton--grand" href={`/${locale}/gestion`}>
          Ouvrir le back-office
        </Link>
      ) : null}

      {!confirme ? (
        <button className="app-lien app-lien--centre" onClick={() => (enAttente > 0 ? setConfirme(true) : ctx.deconnecter())}>
          Se déconnecter
        </button>
      ) : (
        <div className="app-confirmer" role="alert">
          <p>
            {enAttente} passage{enAttente > 1 ? 's' : ''} pas encore envoyé{enAttente > 1 ? 's' : ''} sera
            {enAttente > 1 ? 'ont' : ''} perdu{enAttente > 1 ? 's' : ''} si vous vous déconnectez maintenant.
          </p>
          <div className="app-confirmer__boutons">
            <button className="bouton bouton--secondaire" onClick={() => setConfirme(false)}>
              Rester connecté
            </button>
            <button className="bouton bouton--danger" onClick={ctx.deconnecter}>
              Me déconnecter quand même
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
