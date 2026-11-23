import { getDictionnaire, type Locale } from '@/lib/i18n';
import { COORDONNEES, MENTIONS } from '@/lib/societe';

export function PiedDePage({ locale }: { locale: Locale }) {
  const t = getDictionnaire(locale);

  return (
    <footer className="pied">
      <div className="pied__contenu">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--encre)' }}>
            BENIME CONGO SARL
          </span>
          <span>{COORDONNEES.adresse}</span>
          <span>
            {COORDONNEES.telephone1} · {COORDONNEES.telephone2}
          </span>
          <span>{COORDONNEES.email}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="surtitre">{t.pied.services}</span>
          {t.pied.listeServices.map((service) => (
            <span key={service} style={{ minHeight: 32, display: 'flex', alignItems: 'center' }}>
              {service}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 15 }}>
          {MENTIONS.map((mention) => (
            <span key={mention}>{mention}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
