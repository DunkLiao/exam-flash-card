import type { Card } from '../types'
import { isDue } from './srs.ts'

export interface DeckProgress {
  totalCards: number
  learnedCards: number
  dueCards: number
  newCards: number
  mistakeCards: number
  suggestedCards: number
  learnedPercent: number
}

export function normalizeStarRating(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(5, Math.round(numeric)))
}

export function normalizeMistakeCount(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.round(numeric))
}

export function normalizeMistakeDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

export function normalizeIsMistake(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return Boolean(value)
}

export function withNormalizedCardMetadata(card: Card): Card {
  return {
    ...card,
    starRating: normalizeStarRating(card.starRating),
    mistakeCount: normalizeMistakeCount(card.mistakeCount),
    lastMistakeAt: normalizeMistakeDate(card.lastMistakeAt),
    isMistake: normalizeIsMistake(card.isMistake),
  }
}

export function markCardMistake(card: Card, date: string): Card {
  return {
    ...withNormalizedCardMetadata(card),
    mistakeCount: normalizeMistakeCount(card.mistakeCount) + 1,
    lastMistakeAt: date,
    isMistake: true,
  }
}

export function clearCardMistake(card: Card): Card {
  return {
    ...withNormalizedCardMetadata(card),
    isMistake: false,
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

export function getMistakeCards(cards: Card[], deckId: string): Card[] {
  return cards
    .filter((card) => card.deckId === deckId && card.isMistake)
    .sort((a, b) => {
      const dateCompare = (b.lastMistakeAt ?? '').localeCompare(a.lastMistakeAt ?? '')
      if (dateCompare !== 0) return dateCompare
      return b.mistakeCount - a.mistakeCount
    })
}

function compareSuggestedCards(a: Card, b: Card): number {
  if (a.isMistake !== b.isMistake) return a.isMistake ? -1 : 1
  if (a.mistakeCount !== b.mistakeCount) return b.mistakeCount - a.mistakeCount
  if (a.starRating !== b.starRating) return a.starRating - b.starRating
  return (b.lastMistakeAt ?? '').localeCompare(a.lastMistakeAt ?? '')
}

export function getSuggestedCards(cards: Card[], deckId: string): Card[] {
  return cards
    .filter((card) => (
      card.deckId === deckId
      && (card.isMistake || card.mistakeCount > 0 || (card.starRating > 0 && card.starRating <= 2))
    ))
    .sort(compareSuggestedCards)
}

function appendUnique(target: Card[], source: Card[], seen: Set<string>, limit: number): void {
  for (const card of source) {
    if (target.length >= limit) return
    if (seen.has(card.id)) continue
    target.push(card)
    seen.add(card.id)
  }
}

export function getDailyTaskCards(cards: Card[], deckId: string, today: string, limit = 20): Card[] {
  const deckCards = cards.filter((card) => card.deckId === deckId)
  const result: Card[] = []
  const seen = new Set<string>()
  const dueCards = deckCards
    .filter((card) => isDue(card, today) && card.repetitions > 0)
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview))
  const newCards = deckCards.filter((card) => card.repetitions === 0)
  const mistakeCards = getMistakeCards(cards, deckId)
  const lowStarCards = deckCards
    .filter((card) => card.starRating > 0 && card.starRating <= 2)
    .sort((a, b) => a.starRating - b.starRating)

  appendUnique(result, dueCards, seen, limit)
  appendUnique(result, newCards, seen, limit)
  appendUnique(result, mistakeCards, seen, limit)
  appendUnique(result, lowStarCards, seen, limit)

  return result
}

export function getDeckProgress(cards: Card[], deckId: string, today: string): DeckProgress {
  const deckCards = cards.filter((card) => card.deckId === deckId)
  const totalCards = deckCards.length
  const learnedCards = deckCards.filter((card) => card.repetitions > 0).length
  const newCards = deckCards.filter((card) => card.repetitions === 0).length
  const dueCards = deckCards.filter((card) => isDue(card, today)).length
  const mistakeCards = deckCards.filter((card) => card.isMistake).length
  const suggestedCards = getSuggestedCards(cards, deckId).length

  return {
    totalCards,
    learnedCards,
    dueCards,
    newCards,
    mistakeCards,
    suggestedCards,
    learnedPercent: totalCards === 0 ? 0 : Math.round((learnedCards / totalCards) * 100),
  }
}
