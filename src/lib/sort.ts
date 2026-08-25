import type { Game, SortOption } from '../types'

export const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Recently played',
  'name-asc': 'Name (A–Z)',
  'name-desc': 'Name (Z–A)',
  'rating-desc': 'Rating',
  'playtime-desc': 'Playtime',
  'size-desc': 'Size',
  'added-desc': 'Recently added'
}

export function sortGames(games: Game[], sortBy: SortOption): Game[] {
  const list = [...games]
  switch (sortBy) {
    case 'name-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return list.sort((a, b) => b.name.localeCompare(a.name))
    case 'rating-desc':
      return list.sort((a, b) => b.rating - a.rating)
    case 'playtime-desc':
      return list.sort((a, b) => b.playtime_seconds - a.playtime_seconds)
    case 'size-desc':
      return list.sort((a, b) => (b.size_bytes ?? 0) - (a.size_bytes ?? 0))
    case 'added-desc':
      return list.sort((a, b) => b.added_at.localeCompare(a.added_at))
    case 'recent':
    default:
      return list.sort((a, b) => (b.last_played ?? '').localeCompare(a.last_played ?? ''))
  }
}
