import Image from 'next/image';
import Link from 'next/link';
import {
  CHEMINS,
  ETIQUETTES_LOCALES,
  LOCALES,
  getDictionnaire,
  lien,
  type Locale,
} from '@/lib/i18n';

const PAGES: Array<keyof typeof CHEMINS> = [
  'accueil',
  'services',
  'travaux',
  'zones',
  'valorisation',
  'formules',
  'questions',
];

export function Entete({ locale, page }: { locale: Locale; page: keyof typeof CHEMINS }) {
  const t = getDictionnaire(locale);

  const liens = PAGES.map((cle) => (
    <Link
      key={cle}
      href={lien(locale, cle)}
      className="nav__lien"
      aria-current={cle === page ? 'page' : undefined}
    >
      {t.nav[cle]}
    </Link>
  ));

  const langues = LOCALES.map((l) => (
    <Link key={l} href={lien(l, page)} aria-current={l === locale ? 'true' : undefined} hrefLang={l}>
      {ETIQUETTES_LOCALES[l]}
    </Link>
  ));

  return (
    <header className="entete">
      <div className="entete__barre">
        <Link
          href={lien(locale, 'accueil')}
          className="entete__logo"
          aria-label={`${t.meta.nomSite}, accueil`}
        >
          <Image src="/logo-benime.png" alt="BENIME CONGO" width={180} height={42} priority />
        </Link>

        <nav className="nav nav--bureau" aria-label="Principale">
          {liens}
        </nav>

        <div className="entete__actions">
          <div className="langues langues--bureau" role="group" aria-label="Langue du site">
            {langues}
          </div>

          <a className="bouton bouton--principal bouton--auto" href="#espace">
            {t.nav.espace}
          </a>

          {/* Menu des petits écrans : un simple details, sans JavaScript. */}
          <details className="menu">
            <summary className="menu__bouton" aria-label="Ouvrir le menu">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>

            <div className="menu__panneau">
              <nav className="nav" aria-label="Menu" style={{ flexDirection: 'column' }}>
                {liens}
              </nav>
              <div className="langues menu__langues" role="group" aria-label="Langue du site">
                {langues}
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
