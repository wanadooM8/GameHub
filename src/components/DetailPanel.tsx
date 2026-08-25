import { useState } from 'react'
import { useStore } from '../store/useStore'
import { coverUrl, formatLastPlayed, formatPlaytime, formatSize } from '../lib/cover'
import PlaceholderArt from './PlaceholderArt'
import StarRating from './StarRating'
import HeartIcon from './HeartIcon'
import EditGameDialog from './EditGameDialog'
import type { Game } from '../types'

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M11 6.5a4.5 4.5 0 1 1-1.5-3.35M11 1.5v3.15H7.85"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1" y="1.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 8.5L4.3 5.8L6.5 8L8.8 5.5L11.5 8.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="4" r="0.9" fill="currentColor" />
    </svg>
  )
}

interface DetailPanelProps {
  game: Game | null
}

export default function DetailPanel({ game }: DetailPanelProps) {
  const runningId = useStore((s) => s.runningId)
  const launchGame = useStore((s) => s.launchGame)
  const updateGame = useStore((s) => s.updateGame)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const setConfirmDeleteId = useStore((s) => s.setConfirmDeleteId)
  const refreshCover = useStore((s) => s.refreshCover)
  const setCustomCover = useStore((s) => s.setCustomCover)
  const refreshingCoverId = useStore((s) => s.refreshingCoverId)

  const [editingGame, setEditingGame] = useState(false)

  if (!game) {
    return (
      <div className="flex w-[280px] shrink-0 flex-col items-center justify-center border-l border-border bg-surface px-4">
        <div className="text-center text-[13px] font-medium text-text3">Select a game</div>
      </div>
    )
  }

  const isRunning = runningId === game.id
  const cover = coverUrl(game.cover_path)
  const isRefreshing = refreshingCoverId === game.id
  const isFavorite = game.is_favorite === 1

  return (
    <div className="flex w-[280px] shrink-0 flex-col overflow-y-auto border-l border-border bg-surface p-4">
      <div className="relative mb-3 aspect-[3/2] w-full overflow-hidden rounded-md border border-border">
        {cover ? (
          <img src={cover} alt={game.name} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <PlaceholderArt className="h-full w-full" iconSize={36} />
        )}

        <span
          className={`absolute right-2 top-2 rounded-sm px-2 py-0.5 text-[10px] font-semibold ${
            isRunning ? 'bg-success text-white' : 'bg-white/90 text-text'
          }`}
        >
          {isRunning ? 'Running' : 'Ready'}
        </span>

        <div className="absolute left-2 top-2 flex gap-1">
          <button
            onClick={() => void refreshCover(game.id)}
            disabled={isRefreshing}
            title="Rechercher la jaquette sur IGDB"
            className="flex h-6 w-6 items-center justify-center rounded-sm bg-white/90 text-text2 hover:text-accent disabled:opacity-60"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>
              <RefreshIcon />
            </span>
          </button>
          <button
            onClick={() => void setCustomCover(game.id)}
            disabled={isRefreshing}
            title="Choisir une image"
            className="flex h-6 w-6 items-center justify-center rounded-sm bg-white/90 text-text2 hover:text-accent disabled:opacity-60"
          >
            <UploadIcon />
          </button>
        </div>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">{game.name}</h2>
        <button
          onClick={() => void toggleFavorite(game.id)}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="shrink-0"
        >
          <HeartIcon filled={isFavorite} size={17} />
        </button>
      </div>

      <div className="mb-3">
        <StarRating value={game.rating} onChange={(v) => void updateGame(game.id, { rating: v })} />
      </div>

      <div className="mb-4 flex flex-col gap-1.5 rounded-md border border-border bg-surface2 p-2.5">
        <div className="flex justify-between text-[12px]">
          <span className="text-text3">Size</span>
          <span className="font-medium text-text">{formatSize(game.size_bytes)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-text3">Last played</span>
          <span className="font-medium text-text">{formatLastPlayed(game.last_played)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-text3">Playtime</span>
          <span className="font-medium text-text">{formatPlaytime(game.playtime_seconds)}</span>
        </div>
        <div className="flex justify-between gap-2 text-[12px]">
          <span className="shrink-0 text-text3">Path</span>
          <span className="truncate font-medium text-text" title={game.exe_path}>
            {game.exe_path}
          </span>
        </div>
      </div>

      <button
        onClick={() => !isRunning && void launchGame(game.id)}
        disabled={isRunning}
        className={`mb-2 w-full rounded-md py-2.5 text-[13px] font-semibold transition-colors ${
          isRunning
            ? 'cursor-default bg-danger-soft text-danger'
            : 'bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed'
        }`}
      >
        {isRunning ? 'In Session' : 'Launch'}
      </button>

      <div className="flex gap-2">
        <button
          onClick={() => setEditingGame(true)}
          className="flex-1 rounded-md border border-border2 py-1.5 text-[12px] font-medium text-text2 hover:bg-black/[0.03]"
        >
          Edit
        </button>
        <button
          onClick={() => setConfirmDeleteId(game.id)}
          className="flex-1 rounded-md border border-danger/30 py-1.5 text-[12px] font-medium text-danger hover:bg-danger-soft"
        >
          Remove
        </button>
      </div>

      {editingGame && <EditGameDialog game={game} onClose={() => setEditingGame(false)} />}
    </div>
  )
}
