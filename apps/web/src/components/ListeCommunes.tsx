'use client';

import { useMemo, useState } from 'react';
import type { CommunePublique } from '@benime/shared';
import { useCommuneChoisie } from './CommuneChoisie';
import { Icone } from './Icone';

type Filtre = 'toutes' | 'ouvertes' | 'fermees';

/** Retire les accents pour que « Ndjili » se trouve en tapant « ndjili ». */
const sansAccent = (valeur: string) =>
  valeur
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function ListeCommunes({
  communes,
  etiquettes,
}: {
  communes: CommunePublique[];
  etiquettes: {
    rechercher: string;
    toutes: string;
    ouvertes: string;
    fermees: string;
  };
}) {
  const { choisie, choisir } = useCommuneChoisie();
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('toutes');

  const visibles = useMemo(() => {
    const terme = sansAccent(recherche.trim());

    return communes.filter((commune) => {
      if (filtre === 'ouvertes' && commune.statut !== 'OUVERTE') return false;
      if (filtre === 'fermees' && commune.statut === 'OUVERTE') return false;
      if (!terme) return true;
      return sansAccent(commune.nom).includes(terme);
    });
  }, [communes, filtre, recherche]);

  const filtres: Array<[Filtre, string]> = [
    ['toutes', etiquettes.toutes],
    ['ouvertes', etiquettes.ouvertes],
    ['fermees', etiquettes.fermees],
  ];

  return (
    <div className="pile">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 24px' }}>
        <div className="champ" style={{ flex: '1 1 300px', maxWidth: 420 }}>
          <label htmlFor="recherche-commune" className="visuellement-cache">
            {etiquettes.rechercher}
          </label>
          <input
            id="recherche-commune"
            type="search"
            placeholder={etiquettes.rechercher}
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
          />
        </div>

        <div role="group" aria-label={etiquettes.toutes} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {filtres.map(([cle, libelle]) => (
            <button
              key={cle}
              type="button"
              aria-pressed={filtre === cle}
              className={`bouton ${filtre === cle ? 'bouton--principal' : 'bouton--secondaire'}`}
              onClick={() => setFiltre(cle)}
            >
              {libelle}
            </button>
          ))}
        </div>
      </div>

      <ul className="communes">
        {visibles.map((commune) => (
          <li key={commune.slug}>
            <button
              type="button"
              aria-pressed={choisie === commune.slug}
              className={`commune ${
                commune.statut === 'OUVERTE'
                  ? 'commune--ouverte'
                  : commune.statut === 'DEMANDES_RECUES'
                    ? 'commune--demandes'
                    : ''
              }`}
              onClick={() => {
                choisir(commune.slug);
                document.getElementById('carte-panneau')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }}
            >
              {commune.statut === 'OUVERTE' ? <Icone nom="check" taille={20} epaisseur={3} /> : null}
              {commune.nom}
            </button>
          </li>
        ))}
      </ul>

      {visibles.length === 0 ? (
        <p className="discret">Aucune commune ne correspond à votre recherche.</p>
      ) : null}
    </div>
  );
}
