import type { DeepPartial } from '../i18n';
import type { Dictionnaire } from './fr';

/**
 * Lingala.
 *
 * ATTENTION : cette traduction n'a pas ete relue par un locuteur lingala.
 * Elle ne couvre que la navigation et les quelques phrases les plus vues ;
 * tout le reste retombe sur le francais, ce qui est voulu tant que la
 * relecture n'a pas eu lieu. Ne pas mettre en ligne sans relecture.
 */
export const ln: DeepPartial<Dictionnaire> = {
  nav: {
    accueil: 'Ndako',
    travaux: 'Misala na biso',
    zones: 'Esika tolekaka',
    valorisation: 'Bosoto ekendaka wapi',
    formules: 'Kofuta',
    questions: 'Mituna',
    espace: 'Konto na ngai',
  },
  commun: {
    sInscrire: 'Komikoma',
    appeler: 'Kobenga',
    voirTout: 'Tala nyonso',
    envoyer: 'Kotinda',
  },
  accueil: {
    titre: 'Kopetola esika ya bomoi na yo, yango nde mosala na biso',
  },
  zones: {
    boutonPrevenir: 'Boyebisa ngai',
  },
};
