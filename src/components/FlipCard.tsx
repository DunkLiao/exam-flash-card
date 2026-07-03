import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownImage } from './MarkdownImage'

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
        <div className="flip-card-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
          <div className="mb-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">正面</div>
          <div className="prose prose-sm max-w-none text-center dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: MarkdownImage }}>{front}</ReactMarkdown>
          </div>
        </div>
        <div className="flip-card-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-lg shadow-blue-100/70 dark:border-blue-900/70 dark:bg-blue-950/30 dark:shadow-black/20">
          <div className="mb-4 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:bg-blue-950 dark:text-blue-300">反面</div>
          <div className="prose prose-sm max-w-none text-center dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: MarkdownImage }}>{back}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
