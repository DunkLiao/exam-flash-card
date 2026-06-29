import { useState } from 'react'
import { useAppContext } from '../hooks/useAppData'
import { CardEditor } from './CardEditor'
import { FlipCard } from './FlipCard'
import type { Card } from '../types'

export function DeckView() {
  const { decks, cards, selectedDeckId, addCard, updateCard, deleteCard, setView } = useAppContext()
  const [showEditor, setShowEditor] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [previewCard, setPreviewCard] = useState<Card | null>(null)
  const [previewFlipped, setPreviewFlipped] = useState(false)

  const deck = decks.find((d) => d.id === selectedDeckId)
  const deckCards = cards.filter((c) => c.deckId === selectedDeckId)

  function handleSave(front: string, back: string) {
    if (editingCard) {
      updateCard(editingCard.id, front, back)
      setEditingCard(null)
    } else {
      addCard(front, back, selectedDeckId!)
    }
    setShowEditor(false)
  }

  function startEdit(card: Card) {
    setEditingCard(card)
    setShowEditor(true)
  }

  function startAdd() {
    setEditingCard(null)
    setShowEditor(true)
  }

  if (previewCard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 page-enter">
        <button
          onClick={() => { setPreviewCard(null); setPreviewFlipped(false) }}
          className="self-start mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← 回到卡片列表
        </button>
        <FlipCard
          front={previewCard.front}
          back={previewCard.back}
          flipped={previewFlipped}
          onFlip={() => setPreviewFlipped(!previewFlipped)}
        />
        {!previewFlipped && (
          <p className="mt-4 text-sm text-gray-400">點擊卡片翻面</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{deck?.name ?? '牌組'}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {deckCards.length} 張卡片
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('review')}
            disabled={deckCards.length === 0}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-lg text-white font-medium disabled:cursor-not-allowed"
          >
            複習模式
          </button>
          <button
            onClick={() => setView('quiz')}
            disabled={deckCards.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg text-white font-medium disabled:cursor-not-allowed"
          >
            測驗模式
          </button>
          <button
            onClick={startAdd}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium"
          >
            + 新增卡片
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {deckCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="text-6xl mb-4">&#x1F4DD;</div>
            <p className="text-lg">尚無卡片</p>
            <p className="text-sm mt-1">點擊「+ 新增卡片」開始建立</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {deckCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group dark:bg-gray-800 dark:border-gray-700"
                onClick={() => setPreviewCard(card)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 line-clamp-2 dark:text-white">
                      {card.front.replace(/[#*`>\[\]!()~]/g, '').substring(0, 100)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2 dark:text-gray-500">
                      {card.back.replace(/[#*`>\[\]!()~]/g, '').substring(0, 100)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>
                    {card.repetitions > 0
                      ? `間隔: ${card.interval} 天 · 下次: ${card.nextReview}`
                      : '新卡片'}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(card) }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                    >
                      編輯
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCard(card.id) }}
                      className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <CardEditor
          title={editingCard ? '編輯卡片' : '新增卡片'}
          initialFront={editingCard?.front ?? ''}
          initialBack={editingCard?.back ?? ''}
          onSave={handleSave}
          onCancel={() => { setShowEditor(false); setEditingCard(null) }}
        />
      )}
    </div>
  )
}
