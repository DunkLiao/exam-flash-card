import { useState, useEffect } from 'react'
import { getImageBase64 } from '../utils/fileIO'

interface MarkdownImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  alt?: string
}

export function MarkdownImage({ src, alt, className = '', ...props }: MarkdownImageProps) {
  const [resolved, setResolved] = useState<string | undefined>(undefined)
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
    setResolved(undefined)

    if (!src) return

    if (src.startsWith('images/')) {
      const filename = src.slice('images/'.length)
      let cancelled = false

      getImageBase64(filename)
        .then((dataUri) => {
          if (!cancelled) setResolved(dataUri)
        })
        .catch(() => {
          if (!cancelled) setError(true)
        })

      return () => {
        cancelled = true
      }
    }

    setResolved(src)
  }, [src])

  if (!resolved || error) {
    return (
      <span
        className={`inline-flex max-w-full items-center rounded-md border px-2 py-1 text-xs ${
          error
            ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
            : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        {error ? `圖片讀取失敗${alt ? `：${alt}` : ''}` : '圖片載入中...'}
      </span>
    )
  }

  return (
    <img
      src={resolved}
      alt={alt}
      {...props}
      className={`my-2 max-h-72 max-w-full rounded-lg border border-gray-200 object-contain shadow-sm dark:border-gray-700 ${className}`}
    />
  )
}
