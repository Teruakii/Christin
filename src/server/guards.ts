import { db } from './db'
import { AppError } from './http'
import { findParticipant } from './participant/service'
import { touchStaff } from './room/service'
import { readTrackingCode, requireStaff, type RoomStaff } from './session'
import { findTeam } from './team/service'

export const currentParticipant = async () => findParticipant(await readTrackingCode())

// ระดับทีม: รายการห้อง สร้าง/ลบ/สลับห้อง · ห้องที่ถูกลบไปแล้วนับเป็นยังไม่ได้เลือกห้อง
export const currentStaff = async () => {
  const s = await requireStaff()
  if (!findTeam(s.teamId)) throw new AppError(401, 'STAFF_SESSION_REQUIRED')
  const roomOk = s.roomId && db().prepare('SELECT 1 FROM rooms WHERE id = ? AND team_id = ?').get(s.roomId, s.teamId)
  return { ...s, roomId: roomOk ? s.roomId : null }
}

// ระดับห้อง: งานทุกอย่างที่ทำกับห้องที่เปิดอยู่
export const currentRoomStaff = async (): Promise<RoomStaff> => {
  const s = await currentStaff()
  if (!s.roomId) throw new AppError(409, 'NO_ROOM_SELECTED')
  const staff = { ...s, roomId: s.roomId }
  touchStaff(staff)
  return staff
}
