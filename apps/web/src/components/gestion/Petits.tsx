import type { ReactNode } from 'react';
import { formaterPrix } from '@/lib/format';
import { ton } from './libelles';

export function Etat({ statut, libelle }: { statut: string; libelle: string }) {
  return <span className={`gs-etat gs-etat--${ton(statut)}`}>{libelle}</span>;
}

export const Fcfa = ({ valeur }: { valeur: number }) => <>{formaterPrix(valeur)}</>;

export function Chargement({ erreur, onReessayer }: { erreur?: string | null; onReessayer?: () => void }) {
  if (erreur) {
    return (
      <p className="gs-vide gs-vide--erreur" role="alert">
        {erreur}{' '}
        {onReessayer ? (
          <button className="app-lien" onClick={onReessayer}>
            Réessayer
          </button>
        ) : null}
      </p>
    );
  }
  return <p className="gs-vide">Chargement…</p>;
}

export function Vide({ children }: { children: ReactNode }) {
  return <p className="gs-vide">{children}</p>;
}

export function EnTete({ titre, aide, actions }: { titre: string; aide?: string; actions?: ReactNode }) {
  return (
    <div className="gs-entete">
      <div>
        <h1>{titre}</h1>
        {aide ? <p className="gs-entete__aide">{aide}</p> : null}
      </div>
      {actions ? <div className="gs-entete__actions">{actions}</div> : null}
    </div>
  );
}

export function Pagination({
  page,
  taille,
  total,
  onChange,
}: {
  page: number;
  taille: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(Math.ceil(total / taille), 1);
  if (pages <= 1) return <p className="gs-pagination">{total} résultat{total > 1 ? 's' : ''}</p>;
  return (
    <div className="gs-pagination">
      <span>
        {total} résultats · page {page} sur {pages}
      </span>
      <span className="gs-pagination__boutons">
        <button className="gs-bouton" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Précédent
        </button>
        <button className="gs-bouton" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Suivant
        </button>
      </span>
    </div>
  );
}

/** Confirmation en deux temps pour une action qu'on ne peut pas défaire. */
export function Confirmer({
  libelle,
  question,
  onConfirme,
  occupe,
  danger = true,
}: {
  libelle: string;
  question: string;
  onConfirme: () => void;
  occupe?: boolean;
  danger?: boolean;
}) {
  return (
    <details className="gs-confirmer">
      <summary className={`gs-bouton${danger ? ' gs-bouton--danger' : ''}`}>{libelle}</summary>
      <div className="gs-confirmer__corps">
        <p>{question}</p>
        <button className={`gs-bouton ${danger ? 'gs-bouton--danger-plein' : 'gs-bouton--plein'}`} disabled={occupe} onClick={onConfirme}>
          Oui, {libelle.toLowerCase()}
        </button>
      </div>
    </details>
  );
}
