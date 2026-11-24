import { notFound } from 'next/navigation';
import { Entete } from '@/components/Entete';
import { CarteZones } from '@/components/CarteZones';
import { CommuneChoisieProvider } from '@/components/CommuneChoisie';
import { FormulairePrevenir } from '@/components/FormulairePrevenir';
import { Icone } from '@/components/Icone';
import { ListeCommunes } from '@/components/ListeCommunes';
import { PiedDePage } from '@/components/PiedDePage';
import { TitrePage } from '@/components/TitrePage';
import { getCommunes } from '@/lib/api';
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
  const t = getDictionnaire(locale).zones;
  return metaPage({ locale, chemin: 'ou-nous-passons', titre: t.titre, description: t.chapeau });
}

export default async function Zones({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);
  const communes = await getCommunes();
  const ouvertes = communes.filter((commune) => commune.statut === 'OUVERTE');

  return (
    <>
      <Entete locale={locale} page="zones" />

      <main>
        <CommuneChoisieProvider>
        <TitrePage
          surtitre={t.zones.surtitre}
          titre={t.zones.titre}
          chapeau={t.zones.chapeau}
          chiffres={[
            {
              valeur: String(ouvertes.length),
              libelle: ouvertes.length > 1 ? t.zones.communesDesservies : t.zones.communeDesservie,
            },
            { valeur: String(communes.length), libelle: t.zones.communesKinshasa },
          ]}
        />

        <section className="section">
          <div className="conteneur pile" style={{ gap: 20 }}>
            <h2>{t.zones.carteTitre}</h2>
            <CarteZones locale={locale} communes={communes} />
          </div>
        </section>

        <section className="section section--pale">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.zones.listeTitre}</h2>
            <ListeCommunes
              communes={communes}
              etiquettes={{
                rechercher: t.zones.rechercher,
                toutes: t.zones.filtreToutes,
                ouvertes: t.zones.filtreOuvertes,
                fermees: t.zones.filtreFermees,
              }}
            />
          </div>
        </section>

        <section className="section">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.zones.deploiementTitre}</h2>
            <div className="pile" style={{ gap: 0 }}>
              {t.zones.phases.map((phase, index) => {
                const faite = index === 0;
                return (
                  <div key={phase.nom} className={`etape ${faite ? 'etape--faite' : ''}`}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
                      <span className="etape__numero">{index + 1}</span>
                      {index < t.zones.phases.length - 1 ? (
                        <span
                          aria-hidden="true"
                          style={{ flex: 1, width: 2, background: 'var(--ligne)', margin: '8px 0' }}
                        />
                      ) : null}
                    </div>
                    <div className="pile" style={{ gap: 6, paddingBottom: 28 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                        <h3>
                          {phase.nom} · {phase.zone}
                        </h3>
                        <span className={`etat ${faite ? 'etat--ok' : 'etat--attente'}`}>
                          <Icone nom={faite ? 'check' : 'horloge'} taille={18} epaisseur={2.6} />
                          {phase.etat}
                        </span>
                      </div>
                      <p className="discret" style={{ fontSize: 18, maxWidth: 620 }}>
                        {phase.texte}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bandeau-sombre" id="prevenir">
          <div className="conteneur section">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px 64px', alignItems: 'flex-start' }}>
              <div className="pile" style={{ flex: '1 1 380px', gap: 18 }}>
                <h2>{t.zones.prevenirTitre}</h2>
                <p className="chapeau">{t.zones.prevenirTexte}</p>
              </div>
              <div style={{ flex: '1 1 380px' }}>
                <FormulairePrevenir
                  communes={communes}
                  etiquettes={{
                    commune: t.zones.champCommune,
                    telephone: t.zones.champTelephone,
                    bouton: t.zones.boutonPrevenir,
                    envoi: t.commun.envoiEnCours,
                    succes: t.zones.prevenirSucces,
                    erreur: t.zones.prevenirErreur,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
        </CommuneChoisieProvider>
      </main>

      <PiedDePage locale={locale} />
    </>
  );
}
