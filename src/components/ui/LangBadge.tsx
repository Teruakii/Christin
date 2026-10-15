import { LANGUAGE_META } from '@/lib/format'
import type { Language } from '@/types/room.types'

// ป้ายตัวย่อภาษาแทน emoji: อ่านออกทันที ไม่ต้องเดาว่างูหรือแก้วกาแฟคือภาษาอะไร
export default function LangBadge({ language, withLabel = false }: { language: Language; withLabel?: boolean }) {
  const meta = LANGUAGE_META[language]
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <span className={`inline-grid h-5 min-w-7 place-items-center rounded-md px-1 font-mono text-[11px] leading-none font-bold ${meta.badge}`}>{meta.short}</span>
      {withLabel && <span>{meta.label}</span>}
    </span>
  )
}
