import { currentStaff } from '@/server/guards'
import { ok, parseBody, route } from '@/server/http'
import { toPublic } from '@/server/room/domain'
import { getRoom } from '@/server/room/service'
import { StaffLoginBody } from '@/server/schemas'
import { clearStaffCookie, newSid, setStaffCookie } from '@/server/session'
import { latestRoomId, teamLogin } from '@/server/team/service'

const roomOf = (roomId: string | null) => (roomId ? toPublic(getRoom(roomId)) : null)

export const GET = route(async () => ok({ room: roomOf((await currentStaff()).roomId) }))

// เข้าด้วยรหัสทีมงาน แล้วเปิดห้องล่าสุดของทีมให้
export const POST = route(async (req) => {
  const { staffCode } = await parseBody(req, StaffLoginBody)
  const teamId = teamLogin(staffCode)
  const roomId = latestRoomId(teamId)
  await setStaffCookie({ teamId, roomId, sid: newSid() })
  return ok({ room: roomOf(roomId) })
})

export const DELETE = route(async () => {
  await clearStaffCookie()
  return ok(null)
})
