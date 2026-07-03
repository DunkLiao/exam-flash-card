import { useState } from 'react'
import { BookOpenCheck, Brain, FileQuestion, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useAppContext } from '../hooks/useAppData'
import { CardEditor } from './CardEditor'
import { FlipCard } from './FlipCard'
import { StarRating } from './StarRating'
import { Button, EmptyState, PageHeader, PageShell, ProgressBar, StatPill, Surface } from './ui'
import { getCardPreviewText } from '../utils/cardPreview'
import { getDeckProgress } from '../utils/reviewProgress'
import type { Card } from '../types'

export function DeckView() {
  const {
    decks,
    cards,
    selectedDeckId,
    addCard,
    updateCard,
    deleteCard,
    updateCardStarRating,
    setView,
  } = useAppContext()
  const [showEditor, setShowEditor] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [previewCard, setPreviewCard] = useState<Card | null>(null)
  const [previewFlipped, setPreviewFlipped] = useState(false)

  const deck = decks.find((item) => item.id === selectedDeckId)
  const deckCards = cards.filter((card) => card.deckId === selectedDeckId)
  const currentPreviewCard = previewCard
    ? cards.find((card) => card.id === previewCard.id) ?? previewCard
    : null
  const progress = getDeckProgress(cards, selectedDeckId ?? '', new Date().toISOString().split('T')[0])

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

  if (currentPreviewCard) {
    return (
      <PageShell className="flex flex-col">
        <PageHeader
          title="卡片預覽"
          subtitle={deck?.name ?? '牌組'}
          actions={(
            <Button
              onClick={() => {
                setPreviewCard(null)
                setPreviewFlipped(false)
              }}
              variant="secondary"
            >
              回到列表
            </Button>
          )}
        />

        <div className="flex flex-1 flex-col items-center justify-center">
          <FlipCard
            front={currentPreviewCard.front}
            back={currentPreviewCard.back}
            flipped={previewFlipped}
            onFlip={() => setPreviewFlipped(!previewFlipped)}
          />

          <div className="mt-5 flex flex-col items-center gap-3">
            <StarRating
              value={currentPreviewCard.starRating}
              onChange={(value) => updateCardStarRating(currentPreviewCard.id, value)}
            />
            {!previewFlipped && (
              <p className="text-sm text-slate-400">點擊卡片查看背面</p>
            )}
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title={deck?.name ?? '牌組'}
        subtitle={deck?.description || '管理卡片、預覽內容，或開始複習與測驗。'}
        actions={(
          <>
            <Button
              onClick={() => setView('review')}
              disabled={deckCards.length === 0}
              variant="success"
            >
              <BookOpenCheck className="h-4 w-4" />
              複習模式
            </Button>
            <Button
              onClick={() => setView('quiz')}
              disabled={deckCards.length === 0}
              variant="primary"
            >
              <FileQuestion className="h-4 w-4" />
              測驗模式
            </Button>
            <Button onClick={startAdd} variant="secondary">
              <Plus className="h-4 w-4" />
              新增卡片
            </Button>
          </>
        )}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatPill label="卡片" value={`${progress.totalCards} 張`} tone="blue" />
        <StatPill label="已學" value={`${progress.learnedCards} 張`} tone="emerald" />
        <StatPill label="待複習" value={`${progress.dueCards} 張`} tone={progress.dueCards > 0 ? 'amber' : 'emerald'} />
        <StatPill label="新卡" value={`${progress.newCards} 張`} />
      </div>

      {deckCards.length > 0 && (
        <Surface className="mb-6 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">已學進度</span>
            <span className="text-slate-500 dark:text-slate-400">{progress.learnedPercent}%</span>
          </div>
          <ProgressBar value={progress.learnedPercent} />
        </Surface>
      )}

      {deckCards.length === 0 ? (
        <EmptyState
          icon={<Brain className="h-7 w-7" />}
          title="還沒有卡片"
          description="新增第一張卡片後，就可以開始預覽、複習與測驗。"
          action={(
            <Button onClick={startAdd} variant="primary">
              <Plus className="h-4 w-4" />
              新增卡片
            </Button>
          )}
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {deckCards.map((card) => (
            <Surface
              key={card.id}
              className="group cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:hover:border-blue-900"
            >
              <div onClick={() => setPreviewCard(card)} role="button" tabIndex={0}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                      <RotateCcw className="h-3.5 w-3.5" />
                      {card.repetitions > 0 ? `下次 ${card.nextReview}` : '新卡'}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                      {getCardPreviewText(card.front)}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {getCardPreviewText(card.back)}
                    </p>
                  </div>
                  <StarRating
                    value={card.starRating}
                    onChange={(value) => updateCardStarRating(card.id, value)}
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <span>
                    {card.repetitions > 0
                      ? `間隔 ${card.interval} 天`
                      : '尚未複習'}
                  </span>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      onClick={(event) => {
                        event.stopPropagation()
                        startEdit(card)
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      編輯
                    </Button>
                    <Button
                      onClick={(event) => {
                        event.stopPropagation()
                        deleteCard(card.id)
                      }}
                      variant="danger"
                      size="sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      刪除
                    </Button>
                  </div>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}

      {showEditor && (
        <CardEditor
          title={editingCard ? '編輯卡片' : '新增卡片'}
          initialFront={editingCard?.front ?? ''}
          initialBack={editingCard?.back ?? ''}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false)
            setEditingCard(null)
          }}
        />
      )}
    </PageShell>
  )
}
