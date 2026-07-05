import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { AppData, Deck, Card, View } from '../types'
import { loadData, saveData, deleteUnusedImages } from '../utils/fileIO'
import { collectImageFilenames, shouldCleanupImagesAfterChange, type ImageCleanupChange } from '../utils/imageRefs'
import { normalizeCardSrs } from '../utils/srs'
import {
  clearCardMistake as clearCardMistakeMetadata,
  markCardMistake as markCardMistakeMetadata,
  normalizeStarRating,
  withNormalizedCardMetadata,
} from '../utils/reviewProgress'

function generateId(): string {
  return crypto.randomUUID()
}

interface AppContextType {
  data: AppData
  decks: Deck[]
  cards: Card[]
  selectedDeckId: string | null
  view: View
  setView: (v: View) => void
  selectDeck: (id: string | null) => void
  addDeck: (name: string, description: string) => void
  updateDeck: (id: string, name: string, description: string) => void
  deleteDeck: (id: string) => void
  addCard: (front: string, back: string, deckId: string) => void
  updateCard: (id: string, front: string, back: string) => void
  deleteCard: (id: string) => void
  updateCardSRS: (id: string, updates: Partial<Card>) => void
  updateCardStarRating: (id: string, starRating: number) => void
  markCardMistake: (id: string, date?: string) => void
  clearCardMistake: (id: string) => void
  loading: boolean
  refreshData: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({ decks: [], cards: [] })
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [view, setView] = useState<View>('decks')
  const [loading, setLoading] = useState(true)

  const refreshData = useCallback(async () => {
    try {
      const d = await loadData()
      if (d) {
        setData({
          ...d,
          cards: d.cards.map((card) => normalizeCardSrs(withNormalizedCardMetadata(card))),
        })
      }
    } catch {
      setData({ decks: [], cards: [] })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const persist = useCallback(async (newData: AppData) => {
    setData(newData)
    try {
      await saveData(newData)
    } catch {
      // silent fail - data stays in state
    }
  }, [])

  const cleanupImages = useCallback((cards: Card[], change: ImageCleanupChange) => {
    if (!shouldCleanupImagesAfterChange(change)) return
    deleteUnusedImages(collectImageFilenames(cards)).catch(() => {})
  }, [])

  const addDeck = useCallback((name: string, description: string) => {
    const deck: Deck = {
      id: generateId(),
      name,
      description,
      createdAt: new Date().toISOString(),
    }
    const newData = { ...data, decks: [...data.decks, deck] }
    persist(newData)
  }, [data, persist])

  const updateDeck = useCallback((id: string, name: string, description: string) => {
    const newData = {
      ...data,
      decks: data.decks.map((d) => (d.id === id ? { ...d, name, description } : d)),
    }
    persist(newData)
  }, [data, persist])

  const deleteDeck = useCallback((id: string) => {
    const newData = {
      decks: data.decks.filter((d) => d.id !== id),
      cards: data.cards.filter((c) => c.deckId !== id),
    }
    persist(newData)
    cleanupImages(newData.cards, 'deleteDeck')
    if (selectedDeckId === id) {
      setSelectedDeckId(null)
      setView('decks')
    }
  }, [cleanupImages, data, persist, selectedDeckId])

  const addCard = useCallback((front: string, back: string, deckId: string) => {
    const now = new Date().toISOString().split('T')[0]
    const card: Card = {
      id: generateId(),
      front,
      back,
      deckId,
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: now,
      lastReview: now,
      starRating: 0,
      mistakeCount: 0,
      lastMistakeAt: null,
      isMistake: false,
    }
    const newData = { ...data, cards: [...data.cards, card] }
    persist(newData)
  }, [data, persist])

  const updateCard = useCallback((id: string, front: string, back: string) => {
    const newData = {
      ...data,
      cards: data.cards.map((c) => (c.id === id ? { ...c, front, back } : c)),
    }
    persist(newData)
    cleanupImages(newData.cards, 'updateCard')
  }, [cleanupImages, data, persist])

  const deleteCard = useCallback((id: string) => {
    const newData = {
      ...data,
      cards: data.cards.filter((c) => c.id !== id),
    }
    persist(newData)
    cleanupImages(newData.cards, 'deleteCard')
  }, [cleanupImages, data, persist])

  const updateCardSRS = useCallback((id: string, updates: Partial<Card>) => {
    const newData = {
      ...data,
      cards: data.cards.map((c) => (c.id === id ? normalizeCardSrs({ ...c, ...updates }) : c)),
    }
    persist(newData)
  }, [data, persist])

  const updateCardStarRating = useCallback((id: string, starRating: number) => {
    const newData = {
      ...data,
      cards: data.cards.map((c) => (
        c.id === id ? { ...c, starRating: normalizeStarRating(starRating) } : c
      )),
    }
    persist(newData)
  }, [data, persist])

  const markCardMistake = useCallback((id: string, date = new Date().toISOString().split('T')[0]) => {
    const newData = {
      ...data,
      cards: data.cards.map((c) => (
        c.id === id ? markCardMistakeMetadata(c, date) : c
      )),
    }
    persist(newData)
  }, [data, persist])

  const clearCardMistake = useCallback((id: string) => {
    const newData = {
      ...data,
      cards: data.cards.map((c) => (
        c.id === id ? clearCardMistakeMetadata(c) : c
      )),
    }
    persist(newData)
  }, [data, persist])

  const selectDeck = useCallback((id: string | null) => {
    setSelectedDeckId(id)
    if (id) setView('cards')
    else setView('decks')
  }, [])

  return (
    <AppContext.Provider
      value={{
        data,
        decks: data.decks,
        cards: data.cards,
        selectedDeckId,
        view,
        setView,
        selectDeck,
        addDeck,
        updateDeck,
        deleteDeck,
        addCard,
        updateCard,
        deleteCard,
        updateCardSRS,
        updateCardStarRating,
        markCardMistake,
        clearCardMistake,
        loading,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
