import type { Answers } from '@/types/quiz.types'
import type { Phase } from '@/types/room.types'
import { LANGUAGES, PHASES } from '@/types/room.types'
import type { AnswerKeyItem, Overview, Results, ResultRow } from '@/types/staff.types'
import { levelOf } from '@/lib/level'
import { db } from '../db'
import { average } from '../group/domain'
import { todayBkk, toPublic } from '../room/domain'
import { getRoom } from '../room/service'
import { roomQuestions, type AttemptRow } from '../quiz/service'

const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10)

const roomData = (roomId: string) => {
  const people = db().prepare('SELECT id, nickname, group_no, created_at FROM participants WHERE room_id = ? ORDER BY created_at').all(roomId) as {
    id: string
    nickname: string
    group_no: number | null
  }[]
  const attempts = db()
    .prepare('SELECT a.* FROM attempts a JOIN participants p ON p.id = a.participant_id WHERE p.room_id = ?')
    .all(roomId) as AttemptRow[]
  const byPerson = new Map<string, Partial<Record<Phase, AttemptRow>>>()
  for (const a of attempts) byPerson.set(a.participant_id, { ...byPerson.get(a.participant_id), [a.phase]: a })
  return { people, attempts, byPerson }
}

export const getOverview = (roomId: string): Overview => {
  const room = getRoom(roomId)
  const { people, attempts, byPerson } = roomData(roomId)
  const pre = attempts.filter((a) => a.phase === 'pre')
  const total = pre[0]?.total ?? 10
  const band = (s: number) => levelOf(s, total)
  const counts = (status: string) =>
    (db().prepare('SELECT COUNT(*) n FROM help_requests WHERE room_id = ? AND status = ?').get(roomId, status) as { n: number }).n
  const dayStart = new Date(`${todayBkk()}T00:00:00+07:00`).toISOString()
  return {
    room: toPublic(room),
    today: todayBkk(),
    participants: people.length,
    target: room.target,
    submitted: Object.fromEntries(PHASES.map((ph) => [ph, attempts.filter((a) => a.phase === ph).length])) as Record<Phase, number>,
    bands: {
      high: pre.filter((a) => band(a.score) === 'high').length,
      mid: pre.filter((a) => band(a.score) === 'mid').length,
      low: pre.filter((a) => band(a.score) === 'low').length,
    },
    avgPre: round1(average(pre.map((a) => a.score))),
    notSubmittedPre: people.filter((p) => !byPerson.get(p.id)?.pre).map((p) => p.nickname),
    help: {
      waiting: counts('waiting'),
      helping: counts('helping'),
      doneToday: (db().prepare(`SELECT COUNT(*) n FROM help_requests WHERE room_id = ? AND status = 'done' AND done_at >= ?`).get(roomId, dayStart) as { n: number }).n,
    },
    groupsAnnounced: !!room.groups_announced_at,
  }
}

export const getResults = (roomId: string): Results => {
  const { people, attempts, byPerson } = roomData(roomId)
  const questions = roomQuestions(roomId)
  const avgOf = (ph: Phase) => round1(average(attempts.filter((a) => a.phase === ph).map((a) => a.score)))
  const phases = Object.fromEntries(
    PHASES.map((ph) => [ph, { count: attempts.filter((a) => a.phase === ph).length, avg: avgOf(ph) }]),
  ) as Results['phases']

  // คิดเฉพาะคนที่ทำครบทั้งสามรอบ ไม่งั้นคนที่หลุดไปจะทำให้ตัวเลขเพี้ยน
  const complete = [...byPerson.values()].filter((r) => r.pre && r.post && r.followup)
  const gain = average(complete.map((r) => r.post!.score - r.pre!.score))
  const kept = average(complete.map((r) => r.followup!.score - r.pre!.score))
  const retention = gain && gain > 0 && kept !== null ? Math.round((kept / gain) * 100) : null

  const byLanguage = LANGUAGES.map((language) => {
    const qs = questions.filter((q) => q.language === language)
    const pct = Object.fromEntries(
      PHASES.map((ph) => {
        const rows = attempts.filter((a) => a.phase === ph)
        if (!rows.length || !qs.length) return [ph, null]
        const correct = rows.reduce((n, a) => {
          const ans = JSON.parse(a.answers) as Answers
          return n + qs.filter((q) => ans[q.id] === q.answer).length
        }, 0)
        return [ph, Math.round((correct / (rows.length * qs.length)) * 100)]
      }),
    ) as Record<Phase, number | null>
    return { language, questions: qs.length, pct }
  }).filter((l) => l.questions > 0)

  const rows: ResultRow[] = people.map((p) => {
    const a = byPerson.get(p.id) ?? {}
    return { id: p.id, nickname: p.nickname, groupNo: p.group_no, pre: a.pre?.score ?? null, post: a.post?.score ?? null, followup: a.followup?.score ?? null }
  })
  return { total: questions.length, phases, retention, byLanguage, rows }
}

// เฉลยสำหรับทีมงาน: แต่ละข้อมีคนเลือกตัวเลือกไหนกี่คน แยกรอบ ใช้ดูว่าเข้าใจผิดไปทางไหน
export const getAnswerKey = (roomId: string): AnswerKeyItem[] => {
  const { attempts } = roomData(roomId)
  const parsed = attempts.map((a) => ({ phase: a.phase, answers: JSON.parse(a.answers) as Answers }))
  return roomQuestions(roomId).map((q) => ({
    ...q,
    stats: Object.fromEntries(
      PHASES.map((ph) => {
        const rows = parsed.filter((a) => a.phase === ph)
        const picks = q.choices.map((_, i) => rows.filter((a) => a.answers[q.id] === i).length)
        return [ph, { n: rows.length, picks, skipped: rows.length - picks.reduce((x, y) => x + y, 0) }]
      }),
    ) as AnswerKeyItem['stats'],
  }))
}

const csvCell = (v: string | number | null) => {
  const s = v === null ? '' : String(v)
  // กันสูตร Excel จากชื่อเล่นที่ขึ้นต้นด้วย = + - @
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export const resultsCsv = (roomId: string) => {
  const { rows } = getResults(roomId)
  const header = ['nickname', 'group', 'pre', 'post', 'followup', 'change_post', 'change_followup']
  const lines = rows.map((r) =>
    [r.nickname, r.groupNo, r.pre, r.post, r.followup,
      r.pre !== null && r.post !== null ? r.post - r.pre : null,
      r.pre !== null && r.followup !== null ? r.followup - r.pre : null].map(csvCell).join(','),
  )
  // BOM ให้ Excel อ่านภาษาไทยถูก
  return '﻿' + [header.join(','), ...lines].join('\n')
}
