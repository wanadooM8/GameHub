import { useStore } from '../store/useStore'
import { SORT_LABELS } from '../lib/sort'
import type { SortOption } from '../types'

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="5.5" cy="5.5" r="4.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8.6 8.6L11.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M1 2.5H14M1 7.5H14M1 12.5H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1.5V13.5M1.5 7.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const SORT_OPTIONS: SortOption[] = [
  'recent',
  'name-asc',
  'name-desc',
  'rating-desc',
  'playtime-desc',
  'size-desc',
  'added-desc'
]

export default function Toolbar() {
  const { searchQuery, setSearchQuery, viewMode, setViewMode, addGameManual, navSection, sortBy, setSortBy } =
    useStore()

  return (
    <div className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <div className="flex h-8 w-full max-w-[320px] items-center gap-2 rounded-md border border-border2 bg-surface2 px-3 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
        <span className="text-text3">
          <SearchIcon />
        </span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search games"
          disabled={navSection === 'settings'}
          className="h-full w-full bg-transparent text-[13px] text-text placeholder:text-text3"
        />
      </div>

      <div className="flex-1" />

      {navSection !== 'settings' && (
        <div className="relative flex h-8 items-center rounded-md border border-border2 bg-surface2 pl-2.5 pr-1.5 text-text2 hover:text-text">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Trier par"
            className="appearance-none bg-transparent pr-4 text-[12px] font-medium text-text outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {SORT_LABELS[opt]}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2">
            <ChevronIcon />
          </span>
        </div>
      )}

      <div className="flex items-center gap-0.5 rounded-md border border-border2 bg-surface2 p-0.5">
        <button
          onClick={() => setViewMode('grid')}
          aria-label="Vue grille"
          className={`flex h-7 w-7 items-center justify-center rounded-sm ${
            viewMode === 'grid' ? 'bg-surface text-accent shadow-sm' : 'text-text3 hover:text-text'
          }`}
        >
          <GridIcon />
        </button>
        <button
          onClick={() => setViewMode('list')}
          aria-label="Vue liste"
          className={`flex h-7 w-7 items-center justify-center rounded-sm ${
            viewMode === 'list' ? 'bg-surface text-accent shadow-sm' : 'text-text3 hover:text-text'
          }`}
        >
          <ListIcon />
        </button>
      </div>

      <button
        onClick={() => void addGameManual()}
        aria-label="Ajouter un jeu"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border2 bg-surface2 text-text2 hover:border-accent hover:text-accent"
      >
        <PlusIcon />
      </button>
    </div>
  )
}
