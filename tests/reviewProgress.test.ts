import assert from 'node:assert/strict'
import type { AppData, Card, Deck } from '../src/types/index.ts'
import { buildCardsFromCsvRows, mergeImportedData } from '../src/utils/importMerge.ts'
import {
  clearCardMistake,
  getDeckProgress,
  getDailyTaskCards,
  getMistakeCards,
  getReviewSessionCards,
  getSuggestedCards,
  markCardMistake,
  normalizeStarRating,
  withNormalizedCardMetadata,
} from '../src/utils/reviewProgress.ts'

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
    mistakeCount: 0,
    lastMistakeAt: null,
    isMistake: false,
    ...overrides,
  }
}

assert.equal(normalizeStarRating(-1), 0)
assert.equal(normalizeStarRating(2.8), 3)
assert.equal(normalizeStarRating(8), 5)
assert.equal(normalizeStarRating('4'), 4)
assert.equal(normalizeStarRating('bad'), 0)

{
  const normalized = withNormalizedCardMetadata({
    ...card({ id: 'legacy-card' }),
    starRating: undefined as unknown as number,
    mistakeCount: undefined as unknown as number,
    lastMistakeAt: undefined as unknown as string | null,
    isMistake: undefined as unknown as boolean,
  })

  assert.equal(normalized.starRating, 0, 'missing starRating should default to 0')
  assert.equal(normalized.mistakeCount, 0, 'missing mistakeCount should default to 0')
  assert.equal(normalized.lastMistakeAt, null, 'missing lastMistakeAt should default to null')
  assert.equal(normalized.isMistake, false, 'missing isMistake should default to false')
}

{
  const normalized = withNormalizedCardMetadata({
    ...card({ id: 'malformed-mistake' }),
    mistakeCount: -4,
    lastMistakeAt: 12345 as unknown as string,
    isMistake: 'true' as unknown as boolean,
  })

  assert.equal(normalized.mistakeCount, 0, 'negative mistakeCount should clamp to 0')
  assert.equal(normalized.lastMistakeAt, null, 'non-string lastMistakeAt should normalize to null')
  assert.equal(normalized.isMistake, true, 'truthy string isMistake should normalize to true')
}

{
  const marked = markCardMistake(card({ id: 'wrong-once', mistakeCount: 2 }), '2026-07-04')

  assert.equal(marked.mistakeCount, 3, 'mistakeCount should increment when marked wrong')
  assert.equal(marked.lastMistakeAt, '2026-07-04', 'lastMistakeAt should store the wrong-answer date')
  assert.equal(marked.isMistake, true, 'wrong answers should keep the card in the mistake list')
}

{
  const cleared = clearCardMistake(card({
    id: 'cleared',
    mistakeCount: 5,
    lastMistakeAt: '2026-07-04',
    isMistake: true,
  }))

  assert.equal(cleared.mistakeCount, 5, 'clearing should preserve historical mistake count')
  assert.equal(cleared.lastMistakeAt, '2026-07-04', 'clearing should preserve last mistake date')
  assert.equal(cleared.isMistake, false, 'clearing should remove current mistake-list state')
}

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
  assert.equal(result.data.cards[0].mistakeCount, 0, 'missing JSON mistakeCount should default to 0')
  assert.equal(result.data.cards[0].lastMistakeAt, null, 'missing JSON lastMistakeAt should default to null')
  assert.equal(result.data.cards[0].isMistake, false, 'missing JSON isMistake should default to false')
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
  assert.deepEqual(
    result.data.cards.map((item) => ({
      mistakeCount: item.mistakeCount,
      lastMistakeAt: item.lastMistakeAt,
      isMistake: item.isMistake,
    })),
    [
      { mistakeCount: 0, lastMistakeAt: null, isMistake: false },
      { mistakeCount: 0, lastMistakeAt: null, isMistake: false },
      { mistakeCount: 0, lastMistakeAt: null, isMistake: false },
    ],
    'CSV import should initialize mistake metadata',
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
    mistakeCards: 0,
    suggestedCards: 0,
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

{
  const cards = [
    card({ id: 'normal', isMistake: false, mistakeCount: 3 }),
    card({ id: 'mistake-old', isMistake: true, mistakeCount: 1, lastMistakeAt: '2026-07-01' }),
    card({ id: 'mistake-new', isMistake: true, mistakeCount: 2, lastMistakeAt: '2026-07-04' }),
    card({ id: 'other-deck', deckId: 'other', isMistake: true, mistakeCount: 9 }),
  ]

  assert.deepEqual(
    getMistakeCards(cards, 'deck').map((item) => item.id),
    ['mistake-new', 'mistake-old'],
    'mistake session should include only current mistake cards for the selected deck, newest first',
  )
}

{
  const cards = [
    card({ id: 'low-star', starRating: 1, mistakeCount: 0, isMistake: false }),
    card({ id: 'mistake-high-count', starRating: 5, mistakeCount: 4, isMistake: true, lastMistakeAt: '2026-07-01' }),
    card({ id: 'mistake-recent', starRating: 2, mistakeCount: 4, isMistake: true, lastMistakeAt: '2026-07-04' }),
    card({ id: 'stable', starRating: 5, mistakeCount: 0, isMistake: false }),
    card({ id: 'other-deck', deckId: 'other', starRating: 1, mistakeCount: 10, isMistake: true }),
  ]

  assert.deepEqual(
    getSuggestedCards(cards, 'deck').map((item) => item.id),
    ['mistake-recent', 'mistake-high-count', 'low-star'],
    'suggestions should prioritize current mistakes, higher mistake counts, recent mistakes, then low stars',
  )
}

{
  const cards = [
    card({ id: 'due-mistake', repetitions: 2, nextReview: '2026-07-01', isMistake: true, mistakeCount: 3 }),
    card({ id: 'new-card', repetitions: 0, nextReview: '2026-07-04' }),
    card({ id: 'later-mistake', repetitions: 2, nextReview: '2026-07-20', isMistake: true, mistakeCount: 1 }),
    card({ id: 'low-star', repetitions: 3, nextReview: '2026-07-20', starRating: 1 }),
    card({ id: 'stable', repetitions: 3, nextReview: '2026-07-20', starRating: 5 }),
    card({ id: 'other-deck', deckId: 'other', repetitions: 0, isMistake: true }),
  ]

  assert.deepEqual(
    getDailyTaskCards(cards, 'deck', '2026-07-04').map((item) => item.id),
    ['due-mistake', 'new-card', 'later-mistake', 'low-star'],
    'daily task should combine due, new, mistake, and low-star cards without duplicates',
  )
}

console.log('reviewProgress tests passed')
