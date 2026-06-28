export interface Card {
  id: string
  front: string
  back: string
  deckId: string
  ease: number
  interval: number
  repetitions: number
  nextReview: string
  lastReview: string
}

export interface Deck {
  id: string
  name: string
  description: string
  createdAt: string
}

export interface AppData {
  decks: Deck[]
  cards: Card[]
}

export type View = 'decks' | 'cards' | 'review' | 'quiz' | 'import'
export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface QuizState {
  currentIndex: number
  cards: Card[]
  answers: (boolean | null)[]
  showAnswer: boolean
  finished: boolean
}
