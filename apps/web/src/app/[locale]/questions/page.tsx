import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BandeauContact } from '@/components/BandeauContact';
import { Entete } from '@/components/Entete';
import { Icone } from '@/components/Icone';
import { PiedDePage } from '@/components/PiedDePage';
import { TitrePage } from '@/components/TitrePage';
import { getCommunes } from '@/lib/api';
import { estLocale, getDictionnaire, lien } from '@/lib/i18n';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!estLocale(locale)) return {};
  return { title: getDictionnaire(locale).questions.titre };
}

export default async function Questions({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);
  const communes = await getCommunes();
  const ouvertes = communes.filter((commune) => commune.statut === 'OUVERTE');

  return (
    <>
      <Entete locale={locale} page="questions" />

      <main>
        <TitrePage
          titre={t.questions.titre}
          chapeau={t.questions.chapeau}
          photo="/photos/equipe-large.jpg"
          alt="Équipe BENIME à Kinshasa"
        />

        <section className="section">
          <div className="conteneur">
            <div style={{ maxWidth: 860 }}>
              {t.questions.items.map((item, index) => (
                <details key={item.q} className="question" open={index === 0}>
                  <summary>
                    {item.q}
                    <span aria-hidden="true" style={{ color: 'var(--vert)', display: 'flex' }}>
                      <Icone nom="plus" taille={26} epaisseur={2.4} />
                    </span>
                  </summary>

                  {item.r === 'communes' ? (
                    <div className="question__reponse">
                      {ouvertes.length ? (
                        <>
                          <p>{t.questions.communesIntro}</p>
                          <ul className="communes" style={{ margin: '12px 0' }}>
                            {ouvertes.map((commune) => (
                              <li key={commune.slug} className="commune commune--ouverte">
                                <Icone nom="check" taille={18} epaisseur={3} />
                                {commune.nom}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p>{t.questions.communesAucune}</p>
                      )}
                      <p>
                        {t.questions.communesSuite}{' '}
                        <Link
                          href={lien(locale, 'zones')}
                          style={{ color: 'var(--vert)', fontWeight: 700, textDecoration: 'underline' }}
                        >
                          {t.nav.zones}
                        </Link>
                      </p>
                    </div>
                  ) : (
                    <p className="question__reponse">{item.r}</p>
                  )}
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BandeauContact
        locale={locale}
        titre={t.contact.titre}
        texte={t.contact.texte}
      />
      <PiedDePage locale={locale} />
    </>
  );
}
