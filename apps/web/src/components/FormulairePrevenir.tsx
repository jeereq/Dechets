'use client';

import { useEffect, useState } from 'react';
import type { CommunePublique } from '@benime/shared';
import { envoyerLead } from '@/lib/api';
import { useCommuneChoisie } from './CommuneChoisie';

export function FormulairePrevenir({
  communes,
  etiquettes,
}: {
  communes: CommunePublique[];
  etiquettes: {
    commune: string;
    telephone: string;
    bouton: string;
    envoi: string;
    succes: string;
    erreur: string;
  };
}) {
  const [telephone, setTelephone] = useState('');
  const [communeSlug, setCommuneSlug] = useState('');
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'succes' | 'erreur'>('repos');
  const [message, setMessage] = useState<string | null>(null);

  const fermees = communes.filter((commune) => commune.statut !== 'OUVERTE');
  const { choisie } = useCommuneChoisie();

  /** Une commune touchee sur la carte ou dans la liste est deja choisie ici. */
  useEffect(() => {
    if (choisie && fermees.some((commune) => commune.slug === choisie)) setCommuneSlug(choisie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choisie]);

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEtat('envoi');
    setMessage(null);

    const resultat = await envoyerLead({ telephone, communeSlug });

    if (resultat.ok) {
      setEtat('succes');
      setTelephone('');
    } else {
      setEtat('erreur');
      setMessage(resultat.message ?? etiquettes.erreur);
    }
  }

  if (etat === 'succes') {
    return (
      <p className="message-succes" role="status">
        {etiquettes.succes}
      </p>
    );
  }

  return (
    <form
      onSubmit={soumettre}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}
    >
      <div className="champ" style={{ flex: '1 1 220px' }}>
        <label htmlFor="commune">{etiquettes.commune}</label>
        <select
          id="commune"
          required
          value={communeSlug}
          onChange={(event) => setCommuneSlug(event.target.value)}
        >
          <option value="">—</option>
          {fermees.map((commune) => (
            <option key={commune.slug} value={commune.slug}>
              {commune.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="champ" style={{ flex: '1 1 220px' }}>
        <label htmlFor="telephone">{etiquettes.telephone}</label>
        <input
          id="telephone"
          type="tel"
          inputMode="tel"
          required
          placeholder="812 345 678"
          value={telephone}
          onChange={(event) => setTelephone(event.target.value)}
        />
      </div>

      <button
        type="submit"
        className="bouton bouton--soleil bouton--grand"
        disabled={etat === 'envoi'}
      >
        {etat === 'envoi' ? etiquettes.envoi : etiquettes.bouton}
      </button>

      {etat === 'erreur' ? (
        <p className="message-erreur" role="alert" style={{ flex: '1 1 100%' }}>
          {message ?? etiquettes.erreur}
        </p>
      ) : null}
    </form>
  );
}
