/**
 * User roles in the system - Phase 1 MVP
 * 
 * Hierarchy: SUPER_ADMIN > ADMIN > SUPERVISOR > AGENT
 * CLIENT is outside employee hierarchy (view-only own resources)
 * 
 * Phase 2/3 will add: DIRECTOR, SECTOR_CHIEF, ZONE_CHIEF, TEAM_CHIEF,
 *                     ASSISTANT, QUALITY_CONTROLLER, ACCOUNTANT
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  AGENT = 'AGENT',
  CLIENT = 'CLIENT',
}

/**
 * Unified user status (role-aware validation)
 * 
 * Employees (Admin, Supervisor, Agent):
 *   - ACTIVE: Currently employed, full access
 *   - INACTIVE: Temporarily disabled, no access
 *   - ARCHIVED: Soft deleted, data retained
 * 
 * Clients:
 *   - CURRENT: Active contract, can access portal
 *   - FORMER: Contract ended, can view history/leave reviews
 *   - ARCHIVED: Soft deleted, no access but data retained
 */
export enum UserStatus {
  // Employee statuses
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  // Client statuses
  CURRENT = 'CURRENT',
  FORMER = 'FORMER',
  // Universal status (both roles)
  ARCHIVED = 'ARCHIVED',
}

/**
 * @deprecated Use UserStatus instead. Kept for backwards compatibility during migration.
 */
export enum ClientStatus {
  CURRENT = 'CURRENT',
  FORMER = 'FORMER',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Employee attendance status (for real-time tracking)
 * Used by Superviseurs to update agent shift status
 */
export enum AttendanceStatus {
  ACTIVE = 'ACTIVE',
  ON_BREAK = 'ON_BREAK',
  ENDED_SHIFT = 'ENDED_SHIFT',
  INACTIVE = 'INACTIVE',
}
