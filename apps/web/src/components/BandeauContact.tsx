import type { ReactNode } from 'react';
import { CarteCamions } from '@/components/CarteCamions';
import { getDictionnaire, type Locale } from '@/lib/i18n';
import { COORDONNEES } from '@/lib/societe';

const ICONES: Record<'tel' | 'mail' | 'lieu', ReactNode> = {
  tel: (
    <path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.56 3.5a1 1 0 0 1-.25 1Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  lieu: (
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
};

function Icone({ nom }: { nom: keyof typeof ICONES }) {
  return (
    <span className="contact-icone" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill={nom === 'tel' ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONES[nom]}
      </svg>
    </span>
  );
}

export function BandeauContact({
  locale,
  titre,
  texte,
}: {
  locale: Locale;
  titre?: string;
  texte?: string;
}) {
  const t = getDictionnaire(locale);
  const tel = (n: string) => `tel:${n.replace(/[^+\d]/g, '')}`;

  const lignes: Array<{ cle: string; valeur: string; icone: keyof typeof ICONES; lien?: string }> =
    [
      {
        cle: t.contact.telephone,
        valeur: COORDONNEES.telephone1,
        icone: 'tel',
        lien: tel(COORDONNEES.telephone1),
      },
      {
        cle: t.contact.telephone2,
        valeur: COORDONNEES.telephone2,
        icone: 'tel',
        lien: tel(COORDONNEES.telephone2),
      },
      {
        cle: t.contact.email,
        valeur: COORDONNEES.email,
        icone: 'mail',
        lien: `mailto:${COORDONNEES.email}`,
      },
      { cle: t.contact.bureau, valeur: COORDONNEES.adresse, icone: 'lieu' },
    ];

  return (
    <section id="contact" className="bandeau-sombre bandeau-carte bandeau-contact">
      <CarteCamions voile="degrade" />
      <div className="conteneur section">
        <div className="contact-grille">
          <div className="contact-texte">
            <h2>{titre ?? t.contact.titre}</h2>
            <p className="chapeau">{texte ?? t.contact.texte}</p>
            <div>
              <a className="bouton bouton--soleil bouton--grand" href="#espace">
                {t.commun.sInscrire}
              </a>
            </div>
          </div>

          <ul className="contact-carte">
            {lignes.map(({ cle, valeur, icone, lien }) => {
              const contenu = (
                <>
                  <Icone nom={icone} />
                  <span className="contact-ligne__texte">
                    <span className="contact-ligne__cle">{cle}</span>
                    <span className="contact-ligne__valeur">{valeur}</span>
                  </span>
                </>
              );
              return (
                <li key={cle}>
                  {lien ? (
                    <a className="contact-ligne" href={lien}>
                      {contenu}
                    </a>
                  ) : (
                    <div className="contact-ligne">{contenu}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
