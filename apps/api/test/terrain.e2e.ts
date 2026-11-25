import assert from 'node:assert/strict';
import { construireApp } from '../src/app.js';
import { prisma } from '../src/prisma.js';

/**
 * Back-office et application de terrain, de bout en bout, contre une vraie base.
 * Partir d'une base neuve : `prisma db push --force-reset` puis `pnpm prisma:seed`.
 */
await prisma.reglage.upsert({ where: { cle: 'prix_par_passage' }, update: { valeur: '2000' }, create: { cle: 'prix_par_passage', valeur: '2000' } });
const app = await construireApp();
const appel = async (method: 'GET' | 'POST' | 'PATCH', url: string, payload?: unknown, jeton?: string) => {
  const r = await app.inject({ method, url, payload: payload as object, headers: jeton ? { authorization: `Bearer ${jeton}` } : {} });
  return { statut: r.statusCode, corps: r.json() as any };
};
const ok = (m: string) => console.log('  ok  ' + m);

const aujourdhui = new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 10);
const demain = new Date(Date.now() + 25 * 3600 * 1000).toISOString().slice(0, 10);
const jourIso = (d: string) => { const j = new Date(`${d}T00:00:00Z`).getUTCDay(); return j === 0 ? 7 : j; };

async function connecter(telephone: string) {
  let r = await appel('POST', '/auth/code', { telephone });
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  r = await appel('POST', '/auth/verifier', { telephone, code: r.corps.data.codeDeTest, espace: 'PERSONNEL' });
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.equal(r.corps.data.type, 'PERSONNEL');
  return r.corps.data.jeton as string;
}

// --- jeu de donnees ------------------------------------------------------------
const lingwala = await prisma.commune.findUniqueOrThrow({ where: { slug: 'lingwala' } });
const chefP = await prisma.personnel.create({ data: { nom: 'Grace Chef', telephone: '+243811000001', poste: 'SUPERVISEUR' } });
const chauffeurP = await prisma.personnel.create({ data: { nom: 'Jean Chauffeur', telephone: '+243811000002', poste: 'CHAUFFEUR' } });
const eboueurP = await prisma.personnel.create({ data: { nom: 'Paul Eboueur', telephone: '+243811000003', poste: 'EBOUEUR' } });
const recouvrP = await prisma.personnel.create({ data: { nom: 'Sarah Recouvrement', telephone: '+243811000004', poste: 'RECOUVREMENT' } });
const seulP = await prisma.personnel.create({ data: { nom: 'Luc Sans Equipe', telephone: '+243811000005', poste: 'EBOUEUR' } });

const tChef = await connecter(chefP.telephone);
const tChauf = await connecter(chauffeurP.telephone);
const tEbou = await connecter(eboueurP.telephone);
const tRec = await connecter(recouvrP.telephone);
const tSeul = await connecter(seulP.telephone);
ok('cinq membres du personnel connectes (espace PERSONNEL)');

// --- 1. droits par poste -------------------------------------------------------
let r = await appel('GET', '/gestion/moi', undefined, tChauf);
assert.equal(r.statut, 403); ok('chauffeur : pas de back-office');
r = await appel('GET', '/gestion/tableau', undefined, tRec);
assert.equal(r.statut, 200); ok('recouvrement : tableau de bord ouvert');
r = await appel('POST', '/gestion/passages/generer', { date: aujourdhui }, tRec);
assert.equal(r.statut, 403); ok('recouvrement : ne prepare pas les tournees');
r = await appel('GET', '/terrain/abonnes?q=MN', undefined, tChauf);
assert.equal(r.statut, 403); ok('chauffeur : pas de recherche d\'abonnes');
r = await appel('GET', '/terrain/tournee', undefined, tRec);
assert.equal(r.statut, 403); ok('recouvrement : pas de tournee');
r = await appel('POST', '/encaissements', { menageCode: 'MN-0001', montant: 1000, mode: 'CASH' }, tChauf);
assert.equal(r.statut, 403); ok('chauffeur : n\'encaisse pas');
r = await appel('GET', '/terrain/moi');
assert.equal(r.statut, 401); ok('sans jeton : 401');

// --- 2. le superviseur prepare la tournee ---------------------------------------
r = await appel('POST', '/gestion/equipes', { nom: 'Equipe 1', vehicule: 'TRICYCLE', jours: [1, 2, 3, 4, 5, 6, 7], communeSlug: 'lingwala' }, tChef);
assert.equal(r.statut, 201, JSON.stringify(r.corps)); const e1 = r.corps.data.id as string;
r = await appel('POST', '/gestion/equipes', { nom: 'Equipe 2', vehicule: 'CAMION', jours: [1, 2, 3, 4, 5, 6, 7], communeSlug: 'lingwala' }, tChef);
const e2 = r.corps.data.id as string;
for (const [p, e] of [[chauffeurP.id, e1], [eboueurP.id, e2]] as const) {
  r = await appel('PATCH', `/gestion/personnel/${p}`, { equipeId: e }, tChef); assert.equal(r.statut, 200);
}
const menages = [];
for (let i = 1; i <= 5; i++) {
  menages.push(await prisma.menage.create({ data: {
    code: `MN-000${i}`, nom: `Abonne ${i}`, telephone: `+24382000000${i}`, communeId: lingwala.id,
    avenue: `Avenue ${i}`, parcelle: String(i), formule: 'MENSUELLE', credit: 1000 * i,
    statut: i === 5 ? 'SUSPENDU' : 'ACTIF', equipeId: i <= 3 ? e1 : e2,
  } }));
}
ok('2 equipes, 5 abonnes (3 en equipe 1, 2 en equipe 2 dont 1 suspendu)');

r = await appel('POST', '/gestion/passages/generer', { date: aujourdhui }, tChef);
assert.equal(r.corps.data.crees, 4, JSON.stringify(r.corps)); ok('tournee generee : 4 passages (le suspendu est exclu)');
r = await appel('POST', '/gestion/passages/generer', { date: aujourdhui }, tChef);
assert.equal(r.corps.data.crees, 0); ok('generer deux fois : aucun doublon');

// --- 3. la tournee vue par le terrain -------------------------------------------
r = await appel('GET', '/terrain/tournee', undefined, tChauf);
assert.equal(r.statut, 200); assert.equal(r.corps.data.date, aujourdhui);
assert.equal(r.corps.data.passages.length, 3); assert.equal(r.corps.data.bilan.aFaire, 3);
assert.ok(r.corps.data.passages.every((p: any) => p.equipe.id === e1)); ok('chauffeur : voit seulement l\'equipe 1');
const p1 = r.corps.data.passages[0].id as string; const p2 = r.corps.data.passages[1].id as string; const p3 = r.corps.data.passages[2].id as string;
r = await appel('GET', '/terrain/tournee', undefined, tSeul);
assert.deepEqual(r.corps.data.passages, []); ok('agent sans equipe : tournee vide, pas d\'erreur');
r = await appel('GET', '/terrain/tournee', undefined, tChef);
assert.equal(r.corps.data.passages.length, 4); assert.equal(r.corps.data.equipes.length, 2); ok('superviseur : voit les 2 equipes');
r = await appel('GET', `/terrain/tournee?equipeId=${e2}`, undefined, tChef);
assert.equal(r.corps.data.passages.length, 1); ok('superviseur : filtre par equipe');

// --- 4. noter un passage --------------------------------------------------------
r = await appel('POST', `/terrain/passages/${p1}/marquer`, { resultat: 'COLLECTE' }, tChauf);
assert.equal(r.statut, 400); ok('collecte sans nombre de sacs refusee');
r = await appel('POST', `/terrain/passages/${p1}/marquer`, { resultat: 'COLLECTE', nbSacs: 0 }, tChauf);
assert.equal(r.statut, 400); ok('0 sac refuse');
r = await appel('POST', `/terrain/passages/${p1}/marquer`, { resultat: 'COLLECTE', nbSacs: 4 }, tEbou);
assert.equal(r.statut, 403); ok('l\'equipe 2 ne note pas un passage de l\'equipe 1');
r = await appel('POST', `/terrain/passages/${p1}/marquer`, { resultat: 'COLLECTE', nbSacs: 4 }, tChauf);
assert.equal(r.statut, 200, JSON.stringify(r.corps));
let p = await prisma.passage.findUniqueOrThrow({ where: { id: p1 } });
assert.equal(p.statut, 'FAIT'); assert.equal(p.nbSacs, 4); assert.equal(p.agentId, chauffeurP.id); ok('passage note : FAIT, 4 sacs, agent enregistre');
r = await appel('POST', `/terrain/passages/${p1}/marquer`, { resultat: 'COLLECTE', nbSacs: 4 }, tChauf);
assert.equal(r.statut, 200); ok('meme envoi rejoue (reseau) : accepte, sans effet de bord');
r = await appel('POST', `/terrain/passages/${p1}/marquer`, { resultat: 'ACCES_IMPOSSIBLE', nbSacs: 9 }, tChauf);
assert.equal(r.statut, 200);
p = await prisma.passage.findUniqueOrThrow({ where: { id: p1 } });
assert.equal(p.resultat, 'ACCES_IMPOSSIBLE'); assert.equal(p.nbSacs, null); ok('correction : nouveau resultat, sacs remis a zero');
r = await appel('POST', '/terrain/passages/inconnu/marquer', { resultat: 'RIEN_A_PRENDRE' }, tChauf);
assert.equal(r.statut, 404); ok('passage inconnu : 404');

// cinq envois simultanes du meme passage (file d'attente qui repart)
const rafale = await Promise.all(Array.from({ length: 5 }, () => appel('POST', `/terrain/passages/${p2}/marquer`, { resultat: 'COLLECTE', nbSacs: 2 }, tChauf)));
assert.ok(rafale.every((x) => x.statut === 200));
p = await prisma.passage.findUniqueOrThrow({ where: { id: p2 } });
assert.equal(p.statut, 'FAIT'); assert.equal(p.nbSacs, 2); ok('5 envois simultanes : un seul etat final coherent');

// futur
await appel('POST', '/gestion/passages/generer', { date: demain }, tChef);
const futur = await prisma.passage.findFirstOrThrow({ where: { equipeId: e1, date: new Date(`${demain}T00:00:00Z`) } });
r = await appel('POST', `/terrain/passages/${futur.id}/marquer`, { resultat: 'RIEN_A_PRENDRE' }, tChauf);
assert.equal(r.statut, 409); ok('passage de demain : refuse aujourd\'hui');

// --- 5. validation et refus par le superviseur -----------------------------------
r = await appel('POST', `/gestion/passages/${p2}/valider`, undefined, tChef); assert.equal(r.statut, 200); ok('superviseur valide');
r = await appel('POST', `/terrain/passages/${p2}/marquer`, { resultat: 'RIEN_A_PRENDRE' }, tChauf);
assert.equal(r.statut, 409); ok('passage valide : le terrain ne peut plus le changer');
r = await appel('POST', `/gestion/passages/${p1}/refuser`, undefined, tChef); assert.equal(r.statut, 200);
r = await appel('POST', `/terrain/passages/${p1}/marquer`, { resultat: 'COLLECTE', nbSacs: 3 }, tChauf);
assert.equal(r.statut, 200);
p = await prisma.passage.findUniqueOrThrow({ where: { id: p1 } });
assert.equal(p.statut, 'FAIT'); ok('passage refuse : le terrain le refait');
r = await appel('GET', '/terrain/tournee', undefined, tChauf);
assert.equal(r.corps.data.bilan.faits, 2); assert.equal(r.corps.data.bilan.sacs, 5); assert.equal(r.corps.data.bilan.aFaire, 1); ok('bilan : 2 faits, 5 sacs, 1 a faire');
void p3;

// --- 6. demande planifiee --------------------------------------------------------
const dem = await prisma.demandeCollecte.create({ data: { reference: 'DM-9001', menageId: menages[2]!.id, type: 'DES_QUE_POSSIBLE', cout: 2000, statut: 'RECUE' } });
r = await appel('POST', `/gestion/demandes/${dem.id}/planifier`, { datePlanifiee: `${aujourdhui}T00:00:00.000Z`, equipeId: e1 }, tChef);
assert.equal(r.statut, 200, JSON.stringify(r.corps));
r = await appel('GET', '/terrain/tournee', undefined, tChauf);
const ligne = r.corps.data.passages.find((x: any) => x.menage.code === 'MN-0003');
assert.equal(ligne.demande, 'DM-9001'); ok('la demande planifiee apparait sur la fiche du passage');
r = await appel('POST', `/terrain/passages/${ligne.id}/marquer`, { resultat: 'COLLECTE', nbSacs: 1 }, tChauf); assert.equal(r.statut, 200);
r = await appel('POST', `/gestion/passages/${ligne.id}/valider`, undefined, tChef); assert.equal(r.statut, 200);
assert.equal((await prisma.demandeCollecte.findUniqueOrThrow({ where: { id: dem.id } })).statut, 'TERMINEE'); ok('validation du passage : demande terminee');

// --- 7. encaissements ------------------------------------------------------------
r = await appel('GET', '/terrain/abonnes?q=a', undefined, tRec); assert.equal(r.statut, 400); ok('recherche d\'un seul caractere refusee');
r = await appel('GET', '/terrain/abonnes?q=MN-0002', undefined, tRec);
assert.equal(r.corps.data.length, 1); assert.equal(r.corps.data[0].credit, 2000); ok('recherche par numero');
r = await appel('GET', '/terrain/abonnes?q=abonne', undefined, tRec); assert.equal(r.corps.data.length, 5); ok('recherche par nom');
r = await appel('GET', '/terrain/abonnes?q=0820000003', undefined, tRec); assert.equal(r.corps.data.length, 1); ok('recherche par telephone');
r = await appel('POST', '/encaissements', { menageCode: 'MN-0002', montant: 100, mode: 'CASH' }, tRec);
assert.equal(r.statut, 400); ok('montant trop bas refuse');
r = await appel('POST', '/encaissements', { menageCode: 'MN-9999', montant: 5000, mode: 'CASH' }, tRec);
assert.equal(r.statut, 404); ok('abonne inconnu : 404');
r = await appel('POST', '/encaissements', { menageCode: 'MN-0002', montant: 12000, mode: 'CASH', objet: 'RECHARGE_CREDIT' }, tRec);
assert.equal(r.statut, 201); assert.equal(r.corps.data.statut, 'RECU');
assert.equal((await prisma.menage.findUniqueOrThrow({ where: { code: 'MN-0002' } })).credit, 14000); ok('especes : credit 2000 -> 14000');
r = await appel('POST', '/encaissements', { menageCode: 'MN-0004', montant: 30000, mode: 'VIREMENT', objet: 'ABONNEMENT' }, tRec);
assert.equal(r.statut, 201); assert.equal(r.corps.data.statut, 'A_RAPPROCHER'); const virement = r.corps.data.id as string;
assert.equal((await prisma.menage.findUniqueOrThrow({ where: { code: 'MN-0004' } })).credit, 4000); ok('virement : a rapprocher, credit inchange');
r = await appel('GET', '/terrain/encaissements', undefined, tRec);
assert.equal(r.corps.data.especes, 12000); assert.equal(r.corps.data.virements, 30000); assert.equal(r.corps.data.elements.length, 2); ok('caisse du jour : 12 000 especes, 30 000 virement');
r = await appel('GET', '/terrain/encaissements', undefined, tChef);
assert.equal(r.corps.data.elements.length, 0); ok('la caisse est personnelle (le superviseur n\'a rien encaisse)');
r = await appel('POST', `/gestion/paiements/${virement}/confirmer`, undefined, tRec); assert.equal(r.statut, 403); ok('recouvrement ne confirme pas un virement');
r = await appel('POST', `/gestion/paiements/${virement}/confirmer`, undefined, tChef); assert.equal(r.statut, 200);
const dbl = await Promise.all([1, 2, 3].map(() => appel('POST', `/gestion/paiements/${virement}/confirmer`, undefined, tChef)));
assert.ok(dbl.every((x) => x.statut === 200));
assert.equal((await prisma.menage.findUniqueOrThrow({ where: { code: 'MN-0004' } })).credit, 34000); ok('virement confirme une seule fois meme en rafale (credit 34 000)');

// --- 8. acces retire = effet immediat --------------------------------------------
r = await appel('PATCH', `/gestion/personnel/${chefP.id}`, { actif: false }, tChef);
assert.equal(r.statut, 409); ok('on ne se retire pas soi-meme');
r = await appel('PATCH', `/gestion/personnel/${chauffeurP.id}`, { actif: false }, tChef); assert.equal(r.statut, 200);
r = await appel('GET', '/terrain/tournee', undefined, tChauf);
assert.equal(r.statut, 401); ok('chauffeur desactive : son jeton ne marche plus tout de suite');
r = await appel('POST', `/terrain/passages/${p1}/marquer`, { resultat: 'RIEN_A_PRENDRE' }, tChauf);
assert.equal(r.statut, 401); ok('...ni pour noter un passage');

// --- 9. tableau de bord coherent --------------------------------------------------
r = await appel('GET', '/gestion/tableau', undefined, tChef);
assert.equal(r.statut, 200);
assert.equal(r.corps.data.passagesAValider, 1, JSON.stringify(r.corps.data)); ok('tableau : 1 passage a valider (p1)');

console.log('\nTous les controles passent.');
await prisma.$disconnect();
await app.close();
