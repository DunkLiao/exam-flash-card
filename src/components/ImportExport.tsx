import { useState } from 'react'
import { DatabaseBackup, FileDown, FileSpreadsheet, FileUp } from 'lucide-react'
import { useAppContext } from '../hooks/useAppData'
import { openFileDialog, saveFileDialog, exportToFile, readImportFile, saveData } from '../utils/fileIO'
import { buildCardsFromCsvRows, mergeImportedData, type CsvImportRow } from '../utils/importMerge'
import { Button, PageHeader, PageShell, Surface } from './ui'
import type { AppData } from '../types'

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

      const result = mergeImportedData(data, imported as AppData)
      await saveData(result.data)
      await refreshData()
      showMsg(
        `匯入成功：新增 ${result.addedDecks} 個牌組、${result.addedCards} 張卡片，略過 ${result.skippedCards} 張重複卡片`,
        'success',
      )
    } catch (e) {
      showMsg(`匯入失敗：${String(e)}`, 'error')
    }
  }

  async function handleExportCSV() {
    try {
      const path = await saveFileDialog('flashcards.csv')
      if (!path) return

      const headers = 'deckName,front,back,starRating'
      const rows = data.cards.map((c) => {
        const deck = data.decks.find((d) => d.id === c.deckId)
        const deckName = deck?.name ?? ''
        const escFront = `"${c.front.replace(/"/g, '""')}"`
        const escBack = `"${c.back.replace(/"/g, '""')}"`
        return `"${deckName}",${escFront},${escBack},${c.starRating ?? 0}`
      })
      const csv = [headers, ...rows].join('\n') + '\n'

      await exportToFile(path, '\uFEFF' + csv)
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
      const starRatingIdx = headers.findIndex((h) => h.toLowerCase() === 'starrating')

      if (frontIdx === -1 || backIdx === -1) {
        showMsg('CSV 必須包含 front 和 back 欄位', 'error')
        return
      }

      const rows: CsvImportRow[] = []

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i])
        rows.push({
          deckName: deckNameIdx >= 0 ? (cols[deckNameIdx] || 'Default') : 'Default',
          front: cols[frontIdx] || '',
          back: cols[backIdx] || '',
          starRating: starRatingIdx >= 0 ? cols[starRatingIdx] : undefined,
        })
      }

      const now = new Date().toISOString().split('T')[0]
      const result = buildCardsFromCsvRows(data, rows, now)
      await saveData(result.data)
      await refreshData()
      showMsg(
        `匯入 CSV 成功：新增 ${result.addedDecks} 個牌組、${result.addedCards} 張卡片，略過 ${result.skippedCards} 張重複卡片`,
        'success',
      )
    } catch (e) {
      showMsg(`匯入 CSV 失敗：${String(e)}`, 'error')
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="匯入 / 匯出"
        subtitle="用 JSON 備份完整學習狀態，或用 CSV 與 Excel 交換卡片內容。"
        actions={<Button onClick={() => setView('decks')} variant="secondary">回到牌組列表</Button>}
      />

      <div className="mx-auto grid w-full max-w-4xl gap-4 lg:grid-cols-2">
        <TransferPanel
          icon={<FileDown className="h-5 w-5" />}
          title="匯出"
          description="JSON 會保留 SRS、星等與錯題狀態；CSV 只保留適合 Excel 編輯的卡片內容。"
          actions={(
            <>
              <Button onClick={handleExportJSON} variant="warning" className="w-full justify-start" size="lg">
                <DatabaseBackup className="h-4 w-4" />
                匯出為 JSON（完整備份，含 SRS 與錯題）
              </Button>
              <Button onClick={handleExportCSV} variant="warning" className="w-full justify-start" size="lg">
                <FileSpreadsheet className="h-4 w-4" />
                匯出為 CSV（Excel 相容）
              </Button>
            </>
          )}
        />

        <TransferPanel
          icon={<FileUp className="h-5 w-5" />}
          title="匯入"
          description="匯入時會略過重複卡片；舊 JSON 會自動補齊缺少的錯題欄位。"
          actions={(
            <>
              <Button onClick={handleImportJSON} variant="success" className="w-full justify-start" size="lg">
                <DatabaseBackup className="h-4 w-4" />
                從 JSON 匯入（完整備份還原）
              </Button>
              <Button onClick={handleImportCSV} variant="success" className="w-full justify-start" size="lg">
                <FileSpreadsheet className="h-4 w-4" />
                從 CSV 匯入（Excel 匯出格式）
              </Button>
            </>
          )}
        />
      </div>

      <Surface className="mx-auto mt-4 max-w-4xl p-4 text-sm text-slate-500 dark:text-slate-400">
        CSV 欄位：<span className="font-medium text-slate-700 dark:text-slate-200">deckName, front, back, starRating</span>。
        deckName 可省略，預設為 Default；CSV 不包含錯題狀態，完整備份請使用 JSON。
      </Surface>

      {message && (
        <div
          className={`mx-auto mt-4 max-w-4xl rounded-xl border p-4 text-sm ${
            msgType === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
          }`}
        >
          {message}
        </div>
      )}
    </PageShell>
  )
}

function TransferPanel({
  icon,
  title,
  description,
  actions,
}: {
  icon: React.ReactNode
  title: string
  description: string
  actions: React.ReactNode
}) {
  return (
    <Surface className="p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{actions}</div>
    </Surface>
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
