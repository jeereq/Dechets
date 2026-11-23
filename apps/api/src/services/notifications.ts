import { env } from '../env.js';

/**
 * Envoi des alertes aux menages.
 *
 * Deux canaux, une seule interface. Tant qu'un fournisseur n'est pas branche,
 * le mode « mock » journalise le message au lieu de l'envoyer : le reste du
 * code ne change pas le jour ou les identifiants arrivent.
 */

export interface MessageSortant {
  telephone: string; // format international, +243...
  texte: string;
}

export interface ResultatEnvoi {
  envoye: boolean;
  fournisseur: string;
  reference?: string;
  erreur?: string;
}

export async function envoyerSms(message: MessageSortant): Promise<ResultatEnvoi> {
  if (env.SMS_PROVIDER === 'mock' || !env.SMS_API_URL || !env.SMS_API_KEY) {
    console.info('[sms:mock] %s -> %s', message.telephone, message.texte);
    return { envoye: true, fournisseur: 'mock' };
  }

  try {
    const reponse = await fetch(env.SMS_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.SMS_API_KEY}`,
      },
      body: JSON.stringify({
        to: message.telephone,
        from: env.SMS_SENDER_ID,
        text: message.texte,
      }),
    });

    if (!reponse.ok) {
      return {
        envoye: false,
        fournisseur: env.SMS_PROVIDER,
        erreur: `HTTP ${reponse.status}`,
      };
    }

    const corps = (await reponse.json().catch(() => ({}))) as { id?: string };
    return { envoye: true, fournisseur: env.SMS_PROVIDER, reference: corps.id };
  } catch (erreur) {
    return {
      envoye: false,
      fournisseur: env.SMS_PROVIDER,
      erreur: erreur instanceof Error ? erreur.message : 'Erreur inconnue',
    };
  }
}

export async function envoyerWhatsapp(message: MessageSortant): Promise<ResultatEnvoi> {
  if (
    env.WHATSAPP_PROVIDER === 'mock' ||
    !env.WHATSAPP_PHONE_NUMBER_ID ||
    !env.WHATSAPP_TOKEN
  ) {
    console.info('[whatsapp:mock] %s -> %s', message.telephone, message.texte);
    return { envoye: true, fournisseur: 'mock' };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const reponse = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: message.telephone,
        type: 'text',
        text: { body: message.texte },
      }),
    });

    if (!reponse.ok) {
      return {
        envoye: false,
        fournisseur: 'meta-cloud',
        erreur: `HTTP ${reponse.status}`,
      };
    }

    return { envoye: true, fournisseur: 'meta-cloud' };
  } catch (erreur) {
    return {
      envoye: false,
      fournisseur: 'meta-cloud',
      erreur: erreur instanceof Error ? erreur.message : 'Erreur inconnue',
    };
  }
}
