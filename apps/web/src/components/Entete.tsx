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
  'travaux',
  'zones',
  'valorisation',
  'formules',
  'questions',
];

export function Entete({ locale, page }: { locale: Locale; page: keyof typeof CHEMINS }) {
  const t = getDictionnaire(locale);

  return (
    <header className="entete">
      <div className="entete__barre">
        <Link href={lien(locale, 'accueil')} aria-label={`${t.meta.nomSite}, accueil`}>
          <Image
            src="/logo-benime.png"
            alt="BENIME CONGO"
            width={200}
            height={50}
            style={{ height: 50, width: 'auto' }}
            priority
          />
        </Link>

        <nav className="nav" aria-label="Principale">
          {PAGES.map((cle) => (
            <Link
              key={cle}
              href={lien(locale, cle)}
              className="nav__lien"
              aria-current={cle === page ? 'page' : undefined}
            >
              {t.nav[cle]}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="langues" role="group" aria-label="Langue du site">
            {LOCALES.map((l) => (
              <Link
                key={l}
                href={lien(l, page)}
                aria-current={l === locale ? 'true' : undefined}
                hrefLang={l}
              >
                {ETIQUETTES_LOCALES[l]}
              </Link>
            ))}
          </div>
          <a className="bouton bouton--principal" href="#espace">
            {t.nav.espace}
          </a>
        </div>
      </div>
    </header>
  );
}
