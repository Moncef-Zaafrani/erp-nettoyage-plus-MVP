/**
 * Absence Types and Enums
 * Defines types for employee absence tracking
 */

/**
 * Absence types
 */
export enum AbsenceType {
  VACATION = 'VACATION', // Congés payés
  SICK_LEAVE = 'SICK_LEAVE', // Arrêt maladie
  UNPAID = 'UNPAID', // Congés sans solde
  AUTHORIZED = 'AUTHORIZED', // Absence autorisée (formation, événement familial)
  UNAUTHORIZED = 'UNAUTHORIZED', // Absence non autorisée
}

/**
 * Absence request status
 */
export enum AbsenceStatus {
  PENDING = 'PENDING', // En attente d'approbation
  APPROVED = 'APPROVED', // Approuvée
  REJECTED = 'REJECTED', // Rejetée
  CANCELLED = 'CANCELLED', // Annulée par l'agent
}

/**
 * Absence filter options
 */
export interface AbsenceFilterOptions {
  agentId?: string;
  zoneId?: string;
  type?: AbsenceType;
  status?: AbsenceStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Absence balance tracking
 */
export interface AbsenceBalance {
  year: number;
  vacationDaysAllocated: number;
  vacationDaysUsed: number;
  vacationDaysRemaining: number;
  sickDaysUsed: number;
  unpaidDaysUsed: number;
  authorizedDaysUsed: number;
}
