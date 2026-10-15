import { currentStaff } from '@/server/guards'
import { ok, route } from '@/server/http'
import { toPublic } from '@/server/room/domain'
import { newSid, setStaffCookie } from '@/server/session'
import { teamRoom } from '@/server/team/service'

// สลับไปห้องอื่นของทีม ไม่ต้องใส่รหัสซ้ำ
export const POST = route(async (_req, ctx: RouteContext<'/api/staff/rooms/[code]/switch'>) => {
  const s = await currentStaff()
  const room = teamRoom(s.teamId, (await ctx.params).code)
  await setStaffCookie({ teamId: s.teamId, roomId: room.id, sid: newSid() })
  return ok({ room: toPublic(room) })
})
