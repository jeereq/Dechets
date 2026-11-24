'use client';

import Link from 'next/link';
import type { KeyboardEvent } from 'react';
import type { CommunePublique } from '@benime/shared';
import { CARTE_KINSHASA, CARTE_PROVINCE } from '@/lib/carte-kinshasa';
import { getDictionnaire, lien, type Locale } from '@/lib/i18n';
import { useCommuneChoisie } from './CommuneChoisie';

/** "Mont Ngafula", "Mont-Ngafula" et "mont-ngafula" designent la meme commune. */
function cle(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '');
}

type Forme = { nom: string; x: number; y: number; d: string };

/**
 * Carte des communes de Kinshasa, dessinee a partir des limites
 * administratives d'OpenStreetMap. Chaque commune se touche : la carte
 * affiche alors son etat. Les communes desservies sont en vert.
 */
export function CarteZones({ locale, communes }: { locale: Locale; communes: CommunePublique[] }) {
  const t = getDictionnaire(locale);
  const { choisie, choisir } = useCommuneChoisie();
  const { largeur, hauteur } = CARTE_KINSHASA;
  const province = CARTE_PROVINCE;

  const parCle = new Map(communes.map((commune) => [cle(commune.nom), commune]));
  const slugDe = (forme: Forme) => parCle.get(cle(forme.nom))?.slug ?? null;
  const ouverte = (forme: Forme) => parCle.get(cle(forme.nom))?.statut === 'OUVERTE';
  const courante = communes.find((commune) => commune.slug === choisie) ?? null;
  const nbOuvertes = communes.filter((commune) => commune.statut === 'OUVERTE').map((c) => c.nom);

  /** La commune choisie est dessinee en dernier, pour que son contour passe au-dessus des voisines. */
  const ordonnees = (formes: readonly Forme[]) => [
    ...formes.filter((forme) => slugDe(forme) !== choisie),
    ...formes.filter((forme) => slugDe(forme) === choisie),
  ];

  function toucher(forme: Forme) {
    const slug = slugDe(forme);
    if (!slug) return;
    choisir(slug === choisie ? null : slug);
    // sur telephone, le panneau est sous la carte : on l'amene a l'ecran
    requestAnimationFrame(() =>
      document.getElementById('carte-panneau')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
    );
  }

  function auClavier(event: KeyboardEvent, forme: Forme) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toucher(forme);
    }
  }

  const proprietes = (forme: Forme, clavier: boolean) => {
    const slug = slugDe(forme);
    return {
      className: `carte-commune${slug && slug === choisie ? ' carte-commune--choisie' : ''}`,
      onClick: () => toucher(forme),
      ...(clavier
        ? {
            role: 'button' as const,
            tabIndex: 0,
            'aria-pressed': slug === choisie,
            'aria-label': forme.nom,
            onKeyDown: (event: KeyboardEvent) => auClavier(event, forme),
          }
        : {}),
    };
  };

  return (
    <figure className="carte-kinshasa">
      <div className="carte-kinshasa__cadre" tabIndex={0} role="region" aria-label={t.zones.carteDescription}>
        <svg
          viewBox={`0 0 ${largeur} ${hauteur}`}
          width={largeur}
          height={hauteur}
          role="group"
          aria-label={
            nbOuvertes.length
              ? `${t.zones.carteDescription} : ${nbOuvertes.join(', ')}`
              : t.zones.carteDescription
          }
        >
          <rect width={largeur} height={hauteur} fill="#EEF4F0" />
          {ordonnees(CARTE_KINSHASA.communes).map((commune) => (
            <path
              key={commune.nom}
              d={commune.d}
              fill={ouverte(commune) ? '#0F6B37' : '#DCEBE1'}
              fillRule="evenodd"
              stroke="#FFFFFF"
              strokeWidth={2.2}
              strokeLinejoin="round"
              {...proprietes(commune, true)}
            >
              <title>{commune.nom}</title>
            </path>
          ))}
          {CARTE_KINSHASA.communes.map((commune) => (
            <text
              key={commune.nom}
              x={commune.x}
              y={commune.y}
              textAnchor="middle"
              fontSize={ouverte(commune) ? 15 : 11}
              fontWeight={700}
              fill={ouverte(commune) ? '#FFFFFF' : '#13211A'}
              pointerEvents="none"
            >
              {commune.nom}
            </text>
          ))}
        </svg>
      </div>

      <div className="carte-panneau" id="carte-panneau" role="status" aria-live="polite">
        {courante ? (
          <>
            <div className="carte-panneau__tete">
              <h3>{courante.nom}</h3>
              <span
                className={`etat ${courante.statut === 'OUVERTE' ? 'etat--ok' : 'etat--attente'}`}
              >
                {courante.statut === 'OUVERTE' ? t.zones.legendeOuverte : t.zones.legendeFermee}
              </span>
            </div>
            <p>
              {courante.statut === 'OUVERTE'
                ? t.zones.panneauDesservie
                : courante.statut === 'DEMANDES_RECUES'
                  ? t.zones.panneauDemandes
                  : t.zones.panneauFermee}
            </p>
            <div className="carte-panneau__actions">
              {courante.statut === 'OUVERTE' ? (
                <Link className="bouton bouton--principal" href={lien(locale, 'formules')}>
                  {t.zones.panneauFormules}
                </Link>
              ) : (
                <a className="bouton bouton--soleil" href="#prevenir">
                  {t.zones.panneauPrevenir}
                </a>
              )}
              <button type="button" className="bouton bouton--secondaire" onClick={() => choisir(null)}>
                {t.zones.panneauFermer}
              </button>
            </div>
          </>
        ) : (
          <p className="discret">{t.zones.carteChoisir}</p>
        )}
      </div>

      <div className="carte-province">
        <svg
          className="carte-province__carte"
          viewBox={`0 0 ${province.largeur} ${province.hauteur}`}
          role="group"
          aria-label={t.zones.carteProvinceDescription}
        >
          <rect width={province.largeur} height={province.hauteur} fill="#EEF4F0" />
          {ordonnees(province.communes).map((commune) => (
            <path
              key={commune.nom}
              d={commune.d}
              fill={ouverte(commune) ? '#0F6B37' : '#DCEBE1'}
              fillRule="evenodd"
              stroke={ouverte(commune) ? '#0F6B37' : '#FFFFFF'}
              strokeWidth={1.2}
              strokeLinejoin="round"
              {...proprietes(commune, false)}
            >
              <title>{commune.nom}</title>
            </path>
          ))}
          <rect
            x={province.cadre.x}
            y={province.cadre.y}
            width={province.cadre.largeur}
            height={province.cadre.hauteur}
            fill="none"
            stroke="#13211A"
            strokeWidth={1.6}
            strokeDasharray="5 3"
            pointerEvents="none"
          />
          <text
            x={province.cadre.x + province.cadre.largeur / 2}
            y={province.cadre.y + province.cadre.hauteur + 15}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="#13211A"
            pointerEvents="none"
          >
            {t.zones.carteProvinceCadre}
          </text>
          {province.communes
            .filter((commune) => ['Maluku', 'Nsele', 'Mont-Ngafula'].includes(commune.nom))
            .map((commune) => (
              <text
                key={commune.nom}
                x={commune.x}
                y={commune.y}
                textAnchor="middle"
                fontSize={commune.nom === 'Maluku' ? 20 : 13}
                fontWeight={700}
                fill="#13211A"
                pointerEvents="none"
              >
                {commune.nom}
              </text>
            ))}
        </svg>
        <div className="carte-province__texte">
          <h3>{t.zones.carteProvinceTitre}</h3>
          <p>{t.zones.carteProvinceTexte}</p>
        </div>
      </div>

      <figcaption className="carte-kinshasa__pied">
        <span className="carte-kinshasa__legende">
          <span className="carte-kinshasa__puce carte-kinshasa__puce--ouverte" aria-hidden="true" />
          {t.zones.legendeOuverte}
        </span>
        <span className="carte-kinshasa__legende">
          <span className="carte-kinshasa__puce" aria-hidden="true" />
          {t.zones.legendeFermee}
        </span>
        <span className="carte-kinshasa__aide">{t.zones.carteAide}</span>
        <span className="discret carte-kinshasa__note">{t.zones.carteAttribution}.</span>
      </figcaption>
    </figure>
  );
}
