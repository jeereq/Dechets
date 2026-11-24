import assert from 'node:assert/strict';
import { construireApp } from '../src/app.js';
import { prisma } from '../src/prisma.js';

// Le test raisonne sur un prix par passage de 2 000 : on le fixe, quel que soit le tarif reel.
await prisma.reglage.upsert({ where: { cle: 'prix_par_passage' }, update: { valeur: '2000' }, create: { cle: 'prix_par_passage', valeur: '2000' } });
const app = await construireApp();
const appel = async (method: 'GET' | 'POST' | 'PATCH', url: string, payload?: unknown, jeton?: string) => {
  const r = await app.inject({ method, url, payload: payload as object, headers: jeton ? { authorization: `Bearer ${jeton}` } : {} });
  return { statut: r.statusCode, corps: r.json() as any };
};
const ok = (m: string) => console.log('  ok  ' + m);

// 1. connexion
let r = await appel('POST', '/auth/code', { telephone: '0812345678' });
assert.equal(r.statut, 200); const code = r.corps.data.codeDeTest; assert.match(code, /^\d{6}$/); ok('code envoye (+243812345678)');
r = await appel('POST', '/auth/code', { telephone: '0812345678' });
assert.equal(r.statut, 429); ok('deuxieme code trop vite refuse');
r = await appel('POST', '/auth/verifier', { telephone: '0812345678', code: '000000' });
assert.equal(r.statut, 401); ok('mauvais code refuse');
r = await appel('POST', '/auth/verifier', { telephone: '0812345678', code });
assert.equal(r.statut, 200); assert.equal(r.corps.data.type, 'VISITEUR'); let jeton = r.corps.data.jeton; ok('connexion visiteur');
r = await appel('POST', '/auth/verifier', { telephone: '0812345678', code });
assert.equal(r.statut, 401); ok('code a usage unique');

// 2. inscription
r = await appel('POST', '/menages', { nom: 'Marie K', communeSlug: 'lingwala', avenue: 'Kasa-Vubu', parcelle: '12', formule: 'PAR_PASSAGE' }, jeton);
assert.equal(r.statut, 201, JSON.stringify(r.corps)); jeton = r.corps.data.jeton;
assert.equal(r.corps.data.menage.code, 'MN-0001'); assert.equal(r.corps.data.menage.credit, 0); ok('inscription MN-0001, jeton de menage');
r = await appel('GET', '/moi', undefined, jeton); assert.equal(r.corps.data.type, 'MENAGE'); ok('/moi');
const v = await appel('POST', '/menages', { nom: 'X Y', communeSlug: 'lingwala', avenue: 'a', parcelle: '1', formule: 'MENSUELLE' }, jeton);
assert.equal(v.statut, 403); ok('menage ne peut pas se reinscrire');
r = await appel('PATCH', '/moi', { langue: 'EN', alerteWa: true }, jeton); assert.equal(r.corps.data.langue, 'EN'); ok('profil modifie');

// 3. demande sans credit
r = await appel('POST', '/demandes', { type: 'DES_QUE_POSSIBLE' }, jeton);
assert.equal(r.statut, 402); assert.equal(r.corps.manque, 2000); ok('demande refusee sans credit (manque 2000)');

// 4. recharge mobile money (mock) + suivi
r = await appel('POST', '/paiements', { mode: 'AIRTEL_MONEY', montant: 5000 }, jeton);
assert.equal(r.statut, 201, JSON.stringify(r.corps)); const ref = r.corps.data.reference; assert.equal(r.corps.data.etape, 'CONFIRMER_SUR_TELEPHONE'); ok('recharge ' + ref);
r = await appel('GET', `/paiements/${ref}`, undefined, jeton);
assert.equal(r.corps.data.statut, 'RECU'); assert.equal(r.corps.data.credit, 5000); ok('suivi : recu, credit 5000');
r = await appel('GET', `/paiements/${ref}`, undefined, jeton); assert.equal(r.corps.data.credit, 5000); ok('suivi repete : pas de double credit');
r = await appel('POST', `/webhooks/flexpay`, { code: '0', reference: ref }); assert.equal(r.statut, 200);
r = await appel('GET', '/moi', undefined, jeton); assert.equal(r.corps.data.menage.credit, 5000); ok('webhook rejoue : credit inchange');
r = await appel('GET', `/paiements/${ref}/recu`, undefined, jeton); assert.equal(r.statut, 200); assert.equal(r.corps.data.montant, 5000); ok('recu');

// 5. paiement carte (mock)
r = await appel('POST', '/paiements', { mode: 'CARTE', montant: 1000 }, jeton);
assert.equal(r.statut, 201); assert.equal(r.corps.data.etape, 'REDIRIGER'); assert.ok(r.corps.data.url); ok('carte : url de redirection');

// 6. demande OK, concurrence, annulation
r = await appel('POST', '/demandes', { type: 'DES_QUE_POSSIBLE' }, jeton);
assert.equal(r.statut, 201); assert.equal(r.corps.data.reference, 'DM-0001'); assert.equal(r.corps.data.credit, 3000); ok('demande DM-0001, credit 3000');
const idDemande = r.corps.data.id;
const [a, b, c] = await Promise.all([1, 2, 3].map(() => appel('POST', '/demandes', { type: 'PROCHAIN_PASSAGE' }, jeton)));
const statuts = [a, b, c].map((x) => x.statut).sort();
assert.deepEqual(statuts, [201, 402, 402].sort(), 'un seul passage avec 3000 de credit en concurrence : ' + statuts); 
r = await appel('GET', '/moi', undefined, jeton); assert.equal(r.corps.data.menage.credit, 1000); ok('3 demandes simultanees avec 3000 : une seule passe, credit 1000');
r = await appel('POST', `/demandes/${idDemande}/annuler`, {}, jeton); assert.equal(r.statut, 200); assert.equal(r.corps.data.credit, 3000);
r = await appel('POST', `/demandes/${idDemande}/annuler`, {}, jeton); assert.equal(r.statut, 409);
r = await appel('GET', '/moi', undefined, jeton); assert.equal(r.corps.data.menage.credit, 3000); ok('annulation : remboursee une seule fois');
r = await appel('POST', '/demandes', { type: 'JOUR_PRECIS' }, jeton); assert.equal(r.statut, 400); ok('jour precis sans date refuse');

// 7. encaissement agent
const agent = await prisma.personnel.create({ data: { nom: 'Agent R', telephone: '+243990000001', poste: 'RECOUVREMENT' } });
const a1 = await appel('POST', '/auth/code', { telephone: '0990000001' }); 
const a2 = await appel('POST', '/auth/verifier', { telephone: '0990000001', code: a1.corps.data.codeDeTest });
assert.equal(a2.corps.data.type, 'PERSONNEL'); const jetonAgent = a2.corps.data.jeton;
r = await appel('POST', '/encaissements', { menageCode: 'MN-0001', montant: 2000, mode: 'CASH' }, jeton); assert.equal(r.statut, 403); ok('un menage ne peut pas encaisser');
r = await appel('POST', '/encaissements', { menageCode: 'MN-0001', montant: 2000, mode: 'CASH' }, jetonAgent);
assert.equal(r.statut, 201); assert.equal(r.corps.data.statut, 'RECU');
r = await appel('POST', '/encaissements', { menageCode: 'MN-0001', montant: 4000, mode: 'VIREMENT' }, jetonAgent); assert.equal(r.corps.data.statut, 'A_RAPPROCHER');
r = await appel('GET', '/moi', undefined, jeton); assert.equal(r.corps.data.menage.credit, 5000); ok('cash credite, virement attend le rapprochement (credit 5000)');

// 8. securite
r = await appel('GET', '/moi'); assert.equal(r.statut, 401);
r = await appel('GET', '/moi', undefined, jeton.slice(0, -2) + 'xx'); assert.equal(r.statut, 401); ok('jeton absent ou falsifie refuse');
r = await appel('POST', '/menages', { nom: 'Z Z', communeSlug: 'gombe', avenue: 'Avenue Test', parcelle: '1', formule: 'MENSUELLE' }, (await (async () => { const c = await appel('POST','/auth/code',{telephone:'0970000002'}); const v2 = await appel('POST','/auth/verifier',{telephone:'0970000002',code:c.corps.data.codeDeTest}); return v2.corps.data.jeton; })()));
assert.equal(r.statut, 409); ok('commune non desservie refusee');

console.log('\nTous les controles passent.');
await prisma.$disconnect(); await app.close();
