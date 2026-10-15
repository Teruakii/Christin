import { randomInt } from 'node:crypto'
import type { IsoDate, LanguageMix, Phase, RoomPublic, Schedule, Language } from '@/types/room.types'
import { AppError } from '../http'

export type RoomRow = {
  id: string
  code: string
  name: string
  course_language: Language
  target: number
  group_size: number
  pre_on: IsoDate
  post_on: IsoDate
  followup_on: IsoDate
  end_on: IsoDate
  mix: string
  groups_announced_at: string | null
  groups_generated_at: string | null
  team_id: string
  created_at: string
}

export const FOLLOWUP_GAP_DAYS = 14

// ตัดตัวที่อ่านสับสนออก (0/O, 1/I/L) เพราะคนพิมพ์รหัสจากกระดาษหรือจอโปรเจกเตอร์
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const randomCode = (length: number) =>
  Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')

export const todayBkk = (): IsoDate =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())

export const daysBetween = (from: IsoDate, to: IsoDate) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)

export const scheduleOf = (r: RoomRow): Schedule => ({ pre: r.pre_on, post: r.post_on, followup: r.followup_on, end: r.end_on })

export const opensOn = (r: RoomRow, phase: Phase): IsoDate => scheduleOf(r)[phase]

export const isOpen = (r: RoomRow, phase: Phase, today = todayBkk()) => today >= opensOn(r, phase)

export const toPublic = (r: RoomRow): RoomPublic => ({
  code: r.code,
  name: r.name,
  courseLanguage: r.course_language,
  schedule: scheduleOf(r),
})

export const parseMix = (r: RoomRow) => JSON.parse(r.mix) as LanguageMix

export const assertSchedule = (s: Schedule) => {
  const errors = []
  if (s.post < s.pre) errors.push({ field: 'schedule.post', msg: 'ต้องไม่ก่อนวันทำแบบทดสอบก่อนเรียน' })
  if (daysBetween(s.post, s.followup) < FOLLOWUP_GAP_DAYS)
    errors.push({ field: 'schedule.followup', msg: `ต้องห่างจากวันจบกิจกรรมอย่างน้อย ${FOLLOWUP_GAP_DAYS} วัน` })
  if (s.end < s.followup) errors.push({ field: 'schedule.end', msg: 'ต้องไม่ก่อนวันติดตามผล' })
  if (errors.length) throw new AppError(400, 'INVALID_SCHEDULE', errors)
}
