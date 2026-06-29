/**
 * Format a date string as a relative human-readable string.
 * e.g. "2 days ago", "just now", "3 months ago"
 */
export function formatRelativeDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSecs < 60)    return 'just now'
  if (diffMins < 60)    return `${diffMins}m ago`
  if (diffHours < 24)   return `${diffHours}h ago`
  if (diffDays < 30)    return `${diffDays}d ago`
  if (diffMonths < 12)  return `${diffMonths}mo ago`
  return `${diffYears}y ago`
}

export function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatDatetime(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function daysUntilExpiry(dateString) {
  if (!dateString) return null
  const expiry = new Date(dateString)
  const now = new Date()
  const diffMs = expiry - now
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
