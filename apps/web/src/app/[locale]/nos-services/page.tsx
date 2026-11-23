import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BandeauContact } from '@/components/BandeauContact';
import { Entete } from '@/components/Entete';
import { Icone } from '@/components/Icone';
import { PiedDePage } from '@/components/PiedDePage';
import { TitrePage } from '@/components/TitrePage';
import { estLocale, getDictionnaire, lien } from '@/lib/i18n';
import { VISUELS_SERVICES } from '@/lib/services';
import { COORDONNEES } from '@/lib/societe';
import { metaPage } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!estLocale(locale)) return {};
  const t = getDictionnaire(locale).services;
  return metaPage({ locale, chemin: 'nos-services', titre: t.titre, description: t.chapeau });
}

export default async function Services({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);
  const s = t.services;

  return (
    <>
      <Entete locale={locale} page="services" />

      <main>
        <TitrePage
          surtitre={s.surtitre}
          titre={s.titre}
          chapeau={s.chapeau}
          photo="/photos/equipe-large.jpg"
          alt="Équipe BENIME à Kinshasa"
        />

        <section className="section section--serree">
          <div className="conteneur pile" style={{ gap: 20 }}>
            <h2>{s.sommaireTitre}</h2>
            <div className="grille grille--cinq">
              {s.items.map((item) => {
                const visuel = VISUELS_SERVICES[item.id];
                return (
                  <Link key={item.id} href={`${lien(locale, 'services')}/${item.id}`} className="carte carte--lien">
                    <span className="pastille">
                      <Icone nom={visuel.icone ?? 'check'} taille={26} epaisseur={1.9} />
                    </span>
                    <strong style={{ fontSize: 18 }}>{item.titre}</strong>
                    <span className="discret">{item.accroche}</span>
                  </Link>
                );
              })}
            </div>
            <p className="discret">{s.note}</p>
          </div>
        </section>

        {s.items.map((item, index) => {
          const visuel = VISUELS_SERVICES[item.id];
          const estAssainissement = item.id === 'assainissement';
          const sujet = encodeURIComponent(`${s.sujetDevis} · ${item.titre}`);

          return (
            <section
              key={item.id}
              id={item.id}
              className={`section service-section ${index % 2 === 0 ? 'section--pale' : 'section--blanche'}`}
            >
              <div className={`conteneur service ${index % 2 === 1 ? 'service--inverse' : ''}`}>
                <div className="service__media">
                  <Image
                    src={`/photos/${visuel.photos[0].fichier}`}
                    alt={visuel.photos[0].alt}
                    width={720}
                    height={450}
                    sizes="(max-width: 860px) 100vw, 50vw"
                  />
                </div>

                <div className="service__texte pile" style={{ gap: 16 }}>
                  <span className="pastille">
                    <Icone nom={visuel.icone ?? 'check'} taille={28} epaisseur={1.9} />
                  </span>
                  <h2>{item.titre}</h2>
                  <p className="chapeau chapeau--encre">{item.accroche}</p>
                  <p className="discret" style={{ fontSize: 18 }}>
                    {item.texte}
                  </p>

                  <strong>{s.inclusTitre}</strong>
                  <ul className="liste-points">
                    {item.points.map((point) => (
                      <li key={point}>
                        <span style={{ color: 'var(--vert)', display: 'flex' }}>
                          <Icone nom="check" taille={22} epaisseur={3} />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <Link className="bouton bouton--principal" href={`${lien(locale, 'services')}/${item.id}`}>
                      {s.ficheCta}
                    </Link>
                    {estAssainissement ? (
                      <>
                        <Link className="bouton bouton--secondaire" href={lien(locale, 'formules')}>
                          {t.nav.formules}
                        </Link>
                      </>
                    ) : (
                      <>
                        <a className="bouton bouton--secondaire" href={`mailto:${COORDONNEES.email}?subject=${sujet}`}>
                          {s.devis}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </main>

      <BandeauContact locale={locale} titre={s.contactTitre} texte={s.contactTexte} />
      <PiedDePage locale={locale} />
    </>
  );
}
