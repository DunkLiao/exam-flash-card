import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock, RotateCcw } from 'lucide-react'
import { useAppContext } from '../hooks/useAppData'
import { FlipCard } from './FlipCard'
import { Button, EmptyState, PageHeader, PageShell, ProgressBar, Surface } from './ui'
import { getNowDateStr, sm2 } from '../utils/srs'
import { getDailyTaskCards, getMistakeCards, getReviewSessionCards, markCardMistake } from '../utils/reviewProgress'
import type { Card, Rating } from '../types'

type ReviewModeType = 'review' | 'mistake' | 'daily'

function getSessionCards(cards: Card[], deckId: string, today: string, mode: ReviewModeType): Card[] {
  if (mode === 'mistake') return getMistakeCards(cards, deckId)
  if (mode === 'daily') return getDailyTaskCards(cards, deckId, today)
  return getReviewSessionCards(cards, deckId, today)
}

const modeCopy: Record<ReviewModeType, {
  title: string
  emptyTitle: string
  emptyDescription: string
  progressLabel: string
}> = {
  review: {
    title: '複習模式',
    emptyTitle: '沒有待複習的卡片',
    emptyDescription: '所有卡片都還沒到複習時間，或牌組中尚無卡片。',
    progressLabel: '本次進度',
  },
  mistake: {
    title: '錯題練習',
    emptyTitle: '目前沒有錯題',
    emptyDescription: '答錯的卡片會自動加入錯題本，也可以之後手動解除。',
    progressLabel: '錯題進度',
  },
  daily: {
    title: '今日任務',
    emptyTitle: '今天沒有需要處理的任務',
    emptyDescription: '目前沒有到期、新卡、錯題或低星等卡片需要優先處理。',
    progressLabel: '任務進度',
  },
}

export function ReviewMode({ mode }: { mode: ReviewModeType }) {
  const { cards, selectedDeckId, updateCardSRS, setView } = useAppContext()
  const cardsRef = useRef(cards)
  const [sessionCards, setSessionCards] = useState<Card[]>(() => (
    selectedDeckId ? getSessionCards(cards, selectedDeckId, getNowDateStr(), mode) : []
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

    setSessionCards(getSessionCards(cardsRef.current, selectedDeckId, getNowDateStr(), mode))
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }, [mode, selectedDeckId])

  const current = sessionCards[index]
  const progressPercent = sessionCards.length === 0 ? 0 : Math.round(((index + 1) / sessionCards.length) * 100)

  const restartSession = useCallback(() => {
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }, [])

  const handleRate = useCallback((rating: Rating) => {
    if (!current) return
    const today = getNowDateStr()
    const updated = rating === 'again'
      ? markCardMistake(sm2(current, rating), today)
      : sm2(current, rating)
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
      <PageShell className="flex flex-col">
        <div className="flex flex-1 items-center justify-center">
          <Surface className="w-full max-w-xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">複習完成</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              本次已完成 {sessionCards.length} 張卡片。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={restartSession} variant="primary">
                <RotateCcw className="h-4 w-4" />
                再複習一次
              </Button>
              <Button onClick={() => setView('cards')} variant="secondary">
                回到牌組
              </Button>
            </div>
          </Surface>
        </div>
      </PageShell>
    )
  }

  if (sessionCards.length === 0) {
    return (
      <PageShell className="flex flex-col">
        <EmptyState
          icon={<Clock className="h-7 w-7" />}
          title={modeCopy[mode].emptyTitle}
          description={modeCopy[mode].emptyDescription}
          action={<Button onClick={() => setView('cards')} variant="primary">回到牌組</Button>}
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title={modeCopy[mode].title}
        subtitle={current.repetitions > 0 ? `間隔 ${current.interval} 天，到期日 ${current.nextReview}` : '新卡片，完成後會排入複習週期。'}
        actions={<Button onClick={() => setView('cards')} variant="secondary">回到牌組</Button>}
      />

      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <Surface className="mb-5 w-full p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">{modeCopy[mode].progressLabel}</span>
            <span className="text-slate-500 dark:text-slate-400">{index + 1} / {sessionCards.length} · {progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} tone="blue" />
        </Surface>

        <div className="w-full mb-6">
          <FlipCard
            front={current.front}
            back={current.back}
            flipped={flipped}
            onFlip={() => setFlipped(!flipped)}
          />
          {!flipped && (
            <p className="mt-3 text-center text-sm text-slate-400">點擊卡片或按空白鍵查看答案</p>
          )}
        </div>

        {flipped && (
          <Surface className="w-full p-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <RatingButton label="重來" rating="again" onClick={handleRate} />
              <RatingButton label="困難" rating="hard" onClick={handleRate} />
              <RatingButton label="良好" rating="good" onClick={handleRate} />
              <RatingButton label="簡單" rating="easy" onClick={handleRate} />
            </div>
          </Surface>
        )}
      </div>
    </PageShell>
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
    again: 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-400',
    hard: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400',
    good: 'bg-emerald-500 hover:bg-emerald-600 focus-visible:ring-emerald-400',
    easy: 'bg-blue-500 hover:bg-blue-600 focus-visible:ring-blue-400',
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
      className={`flex h-12 items-center justify-center rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${colors[rating]}`}
    >
      {label}
      <span className="ml-2 text-xs opacity-75">[{shortcuts[rating]}]</span>
    </button>
  )
}
