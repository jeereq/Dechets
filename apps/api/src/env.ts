import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// Le .env vit a la racine du monorepo pour que le web et l'API partagent
// les memes valeurs.
config({ path: resolve(process.cwd(), '../../.env') });
config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Secret de signature des sessions. Obligatoire en production.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caracteres').optional(),
  SESSION_JOURS: z.coerce.number().int().positive().default(30),

  FLEXPAY_BASE_URL: z.string().default('https://backend.flexpay.cd/api/rest/v1'),
  FLEXPAY_MERCHANT: z.string().optional(),
  FLEXPAY_TOKEN: z.string().optional(),
  FLEXPAY_CALLBACK_URL: z.string().optional(),
  // Valeur secrete ajoutee a l'adresse de rappel (?cle=...) pour reconnaitre FlexPay.
  FLEXPAY_CALLBACK_SECRET: z.string().optional(),
  FLEXPAY_CARD_URL: z.string().default('https://cardpayment.flexpay.cd/v1.1/pay'),
  SITE_URL: z.string().default('http://localhost:3000'),

  SMS_PROVIDER: z.string().default('mock'),
  SMS_API_URL: z.string().optional(),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().default('BENIME'),

  WHATSAPP_PROVIDER: z.string().default('mock'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuration invalide :');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && !parsed.data.JWT_SECRET) {
  console.error('JWT_SECRET est obligatoire en production.');
  process.exit(1);
}

export const env = {
  ...parsed.data,
  // Cle de developpement : jamais utilisee en production (voir ci-dessus).
  JWT_SECRET: parsed.data.JWT_SECRET ?? 'cle-de-developpement-benime-a-ne-pas-utiliser-en-production',
};

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
