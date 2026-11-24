'use client';

import Link from 'next/link';
import type { KeyboardEvent } from 'react';
import type { CommunePublique } from '@benime/shared';
import { CARTE_KINSHASA, CARTE_PROVINCE } from '@/lib/carte-kinshasa';
import { getDictionnaire, lien, type Locale } from '@/lib/i18n';
import { CarteCamions } from './CarteCamions';
import { useCommuneChoisie } from './CommuneChoisie';

/** "Mont Ngafula", "Mont-Ngafula" et "mont-ngafula" designent la meme commune. */
function cle(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '');
}

/** Cadrage de la grande carte : le cœur urbain ; le sud désert est sur la mini-carte de la province. */
const VUE_Y = 28;
const VUE_H = 660;

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
      document
        .getElementById('carte-panneau')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
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

  const panneau = (
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
            <button
              type="button"
              className="bouton bouton--secondaire"
              onClick={() => choisir(null)}
            >
              {t.zones.panneauFermer}
            </button>
          </div>
        </>
      ) : (
        <p className="discret">{t.zones.carteChoisir}</p>
      )}
    </div>
  );

  return (
    <figure className="carte-kinshasa">
      <div className="zones-grille">
        <div className="zones-carte">
          <div
            className="carte-kinshasa__cadre"
            tabIndex={0}
            role="region"
            aria-label={t.zones.carteDescription}
          >
            <svg
              viewBox={`0 ${VUE_Y} ${largeur} ${VUE_H}`}
              width={largeur}
              height={VUE_H}
              role="group"
              aria-label={
                nbOuvertes.length
                  ? `${t.zones.carteDescription} : ${nbOuvertes.join(', ')}`
                  : t.zones.carteDescription
              }
            >
              <defs>
                <radialGradient id="zones-fond" cx="62%" cy="30%" r="85%">
                  <stop offset="0" stopColor="#17613a" />
                  <stop offset="1" stopColor="#0a3520" />
                </radialGradient>
                <pattern id="zones-points" width="26" height="26" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.07)" />
                </pattern>
                <linearGradient id="zones-lingwala" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4be07a" />
                  <stop offset="1" stopColor="#1fa855" />
                </linearGradient>
              </defs>
              <rect y={VUE_Y} width={largeur} height={VUE_H} fill="url(#zones-fond)" />
              <rect y={VUE_Y} width={largeur} height={VUE_H} fill="url(#zones-points)" />

              {ordonnees(CARTE_KINSHASA.communes).map((commune) => (
                <path
                  key={commune.nom}
                  d={commune.d}
                  fill={ouverte(commune) ? 'url(#zones-lingwala)' : 'rgba(255,255,255,0.1)'}
                  fillRule="evenodd"
                  stroke={ouverte(commune) ? '#baf5cc' : 'rgba(255,255,255,0.42)'}
                  strokeWidth={ouverte(commune) ? 2.4 : 1.4}
                  strokeLinejoin="round"
                  {...proprietes(commune, true)}
                >
                  <title>{commune.nom}</title>
                </path>
              ))}

              {CARTE_KINSHASA.communes
                .filter((commune) => !ouverte(commune))
                .map((commune) => (
                  <text
                    key={commune.nom}
                    x={commune.x}
                    y={commune.y}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    letterSpacing={0.3}
                    fill="rgba(255,255,255,0.92)"
                    stroke="rgba(8,40,24,0.85)"
                    strokeWidth={3.2}
                    paintOrder="stroke"
                    pointerEvents="none"
                  >
                    {commune.nom}
                  </text>
                ))}

              {/* commune(s) desservie(s) : repère qui pulse et étiquette */}
              {CARTE_KINSHASA.communes.filter(ouverte).map((commune) => {
                const dx = commune.nom === 'Lingwala' ? -78 : 0;
                const dy = commune.nom === 'Lingwala' ? -52 : -24;
                return (
                  <g key={commune.nom} pointerEvents="none">
                    <circle className="carte-pulse" cx={commune.x} cy={commune.y} r="9" />
                    <circle
                      className="carte-pulse carte-pulse--decale"
                      cx={commune.x}
                      cy={commune.y}
                      r="9"
                    />
                    <circle
                      cx={commune.x}
                      cy={commune.y}
                      r="5"
                      fill="#f5a800"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <line
                      x1={commune.x}
                      y1={commune.y}
                      x2={commune.x + dx + 38}
                      y2={commune.y + dy + 12}
                      stroke="#f5a800"
                      strokeWidth="1.6"
                    />
                    <rect
                      x={commune.x + dx - 36}
                      y={commune.y + dy - 14}
                      width="148"
                      height="30"
                      rx="15"
                      fill="#f5a800"
                    />
                    <text
                      x={commune.x + dx + 38}
                      y={commune.y + dy + 6}
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="800"
                      letterSpacing="0.6"
                      fill="#0b3c22"
                    >
                      {commune.nom.toUpperCase()}
                    </text>
                  </g>
                );
              })}

              {/* repères : nord et échelle (1 unité ≈ 40 m, donc 250 unités ≈ 10 km) */}
              <g
                transform={`translate(${largeur - 46} ${VUE_Y + 46})`}
                pointerEvents="none"
                fill="#fff"
              >
                <circle r="22" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.35)" />
                <path d="M0 -15L7 8L0 3L-7 8Z" />
                <text y="-24" textAnchor="middle" fontSize="12" fontWeight="800">
                  N
                </text>
              </g>
              <g transform={`translate(34 ${VUE_Y + VUE_H - 30})`} pointerEvents="none">
                <path d="M0 0V8H250V0M125 4V8" fill="none" stroke="#fff" strokeWidth="2" />
                <text x="125" y="-6" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
                  {t.zones.echelleKm}
                </text>
              </g>
            </svg>
          </div>

          <div className="carte-province">
            <svg
              className="carte-province__carte"
              viewBox={`0 0 ${province.largeur} ${province.hauteur}`}
              role="group"
              aria-label={t.zones.carteProvinceDescription}
            >
              <rect width={province.largeur} height={province.hauteur} fill="#0d4426" />
              {ordonnees(province.communes).map((commune) => (
                <path
                  key={commune.nom}
                  d={commune.d}
                  fill={ouverte(commune) ? '#4be07a' : 'rgba(255,255,255,0.12)'}
                  fillRule="evenodd"
                  stroke={ouverte(commune) ? '#baf5cc' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={1}
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
                stroke="#f5a800"
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
                fill="#f5a800"
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
                    fill="rgba(255,255,255,0.92)"
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
        </div>

        <div className="zones-cote">
          {panneau}

          <div className="carte-detail">
            <div className="carte-detail__vue" role="img" aria-label={t.zones.detailTitre}>
              <CarteCamions voile="aucun" echelle={2.1} centre />
              <span className="carte-detail__etiquette">{t.zones.detailEtiquette}</span>
            </div>
            <div className="carte-detail__texte">
              <h3>{t.zones.detailTitre}</h3>
              <p>{t.zones.detailTexte}</p>
            </div>
          </div>
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
