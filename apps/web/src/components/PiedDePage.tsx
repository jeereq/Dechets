import Link from 'next/link';
import { CHEMINS, getDictionnaire, lien, type Locale } from '@/lib/i18n';
import { COORDONNEES, MENTIONS, telLien } from '@/lib/societe';

const PAGES: Array<keyof typeof CHEMINS> = [
  'travaux',
  'zones',
  'valorisation',
  'formules',
  'questions',
];

export function PiedDePage({ locale }: { locale: Locale }) {
  const t = getDictionnaire(locale);

  return (
    <footer className="pied">
      <div className="pied__contenu">
        <div className="pied__colonne">
          <span className="pied__titre">BENIME CONGO SARL</span>
          <span>{COORDONNEES.adresse}</span>
          <a href={telLien(COORDONNEES.telephone1)}>{COORDONNEES.telephone1}</a>
          <a href={telLien(COORDONNEES.telephone2)}>{COORDONNEES.telephone2}</a>
          <a href={`mailto:${COORDONNEES.email}`}>{COORDONNEES.email}</a>
        </div>

        <div className="pied__colonne">
          <span className="surtitre">{t.nav.accueil}</span>
          {PAGES.map((cle) => (
            <Link key={cle} href={lien(locale, cle)}>
              {t.nav[cle]}
            </Link>
          ))}
        </div>

        <div className="pied__colonne">
          <span className="surtitre">{t.pied.services}</span>
          {t.pied.listeServices.map((service) => (
            <span key={service}>{service}</span>
          ))}
        </div>
      </div>

      <div className="pied__bas">
        <div>
          {MENTIONS.map((mention) => (
            <span key={mention}>{mention}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
