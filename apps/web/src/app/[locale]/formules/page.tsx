import { notFound } from 'next/navigation';
import { BandeauContact } from '@/components/BandeauContact';
import { Entete } from '@/components/Entete';
import { Icone } from '@/components/Icone';
import { PiedDePage } from '@/components/PiedDePage';
import { getReglages } from '@/lib/api';
import { formaterPrix } from '@/lib/format';
import { estLocale, getDictionnaire } from '@/lib/i18n';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!estLocale(locale)) return {};
  return { title: getDictionnaire(locale).formules.titre };
}

export default async function Formules({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);
  const reglages = await getReglages();

  return (
    <>
      <Entete locale={locale} page="formules" />

      <main>
        <section className="bandeau-sombre">
          <div className="conteneur section">
            <div className="pile" style={{ maxWidth: 760, gap: 14 }}>
              <h1>{t.formules.titre}</h1>
              <p className="chapeau">{t.formules.chapeau}</p>
            </div>
          </div>
        </section>

        <section className="section section--pale">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.formules.formulesTitre}</h2>
            <div className="grille">
              <Plan
                nom={t.formules.parPassage.nom}
                texte={t.formules.parPassage.texte}
                prix={`${formaterPrix(reglages.prix_par_passage, reglages.devise)} ${t.formules.parPassage.unite}`}
                points={t.formules.parPassage.points}
              />
              <Plan
                nom={t.formules.mensuelle.nom}
                texte={t.formules.mensuelle.texte}
                prix={`${formaterPrix(reglages.prix_mensuel, reglages.devise)} ${t.formules.mensuelle.unite}`}
                points={t.formules.mensuelle.points}
                misEnAvant
              />
            </div>
            <p className="discret">{t.commun.prixExemple}</p>
          </div>
        </section>

        <section className="section">
          <div className="conteneur pile" style={{ gap: 20 }}>
            <h2>{t.formules.paiementTitre}</h2>
            <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: 14 }}>
              {t.formules.modes.map((mode) => (
                <div key={mode.nom} className="carte" style={{ gap: 2, padding: '16px 18px' }}>
                  <strong style={{ fontSize: 19 }}>{mode.nom}</strong>
                  <span className="discret">{mode.detail}</span>
                </div>
              ))}
            </div>
            <p className="discret">{t.formules.paiementNote}</p>
          </div>
        </section>

        <section className="section section--blanche">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.formules.creditTitre}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px 64px' }}>
              <p className="chapeau" style={{ flex: '1 1 360px' }}>
                {t.formules.creditTexte}
              </p>
              <ol
                style={{
                  flex: '1 1 360px',
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 22,
                }}
              >
                {t.formules.creditEtapes.map((etape, index) => (
                  <li key={etape.titre} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: 40,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: 'var(--vert)',
                        width: 36,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <strong style={{ fontSize: 20 }}>{etape.titre}</strong>
                      <span className="discret" style={{ fontSize: 18 }}>
                        {etape.texte}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </main>

      <BandeauContact locale={locale} />
      <PiedDePage locale={locale} />
    </>
  );
}

function Plan({
  nom,
  texte,
  prix,
  points,
  misEnAvant = false,
}: {
  nom: string;
  texte: string;
  prix: string;
  points: readonly string[];
  misEnAvant?: boolean;
}) {
  return (
    <div
      className={`carte ${misEnAvant ? 'carte--sombre' : ''}`}
      style={{ padding: 30, borderRadius: 'var(--r-lg)' }}
    >
      <h3 style={{ fontSize: 26 }}>{nom}</h3>
      <p style={{ fontSize: 18, color: misEnAvant ? 'var(--clair)' : 'var(--gris)' }}>{texte}</p>
      <span
        className="chiffre"
        style={{ fontSize: 32, color: misEnAvant ? 'var(--soleil)' : 'var(--vert-fonce)' }}
      >
        {prix}
      </span>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {points.map((point) => (
          <li key={point} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: misEnAvant ? 'var(--soleil)' : 'var(--vert)', display: 'flex' }}>
              <Icone nom="check" taille={22} epaisseur={3} />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
