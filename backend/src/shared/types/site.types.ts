/**
 * Site Size - Categorization based on size and complexity
 */
export enum SiteSize {
  SMALL = 'SMALL', // Small locations (e.g., small offices, retail shops)
  MEDIUM = 'MEDIUM', // Medium locations (e.g., standard offices, agencies)
  LARGE = 'LARGE', // Large locations (e.g., headquarters, large facilities)
}

/**
 * Site Status - Current operational state of the site
 */
export enum SiteStatus {
  ACTIVE = 'ACTIVE', // Site is operational and receiving services
  INACTIVE = 'INACTIVE', // Site is temporarily inactive or under maintenance
  ARCHIVED = 'ARCHIVED', // Site permanently closed, soft deleted
}
