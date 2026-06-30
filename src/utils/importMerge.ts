import type { AppData, Card, Deck } from '../types'

export interface ImportMergeResult {
  data: AppData
  addedDecks: number
  addedCards: number
  skippedCards: number
}

export interface CsvImportRow {
  deckName: string
  front: string
  back: string
}

function generateId(): string {
  return crypto.randomUUID()
}

function normalizeText(value: string): string {
  return value.trim()
}

function normalizeDeckName(value: string): string {
  const name = normalizeText(value)
  return name || 'Default'
}

function cardKey(deckId: string, front: string, back: string): string {
  return JSON.stringify([deckId, normalizeText(front), normalizeText(back)])
}

function createDeckNameMap(decks: Deck[]): Map<string, string> {
  return new Map(decks.map((deck) => [normalizeDeckName(deck.name), deck.id]))
}

function createCardKeySet(cards: Card[]): Set<string> {
  return new Set(cards.map((card) => cardKey(card.deckId, card.front, card.back)))
}

function createCardIdSet(cards: Card[]): Set<string> {
  return new Set(cards.map((card) => card.id))
}

export function mergeImportedData(current: AppData, imported: AppData): ImportMergeResult {
  const decks = [...current.decks]
  const cards = [...current.cards]
  const deckNameToId = createDeckNameMap(decks)
  const importedDeckIdToMergedId = new Map<string, string>()
  const existingCardIds = createCardIdSet(cards)
  const existingCardKeys = createCardKeySet(cards)
  let addedDecks = 0
  let addedCards = 0
  let skippedCards = 0

  for (const deck of imported.decks) {
    const deckName = normalizeDeckName(deck.name)
    const existingDeckId = deckNameToId.get(deckName)
    if (existingDeckId) {
      importedDeckIdToMergedId.set(deck.id, existingDeckId)
      continue
    }

    const mergedDeck = { ...deck, name: deckName }
    decks.push(mergedDeck)
    deckNameToId.set(deckName, mergedDeck.id)
    importedDeckIdToMergedId.set(deck.id, mergedDeck.id)
    addedDecks++
  }

  for (const card of imported.cards) {
    const mergedDeckId = importedDeckIdToMergedId.get(card.deckId) ?? card.deckId
    const key = cardKey(mergedDeckId, card.front, card.back)
    if (existingCardIds.has(card.id) || existingCardKeys.has(key)) {
      skippedCards++
      continue
    }

    const mergedCard = { ...card, deckId: mergedDeckId }
    cards.push(mergedCard)
    existingCardIds.add(mergedCard.id)
    existingCardKeys.add(key)
    addedCards++
  }

  return {
    data: { decks, cards },
    addedDecks,
    addedCards,
    skippedCards,
  }
}

export function buildCardsFromCsvRows(
  current: AppData,
  rows: CsvImportRow[],
  now: string,
): ImportMergeResult {
  const decks = [...current.decks]
  const cards = [...current.cards]
  const deckNameToId = createDeckNameMap(decks)
  const existingCardKeys = createCardKeySet(cards)
  let addedDecks = 0
  let addedCards = 0
  let skippedCards = 0

  for (const row of rows) {
    const deckName = normalizeDeckName(row.deckName)
    const front = normalizeText(row.front)
    const back = normalizeText(row.back)
    if (!front && !back) continue

    let deckId = deckNameToId.get(deckName)
    if (!deckId) {
      deckId = generateId()
      decks.push({
        id: deckId,
        name: deckName,
        description: '',
        createdAt: new Date().toISOString(),
      })
      deckNameToId.set(deckName, deckId)
      addedDecks++
    }

    const key = cardKey(deckId, front, back)
    if (existingCardKeys.has(key)) {
      skippedCards++
      continue
    }

    cards.push({
      id: generateId(),
      front,
      back,
      deckId,
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: now,
      lastReview: now,
    })
    existingCardKeys.add(key)
    addedCards++
  }

  return {
    data: { decks, cards },
    addedDecks,
    addedCards,
    skippedCards,
  }
}
