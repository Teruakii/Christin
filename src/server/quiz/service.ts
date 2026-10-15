import { createHash } from 'node:crypto'
import type { Answers, LanguageScore, Question, QuestionWithAnswer, Quiz, ReviewItem, SubmitResult } from '@/types/quiz.types'
import type { Phase } from '@/types/room.types'
import { LANGUAGES, PHASES } from '@/types/room.types'
import { db, nowIso, tx } from '../db'
import { AppError } from '../http'
import { isOpen, opensOn, todayBkk } from '../room/domain'
import { getRoom } from '../room/service'
import type { ParticipantRow } from '../participant/service'
import { placeLateJoiner } from '../group/service'

type QuestionRow = Omit<QuestionWithAnswer, 'choices'> & { choices: string }

export const roomQuestions = (roomId: string): QuestionWithAnswer[] =>
  (db()
    .prepare(`SELECT q.* FROM room_questions rq JOIN questions q ON q.id = rq.question_id WHERE rq.room_id = ? ORDER BY rq.position`)
    .all(roomId) as QuestionRow[]).map((q) => ({ ...q, choices: JSON.parse(q.choices) as string[] }))

export type AttemptRow = { participant_id: string; phase: Phase; answers: string; score: number; total: number; submitted_at: string }

export const attemptsOf = (participantId: string) =>
  db().prepare('SELECT * FROM attempts WHERE participant_id = ?').all(participantId) as AttemptRow[]

// สลับลำดับข้อแบบคงที่ต่อคนต่อรอบ: รีเฟรชแล้วลำดับเดิม แต่รอบหลังไม่ตรงกับรอบแรกจนจำตำแหน่งได้
const seededOrder = <T>(xs: T[], seed: string) => {
  const key = (x: T, i: number) => createHash('sha256').update(`${seed}:${i}`).digest('hex')
  return xs.map((x, i) => ({ x, k: key(x, i) })).sort((a, b) => a.k.localeCompare(b.k)).map((e) => e.x)
}

const PREREQUISITE: Partial<Record<Phase, Phase>> = { post: 'pre', followup: 'pre' }

const assertCanTake = (p: ParticipantRow, phase: Phase) => {
  const room = getRoom(p.room_id)
  if (!isOpen(room, phase)) throw new AppError(409, 'PHASE_NOT_OPEN', [{ field: 'opensOn', msg: opensOn(room, phase) }])
  const done = new Set(attemptsOf(p.id).map((a) => a.phase))
  if (done.has(phase)) throw new AppError(409, 'ALREADY_SUBMITTED')
  const before = PREREQUISITE[phase]
  if (before && !done.has(before)) throw new AppError(409, 'PRE_TEST_REQUIRED')
}

// เลือก field ที่ส่งได้แบบระบุชื่อ เพิ่ม field ลับในอนาคตจะไม่หลุดไปถึงผู้เข้าร่วม
const hide = ({ id, language, topic, prompt, code, choices }: QuestionWithAnswer): Question => ({ id, language, topic, prompt, code, choices })

export const getQuiz = (p: ParticipantRow, phase: Phase): Quiz => {
  assertCanTake(p, phase)
  return { phase, questions: seededOrder(roomQuestions(p.room_id), `${p.id}:${phase}`).map(hide) }
}

export const scoreAnswers = (questions: QuestionWithAnswer[], answers: Answers) =>
  questions.filter((q) => answers[q.id] === q.answer).length

export const byLanguage = (questions: QuestionWithAnswer[], answers: Answers): LanguageScore[] =>
  LANGUAGES.map((language) => {
    const qs = questions.filter((q) => q.language === language)
    return { language, total: qs.length, correct: scoreAnswers(qs, answers) }
  }).filter((s) => s.total > 0)

export const submitQuiz = (p: ParticipantRow, phase: Phase, answers: Answers): SubmitResult => {
  assertCanTake(p, phase)
  const questions = roomQuestions(p.room_id)
  const ids = new Set(questions.map((q) => q.id))
  const bad = Object.keys(answers).filter((id) => !ids.has(id))
  const missing = questions.filter((q) => !(q.id in answers)).map((q) => q.id)
  const outOfRange = questions.filter((q) => {
    const a = answers[q.id]
    return a !== null && a !== undefined && (a < 0 || a >= q.choices.length)
  })
  if (bad.length || missing.length || outOfRange.length) {
    throw new AppError(400, 'INVALID_ANSWERS', [
      ...bad.map((id) => ({ field: id, msg: 'ไม่ใช่ข้อในชุดนี้' })),
      ...missing.map((id) => ({ field: id, msg: 'ไม่มีคำตอบ (ข้ามให้ส่ง null)' })),
      ...outOfRange.map((q) => ({ field: q.id, msg: 'ตัวเลือกไม่มีอยู่' })),
    ])
  }
  const score = scoreAnswers(questions, answers)
  tx(db(), () => {
    db()
      .prepare('INSERT INTO attempts (participant_id, phase, answers, score, total, submitted_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(p.id, phase, JSON.stringify(answers), score, questions.length, nowIso())
    if (phase === 'pre') placeLateJoiner(p.room_id, p.id, score)
  })
  return { score, total: questions.length }
}

export const reviewOpen = (p: ParticipantRow) =>
  attemptsOf(p.id).some((a) => a.phase === 'followup') || todayBkk() >= getRoom(p.room_id).end_on

export const getReview = (p: ParticipantRow): ReviewItem[] => {
  if (!reviewOpen(p)) throw new AppError(409, 'REVIEW_NOT_OPEN')
  const mine = Object.fromEntries(attemptsOf(p.id).map((a) => [a.phase, JSON.parse(a.answers) as Answers]))
  return roomQuestions(p.room_id).map((q) => ({
    ...q,
    mine: Object.fromEntries(PHASES.filter((ph) => mine[ph]).map((ph) => [ph, mine[ph][q.id] ?? null])),
  }))
}
