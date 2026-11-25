import { PrismaClient } from '@prisma/client';
import { COMMUNES_KINSHASA } from '@benime/shared';

const prisma = new PrismaClient();

/**
 * Donnees de depart.
 *
 * Seules les communes et les reglages sont des donnees reelles : les prix
 * sont des valeurs d'exemple, a remplacer par les tarifs de BENIME avant
 * toute mise en ligne.
 */
async function main() {
  for (const commune of COMMUNES_KINSHASA) {
    await prisma.commune.upsert({
      where: { slug: commune.slug },
      update: { nom: commune.nom },
      create: {
        slug: commune.slug,
        nom: commune.nom,
        statut: commune.statut,
        ouverteLe: commune.statut === 'OUVERTE' ? new Date() : null,
      },
    });
  }
  console.info('%d communes enregistrees', COMMUNES_KINSHASA.length);

  const reglages: Array<{ cle: string; valeur: string }> = [
    { cle: 'prix_par_passage', valeur: '6000' }, // grille du 18/11/2026, menage simple, en CDF
    { cle: 'prix_mensuel', valeur: '15' }, // grille du 18/11/2026, menage simple
    { cle: 'devise_mensuel', valeur: 'USD' },
    { cle: 'passages_par_semaine', valeur: '1' },
    { cle: 'devise', valeur: 'CDF' },
    { cle: 'alerte_veille_passage', valeur: 'true' },
    { cle: 'canal_sms', valeur: 'true' },
    { cle: 'canal_whatsapp', valeur: 'true' },
  ];

  for (const reglage of reglages) {
    await prisma.reglage.upsert({
      where: { cle: reglage.cle },
      update: {},
      create: reglage,
    });
  }
  console.info('%d reglages enregistres', reglages.length);

  // Premier superviseur : sans lui, personne ne peut ouvrir le back-office.
  // Renseigner ADMIN_TELEPHONE (et ADMIN_NOM) dans .env avant `pnpm db:seed`.
  const telephone = process.env.ADMIN_TELEPHONE?.replace(/[\s.-]/g, '');
  if (telephone && /^\+243\d{9}$/.test(telephone)) {
    await prisma.personnel.upsert({
      where: { telephone },
      update: { poste: 'SUPERVISEUR', actif: true },
      create: { telephone, nom: process.env.ADMIN_NOM?.trim() || 'Superviseur', poste: 'SUPERVISEUR' },
    });
    console.info('Superviseur enregistre : %s', telephone);
  } else {
    console.info('ADMIN_TELEPHONE absent ou invalide (format +243XXXXXXXXX) : aucun superviseur cree.');
  }
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
