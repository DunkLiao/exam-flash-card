export function getCardPreviewText(value: string, maxLength = 100): string {
  const plain = value
    .replace(/[#*`>[\]!()~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!plain) return '尚無內容'
  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength)}...`
}
