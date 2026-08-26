import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
  readOnly?: boolean
}

function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5L9.9 5.4L14.2 6L11.1 9L11.8 13.3L8 11.3L4.2 13.3L4.9 9L1.8 6L6.1 5.4L8 1.5Z"
        fill={filled ? '#D9A441' : 'none'}
        stroke={filled ? '#D9A441' : '#CBBB98'}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function StarRating({ value, onChange, size = 16, readOnly = false }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value

  if (readOnly) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} filled={n <= value} size={size} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange?.(n === value ? 0 : n)}
          aria-label={`Noter ${n} étoile${n > 1 ? 's' : ''}`}
          className="p-0.5"
        >
          <StarIcon filled={n <= display} size={size} />
        </button>
      ))}
    </div>
  )
}
