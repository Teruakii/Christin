import { randomUUID } from 'node:crypto'
import type { TeamCreated } from '@/types/room.types'
import type { RoomSummary } from '@/types/staff.types'
import { db, nowIso } from '../db'
import { AppError } from '../http'
import { randomCode, toPublic, type RoomRow } from '../room/domain'
import { findRoomByCode } from '../room/service'
import { hashStaffCode, staffCodeLookup, verifyStaffCode } from '../session'

type TeamRow = { id: string; staff_code_hash: string; staff_code_lookup: string | null; created_at: string }

export const findTeam = (id: string) => db().prepare('SELECT * FROM teams WHERE id = ?').get(id) as TeamRow | undefined

// รหัสทีมงานบอกได้เองว่าเป็นทีมไหน จึงต้องไม่ซ้ำกันทั้งระบบ
const uniqueStaffCode = () => {
  for (;;) {
    const raw = randomCode(8)
    const code = `${raw.slice(0, 4)}-${raw.slice(4)}`
    if (!db().prepare('SELECT 1 FROM teams WHERE staff_code_lookup = ?').get(staffCodeLookup(code))) return code
  }
}

export const createTeam = (): TeamCreated & { teamId: string } => {
  const teamId = randomUUID()
  const staffCode = uniqueStaffCode()
  db()
    .prepare('INSERT INTO teams (id, staff_code_hash, staff_code_lookup, created_at) VALUES (?, ?, ?, ?)')
    .run(teamId, hashStaffCode(staffCode), staffCodeLookup(staffCode), nowIso())
  return { teamId, staffCode }
}

// ออกรหัสใหม่ รหัสเดิมใช้ไม่ได้ทันที · คนที่เข้าระบบค้างไว้แล้วยังใช้ต่อได้
export const resetTeamCode = (teamId: string): TeamCreated => {
  const staffCode = uniqueStaffCode()
  db().prepare('UPDATE teams SET staff_code_hash = ?, staff_code_lookup = ? WHERE id = ?').run(hashStaffCode(staffCode), staffCodeLookup(staffCode), teamId)
  return { staffCode }
}

export const teamLogin = (staffCode: string) => {
  const code = staffCode.trim().toUpperCase()
  const team = (db().prepare('SELECT * FROM teams WHERE staff_code_lookup = ?').get(staffCodeLookup(code)) as TeamRow | undefined) ?? legacyTeam(code)
  if (!team || !verifyStaffCode(code, team.staff_code_hash)) throw new AppError(401, 'INVALID_STAFF_CODE')
  return team.id
}

// ทีมที่ย้ายมาจากรหัสรายห้องรุ่นเก่าและยังไม่มี lookup: เทียบ hash ทีละทีม เจอแล้วบันทึก lookup ไว้
const legacyTeam = (code: string) => {
  const teams = db().prepare('SELECT * FROM teams WHERE staff_code_lookup IS NULL').all() as TeamRow[]
  const team = teams.find((t) => verifyStaffCode(code, t.staff_code_hash))
  if (team) db().prepare('UPDATE teams SET staff_code_lookup = ? WHERE id = ?').run(staffCodeLookup(code), team.id)
  return team
}

export const latestRoomId = (teamId: string) =>
  (db().prepare('SELECT id FROM rooms WHERE team_id = ? ORDER BY created_at DESC LIMIT 1').get(teamId) as { id: string } | undefined)?.id ?? null

export const listTeamRooms = (teamId: string, currentRoomId: string | null): RoomSummary[] =>
  (db()
    .prepare('SELECT r.*, (SELECT COUNT(*) FROM participants p WHERE p.room_id = r.id) participants FROM rooms r WHERE r.team_id = ? ORDER BY r.created_at')
    .all(teamId) as (RoomRow & { participants: number })[]).map((r) => ({ ...toPublic(r), participants: r.participants, createdAt: r.created_at, current: r.id === currentRoomId }))

// ห้องของทีมนี้เท่านั้น ห้องของทีมอื่นตอบเหมือนไม่มีอยู่
export const teamRoom = (teamId: string, code: string) => {
  const room = findRoomByCode(code)
  if (!room || room.team_id !== teamId) throw new AppError(404, 'ROOM_NOT_FOUND')
  return room
}
