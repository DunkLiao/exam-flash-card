import { invoke } from '@tauri-apps/api/core'
import type { AppData } from '../types'

export async function loadData(): Promise<AppData> {
  return invoke<AppData>('load_data')
}

export async function saveData(data: AppData): Promise<void> {
  return invoke('save_data', { data })
}

export async function saveImage(data: number[], filename: string): Promise<string> {
  return invoke<string>('save_image', { data, filename })
}

export async function deleteUnusedImages(usedPaths: string[]): Promise<void> {
  return invoke('delete_unused_images', { usedPaths })
}

export async function openFileDialog(): Promise<string | null> {
  return invoke<string | null>('open_file_dialog')
}

export async function saveFileDialog(defaultName: string): Promise<string | null> {
  return invoke<string | null>('save_file_dialog', { defaultName })
}

export async function exportToFile(path: string, content: string): Promise<void> {
  return invoke('export_to_file', { path, content })
}

export async function readImportFile(path: string): Promise<string> {
  return invoke<string>('read_import_file', { path })
}
