import { CARTE_KINSHASA, CARTE_PROVINCE } from '@/lib/carte-kinshasa';
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
  const province = CARTE_PROVINCE;
  /** Communes assez grandes pour porter leur nom sur la mini-carte. */
  const nommees = new Set(['Maluku', 'Nsele', 'Mont-Ngafula']);

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

      <div className="carte-province">
        <svg
          className="carte-province__carte"
          viewBox={`0 0 ${province.largeur} ${province.hauteur}`}
          role="img"
          aria-label={t.zones.carteProvinceDescription}
        >
          <rect width={province.largeur} height={province.hauteur} fill="#EEF4F0" />
          {province.communes.map((commune) => {
            const ouverte = ouvertes.has(cle(commune.nom));
            return (
              <path
                key={commune.nom}
                d={commune.d}
                fill={ouverte ? '#0F6B37' : '#DCEBE1'}
                fillRule="evenodd"
                stroke={ouverte ? '#0F6B37' : '#FFFFFF'}
                strokeWidth={1.2}
                strokeLinejoin="round"
              >
                <title>{commune.nom}</title>
              </path>
            );
          })}
          <rect
            x={province.cadre.x}
            y={province.cadre.y}
            width={province.cadre.largeur}
            height={province.cadre.hauteur}
            fill="none"
            stroke="#13211A"
            strokeWidth={1.6}
            strokeDasharray="5 3"
          />
          <text
            x={province.cadre.x + province.cadre.largeur / 2}
            y={province.cadre.y + province.cadre.hauteur + 15}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="#13211A"
          >
            {t.zones.carteProvinceCadre}
          </text>
          {province.communes
            .filter((commune) => nommees.has(commune.nom))
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
        <span className="discret carte-kinshasa__note">
          {t.zones.carteAttribution}.
        </span>
      </figcaption>
    </figure>
  );
}
