import { currentStaff } from '@/server/guards'
import { ok, route } from '@/server/http'
import { toPublic } from '@/server/room/domain'
import { deleteRoom, getRoom } from '@/server/room/service'
import { newSid, setStaffCookie } from '@/server/session'
import { latestRoomId, teamRoom } from '@/server/team/service'

// ลบห้องของทีม · ตอบว่าตอนนี้อยู่ห้องไหน (null = ทีมไม่เหลือห้อง ยังอยู่ในระบบทีมงาน)
export const DELETE = route(async (_req, ctx: RouteContext<'/api/staff/rooms/[code]'>) => {
  const s = await currentStaff()
  const room = teamRoom(s.teamId, (await ctx.params).code)
  deleteRoom(room.id)
  const roomId = room.id === s.roomId ? latestRoomId(s.teamId) : s.roomId
  if (room.id === s.roomId) await setStaffCookie({ teamId: s.teamId, roomId, sid: newSid() })
  return ok({ current: roomId ? toPublic(getRoom(roomId)) : null })
})
