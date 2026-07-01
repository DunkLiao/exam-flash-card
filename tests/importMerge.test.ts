import assert from 'node:assert/strict'
import type { AppData, Card, Deck } from '../src/types/index.ts'
import {
  buildCardsFromCsvRows,
  mergeImportedData,
} from '../src/utils/importMerge.ts'

function deck(id: string, name: string): Deck {
  return {
    id,
    name,
    description: '',
    createdAt: '2026-07-01T00:00:00.000Z',
  }
}

function card(id: string, deckId: string, front: string, back: string): Card {
  return {
    id,
    deckId,
    front,
    back,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: '2026-07-01',
    lastReview: '2026-07-01',
    starRating: 0,
  }
}

const current: AppData = {
  decks: [deck('deck-existing', 'English')],
  cards: [card('card-existing', 'deck-existing', 'Question', 'Answer')],
}

{
  const result = mergeImportedData(current, {
    decks: [deck('deck-existing', 'English')],
    cards: [card('card-existing', 'deck-existing', 'Question', 'Answer')],
  })

  assert.equal(result.data.decks.length, 1, 'JSON re-import should not duplicate decks')
  assert.equal(result.data.cards.length, 1, 'JSON re-import should not duplicate cards')
  assert.equal(result.addedDecks, 0)
  assert.equal(result.addedCards, 0)
  assert.equal(result.skippedCards, 1)
}

{
  const result = mergeImportedData(current, {
    decks: [deck('deck-imported', 'English')],
    cards: [
      card('card-new', 'deck-imported', 'Question', 'Answer'),
      card('card-other', 'deck-imported', 'New question', 'New answer'),
    ],
  })

  assert.equal(result.data.decks.length, 1, 'same deck name should reuse existing deck')
  assert.equal(result.data.cards.length, 2, 'only non-duplicate JSON cards should be added')
  assert.equal(result.data.cards[1].deckId, 'deck-existing')
  assert.equal(result.addedDecks, 0)
  assert.equal(result.addedCards, 1)
  assert.equal(result.skippedCards, 1)
}

{
  const result = buildCardsFromCsvRows(
    current,
    [
      { deckName: 'English', front: 'Question', back: 'Answer' },
      { deckName: 'English', front: 'Question', back: 'Answer' },
    ],
    '2026-07-01',
  )

  assert.equal(result.data.cards.length, 1, 'CSV re-import should skip existing and in-file duplicates')
  assert.equal(result.addedCards, 0)
  assert.equal(result.skippedCards, 2)
}

{
  const result = buildCardsFromCsvRows(
    { decks: [], cards: [] },
    [
      { deckName: '', front: 'Default question', back: 'Default answer' },
      { deckName: 'Default', front: ' Default question ', back: 'Default answer' },
    ],
    '2026-07-01',
  )

  assert.equal(result.data.decks.length, 1, 'missing CSV deckName should use Default')
  assert.equal(result.data.decks[0].name, 'Default')
  assert.equal(result.data.cards.length, 1, 'trim-equivalent CSV cards should deduplicate')
  assert.equal(result.addedDecks, 1)
  assert.equal(result.addedCards, 1)
  assert.equal(result.skippedCards, 1)
}

console.log('importMerge tests passed')
