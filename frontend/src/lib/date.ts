/**
 * Format a date relative to now (e.g., "5 minutes ago", "2 days ago")
 */
export function formatDistanceToNow(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 60) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else if (diffWeeks < 4) {
    return `${diffWeeks}w ago`
  } else if (diffMonths < 12) {
    return `${diffMonths}mo ago`
  } else {
    return `${diffYears}y ago`
  }
}

/**
 * Format a date in a readable format
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/**
 * Format a time in a readable format
 */
export function formatTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date)
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

/**
 * Format a date and time
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`
}
