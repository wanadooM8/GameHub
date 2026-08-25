export interface Game {
  id: number
  name: string
  exe_path: string
  folder_path: string
  cover_path: string | null
  size_bytes: number | null
  last_played: string | null
  play_count: number
  playtime_seconds: number
  is_favorite: number
  rating: number
  added_at: string
}

export interface Folder {
  id: number
  path: string
  last_scanned: string | null
}

export type ViewMode = 'grid' | 'list'
export type NavSection = 'library' | 'recent' | 'favorites' | 'settings'
export type SortOption =
  | 'recent'
  | 'name-asc'
  | 'name-desc'
  | 'rating-desc'
  | 'playtime-desc'
  | 'size-desc'
  | 'added-desc'

export interface UpdateResult {
  ok: boolean
  error?: string
}

export interface MarathonApi {
  getGames: () => Promise<Game[]>
  launchGame: (id: number) => Promise<void>
  stopTracking: (id: number) => Promise<void>
  removeGame: (id: number) => Promise<void>
  updateGame: (
    id: number,
    data: Partial<Pick<Game, 'name' | 'exe_path' | 'folder_path' | 'is_favorite' | 'rating'>>
  ) => Promise<UpdateResult>
  addGameManual: () => Promise<number | null>
  browseExe: () => Promise<string | null>
  refreshCover: (id: number) => Promise<void>
  setCustomCover: (id: number) => Promise<string | null>

  getFolders: () => Promise<Folder[]>
  scanFolders: () => Promise<number>
  addFolder: () => Promise<number | null>
  removeFolder: (path: string) => Promise<void>

  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>

  openPath: (target: string) => Promise<void>

  onScanProgress: (cb: (data: { found: number }) => void) => () => void
  onScanDone: (cb: (data: { added: number }) => void) => () => void
  onGameStopped: (cb: (data: { id: number }) => void) => () => void
  onRepairDone: (cb: (data: { repaired: number }) => void) => () => void
}

declare global {
  interface Window {
    api: MarathonApi
  }
}
