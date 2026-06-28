import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface FlipCardProps {
  front: string
  back: string
  flipped: boolean
  onFlip: () => void
}

export function FlipCard({ front, back, flipped, onFlip }: FlipCardProps) {
  return (
    <div className="flip-card w-full max-w-lg mx-auto cursor-pointer" onClick={onFlip}>
      <div className={`flip-card-inner relative w-full ${flipped ? 'flipped' : ''}`} style={{ minHeight: '300px' }}>
        <div className="flip-card-front absolute inset-0 bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center dark:bg-gray-800 dark:border-gray-600">
          <div className="text-xs text-gray-400 mb-3 uppercase tracking-wide">正面</div>
          <div className="prose prose-sm max-w-none text-center dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{front}</ReactMarkdown>
          </div>
        </div>
        <div className="flip-card-back absolute inset-0 bg-purple-50 rounded-xl shadow-lg border border-purple-200 p-6 flex flex-col items-center justify-center dark:bg-purple-900/20 dark:border-purple-700">
          <div className="text-xs text-purple-400 mb-3 uppercase tracking-wide">反面</div>
          <div className="prose prose-sm max-w-none text-center dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{back}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
