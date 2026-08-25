export default function HeartIcon({ filled, size = 13 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={filled ? '#E3195C' : 'none'}>
      <path
        d="M8 13.8S1.8 9.9 1.8 5.9C1.8 3.9 3.3 2.4 5.2 2.4C6.3 2.4 7.4 3 8 3.9C8.6 3 9.7 2.4 10.8 2.4C12.7 2.4 14.2 3.9 14.2 5.9C14.2 9.9 8 13.8 8 13.8Z"
        stroke={filled ? '#E3195C' : '#8A8A8A'}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}
