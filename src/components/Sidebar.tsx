import { useState } from 'react'
import { useAppContext } from '../hooks/useAppData'

export function Sidebar() {
  const { decks, selectedDeckId, selectDeck, addDeck, deleteDeck, setView } = useAppContext()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  function handleAdd() {
    if (!name.trim()) return
    addDeck(name.trim(), desc.trim())
    setName('')
    setDesc('')
    setShowAdd(false)
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full border-r border-gray-700 shrink-0">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold tracking-wide">快閃卡 FlashCard</h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <button
          onClick={() => { selectDeck(null); setView('decks') }}
          className={`w-full text-left px-3 py-2 rounded mb-1 text-sm transition-colors ${
            !selectedDeckId ? 'bg-purple-600 text-white' : 'hover:bg-gray-800 text-gray-300'
          }`}
        >
          所有牌組
        </button>

        {decks.map((d) => (
          <div key={d.id} className="group relative">
            <button
              onClick={() => selectDeck(d.id)}
              className={`w-full text-left px-3 py-2 rounded mb-1 text-sm transition-colors ${
                selectedDeckId === d.id
                  ? 'bg-purple-600 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <div className="font-medium truncate">{d.name}</div>
              {d.description && (
                <div className="text-xs text-gray-400 truncate">{d.description}</div>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteDeck(d.id) }}
              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 text-xs transition-opacity"
              title="刪除牌組"
            >
              ✕
            </button>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-gray-700">
        {showAdd ? (
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="牌組名稱"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="描述（選填）"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
            <div className="flex gap-1">
              <button
                onClick={handleAdd}
                className="flex-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded text-white"
              >
                新增
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
          >
            + 新增牌組
          </button>
        )}

        <button
          onClick={() => setView('import')}
          className="w-full px-3 py-2 mt-2 text-sm bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
        >
          匯入 / 匯出
        </button>
      </div>
    </aside>
  )
}
