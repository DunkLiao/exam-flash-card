import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/components/DeckView.tsx', import.meta.url), 'utf8')

assert.match(source, /建議加強/)
assert.match(source, /錯題、曾錯或 1-2 星/)

console.log('deckView content tests passed')
