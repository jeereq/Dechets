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
- **Couches d'intégration** FlexPay (mobile money et carte) et notifications
  (SMS, WhatsApp), en mode simulé tant que les identifiants ne sont pas
  fournis.

## Ce qui reste à faire

- Application PWA des ménages (inscription, demande de collecte, paiement,
  reçus, messages) et application des agents de terrain.
- Back-office : abonnés, demandes, tournées, paiements, réalisations,
  personnel, zones, réglages.
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

## Points de vigilance

**Les prix sont des valeurs d'exemple.** `2 000 FC` par passage et
`7 000 FC` par mois viennent du seed (`apps/api/prisma/seed.ts`), pas de
BENIME. Ils s'affichent avec la mention « prix d'exemple ». Ils se changent
dans la table `Reglage`, sans redéploiement, et la mention doit être retirée
de `apps/web/src/lib/dictionnaires/*.ts` une fois les vrais tarifs posés.

**Une seule commune est ouverte**, Limete. Le statut de chaque commune vit en
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
