import assert from 'node:assert/strict'
import { getCardPreviewText } from '../src/utils/cardPreview.ts'

assert.equal(getCardPreviewText('# Title **bold**'), 'Title bold')
assert.equal(getCardPreviewText('![Alt](image.png) `code`'), 'Alt image.png code')
assert.equal(getCardPreviewText(''), '尚無內容')
assert.equal(getCardPreviewText('a'.repeat(140), 24), `${'a'.repeat(24)}...`)

console.log('cardPreview tests passed')
