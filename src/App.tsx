import { useEffect, useMemo } from 'react'
import { useStore } from './store/useStore'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import GameGrid from './components/GameGrid'
import DetailPanel from './components/DetailPanel'
import ConfirmDialog from './components/ConfirmDialog'
import Settings from './components/Settings'
import { sortGames } from './lib/sort'
import type { Game } from './types'

export default function App() {
  const {
    games,
    navSection,
    searchQuery,
    sortBy,
    selectedId,
    confirmDeleteId,
    toast,
    loadGames,
    loadFolders,
    handleGameStopped,
    setConfirmDeleteId,
    confirmDelete,
    selectGame,
    showToast
  } = useStore()

  useEffect(() => {
    void loadGames()
    void loadFolders()

    const offStopped = window.api.onGameStopped(({ id }) => handleGameStopped(id))
    const offProgress = window.api.onScanProgress(() => {})
    const offDone = window.api.onScanDone(() => {
      void loadGames()
      void loadFolders()
    })
    const offRepaired = window.api.onRepairDone(({ repaired }) => {
      void loadGames()
      showToast(`${repaired} jeu(x) réparé(s) — leur .exe pointait vers un mauvais fichier`)
    })

    return () => {
      offStopped()
      offProgress()
      offDone()
      offRepaired()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredGames = useMemo<Game[]>(() => {
    let list = games
    if (navSection === 'favorites') list = list.filter((g) => g.is_favorite === 1)
    if (navSection === 'recent') list = list.filter((g) => g.last_played !== null)

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((g) => g.name.toLowerCase().includes(q))
    }

    return sortGames(list, sortBy)
  }, [games, navSection, searchQuery, sortBy])

  const selectedGame = games.find((g) => g.id === selectedId) ?? null
  const deletingGame = games.find((g) => g.id === confirmDeleteId) ?? null

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg font-ui text-text">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar />

        {navSection === 'settings' ? (
          <Settings />
        ) : (
          <div className="flex min-h-0 flex-1">
            <GameGrid games={filteredGames} onSelect={selectGame} selectedId={selectedId} />
            <DetailPanel game={selectedGame} />
          </div>
        )}
      </div>

      {deletingGame && (
        <ConfirmDialog
          title="Supprimer le jeu"
          message={`Retirer « ${deletingGame.name} » de la bibliothèque ? Les fichiers ne seront pas supprimés.`}
          confirmLabel="Supprimer"
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-md border border-border bg-surface px-4 py-2 text-[13px] font-medium text-text shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
