import type { Locale } from '@/lib/i18n';

/**
 * Types de demandes du formulaire de contact. Chaque type affiche ses propres questions
 * (le formulaire « s'adapte ») ; au moment de l'envoi, les réponses sont regroupées en tête du
 * message, ligne par ligne, pour que l'équipe lise tout d'un coup d'œil dans le back-office.
 */
type L = { fr: string; en: string };

export type Champ = {
  id: string;
  type: 'liste' | 'texte' | 'date' | 'nombre' | 'offre';
  libelle: L;
  requis?: boolean;
  options?: L[];
  exemple?: L;
};

export type Sujet = {
  id: string;
  libelle: L;
  /** Phrase d'aide sous le choix de la demande. */
  aide: L;
  champs: Champ[];
  /** Question posée au-dessus du message libre. */
  precisions: L;
};

const o = (fr: string, en: string): L => ({ fr, en });

const VOUS_ETES: Champ = {
  id: 'profil',
  type: 'liste',
  requis: true,
  libelle: o('Vous êtes', 'You are'),
  options: [o('Un particulier', 'An individual'), o('Une entreprise', 'A company'), o("L'État ou une institution", 'The State or an institution')],
};

export const SUJETS: Sujet[] = [
  {
    id: 'general',
    libelle: o('Une question ou un autre sujet', 'A question or another topic'),
    aide: o('Écrivez-nous librement : nous répondons très vite.', 'Write to us freely: we reply very quickly.'),
    champs: [],
    precisions: o('Votre message', 'Your message'),
  },
  {
    id: 'assainissement',
    libelle: o('Collecte des déchets : abonnement', 'Waste collection: subscription'),
    aide: o('Choisissez votre offre, nous vous indiquons la suite.', 'Pick your offer and we will tell you what happens next.'),
    champs: [
      { id: 'offre', type: 'offre', requis: true, libelle: o('Votre offre', 'Your offer') },
      { id: 'adresse', type: 'texte', requis: true, libelle: o('Votre adresse', 'Your address'), exemple: o('Commune, avenue, numéro', 'Commune, avenue, number') },
    ],
    precisions: o('Précisions (facultatif)', 'Details (optional)'),
  },
  {
    id: 'energie',
    libelle: o('Énergie : électricité, solaire, eau', 'Energy: electricity, solar, water'),
    aide: o('Dites-nous le besoin et le lieu : nous passons vous voir si c’est utile, puis nous vous envoyons une offre claire.', 'Tell us the need and the place: we visit you if useful, then send a clear offer.'),
    champs: [
      {
        id: 'besoin',
        type: 'liste',
        requis: true,
        libelle: o('Votre besoin', 'Your need'),
        options: [
          o('Installation électrique (basse, moyenne ou haute tension)', 'Electrical installation (low, medium or high voltage)'),
          o('Moteurs électriques', 'Electric motors'),
          o('Installation photovoltaïque (panneaux solaires)', 'Photovoltaic installation (solar panels)'),
          o("Pompage d'eau par photovoltaïque (forage)", 'Solar-powered water pumping (borehole)'),
          o('Autre', 'Other'),
        ],
      },
      VOUS_ETES,
      { id: 'lieu', type: 'texte', requis: true, libelle: o('Lieu des travaux', 'Work location'), exemple: o('Commune, avenue, numéro', 'Commune, avenue, number') },
    ],
    precisions: o('Décrivez votre besoin (facultatif)', 'Describe your need (optional)'),
  },
  {
    id: 'construction',
    libelle: o('Construction & BTP', 'Construction & public works'),
    aide: o('Parlez-nous de votre projet : nous l’étudions et nous le chiffrons.', 'Tell us about your project: we study it and cost it.'),
    champs: [
      {
        id: 'projet',
        type: 'liste',
        requis: true,
        libelle: o('Type de projet', 'Type of project'),
        options: [
          o('Construction de bâtiment ou d’immeuble', 'Building or apartment block'),
          o('Ponts et chaussées (construction, rénovation, aménagement)', 'Bridges and roads (construction, renovation, upgrading)'),
          o('Suivi et contrôle de chantier', 'Site monitoring and control'),
          o('Études de projet de construction', 'Construction project studies'),
          o('Autre', 'Other'),
        ],
      },
      VOUS_ETES,
      { id: 'lieu', type: 'texte', requis: true, libelle: o('Lieu du chantier', 'Site location'), exemple: o('Commune, avenue, numéro', 'Commune, avenue, number') },
      { id: 'delai', type: 'texte', libelle: o('Délai souhaité', 'Desired timeframe'), exemple: o('Ex. : début en janvier', 'E.g. start in January') },
    ],
    precisions: o('Décrivez votre projet (facultatif)', 'Describe your project (optional)'),
  },
  {
    id: 'agriculture',
    libelle: o('Agriculture : produits, élevage, pisciculture', 'Agriculture: products, livestock, fish farming'),
    aide: o('Dites-nous ce qu’il vous faut : nous vous répondons avec une offre claire.', 'Tell us what you need: we reply with a clear offer.'),
    champs: [
      {
        id: 'produit',
        type: 'liste',
        requis: true,
        libelle: o('Ce qui vous intéresse', 'What interests you'),
        options: [
          o('Cultures pérennes et vivrières', 'Perennial and food crops'),
          o('Produits agricoles transformés', 'Processed farm products'),
          o('Produits laitiers', 'Dairy products'),
          o('Poisson (pisciculture)', 'Fish (fish farming)'),
          o('Bétail (élevage)', 'Livestock'),
          o('Autre', 'Other'),
        ],
      },
      VOUS_ETES,
      { id: 'quantite', type: 'texte', libelle: o('Quantité souhaitée', 'Quantity wanted'), exemple: o('Ex. : 50 kg par semaine', 'E.g. 50 kg a week') },
      { id: 'livraison', type: 'texte', libelle: o('Lieu de livraison', 'Delivery location'), exemple: o('Commune, avenue, numéro', 'Commune, avenue, number') },
    ],
    precisions: o('Précisions (facultatif)', 'Details (optional)'),
  },
  {
    id: 'events',
    libelle: o('Communication, events et industrie créative', 'Communication, events and creative industry'),
    aide: o('Dites-nous ce que vous préparez : nous passons dans vos bureaux puis nous vous envoyons une proposition.', 'Tell us what you are preparing: we come to your offices, then send you a proposal.'),
    champs: [
      {
        id: 'prestation',
        type: 'liste',
        requis: true,
        libelle: o('Votre besoin', 'Your need'),
        options: [
          o('Organisation d’un événement', 'Organising an event'),
          o('Photos et vidéos', 'Photos and videos'),
          o('Supports de promotion (produits, marque, activité)', 'Promotion material (products, brand, activity)'),
          o('Autre', 'Other'),
        ],
      },
      VOUS_ETES,
      { id: 'date', type: 'date', libelle: o('Date souhaitée', 'Desired date') },
      { id: 'invites', type: 'nombre', libelle: o('Nombre de personnes attendues', 'Expected number of people') },
    ],
    precisions: o('Décrivez votre projet (facultatif)', 'Describe your project (optional)'),
  },
];

export const IDS_SUJETS = SUJETS.map((s) => s.id);

export const texte = (l: L, locale: Locale) => l[locale];
