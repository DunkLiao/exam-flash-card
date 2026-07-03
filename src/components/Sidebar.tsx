import { useState } from 'react'
import { FileUp, FolderPlus, Layers, Library, Plus, Trash2, X } from 'lucide-react'
import { useAppContext } from '../hooks/useAppData'
import { Button, ConfirmDialog } from './ui'

export function Sidebar() {
  const { decks, selectedDeckId, selectDeck, addDeck, deleteDeck, setView } = useAppContext()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [deckToDelete, setDeckToDelete] = useState<{ id: string; name: string } | null>(null)

  function handleAdd() {
    if (!name.trim()) return
    addDeck(name.trim(), desc.trim())
    setName('')
    setDesc('')
    setShowAdd(false)
  }

  return (
    <aside className={`flex h-full shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition-all ${showAdd ? 'w-72' : 'w-20 sm:w-72'}`}>
      <div className="border-b border-slate-800 px-3 py-4 sm:px-4">
        <div className="flex items-center justify-center gap-3 sm:justify-start">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Library className="h-5 w-5" />
          </div>
          <div className={`${showAdd ? 'block' : 'hidden sm:block'} min-w-0`}>
            <h2 className="truncate text-base font-bold">快閃卡</h2>
            <p className="text-xs text-slate-400">Exam FlashCard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <button
          onClick={() => { selectDeck(null); setView('decks') }}
          className={`mb-2 flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors sm:justify-start ${
            !selectedDeckId
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4 shrink-0" />
          <span className={showAdd ? 'inline' : 'hidden sm:inline'}>所有牌組</span>
        </button>

        <div className={`${showAdd ? 'block' : 'hidden sm:block'} mb-2 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500`}>
          牌組清單
        </div>

        <div className="space-y-1">
          {decks.map((deck) => {
            const active = selectedDeckId === deck.id
            return (
              <div key={deck.id} className="group relative">
                <button
                  onClick={() => selectDeck(deck.id)}
                  className={`flex w-full items-start justify-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors sm:justify-start sm:pr-10 ${
                    active
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${active ? 'bg-blue-400' : 'bg-slate-600'}`} />
                  <span className={`${showAdd ? 'block' : 'hidden sm:block'} min-w-0`}>
                    <span className="block truncate font-medium">{deck.name}</span>
                    {deck.description && (
                      <span className="block truncate text-xs text-slate-500">{deck.description}</span>
                    )}
                  </span>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    setDeckToDelete({ id: deck.id, name: deck.name })
                  }}
                  className={`${showAdd ? 'block' : 'hidden sm:block'} absolute right-2 top-2 rounded-md p-1.5 text-slate-500 opacity-0 transition-all hover:bg-red-950/50 hover:text-red-300 group-hover:opacity-100`}
                  title="刪除牌組"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-3">
        {showAdd ? (
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FolderPlus className="h-4 w-4 text-blue-300" />
                新增牌組
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="牌組名稱"
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(event) => { if (event.key === 'Enter') handleAdd() }}
            />
            <input
              value={desc}
              onChange={(event) => setDesc(event.target.value)}
              placeholder="描述（選填）"
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
              onKeyDown={(event) => { if (event.key === 'Enter') handleAdd() }}
            />
            <Button onClick={handleAdd} variant="primary" size="sm" className="w-full">
              建立牌組
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowAdd(true)} variant="primary" className="w-full">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">新增牌組</span>
          </Button>
        )}

        <Button
          onClick={() => setView('import')}
          variant="ghost"
          className="mt-2 w-full text-slate-300 hover:bg-slate-900 hover:text-white"
        >
          <FileUp className="h-4 w-4" />
          <span className="hidden sm:inline">匯入 / 匯出</span>
        </Button>
      </div>

      {deckToDelete && (
        <ConfirmDialog
          title="刪除牌組？"
          description={(
            <>
              確定要刪除「<span className="font-semibold text-slate-700 dark:text-slate-200">{deckToDelete.name}</span>」嗎？
              此操作會一併刪除牌組內所有卡片，且無法復原。
            </>
          )}
          confirmLabel="刪除牌組"
          onCancel={() => setDeckToDelete(null)}
          onConfirm={() => {
            deleteDeck(deckToDelete.id)
            setDeckToDelete(null)
          }}
        />
      )}
    </aside>
  )
}
