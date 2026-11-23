import { construireApp } from './app.js';
import { env } from './env.js';
import { prisma } from './prisma.js';

async function demarrer() {
  const app = await construireApp();

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    app.log.info(`API BENIME prete sur http://${env.API_HOST}:${env.API_PORT}`);
  } catch (erreur) {
    app.log.error(erreur);
    process.exit(1);
  }

  const arreter = async (signal: string) => {
    app.log.info(`Arret demande (${signal})`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void arreter('SIGINT'));
  process.on('SIGTERM', () => void arreter('SIGTERM'));
}

void demarrer();
