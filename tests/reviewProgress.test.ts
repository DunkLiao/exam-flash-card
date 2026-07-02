import assert from 'node:assert/strict'
import type { AppData, Card, Deck } from '../src/types/index.ts'
import { buildCardsFromCsvRows, mergeImportedData } from '../src/utils/importMerge.ts'
import { getDeckProgress, getReviewSessionCards, normalizeStarRating } from '../src/utils/reviewProgress.ts'

function deck(id: string, name: string): Deck {
  return {
    id,
    name,
    description: '',
    createdAt: '2026-07-01T00:00:00.000Z',
  }
}

function card(overrides: Partial<Card>): Card {
  return {
    id: 'card',
    deckId: 'deck',
    front: 'Front',
    back: 'Back',
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: '2026-07-01',
    lastReview: '2026-07-01',
    starRating: 0,
    ...overrides,
  }
}

assert.equal(normalizeStarRating(-1), 0)
assert.equal(normalizeStarRating(2.8), 3)
assert.equal(normalizeStarRating(8), 5)
assert.equal(normalizeStarRating('4'), 4)
assert.equal(normalizeStarRating('bad'), 0)

{
  const result = mergeImportedData(
    { decks: [deck('deck', 'Deck')], cards: [] },
    {
      decks: [deck('deck', 'Deck')],
      cards: [
        { ...card({ id: 'missing-star' }), starRating: undefined as unknown as number },
        card({ id: 'large-star', front: 'Other front', back: 'Other back', starRating: 12 }),
      ],
    },
  )

  assert.equal(result.data.cards[0].starRating, 0, 'missing JSON starRating should default to 0')
  assert.equal(result.data.cards[1].starRating, 5, 'JSON starRating should be clamped to 0-5')
}

{
  const result = buildCardsFromCsvRows(
    { decks: [], cards: [] },
    [
      { deckName: 'Deck', front: 'A', back: 'B', starRating: '4' },
      { deckName: 'Deck', front: 'C', back: 'D' },
      { deckName: 'Deck', front: 'E', back: 'F', starRating: '9' },
    ],
    '2026-07-01',
  )

  assert.deepEqual(
    result.data.cards.map((item) => item.starRating),
    [4, 0, 5],
    'CSV starRating should be optional and clamped',
  )
}

{
  const data: AppData = {
    decks: [deck('deck', 'Deck')],
    cards: [
      card({ id: 'new', repetitions: 0, nextReview: '2026-07-01' }),
      card({ id: 'learned-due', repetitions: 2, nextReview: '2026-06-30' }),
      card({ id: 'learned-later', repetitions: 1, nextReview: '2026-07-10' }),
      card({ id: 'other-deck', deckId: 'other', repetitions: 3, nextReview: '2026-06-30' }),
    ],
  }

  assert.deepEqual(getDeckProgress(data.cards, 'deck', '2026-07-01'), {
    totalCards: 3,
    learnedCards: 2,
    dueCards: 2,
    newCards: 1,
    learnedPercent: 67,
  })
}

{
  const cards = [
    card({ id: 'new-due', repetitions: 0, nextReview: '2026-07-01' }),
    card({ id: 'learned-due', repetitions: 2, nextReview: '2026-06-30' }),
    card({ id: 'learned-later', repetitions: 1, nextReview: '2026-07-10' }),
    card({ id: 'other-deck', deckId: 'other', repetitions: 0, nextReview: '2026-07-01' }),
  ]

  assert.deepEqual(
    getReviewSessionCards(cards, 'deck', '2026-07-01').map((item) => item.id),
    ['learned-due', 'new-due'],
    'review session should include due learned cards and new cards once',
  )
}

console.log('reviewProgress tests passed')
