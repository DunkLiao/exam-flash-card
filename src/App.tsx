import { useAppContext } from './hooks/useAppData'
import { Sidebar } from './components/Sidebar'
import { DeckView } from './components/DeckView'
import { ReviewMode } from './components/ReviewMode'
import { QuizMode } from './components/QuizMode'
import { ImportExport } from './components/ImportExport'
import { getDeckProgress } from './utils/reviewProgress'

export default function App() {
  const { view, selectedDeckId, loading } = useAppContext()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-gray-400">載入中...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        {view === 'decks' && <DeckList />}
        {view === 'cards' && selectedDeckId && <DeckView />}
        {view === 'review' && selectedDeckId && <ReviewMode />}
        {view === 'quiz' && selectedDeckId && <QuizMode />}
        {view === 'import' && <ImportExport />}
        {view === 'cards' && !selectedDeckId && <DeckList />}
      </main>
    </div>
  )
}

function DeckList() {
  const { decks, selectDeck, setView, cards, deleteDeck } = useAppContext()
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex-1 flex flex-col p-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">我的牌組</h2>
        <button
          onClick={() => setView('import')}
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
        >
          匯入 / 匯出
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-6xl mb-4">&#x1F4DA;</div>
          <p className="text-lg">還沒有牌組</p>
          <p className="text-sm mt-1">請從左側新增牌組，或使用匯入工具載入資料。</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => {
            const progress = getDeckProgress(cards, deck.id, today)
            return (
              <div
                key={deck.id}
                onClick={() => selectDeck(deck.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white">{deck.name}</h3>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteDeck(deck.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-sm"
                  >
                    刪除
                  </button>
                </div>

                {deck.description && (
                  <p className="text-sm text-gray-500 mb-3 dark:text-gray-400">{deck.description}</p>
                )}

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1 dark:text-gray-400">
                    <span>已學 {progress.learnedCards} / {progress.totalCards}</span>
                    <span>{progress.learnedPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${progress.learnedPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>{progress.totalCards} 張卡片</span>
                  <span>待複習 {progress.dueCards}</span>
                  <span>新卡 {progress.newCards}</span>
                  <span>建立於 {new Date(deck.createdAt).toLocaleDateString('zh-TW')}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
