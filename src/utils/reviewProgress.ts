import type { Card } from '../types'
import { isDue } from './srs.ts'

export interface DeckProgress {
  totalCards: number
  learnedCards: number
  dueCards: number
  newCards: number
  learnedPercent: number
}

export function normalizeStarRating(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(5, Math.round(numeric)))
}

export function withNormalizedCardMetadata(card: Card): Card {
  return {
    ...card,
    starRating: normalizeStarRating(card.starRating),
  }
}

export function getReviewSessionCards(cards: Card[], deckId: string, today: string): Card[] {
  const deckCards = cards.filter((card) => card.deckId === deckId)
  const dueCards = deckCards
    .filter((card) => isDue(card, today) && card.repetitions > 0)
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview))
  const newCards = deckCards.filter((card) => card.repetitions === 0)
  const seen = new Set<string>()

  return [...dueCards, ...newCards].filter((card) => {
    if (seen.has(card.id)) return false
    seen.add(card.id)
    return true
  })
}

export function getDeckProgress(cards: Card[], deckId: string, today: string): DeckProgress {
  const deckCards = cards.filter((card) => card.deckId === deckId)
  const totalCards = deckCards.length
  const learnedCards = deckCards.filter((card) => card.repetitions > 0).length
  const newCards = deckCards.filter((card) => card.repetitions === 0).length
  const dueCards = deckCards.filter((card) => isDue(card, today)).length

  return {
    totalCards,
    learnedCards,
    dueCards,
    newCards,
    learnedPercent: totalCards === 0 ? 0 : Math.round((learnedCards / totalCards) * 100),
  }
}
