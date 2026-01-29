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
 * PROSPECT: Potential client, not yet signed a contract
 * CURRENT: Active client with ongoing services/contract
 * ARCHIVED: Relationship ended, soft deleted (data retained for history)
 */
export enum ClientStatus {
  PROSPECT = 'PROSPECT', // Potential client, not yet active
  CURRENT = 'CURRENT', // Active client with ongoing services
  ARCHIVED = 'ARCHIVED', // Relationship ended, soft deleted
}
