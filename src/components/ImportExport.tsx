import { useState } from 'react'
import { useAppContext } from '../hooks/useAppData'
import { openFileDialog, saveFileDialog, exportToFile, readImportFile, saveData } from '../utils/fileIO'
import type { Card, Deck } from '../types'

function generateId(): string {
  return crypto.randomUUID()
}

export function ImportExport() {
  const { data, refreshData, setView } = useAppContext()
  const [message, setMessage] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  function showMsg(text: string, type: 'success' | 'error') {
    setMessage(text)
    setMsgType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleExportJSON() {
    try {
      const path = await saveFileDialog('flashcards.json')
      if (!path) return
      await exportToFile(path, JSON.stringify(data, null, 2))
      showMsg('匯出成功！', 'success')
    } catch {
      showMsg('匯出失敗', 'error')
    }
  }

  async function handleImportJSON() {
    try {
      const path = await openFileDialog()
      if (!path) return
      const content = await readImportFile(path)
      const imported = JSON.parse(content)

      if (!imported.decks || !imported.cards) {
        showMsg('無效的 JSON 格式', 'error')
        return
      }

      const newDecks = imported.decks as Deck[]
      const newCards = imported.cards as Card[]
      const merged = {
        decks: [...data.decks, ...newDecks],
        cards: [...data.cards, ...newCards],
      }
      await saveData(merged)
      await refreshData()
      showMsg(`匯入成功：${newDecks.length} 個牌組、${newCards.length} 張卡片`, 'success')
    } catch (e) {
      showMsg(`匯入失敗：${String(e)}`, 'error')
    }
  }

  async function handleExportCSV() {
    try {
      const path = await saveFileDialog('flashcards.csv')
      if (!path) return

      const headers = 'deckName,front,back'
      const rows = data.cards.map((c) => {
        const deck = data.decks.find((d) => d.id === c.deckId)
        const deckName = deck?.name ?? ''
        const escFront = `"${c.front.replace(/"/g, '""')}"`
        const escBack = `"${c.back.replace(/"/g, '""')}"`
        return `"${deckName}",${escFront},${escBack}`
      })
      const csv = [headers, ...rows].join('\n') + '\n'

      await exportToFile(path, '\uFEFF' + csv) // BOM for Excel
      showMsg('匯出 CSV 成功！', 'success')
    } catch {
      showMsg('匯出 CSV 失敗', 'error')
    }
  }

  async function handleImportCSV() {
    try {
      const path = await openFileDialog()
      if (!path) return
      const content = await readImportFile(path)
      // Remove BOM if present
      const text = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content
      const lines = text.split('\n').filter((l) => l.trim())
      if (lines.length < 2) {
        showMsg('CSV 檔案至少需要標題行和一行資料', 'error')
        return
      }

      const headers = parseCSVLine(lines[0])
      const deckNameIdx = headers.findIndex((h) => h.toLowerCase() === 'deckname')
      const frontIdx = headers.findIndex((h) => h.toLowerCase() === 'front')
      const backIdx = headers.findIndex((h) => h.toLowerCase() === 'back')

      if (frontIdx === -1 || backIdx === -1) {
        showMsg('CSV 必須包含 front 和 back 欄位', 'error')
        return
      }

      const deckMap = new Map(data.decks.map((d) => [d.name, d.id]))
      const newCards: Card[] = []
      const newDecks: Deck[] = []
      let imported = 0

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i])
        const deckName = deckNameIdx >= 0 ? (cols[deckNameIdx] || 'Default') : 'Default'
        const front = cols[frontIdx] || ''
        const back = cols[backIdx] || ''
        if (!front && !back) continue

        let deckId = deckMap.get(deckName)
        if (!deckId) {
          deckId = generateId()
          deckMap.set(deckName, deckId)
          newDecks.push({
            id: deckId,
            name: deckName,
            description: '',
            createdAt: new Date().toISOString(),
          })
        }

        const now = new Date().toISOString().split('T')[0]
        newCards.push({
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
        imported++
      }

      const merged = {
        decks: [...data.decks, ...newDecks],
        cards: [...data.cards, ...newCards],
      }
      await saveData(merged)
      await refreshData()
      showMsg(`匯入 CSV 成功：${newDecks.length} 個牌組、${imported} 張卡片`, 'success')
    } catch (e) {
      showMsg(`匯入 CSV 失敗：${String(e)}`, 'error')
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center p-8 page-enter">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 dark:text-white">匯入 / 匯出</h2>

      <div className="w-full max-w-md space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="font-semibold text-gray-700 mb-4 dark:text-gray-200">匯出</h3>
          <div className="space-y-3">
            <button
              onClick={handleExportJSON}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium text-sm"
            >
              匯出為 JSON（完整備份，含 SRS 進度）
            </button>
            <button
              onClick={handleExportCSV}
              className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium text-sm"
            >
              匯出為 CSV（Excel 相容，僅正面/反面/牌組）
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="font-semibold text-gray-700 mb-4 dark:text-gray-200">匯入</h3>
          <div className="space-y-3">
            <button
              onClick={handleImportJSON}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium text-sm"
            >
              從 JSON 匯入（完整備份還原）
            </button>
            <button
              onClick={handleImportCSV}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium text-sm"
            >
              從 CSV 匯入（Excel 匯出格式）
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3 dark:text-gray-500">
            CSV 欄位：deckName, front, back（deckName 可省略，預設為 Default）
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm text-center ${
              msgType === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <button
        onClick={() => setView('decks')}
        className="mt-8 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        ← 回到牌組列表
      </button>
    </div>
  )
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}
