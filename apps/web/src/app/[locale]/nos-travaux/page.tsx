import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BandeauContact } from '@/components/BandeauContact';
import { Entete } from '@/components/Entete';
import { GalerieTravaux } from '@/components/GalerieTravaux';
import { Icone } from '@/components/Icone';
import { PiedDePage } from '@/components/PiedDePage';
import { TitrePage } from '@/components/TitrePage';
import { estLocale, getDictionnaire } from '@/lib/i18n';
import { metaPage } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!estLocale(locale)) return {};
  const t = getDictionnaire(locale).travaux;
  return metaPage({ locale, chemin: 'nos-travaux', titre: t.titre, description: t.chapeau });
}

const NB_PHOTOS = { rencontre: 10, tricycle: 4, reunion: 8 } as const;
const GROUPES = ['rencontre', 'tricycle', 'reunion'] as const;

/** Photos de la section « Sur le terrain », dans l'ordre des textes du dictionnaire. */
const PHOTOS_TERRAIN = [
  'collecte.jpg',
  'tri-cote.jpg',
  'tri-arriere.jpg',
  'camion.jpg',
  'tri-face.jpg',
  'equipe-epi.jpg',
] as const;

export default async function Travaux({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);

  return (
    <>
      <Entete locale={locale} page="travaux" />

      <main>
        <TitrePage
          titre={t.travaux.titre}
          chapeau={t.travaux.chapeau}
          photo="/photos/tri-profil.jpg"
          alt="Le tricycle de collecte BENIME à Kinshasa"
        />

        <section className="section">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.travaux.terrainTitre}</h2>
            <div className="grille">
              {t.travaux.terrain.map(({ titre, texte }, index) => (
                <figure key={titre}>
                  <Image
                    src={`/photos/${PHOTOS_TERRAIN[index]}`}
                    alt={titre}
                    width={560}
                    height={210}
                    sizes="(max-width: 860px) 100vw, 33vw"
                  />
                  <figcaption>
                    <strong style={{ display: 'block', fontSize: 19 }}>{titre}</strong>
                    <span className="discret">{texte}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--pale">
          <div className="conteneur pile" style={{ gap: 36 }}>
            <div className="pile" style={{ gap: 10, maxWidth: 760 }}>
              <h2>{t.travaux.galeriesTitre}</h2>
              <p className="chapeau">{t.travaux.galeriesChapeau}</p>
            </div>
            {GROUPES.map((groupe, g) => {
              const texte = t.travaux.galeries[g]!;
              const photos = Array.from({ length: NB_PHOTOS[groupe] }, (_, i) => ({
                src: `/photos/travaux/${groupe}-${String(i + 1).padStart(2, '0')}.jpg`,
                alt: texte.alt,
              }));
              return (
                <div key={groupe} className="pile" style={{ gap: 14 }}>
                  <div>
                    <h3>{texte.titre}</h3>
                    <p className="discret">{texte.texte}</p>
                  </div>
                  <GalerieTravaux photos={photos} textes={t.travaux.lightbox} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="section">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.travaux.avantApresTitre}</h2>
            <div
              className="grille"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))' }}
            >
              <PaireAvantApres
                lieu="[Lieu 1]"
                avant="/photos/collecte.jpg"
                etiquettes={{
                  avant: t.travaux.avant,
                  apres: t.travaux.apres,
                  manquante: t.commun.photoAFournir,
                }}
              />
              <PaireAvantApres
                lieu="[Lieu 2]"
                etiquettes={{
                  avant: t.travaux.avant,
                  apres: t.travaux.apres,
                  manquante: t.commun.photoAFournir,
                }}
              />
            </div>
            <p className="discret">{t.travaux.avantApresNote}</p>
          </div>
        </section>
      </main>

      <BandeauContact
        locale={locale}
        titre={t.travaux.contactTitre}
        texte={t.travaux.contactTexte}
      />
      <PiedDePage locale={locale} />
    </>
  );
}

function PaireAvantApres({
  lieu,
  avant,
  etiquettes,
}: {
  lieu: string;
  avant?: string;
  etiquettes: { avant: string; apres: string; manquante: string };
}) {
  return (
    <div className="carte" style={{ gap: 10, padding: 16, borderRadius: 'var(--r-lg)' }}>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}
      >
        {avant ? (
          <div style={{ position: 'relative', borderRadius: 'var(--r)', overflow: 'hidden' }}>
            <Image
              src={avant}
              alt={`${etiquettes.avant} · ${lieu}`}
              width={320}
              height={190}
              style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }}
            />
            <span
              style={{
                position: 'absolute',
                left: 8,
                bottom: 8,
                padding: '2px 10px',
                borderRadius: 999,
                background: 'var(--vert-fonce)',
                color: 'var(--blanc)',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {etiquettes.avant}
            </span>
          </div>
        ) : (
          <div className="photo-manquante" style={{ height: 190, aspectRatio: 'auto' }}>
            <Icone nom="appareil-photo" taille={28} epaisseur={1.7} />
            {etiquettes.avant} — {etiquettes.manquante}
          </div>
        )}

        <div className="photo-manquante" style={{ height: 190, aspectRatio: 'auto' }}>
          <Icone nom="appareil-photo" taille={28} epaisseur={1.7} />
          {etiquettes.apres} — {etiquettes.manquante}
        </div>
      </div>
      <strong style={{ fontSize: 19 }}>{lieu}</strong>
      <span className="discret">[Date] · Lingwala</span>
    </div>
  );
}
