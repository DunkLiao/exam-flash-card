import { useState, useMemo, useEffect } from 'react'
import { useAppContext } from '../hooks/useAppData'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownImage } from './MarkdownImage'

export function QuizMode() {
  const { cards, selectedDeckId, setView } = useAppContext()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [answers, setAnswers] = useState<(boolean | null)[]>([])
  const [finished, setFinished] = useState(false)

  const quizCards = useMemo(() => {
    const deckCards = cards.filter((c) => c.deckId === selectedDeckId)
    return [...deckCards].sort(() => Math.random() - 0.5).slice(0, Math.min(20, deckCards.length))
  }, [cards, selectedDeckId])

  useEffect(() => {
    setAnswers(new Array(quizCards.length).fill(null))
    setCurrentIndex(0)
    setShowAnswer(false)
    setFinished(false)
    setUserAnswer('')
  }, [quizCards])

  function handleSubmit() {
    if (finished) return
    const correct = userAnswer.trim().toLowerCase() === quizCards[currentIndex].back.trim().toLowerCase()
    const newAnswers = [...answers]
    newAnswers[currentIndex] = correct
    setAnswers(newAnswers)
    setShowAnswer(true)
  }

  function handleNext() {
    if (currentIndex + 1 >= quizCards.length) {
      setFinished(true)
    } else {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
      setUserAnswer('')
    }
  }

  const stats = {
    total: answers.filter((a) => a !== null).length,
    correct: answers.filter((a) => a === true).length,
    wrong: answers.filter((a) => a === false).length,
  }

  if (quizCards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-6xl mb-4">&#x1F4ED;</div>
        <p className="text-gray-500 mb-4 dark:text-gray-400">牌組中尚無卡片</p>
        <button
          onClick={() => setView('cards')}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium"
        >
          回到牌組
        </button>
      </div>
    )
  }

  if (finished) {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 page-enter">
        <div className="text-6xl mb-4">{accuracy >= 80 ? '&#x1F389;' : '&#x1F4AA;'}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 dark:text-white">測驗完成！</h2>
        <div className="flex gap-8 my-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">{stats.correct}</div>
            <div className="text-sm text-gray-400">答對</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">{stats.wrong}</div>
            <div className="text-sm text-gray-400">答錯</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-500">{accuracy}%</div>
            <div className="text-sm text-gray-400">正確率</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const deckCards = cards.filter((c) => c.deckId === selectedDeckId)
              const shuffled = [...deckCards].sort(() => Math.random() - 0.5).slice(0, Math.min(20, deckCards.length))
              setAnswers(new Array(shuffled.length).fill(null))
              setCurrentIndex(0)
              setShowAnswer(false)
              setFinished(false)
              setUserAnswer('')
            }}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium"
          >
            再測一次
          </button>
          <button
            onClick={() => setView('cards')}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
          >
            回到牌組
          </button>
        </div>
      </div>
    )
  }

  const current = quizCards[currentIndex]

  return (
    <div className="flex-1 flex flex-col items-center p-8 page-enter">
      <div className="w-full max-w-lg mb-2 text-sm text-gray-400 text-center">
        第 {currentIndex + 1} / {quizCards.length} 題
        {stats.total > 0 && (
          <span className="ml-3 text-green-500">
            &#x2713; {stats.correct}
          </span>
        )}
        {stats.wrong > 0 && (
          <span className="ml-1 text-red-500">
            &#x2717; {stats.wrong}
          </span>
        )}
      </div>

      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="prose prose-sm max-w-none mb-6 dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: MarkdownImage }}>{current.front}</ReactMarkdown>
        </div>

        <div className="space-y-3">
          <input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (showAnswer) handleNext()
                else handleSubmit()
              }
            }}
            placeholder="輸入你的答案..."
            disabled={showAnswer}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-800"
            autoFocus
          />

          {!showAnswer ? (
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-lg text-white font-medium disabled:cursor-not-allowed"
            >
              確認答案
            </button>
          ) : (
            <div>
              <div className={`p-3 rounded-lg text-sm mb-3 ${
                answers[currentIndex]
                  ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                  : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
              }`}>
                <div className="font-medium mb-1">
                  {answers[currentIndex] ? '&#x2705; 正確！' : '&#x274C; 錯誤！'}
                </div>
                <div>
                  正確答案：{' '}
                  <span className="font-medium">{current.back}</span>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
              >
                {currentIndex + 1 >= quizCards.length ? '查看結果' : '下一題'}
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setView('cards')}
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        ← 回到牌組
      </button>
    </div>
  )
}
