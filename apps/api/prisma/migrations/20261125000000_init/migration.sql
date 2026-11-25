-- CreateEnum
CREATE TYPE "StatutCommune" AS ENUM ('OUVERTE', 'DEMANDES_RECUES', 'FERMEE');

-- CreateEnum
CREATE TYPE "Formule" AS ENUM ('PAR_PASSAGE', 'MENSUELLE');

-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('FR', 'EN');

-- CreateEnum
CREATE TYPE "StatutMenage" AS ENUM ('ACTIF', 'SUSPENDU', 'RESILIE');

-- CreateEnum
CREATE TYPE "Poste" AS ENUM ('SUPERVISEUR', 'CHAUFFEUR', 'EBOUEUR', 'RECOUVREMENT');

-- CreateEnum
CREATE TYPE "Vehicule" AS ENUM ('CAMION', 'TRICYCLE');

-- CreateEnum
CREATE TYPE "TypeDemande" AS ENUM ('DES_QUE_POSSIBLE', 'JOUR_PRECIS', 'PROCHAIN_PASSAGE');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('RECUE', 'PLANIFIEE', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "ResultatPassage" AS ENUM ('COLLECTE', 'PERSONNE_SUR_PLACE', 'ACCES_IMPOSSIBLE', 'DECHETS_REFUSES', 'RIEN_A_PRENDRE');

-- CreateEnum
CREATE TYPE "StatutPassage" AS ENUM ('A_FAIRE', 'FAIT', 'VALIDE', 'REFUSE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('AIRTEL_MONEY', 'ORANGE_MONEY', 'M_PESA', 'AFRIMONEY', 'CARTE', 'CASH', 'VIREMENT');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'RECU', 'A_RAPPROCHER', 'ECHEC');

-- CreateEnum
CREATE TYPE "ObjetPaiement" AS ENUM ('PASSAGE', 'ABONNEMENT', 'RECHARGE_CREDIT');

-- CreateEnum
CREATE TYPE "Canal" AS ENUM ('SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "StatutNotification" AS ENUM ('EN_ATTENTE', 'ENVOYEE', 'ECHEC');

-- CreateTable
CREATE TABLE "Commune" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" "StatutCommune" NOT NULL DEFAULT 'FERMEE',
    "ouverteLe" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "nom" TEXT,
    "communeId" TEXT NOT NULL,
    "prevenuLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageContact" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "traiteLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "communeId" TEXT NOT NULL,
    "avenue" TEXT NOT NULL,
    "parcelle" TEXT NOT NULL,
    "repere" TEXT,
    "formule" "Formule" NOT NULL DEFAULT 'MENSUELLE',
    "langue" "Langue" NOT NULL DEFAULT 'FR',
    "alerteSms" BOOLEAN NOT NULL DEFAULT true,
    "alerteWa" BOOLEAN NOT NULL DEFAULT true,
    "credit" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutMenage" NOT NULL DEFAULT 'ACTIF',
    "equipeId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipe" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "vehicule" "Vehicule" NOT NULL DEFAULT 'TRICYCLE',
    "jours" INTEGER[],
    "communeId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personnel" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "poste" "Poste" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "equipeId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeCollecte" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "menageId" TEXT NOT NULL,
    "type" "TypeDemande" NOT NULL DEFAULT 'DES_QUE_POSSIBLE',
    "dateSouhaitee" TIMESTAMP(3),
    "cout" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutDemande" NOT NULL DEFAULT 'RECUE',
    "equipeId" TEXT,
    "datePlanifiee" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandeCollecte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL,
    "menageId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" "StatutPassage" NOT NULL DEFAULT 'A_FAIRE',
    "resultat" "ResultatPassage",
    "nbSacs" INTEGER,
    "photoAvant" TEXT,
    "photoApres" TEXT,
    "agentId" TEXT,
    "valideParId" TEXT,
    "valideLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "menageId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "mode" "ModePaiement" NOT NULL,
    "objet" "ObjetPaiement" NOT NULL DEFAULT 'PASSAGE',
    "statut" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "flexpayOrderNumber" TEXT,
    "flexpayReference" TEXT,
    "agentId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avis" (
    "id" TEXT NOT NULL,
    "menageId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Realisation" (
    "id" TEXT NOT NULL,
    "lieu" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "legende" TEXT,
    "photoAvant" TEXT,
    "photoApres" TEXT,
    "publiee" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Realisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "menageId" TEXT NOT NULL,
    "canal" "Canal" NOT NULL,
    "modele" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "statut" "StatutNotification" NOT NULL DEFAULT 'EN_ATTENTE',
    "envoyeLe" TIMESTAMP(3),
    "erreur" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reglage" (
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reglage_pkey" PRIMARY KEY ("cle")
);

-- CreateTable
CREATE TABLE "CodeConnexion" (
    "id" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "empreinte" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "utiliseLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeConnexion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compteur" (
    "cle" TEXT NOT NULL,
    "valeur" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Compteur_pkey" PRIMARY KEY ("cle")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commune_slug_key" ON "Commune"("slug");

-- CreateIndex
CREATE INDEX "Commune_statut_idx" ON "Commune"("statut");

-- CreateIndex
CREATE INDEX "Lead_communeId_idx" ON "Lead"("communeId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_telephone_communeId_key" ON "Lead"("telephone", "communeId");

-- CreateIndex
CREATE UNIQUE INDEX "Menage_code_key" ON "Menage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Menage_telephone_key" ON "Menage"("telephone");

-- CreateIndex
CREATE INDEX "Menage_communeId_idx" ON "Menage"("communeId");

-- CreateIndex
CREATE INDEX "Menage_equipeId_idx" ON "Menage"("equipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_telephone_key" ON "Personnel"("telephone");

-- CreateIndex
CREATE INDEX "Personnel_equipeId_idx" ON "Personnel"("equipeId");

-- CreateIndex
CREATE INDEX "Personnel_poste_idx" ON "Personnel"("poste");

-- CreateIndex
CREATE UNIQUE INDEX "DemandeCollecte_reference_key" ON "DemandeCollecte"("reference");

-- CreateIndex
CREATE INDEX "DemandeCollecte_statut_idx" ON "DemandeCollecte"("statut");

-- CreateIndex
CREATE INDEX "DemandeCollecte_menageId_idx" ON "DemandeCollecte"("menageId");

-- CreateIndex
CREATE INDEX "Passage_date_idx" ON "Passage"("date");

-- CreateIndex
CREATE INDEX "Passage_menageId_idx" ON "Passage"("menageId");

-- CreateIndex
CREATE INDEX "Passage_equipeId_idx" ON "Passage"("equipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_reference_key" ON "Paiement"("reference");

-- CreateIndex
CREATE INDEX "Paiement_statut_idx" ON "Paiement"("statut");

-- CreateIndex
CREATE INDEX "Paiement_menageId_idx" ON "Paiement"("menageId");

-- CreateIndex
CREATE INDEX "Avis_menageId_idx" ON "Avis"("menageId");

-- CreateIndex
CREATE INDEX "Notification_statut_idx" ON "Notification"("statut");

-- CreateIndex
CREATE INDEX "Notification_menageId_idx" ON "Notification"("menageId");

-- CreateIndex
CREATE INDEX "CodeConnexion_telephone_creeLe_idx" ON "CodeConnexion"("telephone", "creeLe");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menage" ADD CONSTRAINT "Menage_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menage" ADD CONSTRAINT "Menage_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeCollecte" ADD CONSTRAINT "DemandeCollecte_menageId_fkey" FOREIGN KEY ("menageId") REFERENCES "Menage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeCollecte" ADD CONSTRAINT "DemandeCollecte_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_menageId_fkey" FOREIGN KEY ("menageId") REFERENCES "Menage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_menageId_fkey" FOREIGN KEY ("menageId") REFERENCES "Menage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_menageId_fkey" FOREIGN KEY ("menageId") REFERENCES "Menage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_menageId_fkey" FOREIGN KEY ("menageId") REFERENCES "Menage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

