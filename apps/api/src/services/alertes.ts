import type { Menage } from '@prisma/client';
import { prisma } from '../prisma.js';
import { envoyerSms, envoyerWhatsapp } from './notifications.js';

/**
 * Messages envoyes aux menages, en francais ou en anglais.
 */
type Modele = 'code_connexion' | 'bienvenue' | 'demande_recue' | 'demande_annulee' | 'recu_paiement';

const TEXTES: Record<Modele, { fr: (v: Record<string, string>) => string; en: (v: Record<string, string>) => string }> = {
  code_connexion: {
    fr: (v) => `BENIME : votre code est ${v.code}. Il est valable 10 minutes. Ne le donnez a personne.`,
    en: (v) => `BENIME: your code is ${v.code}. It is valid for 10 minutes. Do not share it.`,
  },
  bienvenue: {
    fr: (v) => `Bienvenue chez BENIME, ${v.nom}. Votre numero d'abonne est ${v.code}.`,
    en: (v) => `Welcome to BENIME, ${v.nom}. Your subscriber number is ${v.code}.`,
  },
  demande_recue: {
    fr: (v) => `BENIME : demande ${v.reference} recue. Nous vous prevenons des que le passage est planifie.`,
    en: (v) => `BENIME: request ${v.reference} received. We will tell you as soon as the pickup is scheduled.`,
  },
  demande_annulee: {
    fr: (v) => `BENIME : demande ${v.reference} annulee. ${v.montant} FC ont ete rendus a votre credit.`,
    en: (v) => `BENIME: request ${v.reference} cancelled. ${v.montant} FC were returned to your credit.`,
  },
  recu_paiement: {
    fr: (v) => `BENIME : paiement de ${v.montant} FC recu (${v.reference}). Merci.`,
    en: (v) => `BENIME: payment of ${v.montant} FC received (${v.reference}). Thank you.`,
  },
};

export function rediger(modele: Modele, langue: 'FR' | 'EN', valeurs: Record<string, string>): string {
  const texte = TEXTES[modele];
  return langue === 'EN' ? texte.en(valeurs) : texte.fr(valeurs);
}

/** Code de connexion : SMS uniquement, jamais par WhatsApp ni garde en base. */
export async function envoyerCodeConnexion(telephone: string, code: string, langue: 'FR' | 'EN' = 'FR') {
  return envoyerSms({ telephone, texte: rediger('code_connexion', langue, { code }) });
}

/**
 * Previent un menage par les canaux qu'il a choisis et garde une trace.
 * N'echoue jamais : une alerte qui ne part pas ne doit pas annuler un paiement.
 */
export async function alerterMenage(
  menage: Pick<Menage, 'id' | 'telephone' | 'langue' | 'alerteSms' | 'alerteWa'>,
  modele: Modele,
  valeurs: Record<string, string>,
): Promise<void> {
  const contenu = rediger(modele, menage.langue, valeurs);
  const canaux: Array<'SMS' | 'WHATSAPP'> = [];
  if (menage.alerteSms) canaux.push('SMS');
  if (menage.alerteWa) canaux.push('WHATSAPP');

  for (const canal of canaux) {
    try {
      const trace = await prisma.notification.create({
        data: { menageId: menage.id, canal, modele, contenu },
      });
      const resultat =
        canal === 'SMS'
          ? await envoyerSms({ telephone: menage.telephone, texte: contenu })
          : await envoyerWhatsapp({ telephone: menage.telephone, texte: contenu });

      await prisma.notification.update({
        where: { id: trace.id },
        data: resultat.envoye
          ? { statut: 'ENVOYEE', envoyeLe: new Date() }
          : { statut: 'ECHEC', erreur: resultat.erreur ?? 'Echec inconnu' },
      });
    } catch (erreur) {
      console.error('[alertes] %s %s : %s', canal, modele, erreur instanceof Error ? erreur.message : erreur);
    }
  }
}
