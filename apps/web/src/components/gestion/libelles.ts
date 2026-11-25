import type { Poste } from '@/lib/gestion-api';

export const POSTES: Record<Poste, string> = {
  SUPERVISEUR: 'Superviseur',
  CHAUFFEUR: 'Chauffeur',
  EBOUEUR: 'Éboueur',
  RECOUVREMENT: 'Agent de recouvrement',
};

export const MODES: Record<string, string> = {
  AIRTEL_MONEY: 'Airtel Money',
  ORANGE_MONEY: 'Orange Money',
  M_PESA: 'M-Pesa',
  AFRIMONEY: 'Afrimoney',
  CARTE: 'Carte',
  CASH: 'Espèces',
  VIREMENT: 'Virement',
};

export const OBJETS: Record<string, string> = {
  PASSAGE: 'Passage',
  ABONNEMENT: 'Abonnement',
  RECHARGE_CREDIT: 'Recharge de crédit',
};

export const STATUT_PAIEMENT: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  RECU: 'Reçu',
  A_RAPPROCHER: 'À rapprocher',
  ECHEC: 'Échec',
};

export const STATUT_DEMANDE: Record<string, string> = {
  RECUE: 'Reçue',
  PLANIFIEE: 'Planifiée',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

export const TYPE_DEMANDE: Record<string, string> = {
  DES_QUE_POSSIBLE: 'Dès que possible',
  JOUR_PRECIS: 'Jour précis',
  PROCHAIN_PASSAGE: 'Prochain passage',
};

export const STATUT_PASSAGE: Record<string, string> = {
  A_FAIRE: 'À faire',
  FAIT: 'Fait, à valider',
  VALIDE: 'Validé',
  REFUSE: 'Refusé',
};

export const RESULTAT_PASSAGE: Record<string, string> = {
  COLLECTE: 'Collecté',
  PERSONNE_SUR_PLACE: 'Personne sur place',
  ACCES_IMPOSSIBLE: 'Accès impossible',
  DECHETS_REFUSES: 'Déchets refusés',
  RIEN_A_PRENDRE: 'Rien à prendre',
};

export const STATUT_MENAGE: Record<string, string> = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  RESILIE: 'Résilié',
};

export const FORMULE: Record<string, string> = {
  PAR_PASSAGE: 'Par passage',
  MENSUELLE: 'Mensuelle',
};

export const STATUT_COMMUNE: Record<string, string> = {
  OUVERTE: 'Desservie',
  DEMANDES_RECUES: 'Demandes reçues',
  FERMEE: 'Pas encore',
};

export const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const dateFr = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const dateHeureFr = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Classe de couleur d'un état : ok (vert), attente (ambre), ko (rouge), neutre. */
export function ton(statut: string): 'ok' | 'attente' | 'ko' | 'neutre' {
  if (['RECU', 'VALIDE', 'TERMINEE', 'ACTIF', 'PLANIFIEE', 'OUVERTE', 'COLLECTE', 'ENVOYEE'].includes(statut)) return 'ok';
  if (['EN_ATTENTE', 'A_RAPPROCHER', 'RECUE', 'FAIT', 'A_FAIRE', 'DEMANDES_RECUES', 'SUSPENDU'].includes(statut)) return 'attente';
  if (['ECHEC', 'ANNULEE', 'REFUSE', 'RESILIE', 'ACCES_IMPOSSIBLE', 'DECHETS_REFUSES'].includes(statut)) return 'ko';
  return 'neutre';
}
