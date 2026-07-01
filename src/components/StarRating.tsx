interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
}

export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const roundedValue = Math.max(0, Math.min(5, Math.round(value)))
  const textSize = size === 'sm' ? 'text-base' : 'text-xl'
  const buttonSize = size === 'sm' ? 'h-6 w-5' : 'h-8 w-7'

  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`星等 ${roundedValue} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= roundedValue
        return (
          <button
            key={star}
            type="button"
            disabled={!onChange}
            onClick={(event) => {
              event.stopPropagation()
              onChange?.(star === roundedValue ? 0 : star)
            }}
            className={`${buttonSize} ${textSize} leading-none ${
              active ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
            } ${onChange ? 'hover:text-amber-500 cursor-pointer' : 'cursor-default'}`}
            title={`${star} 星`}
            aria-label={`設定 ${star} 星`}
          >
            {active ? '★' : '☆'}
          </button>
        )
      })}
    </div>
  )
}
