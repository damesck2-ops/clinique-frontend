export type TypeActionAudit =
  | 'CREATION'
  | 'MODIFICATION'
  | 'SUPPRESSION'
  | 'CONSULTATION_DOSSIER'
  | 'MOUVEMENT_STOCK'
  | 'PAIEMENT'
  | 'ANNULATION'
  | 'CONNEXION'
  | 'ECHEC_CONNEXION'
  | 'DECONNEXION'
  | 'AUTRE';

export interface AuditLog {
  id: number;
  utilisateurId?: number;
  utilisateurUsername: string;
  action: TypeActionAudit;
  entite: string;
  entiteId?: number;
  description?: string;
  adresseIp?: string;
  succes: boolean;
  dateAction: string;
}

export type { PageResponse } from './page.model';
