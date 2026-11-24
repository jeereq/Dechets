import { CarteCamions } from '@/components/CarteCamions';
import { getDictionnaire, type Locale } from '@/lib/i18n';
import { COORDONNEES } from '@/lib/societe';

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

  const lignes: Array<[string, string]> = [
    [t.contact.telephone, COORDONNEES.telephone1],
    [t.contact.telephone2, COORDONNEES.telephone2],
    [t.contact.email, COORDONNEES.email],
    [t.contact.bureau, COORDONNEES.adresse],
  ];

  return (
    <section id="contact" className="bandeau-sombre bandeau-carte">
      <CarteCamions voile="uniforme" />
      <div className="conteneur section">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px 64px', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 min(380px, 100%)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2>{titre ?? t.contact.titre}</h2>
            <p className="chapeau">{texte ?? t.contact.texte}</p>
            <div>
              <a className="bouton bouton--soleil bouton--grand" href="#espace">
                {t.commun.sInscrire}
              </a>
            </div>
          </div>

          <dl style={{ flex: '1 1 min(340px, 100%)', minWidth: 0, margin: 0, fontSize: 18 }}>
            {lignes.map(([cle, valeur]) => (
              <div
                key={cle}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(84px, 120px) minmax(0, 1fr)',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: '1px solid #1C5A36',
                }}
              >
                <dt style={{ fontWeight: 700 }}>{cle}</dt>
                <dd style={{ margin: 0, color: 'var(--clair)', overflowWrap: 'anywhere' }}>{valeur}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
