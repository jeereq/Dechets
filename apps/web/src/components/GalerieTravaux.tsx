'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

export type PhotoGalerie = { src: string; alt: string };

export type TextesGalerie = {
  agrandir: string;
  fermer: string;
  precedent: string;
  suivant: string;
  photoSur: string; // « Photo {n} sur {total} »
};

/**
 * Grille de photos avec agrandissement : un appui ouvre la photo en grand, on passe de l'une
 * à l'autre avec les flèches (clavier ou écran), Échap ferme. Le focus revient sur la vignette.
 */
export function GalerieTravaux({
  photos,
  textes,
}: {
  photos: PhotoGalerie[];
  textes: TextesGalerie;
}) {
  const [ouverte, setOuverte] = useState<number | null>(null);
  const retour = useRef<HTMLElement | null>(null);
  const boutonFermer = useRef<HTMLButtonElement>(null);
  const departTouche = useRef<number | null>(null);

  const fermer = useCallback(() => {
    setOuverte(null);
    retour.current?.focus();
  }, []);
  const aller = useCallback(
    (sens: 1 | -1) =>
      setOuverte((i) => (i === null ? i : (i + sens + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (ouverte === null) return;
    const defilement = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    boutonFermer.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
      else if (e.key === 'ArrowRight') aller(1);
      else if (e.key === 'ArrowLeft') aller(-1);
    };
    window.addEventListener('keydown', touche);
    return () => {
      window.removeEventListener('keydown', touche);
      document.documentElement.style.overflow = defilement;
    };
  }, [ouverte, fermer, aller]);

  const courante = ouverte === null ? null : photos[ouverte];

  return (
    <>
      <ul className="galerie">
        {photos.map((photo, i) => (
          <li key={photo.src}>
            <button
              type="button"
              className="galerie__vignette"
              aria-label={`${textes.agrandir} : ${photo.alt} (${i + 1}/${photos.length})`}
              onClick={(e) => {
                retour.current = e.currentTarget;
                setOuverte(i);
              }}
            >
              <Image
                src={photo.src}
                alt=""
                width={480}
                height={360}
                sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 25vw"
              />
            </button>
          </li>
        ))}
      </ul>

      {courante ? (
        <div
          className="visionneuse"
          role="dialog"
          aria-modal="true"
          aria-label={courante.alt}
          onClick={fermer}
          onTouchStart={(e) => {
            departTouche.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const debut = departTouche.current;
            const fin = e.changedTouches[0]?.clientX;
            departTouche.current = null;
            if (debut === null || fin === undefined) return;
            if (Math.abs(fin - debut) > 50) aller(fin < debut ? 1 : -1);
          }}
        >
          <button
            ref={boutonFermer}
            type="button"
            className="visionneuse__fermer"
            aria-label={textes.fermer}
            onClick={fermer}
          >
            ×
          </button>
          <button
            type="button"
            className="visionneuse__fleche visionneuse__fleche--gauche"
            aria-label={textes.precedent}
            onClick={(e) => {
              e.stopPropagation();
              aller(-1);
            }}
          >
            ‹
          </button>
          <figure className="visionneuse__cadre" onClick={(e) => e.stopPropagation()}>
            <Image
              src={courante.src}
              alt={courante.alt}
              width={1280}
              height={960}
              sizes="100vw"
              priority
            />
            <figcaption>
              {textes.photoSur
                .replace('{n}', String((ouverte ?? 0) + 1))
                .replace('{total}', String(photos.length))}
            </figcaption>
          </figure>
          <button
            type="button"
            className="visionneuse__fleche visionneuse__fleche--droite"
            aria-label={textes.suivant}
            onClick={(e) => {
              e.stopPropagation();
              aller(1);
            }}
          >
            ›
          </button>
        </div>
      ) : null}
    </>
  );
}
