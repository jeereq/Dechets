import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BandeauContact } from '@/components/BandeauContact';
import { CarteCamions } from '@/components/CarteCamions';
import { Entete } from '@/components/Entete';
import { Icone } from '@/components/Icone';
import { PiedDePage } from '@/components/PiedDePage';
import { TitrePage } from '@/components/TitrePage';
import { getCommunes, getReglages } from '@/lib/api';
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
  const t = getDictionnaire(locale).valorisation;
  return metaPage({
    locale,
    chemin: 'ou-vont-vos-dechets',
    titre: t.titre,
    description: t.chapeau,
  });
}

const ICONES_CHAINE = ['sac', 'camion', 'recyclage'] as const;
const PHOTOS_PRODUITS = [
  'paves-ecologiques.jpg',
  'engrais.jpg',
  'charbon-ecologique.jpg',
  'produits-recycles.jpg',
] as const;

export default async function Valorisation({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);

  // Chiffres cles : les menages viennent de la base des abonnes, les deux autres
  // sont renseignes par BENIME dans le back-office. « — » tant qu'ils sont vides.
  const [reglages, communes] = await Promise.all([getReglages(), getCommunes()]);
  const nombre = (brut?: string) => {
    const n = Number((brut ?? '').replace(',', '.'));
    return brut && Number.isFinite(n) ? n.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB') : null;
  };
  const menages = communes.find((c) => c.slug === 'lingwala')?.menages;
  const plastique = nombre(reglages.stat_plastique_tonnes);
  const part = nombre(reglages.stat_part_valorisee);
  const valeurs = [
    plastique ? `${plastique} t` : '—',
    part ? `${part} %` : '—',
    typeof menages === 'number' ? menages.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB') : '—',
  ];

  return (
    <>
      <Entete locale={locale} page="valorisation" />

      <main>
        <TitrePage
          surtitre={t.valorisation.surtitre}
          titre={t.valorisation.titre}
          chapeau={t.valorisation.chapeau}
          photo="/photos/transport.jpg"
          alt="Camion benne BENIME"
        />

        <section className="section">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.valorisation.chaineTitre}</h2>
            <div className="grille">
              {t.valorisation.chaine.map((etape, index) => (
                <div key={etape.titre} className="carte" style={{ padding: 28, gap: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
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

        <section className="section section--pale">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.valorisation.produitsTitre}</h2>
            <p className="chapeau" style={{ maxWidth: 720 }}>
              {t.valorisation.produitsTexte}
            </p>
            <div
              className="grille"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))' }}
            >
              {t.valorisation.produits.map((produit, index) => (
                <figure key={produit.titre} className="pile" style={{ gap: 12, margin: 0 }}>
                  <Image
                    src={`/photos/${PHOTOS_PRODUITS[index]}`}
                    alt={produit.titre}
                    width={560}
                    height={360}
                    sizes="(max-width: 860px) 100vw, 25vw"
                    style={{
                      width: '100%',
                      height: 240,
                      /* le collage « autres produits » s'affiche en entier */
                      objectFit: index === PHOTOS_PRODUITS.length - 1 ? 'contain' : 'cover',
                      background: index === PHOTOS_PRODUITS.length - 1 ? '#55a84c' : undefined,
                      borderRadius: 'var(--r)',
                    }}
                  />
                  <figcaption>
                    <h3 style={{ fontSize: 22 }}>{produit.titre}</h3>
                  </figcaption>
                </figure>
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
              <ListeTri titre={t.valorisation.accepte} items={t.valorisation.triAccepte} positif />
              <ListeTri titre={t.valorisation.refuse} items={t.valorisation.triRefuse} />
            </div>
          </div>
        </section>
      </main>

      <BandeauContact
        locale={locale}
        avant={
          <>
            <div className="pile" style={{ gap: 36 }}>
              <div className="chiffres-entete">
                <span className="chiffres-trait" aria-hidden="true" />
                <h2>{t.valorisation.chiffresTitre}</h2>
              </div>
              <ul className="chiffres-grille">
                {t.valorisation.chiffres.map((chiffre, i) => (
                  <li key={chiffre.libelle} className="chiffre-carte">
                    <span className="chiffre-carte__icone" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        width="26"
                        height="26"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {i === 0 ? (
                          <>
                            <path d="M3 16V7h11v9" />
                            <path d="M14 10h4l3 3v3h-7" />
                            <circle cx="7" cy="17.5" r="1.8" />
                            <circle cx="17" cy="17.5" r="1.8" />
                          </>
                        ) : i === 1 ? (
                          <>
                            <path d="M20 12a8 8 0 0 1-14 5.3" />
                            <path d="M4 12a8 8 0 0 1 14-5.3" />
                            <path d="M18 3v4h-4M6 21v-4h4" />
                          </>
                        ) : (
                          <>
                            <path d="M4 11 12 4l8 7" />
                            <path d="M6 10v10h12V10" />
                            <path d="M10 20v-5h4v5" />
                          </>
                        )}
                      </svg>
                    </span>
                    <span className="chiffre chiffre-carte__valeur">{valeurs[i]}</span>
                    <span className="chiffre-carte__libelle">{chiffre.libelle}</span>
                  </li>
                ))}
              </ul>
              <p className="chiffres-note">{t.valorisation.chiffresNote}</p>
            </div>
          </>
        }
      />
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
