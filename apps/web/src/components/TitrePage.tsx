import Image from 'next/image';
import { CarteCamions } from '@/components/CarteCamions';
import { FondService, type SceneService } from '@/components/ScenesServices';

/**
 * Bandeau de titre des pages intérieures.
 *
 * Un titre seul dans un grand aplat vert laisse la moitié droite vide ;
 * la colonne de droite reçoit donc soit une photo, soit des chiffres.
 * En fond, la carte de Kinshasa où circulent les camions (CarteCamions).
 */
export function TitrePage({
  surtitre,
  titre,
  chapeau,
  photo,
  alt,
  chiffres,
  scene = 'carte',
}: {
  surtitre?: string;
  titre: string;
  chapeau?: string;
  photo?: string;
  alt?: string;
  chiffres?: Array<{ valeur: string; libelle: string }>;
  /** Animation de fond : la carte des camions, ou la scène propre à un service. */
  scene?: 'carte' | SceneService | null;
}) {
  return (
    <section
      className={
        scene === 'carte'
          ? 'bandeau-sombre bandeau-carte'
          : scene
            ? 'bandeau-sombre bandeau-carte bandeau-carte--scene'
            : 'bandeau-sombre'
      }
    >
      {scene === 'carte' ? <CarteCamions /> : scene ? <FondService scene={scene} /> : null}
      <div className="conteneur section">
        <div className="titre-page">
          <div className="titre-page__texte">
            {surtitre ? <span className="surtitre surtitre--clair">{surtitre}</span> : null}
            <h1>{titre}</h1>
            {chapeau ? <p className="chapeau">{chapeau}</p> : null}
          </div>

          {photo ? (
            <div className="titre-page__media">
              <Image
                src={photo}
                alt={alt ?? ''}
                width={560}
                height={240}
                sizes="(max-width: 860px) 100vw, 380px"
                priority
              />
            </div>
          ) : null}

          {chiffres ? (
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {chiffres.map((chiffre) => (
                <div
                  key={chiffre.libelle}
                  style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <span className="chiffre" style={{ color: 'var(--soleil)' }}>
                    {chiffre.valeur}
                  </span>
                  <span className="surtitre surtitre--clair">{chiffre.libelle}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
