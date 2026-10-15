import { randomUUID } from 'node:crypto'
import type { Answers, Me, PhaseState } from '@/types/quiz.types'
import { PHASES } from '@/types/room.types'
import { db, nowIso } from '../db'
import { AppError } from '../http'
import { isOpen, opensOn, randomCode, toPublic } from '../room/domain'
import { findRoomByCode, getRoom } from '../room/service'
import { attemptsOf, byLanguage, reviewOpen, roomQuestions } from '../quiz/service'

export type ParticipantRow = {
  id: string
  room_id: string
  tracking_code: string
  nickname: string
  group_no: number | null
  created_at: string
}

export const findParticipant = (trackingCode: string | null) => {
  if (!trackingCode) throw new AppError(401, 'TRACKING_CODE_REQUIRED')
  const p = db().prepare('SELECT * FROM participants WHERE tracking_code = ?').get(trackingCode.trim().toUpperCase()) as ParticipantRow | undefined
  if (!p) throw new AppError(404, 'TRACKING_CODE_NOT_FOUND')
  return p
}

export const joinRoom = (roomCode: string, nickname: string) => {
  const room = findRoomByCode(roomCode)
  if (!room) throw new AppError(404, 'ROOM_NOT_FOUND')
  for (;;) {
    const trackingCode = randomCode(6)
    const taken = db().prepare('SELECT 1 FROM participants WHERE tracking_code = ?').get(trackingCode)
    if (taken) continue
    db()
      .prepare('INSERT INTO participants (id, room_id, tracking_code, nickname, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), room.id, trackingCode, nickname.trim(), nowIso())
    return trackingCode
  }
}

export const getMe = (p: ParticipantRow): Me => {
  const room = getRoom(p.room_id)
  const questions = roomQuestions(room.id)
  const attempts = new Map(attemptsOf(p.id).map((a) => [a.phase, a]))
  const phases: PhaseState[] = PHASES.map((phase) => {
    const a = attempts.get(phase)
    return {
      phase,
      opensOn: opensOn(room, phase),
      open: isOpen(room, phase),
      submitted: !!a,
      score: a?.score ?? null,
      total: questions.length,
      byLanguage: a ? byLanguage(questions, JSON.parse(a.answers) as Answers) : null,
    }
  })
  // ผู้เข้าร่วมเห็นแค่ชื่อเพื่อนในกลุ่ม ไม่เห็นคะแนน และเห็นหลังทีมงานประกาศกลุ่มแล้วเท่านั้น
  const group =
    room.groups_announced_at && p.group_no !== null
      ? {
          no: p.group_no,
          members: (db()
            .prepare('SELECT nickname FROM participants WHERE room_id = ? AND group_no = ? ORDER BY id = ? DESC, created_at')
            .all(room.id, p.group_no, p.id) as { nickname: string }[]).map((m) => m.nickname),
        }
      : null
  const submittedPre = (db()
    .prepare(`SELECT COUNT(*) n FROM attempts a JOIN participants p ON p.id = a.participant_id WHERE p.room_id = ? AND a.phase = 'pre'`)
    .get(room.id) as { n: number }).n
  return {
    trackingCode: p.tracking_code,
    nickname: p.nickname,
    room: toPublic(room),
    phases,
    group,
    submittedPre,
    target: room.target,
    reviewOpen: reviewOpen(p),
  }
}
