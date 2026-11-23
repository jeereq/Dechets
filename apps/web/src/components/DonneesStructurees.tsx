/** Donnees structurees (JSON-LD) lues par les moteurs de recherche. */
export function DonneesStructurees({ donnees }: { donnees: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Le contenu est construit par le code, jamais saisi par un visiteur ;
      // « < » est neutralise pour qu'il ne puisse pas fermer la balise.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees).replace(/</g, '\\u003c') }}
    />
  );
}
