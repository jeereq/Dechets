# BENIME CONGO Assainissement

Collecte des déchets des ménages à Kinshasa : site public, application des
ménages et des agents, back-office et API.

Ce dépôt est un **monorepo** : un front web et une API, qui partagent leurs
types.

```
apps/
  web/       site public (Next.js 15, App Router) — premier lot, en place
  api/       API REST (Fastify + Prisma + PostgreSQL)
packages/
  shared/    types et constantes partagés (communes, formules, modes de paiement)
```

## Ce qui est fait

- **Site public** en deux langues (français, anglais) : accueil, nos
  travaux, où nous passons, où vont vos déchets, formules et paiement,
  questions fréquentes.
- **API** : santé, communes, réglages publics, formulaire « prévenez-moi »,
  contact.
- **Schéma de données complet** du projet : ménages, équipes, personnel de
  terrain, demandes, passages, paiements, avis, réalisations, notifications,
  réglages.
- **Application des ménages « My BENIME »** (PWA, `/fr/espace` et `/en/espace`) :
  connexion par code SMS, inscription, demande de passage (annulable, crédit
  remboursé), recharge du crédit par mobile money ou carte, suivi du paiement,
  reçus imprimables, messages (SMS et WhatsApp), profil et langue. Installable
  sur l'écran d'accueil, avec un service worker pour l'ouverture hors réseau.
- **Back-office** (`/fr/gestion`, réservé au personnel, connexion par code SMS) :
  tableau de bord, abonnés (fiche détaillée), demandes de passage (planifier,
  terminer, annuler avec remboursement), tournées et équipes (préparer le jour,
  valider les passages), paiements (rapprochement des virements, encaissement
  espèces), zones (ouvrir une commune, prévenir par SMS ceux qui attendaient,
  messages du site), réalisations, équipe BENIME et réglages (prix, canaux).
  Le superviseur peut tout faire ; l'agent de recouvrement voit les abonnés et
  les paiements. Le premier superviseur se crée avec `ADMIN_TELEPHONE` dans
  `.env`, puis `pnpm db:seed`.
- **Application de terrain** (`/fr/terrain`, personnel, même code SMS et même
  session que le back-office, installable sur l'écran d'accueil) : le chauffeur
  ou l'éboueur voit la tournée de son équipe, note le résultat de chaque passage
  (collecté avec le nombre de sacs, accès impossible, etc.) et corrige tant que
  le superviseur n'a pas validé. Sans réseau, les résultats sont gardés sur le
  téléphone et envoyés au retour de la connexion ; la tournée déjà ouverte reste
  lisible. L'agent de recouvrement retrouve un abonné (numéro, nom, téléphone),
  encaisse en espèces ou note un virement, et suit sa caisse du jour. Les
  encaissements exigent toujours le réseau, pour ne jamais encaisser deux fois.
  Le superviseur voit toutes les équipes. API sous `/terrain`.
- **Couches d'intégration** FlexPay (mobile money et carte) et notifications
  (SMS, WhatsApp), en mode simulé tant que les identifiants ne sont pas
  fournis.

## Ce qui reste à faire

- Application de terrain : photos avant/après d'un passage (le stockage de
  fichiers n'existe pas encore), alerte à l'abonné quand son passage est fait.
- Back-office : envoi de photos pour les réalisations (aujourd'hui, un chemin
  d'image à renseigner), rappels automatiques de la veille d'un passage.
- Branchement réel de FlexPay, de la passerelle SMS et de WhatsApp.
- Carte interactive des communes (OpenStreetMap ou Google Maps) à la place du
  cadre actuel.

## Démarrer

Prérequis : Node.js 20+, pnpm 10+, Docker (pour PostgreSQL).

```bash
pnpm install                  # construit aussi packages/shared
cp .env.example .env          # puis remplir les valeurs
pnpm db:up                    # PostgreSQL dans Docker
pnpm --filter @benime/api prisma:migrate   # crée les tables
pnpm db:seed                  # 24 communes + réglages
pnpm dev                      # web sur :3000, api sur :4000
```

Le site fonctionne même si l'API est arrêtée : chaque lecture a une valeur de
repli, pour qu'une API en panne ne fasse jamais tomber le site public.

## Commandes

| Commande | Effet |
| --- | --- |
| `pnpm dev` | lance le web et l'API ensemble |
| `pnpm dev:web` / `pnpm dev:api` | lance l'un ou l'autre |
| `pnpm build` | compile shared, api puis web |
| `pnpm typecheck` | vérifie les types partout |
| `pnpm db:up` | démarre PostgreSQL |
| `pnpm db:migrate` | applique les migrations Prisma |
| `pnpm db:seed` | charge les communes et les réglages |

## Déploiement

### Le site (Vercel)

Le dépôt se construit que la racine du projet Vercel soit le dépôt entier ou
`apps/web` :

- **racine du dépôt** — `vercel.json` à la racine donne le framework, la
  commande de build et le dossier de sortie (`apps/web/.next`). Le
  `package.json` de la racine déclare `next` : sans cela, Vercel ne détecte
  pas le framework et s'arrête sur `NEXT_NO_VERSION`. Cette dépendance
  n'existe que pour la détection ; c'est `apps/web` qui construit le site.
- **`apps/web`** — `apps/web/vercel.json` prend alors le relais. Vercel
  installe quand même depuis la racine du dépôt, parce qu'il reconnaît
  l'espace de travail pnpm.

Si vous changez de réglage, gardez les deux fichiers : seul celui du dossier
racine choisi est lu.

### Le paquet partagé

`packages/shared` est compilé vers `dist/`, qui n'est pas versionné. Deux
garde-fous le construisent, quelle que soit la commande lancée :

- un `postinstall` à la racine, juste après `pnpm install` ;
- le `build` de `apps/web` et de `apps/api`, qui le recompile avant le sien.

### L'API

Elle se déploie à part, sur une machine qui accepte un serveur Node :

```bash
pnpm install
pnpm --filter @benime/api build
node apps/api/dist/server.js
```

Avec `DATABASE_URL` vers votre PostgreSQL et `CORS_ORIGINS` contenant
l'adresse du site. Le site reste consultable si l'API est arrêtée.

## Mise en service

Ce qui est vérifié : l'API contre une vraie base PostgreSQL (parcours des
ménages, back-office et application de terrain, y compris les envois en double
et simultanés) et l'interface contre cette API. Ce qui ne l'est pas encore : le
vrai fournisseur SMS et FlexPay, faute d'identifiants. À faire dans l'ordre :

1. **Base de données.** Créer la base PostgreSQL, renseigner `DATABASE_URL`,
   puis `pnpm --filter @benime/api exec prisma migrate deploy` (la migration
   initiale est dans `apps/api/prisma/migrations`).
2. **Secrets.** `JWT_SECRET` (32 caractères au moins, aléatoire) est
   obligatoire en production. `NODE_ENV=production` empêche l'API de renvoyer
   le code SMS de test.
3. **Premier superviseur.** `ADMIN_TELEPHONE=+243XXXXXXXXX` (et `ADMIN_NOM`),
   puis `pnpm db:seed`. Cette personne ajoute ensuite le reste de l'équipe
   depuis le back-office.
4. **Passerelle SMS.** Sans elle, personne ne reçoit de code de connexion : c'est
   le point bloquant. Renseigner `SMS_PROVIDER`, `SMS_API_URL`, `SMS_API_KEY`
   (`apps/api/src/services/alertes.ts`) et tester avec son propre numéro.
5. **FlexPay.** `FLEXPAY_MERCHANT`, `FLEXPAY_TOKEN`, `FLEXPAY_CALLBACK_URL`
   (adresse publique de l'API, `/webhooks/flexpay`) et `FLEXPAY_CALLBACK_SECRET`
   (ajouté à l'adresse de rappel sous la forme `?cle=…`). Faire un premier
   paiement de 500 FC avec un vrai compte avant d'ouvrir au public.
6. **Site.** `NEXT_PUBLIC_API_URL` vers l'API publique, `CORS_ORIGINS` de l'API
   vers l'adresse du site, `NEXT_PUBLIC_SITE_URL` vers le vrai domaine.

Tests contre une base **neuve** (`prisma db push --force-reset` puis
`pnpm db:seed`, sans `ADMIN_TELEPHONE`) :

```bash
pnpm --filter @benime/api test:e2e           # ménages : connexion, crédit, paiements
pnpm --filter @benime/api test:e2e:terrain   # back-office et terrain
```

## Points de vigilance

**Les prix viennent de la grille tarifaire.** `6 000 FC` par évacuation et
`15 USD` par mois (ménage simple) viennent de la grille tarifaire du 18/11/2026
et sont posés par le seed (`apps/api/prisma/seed.ts`). Ils se changent dans la
table `Reglage`, sans redéploiement. La grille complète (appartement, commerce,
école, hôtel, etc.) est dans `apps/web/src/lib/dictionnaires/*.ts` (`formules.grille`).

**Une seule commune est ouverte**, Lingwala (le pilote). Le statut de chaque commune vit en
base ; le back-office l'ouvre ou la ferme, et le site suit.

**Les photos manquantes sont visibles.** Là où il n'y a pas encore de photo
(avant/après de chantier, installation énergie), le site affiche un cadre
« Photo à fournir » plutôt qu'une image qui ne correspond pas.

## Conventions

- Le code, les noms de modèles et les commentaires sont en français.
- Pas de secret dans le dépôt : tout passe par `.env`.
- Cibles tactiles de 48 px au minimum, texte à 17 px au minimum, contrastes
  vérifiés (vert d'action 6,6:1 sur blanc, vert foncé 12,5:1).

---

BENIME CONGO SARL — 65A Avenue Lubefu, Quartier Mososo, Limete, Kinshasa.
