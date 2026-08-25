import { create } from 'zustand'
import type { Folder, Game, NavSection, SortOption, UpdateResult, ViewMode } from '../types'

interface StoreState {
  games: Game[]
  folders: Folder[]
  selectedId: number | null
  runningId: number | null
  viewMode: ViewMode
  navSection: NavSection
  searchQuery: string
  sortBy: SortOption
  scanning: boolean
  toast: string | null
  confirmDeleteId: number | null
  refreshingCoverId: number | null

  loadGames: () => Promise<void>
  loadFolders: () => Promise<void>
  selectGame: (id: number | null) => void
  setViewMode: (mode: ViewMode) => void
  setNavSection: (section: NavSection) => void
  setSearchQuery: (q: string) => void
  setSortBy: (sort: SortOption) => void
  launchGame: (id: number) => Promise<void>
  removeGame: (id: number) => Promise<void>
  updateGame: (
    id: number,
    data: Partial<Pick<Game, 'name' | 'exe_path' | 'folder_path' | 'is_favorite' | 'rating'>>
  ) => Promise<UpdateResult>
  toggleFavorite: (id: number) => Promise<void>
  addGameManual: () => Promise<void>
  refreshCover: (id: number) => Promise<void>
  setCustomCover: (id: number) => Promise<void>
  addFolder: () => Promise<void>
  removeFolder: (path: string) => Promise<void>
  rescanAll: () => Promise<void>
  showToast: (msg: string) => void
  clearToast: () => void
  handleGameStopped: (id: number) => void
  setConfirmDeleteId: (id: number | null) => void
  confirmDelete: () => Promise<void>
}

export const useStore = create<StoreState>((set, get) => ({
  games: [],
  folders: [],
  selectedId: null,
  runningId: null,
  viewMode: 'grid',
  navSection: 'library',
  searchQuery: '',
  sortBy: 'recent',
  scanning: false,
  toast: null,
  confirmDeleteId: null,
  refreshingCoverId: null,

  loadGames: async () => {
    const games = await window.api.getGames()
    set({ games })
  },

  loadFolders: async () => {
    const folders = await window.api.getFolders()
    set({ folders })
  },

  selectGame: (id) => set({ selectedId: id }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setNavSection: (section) => set({ navSection: section }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  setSortBy: (sort) => set({ sortBy: sort }),

  launchGame: async (id) => {
    set({ runningId: id })
    await window.api.launchGame(id)
  },

  removeGame: async (id) => {
    await window.api.removeGame(id)
    const selectedId = get().selectedId === id ? null : get().selectedId
    set({ selectedId })
    await get().loadGames()
  },

  updateGame: async (id, data) => {
    const result = await window.api.updateGame(id, data)
    if (result.ok) await get().loadGames()
    return result
  },

  toggleFavorite: async (id) => {
    const game = get().games.find((g) => g.id === id)
    if (!game) return
    const nextValue = game.is_favorite === 1 ? 0 : 1
    // mise à jour optimiste pour un retour instantané au clic
    set((state) => ({
      games: state.games.map((g) => (g.id === id ? { ...g, is_favorite: nextValue } : g))
    }))
    await window.api.updateGame(id, { is_favorite: nextValue })
  },

  addGameManual: async () => {
    const id = await window.api.addGameManual()
    if (id) {
      await get().loadGames()
      get().showToast('Jeu ajouté')
    }
  },

  refreshCover: async (id) => {
    set({ refreshingCoverId: id })
    try {
      await window.api.refreshCover(id)
      await get().loadGames()
    } finally {
      set({ refreshingCoverId: null })
    }
  },

  setCustomCover: async (id) => {
    set({ refreshingCoverId: id })
    try {
      const path = await window.api.setCustomCover(id)
      if (path) {
        await get().loadGames()
        get().showToast('Image mise à jour')
      }
    } finally {
      set({ refreshingCoverId: null })
    }
  },

  addFolder: async () => {
    set({ scanning: true })
    const added = await window.api.addFolder()
    await get().loadFolders()
    await get().loadGames()
    set({ scanning: false })
    if (added !== null) get().showToast(`${added} jeu(x) ajouté(s)`)
  },

  removeFolder: async (path) => {
    await window.api.removeFolder(path)
    await get().loadFolders()
  },

  rescanAll: async () => {
    set({ scanning: true })
    const added = await window.api.scanFolders()
    await get().loadGames()
    await get().loadFolders()
    set({ scanning: false })
    get().showToast(`Scan terminé — ${added} nouveau(x) jeu(x)`)
  },

  showToast: (msg) => {
    set({ toast: msg })
    setTimeout(() => {
      if (get().toast === msg) set({ toast: null })
    }, 3500)
  },

  clearToast: () => set({ toast: null }),

  handleGameStopped: (id) => {
    set((state) => ({ runningId: state.runningId === id ? null : state.runningId }))
    void get().loadGames()
  },

  setConfirmDeleteId: (id) => set({ confirmDeleteId: id }),

  confirmDelete: async () => {
    const id = get().confirmDeleteId
    if (id === null) return
    set({ confirmDeleteId: null })
    await get().removeGame(id)
  }
}))
