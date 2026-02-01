/**
 * Client Type - How the client is categorized
 */
export enum ClientType {
  INDIVIDUAL = 'INDIVIDUAL', // Single person, residential
  COMPANY = 'COMPANY', // Business with single location
  MULTI_SITE = 'MULTI_SITE', // Business with multiple locations
}

/**
 * Client Status - Current state of the client relationship (business entity)
 * 
 * Lifecycle: PROSPECT → CURRENT → FORMER → ARCHIVED
 * 
 * PROSPECT: Potential client, not yet signed a contract
 * CURRENT: Active client with ongoing services/contract
 * FORMER: Contract ended, but can still access history/portal
 * ARCHIVED: Relationship ended, soft deleted (data retained for history)
 */
export enum ClientStatus {
  PROSPECT = 'PROSPECT', // Potential client, not yet active
  CURRENT = 'CURRENT', // Active client with ongoing services
  FORMER = 'FORMER', // Contract ended, can still access portal
  ARCHIVED = 'ARCHIVED', // Relationship ended, soft deleted
}
