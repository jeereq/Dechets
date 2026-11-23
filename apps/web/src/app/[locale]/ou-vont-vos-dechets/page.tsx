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
  return { title: getDictionnaire(locale).valorisation.titre };
}

const ICONES_CHAINE = ['sac', 'camion', 'recyclage'] as const;

export default async function Valorisation({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);

  return (
    <>
      <Entete locale={locale} page="valorisation" />

      <main>
        <section className="section section--pale">
          <div
            className="conteneur"
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 40 }}
          >
            <div className="pile" style={{ flex: '1 1 440px', gap: 18 }}>
              <span
                className="surtitre"
                style={{ color: 'var(--vert)', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <Icone nom="feuille" taille={24} />
                {t.valorisation.surtitre}
              </span>
              <h1>{t.valorisation.titre}</h1>
              <p className="chapeau" style={{ maxWidth: 540 }}>
                {t.valorisation.chapeau}
              </p>
            </div>
            <div style={{ flex: '1 1 380px' }}>
              <Image
                src="/photos/transport.jpg"
                alt="Camion benne BENIME"
                width={560}
                height={320}
                sizes="(max-width: 860px) 100vw, 50vw"
                style={{ width: '100%', height: 320, objectFit: 'cover', borderRadius: 'var(--r-lg)' }}
                priority
              />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.valorisation.chaineTitre}</h2>
            <div className="grille">
              {t.valorisation.chaine.map((etape, index) => (
                <div key={etape.titre} className="carte" style={{ padding: 28, gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="pastille">
                      <Icone nom={ICONES_CHAINE[index] ?? 'check'} taille={28} epaisseur={1.9} />
                    </span>
                    <span
                      aria-hidden="true"
                      style={{ fontSize: 30, fontWeight: 700, color: 'var(--vert-pale)' }}
                    >
                      0{index + 1}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 26 }}>{etape.titre}</h3>
                  <p className="discret" style={{ fontSize: 18 }}>
                    {etape.texte}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--blanche">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.valorisation.triTitre}</h2>
            <div
              className="grille"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))' }}
            >
              <ListeTri
                titre={t.valorisation.accepte}
                items={t.valorisation.triAccepte}
                positif
              />
              <ListeTri titre={t.valorisation.refuse} items={t.valorisation.triRefuse} />
            </div>
            <p className="discret">{t.valorisation.triNote}</p>
          </div>
        </section>

        <section className="bandeau-sombre">
          <div className="conteneur section">
            <div className="pile" style={{ gap: 24 }}>
              <h2 style={{ maxWidth: 760 }}>{t.valorisation.chiffresTitre}</h2>
              <div
                className="grille"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
                  paddingTop: 8,
                  borderTop: '1px solid #1C5A36',
                }}
              >
                {t.valorisation.chiffres.map((chiffre) => (
                  <div
                    key={chiffre.libelle}
                    style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center' }}
                  >
                    <span className="chiffre" style={{ color: 'var(--soleil)' }}>
                      {chiffre.valeur}
                    </span>
                    <span style={{ color: 'var(--clair)' }}>{chiffre.libelle}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 15, color: 'var(--clair)' }}>{t.valorisation.chiffresNote}</p>
            </div>
          </div>
        </section>
      </main>

      <BandeauContact locale={locale} />
      <PiedDePage locale={locale} />
    </>
  );
}

function ListeTri({
  titre,
  items,
  positif = false,
}: {
  titre: string;
  items: readonly string[];
  positif?: boolean;
}) {
  return (
    <div
      className="carte"
      style={{
        padding: 26,
        background: positif ? 'var(--vert-pale)' : 'var(--blanc)',
        borderColor: positif ? 'var(--vert-pale)' : 'var(--ligne)',
      }}
    >
      <h3>{titre}</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map((item) => (
          <li
            key={item}
            style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, fontSize: 19 }}
          >
            <span style={{ color: positif ? 'var(--vert)' : 'var(--erreur)', display: 'flex' }}>
              <Icone nom={positif ? 'check' : 'croix'} taille={22} epaisseur={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
