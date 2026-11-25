'use client';

import { useEffect, useState } from 'react';
import { g } from '@/lib/gestion-api';
import { useAction, useCharge, type ContexteGestion } from './contexte';
import { Chargement, EnTete } from './Petits';

type Valeurs = Record<string, string>;

const NOMBRES: Array<[string, string, string]> = [
  ['prix_par_passage', 'Prix d’un passage (FC)', 'Débité du crédit à chaque demande de passage.'],
  ['prix_mensuel', 'Abonnement mensuel', 'Affiché sur le site et à l’inscription.'],
  ['passages_par_semaine', 'Passages par semaine (abonnement)', 'Nombre de passages compris dans la formule mensuelle.'],
];

const TEXTES: Array<[string, string]> = [
  ['devise', 'Devise du prix par passage'],
  ['devise_mensuel', 'Devise de l’abonnement mensuel'],
];

const OPTIONS: Array<[string, string, string]> = [
  ['canal_sms', 'Envoyer des SMS', 'Décoché : plus aucun SMS aux abonnés (le code de connexion part toujours).'],
  ['canal_whatsapp', 'Envoyer des messages WhatsApp', ''],
  ['alerte_veille_passage', 'Prévenir la veille d’un passage', 'Pris en compte dès que les rappels automatiques seront en place.'],
];

export function VueReglages({ ctx }: { ctx: ContexteGestion }) {
  const { donnees, erreur, recharger } = useCharge<Valeurs>('/reglages', ctx);
  const { occupe, agir } = useAction(ctx);
  const [v, setV] = useState<Valeurs>({});

  useEffect(() => {
    if (donnees) setV(donnees);
  }, [donnees]);

  if (!donnees) return <Chargement erreur={erreur} onReessayer={recharger} />;
  const maj = (cle: string, valeur: string) => setV((x) => ({ ...x, [cle]: valeur }));

  return (
    <>
      <EnTete titre="Réglages" aide="Les prix et les canaux. Le site public lit ces valeurs : pas besoin de le republier." />
      <form
        className="gs-panneau gs-formulaire"
        onSubmit={(e) => {
          e.preventDefault();
          void agir(() => g('/reglages', { methode: 'PUT', corps: v }), 'Réglages enregistrés. Le site les affichera dans quelques minutes.', recharger);
        }}
      >
        {NOMBRES.map(([cle, libelle, aide]) => (
          <label key={cle}>
            {libelle}
            <input className="gs-champ" inputMode="numeric" value={v[cle] ?? ''} onChange={(e) => maj(cle, e.target.value.replace(/\D/g, ''))} required />
            <span className="gs-discret">{aide}</span>
          </label>
        ))}
        {TEXTES.map(([cle, libelle]) => (
          <label key={cle}>
            {libelle}
            <input className="gs-champ" value={v[cle] ?? ''} onChange={(e) => maj(cle, e.target.value.toUpperCase())} required minLength={2} maxLength={6} />
          </label>
        ))}
        <fieldset className="gs-options">
          <legend>Messages aux abonnés</legend>
          {OPTIONS.map(([cle, libelle, aide]) => (
            <label key={cle} className="gs-interrupteur">
              <input type="checkbox" checked={v[cle] === 'true'} onChange={(e) => maj(cle, String(e.target.checked))} />
              <span>
                {libelle}
                {aide ? <span className="gs-discret">{aide}</span> : null}
              </span>
            </label>
          ))}
        </fieldset>
        <div className="gs-actions-ligne">
          <button className="gs-bouton gs-bouton--plein" disabled={occupe}>Enregistrer</button>
        </div>
      </form>
    </>
  );
}
