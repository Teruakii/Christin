import { currentStaff } from '@/server/guards'
import { ok, parseBody, route } from '@/server/http'
import { createRoom } from '@/server/room/service'
import { RoomBody } from '@/server/schemas'
import { newSid, setStaffCookie } from '@/server/session'
import { listTeamRooms } from '@/server/team/service'

export const GET = route(async () => {
  const s = await currentStaff()
  return ok(listTeamRooms(s.teamId, s.roomId))
})

// ห้องใหม่เป็นของทีมที่เข้าอยู่ แล้วสลับไปห้องใหม่ให้
export const POST = route(async (req) => {
  const s = await currentStaff()
  const { roomId, roomCode } = createRoom(await parseBody(req, RoomBody), s.teamId)
  await setStaffCookie({ teamId: s.teamId, roomId, sid: newSid() })
  return ok({ roomCode }, { status: 201 })
})
