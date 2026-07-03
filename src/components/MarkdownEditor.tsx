import { useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { importImageFile, saveImage, openImageDialog } from '../utils/fileIO'
import { MarkdownImage } from './MarkdownImage'

interface MarkdownEditorProps {
  front: string
  back: string
  onFrontChange: (v: string) => void
  onBackChange: (v: string) => void
}

type CardSide = 'front' | 'back'

function normalizeImageExtension(ext: string): string {
  const value = ext.toLowerCase()
  if (value === 'svg+xml') return 'svg'
  if (value === 'jpg' || value === 'jpeg') return value
  if (['png', 'gif', 'webp', 'bmp', 'svg'].includes(value)) return value
  return 'png'
}

function withMarkdownSpacing(before: string, markdown: string, after: string): string {
  const prefix = before.length > 0 && !before.endsWith('\n') ? '\n\n' : ''
  const suffix = after.length > 0 && !after.startsWith('\n') ? '\n\n' : ''
  return `${before}${prefix}${markdown}${suffix}${after}`
}

function insertImagePath(
  imagePath: string,
  target: CardSide,
  front: string,
  back: string,
  onFrontChange: (v: string) => void,
  onBackChange: (v: string) => void,
  frontRef: React.RefObject<HTMLTextAreaElement | null>,
  backRef: React.RefObject<HTMLTextAreaElement | null>,
) {
  const textarea = target === 'front' ? frontRef.current : backRef.current
  if (!textarea) return

  const md = `![圖片](${imagePath})`

  const currentValue = target === 'front' ? front : back
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = currentValue.substring(0, start)
  const after = currentValue.substring(end)
  const newValue = withMarkdownSpacing(before, md, after)

  if (target === 'front') {
    onFrontChange(newValue)
  } else {
    onBackChange(newValue)
  }

  requestAnimationFrame(() => {
    const el = target === 'front' ? frontRef.current : backRef.current
    if (el) {
      const cursor = before.length + (before.length > 0 && !before.endsWith('\n') ? 2 : 0) + md.length
      el.selectionStart = el.selectionEnd = cursor
      el.focus()
    }
  })
}

async function insertImageBytes(
  bytes: Uint8Array,
  ext: string,
  target: CardSide,
  front: string,
  back: string,
  onFrontChange: (v: string) => void,
  onBackChange: (v: string) => void,
  frontRef: React.RefObject<HTMLTextAreaElement | null>,
  backRef: React.RefObject<HTMLTextAreaElement | null>,
) {
  const filename = `img_${Date.now()}.${normalizeImageExtension(ext)}`
  const imagePath = await saveImage(Array.from(bytes), filename)
  insertImagePath(imagePath, target, front, back, onFrontChange, onBackChange, frontRef, backRef)
}

export function MarkdownEditor({ front, back, onFrontChange, onBackChange }: MarkdownEditorProps) {
  const frontRef = useRef<HTMLTextAreaElement>(null)
  const backRef = useRef<HTMLTextAreaElement>(null)
  const [uploadingTarget, setUploadingTarget] = useState<CardSide | null>(null)
  const [dragTarget, setDragTarget] = useState<CardSide | null>(null)
  const [error, setError] = useState<string | null>(null)

  const insertBytes = useCallback(async (bytes: Uint8Array, ext: string, target: CardSide) => {
    setUploadingTarget(target)
    setError(null)
    try {
      await insertImageBytes(bytes, ext, target, front, back, onFrontChange, onBackChange, frontRef, backRef)
    } catch (e) {
      console.error('Failed to insert image:', e)
      setError('圖片插入失敗，請確認檔案格式或再試一次。')
    } finally {
      setUploadingTarget(null)
    }
  }, [front, back, onFrontChange, onBackChange])

  const handleToolbarInsert = useCallback(async (target: CardSide) => {
    const path = await openImageDialog()
    if (!path) return

    setUploadingTarget(target)
    setError(null)
    try {
      const ext = path.split('.').pop() || 'png'
      const filename = `img_${Date.now()}.${normalizeImageExtension(ext)}`
      const imagePath = await importImageFile(path, filename)
      insertImagePath(imagePath, target, front, back, onFrontChange, onBackChange, frontRef, backRef)
    } catch (e) {
      console.error('Failed to read selected image:', e)
      setError('無法讀取選取的圖片。')
    } finally {
      setUploadingTarget(null)
    }
  }, [front, back, onFrontChange, onBackChange])

  const handlePaste = useCallback(async (e: React.ClipboardEvent, target: CardSide) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.type.startsWith('image/')) continue

      e.preventDefault()
      const file = item.getAsFile()
      if (!file) return

      const buffer = await file.arrayBuffer()
      await insertBytes(new Uint8Array(buffer), item.type.split('/')[1] || 'png', target)
      return
    }
  }, [insertBytes])

  const handleDragOver = useCallback((e: React.DragEvent, target: CardSide) => {
    e.preventDefault()
    e.stopPropagation()
    setDragTarget(target)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragTarget(null)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, target: CardSide) => {
    e.preventDefault()
    e.stopPropagation()
    setDragTarget(null)

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue

      const buffer = await file.arrayBuffer()
      const ext = file.name.split('.').pop() || file.type.split('/')[1] || 'png'
      await insertBytes(new Uint8Array(buffer), ext, target)
      return
    }

    setError('請拖放圖片檔案。')
  }, [insertBytes])

  const imageButton = (target: CardSide) => {
    const uploading = uploadingTarget === target

    return (
      <button
        type="button"
        onClick={() => handleToolbarInsert(target)}
        disabled={uploadingTarget !== null}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          uploading
            ? 'cursor-wait bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-950/50 dark:hover:text-blue-200'
        }`}
        title="插入圖片"
      >
        {uploading ? '插入中...' : '插入圖片'}
      </button>
    )
  }

  const textAreaClass = (target: CardSide) => {
    const active = dragTarget === target
    return `min-h-40 flex-1 w-full resize-none rounded-lg border p-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-400 ${
      active
        ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30'
        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
    } dark:text-white`
  }

  return (
    <div className="grid h-full gap-4 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
      <div className="flex min-h-[620px] flex-col gap-4 lg:min-h-0">
        <div className="flex flex-1 flex-col">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">正面（題目）</label>
              <p className="text-[11px] text-slate-400">可點選、貼上或拖放圖片</p>
            </div>
            {imageButton('front')}
          </div>
          <textarea
            ref={frontRef}
            value={front}
            onChange={(e) => onFrontChange(e.target.value)}
            onPaste={(e) => handlePaste(e, 'front')}
            onDragOver={(e) => handleDragOver(e, 'front')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'front')}
            className={textAreaClass('front')}
            placeholder="使用 Markdown 撰寫題目。可直接貼上或拖放圖片。"
          />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">反面（答案）</label>
              <p className="text-[11px] text-slate-400">可點選、貼上或拖放圖片</p>
            </div>
            {imageButton('back')}
          </div>
          <textarea
            ref={backRef}
            value={back}
            onChange={(e) => onBackChange(e.target.value)}
            onPaste={(e) => handlePaste(e, 'back')}
            onDragOver={(e) => handleDragOver(e, 'back')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'back')}
            className={textAreaClass('back')}
            placeholder="使用 Markdown 撰寫答案。可直接貼上或拖放圖片。"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <div className="flex min-h-[620px] flex-col gap-4 lg:min-h-0">
        <div className="flex flex-1 flex-col">
          <label className="mb-1 text-xs font-semibold uppercase text-slate-400">預覽（正面）</label>
          <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: MarkdownImage }}>{front || '_尚無內容_'}</ReactMarkdown>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <label className="mb-1 text-xs font-semibold uppercase text-slate-400">預覽（反面）</label>
          <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: MarkdownImage }}>{back || '_尚無內容_'}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
