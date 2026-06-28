import type { Card, Rating } from '../types'

export function getNowDateStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function isDue(card: Card, today: string): boolean {
  return card.nextReview <= today
}

export function getDueCards(cards: Card[], deckId?: string): Card[] {
  const today = getNowDateStr()
  return cards
    .filter((c) => (deckId ? c.deckId === deckId : true))
    .filter((c) => isDue(c, today))
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview))
}

export function getNewCards(cards: Card[], deckId?: string): Card[] {
  return cards
    .filter((c) => (deckId ? c.deckId === deckId : true))
    .filter((c) => c.repetitions === 0)
}

export function sm2(card: Card, rating: Rating): Card {
  const now = getNowDateStr()
  let { ease, interval, repetitions } = card

  if (rating === 'again') {
    repetitions = 0
    interval = 1
  } else {
    const q = rating === 'hard' ? 3 : rating === 'good' ? 4 : 5

    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * ease)
    }

    repetitions += 1
    ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if (ease < 1.3) ease = 1.3
  }

  const nextReview = addDays(now, interval)

  return {
    ...card,
    ease,
    interval,
    repetitions,
    nextReview,
    lastReview: now,
  }
}
