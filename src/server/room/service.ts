import { randomUUID, randomInt } from 'node:crypto'
import type { LanguageMix, RoomCreated, RoomSettings, RoomUpsert } from '@/types/room.types'
import { LANGUAGES } from '@/types/room.types'
import { db, nowIso, tx } from '../db'
import { AppError } from '../http'
import type { RoomStaff } from '../session'
import { assertSchedule, parseMix, randomCode, toPublic, type RoomRow } from './domain'

export const findRoomByCode = (code: string) =>
  db().prepare('SELECT * FROM rooms WHERE code = ?').get(code.trim().toUpperCase()) as RoomRow | undefined

export const getRoom = (id: string) => {
  const room = db().prepare('SELECT * FROM rooms WHERE id = ?').get(id) as RoomRow | undefined
  if (!room) throw new AppError(404, 'ROOM_NOT_FOUND')
  return room
}

export const lookupRoom = (code: string) => {
  const room = findRoomByCode(code)
  if (!room) throw new AppError(404, 'ROOM_NOT_FOUND')
  return toPublic(room)
}

const hasAttempts = (roomId: string) =>
  !!db()
    .prepare('SELECT 1 FROM attempts a JOIN participants p ON p.id = a.participant_id WHERE p.room_id = ? LIMIT 1')
    .get(roomId)

// สุ่มข้อจากคลังตามสัดส่วนภาษา แล้วสลับลำดับ ให้ข้อภาษาเดียวกันไม่อยู่ติดกันเป็นก้อน
const pickQuestions = (roomId: string, mix: LanguageMix) => {
  const picked: string[] = []
  for (const lang of LANGUAGES) {
    const ids = (db().prepare('SELECT id FROM questions WHERE language = ?').all(lang) as { id: string }[]).map((r) => r.id)
    if (mix[lang] > ids.length) {
      throw new AppError(400, 'NOT_ENOUGH_QUESTIONS', [{ field: `mix.${lang}`, msg: `คลังมี ${ids.length} ข้อ` }])
    }
    picked.push(...shuffle(ids).slice(0, mix[lang]))
  }
  db().prepare('DELETE FROM room_questions WHERE room_id = ?').run(roomId)
  const insert = db().prepare('INSERT INTO room_questions (room_id, question_id, position) VALUES (?, ?, ?)')
  shuffle(picked).forEach((id, i) => insert.run(roomId, id, i))
}

export const shuffle = <T>(xs: T[]) => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const uniqueRoomCode = () => {
  for (;;) {
    const code = randomCode(6)
    if (!findRoomByCode(code)) return code
  }
}

export const createRoom = (input: RoomUpsert, teamId: string): RoomCreated & { roomId: string } => {
  assertSchedule(input.schedule)
  const roomId = randomUUID()
  const roomCode = uniqueRoomCode()
  tx(db(), () => {
    db()
      .prepare(`INSERT INTO rooms (id, code, name, course_language, target, group_size, pre_on, post_on, followup_on, end_on, mix, team_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(roomId, roomCode, input.name, input.courseLanguage, input.target, input.groupSize, input.schedule.pre, input.schedule.post,
        input.schedule.followup, input.schedule.end, JSON.stringify(input.mix), teamId, nowIso())
    pickQuestions(roomId, input.mix)
  })
  return { roomId, roomCode }
}

export const getSettings = (roomId: string): RoomSettings => {
  const room = getRoom(roomId)
  return { ...toPublic(room), target: room.target, groupSize: room.group_size, mix: parseMix(room), locked: hasAttempts(roomId) }
}

export const updateRoom = (roomId: string, input: RoomUpsert): RoomSettings => {
  assertSchedule(input.schedule)
  const before = getSettings(roomId)
  const mixChanged = LANGUAGES.some((l) => before.mix[l] !== input.mix[l])
  if (mixChanged && before.locked) throw new AppError(409, 'QUESTIONS_LOCKED')
  tx(db(), () => {
    db()
      .prepare(`UPDATE rooms SET name = ?, course_language = ?, target = ?, group_size = ?, pre_on = ?, post_on = ?, followup_on = ?, end_on = ?, mix = ? WHERE id = ?`)
      .run(input.name, input.courseLanguage, input.target, input.groupSize, input.schedule.pre, input.schedule.post,
        input.schedule.followup, input.schedule.end, JSON.stringify(input.mix), roomId)
    if (mixChanged) pickQuestions(roomId, input.mix)
  })
  return getSettings(roomId)
}

// คอลัมน์ name เก็บ sid ของแต่ละการเข้าใช้ ใช้นับว่ามีทีมงานเปิดหน้าอยู่กี่คน
export const touchStaff = ({ roomId, sid }: RoomStaff) =>
  db()
    .prepare('INSERT INTO staff_presence (room_id, name, seen_at) VALUES (?, ?, ?) ON CONFLICT(room_id, name) DO UPDATE SET seen_at = excluded.seen_at')
    .run(roomId, sid, nowIso())

export const staffOnline = (roomId: string) => {
  const since = new Date(Date.now() - 2 * 60_000).toISOString()
  return (db().prepare('SELECT COUNT(*) n FROM staff_presence WHERE room_id = ? AND seen_at >= ?').get(roomId, since) as { n: number }).n
}

// ลบถาวร: ข้อมูลทุกอย่างของห้อง (ผู้เข้าร่วม คำตอบ คิวช่วยเหลือ ชุดข้อสอบ) หายไปด้วย
export const deleteRoom = (roomId: string) =>
  tx(db(), () => {
    db().prepare('DELETE FROM help_requests WHERE room_id = ?').run(roomId)
    db().prepare('DELETE FROM attempts WHERE participant_id IN (SELECT id FROM participants WHERE room_id = ?)').run(roomId)
    db().prepare('DELETE FROM participants WHERE room_id = ?').run(roomId)
    db().prepare('DELETE FROM room_questions WHERE room_id = ?').run(roomId)
    db().prepare('DELETE FROM staff_presence WHERE room_id = ?').run(roomId)
    db().prepare('DELETE FROM rooms WHERE id = ?').run(roomId)
  })
