import assert from 'node:assert/strict'
import type { Card } from '../src/types/index.ts'
import {
  MAX_REVIEW_INTERVAL_DAYS,
  addDays,
  normalizeCardSrs,
  sm2,
} from '../src/utils/srs.ts'

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

{
  const reviewed = sm2(card({
    id: 'runaway',
    repetitions: 8,
    interval: MAX_REVIEW_INTERVAL_DAYS,
    ease: 2.8,
  }), 'easy')

  assert.equal(
    reviewed.interval,
    MAX_REVIEW_INTERVAL_DAYS,
    'SM-2 interval should be capped to avoid multi-decade review dates',
  )
}

{
  const normalized = normalizeCardSrs(card({
    id: 'legacy-runaway',
    repetitions: 9,
    interval: 25878,
    lastReview: '2026-07-05',
    nextReview: '2097-05-10',
  }))

  assert.equal(normalized.interval, MAX_REVIEW_INTERVAL_DAYS)
  assert.equal(normalized.nextReview, addDays('2026-07-05', MAX_REVIEW_INTERVAL_DAYS))
}

console.log('srs tests passed')
