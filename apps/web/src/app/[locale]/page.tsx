import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BandeauContact } from '@/components/BandeauContact';
import { Entete } from '@/components/Entete';
import { Icone } from '@/components/Icone';
import { PiedDePage } from '@/components/PiedDePage';
import { getCommunes, getReglages } from '@/lib/api';
import { formaterPrix } from '@/lib/format';
import { estLocale, getDictionnaire, lien } from '@/lib/i18n';
import { VISUELS_SERVICES } from '@/lib/services';
import { metaPage } from '@/lib/seo';
import { COORDONNEES, telLien } from '@/lib/societe';
import type { Metadata } from 'next';

const ICONES_FAITS = ['calendrier', 'cloche', 'portefeuille'] as const;
const PHOTOS_ETAPES = ['collecte.jpg', 'tri-cote.jpg', null] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!estLocale(locale)) return {};
  const t = getDictionnaire(locale);
  return metaPage({
    locale,
    chemin: '',
    titre: t.meta.nomSite,
    titreComplet: t.meta.titreAccueil,
    description: t.meta.descriptionSite,
  });
}

export default async function Accueil({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!estLocale(locale)) notFound();

  const t = getDictionnaire(locale);
  const [communes, reglages] = await Promise.all([getCommunes(), getReglages()]);
  const ouvertes = communes.filter((c) => c.statut === 'OUVERTE');

  const materiel: Array<[string, string]> = [
    ['tri-cote.jpg', 'Notre tricycle de collecte'],
    ['tri-agent.jpg', 'Un agent au volant · Kinshasa'],
    ['camion.jpg', 'Notre camion compacteur'],
    ['agents.jpg', 'Nos agents · Limete'],
    ['tri-arriere.jpg', 'La benne du tricycle'],
    ['equipe-large.jpg', 'Sur le terrain · Kinshasa'],
  ];

  return (
    <>
      <Entete locale={locale} page="accueil" />

      <main>
        <section className="conteneur" style={{ paddingTop: 28, paddingBottom: 48 }}>
          <div className="heros">
            <div className="heros__texte">
              <span className="surtitre surtitre--clair">{t.accueil.surtitre}</span>
              <h1>{t.accueil.titre}</h1>
              <p className="chapeau">{t.accueil.chapeau}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <a className="bouton bouton--soleil bouton--grand" href="#espace">
                  {t.commun.sInscrire}
                </a>
                <a className="bouton bouton--clair bouton--grand" href={telLien(COORDONNEES.telephone1)}>
                  <Icone nom="telephone" taille={22} />
                  <span style={{ whiteSpace: 'nowrap' }}>{COORDONNEES.telephone1}</span>
                </a>
              </div>
            </div>
            <div className="heros__image">
              <Image
                src="/photos/equipe-hero.jpg"
                alt="Équipe BENIME à Kinshasa devant un véhicule de collecte"
                width={1200}
                height={900}
                sizes="(max-width: 860px) 100vw, 50vw"
                style={{ objectPosition: '55% 30%' }}
                priority
              />
            </div>
          </div>
        </section>

        <section className="conteneur" style={{ paddingBottom: 16 }}>
          <div className="grille">
            {t.accueil.faits.map((fait, index) => (
              <div key={fait.titre} className="carte" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <span className="pastille">
                  <Icone nom={ICONES_FAITS[index] ?? 'check'} taille={26} epaisseur={1.9} />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: 18 }}>{fait.titre}</strong>
                  <span className="discret">{fait.texte}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="conteneur pile" style={{ gap: 30 }}>
            <h2>{t.accueil.etapesTitre}</h2>
            <div className="grille" style={{ gap: 32 }}>
              {t.accueil.etapes.map((etape, index) => {
                const photo = PHOTOS_ETAPES[index];
                return (
                  <div key={etape.titre} className="pile" style={{ gap: 14 }}>
                    {photo ? (
                      <Image
                        src={`/photos/${photo}`}
                        alt={etape.titre}
                        width={560}
                        height={210}
                        sizes="(max-width: 860px) 100vw, 33vw"
                        style={{ width: '100%', height: 210, objectFit: 'cover', borderRadius: 'var(--r)' }}
                      />
                    ) : (
                      <div className="photo-manquante">
                        <Icone nom="appareil-photo" taille={32} epaisseur={1.7} />
                        {t.commun.photoAFournir}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 999,
                          background: 'var(--vert)',
                          color: 'var(--blanc)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {index + 1}
                      </span>
                      <h3>{etape.titre}</h3>
                    </div>
                    <p className="discret" style={{ fontSize: 18 }}>
                      {etape.texte}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section section--pale">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.formules.formulesTitre}</h2>
            <div className="grille">
              <Formule
                nom={t.formules.parPassage.nom}
                texte={t.formules.parPassage.texte}
                prix={`${formaterPrix(reglages.prix_par_passage, reglages.devise)} ${t.formules.parPassage.unite}`}
                points={t.formules.parPassage.points}
              />
              <Formule
                nom={t.formules.mensuelle.nom}
                texte={t.formules.mensuelle.texte}
                prix={`${formaterPrix(reglages.prix_mensuel, reglages.devise)} ${t.formules.mensuelle.unite}`}
                points={t.formules.mensuelle.points}
                misEnAvant
              />
            </div>
            <p className="discret">{t.commun.prixExemple}</p>
            <div>
              <Link className="bouton bouton--secondaire" href={lien(locale, 'formules')}>
                {t.nav.formules}
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.accueil.materielTitre}</h2>
            <div className="grille">
              {materiel.map(([fichier, légende]) => (
                <figure key={fichier}>
                  <Image
                    src={`/photos/${fichier}`}
                    alt={légende}
                    width={560}
                    height={210}
                    sizes="(max-width: 860px) 100vw, 33vw"
                  />
                  <figcaption>
                    <strong>{légende}</strong>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--pale">
          <div className="conteneur pile" style={{ gap: 24 }}>
            <h2>{t.accueil.groupeTitre}</h2>
            <p className="chapeau chapeau--encre">{t.accueil.groupeTexte}</p>
            <div className="grille grille--cinq">
              {t.services.items.map((item) => (
                <Link
                  key={item.id}
                  href={`${lien(locale, 'services')}/${item.id}`}
                  className="carte carte--lien"
                >
                  <span className="pastille">
                    <Icone nom={VISUELS_SERVICES[item.id]?.icone ?? 'check'} taille={26} epaisseur={1.9} />
                  </span>
                  <strong style={{ fontSize: 18 }}>{item.titre}</strong>
                  <span className="discret">{item.accroche}</span>
                </Link>
              ))}
            </div>
            <div>
              <Link className="bouton bouton--secondaire" href={lien(locale, 'services')}>
                {t.accueil.groupeLien}
              </Link>
            </div>
          </div>
        </section>

        <section className="section section--blanche">
          <div
            className="conteneur"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 56px', alignItems: 'center' }}
          >
            <div style={{ flex: '1 1 420px' }} className="pile">
              <h2>
                {ouvertes.length === 1 && ouvertes[0]
                  ? `${t.accueil.zoneTitre}`
                  : t.accueil.zoneTitre}
              </h2>
              <p className="chapeau">{t.accueil.zoneTexte}</p>
              <div>
                <Link className="bouton bouton--principal bouton--grand" href={lien(locale, 'zones')}>
                  {t.accueil.zoneLien}
                </Link>
              </div>
            </div>
            <ul className="communes" style={{ flex: '1 1 320px' }}>
              {ouvertes.map((commune) => (
                <li key={commune.slug} className="commune commune--ouverte">
                  <Icone nom="check" taille={20} epaisseur={3} />
                  {commune.nom}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <BandeauContact locale={locale} />
      <PiedDePage locale={locale} />
    </>
  );
}

function Formule({
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
    <div className={`carte ${misEnAvant ? 'carte--mise-en-avant' : ''}`} style={{ padding: 28 }}>
      <h3>{nom}</h3>
      <p className="discret" style={{ fontSize: 18 }}>
        {texte}
      </p>
      <span className="chiffre" style={{ fontSize: 32, color: 'var(--vert-fonce)' }}>
        {prix}
      </span>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {points.map((point) => (
          <li key={point} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--vert)', display: 'flex' }}>
              <Icone nom="check" taille={22} epaisseur={3} />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
