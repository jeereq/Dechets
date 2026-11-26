'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { envoyerContact } from '@/lib/api';
import { SUJETS, texte, type Champ } from '@/lib/demandes';
import type { Locale } from '@/lib/i18n';
import type { GroupeOffres } from '@/lib/offres';

export type EtiquettesContact = {
  nom: string;
  telephone: string;
  email: string;
  message: string;
  envoyer: string;
  envoi: string;
  succes: string;
  erreur: string;
  sujet: string;
  choisir: string;
  sujetLigne: string;
};

/**
 * Formulaire de contact qui s'adapte à la demande : le type de demande (collecte, énergie,
 * construction, agriculture, events, autre) change les questions posées. Il s'ouvre déjà sur le
 * bon type quand on arrive d'une page de service (?sujet=energie) ou d'une offre tarifaire
 * (?offre=g1-1). Au moment de l'envoi, les réponses sont regroupées en tête du message.
 */
export function FormulaireContact({
  locale,
  etiquettes,
  offres,
}: {
  locale: Locale;
  etiquettes: EtiquettesContact;
  offres: GroupeOffres[];
}) {
  const params = useSearchParams();
  const [sujetId, setSujetId] = useState('general');
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [precisions, setPrecisions] = useState('');
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'succes' | 'erreur'>('repos');

  const sujet = SUJETS.find((s) => s.id === sujetId) ?? SUJETS[0]!;
  const toutesOffres = offres.flatMap((g) => g.offres);

  // Arrivée depuis une page de service ou depuis le menu Tarification.
  const sujetUrl = params.get('sujet');
  const offreUrl = params.get('offre');
  useEffect(() => {
    if (offreUrl && toutesOffres.some((o) => o.id === offreUrl)) {
      setSujetId('assainissement');
      setValeurs({ offre: offreUrl });
    } else if (sujetUrl && SUJETS.some((s) => s.id === sujetUrl)) {
      setSujetId(sujetUrl);
      setValeurs({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sujetUrl, offreUrl]);

  function changerSujet(id: string) {
    setSujetId(id);
    setValeurs({});
  }

  /** Texte d'une réponse, tel qu'il sera écrit dans le message. */
  function reponse(champ: Champ): string {
    const v = valeurs[champ.id] ?? '';
    if (champ.type === 'offre') return toutesOffres.find((o) => o.id === v)?.etiquette ?? '';
    return v;
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEtat('envoi');

    const lignes = [`${etiquettes.sujetLigne} : ${texte(sujet.libelle, locale)}`];
    for (const champ of sujet.champs) {
      const v = reponse(champ);
      if (v) lignes.push(`${texte(champ.libelle, locale)} : ${v}`);
    }
    const message = precisions.trim() ? `${lignes.join('\n')}\n\n${precisions.trim()}` : lignes.join('\n');

    const resultat = await envoyerContact({ nom, telephone, email, message });
    if (resultat.ok) {
      setEtat('succes');
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
        <label htmlFor="contact-sujet">{etiquettes.sujet}</label>
        <select id="contact-sujet" value={sujetId} onChange={(e) => changerSujet(e.target.value)}>
          {SUJETS.map((s) => (
            <option key={s.id} value={s.id}>
              {texte(s.libelle, locale)}
            </option>
          ))}
        </select>
        <span className="champ__aide">{texte(sujet.aide, locale)}</span>
      </div>

      {sujet.champs.map((champ) => {
        const id = `contact-${sujet.id}-${champ.id}`;
        const valeur = valeurs[champ.id] ?? '';
        const maj = (v: string) => setValeurs((anciennes) => ({ ...anciennes, [champ.id]: v }));
        const libelle = texte(champ.libelle, locale) + (champ.requis ? '' : ` (${locale === 'fr' ? 'facultatif' : 'optional'})`);
        return (
          <div className="champ" key={id}>
            <label htmlFor={id}>{libelle}</label>
            {champ.type === 'liste' ? (
              <select id={id} required={champ.requis} value={valeur} onChange={(e) => maj(e.target.value)}>
                <option value="">{etiquettes.choisir}</option>
                {champ.options?.map((opt) => (
                  <option key={opt.fr} value={texte(opt, locale)}>
                    {texte(opt, locale)}
                  </option>
                ))}
              </select>
            ) : champ.type === 'offre' ? (
              <select id={id} required={champ.requis} value={valeur} onChange={(e) => maj(e.target.value)}>
                <option value="">{etiquettes.choisir}</option>
                {offres.map((groupe) => (
                  <optgroup key={groupe.titre} label={groupe.titre}>
                    {groupe.offres.map((offre) => (
                      <option key={offre.id} value={offre.id}>
                        {offre.nom} — {offre.prix}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <input
                id={id}
                type={champ.type === 'texte' ? 'text' : champ.type === 'nombre' ? 'number' : 'date'}
                inputMode={champ.type === 'nombre' ? 'numeric' : undefined}
                min={champ.type === 'nombre' ? 1 : undefined}
                required={champ.requis}
                maxLength={champ.type === 'texte' ? 160 : undefined}
                placeholder={champ.exemple ? texte(champ.exemple, locale) : undefined}
                value={valeur}
                onChange={(e) => maj(e.target.value)}
              />
            )}
          </div>
        );
      })}

      <div className="champ">
        <label htmlFor="contact-precisions">{texte(sujet.precisions, locale)}</label>
        <textarea
          id="contact-precisions"
          required={sujet.id === 'general'}
          minLength={sujet.id === 'general' ? 5 : undefined}
          maxLength={1500}
          value={precisions}
          onChange={(e) => setPrecisions(e.target.value)}
        />
      </div>

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
