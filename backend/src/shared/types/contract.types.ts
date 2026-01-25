/**
 * Contract Type
 * Defines whether the contract is for ongoing services or a one-time intervention
 */
export enum ContractType {
  PERMANENT = 'PERMANENT', // Recurring cleaning services
  ONE_TIME = 'ONE_TIME', // Single intervention
}

/**
 * Contract Frequency
 * Defines how often interventions should occur for permanent contracts
 */
export enum ContractFrequency {
  DAILY = 'DAILY', // Every day (petits/grands sites)
  WEEKLY = 'WEEKLY', // Once per week
  BIWEEKLY = 'BIWEEKLY', // Every two weeks
  MONTHLY = 'MONTHLY', // Once per month
  QUARTERLY = 'QUARTERLY', // Every three months
  CUSTOM = 'CUSTOM', // Custom schedule defined separately
}

/**
 * Contract Status
 * Tracks the lifecycle of a contract
 */
export enum ContractStatus {
  DRAFT = 'DRAFT', // Being prepared, not yet active
  ACTIVE = 'ACTIVE', // Currently in effect
  INACTIVE = 'INACTIVE', // Temporarily paused
  COMPLETED = 'COMPLETED', // Finished successfully
  ARCHIVED = 'ARCHIVED', // Cancelled or ended, soft deleted
}

/**
 * Contract Pricing Structure
 * Flexible pricing model stored as JSON in database
 */
export interface ContractPricing {
  hourlyRate?: number; // Rate per hour (for hourly contracts)
  monthlyFee?: number; // Fixed monthly fee
  perInterventionFee?: number; // Fixed fee per intervention
  currency: string; // Currency code (MRU for Mauritania)
  billingCycle?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  paymentTerms?: string; // e.g., "Net 30 days"
  notes?: string;
}

/**
 * Service Scope Definition
 * Defines what services are included in the contract
 */
export interface ServiceScope {
  zones: string[]; // Areas to clean (Reception, Bureaux, Sanitaires, etc.)
  tasks: string[]; // Specific tasks (Nettoyage, Désinfection, etc.)
  schedules?: {
    startTime: string; // e.g., "07:00"
    endTime: string; // e.g., "15:00"
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  }[];
  specialInstructions?: string;
  excludedAreas?: string[];
}
