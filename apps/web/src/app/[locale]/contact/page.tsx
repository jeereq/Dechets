import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { DonneesStructurees } from '@/components/DonneesStructurees';
import { Entete } from '@/components/Entete';
import { FormulaireContact } from '@/components/FormulaireContact';
import { Icone } from '@/components/Icone';
import { PiedDePage } from '@/components/PiedDePage';
import { TitrePage } from '@/components/TitrePage';
import { getCommunes } from '@/lib/api';
import { estLocale, getDictionnaire, lien } from '@/lib/i18n';
import { groupesOffres } from '@/lib/offres';
import { metaPage } from '@/lib/seo';
import { COORDONNEES, telLien } from '@/lib/societe';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!estLocale(locale)) return {};
  const t = getDictionnaire(locale).questions;
  return metaPage({ locale, chemin: 'contact', titre: t.titre, description: t.chapeau });
}

export default async function Questions({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);
  const communes = await getCommunes();
  const ouvertes = communes.filter((commune) => commune.statut === 'OUVERTE');

  return (
    <>
      {/* Reponses statiques seulement : celle des communes change avec la base. */}
      <DonneesStructurees
        donnees={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: t.questions.items
            .filter((item) => item.r !== 'communes')
            .map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.r },
            })),
        }}
      />
      <Entete locale={locale} page="questions" />

      <main>
        <TitrePage
          titre={t.questions.titre}
          chapeau={t.questions.chapeau}
          photo="/photos/equipe-large.jpg"
          alt="Équipe BENIME à Kinshasa"
        />

        <section className="section">
          <div
            className="conteneur"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '32px 56px', alignItems: 'flex-start' }}
          >
            <div id="ecrire" className="pile" style={{ flex: '1 1 420px', minWidth: 0, gap: 20, scrollMarginTop: 96 }}>
              <h2>{t.questions.ecrireTitre}</h2>
              <Suspense fallback={null}>
                <FormulaireContact locale={locale} etiquettes={t.questions.formulaire} offres={groupesOffres(locale)} />
              </Suspense>
            </div>

            <div className="pile" style={{ flex: '1 1 320px', gap: 16 }}>
              <h2>{t.questions.coordonneesTitre}</h2>
              {[
                { cle: t.contact.telephone, valeur: COORDONNEES.telephone1, icone: 'telephone', href: telLien(COORDONNEES.telephone1) },
                { cle: t.contact.telephone2, valeur: COORDONNEES.telephone2, icone: 'telephone', href: telLien(COORDONNEES.telephone2) },
                { cle: t.contact.email, valeur: COORDONNEES.email, icone: 'courriel', href: `mailto:${COORDONNEES.email}` },
                { cle: t.contact.bureau, valeur: COORDONNEES.adresse, icone: 'epingle', href: undefined },
              ].map(({ cle, valeur, icone, href }) => {
                const contenu = (
                  <>
                    <span className="pastille">
                      <Icone nom={icone as 'telephone'} taille={24} epaisseur={1.9} />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span className="discret">{cle}</span>
                      <strong style={{ fontSize: 18, overflowWrap: 'anywhere' }}>{valeur}</strong>
                    </span>
                  </>
                );
                const style = { flexDirection: 'row', alignItems: 'center', gap: 14 } as const;
                return href ? (
                  <a key={cle} href={href} className="carte carte--lien" style={style}>
                    {contenu}
                  </a>
                ) : (
                  <div key={cle} className="carte" style={style}>
                    {contenu}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section section--pale">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.questions.faqTitre}</h2>
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

      <PiedDePage locale={locale} />
    </>
  );
}
