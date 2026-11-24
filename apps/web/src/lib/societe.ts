/** Coordonnees affichees sur le site. Modifiables par variables d'environnement. */
export const COORDONNEES = {
  raisonSociale: 'BENIME CONGO SARL',
  activite: 'BENIME CONGO Assainissement',
  adresse: '65A Avenue Lubefu, Quartier Mososo, Limete, Kinshasa',
  telephone1: process.env.NEXT_PUBLIC_PHONE_1 ?? '+243 823 678 354',
  telephone2: process.env.NEXT_PUBLIC_PHONE_2 ?? '+243 844 664 989',
  email: process.env.NEXT_PUBLIC_EMAIL ?? 'benimecongo.sarl@gmail.com',
} as const;

export const MENTIONS = [
  'RCCM : CD/KNM/RCCM/22-B-00614',
  'ID NAT. : 01-F4200-N25317D',
  'NIF : A2324487S',
] as const;

/** Numéro utilisable dans un lien tel: */
export const telLien = (numéro: string) => `tel:${numéro.replace(/\s/g, '')}`;
