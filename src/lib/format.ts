import type { Language, Phase } from '@/types/room.types'

// short + badge ใช้ใน LangBadge แทน emoji · chip ใช้กับป้ายชื่อภาษาเต็ม
export const LANGUAGE_META: Record<Language, { label: string; short: string; badge: string; chip: string }> = {
  python: { label: 'Python', short: 'Py', badge: 'bg-sun text-night', chip: 'bg-sun' },
  javascript: { label: 'JavaScript', short: 'JS', badge: 'bg-grape text-white', chip: 'bg-grape-soft text-grape' },
  java: { label: 'Java', short: 'Java', badge: 'bg-mint text-white', chip: 'bg-mint-soft' },
  c: { label: 'C', short: 'C', badge: 'bg-coral text-white', chip: 'bg-coral-soft text-coral' },
}

export const PHASE_LABEL: Record<Phase, string> = {
  pre: 'ก่อนเรียน',
  post: 'หลังกิจกรรม',
  followup: 'ติดตามผล 14 วัน',
}

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// "2026-11-03" → "3 พ.ย. 69" (พ.ศ. สองหลัก)
export const thaiDate = (iso: string, withYear = true) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${String(y + 543).slice(-2)}` : ''}`
}

export const todayIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())

export const daysUntil = (iso: string) => Math.round((Date.parse(iso) - Date.parse(todayIso())) / 86_400_000)

export const clock = (iso: string) =>
  new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(iso))

export const minutesSince = (iso: string) => Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000))
