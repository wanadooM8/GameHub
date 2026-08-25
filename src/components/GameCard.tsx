import { useStore } from '../store/useStore'
import { coverUrl } from '../lib/cover'
import PlaceholderArt from './PlaceholderArt'
import HeartIcon from './HeartIcon'
import type { Game } from '../types'

interface GameCardProps {
  game: Game
  selected: boolean
  onSelect: () => void
}

export default function GameCard({ game, selected, onSelect }: GameCardProps) {
  const runningId = useStore((s) => s.runningId)
  const launchGame = useStore((s) => s.launchGame)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const isRunning = runningId === game.id
  const isFavorite = game.is_favorite === 1
  const cover = coverUrl(game.cover_path)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={() => void launchGame(game.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect()
      }}
      className={`group flex aspect-[3/4] cursor-pointer flex-col overflow-hidden rounded-lg border bg-surface text-left shadow-sm transition-shadow hover:shadow-md ${
        selected ? 'border-accent ring-1 ring-accent' : 'border-border'
      }`}
    >
      <div className="relative flex-1 overflow-hidden">
        {cover ? (
          <img src={cover} alt={game.name} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <PlaceholderArt className="h-full w-full" />
        )}

        {isRunning && (
          <span className="absolute right-1.5 top-1.5 rounded-sm bg-success px-1.5 py-0.5 text-[9px] font-semibold text-white">
            Running
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            void toggleFavorite(game.id)
          }}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={`absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-sm bg-white/90 transition-opacity ${
            isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <HeartIcon filled={isFavorite} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border px-2 py-1.5">
        <div className="min-w-0 flex-1 truncate text-[12px] font-medium text-text">{game.name}</div>
        {game.rating > 0 && (
          <div className="flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-text2">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="#FFB900">
              <path d="M8 1.5L9.9 5.4L14.2 6L11.1 9L11.8 13.3L8 11.3L4.2 13.3L4.9 9L1.8 6L6.1 5.4L8 1.5Z" />
            </svg>
            {game.rating}
          </div>
        )}
      </div>
    </div>
  )
}
