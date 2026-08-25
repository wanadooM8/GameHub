interface PlaceholderArtProps {
  className?: string
  iconSize?: number
}

export default function PlaceholderArt({ className = '', iconSize = 28 }: PlaceholderArtProps) {
  return (
    <div className={`flex items-center justify-center bg-surface2 ${className}`}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="12" rx="4" stroke="currentColor" strokeWidth="1.4" className="text-text3" />
        <circle cx="8" cy="13" r="1.4" fill="currentColor" className="text-text3" />
        <path d="M6.5 13H9.5M8 11.5V14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-border2" />
        <circle cx="16" cy="12" r="1" fill="currentColor" className="text-text3" />
        <circle cx="18.2" cy="14.2" r="1" fill="currentColor" className="text-text3" />
      </svg>
    </div>
  )
}
