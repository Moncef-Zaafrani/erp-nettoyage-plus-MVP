/**
 * Checklist Types
 * Defines quality control checklist structures and enums
 */

export enum ChecklistFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export enum ChecklistStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface ZoneConfig {
  zoneName: string; // e.g., "Hall", "Bureaux", "Sanitaires", "Cuisine"
  tasks: string[]; // Array of task descriptions
}

export interface TaskConfig {
  description: string;
  requiresPhoto: boolean;
  estimatedMinutes?: number;
}

export interface CompletionStats {
  totalItems: number;
  completedItems: number;
  percentage: number;
  withPhotos: number;
}
