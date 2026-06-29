import { useState, useEffect } from 'react'
import { getImageBase64 } from '../utils/fileIO'

interface MarkdownImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  alt?: string
}

export function MarkdownImage({ src, alt, ...props }: MarkdownImageProps) {
  const [resolved, setResolved] = useState<string | undefined>(undefined)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!src) {
      setResolved(undefined)
      return
    }
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
      return () => { cancelled = true }
    }
    setResolved(src)
  }, [src])

  if (!resolved || error) {
    return (
      <span
        className="inline-block px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded dark:bg-gray-700 dark:text-gray-500"
        {...props}
      >
        {alt || '[圖片]'}
      </span>
    )
  }

  return <img src={resolved} alt={alt} {...props} />
}
