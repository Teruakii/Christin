import type { Level } from '@/lib/level'
import type { QuestionWithAnswer } from './quiz.types'
import type { Language, Phase, RoomPublic, IsoDate } from './room.types'

// room = null: ทีมยังไม่มีห้อง หรือห้องที่อยู่ถูกลบไปแล้ว
export type StaffMe = { room: RoomPublic | null }

export type RoomSummary = RoomPublic & { participants: number; createdAt: string; current: boolean }

export type ScoreBands = { high: number; mid: number; low: number }

export type Overview = {
  room: RoomPublic
  today: IsoDate
  participants: number
  target: number
  submitted: Record<Phase, number>
  bands: ScoreBands
  avgPre: number | null
  notSubmittedPre: string[]
  help: { waiting: number; helping: number; doneToday: number }
  groupsAnnounced: boolean
}

export type GroupMember = { id: string; nickname: string; score: number; level: Level }

export type GroupsView = {
  groupSize: number
  totalQuestions: number
  announced: boolean
  groups: { no: number; avg: number; members: GroupMember[] }[]
  // ทำแบบทดสอบแล้วแต่ยังไม่มีกลุ่ม (ส่งหลังจัดกลุ่ม)
  ungrouped: GroupMember[]
  lateCount: number
  roomAvg: number | null
  spread: number | null
}

export type ResultRow = {
  id: string
  nickname: string
  groupNo: number | null
  pre: number | null
  post: number | null
  followup: number | null
}

export type Results = {
  total: number
  phases: Record<Phase, { count: number; avg: number | null }>
  // สัดส่วนคะแนนที่เพิ่มขึ้นแล้วยังคงอยู่หลัง 14 วัน
  retention: number | null
  byLanguage: { language: Language; questions: number; pct: Record<Phase, number | null> }[]
  rows: ResultRow[]
}

// picks[i] = จำนวนคนที่เลือกตัวเลือก i · n = จำนวนคนที่ส่งรอบนั้น
export type ChoiceStats = { n: number; picks: number[]; skipped: number }

export type AnswerKeyItem = QuestionWithAnswer & { stats: Record<Phase, ChoiceStats> }
