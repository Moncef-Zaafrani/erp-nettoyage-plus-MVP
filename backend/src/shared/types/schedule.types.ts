/**
 * Schedule Types
 * Defines recurrence patterns and scheduling-related types
 */

export enum RecurrencePattern {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  CUSTOM = 'CUSTOM',
}

export enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
}

export interface ScheduleConflict {
  conflictType: 'AGENT_DOUBLE_BOOKING' | 'SITE_OVERLAP';
  scheduleId: string;
  conflictingScheduleId?: string;
  date: Date;
  timeSlot: string;
  details: string;
}

export interface GenerationResult {
  generated: number;
  skipped: number;
  errors: string[];
  interventionIds: string[];
}
