import { Icone } from './Icone';
import { getDictionnaire, type Locale } from '@/lib/i18n';

/**
 * Emplacement de la carte des zones.
 *
 * Volontairement un cadre et non un dessin : les frontieres des communes de
 * Kinshasa ne sont pas connues du projet, et une carte approximative sur un
 * site public serait pire que pas de carte. A remplacer par une carte
 * interactive (OpenStreetMap ou Google Maps) qui colore les communes ouvertes.
 */
export function CarteZones({
  locale,
  communesOuvertes,
  hauteur = 440,
}: {
  locale: Locale;
  communesOuvertes: string[];
  hauteur?: number;
}) {
  const t = getDictionnaire(locale);
  const etiquette = communesOuvertes[0];

  return (
    <div
      className="carte-zones"
      style={{ height: hauteur }}
      role="img"
      aria-label={
        communesOuvertes.length
          ? `Carte de Kinshasa : ${communesOuvertes.join(', ')} ${
              communesOuvertes.length > 1 ? 'sont desservies' : 'est desservie'
            }`
          : 'Carte de Kinshasa : aucune commune desservie pour le moment'
      }
    >
      <div className="carte-zones__quadrillage" />

      {etiquette ? (
        <div className="carte-zones__repere">
          <span className="carte-zones__etiquette">
            {etiquette} · {t.zones.legendeOuverte.toLowerCase()}
          </span>
          <span style={{ color: 'var(--vert)', display: 'flex' }}>
            <Icone nom="epingle" taille={34} epaisseur={2.2} />
          </span>
        </div>
      ) : null}

      {hauteur >= 380 ? <p className="carte-zones__note">{t.zones.carteNote}</p> : null}

      <div className="carte-zones__legende">
        <span className="surtitre">{t.zones.legende}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            aria-hidden="true"
            style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--vert)' }}
          />
          {t.zones.legendeOuverte}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            aria-hidden="true"
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              background: 'var(--blanc)',
              border: '1.5px solid var(--contour)',
            }}
          />
          {t.zones.legendeFermee}
        </span>
      </div>
    </div>
  );
}
