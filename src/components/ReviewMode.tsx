import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppContext } from '../hooks/useAppData'
import { FlipCard } from './FlipCard'
import { getNowDateStr, sm2 } from '../utils/srs'
import { getReviewSessionCards } from '../utils/reviewProgress'
import type { Card, Rating } from '../types'

export function ReviewMode() {
  const { cards, selectedDeckId, updateCardSRS, setView } = useAppContext()
  const cardsRef = useRef(cards)
  const [sessionCards, setSessionCards] = useState<Card[]>(() => (
    selectedDeckId ? getReviewSessionCards(cards, selectedDeckId, getNowDateStr()) : []
  ))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    cardsRef.current = cards
  }, [cards])

  useEffect(() => {
    if (!selectedDeckId) {
      setSessionCards([])
      setIndex(0)
      setFlipped(false)
      setFinished(false)
      return
    }

    setSessionCards(getReviewSessionCards(cardsRef.current, selectedDeckId, getNowDateStr()))
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }, [selectedDeckId])

  const current = sessionCards[index]
  const progressPercent = sessionCards.length === 0 ? 0 : Math.round(((index + 1) / sessionCards.length) * 100)

  const restartSession = useCallback(() => {
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }, [])

  const handleRate = useCallback((rating: Rating) => {
    if (!current) return
    const updated = sm2(current, rating)
    updateCardSRS(current.id, updated)

    if (index + 1 >= sessionCards.length) {
      setFinished(true)
    } else {
      setIndex(index + 1)
      setFlipped(false)
    }
  }, [current, index, sessionCards.length, updateCardSRS])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (finished || sessionCards.length === 0) return
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
      if (!flipped) return
      if (e.key === '1') handleRate('again')
      else if (e.key === '2') handleRate('hard')
      else if (e.key === '3') handleRate('good')
      else if (e.key === '4') handleRate('easy')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [flipped, finished, handleRate, sessionCards.length])

  if (finished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 page-enter">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 dark:text-white">複習完成！</h2>
        <p className="text-gray-500 mb-6 dark:text-gray-400">
          已複習 {sessionCards.length} 張卡片
        </p>
        <div className="flex gap-3">
          <button
            onClick={restartSession}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
          >
            再複習一次
          </button>
          <button
            onClick={() => setView('cards')}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            回到牌組
          </button>
        </div>
      </div>
    )
  }

  if (sessionCards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 page-enter">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 dark:text-white">沒有待複習的卡片</h2>
        <p className="text-gray-500 mb-6 dark:text-gray-400">
          所有卡片都還沒到複習時間，或牌組中尚無卡片
        </p>
        <button
          onClick={() => setView('cards')}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
        >
          回到牌組
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center p-8 page-enter">
      <div className="text-sm text-gray-400 mb-4">
        {index + 1} / {sessionCards.length}
        {current.repetitions > 0 && (
          <span className="ml-3">
            間隔 {current.interval} 天，到期日 {current.nextReview}
          </span>
        )}
      </div>

      <div className="w-full max-w-lg mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1 dark:text-gray-400">
          <span>本次進度 {index + 1} / {sessionCards.length}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-lg mb-6">
        <FlipCard
          front={current.front}
          back={current.back}
          flipped={flipped}
          onFlip={() => setFlipped(!flipped)}
        />
        {!flipped && (
          <p className="text-center text-sm text-gray-400 mt-3">點擊卡片查看答案</p>
        )}
      </div>

      {flipped && (
        <div className="flex gap-3">
          <RatingButton label="重來" rating="again" onClick={handleRate} />
          <RatingButton label="困難" rating="hard" onClick={handleRate} />
          <RatingButton label="良好" rating="good" onClick={handleRate} />
          <RatingButton label="簡單" rating="easy" onClick={handleRate} />
        </div>
      )}

      <button
        onClick={() => setView('cards')}
        className="mt-8 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
      >
        ← 回到牌組
      </button>
    </div>
  )
}

function RatingButton({
  label,
  rating,
  onClick,
}: {
  label: string
  rating: Rating
  onClick: (r: Rating) => void
}) {
  const colors: Record<Rating, string> = {
    again: 'bg-red-500 hover:bg-red-600',
    hard: 'bg-orange-500 hover:bg-orange-600',
    good: 'bg-green-500 hover:bg-green-600',
    easy: 'bg-blue-500 hover:bg-blue-600',
  }
  const shortcuts: Record<Rating, string> = {
    again: '1',
    hard: '2',
    good: '3',
    easy: '4',
  }

  return (
    <button
      onClick={() => onClick(rating)}
      className={`px-6 py-3 rounded-xl text-white font-medium text-sm transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 ${colors[rating]}`}
    >
      {label}
      <span className="ml-2 text-xs opacity-70">[{shortcuts[rating]}]</span>
    </button>
  )
}
