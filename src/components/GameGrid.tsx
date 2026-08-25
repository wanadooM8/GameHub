import { useStore } from '../store/useStore'
import GameCard from './GameCard'
import PlaceholderArt from './PlaceholderArt'
import StarRating from './StarRating'
import HeartIcon from './HeartIcon'
import { coverUrl, formatLastPlayed, formatSize } from '../lib/cover'
import type { Game } from '../types'

interface GameGridProps {
  games: Game[]
  selectedId: number | null
  onSelect: (id: number) => void
}

function ListRow({ game, selected, onSelect }: { game: Game; selected: boolean; onSelect: () => void }) {
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
      className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-2.5 py-2 text-left transition-colors ${
        selected ? 'border-accent-border bg-accent-soft' : 'border-transparent hover:bg-black/[0.03]'
      }`}
    >
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-border">
        {cover ? (
          <img src={cover} alt={game.name} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <PlaceholderArt className="h-full w-full" iconSize={16} />
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          void toggleFavorite(game.id)
        }}
        aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className="shrink-0"
      >
        <HeartIcon filled={isFavorite} size={14} />
      </button>
      <div className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">{game.name}</div>
      {game.rating > 0 && <StarRating value={game.rating} readOnly size={11} />}
      <div className="w-20 shrink-0 text-right text-[12px] text-text3">{formatSize(game.size_bytes)}</div>
      <div className="w-24 shrink-0 text-right text-[12px] text-text3">{formatLastPlayed(game.last_played)}</div>
      {isRunning && (
        <span className="shrink-0 rounded-sm bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
          Running
        </span>
      )}
    </div>
  )
}

export default function GameGrid({ games, selectedId, onSelect }: GameGridProps) {
  const viewMode = useStore((s) => s.viewMode)

  if (games.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
        <div className="text-center text-[13px] font-medium text-text3">No games found</div>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-1">
          {games.map((g) => (
            <ListRow key={g.id} game={g} selected={g.id === selectedId} onSelect={() => onSelect(g.id)} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {games.map((g) => (
          <GameCard key={g.id} game={g} selected={g.id === selectedId} onSelect={() => onSelect(g.id)} />
        ))}
      </div>
    </div>
  )
}
