'use client';

import { useEffect, useState } from 'react';
import { appeler, type Demande, type Message } from '@/lib/espace-api';
import { formaterPrix } from '@/lib/format';
import { estSessionExpiree, type Contexte } from './contexte';
import { IconeApp } from './IconesApp';
import { dateCourte, dateHeure, remplir } from './utilitaires';

export function VueAccueil({ ctx }: { ctx: Contexte }) {
  const { t, locale, menage } = ctx;
  const [demandes, setDemandes] = useState<Demande[] | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    let actif = true;
    Promise.all([appeler<Demande[]>('/demandes'), appeler<Message[]>('/messages')])
      .then(([d, m]) => {
        if (!actif) return;
        setDemandes(d);
        setMessages(m);
      })
      .catch((e) => {
        if (estSessionExpiree(e)) ctx.expirer();
        else if (actif) {
          setDemandes([]);
          setMessages([]);
        }
      });
    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enCours = demandes?.find((d) => d.statut === 'RECUE' || d.statut === 'PLANIFIEE');
  const derniers = (messages ?? []).slice(0, 2);

  return (
    <div className="app-page">
      <section className="app-solde">
        <p className="app-solde__salut">{remplir(t.accueil.bonjour, { nom: menage.nom.split(' ')[0] ?? menage.nom })}</p>
        <p className="app-solde__code">{remplir(t.accueil.numero, { code: menage.code })}</p>
        <p className="app-solde__libelle">{t.accueil.credit}</p>
        <p className="app-solde__montant">{formaterPrix(menage.credit)}</p>
        <button className="bouton bouton--soleil" onClick={() => ctx.aller('credit')}>
          <IconeApp nom="plus" taille={20} />
          {t.accueil.recharger}
        </button>
      </section>

      <button className="app-action" onClick={() => ctx.aller('passages')}>
        <span className="app-action__icone">
          <IconeApp nom="passages" taille={30} />
        </span>
        <span className="app-action__texte">
          <strong>{t.accueil.demander}</strong>
          <span>{t.accueil.demanderAide}</span>
        </span>
      </button>

      <section className="app-carte">
        <h2 className="app-titre">{t.accueil.prochain}</h2>
        {demandes === null ? (
          <p className="discret">{t.chargement}</p>
        ) : enCours ? (
          <div className="app-ligne">
            <span className="app-ligne__icone">
              <IconeApp nom="horloge" />
            </span>
            <span className="app-ligne__texte">
              <strong>{enCours.reference}</strong>
              <span>
                {t.passages.types[enCours.type]}
                {enCours.dateSouhaitee ? ` · ${dateCourte(enCours.dateSouhaitee, locale)}` : ''}
              </span>
            </span>
            <span className={`etat ${enCours.statut === 'PLANIFIEE' ? 'etat--ok' : 'etat--attente'}`}>
              {t.passages.statuts[enCours.statut]}
            </span>
          </div>
        ) : (
          <p className="discret">{t.accueil.aucune}</p>
        )}
      </section>

      <section className="app-carte">
        <div className="app-carte__tete">
          <h2 className="app-titre">{t.accueil.messages}</h2>
          <button className="app-lien" onClick={() => ctx.aller('messages')}>
            {t.accueil.toutVoir}
          </button>
        </div>
        {messages === null ? (
          <p className="discret">{t.chargement}</p>
        ) : derniers.length ? (
          <ul className="app-liste">
            {derniers.map((m) => (
              <li key={m.id} className="app-apercu">
                <span className="app-apercu__date">{dateHeure(m.creeLe, locale)}</span>
                <span>{m.contenu}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="discret">{t.accueil.aucunMessage}</p>
        )}
      </section>
    </div>
  );
}
