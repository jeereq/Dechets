const TRACES = {
  accueil: 'M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z',
  passages: 'M3 16V7h11v9M14 10h4l3 3v3h-7M7 19.2a1.8 1.8 0 1 0 0-.01M17 19.2a1.8 1.8 0 1 0 0-.01',
  credit: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2M16 14.5h.01',
  messages: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1',
  retour: 'M15 5 8 12l7 7',
  plus: 'M12 5v14M5 12h14',
  verifie: 'm5 12.5 4.5 4.5L19 7.5',
  croix: 'M6 6l12 12M18 6 6 18',
  telephone:
    'M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.56 3.5a1 1 0 0 1-.25 1z',
  horloge: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18',
  recu: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
} as const;

export type NomIconeApp = keyof typeof TRACES;

export function IconeApp({ nom, taille = 24 }: { nom: NomIconeApp; taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      <path d={TRACES[nom]} />
    </svg>
  );
}
