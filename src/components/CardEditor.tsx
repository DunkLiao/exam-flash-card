import { useState, useEffect } from 'react'
import { MarkdownEditor } from './MarkdownEditor'

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col dark:bg-gray-900">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          <MarkdownEditor
            front={front}
            back={back}
            onFrontChange={setFront}
            onBackChange={setBack}
          />
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
          >
            取消
          </button>
          <button
            onClick={() => onSave(front, back)}
            disabled={!front.trim() || !back.trim()}
            className="px-6 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-lg text-white font-medium disabled:cursor-not-allowed"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  )
}
