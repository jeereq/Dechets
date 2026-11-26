import { ChargementEntete } from './ChargementEntete';
import Image from 'next/image';
import Link from 'next/link';
import {
  CHEMINS,
  ETIQUETTES_LOCALES,
  LOCALES,
  NOMS_LOCALES,
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

  const autresLangues = LOCALES.filter((l) => l !== locale);
  const langue = (variante: 'bureau' | 'menu') => (
    <details className={`langue langue--${variante}`}>
      <summary
        className="langue__bouton"
        aria-label={`Langue du site : ${NOMS_LOCALES[locale]}. Changer de langue`}
      >
        <svg className="langue__globe" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <ellipse className="langue__meridien" cx="12" cy="12" rx="4.2" ry="9.5" />
          <path d="M2.5 12h19M4.2 7.2c2.2 1.3 4.8 2 7.8 2s5.6-.7 7.8-2M4.2 16.8c2.2-1.3 4.8-2 7.8-2s5.6.7 7.8 2" />
        </svg>
        <span>{ETIQUETTES_LOCALES[locale]}</span>
        <svg className="langue__fleche" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <ul className="langue__liste">
        {autresLangues.map((l) => (
          <li key={l}>
            <Link href={lien(l, page)} hrefLang={l} lang={l}>
              {NOMS_LOCALES[l]}
              <span>{ETIQUETTES_LOCALES[l]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );

  return (
    <header className="entete">
      <ChargementEntete libelle={t.commun.chargement} />
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
          {langue('bureau')}

          <Link className="bouton bouton--principal bouton--auto" href={lien(locale, 'espace')}>
            {t.nav.espace}
          </Link>

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
              <div className="menu__langues">{langue('menu')}</div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
