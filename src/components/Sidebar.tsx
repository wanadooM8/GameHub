import type { ReactNode } from 'react'
import { useStore } from '../store/useStore'
import type { NavSection } from '../types'

function LibraryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function RecentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5V8L10.5 9.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function FavoritesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.8L10 5.9L14.5 6.5L11.2 9.6L12 14.2L8 12L4 14.2L4.8 9.6L1.5 6.5L6 5.9L8 1.8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1.8V3.4M8 12.6V14.2M14.2 8H12.6M3.4 8H1.8M12.3 3.7L11.1 4.9M4.9 11.1L3.7 12.3M12.3 12.3L11.1 11.1M4.9 4.9L3.7 3.7"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface NavItemProps {
  label: string
  icon: ReactNode
  count?: number
  active: boolean
  onClick: () => void
}

function NavItem({ label, icon, count, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
        active ? 'bg-accent-soft text-accent-pressed' : 'text-text2 hover:bg-black/[0.04] hover:text-text'
      }`}
    >
      <span className="flex items-center gap-2.5">
        <span className={active ? 'text-accent' : 'text-text3'}>{icon}</span>
        {label}
      </span>
      {typeof count === 'number' && <span className="text-[12px] tabular-nums text-text3">{count}</span>}
    </button>
  )
}

export default function Sidebar() {
  const { navSection, setNavSection, games, runningId } = useStore()
  const runningGame = games.find((g) => g.id === runningId) ?? null

  const nav: Array<{ key: NavSection; label: string; icon: ReactNode; count?: number }> = [
    { key: 'library', label: 'Library', icon: <LibraryIcon />, count: games.length },
    { key: 'recent', label: 'Recent', icon: <RecentIcon /> },
    {
      key: 'favorites',
      label: 'Favorites',
      icon: <FavoritesIcon />,
      count: games.filter((g) => g.is_favorite === 1).length
    }
  ]

  return (
    <div className="flex w-[200px] shrink-0 flex-col border-r border-border bg-surface2 px-2.5 py-3">
      <div className="mb-4 flex items-center gap-2 px-1.5 py-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-[12px] font-bold text-white">
          G
        </span>
        <span className="text-[14px] font-semibold text-text">GameHub</span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {nav.map((item) => (
          <NavItem
            key={item.key}
            label={item.label}
            icon={item.icon}
            count={item.count}
            active={navSection === item.key}
            onClick={() => setNavSection(item.key)}
          />
        ))}
      </nav>

      <div className="my-3 h-px bg-border" />

      <nav className="flex flex-col gap-0.5">
        <NavItem
          label="Settings"
          icon={<SettingsIcon />}
          active={navSection === 'settings'}
          onClick={() => setNavSection('settings')}
        />
      </nav>

      <div className="flex-1" />

      {runningGame && (
        <div className="rounded-md border border-accent-border bg-accent-soft px-2.5 py-2">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span className="text-[11px] font-semibold text-accent-pressed">Running</span>
          </div>
          <div className="truncate text-[13px] font-medium text-text">{runningGame.name}</div>
        </div>
      )}
    </div>
  )
}
