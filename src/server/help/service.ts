import { randomUUID } from 'node:crypto'
import type { HelpCreate, HelpRequest, HelpStatus, MyHelp } from '@/types/help.types'
import { db, nowIso } from '../db'
import { AppError } from '../http'
import { staffOnline } from '../room/service'
import type { ParticipantRow } from '../participant/service'

type HelpRow = {
  id: string
  room_id: string
  participant_id: string
  nickname: string
  group_no: number | null
  topic: HelpRequest['topic']
  message: string
  place: HelpRequest['place']
  status: HelpStatus
  claimed_by: string | null
  created_at: string
  claimed_at: string | null
  done_at: string | null
}

const SELECT = `SELECT h.*, p.nickname, p.group_no FROM help_requests h JOIN participants p ON p.id = h.participant_id`

const toDto = (r: HelpRow): HelpRequest => ({
  id: r.id,
  nickname: r.nickname,
  groupNo: r.group_no,
  topic: r.topic,
  message: r.message,
  place: r.place,
  status: r.status,
  claimedBy: r.claimed_by,
  createdAt: r.created_at,
  claimedAt: r.claimed_at,
  doneAt: r.done_at,
})

const activeOf = (participantId: string) =>
  db().prepare(`${SELECT} WHERE h.participant_id = ? AND h.status IN ('waiting','helping') ORDER BY h.created_at DESC`).get(participantId) as HelpRow | undefined

export const myHelp = (p: ParticipantRow): MyHelp | null => {
  const row = activeOf(p.id)
  if (!row) return null
  const ahead = row.status === 'waiting'
    ? (db().prepare(`SELECT COUNT(*) n FROM help_requests WHERE room_id = ? AND status = 'waiting' AND created_at < ?`).get(row.room_id, row.created_at) as { n: number }).n
    : null
  return { ...toDto(row), position: ahead === null ? null : ahead + 1, staffOnline: staffOnline(row.room_id) }
}

export const requestHelp = (p: ParticipantRow, input: HelpCreate): MyHelp => {
  // กดซ้ำไม่สร้างคิวใหม่ ส่งคำขอเดิมกลับไปแทน
  if (!activeOf(p.id)) {
    db()
      .prepare(`INSERT INTO help_requests (id, room_id, participant_id, topic, message, place, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?)`)
      .run(randomUUID(), p.room_id, p.id, input.topic, input.message.trim(), input.place, nowIso())
  }
  return myHelp(p)!
}

export const cancelMyHelp = (p: ParticipantRow) => {
  db().prepare(`UPDATE help_requests SET status = 'cancelled', done_at = ? WHERE participant_id = ? AND status = 'waiting'`).run(nowIso(), p.id)
  return myHelp(p)
}

export const roomQueue = (roomId: string) => {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString()
  const rows = db()
    .prepare(`${SELECT} WHERE h.room_id = ? AND (h.status IN ('waiting','helping') OR (h.status = 'done' AND h.done_at >= ?)) ORDER BY h.created_at`)
    .all(roomId, since) as HelpRow[]
  return { requests: rows.map(toDto), staffOnline: staffOnline(roomId) }
}

// เปลี่ยนสถานะแบบมีเงื่อนไขสถานะเดิม กันทีมงานสองคนกดรับเรื่องเดียวกันพร้อมกัน
const transition = (roomId: string, id: string, from: HelpStatus, sql: string, ...args: (string | null)[]) => {
  const res = db().prepare(`UPDATE help_requests SET ${sql} WHERE id = ? AND room_id = ? AND status = ?`).run(...args, id, roomId, from)
  if (!res.changes) throw new AppError(409, 'HELP_STATUS_CHANGED')
  return roomQueue(roomId)
}

export const claimHelp = (roomId: string, id: string) =>
  transition(roomId, id, 'waiting', `status = 'helping', claimed_by = 'ทีมงาน', claimed_at = ?`, nowIso())

export const finishHelp = (roomId: string, id: string) =>
  transition(roomId, id, 'helping', `status = 'done', done_at = ?`, nowIso())

export const releaseHelp = (roomId: string, id: string) =>
  transition(roomId, id, 'helping', `status = 'waiting', claimed_by = NULL, claimed_at = NULL`)
