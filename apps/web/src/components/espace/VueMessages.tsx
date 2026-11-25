'use client';

import { useEffect, useRef, useState } from 'react';
import { appeler, type Message } from '@/lib/espace-api';
import { estSessionExpiree, type Contexte } from './contexte';
import { dateHeure } from './utilitaires';

export function VueMessages({ ctx }: { ctx: Contexte }) {
  const { t, locale } = ctx;
  const [messages, setMessages] = useState<Message[] | null>(null);
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    appeler<Message[]>('/messages')
      // l'API renvoie du plus récent au plus ancien ; une conversation se lit de haut en bas
      .then((m) => setMessages([...m].reverse()))
      .catch((e) => {
        if (estSessionExpiree(e)) ctx.expirer();
        else setMessages([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <div className="app-page app-page--conversation">
      <h1 className="app-page__titre">{t.messages.titre}</h1>
      {messages === null ? (
        <p className="discret">{t.chargement}</p>
      ) : messages.length === 0 ? (
        <p className="app-vide">{t.messages.vide}</p>
      ) : (
        <ol className="app-fil">
          {messages.map((m) => (
            <li key={m.id} className="app-bulle">
              <p>{m.contenu}</p>
              <span className="app-bulle__pied">
                {t.messages.canaux[m.canal]}
                {m.statut === 'ECHEC' ? ` · ${t.messages.echec}` : ''} · {dateHeure(m.creeLe, locale)}
              </span>
            </li>
          ))}
        </ol>
      )}
      <div ref={fin} />
    </div>
  );
}
