import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { MarkdownEditor } from './MarkdownEditor'
import { Button } from './ui'

interface CardEditorProps {
  initialFront?: string
  initialBack?: string
  onSave: (front: string, back: string) => void
  onCancel: () => void
  title: string
}

export function CardEditor({ initialFront = '', initialBack = '', onSave, onCancel, title }: CardEditorProps) {
  const [front, setFront] = useState(initialFront)
  const [back, setBack] = useState(initialBack)

  useEffect(() => {
    setFront(initialFront)
    setBack(initialBack)
  }, [initialFront, initialBack])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">支援 Markdown、貼上圖片與拖放圖片。</p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-4 sm:p-6">
          <MarkdownEditor
            front={front}
            back={back}
            onFrontChange={setFront}
            onBackChange={setBack}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <Button onClick={onCancel} variant="secondary">
            取消
          </Button>
          <Button
            onClick={() => onSave(front, back)}
            disabled={!front.trim() || !back.trim()}
            variant="primary"
          >
            儲存
          </Button>
        </div>
      </div>
    </div>
  )
}
