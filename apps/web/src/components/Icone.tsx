export type NomIcone =
  | 'check'
  | 'croix'
  | 'horloge'
  | 'cloche'
  | 'calendrier'
  | 'portefeuille'
  | 'camion'
  | 'sac'
  | 'recyclage'
  | 'feuille'
  | 'epingle'
  | 'telephone'
  | 'appareil-photo'
  | 'fleche'
  | 'plus'
  | 'moins'
  | 'eclair'
  | 'batiment'
  | 'plante'
  | 'etoile';

const CHEMINS: Record<NomIcone, string> = {
  check: 'M20 6 9 17l-5-5',
  croix: 'M18 6 6 18M6 6l12 12',
  horloge: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  cloche: 'M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  calendrier: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  portefeuille: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7ZM16 12h3',
  camion: 'M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  sac: 'M6 8h12l-1 12H7L6 8ZM9 8V6a3 3 0 0 1 6 0v2',
  recyclage:
    'M7 19H5a2 2 0 0 1-1.7-3l1.7-2.8M9.6 5.5 10.8 3.5a2 2 0 0 1 3.4 0l1.6 2.7M17 19h2a2 2 0 0 0 1.7-3l-1.5-2.5M14 22l3-3-3-3',
  feuille: 'M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16ZM4 20c2-4 5-7 9-9',
  epingle: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  telephone:
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z',
  'appareil-photo':
    'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  fleche: 'M9 18l6-6-6-6',
  plus: 'M12 5v14M5 12h14',
  moins: 'M5 12h14',
  eclair: 'M13 2 3 14h9l-1 8 10-12h-9l1-8Z',
  batiment: 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01',
  plante:
    'M7 20h10M10 20c5.5-2.5.8-6.4 3-10M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8ZM14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2Z',
  etoile: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1L12 2Z',
};

export function Icone({
  nom,
  taille = 24,
  epaisseur = 2,
  rempli = false,
}: {
  nom: NomIcone;
  taille?: number;
  epaisseur?: number;
  rempli?: boolean;
}) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill={rempli ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      <path d={CHEMINS[nom]} />
    </svg>
  );
}
