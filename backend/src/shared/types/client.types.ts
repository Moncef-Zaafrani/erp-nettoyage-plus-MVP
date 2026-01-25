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
 * Note: This is different from User.clientStatus (CURRENT/FORMER/ARCHIVED)
 */
export enum ClientStatus {
  PROSPECT = 'PROSPECT', // Potential client, not yet active
  ACTIVE = 'ACTIVE', // Active client with ongoing services
  INACTIVE = 'INACTIVE', // Temporarily paused (e.g., payment issues)
  ARCHIVED = 'ARCHIVED', // Relationship ended, soft deleted
}
