'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { envoyerContact } from '@/lib/api';

export type EtiquettesContact = {
  nom: string;
  telephone: string;
  email: string;
  message: string;
  envoyer: string;
  envoi: string;
  succes: string;
  erreur: string;
};

export function FormulaireContact({
  etiquettes,
  offres,
  modeleOffre,
}: {
  etiquettes: EtiquettesContact;
  /** id d'offre -> libellé (voir lib/offres.ts) */
  offres: Record<string, string>;
  /** Message type, « {offre} » est remplacé par le libellé de l'offre choisie. */
  modeleOffre: string;
}) {
  const offreChoisie = useSearchParams().get('offre');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  // Arrivée depuis le menu Tarification : le message est déjà rédigé pour l'offre choisie.
  useEffect(() => {
    const libelle = offreChoisie ? offres[offreChoisie] : undefined;
    if (libelle) setMessage(modeleOffre.replace('{offre}', libelle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offreChoisie]);

  const [etat, setEtat] = useState<'repos' | 'envoi' | 'succes' | 'erreur'>('repos');

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEtat('envoi');
    const resultat = await envoyerContact({ nom, telephone, email, message });
    if (resultat.ok) {
      setEtat('succes');
      setNom('');
      setTelephone('');
      setEmail('');
      setMessage('');
    } else {
      setEtat('erreur');
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
    <form onSubmit={soumettre} className="pile" style={{ gap: 16 }}>
      <div className="champ">
        <label htmlFor="contact-nom">{etiquettes.nom}</label>
        <input id="contact-nom" required minLength={2} maxLength={120} autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} />
      </div>
      <div className="champ">
        <label htmlFor="contact-telephone">{etiquettes.telephone}</label>
        <input
          id="contact-telephone"
          type="tel"
          inputMode="tel"
          required
          minLength={9}
          maxLength={20}
          autoComplete="tel"
          placeholder="+243 812 345 678"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
        />
      </div>
      <div className="champ">
        <label htmlFor="contact-email">{etiquettes.email}</label>
        <input id="contact-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="champ">
        <label htmlFor="contact-message">{etiquettes.message}</label>
        <textarea id="contact-message" required minLength={5} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <div>
        <button type="submit" className="bouton bouton--principal bouton--grand" disabled={etat === 'envoi'}>
          {etat === 'envoi' ? etiquettes.envoi : etiquettes.envoyer}
        </button>
      </div>
      {etat === 'erreur' ? (
        <p className="message-erreur" role="alert">
          {etiquettes.erreur}
        </p>
      ) : null}
    </form>
  );
}
