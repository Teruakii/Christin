import { ok, route } from '@/server/http'
import { newSid, setStaffCookie } from '@/server/session'
import { createTeam } from '@/server/team/service'

// สร้างทีมใหม่ ได้รหัสทีมงานครั้งเดียว (เก็บแค่ hash) แล้วเข้าระบบทีมงานเลย ยังไม่มีห้อง
export const POST = route(async () => {
  const { teamId, staffCode } = createTeam()
  await setStaffCookie({ teamId, roomId: null, sid: newSid() })
  return ok({ staffCode }, { status: 201 })
})
