import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ClipboardCheck, RotateCcw, XCircle } from 'lucide-react'
import { useAppContext } from '../hooks/useAppData'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownImage } from './MarkdownImage'
import { Button, EmptyState, PageHeader, PageShell, ProgressBar, StatPill, Surface } from './ui'
import { getNowDateStr } from '../utils/srs'
import type { Card } from '../types'

function buildQuizCards(cards: Card[], deckId: string | null): Card[] {
  const deckCards = cards.filter((card) => card.deckId === deckId)
  return [...deckCards].sort(() => Math.random() - 0.5).slice(0, Math.min(20, deckCards.length))
}

export function QuizMode() {
  const { cards, selectedDeckId, markCardMistake, setView } = useAppContext()
  const [quizCards, setQuizCards] = useState<Card[]>(() => buildQuizCards(cards, selectedDeckId))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => new Array(quizCards.length).fill(null))
  const [finished, setFinished] = useState(false)
  const previousQuizSourceSignature = useRef<string | null>(null)
  const quizSourceSignature = useMemo(() => (
    `${selectedDeckId ?? ''}:${
      cards
      .filter((card) => card.deckId === selectedDeckId)
      .map((card) => JSON.stringify([card.id, card.front, card.back]))
      .join('|')
    }`
  ), [cards, selectedDeckId])

  const resetQuiz = useCallback((nextCards: Card[]) => {
    setQuizCards(nextCards)
    setAnswers(new Array(nextCards.length).fill(null))
    setCurrentIndex(0)
    setShowAnswer(false)
    setFinished(false)
    setUserAnswer('')
  }, [])

  useEffect(() => {
    if (previousQuizSourceSignature.current === quizSourceSignature) return
    previousQuizSourceSignature.current = quizSourceSignature
    resetQuiz(buildQuizCards(cards, selectedDeckId))
  }, [cards, quizSourceSignature, resetQuiz, selectedDeckId])

  const current = quizCards[currentIndex]

  function handleSubmit() {
    if (finished || !current) return
    const correct = userAnswer.trim().toLowerCase() === current.back.trim().toLowerCase()
    if (!correct) {
      markCardMistake(current.id, getNowDateStr())
    }
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
    total: answers.filter((answer) => answer !== null).length,
    correct: answers.filter((answer) => answer === true).length,
    wrong: answers.filter((answer) => answer === false).length,
  }
  const progressPercent = quizCards.length === 0 ? 0 : Math.round(((currentIndex + 1) / quizCards.length) * 100)

  if (quizCards.length === 0) {
    return (
      <PageShell className="flex flex-col">
        <EmptyState
          icon={<ClipboardCheck className="h-7 w-7" />}
          title="這個牌組沒有可測驗的卡片"
          description="新增卡片後即可使用測驗模式練習回想。"
          action={<Button onClick={() => setView('cards')} variant="primary">回到牌組</Button>}
        />
      </PageShell>
    )
  }

  if (finished) {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    return (
      <PageShell className="flex flex-col">
        <div className="flex flex-1 items-center justify-center">
          <Surface className="w-full max-w-xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <ClipboardCheck className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">測驗完成</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              本次正確率 {accuracy}%，共作答 {stats.total} 題。
            </p>
            <div className="my-6 grid grid-cols-3 gap-3">
              <StatPill label="答對" value={stats.correct} tone="emerald" />
              <StatPill label="答錯" value={stats.wrong} tone="red" />
              <StatPill label="正確率" value={`${accuracy}%`} tone="blue" />
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => resetQuiz(buildQuizCards(cards, selectedDeckId))} variant="primary">
                <RotateCcw className="h-4 w-4" />
                再測一次
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

  return (
    <PageShell>
      <PageHeader
        title="測驗模式"
        subtitle={`第 ${currentIndex + 1} / ${quizCards.length} 題`}
        actions={<Button onClick={() => setView('cards')} variant="secondary">回到牌組</Button>}
      />

      <div className="mx-auto w-full max-w-2xl">
        <Surface className="mb-5 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">測驗進度</span>
            <span className="text-slate-500 dark:text-slate-400">
              ✓ {stats.correct} · ✕ {stats.wrong} · {progressPercent}%
            </span>
          </div>
          <ProgressBar value={progressPercent} tone="blue" />
        </Surface>

        <Surface className="overflow-hidden">
          <div className="border-b border-slate-100 p-6 dark:border-slate-800">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">題目</div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: MarkdownImage }}>{current.front}</ReactMarkdown>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <input
              value={userAnswer}
              onChange={(event) => setUserAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  if (showAnswer) handleNext()
                  else handleSubmit()
                }
              }}
              placeholder="輸入你的答案..."
              disabled={showAnswer}
              className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-950 dark:disabled:bg-slate-900"
              autoFocus
            />

            {!showAnswer ? (
              <Button
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
                variant="primary"
                className="w-full"
              >
                提交答案
              </Button>
            ) : (
              <div className="space-y-4">
                <div className={`rounded-xl border p-4 text-sm ${
                  answers[currentIndex]
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
                }`}>
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    {answers[currentIndex] ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {answers[currentIndex] ? '正確' : '錯誤'}
                  </div>
                  <div>
                    正確答案：<span className="font-medium">{current.back}</span>
                  </div>
                </div>
                <Button onClick={handleNext} variant="primary" className="w-full">
                  {currentIndex + 1 >= quizCards.length ? '查看結果' : '下一題'}
                </Button>
              </div>
            )}
          </div>
        </Surface>
      </div>
    </PageShell>
  )
}
