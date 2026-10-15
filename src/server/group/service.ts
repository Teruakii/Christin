import type { GroupMember, GroupsView } from '@/types/staff.types'
import { levelOf } from '@/lib/level'
import { db, nowIso, tx } from '../db'
import { AppError } from '../http'
import { getRoom, shuffle } from '../room/service'
import { average, bestGroupFor, snakeDraft } from './domain'

type Row = { id: string; nickname: string; group_no: number | null; score: number; submitted_at: string }

const preScores = (roomId: string) =>
  db()
    .prepare(`SELECT p.id, p.nickname, p.group_no, a.score, a.submitted_at FROM participants p
      JOIN attempts a ON a.participant_id = p.id AND a.phase = 'pre' WHERE p.room_id = ?`)
    .all(roomId) as Row[]

const totalQuestions = (roomId: string) =>
  (db().prepare('SELECT COUNT(*) n FROM room_questions WHERE room_id = ?').get(roomId) as { n: number }).n

const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10)

export const getGroups = (roomId: string): GroupsView => {
  const room = getRoom(roomId)
  const total = totalQuestions(roomId)
  const people = preScores(roomId)
  const member = ({ id, nickname, score }: Row): GroupMember => ({ id, nickname, score, level: levelOf(score, total) })
  const byNo = new Map<number, Row[]>()
  for (const p of people) if (p.group_no !== null) byNo.set(p.group_no, [...(byNo.get(p.group_no) ?? []), p])
  const groups = [...byNo.entries()]
    .sort(([a], [b]) => a - b)
    .map(([no, rows]) => ({
      no,
      avg: round1(average(rows.map((m) => m.score)))!,
      members: rows.sort((a, b) => b.score - a.score).map(member),
    }))
  const avgs = groups.map((g) => g.avg)
  const generatedAt = room.groups_generated_at
  return {
    groupSize: room.group_size,
    totalQuestions: total,
    announced: !!room.groups_announced_at,
    groups,
    ungrouped: people.filter((p) => p.group_no === null).map(member),
    // ส่งหลังจัดกลุ่ม: ระบบใส่กลุ่มให้แล้ว แต่ทีมงานอาจอยากจัดใหม่ทั้งห้องให้คละอีกรอบ
    lateCount: generatedAt ? people.filter((p) => p.submitted_at > generatedAt).length : 0,
    roomAvg: round1(average(people.map((p) => p.score))),
    spread: avgs.length ? round1(Math.max(...avgs) - Math.min(...avgs)) : null,
  }
}

// จัดใหม่ได้ทุกเมื่อ ถ้าประกาศไปแล้วผู้เข้าร่วมจะเห็นกลุ่มใหม่ทันที (หน้าเว็บถามยืนยันก่อน)
export const generateGroups = (roomId: string, groupSize?: number) => {
  const people = preScores(roomId)
  if (!people.length) throw new AppError(409, 'NO_PRE_TEST_SUBMISSIONS')
  if (groupSize) db().prepare('UPDATE rooms SET group_size = ? WHERE id = ?').run(groupSize, roomId)
  const room = getRoom(roomId)
  // สุ่มก่อนแล้วค่อยเรียง (sort ของ JS เสถียร) คนคะแนนเท่ากันจึงสลับกันทุกครั้งที่กดจัดใหม่
  const ranked = shuffle(people).sort((a, b) => b.score - a.score)
  const groups = snakeDraft(ranked, room.group_size)
  const set = db().prepare('UPDATE participants SET group_no = ? WHERE id = ?')
  tx(db(), () => {
    db().prepare('UPDATE participants SET group_no = NULL WHERE room_id = ?').run(roomId)
    groups.forEach((g, i) => g.forEach((p) => set.run(i + 1, p.id)))
    db().prepare('UPDATE rooms SET groups_generated_at = ? WHERE id = ?').run(nowIso(), roomId)
  })
  return getGroups(roomId)
}

export const announceGroups = (roomId: string) => {
  if (!getGroups(roomId).groups.length) throw new AppError(409, 'NO_GROUPS_YET')
  db().prepare('UPDATE rooms SET groups_announced_at = COALESCE(groups_announced_at, ?) WHERE id = ?').run(nowIso(), roomId)
  return getGroups(roomId)
}

export const moveMember = (roomId: string, participantId: string, groupNo: number) => {
  const view = getGroups(roomId)
  if (!view.groups.some((g) => g.no === groupNo)) throw new AppError(404, 'GROUP_NOT_FOUND')
  const res = db().prepare('UPDATE participants SET group_no = ? WHERE id = ? AND room_id = ?').run(groupNo, participantId, roomId)
  if (!res.changes) throw new AppError(404, 'PARTICIPANT_NOT_FOUND')
  return getGroups(roomId)
}

// เรียกใน transaction ตอนส่งแบบทดสอบก่อนเรียน ถ้าจัดกลุ่มไปแล้วให้คนส่งช้าได้กลุ่มทันที
export const placeLateJoiner = (roomId: string, participantId: string, score: number) => {
  const view = getGroups(roomId)
  if (!view.groups.length) return
  const scores = view.groups.map((g) => ({ no: g.no, scores: g.members.map((m) => m.score) }))
  const no = bestGroupFor(score, scores, view.roomAvg ?? score, view.groupSize) ?? Math.max(...view.groups.map((g) => g.no)) + 1
  db().prepare('UPDATE participants SET group_no = ? WHERE id = ?').run(no, participantId)
}

// ลบกลุ่มเดียว: สมาชิกกลับไปเป็น "ยังไม่มีกลุ่ม" แล้วเลื่อนเลขกลุ่มถัดไปลงมา ไม่ให้มีเลขโหว่
export const deleteGroup = (roomId: string, groupNo: number) => {
  if (!getGroups(roomId).groups.some((g) => g.no === groupNo)) throw new AppError(404, 'GROUP_NOT_FOUND')
  tx(db(), () => {
    db().prepare('UPDATE participants SET group_no = NULL WHERE room_id = ? AND group_no = ?').run(roomId, groupNo)
    db().prepare('UPDATE participants SET group_no = group_no - 1 WHERE room_id = ? AND group_no > ?').run(roomId, groupNo)
  })
  if (!getGroups(roomId).groups.length) resetGrouping(roomId)
  return getGroups(roomId)
}

// ล้างทั้งหมด: ไม่มีกลุ่มเหลือ ผู้เข้าร่วมจะไม่เห็นกลุ่มจนกว่าจะจัดและประกาศใหม่
export const clearGroups = (roomId: string) => {
  tx(db(), () => {
    db().prepare('UPDATE participants SET group_no = NULL WHERE room_id = ?').run(roomId)
    resetGrouping(roomId)
  })
  return getGroups(roomId)
}

const resetGrouping = (roomId: string) =>
  db().prepare('UPDATE rooms SET groups_announced_at = NULL, groups_generated_at = NULL WHERE id = ?').run(roomId)
