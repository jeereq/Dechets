import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BandeauContact } from '@/components/BandeauContact';
import { DonneesStructurees } from '@/components/DonneesStructurees';
import { Entete } from '@/components/Entete';
import { Icone } from '@/components/Icone';
import { PiedDePage } from '@/components/PiedDePage';
import { TitrePage } from '@/components/TitrePage';
import { estLocale, getDictionnaire, lien, LOCALES } from '@/lib/i18n';
import { IDS_SERVICES, VISUELS_SERVICES } from '@/lib/services';
import { COORDONNEES, telLien } from '@/lib/societe';
import { metaPage, urlAbsolue } from '@/lib/seo';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => IDS_SERVICES.map((service) => ({ locale, service })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; service: string }>;
}): Promise<Metadata> {
  const { locale, service } = await params;
  if (!estLocale(locale)) return {};
  const item = getDictionnaire(locale).services.items.find((i) => i.id === service);
  return item
    ? metaPage({ locale, chemin: `nos-services/${service}`, titre: item.titre, description: item.accroche })
    : {};
}

export default async function PageService({
  params,
}: {
  params: Promise<{ locale: string; service: string }>;
}) {
  const { locale, service } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);
  const s = t.services;
  const item = s.items.find((i) => i.id === service);
  const visuel = VISUELS_SERVICES[service];
  if (!item || !visuel) notFound();

  const estAssainissement = item.id === 'assainissement';
  const sujet = encodeURIComponent(`${s.sujetDevis} · ${item.titre}`);
  const [principale, ...autresPhotos] = visuel.photos;
  const auteurs = Array.from(new Set(visuel.photos.map((p) => p.auteur).filter(Boolean)));
  const autres = s.items.filter((i) => i.id !== item.id);

  return (
    <>
      <DonneesStructurees
        donnees={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: item.titre,
          description: item.accroche,
          url: urlAbsolue(`/${locale}/nos-services/${service}`),
          provider: { '@type': 'LocalBusiness', name: COORDONNEES.raisonSociale },
          areaServed: 'Kinshasa, CD',
        }}
      />
      <Entete locale={locale} page="services" />

      <main>
        <TitrePage
          surtitre={s.surtitre}
          titre={item.titre}
          chapeau={item.accroche}
          photo={`/photos/${principale.fichier}`}
          alt={principale.alt}
          camions={service === 'assainissement'}
        />

        <section className="section">
          <div className="conteneur pile" style={{ gap: 28 }}>
            <Link href={lien(locale, 'services')} className="lien-retour">
              <span aria-hidden="true">←</span> {s.tousLesServices}
            </Link>

            <p className="chapeau chapeau--encre" style={{ maxWidth: 760 }}>
              {item.texte}
            </p>

            <h2>{s.detailsTitre}</h2>
            <div className="grille grille--trois">
              {item.points.map((point, index) => (
                <div key={point} className="carte pile" style={{ gap: 12 }}>
                  <span className="pastille">
                    <Icone nom={visuel.icone} taille={26} epaisseur={1.9} />
                  </span>
                  <h3>{point}</h3>
                  <p className="discret" style={{ fontSize: 18 }}>
                    {item.details[index]}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {estAssainissement ? (
                <>
                  <Link className="bouton bouton--principal" href={lien(locale, 'formules')}>
                    {t.nav.formules}
                  </Link>
                  <Link className="bouton bouton--secondaire" href={lien(locale, 'zones')}>
                    {t.nav.zones}
                  </Link>
                </>
              ) : (
                <>
                  <a className="bouton bouton--principal" href={`mailto:${COORDONNEES.email}?subject=${sujet}`}>
                    {s.devis}
                  </a>
                  <a className="bouton bouton--secondaire" href={telLien(COORDONNEES.telephone1)}>
                    <Icone nom="telephone" taille={20} />
                    {s.appeler}
                  </a>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="section section--pale">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{s.etapesTitre}</h2>
            <div className="grille grille--trois">
              {item.etapes.map((etape, index) => (
                <div key={etape.titre} className="carte pile" style={{ gap: 10 }}>
                  <span className="etape__numero">{index + 1}</span>
                  <h3>{etape.titre}</h3>
                  <p className="discret" style={{ fontSize: 18 }}>
                    {etape.texte}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="conteneur pile" style={{ gap: 20 }}>
            <h2>{s.galerieTitre}</h2>
            <div className="galerie">
              {autresPhotos.map((photo) => (
                <Image
                  key={photo.fichier}
                  src={`/photos/${photo.fichier}`}
                  alt={photo.alt}
                  width={640}
                  height={440}
                  sizes="(max-width: 860px) 100vw, 33vw"
                />
              ))}
            </div>
            {auteurs.length ? (
              <p className="discret" style={{ fontSize: 15 }}>
                {s.galerieNote} {auteurs.join(', ')}.
              </p>
            ) : null}
          </div>
        </section>

        <section className="section section--pale">
          <div className="conteneur pile" style={{ gap: 20 }}>
            <h2>{s.autresTitre}</h2>
            <div className="grille grille--quatre">
              {autres.map((autre) => (
                <Link key={autre.id} href={`${lien(locale, 'services')}/${autre.id}`} className="carte carte--lien">
                  <span className="pastille">
                    <Icone nom={VISUELS_SERVICES[autre.id]?.icone ?? 'check'} taille={26} epaisseur={1.9} />
                  </span>
                  <strong style={{ fontSize: 18 }}>{autre.titre}</strong>
                  <span className="discret">{autre.accroche}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BandeauContact locale={locale} titre={s.contactTitre} texte={s.contactTexte} />
      <PiedDePage locale={locale} />
    </>
  );
}
