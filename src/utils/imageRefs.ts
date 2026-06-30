import type { Card } from '../types'

export type ImageCleanupChange = 'addCard' | 'updateCard' | 'deleteCard' | 'deleteDeck'

const LOCAL_IMAGE_RE = /!\[[^\]]*?\]\(images\/([^)]+)\)/g

export function collectImageFilenames(cards: Pick<Card, 'front' | 'back'>[]): string[] {
  const used = new Set<string>()

  for (const card of cards) {
    collectFromMarkdown(card.front, used)
    collectFromMarkdown(card.back, used)
  }

  return Array.from(used)
}

export function shouldCleanupImagesAfterChange(change: ImageCleanupChange): boolean {
  return change !== 'addCard'
}

function collectFromMarkdown(markdown: string, used: Set<string>) {
  LOCAL_IMAGE_RE.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = LOCAL_IMAGE_RE.exec(markdown)) !== null) {
    used.add(match[1])
  }
}
