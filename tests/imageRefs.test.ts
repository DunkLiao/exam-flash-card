import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  collectImageFilenames,
  shouldCleanupImagesAfterChange,
} from '../src/utils/imageRefs.ts'

const cards = [
  {
    id: 'card-1',
    front: '題目 ![diagram](images/img_front.png)',
    back: '答案 ![chart](images/img_back.webp)',
    deckId: 'deck-1',
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: '2026-06-30',
    lastReview: '2026-06-30',
  },
  {
    id: 'card-2',
    front: '外部圖 ![remote](https://example.com/a.png)',
    back: '同一張圖再次引用 ![diagram](images/img_front.png)',
    deckId: 'deck-1',
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: '2026-06-30',
    lastReview: '2026-06-30',
  },
]

assert.deepEqual(
  collectImageFilenames(cards),
  ['img_front.png', 'img_back.webp'],
  'collectImageFilenames should collect local image filenames once in card order',
)

assert.equal(
  shouldCleanupImagesAfterChange('addCard'),
  false,
  'new cards may reference freshly inserted images, so addCard must not trigger cleanup',
)

assert.equal(
  shouldCleanupImagesAfterChange('deleteCard'),
  true,
  'deleting a card can leave orphaned images and should trigger cleanup',
)

assert.equal(
  shouldCleanupImagesAfterChange('updateCard'),
  true,
  'updating a saved card can leave replaced images and should trigger cleanup',
)

const markdownEditorSource = readFileSync(new URL('../src/components/MarkdownEditor.tsx', import.meta.url), 'utf8')
assert.equal(
  markdownEditorSource.includes("@tauri-apps/plugin-fs"),
  false,
  'image insertion should not read dialog-selected files through the scoped Tauri fs plugin',
)

console.log('imageRefs tests passed')
