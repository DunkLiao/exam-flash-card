import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownEditorProps {
  front: string
  back: string
  onFrontChange: (v: string) => void
  onBackChange: (v: string) => void
}

export function MarkdownEditor({ front, back, onFrontChange, onBackChange }: MarkdownEditorProps) {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="flex flex-col gap-4">
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-semibold text-gray-400 uppercase mb-1">正面（題目）</label>
          <textarea
            value={front}
            onChange={(e) => onFrontChange(e.target.value)}
            className="flex-1 w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="使用 Markdown 格式撰寫題目..."
          />
        </div>
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-semibold text-gray-400 uppercase mb-1">反面（答案）</label>
          <textarea
            value={back}
            onChange={(e) => onBackChange(e.target.value)}
            className="flex-1 w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="使用 Markdown 格式撰寫答案..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-semibold text-gray-400 uppercase mb-1">預覽（正面）</label>
          <div className="flex-1 p-3 bg-white border border-gray-200 rounded-lg overflow-auto dark:bg-gray-800 dark:border-gray-600">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{front || '_尚無內容_'}</ReactMarkdown>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-semibold text-gray-400 uppercase mb-1">預覽（反面）</label>
          <div className="flex-1 p-3 bg-white border border-gray-200 rounded-lg overflow-auto dark:bg-gray-800 dark:border-gray-600">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{back || '_尚無內容_'}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
