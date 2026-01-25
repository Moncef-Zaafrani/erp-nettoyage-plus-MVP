/**
 * Intervention Status
 * Tracks the lifecycle of a cleaning intervention
 */
export enum InterventionStatus {
  SCHEDULED = 'SCHEDULED', // Planned but not yet started
  IN_PROGRESS = 'IN_PROGRESS', // Currently being executed
  COMPLETED = 'COMPLETED', // Successfully finished
  CANCELLED = 'CANCELLED', // Cancelled before execution
  RESCHEDULED = 'RESCHEDULED', // Moved to different date/time
}

/**
 * GPS Coordinates for check-in/check-out
 */
export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number; // Accuracy in meters
}
