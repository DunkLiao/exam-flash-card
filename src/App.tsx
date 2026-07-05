import { BookOpen, CalendarClock, FileUp, Layers, Sparkles } from 'lucide-react'
import { useAppContext } from './hooks/useAppData'
import { Sidebar } from './components/Sidebar'
import { DeckView } from './components/DeckView'
import { ReviewMode } from './components/ReviewMode'
import { QuizMode } from './components/QuizMode'
import { ImportExport } from './components/ImportExport'
import { Button, ConfirmDialog, EmptyState, PageHeader, PageShell, ProgressBar, StatPill, Surface } from './components/ui'
import { getDeckProgress } from './utils/reviewProgress'
import { useState } from 'react'

export default function App() {
  const { view, selectedDeckId, loading } = useAppContext()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <Sparkles className="h-4 w-4 text-blue-500" />
          載入中...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <main className="flex min-w-0 flex-1 overflow-hidden">
        {view === 'decks' && <DeckList />}
        {view === 'cards' && selectedDeckId && <DeckView />}
        {view === 'review' && selectedDeckId && <ReviewMode mode="review" />}
        {view === 'mistakeReview' && selectedDeckId && <ReviewMode mode="mistake" />}
        {view === 'dailyTask' && selectedDeckId && <ReviewMode mode="daily" />}
        {view === 'quiz' && selectedDeckId && <QuizMode />}
        {view === 'import' && <ImportExport />}
        {view === 'cards' && !selectedDeckId && <DeckList />}
      </main>
    </div>
  )
}

function DeckList() {
  const { decks, selectDeck, setView, cards, deleteDeck } = useAppContext()
  const [deckToDelete, setDeckToDelete] = useState<{ id: string; name: string } | null>(null)
  const today = new Date().toISOString().split('T')[0]
  const allProgress = decks.map((deck) => getDeckProgress(cards, deck.id, today))
  const totalCards = allProgress.reduce((sum, progress) => sum + progress.totalCards, 0)
  const learnedCards = allProgress.reduce((sum, progress) => sum + progress.learnedCards, 0)
  const dueCards = allProgress.reduce((sum, progress) => sum + progress.dueCards, 0)
  const newCards = allProgress.reduce((sum, progress) => sum + progress.newCards, 0)
  const mistakeCards = allProgress.reduce((sum, progress) => sum + progress.mistakeCards, 0)
  const learnedPercent = totalCards === 0 ? 0 : Math.round((learnedCards / totalCards) * 100)

  return (
    <PageShell>
      <PageHeader
        title="我的牌組"
        subtitle="管理題庫、追蹤學習進度，並從待複習卡片開始。"
        actions={(
          <Button onClick={() => setView('import')} variant="secondary">
            <FileUp className="h-4 w-4" />
            匯入 / 匯出
          </Button>
        )}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatPill label="牌組" value={`${decks.length} 組`} tone="blue" />
        <StatPill label="總卡片" value={`${totalCards} 張`} />
        <StatPill label="待複習" value={`${dueCards} 張`} tone={dueCards > 0 ? 'amber' : 'emerald'} />
        <StatPill label="新卡" value={`${newCards} 張`} tone="slate" />
        <StatPill label="錯題" value={`${mistakeCards} 張`} tone={mistakeCards > 0 ? 'red' : 'slate'} />
      </div>

      {decks.length > 0 && (
        <Surface className="mb-6 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">整體已學進度</span>
            <span className="text-slate-500 dark:text-slate-400">{learnedCards} / {totalCards} · {learnedPercent}%</span>
          </div>
          <ProgressBar value={learnedPercent} />
        </Surface>
      )}

      {decks.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="還沒有牌組"
          description="從左側新增牌組，或使用匯入工具載入既有資料。"
          action={(
            <Button onClick={() => setView('import')} variant="primary">
              <FileUp className="h-4 w-4" />
              匯入資料
            </Button>
          )}
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => {
            const progress = getDeckProgress(cards, deck.id, today)
            return (
              <Surface
                key={deck.id}
                className="group cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:hover:border-blue-900"
              >
                <div onClick={() => selectDeck(deck.id)} role="button" tabIndex={0}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                        <Layers className="h-5 w-5" />
                      </div>
                      <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">{deck.name}</h3>
                      {deck.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{deck.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        setDeckToDelete({ id: deck.id, name: deck.name })
                      }}
                      className="rounded-md px-2 py-1 text-xs text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                    >
                      刪除
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>已學 {progress.learnedCards} / {progress.totalCards}</span>
                      <span>{progress.learnedPercent}%</span>
                    </div>
                    <ProgressBar value={progress.learnedPercent} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/70">
                      <div className="text-slate-400">卡片</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-200">{progress.totalCards}</div>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                      <div className="opacity-75">待複習</div>
                      <div className="font-semibold">{progress.dueCards}</div>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                      <div className="opacity-75">新卡</div>
                      <div className="font-semibold">{progress.newCards}</div>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2 text-red-700 dark:bg-red-950/30 dark:text-red-300">
                      <div className="opacity-75">錯題</div>
                      <div className="font-semibold">{progress.mistakeCards}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    建立於 {new Date(deck.createdAt).toLocaleDateString('zh-TW')}
                  </div>
                </div>
              </Surface>
            )
          })}
        </div>
      )}

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
    </PageShell>
  )
}
