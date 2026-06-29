import { useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { readFile } from '@tauri-apps/plugin-fs'
import { saveImage, openImageDialog } from '../utils/fileIO'
import { MarkdownImage } from './MarkdownImage'

interface MarkdownEditorProps {
  front: string
  back: string
  onFrontChange: (v: string) => void
  onBackChange: (v: string) => void
}

async function insertImageBytes(
  bytes: Uint8Array,
  ext: string,
  target: 'front' | 'back',
  front: string,
  back: string,
  onFrontChange: (v: string) => void,
  onBackChange: (v: string) => void,
  frontRef: React.RefObject<HTMLTextAreaElement | null>,
  backRef: React.RefObject<HTMLTextAreaElement | null>,
) {
  const filename = `img_${Date.now()}.${ext}`
  const imagePath = await saveImage(Array.from(bytes), filename)
  const md = `![image](${imagePath})`

  const textarea = target === 'front' ? frontRef.current : backRef.current
  if (!textarea) return

  const currentValue = target === 'front' ? front : back
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const newValue = currentValue.substring(0, start) + md + currentValue.substring(end)

  if (target === 'front') {
    onFrontChange(newValue)
  } else {
    onBackChange(newValue)
  }

  requestAnimationFrame(() => {
    const el = target === 'front' ? frontRef.current : backRef.current
    if (el) {
      el.selectionStart = el.selectionEnd = start + md.length
      el.focus()
    }
  })
}

export function MarkdownEditor({ front, back, onFrontChange, onBackChange }: MarkdownEditorProps) {
  const frontRef = useRef<HTMLTextAreaElement>(null)
  const backRef = useRef<HTMLTextAreaElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleToolbarInsert = useCallback(async (target: 'front' | 'back') => {
    const path = await openImageDialog()
    if (!path) return
    setUploading(true)
    try {
      const data = await readFile(path)
      const ext = path.split('.').pop()?.toLowerCase() || 'png'
      await insertImageBytes(data, ext, target, front, back, onFrontChange, onBackChange, frontRef, backRef)
    } catch (e) {
      console.error('Failed to insert image:', e)
    } finally {
      setUploading(false)
    }
  }, [front, back, onFrontChange, onBackChange])

  const handlePaste = useCallback(async (e: React.ClipboardEvent, target: 'front' | 'back') => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) return
        setUploading(true)
        try {
          const buffer = await file.arrayBuffer()
          const bytes = new Uint8Array(buffer)
          const ext = item.type.split('/')[1] || 'png'
          await insertImageBytes(bytes, ext, target, front, back, onFrontChange, onBackChange, frontRef, backRef)
        } catch (e) {
          console.error('Failed to paste image:', e)
        } finally {
          setUploading(false)
        }
        return
      }
    }
  }, [front, back, onFrontChange, onBackChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, target: 'front' | 'back') => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      setUploading(true)
      try {
        const buffer = await file.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
        await insertImageBytes(bytes, ext, target, front, back, onFrontChange, onBackChange, frontRef, backRef)
      } catch (e) {
        console.error('Failed to drop image:', e)
      } finally {
        setUploading(false)
      }
      return
    }
  }, [front, back, onFrontChange, onBackChange])

  const imageButton = (target: 'front' | 'back') => (
    <button
      type="button"
      onClick={() => handleToolbarInsert(target)}
      disabled={uploading}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        uploading
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-gray-100 hover:bg-purple-100 text-gray-500 hover:text-purple-600 dark:bg-gray-700 dark:hover:bg-purple-900/40 dark:text-gray-400 dark:hover:text-purple-400'
      }`}
      title="插入圖片"
    >
      {uploading ? '⋯' : '🖼'}
    </button>
  )

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="flex flex-col gap-4">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">正面（題目）</label>
            {imageButton('front')}
          </div>
          <textarea
            ref={frontRef}
            value={front}
            onChange={(e) => onFrontChange(e.target.value)}
            onPaste={(e) => handlePaste(e, 'front')}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'front')}
            className="flex-1 w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="使用 Markdown 格式撰寫題目..."
          />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">反面（答案）</label>
            {imageButton('back')}
          </div>
          <textarea
            ref={backRef}
            value={back}
            onChange={(e) => onBackChange(e.target.value)}
            onPaste={(e) => handlePaste(e, 'back')}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'back')}
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
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: MarkdownImage }}>{front || '_尚無內容_'}</ReactMarkdown>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-semibold text-gray-400 uppercase mb-1">預覽（反面）</label>
          <div className="flex-1 p-3 bg-white border border-gray-200 rounded-lg overflow-auto dark:bg-gray-800 dark:border-gray-600">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: MarkdownImage }}>{back || '_尚無內容_'}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
