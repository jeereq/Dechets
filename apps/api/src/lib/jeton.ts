import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../env.js';

/**
 * Jeton de session signe (HMAC-SHA256), au format JWT.
 * Volontairement sans dependance : quelques lignes suffisent et le format
 * reste lisible par n'importe quel outil standard.
 */

export type TypeSession = 'VISITEUR' | 'MENAGE' | 'PERSONNEL';

export interface Session {
  /** Telephone verifie par code SMS. */
  tel: string;
  typ: TypeSession;
  /** Identifiant du menage ou du membre du personnel. */
  id?: string;
}

interface Charge extends Session {
  iat: number;
  exp: number;
}

const base64url = (valeur: Buffer | string) => Buffer.from(valeur).toString('base64url');
const signature = (donnees: string) =>
  createHmac('sha256', env.JWT_SECRET).update(donnees).digest();

const ENTETE = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

export function signerJeton(session: Session, dureeSecondes: number): string {
  const maintenant = Math.floor(Date.now() / 1000);
  const charge: Charge = { ...session, iat: maintenant, exp: maintenant + dureeSecondes };
  const corps = `${ENTETE}.${base64url(JSON.stringify(charge))}`;
  return `${corps}.${base64url(signature(corps))}`;
}

export function verifierJeton(jeton: string): Session | null {
  const parties = jeton.split('.');
  if (parties.length !== 3 || parties[0] !== ENTETE) return null;

  const attendue = signature(`${parties[0]}.${parties[1]}`);
  const recue = Buffer.from(parties[2] ?? '', 'base64url');
  if (recue.length !== attendue.length || !timingSafeEqual(recue, attendue)) return null;

  try {
    const charge = JSON.parse(Buffer.from(parties[1] ?? '', 'base64url').toString()) as Charge;
    if (typeof charge.exp !== 'number' || charge.exp < Math.floor(Date.now() / 1000)) return null;
    if (!['VISITEUR', 'MENAGE', 'PERSONNEL'].includes(charge.typ)) return null;
    return { tel: charge.tel, typ: charge.typ, id: charge.id };
  } catch {
    return null;
  }
}
