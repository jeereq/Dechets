import { z } from 'zod';

/**
 * Accepte les numeros congolais ecrits comme les gens les ecrivent :
 * « 0812345678 », « 812 345 678 », « +243812345678 ».
 * Renvoie toujours le format international : +243812345678.
 */
export const telephoneSchema = z
  .string()
  .trim()
  .min(9, 'Numero trop court')
  .max(20, 'Numero trop long')
  .transform((v) => v.replace(/[\s.-]/g, ''))
  .refine((v) => /^(\+?243|0)?\d{9}$/.test(v), 'Numero de telephone invalide')
  .transform((v) => {
    const chiffres = v.replace(/^\+?243/, '').replace(/^0/, '');
    return `+243${chiffres}`;
  });
