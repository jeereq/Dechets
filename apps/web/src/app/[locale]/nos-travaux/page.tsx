import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BandeauContact } from '@/components/BandeauContact';
import { Entete } from '@/components/Entete';
import { Icone } from '@/components/Icone';
import { PiedDePage } from '@/components/PiedDePage';
import { estLocale, getDictionnaire } from '@/lib/i18n';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!estLocale(locale)) return {};
  return { title: getDictionnaire(locale).travaux.titre };
}

const TERRAIN: Array<[string, string, string]> = [
  ['collecte.jpg', 'Collecte', 'Des agents gantés trient et chargent les déchets.'],
  ['tri-cote.jpg', 'Notre tricycle', 'Il entre dans les avenues étroites, là où le camion ne passe pas.'],
  ['tri-agent.jpg', 'Au volant', 'Un agent conduit le tricycle sur sa tournée.'],
  ['camion.jpg', 'Le camion compacteur', 'Pour les volumes et le transport hors du quartier.'],
  ['tri-face.jpg', 'Prêt à partir', 'Le tricycle au départ du dépôt.'],
  ['équipe-large.jpg', 'Nos équipes', 'Casque, gilet et materiel adapté pour chaque agent.'],
];

export default async function Travaux({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);

  return (
    <>
      <Entete locale={locale} page="travaux" />

      <main>
        <section className="bandeau-sombre">
          <div className="conteneur section">
            <div className="pile" style={{ maxWidth: 760, gap: 14 }}>
              <h1>{t.travaux.titre}</h1>
              <p className="chapeau">{t.travaux.chapeau}</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.travaux.terrainTitre}</h2>
            <div className="grille">
              {TERRAIN.map(([fichier, titre, texte]) => (
                <figure key={fichier}>
                  <Image
                    src={`/photos/${fichier}`}
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
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.travaux.avantApresTitre}</h2>
            <div
              className="grille"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))' }}
            >
              <PaireAvantApres
                lieu="[Lieu 1]"
                avant="/photos/collecte.jpg"
                etiquettes={{ avant: t.travaux.avant, apres: t.travaux.apres, manquante: t.commun.photoAFournir }}
              />
              <PaireAvantApres
                lieu="[Lieu 2]"
                etiquettes={{ avant: t.travaux.avant, apres: t.travaux.apres, manquante: t.commun.photoAFournir }}
              />
            </div>
            <p className="discret">{t.travaux.avantApresNote}</p>
          </div>
        </section>
      </main>

      <BandeauContact locale={locale} titre={t.travaux.contactTitre} texte={t.travaux.contactTexte} />
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
          <div className="photo-manquante" style={{ height: 190 }}>
            <Icone nom="appareil-photo" taille={28} epaisseur={1.7} />
            {etiquettes.avant} — {etiquettes.manquante}
          </div>
        )}

        <div className="photo-manquante" style={{ height: 190 }}>
          <Icone nom="appareil-photo" taille={28} epaisseur={1.7} />
          {etiquettes.apres} — {etiquettes.manquante}
        </div>
      </div>
      <strong style={{ fontSize: 19 }}>{lieu}</strong>
      <span className="discret">[Date] · Limete</span>
    </div>
  );
}
