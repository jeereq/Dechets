import { CARTE_KINSHASA } from '@/lib/carte-kinshasa';
import { getDictionnaire, type Locale } from '@/lib/i18n';

/** "Mont Ngafula", "Mont-Ngafula" et "mont-ngafula" designent la meme commune. */
function cle(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '');
}

/**
 * Carte des communes de Kinshasa, dessinee a partir des limites
 * administratives d'OpenStreetMap. Les communes desservies sont en vert.
 */
export function CarteZones({
  locale,
  communesOuvertes,
}: {
  locale: Locale;
  communesOuvertes: string[];
}) {
  const t = getDictionnaire(locale);
  const ouvertes = new Set(communesOuvertes.map(cle));
  const { largeur, hauteur, communes } = CARTE_KINSHASA;

  return (
    <figure className="carte-kinshasa">
      <div className="carte-kinshasa__cadre" tabIndex={0} role="region" aria-label={t.zones.carteDescription}>
        <svg
          viewBox={`0 0 ${largeur} ${hauteur}`}
          width={largeur}
          height={hauteur}
          role="img"
          aria-label={
            communesOuvertes.length
              ? `${t.zones.carteDescription} : ${communesOuvertes.join(', ')}`
              : t.zones.carteDescription
          }
        >
          <rect width={largeur} height={hauteur} fill="#EEF4F0" />
          {communes.map((commune) => {
            const ouverte = ouvertes.has(cle(commune.nom));
            return (
              <path
                key={commune.nom}
                d={commune.d}
                fill={ouverte ? '#0F6B37' : '#DCEBE1'}
                fillRule="evenodd"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinejoin="round"
              >
                <title>{commune.nom}</title>
              </path>
            );
          })}
          {communes.map((commune) => {
            const ouverte = ouvertes.has(cle(commune.nom));
            return (
              <text
                key={commune.nom}
                x={commune.x}
                y={commune.y}
                textAnchor="middle"
                fontSize={ouverte ? 15 : 11}
                fontWeight={700}
                fill={ouverte ? '#FFFFFF' : '#13211A'}
                pointerEvents="none"
              >
                {commune.nom}
              </text>
            );
          })}
        </svg>
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
        <span className="discret carte-kinshasa__note">
          {t.zones.carteHorsCadre} {t.zones.carteAttribution}.
        </span>
      </figcaption>
    </figure>
  );
}
