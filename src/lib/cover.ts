export function coverUrl(coverPath: string | null): string | null {
  if (!coverPath) return null
  const normalized = coverPath.replace(/\\/g, '/')
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
  return `media://${withLeadingSlash}`
}

export function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—'
  const gb = bytes / 1024 ** 3
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / 1024 ** 2
  return `${mb.toFixed(0)} MB`
}

export function formatPlaytime(seconds: number): string {
  if (!seconds || seconds < 60) return 'Not played yet'
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function formatLastPlayed(value: string | null): string {
  if (!value) return 'Never'
  const d = new Date(value.replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) return value
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
