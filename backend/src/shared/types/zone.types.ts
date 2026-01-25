/**
 * Zone Status
 * Tracks the operational status of a zone
 */
export enum ZoneStatus {
  ACTIVE = 'ACTIVE', // Currently operational
  INACTIVE = 'INACTIVE', // Temporarily inactive or reorganizing
  ARCHIVED = 'ARCHIVED', // Removed, soft deleted
}
