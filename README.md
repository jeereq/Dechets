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

- **Site public** en trois langues (français, lingála, anglais) : accueil, nos
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
- Relecture de la traduction lingála par un locuteur.

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

`packages/shared` est compilé avant tout le reste : son `dist/` n'est pas
versionné. Trois garde-fous le garantissent, quel que soit l'outil de
déploiement :

- un `postinstall` à la racine le construit juste après `pnpm install` ;
- `apps/web` et `apps/api` le reconstruisent eux-mêmes dans leur `build` ;
- `vercel.json` fixe la commande de build et le dossier de sortie
  (`apps/web/.next`).

Sur Vercel, laissez la **racine du projet** sur le dépôt entier, pas sur
`apps/web` : le monorepo doit être installé depuis la racine.

L'API se déploie à part (`pnpm --filter @benime/api build`, puis
`node apps/api/dist/server.js`), avec `DATABASE_URL` vers votre PostgreSQL et
`CORS_ORIGINS` contenant l'adresse du site.

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

**Le lingála n'est pas relu.** `apps/web/src/lib/dictionnaires/ln.ts` ne
couvre que la navigation ; tout le reste retombe sur le français, ce qui est
voulu tant qu'un locuteur n'a pas relu.

## Conventions

- Le code, les noms de modèles et les commentaires sont en français.
- Pas de secret dans le dépôt : tout passe par `.env`.
- Cibles tactiles de 48 px au minimum, texte à 17 px au minimum, contrastes
  vérifiés (vert d'action 6,6:1 sur blanc, vert foncé 12,5:1).

---

BENIME CONGO SARL — 65A Avenue Lubefu, Quartier Mososo, Limete, Kinshasa.
